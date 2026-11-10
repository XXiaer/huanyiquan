#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
换一圈 · 示例商品配图抓取

把 demo-catalog/images 里的占位卡片图换成真实商品照片。
关键约定：**文件名保持不变**，catalog.json 与数据库里的 /api/file/<name> 都不用改，
换掉的只是图片字节。所以这个脚本可以反复跑，也可以单独用来替换个别商品图。

用法：
    python scripts/fetch_item_photos.py                 # 全部重抓
    python scripts/fetch_item_photos.py 机械键盘 羽毛球拍  # 只抓指定商品名
    python scripts/fetch_item_photos.py --dry-run       # 只打印候选，不下载

来源：Bing 图片搜索（cn.bing.com）。抓到的原图链接与来源页记录在
demo-catalog/image-sources.json，方便回查。仅用于校园课程项目的演示数据。
"""

import html
import io
import json
import os
import pathlib
import re
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
CATALOG = ROOT / "demo-catalog" / "catalog.json"
IMG_DIR = ROOT / "demo-catalog" / "images"
SOURCES = ROOT / "demo-catalog" / "image-sources.json"

W, H = 520, 390                      # 与现有图片一致，卡片是 4:3
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")

# 明显不是商品图的域名/关键词，直接跳过
BAD_HOST = ("duitang.com/album", "giphy.com", "pinimg.com/originals/e")
BAD_WORD = ("logo", "icon", "sprite", "avatar", "emoji", "banner_", "biaoqing")

# 图源打分。0 = 直接丢：素材站缩略图都压着巨大水印，裁不掉。
# 分数越高越优先，主要是「无水印 + 白底/实拍」这两件事。
HOST_SCORE = {
    "zol-img.com.cn": 9, "zol.com.cn": 9,          # 中关村在线，白底产品图
    "zdmimg.com": 8, "smzdm.com": 8,               # 什么值得买，用户实拍
    "360buyimg.com": 8, "jd.com": 8,               # 京东
    "alicdn.com": 7, "taobaocdn.com": 7,
    "pixabay.com": 9, "pexels.com": 9, "unsplash.com": 9,
    "wikimedia.org": 8, "apple.com": 8,
    "gtimg.com": 5, "sinaimg.cn": 5, "sohu.com": 5, "ifeng.com": 5,
    "zhimg.com": 3, "zhihu.com": 3,                # 知乎，右下角常有水印
    "pconline.com.cn": 5, "zol-img.com": 9,
    # 0 分：素材站，水印压满整图
    "699pic.com": 0, "588ku.com": 0, "qiantucdn.com": 0, "mksucai.com": 0,
    "lazystones.com": 0, "gettyimages": 0, "istockphoto": 0, "shutterstock": 0,
    "duitang.com": 0, "xiaohongshu.com": 0, "weibo.com": 2, "douyinpic.com": 0,
}


# 有些商品名在搜索里太窄，凑不齐两张。给它们换个更好搜的说法。
ALIAS = {
    "校园手账本": ["手账本", "笔记本 手账"],
    "钥匙收纳包": ["钥匙包", "钥匙扣 包"],
    "床头置物架": ["床头收纳架", "床头架"],
    "足球": ["足球 五号", "足球 实拍"],
    "USB 小风扇": ["桌面小风扇 usb", "小风扇"],
    "有线耳机": ["入耳式耳机 有线", "有线耳机 白色"],
}


def host_score(url):
    """按域名给图源打分，表里没收录的中立给 4。"""
    host = urllib.parse.urlsplit(url).netloc.lower()
    for key, score in HOST_SCORE.items():
        if key in host:
            return score
    return 4


_LAST_SEARCH = [0.0]
THROTTLE = 7.0       # 秒。Bing 连续请求一百多次就开始返不相关的结果，必须限速


def _pace():
    """两次搜索之间至少隔 THROTTLE 秒，否则会被判定成爬虫。"""
    wait = THROTTLE - (time.time() - _LAST_SEARCH[0])
    if wait > 0:
        time.sleep(wait)
    _LAST_SEARCH[0] = time.time()


def bing_candidates(query, n=35):
    """取一页搜索结果，返回 [{murl, turl, purl, w, h, score}]，按分数排序。

    限速是硬要求：抓快了 Bing 会返回一堆和关键词无关的图，
    而且不报错，看起来像搜索结果烂，其实是 IP 被降权。
    """
    page = ""
    for attempt in range(3):
        _pace()
        url = "https://cn.bing.com/images/search?" + urllib.parse.urlencode(
            {"q": query, "form": "HDRSC2", "first": 1})
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=25) as r:
                page = r.read().decode("utf-8", "ignore")
        except Exception:
            page = ""
        if 'm="' in page:
            break
        time.sleep(3 + attempt * 3)

    out = []
    for raw in re.findall(r'm="(\{[^"]*?\})"', page):
        try:
            d = json.loads(html.unescape(raw))
        except json.JSONDecodeError:
            continue
        murl, turl = d.get("murl"), d.get("turl")
        if not murl:
            continue
        # 阿里/淘宝的图常带 .310x310 这类缩略标记，去掉就能拿大图
        murl = re.sub(r"\.\d+x\d+(?=\.(?:jpg|jpeg|png))", "", murl)
        low = murl.lower()
        if any(w in low for w in BAD_WORD):
            continue
        if any(w in low for w in BAD_HOST):
            continue
        if urllib.parse.urlsplit(murl).path.lower().endswith((".gif", ".svg")):
            continue
        score = host_score(murl)
        if score <= 0:
            continue
        out.append({
            "murl": murl,
            "turl": turl,
            "purl": d.get("purl") or "",
            # Bing 把尺寸塞在 m 的 "w"/"h" 里，拿不到就当 0，后面按下载后实测判断
            "w": int(d.get("w") or 0),
            "h": int(d.get("h") or 0),
            "score": score,
        })
        if len(out) >= n:
            break
    # 先比域名可信度，再比像素多少
    out.sort(key=lambda c: (-c["score"], -(c["w"] * c["h"])))
    return out


def download(url, timeout=25):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Referer": "https://cn.bing.com/",
        "Accept": "image/avif,image/webp,image/*,*/*;q=0.8",
    })
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def to_card(data):
    """裁成 4:3 并缩放，返回 PIL Image；不合格返回 None。"""
    try:
        im = Image.open(io.BytesIO(data))
        im.load()
    except Exception:
        return None
    if im.width < 420 or im.height < 300:
        return None
    if im.width > 4000 or im.height > 4000:
        return None
    # 长条图基本是促销横幅/轮播图，主体不是单件商品，直接丢
    ratio = im.width / im.height
    if ratio > 2.3 or ratio < 0.55:
        return None
    im = im.convert("RGB")
    # 先削掉四周一条：站外图的水印和边角文字九成贴在边上，
    # 直接裁掉比事后糊一片更干净，主体基本不受影响。
    im = im.crop((int(im.width * 0.015), int(im.height * 0.015),
                  int(im.width * 0.975), int(im.height * 0.88)))
    # 居中裁 4:3
    tw, th = W / H, im.width / im.height
    if th > tw:                                  # 太宽，切左右
        nw = int(im.height * tw)
        left = (im.width - nw) // 2
        im = im.crop((left, 0, left + nw, im.height))
    elif th < tw:                                # 太高，切上下（偏上取，商品多在中间偏上）
        nh = int(im.width / tw)
        top = max(0, int((im.height - nh) * 0.42))
        im = im.crop((0, top, im.width, top + nh))
    return im.resize((W, H), Image.LANCZOS)


def pick_for(query, need, used_urls):
    """为同一个商品名挑 need 张不同的图，返回 [(PIL.Image, candidate), ...]。

    第一轮没凑够就换问法再找：加「实拍」「商品图」这类词，
    能把广告横幅、封面合成图挤下去。
    """
    got, seen = [], set()
    queries = [query] + ALIAS.get(query, []) + [query + " 实拍", query + " 商品图"]
    for q in queries:
        if len(got) >= need:
            break
        try:
            cands = bing_candidates(q)           # 已按域名可信度排好序
        except Exception:
            continue
        for c in cands:
            if len(got) >= need:
                break
            if c["murl"] in used_urls or c["murl"] in seen:
                continue
            seen.add(c["murl"])
            for url in (c["murl"], c["turl"]):
                if not url:
                    continue
                try:
                    im = to_card(download(url))
                except Exception:
                    im = None
                if im is not None:
                    used_urls.add(c["murl"])
                    got.append((im, {**c, "used": url}))
                    break
    return got


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv

    catalog = json.loads(CATALOG.read_text(encoding="utf8"))
    groups = {}
    for x in catalog:
        name = re.sub(r" · .*$", "", x["title"])
        g = groups.setdefault(name, {"files": [], "category": x["category"]})
        g["files"].append(x["image"].rsplit("/", 1)[1])

    names = args or list(groups)
    manifest = json.loads(SOURCES.read_text(encoding="utf8")) if SOURCES.exists() else {}
    used, ok, fail = set(), 0, []

    def work(name):
        files = groups[name]["files"]
        # 光搜商品名会捞回一堆公众号配图和广告横幅。
        # 教材加「封面」能命中出版社书影，其余加「商品」能命中白底实拍。
        q = f"{name} 教材 封面" if groups[name]["category"] == "教材" else f"{name} 商品"
        return name, files, pick_for(q, len(files), used)

    with ThreadPoolExecutor(max_workers=5) as pool:
        for name, files, imgs in pool.map(work, names):
            if len(imgs) < len(files):
                fail.append(f"{name}（只拿到 {len(imgs)}/{len(files)}）")
                if not imgs:
                    continue
            for fname, (im, src) in zip(files, imgs):
                if dry:
                    print(f"  {fname}  <-  {src['used'][:90]}")
                    continue
                im.save(IMG_DIR / fname, "PNG", optimize=True)
                manifest[fname] = {"item": name, "source": src["used"],
                                   "page": src["purl"]}
                ok += 1
            print(f"  ✓ {name}  {len(imgs)} 张")

    if not dry:
        SOURCES.write_text(json.dumps(manifest, ensure_ascii=False, indent=1),
                           encoding="utf8")
        print(f"\n完成 {ok} 张，失败 {len(fail)} 组")
        for f in fail:
            print("  ✗", f)
        if fail:
            print("重跑这几个：python scripts/fetch_item_photos.py " +
                  " ".join(f.split("（")[0] for f in fail))


if __name__ == "__main__":
    main()
