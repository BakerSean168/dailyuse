# Docker 部署说明

本文档是当前仓库唯一有效的 Docker 生产部署说明，覆盖 `web`、`api`、`ai-service` 三个业务镜像，以及 `postgres`、`redis` 两个基础服务，外加 `caddy`（HTTPS 反向代理）和 `watchtower`（自动镜像更新）。

## 部署架构

```
互联网
  │
  ▼
Caddy (:443 HTTPS, 自动 Let's Encrypt)
  │
  ▼
Nginx/Web (:80, 静态文件 + /api/ 代理)
  │
  ├── API (:3000) ──▶ PostgreSQL (:5432)
  │                 ──▶ Redis (:6379)
  │                 ──▶ AI Service (:8100)
  │
  └── Watchtower (轮询 ACR 镜像更新 → 自动滚动重启)
```

### 服务清单

| 服务 | 镜像 | 说明 |
|------|------|------|
| `postgres` | `pgvector/pgvector:pg16` | 主数据库（含 pgvector 扩展） |
| `redis` | `redis:7-alpine` | 缓存 / 队列 |
| `ai-service` | `dailyuse-ai-service:prod-latest` | AI 分析 (Python/uvicorn) |
| `api` | `dailyuse-api:prod-latest` | 后端 API (Node.js) |
| `web` | `dailyuse-web:prod-latest` | 前端 SPA (Nginx) |
| `caddy` | `caddy:2-alpine` | HTTPS 入口，自动证书 |
| `watchtower` | `containrrr/watchtower` | 自动拉取镜像并重启 |

## 相关文件

- `Dockerfile.api`
- `Dockerfile.web`
- `Dockerfile.ai-service`
- `docker-compose.prod.yml`
- `docker-compose.local.yml`
- `Caddyfile`
- `.env.production`
- `.env.production.local`（不提交 Git）
- `.github/workflows/docker-deploy.yml`
- `tools/docker/publish-images.ps1`（本地手动构建，可选）

## 发布流程（自动化）

推送 Git tag 即可触发完整发布：

```bash
git tag v0.4.0
git push --tags
```

GitHub Actions 自动执行：

1. `pnpm nx build api` + `pnpm nx build web --configuration=production`
2. 构建 `api`、`web`、`ai-service` 三张 Docker 镜像
3. 推送不可变 tag（如 `v0.4.0-prod.20260404-150338-93dca44f0df1`）
4. 推送滚动 tag `prod-latest`

服务器侧 Watchtower 自动检测 `prod-latest` 更新（默认 5 分钟轮询），拉取新镜像并滚动重启业务容器。**无需 SSH 到服务器执行任何操作。**

### Tag 规则

不可变 tag 格式：

```text
v<package.json version>-prod.<UTC时间戳>-<12位git sha>
```

示例：`v0.3.0-prod.20260403-150338-93dca44f0df1`

每次推送时还会额外同步一个滚动 tag：`prod-latest`。

### 手动构建（本地，可选）

仍然可以在本地执行手动构建：

```powershell
pnpm docker:prod:push            # 构建 + 推送
pnpm docker:prod:push:rebuild    # 跳过 Nx 缓存
```

### GitHub Actions 需要的 Secrets

在仓库 Settings → Secrets and variables → Actions 中配置：

| Secret | 说明 | 示例 |
|--------|------|------|
| `ACR_REGISTRY` | 阿里云 ACR 地址 | `crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com` |
| `ACR_USERNAME` | ACR 登录用户 | — |
| `ACR_PASSWORD` | ACR 登录密码 | — |
| `ACR_NAMESPACE` | ACR 命名空间 | `dailyuse` |

## 服务器首次部署

### 1. 准备服务器

```bash
# 安装 Docker + Compose 插件
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker

# 登录阿里云 ACR（Watchtower 需要）
docker login crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com

# 创建项目目录
mkdir -p /opt/dailyuse && cd /opt/dailyuse
```

### 2. 上传部署文件

将以下文件上传到 `/opt/dailyuse/`：

- `docker-compose.prod.yml`
- `Caddyfile`

### 3. 创建环境文件

```bash
cat > .env.production.local << 'EOF'
# 镜像仓库
REGISTRY=crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com
IMAGE_NAMESPACE=dailyuse

# 数据库
DB_NAME=Memoflow
DB_USER=Memoflow
DB_PASSWORD=<生成的强密码>

# Redis
REDIS_PASSWORD=<生成的强密码>

# JWT
JWT_SECRET=<生成的强密钥>

# 内部鉴权（api ↔ ai-service）
SERVICE_SECRET=<生成的强密钥>

# CORS
CORS_ORIGIN=https://dailyuse.bakersean.top

# 域名（须与 DNS 一致）
APP_DOMAIN=dailyuse.bakersean.top
ACME_EMAIL=admin@bakersean.top

# Watchtower 轮询间隔（秒）
WATCHTOWER_POLL_INTERVAL=300
EOF

chmod 600 .env.production.local
```

生成强密钥：`openssl rand -base64 32`

### 4. 启动

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d
```

首次启动时 Caddy 会自动向 Let's Encrypt 申请 HTTPS 证书（需要 80/443 端口可达且域名已解析到服务器 IP）。

### 5. 验证

```bash
# 容器状态
docker compose -f docker-compose.prod.yml --env-file .env.production.local ps

# 健康检查
curl http://127.0.0.1:3000/healthz
curl http://127.0.0.1:8100/healthz

# HTTPS 访问
curl https://dailyuse.bakersean.top

# 日志
docker compose -f docker-compose.prod.yml --env-file .env.production.local logs -f api
docker compose -f docker-compose.prod.yml --env-file .env.production.local logs -f caddy
docker compose -f docker-compose.prod.yml --env-file .env.production.local logs -f watchtower
```

## 升级与回滚

### 自动升级（常规）

1. 本地 `git tag vX.Y.Z && git push --tags`
2. GitHub Actions 自动构建推送
3. Watchtower 自动检测并滚动重启

### 手动回滚

```bash
# 1. 指定旧的不可变 tag
# 编辑 .env.production.local，修改：
#   API_TAG=v0.3.0-prod.20260403-xxx
#   WEB_TAG=v0.3.0-prod.20260403-xxx
#   AI_SERVICE_TAG=v0.3.0-prod.20260403-xxx

# 2. 拉取并重启
docker compose -f docker-compose.prod.yml --env-file .env.production.local pull
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d
```

回滚后如需恢复自动更新，将 tag 改回 `prod-latest`。

## 本地 Docker 验证

```powershell
pnpm docker:local:up       # 构建 + 启动
pnpm docker:local:ps       # 查看状态
pnpm docker:local:logs     # 查看日志
pnpm docker:local:down     # 停止
pnpm docker:local:rebuild  # 完全重建
```

本地验证使用 `docker-compose.local.yml` overlay，业务镜像从本地源码构建，不从远端拉取。

## 端口说明

生产环境端口绑定策略：

| 服务 | 容器端口 | 宿主机绑定 | 说明 |
|------|----------|------------|------|
| `caddy` | 80, 443 | `0.0.0.0` | 唯一的公网入口（HTTPS） |
| `postgres` | 5432 | `127.0.0.1` | 仅本机管理 |
| `redis` | 6379 | `127.0.0.1` | 仅本机管理 |
| `api` | 3000 | 不暴露 | 通过 Nginx 反向代理 |
| `web` | 80 | 不暴露 | 通过 Caddy 反向代理 |
| `ai-service` | 8100 | 不暴露 | 仅 API 内部调用 |

## 约束

- 不提交 `.env.production.local`
- 不在服务器上直接做工作区源码构建，生产服务器只负责拉镜像和启动容器
- 不使用 `latest` 作为正式发布唯一标识（使用 `prod-latest` 搭配不可变 tag）
- 回滚时切换到不可变 tag，恢复后切回 `prod-latest`
