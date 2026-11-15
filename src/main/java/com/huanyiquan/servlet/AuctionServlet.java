package com.huanyiquan.servlet;
import com.huanyiquan.common.Params;
import com.huanyiquan.service.AuctionService;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.List;
public class AuctionServlet extends BaseServlet {
 @Override protected void doGet(HttpServletRequest req,HttpServletResponse resp)throws IOException {List<String> p=segs(req);if(p.isEmpty()){ok(resp,AuctionService.list());return;}if(p.size()==1&&"mine".equals(p.get(0))){ok(resp,AuctionService.mine(uid(req)));return;}if(p.size()==2&&"bids".equals(p.get(1))){ok(resp,AuctionService.bids(uid(req),segLong(p,0)));return;}throw notFound();}
 @Override protected void doPost(HttpServletRequest req,HttpServletResponse resp)throws IOException { 
  long user=uid(req);
  List<String> path=segs(req);
  if(path.isEmpty()){
   Params p=Params.of(req);
   ok(resp,java.util.Map.of("id",AuctionService.create(user,p.str("title"),p.str("description"),p.str("amount"),p.intOf("hours",null),p.str("image"))));
   return;
  }
  if(path.size()==2 && "bid".equals(path.get(1))){
   AuctionService.bid(user,segLong(path,0),Params.of(req).str("amount"));
   ok(resp,null);return;
  }
  if(path.size()==2 && "settle".equals(path.get(1))){
   AuctionService.settle(user,segLong(path,0),Params.of(req).lngOr("bidId",0));
   ok(resp,null);return;
  }
  throw notFound();
  }
}
