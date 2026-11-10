#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
换一圈 · 真实界面截图

用 CDP 驱动无头 Edge：先探测量接口把数据准备好，再在浏览器里登录、逐页截图。
截出来的是真正跑起来的界面，不是设计稿。

用法：python scripts/shots.py [输出目录]
前提：服务已在 http://localhost:8080 启动，数据库已导入。
"""

import atexit
import base64
import json
import os
import shutil
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from http.cookiejar import CookieJar

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
PORT = 9333
BASE = "http://localhost:8080"
OUT = sys.argv[1] if len(sys.argv) > 1 else "docs/screens"


# ----------------------------------------------------------------- HTTP 客户端
class Api:
    def __init__(self, tag):
        self.tag = tag
        self.jar = CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def call(self, method, path, body=None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(BASE + path, data=data, method=method,
                                     headers={"Content-Type": "application/json"})
        try:
            with self.opener.open(req, timeout=15) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            return json.loads(e.read().decode("utf-8"))

    def ok(self, method, path, body=None):
        d = self.call(method, path, body)
        if d.get("code") != 0:
            print("  ✗", self.tag, path, d.get("msg"))
        return d.get("data")


# ----------------------------------------------------------------- CDP 封装
class CDP:
    def __init__(self, ws_url):
        import websocket
        self.ws = websocket.create_connection(ws_url, timeout=30)
        self.seq = 0
        self.session = None

    def send(self, method, params=None):
        self.seq += 1
        msg = {"id": self.seq, "method": method, "params": params or {}}
        if self.session:
            msg["sessionId"] = self.session
        self.ws.send(json.dumps(msg))
        while True:
            resp = json.loads(self.ws.recv())
            if resp.get("id") == self.seq:
                if "error" in resp:
                    raise RuntimeError(method + " → " + json.dumps(resp["error"], ensure_ascii=False))
                return resp.get("result", {})

    def js(self, expr, wait=False):
        r = self.send("Runtime.evaluate",
                      {"expression": expr, "awaitPromise": wait, "returnByValue": True})
        return r.get("result", {}).get("value")

    def goto(self, url, wait=1.2):
        self.send("Page.navigate", {"url": url})
        time.sleep(wait)

    def shot(self, path):
        data = self.send("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
        with open(path, "wb") as f:
            f.write(base64.b64decode(data["data"]))
        print("  · 已截图", os.path.basename(path))


def wait_for(fn, timeout=12, interval=0.3):
    end = time.time() + timeout
    while time.time() < end:
        try:
            if fn():
                return True
        except Exception:
            pass
        time.sleep(interval)
    return False


def main():
    if not os.path.isdir(OUT):
        os.makedirs(OUT)

    print("1) 准备数据")
    admin = Api("admin")
    admin.ok("POST", "/api/user/login", {"studentNo": "admin", "password": "admin123"})
    seeded = admin.ok("POST", "/api/admin/demo/reset")
    ids = seeded["itemIds"]
    print("  演示数据已重置，物品 id =", ids)
    # 取第二个物品的主人，用来截「他人主页」
    other_id = admin.ok("GET", "/api/item/%d" % ids[1])["item"]["ownerId"]

    print("2) 启动无头浏览器")
    profile = tempfile.mkdtemp(prefix="hyq-edge-")
    # 放系统临时目录，进程退出就删，别堆在项目里（一份 Edge 配置能有 480MB）
    atexit.register(lambda p=profile: shutil.rmtree(p, ignore_errors=True))
    # 每次用干净的用户目录，否则 Edge 会恢复上次的窗口尺寸，截图宽高就对不上
    shutil.rmtree(profile, ignore_errors=True)
    proc = subprocess.Popen([
        EDGE, "--headless=new", "--disable-gpu", "--hide-scrollbars",
        "--no-first-run", "--no-default-browser-check",
        "--force-device-scale-factor=2", "--window-size=390,844",
        "--remote-debugging-port=" + str(PORT),
        "--user-data-dir=" + profile,
        "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    try:
        ws_url = None

        def probe():
            nonlocal ws_url
            with urllib.request.urlopen("http://127.0.0.1:%d/json/version" % PORT, timeout=1) as r:
                ws_url = json.loads(r.read().decode())["webSocketDebuggerUrl"]
                return True

        if not wait_for(probe, 20):
            print("  ✗ 浏览器没起来")
            return
        cdp = CDP(ws_url)
        target = cdp.send("Target.createTarget", {"url": "about:blank"})["targetId"]
        cdp.session = cdp.send("Target.attachToTarget",
                               {"targetId": target, "flatten": True})["sessionId"]
        cdp.send("Page.enable")
        cdp.send("Runtime.enable")
        # 用 CDP 强制视口，--window-size 在无头模式下会被系统最小窗口宽改写
        cdp.send("Emulation.setDeviceMetricsOverride",
                 {"width": 390, "height": 844, "deviceScaleFactor": 2, "mobile": True})
        cdp.send("Emulation.setTouchEmulationEnabled", {"enabled": True})
        # 用 CDP 强制视口，--window-size 在无头模式下会被系统最小窗口宽改写
        cdp.send("Emulation.setDeviceMetricsOverride",
                 {"width": 390, "height": 844, "deviceScaleFactor": 2, "mobile": True})
        cdp.send("Emulation.setTouchEmulationEnabled", {"enabled": True})

        print("3) 登录（小林）并逐页截图")
        cdp.goto(BASE, 1.6)
        cdp.shot(os.path.join(OUT, "00-登录.png"))
        cdp.js("""fetch('/api/user/login',{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({studentNo:'2021210001',password:'123456'})}).then(r=>r.json())""", wait=True)
        cdp.goto(BASE, 1.5)

        pages = [
            ("#/home", "01-集市.png"),
            ("#/item/" + str(ids[0]), "02-物品详情.png"),
            ("#/cycle/" + str(ids[0]), "03-三方环.png"),
            ("#/me", "04-我的.png"),
            ("#/user/" + str(other_id), "10-他人主页.png"),
            ("#/publish", "08-发布.png"),
            ("#/offers", "09-报价.png"),
        ]
        for hash_, name in pages:
            cdp.js("location.hash='%s'" % hash_)
            time.sleep(1.4)
            cdp.shot(os.path.join(OUT, name))

        print("4) 成环 + 三方确认")
        rings = cdp.js("fetch('/api/cycle/%d').then(r=>r.json())" % ids[0], wait=True)["data"]
        chosen = rings[0]["itemIds"]
        created = cdp.js("""fetch('/api/cycle/%d/create',{method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({itemIds:%s})}).then(r=>r.json())""" % (ids[0], json.dumps(chosen)),
            wait=True)["data"]
        ex = created["exchangeId"]
        cdp.js("""fetch('/api/exchange/%d/confirm',{method:'POST'}).then(r=>r.json())""" % ex, wait=True)

        for no in ("2021210002", "2021210003"):
            c = Api(no)
            c.ok("POST", "/api/user/login", {"studentNo": no, "password": "123456"})
            c.ok("POST", "/api/exchange/%d/confirm" % ex)

        # 约个面交点，截图里才有那条信息
        cdp.js("""fetch('/api/exchange/%d/place',{method:'PUT',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({place:'紫荆 5 号楼楼下快递点',dealTime:'今日 18:00-19:00'})})
            .then(r=>r.json())""" % ex, wait=True)

        cdp.js("location.hash='#/exchange/%d'" % ex)
        time.sleep(1.5)
        cdp.shot(os.path.join(OUT, "05-交换单待交付.png"))

        print("5) 三方交付 + 互评")
        cdp.js("""fetch('/api/exchange/%d/done',{method:'POST'}).then(r=>r.json())""" % ex, wait=True)
        for no in ("2021210002", "2021210003"):
            c = Api(no)
            c.ok("POST", "/api/user/login", {"studentNo": no, "password": "123456"})
            c.ok("POST", "/api/exchange/%d/done" % ex)

        detail = cdp.js("fetch('/api/exchange/%d').then(r=>r.json())" % ex, wait=True)["data"]
        others = [d for d in detail["details"] if d["userId"] != detail["mine"]["userId"]]
        cdp.js("""fetch('/api/review',{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({exchangeId:%d,targetUserId:%d,score:5,content:'守时，描述和实物一致'})})
            .then(r=>r.json())""" % (ex, others[0]["userId"]), wait=True)

        cdp.js("location.reload()")
        time.sleep(1.2)
        cdp.js("location.hash='#/exchange/%d'" % ex)
        time.sleep(1.4)
        cdp.shot(os.path.join(OUT, "06-交换单已完成.png"))

        print("6) 换成管理员，截后台看板")
        cdp.js("""fetch('/api/user/login',{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({studentNo:'admin',password:'admin123'})}).then(r=>r.json())""", wait=True)
        cdp.goto(BASE, 1.3)
        cdp.js("location.hash='#/admin'")
        time.sleep(1.4)
        cdp.js("document.querySelector('[data-act=admin-tab][data-v=dashboard]').click()")
        time.sleep(1.2)
        cdp.shot(os.path.join(OUT, "07-后台看板.png"))

        print("完成，截图在", os.path.abspath(OUT))
    finally:
        proc.terminate()


if __name__ == "__main__":
    main()
