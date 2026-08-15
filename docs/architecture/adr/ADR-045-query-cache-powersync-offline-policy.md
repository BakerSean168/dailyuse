---
tags:
  - adr
  - architecture
  - query-cache
  - offline
  - powersync
description: 参考架构阶段 5 —— Notification 与 Task templates Query Cache authority 试点的 offline/freshness 策略（接受为试点范围；全仓推广另议）
created: 2026-08-15T00:00:00+08:00
updated: 2026-08-15T00:00:00+08:00
---

# ADR-045: Query Cache Pilot — Offline / Freshness / PowerSync 策略（试点范围）

> 状态：**已接受（试点范围）**。仅适用于 Notification 与 Task templates 两个 pilot 模块；
> 不构成全仓标准。全仓推广需先满足 `docs/plan/active/2026-08-15-refarch-phase5-query-cache-pilot.md` §5.7
> 的 go/no-go（含 Web e2e、Desktop renderer smoke、offline/restart/reconnect 实测）。

## 背景

Web（HTTP）与 Desktop（PowerSync/local DB）使用同一套 renderer server-state 架构时，
offline/freshness 语义必须显式决策：哪些值按 lane 不同、reconnect 顺序、profile 隔离、
以及 query metadata 是否持久化。

## 决策

### 1. Desktop lane `networkMode: 'always'`（接受）

- Desktop lane 的 query 与 mutation 都使用 `networkMode: 'always'`，IPC/local DB 读写必须
  在断网时照常工作；不被 browser online manager 暂停。
- Web lane 的 query 使用 `networkMode: 'online'`（离线保留已有 data/error，不清空），
  mutation 同样 `always` + `retry: 0`（HTTP 失败立即 onError/rollback，不悬挂 speculative
  write）。
- 依据：`packages/app-vue/src/platform/server-state/query-policy.ts`（`createServerStateRuntimePolicy`）
  与 dispatcher/runtime 单测覆盖 lane 差异。

### 2. Freshness：Notification 30s / Task template 60s / gcTime 10min（接受，试点值）

- `staleTime`：Notification 30s；Task template 60s（`query-policy.ts`）。
- `gcTime`：10min，memory-only；不是离线存储。
- 依据：`useNotificationListQuery.spec.ts` 与 `useTaskTemplateQueries.spec.ts` 的
  30s/60s stale-window remount 测试（窗口内 remount 0 次额外 fetch）。

### 3. Reconnect ordering（接受 pilot 语义，全仓顺序另议）

- 实时源只向 dispatcher 发 typed invalidation intent；`refetchType: 'active'`，
  inactive 只标 stale。
- 同一 JS turn 的 intents 合并；重复事件由 bounded 256-entry per-runtime LRU 抑制；
  空/mismatched identity fail closed。
- SSE 断线重连沿用现有 server contract（`Last-Event-ID` / `lastCursor` catch-up），
  事件幂等（operationId dedupe），最终以 service read 收敛。
- 依据：`invalidation-dispatcher.spec.ts`、`notification-sse-invalidation-source.spec.ts`、
  `initialization/index.spec.ts`。

### 4. Profile isolation（接受）

- identity 是 query key 的强制字段；logout/profile lock/switch 先 stop sources 再
  `clearIdentity(scope)`；前一 identity 数据不闪现给后一 identity。
- 依据：`runtime.spec.ts`（identity clear）、desktop `electron.spec.ts`（pilot table →
  dispatcher）、host bootstrap specs（install 后 mount）。

### 5. Cache persistence：**拒绝**（明确不持久化 query metadata）

- Query Cache 不持久化。Desktop durable fact 始终在 PowerSync/local DB；Web 离线只保留
  当前 renderer 内存已有数据。不引入 service worker offline write queue 或跨 renderer cache。

## 后果

- 正面：Notification/Task templates 在 Web/Desktop 上由同一套 dispatcher 语义收敛；
  PowerSync `db:changed` 只携带 table names，不要求 main process 了解 Query Cache。
- 反面/待实测：PowerSync onChange→refetch 的 read ordering 只在 Desktop smoke/restart
  journey 中最终确认；若实测出现"DB_CHANGED 后仍读旧 row"则需在 PowerSync invalidation
  source 增加 settled/second-read，且仍未能解决时 revert Desktop pilot 保留 Pinia path
  （见计划 §6 风险表）。
- 推广门槛：§5.7 全部通过前，不对 Goal/Reminder 等模块自动采用本策略。
