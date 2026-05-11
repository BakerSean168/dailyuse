# Domain 层标准化收尾计划

更新时间：`2026-05-10`

## Current Status

这份计划对应的主线改造已经完成，当前状态可以视为“已实施并验证，可准备归档”。

本轮实际完成内容：

- `repository` 模块的 `REPOSITORY_RESOURCE_MUTATED_EVENT` 系列常量已重新审计，确认仍被 `repository` 与 `ai` 运行时代码消费，因此保留，不再作为死代码清理项。
- `editor`、`schedule`、`task` 三个聚合已补齐删除领域事件方法：
  - `EditorWorkspace.delete()`
  - `CalendarEntry.delete()`
  - `TaskDependency.delete()`
- `editor`、`schedule`、`task` 的删除应用入口已接入聚合删除动作，不再完全绕过领域层语义。
- `NotificationTemplate` 的聚合 DTO 与模板配置 DTO 已迁移到 `@dailyuse/contracts/notification`。
- `NotificationTemplate` 已补齐 `toClientDTO()`。
- `ReminderGroup` 已完成 `_props` 收口，`deletedAt` 已统一为 `Date | null`。
- `AuthSessionState.version` 已补齐，并贯通到 contracts、aggregate、Prisma mapper、PowerSync mapper、DTO 转换与测试。

## Completed Workstreams

### Batch A: 审计后的保留项

- 原计划中的 `repository` 资源变更事件并非死代码。
- 审计结果：该事件仍由以下路径消费：
  - `packages/repository/src/application-server/services/resource-mutation.service.ts`
  - `packages/ai/src/infrastructure-server/runtime/knowledge-auto-index.runtime.ts`
- 结论：从待删除项改为“保留，直到运行时事件迁移完成”。

### Batch B: 删除事件闭环

- 已为以下聚合补齐删除事件发射：
  - `editor:workspace-deleted`
  - `schedule:calendar-entry-deleted`
  - `task:dependency-deleted`
- 已让以下删除入口显式经过聚合删除方法：
  - `DeleteEditorWorkspaceUseCase`
  - `ScheduleEventApplicationService.deleteSchedule()`
  - `DeleteTaskDependencyUseCase`

### Batch C: NotificationTemplate 标准化

- 新增 contracts DTO：
  - `NotificationTemplateServerDTO`
  - `NotificationTemplateClientDTO`
  - `NotificationTemplateConfigServerDTO`
- `packages/notification/src/domain-server/aggregates/notification-template.ts` 不再本地定义 aggregate DTO。
- `NotificationTemplate.toServerDTO()` / `toClientDTO()` 已统一返回 contracts DTO。

### Batch D: ReminderGroup 类型一致性

- `ReminderGroup` 已从个体字段模式切换到 `_props`。
- `ReminderGroupState.deletedAt` 已从 `number | null` 改为 `Date | null`。
- Prisma mapper、PowerSync mapper、组合根更新路径已同步适配。

### Batch E: AuthSession 收尾

- `AuthSessionState` 已包含 `version`。
- `AuthSessionServerDTO` 已包含 `version`。
- `toServerDTO()` / `toClientDTO()` / `create()` / `load()` / 基础设施 mapper 已全部贯通。

## Remaining Workstreams

当前没有阻塞本计划关闭的必做项。

仅保留一条后续架构备注：

- `editor`、`schedule`、`task` 这三个模块虽然已经在删除入口调用聚合 `delete()`，但其仓储仍未像 `AggregateRepositoryBase` 那样在删除流程中自动发布聚合内累积的领域事件。
- 如果后续需要让这些删除事件真正进入统一事件总线，应新增单独计划处理“删除流程的事件发布机制”，而不是继续挂在本计划下。

## Verification Gates

以下验证已在 `2026-05-10` 执行通过：

- `pnpm nx run contracts:typecheck`
- `pnpm nx run editor:typecheck`
- `pnpm nx run schedule:typecheck`
- `pnpm nx run task:typecheck`
- `pnpm nx run notification:typecheck`
- `pnpm nx run reminder:typecheck`
- `pnpm nx run authentication:typecheck`

文档更新后还应执行：

- `pnpm nx run daily-use:governance-check`

## Completion Criteria

满足以下条件后，本计划可以移入 `docs/plan/archive/`：

- 本文件已替换旧的全量待办结构，改为执行后状态文档。
- 上述 typecheck 全绿。
- `daily-use:governance-check` 通过。
- 后续若继续处理“删除流程事件发布机制”，需另开新计划，不再回写本文件。
