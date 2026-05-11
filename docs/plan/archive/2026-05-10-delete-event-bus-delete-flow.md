# 删除事件接入统一事件总线执行状态

更新时间：`2026-05-11`

## Current Status

这份计划的核心目标已经完成，当前状态可以视为“已执行并完成主要验证，待工作区收敛后可归档”。

本轮已经实现的主线结果：

- `@dailyuse/patterns` 已抽出通用 `publishAggregateEvents(...)` helper，并由 `AggregateRepositoryBase.save()` 复用。
- `editor workspace`、`calendar entry`、`task dependency` 三条删除命令链都已切到仓储级 `deleteAggregate(...)`。
- Prisma 与 PowerSync 两套服务端适配器都已补上删除后发布聚合事件的路径。
- `task dependency` 已补齐命令侧 aggregate 查询入口 `findAggregateById(...)`，不再临时构造无人接管的聚合实例。
- 删除应用入口不再依赖应用层手工 `eventBus.send(...)` 来兜底这 3 个模块。

## Completed Workstreams

### Batch A: 通用发布 helper

- `packages/patterns/src/repository/aggregate-repository.base.ts`
  - 已新增 `publishAggregateEvents(...)`
  - `AggregateRepositoryBase.save()` 已改为复用该 helper
- `packages/patterns/src/repository/index.ts`
  - 已导出 `publishAggregateEvents`

### Batch B: Editor Workspace 删除链路

- `IEditorWorkspaceRepository` 已新增 `deleteAggregate(workspace)`
- Prisma / PowerSync 仓储均已实现删除后发布事件
- `DeleteEditorWorkspaceUseCase` 已从 `delete(id)` 切换到 `deleteAggregate(workspace)`

效果：

- `editor:workspace-deleted` 不再停留在聚合内存里
- 删除事件已通过仓储进入统一事件总线

### Batch C: Schedule Calendar Entry 删除链路

- `IScheduleRepository` 已新增 `deleteAggregate(entry)`
- Prisma / PowerSync 仓储均已实现删除后发布事件
- `ScheduleEventApplicationService.deleteSchedule()` 已切换到 `deleteAggregate(schedule)`

效果：

- `schedule:calendar-entry-deleted` 已通过仓储进入统一事件总线
- 删除后 conflict cache refresh 逻辑仍保留在原位置

### Batch D: Task Dependency 命令侧聚合化删除

- `ITaskDependencyRepository` 已新增：
  - `findAggregateById(id)`
  - `deleteAggregate(dependency)`
- Prisma / PowerSync mapper 已补 aggregate 恢复入口
- `DeleteTaskDependencyUseCase` 已切换为：
  - `findAggregateById(id)`
  - `dependency.delete()`
  - `deleteAggregate(dependency)`

效果：

- `task:dependency-deleted` 已通过仓储进入统一事件总线
- payload 中的 `dependencyId`、`predecessorTaskId`、`successorTaskId` 可从真实聚合状态稳定产出

### Batch E: 测试与收口

已完成：

- 为 `publishAggregateEvents(...)` 新增最小单元测试
- `task` 删除命令测试已更新到新仓储契约，验证 `deleteAggregate(...)` 路径被调用
- 聚合层删除事件测试仍然保留：
  - `editor:workspace-deleted`
  - `schedule:calendar-entry-deleted`
  - `task:dependency-deleted`

未额外扩展：

- 未新增 Prisma/PowerSync 仓储级集成测试来直接断言事件总线收到删除事件
- 未把 `schedule-task`、`task-instance` 等历史手工删除派发路径一并重构

## Verification

### 已通过

以下验证在 `2026-05-11` 已执行通过：

- `pnpm nx run editor:typecheck`
- `pnpm nx run schedule:typecheck`
- `pnpm nx run task:typecheck`

### 已补充的测试覆盖

- `packages/patterns/src/repository/aggregate-repository.base.spec.ts`
  - 验证 helper 会发布并清空聚合事件
  - 验证无事件时不会调用 event bus
- `packages/task/src/application-server/use-cases/commands/__tests__/task-dependency-and-goal-binding.test.ts`
  - 验证删除命令已改走 `findAggregateById(...) + deleteAggregate(...)`

### 当前剩余验证问题

- `pnpm nx run daily-use:governance-check` 当前未通过，但原因不是本计划代码错误。
- 失败原因是文档扫描过程访问 `apps/ai-service/.pytest_cache` 时触发 `EPERM`。
- 该问题需要单独清理环境或调整检查脚本后再复跑。

## Remaining Workstreams

当前没有阻塞本计划主目标完成的必做项。

仅保留 2 条后续事项：

- 在工作区收敛并提交后，将本文件移动到 `docs/plan/archive/`
- 如需把 `schedule-task`、`task-instance` 等现有应用层手工删除派发路径统一迁移到仓储删除发布约定，应新增后续计划，不再回写本文件

## Completion Criteria

本计划定义的完成条件目前已满足主体要求：

- `editor workspace` 删除事件通过仓储进入统一事件总线
- `calendar entry` 删除事件通过仓储进入统一事件总线
- `task dependency` 删除事件通过仓储进入统一事件总线
- 这 3 条删除命令链不再依赖应用层手工事件派发
- `@dailyuse/patterns` 中已存在可复用的“删除后发布聚合事件”公共能力
- 相关包 typecheck 已通过

尚未满足的只是文档治理检查的环境性前提，不属于本计划实现缺口。
