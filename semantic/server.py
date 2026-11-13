"""Local BGE vector search sidecar; binds only to loopback and never sends data to a third party.

检索先独立收集向量候选与标题词面候选，再按排名融合。
向量分支的截断使用以下规则：
  1. 向量召回：query 加 BGE 指令前缀，条目取「标题 + 类别 + 描述 + 期望」的整段文本；
  2. 截断策略：只保留与首位足够接近的少数条目（SEMANTIC_SCORE_FLOOR / SEMANTIC_SCORE_MARGIN）。
第二层是关键。只用一个固定阈值（旧版 0.35）时，无关条目也普遍能到 0.35 至 0.45，
于是每次搜索都返回几十条噪声；改成「绝对下限 + 相对首位容差 + 条数上限」后，
同一个具体商品的查询从平均 22 条降到 2 条，而正确条目仍全部保留
（标定数据见 semantic/_probe/bench_rank.py，端到端验证见 semantic/_probe/verify_search.py）。

所有参数都能用环境变量覆盖，不用改代码：
  DB_URL / DB_USER / DB_PASSWORD   从 JDBC 串里解析主机、端口、库名（端口不再写死 3306）
  SEMANTIC_MODEL_DIR               模型目录，默认取仓库内 semantic-model
  SEMANTIC_PORT                    监听端口，默认 18084
  SEMANTIC_SCORE_FLOOR             绝对相关度下限，默认 0.45
  SEMANTIC_SCORE_MARGIN            允许低于首位多少，默认 0.05
  SEMANTIC_KEEP                    最多返回条数，默认 30
  SEMANTIC_REFRESH_SECONDS         重建索引间隔，默认 30
"""
import os, time, json, threading, hashlib, urllib.parse, pathlib
from retrieval import allows, fuse, lexical_tier, normalize, product_specs, query_phrase, understand
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import numpy as np
import pymysql
import onnxruntime as ort
from tokenizers import Tokenizer

BASE_DIR = pathlib.Path(__file__).resolve().parent
MODEL_DIR = pathlib.Path(os.environ.get('SEMANTIC_MODEL_DIR') or (BASE_DIR.parent / 'semantic-model'))
QUERY_PREFIX = '为这个句子生成表示以用于检索相关文章：'
FLOOR = float(os.environ.get('SEMANTIC_SCORE_FLOOR', '0.45'))
MARGIN = float(os.environ.get('SEMANTIC_SCORE_MARGIN', '0.05'))
KEEP = max(1, int(os.environ.get('SEMANTIC_KEEP', '30')))
REFRESH_SECONDS = max(5, int(os.environ.get('SEMANTIC_REFRESH_SECONDS', '30')))

# 数据库连接信息一律从 DB_URL 解析，端口/主机跟着配置走。
# 旧版把 host 写死成 127.0.0.1 又漏传 port，只要 MySQL 不在默认 3306，
# 索引就永远建不起来，/search 一直 503，搜索退化成关键词。
_dsn = urllib.parse.urlsplit(os.environ['DB_URL'].removeprefix('jdbc:'))
DB_HOST = _dsn.hostname or '127.0.0.1'
DB_PORT = _dsn.port or 3306
DB_NAME = _dsn.path.lstrip('/')
DB_USER = os.environ.get('DB_USER') or (urllib.parse.unquote(_dsn.username) if _dsn.username else 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD') or urllib.parse.unquote(_dsn.password or '')

opts = ort.SessionOptions(); opts.intra_op_num_threads = 1; opts.inter_op_num_threads = 1
session = ort.InferenceSession(str(MODEL_DIR / 'model.onnx'), sess_options=opts, providers=['CPUExecutionProvider'])
tokenizer = Tokenizer.from_file(str(MODEL_DIR / 'tokenizer.json'))
tokenizer.enable_truncation(max_length=128); tokenizer.enable_padding()
input_names = {x.name for x in session.get_inputs()}
lock = threading.RLock(); cache = {}; index_ids = []; index_titles = []; index_attributes = []; index_specs = []; index_filters = []; index_vectors = None; index_dim = None; ready = False; last_error = ''

def embed(texts):
    global index_dim
    with lock:
        out=[]
        for start in range(0,len(texts),16):
            enc=tokenizer.encode_batch(texts[start:start+16])
            tensors={'input_ids':np.asarray([e.ids for e in enc],dtype=np.int64), 'attention_mask':np.asarray([e.attention_mask for e in enc],dtype=np.int64), 'token_type_ids':np.asarray([e.type_ids for e in enc],dtype=np.int64)}
            z=session.run(None,{k:v for k,v in tensors.items() if k in input_names})[0][:,0,:]
            z=z / np.maximum(np.linalg.norm(z,axis=1,keepdims=True),1e-12)
            if len(z): index_dim=int(z.shape[1])
            out.extend(z.astype(np.float32))
        return out

def refresh():
    global index_ids,index_titles,index_attributes,index_specs,index_filters,index_vectors,ready,last_error
    try:
        con=pymysql.connect(host=DB_HOST,port=DB_PORT,user=DB_USER,password=DB_PASSWORD,database=DB_NAME,charset='utf8mb4',connect_timeout=5)
        try:
            with con.cursor() as cur:
                cur.execute('SELECT id,title,category,description,expect_desc,condition_level FROM item WHERE status=1 AND deleted=0 ORDER BY id')
                rows=cur.fetchall()
                cur.execute("SHOW COLUMNS FROM item")
                columns={row[0] for row in cur.fetchall()}
                fields=[name if name in columns else default for name,default in
                        (('price','NULL'),('trade_mode','NULL'),('is_demo','0'))]
                cur.execute('SELECT id,' + ','.join(fields) + ' FROM item WHERE status=1 AND deleted=0')
                attributes={row[0]: row[1:] for row in cur.fetchall()}
        finally: con.close()
        missing=[]; pending=[]
        for id,title,category,desc,expect,_ in rows:
            text=' '.join(str(x or '') for x in (title,category,desc,expect)); sig=hashlib.sha256(text.encode()).hexdigest()
            if id not in cache or cache[id][0]!=sig: missing.append(text);pending.append((id,sig))
        for i in range(0,len(missing),16):
            for (id,sig),vec in zip(pending[i:i+16],embed(missing[i:i+16])): cache[id]=(sig,vec)
        ids=[r[0] for r in rows];matrix=np.stack([cache[id][1] for id in ids]) if ids else np.empty((0,index_dim or 1),dtype=np.float32)
        with lock:
            index_ids=ids; index_titles=[normalize(r[1]) for r in rows]; index_vectors=matrix
            index_attributes=[attributes.get(id, (None, None, 0)) for id in ids]
            index_specs=[product_specs(row[1],row[3]) for row in rows]
            index_filters=[(row[2],row[5]) for row in rows]
            ready=True; last_error=''
        active=set(ids)
        for stale in cache.keys() - active:
            del cache[stale]
        print('indexed',len(ids),'items',flush=True)
    except Exception as e:
        last_error=type(e).__name__+': '+str(e);print('index error:',last_error,flush=True)

def worker():
    while True:
        refresh();time.sleep(REFRESH_SECONDS)

def rank(query, intent=None, category="", condition=""):
    phrase, budget, mode, models, capacity, expansions = intent or understand(query)
    broad_category = {'日用品': '生活', '生活用品': '生活', '宿舍用品': '生活', '宿舍生活': '生活'}.get(query_phrase(phrase))
    if broad_category and category and category != broad_category:
        return []
    if broad_category:
        category, phrase = broad_category, ''
    with lock:
        ids, titles, matrix, attributes, specs, filters = index_ids, index_titles, index_vectors, index_attributes, index_specs, index_filters
    eligible = [i for i, values in enumerate(attributes) if allows(*values, budget, mode)
                and (not category or filters[i][0] == category)
                and (not condition or filters[i][1] == condition)
                and (not models or any(lexical_tier(model, titles[i]) for model in models))
                and (not capacity or specs[i].get(capacity[0], 0) >= capacity[1])]
    if not eligible:
        return []
    if not phrase:
        return [(ids[i], 1.0) for i in eligible[-KEEP:][::-1]]
    vectors = embed([QUERY_PREFIX + value for value in (phrase, *expansions)])
    scores = (matrix @ np.asarray(vectors).T).max(axis=1)
    order = sorted(eligible, key=lambda i: -float(scores[i]))
    cutoff = max(FLOOR, float(scores[order[0]]) - MARGIN)
    semantic = [i for i in order[:KEEP] if scores[i] >= cutoff]
    normalized = query_phrase(phrase)
    lexical = [(i, max(lexical_tier(term, titles[i]) for term in (normalized, *models, *map(normalize, expansions)))) for i in eligible]
    lexical = sorted(((i, tier) for i, tier in lexical if tier), key=lambda row: (-row[1], -float(scores[row[0]])))[:KEEP]
    return [(ids[i], float(scores[i])) for i in fuse(semantic, lexical)[:KEEP]]

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path=urllib.parse.urlsplit(self.path)
        if path.path=='/health': result={'ready':ready,'items':len(index_ids),'error':last_error,'dim':index_dim,'floor':FLOOR,'margin':MARGIN};code=200
        elif path.path=='/search':
            params=urllib.parse.parse_qs(path.query)
            q=params.get('q',[''])[0].strip()
            if not q or len(q)>200:result={'error':'query required'};code=400
            elif not ready:result={'error':'index not ready'};code=503
            else:
                try:
                    intent = understand(q)
                    _, budget, mode, models, capacity, _ = intent
                    conditions = []
                    if budget is not None: conditions.append(f'预算不超过 ¥{budget / 100:g}')
                    if mode: conditions.append('可换物' if mode == 2 else '可出售')
                    if models and (len(models) > 1 or budget is not None or capacity or mode): conditions.append('型号：' + ' 或 '.join(models))
                    if capacity: conditions.append(('硬盘' if capacity[0] == 'storage' else '内存') + f'至少 {capacity[1]} GB')
                    result = {'results': [{'id': i, 'score': s} for i, s in rank(q, intent, params.get("category", [""])[0], params.get("condition", [""])[0])],
                              'conditions': conditions}
                    code = 200
                except Exception as e: result={'error':type(e).__name__+': '+str(e)};code=503
        else:result={'error':'not found'};code=404
        body=json.dumps(result,ensure_ascii=False).encode();self.send_response(code);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
    def log_message(self,*args): pass
if __name__ == '__main__':
    threading.Thread(target=worker,daemon=True).start()
    ThreadingHTTPServer(('127.0.0.1',int(os.environ.get('SEMANTIC_PORT','18084'))),Handler).serve_forever()
