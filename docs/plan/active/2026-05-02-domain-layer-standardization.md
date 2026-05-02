# Domain 层标准化优化计划

## Context

上一轮完成了 contracts 层（12 个模块）的事件命名、导出顺序、事件结构标准化。本轮审计发现 domain-server / domain-shared / domain-client 层仍存在大量不一致：5 个聚合根完全不发事件、3 个聚合的 addDomainEvent 无类型安全、Auth/Editor 使用非标准的状态封装模式、日期/ID 类型不统一等。目标是全面修复，使所有模块对齐 governance 标准。

---

## Phase 0: Governance domain 层样板增强

Governance 已经是高质量参考实现，补充以下教学注释：

### 0.1 `packages/governance/src/domain-server/index.ts`
- 添加与 `domain-shared` 关系的说明：domain-server 如何导入并使用 domain-shared 的值对象
- 添加与 `domain-client` 关系的说明：两者共享 State 接口但行为不同

### 0.2 `packages/governance/src/domain-server/aggregates/rule.ts`
- 在 `_props` 声明处添加注释：为什么用 `_props` 而非个体字段（封装、序列化、快照化）
- 在 `toClientDTO()` 处添加注释：说明 Date → number 的 ACL 转换

### 0.3 `packages/governance/src/domain-server/entities/rule-revision.ts`
- 在 `private readonly _props` 处添加注释：immutable entity 与 mutable aggregate 的区别

### 0.4 `packages/governance/src/domain-client/index.ts`
- 添加注释说明：为什么大多数业务模块在此处 re-export `domain-shared/value-objects`（便利性），而 governance 选择不这样做（显式 > 隐式）

### 0.5 `packages/governance/src/domain-shared/value-objects/index.ts`
- 添加注释说明：为什么使用 `export { X } from` 而非 `export * from`（显式导出防止意外泄露内部类型）

---

## Wave 1: 清理死代码 + 小修复（LOW 风险）

### 1.1 删除 notification 重复仓储接口
- **删除** `packages/notification/src/domain-server/repositories/NotificationRepository.interface.ts`
- 确认 `repositories/index.ts` 未导出它（已确认）

### 1.2 修复 goal domain-client `.js` 扩展名
- `packages/goal/src/domain-client/aggregates/index.ts`: `./Goal.js` → `./Goal`, `./goal-folder.js` → `./goal-folder`
- `packages/goal/src/domain-client/index.ts`: `./aggregates/index.js` → `./aggregates`, `./entities/index.js` → `./entities`

### 1.3 修复 AI 未导出的 value objects
- `packages/ai/src/domain-shared/value-objects/index.ts`: 添加 `ai-generation-task-id` 和 `ai-usage-quota-id` 的导出

### 1.4 修复 reminder 伪 async 方法
- `packages/reminder/src/domain-server/aggregates/reminder-group.ts`:
  - `enableAllTemplates()` / `pauseAllTemplates()` → 移除 `async`
  - `getTemplatesCount()` / `getActiveTemplatesCount()` → 移除 `async`

### 1.5 修复 notification `send()` 伪 async
- `packages/notification/src/domain-server/aggregates/notification.ts`: `send()` → 移除 `async`（如内部无 await）

### 1.6 统一 account domain-shared 导出结构
- 创建 `packages/account/src/domain-shared/value-objects/index.ts` barrel 文件
- 简化 `domain-shared/index.ts` 为 `export * from './value-objects'`

### 1.7 统一 account domain-client 导出路径
- `packages/account/src/domain-client/index.ts`: `export * from '../domain-shared'` → `export * from '../domain-shared/value-objects'`

### 1.8 清理 repository 未使用的事件常量和接口
- `packages/contracts/src/modules/repository/domain/events/index.ts`:
  - `REPOSITORY_RESOURCE_MUTATED_EVENT` 常量未在 event map 中注册
  - `RepositoryResourceMutatedEvent` 接口未在 event map 中注册
  - 确认是否仍被使用，否则删除

---

## Wave 2: 补充缺失的领域事件定义（contracts 层新增）

需要先在 contracts 层创建事件接口和更新事件映射，再在 domain-server 中添加 addDomainEvent 调用。

### 2.1 Editor — 新增 2 个事件

**`packages/contracts/src/modules/editor/protocol/editor-event-map.ts`** 新增:
- `editor:workspace-created` → `EditorWorkspaceCreatedEvent`
- `editor:workspace-deleted` → `EditorWorkspaceDeletedEvent`

**新建 `packages/contracts/src/modules/editor/domain/events/`**:
- `editor-workspace-created.event.ts` — payload: `{ identityId, name, projectPath, projectType }`
- `editor-workspace-deleted.event.ts` — payload: `{ workspaceId }`
- `index.ts` — 导出所有事件

**转换** `editor-workspace-updated.event.ts` 和 `editor-resource-saved.event.ts`：移除 `aggregateId` / `timestamp`（envelope 字段，addDomainEvent 自动包裹）。保留 payload 字段如 `changedFields`, `resourceId`。

### 2.2 Repository — 新增 4 个事件

**`packages/contracts/src/modules/repository/protocol/repository-event-map.ts`** 新增:
- `repository:created` → `RepositoryCreatedEvent`
- `repository:updated` → `RepositoryUpdatedEvent`
- `repository:archived` → `RepositoryArchivedEvent`
- `repository:deleted` → `RepositoryDeletedEvent`

**转换** `repository-statistics-updated.event.ts`：移除 `aggregateId` / `timestamp`，保留 `identityId`, `totalRepositories`, `totalResources`。

**新建 `packages/contracts/src/modules/repository/domain/events/`**:
- 4 个新事件文件 + 更新 `index.ts`

### 2.3 Notification Template — 新增 4 个事件

**`packages/contracts/src/modules/notification/protocol/notification-event-map.ts`** 新增:
- `notification:template-created` → `NotificationTemplateCreatedEvent`
- `notification:template-updated` → `NotificationTemplateUpdatedEvent`
- `notification:template-activated` → `NotificationTemplateActivatedEvent`
- `notification:template-deactivated` → `NotificationTemplateDeactivatedEvent`

**更新** `packages/contracts/src/modules/notification/domain/events/index.ts` 添加新导出。

**附带修复**: 将 `notification-template.ts` 中本地定义的 `NotificationTemplateServerDTO` 迁移到 `@dailyuse/contracts` 的 aggregates 目录（当前 aggregate 文件中 export 了此 DTO，应由 contracts 层提供）。

### 2.4 Schedule CalendarEntry — 新增 4 个事件

**`packages/contracts/src/modules/schedule/protocol/schedule-event-map.ts`** 新增:
- `schedule:calendar-entry-created` → `CalendarEntryCreatedEvent`
- `schedule:calendar-entry-updated` → `CalendarEntryUpdatedEvent`
- `schedule:calendar-entry-rescheduled` → `CalendarEntryRescheduledEvent`
- `schedule:calendar-entry-deleted` → `CalendarEntryDeletedEvent`

**更新** `packages/contracts/src/modules/schedule/domain/events/index.ts` 添加新导出。

### 2.5 Task Dependency — 新增 3 个事件

**`packages/contracts/src/modules/task/protocol/task-event-map.ts`** 新增:
- `task:dependency-created` → `TaskDependencyCreatedEvent`
- `task:dependency-updated` → `TaskDependencyUpdatedEvent`
- `task:dependency-deleted` → `TaskDependencyDeletedEvent`

**更新** `packages/contracts/src/modules/task/domain/events/index.ts` 添加新导出。

---

## Wave 3: domain-server 层 — 添加 addDomainEvent 调用 + 类型修复

### 3.1 Editor: 添加事件发射
- `packages/editor/src/domain-server/aggregates/editor-workspace.ts`:
  - `create()` → `this.addDomainEvent<EditorEventMap['editor:workspace-created']>('editor:workspace-created', ...)`
  - `updateName/Description/ProjectPath/Layout/Settings()` → `this.addDomainEvent<EditorEventMap['editor:workspace-updated']>('editor:workspace-updated', ...)`
  - `delete()` → `this.addDomainEvent<EditorEventMap['editor:workspace-deleted']>('editor:workspace-deleted', ...)`

### 3.2 Repository: 添加事件发射
- `packages/repository/src/domain-server/aggregates/repository.ts`:
  - `create()` → `repository:created`
  - `updateName/Description/Path/Config()` → `repository:updated`
  - `archive()` → `repository:archived`
  - `delete()` → `repository:deleted`
  - `updateStats/recordResource*/recordFolder*()` → `repository:statistics-updated`（已有事件，补发）

### 3.3 NotificationTemplate: 添加事件发射
- `packages/notification/src/domain-server/aggregates/notification-template.ts`:
  - `create()` → `notification:template-created`
  - `updateTemplate()` → `notification:template-updated`
  - `activate()` → `notification:template-activated`
  - `deactivate()` → `notification:template-deactivated`

### 3.4 CalendarEntry: 添加事件发射
- `packages/schedule/src/domain-server/aggregates/calendar-entry.ts`:
  - `create()` → `schedule:calendar-entry-created`
  - `reschedule()` → `schedule:calendar-entry-rescheduled`
  - `updateTitle/Description/Priority/Location/Attendees()` → `schedule:calendar-entry-updated`
  - `delete()` → `schedule:calendar-entry-deleted`

### 3.5 TaskDependency: 添加事件发射
- `packages/task/src/domain-server/aggregates/task-dependency.ts`:
  - `create()` → `task:dependency-created`
  - `updateDependencyType/updateLagDays()` → `task:dependency-updated`
  - 析构/删除路径 → `task:dependency-deleted`

### 3.6 GoalRecord: 修复 untyped 事件
- `packages/goal/src/domain-server/aggregates/goal-record.ts`:
  - `addDomainEvent('goal-record:created', ...)` → `addDomainEvent<GoalEventMap['goal-record:created']>('goal-record:created', ...)`

### 3.7 Reminder: 修复全部 untyped 事件
- `packages/reminder/src/domain-server/aggregates/reminder-template.ts` — 所有 addDomainEvent 加 `ReminderEventMap` 泛型
- `packages/reminder/src/domain-server/aggregates/reminder-group.ts` — 同上
- `packages/reminder/src/domain-server/aggregates/user-reminder-preferences.ts` — 同上

### 3.8 Schedule: 修复全部 untyped 事件
- `packages/schedule/src/domain-server/aggregates/schedule-task.ts` — 所有 addDomainEvent 加 `ScheduleEventMap` 泛型

---

## Wave 4: 类型一致性修复（MEDIUM 风险）

### 4.1 identityId: string → branded IdentityId

| 文件 | 当前 | 修复 |
|------|------|------|
| `reminder/src/domain-server/aggregates/reminder-group.ts` | 本地定义 `type IdentityId = string & ...` | 导入 `IdentityId` from `@dailyuse/domain-shared/shared` |
| `reminder/src/domain-server/aggregates/user-reminder-preferences.ts` | `extends AggregateRoot<string>` | `extends AggregateRoot<string>` (保持，但 identityId 字段改 branded) |
| `schedule/src/domain-server/aggregates/schedule-task.ts` | `identityId: string` | `identityId: IdentityId` (import from shared) |
| `schedule/src/domain-server/aggregates/calendar-entry.ts` | `identityId: string` | `identityId: IdentityId` |
| `task/src/domain-server/aggregates/task-dependency.ts` | `identityId: string` | `identityId: IdentityId` |

### 4.2 TaskInstance createdAt/updatedAt: number → Date
- `packages/task/src/domain-server/aggregates/task-instance.ts`:
  - 状态字段和 getter 从 `number` 改为 `Date`
  - `toServerDTO()` 中 `.getTime()` 适配

### 4.3 Reminder deletedAt: number|null → Date|null
- `packages/reminder/src/domain-server/aggregates/reminder-template.ts`: 状态字段 `deletedAt` 改 `Date | null`
- `packages/reminder/src/domain-server/aggregates/reminder-group.ts`: 同上

### 4.4 补充缺失的 toClientDTO
- `packages/editor/src/domain-server/aggregates/editor-workspace.ts` — 添加 `toClientDTO()`
- `packages/notification/src/domain-server/aggregates/notification-preference.ts` — 添加 `toClientDTO()`
- `packages/notification/src/domain-server/aggregates/notification-template.ts` — 添加 `toClientDTO()`

---

## Wave 5: 结构性重构（HIGH 风险）

### 5.1 AuthIdentity: 个体字段 → _props 模式
- `packages/authentication/src/domain-server/aggregates/auth-identity.ts`:
  - 提取 `AuthIdentityState` 接口
  - 将 `_status`, `_failedLoginAttempts` 等个体字段合并为 `private _props: AuthIdentityState`
  - 所有 getter 改为读 `this._props.xxx`
  - 所有 setter 改为 `this._props.xxx = ...`
  - `create()` / `load()` 工厂方法适配

### 5.2 AuthSession: 个体字段 → _props 模式
- `packages/authentication/src/domain-server/aggregates/auth-session.ts`:
  - 同上流程
  - 添加缺失的 `version` 字段到 state

### 5.3 EditorWorkspace: 个体字段 → _props 模式
- `packages/editor/src/domain-server/aggregates/editor-workspace.ts`:
  - 同上流程

---

## 执行规则

1. **Phase 0 → Wave 1 → 5 顺序执行** — Phase 0 先确认，再进入 Wave
2. **一个模块一个 commit** — 原子性，可回滚
3. **先 contracts，后 domain-server** — 先改类型层，再改消费方
4. **Wave 2 完成后先验证 contracts 编译** — 再进入 Wave 3
5. **Phase 0 完成后先确认** — 再进入 Wave 1

## 验证方式

- Phase 0 完成后: `pnpm nx run governance:typecheck`
- 每个 Wave 完成后批量 typecheck:
  ```
  pnpm nx run contracts:typecheck
  pnpm nx run editor:typecheck
  pnpm nx run repository:typecheck
  pnpm nx run notification:typecheck
  pnpm nx run schedule:typecheck
  pnpm nx run task:typecheck
  pnpm nx run reminder:typecheck
  pnpm nx run authentication:typecheck
  pnpm nx run goal:typecheck
  pnpm nx run account:typecheck
  pnpm nx run ai:typecheck
  ```
- 全部完成后检查所有模块的 `addDomainEvent` 调用都使用了泛型参数
