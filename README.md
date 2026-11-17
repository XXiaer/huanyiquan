<div align="center">

# 换一圈（HuanYiQuan）

**校园闲置流转与三方以物换物开源平台**

[![License: MIT](https://img.shields.io/badge/License-MIT-0C7263.svg)](LICENSE)
[![Java](https://img.shields.io/badge/Java-11+-ED8B00.svg)](#快速开始)
[![Servlet](https://img.shields.io/badge/Jakarta%20Servlet-6.0%20%7C%20Tomcat%2010.1-131921.svg)](#技术栈)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1.svg)](#数据库初始化)
[![Frontend](https://img.shields.io/badge/Frontend-Vanilla%20JS%20%2F%20HTML%20%2F%20CSS-323330.svg)](#双端界面设计)

> 让校园里的闲置继续流转——支持**明码标价与以物换物双轨交易**、**三方换物环自动匹配**、**校园闲置聚合频道（拍卖 / 换物接力 / 求换专区）**、**AI 好物估价**与**本地 BGE 语义检索**。

</div>

---

## 核心特性

### 1. 双轨交易与三方换物闭环
- **明码标价 & 以物换物双轨并行**：商品支持闲置标价或指定换物意向，满足常规出手与互换需求。
- **三方换物环匹配（Cycle Matching）**：当两个人一对一谈不成时，平台自动从全校在架物品与意向图中寻找第三位同学凑成 `A → B → C → A` 闭环，支持**主动找环**与**被动候选通知**，三方全部确认后锁物并进入校内面交。
- **换物接力 & 求换专区**：发布求换心愿或参与接力流转，系统自动匹配同校符合条件的在架物品并推送提醒。
- **全流程信用体系**：新用户初始化信用分 `80`，完成交付与双向互评动态调整信用分，支持超时自动失效与解锁定时任务。

### 2. 双端自适应体验（桌面端 & 移动端）
- **桌面端**：参照大型购物平台逛街式浏览体验重塑——包含双层深青顶栏、`≡ 全部` 左侧全部分类抽屉、顶部 5:8 海报推广条、4 列逛街面板、独立 `Goldbox` 样式「校园闲置」聚合页（集成全部闲置、校园拍卖、换物接力与求换专区）、3 栏私聊协商窗与独立个人中心视图。
- **移动端（`/mobile/`）**：移动端优先设计的原生触控交互体验，包含底部导航栏、独立登录与邮箱验证码（90 秒倒计时）、拍照取景框式 AI 好物估价、贴吧式校园社区与聊天室。
- **零构建零依赖前端**：纯原生 HTML / CSS / JavaScript，无需 Node 打包即可即改即生效。

### 3. 本地 BGE 语义搜索与 AI 好物估价
- **本地量化向量检索（`semantic/`）**：基于本地部署的量化 BGE 中文嵌入模型（Python 侧车服务，默认监听 `127.0.0.1:18084`），不向外部泄露校内数据；当侧车未启动时自动无缝降级为 SQL 关键词检索。
- **AI 好物估价**：上传闲置实物图片，结合品类与成色给出校内参考成色与区间建议。

### 4. 纯净可移植的 Java 后端
- 采用经典的 `Servlet / Service / DAO / Entity` 分层架构，原生 JDBC + HikariCP 连接池 + 手动事务控制，不依赖 Spring / MyBatis 等重型框架。
- 内嵌 Tomcat 10.1（`Application.java`），支持本地 `mvn exec:java` 一键直跑，也保留完整 `war` 打包能力。

---

## 技术栈

| 层级 | 选型 | 说明 |
| --- | --- | --- |
| 后端语言与规范 | Java 11+, Jakarta Servlet 6.0 | 内嵌 Tomcat 10.1.24 启动，支持标准 WAR 部署 |
| 数据访问与连接池 | 原生 JDBC + HikariCP + MySQL 8 | 全量使用 `PreparedStatement`，关键写操作手动事务控制 |
| 前端实现 | 原生 HTML5 / CSS3 / ES6+ | 桌面端与移动端分离适配，Hash 路由单页应用 |
| 语义检索侧车（可选） | Python 3 + BGE 量化向量模型 | 独立 HTTP 健康检查 `/health`，不可用时自动降级关键词搜索 |
| 安全与鉴权 | Token 会话 + 邮箱验证码 + 限流/XSS/敏感词过滤 | SHA-256 加盐口令存储，前后端归属权校验与管理后台权限拦截 |

---

## 目录结构

```text
.
├── pom.xml                                  # Maven 构建配置（JDK 11 + 内嵌 Tomcat 10.1）
├── start.bat                                # Windows 一键编译与启动脚本
├── LICENSE                                  # MIT 开源许可证
├── sql/                                     # MySQL 建表与渐进迁移脚本
│   ├── schema.sql                           # 基础业务表与初始敏感词数据
│   ├── auction.sql                          # 拍卖扩展表
│   ├── community.sql                        # 社区与聊天室扩展表
│   ├── *_migration.sql                      # 各版本增量字段/功能迁移脚本
│   └── reset.sql                            # 清空演示业务数据（保留表结构与管理员）
├── semantic/                                # Python 本地 BGE 语义检索侧车服务
├── demo-catalog/ & scripts/                 # 演示数据导入、健康检查与发布脚本
├── docs/                                    # 设计文档与页面参考截图
└── src/main/
    ├── resources/db.properties              # 数据库连接默认配置（支持环境变量覆盖）
    ├── java/com/huanyiquan/
    │   ├── Application.java                 # 内嵌 Tomcat 启动入口与 Servlet 路由注册
    │   ├── common/                          # Result / BizException / JsonUtil / 密码与安全工具
    │   ├── db/                              # DBUtil（HikariCP + 手动事务封装）
    │   ├── entity/                          # 数据实体模型
    │   ├── dao/                             # 数据访问层
    │   ├── service/                         # 账号、物品、报价、三方环、拍卖、社区、AI 估价等业务服务
    │   ├── filter/                          # 鉴权、限流与编码过滤器
    │   ├── listener/                        # 启动初始化与自动审核/超时清理定时任务
    │   └── servlet/                         # 22 个 REST 资源 Servlet 与静态资源托管
    └── webapp/
        ├── index.html                       # 桌面端入口
        ├── app.js / app.css                 # 桌面端主应用、路由与基础样式
        ├── desktop-amazon.css               # 桌面端逛街式布局与主题样式
        ├── auth-entry.css / campus-exchange.* / image-upload.js
        ├── assets/                          # 品牌 Logo、吉祥物“小唤风”与频道海报资源
        └── mobile/                          # 移动端独立适配页面、样式与模块脚本
```

---

## 快速开始

### 环境要求
- **JDK 11+**
- **Maven 3.8+**
- **MySQL 8.0+**
- *(可选)* **Python 3.9+**（如需启用本地语义搜索侧车）

### 1. 数据库初始化

创建数据库并导入基础表结构（建议指定 `utf8mb4` 编码避免中文乱码）：

```bash
mysql -u root -p --default-character-set=utf8mb4 < sql/schema.sql
mysql -u root -p --default-character-set=utf8mb4 huanyiquan < sql/arrangement_proposal_migration.sql
mysql -u root -p --default-character-set=utf8mb4 huanyiquan < sql/exchange_dispute_migration.sql
```

> 如需启用拍卖、社区、接力/心愿单、邮箱验证码与双轨交易等完整扩展功能，可按需依次执行 `sql/` 目录下的对应 `.sql` 扩展及迁移脚本（如 `auction.sql`、`community.sql`、`community_exchange.sql`、`wish_relay_migration.sql`、`login_email_migration.sql`、`registration_email_migration.sql`、`social_settings_migration.sql` 等）。

### 2. 配置数据库连接

编辑 [src/main/resources/db.properties](src/main/resources/db.properties)，填入你的 MySQL 地址与凭据；或通过环境变量直接覆盖（推荐生产环境使用）：

```bash
export DB_URL="jdbc:mysql://127.0.0.1:3306/huanyiquan?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai"
export DB_USER="root"
export DB_PASSWORD="your_password"
```

如需开启邮箱验证码与 AI 估价能力，可在运行环境变量或 `.env` 中配置对应的 SMTP 与 AI 接口密钥。

### 3. 启动服务

**Windows 一键启动：**
```bat
start.bat
```

**跨平台命令行启动：**
```bash
mvn clean compile exec:java
```

启动成功后终端会输出服务就绪信息，随后在浏览器访问 `http://localhost:8080`（桌面端与移动端根据屏幕宽度与 UA 自动适配）。

> **健康检查**：项目内置只读体检脚本，可一键排查后端连通性、数据库状态与核心接口：
> ```bash
> python scripts/health.py http://localhost:8080
> ```

### 4. *(可选)* 启动本地语义检索侧车

- **Windows**：双击运行 `semantic\run_local.bat`
- **Linux / macOS**：配置虚拟环境并启动 `python semantic/server.py`

可调检索阈值环境变量（无需修改代码）：
- `SEMANTIC_SCORE_FLOOR`（默认 `0.45`）：相关性绝对下限
- `SEMANTIC_SCORE_MARGIN`（默认 `0.05`）：相对首条结果的容差宽度
- `SEMANTIC_KEEP`（默认 `30`）：单次最多返回条数
- `SEMANTIC_REFRESH_SECONDS`（默认 `30`）：索引刷新间隔

### 5. 打包部署

如需部署到外部 Tomcat 10.1 或以独立进程运行：
```bash
mvn clean package dependency:copy-dependencies -DoutputDirectory=target/dependency
java -Xms128m -Xmx512m -XX:+UseG1GC -Dfile.encoding=UTF-8 \
  -cp "target/classes:target/dependency/*" com.huanyiquan.Application
```

---

## 核心 API 概览

所有业务接口统一返回 JSON 格式 `{ "code": 0, "msg": "success", "data": ... }`，常见资源模块如下：

| 模块 | 路径前缀 | 主要能力 |
| --- | --- | --- |
| 账号与认证 | `/api/user/*`, `/api/auth/*` | 注册、登录、邮箱验证码、个人资料与信用详情 |
| 物品与检索 | `/api/item/*` | 发布、上下架、关键词/语义混合搜索、收藏与足迹 |
| 报价与三方环 | `/api/offer/*`, `/api/cycle/*` | 发起/接受/拒绝/还价/撤回报价，三方成环探测与建环 |
| 交换单与评价 | `/api/exchange/*`, `/api/review/*` | 三方确认、约定校内面交地点、确认交付、双向评价 |
| 校园特色频道 | `/api/auction/*`, `/api/wish/*`, `/api/community/*` | 校园拍卖、心愿求换、换物接力、社区贴吧与聊天室 |
| 社交与通知 | `/api/conversation/*`, `/api/notification/*`, `/api/social/*` | 按物品隔离的私聊协商、系统通知、关注与粉丝 |
| 辅助与管理 | `/api/ai/*`, `/api/upload`, `/api/report/*`, `/api/admin/*` | AI 估价、图片上传、举报处理、数据看板与服务探针 `/api/meta/status` |

---

## 开源与贡献

本项目已在 [MIT License](LICENSE) 协议下完全开源，欢迎任何学校、开发者或开源爱好者用于学习、二次开发或校园落地部署：

1. Fork 本仓库并创建你的特性分支（`git checkout -b feat/your-feature`）
2. 提交清晰规范的 Commit 信息（`git commit -m "feat: add something"`）
3. 推送分支并发起 Pull Request

如果这个项目对你有帮助，欢迎点亮右上角的 **Star**！
