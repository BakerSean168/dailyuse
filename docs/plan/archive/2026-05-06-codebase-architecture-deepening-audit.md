# Codebase Architecture Deepening 审查与后续计划

> 创建时间: 2026-05-06
> 状态: 审查完成，已归档
> 审查方法: `$improve-codebase-architecture` 全仓系统审查
> 审查范围: `packages/*`、`apps/*`、`packages/contracts/*`、当前 ADR 约束下的 module / interface / implementation / seam 设计
> 归档说明：后续 server deepening 已按审查结论落地，本文现仅保留为审查基线。

## 文档定位

这份文档不是“哪里还能再抽一层”的松散建议单，而是本轮架构深挖审查的正式结论。

它关注的问题是：

1. 哪些 module 的 interface 很宽，但 implementation 仍然泄漏在 caller、controller 或 composition root 中
2. 哪些 seam 实际上是 shallow module，删除测试过不了
3. 哪些地方最值得继续 deepening，以提升 locality、leverage 和可测试性

本轮审查参考并服从以下 ADR / 现有规则：

- `ADR-009-standard-clean-architecture-layers`
- `ADR-010-standard-centralized-contracts`
- `ADR-018-smart-container-application-service-pattern`
- `ADR-025-module-composition-pattern`
- `ADR-026` 当前关于 module deepening 的方向约束

说明：

- 仓库中未发现 `CONTEXT.md`，因此本轮直接使用现有模块名、ADR 与代码结构作为术语与约束来源
- 本文不重新讨论 contracts sweep 是否正确；它以该轮完成后的代码状态为当前基线

## 总体判断

当前代码库已经明显摆脱了早期“到处是隐藏容器、到处是散落 schema”的状态，但还没有到“结构上已经优雅收口”的阶段。

本轮最重要的结论不是“还有很多零碎问题”，而是下面三条：

1. 服务端多个模块的 composition root 仍然吸住了 application implementation
2. 前端多个模块的 workspace / auth recovery / client composition 仍然跨 seam 泄漏
3. contracts 与 route contract test 虽然已经统一很多，但 public seam 仍然偏宽、偏浅

因此，后续优化的重点不应再是“补样板统一风格”，而应转向：

- 把真正复杂的 workflow 收回更深的 application module
- 删除或折叠已经没有翻译价值的 shallow seam
- 把跨模块重复的测试和 client orchestration 提炼成高 leverage 的共享 module

## 审查结论

### A. 服务端最值得 deepening 的 module

#### 1. `schedule` workflow module 仍然不够深

**当前状态（2026-05-06）**

已解决。原先留在 `createScheduleModule()` composition root 中的 workflow implementation 已回收到 application seam：

- task completion / cancellation
- due-task query
- batch delete / batch operate
- metadata update
- conflict detection / create-with-conflict / resolve conflict orchestration

对应实现现在分别收口到：

- `CompleteScheduleTaskUseCase`
- `CancelScheduleTaskUseCase`
- `GetDueScheduleTasksUseCase`
- `BatchDeleteScheduleTasksUseCase`
- `BatchOperateScheduleTasksUseCase`
- `UpdateScheduleTaskMetadataUseCase`
- `ScheduleConflictResolutionService`

验证结果：

- `pnpm nx run schedule:typecheck`
- `pnpm nx run schedule:test`

**关键文件**

- [schedule.module.ts](D:/home/projects/dailyuse/packages/schedule/src/infrastructure-server/schedule.module.ts:246)
- [schedule.controller.ts](D:/home/projects/dailyuse/packages/schedule/src/controllers/schedule.controller.ts:58)
- [schedule-event.controller.ts](D:/home/projects/dailyuse/packages/schedule/src/controllers/schedule-event.controller.ts:44)
- [schedule-event.routes.ts](D:/home/projects/dailyuse/packages/schedule/src/api/schedule-event.routes.ts:86)

**问题**

`createScheduleModule()` 中的 `api` / `eventApi` 已经不是单纯 assembly seam。

当前 implementation 仍然直接留在 composition root 中，主要包括：

- task completion / cancellation
- batch delete
- metadata update
- conflict detection / resolution
- create-with-conflict orchestration

删除测试下，这些复杂度不会消失，只会在 route、controller、module 三处来回移动。

**建议方向**

把这部分提炼为更深的 application module，例如：

- `schedule task lifecycle module`
- `schedule batch operations module`
- `schedule conflict resolution module`

composition root 只负责接线，不再持有业务 implementation。

**收益**

- locality: 冲突、批量操作、生命周期各自收口到单一 seam
- leverage: route / controller 同时变薄
- tests: 可以直接围绕 workflow 做场景测试，而不是间接穿过 facade

#### 2. `repository` resource mutation 是隐藏的 workflow module

**关键文件**

- [repository.module.ts](D:/home/projects/dailyuse/packages/repository/src/infrastructure-server/repository.module.ts:411)
- [upload-resources.use-case.ts](D:/home/projects/dailyuse/packages/repository/src/application-server/use-cases/commands/upload-resources.use-case.ts:1)
- [repository.controller.ts](D:/home/projects/dailyuse/packages/repository/src/controllers/repository.controller.ts:78)
- [repository.routes.ts](D:/home/projects/dailyuse/packages/repository/src/api/routes/repository.routes.ts:55)

**问题**

`buildApplicationPort()` 吸住了大量 repository orchestration：

- canonical repository fallback / auto-create
- resource hydration
- storage move / update
- mutation event emission
- resource create / rename / move / delete 的拼装逻辑

这意味着真正的 implementation 仍在 infrastructure seam 中，而不是 application seam 中。

**建议方向**

提炼成更深的 application module，例如：

- `repository resolution module`
- `resource mutation module`
- `stored resource hydration module`

让 `UploadResourcesUseCase` 与其他 mutation use case 复用同一 workflow seam。

**收益**

- locality: path / storage / event / fallback 的知识集中
- leverage: resource 相关修改不再反复穿透 composition root
- tests: 可以直接验证 workflow，而不是通过 facade 间接覆盖

#### 3. `goal` 的 aggregate / read-model orchestration 还在 controller

**关键文件**

- [goal.controller.ts](D:/home/projects/dailyuse/packages/goal/src/controllers/goal.controller.ts:202)
- [goal.routes.ts](D:/home/projects/dailyuse/packages/goal/src/api/routes/goal.routes.ts:38)
- [goal.module.ts](D:/home/projects/dailyuse/packages/goal/src/infrastructure-server/goal.module.ts:429)

**问题**

`GoalController` 不只是 validation adapter，还在做：

- aggregate view materialization
- progress breakdown
- clone materialization
- batch key-result weight updates

同时 route 层还保留了一部分 query normalization 与 alias 兼容。

**建议方向**

增加明确的 query / command module，例如：

- `get goal aggregate module`
- `get goal progress breakdown module`
- `clone goal module`
- `batch update key-result weights module`

并把 query canonicalization 尽量收回 contract schema 或小型 normalization module。

**收益**

- locality: 读模型规则不再分散在 route + controller
- leverage: controller 重新回到薄 adapter 角色
- tests: progress / aggregate 逻辑拥有独立测试面

#### 4. `ai` 服务端 runtime 仍是过宽 capability matrix

**关键文件**

- [ai.module.ts](D:/home/projects/dailyuse/packages/ai/src/infrastructure-server/ai.module.ts:108)
- [ai.module.ts](D:/home/projects/dailyuse/packages/ai/src/infrastructure-server/ai.module.ts:136)
- [ai.module.ts](D:/home/projects/dailyuse/packages/ai/src/infrastructure-server/ai.module.ts:385)
- [ai.module.ts](D:/home/projects/dailyuse/packages/ai/src/infrastructure-server/ai.module.ts:682)

**问题**

`createAIModule()` 当前暴露大量 optional port，并在 composition root 内部决定：

- fallback adapter
- capability availability
- runtime mode
- 部分服务缺失时的兜底行为

interface 很宽，但 leverage 不高，caller 仍然需要理解“当前 runtime 到底有哪些 capability”。

**建议方向**

按 runtime mode 进行 deepening，例如拆成：

- `direct-provider ai runtime module`
- `remote ai-service runtime module`

外层 composition root 仅做 runtime 选择，不再维护巨大的 optional dependency matrix。

**收益**

- locality: runtime 分支不再堆在一个 mega-module
- leverage: capability contract 更稳定
- tests: 可按 runtime mode 做成组场景测试

### B. 前端最值得 deepening 的 seam

#### 5. React 端“每模块一个 useXService”是浅 module

**关键文件**

- [use-goal-service.ts](D:/home/projects/dailyuse/packages/app-react/src/hooks/use-goal-service.ts:8)
- [use-task-service.ts](D:/home/projects/dailyuse/packages/app-react/src/hooks/use-task-service.ts:8)
- [use-repository-service.ts](D:/home/projects/dailyuse/packages/app-react/src/hooks/use-repository-service.ts:8)
- [use-schedule-service.ts](D:/home/projects/dailyuse/packages/app-react/src/hooks/use-schedule-service.ts:8)
- [use-ai-service.ts](D:/home/projects/dailyuse/packages/app-react/src/hooks/use-ai-service.ts:8)
- [use-notification-service.ts](D:/home/projects/dailyuse/packages/app-react/src/hooks/use-notification-service.ts:8)

**问题**

这些 hook 的 interface 和 implementation 基本同构：

- `useAppApiClient()`
- `createXHttpAdapters()`
- `new XClientService(...)`
- `useRef` 缓存

删除测试基本失败，因为删掉它们以后 caller 只是多写几行装配代码。

**建议方向**

把这批 hook 收成一个 app-level client composition / registry module，由它统一装配 application-client 与 infrastructure-client adapter。

**收益**

- locality: client 生命周期与测试替身注入集中
- leverage: 新增模块不再复制一份同构 hook
- tests: 装配逻辑集中到一个 seam 验证

#### 6. Vue 端 auth recovery / Result orchestration 跨 composable 泄漏

**关键文件**

- [useTask.ts](D:/home/projects/dailyuse/packages/app-vue/src/modules/task/composables/useTask.ts:59)
- [useReminder.ts](D:/home/projects/dailyuse/packages/app-vue/src/modules/reminder/composables/useReminder.ts:54)
- [useRepository.ts](D:/home/projects/dailyuse/packages/app-vue/src/modules/repository/composables/useRepository.ts:178)

**问题**

多个 composable 重复实现：

- `maybeRecoverAuth`
- retry
- loading / saving / error phase transition
- 错误翻译与二次执行

真实复杂度在“桌面端认证恢复后的操作语义”，但现在散在多个 caller 中。

**建议方向**

提炼一个共享的 `desktop authenticated operation` seam，把恢复、重试、phase 与错误翻译收进一个 module。

**收益**

- locality: 认证恢复策略集中
- leverage: task / reminder / repository / 其他模块共享同一 runner
- tests: 从每个 composable 各测一遍，收敛成对一个 runner 的场景测试

#### 7. Repository / Editor / AI workspace 复杂度跨 seam 泄漏

**关键文件**

- [useRepository.ts](D:/home/projects/dailyuse/packages/app-vue/src/modules/repository/composables/useRepository.ts:199)
- [repositoryResourceGateway.ts](D:/home/projects/dailyuse/packages/app-vue/src/modules/repository/services/repositoryResourceGateway.ts:22)
- [useEditorWorkspaceActions.ts](D:/home/projects/dailyuse/packages/app-vue/src/modules/editor/composables/useEditorWorkspaceActions.ts:11)
- [editorClientGateway.ts](D:/home/projects/dailyuse/packages/app-vue/src/modules/editor/services/editorClientGateway.ts:21)
- [use-repository-workspace.ts](D:/home/projects/dailyuse/packages/app-react/src/hooks/use-repository-workspace.ts:29)
- [use-ai-workspace.ts](D:/home/projects/dailyuse/packages/app-react/src/hooks/use-ai-workspace.ts:67)
- [ai-client-service.ts](D:/home/projects/dailyuse/packages/ai/src/application-client/ai-client-service.ts:46)

**问题**

“打开资源到编辑器”和“AI conversation/provider/stream 编排”都还不是深 module。

目前的 gateway / client service 很多只是转发；真正复杂的 implementation 仍在 workspace hook 和多个 caller 中。

**建议方向**

分别 deepening 为：

- `repository workspace` / `editor resource session` seam
- `ai workspace` seam

让 interface 直接表达用户动作，而不是只暴露底层 adapter 方法。

**收益**

- locality: 最容易出 UI bug 的编排逻辑收回一处
- leverage: Vue / React 侧可以共享更稳定的工作流语义
- tests: 变成围绕 workspace interface 的场景测试

### C. contracts / testing / public seam 仍可继续加深

#### 8. `transport-handlers` 在多个模块里已成为假 seam

**关键文件**

- [goal transport-handlers.ts](D:/home/projects/dailyuse/packages/goal/src/api/transport-handlers.ts:28)
- [schedule transport-handlers.ts](D:/home/projects/dailyuse/packages/schedule/src/api/transport-handlers.ts:26)
- [task transport-handlers.ts](D:/home/projects/dailyuse/packages/task/src/api/transport-handlers.ts:37)
- [account transport-handlers.ts](D:/home/projects/dailyuse/packages/account/src/api/transport-handlers.ts:13)

**问题**

有的文件只是 `return api`，有的文件是一整页 `{ execute: api.xxx }` 包装。

这类 interface 基本等于 implementation，删除测试大多失败。

**建议方向**

controller 直接依赖 application port；只有确实存在翻译价值时才保留 transport-handler seam。

**收益**

- leverage: 调用链更短
- locality: 更少跳转
- tests: controller seam 更真实

#### 9. contracts public seam 仍偏宽，response schema 仍偏 catalog 化

**关键文件**

- [account/index.ts](D:/home/projects/dailyuse/packages/contracts/src/modules/account/index.ts:1)
- [goal/index.ts](D:/home/projects/dailyuse/packages/contracts/src/modules/goal/index.ts:1)
- [notification/index.ts](D:/home/projects/dailyuse/packages/contracts/src/modules/notification/index.ts:1)
- [task/api/response-schemas.ts](D:/home/projects/dailyuse/packages/contracts/src/modules/task/api/response-schemas.ts:1)
- [goal/api/response-schemas.ts](D:/home/projects/dailyuse/packages/contracts/src/modules/goal/api/response-schemas.ts:1)
- [ai/api/response-schemas.ts](D:/home/projects/dailyuse/packages/contracts/src/modules/ai/api/response-schemas.ts:1)

**问题**

当前 root barrel 往往整包导出：

- `aggregates`
- `entities`
- `value-objects`
- `dtos`
- `protocol`
- `api`

同时多个 `response-schemas.ts` 仍是大 catalog，而不是按概念聚焦的 projection seam。

**建议方向**

- 收敛为更清晰的 public seam，例如 `api` / `domain` / `protocol`
- 让每个 public projection 拥有自己的 type + schema
- 减少“模块根导出所有内部 strata”的习惯

**收益**

- locality: projection 变化只改一处
- leverage: routes、OpenAPI、caller 共享单一 projection seam
- tests: route contract spec 更容易围绕稳定 projection 写

#### 10. route contract test seam 已起步，但仍然偏浅

**关键文件**

- [task-template.routes.spec.ts](D:/home/projects/dailyuse/packages/task/src/api/routes/task-template.routes.spec.ts:14)
- [goal.routes.spec.ts](D:/home/projects/dailyuse/packages/goal/src/api/routes/goal.routes.spec.ts:15)
- [schedule-event.routes.spec.ts](D:/home/projects/dailyuse/packages/schedule/src/api/schedule-event.routes.spec.ts:14)
- [repository.routes.spec.ts](D:/home/projects/dailyuse/packages/repository/src/api/routes/repository.routes.spec.ts:14)
- [openapi-helpers.ts](D:/home/projects/dailyuse/packages/utils/src/result/openapi-helpers.ts:56)
- [route-registrar.ts](D:/home/projects/dailyuse/packages/utils/src/result/route-registrar.ts:105)

**问题**

每个 spec 仍在重复：

- `TestOpenApiRegistry`
- schema extractor
- envelope assertion
- OpenAPI 结果对象解析细节

部分 spec 还只是断言“schema 存在”，没有验证 canonical wire format。

**建议方向**

提炼共享 `route contract test module`，统一封装：

- route registration
- success schema 提取
- branded params 断言
- canonical query / body wire format 断言
- ADR-030 `Result` envelope 断言

**收益**

- leverage: 一处增强，处处收益
- locality: route-spec mechanics 从各模块回收到单一测试 seam
- tests: 更聚焦 route interface 本身，而不是 OpenAPI plumbing

## 优先级建议

按“杠杆最大 + 当前复杂度最明显跨 seam 泄漏”的顺序，建议优先级如下：

1. `schedule` workflow deepening
2. `repository` resource mutation deepening
3. `repository/editor` 或 `ai` 的 workspace seam deepening
4. app-level client composition / desktop auth runner
5. contracts public seam + shared route-contract test seam
6. `goal` aggregate / progress read-model deepening
7. `transport-handlers` 折叠清理

## 建议实施波次

### Wave 1: 服务端 workflow 回收

- `schedule`
- `repository`

目标：

- 把 composition root 中的 implementation 回收到 application module
- 保持 route / controller / contracts 外观稳定
- 先建立“deepening 不破坏公共 contract”的样板

### Wave 2: 前端 workspace 与 auth runner

- `repository/editor workspace`
- `ai workspace`
- `desktop authenticated operation runner`
- app-level client composition / registry

目标：

- 把最容易出 UI bug 的 orchestration 收回深 module
- 减少 React/Vue 两端重复装配与重复恢复逻辑

### Wave 3: contracts public seam 与 route test seam

- contracts 根导出面收窄
- response projection module 化
- route contract test helper 共享化
- `transport-handlers` 假 seam 折叠

目标：

- 让后续模块重构拥有更稳的公共 interface
- 提升全仓 route contract 测试 leverage

### Wave 4: `goal` 读模型与剩余 seam 收口

- `goal` aggregate / progress / clone / weight workflow
- 其他遗留 shallow seam 清理

目标：

- 完成从“结构看起来整齐”到“复杂度真正收回深 module”的最后一段

## 非目标

本计划当前不包含以下内容：

- 再做一轮 contracts sweep
- 重新设计业务领域模型命名
- 全面改写前端状态管理框架
- 以“为了抽象而抽象”的方式增加新层

判断标准不是“层数更多”，而是：

- deletion test 是否能过
- locality 是否提升
- leverage 是否提升
- tests 是否更集中、更贴近真实 seam

## 当前建议

如果紧接着进入实施，建议先从 `schedule` 或 `repository` 开始。

原因：

- 这两处最明显地把 application implementation 留在 composition root
- 重构收益高，且对公共 contract 影响可控
- 它们能先为后续 `goal`、`ai`、前端 workspace seam 建立清晰样板
