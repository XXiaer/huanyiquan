package com.huanyiquan.service;
import com.huanyiquan.db.DBUtil;
import java.util.*;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
/** Bounded scan; deduplicate by item IDs and review generations, never create an exchange without consent. */
public final class PassiveMatchService {
 private static long cursor=0;
 private PassiveMatchService() {}
 public static void run(){
  List<long[]> items=DBUtil.query("SELECT id,owner_id FROM item WHERE status=1 AND deleted=0 AND is_demo=0 AND allow_cycle=1 AND auto_match=1 AND id>? ORDER BY id LIMIT 100",rs->new long[]{rs.getLong(1),rs.getLong(2)},cursor);
  if(items.isEmpty()){cursor=0;return;}
  for(long[] item:items){cursor=item[0];try{for(Map<String,Object> ring:CycleService.find(item[1],item[0]))notifyRing(ring);}catch(Exception e){System.err.println("[被动匹配] 跳过物品 "+item[0]+": "+e.getMessage());}}
 }
 public static void checkItemAsync(long itemId){
  Thread t=new Thread(()->{
   try{
    Long owner=DBUtil.queryOne("SELECT owner_id FROM item WHERE id=? AND status=1 AND deleted=0 AND is_demo=0 AND allow_cycle=1 AND auto_match=1",rs->rs.getLong(1),itemId);
    if(owner==null)return;
    for(Map<String,Object> ring:CycleService.find(owner,itemId))notifyRing(ring);
   }catch(Exception e){System.err.println("[即时匹配] 跳过物品 "+itemId+": "+e.getMessage());}
  },"ring-check-"+itemId);
  t.setDaemon(true);t.start();
 }
 private static void notifyRing(Map<String,Object> ring)throws Exception{
  @SuppressWarnings("unchecked") List<Long> raw=(List<Long>)ring.get("itemIds");if(raw==null||raw.size()!=3)return;
  List<Long> ids=new ArrayList<>();for(Object x:raw)ids.add(((Number)x).longValue());Collections.sort(ids);
  List<Map<String,Object>> versions=DBUtil.query("SELECT id,owner_id,review_submitted_at FROM item WHERE id IN (?,?,?) AND status=1 AND deleted=0 AND is_demo=0 AND allow_cycle=1 AND auto_match=1 ORDER BY id",rs->{Map<String,Object>m=new HashMap<>();m.put("id",rs.getLong(1));m.put("owner",rs.getLong(2));m.put("generation",rs.getString(3));return m;},ids.get(0),ids.get(1),ids.get(2));
  if(versions.size()!=3)return;
  StringBuilder data=new StringBuilder();for(Map<String,Object>x:versions)data.append(x.get("id")).append(':').append(x.get("generation")).append('|');
  byte[] digest=MessageDigest.getInstance("SHA-256").digest(data.toString().getBytes(StandardCharsets.UTF_8));StringBuilder key=new StringBuilder();for(byte b:digest)key.append(String.format("%02x",b&255));
  DBUtil.tx(c->{
   for(Map<String,Object>x:versions){String generation=DBUtil.queryOne(c,"SELECT COALESCE(CAST(review_submitted_at AS CHAR),'') FROM item WHERE id=? AND status=1 AND deleted=0 AND is_demo=0 AND allow_cycle=1 AND auto_match=1 FOR UPDATE",rs->rs.getString(1),x.get("id"));String expected=x.get("generation")==null?"":x.get("generation").toString();if(generation==null||!generation.equals(expected))return null;}
   int inserted=DBUtil.update(c,"INSERT IGNORE INTO ring_match_notice(ring_key) VALUES(?)",key.toString());if(inserted==1){for(Map<String,Object>x:versions)NotificationService.send(c,((Number)x.get("owner")).longValue(),"发现可闭环的交换","你的物品找到一组可能的三方交换，查看后可自主发起。","#/cycle/"+x.get("id"));}return null;});
 }
}
