package com.huanyiquan.service;
import com.huanyiquan.common.BizException;
import com.huanyiquan.common.ImageCheck;
import com.huanyiquan.dao.SensitiveWordDao;
import com.huanyiquan.dao.OfferDao;
import java.sql.Connection;
import com.huanyiquan.db.DBUtil;
import java.time.LocalDateTime;
import java.util.*;
public final class ConversationService {
 private ConversationService() {}
 public static long start(long user,long item) {
  Map<String,Object> v=DBUtil.queryOne("SELECT owner_id,status,is_demo FROM item WHERE id=? AND deleted=0",rs->{Map<String,Object>m=new HashMap<>();m.put("owner",rs.getLong(1));m.put("status",rs.getInt(2));m.put("demo",rs.getBoolean(3));return m;},item);
  if(v==null||((Number)v.get("status")).intValue()!=1||Boolean.TRUE.equals(v.get("demo")))throw BizException.badRequest("只能联系真实在架物品的发布者");
  long owner=((Number)v.get("owner")).longValue();if(owner==user)throw BizException.badRequest("不能联系自己");
  return DBUtil.tx(c -> {
   long id = ensure(c, item, owner, user);
   DBUtil.update(c,"UPDATE item_conversation_state SET hidden=0 WHERE conversation_id=? AND user_id=? AND hidden=1",id,user);
   return id;
  });
 }
 static long ensure(Connection c,long item,long seller,long buyer) {
  DBUtil.update(c,"INSERT INTO item_conversation(item_id,seller_id,buyer_id) VALUES(?,?,?) ON DUPLICATE KEY UPDATE id=id",item,seller,buyer);
  return DBUtil.queryOne(c,"SELECT id FROM item_conversation WHERE item_id=? AND buyer_id=?",rs->rs.getLong(1),item,buyer);
 }
 static void recordProposal(Connection c,long id,long sender,long recipient,String text,String title) {
  lockConversation(c,id);
  DBUtil.update(c,"UPDATE item_conversation_state SET hidden=0 WHERE conversation_id=? AND hidden=1",id);
  DBUtil.insert(c,"INSERT INTO private_message(conversation_id,sender_id,kind,content,image) VALUES(?,?,'text',?,'')",id,sender,text);
  NotificationService.send(c,recipient,title,text,"#/chat/"+id);
 }
 private static Map<String,Object> thread(long user,long id){
  Map<String,Object>t=DBUtil.queryOne("SELECT c.id,c.item_id,c.seller_id,c.buyer_id,i.title,s.nickname,b.nickname,i.images FROM item_conversation c JOIN item i ON i.id=c.item_id JOIN user s ON s.id=c.seller_id JOIN user b ON b.id=c.buyer_id WHERE c.id=?",rs->{Map<String,Object>m=new LinkedHashMap<>();m.put("id",rs.getLong(1));m.put("itemId",rs.getLong(2));m.put("sellerId",rs.getLong(3));m.put("buyerId",rs.getLong(4));m.put("title",rs.getString(5));m.put("seller",rs.getString(6));m.put("buyer",rs.getString(7));m.put("images",rs.getString(8));return m;},id);
  if(t==null)throw BizException.notFound("会话不存在");
  boolean isSeller=((Number)t.get("sellerId")).longValue()==user;
  if(!isSeller&&((Number)t.get("buyerId")).longValue()!=user)throw BizException.forbidden("无权查看会话");
  t.put("peerId",t.get(isSeller?"buyerId":"sellerId"));
  t.put("peer",t.get(isSeller?"buyer":"seller"));
  return t;
 }
 public static List<Map<String,Object>> list(long user) {
  return DBUtil.query("SELECT c.id,c.item_id,i.title,i.images,c.seller_id,c.buyer_id,"
       + " s.nickname AS seller,b.nickname AS buyer,m.content,m.kind,"
       + " COALESCE(m.created_at,c.created_at) AS last_at,COALESCE(st.pinned,0) AS pinned"
       + " FROM item_conversation c"
       + " JOIN item i ON i.id=c.item_id"
       + " JOIN user s ON s.id=c.seller_id"
       + " JOIN user b ON b.id=c.buyer_id"
       + " LEFT JOIN item_conversation_state st ON st.conversation_id=c.id AND st.user_id=?"
       + " LEFT JOIN private_message m ON m.id=("
       + " SELECT MAX(pm.id) FROM private_message pm WHERE pm.conversation_id=c.id"
       + " )"
       + " WHERE (c.seller_id=? OR c.buyer_id=?) AND COALESCE(st.hidden,0)=0"
       + " ORDER BY pinned DESC,last_at DESC,COALESCE(m.id,0) DESC,c.id DESC LIMIT 100", rs -> {
   boolean isSeller = rs.getLong("seller_id") == user;
   Map<String,Object> row = new LinkedHashMap<>();
   row.put("id", rs.getLong("id"));
   row.put("itemId", rs.getLong("item_id"));
   row.put("title", rs.getString("title"));
   row.put("images", rs.getString("images"));
   row.put("peer", rs.getString(isSeller ? "buyer" : "seller"));
   row.put("peerId", rs.getLong(isSeller ? "buyer_id" : "seller_id"));
   row.put("lastText", "image".equals(rs.getString("kind")) ? "[图片]" : rs.getString("content"));
   row.put("lastAt", rs.getObject("last_at", LocalDateTime.class).toString());
   row.put("pinned", rs.getBoolean("pinned"));
   return row;
  }, user,user,user);
 }
 public static void pin(long user,long id,boolean pinned) {
  thread(user,id);
  DBUtil.update("INSERT INTO item_conversation_state(conversation_id,user_id,pinned)"
       + " VALUES(?,?,?) ON DUPLICATE KEY UPDATE pinned=?",id,user,pinned,pinned);
 }
 public static void hide(long user,long id) {
  thread(user,id);
  DBUtil.tx(c -> {
   lockConversation(c,id);
   DBUtil.update(c,"INSERT INTO item_conversation_state(conversation_id,user_id,hidden)"
       + " VALUES(?,?,1) ON DUPLICATE KEY UPDATE hidden=1,pinned=0",id,user);
   DBUtil.update(c,"UPDATE notification SET is_read=1 WHERE user_id=? AND target=? AND is_read=0",
       user,"#/chat/"+id);
   return null;
  });
 }
 private static void lockConversation(java.sql.Connection c,long id) {
  DBUtil.queryOne(c,"SELECT id FROM item_conversation WHERE id=? FOR UPDATE",rs -> rs.getLong(1),id);
 }
 public static void read(long user,long id){
  thread(user,id);
  NotificationService.readTarget(user,"#/chat/"+id);
 }
 public static Map<String,Object> get(long user,long id){
  Map<String,Object>t=thread(user,id);NotificationService.readTarget(user,"#/chat/"+id);List<Map<String,Object>> ms=DBUtil.query("SELECT m.id,m.sender_id,m.kind,m.content,m.image,m.created_at,u.nickname FROM private_message m JOIN user u ON u.id=m.sender_id WHERE m.conversation_id=? ORDER BY m.id DESC LIMIT 100",rs->{Map<String,Object>m=new LinkedHashMap<>();m.put("id",rs.getLong(1));m.put("senderId",rs.getLong(2));m.put("kind",rs.getString(3));m.put("content",rs.getString(4));m.put("image",rs.getString(5));m.put("createdAt",rs.getObject(6,LocalDateTime.class).toString());m.put("nickname",rs.getString(7));return m;},id);Collections.reverse(ms);t.put("messages",ms);t.put("offer",OfferDao.latestForConversation(id));return t;
 }
 public static void send(long user,long id,String kind,String content,String image){
  Map<String,Object> t=thread(user,id);String text=content==null?"":content.trim();if(text.length()>500)throw BizException.badRequest("消息最多 500 字");SensitiveWordDao.check(text,"消息");
  if("image".equals(kind)){ImageCheck.requireImages(image);if(image.contains(","))throw BizException.badRequest("每次发送一张图片");}else if("text".equals(kind)){if(text.isEmpty())throw BizException.badRequest("消息不能为空");image="";}else throw BizException.badRequest("消息类型不支持");
  final String img=image;long peer=((Number)t.get("sellerId")).longValue()==user?((Number)t.get("buyerId")).longValue():((Number)t.get("sellerId")).longValue();
  DBUtil.tx(c->{lockConversation(c,id);DBUtil.update(c,"UPDATE item_conversation_state SET hidden=0 WHERE conversation_id=? AND hidden=1",id);DBUtil.insert(c,"INSERT INTO private_message(conversation_id,sender_id,kind,content,image) VALUES(?,?,?,?,?)",id,user,kind,text,img);NotificationService.send(c,peer,"收到物品私信","你有一条关于「"+t.get("title")+"」的新消息。","#/chat/"+id);return null;});
 }
 public static List<Map<String,Object>> ringMessages(long user,long id){assertRing(user,id);List<Map<String,Object>>m=DBUtil.query("SELECT m.id,m.sender_id,m.content,m.created_at,u.nickname FROM ring_message m JOIN user u ON u.id=m.sender_id WHERE m.exchange_id=? ORDER BY m.id DESC LIMIT 100",rs->{Map<String,Object>x=new LinkedHashMap<>();x.put("id",rs.getLong(1));x.put("senderId",rs.getLong(2));x.put("content",rs.getString(3));x.put("createdAt",rs.getObject(4,LocalDateTime.class).toString());x.put("nickname",rs.getString(5));return x;},id);Collections.reverse(m);return m;}
 private static void assertRing(long user,long id){if(DBUtil.count("SELECT COUNT(*) FROM exchange_detail d JOIN `exchange` e ON e.id=d.exchange_id WHERE e.id=? AND e.type=3 AND d.user_id=?",id,user)==0)throw BizException.forbidden("只有三方参与者能进入协商房间");}
 public static void sendRing(long user,long id,String value){assertRing(user,id);String text=value==null?"":value.trim();if(text.isEmpty()||text.length()>500)throw BizException.badRequest("请输入 1 至 500 字");SensitiveWordDao.check(text,"消息");DBUtil.tx(c->{DBUtil.insert(c,"INSERT INTO ring_message(exchange_id,sender_id,content) VALUES(?,?,?)",id,user,text);NotificationService.exchange(c,id,user,"闭环协商有新消息","三方协商房间有新消息。");return null;});}
}
