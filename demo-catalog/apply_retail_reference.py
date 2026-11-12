"""Replace only the 200 active demonstration rows in the live catalog."""
import hashlib
import json
from pathlib import Path
import shutil
import sys
from urllib.parse import urlsplit

import pymysql


def main():
    stage = Path(sys.argv[1])
    root = Path("/opt/huanyiquan")
    settings = dict(
        line.rstrip().split("=", 1)
        for line in (root / ".env").read_text().splitlines()
        if "=" in line and not line.lstrip().startswith("#")
    )
    db = urlsplit(settings["DB_URL"].removeprefix("jdbc:"))
    rows = json.loads((stage / "catalog.json").read_text(encoding="utf-8"))
    assert len(rows) == len({row["sku"] for row in rows}) == len({row["image_file"] for row in rows}) == 200
    assert all(row["currency"] == "CNY" and row["price_cents"] > 0 for row in rows)
    uploads = Path(settings.get("UPLOAD_DIR") or root / "uploads")

    for row in rows:
        source = stage / "images" / row["image_file"]
        target = uploads / row["image_file"]
        assert source.is_file() and source.stat().st_size > 500
        if target.exists():
            assert hashlib.sha256(source.read_bytes()).digest() == hashlib.sha256(target.read_bytes()).digest()
        else:
            with target.open("xb") as output, source.open("rb") as input_file:
                shutil.copyfileobj(input_file, output)

    connection = pymysql.connect(host=db.hostname, port=db.port or 3306, user=settings["DB_USER"],
                                 password=settings["DB_PASSWORD"], database=db.path.lstrip("/"),
                                 charset="utf8mb4", autocommit=False,
                                 cursorclass=pymysql.cursors.DictCursor)
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM item WHERE is_demo=1 AND deleted=0 AND status=1 ORDER BY id FOR UPDATE")
            originals = cursor.fetchall()
            assert len(originals) == 200, f"Expected 200 demo rows, found {len(originals)}"
            with (stage / "previous-demo-rows.json").open("x", encoding="utf-8") as backup:
                json.dump(originals, backup, default=str, ensure_ascii=False, indent=2)
            used_titles = set()
            for original, row in zip(originals, rows):
                full_title = row["title"]
                localized = full_title.split(" ", 1)[-1] if len(full_title) > 30 else full_title
                title = localized[:30].rstrip()
                if title.casefold() in used_titles:
                    title = f"{title[:21].rstrip()} {row['sku']}"
                used_titles.add(title.casefold())
                description = (
                    f"{full_title}。宜家中国官网货号 {row['sku']}。"
                    f"采集时非会员参考价 ¥{row['price_cents'] / 100:.2f}，仅作平台示例展示。"
                    f" 商品来源：{row['source_url']}"
                )
                cursor.execute(
                    """UPDATE item SET title=%s, category=%s, condition_level=%s, brand=%s,
                       description=%s, images=%s, price=%s, original_price=NULL, trade_mode=1,
                       allow_bargain=0, expect_desc=NULL, want_text=NULL, allow_cycle=0,
                       auto_match=0, update_time=update_time
                       WHERE id=%s AND is_demo=1 AND deleted=0 AND status=1""",
                    (title, row["category"], "全新", "IKEA 宜家", description,
                     "/api/file/" + row["image_file"], row["price_cents"], original["id"]),
                )
                assert cursor.rowcount == 1, original["id"]
            cursor.execute("""SELECT COUNT(*) AS total, COUNT(DISTINCT images) AS photos,
                              COUNT(DISTINCT title) AS titles, MIN(price) AS minimum, MAX(price) AS maximum
                              FROM item WHERE is_demo=1 AND deleted=0 AND status=1
                              AND images LIKE '/api/file/retail-ikea-%' AND price>0""")
            check = cursor.fetchone()
            assert check["total"] == check["photos"] == check["titles"] == 200
        connection.commit()
        print(json.dumps(check))
    except BaseException:
        connection.rollback()
        raise
    finally:
        connection.close()


if __name__ == "__main__":
    main()
