---
tags:
  - product
  - module
  - goal
description: 目标模块当前功能资产说明
created: 2026-06-02T00:00:00
updated: 2026-08-25T14:28:00+08:00
---

# 目标模块说明

## 1. 功能定位

目标模块用于帮助用户建立 OKR 式目标体系，围绕目标、关键结果、进度记录、复盘和专注执行形成闭环。它是任务、日程、仪表盘和 AI 目标生成能力的重要业务落点。

## 2. 当前功能说明

- 目标管理：创建、编辑、激活、完成、归档、删除和克隆目标。
- 关键结果：为目标添加 KR，维护 KR 权重、进度、数值类型和计算方式。
- 目标记录：记录目标执行过程中的阶段性进展。
- 目标复盘：为目标新增、查看、更新和删除复盘内容。
- 目标文件夹：按文件夹组织目标，并维护文件夹相关状态。
- 专注模式：围绕目标启动、延长、暂停、恢复、取消或完成专注会话。
- 多目标对比：在前端提供目标对比视图和相关统计展示。
- AI 创建目标：通过 AI Chat 的 goal mode 生成结构化目标草稿，再由用户确认后写入目标模块。

## 3. 用户路径

- 常规目标路径：用户进入目标页，创建目标，添加关键结果，持续更新进度或记录，阶段结束后完成或归档目标。
- 目标复盘路径：用户从目标详情进入复盘创建页，填写复盘内容，再从复盘详情查看历史总结。
- 专注执行路径：用户进入目标专注入口，选择当前目标，启动专注会话，并在结束后沉淀执行结果。
- AI 创建路径：用户进入 AI Chat，切换到 goal mode，根据对话生成目标草稿，编辑确认后创建真实目标和关键结果。
- 移动端路径：移动端提供目标列表、详情、编辑、关键结果、复盘、复盘详情和对比入口。

## 4. 业务规则

- Goal 是目标模块核心聚合，Key Result、Goal Record、Goal Review 与目标关联。
- Goal 是 Goal/KR/Record/Review 写入的唯一一致性边界。创建 Goal 与初始 KR、记录进度、批量更新权重均通过一个聚合命令在一个事务中提交；调用方不得串联多个写入模拟事务。
- 修改既有聚合必须携带 Goal root `expectedVersion`；旧版本写入返回显式冲突，不允许静默覆盖。
- mutation 返回权威 `GoalMutationReceipt`。客户端按 ID 归一化实体并通过 `applyGoalMutationReceipt()` 原子合并；列表、详情、Dashboard 与 Task picker 共用同一摘要投影。
- Goal 摘要不持久化为第二份真值；进度、KR 数量与完成数从完整 KR 集合投影。客户端只保存 `selectedGoalId`，不保存 `currentGoal` 对象副本。
- Goal 状态、Goal Folder 类型、Review 类型、KR 值类型、KR 计算方式、Focus Session 状态等值对象集中在 contracts 和 goal 包中维护。
- 写入真实目标数据时，业务归属仍在 `goal` 模块；AI 模块只产出可审阅的结构化草稿或计划。
- 客户端通过 HTTP 或 IPC 适配器访问目标能力，服务端通过模块组合根装配用例和仓储实现。
- 当前仓库处于活跃开发期，文档发现的历史兼容问题不默认要求数据迁移路径。

## 5. 相关文件索引

详细文件清单见 [目标模块文件索引](../module-index/goal-files.md)。

## 6. 当前边界

- 普通目标管理、专注模式、复盘、记录、对比和 AI 创建目标共享 Goal 聚合，但各产品入口仍需保持清晰。
- 目标复盘的产品价值、入口时机和结构化程度需要进一步确认。
- AI Goal workflow 与传统目标创建使用同一原子聚合命令；AI 只能提交可审阅草稿或经确认调用 Goal 端口。
- Task 完成贡献通过 Task outbox 至少一次投递，Goal 侧以来源相关性幂等消费；Task 不直接访问 Goal repository。
- 目标、任务、日程、Dashboard 之间联动较强；跨模块展示必须消费权威 read model，不能维护标题或摘要快照。

## 7. 优化机会

- 统一目标详情中的进度、记录、复盘和关键结果信息结构，让目标当前状态更容易理解。
- 强化目标复盘入口和复盘结果回流，让复盘不是孤立文本。
- 梳理目标与任务、日程的联动，明确哪些目标变化应触发任务或日程侧更新。
- 以 AI Chat Goal Tool 为主线，继续吸收 automation 的计划、确认、执行和结果回放能力。
- 为 Dashboard 提供更稳定的目标读模型或投影说明，减少跨模块临时拼装。

## 8. 风险点

- 目标状态流转会影响列表、详情、专注模式、Dashboard 和自动归档逻辑。
- KR 权重和进度计算会影响目标进度展示、多目标对比、图表和复盘分析。
- 目标复盘结构调整可能影响已有复盘编辑、详情展示和数据模型。
- AI 创建目标涉及 AI 模块、目标模块和前端编辑确认链路，不能让 AI 直接绕过业务模块写入。
- HTTP、IPC、Prisma 和 PowerSync 适配器同时存在，索引和测试需要覆盖多运行时边界。

## 9. 后续待确认

- 目标复盘是否要成为目标完成后的强引导动作。
- 目标记录和目标复盘在产品语义上如何区分。
- 专注模式是否属于目标模块核心能力，还是应作为执行体验沉淀到单独模块。
- 目标与任务绑定的主业务入口应放在目标侧、任务侧，还是 AI/计划侧。
- Dashboard 对目标数据的依赖是否需要专门的读模型契约。

## 10. 相关资料

- [AI 创建 Goal 当前工作流说明](../../guides/development/ai-goal-creation-current-workflow.md)
- [Goal workflow v1 文档集](../../guides/ai/goal-workflow-v1/README.md)
- [目标模块文件索引](../module-index/goal-files.md)

## 11. Goal / Task vNext 已采纳方向（2026-08-25）

本文件 1-10 节继续描述**当前实现资产**。下一阶段已采纳的目标模型不再继续扩展 Folder / Category / Focus / Comparison，而是收敛到个人 `Direction + Measurement`：

- GoalFolder、Category、Parent Goal、Importance/Priority、Focus、Comparison 退役；
- Shared Label 成为唯一用户分类体系；
- `目标日期` 产品文案改为 `截止日期`；
- KR 删除 `valueType`，采用 Measurement V2；
- weight 保留 1-5 相对系数、默认 3，并移入高级设置；
- Goal overall progress 与“所有 KR 是否满足”分离；
- Goal 与 Task 保持模块独立，通过 Goal/KR link、GoalRecord contribution 和 deep-link 自然连接；
- Review 收敛为带系统快照的轻量反思记录。

正式决策与实施顺序见：

- [ADR-053: Goal / Task 个人产品边界与信息架构收敛](../../architecture/adr/ADR-053-goal-task-personal-product-boundary.md)
- [ADR-054: Shared Labels 与 System Views 分离](../../architecture/adr/ADR-054-shared-labels-and-system-views.md)
- [ADR-055: Key Result Measurement & Progress V2](../../architecture/adr/ADR-055-key-result-measurement-progress-v2.md)
- [ADR-056: Task Plan → Goal Link / Contribution / Settlement](../../architecture/adr/ADR-056-task-plan-goal-link-contribution-settlement.md)
- [Goal / Task vNext 产品设计](../goal-task-vnext.md)
- [Goal / Task vNext Active Plan](../../plan/active/2026-08-25-goal-task-vnext-refactor.md)
- [ADR-058: OSS-first 标准能力复用与领域所有权边界](../../architecture/adr/ADR-058-oss-first-standard-capability-reuse.md)
