package com.huanyiquan.servlet;
import com.huanyiquan.common.*;
import com.huanyiquan.service.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.*;
public class ConversationServlet extends BaseServlet {
 @Override protected void doGet(HttpServletRequest req,HttpServletResponse resp)throws IOException{List<String>p=segs(req);long user=uid(req);if(p.isEmpty()){ok(resp,ConversationService.list(user));return;}if(p.size()==2&&"ring".equals(p.get(0))){ok(resp,ConversationService.ringMessages(user,segLong(p,1)));return;}if(p.size()==1){ok(resp,ConversationService.get(user,segLong(p,0)));return;}throw notFound();}
 @Override protected void doPost(HttpServletRequest req,HttpServletResponse resp)throws IOException{List<String>p=segs(req);Params data=Params.of(req);long user=uid(req);if(p.size()==1&&"start".equals(p.get(0))){Long item=data.lng("itemId");if(item==null)throw BizException.badRequest("缺少物品");ok(resp,Collections.singletonMap("id",ConversationService.start(user,item)));return;}if(p.size()==2&&"pin".equals(p.get(1))){ConversationService.pin(user,segLong(p,0),"true".equalsIgnoreCase(data.str("pinned")));ok(resp,null);return;}if(p.size()==2&&"read".equals(p.get(1))){ConversationService.read(user,segLong(p,0));ok(resp,null);return;}if(p.size()==2&&"ring".equals(p.get(0))){ConversationService.sendRing(user,segLong(p,1),data.str("content"));ok(resp,null);return;}if(p.size()==1){ConversationService.send(user,segLong(p,0),data.str("kind"),data.str("content"),data.str("image"));ok(resp,null);return;}throw notFound();}
 @Override
 protected void doDelete(HttpServletRequest req,HttpServletResponse resp)throws IOException {
  List<String> path = segs(req);
  if (path.size() != 1) throw notFound();
  ConversationService.hide(uid(req),segLong(path,0));
  ok(resp,null);
 }
}
