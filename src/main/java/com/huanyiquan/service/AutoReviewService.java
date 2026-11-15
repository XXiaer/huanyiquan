package com.huanyiquan.service;
import com.huanyiquan.common.ImageCheck;
import com.huanyiquan.db.DBUtil;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
public final class AutoReviewService {
 private AutoReviewService() {}
 public static void run() {
  List<Map<String,Object>> items=DBUtil.query("SELECT id,images,owner_id FROM item WHERE status=5 AND deleted=0 AND review_submitted_at<=DATE_SUB(NOW(), INTERVAL 5 MINUTE) LIMIT 100",rs->{Map<String,Object>m=new HashMap<>();m.put("id",rs.getLong(1));m.put("image",rs.getString(2));m.put("owner",rs.getLong(3));return m;});
  for(Map<String,Object> row:items){ try {String image=(String)row.get("image");ImageCheck.requireImages(image);long itemId=((Number)row.get("id")).longValue();DBUtil.tx(c->{int changed=DBUtil.update(c,"UPDATE item SET status=1 WHERE id=? AND status=5 AND images=? AND review_submitted_at<=DATE_SUB(NOW(), INTERVAL 5 MINUTE)",itemId,image);if(changed==1)NotificationService.send(c,((Number)row.get("owner")).longValue(),"物品审核通过","你的物品已自动审核并上架。","#/item/"+itemId);return null;});PassiveMatchService.checkItemAsync(itemId);}catch(Exception e){System.err.println("[自动审核] 物品未通过图片校验: "+row.get("id"));} }

  List<Long> auctions=DBUtil.query("SELECT id FROM auction WHERE status=0 AND created_at<=NOW()-INTERVAL 5 MINUTE AND image<>'' ORDER BY id LIMIT 100",rs->rs.getLong(1));
  for(long id:auctions){
   try { AuctionService.review(id,true); }
   catch(com.huanyiquan.common.BizException e){ System.err.println("[拍卖自动审核] "+id+": "+e.getMessage()); }
  }

 }
}
