package com.huanyiquan.servlet;
import com.huanyiquan.service.NotificationService;
import com.huanyiquan.common.Params;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.*;
public class NotificationServlet extends BaseServlet {
 @Override protected void doGet(HttpServletRequest req,HttpServletResponse resp)throws IOException {List<String>p=segs(req);if(p.isEmpty()){ok(resp,NotificationService.list(uid(req)));return;}if(p.size()==1&&"unread".equals(p.get(0))){ok(resp,Collections.singletonMap("count",NotificationService.unread(uid(req))));return;}if(p.size()==1&&"summary".equals(p.get(0))){ok(resp,NotificationService.summary(uid(req)));return;}throw notFound();}
 @Override protected void doPost(HttpServletRequest req,HttpServletResponse resp)throws IOException {List<String>p=segs(req);if(p.size()==1&&"read".equals(p.get(0))){String category=Params.of(req).str("category");if(category==null||category.isBlank())NotificationService.readAll(uid(req));else NotificationService.readCategory(uid(req),category);ok(resp,null);return;}if(p.size()==2&&"read".equals(p.get(1))){NotificationService.readOne(uid(req),segLong(p,0));ok(resp,null);return;}throw notFound();}
}
