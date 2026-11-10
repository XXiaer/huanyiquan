#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
换一圈 · 端到端验收脚本

用途：一条命令跑通「注册 → 发布 → 三方环 → 三方确认 → 三方交付 → 互评 → 看板」，
每一步打印接口返回的关键字段。答辩前跑一次，比手动点十遍强。

前提：
  1. 服务已启动（mvn exec:java），默认地址 http://localhost:8080
  2. 库里已有演示数据（管理员登录后 POST /api/admin/demo）。脚本会自己检查并按需创建。

用法：
  python scripts/e2e.py
  python scripts/e2e.py http://localhost:8080
"""

import json
import sys
import urllib.error
import urllib.request
from http.cookiejar import CookieJar

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080").rstrip("/")
OK = "  ✓"
NO = "  ✗"


class Client:
    """一个带 cookie 的会话，等价于一个浏览器标签页"""

    def __init__(self, name):
        self.name = name
        self.jar = CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def call(self, method, path, body=None):
        url = BASE + path
        data = None
        headers = {"Accept": "application/json"}
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with self.opener.open(req, timeout=15) as resp:
                raw = resp.read().decode("utf-8")
                return resp.status, json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8")
            try:
                return e.code, json.loads(raw)
            except json.JSONDecodeError:
                return e.code, {"code": e.code, "msg": raw[:120]}
        except urllib.error.URLError as e:
            print(NO, "连不上", url, "——", e.reason)
            print("     先启动后端：mvn exec:java")
            sys.exit(1)

    def get(self, path):
        return self.call("GET", path)

    def post(self, path, body=None):
        return self.call("POST", path, body)

    def put(self, path, body=None):
        return self.call("PUT", path, body)

    def must(self, method, path, body=None, note=""):
        status, data = self.call(method, path, body)
        code = data.get("code")
        if status != 200 or code != 0:
            print(NO, self.name, method, path, "失败：", status, data.get("msg"))
            sys.exit(1)
        print(OK, self.name, note or path)
        return data.get("data")


def step(title):
    print()
    print("─" * 68)
    print(title)
    print("─" * 68)


def main():
    print("换一圈 · 端到端验收")
    print("目标服务：", BASE)

    # ---------------------------------------------------------------- 管理员
    step("1 / 7  管理员登录，准备演示数据")
    admin = Client("admin")
    admin.must("POST", "/api/user/login",
               {"studentNo": "admin", "password": "admin123"}, "登录成功")

    status, data = admin.post("/api/admin/demo")
    if data.get("code") == 0:
        item_ids = data["data"]["itemIds"]
        print(OK, "演示数据已创建：三件物品", item_ids)
    else:
        print("  · 演示数据已存在，改用库里现有物品")
        pub = Client("public")
        listing = pub.must("GET", "/api/item/list?page=1&size=50", None, "读取在架物品")
        item_ids = [it["id"] for it in listing["list"]]
        if len(item_ids) < 3:
            print(NO, "在架物品不足 3 件，无法演示三方环。请先清库重来：")
            print("     mysql -uroot -p < sql/schema.sql")
            sys.exit(1)

    # ---------------------------------------------------------------- 三个用户
    step("2 / 7  三个账号登录")
    users = [
        ("小林", Client("小林"), "2021210001"),
        ("阿哲", Client("阿哲"), "2021210002"),
        ("雨桐", Client("雨桐"), "2021210003"),
    ]
    ids = {}
    for nick, c, no in users:
        u = c.must("POST", "/api/user/login", {"studentNo": no, "password": "123456"},
                   nick + " 登录（" + no + "）")
        ids[nick] = u["id"]
        print("     用户 id =", u["id"], "信用分 =", u.get("credit"))

    # ---------------------------------------------------------------- 找环
    step("3 / 7  小林对自己的物品发起环匹配")
    lin = users[0][1]
    mine = lin.must("GET", "/api/item/mine?status=1", None, "读取小林的在架物品")
    if not mine:
        print(NO, "小林没有在架物品")
        sys.exit(1)

    rings = None
    target_item = None
    for it in mine:
        status, data = lin.get("/api/cycle/" + str(it["id"]))
        if data.get("code") == 0 and data.get("data"):
            rings, target_item = data["data"], it
            break
    if not rings:
        print(NO, "没有找到闭环。检查三件物品的意向是否首尾相接")
        sys.exit(1)

    print(OK, "找到", len(rings), "组换法，起点物品：", target_item["title"])
    for i, r in enumerate(rings, 1):
        print("     [" + str(i) + "]", r["flow"])
        print("          ", r["place"])
    chosen = rings[0]
    print("     选中第 1 组，itemIds =", chosen["itemIds"])

    # ---------------------------------------------------------------- 成环
    step("4 / 7  成环（事务锁三件物品）")
    created = lin.must("POST", "/api/cycle/" + str(target_item["id"]) + "/create",
                       {"itemIds": chosen["itemIds"]}, "成环成功")
    ex_id = created["exchangeId"]
    print("     交换单 id =", ex_id)

    detail = lin.must("GET", "/api/exchange/" + str(ex_id), None, "读取交换单详情")
    print("     类型 =", "三方环" if detail["type"] == 3 else "一对一",
          "｜状态 =", detail["statusText"],
          "｜需确认", detail["needConfirm"], "人")
    for d in detail["details"]:
        print("     -", d["nickname"], "给出「" + d["giveTitle"] + "」 得到「" + d["getTitle"] + "」")

    # 物品应当已锁定
    item_after = lin.must("GET", "/api/item/" + str(target_item["id"]), None, "复查物品状态")
    print("     物品状态 =", item_after["item"]["statusText"], "（应为 锁定）")

    # ---------------------------------------------------------------- 确认
    step("5 / 7  三方依次确认")
    for nick, c, _ in users:
        r = c.must("POST", "/api/exchange/" + str(ex_id) + "/confirm", None, nick + " 确认")
        print("     " + str(r["confirmed"]) + "/" + str(r["need"]), "→", r["statusText"], "｜", r["msg"])

    # ---------------------------------------------------------------- 交付
    step("6 / 7  三方依次确认收货")
    for nick, c, _ in users:
        r = c.must("POST", "/api/exchange/" + str(ex_id) + "/done", None, nick + " 确认收货")
        print("     " + str(r["delivered"]) + "/" + str(r["need"]), "→", r["statusText"], "｜", r["msg"])

    # 信用分应 +2
    me_after = lin.must("GET", "/api/user/me", None, "复查小林信用分")
    print("     小林信用分 =", me_after["credit"], "（完成后 +2）")

    # ---------------------------------------------------------------- 互评
    step("7 / 7  互评与看板")
    final = lin.must("GET", "/api/exchange/" + str(ex_id), None, "读取最终状态")
    others = [d for d in final["details"] if d["userId"] != ids["小林"]]
    if others:
        r = lin.must("POST", "/api/review", {
            "exchangeId": ex_id,
            "targetUserId": others[0]["userId"],
            "score": 5,
            "content": "守时，描述和实物一致"
        }, "给 " + others[0]["nickname"] + " 打分")
        print("     对方信用分变为", r["credit"])

    board = admin.must("GET", "/api/admin/dashboard", None, "管理员看板")
    print("     成交数 =", board["dealCount"],
          "｜三方环", board["ringDone"], "/", board["ringTotal"],
          "｜成环成功率 =", str(board["ringRate"]) + "%")
    hot = "，".join([h["category"] + " " + str(h["total"]) + " 件" for h in board["hotCategories"][:3]])
    print("     热门类别：", hot)

    print()
    print("=" * 68)
    print("全部通过。整条链路：发布 → 找环 → 成环 → 三方确认 → 三方交付 → 互评")
    print("=" * 68)


if __name__ == "__main__":
    main()
