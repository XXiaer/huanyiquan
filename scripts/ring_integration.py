"""Isolated end-to-end checks for private conversations, wishes and three-person rings."""
import os,subprocess,sys,pathlib,time,urllib.request,urllib.error,json,shutil
pw=sys.stdin.readline().strip();env=os.environ.copy();env['MYSQL_PWD']=pw;base=['mysql','-uroot','-N','-B'];name='huanyiquan_codex_ring_test'
def sql(q):
 r=subprocess.run(base+['-e',q],env=env,capture_output=True,text=True)
 if r.returncode:raise RuntimeError(r.stderr)
 return r.stdout.strip()
if sql("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME='"+name+"'"):raise RuntimeError('test db exists')
proc=None;granted=False
try:
 sql('CREATE DATABASE '+name+' CHARACTER SET utf8mb4');sql("GRANT ALL PRIVILEGES ON "+name+".* TO 'hqapp'@'localhost'");granted=True
 root=pathlib.Path('/opt/huanyiquan-v2-check');schema=(root/'sql/schema.sql').read_text().replace('CREATE DATABASE IF NOT EXISTS huanyiquan','CREATE DATABASE IF NOT EXISTS '+name).replace('USE huanyiquan;', 'USE '+name+';')
 for f in ['auction.sql','auction_review_migration.sql','item_review_timer_migration.sql','community.sql','notifications_demo.sql','community_exchange.sql']:schema+='\n'+(root/'sql'/f).read_text()
 subprocess.run(base,input=schema,env=env,text=True,check=True,capture_output=True)
 catalog=json.loads((root/'demo-catalog/catalog.json').read_text());image=catalog[0]['image'];filename=image.rsplit('/',1)[1]
 (root/'uploads').mkdir(exist_ok=True);shutil.copyfile(root/'demo-catalog/images'/filename,root/'uploads'/filename)
 vals=dict(l.split('=',1) for l in pathlib.Path('/opt/huanyiquan/.env').read_text().splitlines() if '=' in l);env2=os.environ.copy();env2.update(vals);env2.update(PORT='18087',DB_URL=vals['DB_URL'].replace('/huanyiquan?', '/'+name+'?'),ADMIN_PASSWORD='testpass123')
 log=open(str(root/'test.log'),'w');proc=subprocess.Popen(['/usr/bin/java','-Xmx160m','-cp',str(root/'target/classes')+':/opt/huanyiquan/target/dependency/*','com.huanyiquan.Application'],cwd=root,env=env2,stdout=log,stderr=subprocess.STDOUT)
 def api(path,body=None,token=None,method=None):
  h={};data=None
  if body is not None:h['Content-Type']='application/json';data=json.dumps(body,ensure_ascii=False).encode()
  if token:h['X-Token']=token
  try:return json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:18087/api'+path,data=data,headers=h,method=method),timeout=15))
  except urllib.error.HTTPError as e:return json.load(e)
 for _ in range(30):
  try:
   if api('/meta/status')['data']['db']:break
  except Exception:time.sleep(.5)
 else:raise RuntimeError('server not ready')
 def ok(r):
  if r.get('code')!=0:raise AssertionError(str(r))
  return r.get('data')
 def login(n):return ok(api('/user/login',{'studentNo':n,'password':'testpass123'}))['token']
 nums=['2021000011','2021000012','2021000013','2021000014']
 for n in nums:ok(api('/user/register',{'studentNo':n,'nickname':'tester'+n[-1],'password':'testpass123'}))
 A,B,C,D=map(login,nums);admin=login('admin');tokens=[A,B,C,D]
 specs=[('书','教材','运动,生活','passive'),('键盘','数码','教材','passive'),('台灯','生活','数码','passive'),('背包','衣物','教材','one')]
 ids=[]
 for token,(title,cat,want,mode) in zip(tokens,specs):
  d={'title':title,'category':cat,'conditionLevel':'九成新','wantCategory':want,'images':image,'matchMode':mode}
  iid=ok(api('/item',d,token))['itemId'];ids.append(iid);ok(api('/admin/items/'+str(iid)+'/approve',{},admin))
 assert len(ok(api('/item/'+str(ids[0]),token=A))['want']['wantCategories'])==2
 assert api('/cycle/'+str(ids[3]),token=D)['code']==400
 matches=ok(api('/cycle/'+str(ids[0]),token=A));assert len(matches)>=1 and set(matches[0]['itemIds'])==set(ids[:3]),matches
 for _ in range(35):
  if all(any(x['title']=='发现可闭环的交换' for x in ok(api('/notification',token=t))) for t in (A,B,C)):break
  time.sleep(1)
 else:raise AssertionError('passive ring notifications missing')
 thread=ok(api('/conversation/start',{'itemId':ids[0]},B))['id'];ok(api('/conversation/'+str(thread),{'kind':'text','content':'你好，书还在吗'},B))
 assert api('/conversation/'+str(thread),token=C)['code']==403
 assert ok(api('/conversation/'+str(thread),token=A))['messages'][-1]['content']=='你好，书还在吗'
 assert any(n['target']=='#/chat/'+str(thread) and not n['read'] for n in ok(api('/notification',token=A)))
 private=next(n for n in ok(api('/notification',token=A)) if n['target']=='#/chat/'+str(thread));ok(api('/notification/'+str(private['id'])+'/read',{},A));assert next(n for n in ok(api('/notification',token=A) if False else api('/notification',token=A)) if n['id']==private['id'])['read']
 w=ok(api('/wish',{'title':'想换一本练习册','category':'教材','content':'希望成色完整'},B))['id'];assert any(x['id']==w for x in ok(api('/wish',token=A)))
 assert api('/wish/'+str(w)+'/close',{},C)['code']==400;ok(api('/wish/'+str(w)+'/close',{},B))
 assert api('/auction',{'title':'cash','amount':'10','hours':1,'image':image},A)['code']==400
 exchange=ok(api('/cycle/'+str(ids[0])+'/create',{'itemIds':ids[:3]},A))['exchangeId']
 assert api('/conversation/ring/'+str(exchange),token=D)['code']==403
 ok(api('/conversation/ring/'+str(exchange),{'content':'图书馆门口见'},B));assert ok(api('/conversation/ring/'+str(exchange),token=C))[-1]['content']=='图书馆门口见'
 for t in (A,B,C):ok(api('/exchange/'+str(exchange)+'/confirm',{},t))
 assert ok(api('/exchange/'+str(exchange),token=A))['status']==2
 assert all(any(x['title']=='三方已全部确认' for x in ok(api('/notification',token=t))) for t in (A,B,C))
 ok(api('/exchange/'+str(exchange)+'/cancel',{'reason':'测试'},B));assert ok(api('/exchange/'+str(exchange),token=A))['status']==4
 assert all(ok(api('/item/'+str(i),token=A))['item']['status']==1 for i in ids[:3])
 second=ok(api('/cycle/'+str(ids[0])+'/create',{'itemIds':ids[:3]},A))['exchangeId']
 sql('UPDATE '+name+'.`exchange` SET create_time=DATE_SUB(NOW(),INTERVAL 25 HOUR) WHERE id='+str(second))
 assert api('/exchange/'+str(second)+'/confirm',{},B)['code']==400
 assert ok(api('/exchange/'+str(second),token=A))['status']==4
 assert all(any(x['title']=='闭环已超时解散' for x in ok(api('/notification',token=t))) for t in (A,B,C))
 print('PASS multi-category match, opt-out, passive notifications, private chat privacy, read indicator, wishes, cash disabled, three-party room/confirm/cancel and unlock')
finally:
 if proc:
  proc.terminate()
  try:proc.wait(timeout=10)
  except subprocess.TimeoutExpired:proc.kill()
 if granted:sql("REVOKE ALL PRIVILEGES ON "+name+".* FROM 'hqapp'@'localhost'")
 sql('DROP DATABASE '+name)
