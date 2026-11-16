"""Seed labelled relay and auction fixtures into an initialized local demo database."""
import json
import os
import secrets
import shutil
from pathlib import Path
from urllib.parse import urlsplit

import pymysql

ROOT = Path(__file__).resolve().parent


def seed():
    url = urlsplit(os.environ['DB_URL'].removeprefix('jdbc:'))
    database = url.path.lstrip('/')
    if url.hostname not in ('localhost', '127.0.0.1') or not database.startswith('huanyiquan_demo_'):
        raise SystemExit('Use a local database named huanyiquan_demo_*.')
    uploads = Path(os.environ['DEMO_UPLOAD_DIR'])
    uploads.mkdir(parents=True, exist_ok=True)
    data = json.loads((ROOT / 'relay-auction-fixtures.json').read_text(encoding='utf-8'))
    conn = pymysql.connect(host=url.hostname, port=url.port or 3306,
                           user=os.environ['DB_USER'], password=os.environ['DB_PASSWORD'],
                           database=database, charset='utf8mb4')
    with conn, conn.cursor() as cur:
        def image_for(item):
            name = item['image'].rsplit('/', 1)[-1]
            source, dest = ROOT / 'images' / name, uploads / name
            if not dest.exists():
                shutil.copyfile(source, dest)
            elif source.read_bytes() != dest.read_bytes():
                raise RuntimeError('Fixture image collision')
            return item['image']

        def owner(code, name):
            cur.execute('SELECT id FROM user WHERE student_no=%s', (code,))
            row = cur.fetchone()
            if row:
                return row[0]
            cur.execute('INSERT INTO user(student_no,nickname,password,salt,credit,status,role,fail_count,deleted) '
                        'VALUES(%s,%s,%s,%s,80,1,0,0,0)',
                        (code, name, secrets.token_hex(32), secrets.token_hex(16)))
            return cur.lastrowid

        for ring in data['rings']:
            for slot, letter in (('botA', 'A'), ('botB', 'B')):
                spec = ring[slot]
                item = spec['offers']
                user = owner(f'demo_ring_{ring["group"]}{letter}', f'接力演示 {ring["group"]}{letter}')
                cur.execute('SELECT id FROM item WHERE owner_id=%s LIMIT 1', (user,))
                if cur.fetchone():
                    continue
                cur.execute('INSERT INTO item(owner_id,title,category,condition_level,description,images,status,is_demo,allow_cycle,auto_match,trade_mode) '
                            'VALUES(%s,%s,%s,%s,%s,%s,1,0,1,1,2)',
                            (user, item['title'], item['category'], '九成新', '演示接力，不涉及实物交割。', image_for(item)))
                item_id = cur.lastrowid
                cur.execute('INSERT INTO wish_post(user_id,title,content) VALUES(%s,%s,%s)',
                            (user, spec['wants'], '平台演示账号发布的接力心愿。'))
                cur.execute('INSERT INTO wish_offer(wish_id,item_id) VALUES(%s,%s)', (cur.lastrowid, item_id))

        seller = owner('demo_auction_v1', '校园拍卖演示')
        for item in data['auctions']:
            title = '【演示】' + item['title']
            cur.execute('SELECT id FROM auction WHERE seller_id=%s AND title=%s LIMIT 1', (seller, title))
            if cur.fetchone():
                continue
            cur.execute('INSERT INTO auction(seller_id,title,description,start_price,current_price,ends_at,status,image,duration_hours) '
                        'VALUES(%s,%s,%s,%s,%s,DATE_ADD(NOW(), INTERVAL %s HOUR),1,%s,%s)',
                        (seller, title, '演示拍品，不涉及付款和实物交割。', item['startPrice'],
                         item['startPrice'], item['hours'], image_for(item), item['hours']))
        conn.commit()
    print('8 relay groups and 8 auction fixtures ready')


if __name__ == '__main__':
    seed()
