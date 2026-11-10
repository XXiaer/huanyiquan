#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
换一圈 · 三端连通性体检

一条命令看清「前端 / 后端 / 数据库」哪一层断了：
  python scripts/health.py
  python scripts/health.py http://localhost:8080

只读，不写任何数据。
"""

import json
import socket
import sys
import urllib.error
import urllib.request

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080").rstrip("/")
OK, NO = "  [OK]", "  [X]"


def req(method, path, body=None, token=None, timeout=8):
    h = {"Content-Type": "application/json"}
    if token:
        h["X-Token"] = token
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as res:
            return res.status, res.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:
        return 0, str(e).encode()


def port_open(host, port):
    try:
        s = socket.create_connection((host, port), timeout=2)
        s.close()
        return True
    except Exception:
        return False


def main():
    problems = []
    print()
    print("换一圈 · 三端体检")
    print("=" * 58)

    # ---------------------------------------------------------------- 1 数据库
    print("\n1. 数据库（MySQL）")
    if port_open("127.0.0.1", 3306):
        print(OK, "3306 端口在监听")
    else:
        print(NO, "3306 没起来，先启动 MySQL 服务")
        problems.append("MySQL 未启动")

    # ---------------------------------------------------------------- 2 后端
    print("\n2. 后端（8080）")
    if port_open("127.0.0.1", 8080):
        print(OK, "8080 端口在监听")
    else:
        print(NO, "后端没起来，双击 start.bat 或 mvn exec:java")
        problems.append("后端未启动")
        summary(problems)
        return

    # 数据库连通性用一次真实查询验证（比看端口更准）
    code, raw = req("GET", "/api/item/list?page=1&size=1")
    if code == 200:
        try:
            total = json.loads(raw.decode())["data"]["total"]
            print(OK, "接口能读到数据库，在架 %d 件" % total)
        except Exception:
            print(NO, "接口返回了但数据格式不对")
            problems.append("接口数据异常")
    else:
        print(NO, "公开接口返回 %s —— 多半是数据库连不上，检查 db.properties" % code)
        problems.append("接口不可用")

    # ---------------------------------------------------------------- 3 前端
    print("\n3. 前端（静态页面）")
    for path, must in (("/", "换一圈"), ("/app.css", "hero-card"),
                       ("/app.js", "renderHome"), ("/design.html", "设计规范")):
        code, raw = req("GET", path)
        text = raw.decode("utf-8", "ignore")
        if code == 200 and must in text:
            print(OK, "%-14s 200" % path)
        else:
            print(NO, "%-14s %s，内容%s" % (path, code, "不完整" if code == 200 else "取不到"))
            problems.append("静态资源 " + path)

    # ---------------------------------------------------------------- 4 登录
    print("\n4. 登录与鉴权")
    code, raw = req("POST", "/api/user/login", {"studentNo": "2021210001", "password": "123456"})
    if code != 200:
        print(NO, "演示账号登录失败：", raw.decode("utf-8", "ignore")[:80])
        problems.append("登录不可用")
    else:
        d = json.loads(raw.decode())
        token = (d.get("data") or {}).get("token") or ""
        print(OK, "登录成功：%s，凭证%s" % (d["data"]["nickname"], "已下发" if token else "缺失"))
        code, raw = req("GET", "/api/user/me", token=token)
        if code == 200:
            me = json.loads(raw.decode())["data"]
            print(OK, "凭证鉴权通过：信用 %s，在架 %s 件" % (me["credit"], me.get("onShelfCount")))
        else:
            print(NO, "凭证鉴权失败：", code)
            problems.append("鉴权不可用")

        # ------------------------------------------------------------ 5 核心功能
        print("\n5. 核心功能（三方环）")
        code, raw = req("GET", "/api/item/mine?status=1", token=token)
        mine = json.loads(raw.decode()).get("data") or []
        hit = False
        for it in mine:
            c2, r2 = req("GET", "/api/cycle/%d" % it["id"], token=token)
            rings = (json.loads(r2.decode()).get("data") or []) if c2 == 200 else []
            if rings:
                print(OK, "「%s」找到 %d 组闭环" % (it["title"], len(rings)))
                print("     " + rings[0]["flow"])
                hit = True
                break
        if not hit:
            print("  [!] 当前没有可成的环（演示数据被换完了属于正常）")

    summary(problems)


def summary(problems):
    print()
    print("=" * 58)
    if problems:
        print("结论：有 %d 处需要处理 —— %s" % (len(problems), "、".join(problems)))
        print("逐层排查：MySQL → 后端 → 前端")
    else:
        print("结论：前端、后端、数据库三层全通，可以直接演示。")
        print("地址：%s" % BASE)
        print("账号：2021210001 / 123456（小林）｜admin / admin123（管理员）")
    print()


if __name__ == "__main__":
    main()
