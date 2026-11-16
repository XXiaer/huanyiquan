package com.huanyiquan.listener;

import com.huanyiquan.dao.SensitiveWordDao;
import com.huanyiquan.service.ExchangeService;
import com.huanyiquan.service.AutoReviewService;
import com.huanyiquan.service.PassiveMatchService;
import com.huanyiquan.service.OfferService;
import com.huanyiquan.service.UserService;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 启动时的初始化 + 三个定时任务。
 * 过期不依赖用户在线，全靠这里扫。
 */
public class TaskListener implements ServletContextListener {

    private ScheduledExecutorService pool;

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        SensitiveWordDao.reload();
        try {
            UserService.ensureAdmin();
        } catch (Exception e) {
            System.err.println("[初始化] 建管理员失败，检查数据库是否已导入：" + e.getMessage());
        }

        pool = Executors.newScheduledThreadPool(2, r -> {
            Thread t = new Thread(r, "huanyiquan-task");
            t.setDaemon(true);
            return t;
        });

        // 报价 24 小时过期：每 5 分钟扫一次
        pool.scheduleAtFixedRate(() -> {
            try {
                int n = OfferService.expireAll();
                if (n > 0) {
                    System.out.println("[定时任务] " + n + " 条报价超时失效");
                }
            } catch (Exception e) {
                System.err.println("[定时任务] 报价过期处理失败：" + e.getMessage());
            }
        }, 1, 5, TimeUnit.MINUTES);

        // 交换单超时关闭：每 10 分钟扫一次
        pool.scheduleAtFixedRate(() -> {
            try {
                ExchangeService.closeTimeout();
            } catch (Exception e) {
                System.err.println("[定时任务] 交换单超时处理失败：" + e.getMessage());
            }
        }, 2, 10, TimeUnit.MINUTES);

        // 待审核超过 1 分钟，图片仍有效且未被人工处理时自动通过（较原 5 分钟提速 80%）。
        pool.scheduleWithFixedDelay(() -> {
            try { AutoReviewService.run(); } catch (Exception e) { System.err.println("[自动审核] " + e.getMessage()); }
        }, 3, 3, TimeUnit.SECONDS);

        pool.scheduleWithFixedDelay(() -> { try { PassiveMatchService.run(); } catch (Exception e) { System.err.println("[被动匹配] " + e.getMessage()); } }, 15, 60, TimeUnit.SECONDS);

        pool.scheduleWithFixedDelay(() -> { try { com.huanyiquan.service.WishMatchService.run(); } catch (Exception e) { System.err.println("[心愿匹配] " + e.getMessage()); } }, 10, 20, TimeUnit.SECONDS);

        // 敏感词表刷新
        pool.scheduleAtFixedRate(SensitiveWordDao::reload, 10, 10, TimeUnit.MINUTES);
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        if (pool != null) {
            pool.shutdownNow();
        }
    }
}
