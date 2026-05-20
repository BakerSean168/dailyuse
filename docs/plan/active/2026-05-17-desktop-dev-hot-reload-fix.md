---
tags:
  - plan
  - active
  - desktop
  - electron
  - vite
description: 修正 desktop 开发模式热更新失效与启动前全量依赖构建的问题
created: 2026-05-17T00:00:00
updated: 2026-05-17T00:00:00
status: active
---

# Desktop 开发模式热更新修复方案

## 目标

让 `pnpm nx serve desktop` 回到快速内环：窗口稳定连接 Vite dev server，`packages/app-vue` 源码改动可热更新，日常启动不再先跑整条依赖 build 和原生模块重建。

## 实施摘要

- 统一桌面端主进程 dev 判定，优先使用 `VITE_DEV_SERVER_URL` 决定是否加载 Vite dev server
- 保留 renderer 对 `@dailyuse/app-vue` 的 workspace 源码 alias，不切回 `dist`
- 将 `desktop:serve` 改为快速启动，不再默认依赖 `^build` 和 `native-rebuild`
- 新增显式的 dev 准备入口，保留需要时的全量依赖构建和原生模块重建能力

## 验收标准

- `pnpm nx serve desktop` 启动日志不再出现 20+ 个依赖项目的 `build`
- 登录窗口和主窗口在开发模式下加载 `VITE_DEV_SERVER_URL`
- 修改 `packages/app-vue/src/views/DesktopAuthView.vue` 后无需退出 Electron 即可看到更新
- `pnpm nx build desktop` 继续通过

## 约束

- 不回退到让 desktop 消费 `@dailyuse/app-vue/dist`
- 不删除 `native-rebuild` 能力，只把它移出默认日常启动链
- 不修改用户当前在 `packages/app-vue/src/views/DesktopAuthView.vue` 上的未提交业务改动
