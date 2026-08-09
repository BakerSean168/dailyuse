# MemoFlow 基础业务模块产品诊断

日期：2026-08-09  
范围：Goal、Plan/Task、Knowledge、Habit + Reminder、Schedule、Notification 投递、Account/Cloud Auth、Settings。未检查 AI、Agent-Host、Workflow、移动端及付费能力。

## 总体判断

核心领域对象和 Result/身份隔离基础较完整，Task→Goal 已有事务写入、durable outbox 和消费幂等；但用户真正感知的“创建后会执行/会收到/删除后会退出/设置可恢复”仍有断裂。最高优先级是恢复提醒触发 runtime、补齐通知投递的可观测失败闭环，以及把账号关闭和认证会话生命周期绑定。

## 1. 目标设定（Goal）

### 现状

Goal use case 覆盖创建、编辑、完成、软删除和归档；完成与删除均要求 `expectedVersion`，仓储用乐观锁保存。GoalRecord 消费 Task outbox，按 identity + source type + source id 做幂等。

### 闭环评估

目标自身 CRUD/完成基本闭环；任务完成对 KR 的贡献闭环可靠。删除前的跨任务依赖检查不完整，可能留下用户仍可见的任务绑定。

### 问题清单

- **P1** 删除依赖检查把任务链接固定报告为不存在：`packages/goal/src/server/application/use-cases/commands/delete-goal.use-case.ts:63-70` 返回 `hasTaskLinks: false`、`canDelete: true`，即使 Goal 仍被 Task binding 引用也不会提示或阻止删除。
- **P1** 完成状态的幂等条件只覆盖“已完成且已归档”：`packages/goal/src/server/application/use-cases/commands/complete-goal.use-case.ts:38-43`；已完成但未归档的重复完成仍会进入 policy/写入路径，客户端可能得到不一致的状态冲突。

### 修复建议

让依赖查询直接读取 Task binding/outbox 关联并在同一身份范围返回真实计数；统一 Goal 状态机的终态幂等规则，重复完成应返回当前 receipt 而不再执行修改。

## 2. 计划创建（Plan / Task）

### 现状

计划以 TaskTemplate/TaskInstance 表达。创建在事务中先生成实例，再保存模板和实例；完成实例前计算 Goal binding 上下文并在保存时发布事件。

### 闭环评估

创建→首批实例→完成链路存在，有限重复计划也校验了“全部完成”所需边界。计划的暂停、删除和实例维护是多状态操作，用户需要依赖后台维护任务才能看到完整实例。

### 问题清单

- **P1** 创建事务对生成顺序有明确但脆弱的多步持久化契约：`packages/task/src/server/application/use-cases/commands/create-task-template.use-case.ts:106-117` 先保存模板再 `saveMany` 实例；任一后续写入失败会让“计划已创建但没有可执行实例”，需确认所有生产适配器都把 runner 作为真正数据库事务而非 inline fallback。
- **P2** 完成接口对已完成实例直接返回成功：`packages/task/src/server/application/use-cases/commands/complete-task-instance.use-case.ts:60-64`；产品上缺少“重复操作/已被他端完成”的可见提示，容易掩盖同步延迟。

### 修复建议

将模板、实例和 outbox 写入绑定到同一仓储事务能力，并在客户端区分 `already completed` 与首次完成；维护任务失败时提供可重试状态而不是静默依赖下一轮扫描。

## 3. 知识沉淀（Knowledge）

### 现状

基础知识入口实际是 GitHub knowledge projection；创建采用 draft→review→confirmed commit，写请求带 `requestId`、hash、lease 和 Pending/Committed/Failed 状态，投影随后由 webhook/投影服务更新。

### 闭环评估

创建和持久化有较强的幂等/租约保护，读取和关系图可用；但这是远端仓库投影，不是本地即时笔记，提交成功到列表可见之间存在异步窗口。

### 问题清单

- **P1** 提交成功只标记写请求和投影 upsert，列表依赖异步 projection：`packages/repository/src/server/application/services/knowledge-note-commit.service.ts:232-260`；若 webhook 延迟/失败，用户看到“已提交”却在笔记列表找不到，缺少明确的同步中/重试入口。
- **P2** Web 端列表一次固定 `limit: 100`：`packages/app-vue/src/modules/repository/views/KnowledgeProjectionWorkspaceView.vue:567-571`，无分页或继续加载，知识量增长后 CRUD/检索闭环会截断。

### 修复建议

把 commit 状态直接投影为 UI 可消费的 Pending/Committed/Failed，并提供重放/刷新；列表改为游标分页并保持当前选中项的稳定性。

## 4. 日常习惯提醒管理（Habit + Reminder）

### 现状

ReminderTemplate/Group 提供 CRUD、启停、分组控制和触发历史；领域 `ReminderTriggerService` 会检查有效启用状态、写历史并计算下一次触发时间。

### 闭环评估

管理面 CRUD 基本完整，但默认 API runtime 没有安装实际 cron，因此“创建并启用习惯”不等于系统会在到点执行。

### 问题清单

- **P0** API 模块注入的是空 runtime：`packages/reminder/src/api/module.ts:42-49` 使用 `createReminderRuntimeContribution()`；该函数 `start/stop` 均为空且明确标注占位：`packages/reminder/src/server/infrastructure/runtime/reminder.runtime.ts:10-28`。生产 API 启动后没有触发扫描，习惯提醒核心任务直接断裂。
- **P1** 触发服务先创建成功历史再保存模板：`packages/reminder/src/server/domain/services/reminder-trigger-service.ts:85-105`；没有持久化投递意图/幂等键，进程在保存前崩溃或多实例同时扫描时可能重复触发或丢失。

### 修复建议

在 composition root 注入 `createReminderTriggerCronJob`（并配置单实例租约）；以模板+触发时间生成唯一投递记录/状态机，成功、失败、跳过都可重放且不会重复。

## 5. 日程观察（Schedule）

### 现状

日程事件 CRUD、时间范围查询和冲突缓存刷新均在 `ScheduleEventApplicationService` 编排；仓储查询按 identity 和 `(start < end) AND (end > start)` 过滤。

### 闭环评估

创建/编辑/删除会刷新冲突缓存，日历读模型能看到事件；服务接口没有版本参数，跨端同时编辑时最后写入者可能覆盖前者。

### 问题清单

- **P1** `updateSchedule` 没有 expected version 或冲突检查：`packages/schedule/src/server/application/services/schedule-event-application-service.ts:61-103` 读取后直接修改并 `save`；两个客户端并发拖动/编辑会静默丢更新。
- **P1** 删除后的冲突刷新不是同一数据库事务的一部分：`...schedule-event-application-service.ts:107-122` 先 delete 再 refresh；刷新失败会留下过期冲突标记，用户在日历看到错误冲突。

### 修复建议

给 CalendarEntry 增加版本条件更新并把事件删除与受影响窗口的冲突重算放进同一事务/可重建 outbox；失败时保留可观测的重算任务。

## 6. 所有提醒功能（Notification/Reminder 投递）

### 现状

Notification 创建会按渠道建 Channel、保存并发出 in-app/desktop 事件；Notification runtime 有 Pending 投递、指数退避和 dead-letter 阈值设计。

### 闭环评估

投递 worker 的状态机设计存在，但默认 deliverer 是 no-op，且 Reminder 触发没有看到向 Notification 创建服务的可靠桥接；因此通知“记录存在”不代表用户收到。

### 问题清单

- **P0** 未配置渠道适配器时 worker 将投递视为成功：`packages/notification/src/server/infrastructure/runtime/notification.runtime.ts:30-38,47-53`；Push/桌面权限或适配器缺失不会进入失败/告警，用户可见状态会假成功。
- **P1** 通知创建先调用 `notification.send()` 再保存并异步发事件：`packages/notification/src/server/application/use-cases/commands/create-notification.use-case.ts:89-120`；数据库提交成功但事件总线/客户端断线时没有 durable dispatch/outbox，实时通知会丢，只能靠刷新列表发现。

### 修复建议

将渠道适配器配置作为启动时必需依赖，no-op 仅允许测试；把 Notification dispatch 写入同事务 outbox，worker 以 delivery id 幂等消费并暴露 dead-letter 运维入口。

## 7. 基础用户账号认证（Account / Cloud Auth）

### 现状

Cloud Auth 启用邮箱密码、邮箱验证、密码重置、GitHub（可选）、Bearer 和桌面 device authorization；Account 模块覆盖资料、设置和关闭账号。

### 闭环评估

登录/登出/重置请求链路存在，认证服务能解析当前 session；关闭账号只改变业务 Account 状态，没有证明云认证用户和活动 session 同步失效。

### 问题清单

- **P0** 关闭账号 use case 只调用业务仓储：`packages/account/src/server/application/use-cases/commands/close-account.use-case.ts:14-23`；没有撤销 `cloudAuthSession`、删除/禁用 cloud user，也没有调用认证服务登出，已关闭账号可能继续持有有效 Bearer/session。
- **P1** Web 密码操作失败仅 toast，不写认证 store 错误：`packages/app-vue/src/modules/authentication/composables/usePassword.ts:9-12,45-58`；离开页面后错误上下文消失，用户无法在账号页恢复或查看最近失败原因。

### 修复建议

把 close account 设计成跨 Account/Cloud Auth 的事务性命令（先禁用登录、撤销全部 session，再关闭业务账号，失败可重试）；密码操作将结构化错误写入共享认证状态并保留可恢复的表单状态。

## 8. 基础设置功能（Settings）

### 现状

设置按 category patch/reset/export/import，Prisma 仓储使用 identity 唯一键 upsert 并发布领域事件；Web composable 在成功后同步 presentation store。

### 闭环评估

普通读取和分类更新可持久化，默认值由领域 aggregate 提供；“读取默认值”这条用户/组件需要的路径未接通，部分重置场景在没有已有记录时直接报错。

### 问题清单

- **P1** `loadDefaults` 明确未实现：`packages/app-vue/src/modules/setting/composables/useUserSetting.ts:69-72` 只打印 warning，`defaults` 永远无法从服务端加载，设置页无法可靠展示“恢复前后差异”。
- **P1** 重置不存在的用户设置直接抛错：`packages/setting/src/server/application/use-cases/commands/reset-user-setting.ts:14-19`；新用户点击重置得到错误而不是默认设置，破坏默认值闭环。
- **P2** `resetToDefaults(_category?)` 丢弃传入分类：`packages/app-vue/src/modules/setting/composables/useUserSetting.ts:94-100` 始终调用无 category 的 reset，分类重置 UI 实际会重置全部设置。

### 修复建议

补齐 defaults 查询与 store 初始化；reset 在无记录时创建默认 aggregate，并把 category 原样传递到服务端，避免误重置全部偏好。

## 跨模块一致性问题

1. **可靠事件通道不统一**：Task→Goal 已采用事务 outbox、重放幂等（`packages/goal/src/server/application/event-handlers/task-goal-progress.handler.ts:16-24`），但 Reminder→Notification、Notification→客户端仍主要依赖进程内 event bus，故跨模块可靠性不同。
2. **并发控制覆盖不均**：Goal/Task 有 expected version/transaction runner，Schedule update 和 Reminder trigger 没有同等级版本或 claim，跨端和多实例行为不可预测。
3. **状态语义不一致**：Knowledge 的 Pending/Committed、Notification 的 channel Failed/dead-letter、Reminder 的历史 Success 都没有统一的用户可见“待处理/失败/重试”投影，导致多个模块都可能显示成功但实际未完成。
4. **身份生命周期脱节**：业务 Account close 与 Cloud Auth session/user 分离；设置、通知、提醒和知识连接的清理策略也未在同一关闭流程中编排。

## 建议的修复顺序

1. **P0 立即修复**：接入真实 Reminder cron 并加多实例 lease；禁止 Notification no-op deliverer 进入生产并将 dispatch 持久化；关闭账号时撤销 Cloud Auth 用户/全部 session。
2. **P1 闭环修复**：补 Goal 删除的 Task 依赖查询；为 Schedule/Reminder 写入增加版本或 claim；为 Knowledge projection 和 Notification/Reminder 建立可重试状态及用户可见反馈。
3. **P1/P2 体验修复**：实现 Settings defaults、无记录 reset 和分类 reset；完善重复完成/并发冲突提示、知识列表分页和认证错误持久状态。
4. **治理与回归**：为每条跨模块 outbox/投递链路补集成指标（成功、延迟、重试、dead-letter），再按最近改动运行对应 Nx lint/typecheck/test target。
