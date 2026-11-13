# -*- coding: utf-8 -*-
"""本地一键起语义检索侧车：从项目的 db.properties 读数据库连接，不用手工配环境变量。

    semantic\\.venv\\Scripts\\python.exe semantic\\run_local.py

也可以先用环境变量覆盖任意一项（DB_URL / DB_USER / DB_PASSWORD / SEMANTIC_PORT / ...），
变量名与 semantic/server.py 完全一致。Linux 部署仍可直接跑 server.py。
"""
import os
import pathlib
import runpy
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
PROPS = ROOT / "src" / "main" / "resources" / "db.properties"


def read_props(path):
    values = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def main():
    props = read_props(PROPS)
    defaults = {
        "DB_URL": props.get("db.url", ""),
        "DB_USER": props.get("db.user", ""),
        "DB_PASSWORD": props.get("db.password", ""),
        "SEMANTIC_MODEL_DIR": str(ROOT / "semantic-model"),
        "SEMANTIC_PORT": "18084",
        "OMP_NUM_THREADS": "1",
        "PYTHONIOENCODING": "utf-8",
    }
    for key, value in defaults.items():
        if value and not os.environ.get(key):
            os.environ[key] = value
    if not os.environ.get("DB_URL"):
        sys.exit("找不到数据库配置：既没有 %s，也没有 DB_URL 环境变量" % PROPS)

    print("语义检索侧车启动中", flush=True)
    print("  模型目录 %s" % os.environ["SEMANTIC_MODEL_DIR"], flush=True)
    print("  数据库   %s" % os.environ["DB_URL"], flush=True)
    print("  监听     http://127.0.0.1:%s" % os.environ["SEMANTIC_PORT"], flush=True)
    print("  自检     http://127.0.0.1:%s/health" % os.environ["SEMANTIC_PORT"], flush=True)
    runpy.run_path(str(ROOT / "semantic" / "server.py"), run_name="__main__")


if __name__ == "__main__":
    main()
