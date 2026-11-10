"""Load marked, non-tradable demonstration items without modifying existing listings.

用法（与 README 一致，只多认了几个环境变量）：
    DB_URL=jdbc:mysql://127.0.0.1:3306/huanyiquan  DB_USER=root  DB_PASSWORD=xxx \
    DEMO_UPLOAD_DIR=/opt/huanyiquan/uploads  python demo-catalog/seed.py

图片文件名 = catalog.json 里的路径末段。换成新图时文件名不变，
所以只要覆盖 uploads 下同名文件，商品图就整体换新，不用动数据库。
"""
import os, json, hashlib, secrets, pathlib, shutil, urllib.parse

import pymysql

root = pathlib.Path(__file__).resolve().parent
catalog = json.loads((root / 'catalog.json').read_text(encoding='utf8'))
if len(catalog) != 200 or len({x['key'] for x in catalog}) != 200:
    raise RuntimeError('Invalid catalog')

# DB_URL 形如 jdbc:mysql://host:port/db?params，主机、端口、库名都从里面取，
# 这样临时实例（3307）和正式实例（3306）都跑得动。
url = urllib.parse.urlsplit(os.environ['DB_URL'].removeprefix('jdbc:'))
con = pymysql.connect(host=url.hostname or '127.0.0.1', port=url.port or 3306,
                      user=os.environ['DB_USER'], password=os.environ['DB_PASSWORD'],
                      database=url.path.lstrip('/'), charset='utf8mb4', autocommit=False)
uploads = pathlib.Path(os.environ.get('DEMO_UPLOAD_DIR', '/opt/huanyiquan/uploads'))
uploads.mkdir(parents=True, exist_ok=True)

try:
    with con.cursor() as cur:
        cur.execute("SELECT id FROM user WHERE student_no=%s", ('demo_catalog_v1',))
        row = cur.fetchone()
        if row:
            seller = row[0]
            cur.execute('SELECT COUNT(*) FROM demo_seed_map m JOIN item i ON i.id=m.item_id '
                        'WHERE i.owner_id=%s', (seller,))
            if cur.fetchone()[0] == 0:
                raise RuntimeError('Demo account exists but is not linked to our catalog')
        else:
            cur.execute("INSERT INTO user(student_no,nickname,password,salt,credit,status,"
                        "role,fail_count,deleted) VALUES(%s,%s,%s,%s,80,1,0,0,0)",
                        ('demo_catalog_v1', '平台示例', secrets.token_hex(32),
                         secrets.token_hex(16)))
            seller = cur.lastrowid

        created = 0
        for x in catalog:
            name = x['image'].rsplit('/', 1)[1]
            src, dst = root / 'images' / name, uploads / name
            if dst.exists():
                if hashlib.sha256(dst.read_bytes()).digest() != hashlib.sha256(src.read_bytes()).digest():
                    raise RuntimeError('Image filename collision')
            else:
                shutil.copyfile(src, dst)
            cur.execute('SELECT item_id FROM demo_seed_map WHERE seed_key=%s', (x['key'],))
            if cur.fetchone():
                continue
            cur.execute('INSERT INTO item(owner_id,title,category,condition_level,description,'
                        'images,expect_desc,status,is_demo,offer_count,view_count,deleted) '
                        'VALUES(%s,%s,%s,%s,%s,%s,%s,1,1,0,0,0)',
                        (seller, x['title'], x['category'], x['condition'],
                         x['description'], x['image'], x['want']))
            cur.execute('INSERT INTO demo_seed_map(seed_key,item_id) VALUES(%s,%s)',
                        (x['key'], cur.lastrowid))
            created += 1
    con.commit()
    print('created', created, 'demo listings; catalog total', len(catalog))
except Exception:
    con.rollback()
    raise
finally:
    con.close()
