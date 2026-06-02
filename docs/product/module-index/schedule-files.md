---
tags:
  - product
  - module-index
  - schedule
description: 日程模块相关文件索引
created: 2026-06-02T00:00:00
updated: 2026-06-02T00:00:00
---

# 日程模块文件索引

本索引用于连接日程模块的业务说明和真实代码。它不是代码注释替代品；做优化前仍需以当前代码、配置和测试为准。

## 前端页面与路由

| 文件 | 说明 |
| --- | --- |
| [`packages/app-vue/src/modules/schedule/router/index.ts`](../../../packages/app-vue/src/modules/schedule/router/index.ts) | Vue 日程模块路由，定义日历视图入口 |
| [`packages/app-vue/src/modules/schedule/views/ScheduleDashboardView.vue`](../../../packages/app-vue/src/modules/schedule/views/ScheduleDashboardView.vue) | 日程主视图，支持日/周/月切换 |
| [`packages/app-vue/src/modules/schedule/views/ScheduleWeekView.vue`](../../../packages/app-vue/src/modules/schedule/views/ScheduleWeekView.vue) | 周视图（旧版，重定向到主视图） |

## 前端状态、组合函数与组件

| 文件 | 说明 |
| --- | --- |
| [`packages/app-vue/src/modules/schedule/stores/schedule-store.ts`](../../../packages/app-vue/src/modules/schedule/stores/schedule-store.ts) | 日程模块 Pinia store |
| [`packages/app-vue/src/modules/schedule/composables/useSchedule.ts`](../../../packages/app-vue/src/modules/schedule/composables/useSchedule.ts) | 日程编排组合函数 |
| [`packages/app-vue/src/modules/schedule/composables/useScheduleTasks.ts`](../../../packages/app-vue/src/modules/schedule/composables/useScheduleTasks.ts) | 日程任务 CRUD 组合函数 |
| [`packages/app-vue/src/modules/schedule/composables/useScheduleCalendar.ts`](../../../packages/app-vue/src/modules/schedule/composables/useScheduleCalendar.ts) | 日历条目组合函数 |
| [`packages/app-vue/src/modules/schedule/composables/useCalendarView.ts`](../../../packages/app-vue/src/modules/schedule/composables/useCalendarView.ts) | 日历视图聚合，合并日历条目和任务实例 |
| [`packages/app-vue/src/modules/schedule/components/CreateScheduleDialog.vue`](../../../packages/app-vue/src/modules/schedule/components/CreateScheduleDialog.vue) | 创建日历条目弹窗 |
| [`packages/app-vue/src/modules/schedule/components/WeekViewCalendar.vue`](../../../packages/app-vue/src/modules/schedule/components/WeekViewCalendar.vue) | 周视图日历网格 |
| [`packages/app-vue/src/modules/schedule/components/DayViewCalendar.vue`](../../../packages/app-vue/src/modules/schedule/components/DayViewCalendar.vue) | 日视图日历 |
| [`packages/app-vue/src/modules/schedule/components/MonthViewCalendar.vue`](../../../packages/app-vue/src/modules/schedule/components/MonthViewCalendar.vue) | 月视图日历 |
| [`packages/app-vue/src/modules/schedule/components/DayDetailSheet.vue`](../../../packages/app-vue/src/modules/schedule/components/DayDetailSheet.vue) | 日期详情侧边栏 |
| [`packages/app-vue/src/modules/schedule/components/ConflictAlert.vue`](../../../packages/app-vue/src/modules/schedule/components/ConflictAlert.vue) | 冲突提示组件 |
| [`packages/app-vue/src/modules/schedule/components/ScheduleEventList.vue`](../../../packages/app-vue/src/modules/schedule/components/ScheduleEventList.vue) | 事件列表组件 |
| [`packages/app-vue/src/modules/schedule/components/ScheduleTaskDetailDialog.vue`](../../../packages/app-vue/src/modules/schedule/components/ScheduleTaskDetailDialog.vue) | 日程任务详情弹窗 |
| [`packages/app-vue/src/modules/schedule/utils/schedule-presentation.ts`](../../../packages/app-vue/src/modules/schedule/utils/schedule-presentation.ts) | 展示辅助函数（状态、来源、健康度） |

## 移动端入口

| 文件 | 说明 |
| --- | --- |
| [`apps/mobile/src/app/schedule/index.tsx`](../../../apps/mobile/src/app/schedule/index.tsx) | 移动端日程列表入口 |
| [`apps/mobile/src/app/schedule/calendar.tsx`](../../../apps/mobile/src/app/schedule/calendar.tsx) | 移动端日历视图入口 |
| [`apps/mobile/src/app/schedule/week.tsx`](../../../apps/mobile/src/app/schedule/week.tsx) | 移动端周视图入口 |
| [`apps/mobile/src/app/schedule/event-editor.tsx`](../../../apps/mobile/src/app/schedule/event-editor.tsx) | 移动端事件编辑入口 |

## API、控制器与适配器

| 文件 | 说明 |
| --- | --- |
| [`packages/schedule/src/api/routes.ts`](../../../packages/schedule/src/api/routes.ts) | 日程任务 HTTP routes（14 个端点） |
| [`packages/schedule/src/api/schedule-event.routes.ts`](../../../packages/schedule/src/api/schedule-event.routes.ts) | 日历条目 HTTP routes（9 个端点） |
| [`packages/schedule/src/api/transport-handlers.ts`](../../../packages/schedule/src/api/transport-handlers.ts) | 传输层处理器 |
| [`packages/schedule/src/controllers/schedule-event.controller.ts`](../../../packages/schedule/src/controllers/schedule-event.controller.ts) | 日历条目控制器 |
| [`packages/schedule/src/infrastructure-client/adapters/http/schedule-task-http.adapter.ts`](../../../packages/schedule/src/infrastructure-client/adapters/http/schedule-task-http.adapter.ts) | 客户端 HTTP 日程任务适配器 |
| [`packages/schedule/src/infrastructure-client/adapters/http/schedule-event-http.adapter.ts`](../../../packages/schedule/src/infrastructure-client/adapters/http/schedule-event-http.adapter.ts) | 客户端 HTTP 日历条目适配器 |
| [`packages/schedule/src/infrastructure-client/adapters/ipc/schedule-task-ipc.adapter.ts`](../../../packages/schedule/src/infrastructure-client/adapters/ipc/schedule-task-ipc.adapter.ts) | 客户端 IPC 日程任务适配器 |
| [`packages/schedule/src/infrastructure-client/adapters/ipc/schedule-event-ipc.adapter.ts`](../../../packages/schedule/src/infrastructure-client/adapters/ipc/schedule-event-ipc.adapter.ts) | 客户端 IPC 日历条目适配器 |

## 领域、用例与仓储

| 文件 | 说明 |
| --- | --- |
| [`packages/schedule/src/domain-server/aggregates/schedule-task.ts`](../../../packages/schedule/src/domain-server/aggregates/schedule-task.ts) | ScheduleTask 聚合根 |
| [`packages/schedule/src/domain-server/aggregates/calendar-entry.ts`](../../../packages/schedule/src/domain-server/aggregates/calendar-entry.ts) | CalendarEntry 聚合根 |
| [`packages/schedule/src/domain-server/entities/index.ts`](../../../packages/schedule/src/domain-server/entities/index.ts) | ScheduleExecution 领域实体 |
| [`packages/schedule/src/domain-server/services/schedule-execution-engine.ts`](../../../packages/schedule/src/domain-server/services/schedule-execution-engine.ts) | 调度执行引擎接口 |
| [`packages/schedule/src/application-server/use-cases/commands/create-schedule-task.use-case.ts`](../../../packages/schedule/src/application-server/use-cases/commands/create-schedule-task.use-case.ts) | 创建日程任务用例 |
| [`packages/schedule/src/application-server/use-cases/commands/pause-schedule-task.use-case.ts`](../../../packages/schedule/src/application-server/use-cases/commands/pause-schedule-task.use-case.ts) | 暂停日程任务用例 |
| [`packages/schedule/src/application-server/use-cases/commands/resume-schedule-task.use-case.ts`](../../../packages/schedule/src/application-server/use-cases/commands/resume-schedule-task.use-case.ts) | 恢复日程任务用例 |
| [`packages/schedule/src/application-server/use-cases/commands/trigger-schedule-task.use-case.ts`](../../../packages/schedule/src/application-server/use-cases/commands/trigger-schedule-task.use-case.ts) | 手动触发用例 |
| [`packages/schedule/src/application-server/use-cases/queries/get-due-schedule-tasks.use-case.ts`](../../../packages/schedule/src/application-server/use-cases/queries/get-due-schedule-tasks.use-case.ts) | 获取到期任务查询 |
| [`packages/schedule/src/application-server/services/schedule-event-application-service.ts`](../../../packages/schedule/src/application-server/services/schedule-event-application-service.ts) | 日历条目应用服务 |
| [`packages/schedule/src/application-server/services/schedule-conflict-detection-service.ts`](../../../packages/schedule/src/application-server/services/schedule-conflict-detection-service.ts) | 冲突检测服务 |
| [`packages/schedule/src/application-server/services/schedule-conflict-resolution-service.ts`](../../../packages/schedule/src/application-server/services/schedule-conflict-resolution-service.ts) | 冲突解决服务 |
| [`packages/schedule/src/application-server/scheduler/schedule-task-queue.ts`](../../../packages/schedule/src/application-server/scheduler/schedule-task-queue.ts) | 调度队列（最小堆） |
| [`packages/schedule/src/infrastructure-server/schedule.module.ts`](../../../packages/schedule/src/infrastructure-server/schedule.module.ts) | 服务端日程模块组合根 |
| [`packages/schedule/src/infrastructure-server/adapters/prisma/schedule-prisma.repository.ts`](../../../packages/schedule/src/infrastructure-server/adapters/prisma/schedule-prisma.repository.ts) | Prisma 日历条目仓储 |
| [`packages/schedule/src/infrastructure-server/adapters/prisma/schedule-task-prisma.repository.ts`](../../../packages/schedule/src/infrastructure-server/adapters/prisma/schedule-task-prisma.repository.ts) | Prisma 日程任务仓储 |
| [`packages/schedule/src/infrastructure-server/adapters/prisma/schedule-execution-prisma.repository.ts`](../../../packages/schedule/src/infrastructure-server/adapters/prisma/schedule-execution-prisma.repository.ts) | Prisma 执行记录仓储 |

## Contracts 与数据结构

| 文件 | 说明 |
| --- | --- |
| [`packages/contracts/src/modules/schedule/index.ts`](../../../packages/contracts/src/modules/schedule/index.ts) | 日程模块 contracts 入口 |
| [`packages/contracts/src/modules/schedule/aggregates/schedule-task-server.ts`](../../../packages/contracts/src/modules/schedule/aggregates/schedule-task-server.ts) | ScheduleTask 服务端 DTO |
| [`packages/contracts/src/modules/schedule/aggregates/schedule-task-client.ts`](../../../packages/contracts/src/modules/schedule/aggregates/schedule-task-client.ts) | ScheduleTask 客户端 DTO |
| [`packages/contracts/src/modules/schedule/aggregates/calendar-entry-server.ts`](../../../packages/contracts/src/modules/schedule/aggregates/calendar-entry-server.ts) | CalendarEntry 服务端 DTO |
| [`packages/contracts/src/modules/schedule/aggregates/calendar-entry-client.ts`](../../../packages/contracts/src/modules/schedule/aggregates/calendar-entry-client.ts) | CalendarEntry 客户端 DTO |
| [`packages/contracts/src/modules/schedule/entities/schedule-execution-server.ts`](../../../packages/contracts/src/modules/schedule/entities/schedule-execution-server.ts) | ScheduleExecution 服务端 DTO |
| [`packages/contracts/src/modules/schedule/entities/schedule-execution-client.ts`](../../../packages/contracts/src/modules/schedule/entities/schedule-execution-client.ts) | ScheduleExecution 客户端 DTO |
| [`packages/contracts/src/modules/schedule/api/requests/schedule-task-requests.ts`](../../../packages/contracts/src/modules/schedule/api/requests/schedule-task-requests.ts) | 日程任务 API 请求 DTO |
| [`packages/contracts/src/modules/schedule/api/requests/schedule-requests.ts`](../../../packages/contracts/src/modules/schedule/api/requests/schedule-requests.ts) | 日历条目 API 请求 DTO |
| [`packages/contracts/src/modules/schedule/api/response-schemas.ts`](../../../packages/contracts/src/modules/schedule/api/response-schemas.ts) | API response schemas |
| [`packages/contracts/src/modules/schedule/protocol/schedule-rpc-map.ts`](../../../packages/contracts/src/modules/schedule/protocol/schedule-rpc-map.ts) | 日程模块 RPC map |
| [`packages/contracts/src/modules/schedule/protocol/schedule-event-map.ts`](../../../packages/contracts/src/modules/schedule/protocol/schedule-event-map.ts) | 日程模块事件 map |
| [`packages/contracts/src/modules/schedule/value-objects/schedule-task-status.ts`](../../../packages/contracts/src/modules/schedule/value-objects/schedule-task-status.ts) | 日程任务状态枚举 |
| [`packages/contracts/src/modules/schedule/value-objects/execution-status.ts`](../../../packages/contracts/src/modules/schedule/value-objects/execution-status.ts) | 执行状态枚举 |
| [`packages/contracts/src/modules/schedule/value-objects/source-module.ts`](../../../packages/contracts/src/modules/schedule/value-objects/source-module.ts) | 来源模块枚举 |
| [`packages/contracts/src/modules/schedule/value-objects/schedule-config.ts`](../../../packages/contracts/src/modules/schedule/value-objects/schedule-config.ts) | 调度配置值对象 |
| [`packages/contracts/src/modules/schedule/value-objects/retry-policy.ts`](../../../packages/contracts/src/modules/schedule/value-objects/retry-policy.ts) | 重试策略值对象 |
| [`packages/contracts/src/modules/schedule/value-objects/conflict-detection-result.ts`](../../../packages/contracts/src/modules/schedule/value-objects/conflict-detection-result.ts) | 冲突检测结果类型 |
| [`packages/database/prisma/schema/schedule.prisma`](../../../packages/database/prisma/schema/schedule.prisma) | 日程模块 Prisma schema |

## 跨模块或 AI 相关入口

| 文件 | 说明 |
| --- | --- |
| [`packages/goal/src/api/schedule-runtime.ts`](../../../packages/goal/src/api/schedule-runtime.ts) | Goal → Schedule 运行时贡献 |
| [`packages/task/src/api/schedule-runtime.ts`](../../../packages/task/src/api/schedule-runtime.ts) | Task → Schedule 运行时贡献 |
| [`packages/reminder/src/api/schedule-runtime.ts`](../../../packages/reminder/src/api/schedule-runtime.ts) | Reminder → Schedule 运行时贡献 |

## 测试入口

| 文件 | 说明 |
| --- | --- |
| [`packages/schedule/src/domain-server/aggregates/__tests__/schedule-task.spec.ts`](../../../packages/schedule/src/domain-server/aggregates/__tests__/schedule-task.spec.ts) | ScheduleTask 聚合测试 |
| [`packages/schedule/src/domain-server/aggregates/__tests__/calendar-entry.spec.ts`](../../../packages/schedule/src/domain-server/aggregates/__tests__/calendar-entry.spec.ts) | CalendarEntry 聚合测试 |
| [`packages/schedule/src/application-server/use-cases/commands/schedule-use-cases.test.ts`](../../../packages/schedule/src/application-server/use-cases/commands/schedule-use-cases.test.ts) | 命令用例测试 |
| [`packages/schedule/src/application-server/use-cases/queries/schedule-query-use-cases.test.ts`](../../../packages/schedule/src/application-server/use-cases/queries/schedule-query-use-cases.test.ts) | 查询用例测试 |
| [`packages/schedule/src/application-server/use-cases/calculate-next-run.test.ts`](../../../packages/schedule/src/application-server/use-cases/calculate-next-run.test.ts) | 下次运行计算测试 |
| [`packages/schedule/src/application-server/services/schedule-conflict-resolution-service.spec.ts`](../../../packages/schedule/src/application-server/services/schedule-conflict-resolution-service.spec.ts) | 冲突解决服务测试 |
| [`packages/schedule/src/api/routes.spec.ts`](../../../packages/schedule/src/api/routes.spec.ts) | 任务 routes 测试 |
| [`packages/schedule/src/api/schedule-event.routes.spec.ts`](../../../packages/schedule/src/api/schedule-event.routes.spec.ts) | 事件 routes 测试 |
| [`packages/app-vue/src/modules/schedule/stores/scheduleStore.spec.ts`](../../../packages/app-vue/src/modules/schedule/stores/scheduleStore.spec.ts) | 日程 store 测试 |
| [`packages/app-vue/src/modules/schedule/composables/useCalendarView.spec.ts`](../../../packages/app-vue/src/modules/schedule/composables/useCalendarView.spec.ts) | 日历视图组合函数测试 |
| [`apps/web/e2e/schedule/schedule-crud.spec.ts`](../../../apps/web/e2e/schedule/schedule-crud.spec.ts) | Web 日程 CRUD e2e |
| [`apps/web/e2e/schedule/schedule-calendar.spec.ts`](../../../apps/web/e2e/schedule/schedule-calendar.spec.ts) | Web 日历视图 e2e |
| [`apps/web/e2e/schedule/schedule-week-view.spec.ts`](../../../apps/web/e2e/schedule/schedule-week-view.spec.ts) | Web 周视图 e2e |

## 需要重点关注的改动风险

- ScheduleTask 状态流转和执行记录的准确性。
- 跨模块 source 元数据一致性（Goal、Task、Reminder 的事件变更）。
- 冲突检测规则变更对日历展示和执行计划的影响。
- 调度队列的定时器精度和系统休眠恢复。
- HTTP、IPC、Prisma、PowerSync 多运行时适配器的一致性。
- 前端 useCalendarView 合并多数据源的一致性。
