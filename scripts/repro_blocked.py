#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
复现「点任何页面都跳登录」。

和 repro_publish 的区别：这次走**真实表单登录**（在输入框打字、点登录按钮），
然后**真点底部标签**，逐个记录 /api 响应。用户遇到的路径就是这样。

用法：python scripts/repro_session.py
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
PORT = 9336
BASE = "http://localhost:8080"


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

    def goto(self, url, wait=1.4):
        self.send("Page.navigate", {"url": url})
        time.sleep(wait)

    def shot(self, path):
        d = self.send("Page.captureScreenshot", {"format": "png"})
        with open(path, "wb") as f:
            f.write(base64.b64decode(d["data"]))


def wait_ws(timeout=20):
    end = time.time() + timeout
    while time.time() < end:
        try:
            with urllib.request.urlopen("http://127.0.0.1:%d/json/version" % PORT, timeout=1) as r:
                return json.loads(r.read().decode())["webSocketDebuggerUrl"]
        except Exception:
            time.sleep(0.4)
    return None


def drain(cdp, label):
    print("   — %s 期间的 /api 请求：" % label)
    hit = False
    for e in cdp.events:
        if e.get("method") != "Network.responseReceived":
            continue
        p = e["params"]["response"]
        if "/api/" not in p["url"]:
            continue
        hit = True
        mark = "  " if p["status"] == 200 else "!!"
        print("   %s %-6s %s" % (mark, p["status"], p["url"].replace(BASE, "")))
    if not hit:
        print("     （没有请求）")
    cdp.events.clear()


def main():
    profile = tempfile.mkdtemp(prefix="hyq-edge-")
    # 放系统临时目录，进程退出就删，别堆在项目里（一份 Edge 配置能有 480MB）
    atexit.register(lambda p=profile: shutil.rmtree(p, ignore_errors=True))
    subprocess.Popen([
        EDGE, "--headless=new", "--disable-gpu", "--no-first-run",
        "--remote-debugging-port=" + str(PORT), "--user-data-dir=" + profile,
        "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    ws = wait_ws()
    cdp = CDP(ws)
    t = cdp.send("Target.createTarget", {"url": "about:blank"})["targetId"]
    cdp.session = cdp.send("Target.attachToTarget", {"targetId": t, "flatten": True})["sessionId"]
    cdp.send("Page.enable")
    # 只让写入失败，模拟浏览器禁止站点存储
    cdp.send("Page.addScriptToEvaluateOnNewDocument", {"source":
        "try{Storage.prototype.setItem=function(){throw new Error('blocked');};}catch(e){}"})
    cdp.send("Runtime.enable")
    cdp.send("Network.enable")
    cdp.send("Emulation.setDeviceMetricsOverride",
             {"width": 390, "height": 844, "deviceScaleFactor": 2, "mobile": True})

    print("① 打开首页（全新浏览器，无任何 cookie）")
    cdp.goto(BASE, 1.8)
    print("   当前 hash：", cdp.js("location.hash"))
    print("   在登录页：", "是" if cdp.js("!!document.querySelector('.auth-card')") else "否")
    print("   浏览器 cookie：", cdp.js("document.cookie || '(空)'"))

    print("\n② 在输入框里打字，点登录按钮")
    cdp.events.clear()
    cdp.js("""(function(){
        const form = document.querySelector('form[data-form=login]');
        const no = form.querySelector('input[name=studentNo]');
        const pwd = form.querySelector('input[name=password]');
        no.value='2021210001'; no.dispatchEvent(new Event('input',{bubbles:true}));
        pwd.value='123456'; pwd.dispatchEvent(new Event('input',{bubbles:true}));
        form.querySelector('button[type=submit]').click();
    })()""")
    time.sleep(2.2)
    print("   当前 hash：", cdp.js("location.hash"))
    print("   在登录页：", "是" if cdp.js("!!document.querySelector('.auth-card')") else "否")
    print("   页面标题区：", cdp.js("document.querySelector('.hero-title')?.textContent || '(无)'"))
    drain(cdp, "登录")

    print("\n③ 依次点底部标签")
    for label, sel in [("我的", "#/me"), ("报价", "#/offers"), ("交换", "#/exchange"), ("集市", "#/home")]:
        print("\n   ► 点「%s」" % label)
        cdp.events.clear()
        cdp.js("document.querySelector('.tabbar [data-to=\"%s\"]').click()" % sel)
        time.sleep(1.8)
        print("     当前 hash：", cdp.js("location.hash"))
        print("     在登录页：", "是" if cdp.js("!!document.querySelector('.auth-card')") else "否")
        drain(cdp, label)

    print("\n④ 直接刷新页面（模拟用户 F5）")
    cdp.events.clear()
    cdp.goto(BASE, 2.0)
    print("   当前 hash：", cdp.js("location.hash"))
    print("   在登录页：", "是" if cdp.js("!!document.querySelector('.auth-card')") else "否")
    drain(cdp, "刷新")

    os.makedirs("docs/screens", exist_ok=True)
    cdp.shot("docs/screens/_session.png")
    print("\n截图：docs/screens/_session.png")


if __name__ == "__main__":
    main()
