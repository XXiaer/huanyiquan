# -*- coding: utf-8 -*-
"""Offline quality probe for the local BGE sidecar.

Loads the ONNX model exactly the way semantic/server.py does, embeds the demo
catalog texts, and prints the ranking for a set of realistic queries so the
score distribution and the 0.35 cut-off can be judged without HTTP/DB.

Run: semantic\.venv\Scripts\python.exe semantic\_probe\eval_quality.py
"""
import json
import pathlib
import sys

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

ROOT = pathlib.Path(__file__).resolve().parents[2]
MODEL_DIR = ROOT / "semantic-model"
QUERY_PREFIX = "为这个句子生成表示以用于检索相关文章："

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
        enc = tokenizer.encode_batch(texts[start:start + 16])
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
texts = [" ".join(str(x or "") for x in (c["title"], c["category"], c["description"], c["want"]))
         for c in catalog]
vecs = np.stack(embed(texts))
print("indexed", len(texts), "demo items, dim", vecs.shape[1])

queries = [
    "考研数学复习资料",
    "高等数学课本",
    "二手自行车",
    "冬天穿的厚外套",
    "无线耳机",
    "机械键盘",
    "台灯",
    "篮球",
    "电饭煲",
    "毕业季卖书",
    "Python 教程",
    "显示器",
    "宿舍收纳",
    "iPhone 13",
    "羽绒服",
    "kindle",
]

for q in queries:
    v = embed([QUERY_PREFIX + q])[0]
    scores = vecs @ v
    order = np.argsort(-scores)
    top = [(catalog[int(i)]["title"], catalog[int(i)]["category"], float(scores[i])) for i in order[:5]]
    n35 = int((scores >= 0.35).sum())
    n50 = int((scores >= 0.50).sum())
    n60 = int((scores >= 0.60).sum())
    print("\n=== %s" % q)
    print("  >=0.35: %d   >=0.50: %d   >=0.60: %d   max=%.3f  min=%.3f"
          % (n35, n50, n60, float(scores.max()), float(scores.min())))
    for title, cat, s in top:
        print("  %.3f  [%s] %s" % (s, cat, title))
