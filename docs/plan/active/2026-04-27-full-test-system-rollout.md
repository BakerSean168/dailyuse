---
tags:
  - plan
  - testing
  - coverage
  - integration
  - frontend
description: 完整测试体系第三阶段优化方案
created: 2026-04-27T00:00:00
updated: 2026-04-28T14:20:00
status: active
---

# 完整测试体系第三阶段优化方案

后续将测试系统继续优化为 AI 重构正确性推断器的主计划见：

- `docs/plan/active/2026-04-27-test-system-oracle-hardening.md`

## 当前真值

当前仓库的领域层 TDD 基线和服务端 slice coverage 基础设施已经可用。下一阶段不再扩展新的测试层，而是把已有实现收口成语义清晰、默认入口稳定、CI 真正生效的测试系统。

这轮执行以仓库当前实现和 2026-04-28 的实跑结果为真值，不直接照搬诊断文档中的假设：

- `app-vue` 已有独立 `test:coverage` target，且只治理 store 层。
- CI 已接入服务端 `use-cases` / Prisma mapper coverage allowlist。
- 默认 `web:e2e` 已完成入口收口，当前固定为 9 个核心 spec / 52 条测试，并继续保持 sync/debug/explore/desktop-screenshots/check-route/performance 隔离。
- 默认 `web:e2e` 的纯净边界由 `apps/web/playwright.config.ts` 的 `testMatch` / `testIgnore` 保证，而不是只靠文档约定。
- `notification` 当前没有 Prisma mapper 目录，不应纳入第一波 mapper 测试。

执行默认值固定为：

- 优先级：闭环优先。
- 门禁策略：保持分层，不回退到混合 coverage。

## 执行原则

- 保持现有 domain 包 `test:coverage` 语义不变，继续只治理 `domain-server` 和 `domain-shared`。
- 保持 `application-server`、Prisma mapper、UI store 的 coverage target 独立，不混入 governed domain coverage。
- 默认测试入口只跑稳定回归，不跑探索、调试或截图脚本。
- 文档、`project.json` target、CI allowlist 三者必须保持语义一致。

## 进度快照（2026-04-28）

### 已完成

- 第一阶段基础能力已落地：
  - `vitest.shared.ts` 已支持 slice coverage helper。
  - `test:coverage:use-cases` / `test:coverage:prisma-mappers` 已在服务端包配置。
  - `app-vue` 已新增 `test:coverage` target，并切到独立 store coverage 配置。
- CI 已按“分阶段收紧”改造：
  - `domain-coverage` 改为仅对 governed domain 项目执行。
  - `store-coverage`、`use-cases-coverage`、`prisma-mappers-coverage` 改为 allowlist 方式接入。
- 默认 Web E2E 入口稳定化已完成：
  - `pnpm nx run web:e2e -- --list` 可稳定列举测试。
  - 默认入口已剔除 `performance/**`，并保持 debug/sync/screenshot 入口分离。
  - 默认入口当前固定为 9 个核心 spec / 52 条测试，不再承担 broader web regression。
- 第二阶段最关键 gate 已闭环：
  - `task` use-cases coverage 已实跑通过。
  - `reminder` use-cases coverage 已实跑通过。
  - `schedule` use-cases coverage 已实跑通过。
  - `reminder` prisma mapper coverage 已实跑通过。
  - `schedule` prisma mapper coverage 已实跑通过。
- 第三阶段 persistence oracle 入口已落地：
  - `goal`、`reminder`、`schedule` 已新增 package-level `test:integration` target。
  - `schedule-task-prisma.repository.integration.test.ts` 已在 2026-04-28 通过真实 DB 验证。
  - `GoalReminderConfig` 持久化回读对数组形态 `triggers` 的兼容缺陷已在这轮实施中修复。
- 第四阶段前端 store oracle 第一轮已落地：
  - `task`、`authentication`、`goal`、`reminder`、`schedule`、`notification`、`userSetting`、`repository`、`account`、`presentationPreference`、`editorWorkspaceUi`、`editorWorkspace`、`governance` 已有 store spec。
  - `app-vue:test:coverage` 已通过，当前结果约为 `statements 92.53`、`lines 92.54`、`functions 94.87`、`branches 65.48`。
- 第四阶段前端组件 oracle 第一轮已完成首批目标：
  - `TaskTemplateForm`、`TaskInstanceCard`、`GoalRecordCard`、`LoginForm`、`RegisterForm` 已新增组件 spec。

### 当前剩余项

- `goal:test:integration` 与 `reminder:test:integration` 今日实跑受阻于 integration 初始化链路异常，而不是业务断言失败。
- 默认 `web:e2e` 已收口为核心业务路径，但其内部仍有历史 TODO、弱语义 locator 和旧断言写法需要继续清理。
- 真实 DB integration 入口已闭环，但每个领域目前仍只有首个 repository regression，后续还需要继续扩高价值覆盖面。
- `app-vue` store coverage 已达标，但 `goalStore`、`accountStore`、`taskStore` 等分支样本密度仍可继续提高。

### 当前 CI 接入真值

- `store-coverage`：allowlist 为 `app-vue`。
- `use-cases-coverage`：allowlist 为 `task,goal,reminder,schedule`。
- `prisma-mappers-coverage`：allowlist 为 `task,goal,reminder,schedule`。

## 第三阶段目标：优雅闭环

### 1. 前端 store coverage 进入 CI

- `.github/workflows/ci.yml` 新增独立 `store-coverage` job。
- 只检测 `app-vue:test:coverage`，不把 UI store gate 混进 domain coverage。
- `app-vue:test:coverage` 继续只使用 `vitest.store-coverage.config.ts`。

### 2. 默认 E2E 入口收口

- 默认 `apps/web/playwright.config.ts` 只保留主业务回归。
- 从默认 `web:e2e` 中剔除：
  - `debug/**`
  - `debug-*`
  - `*-debug`
  - `explore*`
  - `desktop-screenshots/**`
  - `check-route.spec.ts`
- 为这些脚本保留独立入口：
  - `web:e2e:debug`
  - `web:e2e:desktop-screenshots`
  - `web:e2e:sync`

### 3. 文档回收为当前真值

- 诊断文档只保留“为何需要继续收口”的背景和问题清单。
- 活跃 rollout 文档成为唯一执行方案。
- 文档中的 target 名称、CI allowlist、默认 E2E 边界必须与代码一致。

### 4. 后续测试补齐顺序

在闭环完成后，继续沿用既有优先级补测试内容：

1. `goal` / `reminder` integration 验证链路
2. 核心 `web:e2e` 内部断言与 selector 硬化
3. 关键 repository integration tests
4. 高价值复杂组件与 store 分支样本补齐

## 验证方式

每阶段固定验证：

- 包级 `test`
- `app-vue:test:coverage`
- 对应 `test:coverage:use-cases`
- 对应 `test:coverage:prisma-mappers`
- `pnpm test:targets:check`
- 默认 `web:e2e` 不再跑 debug / explore / thesis capture

阶段性里程碑：

- 第三阶段结束
  - affected `test`
  - affected `test:coverage`
  - affected `test:coverage:use-cases`
  - affected `test:coverage:prisma-mappers`
  - `web:e2e` 入口纯净
- 闭环完成后
  - affected `test`
  - affected `test:coverage`
  - affected `test:integration`
  - `desktop:test:ipc`

## 约束

- 现有 domain 覆盖率门禁不得降低。
- 不允许为了让 application / mapper / UI 层过门禁而放宽 domain 治理。
- `notification` 在出现实际 Prisma mapper 之前，不创建对应 mapper 覆盖率计划。
- 调试和探索脚本必须保留手动入口，但不能继续污染默认回归入口。
