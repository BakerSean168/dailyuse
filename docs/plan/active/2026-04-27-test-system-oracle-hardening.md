---
tags:
  - plan
  - testing
  - oracle
  - ai
  - refactoring
description: 将测试系统优化为 AI 重构正确性推断器的实施方案
created: 2026-04-27T00:00:00
updated: 2026-04-28T14:20:00
status: active
---

# 测试系统推断器化方案

## 文档定位

这份文档是当前测试体系的后续实施主计划，目标不是继续扩张测试分类，而是把现有测试系统优化为可供 AI 重构使用的“正确性推断器 v1”。

相关文档：

- `docs/plan/active/2026-04-27-full-test-system-rollout.md`
- `docs/plan/active/tdd-ai-whimsical-swan.md`

## 当前真值

当前仓库已经具备一套可工作的分层测试基础设施，并且主要 oracle 入口已经完成分层，但离“高可信的 AI 重构正确性推断器”仍差最后一段硬化工作。

### 已有基础

- 服务端 domain coverage 已有稳定门禁。
- `application-server/use-cases`、Prisma mapper、`app-vue` store 已拆成独立 coverage target。
- `task`、`goal`、`reminder`、`schedule` 都已具备 package-level `test:integration` target。
- `desktop:test:ipc`、`desktop:test:main`、`api:test:smoke` 已具备边界回归入口。
- 默认 `web:e2e`、`web:e2e:debug`、`web:e2e:sync`、`web:e2e:desktop-screenshots` 已完成语义分离。

### 结构性缺口

- 默认 Web E2E 虽已收口为 9 个核心 spec，但仍需继续清理核心集合内部的脆弱断言与弱语义 locator。
- 真实 DB integration 目前仍主要集中在 `task/goal/reminder/schedule` 四个核心领域，其他跨边界模块还没有纳入最小 persistence oracle。
- `goal` 与 `reminder` 的 integration runtime verification 当前不稳定，已经从“缺入口”转为“入口存在但初始化链路异常”。

## 实施快照（2026-04-28）

### 已实跑验证

- 结构验证：
  - `pnpm test:targets:check` 通过。
- 默认 E2E 入口：
  - `pnpm nx run web:e2e -- --list` 通过。
  - 默认 `web:e2e` 当前只列出 9 个核心 spec：`auth-flow`、`auth-login`、`dashboard-overview`、`goal-crud`、`notification-center`、`reminder-template-crud`、`task-template-crud`、`user-settings/notifications`、`user-settings/persistence`。
  - 当前默认集合共 52 条测试。
- `task` use-cases oracle：
  - `pnpm vitest run --config vitest.use-cases.config.ts --coverage` 通过。
  - 当前结果约为 `statements 87.75`、`branches 71.5`、`functions 95.78`、`lines 87.57`。
  - 已达到阈值 `70/70/70/60`，并已纳入 `USE_CASES_COVERAGE_PROJECTS`。
- `reminder` use-cases oracle：
  - `pnpm vitest run --config vitest.use-cases.config.ts --coverage` 通过。
  - 当前结果约为 `statements 98.69`、`branches 87.2`、`functions 97.5`、`lines 98.63`。
- `schedule` use-cases oracle：
  - `pnpm vitest run --config vitest.use-cases.config.ts --coverage` 通过。
  - 当前结果约为 `statements 100`、`branches 88.13`、`functions 100`、`lines 100`。
- `reminder` prisma mappers oracle：
  - `pnpm vitest run --config vitest.mappers.config.ts --coverage` 通过。
  - 当前结果约为 `statements 100`、`branches 89.09`、`functions 100`、`lines 100`。
- `schedule` prisma mappers oracle：
  - `pnpm vitest run --config vitest.mappers.config.ts --coverage` 通过。
  - 当前结果约为 `statements 100`、`branches 76.47`、`functions 100`、`lines 100`。
- 前端 store oracle：
  - `pnpm vitest run --config vitest.store-coverage.config.ts --coverage` 通过。
  - 当前结果约为 `statements 92.53`、`branches 65.48`、`functions 94.87`、`lines 92.54`。
  - `task/authentication/goal/reminder/schedule/notification/userSetting/repository/account/presentationPreference/editorWorkspaceUi/editorWorkspace/governance` 已补上 store spec。
- 第一批 persistence oracle：
  - `pnpm vitest run --config vitest.integration.config.ts` 在 `schedule` 包下通过。
  - `schedule` integration 已覆盖 executions / metadata JSON / enum round-trip / nullable dates。

### 结构已接通，但本次快照未重跑

- `goal` 已具备 `test:coverage:use-cases`、`test:coverage:prisma-mappers`、`test:integration` target。
- `app-vue:test` 已把 `TaskTemplateForm`、`TaskInstanceCard`、`GoalRecordCard`、`LoginForm`、`RegisterForm` 这 5 个关键组件 spec 纳入默认快速回归。
- CI 中 `store-coverage`、`use-cases-coverage`、`prisma-mappers-coverage` allowlist 已接通，当前真值分别为：
  - `app-vue`
  - `task,goal,reminder,schedule`
  - `task,goal,reminder,schedule`

### 当前阻塞

- `goal:test:integration` 与 `reminder:test:integration` 在 2026-04-28 的本地实跑没有完成有效业务验证。
- 当前失败不是业务断言红，而是 integration 初始化链路异常：
  - global setup 中的 `prisma db push --accept-data-loss` 命中 `P2002`
  - Vitest 随后又报 `No test files found`
  - 但仓库内实际存在匹配的 integration test 文件
- 这说明 Phase 3 当前的主要问题已经不是“是否有入口”，而是 `goal/reminder` integration 的数据库准备与测试发现链路需要继续修复。

## 推断器标准

“AI 重构正确性推断器 v1”定义如下：

- 能对高风险重构给出自动否定信号，而不是只提供参考信息。
- 默认入口必须稳定、可重复、可在 CI 中运行。
- 测试层必须按语义分层，避免一个 target 同时承担多种判断职责。
- 不追求证明程序正确，但必须足以拦截服务端结构性回归、持久化回归、桌面边界回归和核心用户流回归。

这套推断器分为三层：

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

## 分阶段实施

## Phase 1：让默认入口可信

### 当前状态

- 已完成。
- 默认 `web:e2e` 已由 `apps/web/playwright.config.ts` 的 `testMatch` / `testIgnore` 收口为 9 个核心 spec。
- 当前 `pnpm nx run web:e2e -- --list` 的真实输出为 52 条测试，不再是更宽泛的 Web regression 入口。

### 产出标准

- `playwright test --config playwright.config.ts --list` 无 parse error
- 默认 `web:e2e` 不包含 debug / explore / screenshot / performance / route probing
- 默认 `web:e2e` 的用例数压缩到一组可维护的核心回归集合

## Phase 2：补齐最关键 gate

### 当前状态

- 已完成。
- `task` 已纳入 `USE_CASES_COVERAGE_PROJECTS`。
- `task` use-cases gate 当前实跑通过。

### 产出标准

- `ci.yml` 中 `USE_CASES_COVERAGE_PROJECTS` 包含 `task`
- `task:test:coverage:use-cases` 达标并稳定执行

## Phase 3：扩真实 integration

### 当前状态

- 入口层面已闭环：
  - `goal`、`reminder`、`schedule` 都已具备 package-level `test:integration` target。
  - `test.yml` 已可在 affected 条件下发现这些新 target。
- runtime verification 当前分化为两类：
  - `schedule:test:integration` 今日实跑通过。
  - `goal:test:integration`、`reminder:test:integration` 今日实跑受阻于 Prisma 初始化 / 测试发现链路异常。
- 本阶段后续重点已经从“补入口”转为“修复 `goal/reminder` integration 验证链路，并继续扩每个领域的高价值 repository 覆盖面”。

### 每个 package 的最低要求

- 新增 package-level `test:integration` target
- 新增 1 个最高价值 Prisma repository integration spec
- 固定覆盖：
  - save/create
  - findById/list
  - enum round-trip
  - JSON round-trip
  - nullable 列恢复
  - 关键 FK / 关联关系

### repository 优先顺序

- `goal`
  - 首选 `goal-prisma.repository.ts`
- `reminder`
  - 首选 `reminder-template-prisma.repository.ts`
- `schedule`
  - 首选 `schedule-task-prisma.repository.ts`

### 产出标准

- `test.yml` 能在 affected 条件下自动发现这些新增 integration target
- `goal`、`reminder`、`schedule` 各至少有 1 个真实 DB integration regression

## Phase 4：提升前端状态层可信度

### 当前状态

- Phase 4 第一轮已完成：
  - `app-vue:test:coverage` 已稳定通过。
  - 13 个 store 已全部补上测试，coverage threshold 已闭环。
- Phase 4 第二轮已基本完成首批目标：
  - `TaskTemplateForm`、`TaskInstanceCard`、`GoalRecordCard`、`LoginForm`、`RegisterForm` 已新增组件 spec。
  - `app-vue:test` 已把这批组件 oracle 纳入默认快速回归。
- 本阶段后续重点不再是“补首批 store 或关键组件”，而是：
  - 继续补高价值但尚未进入 oracle 的复杂组件。
  - 提高 `goalStore`、`accountStore`、`taskStore` 等低分支复杂度 store 的分支样本密度。

## Phase 5：继续硬化 Web flow oracle

### 当前状态

- 进行中。
- 默认 `web:e2e` 已固定为 9 个核心 spec / 52 条测试。
- 剩余问题不再是入口边界混乱，而是核心集合内部仍混有：
  - 历史 TODO 注释驱动的脆弱断言
  - 文案/选择器漂移风险较高的旧测试写法
  - 通知/设置页面中仍待进一步稳定化的选择器与交互断言

### 最新进展

- `goal-crud.spec.ts` 已开始从文本驱动断言切到 `data-testid` 驱动，创建/详情/编辑路径已优先使用稳定 selector。
- 通知中心与通知设置相关 UI 已补稳定 selector：
  - `notification-bell-icon`
  - `notification-center`
  - `notifications-list`
  - `notification-item`
  - `mark-all-read-button`
  - `settings-tab-notifications`
  - `notification-settings-switch`
- 默认 `web:e2e -- --list` 在这轮 selector 硬化后仍保持 9 个 spec / 52 条测试。

### 后续重点

- 继续修核心 9 个 spec 内部的脆弱断言与历史 TODO。
- 对核心 flow 引入更稳定的 helper / locator 约束，减少文本耦合。
- 评估是否把 `web:e2e` 接入主线 CI 独立 job，而不是仅保留本地 oracle 入口。

## CI 调整原则

### `ci.yml`

- 保留当前：
  - `domain-coverage`
  - `store-coverage`
  - `use-cases-coverage`
  - `prisma-mappers-coverage`
- 允许调整 allowlist
- 不合并这些 job，保持每类 oracle 单独可读

### `test.yml`

- 保持当前：
  - `smoke`
  - `integration`
  - `desktop-boundary`
- 新增 package-level `test:integration` 后，继续依赖 affected 自动发现
- 不在这一轮把 debug / sync / screenshot 类型 Playwright 入口接入主线边界 job

### Web E2E 主线策略

- 新增独立的核心 Web flow regression job 是允许的
- 只跑默认 `web:e2e`
- 不混入：
  - `e2e:debug`
  - `e2e:desktop-screenshots`
  - `e2e:sync`

## 文档联动要求

- `2026-04-27-full-test-system-rollout.md`
  - 保留为“第三阶段优化方案”
- `2026-04-27-test-system-oracle-hardening.md`
  - 作为后续实施主计划
- `tdd-ai-whimsical-swan.md`
  - 继续仅保留诊断上下文，不再承担实施任务

若实施过程中出现真值变化，优先更新本文件和 `2026-04-27-full-test-system-rollout.md` 的交叉引用，而不是回写诊断文档。

## 验收标准

### 结构验证

- `pnpm test:targets:check`
- `playwright test --config playwright.config.ts --list`
- `playwright test --config playwright.debug.config.ts --list`

### Fast oracle

- `app-vue:test:coverage`
- `task:test:coverage:use-cases`
- `goal/reminder/schedule:test:coverage:use-cases`
- `task/goal/reminder/schedule:test:coverage:prisma-mappers`

### Boundary oracle

- `task:test:integration`
- `goal:test:integration`
- `reminder:test:integration`
- `schedule:test:integration`
- `desktop:test:ipc`
- `desktop:test:main`
- `api:test:smoke`

### Flow oracle

- 默认 `web:e2e` 只列出核心业务 spec
- 默认 `web:e2e` 可稳定启动，不出现 parse error
- debug / explore / performance / screenshot 不出现在默认 `e2e` 列表中

## 约束与非目标

- 这轮目标不是证明程序正确，而是构建“足够强的自动否定信号”。
- 不发明新的测试框架层，不引入第二套 coverage 语义。
- 不追求组件测试全覆盖，只覆盖关键业务组件。
- 不把探索脚本删除；它们保留为手动工具，但不能污染 oracle 入口。
- 若某层测试还不稳定，优先缩小默认集合并建立清晰语义，而不是把不稳定样本硬塞进主线。
