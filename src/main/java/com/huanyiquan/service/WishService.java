package com.huanyiquan.service;
import com.huanyiquan.common.BizException;
import com.huanyiquan.dao.SensitiveWordDao;
import com.huanyiquan.db.DBUtil;
import java.time.LocalDateTime;
import java.util.*;
public final class WishService {
 private WishService(){}
 public static List<Map<String,Object>> list(){return list(null);}
 public static List<Map<String,Object>> list(Long id){return DBUtil.query("SELECT w.id,w.user_id,w.title,w.content,w.category,w.created_at,u.nickname,o.item_id AS offered_item_id FROM wish_post w JOIN `user` u ON u.id=w.user_id LEFT JOIN wish_offer o ON o.wish_id=w.id WHERE w.status=1 "+(id==null?"ORDER BY w.id DESC LIMIT 100":"AND w.id=?"),rs->{Map<String,Object>m=new LinkedHashMap<>();m.put("id",rs.getLong(1));m.put("userId",rs.getLong(2));m.put("title",rs.getString(3));m.put("content",rs.getString(4));m.put("category",rs.getString(5));m.put("createdAt",rs.getObject(6,LocalDateTime.class).toString());m.put("nickname",rs.getString(7));m.put("offeredItemId",rs.getObject("offered_item_id"));return m;},id==null?new Object[0]:new Object[]{id});}
 public static long create(long user,String title,String content,String category){
  return create(user,title,content,category,null);
 }
 public static long create(long user,String title,String content,String category,Long offeredItemId){
  String t=title==null?"":title.trim(),d=content==null?"":content.trim(),c=category==null?"":category.trim();
  if(t.isEmpty()||t.length()>100||d.length()>500||c.length()>20)throw BizException.badRequest("标题需为 1 至 100 字，描述最多 500 字");
  if(!c.isEmpty()&&!ItemService.CATEGORIES.contains(c))throw BizException.badRequest("请选择有效类别");
  SensitiveWordDao.check(t,"标题");SensitiveWordDao.check(d,"描述");
  return DBUtil.tx(connection -> {
   if(offeredItemId!=null && DBUtil.queryOne(connection,
       "SELECT id FROM item WHERE id=? AND owner_id=? AND status=1 AND deleted=0 AND is_demo=0 AND allow_cycle=1 FOR UPDATE",
       rs->rs.getLong(1),offeredItemId,user)==null) throw BizException.badRequest("请选择自己开启闭环交换的在架物品");
   long id=DBUtil.insert(connection,"INSERT INTO wish_post(user_id,title,content,category) VALUES(?,?,?,?)",user,t,d,c);
   if(offeredItemId!=null) DBUtil.update(connection,"INSERT INTO wish_offer(wish_id,item_id) VALUES(?,?)",id,offeredItemId);
   return id;
  });
 }
 static final class RelayWish {
  final long itemId, owner;
  final String title, category;
  RelayWish(long itemId,long owner,String title,String category) {
   this.itemId=itemId; this.owner=owner; this.title=title; this.category=category;
  }
  boolean wants(com.huanyiquan.entity.Item item) {
   return (category==null||category.isEmpty()||category.equals(item.category)) && WishMatchService.matches(title,item.title);
  }
 }
 static List<RelayWish> relayWishes(){
  return DBUtil.query("SELECT i.id,i.owner_id,w.title,w.category FROM wish_offer o JOIN wish_post w ON w.id=o.wish_id "
      +"JOIN item i ON i.id=o.item_id AND i.owner_id=w.user_id WHERE w.status=1 AND i.status=1 AND i.deleted=0 AND i.is_demo=0 AND i.allow_cycle=1",
      rs->new RelayWish(rs.getLong(1),rs.getLong(2),rs.getString(3),rs.getString(4)));
 }
 public static void close(long user,long id){if(DBUtil.update("UPDATE wish_post SET status=0 WHERE id=? AND user_id=? AND status=1",id,user)==0)throw BizException.badRequest("求换不存在或无权关闭");}
}
