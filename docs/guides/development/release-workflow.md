---
tags:
  - guide
  - development
  - release
  - workflow
description: 从本地 Docker 验证到 release-please 与 docker-deploy 的标准发布链路
created: 2026-05-19T00:00:00
updated: 2026-07-15T00:00:00
---

# Release 工作流

当前仓库默认采用下面这条主线：

1. 本地用 `docker-compose.local.yml` 做 prod-like 验证
2. 发起 PR，合并到 `main`
3. `release-please` 维护 release PR
4. 合并 release PR 后生成正式 tag / GitHub Release
5. `docker-deploy.yml` 监听正式 tag，构建并推送生产镜像

这条链路的目标是：先在本地容器环境发现运行时问题，再进入版本与镜像发布。

## 标准顺序

### 1. 本地容器验证

先跑统一入口；它会给本地镜像注入当前 Git revision 与构建时间：

```bash
pnpm runtime:preflight:local-docker
pnpm docker:local:up
```

至少确认本次改动相关服务 healthy，且关键链路在容器环境下成立。

### 2. 分支与 PR

- 从 `main` 切短生命周期分支
- 完成改动与本地验证
- 提交并发起 PR
- PR 合并回 `main`

### 3. `main` 触发 `release-please`

`main` 推进后，`.github/workflows/release-please.yml` 会运行：

- 更新版本信息
- 更新 `CHANGELOG.md`
- 创建或更新 release PR

此时**不会**直接发布生产镜像。

### 4. 合并 release PR

release PR 合并后，release-please 会：

- 创建正式 release
- 创建正式 tag（`v*`）

### 5. 正式 tag 触发镜像构建

`.github/workflows/docker-deploy.yml` 监听 `v*` tag，负责：

- 构建 `memoflow-api`
- 构建 `memoflow-migrator`
- 构建 `memoflow-web`
- 推送不可变 tag
- 同时更新 `prod-latest`

因此，**生产镜像的标准来源不是本地手工 build**，而是 release PR 合并后触发的工作流。

API 与数据库初始化现在是一个显式发布单元：生产 Compose 先运行与 API 同版本的 `memoflow-migrator`，只有 migrator 成功退出后才启动 API。为避免 Watchtower 单独替换 API 而绕过这道门禁，`api` 与 `migrator` 的 Watchtower 标签均关闭；Web 仍可自动更新。生产 API 发布必须执行完整的 `docker compose pull && docker compose up -d`。

## 明确禁止的默认路径

以下动作不是默认开发流程：

- 跳过本地 Docker 验证，直接试生产镜像
- 手工推任意临时 tag 作为日常发布方式
- 手工修改生产 `API_TAG` / `MIGRATOR_TAG` / `WEB_TAG` 作为常规上线手段
- 把生产机临时验证动作当成替代 CI / release 流程

这些动作只允许用于：

- 生产故障处置
- rollout 验收
- 回滚
- 明确记录过的临时运维操作

## 与生产部署文档的边界

本文档回答的是：

- 什么时候应该本地验证
- 什么时候进入 PR / release
- 镜像是由哪条工作流产出的

生产服务器怎么部署、怎么回滚、怎么观察日志，看：

- [deployment README](../../deployment/README.md)
