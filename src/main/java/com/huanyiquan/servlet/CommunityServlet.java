package com.huanyiquan.servlet;
import com.huanyiquan.common.Params;
import com.huanyiquan.service.CommunityService;
import jakarta.servlet.http.*;
import java.io.IOException;
public class CommunityServlet extends BaseServlet {
 @Override protected void doGet(HttpServletRequest req,HttpServletResponse resp)throws IOException {uid(req);ok(resp,CommunityService.list());}
 @Override protected void doPost(HttpServletRequest req,HttpServletResponse resp)throws IOException {Params p=Params.of(req);long id=CommunityService.send(uid(req),p.str("kind"),p.str("content"),p.str("image"),p.lng("itemId"));ok(resp,java.util.Collections.singletonMap("id",id));}
}
