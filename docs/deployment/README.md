# Docker 部署说明

本文档是当前仓库唯一有效的 Docker 生产部署说明，覆盖 `web`、`api`、`ai-service` 三个业务镜像，以及 `postgres`、`redis` 两个基础服务。

## 部署结构

生产编排文件是根目录的 `docker-compose.prod.yml`，包含以下服务：

- `postgres`
- `redis`
- `ai-service`
- `api`
- `web`

镜像来源：

- `dailyuse-api`
- `dailyuse-web`
- `dailyuse-ai-service`

镜像仓库和 tag 由 `.env.production.local` 中的以下变量控制：

- `REGISTRY`
- `IMAGE_NAMESPACE`
- `API_TAG`
- `WEB_TAG`
- `AI_SERVICE_TAG`

## 相关文件

- `Dockerfile.api`
- `Dockerfile.web`
- `Dockerfile.ai-service`
- `docker-compose.prod.yml`
- `.env.production`
- `.env.production.local`
- `tools/docker/publish-images.ps1`

## 发布策略

本仓库的发布方式分成两段：

1. 在构建机执行 Nx 构建和 Docker 构建，并把镜像推送到仓库。
2. 在服务器执行 `docker compose pull` 和 `docker compose up -d` 完成部署。

不要再手工分别执行旧的 `docker build`、`docker tag`、`docker push` 流程；统一使用发布脚本。

### Tag 规则

默认 tag 为不可变版本号，格式如下：

```text
v<package.json version>-prod.<UTC时间戳>-<12位git sha>
```

示例：

```text
v0.3.0-prod.20260403-150338-93dca44f0df1
```

每次推送时还会额外同步一个滚动标签：

```text
prod-latest
```

建议：

- 正式部署使用不可变 tag。
- 快速追最新镜像时使用 `prod-latest` 做观察或临时验证。
- `.env.production.local` 始终保存当前已发布的不可变 tag，避免线上状态不可追踪。

## 构建并推送镜像

前提：

- 本机已安装 Docker。
- 本机可以执行 `pnpm nx ...`。
- 本机已登录阿里云 ACR。
- `.env.production.local` 已设置 `REGISTRY` 和 `IMAGE_NAMESPACE`。

登录仓库：

```powershell
docker login crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com
```

推荐方式：

```powershell
pnpm docker:prod:push
```

等价命令：

```powershell
pwsh -File ./tools/docker/publish-images.ps1 -EnvFile .env.production.local -Push
```

脚本会自动执行：

1. `pnpm nx build api`
2. `pnpm nx build web --configuration=production`
3. 构建 `api`、`web`、`ai-service` 三张镜像
4. 推送不可变 tag
5. 推送 `prod-latest`
6. 回写 `.env.production.local` 中的 `API_TAG`、`WEB_TAG`、`AI_SERVICE_TAG`

如果需要手工指定 tag：

```powershell
pwsh -File ./tools/docker/publish-images.ps1 `
  -EnvFile .env.production.local `
  -Tag v0.3.0-prod.manual-20260404 `
  -Push
```

如果只构建不推送：

```powershell
pnpm docker:prod:build
```

## 服务器部署

服务器需要准备：

- Docker
- Docker Compose 插件
- 项目根目录内的 `docker-compose.prod.yml`
- 一份仅保存在服务器上的 `.env.production.local`
- 对阿里云 ACR 的拉取权限

### 1. 准备环境文件

建议以 `.env.production` 为基础，在服务器创建 `.env.production.local`，至少补齐这些配置：

- `REGISTRY`
- `IMAGE_NAMESPACE`
- `API_TAG`
- `WEB_TAG`
- `AI_SERVICE_TAG`
- `DB_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET`
- `SERVICE_SECRET`
- `CORS_ORIGIN`

`SERVICE_SECRET` 用于 `api` 和 `ai-service` 之间的内部鉴权，必须保持一致。

### 2. 如有端口冲突，先改 host 端口

当前生产 compose 支持独立 host 端口变量：

- `POSTGRES_HOST_PORT`
- `REDIS_HOST_PORT`
- `API_HOST_PORT`
- `WEB_HOST_PORT`
- `AI_SERVICE_HOST_PORT`

容器内部端口保持固定，不要修改服务间通信端口：

- `postgres:5432`
- `redis:6379`
- `ai-service:8100`
- `api:3000`
- `web:80`

### 3. 拉取并启动

```powershell
docker compose -f docker-compose.prod.yml --env-file .env.production.local pull
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d
```

首次部署或配置变更后，建议额外检查展开结果：

```powershell
docker compose -f docker-compose.prod.yml --env-file .env.production.local config
```

## 验证部署

检查容器状态：

```powershell
docker compose -f docker-compose.prod.yml --env-file .env.production.local ps
```

检查日志：

```powershell
docker compose -f docker-compose.prod.yml --env-file .env.production.local logs -f api
docker compose -f docker-compose.prod.yml --env-file .env.production.local logs -f web
docker compose -f docker-compose.prod.yml --env-file .env.production.local logs -f ai-service
```

检查健康端点：

```powershell
curl http://127.0.0.1:3000/healthz
curl http://127.0.0.1:8100/healthz
```

如果 `WEB_HOST_PORT=8080`，还可以直接访问：

```text
http://<server-ip>:8080
```

## 升级与回滚

升级流程：

1. 在构建机执行 `pnpm docker:prod:push`
2. 把新的 `API_TAG`、`WEB_TAG`、`AI_SERVICE_TAG` 同步到服务器
3. 在服务器执行 `pull` 和 `up -d`

回滚流程：

1. 把服务器 `.env.production.local` 中三项 tag 改回上一个已知版本
2. 重新执行：

```powershell
docker compose -f docker-compose.prod.yml --env-file .env.production.local pull
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d
```

因为 tag 是不可变的，所以回滚只需要切回旧 tag，不需要重新构建镜像。

## 常见问题

### 1. `docker compose up -d` 端口冲突

说明主机已有服务占用端口。优先修改以下变量，而不是修改容器内部端口：

- `POSTGRES_HOST_PORT`
- `REDIS_HOST_PORT`
- `API_HOST_PORT`
- `WEB_HOST_PORT`
- `AI_SERVICE_HOST_PORT`

### 2. `api` 启动后访问 AI 失败

优先检查：

- `SERVICE_SECRET` 是否在 `api` 和 `ai-service` 中一致
- `ai-service` 是否为 healthy
- `AI_SERVICE_BASE_URL` 是否保持为 `http://ai-service:8100`

### 3. 推送成功但服务器拉不到镜像

优先检查：

- 服务器是否执行过 `docker login`
- `REGISTRY` 和 `IMAGE_NAMESPACE` 是否正确
- 服务器上的 tag 是否和构建机发布出的 tag 一致

## 约束

- 不提交 `.env.production.local`
- 不在文档中维护手工 build/tag/push 的旧流程
- 不使用 `latest` 作为正式发布唯一标识
- 不在服务器上直接做工作区源码构建，生产服务器只负责拉镜像和启动容器
