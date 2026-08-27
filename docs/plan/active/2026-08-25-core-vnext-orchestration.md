---
tags:
  - plan
  - active
  - core-vnext
  - orchestration
  - goal
  - task
  - routine
  - planner
  - scheduler
  - notification
  - event-bus
  - parallel
description: MemoFlow Goal/Task/Routine/Planner/Scheduler/Notification/EventBus 的总重构编排计划，按依赖、共享热点和可并行 lane 组织，并为每个标准能力指定 Build/Borrow/Imitate 来源
created: 2026-08-25T19:18:00+08:00
updated: 2026-08-25T21:40:00+08:00
status: active
---

# MemoFlow Core vNext — Unified Refactor Orchestration

## 0. Executive decision

本计划成为以下工作的**唯一执行顺序真值**：

- Goal / Task vNext；
- Routine Coach vNext；
- Schedule / Planner 与 Scheduler 分层；
- Notification Fact / Delivery Policy；
- Runtime EventBus；
- shared time / recurrence / calendar UI；
- 与上述模块直接相关的 Desktop surfaces、AI contracts、Mobile parity。

已有子计划继续保留详细业务上下文，但**不得再按各自 Phase 编号独立推进**：

- `2026-08-25-goal-task-vnext-refactor.md`
- `2026-08-25-scheduling-notification-vnext-refactor.md`

本计划解决它们之间的交叉依赖和重复迁移问题。

## 0.1 Implementation checkpoint — Wave 0 / Wave 1

Wave 0 evidence is frozen in [`Core vNext Wave 0 — Baseline / Acceptance / Shared-Train Evidence`](../../analysis/2026-08-25-core-vnext-wave-0-baseline-and-acceptance.md).

| Ticket group | Status | Canonical evidence / implementation |
| --- | --- | --- |
| `CORE-0001~0005` | **DONE** | frozen map + A–J fixtures + train map + OSS gate; child plans rebased below |
| `EVT-1001` | **DONE** | ADR-064, Emittery-backed runtime EventBus |
| `TIME-1101~1103` | **DONE** | `RecurrenceEnginePort`, `rrule@2.8.1`, Task recurrence adapter, timezone/DST fixtures |
| `UI-1101` | **DONE** | shared Date/Time/DateTime/Duration/ReminderOffset fields using existing shadcn/Reka primitives |
| `LABEL-1101` | **DONE** | canonical Label contracts + `@memoflow/label` + Prisma/PowerSync Goal/Task assignment persistence |
| `SCHED-1101~1105` | **DONE** | canonical neutral contracts, first-class scheduling identity, atomic owner reconcile + durable receipt, HandlerRegistry composition hook |
| `NOTIF-1101/1102` | **DONE** | per-channel policy correctness + production DND/rate-limit path |

**Wave 2 execution point (closed 2026-08-26):** `GOAL-2101~2103`, `TASK-2201~2205`, `ROUTINE-2301~2303`, and `NOTIF-2401/2402` are integrated and gate-verified.

**Current next executable parallel point:** `TASK-3101`, `GOAL-3201`, `NOTIF-3301`, and `SETTLE-3501`. These four lanes can start independently from the frozen W2 contracts; handler cutover follows their dependency edges below.

**Wave 1 gate evidence (2026-08-25):**

- Event foundation: `utils` 144 tests, `patterns` 35 tests, contracts typecheck green.
- Time/recurrence: 31 tests + typecheck/build green; Storybook exposed and the integration train repaired an `rrule` ESM default-import bundling defect.
- Task recurrence consumer: 847 tests + typecheck green.
- Scheduling: 399 focused tests + 28 Prisma integration tests + typecheck green; orchestration 10 tests + typecheck green.
- Notification: 297 tests + typecheck green.
- Shared Label: 5 unit tests + 3 PostgreSQL integration tests + typecheck/build green; PowerSync transaction behavior is included in the unit suite.
- Shared date/time UI: 4 interaction/accessibility tests + `vue-tsc` + package build + production Storybook build green.
- Schema/tooling: Prisma schema valid, PowerSync schema build green, Nx `sync:check` green, test inventory green (`1085` files).
- Repository governance: `docs:check` and `governance:check` green after registering the new Label project/export and removing the obsolete UI-test exemption.

North Star：

```text
Business Domains
  Goal     = Outcome / Measurement
  Task     = Action / Execution
  Routine  = Behavior / Rhythm
        │
        ├─ domain events -> Runtime EventBus (fast path)
        ├─ durable integration events / Outbox (reliable side effects)
        ├─ calendar projection -> Planner
        └─ scheduling intent -> Scheduler
                                  │
                                  -> HandlerRegistry
                                  -> domain handler
                                  -> NotificationRequested
                                  -> Notification Fact / Delivery Plan
```

Routine 另有本地确定性运行路径：

```text
Activity / Idle / Context Sensors
          -> Local Routine Runtime
          -> RoutineOccurrence
          -> Intervention / Focus Surface
```

---

# 1. Outcome

本轮完成后，MemoFlow 核心个人生产力闭环应具备以下可观察行为：

```text
Goal
  -> 定义可衡量结果
  -> Task / Task Plan 执行
  -> optional Goal contribution settlement
  -> progress / review

Task
  -> Today / Upcoming 实例执行
  -> recurrence / outcome / plan lifecycle
  -> reminder projection
  -> Planner projection

Routine
  -> WallClock durable routine
  -> ActiveUsage / Natural Break local routine
  -> Protocol Session / Focus Window

Planner
  -> 聚合 Task / Goal / Routine / manual CalendarEntry
  -> source-aware edit routes back to owner domain

Scheduler
  -> neutral future invocation
  -> stable identity / reconcile / retry / recovery

Notification
  -> durable message fact
  -> per-channel preference / DND / rate-limit
  -> Desktop / InApp / future Push/Email delivery
```

用户不需要理解：

```text
ScheduleTask
SourceModule
worker lease
cron
TaskTemplate engineering model
GoalFolder
Task DAG
ReminderGroup ControlMode
Notification delivery internals
```

---

# 2. Constraints and implementation posture

## 2.1 Speed-first development posture

当前项目仍处于快速产品成型阶段。本轮优先目标是：

```text
尽快到达一套清晰、完整、可验证、后续不需要再次大规模拆边界的 vNext
```

因此：

- 无价值数据可以 reset 时，不为旧 schema 构建长期双写系统；
- 兼容 bridge 只用于降低同一批迁移风险，不成为永久 v1/v2 双轨；
- 标准能力优先 Borrow，不从零实现；
- 业务语义一次收敛，不先迁旧模型再迁新模型；
- UI 在 domain/contract 稳定后重建，不为旧 DTO 做新壳。

## 2.2 Protected assets

不得因“大重构”丢失：

- `@memoflow/time` Product Time contract；
- optimistic concurrency；
- Goal / Task transaction runners；
- Task -> Goal durable outbox / GoalRecord correlation；
- Schedule claim / lease / retry / restart recovery；
- ReminderOccurrence idempotency / fencing / transaction assets；
- NotificationDispatchOutbox / per-channel retry / DLQ；
- API / Desktop transport parity；
- Prisma / PowerSync identity isolation；
- Electron context isolation / preload least privilege；
- Result / failure contracts；
- existing runtime module composition pattern。

---

# 3. Build / Borrow / Imitate policy

Mandatory companion ledger:

- [`Core vNext — OSS / Standard Capability Reuse & Reference Ledger`](../../analysis/2026-08-25-core-vnext-reuse-and-reference-ledger.md)

Default decisions:

```text
Event Bus       -> Borrow Emittery (already implemented)
Product Time    -> Keep @memoflow/time + date-fns
Date UI         -> Borrow shadcn-vue / Reka UI / @internationalized/date
Planner UI      -> Prefer FullCalendar Standard Vue 3 after PoC
Recurrence      -> Prefer rrule adapter; ical.js only if interoperability needs it
Scheduler seam  -> Build MemoFlow contract; imitate Trigger.dev dedupe/timezone
Scheduler engine-> Keep current first; pg-boss PoC only after seam stable
Notification    -> Build existing domain; imitate Novu preference/workflow semantics
Routine         -> Build domain; imitate Workrave/Safe Eyes/Sane Break
Focus runtime   -> Build state machine; imitate Super Productivity
Plugin system   -> Defer; only registry/port seams now
```

No ticket may reimplement a standard capability before completing its Build/Borrow check.

---

# 4. Parallel execution model

## 4.1 Why “parallel” needs ownership

Naive parallelism is unsafe because many lanes touch the same files:

```text
@memoflow/contracts
packages/database
packages/schedule-orchestration
packages/ui-vue-shadcn
apps/desktop/src/main
apps/api/src/runtime
```

Therefore use **domain lanes + shared trains**.

## 4.2 Long-lived logical lanes

| Lane                | Owns                                       | Normally may edit                                                        |
| ------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| L-A Goal            | Goal/KR/Review                             | `packages/goal`, app-vue goal                                            |
| L-B Task            | Task/Plan/Occurrence/Contribution          | `packages/task`, app-vue task                                            |
| L-C Routine         | Routine/Profile/Protocol                   | `packages/reminder` -> routine-compatible code, app-vue reminder/routine |
| L-D Scheduling      | neutral scheduling + scheduler adapters    | `packages/schedule`, `packages/schedule-orchestration`                   |
| L-E Notification    | Fact/Policy/Delivery                       | `packages/notification`, app-vue notification                            |
| L-F Planner         | calendar read model / FullCalendar adapter | app-vue schedule, planner-specific client code                           |
| L-G Desktop Runtime | sensors/windows/local surfaces             | `apps/desktop/src/main`, desktop runtime adapters                        |
| L-H AI/Mobile       | AI drafts/tools + React mobile parity      | `packages/ai`, app-react/mobile                                          |

## 4.3 Shared trains — single writer per wave

### Contract Train

Owns:

```text
packages/contracts
public schema names
cross-module event maps
shared primitives
```

Rule: domain lane proposes a contract patch; only Contract Train lands it during that wave.

### Schema Train

Owns:

```text
packages/database Prisma schema/migrations/generated contracts
PowerSync schema mapping changes shared by multiple domains
```

Rule: one schema bundle per wave, generated after all domain proposals for that wave are frozen.

### Orchestration Train

Owns shared mutations to:

```text
packages/schedule-orchestration registry/runtime core
apps/api runtime composition shared files
apps/desktop composition shared files
```

Feature lanes add isolated projectors/handlers where possible; central registry changes go through this train.

### UI Core Train

Owns:

```text
packages/ui-vue-shadcn exports
shared DateField / LabelPicker / common primitives
```

Feature lanes consume only published primitives.

## 4.4 Worktree rule

For parallel execution:

```text
main worktree = review + integration only
one ticket/group = one isolated worktree/branch
```

Suggested names:

```text
core-vnext/w1-time
core-vnext/w1-scheduling
core-vnext/w1-notification
core-vnext/w2-goal
core-vnext/w2-task
core-vnext/w2-routine
core-vnext/w4-planner
core-vnext/w4-routine-local
```

Do not run two agents against the same mutable worktree.

---

# 5. Dependency graph

```text
W0 Baseline / Governance
        │
        ▼
W1 Shared Foundations
 ├─ EventBus stable [done]
 ├─ Time + recurrence adapters
 ├─ UI time primitives
 ├─ SchedulingPort + stable identity
 ├─ HandlerRegistry skeleton
 ├─ Notification P0 correctness
 └─ Shared Labels foundation
        │
        ▼
W2 Business Contract Stabilization
 ├─ Goal / KR / Review
 ├─ Task / Occurrence / Plan
 ├─ Routine / Profile / Trigger
 └─ Notification Fact / workflow contracts
        │
        ▼
W3 Vertical Integration
 ├─ Task -> Scheduler -> Notification
 ├─ Goal -> Scheduler -> Notification
 ├─ Routine WallClock -> Scheduler
 ├─ Task -> Goal settlement
 └─ durable projection repair
        │
        ├────────────────────┐
        ▼                    ▼
W4 Local Routine Runtime    W4 Planner Engine
        │                    │
        └─────────┬──────────┘
                  ▼
W5 Product UI Rebuild
 ├─ Goal
 ├─ Task
 ├─ Routine
 ├─ Planner
 └─ Notification
                  │
                  ▼
W6 AI / Mobile / Dead Surface Deletion
                  │
                  ▼
W7 Failure Matrix / Full Acceptance / Docs Closure
```

---

# 6. Wave 0 — Baseline, ownership and characterization

Goal: freeze current behavior and make later parallel work safe.

Parallelism: `CORE-0001`, `CORE-0002`, `CORE-0003`, `CORE-0004` may run in parallel; `CORE-0005` merges their output.

## CORE-0001 — Freeze Core vNext system map

**Lane:** Integration / architecture  
**Goal:** Produce one current-system map for Goal/Task/Routine/Schedule/Notification/EventBus.  
**Reuse/Reference:** existing ADR-033, ADR-053~064; no new code.

**Implementation:**

1. inventory cross-package imports among the six core packages;
2. inventory all `ScheduleTask.create` calls;
3. inventory all `NotificationPort` calls from scheduler execution;
4. inventory Reminder Cron and Schedule Queue startup paths;
5. inventory Task recurrence calculators and generation entry points;
6. inventory Planner custom Day/Week/Month components;
7. inventory current date/time UI components;
8. save machine-readable grep lists under analysis evidence or plan appendix.

**Acceptance:** every destructive ticket can point to current consumers and owner.

## CORE-0002 — Freeze acceptance scenario suite

**Lane:** test architecture  
**Goal:** Turn product discussions into reusable fixtures.  
**Reference:** Goal/Task vNext and Routine vNext product docs.

Create fixture scenarios:

```text
A. Graduation / second-class points 15-day plan
B. Running 100km EachCompletion
C. Weight 75 -> 70 Last measurement
D. One-time task 14:00 + reminder -30m
E. Goal due date -7d
F. Routine 23:30 wall-clock + snooze
G. Stand routine ActiveUsage 40m + natural idle break
H. 50/10 protocol with restart recovery
I. DND mixed-channel notification
J. Planner Task drag 14:00 -> 16:00 + failed command revert
```

**Acceptance:** fixture IDs are referenced by later unit/integration/E2E tests.

## CORE-0003 — Contract and schema hotspot map

**Lane:** Contract Train + Schema Train  
**Goal:** Prevent parallel agents from colliding on central files.

**Implementation:**

1. map all planned contract additions/removals by wave;
2. map Prisma model/column changes by wave;
3. identify migration-reset decision points;
4. define one contract bundle and one schema bundle per wave;
5. define generated-code ownership;
6. forbid feature lanes from independently regenerating shared schema during same wave.

**Acceptance:** every W1/W2 ticket declares whether it needs Contract/Schema Train.

## CORE-0004 — OSS/license decision verification

**Lane:** architecture  
**Goal:** Validate the reuse ledger before dependency addition.

Required checks:

```text
Emittery        direct use / existing
FullCalendar    Standard MIT only
Schedule-X      no Premium dependency
rrule           adapter candidate
ical.js         optional interoperability candidate
pg-boss         PoC only
Novu            semantic reference only
Workrave        GPL reference only
Safe Eyes       GPL reference only
Super Productivity MIT reference
```

**Acceptance:** no dependency added without explicit decision record.

## CORE-0005 — Rebase child plans onto umbrella order

**Depends:** CORE-0001~0004  
**Goal:** Existing child plans remain useful but cannot conflict in ordering.

**Implementation:**

1. add orchestration notice to both child Active Plans;
2. map each old phase to Core vNext ticket IDs;
3. remove wording that implies independent sequential execution;
4. update Active Plan index;
5. mark EventBus ADR-064 implemented foundation;
6. mark unresolved child items as delegated, not duplicated.

**Acceptance:** a future agent reading any child plan is directed here for actual order.

---

# 7. Wave 1 — Shared foundations

Goal: stabilize seams that all business lanes depend on.

Parallel lanes after W0:

```text
L1 Time/Recurrence
L2 Scheduling Foundation
L3 Notification P0
L4 Shared Labels
L5 UI Core
```

`EVT-1001` is already implemented and becomes a prerequisite, not new work.

## EVT-1001 — Runtime EventBus uses Emittery [DONE]

**Status:** implemented under ADR-064.  
**Borrow:** `emittery`.

Protected semantics:

```text
send()     fire-and-forget
 dispatch() awaited delivery scoped to one event
Outbox     durable fallback
reconcile  correctness repair
```

Gate before W3: root typecheck + utils/patterns tests remain green after merges.

## TIME-1101 — Preserve TimeFacade and define third-party conversion boundary

**Lane:** L1  
**Goal:** Prevent recurrence/calendar libraries from creating a second product time model.  
**Borrow:** existing `date-fns`, `@internationalized/date`; Temporal only at adapters.

**Implementation:**

1. add adapter-level conversion contract tests for `Instant <-> Date`;
2. add `Ymd/Hm <-> UI date value` tests;
3. define IANA timezone resolution input source;
4. define DST fixture set;
5. document no third-party date type in feature contracts;
6. add governance rule if a simple AST/import check is practical.

**Acceptance:** Task/Goal/Routine contracts remain `Instant/Ymd/Hm` based.

## TIME-1102 — Recurrence engine comparative spike

**Lane:** L1  
**Goal:** Select a mature recurrence engine instead of growing current daily scan.  
**Borrow candidates:** `rrule`, `ical.js`.

**Implementation steps:**

1. build MemoFlow-owned `RecurrenceEnginePort` test fixture without library types;
2. include Daily / Weekly / Monthly / Yearly;
3. include interval >1;
4. include BYDAY;
5. include COUNT finite plan;
6. include UNTIL/end date;
7. include leap day/month-end;
8. include timezone/DST cases where applicable;
9. implement temporary `rrule` adapter;
10. implement minimal `ical.js` comparison only for cases `rrule` cannot model cleanly;
11. record correctness, API complexity, license, bundle impact;
12. choose one engine for Task/Routine recurrence date generation.

**Default expected decision:** `rrule` for recurrence math; `ical.js` deferred to ICS interoperability.

**Acceptance:** explicit Build/Borrow verdict and passing fixture.

## TIME-1103 — Replace unsafe recurrence primitives behind adapter

**Depends:** TIME-1102  
**Lane:** L1 + Task lane consultation  
**Goal:** Stop using `afterDate + 86400000` and incomplete Monthly/Yearly placeholders as canonical recurrence behavior.

**Implementation:**

1. preserve current behavior with characterization tests;
2. introduce adapter without changing Task public contract;
3. route `getNextOccurrence` through adapter;
4. route finite occurrence generation through adapter;
5. preserve Task business exception filtering after generated dates;
6. verify month-end / DST / leap fixtures;
7. delete old duplicated calendar arithmetic only after parity/new intended semantics pass.

**Acceptance:** recurrence date generation has one engine boundary.

## UI-1101 — Shared Date/Time form composites

**Lane:** L5 UI Core  
**Borrow:** shadcn-vue Calendar/Popover/Input, Reka UI, `@internationalized/date`, `@memoflow/time`.

Build thin composites:

```text
DateField
TimeField
DateTimeField
DurationField
ReminderOffsetField
```

**Implementation:**

1. use existing Calendar primitive, no new calendar grid;
2. use keyboard-accessible Popover/Dialog primitives;
3. convert only through TimeFacade/UI adapter;
4. support empty/all-day state;
5. support locale labels;
6. add Storybook cases: empty/filled/disabled/error/narrow panel;
7. add accessibility interaction tests;
8. export through UI package once.

**Acceptance:** Goal/Task/Routine later consume the same primitives without sharing domain DTOs.

## LABEL-1101 — Shared Label contract + persistence

**Lane:** L4  
**Goal:** Establish the new classification foundation before deleting Folder/Category.  
**Reference:** existing Goal/Task vNext ADR-054; shadcn command/popover primitives for UI later.

**Implementation:**

1. Contract Train adds Label DTO/commands;
2. Schema Train adds Label / GoalLabel / TaskLabel;
3. unique normalized identity-scoped name;
4. Prisma + PowerSync adapters;
5. label list/search/create/update/delete;
6. Goal/Task mutation accepts `labelIds[]`;
7. read model resolves labels in batch;
8. AND filtering tests;
9. identity isolation tests.

**Acceptance:** same `#工作` can attach to Goal and Task.

## SCHED-1101 — Neutral Scheduling contracts

**Lane:** L2 + Contract Train  
**Build, imitate:** ADR-061; Trigger.dev schedule identity semantics.

Introduce:

```text
SchedulingOwner
ScheduledIntent
SchedulingPort
SchedulingReconcileReceipt
ScheduledHandler
ScheduledHandlerResult
```

**Implementation:**

1. contract shapes with no `ScheduleTask` import;
2. payload schema/version strategy;
3. stable string handler keys;
4. owner identity validation;
5. receipt/failure mapping to ADR-042;
6. contract tests;
7. package import boundaries.

**Acceptance:** a fake module can schedule without importing `@memoflow/schedule` aggregate.

## SCHED-1102 — Existing ScheduleTask engine adapter

**Depends:** SCHED-1101  
**Lane:** L2  
**Goal:** Reuse current reliable engine while replacing upper seam.

**Implementation:**

1. create `SchedulingPort` adapter around existing repository/runtime;
2. map neutral intent to legacy ScheduleTask internally;
3. preserve runAt/priority/retry semantics;
4. isolate SourceModule to compatibility metadata only;
5. mapper contract tests;
6. no feature migration yet.

**Acceptance:** neutral contract reaches existing queue and executes a test handler.

## SCHED-1103 — Stable schedulingKey persistence

**Depends:** SCHED-1102  
**Imitate:** Trigger.dev `deduplicationKey` invariant.

**Implementation:**

1. canonical key format utility/validation;
2. Schema Train adds stable key columns/index;
3. preflight duplicate/collision check;
4. deterministic backfill for existing projected rows if retained;
5. unique constraint scoped by identity/owner;
6. idempotent upsert tests;
7. 100 repeated reconcile test.

**Acceptance:** same desired state cannot create duplicate invocation rows.

## SCHED-1104 — Transactional owner reconcile

**Depends:** SCHED-1103  
**Reference:** desired-state controller pattern; current replaceSelection idea.

**Implementation:**

1. read existing owner set inside transaction;
2. upsert desired keys;
3. delete stale keys;
4. write operation receipt;
5. failure injection after each step;
6. PowerSync equivalent atomic/repair behavior;
7. concurrency test for two simultaneous reconciles.

**Acceptance:** no half-reconciled owner state after injected failures.

## SCHED-1105 — HandlerRegistry skeleton

**Depends:** SCHED-1101  
**Lane:** L2 / Orchestration Train  
**Reference:** plugin-ready registry pattern, not full plugin runtime.

**Implementation:**

1. typed handler registration API;
2. duplicate key fail-fast;
3. unknown key -> explicit dead-letter/failure;
4. payload validation before handler;
5. no feature package imports in core registry;
6. runtime composition registration hook;
7. test fake handler.

**Acceptance:** adding a handler does not modify `SourceModule` switch.

## NOTIF-1101 — Fix per-channel policy defect

**Lane:** L3  
**Imitate:** Novu channel preference semantics.

**Implementation:**

1. add failing mixed-channel test;
2. evaluate each channel separately;
3. record disabled/suppressed outcome;
4. preserve Notification read/unread fact;
5. do not enqueue disabled channels;
6. ensure existing dispatch outbox behavior stays intact.

**Acceptance:** `InApp allowed + Email disabled` never queues Email.

## NOTIF-1102 — Wire DND and rate-limit to real path

**Depends:** NOTIF-1101  
**Imitate:** Novu workflow preferences; retain MemoFlow runtime.

**Implementation:**

1. source DND context explicitly;
2. source rate usage explicitly;
3. evaluate per workflow/channel;
4. outcomes: suppressed/deferred/rate_limited;
5. reason code persistence;
6. critical workflow bypass only when explicit;
7. tests for DND off/on/end and rate reset.

**Acceptance:** policy definitions and actual production path are the same behavior.

### Wave 1 gate

Must pass before destructive W2 domain work:

```text
utils / patterns tests
contracts typecheck
schedule + schedule-orchestration tests/typecheck
notification tests/typecheck
label persistence integration
recurrence engine decision fixture
UI core Storybook/unit checks
root affected governance
```

---

# 8. Wave 2 — Business contract stabilization

Goal: make domain truth final **before** migrating projections and rebuilding UI.

Parallelism:

```text
L-A Goal
L-B Task
L-C Routine
L-E Notification Fact
```

Shared Contract/Schema Trains serialize only their central patches; feature implementation stays parallel.

## GOAL-2101 — Goal aggregate simplification

**Lane:** L-A  
**Imitate:** personal goal/OKR semantics from prior OSS study; Build MemoFlow domain.

Retire:

```text
GoalFolder
category
parentGoal
importance/dynamic priority
custom color business field
focus domain
comparison domain
```

**Implementation:**

1. characterize consumer list;
2. Contract Train removes/renames public fields in one bundle;
3. Schema Train removes/reset fields;
4. status -> Active/Completed/Abandoned;
5. archive becomes display/persistence attribute, not status;
6. dueDate naming convergence;
7. remove domain services that only serve retired features;
8. focused aggregate/application tests.

**Acceptance:** Goal answers only Direction + Measurement.

## GOAL-2102 — KR Measurement V2

**Lane:** L-A  
**Build:** MemoFlow measurement semantics.

**Implementation:**

1. remove `KeyResultValueType`;
2. define `startingValue`, optional progress baseline;
3. canonical progress calculator;
4. Sum/Average/Max/Min/Last aggregation;
5. directional progress tests;
6. clamp rules;
7. separate overall progress from Goal completion;
8. record edit/delete recalculation;
9. snapshots use same calculator.

**Acceptance fixtures:** graduation, running, weight.

## GOAL-2103 — Review simplification

**Depends:** GOAL-2102  
**Lane:** L-A

Retire type/rating/title; keep system context + reflection.

**Implementation:**

1. contract/schema simplification;
2. authoritative progress snapshot;
3. time-window deltas;
4. contribution/record summary query;
5. normalized trend view model;
6. no mixed-unit absolute chart.

**Acceptance:** review begins from system facts, not blank form taxonomy.

## TASK-2201 — Occurrence outcome model

**Lane:** L-B  
**Build; imitate:** Vikunja/Tasks.org personal recurrence behaviors.

Canonical state:

```text
Pending
InProgress
Completed
Missed
Skipped
```

Derived:

```text
isOverdue
```

**Implementation:**

1. characterize persisted Expired behavior;
2. remove Expired from canonical domain;
3. derive overdue from time + unresolved state;
4. add markMissed command;
5. preserve correction/uncomplete path;
6. define Skipped as waiver/not-applicable;
7. remove expiration service mutation after parity;
8. past-due completion fixture.

**Acceptance:** time passing never invents a real-world Missed fact.

## TASK-2202 — Task Plan lifecycle/outcome

**Depends:** TASK-2201  
**Lane:** L-B

Canonical:

```text
lifecycle Active | Paused | Closed
outcome   Open | Succeeded | Failed | Abandoned
```

**Implementation:**

1. finite scope evaluator;
2. strict success policy extension point;
3. Missed effect;
4. Skipped waiver scope effect;
5. user abandon command;
6. delete only for mistaken creation;
7. no automatic Failed while outcome is still unknown;
8. correction/re-evaluation tests.

**Acceptance:** 15-day plan facts match graduation fixture.

## TASK-2203 — Task domain simplification

**Lane:** L-B; can run in parallel with TASK-2201 on separate files after contract map.  
**Imitate:** Super Productivity / personal task apps; Build own aggregate.

Retire:

```text
TaskFolder
parent/child
Dependency/DAG/CriticalPath
blockingReason/dependencyStatus
persisted dynamic priority score
```

Keep:

```text
one-time/recurring
instances
simple user priority
checklist
reminder
labels
goal link
```

**Acceptance:** Task answers Action + Execution, not project scheduling graph.

## TASK-2204 — Recurrence adapter integration

**Depends:** TIME-1103, TASK-2201  
**Borrow:** selected recurrence engine.

**Implementation:**

1. convert Task recurrence config to engine input;
2. engine yields candidate dates;
3. Task domain applies plan status/exception filtering;
4. finite COUNT mapping;
5. end date mapping;
6. no duplicate existing occurrence;
7. timezone/local-day policy fixtures;
8. remove obsolete manual Monthly/Yearly placeholders.

**Acceptance:** recurrence date math is standard-library-backed; Task outcome stays domain-owned.

## TASK-2205 — Goal link and contribution V2

**Depends:** GOAL-2102, TASK-2202  
**Lane:** L-B + L-A contract review

**Implementation:**

1. link separated from contribution;
2. contribution optional;
3. triggers `EachCompletion | PlanCompletion`;
4. automatic contribution only supported aggregation cases;
5. PlanCompletion finite-plan validation;
6. settlement source type/id explicit;
7. replay idempotency;
8. correction/uncomplete revert;
9. duplicate delivery test.

**Acceptance:** link-only Task never changes KR; 15/15 plan can settle once.

## ROUTINE-2301 — RoutineDefinition + Profile + Membership

**Lane:** L-C  
**Imitate:** Workrave/Safe Eyes profile/runtime ideas; Build own domain.

**Implementation:**

1. introduce RoutineDefinition behind legacy adapter;
2. RoutineProfile;
3. ProfileMembership M:N;
4. remove ControlMode takeover semantics;
5. canonical effectiveEnabled formula;
6. profile off preserves member state;
7. profile on cannot revive disabled member;
8. schema and PowerSync parity.

**Acceptance:** same Drink Water routine can participate in Work/Gaming with independent membership enabled state.

## ROUTINE-2302 — Trigger model

**Depends:** ROUTINE-2301, TIME-1103  
**Build + Borrow recurrence dates where standard:**

```text
WallClock
Elapsed
ActiveUsage
```

Protocol remains separate.

**Implementation:**

1. WallClock with local time + recurrence + IANA zone;
2. Elapsed trigger config;
3. ActiveUsage trigger config;
4. TemporaryOverride/snooze contract;
5. legacy FixedTime mapping;
6. legacy Interval classification/migration;
7. next wall-clock occurrence uses selected recurrence adapter where applicable;
8. no ActiveUsage schedule projection.

**Acceptance:** trigger type itself expresses which runtime owns timing.

## ROUTINE-2303 — ProtocolDefinition / ProtocolSession domain

**Lane:** L-C  
**Imitate:** Super Productivity Focus Mode / Pomodoro / Flowtime.

**Implementation:**

1. phase vocabulary;
2. deterministic transition table;
3. start/pause/resume/end/cancel;
4. cycle policy;
5. break policy;
6. persistent session snapshot/version;
7. explicit termination reason;
8. table-driven transition tests;
9. no renderer-owned truth.

**Acceptance:** domain can represent 50/10 two-cycle session without Electron window.

## NOTIF-2401 — Notification Fact + DeliveryPlan contract

**Depends:** NOTIF-1101/1102  
**Lane:** L-E  
**Imitate:** Novu workflow/inbox separation.

**Implementation:**

1. workflowKey/topic;
2. Notification Fact identity/idempotency;
3. related entity/navigation;
4. importance/urgency;
5. delivery decisions per channel;
6. read/unread independent from delivery state;
7. suppressed/deferred reasons;
8. migration from old template/module preference concepts.

**Acceptance:** Inbox fact can exist while Desktop delivery is suppressed.

## NOTIF-2402 — Preference hierarchy

**Depends:** NOTIF-2401  
**Imitate directly:** Novu workflow capability -> global preference -> workflow-specific preference.

**Implementation:**

1. workflow channel capability/default;
2. user global channel settings;
3. workflow-specific overrides;
4. critical/read-only allowlist;
5. migration from existing preferences;
6. contract and policy tests;
7. no UI yet.

**Acceptance:** precedence table is deterministic and test-covered.

### Wave 2 gate — **CLOSED 2026-08-26**

- [x] domain contracts frozen enough for projector/UI work;
- [x] no old business field added back to support existing UI;
- [x] Goal/Task/Routine focused suites green;
- [x] schema boot and Prisma/PowerSync parity green;
- [x] recurrence acceptance matrix green.

| Ticket group | Status | Closure evidence |
| --- | --- | --- |
| `GOAL-2101~2103` | **DONE** | Goal = Direction + Measurement; `Active/Completed/Abandoned` + separate archive; KR Measurement V2; Review V2; Goal full suite `79 files / 425 tests`; Prisma integration `21 tests` |
| `TASK-2201~2205` | **DONE** | occurrence `Pending/InProgress/Completed/Missed/Skipped`; plan lifecycle/outcome; Folder/DAG/critical-path retirement; recurrence adapter; Goal link/contribution V2; Task suite `70 files / 690 tests` |
| `ROUTINE-2301~2303` | **DONE** | RoutineDefinition/Profile/Membership, trigger ownership, Protocol session state machine; reminder package `60 files / 455 tests`; vNext domain+persistence parity `39 tests`; integration `29 tests` |
| `NOTIF-2401/2402` | **DONE** | Notification Fact/DeliveryPlan separation and deterministic workflow/global preference hierarchy; notification suite `42 files / 232 tests` |
| Contract / Schema Train | **DONE** | contracts `63 files / 469 tests`; Prisma generate/schema boot green; database `13 tests`; PowerSync schema `4 tests`; Data Portability `139 tests` |
| Time / recurrence | **DONE** | time `32 tests`; recurrence conformance matrix `11/11`; Task recurrence consumes `RecurrenceEnginePort` |
| Performance budget | **DONE** | Task vNext owns a real perf suite: 20k-occurrence plan outcome evaluation plus 1000-date recurrence expansion; `task:test:perf` `2/2` green; retired priority-sort benchmark paths removed |
| Presentation / secondary consumers | **DONE** | App Vue `183 files / 713 tests`; React/mobile/web destructive contract cutover; Goal Compare, Goal Folder/Focus, Task Dependency/DAG/check-expired guards removed or inverted; Web `17 files / 71 tests` |
| Reliability | **DONE** | Task transaction/outbox integration `27 tests`; Goal integration `21 tests`; Routine integration `29 tests`; API Task→Goal host-restart replay `1/1`; Goal Prisma/PowerSync rollback gates green |
| Repository gate | **DONE** | affected test `35 projects + 6 dependent tasks`; typecheck `36 projects + 29 tasks`; lint `40 projects`; build `34 projects + 1 task`; governance green; test inventory `1066` files; test oracle `success` |

**W2 closure rule:** no compatibility surface may reintroduce Goal Folder/Focus/comparison, Task DAG/dependency/Expired occurrence status, old Goal Review fields, or message-string branching for typed business failures. Physical legacy columns may remain only behind already-approved persistence adapters until their dedicated schema deletion train.

---

# 9. Wave 3 — End-to-end vertical integration

Goal: connect stable domains through neutral infrastructure before rebuilding all surfaces.

Parallelism after SCHED foundation + W2 contracts:

```text
Task scheduling slice
Goal scheduling slice
Task->Goal settlement
NotificationRequested runtime
```

Routine wall-clock starts after NotificationRequested seam is available or uses a temporary durable adapter with same final contract.

## TASK-3101 — Task scheduling projector -> SchedulingPort

**Lane:** L-B + L-D  
**Depends:** TASK-2201/2204, SCHED-1104.

**Implementation:**

1. Task-owned projector reads authoritative Task/Occurrence;
2. calculates reminder runAt in Task domain/application seam;
3. emits neutral ScheduledIntent;
4. stable key from occurrence + reminder identity;
5. remove Task production import of `ScheduleTask`;
6. startup full reconcile;
7. lost event repair test;
8. API/Desktop parity.

**Acceptance:** fixture D schedules exactly one 13:30 invocation.

## TASK-3102 — `task.reminder.fire` handler

**Depends:** TASK-3101, SCHED-1105  
**Lane:** L-B + Orchestration Train

**Implementation:**

1. register handler;
2. validate payload schema;
3. re-read Task occurrence;
4. stale/completed/deleted -> skipped receipt;
5. valid due -> durable NotificationRequested;
6. business idempotency;
7. retryable technical failures;
8. remove central SourceModule Task execution path after parity.

**Acceptance:** Scheduler does not import Task domain; handler registration is composition-only.

## GOAL-3201 — Goal scheduling projector -> SchedulingPort

**Lane:** L-A + L-D  
**Depends:** GOAL-2101/2102, SCHED-1104.

**Implementation:**

1. keep RemainingDays etc. in Goal semantics;
2. resolve runAt using Product Time;
3. stable scheduling key;
4. full owner enumeration/startup reconcile;
5. no Shanghai fallback;
6. no Goal production `ScheduleTask` construction;
7. event-lost repair test.

**Acceptance:** fixture E produces one stable -7d invocation.

## GOAL-3202 — `goal.reminder.fire` handler

**Depends:** GOAL-3201, NOTIF-3301  
**Implementation:** same pattern as Task; re-read Active/completed/archived current truth.

**Acceptance:** completed Goal before due -> observable skipped result, no notification.

## NOTIF-3301 — Durable NotificationRequested outbox

**Lane:** L-E  
**Depends:** NOTIF-2401.

**Implementation:**

1. define durable integration message envelope;
2. writer usable from domain handlers;
3. idempotency key/correlation/causation;
4. consumer creates Notification Fact;
5. DeliveryPlan generated transactionally or with durable next step;
6. per-channel dispatch outboxes;
7. crash before/after Fact commit tests;
8. replay test.

**Acceptance:** business handler commit does not depend on external Desktop/Email success.

## NOTIF-3302 — Remove NotificationPort from scheduler router

**Depends:** TASK-3102, GOAL-3202, NOTIF-3301  
**Lane:** L-D + L-E

**Implementation:**

1. all migrated handlers write NotificationRequested;
2. remove execution result `notification` payload;
3. remove central finalize-notification path;
4. scheduler orchestration loses Notification domain/channel imports;
5. regression tests.

**Acceptance:** Scheduler only wakes handlers.

**Implementation evidence — 2026-08-27:**

- Task, Goal, Routine and the legacy Reminder compatibility source own their durable
  `NotificationRequested` write; execution outcomes no longer carry a `notification` draft.
- `schedule-orchestration` is notification-domain neutral: the execution router only dispatches by
  source/handler and has no `NotificationPort`, channel, requested-envelope or notification package
  runtime/build dependency.
- API and Desktop hosts no longer construct or inject `scheduleNotificationPort`; they inject the
  durable `NotificationRequestedWriterPort` into the business boundary that owns the side effect.
- Legacy Reminder compatibility execution uses an atomic commit port so Reminder state/history and
  `notification.requested` are committed in the same Prisma/PowerSync transaction. PowerSync writer
  rollback/retry behavior is covered explicitly.
- No production business module outside Notification emits new `notification.dispatch` rows; the
  Notification package retains legacy dispatch consumption only for backward-compatible draining.
- Verification: Notification **240/240**, Reminder **491/491**, Task **717/717**, Goal **445/445**,
  Schedule Orchestration **34/34**, Reminder integration **34/34**, targeted API/Desktop composition
  **67/67**; final typecheck passed for notification/reminder/task/goal/schedule-orchestration/api/desktop.

## ROUTINE-3401 — Reliable wall-clock handler path

**Lane:** L-C + L-D  
**Depends:** ROUTINE-2302, NOTIF-3301.

**Reuse:** existing ReminderOccurrence transaction assets; Scheduler wake-up.

**Implementation:**

1. canonical occurrence key;
2. project one-shot next occurrence;
3. scheduler handler enters existing occurrence idempotency fence;
4. transaction revalidates effective state;
5. write history/outcome;
6. advance next trigger;
7. write NotificationRequested or presentation intent as appropriate;
8. post-commit reconcile next one-shot;
9. crash/retry tests.

**Acceptance:** new path reliability >= legacy Reminder Cron path.

## ROUTINE-3402 — Shadow compare and remove dual wall-clock authority

**Depends:** ROUTINE-3401

**Implementation:**

1. legacy scanner switches to read-only due-set shadow;
2. compare old/new due set;
3. mismatch logs/fixtures;
4. two-worker/restart/snooze/pause cases;
5. once matrix clean, disable legacy side effects;
6. delete Cron runtime production startup;
7. retain occurrence transaction/receipts.

**Acceptance:** only Scheduler wakes durable wall-clock routines.

## SETTLE-3501 — Task -> Goal contribution final durable path

**Lane:** L-B + L-A  
**Depends:** TASK-2205.

**Implementation:**

1. explicit settlement source identity;
2. EachCompletion flow;
3. PlanCompletion flow;
4. Goal consumer idempotency;
5. revert/correction;
6. strict 15/15 failure no settlement;
7. waived occurrence behavior;
8. duplicate/replay tests.

**Acceptance:** graduation/running scenarios pass end-to-end.

## SCHED-3601 — Common projection repair runtime

**Lane:** L-D  
**Depends:** Task/Goal/Routine projectors.

**Implementation:**

1. listener registration before full reconcile;
2. incremental event fast path;
3. durable fallback path;
4. startup enumeration;
5. stable-key idempotency;
6. optional bounded periodic sweep only if needed;
7. metrics: repaired/unchanged/failed;
8. no business repo read from orchestration core.

**Acceptance:** intentionally lost event heals after restart for all three source modules.

### Wave 3 primary vertical acceptance

Must demonstrate in executable integration tests:

```text
Task 14:00, -30m
 -> ScheduledIntent 13:30
 -> Scheduler wake
 -> task.reminder.fire
 -> NotificationRequested
 -> Notification Fact
 -> Desktop/InApp eligible plan
```

Then the same infrastructure handles Goal and Routine WallClock.

---

# 10. Wave 4A — Local Routine Runtime

May execute in parallel with Planner Wave 4B after Routine domain is stable.

## ROUTINE-4101 — ActivitySensorPort + Windows adapter

**Lane:** L-G + L-C  
**Imitate:** Safe Eyes platform IdleMonitor abstraction; Workrave behavior.

**Implementation:**

1. define standard `UserActive/UserIdle/UserResumed` events;
2. ActivitySensorPort;
3. IdleSensorPort;
4. Windows adapter first;
5. platform API hidden in desktop infrastructure;
6. fake sensor for tests;
7. subscription lifecycle cleanup;
8. app restart tests.

**Acceptance:** Routine domain/runtime never imports Win32/platform package.

## ROUTINE-4102 — ActiveUsage accumulator + Natural Break

**Depends:** ROUTINE-4101  
**Imitate:** Workrave / Safe Eyes Smart Pause.

**Implementation:**

1. persist/runtime snapshot accumulator;
2. count active usage only;
3. idle threshold detection;
4. natural break credit;
5. reset semantics;
6. profile gate;
7. temporary suppression;
8. no duplicate occurrence after natural break;
9. deterministic fake-clock tests.

**Acceptance:** fixture G suppresses unnecessary stand reminder after sufficient idle rest.

## ROUTINE-4103 — Intervention state machine

**Depends:** ROUTINE-4102  
**Imitate:** Sane Break two-phase model.

Canonical:

```text
Due -> Gentle -> Grace -> Guided -> optional Strict
```

**Implementation:**

1. transition rules;
2. natural stop transition;
3. timeout escalation;
4. snooze/dismiss/complete interactions;
5. strict opt-in gate;
6. safe escape;
7. fake-clock tests.

## ROUTINE-4104 — InterventionWindow

**Depends:** ROUTINE-4103  
**Lane:** L-G

**Borrow:** Electron BrowserWindow + existing preload/context isolation patterns; UI primitives.

**Implementation:**

1. Main Process window owner;
2. one active intervention instance policy;
3. no-focus default;
4. multi-monitor placement;
5. minimal IPC contract;
6. Gentle and Guided rendering;
7. close maps to explicit interaction;
8. crash/reload reconstruction.

**Acceptance:** window is a projection of Runtime truth, not owner.

## ROUTINE-4201 — ProtocolSession persistence/recovery

**Depends:** ROUTINE-2303  
**Imitate:** Super Productivity focus/break state separation.

**Implementation:**

1. persist active session snapshot;
2. deadline-based recovery rather than renderer tick count;
3. pause accounting;
4. phase transition receipt;
5. crash during focus/break tests;
6. completed/cancelled terminal behavior;
7. no duplicate phase transition.

## ROUTINE-4202 — FocusWindow

**Depends:** ROUTINE-4201  
**Lane:** L-G

**Implementation:**

1. Main Process owns lifecycle;
2. phase/cycle/countdown projection;
3. pause/resume/end commands;
4. collapse/drag/optional always-on-top;
5. restore after restart;
6. hiding window != ending session;
7. taskbar integration only through adapter.

## ROUTINE-4203 — Protocol break satisfies ambient routine

**Depends:** ROUTINE-4102, ROUTINE-4201

**Implementation:**

1. map break phase to satisfaction facts;
2. Stand/Eye/Movement compatibility rules;
3. ambient accumulator reset/credit;
4. no immediate duplicate intervention after break;
5. completion history correlation.

**Acceptance:** fixture H completes 50/10 and does not immediately show stand/eye reminder.

---

# 11. Wave 4B — Planner engine and owner-aware edits

## PLAN-4301 — FullCalendar Standard Vue PoC

**Lane:** L-F  
**Borrow:** FullCalendar Standard only.

Validate in an isolated page/story:

```text
Day
Week TimeGrid
Month
List/Agenda
custom event content
now indicator
select
editable drag
resize
failed mutation revert
read-only event
narrow panel
light/dark theme
```

**Implementation:**

1. install only Standard MIT package(s) required by FullCalendar v7 docs;
2. keep Temporal polyfill local to adapter if required;
3. render MemoFlow CalendarEventProjection fixture;
4. eventDrop -> fake owner command;
5. failure -> `revert()`;
6. eventResize equivalent;
7. bundle/startup measurement;
8. accessibility smoke;
9. compare to current custom components.

**Acceptance:** PoC meets core Planner needs without Premium plugin.

**Fallback:** if PoC fails hard on panel/responsiveness/a11y, record evidence before considering Schedule-X Premium or keeping custom layout.

## PLAN-4302 — Planner unified read projection

**Depends:** PLAN-4301  
**Build:** MemoFlow ownership contract.

Canonical projection:

```text
sourceType
sourceId
start/end
allDay
title
display metadata
editableCapabilities
ownerCommandTarget
revision
```

Adapters:

```text
manual CalendarEntry
TaskOccurrence
Goal milestone/deadline
Routine wall-clock occurrence
```

**Acceptance:** no ScheduledInvocation row is rendered in normal Planner.

## PLAN-4303 — Source-aware command routing

**Depends:** PLAN-4302

**Implementation:**

1. CalendarEntry drag -> Planner command;
2. Task drag -> Task command;
3. Goal editable date -> Goal command;
4. Routine wall-clock edit -> Routine command;
5. read-only projections block drag;
6. optimistic UI only where revision/rollback safe;
7. FullCalendar revert on failure/conflict;
8. concurrency conflict surface.

**Acceptance:** Planner never directly writes Scheduler invocation persistence.

## PLAN-4304 — Retire custom calendar layout code after parity

**Depends:** PLAN-4301~4303

**Implementation:**

1. map old Day/Week/Month behaviors;
2. replace route with new adapter;
3. migrate tests to product semantics rather than DOM geometry where possible;
4. preserve required data-test selectors or explicitly migrate them;
5. delete duplicate date-layout calculations;
6. delete old debug/product mixed cards;
7. keep ops Scheduler console separate.

**Acceptance:** one Planner rendering engine remains.

---

# 12. Wave 5 — Product surface rebuild

Start only when relevant W2 domain and W3 integration contracts are stable.

Parallel feature lanes are encouraged because UI modules are mostly isolated.

## UI-5101 — Shared LabelPicker / LabelFilterPopover

**Depends:** LABEL-1101  
**Borrow:** shadcn Command + Popover.

**Implementation:** existing search/create/multi-select/narrow summary; no custom combobox engine.

## GOAL-5101 — Goal list/editor rebuild

**Depends:** GOAL-2101/2102, UI-1101, UI-5101

**Reference:** `docs/product/goal-task-vnext.md`.

Build new surface, do not hide old controls one-by-one.

List:

```text
Active/Completed/All
Labels
progress rows
KR completed count
due date
```

Editor:

```text
title/description/start/due/labels/KRs
```

Delete old Folder/Focus/Compare/Search product surfaces when parity reached.

## GOAL-5102 — Goal detail / record / review surface

**Depends:** GOAL-2102/2103, SETTLE-3501

Use:

- canonical KR calculator;
- linked Task summaries;
- activity timeline;
- inline/drawer review;
- aggregation-aware record labels;
- no duplicate ProgressBreakdown route.

## TASK-5201 — Task Today/Upcoming execution home

**Depends:** TASK-2201/2203/2204, UI-5101

**Imitate:** Super Productivity / personal task apps.

Default is occurrence list, not template management.

## TASK-5202 — Unified Task editor

**Depends:** TASK-2204/2205, UI-1101

Fields:

```text
title
date/time
repeat
labels
goal link
optional contribution
more: description/reminder/priority/checklist
```

Use `ReminderOffsetField` and `RecurrenceEditor`; do not duplicate time controls.

## TASK-5203 — Task detail + repeating plan management

**Depends:** TASK-2201/2202

Show:

```text
occurrence status
overdue derived badge
repeat position
goal metadata
complete/missed/skip correction
link to plan settings
```

## ROUTINE-5301 — Routine configuration center

**Depends:** ROUTINE-2301/2302

**Imitate:** Workrave/Safe Eyes method organization, but use MemoFlow AI-native product language.

UI owns configuration only; daily execution happens through surfaces.

## ROUTINE-5302 — Method library initial set

**Depends:** ROUTINE-5301, Routine runtime slices

Initial methods should be small and verifiable:

```text
Stand & Move
20-20-20
Drink Water
Sleep Wind-down
50/10 Protocol
Pomodoro
```

Each method record specifies:

```text
method type
recommended parameters
which parameters editable
runtime requirement
intervention default
source/reference note
```

Do not add dozens of health methods before the execution model is proven.

## NOTIF-5401 — Notification Center refresh

**Depends:** NOTIF-2401/3301

**Imitate:** Novu Inbox information hierarchy; keep current Vue components where structurally useful.

Display:

- Fact/read state;
- related entity/navigation;
- workflow/category;
- meaningful delivery status only when user-actionable;
- no worker internals.

## NOTIF-5402 — Preferences UI hierarchy

**Depends:** NOTIF-2402

UI:

```text
Global channels
Workflow/category groups
Per-workflow overrides
Critical/read-only explanation
```

Use existing switch/form primitives.

## PLAN-5501 — Planner production UI

**Depends:** PLAN-4301~4304

Use FullCalendar adapter, MemoFlow toolbar/theme, source filters, owner-aware drag/resize, conflict surface.

Do not expose Scheduler jobs.

### Wave 5 gate

Each feature must have:

- loading/empty/error states;
- keyboard navigation;
- narrow panel behavior;
- product wording review;
- no retired field in DTO/form;
- visual/E2E scenario against product fixture.

---

# 13. Wave 6 — AI, Mobile, dead-surface deletion and physical convergence

## AI-6101 — Goal/Task AI draft schema alignment

**Lane:** L-H  
**Depends:** Goal/Task final contracts.

Remove old fields and make AI propose:

```text
labels
KR Measurement V2
Task recurrence
Goal link
optional contribution
```

AI is not allowed to invent unsupported auto-settlement types.

## AI-6102 — Routine AI command/draft tools

**Depends:** Routine contracts/runtime.

Natural language -> structured drafts:

```text
activate profile
create routine
temporary override
start protocol
pause/resume/end session
```

Persistent config changes require product-defined confirmation; timer truth stays deterministic.

## AI-6103 — Planner/Notification AI read tools

Read-only first:

- today schedule summary;
- unread notification summary;
- conflicts/upcoming tasks.

Do not give model direct ScheduledInvocation mutation tools.

## MOBILE-6201 — React/Mobile Goal/Task parity

**Depends:** Goal/Task web contracts stable.

Reuse same public contracts, not Vue component implementation.

Delete old Folder/Dependency/ValueType UI from mobile.

## MOBILE-6202 — Mobile Notification parity

Notification Fact/preferences share contract; device channel adapter may differ.

Routine ActiveUsage desktop-only capabilities must expose capability state rather than fake support on mobile.

## CLEAN-6301 — Retire legacy Goal/Task surfaces

Delete verified dead:

```text
GoalFolder
FocusMode UI/domain if retired
MultiGoalComparison
ProgressBreakdown standalone
TaskDependencyGraph
DAG/CriticalPath
Dependency demos
TaskFolder
old translations/routes/stories
```

`rg` residual audit mandatory.

## CLEAN-6302 — Retire legacy Reminder naming/control paths

After compatibility consumers are gone:

- ControlMode;
- groupId one-to-many semantics;
- legacy trigger scanner;
- duplicate smart frequency auto mutation;
- responseTime overloaded snooze semantics;
- obsolete routes/components.

Physical package rename `reminder -> routine` is a separate final decision; do not mix with behavior migration if it adds churn.

## CLEAN-6303 — Internalize raw ScheduleTask product surfaces

No ordinary user API/UI should create worker jobs directly.

Keep internal diagnostics/ops API only if genuinely used.

## CLEAN-6304 — Scheduler physical package split decision

Only now consider:

```text
packages/schedule   = Planner/Calendar
packages/scheduler  = Temporal Engine
```

Do this only if semantic ownership is already stable; otherwise defer physical moves.

## POC-6401 — pg-boss build-vs-adopt experiment

**Depends:** all feature packages behind SchedulingPort.

Implement alternate adapter PoC and compare:

```text
claim correctness
retry/backoff
DLQ/redrive
heartbeat/expiration
transaction enqueue
multi-worker
startup/recovery
ops complexity
PowerSync/Desktop implications
```

Outcome must be one of:

```text
Keep custom
Adopt pg-boss cloud
Hybrid cloud pg-boss + local adapter
```

No feature code changes allowed in PoC.

---

# 14. Wave 7 — Hardening and closure

## HARD-7101 — Cross-domain failure matrix

Must test:

```text
event handler failure -> outbox fallback
projection event lost -> reconcile repair
reconcile transaction crash
scheduler worker crash
lease expiry
same schedulingKey duplicate
stale invocation
handler business skip
handler technical retry
NotificationRequested replay
channel disabled
DND
rate limit
device offline
Desktop restart
API restart
Routine local runtime restart
Protocol session restart
clock/timezone/DST
Task outcome correction
Goal settlement replay/revert
Planner command failure -> visual revert
```

## HARD-7102 — Architecture governance locks

Add/extend checks:

```text
Goal/Task/Routine packages cannot import ScheduleTask aggregate
Scheduler core cannot import Goal/Task/Routine/Notification domain
SourceModule cannot drive execution switch
no hardcoded Timezone.Shanghai fallback
no production Reminder trigger scanner
Notification multichannel path must use delivery planning
third-party recurrence/calendar DTOs cannot enter contracts
UI cannot edit ScheduledInvocation directly
```

## HARD-7103 — Full product acceptance journeys

Run fixtures A-J through:

- focused package tests;
- API integration;
- Desktop integration;
- Web E2E;
- local Docker product journey;
- production-like schema boot.

## HARD-7104 — Documentation / ADR closure

Update:

- ADR-003 historical status vs ADR-033/064;
- ADR-053~064 implementation status;
- module product docs;
- module file indexes;
- feature map;
- Active Plan status;
- migration notes;
- reuse ledger final decisions;
- actual validation evidence.

## HARD-7105 — Final batch review and focused repair

Review five layers:

1. contract correctness;
2. vertical completeness;
3. behavioral completeness;
4. engineering quality;
5. plan integrity.

P0/P1 findings create focused repair passes before plan archive.

---

# 15. Concrete parallel batch schedule

This is the recommended execution sequence for multiple Agents.

## Batch A — Foundation, maximum parallelism

Start together after W0:

| Worktree                     | Tickets         | Shared train dependency                 |
| ---------------------------- | --------------- | --------------------------------------- |
| `core-vnext/time`            | TIME-1101/1102  | none until dependency proposal          |
| `core-vnext/ui-core`         | UI-1101         | UI Core Train only                      |
| `core-vnext/labels`          | LABEL-1101      | Contract + Schema Train                 |
| `core-vnext/scheduling`      | SCHED-1101~1105 | Contract + Schema + Orchestration Train |
| `core-vnext/notification-p0` | NOTIF-1101/1102 | notification-local                      |

Merge order inside Batch A:

```text
Contract Train
 -> Schema Train
 -> Time/Label/Scheduling feature branches
 -> Notification
 -> UI Core
 -> root validation
```

## Batch B — Business domains

Start together after W1 gate:

| Worktree                       | Tickets           |
| ------------------------------ | ----------------- |
| `core-vnext/goal-domain`       | GOAL-2101~2103    |
| `core-vnext/task-domain`       | TASK-2201~2204    |
| `core-vnext/routine-domain`    | ROUTINE-2301~2303 |
| `core-vnext/notification-fact` | NOTIF-2401/2402   |

TASK-2205 waits for Goal KR + Task Plan contracts.

## Batch C — Vertical integrations

Parallel:

```text
Task scheduling
Goal scheduling
NotificationRequested runtime
Task->Goal settlement
```

Then:

```text
Routine wall-clock
shadow cutover
common projection repair
```

## Batch D — Independent product engines

Parallel:

```text
Routine local runtime + windows
Planner FullCalendar adapter
Goal UI
Task UI primitives/queries
Notification UI groundwork
```

Goal/Task final page merge waits on relevant contracts, but Storybook/product skeleton work can begin earlier using fixture DTOs.

## Batch E — Product completion

Parallel:

```text
Goal surface
Task surface
Routine surface
Planner surface
Notification surface
AI alignment
Mobile parity
```

## Batch F — Deletion / hardening

Use fewer workers because shared files become dominant:

```text
legacy deletion
physical split decision
pg-boss PoC
failure matrix
governance
full E2E
```

---

# 16. Merge and review protocol

Every ticket/branch must report:

```text
1. Base revision
2. Intended protected contracts
3. Files changed
4. Build/Borrow/Imitate source
5. Focused tests run
6. Wider tests run
7. Known not-run checks
8. Contract/schema train dependency
9. Residual TODOs explicitly outside ticket
```

Merge rules:

- no branch merges with unrelated formatting churn;
- generated Prisma output only from Schema Train;
- package lock changes only when dependency ticket requires them;
- dependency addition carries license/adapter evidence;
- destructive deletion follows consumer inventory and parity test;
- no “temporary” dual path without deletion ticket and gate.

---

# 17. Verification command matrix

Actual target names must be confirmed with `nx show project` at execution time.

Core focused commands:

```bash
pnpm nx run utils:test
pnpm nx run patterns:test
pnpm nx run contracts:typecheck
pnpm nx run time:test
pnpm nx run goal:test
pnpm nx run task:test
pnpm nx run reminder:test
pnpm nx run schedule:test
pnpm nx run schedule-orchestration:test
pnpm nx run notification:test
```

Host / UI:

```bash
pnpm nx run api:typecheck
pnpm nx run api:test
pnpm nx run api:test:smoke
pnpm nx run desktop:typecheck
pnpm nx run app-vue:typecheck
pnpm nx run app-vue:test
pnpm nx run app-react:typecheck
pnpm nx run app-react:test
```

Repository gates:

```bash
pnpm typecheck
pnpm test:affected
pnpm lint:affected
pnpm docs:check
pnpm governance:check
```

Final:

```text
Prisma integration
PowerSync parity
Web E2E A-J applicable journeys
Desktop local-runtime journeys
local Docker boot/product journey
production-like schema boot
required CI
```

---

# 18. Risk ledger

| Risk                                                    | Impact                                | Mitigation                                             |
| ------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------ |
| old Task migrated to SchedulingPort before Task vNext   | double migration                      | W2 Task contract freezes before W3 projector migration |
| recurrence library leaks into domain                    | vendor lock / inconsistent time types | `RecurrenceEnginePort` + MemoFlow fixtures             |
| FullCalendar becomes source of truth                    | domain bypass                         | adapter projection + owner command + revert            |
| parallel branches collide on contracts/schema           | merge churn / semantic split          | Contract/Schema Trains single writer                   |
| Reminder Cron removed too early                         | missed routines                       | new handler reliability + shadow due-set compare first |
| Notification policy change suppresses expected messages | product behavior regression           | mixed-channel telemetry/tests + workflow defaults      |
| Routine sensor logic over-expands cross-platform scope  | schedule slip                         | Windows adapter first, stable Port from day one        |
| Plugin ambition reappears                               | scope explosion                       | registries only; runtime/install marketplace deferred  |
| pg-boss adoption distracts from business refactor       | unnecessary infrastructure rewrite    | PoC W6 only after SchedulingPort migration             |
| UI rebuild before contracts stable                      | repeated rewrites                     | W5 hard gate on domain contract readiness              |

---

# 19. Definition of Done

Core vNext can close only when all of the following hold:

## Business

- [ ] Goal = Direction + Measurement, retired project-management concepts gone;
- [ ] KR Measurement V2 is canonical;
- [ ] Task = Action + Execution, occurrence/plan semantics correct;
- [ ] Task Goal link and contribution are separated;
- [ ] Routine Profile/Trigger/Protocol semantics implemented;
- [ ] WallClock and ActiveUsage runtimes are correctly separated.

## Infrastructure

- [ ] EventBus = Emittery fast path; no bus-global drain;
- [ ] standard recurrence engine selected and adapterized;
- [ ] Goal/Task/Routine no longer construct ScheduleTask;
- [ ] stable schedulingKey + atomic reconcile;
- [ ] HandlerRegistry replaces SourceModule execution switch;
- [ ] wall-clock Routine has one scheduler authority;
- [ ] durable NotificationRequested pipeline exists;
- [ ] Notification Fact and Delivery outcome separated;
- [ ] per-channel preference/DND/rate-limit works.

## Product surfaces

- [ ] Planner uses a maintained calendar engine or documented evidence justifies fallback;
- [ ] Planner edits route to owner domains;
- [ ] Goal/Task/Routine/Notification vNext UI implemented;
- [ ] Routine InterventionWindow and FocusWindow validated;
- [ ] Mobile/AI contracts have no retired fields.

## Reuse discipline

- [ ] no custom calendar grid/date picker recurrence engine was unnecessarily rebuilt;
- [ ] dependency/license ledger updated with final decisions;
- [ ] GPL/AGPL references were not copied into incompatible product code;
- [ ] third-party DTOs/types stay behind adapters.

## Quality

- [ ] fixtures A-J pass where applicable;
- [ ] failure matrix passes;
- [ ] API/Desktop/PowerSync/Prisma parity passes;
- [ ] full governance/docs checks green;
- [ ] residual grep proves legacy dual paths removed;
- [ ] final batch review has no P0/P1 unresolved finding.

---

# 20. Immediate next implementation batch

Do **not** start by rewriting Goal or Task pages.

The next executable batch is:

```text
CORE-0001~0005       orchestration baseline
        ↓
TIME-1101/1102       time + recurrence selection       ┐
UI-1101              shared date/time primitives        │ parallel
LABEL-1101           shared labels                      │
SCHED-1101~1105      neutral scheduling foundation      │
NOTIF-1101/1102      notification P0 correctness        ┘
```

After that foundation gate, open three parallel domain worktrees:

```text
Goal domain
Task domain
Routine domain
```

This ordering deliberately avoids migrating the old Task model into new scheduling infrastructure and then rewriting the projector again.
