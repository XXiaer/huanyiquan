#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
复现「发布以后要求重新登录」的问题。

走真实界面路径：登录 → 进发布页 → 填表 → 点发布，
同时抓 /api/* 的网络响应与控制台报错，最后打印结论。

用法：python scripts/repro_publish.py
"""

import atexit
import base64
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
PORT = 9334
BASE = "http://localhost:8080"
OUT = "docs/screens"


class CDP:
    def __init__(self, ws_url):
        import websocket
        self.ws = websocket.create_connection(ws_url, timeout=30)
        self.seq = 0
        self.session = None
        self.events = []

    def _read_until(self, want_id):
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == want_id:
                if "error" in msg:
                    raise RuntimeError(json.dumps(msg["error"], ensure_ascii=False))
                return msg.get("result", {})
            if "method" in msg:
                self.events.append(msg)

    def send(self, method, params=None):
        self.seq += 1
        msg = {"id": self.seq, "method": method, "params": params or {}}
        if self.session:
            msg["sessionId"] = self.session
        self.ws.send(json.dumps(msg))
        return self._read_until(self.seq)

    def js(self, expr, wait=False):
        r = self.send("Runtime.evaluate",
                      {"expression": expr, "awaitPromise": wait, "returnByValue": True})
        if r.get("exceptionDetails"):
            return "JS异常: " + json.dumps(r["exceptionDetails"], ensure_ascii=False)[:300]
        return r.get("result", {}).get("value")

    def goto(self, url, wait=1.3):
        self.send("Page.navigate", {"url": url})
        time.sleep(wait)

    def shot(self, path):
        data = self.send("Page.captureScreenshot", {"format": "png"})
        with open(path, "wb") as f:
            f.write(base64.b64decode(data["data"]))


def wait_ws(timeout=20):
    url = "http://127.0.0.1:%d/json/version" % PORT
    end = time.time() + timeout
    while time.time() < end:
        try:
            with urllib.request.urlopen(url, timeout=1) as r:
                return json.loads(r.read().decode())["webSocketDebuggerUrl"]
        except Exception:
            time.sleep(0.4)
    return None


def main():
    ws = wait_ws(0)
    if not ws:
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
    target = cdp.send("Target.createTarget", {"url": "about:blank"})["targetId"]
    cdp.session = cdp.send("Target.attachToTarget",
                           {"targetId": target, "flatten": True})["sessionId"]
    cdp.send("Page.enable")
    cdp.send("Runtime.enable")
    cdp.send("Network.enable")
    cdp.send("Emulation.setDeviceMetricsOverride",
             {"width": 390, "height": 844, "deviceScaleFactor": 2, "mobile": True})

    print("① 打开首页并登录（2021210001 / 123456）")
    cdp.goto(BASE)
    login = cdp.js("""fetch('/api/user/login',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({studentNo:'2021210001',password:'123456'})}).then(r=>r.text())""", wait=True)
    print("   login →", str(login)[:120])
    cdp.goto(BASE, 1.6)
    print("   首页是否已登录：", "是" if cdp.js("!!document.querySelector('.hero-card')") else "否")

    print("② 进入发布页并填表")
    cdp.js("location.hash='#/publish'")
    time.sleep(1.2)
    cdp.js("""(function(){
        const t=document.querySelector('input[name=title]');
        t.value='复现测试键盘'; t.dispatchEvent(new Event('input',{bubbles:true}));
        const d=document.querySelector('textarea[name=description]');
        d.value='用来复现发布后掉登录的问题'; d.dispatchEvent(new Event('input',{bubbles:true}));
        document.querySelectorAll('#cat-chips .chip')[2].click();
        document.querySelectorAll('#cond-chips .chip')[1].click();
        document.querySelectorAll('#want-chips .chip')[2].click();
    })()""")
    time.sleep(0.3)
    print("   标题：", cdp.js("document.querySelector('input[name=title]').value"))
    print("   已选类别：", cdp.js("document.querySelector('#cat-chips .chip.on')?.textContent"))
    print("   已选成色：", cdp.js("document.querySelector('#cond-chips .chip.on')?.textContent"))
    print("   已选想换：", cdp.js("document.querySelector('#want-chips .chip.on')?.textContent"))

    print("③ 点发布，观察网络与跳转")
    cdp.events.clear()
    cdp.js("document.querySelector('form[data-form=publish] button[type=submit]').click()")
    time.sleep(2.2)

    print("   当前 hash：", cdp.js("location.hash"))
    print("   是否回到登录页：", "是" if cdp.js("!!document.querySelector('.auth-card')") else "否")
    print("   toast：", cdp.js("document.querySelector('.toast')?.textContent"))

    print("\n   /api 网络记录：")
    for e in cdp.events:
        if e.get("method") != "Network.responseReceived":
            continue
        p = e["params"]["response"]
        if "/api/" not in p["url"]:
            continue
        print("     %-6s %-40s %s" % (p["status"], p["url"].replace(BASE, ""),
                                     p.get("mimeType", "")))

    console = [e for e in cdp.events if e.get("method") == "Runtime.exceptionThrown"]
    if console:
        print("\n   控制台异常：")
        for e in console:
            d = e["params"]["exceptionDetails"]
            print("     ", d.get("text"), str(d.get("exception", {}).get("description", ""))[:200])

    os.makedirs(OUT, exist_ok=True)
    cdp.shot(os.path.join(OUT, "_repro.png"))
    print("\n   截图：docs/screens/_repro.png")


if __name__ == "__main__":
    main()
