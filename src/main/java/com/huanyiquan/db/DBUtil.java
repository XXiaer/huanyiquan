package com.huanyiquan.db;

import com.huanyiquan.common.BizException;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.io.InputStream;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

/**
 * 数据库访问基座：HikariCP 连接池、参数绑定、查询、更新、手动事务。
 * 全站 SQL 只走 PreparedStatement，杜绝拼接注入。
 */
public final class DBUtil {

    /** 行映射：把 ResultSet 当前行变成实体 */
    @FunctionalInterface
    public interface RowMapper<T> {
        T map(ResultSet rs) throws SQLException;
    }

    /** 事务体：整段逻辑用一个连接，出错整体回滚 */
    @FunctionalInterface
    public interface TxWork<T> {
        T run(Connection conn) throws Exception;
    }

    private static final HikariDataSource DATA_SOURCE;

    static {
        Properties props = new Properties();
        try (InputStream in = DBUtil.class.getClassLoader().getResourceAsStream("db.properties")) {
            if (in != null) {
                props.load(in);
            }
        } catch (Exception e) {
            System.err.println("[DB] 读取 db.properties 失败：" + e.getMessage());
        }
        String url = env("DB_URL", props.getProperty("db.url"));
        String user = env("DB_USER", props.getProperty("db.user"));
        String password = env("DB_PASSWORD", props.getProperty("db.password"));
        String driver = props.getProperty("db.driver", "com.mysql.cj.jdbc.Driver");

        HikariConfig cfg = new HikariConfig();
        cfg.setPoolName("HuanyiquanPool");
        cfg.setDriverClassName(driver);
        cfg.setJdbcUrl(url);
        cfg.setUsername(user);
        cfg.setPassword(password);
        cfg.setMaximumPoolSize(20);
        cfg.setMinimumIdle(4);
        cfg.setConnectionTimeout(5000);
        cfg.setIdleTimeout(300000);
        cfg.setMaxLifetime(1800000);
        cfg.setConnectionTestQuery("SELECT 1");
        cfg.addDataSourceProperty("cachePrepStmts", "true");
        cfg.addDataSourceProperty("prepStmtCacheSize", "250");
        cfg.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");

        DATA_SOURCE = new HikariDataSource(cfg);
        Runtime.getRuntime().addShutdownHook(new Thread(DBUtil::shutdown, "db-pool-shutdown"));
    }

    private DBUtil() {
    }

    private static String env(String key, String fallback) {
        String v = System.getenv(key);
        return v == null || v.trim().isEmpty() ? fallback : v.trim();
    }

    public static Connection getConnection() throws SQLException {
        return DATA_SOURCE.getConnection();
    }

    public static void shutdown() {
        if (DATA_SOURCE != null && !DATA_SOURCE.isClosed()) {
            DATA_SOURCE.close();
        }
    }

    // ---------------------------------------------------------------- 查询

    public static <T> List<T> query(String sql, RowMapper<T> mapper, Object... params) {
        try (Connection c = getConnection()) {
            return query(c, sql, mapper, params);
        } catch (SQLException e) {
            throw wrap(e);
        }
    }

    public static <T> List<T> query(Connection c, String sql, RowMapper<T> mapper, Object... params) {
        List<T> list = new ArrayList<>();
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            bind(ps, params);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapper.map(rs));
                }
            }
        } catch (SQLException e) {
            throw wrap(e);
        }
        return list;
    }

    public static <T> T queryOne(String sql, RowMapper<T> mapper, Object... params) {
        List<T> list = query(sql, mapper, params);
        return list.isEmpty() ? null : list.get(0);
    }

    public static <T> T queryOne(Connection c, String sql, RowMapper<T> mapper, Object... params) {
        List<T> list = query(c, sql, mapper, params);
        return list.isEmpty() ? null : list.get(0);
    }

    public static long count(String sql, Object... params) {
        Long v = queryOne(sql, rs -> rs.getLong(1), params);
        return v == null ? 0L : v;
    }

    public static long count(Connection c, String sql, Object... params) {
        Long v = queryOne(c, sql, rs -> rs.getLong(1), params);
        return v == null ? 0L : v;
    }

    // ---------------------------------------------------------------- 写入

    public static int update(String sql, Object... params) {
        try (Connection c = getConnection()) {
            return update(c, sql, params);
        } catch (SQLException e) {
            throw wrap(e);
        }
    }

    public static int update(Connection c, String sql, Object... params) {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            bind(ps, params);
            return ps.executeUpdate();
        } catch (SQLException e) {
            throw wrap(e);
        }
    }

    /** 插入并返回自增主键 */
    public static long insert(String sql, Object... params) {
        try (Connection c = getConnection()) {
            return insert(c, sql, params);
        } catch (SQLException e) {
            throw wrap(e);
        }
    }

    public static long insert(Connection c, String sql, Object... params) {
        try (PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            bind(ps, params);
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                return rs.next() ? rs.getLong(1) : 0L;
            }
        } catch (SQLException e) {
            throw wrap(e);
        }
    }

    // ---------------------------------------------------------------- 事务

    /**
     * 手动事务：交换单生成、状态推进、信用结算三处必须包在这里。
     * 任一步抛异常，整段回滚。
     */
    public static <T> T tx(TxWork<T> work) {
        Connection c = null;
        try {
            c = getConnection();
            c.setAutoCommit(false);
            try {
                T result = work.run(c);
                c.commit();
                return result;
            } catch (Exception e) {
                try {
                    c.rollback();
                } catch (SQLException ignore) {
                    // 回滚失败也救不回来了，继续抛原始异常
                }
                if (e instanceof RuntimeException) {
                    throw (RuntimeException) e;
                }
                e.printStackTrace();
                throw new BizException(500, "操作失败，请稍后重试");
            }
        } catch (SQLException e) {
            e.printStackTrace();
            throw new BizException(500, "数据库连接异常，请稍后重试");
        } finally {
            if (c != null) {
                try {
                    c.setAutoCommit(true);
                } catch (SQLException ignore) {
                    // 恢复自动提交失败时仍需关闭连接
                }
                try {
                    c.close();
                } catch (SQLException ignore) {
                    // 关闭失败无需处理
                }
            }
        }
    }

    // ---------------------------------------------------------------- 内部

    private static void bind(PreparedStatement ps, Object[] params) throws SQLException {
        if (params == null) {
            return;
        }
        for (int i = 0; i < params.length; i++) {
            ps.setObject(i + 1, params[i]);
        }
    }

    private static RuntimeException wrap(SQLException e) {
        e.printStackTrace();
        return new BizException(500, "数据库操作失败，请稍后重试");
    }
}
