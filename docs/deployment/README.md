# DailyUse 阿里云单机部署方案

本文档面向当前这台阿里云服务器，按你已经具备的前提来设计：

- 可以直接使用 `ssh ali-dailyuse` 登录服务器
- `/opt/dailyuse` 已创建
- 服务器已安装 Docker 和 Docker Compose 插件
- 服务器已完成阿里云 ACR 登录
- 服务器上已经上传了部署文件：`.env` 或 `.env.production.local`、`docker-compose.prod.yml`、`Caddyfile`
- 服务器网络环境不稳定，部分 Docker Hub / GHCR 镜像可能无法直接拉取

本文档的目标不是泛泛介绍 Docker 部署，而是给出这套仓库的实际落地方案、执行顺序、验证方法和故障处理策略。

## 1. 结论先行

当前生产环境建议采用下面这套结构：

```text
Internet
  |
  v
Caddy :80/:443
  |
  +--> dailyuse.example.com        -> web:80
  |                                   |
  |                                   +--> /      -> 前端静态资源
  |                                   +--> /api/* -> api:3000
  |
  +--> sync.dailyuse.example.com   -> powersync:8080
                                          |
                                          +--> postgres:5432

api:3000
  |
  +--> postgres:5432
  +--> redis:6379
  +--> ai-service:8100

watchtower
  |
  +--> 轮询阿里云 ACR 中的 prod-latest 镜像并自动滚动更新业务服务
```

这套方案下：

- 外网入口只有 `caddy`
- `web` 容器内部已经自带 Nginx，不需要再额外引入 Nginx Proxy Manager
- `web` 的 Nginx 配置以仓库根目录 [`nginx.conf`](D:\home\projects\dailyuse\nginx.conf) 为唯一来源
- `powersync` 通过独立子域名走 `caddy -> powersync:8080`
- 数据库和 Redis 只绑定到 `127.0.0.1`，不暴露公网
- 业务镜像优先从阿里云 ACR 拉取
- 基础设施镜像如果拉不下来，走本地离线打包上传

### 1.1 Nginx 配置约定

生产环境约定如下：

- [`nginx.conf`](D:\home\projects\dailyuse\nginx.conf) 只保留一份，作为 `web` 镜像内 Nginx 的唯一配置来源
- [`Dockerfile.web`](D:\home\projects\dailyuse\Dockerfile.web) 在构建时将这份文件复制到 `/etc/nginx/nginx.conf`
- [`docker-compose.prod.yml`](D:\home\projects\dailyuse\docker-compose.prod.yml) 不再通过 volume 挂载第二份 `nginx.conf`

这样做的目的：

1. 避免“镜像里一份、服务器再覆盖一份”导致配置来源不清晰。
2. 让本地构建、CI 构建、生产运行三者使用同一份 Nginx 配置。
3. 降低线上临时修复长期遗留的概率。

如果未来需要调整静态资源缓存、`/api/` 反代或 `sw.js` 规则，统一只修改仓库根目录的 [`nginx.conf`](D:\home\projects\dailyuse\nginx.conf)，然后重建并发布 `web` 镜像。

## 2. 为什么不部署 Nginx Proxy Manager

当前阶段不建议部署 Nginx Proxy Manager。

原因很直接：

1. 当前只有单机、单套应用、单域名入口，`Caddy` 已足够处理 HTTPS 和反向代理。
2. `web` 镜像内部已经包含 Nginx，静态资源和 `/api/` 转发都已经配置好了。
3. Nginx Proxy Manager 会额外引入一层代理和管理面板，通常还伴随额外数据库，增加运维复杂度。
4. 它不能解决你现在真正的风险点：服务器拉镜像不稳定。

只有在下面这种场景里，才值得考虑后续替换或增加 Nginx Proxy Manager：

- 一台机子要托管很多独立站点
- 需要非开发人员通过 GUI 管理证书和转发规则
- 需要更复杂的多域名、多 upstream 编排

就当前仓库和当前任务来说，继续使用 `Caddy + web(Nginx)` 是更干净的方案。

## 3. 当前生产编排的真实结构

仓库里的 [`docker-compose.prod.yml`](D:\home\projects\dailyuse\docker-compose.prod.yml) 已定义以下服务：

| 服务 | 镜像 | 作用 | 建议来源 |
|------|------|------|---------|
| `postgres` | `pgvector/pgvector:pg16` | 主数据库 | 本地离线预加载 |
| `redis` | `redis:7-alpine` | 缓存 / 队列 | 本地离线预加载 |
| `ai-service` | `${REGISTRY}/${IMAGE_NAMESPACE}/dailyuse-ai-service` | AI 服务 | 阿里云 ACR |
| `api` | `${REGISTRY}/${IMAGE_NAMESPACE}/dailyuse-api` | 后端 API | 阿里云 ACR |
| `powersync` | `journeyapps/powersync-service:latest` | Desktop / Web 实时同步服务 | 本地离线预加载 |
| `web` | `${REGISTRY}/${IMAGE_NAMESPACE}/dailyuse-web` | 前端站点 | 阿里云 ACR |
| `caddy` | `caddy:2-alpine` | HTTPS 入口 | 本地离线预加载 |
| `watchtower` | `containrrr/watchtower` | 自动更新 | 本地离线预加载 |

其中：

- `postgres` 和 `redis` 只绑定宿主机 `127.0.0.1`
- `api`、`web`、`ai-service`、`powersync` 都不直接暴露到公网
- `caddy` 暴露 `80/443`
- `watchtower` 通过 `/var/run/docker.sock` 管理容器更新

### 3.1 代理层职责划分

当前推荐职责边界如下：

- `Caddy`
  - 负责公网 `80/443`
  - 负责 TLS 证书申请与续期
  - 负责把主站域名转发给 `web`
  - 负责把同步子域名转发给 `powersync`
- `web` 容器内 Nginx
  - 负责前端静态资源
  - 负责 SPA 路由回退到 `index.html`
  - 负责把 `/api/*` 转发到 Docker 网络内的 `api:3000`
- `powersync`
  - 负责订阅 Postgres 逻辑复制
  - 负责把 Postgres 变化下发给 desktop / web 客户端
- `api`
  - 只处理业务逻辑、鉴权、参数校验、CORS 白名单
  - 负责签发 PowerSync token，并返回公网同步 endpoint

这意味着浏览器主链路应始终走同源访问：

```text
https://dailyuse.bakersean.top
  ├─ /            -> web 静态资源
  └─ /api/*       -> web(Nginx) -> api
```

Desktop / Web 同步链路应为：

```text
desktop / web client
  ├─ GET https://dailyuse.bakersean.top/api/v1/powersync/token
  └─ connect https://sync.dailyuse.bakersean.top
```

补充一点：生产编排里的 `powersync` 连接 Postgres 时，不再使用手拼 `uri`。
这里改成了 `hostname / port / database / username / password` 的字段式配置，直接复用 `DB_*` 变量，避免密码里包含 `/`、`=`、`@`、`:` 时把 DSN 解析坏。

不推荐把前端改成直接跨域访问单独 API 域名作为主方案。  
`API` 侧保留 CORS 白名单是安全兜底，不是主访问路径。

## 4. 镜像策略

### 4.1 推荐策略

推荐把镜像分成两类处理：

1. 基础设施镜像：本地拉取后离线上传到服务器
2. 业务镜像：服务器直接从阿里云 ACR 拉取

这样做的原因：

- 基础镜像来自 Docker Hub，命中你当前网络问题的概率最高
- 业务镜像已经托管在阿里云 ACR，国内服务器访问通常稳定
- 服务器不参与源码构建，只负责拉镜像和启动，部署链路更短

### 4.2 需要离线准备的基础设施镜像

建议固定打包这 4 个：

```text
pgvector/pgvector:pg16
redis:7-alpine
caddy:2-alpine
containrrr/watchtower
journeyapps/powersync-service:latest
```

你本地如果已经生成了 [`dailyuse-infra-images.tar`](D:\home\projects\dailyuse\dailyuse-infra-images.tar)，就直接复用它。

本地打包命令：

```bash
docker pull pgvector/pgvector:pg16
docker pull redis:7-alpine
docker pull caddy:2-alpine
docker pull containrrr/watchtower
docker pull journeyapps/powersync-service:latest

docker save \
  pgvector/pgvector:pg16 \
  redis:7-alpine \
  caddy:2-alpine \
  containrrr/watchtower \
  journeyapps/powersync-service:latest \
  -o dailyuse-infra-images.tar
```

上传到服务器：

```bash
scp dailyuse-infra-images.tar ali-dailyuse:/opt/dailyuse/
```

服务器加载：

```bash
ssh ali-dailyuse "cd /opt/dailyuse && docker load -i dailyuse-infra-images.tar"
```

### 4.3 业务镜像的兜底策略

默认情况下，业务镜像直接从 ACR 拉取：

- `dailyuse-api`
- `dailyuse-web`
- `dailyuse-ai-service`

如果后续发现服务器连 ACR 也偶发超时，那么业务镜像也可以走同样的离线路线：

```bash
docker pull <ACR_REGISTRY>/<NAMESPACE>/dailyuse-api:prod-latest
docker pull <ACR_REGISTRY>/<NAMESPACE>/dailyuse-web:prod-latest
docker pull <ACR_REGISTRY>/<NAMESPACE>/dailyuse-ai-service:prod-latest

docker save \
  <ACR_REGISTRY>/<NAMESPACE>/dailyuse-api:prod-latest \
  <ACR_REGISTRY>/<NAMESPACE>/dailyuse-web:prod-latest \
  <ACR_REGISTRY>/<NAMESPACE>/dailyuse-ai-service:prod-latest \
  -o dailyuse-app-images.tar

scp dailyuse-app-images.tar ali-dailyuse:/opt/dailyuse/
ssh ali-dailyuse "cd /opt/dailyuse && docker load -i dailyuse-app-images.tar"
```

注意：只要服务器上已经 `docker load` 进对应 tag，`docker compose up -d` 就会直接复用本地镜像，不一定再去远端拉取。

## 5. 部署前检查

正式启动前，先确认这几件事：

### 5.1 服务器目录文件齐全

```bash
ssh ali-dailyuse "ls -lah /opt/dailyuse"
```

至少应看到：

- `docker-compose.prod.yml`
- `Caddyfile`
- `.env.production.local` 或 `.env`
- `dailyuse-infra-images.tar`（如果走离线基础镜像方案）

### 5.2 统一环境文件命名

仓库里的启动命令默认使用 `.env.production.local`。  
如果你服务器上上传的是 `.env`，建议直接改名，减少后续命令分歧：

```bash
ssh ali-dailyuse "cd /opt/dailyuse && [ -f .env ] && [ ! -f .env.production.local ] && mv .env .env.production.local || true"
```

后文统一按 `.env.production.local` 说明。

### 5.3 域名和端口放通

必须满足：

- 域名 `APP_DOMAIN` 已解析到服务器公网 IP
- 阿里云安全组放通 `80/tcp`、`443/tcp`、`443/udp`
- 本机防火墙未拦截 80/443

否则 `Caddy` 无法签发或续期证书。

### 5.4 Docker 登录状态

```bash
ssh ali-dailyuse "docker info 2>/dev/null | sed -n '/Username:/p'"
```

如果这里没有看到登录用户，说明 Watchtower 后续自动拉取 ACR 镜像会失败，需要重新 `docker login`。

## 6. 推荐部署顺序

不要第一次就一把把所有服务拉起来后再排错。  
推荐分两段启动：

1. 先启动核心业务栈，确认服务通
2. 再启动 Watchtower

这样更容易定位问题，也避免首发阶段自动更新进程干扰排查。

### 6.1 第一步：加载离线基础镜像

如果你已经上传了离线包，执行：

```bash
ssh ali-dailyuse "cd /opt/dailyuse && docker load -i dailyuse-infra-images.tar"
```

可选验证：

```bash
ssh ali-dailyuse "docker images --format '{{.Repository}}:{{.Tag}}' | grep -E 'pgvector/pgvector|redis|caddy|containrrr/watchtower'"
```

### 6.2 第二步：先启动核心服务

```bash
ssh ali-dailyuse "cd /opt/dailyuse && docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d postgres redis ai-service api powersync web caddy"
```

这一步的意义：

- 先验证数据库、缓存、AI、API、Web、入口层都正常
- 暂时不让 Watchtower 介入

### 6.3 第三步：检查容器状态

```bash
ssh ali-dailyuse "cd /opt/dailyuse && docker compose -f docker-compose.prod.yml --env-file .env.production.local ps"
```

重点看：

- `postgres` 是否 healthy
- `redis` 是否 healthy
- `ai-service` 是否 healthy
- `api` 是否 healthy
- `powersync` 是否 healthy
- `web` 是否 healthy
- `caddy` 是否 running

### 6.4 第四步：检查关键日志

```bash
ssh ali-dailyuse "cd /opt/dailyuse && docker compose -f docker-compose.prod.yml --env-file .env.production.local logs --tail=100 postgres"
ssh ali-dailyuse "cd /opt/dailyuse && docker compose -f docker-compose.prod.yml --env-file .env.production.local logs --tail=100 ai-service"
ssh ali-dailyuse "cd /opt/dailyuse && docker compose -f docker-compose.prod.yml --env-file .env.production.local logs --tail=100 api"
ssh ali-dailyuse "cd /opt/dailyuse && docker compose -f docker-compose.prod.yml --env-file .env.production.local logs --tail=100 powersync"
ssh ali-dailyuse "cd /opt/dailyuse && docker compose -f docker-compose.prod.yml --env-file .env.production.local logs --tail=100 caddy"
```

特别关注：

- `api` 是否完成迁移并正常监听 `3000`
- `ai-service` 是否成功监听 `8100`
- `caddy` 是否成功申请证书

### 6.5 第五步：本机健康检查

```bash
ssh ali-dailyuse "curl -fsS http://127.0.0.1:3000/healthz"
ssh ali-dailyuse "curl -fsS http://127.0.0.1:8100/healthz"
ssh ali-dailyuse "curl -I http://127.0.0.1"
```

如果 `curl -I http://127.0.0.1` 返回的是 `Caddy` 转出来的站点响应，说明入口链路已经打通。

### 6.6 第六步：公网验证 HTTPS

在本地执行：

```bash
curl -I https://<你的域名>
```

或直接浏览器访问首页、登录、调用一个需要 `/api/` 的页面。

### 6.7 第七步：确认稳定后再启动 Watchtower

```bash
ssh ali-dailyuse "cd /opt/dailyuse && docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d watchtower"
```

然后看 Watchtower 日志：

```bash
ssh ali-dailyuse "cd /opt/dailyuse && docker compose -f docker-compose.prod.yml --env-file .env.production.local logs --tail=100 watchtower"
```

## 7. 推荐的实际执行脚本顺序

这是最贴近当前任务流的一套命令顺序。

### 7.1 本地机器执行

```bash
docker pull pgvector/pgvector:pg16
docker pull redis:7-alpine
docker pull caddy:2-alpine
docker pull containrrr/watchtower

docker save \
  pgvector/pgvector:pg16 \
  redis:7-alpine \
  caddy:2-alpine \
  containrrr/watchtower \
  -o dailyuse-infra-images.tar

scp dailyuse-infra-images.tar ali-dailyuse:/opt/dailyuse/
```

### 7.2 服务器执行

```bash
ssh ali-dailyuse "cd /opt/dailyuse && docker load -i dailyuse-infra-images.tar"
ssh ali-dailyuse "cd /opt/dailyuse && ls -lah"
ssh ali-dailyuse "cd /opt/dailyuse && docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d postgres redis ai-service api powersync web caddy"
ssh ali-dailyuse "cd /opt/dailyuse && docker compose -f docker-compose.prod.yml --env-file .env.production.local ps"
ssh ali-dailyuse "cd /opt/dailyuse && docker compose -f docker-compose.prod.yml --env-file .env.production.local logs --tail=100 caddy"
ssh ali-dailyuse "cd /opt/dailyuse && docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d watchtower"
```

## 8. 环境变量检查要点

至少确认以下变量已经在 `.env.production.local` 中定义：

### 8.1 镜像仓库

```env
REGISTRY=<你的 ACR registry>
IMAGE_NAMESPACE=<你的 ACR namespace>
API_TAG=prod-latest
WEB_TAG=prod-latest
AI_SERVICE_TAG=prod-latest
```

### 8.2 基础服务

```env
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
REDIS_PASSWORD=...
```

### 8.3 业务鉴权

```env
JWT_SECRET=...
SERVICE_SECRET=...
```

### 8.4 域名相关

```env
APP_DOMAIN=<你的域名>
POWERSYNC_DOMAIN=sync.<你的域名>
ACME_EMAIL=<你的邮箱>
CORS_ORIGIN=https://<你的域名>
ALLOWED_ORIGINS=https://<你的域名>
```

### 8.5 PowerSync 相关

```env
POWERSYNC_URL=https://sync.<你的域名>
POWERSYNC_PRIVATE_KEY=<base64-encoded-pem>
POWERSYNC_PUBLIC_KEY_N=<jwk-n>
POWERSYNC_PUBLIC_KEY_E=AQAB
POWERSYNC_KEY_ID=<key-id>
```

注意：

- `POWERSYNC_URL` 必须是 desktop 能直接访问的公网 HTTPS 地址
- `POWERSYNC_DOMAIN` 必须有 DNS 解析，并指向同一台服务器
- `postgres` 在生产环境必须启用 `wal_level=logical`

### 8.6 AI 相关

按你的实际供应商填写：

```env
OPENAI_API_KEY=...
OPENAI_MODEL=...
OPENAI_BASE_URL=...
```

如果 AI 能力走其他提供商，也要确认 API 和 AI service 所需变量已经齐全。

## 9. 首次上线后的验证清单

完成部署后，至少做下面这些验证：

1. 首页可以正常打开，证书为有效 HTTPS。
2. 前端访问 `/api/` 的请求能正常返回，不是 502/504。
3. `api` 健康检查通过：`/healthz`
4. `ai-service` 健康检查通过：`/healthz`
5. `powersync` 健康检查通过：`/probes/liveness`
6. `postgres`、`redis` 状态是 healthy
7. `desktop` 登录后能从 `/api/v1/powersync/token` 获取 token
8. Web 与 Desktop 各创建一个 goal 后，双端都能看到两个 goal
9. 数据持久化卷已创建：`postgres-prod-data`、`redis-prod-data`、`api-uploads`
10. Watchtower 启动后没有认证错误、没有疯狂重启容器

查看卷：

```bash
ssh ali-dailyuse "docker volume ls | grep dailyuse"
```

## 10. 常见问题与处理

### 10.1 `docker compose up` 时卡在拉基础镜像

表现：

- `postgres`、`redis`、`caddy`、`watchtower` 拉取超时

处理：

- 不要在服务器反复重试
- 直接在本地 `docker pull` + `docker save`
- `scp` 到服务器后 `docker load`

### 10.2 `web/api/ai-service` 拉取失败

表现：

- ACR 认证失败
- 网络偶发超时

处理顺序：

1. 先确认服务器 `docker login` 仍然有效
2. 再确认 `.env.production.local` 中 `REGISTRY` 和 `IMAGE_NAMESPACE` 是否正确
3. 如果仍不稳定，本地从 ACR 拉取后离线导入业务镜像

### 10.3 `caddy` 证书申请失败

通常是这几类原因：

- 域名未解析到当前服务器
- 安全组未放通 80/443
- 本机防火墙阻断
- DNS 仍在传播

检查命令：

```bash
ssh ali-dailyuse "cd /opt/dailyuse && docker compose -f docker-compose.prod.yml --env-file .env.production.local logs --tail=200 caddy"
```

### 10.4 `api` 启动失败

`api` 容器的启动命令会先跑迁移，再启动服务。  
如果它起不来，优先看这里：

```bash
ssh ali-dailyuse "cd /opt/dailyuse && docker compose -f docker-compose.prod.yml --env-file .env.production.local logs --tail=200 api"
```

重点排查：

- 数据库连接参数错误
- 数据库还未 ready
- 迁移脚本执行失败
- AI service 内部鉴权密钥不一致

### 10.5 Watchtower 自动更新不生效

重点看两件事：

1. 服务器能否访问 ACR
2. `/root/.docker/config.json` 是否仍有效

查看日志：

```bash
ssh ali-dailyuse "cd /opt/dailyuse && docker compose -f docker-compose.prod.yml --env-file .env.production.local logs --tail=200 watchtower"
```

## 11. 日常发布、更新和回滚

### 11.1 正常发布

仓库当前采用 `release-please + docker-deploy` 的工程化发布链路：

- [`release-please.yml`](D:\home\projects\dailyuse\.github\workflows\release-please.yml) 在 `main` 分支推进后运行
- [`release-please-config.json`](D:\home\projects\dailyuse\release-please-config.json) 和 [`.release-please-manifest.json`](D:\home\projects\dailyuse\.release-please-manifest.json) 负责版本策略与当前版本状态
- [`docker-deploy.yml`](D:\home\projects\dailyuse\.github\workflows\docker-deploy.yml) 监听 `v*` tag，构建并推送业务镜像

推荐发布方式不是手工 `git tag`，而是：

```bash
git push origin main
```

随后由 release-please 负责：

1. 计算版本号
2. 更新版本文件和 `CHANGELOG.md`
3. 创建或更新 release PR
4. 在 release PR 合并后自动创建 GitHub Release 和正式 tag

正式 tag 创建后，`docker-deploy.yml` 才会继续执行：

1. 构建 `api`、`web`、`ai-service`
2. 推送不可变镜像 tag
3. 同时更新 `prod-latest`

如果 Watchtower 已开启，服务器会在轮询周期内自动拉取并滚动更新。

结论：

- 不要把“手工推送 tag”当作日常标准发布方式
- 日常版本、tag、changelog 由 release-please 管理
- `docker-deploy` 只消费 release-please 产出的正式 tag

### 11.2 更稳妥的生产更新建议

如果你更希望更新可控，而不是全自动，建议把 Watchtower 当作可选项：

1. 新版本推到 ACR
2. 手工在服务器执行 `docker compose pull`
3. 再手工执行 `docker compose up -d`

这比“完全自动更新”更容易控制生产变更窗口。

### 11.2.1 关于 `api` 重建时的短暂 502

由于 `web` 会把 `/api/*` 转发给 `api:3000`，当你手工 `--force-recreate api` 时，在 `api` 容器重新启动到 healthy 之前，外部请求可能短暂返回 `502`。这是正常窗口，不代表代理配置错误。

当前 [`nginx.conf`](D:\home\projects\dailyuse\nginx.conf) 已启用 Docker DNS 动态解析：

- `resolver 127.0.0.11 ipv6=off valid=30s;`
- `/api/` 使用变量形式 `proxy_pass`

这样可以避免另一类更严重的问题：

- `api` 容器重建后 IP 已变化
- `web` 内 Nginx 仍长时间卡在旧 upstream 地址
- 导致 `api` 已恢复但外部依旧持续 `502`

现在的预期行为应当是：

1. `api` 重建期间可能短暂 `502`
2. `api` healthy 后，`/api/*` 自动恢复，无需手工重建 `web`

### 11.3 手动回滚

将 `.env.production.local` 中的业务 tag 从 `prod-latest` 改成历史不可变 tag，例如：

```env
API_TAG=v0.3.0-prod.20260403-150338-93dca44f0df1
WEB_TAG=v0.3.0-prod.20260403-150338-93dca44f0df1
AI_SERVICE_TAG=v0.3.0-prod.20260403-150338-93dca44f0df1
```

然后执行：

```bash
ssh ali-dailyuse "cd /opt/dailyuse && docker compose -f docker-compose.prod.yml --env-file .env.production.local pull"
ssh ali-dailyuse "cd /opt/dailyuse && docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d"
```

如果服务器拉取这个历史 tag 仍然受网络影响，也可以在本地先拉取对应 tag，再离线导入。

## 12. 最终推荐的实施方案

综合你当前环境，最合理的执行方案是：

1. 保持现有 `docker-compose.prod.yml + Caddyfile` 架构，不新增 Nginx Proxy Manager。
2. 基础设施镜像统一走“本地拉取 + 打包 + 上传 + 服务器导入”。
3. 业务镜像优先走阿里云 ACR。
4. 首次上线时先不启动 Watchtower，待站点验证通过后再启用。
5. 如果后续确认 ACR 也不稳定，就把业务镜像也纳入离线导入流程。
6. 生产回滚依赖不可变 tag，不依赖 `prod-latest`。

按这套流程执行，既能避开服务器的镜像拉取问题，也不会把运维架构搞得过重。
