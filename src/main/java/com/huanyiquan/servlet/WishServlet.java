package com.huanyiquan.servlet;
import com.huanyiquan.common.*;
import com.huanyiquan.service.WishService;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.*;
public class WishServlet extends BaseServlet {
 @Override protected void doGet(HttpServletRequest req,HttpServletResponse resp)throws IOException{uid(req);List<String> p=segs(req);if(p.size()>1)throw notFound();ok(resp,p.isEmpty()?WishService.list():WishService.list(segLong(p,0)));}
 @Override protected void doPost(HttpServletRequest req,HttpServletResponse resp)throws IOException{List<String>p=segs(req);long user=uid(req);if(p.isEmpty()){Params d=Params.of(req);ok(resp,Collections.singletonMap("id",WishService.create(user,d.str("title"),d.str("content"),d.str("category"),d.lng("offeredItemId"))));return;}if(p.size()==2&&"close".equals(p.get(1))){WishService.close(user,segLong(p,0));ok(resp,null);return;}throw notFound();}
}
