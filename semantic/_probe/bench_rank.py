# -*- coding: utf-8 -*-
"""Rank-and-cut calibration bench for the semantic sidecar.

Ground truth comes from the 200-item demo catalog:
  * positives  = each of the 100 products used as a query; a hit means an item of
                 that same product family appears in the top-N. (第 1 名命中率 / 前 3 名命中率)
  * negatives  = products that do NOT exist in the catalog; a good ranker returns
                 almost nothing for them. (平均返回条数 = 噪声)

It compares the current production recipe (one concatenated text, flat 0.35 cut)
against field-weighted vectors + lexical hybrid + relative cut, and prints the
parameter combination with the best hit rate at the lowest noise.

Run: semantic\.venv\Scripts\python.exe semantic\_probe\bench_rank.py
"""
import itertools
import json
import pathlib
import re

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

ROOT = pathlib.Path(__file__).resolve().parents[2]
MODEL_DIR = ROOT / "semantic-model"
PREFIX = "为这个句子生成表示以用于检索相关文章："

opts = ort.SessionOptions()
opts.intra_op_num_threads = 1
opts.inter_op_num_threads = 1
session = ort.InferenceSession(str(MODEL_DIR / "model.onnx"), sess_options=opts,
                               providers=["CPUExecutionProvider"])
tokenizer = Tokenizer.from_file(str(MODEL_DIR / "tokenizer.json"))
tokenizer.enable_truncation(max_length=128)
tokenizer.enable_padding()
input_names = {x.name for x in session.get_inputs()}


def embed(texts):
    out = []
    for start in range(0, len(texts), 16):
        batch = texts[start:start + 16]
        enc = tokenizer.encode_batch(batch)
        tensors = {
            "input_ids": np.asarray([e.ids for e in enc], dtype=np.int64),
            "attention_mask": np.asarray([e.attention_mask for e in enc], dtype=np.int64),
            "token_type_ids": np.asarray([e.type_ids for e in enc], dtype=np.int64),
        }
        z = session.run(None, {k: v for k, v in tensors.items() if k in input_names})[0][:, 0, :]
        z = z / np.maximum(np.linalg.norm(z, axis=1, keepdims=True), 1e-12)
        out.extend(z.astype(np.float32))
    return out


catalog = json.loads((ROOT / "demo-catalog" / "catalog.json").read_text(encoding="utf8"))
families = [re.split(r"\s*·\s*", c["title"])[0] for c in catalog]

flat_texts = [" ".join(str(x or "") for x in (c["title"], c["category"], c["description"], c["want"]))
              for c in catalog]
head_texts = [c["title"] + " " + c["category"] for c in catalog]
body_texts = [str(c["description"] or "") + " " + str(c["want"] or "") for c in catalog]

flat = np.stack(embed(flat_texts))
head = np.stack(embed(head_texts))
body = np.stack(embed(body_texts))
print("indexed %d items, dim %d" % (len(catalog), flat.shape[1]))

positives = sorted(set(families))
negatives = ["电饭煲", "iPhone 13", "自行车", "冰箱", "微波炉", "投影仪", "打印机",
             "吸尘器", "猫粮", "行李箱", "台式电脑", "显示器", "电竞椅", "洗衣机", "吹风机"]
absent = [q for q in negatives
          if not any(q in f or f in q for f in families)]
# 自然语言说法：测的是「换一种说法还能不能找到」，而不是把标题原样打一遍
paraphrases = [
    ("考研用的英语单词书", "考研英语单词书"),
    ("高数课本", "高等数学教材"),
    ("宿舍里喝水用的杯子", "保温杯"),
    ("冬天脖子保暖的围巾", "围巾"),
    ("打代码用的键盘", "机械键盘"),
    ("图书馆自习用的台灯", "护眼台灯"),
    ("听歌用的蓝牙耳机", "无线蓝牙耳机"),
    ("装电脑的背包", "双肩背包"),
    ("看电子书的阅读器", "电子阅读器"),
    ("练瑜伽的垫子", "瑜伽垫"),
    ("四六级考试的真题", "四六级真题集"),
    ("拍照片的三脚架", "相机三脚架"),
    ("晚上做作业打光的灯", "护眼台灯"),
    ("打篮球穿的鞋", "帆布鞋"),
    ("宿舍床边放东西的架子", "床头置物架"),
]
paraphrases = [(q, t) for q, t in paraphrases if t in families]
still_absent = [q for q in absent
                if not any(q in f or f in q for f in families)]
q_pos = np.stack(embed([PREFIX + q for q in positives]))
q_neg = np.stack(embed([PREFIX + q for q in still_absent]))
q_para = np.stack(embed([PREFIX + q for q, _ in paraphrases]))
print("positive queries %d, paraphrase queries %d, negative queries %d (dropped %s)"
      % (len(positives), len(paraphrases), len(still_absent),
         [q for q in negatives if q not in still_absent]))


def char_bigrams(text):
    """CJK 用字二元组；ASCII 用单词。只做轻量词法信号，够用即可。"""
    text = text.lower()
    grams = set(re.findall(r"[a-z0-9]+", text))
    cjk = re.findall(r"[\u4e00-\u9fff]+", text)
    for run in cjk:
        grams.update(run[i:i + 2] for i in range(len(run) - 1))
        grams.add(run)
    return grams


item_lex = [char_bigrams(c["title"] + " " + c["category"]) for c in catalog]


def lexical(vecs, q):
    qg = char_bigrams(q)
    if not qg:
        return vecs
    return np.array([len(qg & g) / len(qg) for g in item_lex])


def run(recipe, floor, margin, cap=30):
    """返回 (前1命中率, 前3命中率, 改写召回率, 负例平均返回数, 负例噪声率, 正例平均返回数)"""
    hits1 = hits3 = 0
    pos_kept = []
    for i, q in enumerate(positives):
        scores = recipe(q_pos[i], q)
        order = np.argsort(-scores)
        kept = cut(scores, order, floor, margin, cap)
        pos_kept.append(len(kept))
        fams = [families[j] for j in kept]
        hits1 += bool(fams) and fams[0] == q
        hits3 += q in fams[:3]
    para = 0
    para_kept = []
    for i, (q, target) in enumerate(paraphrases):
        scores = recipe(q_para[i], q)
        kept = cut(scores, np.argsort(-scores), floor, margin, cap)
        para_kept.append(len(kept))
        para += target in [families[j] for j in kept][:3]
    noise = []
    over = 0
    for i, q in enumerate(still_absent):
        scores = recipe(q_neg[i], q)
        kept = cut(scores, np.argsort(-scores), floor, margin, cap)
        noise.append(len(kept))
        over += len(kept) > 2
    return (hits1 / len(positives), hits3 / len(positives), para / max(1, len(paraphrases)),
            float(np.mean(noise)), over / len(still_absent),
            float(np.mean(pos_kept + para_kept)))


def cut(scores, order, floor, margin, cap=30):
    if len(order) == 0:
        return []
    best = float(scores[order[0]])
    if best < floor:
        return []
    limit = max(floor, best - margin)
    kept = []
    for idx in order:
        if float(scores[idx]) < limit or len(kept) >= cap:
            break
        kept.append(int(idx))
    return kept


def baseline(sem, q):
    """当前线上做法：单段拼接文本 + 固定 0.35 阈值。"""
    return sem


def make(w_head, w_lex):
    def recipe(sem_q, q):
        if w_head is None:
            return flat @ sem_q + w_lex * lexical(np.ones(len(catalog)), q)
        s = w_head * (head @ sem_q) + (1 - w_head) * (body @ sem_q)
        return s + w_lex * lexical(np.ones(len(catalog)), q)
    return recipe


print("\n当前线上做法：单段文本、flat 0.35 阈值")
h1, h3, para, n, over, size = run(make(None, 0.0), floor=0.35, margin=99)
print("  前1 %.0f%%  前3 %.0f%%  改写召回 %.0f%%  每次平均返回 %.1f 条，负例 %.1f 条，%d%% 负例>2 条"
      % (h1 * 100, h3 * 100, para * 100, size, n, over * 100))

rows = []
for w_head, w_lex in itertools.product([None, 0.8], [0.0, 0.2]):
    for floor, margin in itertools.product([0.40, 0.42, 0.45, 0.48], [0.03, 0.04, 0.05, 0.06, 0.08, 0.10]):
        h1, h3, para, n, over, size = run(make(w_head, w_lex), floor, margin)
        rows.append((h3, para, -size, -n, h1, w_head, w_lex, floor, margin, n, over, size))

rows.sort(key=lambda r: (round(r[0], 3), round(r[1], 3), r[2], r[3]), reverse=True)
print("\n参数扫描 top 12（前3命中 → 改写召回 → 结果集小 → 负例少）")
print("  %-5s %-6s %-9s %-8s %-6s %-5s %-5s %-6s"
      % ("前3", "改写", "平均条数", "负例条数", "噪声率", "head", "词法", "落点"))
for h3, para, neg_size, neg_n, h1, w_head, w_lex, floor, margin, n, over, size in rows[:12]:
    print("  %4.0f%% %5.0f%% %8.1f %8.1f %5.0f%%  %5s %5s  floor=%.2f margin=%.2f"
          % (h3 * 100, para * 100, size, n, over * 100, w_head, w_lex, floor, margin))

print("\n候选落点对比（同一份 ground truth）")
print("  %-24s %-6s %-6s %-9s %-8s %-6s" % ("配置", "前1", "改写", "平均条数", "负例条数", "噪声率"))
for name, recipe, floor, margin in (
        ("现在的 0.35 无相对截断", make(None, 0.0), 0.35, 99),
        ("floor .42 margin .10", make(None, 0.0), 0.42, 0.10),
        ("floor .45 margin .08", make(None, 0.0), 0.45, 0.08),
        ("floor .50 margin .08", make(None, 0.0), 0.50, 0.08),
        ("field .8/词法 .2 floor .42", make(0.8, 0.2), 0.42, 0.10)):
    h1, h3, para, n, over, size = run(recipe, floor, margin)
    print("  %-24s %5.0f%% %5.0f%% %8.1f %8.1f %5.0f%%"
          % (name, h1 * 100, para * 100, size, n, over * 100))

print("\n极端查询逐条看（floor .42 margin .10）")
recipe = make(None, 0.0)
probe = [("电饭煲", None), ("羽绒服", None), ("毕业季卖书", None), ("显示器", None),
         ("iPhone 13", None), ("kindle", None),
         ("想收一个考研用的英语单词书，价格面议", None),
         ("有没有人能出一本高数课本，最好九成新", None)]
extra = [q for q, _ in probe if q not in positives and q not in still_absent]
extra_vecs = np.stack(embed([PREFIX + q for q in extra]))
for i, q in enumerate(extra):
    scores = flat @ extra_vecs[i]
    kept = cut(scores, np.argsort(-scores), 0.42, 0.10)
    order = np.argsort(-scores)[:3]
    print("  %-28s 保留 %d 条 | 最高 3 个: %s" % (
        q, len(kept), ", ".join("%s %.3f" % (families[j], scores[j]) for j in order)))
