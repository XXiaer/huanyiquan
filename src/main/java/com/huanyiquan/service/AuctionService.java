package com.huanyiquan.service;
import com.huanyiquan.common.BizException;
import com.huanyiquan.common.ImageCheck;
import com.huanyiquan.db.DBUtil;
import java.math.*;
import java.time.LocalDateTime;
import java.util.*;

public final class AuctionService {
 private AuctionService() {}
 private static BigDecimal money(String value) {
  try { BigDecimal n=new BigDecimal(value).setScale(2,RoundingMode.UNNECESSARY); if(n.signum()<=0 || n.compareTo(new BigDecimal("1000000"))>0) throw new Exception(); return n; }
  catch(Exception e) { throw BizException.badRequest("金额须大于 0 且不超过 1000000 元，最多两位小数"); }
 }
 private static List<Map<String,Object>> query(String where, Object... args) {
  return DBUtil.query("SELECT a.*,u.nickname seller_name,b.nickname bidder_name,(SELECT COUNT(*) FROM auction_bid ab WHERE ab.auction_id=a.id) bid_count,s.amount selected_amount,w.nickname winner_name FROM auction a JOIN `user` u ON u.id=a.seller_id LEFT JOIN `user` b ON b.id=a.high_bidder_id LEFT JOIN auction_bid s ON s.id=a.selected_bid_id LEFT JOIN `user` w ON w.id=s.bidder_id " + where + " ORDER BY a.id DESC LIMIT 100",rs->{
   Map<String,Object> m=new LinkedHashMap<>(); int status=rs.getInt("status"); LocalDateTime end=rs.getObject("ends_at",LocalDateTime.class);
   m.put("id",rs.getLong("id"));m.put("sellerId",rs.getLong("seller_id"));m.put("seller",rs.getString("seller_name"));m.put("title",rs.getString("title"));m.put("description",rs.getString("description"));m.put("image",rs.getString("image"));
   m.put("startPrice",rs.getBigDecimal("start_price"));m.put("currentPrice",rs.getBigDecimal("current_price"));m.put("bidder",rs.getString("bidder_name"));m.put("bidCount",rs.getLong("bid_count"));m.put("endsAt",end.toString());m.put("winner",rs.getString("winner_name"));m.put("selectedAmount",rs.getBigDecimal("selected_amount"));
   m.put("state",status==0?"pending":status==2?"cancelled":status==3?"rejected":status==4?"settled":end.isAfter(LocalDateTime.now())?"active":"ended"); return m;
  },args);
 }
 public static List<Map<String,Object>> list(){return query("WHERE a.status IN (1,2,4)");}
 public static List<Map<String,Object>> mine(long user){return query("WHERE a.seller_id=?",user);}
 public static List<Map<String,Object>> adminList(){return query("");}
 public static long create(long user,String title,String desc,String amount,Integer hours,String image){
  if(title==null||title.trim().isEmpty()||title.length()>80)throw BizException.badRequest("标题须为 1 至 80 字");
  if(desc!=null&&desc.length()>500)throw BizException.badRequest("描述最多 500 字");
  if(hours==null||hours<1||hours>168)throw BizException.badRequest("拍卖时长为 1 至 168 小时");
  ImageCheck.requireImages(image); BigDecimal start=money(amount);
  return DBUtil.insert("INSERT INTO auction(seller_id,title,description,start_price,current_price,ends_at,status,image,duration_hours) VALUES(?,?,?,?,?,?,0,?,?)",user,title.trim(),desc==null?"":desc,start,start,LocalDateTime.now().plusHours(hours),image,hours);
 }
 public static List<Map<String,Object>> bids(long user,long id){
  Long owner=DBUtil.queryOne("SELECT seller_id FROM auction WHERE id=?",rs->rs.getLong(1),id);
  if(owner==null)throw BizException.notFound("拍卖不存在"); if(owner!=user)throw BizException.forbidden("只有发布者能查看报价");
  return DBUtil.query("SELECT b.id,b.amount,b.created_at,u.nickname FROM auction_bid b JOIN `user` u ON u.id=b.bidder_id WHERE b.auction_id=? ORDER BY b.amount DESC,b.id DESC",rs->{Map<String,Object> m=new LinkedHashMap<>();m.put("id",rs.getLong(1));m.put("amount",rs.getBigDecimal(2));m.put("createdAt",rs.getObject(3,LocalDateTime.class).toString());m.put("bidder",rs.getString(4));return m;},id);
 }
 public static void settle(long user,long id,long bidId){ DBUtil.tx(c->{
  Map<String,Object> a=DBUtil.queryOne(c,"SELECT seller_id,status FROM auction WHERE id=? FOR UPDATE",rs->{Map<String,Object> m=new HashMap<>();m.put("owner",rs.getLong(1));m.put("status",rs.getInt(2));return m;},id);
  if(a==null)throw BizException.notFound("拍卖不存在");if(((Number)a.get("owner")).longValue()!=user)throw BizException.forbidden("只有发布者可以结算");if(((Number)a.get("status")).intValue()!=1)throw BizException.badRequest("此拍卖不可结算");
  Long exists=DBUtil.queryOne(c,"SELECT id FROM auction_bid WHERE id=? AND auction_id=?",rs->rs.getLong(1),bidId,id);if(exists==null)throw BizException.badRequest("报价不存在");
  Long winner=DBUtil.queryOne(c,"SELECT bidder_id FROM auction_bid WHERE id=?",rs->rs.getLong(1),bidId);
  DBUtil.update(c,"UPDATE auction SET status=4,selected_bid_id=? WHERE id=?",bidId,id);NotificationService.send(c,winner,"拍卖报价已选中","发布者选择了你的报价，请线下协商交易。","#/auctions");return null; }); }
 public static void bid(long user,long id,String amount){BigDecimal price=money(amount); DBUtil.tx(c->{
  Map<String,Object>a=DBUtil.queryOne(c,"SELECT seller_id,current_price,high_bidder_id,ends_at,status FROM auction WHERE id=? FOR UPDATE",rs->{Map<String,Object>m=new HashMap<>();m.put("seller",rs.getLong(1));m.put("price",rs.getBigDecimal(2));m.put("bidder",rs.getObject(3));m.put("ends",rs.getObject(4,LocalDateTime.class));m.put("status",rs.getInt(5));return m;},id);
  if(a==null)throw BizException.notFound("拍卖不存在");if(((Number)a.get("seller")).longValue()==user)throw BizException.badRequest("不能竞拍自己的物品");if(((Number)a.get("status")).intValue()!=1||!((LocalDateTime)a.get("ends")).isAfter(LocalDateTime.now()))throw BizException.badRequest("拍卖未开始或已结束");
  int compare=price.compareTo((BigDecimal)a.get("price"));if(compare<0||(a.get("bidder")!=null&&compare<=0))throw BizException.badRequest("出价须不低于起拍价，且高于已有出价");
  DBUtil.insert(c,"INSERT INTO auction_bid(auction_id,bidder_id,amount) VALUES(?,?,?)",id,user,price);NotificationService.send(c,((Number)a.get("seller")).longValue(),"拍卖收到新出价","你的拍品收到新的出价。","#/auction/mine");DBUtil.update(c,"UPDATE auction SET current_price=?,high_bidder_id=? WHERE id=?",price,user,id);return null;}); }
 public static void review(long id,boolean approve){
  DBUtil.tx(c->{
   String image=DBUtil.queryOne(c,"SELECT image FROM auction WHERE id=? AND status=0 FOR UPDATE",rs->rs.getString(1),id);
   if(image==null)throw BizException.badRequest("拍卖不在待审核状态");
   if(approve)ImageCheck.requireImages(image);
   DBUtil.update(c,"UPDATE auction SET status=?,ends_at=CASE WHEN ?=1 THEN DATE_ADD(NOW(),INTERVAL duration_hours HOUR) ELSE ends_at END WHERE id=?",approve?1:3,approve?1:0,id);
   Long seller=DBUtil.queryOne(c,"SELECT seller_id FROM auction WHERE id=?",rs->rs.getLong(1),id);
   NotificationService.send(c,seller,approve?"拍卖审核通过":"拍卖审核未通过",approve?"你的拍卖已开始。":"请检查拍品资料后重新发布。","#/auction/mine");
   return null;
  });
 }
 public static void cancel(long id){if(DBUtil.update("UPDATE auction SET status=2 WHERE id=? AND status=1",id)==0)throw BizException.badRequest("拍卖不存在或已结束");}
}
