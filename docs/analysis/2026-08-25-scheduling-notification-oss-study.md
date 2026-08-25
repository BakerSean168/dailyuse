---
tags:
  - analysis
  - schedule
  - scheduler
  - reminder
  - notification
  - planner
  - open-source
  - architecture
description: MemoFlow Schedule/Scheduler/Reminder/Notification 当前实现审查与 Vikunja、Super Productivity、Trigger.dev、pg-boss、Novu 的业务语义及工程化借鉴
created: 2026-08-25T17:49:00+08:00
updated: 2026-08-25T17:49:00+08:00
---

# Schedule / Scheduler / Reminder / Notification 开源项目调研与架构审查

> 调研日期：2026-08-25  
> 目的：不是寻找“一套源码整体搬进 MemoFlow”，而是根据 ADR-058 的 OSS-first 原则，分别学习成熟项目最擅长的业务语义、UI 和工程实现，再固定 MemoFlow 自己的领域所有权。

## 1. Executive Summary

本轮对 MemoFlow 当前代码和成熟开源项目的对照结论：

1. **MemoFlow 当前最值得保留的是 Projection 思路。** Goal / Task / Reminder 自己解释业务时间语义，再投影成未来执行计划；到点后再次读取 authoritative state。这比把所有业务 cron 塞进一个中央 Scheduler 更正确。
2. **当前问题不是“Schedule 模块不该存在”，而是 Schedule 产品领域与 Scheduler 基础设施混在一起。** 前者应演化为个人 Calendar / Planner，后者应成为内部 Temporal Engine。
3. **业务模块不应直接构造 `ScheduleTask`。** 应只输出 neutral `ScheduledIntent`，由 `SchedulingPort.reconcile()` 转换成内部 invocation。
4. **`SourceModule` + central switch 不适合作为平台级扩展机制。** 应借鉴 Trigger.dev 的 task identity / schedule attachment，改为 `handlerKey registry`。
5. **动态 schedule 必须有稳定 identity。** 当前随机 `ScheduleTaskId` 使 desired-state rebuild 实际表现为“新建 + 删除”；应借 Trigger.dev `deduplicationKey` 的思想引入 stable `schedulingKey`。
6. **Projection repair 需要 durable。** 当前 Task 有 startup reconcile，而 Goal / Reminder 没有同等级 repair；进程内 event bus 失败仅打日志会留下 stale projection。
7. **Reminder 当前有两套 scheduler authority。** Schedule Queue 与 Reminder Cron 都会真实推进业务状态/通知；应该收敛成 Scheduler 唯一 wall-clock wake-up authority，同时保留 ReminderOccurrence 的业务幂等与事务可靠性。
8. **Notification 的事实与渠道发送必须分开。** 当前 policy 只验证第一个 channel，且 DND/rate-limit 没有完整接入主路径；应借 Novu 的 workflow/global/per-workflow preference 分层。
9. **Planner UI 最值得学习 Super Productivity；Task/Reminder 业务语义最值得学习 Vikunja；Scheduler API 最值得学习 Trigger.dev；Postgres job infra 最值得学习 pg-boss；Notification pipeline 最值得学习 Novu。**
10. **不建议现在立刻替换自研 Scheduler 为 pg-boss。** 当前 MemoFlow 已经有 lease、claim、execution、retry、recovery 等投入；先把上层 contract 解耦，再做 Build-vs-Adopt ADR/PoC 才有意义。

---

# 2. MemoFlow 当前真实连接图

## 2.1 API Composition Root

当前 `apps/api/src/server.ts` 组装：

```text
createSchedulePrismaRepositories()
        ↓ shared scheduleTaskRepository
createScheduleOrchestrationModule({
  taskProjection,
  goalProjection,
  reminderProjection,
  execution: {
    taskSource,
    goalSource,
    reminderSource,
    notificationPort,
  }
})
        ↓
sourceExecutor
        ↓
composeSchedule()
```

`packages/schedule-orchestration` 同时拥有：

- Task / Goal / Reminder projection runtime；
- shared projection helper；
- execution router。

这一结构来自 2026-07 R03~R06 的 core seam reconvergence。

## 2.2 业务模块 -> Schedule Projection

当前不是：

```text
GoalService -> ScheduleService.createTask()
```

而是：

```text
Goal / Task / Reminder state change
        ↓
Domain Event
        ↓
Schedule Projection Runtime
        ↓
业务模块自己的 Projection Source
        ↓
重新读取 authoritative aggregate
        ↓
build desired ScheduleTask[]
        ↓
replaceSelection()
```

这是当前架构里最重要、最值得保留的设计。

## 2.3 为什么这种 Projection 是对的

### Goal

Goal 自己理解：

```text
RemainingDays(7)
TimeProgressPercentage(80)
targetDate / startDate
```

Scheduler 不应该理解这些词。

### Task

Task 自己理解：

```text
Relative / Absolute reminder
start / end / due anchor
TaskInstance
recurrence / skip / pause
```

Scheduler 只需要得到最终 `runAt`。

### Reminder / Routine

Reminder 自己理解：

```text
FixedTime
Interval
active window
snooze
profile gate
next occurrence
```

Scheduler 只负责 durable wake-up。

---

# 3. 当前值得保留的架构资产

以下不是技术债，而是新架构的 protected contracts：

| 资产                                                | 原因                                                     |
| --------------------------------------------------- | -------------------------------------------------------- |
| 业务模块自己解释 trigger/date/recurrence            | 保持 Domain Language 在正确 bounded context              |
| Domain Event 触发增量 Projection                    | 低延迟、发布方无须直接调用 Scheduler                     |
| Projector 重新读取当前 aggregate                    | 不依赖旧 event payload，当成 invalidation/reconcile 信号 |
| Desired-state projection                            | 比命令式维护 scheduler row 更可修复                      |
| 到点后 handler 再次读取业务状态                     | Schedule 是 wake-up，不是业务真相                        |
| API/Desktop host 只做 adapter selection/composition | 与 ADR-025 一致                                          |
| Schedule queue lease/retry/recovery                 | 已经具备真实工程价值                                     |
| ReminderOccurrence fencing/idempotency              | 对业务副作用有第二层防重价值                             |
| NotificationDispatchOutbox                          | 已有 per-channel 可靠投递基础                            |

---

# 4. 当前结构性问题

## 4.1 Schedule 产品领域与 Scheduler Infra 混合

`packages/schedule` 同时有：

```text
CalendarEntry / conflict / calendar API
+
ScheduleTask / execution / queue / lease / retry
```

前者是 Planner，后者是 background job infrastructure。

后果：

- 产品 API 容易暴露 infra 字段；
- Calendar 操作和 job 操作心智混淆；
- 模块难以独立演进；
- “Schedule”一词同时代表用户计划和机器执行。

对应决策：ADR-060。

## 4.2 Feature 直接构造 Scheduler Aggregate

Goal / Task / Reminder projection source 当前直接：

```ts
import { ScheduleTask } from '@memoflow/schedule';

ScheduleTask.create(...)
```

因此业务模块知道 Scheduler 内部：

- SourceModule；
- ScheduleConfig；
- retry metadata；
- priority / timeout；
- aggregate lifecycle。

目标：只输出 `ScheduledIntent`。

## 4.3 SourceModule 是 closed-world central registry

当前 runtime：

```ts
if Reminder -> executeReminder
if Goal     -> executeGoal
if Task     -> executeTask
else throw Unsupported
```

而 contracts 已经能表示更多 `SourceModule`，runtime 却不支持，形成 contract/runtime mismatch。

未来新增：

```text
Habit
AI
Wallet
Knowledge
```

都需要改中央代码。

目标：`handlerKey registry`。

## 4.4 Stable identity 缺失

`ScheduleTask.create()` 生成随机 id。

同一 business intent 重新 build 时会成为新随机 task，`replaceSelection()` 再删除旧 task。

缺失：

```text
schedulingKey / deduplicationKey
```

这使 projection 的“upsert”不是业务身份层面的真正 upsert。

## 4.5 replaceSelection 并非真正 atomic

当前逻辑：

```text
save desired
then delete stale
```

Prisma `saveBatch()` 又逐条调用 `save()`。

虽然 repository 有 `withTransaction()`，shared projection 没有把整个 reconcile 放入 transaction。

crash window：

```text
new saved
crash
old not deleted
```

目标：owner-level atomic reconcile。

## 4.6 Event Bus 不是 durable projection source

Goal / Task 写事务会 buffer event，commit 后 flush 到进程内 event bus；失败主要记日志。

Task Projection 有 startup reconcile；Goal / Reminder 没有等价全量 reconcile。

因此可能：

```text
business state committed
projection event lost
Schedule projection remains stale
```

目标：

```text
incremental event
+ durable outbox/receipt
+ startup reconcile
+ optional maintenance sweep
```

## 4.7 Timezone hardcode

多个 Goal/Task/Reminder projection fallback `Timezone.Shanghai`。

问题：

- 用户在日本/欧美会错；
- DST 语义不正确；
- 与 ADR-037 Product Time System 不一致。

目标：

- one-shot `runAt` = Instant；
- recurrence/wall-clock = explicit IANA timezone；
- source/user product time policy 决定 timezone；
- 禁止固定 Shanghai fallback。

## 4.8 Reminder 双 scheduler authority

见 ADR-062。

当前两条真实 side-effect path：

```text
ScheduleQueue -> ReminderExecutionSource -> recordTrigger -> Notification
```

和：

```text
ReminderCron -> ReminderSchedulerService -> TransactionRunner
 -> history + nextTriggerAt + notification.dispatch outbox
```

这是本轮最高优先级架构问题之一。

## 4.9 Notification per-channel policy bug

当前 `CreateNotificationUseCase` 只用 `channels[0]` 做 policy 判定，之后对所有 channels 建 delivery row/outbox。

因此不同 channel preference 可能被错误绕过。

## 4.10 DND / RateLimit 主路径不完整

Policy 类型支持 DND/rate-limit，但 create path 没有完整传入相关上下文。

需要从“代码里有一个 policy class”升级为“生产主路径确实经过 policy”。

---

# 5. Vikunja：学业务语义

## 5.1 为什么选它

Vikunja 是成熟的开源 Task/Productivity 项目，其 Task 时间模型与 MemoFlow Task 十分接近。

官方文档明确区分：

- Due Date；
- Start / End Date；
- Absolute Reminder；
- Relative Reminder；
- Repeating Task。

Relative Reminder 可以相对：

```text
due date
start date
end date
```

这验证了一个重要边界：

> Reminder timing semantics 应该依附在 Task Domain 的日期语义上，而不是让全局 Scheduler 去理解“提前 30 分钟相对于哪个字段”。

## 5.2 Repeating Task 的业务心智

官方说明：repeating task 完成后自动生成/推进下一 occurrence。

这支持 MemoFlow 当前：

```text
Task Plan / Template
        ↓ recurrence semantics
TaskInstance / occurrence
        ↓
concrete time/reminder projection
```

而不是把重复 Task 直接退化为一个永久 cron job。

## 5.3 Notification abstraction

Vikunja 的 notification abstraction 很薄：Notification 描述 DB/mail 表达，Notifiable 描述 route，测试支持 Fake/AssertSent。

值得学习：

- business notification intent 与 deliverer 分离；
- test seam 简单；
- 不让业务 service 直接操作 SMTP。

## 5.4 不照搬什么

MemoFlow 不应为了模仿 Vikunja：

- 放弃现有 lease/fencing/retry；
- 改成简单分钟级扫描器；
- 导入其完整 task schema；
- 让 Vikunja 成为第二 Task source of truth。

## 5.5 参考

- Dates & Reminders: https://vikunja.io/help/dates-and-reminders/
- Tasks: https://vikunja.io/help/tasks/
- Notifications: https://vikunja.io/docs/notifications/
- Settings / Timezone: https://vikunja.io/help/settings/
- Quick Add Magic: https://vikunja.io/help/quick-add-magic/

---

# 6. Super Productivity：学 Planner / Calendar / Desktop UX

## 6.1 为什么最接近 MemoFlow 产品面

Super Productivity 是 desktop/web productivity app，长期维护：

- task planning；
- timeboxing；
- Schedule tab；
- recurring tasks；
- reminders；
- focus/break；
- calendar integration；
- desktop/mobile surfaces。

这与 MemoFlow 的 Schedule + Routine Coach + Desktop 组合高度相似。

## 6.2 近期工程信号

2026 年版本仍持续修复/增强：

- Schedule single-day view；
- recurring task settings integrated into planner schedule dialog；
- recurring task calendar design；
- writable calendar event reschedule；
- overlapping time blocks；
- duplicate time block prevention；
- reminder actions；
- dismissed reminder reopen bug；
- planned vs available time 文案；
- schedule settings local during sync。

这些不是“UI 装饰”，而是多年真实产品使用后暴露的语义细节。

## 6.3 MemoFlow 应学习

### Planner 是 read/write surface，不是所有 state 的 owner

日历可以聚合：

```text
Task
Calendar Event
Routine
Goal milestone
```

但拖动一个 Task 后，应回到 Task owner 更新，而不是只改 Calendar projection。

### Planned / Due / Deadline / Scheduled 需要明确语言

Super Productivity 的长期迭代说明这些词非常容易混淆。

MemoFlow 的 Planner 应坚持：

```text
planned time != due/deadline != machine scheduled invocation
```

### Recurrence + Planner 需要 occurrence-aware UI

Recurring Task 在 Planner 中不能简单展示模板本身，否则容易重复、漏 instance 或与 Today 双计数。

### Local/Sync boundary 必须明确

设备本地的 schedule presentation、notification permission、focus/break state 并不都应该成为云端 authoritative state。

## 6.4 不照搬什么

- 不复制其 Angular UI 代码；
- 不复制其完整 sync/state architecture；
- 不让 Planner 成为 Task business truth；
- 不把 Routine Coach 退化为 Task reminder feature。

## 6.5 参考

- Repository: https://github.com/super-productivity/super-productivity
- Releases: https://github.com/super-productivity/super-productivity/releases

---

# 7. Trigger.dev：学 Scheduler API / Identity / Extensibility

## 7.1 Task Definition 与 Schedule 分离

Trigger.dev 的关键思路：

```text
Task definition
  id + run handler

Schedule
  attach to task id
```

Scheduler 不需要根据业务 enum 写：

```text
if goal / if reminder / if task
```

而是按 task identity 找 handler。

对应 MemoFlow：

```text
handlerKey = goal.reminder.fire
handlerKey = task.reminder.fire
handlerKey = ai.daily-review.generate
```

## 7.2 Deduplication Key

Trigger.dev 对 dynamic schedule 要求 `deduplicationKey`；同 key 再创建是 update，不重复 create。

官方 changelog 解释这一限制的真实动机：曾有用户在应用启动时反复创建 schedule，产生大量重复项。

这正好对应 MemoFlow 当前随机 ScheduleTaskId 的 rebuild 问题。

MemoFlow 学习：

```text
stable schedulingKey
+ unique constraint
+ idempotent reconcile
```

## 7.3 Timezone

Trigger.dev 使用 IANA timezone，例如：

```text
Asia/Tokyo
America/New_York
Europe/London
```

并自动处理 DST。

MemoFlow 学习：

- recurrence 的 timezone 是 contract；
- dashboard/display 也显示 schedule timezone；
- 不用固定 Shanghai fallback。

## 7.4 Declarative 与 Imperative

Trigger.dev 同时支持：

- code-declared schedule；
- dashboard imperative schedule；
- SDK dynamic multi-tenant schedule。

这提示 MemoFlow 可长期区分：

```text
system/internal recurring jobs
vs
user/domain-generated scheduling intents
```

二者共用 Scheduler infra，但创建来源和 ownership 不同。

## 7.5 参考

- Scheduled Tasks: https://trigger.dev/product/scheduled-tasks
- Timezone & deduplication changelog: https://trigger.dev/changelog/scheduled-task-timezones
- Declarative cron: https://trigger.dev/changelog/declarative-cron

---

# 8. pg-boss：学 PostgreSQL Queue 工程实现

## 8.1 为什么值得评估

MemoFlow 当前技术栈是 Node.js + PostgreSQL，而且自研 Scheduler 已经实现：

- DB persistence；
- claim；
- lease；
- retry；
- execution history；
- cron；
- multi-runtime adapter。

pg-boss 同样是 PostgreSQL job queue，天然是 Build-vs-Adopt 候选。

## 8.2 关键工程能力

官方 README/docs 提供：

- `SELECT ... FOR UPDATE SKIP LOCKED` claim；
- exactly-once job delivery claim semantics（仍建议 handler idempotent）；
- retry / exponential backoff；
- dead-letter queue；
- cron；
- priority；
- rate limiting；
- debouncing；
- multi-master；
- queue policy；
- singleton/singletonKey；
- completion jobs / saga relationships。

## 8.3 对 MemoFlow 最有价值的启发

### Queue infra 不应重新发明业务语义

pg-boss 只处理 job delivery，不知道 Goal/Task。

### Claim 与业务幂等是两层

即使 queue claim 避免并发重复领用，官方仍强调 retry 情况下业务 handler 应 idempotent。

这支持 MemoFlow 保留：

```text
Scheduler claim
+
ReminderOccurrence idempotency
```

### Same-DB transaction 很重要

业务写入与 enqueue/outbox 如果能共享 PostgreSQL transaction，可以避免 post-commit event lost 的窗口。

## 8.4 为什么暂时不直接替换

当前 MemoFlow 已经投入大量自研能力，并且同时支持 Desktop PowerSync/local runtime。

直接替换风险：

- PostgreSQL-only 假设与 Desktop local path；
- execution/history contract 迁移；
- current lease semantics 与 pg-boss state 对齐；
- PowerSync parity；
- 现有 API/IPC compatibility；
- 迁移过程可能同时改变 business seam 和 queue implementation，难以验证。

正确顺序：

```text
先固定 ScheduledIntent / SchedulingPort / handlerKey
        ↓
让业务模块与 queue implementation 解耦
        ↓
再做 custom vs pg-boss PoC/ADR
```

## 8.5 参考

- Repository/README: https://github.com/timgit/pg-boss
- Queue docs: https://github.com/timgit/pg-boss/blob/master/docs/api/queues.md

---

# 9. Novu：学 Notification Workflow 与 Preference

## 9.1 Workflow 是通知蓝图

Novu 将 Workflow 定义为消息从 trigger 到 channel delivery 的完整 blueprint，可包含：

- conditions；
- waits；
- transforms；
- channel steps；
- activity feed。

MemoFlow 不需要现在复制复杂 node workflow，但应该学习：

> Notification routing 是独立于 Scheduler 的领域/基础设施能力。

## 9.2 Preference 层次

Novu 官方定义：

- Workflow channel preferences；
- Subscriber global preferences；
- Subscriber channel preferences per workflow；
- Critical workflow / read-only preference。

这比 MemoFlow 当前简单的 `Map<module, channels>` 更成熟。

MemoFlow 建议映射：

```text
Workflow default/capability
     ↓
User global channel preference
     ↓
User workflow/topic preference
     ↓
DND / rate limit / runtime context
     ↓
Device local capability/override
```

## 9.3 Inbox 与 Delivery 分开

Novu 同时拥有 Inbox/notification preference 和 channel delivery，提示 MemoFlow：

```text
Notification Fact
!=
Email/Push/Desktop Delivery Attempt
```

## 9.4 Activity Feed / Observability

Novu workflow activity feed 可以按 workflow/channel/time/transaction 查看执行。

MemoFlow 已有 delivery attempt/outbox，可借此思路做：

- why suppressed；
- why deferred；
- why failed；
- which preference decided；
- correlation id。

## 9.5 不照搬什么

- 不引入第二套 Subscriber/Auth truth；
- 不为了普通个人通知引入完整 notification SaaS complexity；
- 不让 Novu workflow DTO 泄漏到 MemoFlow domain；
- 先复用语义，再决定是否需要集成外部 service。

## 9.6 参考

- Workflows: https://docs.novu.co/platform/concepts/workflows
- Preferences: https://docs.novu.co/platform/concepts/preferences
- Inbox Preferences: https://docs.novu.co/platform/inbox/configuration/preferences

---

# 10. 分层学习矩阵

| MemoFlow 关注点                 | 首选参考           | 学什么                                                                      | 不学什么                          |
| ------------------------------- | ------------------ | --------------------------------------------------------------------------- | --------------------------------- |
| Task 日期/提醒/重复业务语义     | Vikunja            | due/start/end、relative/absolute reminder、recurrence user mental model     | 简单 cron scanner 作为长期 infra  |
| Planner / Calendar / Desktop UX | Super Productivity | timeboxing、Schedule、recurring occurrence UI、reminder/focus surfaces      | 完整 Angular/state/sync 实现      |
| Scheduler API                   | Trigger.dev        | handler/task identity、schedule attachment、dedupe、timezone、observability | SaaS-specific product model       |
| PostgreSQL queue                | pg-boss            | claim、retry、DLQ、singleton、same-DB queue thinking                        | 在边界未稳定前直接替换当前 engine |
| Notification workflow           | Novu               | workflow、preferences、Inbox、activity feed、channel policy                 | 第二套 subscriber/source of truth |

---

# 11. 推荐的 MemoFlow North Star

```text
                          USER TIME VIEW
                 ┌────────────────────────┐
                 │ Schedule / Planner     │
                 │ Calendar / Timeboxing  │
                 └────────────┬───────────┘
                              │ read projections / owner commands
        ┌─────────────────────┼──────────────────────┐
        │                     │                      │
        v                     v                      v
      Task                  Goal              Routine / Reminder
   own recurrence      own target/KR         own routine semantics
   own reminders       own reminders         own next occurrence
        │                     │                      │
        └───────────── domain events ───────────────┘
                              │
                              v
                    Module-owned Projectors
                              │
                       ScheduledIntent[]
                              │
                   SchedulingPort.reconcile
                              │
                              v
                   ┌──────────────────────┐
                   │ Scheduler / Temporal │
                   │ Engine               │
                   │ claim/retry/lease    │
                   └──────────┬───────────┘
                              │ handlerKey
                              v
                       Handler Registry
                              │
                              v
                         Domain Handler
                              │
                              ├─ business state/outcome
                              │
                              └─ NotificationRequested outbox
                                        │
                                        v
                           ┌──────────────────────────┐
                           │ Notification Runtime     │
                           │ Fact + Delivery Policy   │
                           └──────┬─────┬─────┬──────┘
                                  │     │     │
                                InApp Desktop Push/Email
```

---

# 12. Build / Borrow / Integrate 结论

## Build / Keep MemoFlow-owned

- Goal/Task/Routine business timing semantics；
- Planner product semantics；
- `ScheduledIntent` / owner / handler contract；
- Notification Fact / workflow/topic semantics；
- Desktop Routine surfaces；
- cross-module source of truth。

## Borrow Library / Algorithm

优先研究复用：

- IANA timezone / recurrence engine；
- cron parser；
- Postgres queue primitives；
- retry/backoff；
- Calendar UI primitives；
- Notification channel adapter SDK。

所有第三方对象必须被 adapter 隔离，不进入 MemoFlow product contracts。

## Integrate Whole OSS

默认不做。

只有出现稳定 plugin/API seam、不会产生第二 source of truth、维护成本显著更低时再评估。

---

# 13. 直接可执行的架构结论

按优先级：

### P0

1. Reminder 双 scheduler authority 收口；
2. Notification per-channel policy bug；
3. DND/rate-limit 主路径接入；
4. projection loss/reconcile 缺口补齐。

### P1

5. `ScheduledIntent + SchedulingPort.reconcile`；
6. stable `schedulingKey`；
7. owner-level atomic reconcile；
8. `handlerKey registry` 替代 SourceModule switch；
9. 去除 hardcoded Shanghai；
10. raw ScheduleTask API 内部化。

### P2

11. Schedule/Planner read model 扩展 Goal/Routine/Habit；
12. source-aware drag/drop；
13. Notification Fact / Delivery Plan UI；
14. delivery activity/why-suppressed observability；
15. custom Scheduler vs pg-boss Build-vs-Adopt PoC。

---

# 14. 关联文档

- [ADR-058 OSS-first 标准能力复用](../architecture/adr/ADR-058-oss-first-standard-capability-reuse.md)
- [ADR-059 Routine Coach](../architecture/adr/ADR-059-routine-coach-domain-runtime-and-surfaces.md)
- [ADR-060 Schedule / Planner 与 Scheduler 分离](../architecture/adr/ADR-060-schedule-planner-and-scheduler-boundary.md)
- [ADR-061 Scheduling Port / Handler Registry](../architecture/adr/ADR-061-business-module-scheduling-port-and-handler-registry.md)
- [ADR-062 Reminder 单一调度权](../architecture/adr/ADR-062-reminder-routine-single-scheduling-authority.md)
- [ADR-063 Notification Fact / Delivery Policy](../architecture/adr/ADR-063-notification-fact-delivery-policy-and-device-surfaces.md)
- [Scheduling / Notification vNext](../product/scheduling-notification-vnext.md)
