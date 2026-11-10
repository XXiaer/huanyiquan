#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
验证「上架 / 下架」在真实界面上能用，而不是只在代码里存在。

两个入口都点一遍：
  1. 我的 → 我的物品 → 已下架 → 重新上架
  2. 物品详情 → 重新上架（主人视角）

用法：python scripts/verify_onshelf.py
前提：服务已在 http://localhost:8080 启动。
"""

import atexit
import base64
import json
import os
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from http.cookiejar import CookieJar

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
PORT = 9337
BASE = "http://localhost:8080"
OUT = "docs/screens"


class Api:
    def __init__(self):
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

    def js(self, expr):
        r = self.send("Runtime.evaluate",
                      {"expression": expr, "awaitPromise": True, "returnByValue": True})
        return r.get("result", {}).get("value")

    def goto(self, url, wait=1.6):
        self.send("Page.navigate", {"url": url})
        time.sleep(wait)

    def shot(self, path):
        data = self.send("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
        with open(path, "wb") as f:
            f.write(base64.b64decode(data["data"]))
        print("    · 截图", os.path.basename(path))


def wait_for(fn, timeout=15, interval=0.3):
    end = time.time() + timeout
    while time.time() < end:
        try:
            if fn():
                return True
        except Exception:
            pass
        time.sleep(interval)
    return False


def btn_of(text):
    """在页面里找到指定文字的操作按钮并点击，返回它的 data-id"""
    return """(function(){
        var bs = document.querySelectorAll('[data-act=toggle-item]');
        for (var i = 0; i < bs.length; i++) {
            if (bs[i].textContent.indexOf('%s') >= 0) { bs[i].click(); return bs[i].dataset.id; }
        }
        return '';
    })()""" % text


def main():
    if not os.path.isdir(OUT):
        os.makedirs(OUT)

    api = Api()
    login = api.call("POST", "/api/user/login", {"studentNo": "2021210001", "password": "123456"})
    token = (login.get("data") or {}).get("token", "")
    mine = api.call("GET", "/api/item/mine")["data"]
    on_shelf = [i for i in mine if i["status"] == 1]
    if not on_shelf:
        print("✗ 小林的物品都在架外，先跑一次 scripts/shots.py 重置数据")
        return
    item = on_shelf[0]
    iid = item["id"]
    print("① 目标物品：%s（id=%s，当前 %s）" % (item["title"], iid, item["statusText"]))

    print("② 先把物品下架，制造一个「已下架」的状态")
    api.call("PUT", "/api/item/%d" % iid, {"status": 4})
    st = api.call("GET", "/api/item/%d" % iid)["data"]["item"]["statusText"]
    print("   状态 →", st)

    profile = tempfile.mkdtemp(prefix="hyq-edge-")
    # 放系统临时目录，进程退出就删，别堆在项目里（一份 Edge 配置能有 480MB）
    atexit.register(lambda p=profile: shutil.rmtree(p, ignore_errors=True))
    proc = subprocess.Popen([
        EDGE, "--headless=new", "--disable-gpu", "--hide-scrollbars",
        "--no-first-run", "--no-default-browser-check",
        "--force-device-scale-factor=2", "--window-size=390,844",
        "--remote-debugging-port=" + str(PORT),
        "--user-data-dir=" + profile,
        "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    ok = True
    try:
        ws_url = {}

        def probe():
            with urllib.request.urlopen("http://127.0.0.1:%d/json/version" % PORT, timeout=1) as r:
                ws_url["v"] = json.loads(r.read().decode())["webSocketDebuggerUrl"]
                return True

        if not wait_for(probe, 20):
            print("✗ 浏览器没起来")
            return
        cdp = CDP(ws_url["v"])
        # 先建一个标签页并附着上去，Page / Runtime 这些域只在页面会话里可用
        target = cdp.send("Target.createTarget", {"url": "about:blank"})["targetId"]
        cdp.session = cdp.send("Target.attachToTarget",
                               {"targetId": target, "flatten": True})["sessionId"]
        cdp.send("Page.enable")
        cdp.send("Runtime.enable")
        cdp.send("Emulation.setDeviceMetricsOverride",
                 {"width": 390, "height": 844, "deviceScaleFactor": 2, "mobile": True})

        # 用真实的 localStorage 凭证进入，模拟用户刷新后的状态
        cdp.goto(BASE)
        cdp.js("localStorage.setItem('hq.token', '%s')" % token)

        print("③ 入口一：「我的 → 我的物品」里的重新上架")
        cdp.goto(BASE + "/#/me", 2.2)
        cdp.js("location.hash='#/me'")
        time.sleep(1.2)
        text = cdp.js("document.body.innerText") or ""
        has = "重新上架" in text
        print("   页面上出现「重新上架」：", "是" if has else "否")
        ok = ok and has
        cdp.shot(os.path.join(OUT, "_onshelf-me.png"))

        hit = cdp.js(btn_of("重新上架"))
        print("   点击按钮 data-id =", hit or "(没找到)")
        time.sleep(2.0)
        st = api.call("GET", "/api/item/%d" % iid)["data"]["item"]["statusText"]
        print("   点击后状态 →", st, "（应为 在架）")
        ok = ok and st == "在架"

        print("④ 入口二：物品详情页的重新上架")
        api.call("PUT", "/api/item/%d" % iid, {"status": 4})
        cdp.js("location.hash='#/item/%d'" % iid)
        time.sleep(1.8)
        text = cdp.js("document.body.innerText") or ""
        has = "重新上架" in text
        print("   详情页出现「重新上架」：", "是" if has else "否")
        ok = ok and has
        cdp.shot(os.path.join(OUT, "_onshelf-detail.png"))

        hit = cdp.js(btn_of("重新上架"))
        print("   点击按钮 data-id =", hit or "(没找到)")
        time.sleep(2.0)
        st = api.call("GET", "/api/item/%d" % iid)["data"]["item"]["statusText"]
        print("   点击后状态 →", st, "（应为 在架）")
        ok = ok and st == "在架"

        print("⑤ 集市里能不能看到它")
        lst = api.call("GET", "/api/item/list?page=1&size=20")["data"]
        titles = [i["title"] for i in lst["list"]]
        seen = item["title"] in titles
        print("   在架 %d 件，包含「%s」：%s" % (lst["total"], item["title"], "是" if seen else "否"))
        ok = ok and seen
    finally:
        proc.terminate()
        shutil.rmtree(profile, ignore_errors=True)

    print("\n结论：", "两个入口都能正常上架" if ok else "有环节没过，看上面的输出")


if __name__ == "__main__":
    main()
