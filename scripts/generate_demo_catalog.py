from pathlib import Path
import hashlib,json,math
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parents[1];out=root/'demo-catalog';assets=out/'images';assets.mkdir(parents=True,exist_ok=True)
words={
'教材':['高等数学教材','线性代数笔记','大学英语读本','Python 编程入门','Java 程序设计','数据结构习题集','数据库原理教材','操作系统复习笔记','计算机网络教材','大学物理辅导书','概率论练习册','考研英语单词书','雅思词汇手册','四六级真题集','世界文学选集','摄影构图教程','素描基础教材','经济学导论','心理学入门书','校园手账本'],
'数码':['无线蓝牙耳机','机械键盘','无线鼠标','笔记本支架','USB 集线器','手机桌面支架','便携充电宝','游戏手柄','蓝牙音箱','屏幕挂灯','USB 小风扇','电子阅读器','平板保护壳','相机三脚架','闪存盘','移动硬盘盒','数位板','电脑散热底座','有线耳机','运动相机配件'],
'运动':['羽毛球拍','羽毛球筒','篮球','足球','排球','瑜伽垫','跳绳','护膝','网球拍','乒乓球拍','弹力训练带','运动水壶','露营折叠椅','登山杖','骑行头盔','健身哑铃'],
'生活':['护眼台灯','桌面收纳盒','保温杯','折叠衣架','床头置物架','帆布购物袋','雨伞','手持小电扇','宿舍地垫','书桌时钟','毛毯','便携餐盒','香薰摆件','陶瓷马克杯','书立','床上小桌板'],
'衣物':['连帽卫衣','牛仔外套','针织开衫','运动短袖','纯棉衬衫','休闲长裤','帆布鞋','棒球帽','双肩背包','斜挎包','围巾','轻便雨衣','运动外套','针织帽'],
'其他':['拼图玩具','桌游卡牌','吉他调音器','尤克里里琴包','手工材料包','水彩颜料','马克笔套装','画板','胶片相册','多肉花盆','钥匙收纳包','便携工具盒','礼品包装盒','旅行收纳袋']}
colors={'教材':('#e8dbc4','#836849'),'数码':('#cbd9d5','#476d66'),'运动':('#e7d2b9','#ad694a'),'生活':('#e7dfc9','#a38350'),'衣物':('#d9d1c5','#79645e'),'其他':('#d3dbd2','#748876')}
fontfile='C:/Windows/Fonts/msyh.ttc';bold='C:/Windows/Fonts/msyhbd.ttc'
large=ImageFont.truetype(bold,31);small=ImageFont.truetype(fontfile,18);tiny=ImageFont.truetype(fontfile,14)
rows=[]
for cat,names in words.items():
 for n in names:
  for variant in ['经典款','轻巧款']:
   title=n+' · '+variant;key='catalog-v1-'+str(len(rows)+1).zfill(3);filename=hashlib.sha256(key.encode()).hexdigest()[:32]+'.png';base,ink=colors[cat]
   im=Image.new('RGB',(520,390),base);d=ImageDraw.Draw(im)
   d.rounded_rectangle((20,20,500,370),radius=18,fill='#f8f4e8',outline='#b8a88c',width=2)
   d.rounded_rectangle((42,42,478,254),radius=12,fill=base)
   idx=len(rows)%4; cx,cy=260,148
   if cat=='教材':
    d.rounded_rectangle((185,75,330,222),radius=8,fill=ink);d.rectangle((207,89,318,208),fill='#f8f4e8');d.line((227,119,294,119),fill=ink,width=5);d.line((227,143,294,143),fill=ink,width=5);d.line((227,167,277,167),fill=ink,width=5)
   elif cat=='数码':
    d.rounded_rectangle((181,86,339,200),radius=13,fill=ink);d.rounded_rectangle((190,95,330,185),radius=7,fill='#f1f0e8');d.line((211,211,309,211),fill=ink,width=9)
   elif cat=='运动':
    d.ellipse((199,88,321,210),fill='#f5efe2',outline=ink,width=8);d.line((260,94,260,205),fill=ink,width=5);d.arc((205,105,315,195),0,180,fill=ink,width=5);d.arc((205,105,315,195),180,360,fill=ink,width=5)
   elif cat=='生活':
    d.rounded_rectangle((217,92,301,205),radius=12,fill=ink);d.rounded_rectangle((228,100,290,195),radius=7,fill='#f1f0e8');d.arc((284,111,330,164),270,90,fill=ink,width=7)
   elif cat=='衣物':
    d.polygon([(209,84),(235,76),(245,91),(275,91),(285,76),(311,84),(340,118),(315,138),(304,126),(304,217),(216,217),(216,126),(205,138),(180,118)],fill=ink);d.arc((240,75,280,103),0,180,fill='#f1f0e8',width=5)
   else:
    d.rounded_rectangle((196,91,324,206),radius=10,fill=ink);d.rectangle((207,102,313,194),fill='#f1f0e8');d.ellipse((234,120,286,172),outline=ink,width=5);d.line((260,128,260,164),fill=ink,width=4);d.line((242,146,278,146),fill=ink,width=4)
   d.rounded_rectangle((42,276,119,303),radius=5,fill=ink);d.text((52,280),cat,font=tiny,fill='#fff')
   d.text((42,312),title,font=large,fill='#49382c',stroke_width=0);d.text((42,350),'示例商品 · 不参与交换',font=tiny,fill='#786b5a')
   im.save(assets/filename,optimize=True)
   rows.append({'key':key,'title':title,'category':cat,'condition':'九成新' if idx%2==0 else '七成新','description':'【示例商品】'+n+'，'+variant+'，适合校园日常使用。展示图片为示意图，仅供浏览参考。','image':'/api/file/'+filename,'want':'仅供参考'})
assert len(rows)==200,len(rows)
(out/'catalog.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
print('generated',len(rows),'items')
