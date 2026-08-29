# MemoFlow 阿里云单机部署方案

本文档面向当前这台阿里云服务器，按你已经具备的前提来设计：

- 可以直接使用 `ssh ali-memoflow` 登录服务器
- `/opt/memoflow` 已创建
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
  +--> memoflow.example.com        -> web:80
  |                                   |
  |                                   +--> /      -> 前端静态资源
  |                                   +--> /api/* -> api:3000
  |
  +--> sync.memoflow.example.com   -> powersync:8080
                                          |
                                          +--> postgres:5432

api:3000
  |
  +--> postgres:5432
  +--> redis:6379
  +--> Mastra AI runtime (in-process)

release / promotion
  |
  +--> exact-SHA / digest-pinned images -> explicit migrator-first rollout
```

这套方案下：

- 外网入口只有 `caddy`
- `web` 容器内部已经自带 Nginx，不需要再额外引入 Nginx Proxy Manager
- `web` 的 Nginx 配置以仓库根目录 [`nginx.conf`](D:\home\projects\memoflow\nginx.conf) 为唯一来源
- `powersync` 通过独立子域名走 `caddy -> powersync:8080`
- 数据库和 Redis 只绑定到 `127.0.0.1`，不暴露公网
- 中国 production 的业务镜像从阿里云 ACR 拉取
- PostgreSQL / Redis / Caddy / PowerSync / Watchtower 也使用 ACR digest mirror，避免临时跨境拉取

### 1.1 Nginx 配置约定

生产环境约定如下：

- [`nginx.conf`](D:\home\projects\memoflow\nginx.conf) 只保留一份，作为 `web` 镜像内 Nginx 的唯一配置来源
- [`Dockerfile.web`](D:\home\projects\memoflow\Dockerfile.web) 在构建时将这份文件复制到 `/etc/nginx/nginx.conf`
- [`docker-compose.prod.yml`](D:\home\projects\memoflow\docker-compose.prod.yml) 不再通过 volume 挂载第二份 `nginx.conf`

这样做的目的：

1. 避免“镜像里一份、服务器再覆盖一份”导致配置来源不清晰。
2. 让本地构建、CI 构建、生产运行三者使用同一份 Nginx 配置。
3. 降低线上临时修复长期遗留的概率。

如果未来需要调整静态资源缓存、`/api/` 反代或 `sw.js` 规则，统一只修改仓库根目录的 [`nginx.conf`](D:\home\projects\memoflow\nginx.conf)，然后重建并发布 `web` 镜像。

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

仓库里的 [`docker-compose.prod.yml`](D:\home\projects\memoflow\docker-compose.prod.yml) 已定义以下服务：

| 服务         | 镜像来源                                                   | 作用                       | China production 建议 |
| ------------ | ---------------------------------------------------------- | -------------------------- | --------------------- |
| `postgres`   | `${POSTGRES_IMAGE:-pgvector/pgvector:0.8.5-pg18}`          | 主数据库                   | ACR digest mirror     |
| `redis`      | `${REDIS_IMAGE:-redis:8-alpine}`                           | 缓存 / 队列                | ACR digest mirror     |
| `migrator`   | `${REGISTRY}/${IMAGE_NAMESPACE}/memoflow-migrator`         | 一次性数据库初始化         | ACR immutable image   |
| `api`        | `${REGISTRY}/${IMAGE_NAMESPACE}/memoflow-api`              | 后端 API                   | ACR immutable image   |
| `powersync`  | `${POWERSYNC_IMAGE:-journeyapps/powersync-service:1.20.4}` | Desktop / Web 实时同步服务 | ACR digest mirror     |
| `web`        | `${REGISTRY}/${IMAGE_NAMESPACE}/memoflow-web`              | 前端站点                   | ACR immutable image   |
| `caddy`      | `${CADDY_IMAGE:-caddy:2-alpine}`                           | HTTPS 入口                 | ACR digest mirror     |
| `watchtower` | `${WATCHTOWER_IMAGE:-containrrr/watchtower}`               | 可选辅助更新               | ACR digest mirror     |

其中：

- `postgres` 和 `redis` 只绑定宿主机 `127.0.0.1`
- `api`、`web`、`powersync` 都不直接暴露到公网
- `caddy` 暴露 `80/443`
- `watchtower` 如启用，只管理明确允许的 mutable channel；API/Migrator production promotion 仍由显式 release 流程拥有

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
https://memoflow.bakersean.top
  ├─ /            -> web 静态资源
  └─ /api/*       -> web(Nginx) -> api
```

Desktop / Web 同步链路应为：

```text
desktop / web client
  ├─ GET https://memoflow.bakersean.top/api/v1/powersync/token
  └─ connect https://sync.memoflow.bakersean.top
```

补充一点：生产编排里的 `powersync` 连接 Postgres 时，不再使用手拼 `uri`。
这里改成了 `hostname / port / database / username / password` 的字段式配置，直接复用 `DB_*` 变量，避免密码里包含 `/`、`=`、`@`、`:` 时把 DSN 解析坏。

不推荐把前端改成直接跨域访问单独 API 域名作为主方案。  
`API` 侧保留 CORS 白名单是安全兜底，不是主访问路径。

## 4. 镜像策略

### 4.1 Artifact identity 与区域分发

MemoFlow production 不再把 `prod-latest` 或某个 registry URL 当作发布真值。发布真值是：

```text
exact release SHA -> one build -> OCI digest
                              |-> GHCR (Global)
                              `-> Alibaba ACR (China)
```

- `ghcr.io/<owner>/memoflow-*` 面向 GCP、Oracle、CI 与其他海外 runtime；
- 阿里云杭州 ACR 面向中国 production；
- API / Migrator / Web 每个 release 只 build 一次；同一 build 同时写两个 registry；
- release lane 必须验证 ACR/GHCR immutable tag 的 digest 与 build output 完全一致；
- `prod-latest` 只能作为可选 mutable alias，不能用于 rollback / provenance / deployment truth。

当前中国 production 应优先使用 ACR immutable tag 或 `repository@sha256:<digest>`，避免跨境拉 GHCR/Docker Hub。

### 4.2 Runtime dependency mirror

PostgreSQL、Redis、Caddy、PowerSync、Watchtower 不再依赖生产服务器临时访问 Docker Hub。其 mirror source 由：

```text
tools/ci-cd-platform/runtime-image-mirrors.json
```

管理，并且每一项都必须使用 `@sha256:` pin 到 `linux/amd64` platform manifest。该配置或 mirror workflow 变更合并到 `main` 时会自动运行 `Mirror Runtime Images`；`workflow_dispatch` 只用于显式重试。workflow 通过 `skopeo --preserve-digests` 同步到 ACR 与 GHCR并验证三方 digest 一致。这里故意不复制上游 multi-arch/attestation index，因为阿里 ACR 对部分 OCI attestation manifest 不兼容。

生产 compose 暴露以下完整 image-ref override：

```env
API_IMAGE=<ACR>/memoflow-api@sha256:<digest>
MIGRATOR_IMAGE=<ACR>/memoflow-migrator@sha256:<digest>
WEB_IMAGE=<ACR>/memoflow-web@sha256:<digest>

POSTGRES_IMAGE=<ACR>/memoflow-postgres@sha256:<digest>
REDIS_IMAGE=<ACR>/memoflow-redis@sha256:<digest>
CADDY_IMAGE=<ACR>/memoflow-caddy@sha256:<digest>
POWERSYNC_IMAGE=<ACR>/memoflow-powersync@sha256:<digest>
WATCHTOWER_IMAGE=<ACR>/memoflow-watchtower@sha256:<digest>
```

没有这些 override 时，compose 仍保留公共 registry 默认值，方便开发/验证环境使用；中国 production 则必须显式设置 ACR mirror。

### 4.3 当前生产基线

当前 clean rebuild 基线为：

- PostgreSQL 18 + pgvector 0.8.5；
- Redis 8；
- API / Web / Migrator 使用 exact-SHA immutable image；
- PowerSync 使用 ACR，并应使用 immutable tag 而不是 `latest`；
- Caddy/基础 runtime 通过 ACR mirror 固定；
- Watchtower 不拥有 API/Migrator production promotion；migrator-first rollout 仍由显式 release/promotion 控制。

更新 runtime dependency 时，应把它当作独立 dependency-upgrade 变更：先修改 digest pin、在非生产环境验证，再合并到 `main` 触发 mirror workflow；需要重试时再手工 dispatch。不要把“镜像分发优化”和“依赖升级”混成一次操作。

## 5. 部署前检查

生产发布只接受已经通过 CI / review 的 exact release artifact。服务器只做 promotion，不做源码构建。

### 5.1 目录与配置

```bash
ssh ali-memoflow "ls -lah /opt/memoflow"
```

至少应存在：

- `docker-compose.prod.yml`
- `Caddyfile`
- `.env.production.local`

`.env.production.local` 必须保持 `600`，并显式配置中国 production 使用的 ACR image refs。不要把 private key、webhook secret、数据库密码写入 Git。

### 5.2 Compose preflight

任何 rollout 前先渲染最终配置：

```bash
ssh ali-memoflow \
  "cd /opt/memoflow && docker compose -f docker-compose.prod.yml --env-file .env.production.local config >/tmp/memoflow-prod.rendered.yml"
```

然后检查 image 列表：

```bash
ssh ali-memoflow \
  "cd /opt/memoflow && docker compose -f docker-compose.prod.yml --env-file .env.production.local config --images"
```

China production 的 runtime dependency 应为 ACR immutable tag 或 `@sha256:` ref。API / Migrator / Web 必须使用同一 release 的 exact-SHA/immutable identity。

### 5.3 Registry 可拉取性

在停任何业务服务之前，对即将部署的全部 refs 先执行 `docker pull`。如果 ACR ref 不存在或认证失败，发布在此处停止；不要退回 Docker Hub/GHCR 临时跨境拉取，也不要在生产机重新构建镜像。

## 6. Production promotion

### 6.1 先备份配置

每次 production promotion 至少保留本次变更前的：

- `.env.production.local`
- `docker-compose.prod.yml`
- 当前 application image refs
- 当前 runtime dependency refs

备份目录应为 `700`，包含 secret 的文件保持 `600`。这里是**配置回滚点**，不是业务数据库长期备份策略。

### 6.2 Migrator-first

数据库 schema 变更必须先运行与目标 API 同一 release 的 Migrator：

```bash
ssh ali-memoflow \
  "cd /opt/memoflow && docker compose -f docker-compose.prod.yml --env-file .env.production.local up --no-deps migrator"
```

只有 migrator `Exited (0)` 才能继续 API rollout。失败时保持当前 API/Web 不变，先修复 migration；禁止用 `--accept-data-loss` 或 reset 让生产强行变绿。

### 6.3 显式更新服务

业务 release 通常按下面顺序：

```text
migrator -> api -> powersync -> web -> caddy(if config/image changed)
```

PostgreSQL / Redis / Caddy / PowerSync 的 runtime image digest 只有在独立 dependency-upgrade 已验证时才更新。不要因为“同步 registry”顺手升级依赖。

API 示例：

```bash
ssh ali-memoflow \
  "cd /opt/memoflow && docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d --no-deps --force-recreate api"
```

每重建一个服务都先等它 healthy，再进入下一个服务。

### 6.4 Watchtower 边界

当前 production **不依赖 Watchtower 完成 API/Migrator 发布**。默认保持 Watchtower 不启动；如果未来启用，也只能管理明确允许的 mutable channel，不能绕过 migrator-first / exact-artifact promotion。

## 7. Production acceptance

### 7.1 容器与 revision

```bash
ssh ali-memoflow \
  "cd /opt/memoflow && docker compose -f docker-compose.prod.yml --env-file .env.production.local ps"
```

必须确认：

- `postgres` healthy
- `redis` healthy
- `api` healthy
- `powersync` healthy
- `web` healthy
- `caddy` running
- API/Web 的 OCI `org.opencontainers.image.revision` 等于目标 release SHA
- runtime dependencies 的 `.Config.Image` 与 compose 中 ACR digest refs 一致

### 7.2 公网健康检查

```bash
curl -fsS https://memoflowapi.bakersean.top/healthz
curl -fsS https://memoflowsync.bakersean.top/probes/liveness
curl -fsS -o /dev/null -w '%{http_code}\n' https://memoflow.bakersean.top/
```

GitHub Installation Gateway 还要做 fail-closed probe：无效 `mfi1.prod.*` state 应进入 gateway 并返回 4xx，而不是路由不存在的 404，也不得跨环境 redirect 或创建 intent。

### 7.3 业务 smoke

完成登录后至少验证：

1. Web 能创建/读取一个最小业务对象；
2. PowerSync token / liveness 正常；
3. GitHub App installation 已存在时，Repository connection 能列出被授权的 private fixture repo；
4. webhook signature verification 没有持续错误；
5. 日志中不出现 secret、循环重试或 migration warning。

## 8. Environment contract

关键公开配置示例：

```env
REGISTRY=<China ACR registry>
IMAGE_NAMESPACE=<China ACR namespace>
API_TAG=<immutable release tag>
MIGRATOR_TAG=<same release immutable tag>
WEB_TAG=<same release immutable tag>

# Production may pin the exact release manifests directly; these override REGISTRY + TAG.
API_IMAGE=<ACR>/memoflow-api@sha256:<digest>
MIGRATOR_IMAGE=<ACR>/memoflow-migrator@sha256:<digest>
WEB_IMAGE=<ACR>/memoflow-web@sha256:<digest>

POSTGRES_IMAGE=<ACR>/memoflow-postgres@sha256:<digest>
REDIS_IMAGE=<ACR>/memoflow-redis@sha256:<digest>
CADDY_IMAGE=<ACR>/memoflow-caddy@sha256:<digest>
POWERSYNC_IMAGE=<ACR>/memoflow-powersync@sha256:<digest>
WATCHTOWER_IMAGE=<ACR>/memoflow-watchtower@sha256:<digest>

AUTH_BASE_URL=https://memoflowapi.bakersean.top/api/auth
MEMOFLOW_WEB_URL=https://memoflow.bakersean.top
POWERSYNC_URL=https://memoflowsync.bakersean.top
GITHUB_INSTALLATION_ROUTE_KEY=prod
GITHUB_INSTALLATION_ROUTE_TARGETS=
```

GitHub App private key、webhook secret、JWT/DB/Redis/PowerSync private keys 只存在于 production secret env，不进入文档示例值或 Git。

## 9. Rollback

回滚依赖**上一版 immutable application tag/digest + 上一版配置备份**，不依赖 `prod-latest`。

1. 恢复上一版 `.env.production.local` 与 compose；
2. 对目标历史 refs 执行 `docker pull`；
3. 如果 schema 向后兼容，按 `api -> powersync -> web` 顺序显式 recreate；
4. 如果 migration 不可逆，则不能仅回滚应用镜像，必须按该 release 的 migration rollback/restore 方案处理；
5. 完成后重新跑第 7 节 acceptance。

不要移动旧 tag 指向新 digest，也不要通过重新 build 同一个 tag 模拟 rollback。

## 10. 常见失败

### 10.1 ACR pull/push 失败

先检查 ACR 登录状态、repository/tag 是否真实存在、目标 digest 是否可拉取。若 registry 返回 OCI manifest compatibility 错误，检查是否误推了包含 attestation 的 multi-arch index；MemoFlow runtime mirror 使用明确的 `linux/amd64` platform manifest digest，避免把未知 attestation manifest 推入 ACR。

### 10.2 Migrator 非 0

停止 rollout，保留当前 API/Web。检查 migrator 日志、schema/data invariant 和目标 release SHA；禁止 reset production DB 或接受未审查的数据损失。

### 10.3 API 重建时短暂 502

`web` 通过 Docker DNS 访问 `api:3000`。API recreate 到 healthy 之前可能短暂 502；API healthy 后应自动恢复。若持续 502，再检查 Nginx Docker DNS、API health 和 container network。

### 10.4 Caddy 证书/入口失败

检查 DNS、安全组 80/443、Caddy 日志和目标域名；不要通过额外引入第二个 reverse proxy 临时掩盖问题。

## 11. Release 与 production 的边界

Release Lifecycle V2 负责：

```text
exact main CI
  -> build once
  -> OCI digest
  -> ACR (China) + GHCR (Global)
  -> digest parity
  -> canonical release evidence
```

Production promotion 负责选择已验证的 ACR artifact、migrator-first rollout、health/behavior acceptance 与 rollback evidence。二者不能合并成“push 一个 mutable tag 然后让生产自动漂移”。

第三方 runtime dependency 通过 `Mirror Runtime Images` workflow 单独治理；更新 pin 是 dependency upgrade，不属于普通 application release。

## 12. 当前生产基线

2026-08-29 clean rebuild 后的生产形态：

- workdir：`/opt/memoflow`
- Compose project：`memoflow`
- PostgreSQL 18 + pgvector 0.8.5
- Redis 8
- PowerSync 1.20.4
- API/Web：exact-SHA application artifact
- PostgreSQL / Redis / Caddy / PowerSync：China ACR digest refs
- GitHub Production App：独立 credentials，`GITHUB_INSTALLATION_ROUTE_KEY=prod`，route targets 为空
- Watchtower：不作为当前 production promotion owner

实时 image refs / digests 以 `my-infrastructure/projects/memoflow.yaml` 为基础设施 SSOT；运行时仍应在发布前后使用 `docker compose config --images` 与 `docker inspect` 实测确认。
