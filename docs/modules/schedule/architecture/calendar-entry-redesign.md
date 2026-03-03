# CalendarEntry 架构重设计方案

> 状态：**待实施（已确认，暂缓执行）**
> 讨论日期：2026-03-03

---

## 背景

当前 `CalendarEntry` 存在两套平行系统，职责不清：

1. **`CalendarEntryClientDTO`**（`packages/contracts`）— 前端 store 和 composable 使用，字段仍带有服务端痕迹（`identityId`、`location`、`attendees`、`createdAt`、`updatedAt`）
2. **`CalendarEventItem`**（`useCalendarView.ts`）— 实际传给日历组件的内部类型，与上述 DTO 几乎重复

此外，`useCalendarView.ts` 同时从三个来源聚合事件（Goal、Task、CalendarEntry store），但 CalendarEntry 的服务端来源（`GET /schedules/events`）实际上是多余的——Goal 和 Task 已经包含了所有需要展示的时间信息。

---

## 确认的架构决策

### CalendarEntry = 前端纯投影（Projection），不持久化

- `CalendarEntry` 是一个**只读的、前端组装的**统一视图模型
- 它从 Goal + TaskInstance +（未来）Reminder 数据聚合而来
- 类比：与 `ScheduleTask` 是内部生成对象的方式相同，`CalendarEntry` 也是**派生的**，不由用户直接创建
- 用途：统一的日历渲染结构 + 冲突检测
- `/schedules/events` 后端 API 在前端**不再调用**

### 冲突检测 = 纯客户端逻辑

冲突检测规则（按来源类型分）：

| 来源                          | 冲突检测规则                                                        |
| ----------------------------- | ------------------------------------------------------------------- |
| `TimeRange` 类型 TaskInstance | 检测 `startTime < other.endTime && endTime > other.startTime`       |
| `TimePoint` 类型 TaskInstance | 暂不检测冲突                                                        |
| `AllDay` 类型 TaskInstance    | 暂不检测冲突                                                        |
| Goal                          | 密度检测：同一时间窗口内重叠目标过多时标记（阈值 TBD，建议默认 3+） |

---

## 新版 CalendarEntryClientDTO 设计

```typescript
// packages/contracts/src/modules/schedule/aggregates/calendar-entry-client.ts
// 前端投影类型 — 不持久化，不从服务端获取

export interface CalendarEntryClientDTO {
  id: string; // `${source}-${sourceId}`
  title: string;
  startTime: number; // ms timestamp
  endTime: number; // ms timestamp
  source: 'goal' | 'task' | 'reminder'; // 数据来源
  sourceId: string; // 原始实体 ID
  hasConflict: boolean;
  conflictingIds?: string[]; // 冲突的 CalendarEntry ID 列表
  color?: string;
  priority?: number;
}
```

**移除的字段**（相比当前版本）：

- `identityId` — 服务端关注，前端不需要
- `description` — 可从原始实体按需获取
- `duration` — 派生值，由 `endTime - startTime` 计算
- `location` — 服务端字段
- `attendees` — 服务端字段
- `createdAt` / `updatedAt` — 服务端元数据

---

## 数据流映射

```
Goal.startDate → Goal.targetDate
  └─→ CalendarEntryClientDTO { source: 'goal', ... }

TaskInstance.instanceDate + timeConfig
  ├─ TimeRange: startTime = instanceDate + timeRange.start * 60s
  │             endTime   = instanceDate + timeRange.end   * 60s
  │             → 参与冲突检测
  ├─ TimePoint: startTime = instanceDate + timePoint * 60s
  │             endTime   = startTime + 30min（展示用）
  │             → 暂不参与冲突检测
  └─ AllDay:    startTime = instanceDate（午夜）
                endTime   = startTime + 1hr（展示用）
                → 暂不参与冲突检测
```

---

## 客户端冲突检测逻辑

```typescript
// TimeRange 任务之间的时间重叠检测
function hasTimeOverlap(a: CalendarEntryClientDTO, b: CalendarEntryClientDTO): boolean {
  return a.startTime < b.endTime && a.endTime > b.startTime;
}

// 仅对 source === 'task' 且原始 timeConfig.timeType === 'TimeRange' 的条目进行检测
function detectConflicts(entries: CalendarEntryClientDTO[]): CalendarEntryClientDTO[] {
  const timeRangeEntries = entries.filter((e) => e.source === 'task' && /* isTimeRange */ true);
  // 两两比较，标记 hasConflict 并填充 conflictingIds
  // ...
}

// Goal 密度检测（阈值 TBD）
// 若同一时间段内重叠 Goal 数量 >= 3，标记为密度冲突
```

---

## 实施计划（分阶段，待执行）

### Phase 1 — 重定义 CalendarEntryClientDTO

- 文件：`packages/contracts/src/modules/schedule/aggregates/calendar-entry-client.ts`
- 按上述新设计替换字段

### Phase 2 — 重写 useCalendarView.ts

- 文件：`packages/app-vue/src/modules/schedule/composables/useCalendarView.ts`
- 移除 `scheduleEvents` 分支（不再读 `schedule.calendarEntries`）
- Goal → `CalendarEntryClientDTO`，Task → `CalendarEntryClientDTO`
- 在合并后执行客户端冲突检测
- 移除 `schedule.fetchCalendarEntries(startTime, endTime)` 调用

### Phase 3 — 清理 useSchedule.ts

- 文件：`packages/app-vue/src/modules/schedule/composables/useSchedule.ts`
- 删除：`fetchCalendarEntries`、`createCalendarEntry`、`deleteCalendarEntry`
- 从返回对象中移除 `calendarEntries`

### Phase 4 — 清理 scheduleStore.ts

- 文件：`packages/app-vue/src/modules/schedule/stores/scheduleStore.ts`
- 删除 `calendarEntries: CalendarEntryClientDTO[]` 状态字段
- 删除 `setCalendarEntries` action
- 移除 `CalendarEntryClientDTO` import

### Phase 5 — 清理 MSW mock handlers

- 文件：`apps/web/src/mocks/handlers/schedule.handlers.ts`
- 删除所有 `/schedules/events` handlers（GET、POST、PATCH、DELETE、conflicts 相关）
- 删除 `createMockCalendarEntry` 工厂函数

### Phase 6 — 清理 ScheduleClientService + 适配器

- `packages/schedule/src/application-client/schedule-client-service.ts`
  - 移除所有 `eventApi.*` 方法
  - 构造函数改为只接受 `taskApi: IScheduleTaskApiClient`
- `packages/schedule/src/infrastructure-client/adapters/types.ts`
  - 删除 `IScheduleEventApiClient` 接口
- 删除文件：
  - `packages/schedule/src/infrastructure-client/adapters/http/schedule-event-http.adapter.ts`
  - `packages/schedule/src/infrastructure-client/adapters/ipc/schedule-event-ipc.adapter.ts`
- 更新 barrel 文件：
  - `adapters/http/index.ts` — 移除 event adapter 导出，`createScheduleHttpAdapters` 只返回 `{ task }`
  - `adapters/ipc/index.ts` — 同上
  - `infrastructure-client/index.ts` — 移除 event adapter 相关导出
- 更新 DI 初始化：
  - `apps/web/src/platform/di.ts:83` → `new ScheduleClientService(scheduleAdapters.task)`
  - `apps/desktop/src/renderer/platform/di.ts:91` → `new ScheduleClientService(scheduleAdapters.task)`

### Phase 7 — 审查遗留组件（可选清理）

- `CreateScheduleDialog.vue` — 目前创建 ScheduleTask，非 CalendarEntry；评估是否保留/重用
- `ScheduleEventList.vue` — 未挂载，建议删除
- `ScheduleFormDemo.vue` — 仅 Storybook，可保留

---

## 未决问题

1. **`CalendarEventItem`（useCalendarView.ts 内部类型）与新版 `CalendarEntryClientDTO` 的关系**
   - 方案 A：直接用 `CalendarEntryClientDTO` 替换 `CalendarEventItem`，日历组件直接消费 contracts DTO
   - 方案 B：保留 `CalendarEventItem` 作为 composable 层内部类型，与 `CalendarEntryClientDTO` 形状对齐但不强依赖
   - **尚未决定**

2. **Goal 密度冲突阈值**
   - 建议默认值：≥ 3 个 Goal 时间窗口重叠时触发
   - **尚未确认**

3. **`ConflictDetail.scheduleId`（现有冲突类型）**
   - 现有 `ConflictDetectionResult` 使用 `scheduleId` 字段
   - 迁移后应重命名为 `entryId` 或保持现状
   - **尚未决定**

---

## 相关文件索引

### 待修改

| 文件                                                                          | 变更内容                        |
| ----------------------------------------------------------------------------- | ------------------------------- |
| `packages/contracts/src/modules/schedule/aggregates/calendar-entry-client.ts` | 重定义 DTO                      |
| `packages/app-vue/src/modules/schedule/composables/useCalendarView.ts`        | 核心重写                        |
| `packages/app-vue/src/modules/schedule/composables/useSchedule.ts`            | 移除 CalendarEntry 方法         |
| `packages/app-vue/src/modules/schedule/stores/scheduleStore.ts`               | 移除 calendarEntries 状态       |
| `apps/web/src/mocks/handlers/schedule.handlers.ts`                            | 移除 /schedules/events handlers |
| `packages/schedule/src/application-client/schedule-client-service.ts`         | 移除 eventApi 方法              |
| `packages/schedule/src/infrastructure-client/adapters/types.ts`               | 删除 IScheduleEventApiClient    |
| `packages/schedule/src/infrastructure-client/adapters/http/index.ts`          | 移除 event adapter              |
| `packages/schedule/src/infrastructure-client/adapters/ipc/index.ts`           | 移除 event adapter              |
| `packages/schedule/src/infrastructure-client/index.ts`                        | 移除 event adapter 导出         |
| `apps/web/src/platform/di.ts`                                                 | 更新 ScheduleClientService 构造 |
| `apps/desktop/src/renderer/platform/di.ts`                                    | 更新 ScheduleClientService 构造 |

### 待删除

| 文件                                                                                       | 原因     |
| ------------------------------------------------------------------------------------------ | -------- |
| `packages/schedule/src/infrastructure-client/adapters/http/schedule-event-http.adapter.ts` | 不再需要 |
| `packages/schedule/src/infrastructure-client/adapters/ipc/schedule-event-ipc.adapter.ts`   | 不再需要 |

### 仅参考（后端保留，前端不依赖）

| 文件                                                                          | 说明                       |
| ----------------------------------------------------------------------------- | -------------------------- |
| `packages/contracts/src/modules/schedule/aggregates/calendar-entry-server.ts` | 后端持久化 DTO，前端不导入 |
| `packages/schedule/src/domain-server/aggregates/calendar-entry.ts`            | 服务端聚合根，与前端无关   |
