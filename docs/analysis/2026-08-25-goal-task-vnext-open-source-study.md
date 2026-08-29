---
tags:
  - analysis
  - product
  - goal
  - task
  - ui
  - open-source
  - reference
description: Goal/Task vNext 开源产品与源码模式研究，记录可借鉴交互、领域边界、代码模式与许可证边界
created: 2026-08-25T14:28:00+08:00
updated: 2026-08-25T15:44:00+08:00
---

# Goal / Task vNext 开源参考研究

## 1. 研究目的

本研究不是寻找一个项目整套照搬，而是回答 MemoFlow Goal / Task vNext 的几个具体问题：

1. 个人产品是否可以用 Label 取代 Folder / Category？
2. 系统状态筛选与用户 Label 应如何分离？
3. 重复任务应当如何建模，用户是否需要理解 Template/Instance？
4. Goal 的 outcome 与 Task 的 execution 如何保持关联但不合并？
5. 主页面应该展示“定义/配置”，还是“今天真正要执行的实例”？
6. 哪些源码模式值得学习，哪些由于产品定位或许可证不应复制？

结论服务于：

- ADR-053：Goal/Task 产品边界；
- ADR-054：Shared Labels；
- ADR-055：KR Measurement V2；
- ADR-056：Task Plan Contribution；
- `docs/product/goal-task-vnext.md`；
- `docs/plan/archive/2026-08-25-goal-task-vnext-refactor.md`。

## 2. 参考项目总览

| 项目               | 重点借鉴                                                                  | 明确不照搬                                         | License / 复用策略                            |
| ------------------ | ------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------- |
| Vikunja            | first-class labels、inline create、filter、关系型 label assignment        | Project/Kanban/Gantt 作为 Goal 组织主线            | AGPL-3.0-or-later：借鉴行为/模型，不复制实现  |
| Super Productivity | Today/system view 与 Tag 分离、repeat config -> instances、轻量任务主视图 | 大量 integrations/time tracking/project surface    | MIT：可研究源码；实际复用仍需 notice/边界审查 |
| Tasks.org          | 简单创建 + 高级 recurrence/filter 渐进披露、有限重复次数                  | 无限层级/list customization 直接进入 MemoFlow 核心 | GPLv3：借鉴行为，不复制实现                   |
| Leantime           | Goal/Metric = outcome，Milestone/Task = delivery；二者同时看              | 企业 Project/Milestone/Gantt/team workflow         | AGPLv3：借鉴产品分层，不复制实现              |
| Vicu               | Smart Lists、Quick Add token -> dismissible chips                         | 作为核心 architecture 参考                         | 第三方小项目，仅作 UI 灵感                    |

> MemoFlow 当前仓库未声明一个可据此直接接受 AGPL/GPL 代码的许可证策略。实现计划默认“clean-room reimplementation of behavior”，不粘贴 copyleft 项目源代码。

## 3. Vikunja：Label 是跨结构的用户分类，不是文件夹替代皮肤

参考：

- https://vikunja.io/help/labels/
- https://vikunja.io/help/filters/
- https://github.com/go-vikunja/vikunja/blob/main/pkg/models/tasks.go
- https://github.com/go-vikunja/vikunja

### 3.1 产品层观察

Vikunja 的 Label：

- 可跨多个 Project 使用；
- 有独立的 title / color / description；
- 在 task 中可以搜索已有 label；
- 输入不存在的 label 可以即时创建；
- Label 可参与 filter / saved filter；
- 点击某 Label 可以看到跨 Project 的 task。

这说明成熟产品不会把 Label 当作一个 `string[]` 小字段，而是把它当作用户自己的分类词汇表。

### 3.2 源码层观察

`pkg/models/tasks.go` 的 Task model 把 labels 作为 read-only projection：

```text
Labels []*Label
```

并明确要求通过独立 label-task endpoints 改 assignment，而不是把 label payload 直接混进任意 Task update。

其读取流程也会批量：

```text
GetLabelsByTaskIDs(...)
-> map back to taskMap
```

对 MemoFlow 的启发：

- Label identity/metadata 与 Goal/Task aggregate 分开；
- Goal/Task DTO 可以投影 `labels[]`，但 assignment 有自己的关系表；
- 不继续把 `tags: string[]/JSON` 当长期真值；
- 一次列表 query 要避免 N+1，可通过 join/batch projection 解决。

### 3.3 Filter 观察

Vikunja filter 支持字段 + operator + value，并支持组合 `&&`/`||`。

MemoFlow 不需要复制完整 DSL，但应该学习“筛选是 projection/query concern”，不要把“系统视图”写成实体标签。

Goal vNext 第一版只需要：

```text
system view + labelsAll[]
```

Task vNext 第一版：

```text
Today/Upcoming/All/Completed + labelsAll[]
```

### 3.4 不照搬

Vikunja 的 Project、sub-project、Kanban、Gantt、saved-filter DSL 对个人 MemoFlow Goal 都过重。

**借 Label，不借 Project hierarchy。**

## 4. Super Productivity：系统派生 Today 与用户 Tag 是两种事实

参考：

- https://github.com/super-productivity/super-productivity
- https://github.com/super-productivity/super-productivity/blob/master/ARCHITECTURE-DECISIONS.md
- https://github.com/super-productivity/super-productivity/blob/master/src/app/features/task-repeat-cfg/task-repeat-cfg.model.ts
- https://github.com/super-productivity/super-productivity/blob/master/docs/wiki/4.05-Board-View.md

### 4.1 TODAY_TAG virtual pattern

Super Productivity 的 architecture decisions 明确规定：

```text
TODAY_TAG membership 由 dueDay/dueWithTime 决定
TODAY_TAG.id 不得写入 task.tagIds
```

这是一个非常重要的 single-source-of-truth pattern。

对 MemoFlow：

```text
Goal Active / Completed
Task Today / Upcoming
```

都应该来自状态/日期，而不是创建隐藏 label：

```text
#today
#active
#completed
```

否则当日期/状态变化时需要同步两份事实。

### 4.2 Projects / Tags / Boards 分工

Super Productivity 文档明确：

- Project = structural assignment；
- Tag = cross-cutting categorization；
- Board = dynamic visual/filter layer。

MemoFlow 的个人 Goal 数量少，因此不需要复制 Project structural layer；只保留 cross-cutting Label + system view 即可。

### 4.3 Repeat config 与实例分离

`task-repeat-cfg.model.ts` 把 recurrence 作为独立 config 保存：

```text
repeatCycle
repeatEvery
startTime
isPaused
...
```

其 2026 年维护讨论也明确解释：重复配置是“定义何时生成任务的规则”，而不是一次性生成未来所有 task。

这与 MemoFlow 当前 `TaskTemplate -> TaskInstance` 的领域方向一致。

MemoFlow 应当保留这种内部模型，但 UI 不应该强迫用户理解 Template/Instance。

### 4.4 源码教训：重复日期计算是高风险领域

Super Productivity 2026 的 recurrence refactor issue 明确指出 recurrence 包含：

- DST；
- leap year；
- month end；
- deleted instance；
- wait for completion；
- overdue skip。

MemoFlow 重构 UI 时不要顺手重写 recurrence date math。应保留现有已测试的 recurrence value object / generation policy，只重构产品表达与必要的 completion settlement。

### 4.5 不照搬

Super Productivity 有 timeboxing、time tracking、projects、boards、Pomodoro、integrations 等大量能力。Goal/Task vNext 不因此扩大范围。

## 5. Tasks.org：高级能力存在，但默认路径应保持简单

参考：

- https://tasks.org/docs/
- https://tasks.org/docs/filters/
- https://tasks.org/docs/recurrence/

### 5.1 Custom filters

Tasks.org 支持：

```text
AND
NOT
OR
```

以及 due date、priority、title、tags、lists 等 criteria。

值得借鉴的不是把 filter builder 搬进 MemoFlow，而是：

> 简单默认视图与高级组合能力可以分层存在。

MemoFlow Goal 第一版不需要 Search + Folder + Category + Compare；只用 System View + Label AND。

### 5.2 Recurrence

Tasks.org 对 recurrence 的 UI 是从：

```text
Does not repeat
```

进入 preset/custom，而不是先让用户选择一个 `TaskType`。

支持：

```text
Never
On date
After X occurrences
```

这直接验证了 MemoFlow `endDate / occurrences` 的有限计划语义。

对“15 天二课打卡”：

```text
Repeat daily
Ends after 15 occurrences
```

是用户自然语言层最合理的表达。

### 5.3 repeat from due date / completion date

Tasks.org 还区分从 scheduled due date 或 previous completion 推下一次。

MemoFlow 当前不必立即引入这个维度，但应把它记录为 recurrence future extension；不要通过临时 patch 改 next occurrence 算法。

## 6. Leantime：Goal 追 outcome，Milestone/Task 追 delivery

参考：

- https://github.com/Leantime/leantime
- https://support.leantime.io/en/article/setting-and-managing-goals-in-leantime-vlps68/
- https://docs.leantime.io/installation/frequently-asked-questions

### 6.1 Goal metric

Leantime 的 Goal 使用：

```text
Starting Value
Current Value
Goal Value
Metric Type
```

同时可以关联 Milestone，形成：

```text
Goal actual metric
+ Milestone execution progress
```

其文档强调一个很有价值的诊断：

> 如果 milestone 按计划推进，但 goal metric 没改善，说明执行策略可能有问题。

这证明 Goal outcome 与 execution progress 不应该合并成一个数字。

### 6.2 对 MemoFlow 的取舍

MemoFlow 不需要 Leantime 的完整 Milestone 层，因为 Task Plan 已经能够表达“有限的一组重复行动”。

借鉴的是边界：

```text
Goal/KR = actual outcome
Task/TaskPlan = execution
```

Goal 页面显示关联 execution 摘要可以帮助解释进度，但不能把 Task completion percentage 冒充成 KR outcome。

## 7. Vicu：Smart Lists 与 Quick Add 的轻量 UI 灵感

参考：

- https://github.com/rendyhd/Vicu

Vicu 提供：

```text
Inbox
Today
Upcoming
Anytime
Logbook
```

并把 quick-add 语法解析成可删除的 chips。

MemoFlow 可以借其“system smart list 是 task home 的主要导航”思路，但不需要复制其 syntax。

未来可以考虑：

```text
新建任务输入标题后
日期 / 重复 / Label / Goal link
作为紧凑 chips 逐步增加
```

当前先使用标准表单，避免同时引入自然语言 parser。

## 8. MemoFlow 现状映射

### 8.1 已经值得保留的基础

当前 MemoFlow 已经有：

- Goal aggregate + optimistic version；
- KeyResult / GoalRecord；
- TaskTemplate / TaskInstance；
- finite recurrence (`endDate` / `occurrences`)；
- Task completion durable outbox；
- Goal source correlation 幂等；
- uncomplete rollback；
- Goal/KR binding relation fields；
- Web/Desktop adapters。

这些都不是要推倒的部分。

### 8.2 当前明显应删除的过度能力

Goal：

```text
Folder
Category
Parent Goal
rollup policy
Importance / priority
Focus
Comparison
ValueType
Review type/rating/title
```

Task：

```text
Folder
Parent Task hierarchy
Dependency graph
4 dependency types
Critical Path
relation filters
Importance + dynamic priority score
```

### 8.3 当前需要语义修复而非删除的能力

```text
ALL_INSTANCES_COMPLETED
```

应提升为：

```text
PlanCompletion
```

它正好表达课程/活动/连续打卡完成后才结算成果。

## 9. UI 可直接借鉴的交互清单

### 9.1 Label picker

借 Vikunja：

```text
标签
[#工作] [#AI] [+]

打开 picker：
[搜索或创建标签...]
✓ 工作
✓ AI
  健康

Create “二课”
```

### 9.2 System view + label filter

借 system smart list / virtual Today pattern：

```text
Goal:
[进行中 5 ▾] [标签 2 ▾]

Task:
[今天 5] [即将到来] [全部] [已完成] [标签 ▾]
```

### 9.3 Recurrence

借 Tasks.org 的渐进披露：

```text
重复 [不重复 ▾]

每天
每周
每月
自定义...
```

Custom 才显示：

```text
每 N 天/周/月
星期选择
结束：永不 / 日期 / N 次
```

### 9.4 Goal/Task link

MemoFlow 自有语义：

```text
关联目标（可选）
毕业 / 二课分达到 50 分

[ ] 完成任务后自动更新关键结果
```

不要继续使用：

```text
启用关键结果关联
progress trigger
points
```

## 10. 代码实现参考清单

### 10.1 可以直接学习的 pattern

- Relation-backed Label registry；
- batch label projection；
- system view membership computed from authoritative status/date；
- recurrence config 与 generated instance 分离；
- advanced settings progressive disclosure；
- filter behavior tests 固定 AND/OR 语义；
- Goal outcome 与 execution status 分开显示。

### 10.2 不应复制的具体代码

- Vikunja Go label/filter implementation（AGPL）；
- Tasks.org GPL Kotlin implementation；
- Leantime AGPL PHP implementation。

实现时只把行为写成 MemoFlow 自有 contracts/tests，然后按 DDD/Prisma/PowerSync 架构重新实现。

### 10.3 可评估 MIT 复用的部分

Super Productivity 是 MIT。若发现某个独立、低耦合 recurrence utility 或 UI pattern 真正值得复用：

1. 先确认具体文件仍为 MIT；
2. 保留版权/License notice；
3. 确认引入后不会带来 Angular-specific coupling；
4. 对照 MemoFlow `@memoflow/time` 和 ADR-037，避免引入第二套日期系统。

大多数情况下，学习测试矩阵与 domain pattern 比直接复制代码更划算。

## 11. 最终研究结论

开源项目共同支持一个方向：

```text
简单主路径
+ 强大的内部模型
+ 高级能力渐进披露
+ 用户标签与系统视图分离
+ outcome 与 execution 分离
```

因此 MemoFlow vNext 不应该继续“增加一个功能页来解释已有复杂度”，而应该删除重复概念，把已有可靠 Task/Goal 基础设施放在更薄、更符合个人心智的 UI 后面。

## 12. 补充：Occurrence outcome / Overdue OSS 对照（15:03 审查）

进一步对 Loop Habit Tracker、Vikunja、Taskwarrior、Super Productivity、Tasks.org 与 Plane 的状态语义复审后，vNext 新增以下结论：

```text
Task occurrence:
Pending / InProgress / Completed / Missed / Skipped

Overdue = derived fact, not terminal status

Task Plan:
lifecycle = Active / Paused / Closed
outcome = Open / Succeeded / Failed / Abandoned
```

关键原因：

- Loop 证明“尚未记录 / 明确没做 / 跳过”需要分开；
- Vikunja 与 Taskwarrior 都把 overdue 建模为未完成 + 时间经过的派生条件，而不是不可逆失败；
- recurrence 产品普遍把 plan/config 与 occurrence 分层；
- completed 与 cancelled/abandoned 是不同业务结果；
- 因此 MemoFlow 当前 `Expired` 应退役，新增 `Missed`；普通 instance 不增加泛化 `Failed`。

正式决策见 [ADR-057](../architecture/adr/ADR-057-task-occurrence-outcome-and-plan-lifecycle.md)。

## 13. 补充：是否直接组装开源产品

不能把“开源”自动理解成“可作为库嵌入”。本轮另行盘点了 maintenance、license 与真正的 plugin/library/API seam：

- Vikunja：stable + active，REST API v2 很适合作为外部 service seam；plugin 仍 experimental 且 backend-only；
- Super Productivity：MIT 且已有正式 plugin API / extracted packages，是最值得检查真正源码级复用的候选；
- Leantime：有正式 plugin system，但方向是“Leantime 做 host”；
- TaskChampion：MIT、Rust/C API，是真正 extracted task storage/sync library；
- Tasks.org / Loop / Plane / Vikunja app source 主要受 GPL/AGPL 约束，更适合作为行为参考或独立服务，而不是复制进 MemoFlow。

详细评估见 [Goal / Task OSS 直接复用与可插拔可行性评估](./2026-08-25-goal-task-oss-reuse-feasibility.md)。

## 14. 调研方法修订：从“模仿 UI”升级为“语义 + 工程化证据”

后续 Goal / Task vNext 的 OSS 调研统一按 ADR-058 执行。对于每个重要参考项目，不只问“页面长什么样”，还要尽量回答：

| 层次                     | 需要提取的证据                                         |
| ------------------------ | ------------------------------------------------------ |
| Business semantics       | 对象、状态、完成/失败/跳过/删除/归档含义               |
| User journey             | 创建、执行、补录、漏做、放弃、恢复、重复任务等路径     |
| Information architecture | 系统视图、标签、详情、设置如何分层                     |
| Domain/state machine     | authoritative state、derived state、invariant          |
| Persistence              | relation/schema/source correlation 等关键持久化方式    |
| API/plugin seam          | 哪些能力是稳定 public interface                        |
| Engineering              | retry、idempotency、migration、offline/sync、upgrade   |
| Tests                    | characterization、state-transition、edge-case fixtures |
| Reuse                    | library/API/plugin/source-copy 中真正可用的 seam       |
| License/maintenance      | 是否可合法低成本进入 MemoFlow 关键路径                 |

实施结论分三类：

```text
Borrow library      -> 标准能力直接复用，adapter 隔离
Borrow semantics    -> 学业务/工程设计，由 MemoFlow clean implementation
Integrate product   -> 只有 stable seam + 明确 external source-of-truth 才做
```

因此本研究的主要价值是帮助 MemoFlow 少发明业务语义、少重复实现标准问题，同时不交出自己的 Goal/Task product truth。
