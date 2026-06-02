---
tags:
  - product
  - module-index
  - goal
description: 目标模块相关文件索引
created: 2026-06-02T00:00:00
updated: 2026-06-02T00:00:00
---

# 目标模块文件索引

本索引用于连接目标模块的业务说明和真实代码。它不是代码注释替代品；做优化前仍需以当前代码、配置和测试为准。

## 前端页面与路由

| 文件 | 说明 |
| --- | --- |
| [`packages/app-vue/src/modules/goal/router/index.ts`](../../../packages/app-vue/src/modules/goal/router/index.ts) | Vue 目标模块路由，定义列表、详情、复盘、KR、专注和对比入口 |
| [`packages/app-vue/src/modules/goal/views/GoalModuleLayout.vue`](../../../packages/app-vue/src/modules/goal/views/GoalModuleLayout.vue) | 目标模块布局 |
| [`packages/app-vue/src/modules/goal/views/GoalListView.vue`](../../../packages/app-vue/src/modules/goal/views/GoalListView.vue) | 目标列表页 |
| [`packages/app-vue/src/modules/goal/views/GoalDetailView.vue`](../../../packages/app-vue/src/modules/goal/views/GoalDetailView.vue) | 目标详情页 |
| [`packages/app-vue/src/modules/goal/views/GoalReviewCreationView.vue`](../../../packages/app-vue/src/modules/goal/views/GoalReviewCreationView.vue) | 目标复盘创建页 |
| [`packages/app-vue/src/modules/goal/views/GoalReviewDetailView.vue`](../../../packages/app-vue/src/modules/goal/views/GoalReviewDetailView.vue) | 目标复盘详情页 |
| [`packages/app-vue/src/modules/goal/views/KeyResultDetailView.vue`](../../../packages/app-vue/src/modules/goal/views/KeyResultDetailView.vue) | 关键结果详情页 |
| [`packages/app-vue/src/modules/goal/views/GoalFocusView.vue`](../../../packages/app-vue/src/modules/goal/views/GoalFocusView.vue) | 目标专注入口 |
| [`packages/app-vue/src/modules/goal/views/MultiGoalComparisonView.vue`](../../../packages/app-vue/src/modules/goal/views/MultiGoalComparisonView.vue) | 多目标对比页 |

## 前端状态、组合函数与组件

| 文件 | 说明 |
| --- | --- |
| [`packages/app-vue/src/modules/goal/stores/goal-store.ts`](../../../packages/app-vue/src/modules/goal/stores/goal-store.ts) | 目标模块前端 store |
| [`packages/app-vue/src/modules/goal/composables/useGoal.ts`](../../../packages/app-vue/src/modules/goal/composables/useGoal.ts) | 目标 CRUD 与聚合操作组合函数 |
| [`packages/app-vue/src/modules/goal/composables/useKeyResults.ts`](../../../packages/app-vue/src/modules/goal/composables/useKeyResults.ts) | 关键结果相关组合函数 |
| [`packages/app-vue/src/modules/goal/composables/useGoalRecords.ts`](../../../packages/app-vue/src/modules/goal/composables/useGoalRecords.ts) | 目标记录相关组合函数 |
| [`packages/app-vue/src/modules/goal/composables/useGoalTimeline.ts`](../../../packages/app-vue/src/modules/goal/composables/useGoalTimeline.ts) | 目标时间线数据组织 |
| [`packages/app-vue/src/modules/goal/composables/useFocusMode.ts`](../../../packages/app-vue/src/modules/goal/composables/useFocusMode.ts) | 专注模式前端入口 |
| [`packages/app-vue/src/modules/goal/components/dialogs/GoalDialog.vue`](../../../packages/app-vue/src/modules/goal/components/dialogs/GoalDialog.vue) | 目标创建或编辑弹窗 |
| [`packages/app-vue/src/modules/goal/components/dialogs/KeyResultDialog.vue`](../../../packages/app-vue/src/modules/goal/components/dialogs/KeyResultDialog.vue) | 关键结果创建或编辑弹窗 |
| [`packages/app-vue/src/modules/goal/components/cards/GoalCard.vue`](../../../packages/app-vue/src/modules/goal/components/cards/GoalCard.vue) | 目标卡片 |
| [`packages/app-vue/src/modules/goal/components/cards/GoalReviewListCard.vue`](../../../packages/app-vue/src/modules/goal/components/cards/GoalReviewListCard.vue) | 目标复盘列表卡片 |
| [`packages/app-vue/src/modules/goal/components/echarts/GoalProgressChart.vue`](../../../packages/app-vue/src/modules/goal/components/echarts/GoalProgressChart.vue) | 目标进度图表 |

## 移动端入口

| 文件 | 说明 |
| --- | --- |
| [`apps/mobile/src/app/goals/index.tsx`](../../../apps/mobile/src/app/goals/index.tsx) | 移动端目标列表入口 |
| [`apps/mobile/src/app/goals/[id].tsx`](../../../apps/mobile/src/app/goals/[id].tsx) | 移动端目标详情入口 |
| [`apps/mobile/src/app/goals/editor.tsx`](../../../apps/mobile/src/app/goals/editor.tsx) | 移动端目标编辑入口 |
| [`apps/mobile/src/app/goals/key-result.tsx`](../../../apps/mobile/src/app/goals/key-result.tsx) | 移动端关键结果入口 |
| [`apps/mobile/src/app/goals/review.tsx`](../../../apps/mobile/src/app/goals/review.tsx) | 移动端复盘入口 |
| [`apps/mobile/src/app/goals/review-detail.tsx`](../../../apps/mobile/src/app/goals/review-detail.tsx) | 移动端复盘详情入口 |
| [`apps/mobile/src/app/goals/compare.tsx`](../../../apps/mobile/src/app/goals/compare.tsx) | 移动端目标对比入口 |

## API、控制器与适配器

| 文件 | 说明 |
| --- | --- |
| [`packages/goal/src/api/routes/goal.routes.ts`](../../../packages/goal/src/api/routes/goal.routes.ts) | 目标相关 HTTP routes |
| [`packages/goal/src/api/routes/key-result.routes.ts`](../../../packages/goal/src/api/routes/key-result.routes.ts) | 关键结果相关 HTTP routes |
| [`packages/goal/src/api/routes/review.routes.ts`](../../../packages/goal/src/api/routes/review.routes.ts) | 目标复盘相关 HTTP routes |
| [`packages/goal/src/api/routes/goal-record.routes.ts`](../../../packages/goal/src/api/routes/goal-record.routes.ts) | 目标记录相关 HTTP routes |
| [`packages/goal/src/api/routes/goal-folder.routes.ts`](../../../packages/goal/src/api/routes/goal-folder.routes.ts) | 目标文件夹相关 HTTP routes |
| [`packages/goal/src/api/routes/focus-mode.routes.ts`](../../../packages/goal/src/api/routes/focus-mode.routes.ts) | 专注模式相关 HTTP routes |
| [`packages/goal/src/controllers/goal.controller.ts`](../../../packages/goal/src/controllers/goal.controller.ts) | 目标控制器 |
| [`packages/goal/src/controllers/goal-folder.controller.ts`](../../../packages/goal/src/controllers/goal-folder.controller.ts) | 目标文件夹控制器 |
| [`packages/goal/src/infrastructure-client/adapters/http/goal-http.adapter.ts`](../../../packages/goal/src/infrastructure-client/adapters/http/goal-http.adapter.ts) | 客户端 HTTP 目标适配器 |
| [`packages/goal/src/infrastructure-client/adapters/ipc/goal-ipc.adapter.ts`](../../../packages/goal/src/infrastructure-client/adapters/ipc/goal-ipc.adapter.ts) | 客户端 IPC 目标适配器 |

## 领域、用例与仓储

| 文件 | 说明 |
| --- | --- |
| [`packages/goal/src/index.ts`](../../../packages/goal/src/index.ts) | `@dailyuse/goal` public surface 和模块分层说明 |
| [`packages/goal/src/infrastructure-server/goal.module.ts`](../../../packages/goal/src/infrastructure-server/goal.module.ts) | 服务端目标模块组合根 |
| [`packages/goal/src/domain-server/aggregates/goal.ts`](../../../packages/goal/src/domain-server/aggregates/goal.ts) | Goal 聚合 |
| [`packages/goal/src/domain-server/aggregates/goal-folder.ts`](../../../packages/goal/src/domain-server/aggregates/goal-folder.ts) | Goal Folder 聚合 |
| [`packages/goal/src/domain-server/aggregates/goal-record.ts`](../../../packages/goal/src/domain-server/aggregates/goal-record.ts) | Goal Record 聚合 |
| [`packages/goal/src/domain-server/aggregates/focus-session.ts`](../../../packages/goal/src/domain-server/aggregates/focus-session.ts) | Focus Session 聚合 |
| [`packages/goal/src/domain-server/entities/key-result.ts`](../../../packages/goal/src/domain-server/entities/key-result.ts) | Key Result 领域实体 |
| [`packages/goal/src/domain-server/entities/goal-review.ts`](../../../packages/goal/src/domain-server/entities/goal-review.ts) | Goal Review 领域实体 |
| [`packages/goal/src/application-server/use-cases/commands/create-goal.use-case.ts`](../../../packages/goal/src/application-server/use-cases/commands/create-goal.use-case.ts) | 创建目标用例 |
| [`packages/goal/src/application-server/use-cases/commands/add-goal-key-result.use-case.ts`](../../../packages/goal/src/application-server/use-cases/commands/add-goal-key-result.use-case.ts) | 添加关键结果用例 |
| [`packages/goal/src/application-server/use-cases/commands/add-goal-review.use-case.ts`](../../../packages/goal/src/application-server/use-cases/commands/add-goal-review.use-case.ts) | 添加目标复盘用例 |
| [`packages/goal/src/application-server/use-cases/queries/get-goal-aggregate.use-case.ts`](../../../packages/goal/src/application-server/use-cases/queries/get-goal-aggregate.use-case.ts) | 获取目标聚合查询 |
| [`packages/goal/src/application-server/use-cases/queries/get-goal-progress-breakdown.use-case.ts`](../../../packages/goal/src/application-server/use-cases/queries/get-goal-progress-breakdown.use-case.ts) | 目标进度拆解查询 |
| [`packages/goal/src/infrastructure-server/adapters/prisma/goal-prisma.repository.ts`](../../../packages/goal/src/infrastructure-server/adapters/prisma/goal-prisma.repository.ts) | Prisma 目标仓储 |
| [`packages/goal/src/infrastructure-server/adapters/powersync/goal-powersync.repository.ts`](../../../packages/goal/src/infrastructure-server/adapters/powersync/goal-powersync.repository.ts) | PowerSync 目标仓储 |

## Contracts 与数据结构

| 文件 | 说明 |
| --- | --- |
| [`packages/contracts/src/modules/goal/index.ts`](../../../packages/contracts/src/modules/goal/index.ts) | 目标模块 contracts 入口 |
| [`packages/contracts/src/modules/goal/api/goal-crud.dto.ts`](../../../packages/contracts/src/modules/goal/api/goal-crud.dto.ts) | 目标 CRUD DTO |
| [`packages/contracts/src/modules/goal/api/key-result.dto.ts`](../../../packages/contracts/src/modules/goal/api/key-result.dto.ts) | 关键结果 DTO |
| [`packages/contracts/src/modules/goal/api/goal-review.dto.ts`](../../../packages/contracts/src/modules/goal/api/goal-review.dto.ts) | 目标复盘 DTO |
| [`packages/contracts/src/modules/goal/api/goal-record.dto.ts`](../../../packages/contracts/src/modules/goal/api/goal-record.dto.ts) | 目标记录 DTO |
| [`packages/contracts/src/modules/goal/api/response-schemas.ts`](../../../packages/contracts/src/modules/goal/api/response-schemas.ts) | API response schemas |
| [`packages/contracts/src/modules/goal/protocol/goal-rpc-map.ts`](../../../packages/contracts/src/modules/goal/protocol/goal-rpc-map.ts) | 目标模块 RPC map |
| [`packages/contracts/src/modules/goal/protocol/goal-event-map.ts`](../../../packages/contracts/src/modules/goal/protocol/goal-event-map.ts) | 目标模块事件 map |
| [`packages/contracts/src/modules/goal/rules/status-rule.ts`](../../../packages/contracts/src/modules/goal/rules/status-rule.ts) | 目标状态规则 |
| [`packages/database/prisma/schema/goal.prisma`](../../../packages/database/prisma/schema/goal.prisma) | 目标模块 Prisma schema |

## AI Goal 相关入口

| 文件 | 说明 |
| --- | --- |
| [`packages/app-vue/src/modules/ai/views/AIChatView.vue`](../../../packages/app-vue/src/modules/ai/views/AIChatView.vue) | AI Chat 当前 Goal workflow 主入口 |
| [`packages/app-vue/src/modules/ai/components/AIGoalDraftEditor.vue`](../../../packages/app-vue/src/modules/ai/components/AIGoalDraftEditor.vue) | AI 目标草稿编辑器 |
| [`packages/app-vue/src/modules/ai/composables/useAIGoalWorkflow.ts`](../../../packages/app-vue/src/modules/ai/composables/useAIGoalWorkflow.ts) | AI Goal workflow 组合函数 |
| [`packages/app-vue/src/modules/ai/composables/goalDraftHelpers.ts`](../../../packages/app-vue/src/modules/ai/composables/goalDraftHelpers.ts) | Goal draft 辅助逻辑 |
| [`packages/app-vue/src/modules/ai/composables/goalAutomationHelpers.ts`](../../../packages/app-vue/src/modules/ai/composables/goalAutomationHelpers.ts) | Goal automation 辅助逻辑 |
| [`packages/ai/src/application-server/use-cases/commands/generate-ai-goal.use-case.ts`](../../../packages/ai/src/application-server/use-cases/commands/generate-ai-goal.use-case.ts) | AI 目标生成与 automation 用例 |
| [`apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts`](../../../apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts) | API 侧 automation tool executor |
| [`apps/desktop/src/main/modules/ai/desktop-automation-tool-executor.adapter.ts`](../../../apps/desktop/src/main/modules/ai/desktop-automation-tool-executor.adapter.ts) | Desktop 侧 automation tool executor |

## 测试入口

| 文件 | 说明 |
| --- | --- |
| [`packages/goal/src/application-server/use-cases/commands/__tests__/create-goal.test.ts`](../../../packages/goal/src/application-server/use-cases/commands/__tests__/create-goal.test.ts) | 创建目标用例测试 |
| [`packages/goal/src/application-server/use-cases/commands/__tests__/add-goal-key-result.test.ts`](../../../packages/goal/src/application-server/use-cases/commands/__tests__/add-goal-key-result.test.ts) | 添加关键结果用例测试 |
| [`packages/goal/src/application-server/use-cases/commands/__tests__/add-goal-review.test.ts`](../../../packages/goal/src/application-server/use-cases/commands/__tests__/add-goal-review.test.ts) | 添加复盘用例测试 |
| [`packages/goal/src/application-server/use-cases/queries/__tests__/get-goal-aggregate.test.ts`](../../../packages/goal/src/application-server/use-cases/queries/__tests__/get-goal-aggregate.test.ts) | 目标聚合查询测试 |
| [`packages/goal/src/application-server/use-cases/queries/__tests__/get-goal-progress-breakdown.test.ts`](../../../packages/goal/src/application-server/use-cases/queries/__tests__/get-goal-progress-breakdown.test.ts) | 目标进度拆解测试 |
| [`packages/goal/src/api/routes/goal.routes.spec.ts`](../../../packages/goal/src/api/routes/goal.routes.spec.ts) | 目标 routes 测试 |
| [`packages/app-vue/src/modules/goal/stores/goalStore.spec.ts`](../../../packages/app-vue/src/modules/goal/stores/goalStore.spec.ts) | 目标 store 测试 |
| [`packages/app-vue/src/modules/goal/index.spec.ts`](../../../packages/app-vue/src/modules/goal/index.spec.ts) | 前端目标模块入口测试 |
| [`apps/web/e2e/goal/goal-crud.spec.ts`](../../../apps/web/e2e/goal/goal-crud.spec.ts) | Web 目标 CRUD e2e |
| [`apps/web/e2e/goal/goal-keyresult.spec.ts`](../../../apps/web/e2e/goal/goal-keyresult.spec.ts) | Web 关键结果 e2e |
| [`apps/web/e2e/goal/goal-focus-mode.spec.ts`](../../../apps/web/e2e/goal/goal-focus-mode.spec.ts) | Web 专注模式 e2e |
| [`apps/web/e2e/sync/goal-sync-regression.spec.ts`](../../../apps/web/e2e/sync/goal-sync-regression.spec.ts) | 目标同步回归 e2e |

## 需要重点关注的改动风险

- 目标状态流转和状态规则。
- KR 权重、进度和目标总进度计算。
- 目标复盘与目标完成、归档、历史记录之间的关系。
- HTTP、IPC、Prisma、PowerSync 多运行时适配器的一致性。
- AI Goal workflow 写入真实目标前的用户确认边界。
- Dashboard、任务、日程对目标数据的跨模块依赖。
