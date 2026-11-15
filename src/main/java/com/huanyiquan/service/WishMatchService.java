package com.huanyiquan.service;

import com.huanyiquan.db.DBUtil;
import java.text.Normalizer;
import java.util.Locale;

public final class WishMatchService {
    private WishMatchService() {}
    private static long cursor;
    private static final class Entry {
        final long id, owner;
        final String title, category;
        Entry(long id,long owner,String title,String category){this.id=id;this.owner=owner;this.title=title;this.category=category;}
    }
    static String normalize(String value) {
        return Normalizer.normalize(value,Normalizer.Form.NFKC).toLowerCase(Locale.ROOT)
            .replaceAll("[^\\p{L}\\p{N}]", "")
            .replaceFirst("^(我想要|想要|求换|求购|求|想换)?(一本|一个|一件|一套)?", "")
            .replaceAll("高等数学","高数").replaceFirst("(教材|课本|教科书)$","");
    }
    static boolean matches(String wish, String item) {
        String a=normalize(wish),b=normalize(item);
        return a.length()>=2 && b.contains(a);
    }
    public static void run() {
        var wishes=DBUtil.query("SELECT id,user_id,title,category FROM wish_post w WHERE status=1 AND id>? AND NOT EXISTS (SELECT 1 FROM wish_offer o WHERE o.wish_id=w.id) ORDER BY id LIMIT 40",
            r->new Entry(r.getLong(1),r.getLong(2),r.getString(3),r.getString(4)),cursor);
        if(wishes.isEmpty()){cursor=0;return;}
        var items=DBUtil.query("SELECT id,owner_id,title,category FROM item WHERE status=1 AND deleted=0 AND is_demo=0",
            r->new Entry(r.getLong(1),r.getLong(2),r.getString(3),r.getString(4)));
        for(var w:wishes) for(var i:items) {
            if(w.owner==i.owner || (w.category!=null&&!w.category.isEmpty()&&!w.category.equals(i.category)) || !matches(w.title,i.title))continue;
            DBUtil.tx(c->{
                if(DBUtil.queryOne(c,"SELECT id FROM wish_post WHERE id=? AND status=1 AND title=? FOR UPDATE",r->r.getLong(1),w.id,w.title)==null)return null;
                if(DBUtil.queryOne(c,"SELECT id FROM item WHERE id=? AND status=1 AND deleted=0 AND is_demo=0 AND title=? FOR UPDATE",r->r.getLong(1),i.id,i.title)==null)return null;
                if(DBUtil.update(c,"INSERT IGNORE INTO wish_match_notice(wish_id,item_id) VALUES(?,?)",w.id,i.id)==1){
                    NotificationService.send(c,w.owner,"心愿匹配到了物品","「"+w.title+"」匹配到「"+i.title+"」，去看看吧。","#/item/"+i.id);
                    NotificationService.send(c,i.owner,"有人想换你的物品","你的「"+i.title+"」匹配到心愿「"+w.title+"」。","#/wishes/"+w.id);
                }
                return null;
            });
        }
        cursor=wishes.get(wishes.size()-1).id;
    }
}
