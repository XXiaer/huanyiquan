# -*- coding: utf-8 -*-
"""Full-stack check for the search path: MySQL + semantic sidecar + Java app.

Verifies, against a throwaway database:
  1. the sidecar builds its index when MySQL is NOT on port 3306 (the old code
     hard-coded the port, so the index never became ready);
  2. /api/item/search returns a short, precise list instead of几十条 noise;
  3. queries with no matching item return an empty list, not an error;
  4. real (non-demo) listings are reachable, including exact model names;
  5. old recipe (flat 0.35) vs new recipe (0.45 floor + 0.08 margin) on the same queries;
  6. with the sidecar unreachable the API still answers 200 through keyword
     recall (the old code threw 503);
  7. the category filter and pagination still work.

Run from the project root:
  semantic\\.venv\\Scripts\\python.exe semantic\\_probe\\verify_search.py
"""
import json
import os
import pathlib
import shutil
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
WORK = ROOT / "target" / "commercial-qa"
UPLOADS = ROOT / "semantic" / "_probe" / "uploads"
PY = ROOT / "semantic" / ".venv" / "Scripts" / "python.exe"
LOGS = ROOT / "semantic" / "_probe"
NO_WINDOW = subprocess.CREATE_NO_WINDOW


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def wait_port(port, timeout=90):
    end = time.time() + timeout
    while time.time() < end:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=1):
                return True
        except OSError:
            time.sleep(0.2)
    return False


def http(url, timeout=25):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")
    except Exception as e:  # noqa: BLE001
        return 0, repr(e)


def search(base, **params):
    code, body = http(base + "/api/item/search?" + urllib.parse.urlencode(params))
    if code != 200:
        return code, {"list": [], "total": 0, "searchMode": "http-%s" % code}
    payload = json.loads(body)
    data = payload.get("data")
    if not isinstance(data, dict):
        return payload.get("code"), {"list": [], "total": 0, "searchMode": "bad-payload"}
    return payload.get("code"), data


def main():
    mysql_bin = shutil.which("mysqld") or r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
    mysql_cli = shutil.which("mysql") or r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    db_port, sem_port, app_port, dead_port = free_port(), free_port(), free_port(), free_port()

    db_log = (LOGS / "mysql.log").open("wb")
    db = subprocess.Popen([mysql_bin, "--no-defaults", "--console", "--bind-address=127.0.0.1",
                           "--mysqlx=OFF", f"--port={db_port}", "--datadir=./mysql"],
                          cwd=WORK, stdout=db_log, stderr=subprocess.STDOUT,
                          creationflags=NO_WINDOW)
    sem = app = app_kw = None
    failures = []

    def check(name, condition, detail):
        print(("  PASS  " if condition else "  FAIL  ") + name + "  " + detail, flush=True)
        if not condition:
            failures.append(name)

    def start_app(tag, semantic_url):
        env = dict(os.environ,
                   PORT=str(app_port),
                   DB_URL="jdbc:mysql://127.0.0.1:%d/huanyiquan?useSSL=false&allowPublicKeyRetrieval=true"
                          "&serverTimezone=Asia/Shanghai&characterEncoding=utf8" % db_port,
                   DB_USER="root", DB_PASSWORD="",
                   SEMANTIC_URL=semantic_url,
                   ADMIN_PASSWORD="Test-verify-1", APP_SECRET="verify-secret")
        cp = str(ROOT / "target" / "classes") + os.pathsep + str(ROOT / "target" / "dependency" / "*")
        log = (LOGS / ("app-%s.log" % tag)).open("wb")
        proc = subprocess.Popen(["java", "-Dfile.encoding=UTF-8", "-Xmx256m", "-cp", cp,
                                 "com.huanyiquan.Application"],
                                cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT,
                                creationflags=NO_WINDOW)
        base = "http://127.0.0.1:%d" % app_port
        for _ in range(160):
            code, body = http(base + "/api/meta/status", timeout=2)
            if code == 200 and json.loads(body).get("data", {}).get("db"):
                return proc, base
            if proc.poll() is not None:
                break
            time.sleep(0.5)
        raise RuntimeError("app(%s) failed to start, see semantic/_probe/app-%s.log" % (tag, tag))

    try:
        assert wait_port(db_port), "isolated MySQL did not start"
        cli = [mysql_cli, "--no-defaults", "--protocol=tcp", "-h127.0.0.1",
               f"-P{db_port}", "-uroot", "--default-character-set=utf8mb4"]
        script = "DROP DATABASE IF EXISTS huanyiquan;\n" + "\n".join(
            (ROOT / "sql" / name).read_text(encoding="utf-8-sig") for name in (
                "schema.sql", "auction.sql", "auction_review_migration.sql",
                "item_review_timer_migration.sql", "community.sql", "notifications_demo.sql",
                "community_exchange.sql", "account_wish_migration.sql",
                "social_settings_migration.sql", "wish_relay_migration.sql")) + "\n"
        subprocess.run(cli, input=script.encode("utf-8"), check=True, capture_output=True,
                       creationflags=NO_WINDOW)
        seed_env = dict(os.environ, DB_URL="jdbc:mysql://127.0.0.1:%d/huanyiquan" % db_port,
                        DB_USER="root", DB_PASSWORD="", DEMO_UPLOAD_DIR=str(UPLOADS))
        subprocess.run([str(PY), str(ROOT / "demo-catalog" / "seed.py")],
                       env=seed_env, check=True, capture_output=True, creationflags=NO_WINDOW)
        print("setup: isolated MySQL on %d, 200 demo listings seeded" % db_port, flush=True)

        sem_log = (LOGS / "sidecar.log").open("wb")

        def start_sidecar(tag, **extra):
            env = dict(os.environ,
                       DB_URL="jdbc:mysql://127.0.0.1:%d/huanyiquan" % db_port,
                       DB_USER="root", DB_PASSWORD="",
                       SEMANTIC_MODEL_DIR=str(ROOT / "semantic-model"),
                       SEMANTIC_PORT=str(sem_port),
                       SEMANTIC_REFRESH_SECONDS="5",
                       OMP_NUM_THREADS="1", PYTHONIOENCODING="utf-8")
            env.update({k: str(v) for k, v in extra.items()})
            proc = subprocess.Popen([str(PY), str(ROOT / "semantic" / "server.py")], cwd=ROOT,
                                    env=env, stdout=sem_log, stderr=subprocess.STDOUT,
                                    creationflags=NO_WINDOW)
            for _ in range(180):
                code, body = http("http://127.0.0.1:%d/health" % sem_port, timeout=3)
                if code == 200 and json.loads(body).get("ready"):
                    print("sidecar(%s): %s" % (tag, body), flush=True)
                    return proc
                time.sleep(1)
            raise RuntimeError("sidecar(%s) never became ready" % tag)

        sem = start_sidecar("new")
        app, base = start_app("semantic", "http://127.0.0.1:%d" % sem_port)
        print("app up on %s with semantic backend" % base, flush=True)

        def counts(queries):
            out = {}
            for q in queries:
                code, data = search(base, q=q, page=1, size=50)
                out[q] = len(data["list"])
            return out

        print("\n[1] 语义检索：结果数量与精度")
        for q, limit in (("机械键盘", 2), ("高等数学课本", 2), ("kindle", 2), ("羽毛球拍", 3)):
            code, data = search(base, q=q, page=1, size=20)
            titles = [i["title"] for i in data["list"]]
            check("q=%s 返回条数<=%d" % (q, limit), code == 0 and 0 < len(titles) <= limit,
                  "%d 条 %s mode=%s" % (len(titles), titles, data.get("searchMode")))

        print("\n[2] 无对应商品的查询：返回空列表，不报错")
        for q in ("电饭煲", "投影仪"):
            code, data = search(base, q=q, page=1, size=20)
            check("q=%s" % q, code == 0 and data["list"] == [], "code=%s 条数=%s" % (code, len(data["list"])))

        print("\n[3] 分类筛选与分页")
        code, data = search(base, q="机械键盘", category="数码", page=1, size=1)
        check("q=机械键盘 category=数码 size=1", code == 0 and len(data["list"]) == 1
              and data["total"] == 2 and data["hasMore"] is True,
              "total=%s hasMore=%s" % (data.get("total"), data.get("hasMore")))
        code, data = search(base, q="机械键盘", category="教材", page=1, size=20)
        check("q=机械键盘 category=教材 应为空", code == 0 and data["list"] == [], "total=%s" % data.get("total"))

        print("\n[4] 真实用户发布的商品（非示例）能被搜到")
        subprocess.run(cli, input=("USE huanyiquan; INSERT INTO item(owner_id,title,category,"
                                   "condition_level,description,images,expect_desc,status,is_demo,"
                                   "offer_count,view_count,deleted) VALUES(1,'iPhone 13 128G 国行',"
                                   "'数码','九成新','自用一年，电池健康 92%%，想换个平板','','换平板',"
                                   "1,0,0,0,0);").encode("utf-8"),
                       check=True, capture_output=True, creationflags=NO_WINDOW)
        found = []
        for _ in range(30):
            code, data = search(base, q="iPhone 13", page=1, size=20)
            found = [i["title"] for i in (data["list"] if code == 0 else [])]
            if found:
                break
            time.sleep(1)
        check("q=iPhone 13 命中真实商品", bool(found), "%s" % found)

        print("\n[5] 同一批查询：旧配置(0.35 无相对截断) vs 新配置(0.45/0.05)")
        queries = ["机械键盘", "高等数学课本", "考研", "书", "运动", "电饭煲", "投影仪"]
        specific = ["机械键盘", "高等数学课本", "考研"]
        absent_q = ["电饭煲", "投影仪"]
        new_counts = counts(queries)
        sem.terminate()
        sem.wait(timeout=30)
        sem = start_sidecar("old", SEMANTIC_SCORE_FLOOR=0.35, SEMANTIC_SCORE_MARGIN=9, SEMANTIC_KEEP=200)
        old_counts = counts(queries)
        print("  %-16s %10s %10s" % ("查询", "旧条数", "新条数"))
        for q in queries:
            print("  %-16s %10d %10d" % (q, old_counts[q], new_counts[q]))
        avg_old = sum(old_counts.values()) / len(queries)
        avg_new = sum(new_counts.values()) / len(queries)
        check("具体商品查询都被收紧到 3 条以内",
              all(new_counts[q] <= 3 for q in specific),
              ", ".join("%s %d 条" % (q, new_counts[q]) for q in specific))
        check("无对应商品的查询不再返回噪声", all(new_counts[q] == 0 for q in absent_q),
              ", ".join("%s %d 条" % (q, new_counts[q]) for q in absent_q))
        check("平均返回条数显著下降", avg_new < avg_old / 3,
              "旧 %.1f 条 → 新 %.1f 条" % (avg_old, avg_new))

        app.terminate()
        app.wait(timeout=30)

        print("\n[6] 语义服务不可用：自动退化为关键词检索，不再 503")
        app_kw, base_kw = start_app("keyword", "http://127.0.0.1:%d" % dead_port)
        code, data = search(base_kw, q="机械键盘", page=1, size=20)
        titles = [i["title"] for i in data["list"]] if code == 0 else []
        check("q=机械键盘 走关键词兜底", code == 0 and len(titles) >= 1,
              "%d 条 %s mode=%s" % (len(titles), titles, data.get("searchMode") if code == 0 else code))
        code, data = search(base_kw, q="电饭煲", page=1, size=20)
        check("q=电饭煲 无结果也不报错", code == 0 and data["list"] == [], "code=%s" % code)
    finally:
        for proc in (app, app_kw, sem):
            if proc is not None and proc.poll() is None:
                proc.terminate()
        db.terminate()
        db_log.close()

    print()
    if failures:
        print("FAILED: %s" % ", ".join(failures))
        sys.exit(1)
    print("ALL CHECKS PASSED")


if __name__ == "__main__":
    main()
