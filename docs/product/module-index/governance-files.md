---
tags:
  - product
  - module-index
  - governance
description: 治理模块相关文件索引
created: 2026-06-02T00:00:00
updated: 2026-06-02T00:00:00
---

# 治理模块文件索引

本索引用于连接治理模块的业务说明和真实代码。

## 前端页面与路由

| 文件 | 说明 |
| --- | --- |
| [`packages/app-vue/src/modules/governance/router/index.ts`](../../../packages/app-vue/src/modules/governance/router/index.ts) | Vue 治理模块路由（5 个路由） |
| [`packages/app-vue/src/modules/governance/views/GovernanceListView.vue`](../../../packages/app-vue/src/modules/governance/views/GovernanceListView.vue) | 规则列表页 |
| [`packages/app-vue/src/modules/governance/views/GovernanceDetailView.vue`](../../../packages/app-vue/src/modules/governance/views/GovernanceDetailView.vue) | 规则详情页 |
| [`packages/app-vue/src/modules/governance/views/RuleEditorView.vue`](../../../packages/app-vue/src/modules/governance/views/RuleEditorView.vue) | 规则编辑页 |
| [`packages/app-vue/src/modules/governance/views/RevisionHistoryView.vue`](../../../packages/app-vue/src/modules/governance/views/RevisionHistoryView.vue) | 修订历史页 |

## 前端状态、组合函数与组件

| 文件 | 说明 |
| --- | --- |
| [`packages/app-vue/src/modules/governance/stores/governance-store.ts`](../../../packages/app-vue/src/modules/governance/stores/governance-store.ts) | 治理 Pinia store |
| [`packages/app-vue/src/modules/governance/composables/useGovernance.ts`](../../../packages/app-vue/src/modules/governance/composables/useGovernance.ts) | 治理操作组合函数 |
| [`packages/app-vue/src/modules/governance/components/RuleCard.vue`](../../../packages/app-vue/src/modules/governance/components/RuleCard.vue) | 规则卡片组件 |
| [`packages/app-vue/src/modules/governance/components/RevisionCard.vue`](../../../packages/app-vue/src/modules/governance/components/RevisionCard.vue) | 修订卡片组件 |
| [`packages/app-vue/src/modules/governance/components/CodeSnippetView.vue`](../../../packages/app-vue/src/modules/governance/components/CodeSnippetView.vue) | 代码片段展示组件 |
| [`packages/app-vue/src/modules/governance/components/RuleStatusBadge.vue`](../../../packages/app-vue/src/modules/governance/components/RuleStatusBadge.vue) | 规则状态徽章 |
| [`packages/app-vue/src/modules/governance/components/SearchBar.vue`](../../../packages/app-vue/src/modules/governance/components/SearchBar.vue) | 搜索栏组件 |
| [`packages/app-vue/src/modules/governance/components/TagFilterChips.vue`](../../../packages/app-vue/src/modules/governance/components/TagFilterChips.vue) | 标签筛选组件 |

## API、控制器与适配器

| 文件 | 说明 |
| --- | --- |
| [`packages/governance/src/api/routes/governance-rules.routes.ts`](../../../packages/governance/src/api/routes/governance-rules.routes.ts) | 规则 HTTP routes |
| [`packages/governance/src/api/routes/governance-rule-revisions.routes.ts`](../../../packages/governance/src/api/routes/governance-rule-revisions.routes.ts) | 修订 HTTP routes |
| [`packages/governance/src/api/module.ts`](../../../packages/governance/src/api/module.ts) | 治理 API 模块定义 |
| [`packages/governance/src/controllers/governance.controller.ts`](../../../packages/governance/src/controllers/governance.controller.ts) | 治理控制器 |

## 领域、用例与仓储

| 文件 | 说明 |
| --- | --- |
| [`packages/governance/src/domain-server/aggregates/rule.ts`](../../../packages/governance/src/domain-server/aggregates/rule.ts) | Rule 聚合根 |
| [`packages/governance/src/domain-server/entities/rule-revision.ts`](../../../packages/governance/src/domain-server/entities/rule-revision.ts) | RuleRevision 实体 |
| [`packages/governance/src/application-server/use-cases/commands/create-rule.use-case.ts`](../../../packages/governance/src/application-server/use-cases/commands/create-rule.use-case.ts) | 创建规则用例 |
| [`packages/governance/src/application-server/use-cases/commands/update-rule.use-case.ts`](../../../packages/governance/src/application-server/use-cases/commands/update-rule.use-case.ts) | 更新规则用例 |
| [`packages/governance/src/application-server/use-cases/commands/delete-rule.use-case.ts`](../../../packages/governance/src/application-server/use-cases/commands/delete-rule.use-case.ts) | 删除规则用例 |
| [`packages/governance/src/application-server/use-cases/queries/search-rules.use-case.ts`](../../../packages/governance/src/application-server/use-cases/queries/search-rules.use-case.ts) | 搜索规则查询 |
| [`packages/governance/src/application-server/use-cases/queries/get-rule-revisions.use-case.ts`](../../../packages/governance/src/application-server/use-cases/queries/get-rule-revisions.use-case.ts) | 修订历史查询 |
| [`packages/governance/src/infrastructure-server/governance.module.ts`](../../../packages/governance/src/infrastructure-server/governance.module.ts) | 服务端治理模块组合根 |

## Contracts 与数据结构

| 文件 | 说明 |
| --- | --- |
| [`packages/governance/src/contracts/aggregates/rule-server.ts`](../../../packages/governance/src/contracts/aggregates/rule-server.ts) | Rule 服务端 DTO |
| [`packages/governance/src/contracts/aggregates/rule-client.ts`](../../../packages/governance/src/contracts/aggregates/rule-client.ts) | Rule 客户端 DTO |
| [`packages/governance/src/contracts/entities/rule-revision-server.ts`](../../../packages/governance/src/contracts/entities/rule-revision-server.ts) | RuleRevision 服务端 DTO |
| [`packages/governance/src/contracts/api/rules.ts`](../../../packages/governance/src/contracts/api/rules.ts) | 规则 API DTO（Zod schemas） |
| [`packages/governance/src/contracts/protocol/governance-event-map.ts`](../../../packages/governance/src/contracts/protocol/governance-event-map.ts) | 治理事件 map |
| [`packages/governance/src/contracts/protocol/governance-rpc-map.ts`](../../../packages/governance/src/contracts/protocol/governance-rpc-map.ts) | 治理 RPC map |
| [`packages/database/prisma/schema/governance.prisma`](../../../packages/database/prisma/schema/governance.prisma) | 治理 Prisma schema |

## 仓库级治理文档

| 文件 | 说明 |
| --- | --- |
| [`docs/governance/README.md`](../../../docs/governance/README.md) | 治理规范入口 |
| [`docs/governance/QUICK_REFERENCE.md`](../../../docs/governance/QUICK_REFERENCE.md) | 快速参考 |
| [`docs/governance/DECISIONS.md`](../../../docs/governance/DECISIONS.md) | 设计决策 |
| [`docs/governance/CHANGE_PLAYBOOK.md`](../../../docs/governance/CHANGE_PLAYBOOK.md) | 变更手册 |

## 测试入口

| 文件 | 说明 |
| --- | --- |
| [`packages/governance/src/application-server/use-cases/commands/__tests__/create-rule.use-case.test.ts`](../../../packages/governance/src/application-server/use-cases/commands/__tests__/create-rule.use-case.test.ts) | 创建规则测试 |
| [`packages/governance/src/application-server/use-cases/queries/__tests__/search-rules.use-case.test.ts`](../../../packages/governance/src/application-server/use-cases/queries/__tests__/search-rules.use-case.test.ts) | 搜索规则测试 |
| [`packages/governance/src/api/routes/governance.routes.spec.ts`](../../../packages/governance/src/api/routes/governance.routes.spec.ts) | 治理 routes 测试 |
| [`packages/app-vue/src/modules/governance/stores/governanceStore.spec.ts`](../../../packages/app-vue/src/modules/governance/stores/governanceStore.spec.ts) | 治理 store 测试 |

## 需要重点关注的改动风险

- 产品内治理功能和仓库级治理规范的混淆。
- 规则状态机的正确性（Draft → Active → Deprecated）。
- 修订历史的完整性和不可变性。
- 规则 code 的唯一性约束。
