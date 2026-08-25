---
tags:
  - product
  - module
  - task
description: 任务模块当前功能资产说明
created: 2026-06-02T00:00:00
updated: 2026-08-25T15:03:00+08:00
---

# 任务模块说明

## 1. 功能定位

任务模块用于帮助用户把目标拆解为可执行的日常行动。它围绕任务模板、任务实例、任务依赖、目标绑定和 DAG 可视化形成闭环，是目标执行落地和日程调度的核心输入源。

## 2. 当前功能说明

- 任务模板管理：创建、编辑、激活、暂停、归档和删除任务模板。
- 任务实例生成：根据模板的周期规则和时间配置自动生成任务实例，支持一次性和周期性任务。
- 任务实例执行：启动、完成、跳过和删除任务实例，记录实际执行时间和完成备注。
- 任务依赖：在任务模板之间建立前后置依赖关系，支持依赖链查询和循环检测。
- DAG 可视化：以有向无环图展示任务依赖结构，提供关键路径分析。
- 目标绑定：将任务模板绑定到目标或关键结果，支持按完成进度或记录值触发目标进度更新。
- 子任务：任务模板支持自引用的子任务层级。
- 任务文件夹：按文件夹组织任务模板，维护文件夹排序。
- 任务统计：按账户聚合任务模板和实例的多维度统计数据。
- 任务过期检查：批量检查并标记过期的任务实例。
- AI 任务生成：前端提供 AI 任务生成对话框入口。

## 3. 用户路径

- 常规任务路径：用户进入任务管理页，创建任务模板，配置时间、周期和提醒，激活模板后系统自动生成实例，用户在实例列表中启动、完成或跳过任务。
- 依赖管理路径：用户从任务模板进入依赖管理，添加前后置依赖，查看 DAG 图和关键路径，系统自动检测循环和阻塞状态。
- 目标绑定路径：用户在任务模板编辑中选择绑定目标和关键结果，配置进度触发条件，任务完成后自动更新目标进度。
- 任务详情路径：用户从任务列表进入任务详情，查看模板基本信息、实例历史、依赖关系和完成统计。
- 移动端路径：移动端提供任务列表（含搜索、状态筛选、排序）、任务编辑和任务详情（含实例、依赖、完成/跳过操作）入口。

## 4. 业务规则

- TaskTemplate 是任务模块核心聚合，TaskInstance 和 TaskDependency 与模板关联。
- TaskTemplate 状态流转：Active 可暂停为 Paused；Active/Paused 可归档为 Archived；Paused/Archived 可重新激活为 Active；任意非 Deleted 模板可软删除为 Deleted，Deleted 可恢复为 Active。Archived 不是终态。
- TaskInstance 生命周期：Pending → InProgress → Completed/Skipped/Expired。
- 任务依赖必须满足无环约束，通过 DFS 算法检测循环。
- 优先级计算公式：`Priority = Importance × 0.6 + (1 / TimeRemaining) × 0.4`，返回 0-100 分。
- 目标绑定通过 TaskGoalBinding 值对象维护，包含 goalId、keyResultId、goalRecordValue 和 progressTrigger。
- Task Goal binding 在数据库中展开为关系字段并受 Goal/KR 外键与归属校验约束；不保存 `goalBinding` JSON、Goal/KR 标题或对象快照。展示名称通过 Goal read port 按 ID 解析，缺失关联显示明确的不可用状态。
- TaskInstance 完成状态与自包含的 Goal contribution outbox event 在同一 Task 事务提交。dispatcher 至少一次投递；Goal handler 以 event/source correlation 幂等处理，重复投递不会重复增加 KR 进度。
- Task 与 Goal 保持模块边界：Task 不调用 Goal repository，也不尝试跨模块共享数据库事务。
- 周期性任务支持 Daily、Weekly、Monthly、Yearly 频率，可配置结束条件。
- 提醒配置支持绝对时间和相对时间（锚点时间前 N 分钟）两种模式。
- 客户端通过 HTTP 或 IPC 适配器访问任务能力，服务端通过模块组合根装配用例和仓储实现。

## 5. 相关文件索引

详细文件清单见 [任务模块文件索引](../module-index/task-files.md)。

## 6. 当前边界

- 任务模板和任务实例的生命周期边界需要在优化前明确，特别是模板暂停/归档对已生成实例的影响。
- 任务依赖的 DAG 可视化和关键路径分析目前仅在前端实现，缺少服务端投影支持。
- 目标绑定由 Task 聚合持有 ID 与贡献参数；Goal 对进度写入拥有最终校验和一致性责任。
- 任务统计（TaskStatistic）模型字段较多（30+），需要确认哪些维度是用户真正需要的。
- AI 任务生成入口目前只在前端有对话框，后端 AI 模块的 task workflow 集成尚不完整。

## 7. 优化机会

- 统一任务模板编辑表单的验证逻辑，当前分散在多个 composable 中。
- 强化任务依赖的业务价值展示，让 DAG 和关键路径不只是开发工具。
- 梳理任务与目标绑定的完整链路，明确哪些任务变化应触发目标侧更新。
- 为 Dashboard 提供更稳定的任务读模型，减少跨模块临时拼装。
- 考虑任务实例的批量操作能力，当前只支持单个实例的完成/跳过/启动。

## 8. 风险点

- 任务模板状态流转会影响实例生成、依赖阻塞和目标绑定。
- 任务依赖变更对 DAG、关键路径和日程执行的影响范围较大。
- 目标绑定变更会影响目标进度计算和用户行动闭环。
- 周期性任务的实例生成策略变更会影响已有实例和提醒调度。
- HTTP、IPC、Prisma 和 PowerSync 适配器同时存在，索引和测试需要覆盖多运行时边界。
- Schedule 模块通过 `SourceModule.Task` 消费任务事件创建调度任务，任务事件变更会影响调度侧。

## 9. 后续待确认

- 任务模板暂停/归档时，已生成的待执行实例应如何处理。
- 任务依赖是否需要支持跨模板组的批量依赖设置。
- 目标绑定的主业务入口应放在任务侧还是目标侧。
- AI 任务生成是否需要与 AI 模块的 task workflow 深度集成。
- Dashboard 对任务数据的依赖是否需要专门的读模型契约。

## 10. 相关资料

- [目标模块说明](./goal.md)
- [日程模块说明](./schedule.md)
- [任务模块文件索引](../module-index/task-files.md)

## 11. Goal / Task vNext 已采纳方向（2026-08-25）

本文件 1-10 节继续描述**当前实现资产**。下一阶段 Task 不再以 `TaskTemplate management + DAG` 为默认用户心智，而是收敛到个人 `Action + Execution`：

- Task 首页改为 Today / Upcoming / All / Completed 的 Task instance-first 体验；
- `快速任务` 与 `新建任务计划` 合并为 `新建任务`；
- recurrence 继续保留，重复设置进入渐进式披露与二级管理；
- TaskFolder、parent hierarchy、Dependency/DAG/CriticalPath、dynamic priority score 退役；
- Shared Label 取代 TaskFolder / JSON string tags；
- Goal/KR Link 与 automatic Contribution 解耦；
- 保留并产品化 `EachCompletion` / `PlanCompletion` 两种贡献结算；
- `PlanCompletion` 仅允许 finite recurrence，继续使用 ADR-038 的 durable outbox / idempotent GoalRecord 基础设施。
- `Expired` instance status 退役；Overdue 改为派生事实，过期后仍允许补录；
- occurrence 新增 `Missed`，并与 `Skipped`（豁免/不适用）严格区分；
- Task Plan 增加 success/failure/abandon outcome：Failed 由 completion policy 推导，Abandoned 由用户显式触发，Delete 只处理误创建。

正式决策与实施顺序见：

- [ADR-053: Goal / Task 个人产品边界与信息架构收敛](../../architecture/adr/ADR-053-goal-task-personal-product-boundary.md)
- [ADR-054: Shared Labels 与 System Views 分离](../../architecture/adr/ADR-054-shared-labels-and-system-views.md)
- [ADR-055: Key Result Measurement & Progress V2](../../architecture/adr/ADR-055-key-result-measurement-progress-v2.md)
- [ADR-056: Task Plan → Goal Link / Contribution / Settlement](../../architecture/adr/ADR-056-task-plan-goal-link-contribution-settlement.md)
- [ADR-057: Task Occurrence Outcome、Overdue 与 Task Plan 生命周期](../../architecture/adr/ADR-057-task-occurrence-outcome-and-plan-lifecycle.md)
- [Goal / Task OSS 直接复用与可插拔可行性评估](../../analysis/2026-08-25-goal-task-oss-reuse-feasibility.md)
- [Goal / Task vNext 产品设计](../goal-task-vnext.md)
- [Goal / Task vNext Active Plan](../../plan/active/2026-08-25-goal-task-vnext-refactor.md)
- [ADR-058: OSS-first 标准能力复用与领域所有权边界](../../architecture/adr/ADR-058-oss-first-standard-capability-reuse.md)
