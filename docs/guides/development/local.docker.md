---
tags:
  - guide
  - development
  - docker
  - local
description: 使用 docker-compose.local.yml 做 prod-like 本地验证的统一入口
created: 2026-05-19T00:00:00
updated: 2026-07-15T00:00:00
---

# Local Docker 验证

`docker-compose.local.yml` 是当前仓库做容器化改动、本地联调和发布前验收的默认入口。

它的定位不是“随便起一下服务”，而是：

- 尽量贴近生产拓扑：`postgres + redis + ai-service + api + powersync + web`
- 强制本地构建 `api` / `web` / `ai-service` 镜像
- 在进入 PR 和 release 链路前，先验证本地容器运行结果
- **host 端口与 host-dev / Playwright e2e 隔离**（SSOT：`tools/runtime/profiles.json`）

## 适用场景

以下变更默认先走本地 Docker 验证：

- Dockerfile
- `docker-compose.local.yml`
- `docker-compose.prod.yml`
- API / Web / AI Service 启动链路
- PowerSync / snapshot / cron / runtime path / env 注入
- “只在容器里会出问题”的依赖、bundling、入口脚本问题

## 启动命令

推荐统一入口（会强制隔离 host 端口）：

```bash
pnpm runtime:preflight:local-docker
pnpm docker:local:up
```

该入口会把当前 Git revision 和 UTC 构建时间写入 Web、API、AI Service 的 OCI 镜像标签；工作区存在未提交修改时，revision 带 `-dirty` 后缀。构建后可用以下命令核对：

```bash
docker image inspect dailyuse-api:local --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}'
```

等价底层命令：

```bash
VCS_REF=<git-sha> BUILD_DATE=<utc-iso-time> docker compose -f docker-compose.local.yml --env-file .env.production.local up -d --build
```

> 若直接调用底层 compose 且 `.env.production.local` 把 `API_HOST_PORT` 设成 `3000`，会与 `pnpm dev` / Playwright 抢口。  
> `pnpm docker:local:*` 会按 SSOT 纠正冲突端口（见 [runtime-lanes.md](./runtime-lanes.md)）。

默认本地访问端口：

- Web: `http://localhost:58080`
- API: `http://localhost:53080`
- AI: `http://localhost:58100`
- PowerSync: `http://localhost:58081`
- PostgreSQL: `127.0.0.1:55432`
- Redis: `127.0.0.1:56379`

仅重启已有容器：

```bash
pnpm docker:local:up
# 或（不跑 build-prep 时请自知风险）
docker compose -f docker-compose.local.yml --env-file .env.production.local up -d
```

查看日志：

```bash
pnpm docker:local:logs
```

停止并移除容器：

```bash
pnpm docker:local:down
```

## 与 host-dev / e2e 的关系

| 车道 | API | Web | PG | 说明 |
| --- | --- | --- | --- | --- |
| local-docker | 53080 | 58080 | 55432 | 本文件 |
| host-dev | 3000 | 5173 | 5432 | `pnpm dev` |
| e2e | 3000 | 5173 | 5433 | Playwright |

完整互斥规则与排障见 [runtime-lanes.md](./runtime-lanes.md)。

## 本地验证最低要求

进入 PR 前，至少确认：

- `api` healthy
- `web` healthy
- `ai-service` healthy
- `powersync` healthy
- 相关改动相关的 env / volume 已在本地 compose 中接通
- 关键用户链路在本地容器环境下能跑通

如果改动涉及 snapshot / PowerSync / cron，额外确认：

- `POWERSYNC_SNAPSHOT_DIR` 已挂到本地 volume
- `SNAPSHOT_REBUILD_ENABLED` / `SNAPSHOT_REBUILD_SCHEDULE` 注入到了 `api`
- 本地容器里对应脚本、路由或日志路径能工作

## 与发布链路的关系

本地 Docker 验证通过后，才进入后续工作流：

1. 在短生命周期分支上提交改动并发起 PR
2. PR 合并到 `main`
3. `release-please` 工作流更新或创建 release PR
4. release PR 合并后生成正式 tag / release
5. `docker-deploy.yml` 基于正式 tag 构建并推送生产镜像

不要把“直接改生产 compose / 直接换线上 tag / 手工试 production 镜像”当作默认开发流程。  
这些只应作为例外的生产验收或故障处理动作，并且应晚于本地 Docker 验证。

相关入口：

- 运行时车道说明见 [runtime-lanes.md](./runtime-lanes.md)
- 发布链路说明见 [release-workflow.md](./release-workflow.md)
- Git/PR 约定见 [git-workflow.md](./git-workflow.md)
- 生产部署说明见 [deployment README](../../deployment/README.md)
