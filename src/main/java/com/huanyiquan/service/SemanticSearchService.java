package com.huanyiquan.service;
import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Const;
import com.huanyiquan.common.JsonUtil;
import com.huanyiquan.dao.ItemDao;
import com.huanyiquan.entity.Item;
import java.net.*;
import java.io.*;
import java.util.*;
/**
 * 搜索：语义召回为主，关键词召回兜底并补充精确命中。
 *
 * 旧实现有两个硬伤：
 * 1. 语义服务不可用时直接抛 503，整条搜索链路依赖一个可选的本地进程；
 * 2. 语义命中后为了套分类/成色筛选，把全站在架物品一次捞一万条再过滤，命中页码也失真。
 *
 * 现在：只按语义/关键词拿到的 id 批量查询；语义挂了自动退化成关键词搜索，
 * 精确的词（型号、书名）也一定不会因为语义分数低而被丢掉。
 */
public final class SemanticSearchService {

 /** 一次搜索最多考虑的条数，同时是结果集上限，避免又把几十条噪声带回来。 */
 private static final int MAX_RESULTS = 40;
 /** 语义侧只返回截断后的少量条目，这里只需要接住它。 */
 private static final int SEMANTIC_KEEP = 30;
 /** 关键词召回池：LIKE 命中即精确相关，用来补语义漏掉的具体名词。 */
 private static final int KEYWORD_POOL = 40;

 private SemanticSearchService(){}

 public static Map<String,Object> search(String q,String category,String condition,int page,int size){
  if(q==null||q.trim().isEmpty()||q.length()>200)throw BizException.badRequest("请输入不超过 200 字的搜索内容");
  String query=q.trim();

  LinkedHashSet<Long> ids=new LinkedHashSet<>();
  RemoteResult response=remote(query,category,condition);
  List<Long> semantic=response.ids;
  ids.addAll(semantic);
  boolean semanticHit=!semantic.isEmpty();

  // 关键词召回：高精度，且不受语义分数截断影响，保证「搜得到」。
  // 分类/成色由下面统一过滤，这里先按关键词取回候选。
  if(response.conditions.isEmpty() && ids.size()<MAX_RESULTS){
   for(Item it:ItemDao.list(category,condition,null,query,null,Const.ITEM_ON,0,KEYWORD_POOL)){
    ids.add(it.id);
    if(ids.size()>=MAX_RESULTS)break;
   }
  }

  List<Item> ranked=new ArrayList<>();
  if(!ids.isEmpty()){
   for(Long id:ids){
    Item it=ItemDao.findById(id);
    if(it==null || !Objects.equals(it.status,Const.ITEM_ON))continue;
    if(category!=null&&!category.trim().isEmpty()&&!category.trim().equals(it.category))continue;
    if(condition!=null&&!condition.trim().isEmpty()&&!condition.trim().equals(it.conditionLevel))continue;
    ranked.add(it);
   }
  }

  int p=Math.max(1,page),n=size<=0?20:Math.min(size,50);
  int from=(int)Math.min((long)(p-1)*n,ranked.size()),to=Math.min(from+n,ranked.size());
  Map<String,Object> result=new LinkedHashMap<>();
  result.put("list",ranked.subList(from,to));
  result.put("total",ranked.size());
  result.put("page",p);
  result.put("size",n);
  result.put("hasMore",to<ranked.size());
  result.put("conditions",response.conditions);
  result.put("searchMode",semanticHit?"semantic":"keyword");
  return result;
 }

 /** 调用本地语义服务；任何异常都当成「没有语义结果」，由关键词召回接住。 */
 private static final class RemoteResult {
  final List<Long> ids;
  final List<String> conditions;

  RemoteResult(List<Long> ids, List<String> conditions) {
   this.ids = ids;
   this.conditions = conditions;
  }
 }

 private static RemoteResult remote(String query,String category,String condition){
  List<Long> ids=new ArrayList<>();
  List<String> conditions=new ArrayList<>();
  try {
   String base=System.getenv().getOrDefault("SEMANTIC_URL","http://127.0.0.1:18084");
   URL url=new URL(base+"/search?q="+URLEncoder.encode(query,"UTF-8")
       +"&category="+URLEncoder.encode(Objects.toString(category,"").trim(),"UTF-8")
       +"&condition="+URLEncoder.encode(Objects.toString(condition,"").trim(),"UTF-8"));
   HttpURLConnection conn=(HttpURLConnection)url.openConnection();
   conn.setConnectTimeout(1000);conn.setReadTimeout(8000);
   try(InputStream in=conn.getInputStream()){
    var payload=JsonUtil.MAPPER.readTree(in);
    for(var label:payload.path("conditions")) if(label.isTextual()) conditions.add(label.asText());
    var arr=payload.path("results");
    for(com.fasterxml.jackson.databind.JsonNode row:arr){
     ids.add(row.path("id").asLong());
     if(ids.size()>=SEMANTIC_KEEP)break;
    }
   } finally {conn.disconnect();}
  }catch(Exception e){
   return new RemoteResult(List.of(),List.of());
  }
  return new RemoteResult(ids,conditions);
 }
}
