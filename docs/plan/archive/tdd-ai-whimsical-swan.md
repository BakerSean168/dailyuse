---
tags:
  - plan
  - testing
  - diagnosis
description: 完整测试体系历史诊断输入
created: 2026-04-27T00:00:00
updated: 2026-05-11T00:00:00
status: archive
---

# 完整测试体系诊断快照

## 文档定位

这份文档只保留为历史诊断输入，用于解释为什么测试体系需要从“已有基础设施”继续收口到“优雅闭环”。

当前阶段的正式执行方案见：

- `docs/plan/archive/2026-04-27-full-test-system-rollout.md`
- `docs/plan/active/2026-04-27-test-system-oracle-hardening.md`

## 背景

领域层 TDD 基线已经建立，服务端 slice coverage 基础设施也已经落地。后续问题不再是“缺少测试工具”，而是默认入口、CI 门禁和文档真值开始漂移。

项目架构：DDD + Clean Architecture + Nx 单仓库，10 个 domain 包，技术栈：Vue 3 / Electron / Prisma / PowerSync / Vitest / Playwright。

## 诊断结论

- 服务端 coverage 分层基础设施已经优雅落地：
  - domain coverage 继续只治理 `domain-server` / `domain-shared`
  - `application-server/use-cases`、Prisma mapper、`app-vue` stores 已拆成独立 target
- 但测试系统还没有完全闭环，主要缺口是：
  - `app-vue:test:coverage` 存在，但未进入 CI 门禁
  - 默认 `web:e2e` 仍混入 debug / explore / thesis capture 脚本
  - 活跃计划文档与 `project.json`、CI allowlist、Playwright 真值发生漂移

## 当前关注点

下一步不再设计新的测试层，而是收口这三个闭环问题：

1. 让 `app-vue` store coverage 真正进入 CI
2. 让默认 `web:e2e` 只保留稳定业务回归
3. 让活跃计划文档重新与当前实现同步
