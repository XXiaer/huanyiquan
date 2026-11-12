"""Collect verifiable CNY prices and matching photographs from IKEA China."""
from collections import Counter, deque
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from html import unescape
from io import BytesIO
import json
from pathlib import Path
import re

from PIL import Image, ImageOps
import requests

ROOT = Path(__file__).resolve().parent / "retail-reference"
BASE = "https://www.ikea.cn/cn/zh/cat/"
SOURCES = [
    ("台灯", "生活", "tai-deng-10732/"),
    ("书桌配件", "生活", "ban-gong-zhuo-zheng-li-he-pei-jian-10573/"),
    ("手机配件", "数码", "shou-ji-ping-ban-pei-jian-40843/"),
    ("充电配件", "数码", "dian-xian-he-chong-dian-qi-40845/"),
    ("储物盒", "生活", "chu-wu-he-10797/"),
    ("水杯和水壶", "生活", "bo-li-qi-min-he-shui-hu-18868/"),
    ("餐具", "生活", "can-ju-18860/"),
    ("靠垫", "生活", "kao-dian-he-kao-dian-tao-10659/"),
    ("背包", "其他", "bei-bao-xie-ku-bao-27821/"),
    ("园艺", "绿植", "yuan-yi-pei-jian-24887/"),
    ("花盆", "绿植", "shi-nei-hua-pen-10778/"),
    ("人造植物", "绿植", "700612/"),
    ("绘画用品", "其他", "11671/"),
    ("文件收纳", "生活", "wen-jian-he-duo-mei-ti-chu-cang-jian-10551/"),
    ("玩具", "其他", "ti-yu-18736/"),
    ("书架配件", "生活", "58291/"),
]
CARD = re.compile(r'<a class="i-product-card-main [^"]+" href="([^"]+)">(.*?)</a>', re.S)
SPEC = re.compile(r'<p class="i-product-card-main__spec">([^<]+)</p>')
NUXT = re.compile(r'id="__NUXT_DATA__">(.*?)</script>', re.S)


def request(url):
    with requests.Session() as session:
        session.trust_env = False
        response = session.get(url, timeout=18)
        response.raise_for_status()
        return response


def collect(source):
    group, category, path = source
    category_url = BASE + path
    try:
        html = request(category_url).text
        payload = json.loads(NUXT.search(html)[1])
    except (requests.RequestException, TypeError, ValueError) as error:
        print(group, str(error))
        return deque()

    products = {}
    for node in payload:
        if not isinstance(node, dict) or not {"id", "name", "image", "price", "designText"} <= node.keys():
            continue
        sku = payload[node["id"]]
        photo = payload[node["image"]]
        price = payload[node["price"]]
        if not isinstance(sku, str) or not isinstance(photo, str) or not isinstance(price, dict):
            continue
        if not photo.startswith("https://file.app.ikea.cn/") or "regularPrice" not in price:
            continue
        if payload[price.get("currencyCode", 0)] != "CNY":
            continue
        cents = int(Decimal(str(payload[price["regularPrice"]])) * 100)
        if not 0 < cents <= 80000:
            continue
        products[sku] = (payload[node["name"]], payload[node["designText"]], photo, cents)

    found = deque()
    for url, markup in CARD.findall(html):
        sku_match = re.search(r'(\d{8})/?$', url)
        spec = SPEC.search(markup)
        if not sku_match or not spec or sku_match[1] not in products:
            continue
        sku = sku_match[1]
        name, variant, photo, cents = products[sku]
        if not isinstance(name, str):
            continue
        spec = unescape(spec[1])
        variant = variant if isinstance(variant, str) else ""
        title = " ".join(part for part in (name, spec, variant) if part).strip()[:60]
        found.append(dict(sku=sku, title=title, series=name, category=category,
                          group=group, price_cents=cents, currency="CNY",
                          source_url=url, image_url=photo,
                          image_file="retail-ikea-" + sku + ".jpg"))
    print(group, len(found))
    return found


def prepare_image(row):
    target = ROOT / "images" / row["image_file"]
    try:
        with Image.open(target if target.exists() else BytesIO(request(row["image_url"]).content)) as source:
            picture = ImageOps.exif_transpose(source).convert("RGB")
            if min(picture.size) < 150:
                return None
            picture.thumbnail((640, 640), Image.Resampling.LANCZOS)
            if not target.exists():
                picture.save(target, "JPEG", quality=86, optimize=True)
        return row
    except (OSError, requests.RequestException):
        return None


def main():
    (ROOT / "images").mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=6) as pool:
        queues = list(pool.map(collect, SOURCES))
        seen = set()
        seen_titles = set()
        series_count = Counter()
        candidates = []
        while any(queues):
            for queue in queues:
                if not queue:
                    continue
                row = queue.popleft()
                if row["sku"] in seen or row["title"] in seen_titles or series_count[row["series"]] >= 4:
                    continue
                seen.add(row["sku"])
                seen_titles.add(row["title"])
                series_count[row["series"]] += 1
                candidates.append(row)
        selected = []
        for start in range(0, len(candidates), 24):
            selected.extend(row for row in pool.map(prepare_image, candidates[start:start + 24]) if row)
            if len(selected) >= 200:
                break
    if len(selected) < 200:
        raise RuntimeError(f"Only {len(selected)} complete, distinct products")
    selected = selected[:200]
    (ROOT / "catalog.json").write_text(json.dumps(selected, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(len(selected), Counter(row["group"] for row in selected))


if __name__ == "__main__":
    main()
