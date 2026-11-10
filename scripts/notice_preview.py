from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import json,os
os.chdir('src/main/webapp')
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  path=self.path.split('?')[0]
  if path.startswith('/api/'):
   data={'/api/meta/status':{'db':True,'onShelf':0},'/api/user/me':{'id':1,'nickname':'测试用户','role':0},'/api/item/list':{'list':[],'total':0,'hasMore':False},'/api/notification/unread':{'count':3},'/api/notification':[{'id':103,'read':False,'title':'测试','content':'模拟消息','target':'#/offers','createdAt':'2026-11-09T00:00:00'}]}.get(path,{})
   body=json.dumps({'code':0,'data':data}).encode();self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(body);return
  return super().do_GET()
 def do_POST(self):
  self.rfile.read(int(self.headers.get('Content-Length',0)));data={'id':1,'nickname':'测试用户','role':0,'token':'notice-test'};body=json.dumps({'code':0,'data':data}).encode();self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(body)
ThreadingHTTPServer(('127.0.0.1',18091),Handler).serve_forever()
