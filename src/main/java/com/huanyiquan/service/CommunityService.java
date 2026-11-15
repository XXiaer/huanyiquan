package com.huanyiquan.service;
import com.huanyiquan.common.BizException;
import com.huanyiquan.common.ImageCheck;
import com.huanyiquan.dao.SensitiveWordDao;
import com.huanyiquan.db.DBUtil;
import java.time.LocalDateTime;
import java.util.*;
public final class CommunityService {
 private CommunityService() {}
 public static List<Map<String,Object>> list() {
  List<Map<String,Object>> rows=DBUtil.query("SELECT m.*,u.nickname,i.title item_title,i.images item_images,i.status item_status,i.deleted item_deleted FROM community_message m JOIN `user` u ON u.id=m.user_id LEFT JOIN item i ON i.id=m.item_id ORDER BY m.id DESC LIMIT 100",rs->{
   Map<String,Object>m=new LinkedHashMap<>();m.put("id",rs.getLong("id"));m.put("userId",rs.getLong("user_id"));m.put("nickname",rs.getString("nickname"));m.put("kind",rs.getString("kind"));m.put("content",rs.getString("content"));m.put("image",rs.getString("image"));m.put("itemId",rs.getObject("item_id"));m.put("createdAt",rs.getObject("created_at",LocalDateTime.class).toString());
   boolean available=rs.getObject("item_status")!=null&&rs.getInt("item_status")==1&&rs.getInt("item_deleted")==0;
   m.put("itemAvailable",available);if(available){m.put("itemTitle",rs.getString("item_title"));m.put("itemImages",rs.getString("item_images"));}return m;
  }); Collections.reverse(rows);return rows;
 }
 public static long send(long user,String kind,String content,String image,Long itemId) {
  if(!Arrays.asList("text","image","item").contains(kind))throw BizException.badRequest("消息类型不正确");
  String text=content==null?"":content.trim();if(text.length()>500)throw BizException.badRequest("消息最多 500 字");SensitiveWordDao.check(text,"消息");
  if("text".equals(kind)&&text.isEmpty())throw BizException.badRequest("消息不能为空");
  if("image".equals(kind)){ImageCheck.requireImages(image);if(image.contains(","))throw BizException.badRequest("每条消息只能发送一张图片");}else image="";
  if("item".equals(kind)) {if(itemId==null)throw BizException.badRequest("请选择物品");Long found=DBUtil.queryOne("SELECT id FROM item WHERE id=? AND owner_id=? AND status=1 AND deleted=0",rs->rs.getLong(1),itemId,user);if(found==null)throw BizException.badRequest("只能分享自己已上架的物品");} else itemId=null;
  return DBUtil.insert("INSERT INTO community_message(user_id,kind,content,image,item_id) VALUES(?,?,?,?,?)",user,kind,text,image,itemId);
 }
}
