"""Isolated integration test; reads MySQL root password from stdin, never logs it."""
import os,subprocess,sys,pathlib,time,urllib.request,urllib.error,json
pw=sys.stdin.readline().strip();env=os.environ.copy();env['MYSQL_PWD']=pw;base=['mysql','-uroot','-N','-B'];name='huanyiquan_codex_full_test'
def sql(q):
 r=subprocess.run(base+['-e',q],env=env,capture_output=True,text=True)
 if r.returncode:raise RuntimeError(r.stderr)
 return r.stdout.strip()
if sql("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME='"+name+"'"):raise RuntimeError('test database already exists')
procs=[];granted=False
try:
 sql('CREATE DATABASE '+name+' CHARACTER SET utf8mb4');sql("GRANT ALL PRIVILEGES ON "+name+".* TO 'hqapp'@'localhost'");granted=True
 root=pathlib.Path('/opt/huanyiquan-v2-check');schema=(root/'sql/schema.sql').read_text().replace('CREATE DATABASE IF NOT EXISTS huanyiquan','CREATE DATABASE IF NOT EXISTS '+name).replace('USE huanyiquan;', 'USE '+name+';')
 for f in ['auction.sql','auction_review_migration.sql','item_review_timer_migration.sql','community.sql','notifications_demo.sql','community_exchange.sql']:schema+='\n'+(root/'sql'/f).read_text()
 subprocess.run(base,input=schema,env=env,text=True,check=True,capture_output=True)
 vals=dict(l.split('=',1) for l in pathlib.Path('/opt/huanyiquan/.env').read_text().splitlines() if '=' in l);env2=os.environ.copy();env2.update(vals);env2.update(PORT='18086',DB_URL=vals['DB_URL'].replace('/huanyiquan?', '/'+name+'?'),ADMIN_PASSWORD='testpass123',DEMO_UPLOAD_DIR=str(root/'uploads'),SEMANTIC_PORT='18085',SEMANTIC_URL='http://127.0.0.1:18085',SEMANTIC_MODEL_DIR='/opt/huanyiquan/semantic/model',OMP_NUM_THREADS='1')
 py='/opt/huanyiquan/semantic-venv/bin/python';seed=str(root/'demo-catalog/seed.py')
 for expected in ['created 200','created 0']:
  p=subprocess.run([py,seed],cwd=root,env=env2,capture_output=True,text=True,check=True);assert expected in p.stdout,p.stdout
 log=open(str(root/'semantic-test.log'),'w');procs.append(subprocess.Popen([py,str(root/'semantic/server.py')],cwd=root,env=env2,stdout=log,stderr=subprocess.STDOUT))
 log2=open(str(root/'test.log'),'w');procs.append(subprocess.Popen(['/usr/bin/java','-Xmx160m','-cp',str(root/'target/classes')+':/opt/huanyiquan/target/dependency/*','com.huanyiquan.Application'],cwd=root,env=env2,stdout=log2,stderr=subprocess.STDOUT))
 def api(path,body=None,token=None,method=None):
  h={};data=None
  if body is not None:h['Content-Type']='application/json';data=json.dumps(body).encode()
  if token:h['X-Token']=token
  try:return json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:18086/api'+path,data=data,headers=h,method=method),timeout=25))
  except urllib.error.HTTPError as e:return json.load(e)
 for _ in range(60):
  try:
   if api('/meta/status')['data']['db']:break
  except Exception:time.sleep(.5)
 else:raise RuntimeError('java not ready')
 def ok(r):
  if r.get('code')!=0:raise AssertionError(str(r))
  return r.get('data')
 def login(n):return ok(api('/user/login',{'studentNo':n,'password':'testpass123'}))['token']
 for n in ['2021000001','2021000002']:ok(api('/user/register',{'studentNo':n,'nickname':'tester'+n[-1],'password':'testpass123'}))
 seller,buyer=map(login,['2021000001','2021000002']);admin=login('admin')
 catalog=json.loads((root/'demo-catalog/catalog.json').read_text());image=catalog[0]['image']
 item={'title':'seller demo test','category':'生活','conditionLevel':'九成新','wantCategory':'数码','images':image};a=ok(api('/item',item,seller))['itemId']
 item['title']='buyer demo test';b=ok(api('/item',item,buyer))['itemId']
 ok(api('/admin/items/'+str(a)+'/approve',{},admin));ok(api('/admin/items/'+str(b)+'/approve',{},admin))
 assert len(ok(api('/item/list?size=20'))['list'])==20
 demo=ok(api('/item/list?size=50'))['list'];assert any(x['isDemo'] for x in demo)
 demoId=next(x['id'] for x in demo if x['isDemo']);assert api('/offer',{'itemId':demoId,'myItemId':b},buyer)['code']==400
 offer=ok(api('/offer',{'itemId':a,'myItemId':b},buyer))['offerId']
 assert ok(api('/notification/unread',token=seller))['count']>=2
 assert any(n['title']=='收到新报价' for n in ok(api('/notification',token=seller)))
 ok(api('/notification/read',{},seller));assert ok(api('/notification/unread',token=seller))['count']==0
 ok(api('/offer/handle',{'offerId':offer,'action':'accept'},seller));assert ok(api('/notification/unread',token=buyer))['count']>=1
 for _ in range(120):
  try:
   h=json.load(urllib.request.urlopen('http://127.0.0.1:18085/health',timeout=3))
   if h.get('ready') and h['items']>=200:break
  except Exception:pass
  time.sleep(1)
 else:raise RuntimeError('semantic index not ready: '+str(h))
 q=urllib.parse.quote('宿舍晚上读书需要照明');results=ok(api('/item/search?q='+q+'&size=20'))
 titles=[x['title'] for x in results['list']];assert any('灯' in t for t in titles[:10]),titles[:10]
 assert api('/community')['code']==401
 ok(api('/community',{'kind':'text','content':'测试消息'},seller));assert ok(api('/community',token=buyer))[-1]['content']=='测试消息'
 for path in ['/scrap-arena/index.html','/scrap-arena/data/ui.js']:
  r=urllib.request.urlopen('http://127.0.0.1:18086'+path);assert r.status==200
 print('PASS 200 seed/idempotency, demo trading block, notices unread/read/accept, Chinese vector similarity ranking, community, game resources')
 print('search top five:',titles[:5])
finally:
 for proc in procs:
  proc.terminate()
  try:proc.wait(timeout=10)
  except subprocess.TimeoutExpired:proc.kill()
 if granted:sql("REVOKE ALL PRIVILEGES ON "+name+".* FROM 'hqapp'@'localhost'")
 sql('DROP DATABASE '+name)
