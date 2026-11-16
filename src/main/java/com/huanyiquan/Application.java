package com.huanyiquan;

import com.huanyiquan.filter.AdminFilter;
import com.huanyiquan.filter.LoginFilter;
import com.huanyiquan.filter.SecurityFilter;
import com.huanyiquan.listener.TaskListener;
import com.huanyiquan.servlet.SocialServlet;
import com.huanyiquan.servlet.FollowersServlet;
import com.huanyiquan.servlet.TradeThumbnailsServlet;
import com.huanyiquan.servlet.AuthEntryServlet;
import com.huanyiquan.servlet.AdminServlet;
import com.huanyiquan.servlet.AiServlet;
import com.huanyiquan.servlet.CaptchaServlet;
import com.huanyiquan.servlet.ConversationServlet;
import com.huanyiquan.servlet.WishServlet;
import com.huanyiquan.servlet.NotificationServlet;
import com.huanyiquan.servlet.CommunityServlet;
import com.huanyiquan.servlet.AuctionServlet;
import com.huanyiquan.servlet.CycleServlet;
import com.huanyiquan.servlet.ExchangeServlet;
import com.huanyiquan.servlet.ItemServlet;
import com.huanyiquan.servlet.MetaServlet;
import com.huanyiquan.servlet.OfferServlet;
import com.huanyiquan.servlet.QrLoginServlet;
import com.huanyiquan.servlet.ReportServlet;
import com.huanyiquan.servlet.ReviewServlet;
import com.huanyiquan.servlet.StaticServlet;
import com.huanyiquan.servlet.UploadServlet;
import com.huanyiquan.servlet.UserServlet;
import jakarta.servlet.Filter;
import jakarta.servlet.MultipartConfigElement;
import jakarta.servlet.http.HttpServlet;
import org.apache.catalina.Context;
import org.apache.catalina.Wrapper;
import org.apache.catalina.connector.Connector;
import org.apache.catalina.startup.Tomcat;
import org.apache.tomcat.util.descriptor.web.FilterDef;
import org.apache.tomcat.util.descriptor.web.FilterMap;

import java.io.File;

/**
 * 启动入口：内嵌 Tomcat，mvn exec:java 直接跑，不需要另装服务器。
 * 打成 war 丢进 Tomcat 10.1 时走 WEB-INF/web.xml，映射结果一致。
 */
public final class Application {

    private static final int PORT = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));

    public static void main(String[] args) throws Exception {
        Tomcat tomcat = new Tomcat();
        tomcat.setBaseDir(new File("target/tomcat").getAbsolutePath());
        tomcat.setPort(PORT);
        Connector connector = tomcat.getConnector();
        connector.setProperty("maxThreads", "60");
        connector.setProperty("minSpareThreads", "8");
        connector.setProperty("maxConnections", "500");
        connector.setProperty("acceptCount", "100");
        connector.setProperty("maxKeepAliveRequests", "100");

        File docBase = new File("target/webapp");
        if (!docBase.exists() && !docBase.mkdirs()) {
            throw new IllegalStateException("无法创建 docBase 目录");
        }
        Context ctx = tomcat.addContext("", docBase.getAbsolutePath());
        // 关键：让 webapp 的类加载器能看到项目自己的类，否则监听器按类名加载会 ClassNotFound
        ctx.setParentClassLoader(Application.class.getClassLoader());

        // 过滤器：安全响应头与限流 -> 登录校验 -> 管理员校验
        addFilter(ctx, "securityFilter", new SecurityFilter(), "/*");
        addFilter(ctx, "loginFilter", new LoginFilter(), "/*");
        addFilter(ctx, "adminFilter", new AdminFilter(), "/api/admin/*");

        // 一个资源一个 Servlet，内部按 HTTP 方法 + 路径段分发
        addServlet(ctx, "authEntryServlet", new AuthEntryServlet(),
                "/api/user/register", "/api/user/register/email/send", "/api/user/login/email/send",
                "/api/user/login/email/code", "/api/user/login/email/password");
        addServlet(ctx, "userServlet", new UserServlet(), "/api/user/*");
        addServlet(ctx, "tradeThumbnailsServlet", new TradeThumbnailsServlet(), "/api/item/trade-thumbnails");
        addServlet(ctx, "itemServlet", new ItemServlet(), "/api/item/*");
        addServlet(ctx, "offerServlet", new OfferServlet(), "/api/offer/*");
        addServlet(ctx, "cycleServlet", new CycleServlet(), "/api/cycle/*");
        addServlet(ctx, "exchangeServlet", new ExchangeServlet(), "/api/exchange/*");
        addServlet(ctx, "reviewServlet", new ReviewServlet(), "/api/review/*");
        addServlet(ctx, "reportServlet", new ReportServlet(), "/api/report");
        addServlet(ctx, "adminServlet", new AdminServlet(), "/api/admin/*");
        addServlet(ctx, "auctionServlet", new AuctionServlet(), "/api/auction/*");
        addServlet(ctx, "communityServlet", new CommunityServlet(), "/api/community/*");
        addServlet(ctx, "notificationServlet", new NotificationServlet(), "/api/notification/*");
        addServlet(ctx, "conversationServlet", new ConversationServlet(), "/api/conversation/*");
        addServlet(ctx, "followersServlet", new FollowersServlet(), "/api/social/followers", "/api/social/follow");
        addServlet(ctx, "socialServlet", new SocialServlet(), "/api/social/*");
        addServlet(ctx, "wishServlet", new WishServlet(), "/api/wish/*");
        addServlet(ctx, "metaServlet", new MetaServlet(), "/api/meta/*");
        addServlet(ctx, "aiServlet", new AiServlet(), "/api/ai/*");
        addServlet(ctx, "captchaServlet", new CaptchaServlet(), "/api/captcha/new", "/api/captcha/verify");
        addServlet(ctx, "qrLoginServlet", new QrLoginServlet(),
                "/api/auth/qr/create", "/api/auth/qr/status", "/api/auth/qr/scan",
                "/api/auth/qr/confirm", "/api/auth/qr/exchange");

        Wrapper upload = addServlet(ctx, "uploadServlet", new UploadServlet(),
                "/api/upload", "/api/file/*");
        upload.setMultipartConfigElement(new MultipartConfigElement(
                System.getProperty("java.io.tmpdir"),
                2L * 1024 * 1024, 4L * 1024 * 1024, 0));

        // 前端静态资源挂在根路径，前后端同源。精确匹配 /api/* 优先，不冲突。
        File webRoot = new File("src/main/webapp");
        addServlet(ctx, "staticServlet",
                webRoot.exists() ? new StaticServlet(webRoot) : new StaticServlet(), "/");

        // 内嵌模式直接 new 出来跑，避免按类名反射加载；war 部署时由 web.xml 注册同一个监听器
        final TaskListener taskListener = new TaskListener();
        taskListener.contextInitialized(null);

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try {
                taskListener.contextDestroyed(null);
                tomcat.stop();
            } catch (Exception ignore) {
                // 退出阶段不用处理
            }
        }));

        tomcat.start();
        long heapMax = Runtime.getRuntime().maxMemory() / 1024 / 1024;
        System.out.println("=========================================");
        System.out.println(" 换一圈 v2.0 后端已启动：http://localhost:" + PORT);
        System.out.println(" 登录接口：POST /api/user/login");
        System.out.println(" 演示数据：管理员登录后 POST /api/admin/demo");
        System.out.println(" 管理员：admin（首次启动按 ADMIN_PASSWORD 自动初始化）");
        System.out.println(" JVM 堆上限：" + heapMax + " MB，最大工作线程 60 条");
        System.out.println("=========================================");
        tomcat.getServer().await();
    }

    private static void addFilter(Context ctx, String name, Filter filter, String pattern) {
        FilterDef def = new FilterDef();
        def.setFilterName(name);
        def.setFilter(filter);
        ctx.addFilterDef(def);

        FilterMap map = new FilterMap();
        map.setFilterName(name);
        map.addURLPattern(pattern);
        ctx.addFilterMap(map);
    }

    private static Wrapper addServlet(Context ctx, String name, HttpServlet servlet, String... patterns) {
        Wrapper wrapper = Tomcat.addServlet(ctx, name, servlet);
        wrapper.setLoadOnStartup(1);
        for (String pattern : patterns) {
            ctx.addServletMappingDecoded(pattern, name);
        }
        return wrapper;
    }
}
