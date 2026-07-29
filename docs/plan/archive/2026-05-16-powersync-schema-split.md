---
tags:
  - plan
  - active
  - desktop
  - database
  - powersync
description: 拆出 PowerSync 纯 schema 包，收缩 database 运行时职责，移除 desktop 对 database CJS 兼容层的依赖
created: 2026-05-16T00:00:00
updated: 2026-05-16T00:00:00
status: active
---

# PowerSync Schema 拆包实施方案

## 目标

将 `@memoflow/database` 中混合的 Prisma runtime 与 PowerSync schema 职责拆开，新建 `@memoflow/powersync-schema`，让 desktop 主进程不再因为消费纯 schema 或纯 helper 而接触带副作用的 database 根入口。

## 实施摘要

- 新建 `packages/powersync-schema`
- `apps/desktop` 改为消费 `@memoflow/powersync-schema`
- `@memoflow/database` 移除 `powersync` / `dashboard-schema` 公共出口与 `tsup` CJS 补丁链
- 将 `mapper-helpers` 中仍被运行时代码使用的无副作用 helper 迁到 `@memoflow/utils/shared`
- 删除未使用的 `dashboard-schema` 公共 seam

## 验收标准

- `pnpm nx build powersync-schema`
- `pnpm nx build database`
- `pnpm nx build desktop`
- `pnpm nx serve desktop` 不再依赖 `@memoflow/database/dist/index.cjs`

## 约束

- 不保留旧 import alias 作为长期兼容层
- 不继续扩张 `@memoflow/database` 的双格式构建
- 不引入新的运行时 shim
