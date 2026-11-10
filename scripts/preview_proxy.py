"""Local-only preview: local UI files, production API (no credentials logged)."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.request import Request, build_opener, ProxyHandler
from urllib.error import HTTPError,URLError
from pathlib import Path
import os
ROOT=Path(__file__).resolve().parents[1]/'src/main/webapp'
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def do_GET(self):
  if self.path.startswith('/api/'):self.proxy()
  else:super().do_GET()
 def do_POST(self):self.proxy()
 def do_PUT(self):self.proxy()
 def proxy(self):
  if not self.path.startswith('/api/'):self.send_error(404);return
  body=self.rfile.read(int(self.headers.get('Content-Length',0))) if self.command in ('POST','PUT') else None
  headers={k:self.headers[k] for k in ('Content-Type','Cookie','X-Token') if k in self.headers}
  req=Request('http://118.89.177.23:8081'+self.path,data=body,headers=headers,method=self.command)
  try:r=build_opener(ProxyHandler({})).open(req,timeout=30)
  except HTTPError as e:r=e
  except URLError:self.send_error(502);return
  data=r.read();self.send_response(r.status)
  for k in ('Content-Type','Set-Cookie','X-Token'):
   v=r.headers.get(k)
   if v:self.send_header(k,v)
  self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
 def log_message(self,fmt,*args):pass
if __name__=='__main__':ThreadingHTTPServer(('127.0.0.1',18090),Handler).serve_forever()
