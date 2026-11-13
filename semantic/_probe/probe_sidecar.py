# -*- coding: utf-8 -*-
"""End-to-end probe: isolated MySQL + demo catalog + semantic/server.py + HTTP checks.

Starts a throwaway MySQL instance on a free port with the already-initialised
datadir that target/commercial-qa uses, loads sql/schema.sql, seeds the 200 demo
listings, then boots the sidecar exactly as deployed and probes /health and
/search. Everything is torn down afterwards; no project data is touched.

Run: semantic\.venv\Scripts\python.exe semantic\_probe\probe_sidecar.py
"""
import json
import os
import pathlib
import shutil
import socket
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
WORK = ROOT / "target" / "commercial-qa"
DATADIR = WORK / "mysql"
UPLOADS = ROOT / "semantic" / "_probe" / "uploads"
PY = ROOT / "semantic" / ".venv" / "Scripts" / "python.exe"


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def wait_port(port, timeout=60):
    end = time.time() + timeout
    while time.time() < end:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=1):
                return True
        except OSError:
            time.sleep(0.2)
    return False


def http_get(url, timeout=30):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")
    except Exception as e:  # noqa: BLE001
        return 0, repr(e)


def main():
    mysql_bin = shutil.which("mysqld") or r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
    mysql_cli = shutil.which("mysql") or r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    db_port, sem_port = free_port(), free_port()
    db_name = "huanyiquan"

    mysql_log = (ROOT / "semantic" / "_probe" / "mysql.log").open("wb")
    db = subprocess.Popen(
        [mysql_bin, "--no-defaults", "--console", "--bind-address=127.0.0.1",
         "--mysqlx=OFF", f"--port={db_port}", "--datadir=./mysql"],
        cwd=WORK, stdout=mysql_log, stderr=subprocess.STDOUT,
        creationflags=subprocess.CREATE_NO_WINDOW,
    )
    sem = None
    try:
        assert wait_port(db_port, 60), "isolated MySQL did not start"
        cli = [mysql_cli, "--no-defaults", "--protocol=tcp", "-h127.0.0.1",
               f"-P{db_port}", "-uroot", "--default-character-set=utf8mb4"]
        schema = (ROOT / "sql" / "schema.sql").read_text(encoding="utf-8-sig")
        demo = (ROOT / "sql" / "notifications_demo.sql").read_text(encoding="utf-8-sig")
        script = "DROP DATABASE IF EXISTS %s;\n%s\n%s\n" % (db_name, schema, demo)
        subprocess.run(cli, input=script.encode("utf-8"), check=True, capture_output=True,
                       creationflags=subprocess.CREATE_NO_WINDOW)
        env = dict(os.environ,
                   DB_URL="jdbc:mysql://127.0.0.1:%d/%s" % (db_port, db_name),
                   DB_USER="root", DB_PASSWORD="",
                   DEMO_UPLOAD_DIR=str(UPLOADS))
        subprocess.run([str(PY), str(ROOT / "demo-catalog" / "seed.py")],
                       env=env, check=True, capture_output=True,
                       creationflags=subprocess.CREATE_NO_WINDOW)

        sem_env = dict(os.environ,
                       DB_URL="jdbc:mysql://127.0.0.1:%d/%s" % (db_port, db_name),
                       DB_USER="root", DB_PASSWORD="",
                       SEMANTIC_MODEL_DIR=str(ROOT / "semantic-model"),
                       SEMANTIC_PORT=str(sem_port),
                       OMP_NUM_THREADS="1", PYTHONIOENCODING="utf-8")
        sem_log = (ROOT / "semantic" / "_probe" / "sidecar.log").open("wb")
        sem = subprocess.Popen([str(PY), str(ROOT / "semantic" / "server.py")],
                               cwd=ROOT, env=sem_env, stdout=sem_log, stderr=subprocess.STDOUT,
                               creationflags=subprocess.CREATE_NO_WINDOW)
        base = "http://127.0.0.1:%d" % sem_port
        ready = False
        for _ in range(120):
            code, body = http_get(base + "/health", timeout=3)
            if code == 200 and json.loads(body).get("ready"):
                ready = True
                break
            if sem.poll() is not None:
                break
            time.sleep(1)
        print("health:", code, body)
        if not ready:
            print((ROOT / "semantic" / "_probe" / "sidecar.log").read_text(encoding="utf-8", errors="replace")[-3000:])
            return

        for q in ["高等数学课本", "机械键盘", "电饭煲", "iPhone 13", "毕业季卖书", "kindle",
                  "羽毛球拍", "有没有人能出一本高数课本，最好九成新"]:
            code, body = http_get(base + "/search?q=" + urllib.parse.quote(q))
            data = json.loads(body)
            rows = data.get("results", [])
            print("\n%s -> %d hits" % (q, len(rows)))
            print("   ids:", [r["id"] for r in rows[:12]])
            print("   scores:", ["%.3f" % r["score"] for r in rows[:8]])
    finally:
        if sem is not None:
            sem.terminate()
        db.terminate()
        mysql_log.close()
        try:
            subprocess.run([mysql_bin, "--version"], capture_output=True,
                           creationflags=subprocess.CREATE_NO_WINDOW)
        except Exception:  # noqa: BLE001
            pass


if __name__ == "__main__":
    main()
