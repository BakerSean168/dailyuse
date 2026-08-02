---
tags:
  - plan
  - archive
description: 裁剪 API Docker 运行镜像与生产依赖闭包
created: 2026-07-31T00:00:00
updated: 2026-07-31T00:00:00
---

# API Runtime Image Pruning

## 目标

在不破坏 Prisma、PowerSync 与数据库启动链的前提下，让 API runtime 镜像只携带 API 的生产依赖闭包和必需运行产物，不再复制根 workspace 的完整 `node_modules`。

## 成功标准

1. 普通源码变更不再使 Docker 依赖获取层失效。
2. runtime 不包含 Web、Desktop、Expo、Storybook 等无关依赖。
3. 数据库准备、Prisma schema push、API 启动和健康检查保持正常。
4. 本地 prod-like 完整重建通过，记录优化前后镜像体积。

## 实施步骤

1. 用可重复探针验证 pnpm workspace 的生产部署产物。
2. 调整 API Docker 构建阶段与 runtime 复制边界。
3. 增加 Dockerfile/部署产物结构回归检查。
4. 运行相关测试、治理检查和本地 Docker 完整重建。

## 非目标

- 不在本轮重写全部 `external` 策略。
- 不修改其他应用的依赖安装语义。
- 不改变数据库业务 schema。

## 实施结果

- API runtime 改为使用 `pnpm deploy --prod` 生成的生产依赖闭包，不再复制 workspace 根 `node_modules` 和完整 `packages/`。
- 构建依赖网络获取拆为只由 lockfile/config 驱动的 `pnpm fetch` 层；源码复制后仅执行 `pnpm install --offline`。
- 显式补齐 API 启动链所需的 `prisma`、`tsx`，并修复 `utils`、`dashboard`、`task` 的依赖归属。
- 运行镜像由 700,322,858 bytes 降至 207,386,664 bytes，减少约 70.4%。
- 容器 `/app` 由约 2.6 GiB 降至 549 MiB，根 `node_modules` 顶层条目由 1,717 降至 357。
- 六个本地服务均 healthy；Web、PowerSync、API `/healthz` 与浏览器源 CORS 预检通过。
- Docker 结构测试 4/4、数据库启动链测试 3/3、受影响项目 lint、治理检查全部通过；task 测试 761/761 通过。

## 残余项

builder 仍使用 workspace 的 hoisted 安装，以满足当前包构建对提升后类型依赖的隐性假设。BuildKit store cache 会复用下载，但首次构建仍需获取完整构建依赖；后续若继续优化，应先逐包补齐构建期依赖并消除 hoisting 假设，再切换 isolated/filter 安装。
