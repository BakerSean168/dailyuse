# AI Runtime Module Split 执行方案

> 创建时间: 2026-05-06
> 状态: 已完成，归档
> 来源: [服务端 Deepening 执行总览](./2026-05-06-server-deepening-execution-overview.md)
> 审查来源: [Codebase Architecture Deepening 审查与后续计划](./2026-05-06-codebase-architecture-deepening-audit.md)
> 归档说明：AI runtime split 与 runtime-owned unavailable surface 已完成，本文仅保留为历史执行方案。

## 问题定位

`ai` 模块当前的问题不是“缺少 use case”，而是 [ai.module.ts](D:/home/projects/memoflow/packages/ai/src/infrastructure-server/ai.module.ts:498) 和 [ai.module.ts](D:/home/projects/memoflow/packages/ai/src/infrastructure-server/ai.module.ts:664) 同时承担了以下职责：

- runtime mode 判定
- fallback adapter 选择
- provider / conversation / chat / knowledge / analytics / goal automation service assembly
- capability descriptor 计算
- unavailable capability 的错误返回
- runtime contribution 注入

这使得 `createAIModule()` 变成了过宽的 capability matrix 维护点。

问题具体表现为：

1. top-level composition root 必须理解“当前 runtime 到底有哪些 capability”
2. `services.xxx` 是否存在的判断散落在 `api` 各方法中
3. direct-provider 与 remote-ai-service 的 runtime 语义没有被做成真正的 module
4. optional dependency matrix 太宽，新增能力时必然继续往 mega-module 堆分支

## 目标结构

本轮固定把 AI runtime 拆成两个明确 module。

### 1. `createDirectProviderAIRuntime`

建议位置：

- `packages/ai/src/infrastructure-server/runtime/direct-provider-ai.runtime.ts`

职责：

- 组装 direct-provider mode 的完整 runtime
- 使用：
  - `DirectProviderChatExecutionAdapter`
  - `DirectProviderGoalPlanningAdapter`
  - `DirectProviderKnowledgeNoteGenerationAdapter`
- 暴露：
  - `capabilities`
  - `services`
  - `runtimeContributions`

固定能力边界：

- 支持 chat
- 支持 goal generation
- 仅在 `knowledgeNotePersistence + getKnowledgeNoteSubpath` 存在时支持 knowledge note
- 不支持：
  - knowledge query
  - knowledge reindex
  - analytics query
  - goal automation

这些不支持能力必须通过 unavailable adapter 或统一 unavailable service 表达，而不是在 top-level `api` 内反复判空。

### 2. `createRemoteAIServiceRuntime`

建议位置：

- `packages/ai/src/infrastructure-server/runtime/remote-ai-service.runtime.ts`

职责：

- 组装 remote-ai-service mode 的完整 runtime
- 按 capability bundle 组装 remote-only features
- 对每个 bundle 做完整性校验
- 产出 capability-aware runtime

remote runtime 不是“所有高级能力必须全量存在”的 all-or-nothing 模式。

固定 bundle 划分如下：

- chat bundle:
  - 若提供 `chatExecutionPort`，使用 remote chat
  - 否则回退 direct-provider chat adapter
- goal generation bundle:
  - 若提供 `goalPlanningPort`，使用 remote goal planning
  - 否则回退 direct-provider goal planning adapter
- knowledge query bundle:
  - 需要 `knowledgeSourcePort` + `knowledgeIndexRepository` + `knowledgeIngestionPort` + `knowledgeQueryPort`
- analytics bundle:
  - 需要 `analyticsReadPort` + `analyticsQueryPort`
- goal automation bundle:
  - 需要 `goalAutomationPlanningPort` + `automationToolExecutorPort`
- knowledge note generation bundle:
  - 若提供 `knowledgeNoteGenerationPort`，使用 remote note generation
  - 否则回退 direct-provider note generation adapter

固定规则：

- bundle 完整则启用该 capability
- bundle 缺失则暴露 unavailable service
- 只有当宿主显式尝试组装一个不完整 bundle 时，才允许在 runtime assembly 阶段 fail fast
- 不能因为缺少 analytics 或 automation，就让整个 remote runtime 无法创建

`knowledgeNotePersistence` 与 `getKnowledgeNoteSubpath` 不属于 remote mode 必要条件，继续作为宿主协作 seam 单独处理。

## Runtime 输出 Shape

两个 runtime 必须产出统一 shape，例如：

- `capabilities`
- `services`
- `runtimeContributions`

固定要求：

- top-level `createAIModule()` 只能消费这个统一 shape
- runtime 内部决定如何暴露 unavailable capability
- `createAIModule()` 不再关心某项 capability 是 direct 缺失还是 remote 组装缺失
- `createAIPowerSyncModule()` 等 convenience factory 继续允许只注入部分高级能力 bundle

## Capability 与 Unavailable 策略

### Capability Descriptor

`resolveAICapabilities()` 不再作为 top-level helper 存在。

改为：

- direct runtime 自己声明 capabilities
- remote runtime 自己声明 capabilities

其中 `advancedFeaturesReason` 的现有语义保持不变，不在本轮重写产品文案。

### Unavailable Capability

固定策略：

- 用 null-object / unavailable adapter / unavailable service 统一表达
- 不在 `AIApplicationPort` 的每个方法里写 `if (!services.xxx)`

实现要求：

- `queryKnowledge`
- `expandKnowledge`
- `reindexKnowledge`
- `queryAnalytics`
- `getEvaluationOverview`
- 其他 runtime-specific feature

都应通过 runtime 提供的稳定 service surface 暴露，而不是让 top-level `api` 感知分支。

附加要求：

- `createAIApiModule()` 不再通过检查 `aiModule.services.knowledgeNoteService` / `knowledgeQueryServices` / `analyticsQueryService` 来决定是否抛出启动错误
- AI API routes 继续注册；能力不可用时，由 runtime service 返回 `SERVICE_UNAVAILABLE`
- `getCapabilities()` 必须与这些 unavailable service 的实际可用性一致

## 实施步骤

### Wave 1: 抽出 runtime-specific assembler

新增：

- `direct-provider-ai.runtime.ts`
- `remote-ai-service.runtime.ts`
- 共享 runtime types，例如 `ai-runtime.ts`

这一步先不动对外 `AIApplicationPort`，只把现有 service assembly 按 runtime 拆开。

### Wave 2: 收口 top-level `createAIModule()`

改造 [ai.module.ts](D:/home/projects/memoflow/packages/ai/src/infrastructure-server/ai.module.ts:664)：

- 只负责 runtime mode 选择
- 合并 runtime contributions
- 产出统一 `api`

完成后 top-level 不应继续持有：

- `createAIServices()`
- `resolveAICapabilities()`
- 针对 `services.knowledgeQueryServices` / `services.analyticsQueryService` 的判空分支
- API module 中基于 `aiModule.services.*` 的 capability presence guard

### Wave 3: 用 runtime-owned service surface 替换判空分支

改造 `AIApplicationPort` 的内部委派逻辑：

- `createAIModule()` 委派给 runtime 的统一 service surface
- unavailable error 从 runtime service 返回
- top-level `api` 不再维护 capability-specific branching

## Public Seam 不可变项

本轮默认不修改：

- `AIApplicationPort` 的公开方法签名
- AI chat / goal generation / knowledge / analytics routes path
- controller public method shape
- response envelope 与 contracts schema

允许变化：

- `AIModuleServices` 的内部结构
- runtime 组装文件结构
- top-level assembly helper 的删除与迁移

## 进入 Runtime Mode 的固定规则

本轮保留当前判断语义，但把它们显式文档化：

- 若存在 remote-only capability 依赖，进入 `remote-ai-service`
- 否则进入 `direct-provider`

这里的“remote-only capability 依赖”固定指：

- remote chat / goal / knowledge / analytics / automation 相关 ports

补充约束：

- 进入 `remote-ai-service` 不等于所有 bundle 都必须开启
- `runtimeMode` 是 runtime 的组装来源描述，不是 capability completeness 保证

不要在本轮引入第三种 mode，也不要重新设计 runtime naming。

## 测试要求

必须新增：

- `direct-provider-ai.runtime.spec.ts`
- `remote-ai-service.runtime.spec.ts`
- `ai-runtime-capabilities.spec.ts`

建议覆盖场景：

- direct runtime 正确暴露 chat / goal generation / optional knowledge note
- direct runtime 对 knowledge query / analytics / automation 返回稳定 unavailable error
- remote runtime 在仅提供 knowledge bundle 时仍可创建，并正确暴露 knowledge-only advanced capabilities
- remote runtime 在 knowledge / analytics / automation 三类 bundle 中分别按完整性启用 capability
- remote runtime 只在显式组装不完整 bundle 时 fail fast
- runtime 输出的 capability descriptor 与实际 service surface 一致

必须保持通过：

- `packages/ai/src/api/routes/ai-chat.routes.spec.ts`
- 现有 AI chat / knowledge / provider / goal generation 测试
- 现有 `ai-query-services.test.ts` 中依赖部分高级能力 bundle 的场景

## 最小验证

实施后至少运行：

- `pnpm nx run ai:typecheck`
- `pnpm nx run ai:test`
- `pnpm nx run memoflow:governance-check`

## 完成定义

只有同时满足以下条件，才算此项完成：

1. `createAIModule()` 不再维护 optional dependency mega-matrix
2. direct-provider 与 remote-ai-service 成为真正的 runtime module
3. capability descriptor 由 runtime 自己拥有
4. unavailable capability 不再由 top-level `api` 逐方法判空
5. API module 与 PowerSync factory 不再通过 `services.*` presence guard 假定 capability completeness
6. public route / controller / contracts seam 保持稳定
