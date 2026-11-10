#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
两个验证：
1) 密码输错时，错误显示在卡片里（不是一屏 toast）
2) 登录后清空浏览器所有 Cookie，再点标签，接口仍然 200（说明凭证走请求头，不依赖 Cookie）

用法：python scripts/verify_auth.py
"""

import atexit
import base64
import json
import os
import shutil
import subprocess
import tempfile
import time
import urllib.request

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
PORT = 9337
BASE = "http://localhost:8080"
OUT = "docs/screens"


class CDP:
    def __init__(self, ws_url):
        import websocket
        self.ws = websocket.create_connection(ws_url, timeout=30)
        self.seq = 0
        self.session = None
        self.events = []

    def send(self, method, params=None):
        self.seq += 1
        msg = {"id": self.seq, "method": method, "params": params or {}}
        if self.session:
            msg["sessionId"] = self.session
        self.ws.send(json.dumps(msg))
        while True:
            m = json.loads(self.ws.recv())
            if m.get("id") == self.seq:
                if "error" in m:
                    raise RuntimeError(json.dumps(m["error"], ensure_ascii=False))
                return m.get("result", {})
            if "method" in m:
                self.events.append(m)

    def js(self, expr, wait=False):
        r = self.send("Runtime.evaluate",
                      {"expression": expr, "awaitPromise": wait, "returnByValue": True})
        if r.get("exceptionDetails"):
            return "JS异常:" + str(r["exceptionDetails"].get("text"))
        return r.get("result", {}).get("value")

    def goto(self, url, wait=1.6):
        self.send("Page.navigate", {"url": url})
        time.sleep(wait)

    def shot(self, path):
        d = self.send("Page.captureScreenshot", {"format": "png"})
        with open(path, "wb") as f:
            f.write(base64.b64decode(d["data"]))


def login(cdp, pwd):
    cdp.js("""(function(p){
        const f = document.querySelector('form[data-form=login]');
        if (!f) return 'no-form';
        f.querySelector('input[name=studentNo]').value = '2021210001';
        f.querySelector('input[name=password]').value = p;
        f.querySelector('button[type=submit]').click();
        return 'clicked';
    })('%s')""" % pwd)


def main():
    profile = tempfile.mkdtemp(prefix="hyq-edge-")
    # 放系统临时目录，进程退出就删，别堆在项目里（一份 Edge 配置能有 480MB）
    atexit.register(lambda p=profile: shutil.rmtree(p, ignore_errors=True))
    subprocess.Popen([EDGE, "--headless=new", "--disable-gpu", "--no-first-run",
                      "--remote-debugging-port=" + str(PORT), "--user-data-dir=" + profile,
                      "about:blank"],
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    ws = None
    end = time.time() + 20
    while time.time() < end and not ws:
        try:
            with urllib.request.urlopen("http://127.0.0.1:%d/json/version" % PORT, timeout=1) as r:
                ws = json.loads(r.read().decode())["webSocketDebuggerUrl"]
        except Exception:
            time.sleep(0.4)

    cdp = CDP(ws)
    t = cdp.send("Target.createTarget", {"url": "about:blank"})["targetId"]
    cdp.session = cdp.send("Target.attachToTarget", {"targetId": t, "flatten": True})["sessionId"]
    cdp.send("Page.enable")
    cdp.send("Runtime.enable")
    cdp.send("Network.enable")
    cdp.send("Emulation.setDeviceMetricsOverride",
             {"width": 390, "height": 844, "deviceScaleFactor": 2, "mobile": True})

    print("① 先输错密码，看错误显示在哪")
    cdp.goto(BASE, 2.0)
    print("   在登录页：", "是" if cdp.js("!!document.querySelector('.auth-card')") else "否")
    login(cdp, "wrong-password")
    time.sleep(1.6)
    print("   卡片内错误框：", cdp.js("document.querySelector('#form-error')?.classList.contains('show')"))
    print("   错误文案：", cdp.js("document.querySelector('#form-error')?.textContent"))
    print("   toast 数量：", cdp.js("document.querySelectorAll('.toast').length"))
    os.makedirs(OUT, exist_ok=True)
    cdp.shot(os.path.join(OUT, "_login_error.png"))

    print("\n② 用正确密码登录")
    cdp.events.clear()
    login(cdp, "123456")
    time.sleep(2.0)
    print("   当前 hash：", cdp.js("location.hash"))
    print("   在登录页：", "是" if cdp.js("!!document.querySelector('.auth-card')") else "否")
    print("   localStorage 里有凭证：", "是" if cdp.js("!!localStorage.getItem('hq.token')") else "否")

    print("\n③ 清空浏览器全部 Cookie（模拟 Cookie 被拦），再点标签")
    cdp.send("Network.clearBrowserCookies")
    cdp.send("Network.clearBrowserCache")
    print("   已清空 cookie，剩余 cookie：", cdp.js("document.cookie || '(空)'"))

    for label, sel in [("我的", "#/me"), ("报价", "#/offers"), ("交换", "#/exchange")]:
        cdp.events.clear()
        cdp.js("document.querySelector('.tabbar [data-to=\"%s\"]').click()" % sel)
        time.sleep(1.6)
        codes = []
        for e in cdp.events:
            if e.get("method") == "Network.responseReceived":
                p = e["params"]["response"]
                if "/api/" in p["url"]:
                    codes.append(str(p["status"]))
        print("   ► %s：hash=%s 登录页=%s 状态=[%s]" % (
            label, cdp.js("location.hash"),
            "是" if cdp.js("!!document.querySelector('.auth-card')") else "否",
            ",".join(codes) or "无"))

    cdp.shot(os.path.join(OUT, "_auth_ok.png"))
    print("\n截图：docs/screens/_login_error.png、_auth_ok.png")


if __name__ == "__main__":
    main()
