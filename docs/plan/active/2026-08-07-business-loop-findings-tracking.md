# 业务重构 findings 追踪（R0-5）

> 本文档将系统审查（`docs/audit/2026-08-07-memoflow-systemic-diagnosis-and-rebuild.md` 与
> `docs/audit/2026-08-07-business-architecture-deep-audit.md`）中的关键 finding
> 映射为可追踪状态。**R0 完成定义**：每个 finding 要么已修复并固化测试，要么
> 在对应重构阶段（R1-R7）的路线中明确承接。
>
> 状态：`open`（未处理） / `wip`（部分处理） / `done`（已修复+测试） / `deferred`（延后到指定阶段）

## P0（数据安全 / 可靠性）

| ID | 问题 | 阶段 | 状态 | 证据 / 承接 |
|----|------|------|------|-------------|
| P0-01 | Schedule/Projection 双宿主启动无分布式锁 | R3 | open | 计划 R3 引入 DB 租约；R0-1 已输出 host ownership 日志，R1-3 stop 改为排空 |
| P0-02 | Projection runtime 启动不对账 | R1 | done | `task-projection-runtime.ts` `reconcile()` + `shared-projection.ts` `replaceSelection` 原子交换；测试 `shared-projection.spec.ts`、`task-projection-runtime.test.ts` |
| P0-03 | TaskInstance 无唯一 occurrence key | R2 | done | `occurrenceKey`(templateId:localDate,本地时区)+ Prisma `@@unique([templateId, occurrenceKey])`;测试 `task-instance-occurrence-key.spec.ts` |
| P0-04 | Schedule exactly-once 缺口 | R3 | open | 计划 R3 occurrence/claim 表 |
| R2-5 | expectedVersion + ProgressContributionLedger + Goal projector | R2 | open | 最大块，承接下一轮实施（R3 前完成） |

## P1（正确性 / 架构）

| ID | 问题 | 阶段 | 状态 | 证据 / 承接 |
|----|------|------|------|-------------|
| P1-01 | Task 列表查询副作用补实例 | R2 | done | 查询纯读(R2-3);补充逻辑移至 `task-instance-maintenance-runtime` 显式 worker;测试 `task-instance-maintenance-runtime.spec.ts` |
| P1-02 | generate-task-instances 忽略 fromDate | R2 | done | force 路径尊重请求区间(fromDate 传入 `generateInstances`);测试 `instance-maintenance.test.ts` |
| P1-12 | 聚合仓储吞事件异常并清空 buffer | R1 | done | `aggregate-repository.base.ts` `publishAggregateEvents` 失败落 outbox；测试 `aggregate-repository.base.spec.ts`（outbox fallback） || P1-14 | Projection runtime 双宿主重复启动 | R1 | wip | `RuntimeContribution` 统一 async start/stop；DB 租约在 R3 |

## R0/R1 基础设施

| 项 | 阶段 | 状态 | 证据 |
|----|------|------|------|
| Runtime ownership 记录 | R0-1 | done | `contracts/primitives/runtime.ts`；API/desktop 启动日志 `[runtime-ownership]` |
| CommandEnvelope（correlation/causation/requestId） | R0-2 | done | `contracts/primitives/command.ts`（类型+工厂+测试待补） |
| 业务指标 recorder | R0-3 | done | `patterns/src/observability/business-metrics.ts`；聚合仓储 outbox fallback、schedule 执行接入 |
| Docker smoke / 双宿主 / 时区 / 崩溃恢复基线 | R0-4 | wip | local-docker Playwright 已跑通；双宿主对账脚本在 R3 |
| Outbox/Inbox/ProjectionCursor 表 | R1-1 | done | `database/prisma/schema/reliable-messaging.prisma`；`contracts/modules/reliable-messaging` |
| AggregateRepositoryBase outbox 兜底 | R1-2 | done | fallback 逻辑 + `IOutboxWriter` 端口 done；Prisma writer 已提供（`apps/api/src/outbox/prisma-outbox-writer.ts`）并示范注入 API 宿主 schedule 仓库；其余模块调用点在 R2 迁移时注入 |
| 模块 async start/stop/drain | R1-3 | done | `RuntimeContribution`、`composite-runtime`、三个投影 runtime、`ScheduleTaskQueue.drain`、schedule module dispose |
| Projection reconcile + 原子交换 | R1-4 | done | 见 P0-02 |
| 事件 schema version / messageId / retry policy | R1-5 | done | `contracts/modules/reliable-messaging`（MessageSchemaVersion、MessageRetryPolicy） |

## 后续阶段承接（R2-R7）

- R2：Occurrence/Task 生成（P0-03、P1-01、P1-02）、Goal contribution ledger
- R3：Schedule/Reminder/Notification 闭环（P0-01、P0-04）、DB 租约
- R4：Review/Habit
- R5：Knowledge relation / AI Command Gateway
- R6：Activity/Dashboard
- R7：ModuleManifest/Wallet
