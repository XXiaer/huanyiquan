package com.huanyiquan.service;
import com.huanyiquan.common.BizException;
import com.huanyiquan.common.ImageCheck;
import com.huanyiquan.dao.SensitiveWordDao;
import com.huanyiquan.db.DBUtil;
import java.time.LocalDateTime;
import java.util.*;
public final class ConversationService {
 private ConversationService() {}
 public static long start(long user,long item) {
  Map<String,Object> v=DBUtil.queryOne("SELECT owner_id,status,is_demo FROM item WHERE id=? AND deleted=0",rs->{Map<String,Object>m=new HashMap<>();m.put("owner",rs.getLong(1));m.put("status",rs.getInt(2));m.put("demo",rs.getBoolean(3));return m;},item);
  if(v==null||((Number)v.get("status")).intValue()!=1||Boolean.TRUE.equals(v.get("demo")))throw BizException.badRequest("只能联系真实在架物品的发布者");
  long owner=((Number)v.get("owner")).longValue();if(owner==user)throw BizException.badRequest("不能联系自己");
  DBUtil.update("INSERT INTO item_conversation(item_id,seller_id,buyer_id) VALUES(?,?,?) ON DUPLICATE KEY UPDATE id=id",item,owner,user);
  return DBUtil.queryOne("SELECT id FROM item_conversation WHERE item_id=? AND buyer_id=?",rs->rs.getLong(1),item,user);
 }
 private static Map<String,Object> thread(long user,long id){
  Map<String,Object>t=DBUtil.queryOne("SELECT c.id,c.item_id,c.seller_id,c.buyer_id,i.title,s.nickname,b.nickname,i.images FROM item_conversation c JOIN item i ON i.id=c.item_id JOIN user s ON s.id=c.seller_id JOIN user b ON b.id=c.buyer_id WHERE c.id=?",rs->{Map<String,Object>m=new LinkedHashMap<>();m.put("id",rs.getLong(1));m.put("itemId",rs.getLong(2));m.put("sellerId",rs.getLong(3));m.put("buyerId",rs.getLong(4));m.put("title",rs.getString(5));m.put("seller",rs.getString(6));m.put("buyer",rs.getString(7));m.put("images",rs.getString(8));return m;},id);
  if(t==null)throw BizException.notFound("会话不存在");if(((Number)t.get("sellerId")).longValue()!=user&&((Number)t.get("buyerId")).longValue()!=user)throw BizException.forbidden("无权查看会话");return t;
 }
 public static List<Map<String,Object>> list(long user){return DBUtil.query("SELECT c.id,c.item_id,i.title,s.nickname,b.nickname,c.seller_id,c.buyer_id,(SELECT MAX(id) FROM private_message m WHERE m.conversation_id=c.id) last_id,(SELECT content FROM private_message m WHERE m.conversation_id=c.id ORDER BY m.id DESC LIMIT 1) last_text FROM item_conversation c JOIN item i ON i.id=c.item_id JOIN user s ON s.id=c.seller_id JOIN user b ON b.id=c.buyer_id WHERE c.seller_id=? OR c.buyer_id=? ORDER BY COALESCE(last_id,0) DESC,c.id DESC LIMIT 100",rs->{Map<String,Object>m=new LinkedHashMap<>();m.put("id",rs.getLong(1));m.put("itemId",rs.getLong(2));m.put("title",rs.getString(3));m.put("peer",rs.getLong(6)==user?rs.getString(5):rs.getString(4));m.put("lastText",rs.getString(9));return m;},user,user);}
 public static void read(long user,long id){
  thread(user,id);
  NotificationService.readTarget(user,"#/chat/"+id);
 }
 public static Map<String,Object> get(long user,long id){
  Map<String,Object>t=thread(user,id);NotificationService.readTarget(user,"#/chat/"+id);List<Map<String,Object>> ms=DBUtil.query("SELECT m.id,m.sender_id,m.kind,m.content,m.image,m.created_at,u.nickname FROM private_message m JOIN user u ON u.id=m.sender_id WHERE m.conversation_id=? ORDER BY m.id DESC LIMIT 100",rs->{Map<String,Object>m=new LinkedHashMap<>();m.put("id",rs.getLong(1));m.put("senderId",rs.getLong(2));m.put("kind",rs.getString(3));m.put("content",rs.getString(4));m.put("image",rs.getString(5));m.put("createdAt",rs.getObject(6,LocalDateTime.class).toString());m.put("nickname",rs.getString(7));return m;},id);Collections.reverse(ms);t.put("messages",ms);return t;
 }
 public static void send(long user,long id,String kind,String content,String image){
  Map<String,Object> t=thread(user,id);String text=content==null?"":content.trim();if(text.length()>500)throw BizException.badRequest("消息最多 500 字");SensitiveWordDao.check(text,"消息");
  if("image".equals(kind)){ImageCheck.requireImages(image);if(image.contains(","))throw BizException.badRequest("每次发送一张图片");}else if("text".equals(kind)){if(text.isEmpty())throw BizException.badRequest("消息不能为空");image="";}else throw BizException.badRequest("消息类型不支持");
  final String img=image;long peer=((Number)t.get("sellerId")).longValue()==user?((Number)t.get("buyerId")).longValue():((Number)t.get("sellerId")).longValue();
  DBUtil.tx(c->{DBUtil.insert(c,"INSERT INTO private_message(conversation_id,sender_id,kind,content,image) VALUES(?,?,?,?,?)",id,user,kind,text,img);NotificationService.send(c,peer,"收到物品私信","你有一条关于「"+t.get("title")+"」的新消息。","#/chat/"+id);return null;});
 }
 public static List<Map<String,Object>> ringMessages(long user,long id){assertRing(user,id);List<Map<String,Object>>m=DBUtil.query("SELECT m.id,m.sender_id,m.content,m.created_at,u.nickname FROM ring_message m JOIN user u ON u.id=m.sender_id WHERE m.exchange_id=? ORDER BY m.id DESC LIMIT 100",rs->{Map<String,Object>x=new LinkedHashMap<>();x.put("id",rs.getLong(1));x.put("senderId",rs.getLong(2));x.put("content",rs.getString(3));x.put("createdAt",rs.getObject(4,LocalDateTime.class).toString());x.put("nickname",rs.getString(5));return x;},id);Collections.reverse(m);return m;}
 private static void assertRing(long user,long id){if(DBUtil.count("SELECT COUNT(*) FROM exchange_detail d JOIN `exchange` e ON e.id=d.exchange_id WHERE e.id=? AND e.type=3 AND d.user_id=?",id,user)==0)throw BizException.forbidden("只有三方参与者能进入协商房间");}
 public static void sendRing(long user,long id,String value){assertRing(user,id);String text=value==null?"":value.trim();if(text.isEmpty()||text.length()>500)throw BizException.badRequest("请输入 1 至 500 字");SensitiveWordDao.check(text,"消息");DBUtil.tx(c->{DBUtil.insert(c,"INSERT INTO ring_message(exchange_id,sender_id,content) VALUES(?,?,?)",id,user,text);NotificationService.exchange(c,id,user,"闭环协商有新消息","三方协商房间有新消息。");return null;});}
}
