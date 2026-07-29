---
tags:
  - plan
  - testing
  - oracle
  - ai
  - refactoring
description: 将测试系统优化为 AI 重构正确性推断器的当前实施方案
created: 2026-04-27T00:00:00
updated: 2026-05-11T00:00:00
status: active
---

# 测试系统推断器化方案

## 文档定位

这份文档是当前测试体系的唯一 active 主计划，目标不是继续扩张测试分类，而是把已经存在的测试入口收口成可供 AI 重构使用的“正确性推断器 v1”。

相关文档：

- `docs/plan/archive/2026-04-27-full-test-system-rollout.md`
- `docs/plan/archive/tdd-ai-whimsical-swan.md`
- `docs/test/README.md`
- `apps/web/e2e/README.md`

## 当前真值（2026-05-11 更新）

### 已经成立的部分

- `pnpm test:targets:check` 当前通过，测试 target 治理仍然成立。
- `coverage.yml` 已拆分 coverage gates：
  - governed domain coverage
  - `app-vue` store coverage
  - use-cases coverage
  - prisma mappers coverage
- `ci.yml` 已有 `boundary-tests` job，负责 affected 范围内的：
  - `test:smoke`
  - `test:integration`
  - `test:ipc`
  - `test:main`
- `task`、`goal`、`reminder`、`schedule` 都已具备 package-level `test:integration` target，且已有真实 integration test 文件。
- `app-vue:test:coverage` 当前实跑通过，现值约为：
  - `statements 92.53`
  - `branches 65.69`
  - `functions 94.87`
  - `lines 92.54`
- 默认 `web:e2e` 已继续保持独立语义，不混入 `sync`、`debug`、`desktop-screenshots`、`performance` 和 `check-route`。
- 本机 boundary oracle 已闭环（2026-05-11）：
  - Docker 可访问，`postgres-test` 容器健康启动。
  - `pnpm test:integration` 全部通过：task 3 文件 17 测试、goal 1 文件 2 测试、schedule 1 文件 2 测试、reminder 1 文件 2 测试。
  - 旧日志中的 `memoflow_test` 错误已不存在；当前代码统一使用 `memoflow_test`。

### 当前仍未优雅闭环的部分

- Phase E 尚未执行：oracle 质量密度提升（store 覆盖率、E2E locator 清理、repository regression 扩展）。

## 推断器标准

“AI 重构正确性推断器 v1”定义如下：

- 能对高风险重构给出自动否定信号，而不是只提供参考信息。
- 默认入口稳定、可重复，并且本地与 CI 都有清晰前提。
- 各层测试按语义分层，不让一个 target 同时承担多种判断职责。
- 不追求证明程序正确，但必须能拦住结构性回归、持久化回归、边界回归和核心用户流回归。

推断器分三层：

### Fast oracle

用于否定纯代码结构重构、领域逻辑重构、应用编排重构、store 重构：

- `test`
- `test:coverage`
- `test:coverage:use-cases`
- `test:coverage:prisma-mappers`

### Boundary oracle

用于否定 persistence / transport / desktop 边界回归：

- `test:integration`
- `test:smoke`
- `test:ipc`
- `test:main`

### Flow oracle

用于否定关键用户流程回归：

- 默认 `web:e2e`

AI 重构执行规则固定为：

- 纯服务端重构至少通过 `Fast oracle`
- 涉及 Prisma repository、跨表恢复、IPC、preload、HTTP 边界时，必须追加 `Boundary oracle`
- 涉及认证、路由、状态联动、核心交互流时，必须追加 `Flow oracle`

## 剩余执行阶段

### Phase A：同步真值文档 ✅ 已完成

- 计划文档不再维护陈旧的固定测试数量、旧故障结论或失真的 job 命名。
- `docs/test/*` 只保留入口、边界和运行前提，不再复制历史快照统计。
- 与默认 `web:e2e` 清单相关的稳定入口，统一以 `apps/web/playwright.config.ts` 和 `apps/web/e2e/README.md` 为准。

### Phase B：重建本地 boundary oracle 可验证性 ✅ 已完成

- Docker 可访问，`postgres-test` 容器健康启动。
- `pnpm test:integration` 全部通过（2026-05-11）。
- 旧故障根因是 Docker 不可访问 + 旧代码中 `memoflow_test` 命名不一致；两个问题都已消除。

### Phase C：若 boundary oracle 仍失败，先修失败链路 ⬜ 跳过

- boundary oracle 已通过，无需进入此阶段。

### Phase D：把 Flow oracle 接入主线 CI ✅ 已完成

- `ci.yml` 新增 `web-flow` job（2026-05-11）。
- 依赖 `validate` job 通过后再执行。
- 使用 GitHub Actions services 启动 Postgres 15，端口 5433。
- 只运行默认 `web:e2e`，不混入 debug / sync / desktop-screenshots。
- 包含 Playwright 浏览器安装、Prisma schema push 步骤。

### Phase E：继续提高 oracle 质量密度

- 对 `goalStore`、`accountStore`、`taskStore` 等低分支复杂度 store 继续补样本。
- 对 `web:e2e` 核心 spec 内部继续清理：
  - 弱语义 locator
  - 文案耦合过强的断言
  - 历史 TODO 驱动的脆弱流程
- 对每个核心领域继续扩高价值 repository integration regression，但不引入新的测试层语义。

## 关闭条件

本文件只有在下面条件全部成立时才归档：

- Docker 可访问的标准开发机上 `pnpm test:integration` 通过。 ✅
- `coverage.yml` 里的 coverage gates 保持通过。
- `ci.yml` 里的 `boundary-tests` 保持通过。
- 主线 CI 已有独立 Web flow regression job（`web-flow`），并且只跑默认 `web:e2e`。 ✅
- 文档不再与 `project.json`、workflow、测试入口真值漂移。

## 验证矩阵

### 当前应持续通过

- `pnpm test:targets:check`
- `pnpm nx run app-vue:test:coverage`
- `pnpm nx run web:e2e -- --list`

### 在 Docker 可用环境重跑 ✅ 已验证

- `pnpm test:integration` ✅（2026-05-11，全部通过）

### CI 闭环

- `coverage.yml`
- `ci.yml` — `validate`、`boundary-tests`、`web-flow` 三个 job

## 约束与非目标

- 这轮目标不是证明程序正确，而是构建足够强的自动否定信号。
- 不发明新的测试框架层，不引入第二套 coverage 语义。
- 不删除探索、调试、截图和同步脚本；它们保留手动入口，但不能污染默认 oracle。
- 若某层测试尚不稳定，优先明确前提和职责边界，而不是把不稳定样本硬塞进主线默认入口。
