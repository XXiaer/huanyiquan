package com.huanyiquan.service;
import com.huanyiquan.db.DBUtil;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.*;
public final class NotificationService {
 private static final String CATEGORY = "CASE WHEN target LIKE '#/offer%' OR target LIKE '#/exchange%' "
         + "OR target LIKE '#/ring/%' OR target LIKE '#/auction%' OR target LIKE '#/item/%' THEN 'trade' ELSE 'notice' END";
 private NotificationService() {}
 public static void send(Connection c,long user,String title,String text,String target){ DBUtil.insert(c,"INSERT INTO notification(user_id,title,content,target) VALUES(?,?,?,?)",user,title,text,target); }
 public static void send(long user,String title,String text,String target){DBUtil.insert("INSERT INTO notification(user_id,title,content,target) VALUES(?,?,?,?)",user,title,text,target);}
 public static void exchange(Connection c,long id,long actor,String title,String text){DBUtil.update(c,"INSERT INTO notification(user_id,title,content,target) SELECT user_id,?,?,? FROM exchange_detail WHERE exchange_id=? AND user_id<>?",title,text,"#/exchange/"+id,id,actor);}
 public static void exchange(long id,long actor,String title,String text){DBUtil.tx(c->{exchange(c,id,actor,title,text);return null;});}
 public static long unread(long user){return DBUtil.count("SELECT COUNT(*) FROM notification WHERE user_id=? AND is_read=0",user);}
 public static List<Map<String,Object>> list(long user){return DBUtil.query("SELECT id,title,content,target,is_read,created_at,"+CATEGORY+" AS category FROM notification WHERE user_id=? ORDER BY id DESC LIMIT 100",rs->{Map<String,Object>m=new LinkedHashMap<>();m.put("id",rs.getLong(1));m.put("title",rs.getString(2));m.put("content",rs.getString(3));m.put("target",rs.getString(4));m.put("read",rs.getInt(5)==1);m.put("category",rs.getString("category"));m.put("createdAt",rs.getObject(6,LocalDateTime.class).toString());return m;},user);}
 public static void readOne(long user,long id){DBUtil.update("UPDATE notification SET is_read=1 WHERE id=? AND user_id=?",id,user);}
 public static void readTarget(long user,String target){DBUtil.update("UPDATE notification SET is_read=1 WHERE user_id=? AND target=? AND is_read=0",user,target);}
 public static Map<String, Long> summary(long user) {
  Map<String, Long> counts = new LinkedHashMap<>();
  counts.put("trade", 0L);
  counts.put("notice", 0L);
  counts.put("follow", 0L);
  DBUtil.query("SELECT " + CATEGORY + " AS category,COUNT(*) AS total FROM notification "
          + "WHERE user_id=? AND is_read=0 GROUP BY " + CATEGORY + "",
          rs -> Map.entry(rs.getString("category"), rs.getLong("total")), user)
          .forEach(entry -> counts.put(entry.getKey(), entry.getValue()));
  counts.put("total", counts.values().stream().mapToLong(Long::longValue).sum());
  return counts;
 }
 public static void readCategory(long user,String category){
  DBUtil.update("UPDATE notification SET is_read=1 WHERE user_id=? AND is_read=0 AND " + CATEGORY + "=?",user,category);
 }
 public static void readAll(long user){DBUtil.update("UPDATE notification SET is_read=1 WHERE user_id=? AND is_read=0",user);}
}
