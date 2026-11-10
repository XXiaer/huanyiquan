"""Local BGE vector search sidecar; binds only to loopback and never sends data to a third party."""
import os, time, json, threading, hashlib, urllib.parse, pathlib
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import numpy as np
import pymysql
import onnxruntime as ort
from tokenizers import Tokenizer

MODEL_DIR = pathlib.Path(os.environ.get('SEMANTIC_MODEL_DIR', '/opt/huanyiquan/semantic/model'))
DB_NAME = urllib.parse.urlsplit(os.environ['DB_URL'].removeprefix('jdbc:')).path.lstrip('/')
opts = ort.SessionOptions(); opts.intra_op_num_threads = 1; opts.inter_op_num_threads = 1
session = ort.InferenceSession(str(MODEL_DIR / 'model.onnx'), sess_options=opts, providers=['CPUExecutionProvider'])
tokenizer = Tokenizer.from_file(str(MODEL_DIR / 'tokenizer.json'))
tokenizer.enable_truncation(max_length=128); tokenizer.enable_padding()
input_names = {x.name for x in session.get_inputs()}
lock = threading.RLock(); cache = {}; index_ids = []; index_vectors = None; ready = False; last_error = ''

def embed(texts):
    with lock:
        out=[]
        for start in range(0,len(texts),16):
            enc=tokenizer.encode_batch(texts[start:start+16])
            tensors={'input_ids':np.asarray([e.ids for e in enc],dtype=np.int64), 'attention_mask':np.asarray([e.attention_mask for e in enc],dtype=np.int64), 'token_type_ids':np.asarray([e.type_ids for e in enc],dtype=np.int64)}
            z=session.run(None,{k:v for k,v in tensors.items() if k in input_names})[0][:,0,:]
            z=z / np.maximum(np.linalg.norm(z,axis=1,keepdims=True),1e-12)
            out.extend(z.astype(np.float32))
        return out

def refresh():
    global index_ids,index_vectors,ready,last_error
    try:
        con=pymysql.connect(host='127.0.0.1',user=os.environ['DB_USER'],password=os.environ['DB_PASSWORD'],database=DB_NAME,charset='utf8mb4',connect_timeout=5)
        try:
            with con.cursor() as cur:
                cur.execute('SELECT id,title,category,description,expect_desc FROM item WHERE status=1 AND deleted=0 ORDER BY id')
                rows=cur.fetchall()
        finally: con.close()
        missing=[]; pending=[]
        for id,title,category,desc,expect in rows:
            text=' '.join(str(x or '') for x in (title,category,desc,expect)); sig=hashlib.sha256(text.encode()).hexdigest()
            if id not in cache or cache[id][0]!=sig: missing.append(text);pending.append((id,sig))
        for i in range(0,len(missing),16):
            for (id,sig),vec in zip(pending[i:i+16],embed(missing[i:i+16])): cache[id]=(sig,vec)
        ids=[r[0] for r in rows];matrix=np.stack([cache[id][1] for id in ids]) if ids else np.empty((0,384),dtype=np.float32)
        with lock: index_ids=ids; index_vectors=matrix; ready=True; last_error=''
        print('indexed',len(ids),'items',flush=True)
    except Exception as e:
        last_error=type(e).__name__+': '+str(e);print('index error:',last_error,flush=True)

def worker():
    while True:
        refresh();time.sleep(30)

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path=urllib.parse.urlsplit(self.path)
        if path.path=='/health': result={'ready':ready,'items':len(index_ids),'error':last_error};code=200
        elif path.path=='/search':
            q=urllib.parse.parse_qs(path.query).get('q',[''])[0].strip()
            if not q or len(q)>200:result={'error':'query required'};code=400
            elif not ready:result={'error':'index not ready'};code=503
            else:
                v=embed(['为这个句子生成表示以用于检索相关文章：'+q])[0]
                with lock: ids=index_ids[:]; matrix=index_vectors
                scores=matrix @ v if len(ids) else []
                order=np.argsort(-scores) if len(ids) else []
                result={'results':[{'id':ids[int(i)],'score':float(scores[i])} for i in order if scores[i]>=0.35]};code=200
        else:result={'error':'not found'};code=404
        body=json.dumps(result,ensure_ascii=False).encode();self.send_response(code);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
    def log_message(self,*args): pass
threading.Thread(target=worker,daemon=True).start()
ThreadingHTTPServer(('127.0.0.1',int(os.environ.get('SEMANTIC_PORT','18084'))),Handler).serve_forever()
