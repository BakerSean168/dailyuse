---
tags:
  - plan
  - archive
description: 三轮收敛 API migrator、workspace 依赖闭包与 Docker 构建缓存
created: 2026-07-31T00:00:00
updated: 2026-08-01T00:00:00
---

# Three-round Docker Build Optimization

## 结果

三轮优化均已完成：数据库初始化被拆成一次性 `migrator` runtime；API runtime 只运行构建产物与显式生产依赖；Docker builder 使用 isolated、filtered install，并通过 BuildKit cache 分离依赖与源码层。

## Round 1：Migrator 与 API runtime 分离

- 新增 `@memoflow/migrator`，以退出码作为 Compose 完成契约。
- 数据库准备脚本编译到 `@memoflow/database/dist/runtime-scripts` 后由 migrator 执行。
- API runtime 移除 Prisma CLI、tsx、数据库源码与 shell 启动链，直接运行 `node dist/main.js`。
- local/prod Compose 使用 `service_completed_successfully` 阻止迁移失败后的 API 启动。
- CI 与 PowerShell 发布入口构建并推送独立 migrator 镜像。

## Round 2：包自包含与 isolated builder

- 为 API 生产闭包新增依赖归属审计，24 个 workspace 包通过。
- 修复 hoisting 隐藏的运行/测试依赖，并关闭 pnpm `autoInstallPeers`。
- workspace 运行包通过 `files` 只发布 `dist` 与必要 Prisma 元数据。
- builder 使用 `node-linker=isolated` 与 API/migrator filtered install；不再依赖根级 hoisting。

## Round 3：构建层与 external 收敛

- builder、API 与 migrator 共享 Node/OpenSSL 基础层。
- API tsup 使用 `skipNodeModulesBundle` 表达 external 政策，移除易漂移的手工枚举。
- pnpm store、Nx cache 和 GitHub Actions BuildKit cache 均设置稳定 seam。
- 放弃无过滤的 `pnpm fetch`：它会为整个 workspace 拉取 3,225 个包；filtered isolated install 将 builder 闭包降至约 1,925 个包，热构建下载为 0。

## 验证结果

| 指标                    |            优化前 |            优化后 |
| ----------------------- | ----------------: | ----------------: |
| API image               | 207,386,664 bytes | 143,355,478 bytes |
| API production closure  |      442 packages |      308 packages |
| builder install closure |    3,225 packages | 约 1,925 packages |
| migrator image          |            不存在 | 175,893,322 bytes |

API 镜像减少 64,031,186 bytes，约 30.9%。最终 `pnpm docker:local:up` 退出 0：migrator 幂等执行后为 `Exited (0)`，API、Web、AI Service、PowerSync、PostgreSQL、Redis 均 healthy，API `/healthz` 返回 `{"status":"ok"}`。

以下门禁通过：migrator test/typecheck/lint、API runtime dependency audit、Compose 环境阴影测试、PowerShell 发布脚本语法、Docker 镜像内容边界与完整 prod-like 编排。

## 生产发布约束

API 与 migrator 必须作为匹配版本显式发布。两者均禁用 Watchtower；生产更新执行 `docker compose pull && docker compose up -d`，并确认 migrator 成功退出后 API healthy。Web 与 AI Service 仍可由 Watchtower 管理。
