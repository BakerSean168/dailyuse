# 📦 Memoflow 部署完整指南

> **项目**：Memoflow v1.0.3  
> **最后更新**：2025-01-11  
> **状态**：✅ 生产部署就绪

---

## 🚀 5分钟快速开始

### 最简方式（3 步）

```powershell
# 1️⃣ 本地构建（Windows PowerShell）
cd d:\myPrograms\dailyuse
.\scripts\deploy-prod.ps1 -Version v1.0.3

# 2️⃣ 服务器准备（SSH）
ssh user@your-server-ip
cd /path/to/deployment
# 创建 .env.production.local（详见下方）

# 3️⃣ 执行部署（服务器上）
docker-compose -f docker-compose.prod.yml --env-file .env.production.local pull
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d
curl http://localhost:3000/healthz
```

---

## 📚 完整文档导航

### 按场景选择

| 你的情况 | 文档 | 耗时 |
|--------|------|------|
| **DATABASE_URL 启动失败** | **[🔧 环境配置修复报告](ENV_CONFIG_FIX_REPORT.md)** | **5分钟** |
| **搞混了环境变量配置** | **[🎯 环境变量困惑解除器](ENV_CONFUSION_RESOLVER.md)** | **10分钟** |
| 想快速了解部署流程 | [01-quick-start.md](01-quick-start.md) | 5分钟 |
| 要详细构建步骤 | [02-build.md](02-build.md) | 10分钟 |
| 要详细部署步骤 | [03-deploy.md](03-deploy.md) | 5分钟 |
| 需要验证部署成功 | [04-verify.md](04-verify.md) | 5分钟 |
| 遇到部署问题 | [05-troubleshooting.md](05-troubleshooting.md) | 自助排查 |
| 需要快速命令 | [reference/COMMAND_REFERENCE.md](reference/COMMAND_REFERENCE.md) | 可复制粘贴 |
| 理解加载优先级 | [ENV_LOADING_MECHANISM.md](ENV_LOADING_MECHANISM.md) | 深入理解 |
| Docker 最佳实践 | [DOCKER_ENV_CONFIGURATION.md](DOCKER_ENV_CONFIGURATION.md) | 深入理解 |
| 快速生成密码 | [ENV_QUICK_REFERENCE.md](ENV_QUICK_REFERENCE.md) | 实操指南 |
| 设置环境变量 | [configs/ENVIRONMENT_CONFIGURATION.md](configs/ENVIRONMENT_CONFIGURATION.md) | 参考 |
| 配置 CORS | [configs/CORS_CONFIGURATION.md](configs/CORS_CONFIGURATION.md) | 参考 |

---

## 📁 文件结构

```
docs/deployment/
├── README.md                                 ← 你在这里
├── 01-quick-start.md                        快速开始（5分钟版）
├── 02-build.md                              构建 Docker 镜像详解
├── 03-deploy.md                             部署到生产环境详解
├── 04-verify.md                             验证部署成功
├── 05-troubleshooting.md                    故障排查指南
│
├── configs/                                  配置文件和说明
│   ├── ENVIRONMENT_CONFIGURATION.md         环境变量详解
│   ├── CORS_CONFIGURATION.md                CORS 配置说明
│   ├── .env.example                         完整配置模板
│   ├── .env.development                     开发环境（参考）
│   └── .env.production                      生产环境（参考）
│
├── reference/
│   └── COMMAND_REFERENCE.md                 快速命令参考（可复制粘贴）
│
└── docker/
    └── README.md                            Docker 配置说明
```

---

## 🎯 部署完整流程

```
【第一阶段】本地构建 (10 分钟)
  ├─ 验证编译
  ├─ 构建 Docker 镜像
  ├─ 推送到阿里云 ACR
  └─ 验证镜像

【第二阶段】服务器准备 (3 分钟)
  ├─ SSH 连接
  ├─ 创建 .env.production.local
  └─ 设置文件权限

【第三阶段】执行部署 (3 分钟)
  ├─ 停止旧服务
  ├─ 拉取新镜像
  ├─ 启动新服务
  └─ 等待就绪

【第四阶段】验证部署 (2 分钟)
  ├─ 容器状态检查
  ├─ API 端点验证
  ├─ 日志检查
  └─ 前端访问验证

总耗时：15-20 分钟 ✅
```

---

## 🔑 关键信息

### 镜像仓库
```
仓库：crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com
命名空间：bakersean
镜像名：Memoflow-api
版本：v1.0.3
```

### 必填环境变量
```
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-strong-secret-min-32-chars
CORS_ORIGIN=https://yourdomain.com
API_TAG=v1.0.3
```

### 健康检查端点
```
GET /healthz    → 健康状态
GET /readyz     → 就绪状态
GET /api/info   → 应用信息
```

---

## ⚠️ 重要提示

### 🔒 安全
- ❌ 不要提交 `.env.production.local` 到 Git
- ✅ 设置权限：`chmod 600 .env.production.local`
- ✅ JWT_SECRET 使用强随机字符串（至少 32 字符）

### ⚙️ 配置
- 📝 DATABASE_URL：PostgreSQL 完整连接字符串
- 📝 REDIS_URL：Redis 连接地址
- 📝 CORS_ORIGIN：包含所有前端域名（逗号分隔）

### 🔄 部署特性
- ✓ 数据库迁移自动应用
- ✓ 旧 token 自动兼容（JWT_SECRET 保持一致）
- ✓ CORS 已修复（credentials 条件化）
- ✓ 环境变量通过 Zod 验证

---

## 🚨 常见问题速查

| 问题 | 快速解决 |
|------|--------|
| 编译失败 | 查看 [02-build.md](02-build.md) 第一步 |
| CORS 错误 | 查看 [configs/CORS_CONFIGURATION.md](configs/CORS_CONFIGURATION.md) |
| 数据库连接失败 | 查看 [05-troubleshooting.md](05-troubleshooting.md) 第 5 点 |
| 环境变量缺失 | 查看 [05-troubleshooting.md](05-troubleshooting.md) 第 8 点 |
| 需要回滚 | 查看 [reference/COMMAND_REFERENCE.md](reference/COMMAND_REFERENCE.md) |

---

## 📖 选择合适的文档

### 👨‍💻 开发者
→ [01-quick-start.md](01-quick-start.md) - 5分钟了解部署步骤

### 👨‍💼 运维人员
1. [02-build.md](02-build.md) - 构建详解
2. [03-deploy.md](03-deploy.md) - 部署详解
3. [04-verify.md](04-verify.md) - 验证详解
4. [05-troubleshooting.md](05-troubleshooting.md) - 故障排查

### 🔧 配置管理员
- [configs/ENVIRONMENT_CONFIGURATION.md](configs/ENVIRONMENT_CONFIGURATION.md) - 环境变量
- [configs/CORS_CONFIGURATION.md](configs/CORS_CONFIGURATION.md) - CORS 配置

### 🏃 急于部署的人
→ [reference/COMMAND_REFERENCE.md](reference/COMMAND_REFERENCE.md) - 可复制粘贴命令

---

## ✅ 快速检查清单

部署前：
- [ ] 本地编译通过：`pnpm nx run api:typecheck`
- [ ] Docker 已安装：`docker --version`
- [ ] 阿里云登录：`docker login crpi-...`

部署中：
- [ ] 镜像已推送到 ACR
- [ ] 配置文件已创建：`.env.production.local`
- [ ] 文件权限正确：`chmod 600`

部署后：
- [ ] 容器都是 `Up` 状态
- [ ] `/healthz` 返回 200 OK
- [ ] API 日志无 ERROR
- [ ] 前端能正常调用 API

---

## 📊 预期耗时

| 阶段 | 耗时 | 说明 |
|------|------|------|
| 本地准备 | 2 分钟 | 验证环境 |
| 本地构建 | 5-8 分钟 | 编译 + Docker 构建 |
| 镜像推送 | 2-3 分钟 | 推送到 ACR |
| 服务器准备 | 2-3 分钟 | 配置文件准备 |
| 部署执行 | 2-3 分钟 | docker-compose |
| 验证 | 1-2 分钟 | 健康检查 |
| **总计** | **15-20 分钟** | **完整周期** |

---

## 🎯 下一步

1. **快速开始** → 打开 [01-quick-start.md](01-quick-start.md)
2. **立即部署** → 运行脚本或查看 [reference/COMMAND_REFERENCE.md](reference/COMMAND_REFERENCE.md)
3. **遇到问题** → 查阅 [05-troubleshooting.md](05-troubleshooting.md)

---

## 📞 获取帮助

1. **快速命令** → [reference/COMMAND_REFERENCE.md](reference/COMMAND_REFERENCE.md)
2. **详细步骤** → 按序阅读 01-05.md
3. **故障排查** → [05-troubleshooting.md](05-troubleshooting.md)
4. **环境配置** → [configs/](configs/)

---

**祝部署顺利！** 🚀


