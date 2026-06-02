---
tags:
  - product
  - module
  - schedule
description: 日程模块当前功能资产说明
created: 2026-06-02T00:00:00
updated: 2026-06-02T00:00:00
---

# 日程模块说明

## 1. 功能定位

日程模块用于把任务、目标和提醒落到时间安排上。它围绕日程任务（ScheduleTask）、日历条目（CalendarEntry）、冲突检测、调度执行和多视图日历形成闭环，是跨模块时间调度的基础设施。

## 2. 当前功能说明

- 日程任务管理：创建、更新、删除、暂停、恢复、触发、完成和取消日程任务。
- 日历条目管理：创建、更新、删除日历条目，支持按时间范围查询。
- 冲突检测：检测日历条目之间的时间冲突，提供冲突详情和解决建议。
- 冲突解决：对检测到的冲突执行重新调度或其他解决操作。
- 调度执行：基于 cron 表达式自动执行到期任务，支持手动触发、重试策略和错过任务检测。
- 批量操作：支持日程任务的批量操作和批量删除。
- 执行记录：记录每次执行的状态、时长、结果和错误信息。
- 日程统计：按账户聚合日程任务和执行的多维度统计数据。
- 多视图日历：前端提供日视图、周视图和月视图，合并日历条目和任务实例。
- 跨模块来源追踪：通过 SourceModule 枚举（Reminder、Task、Goal、Notification、System、Custom）标识日程任务的业务来源。

## 3. 用户路径

- 日历视图路径：用户进入日程页，默认展示日历视图（支持日/周/月切换），查看来自日历条目和任务实例的统一事件列表，点击事件查看详情或执行操作。
- 日程任务路径：用户创建日程任务，配置 cron 表达式、时区和执行参数，系统按计划自动执行，用户可暂停、恢复或手动触发。
- 冲突处理路径：用户创建日历条目时系统自动检测冲突，展示冲突详情和建议，用户可选择重新调度或忽略。
- 移动端路径：移动端提供日程列表、日历视图、周视图和事件编辑入口。

## 4. 业务规则

- ScheduleTask 是日程模块核心聚合，ScheduleExecution 与任务关联，CalendarEntry 是独立的日历条目聚合。
- ScheduleTask 状态：Active、Paused、Completed、Failed、Cancelled。Active ↔ Paused 支持暂停恢复。
- 执行状态：Pending、Running、Success、Failed、Timeout、Skipped。
- 冲突检测基于时间范围重叠，冲突严重度分为 Info、Warning、Error。
- SourceModule 枚举标识日程任务的业务来源，其他模块（Goal、Task、Reminder）通过注册 schedule runtime contribution 监听领域事件来创建/删除 ScheduleTask。
- 调度队列使用最小堆按 nextRunAt 排序，维护单个 setTimeout 指向最近任务。
- 重试策略可配置最大重试次数、初始延迟、最大延迟、退避乘数和可重试状态。
- cron 表达式支持标准 5 字段格式，可配置时区、开始/结束日期和最大执行次数。
- 客户端通过 HTTP 或 IPC 适配器访问日程能力，服务端通过模块组合根装配用例和仓储实现。

## 5. 相关文件索引

详细文件清单见 [日程模块文件索引](../module-index/schedule-files.md)。

## 6. 当前问题

- 日程模块同时承载"用户创建的日历条目"和"跨模块注册的调度任务"两类职责，边界需要在优化前明确。
- 冲突检测和冲突解决目前只针对 CalendarEntry，不覆盖 ScheduleTask。
- 调度队列的错过任务检测（系统休眠恢复）机制需要在生产环境验证。
- 前端 useCalendarView 合并了日历条目、任务实例和任务模板三类数据源，数据一致性依赖各模块的实时状态。
- ScheduleJob 模型（schedule_jobs 表）在 Prisma schema 中存在但与 ScheduleTask 有职责重叠。

## 7. 优化机会

- 梳理 CalendarEntry 和 ScheduleTask 的职责边界，减少用户困惑。
- 将冲突检测能力扩展到 ScheduleTask，或明确其只属于 CalendarEntry。
- 强化日历视图的跨模块数据展示，让用户能区分事件来源。
- 为调度执行提供更好的监控和告警能力，当前只有统计聚合。
- 考虑日历条目的拖拽编辑和批量操作能力。

## 8. 风险点

- 调度状态流转和执行记录的准确性直接影响用户信任。
- 跨模块 source 元数据一致性：Goal、Task、Reminder 模块的事件变更会影响 ScheduleTask 的创建和删除。
- 冲突检测规则变更对用户日历展示和执行计划的影响。
- 调度队列的定时器精度和系统休眠恢复的可靠性。
- HTTP、IPC、Prisma 和 PowerSync 适配器同时存在，索引和测试需要覆盖多运行时边界。

## 9. 后续待确认

- CalendarEntry 和 ScheduleTask 是否应合并为统一概念，还是保持分离。
- 冲突检测是否应覆盖所有类型的日程数据。
- 调度队列的错过任务检测策略是否需要可配置。
- Dashboard 对日程数据的依赖是否需要专门的读模型契约。
- 日程模块是否需要支持重复日历条目（当前只有 ScheduleTask 支持 cron 重复）。

## 10. 相关资料

- [目标模块说明](./goal.md)
- [任务模块说明](./task.md)
- [日程模块文件索引](../module-index/schedule-files.md)
