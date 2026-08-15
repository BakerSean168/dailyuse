---
tags:
  - plan
  - active
  - architecture
  - reference-architecture
  - query-cache
  - server-state
  - p1
  - p2
description: Reference architecture phase 5 Query Cache authority pilots for Notification and Task templates / 参考架构阶段 5：Notification 与 Task templates Query Cache authority 试点
created: 2026-08-15T00:00:00Z
updated: 2026-08-15T00:00:00Z
---

# Reference Architecture Phase 5: Query Cache Authority Pilots / 参考架构阶段 5：Query Cache Authority 试点

## 文档状态

- **状态**：Active，read-only implementation plan；本文只描述实施，不在本轮修改生产代码、测试或既有文档。
- **基线**：`feat/refarch-phase5-query-cache`，`93c04c4fc328e88f45348cf8845a11e70d9fd1aa`（2026-08-15）。
- **依据**：
  - `docs/analysis/2026-08-13-architecture-refactor-review.md`：§1 item 8、§3.12、§4 P1「Pinia 同时承载 server state」、§6 阶段 5。
  - 当前 Notification、Task、Web bootstrap、Desktop renderer/PowerSync wiring、package/test 配置与现有 tests。
- **Task 试点选择**：选择 **Task templates**，覆盖 template list/detail/graph projection 与 template mutations；Task instances 不在本阶段迁移。
- **依赖事实**：`packages/app-vue/package.json:86-128` 当前没有 `@tanstack/vue-query`，lockfile 也没有该包；计划采用 `@tanstack/vue-query@5.101.4`（2026-08-15 查询到的版本，peer 支持 Vue `^3.3.0`，与当前 Vue `3.5.39` 兼容）。

## 1. 目标与非目标

### 1.1 目标

1. **Notification Query Cache authority（P1）**：通知列表、详情投影、未读数及 read/delete mutation 的唯一 renderer server-state authority 是 TanStack Vue Query；Notification Pinia 只保留 page、page size、read filter 等 UI state。
2. **统一实时失效入口（P1）**：eventBus、Web SSE、Desktop PowerSync `db:changed` 与 reconnect 只产生 typed invalidation intent，由 dispatcher 映射到 query keys；transport/event handler 不再构造 DTO、写 Pinia 或直接 `setQueryData`。
3. **Task templates 对照试点（P1/P2）**：将 template list/detail/graph projection 迁入 Query Cache，固定 fetch 次数、30/60 秒 stale window 和 mutation rollback 场景，以现有 Pinia 行为作为基线做同场景对比。
4. **保持宿主语义**：Web query source 仍是现有 HTTP client，Desktop query source 仍是现有 IPC client 背后的 PowerSync/local database；Query Cache 只协调 renderer 内存状态，不成为持久化或同步层。
5. **形成推广门槛（P2）**：只有 Notification 与 Task templates 的 correctness、fetch-count、Web、Desktop、offline/reconnect gates 全部稳定后，才评估更多模块；PowerSync/offline 长期策略单独形成 ADR。

### 1.2 非目标

- 不做全仓 Query Cache 替换，不迁移 Goal、Schedule、Reminder、Account、Repository 或 Setting server state。
- 不移除 Pinia；Notification/Task Pinia 继续承载 page/filter/view preference、dialog/selection 等 UI state，Task instances 与试点外 dependencies 维持现状。
- 不破坏或弱化 Desktop 离线能力、local profile 隔离、PowerSync durability/sync 行为；不把 Web HTTP online 规则套到 Desktop local IPC。
- 不改变 HTTP/IPC route、request/response schema、Result envelope、认证、SSE server payload/cursor 或业务错误码。
- 不改变 Notification/Task server package、repository、application use case、数据库 schema 或 PowerSync schema。
- 不用 event payload 作为 authoritative Notification/Task DTO，不让 eventBus/SSE 直接 patch cache。
- 不引入持久化 query cache、service worker offline write queue、跨 renderer cache 或新的后台同步协议。
- 不为短期回滚维护长期 Pinia/Query 双写或 feature-flag 双 authority；每个 pilot PR 通过独立 revert 回滚。

## 2. 当前状态盘点

### 2.1 Gap table

| 范围                            | 当前证据（file:line）                                                                                                                                                                                                    | 当前 authority / mutation / event 行为                                                         | Gap / 阶段 5 目标                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Notification Pinia server state | `packages/app-vue/src/modules/notification/stores/notification-store.ts:9-25` 保存 `notifications/isLoading/error/unreadCount/pagination.total/isInitialized`；`:29-50` 提供 list、count、loading/error 的 patch actions | Pinia 同时拥有 server DTO、derived count 与 UI pagination                                      | Pinia 只留 `page/pageSize/readFilter` 等 UI state；list/count/loading/error 由 query/mutation state 派生，`total` 随 list response 留在 Query Cache |
| Notification reads              | `packages/app-vue/src/modules/notification/composables/useNotification.ts:23-53` 从 Pinia 暴露 list/count/loading/error，并在 fetch 后 `setNotifications`                                                                | 每个调用方自行启动 service fetch 并写同一 store                                                | 拆成 identity-scoped list/unread query；相同 key 的并发 consumer 共享一次 request，不同 list params 不互相覆盖                                      |
| Notification mutations          | `useNotification.ts:56-114` 在 mark read/all、delete/batch delete 后直接 `update/remove/setUnreadCount`；`:116-119` page change 直接 fetch                                                                               | mutation 手写多份 projection，失败没有统一 snapshot/rollback contract                          | mutation 只操作 Query Cache；保守使用 server-confirmed patch + invalidate，事件只 invalidate                                                        |
| Notification UI 重复读取        | `NotificationListPage.vue:117-127,164-166` mount 时 list + unread；`NotificationCapsulePreview.vue:104-113,126-146` mount 时再次 list + unread，mark read/all 后又显式 refresh count                                     | 页面、胶囊、Shell 对同一 unread server fact 可重复 fetch；capsule list 还能覆盖共享 Pinia list | unread key 全局去重；page/capsule 以各自 canonical list key 共存；组件不再用 `onMounted` imperative hydration                                       |
| eventBus 直接写 store           | `packages/app-vue/src/modules/notification/initialization/index.ts:13-20` 订阅 eventBus；`:22-45` 去重、合成 `NotificationClientDTO`、`addNotification/incrementUnread`；`:52-69` 管理订阅                               | transport event 被当成完整 server row，绕过 service query；`as unknown as` 掩盖 shape 差异     | startup hook 只把 `{identityScope, entityId, dedupeKey, source}` 交给 dispatcher；不 import Notification store/DTO                                  |
| Web SSE 未接入 Vue              | Server 在 `packages/notification/src/api/routes.ts:327-360` 提供 authenticated `/notifications/sse`、`Last-Event-ID/lastCursor`、operation 去重和 event id；当前 Vue/Web 源码没有 Notification `EventSource` consumer    | Server SSE 能力存在，但 Web renderer startup 只启动 in-process eventBus hook                   | 新增 Web-only SSE invalidation source；复用现有 endpoint/cookie/cursor，不改变 server contract；每个 message 只 dispatch invalidation               |
| Desktop PowerSync invalidation  | `apps/desktop/src/renderer/platform/electron.ts:70-113` 把 table 映射为 module；`:121-129` 直接 `setInitialized(false)`；`:139-166` 收 `DB_CHANGED` 后写 store并发 DOM event                                             | Desktop freshness 仍围绕 Pinia initialized flag；active view 是否立即 refetch 由组件自行决定   | Pilot tables 映射到 dispatcher；Notification/Task-template active queries 立即 refetch，inactive queries 只标 stale；其余模块保留旧 invalidator     |
| Desktop change source           | `apps/desktop/src/main/database/powersync.ts:481-515` 在 PowerSync `db.onChange` 后向 renderer 广播 changed tables                                                                                                       | durable source 是 PowerSync/local DB，renderer 只收到 table names                              | 保持 table-only contract；dispatcher 按 `notifications`、`task_templates`、`task_dependencies` 映射 key，不要求 main process 了解 Query Cache       |
| Task Pinia server state         | `packages/app-vue/src/modules/task/stores/task-store.ts:13-35` 保存 templates/instances/dependencies/current template/current instance/loading/error/pagination；`:47-67` patch templates，`:69-100` patch其余状态       | 单个 store 混合 pilot server state、非 pilot server state 与 UI state                          | templates/currentTemplate/management graph projection 移到 Query Cache；Pinia 保留 page/pageSize/filter/view state，instances 与未迁移路径维持现状  |
| Task template reads             | `packages/app-vue/src/modules/task/composables/useTaskTemplates.ts:61-137` 组装 params 后分别 fetch list/graph/detail并写 store                                                                                          | list、graph、detail 没有 key/stale/dedupe；共享 loading flag会让并发请求互相覆盖               | 分别使用 `list/detail/graph` keys；query data 保留原 response projection；loading/error 按 query 独立                                               |
| Task template mutations         | `useTaskTemplates.ts:139-269` create/update/delete/batch/status 后 `add/update/removeTemplate`；`TaskManagementView.vue:467-470,570-585,632-685` mutation 后再全量 graph refresh                                         | 局部 patch + caller refetch 并存；没有统一 rollback；batch delete 是逐项部分成功语义           | update/status 试验 optimistic snapshot/rollback；create/delete/batch 保持 server-confirmed 语义；所有路径 onSettled invalidate canonical keys       |
| Task 额外 fetch callsites       | `TaskDetailView.vue:490,586-595` detail + graph 并发，`DailyTodoWidget.vue:162-167` 读取 templates，`TaskManagementView.vue:708-710` mount graph                                                                         | 相同 key 的 remount/并发无法复用；不同 projection 共享 store 会互相覆盖                        | query key 分 projection；同 key dedupe/remount reuse，不把 graph response抄到 Pinia再供其它 key消费                                                 |
| Host bootstrap                  | `apps/web/src/bootstrap/app.ts:20-25,58-67` 与 `apps/desktop/src/renderer/bootstrap/app.ts:28-39,80-88` 只安装 Pinia/i18n/services，startup hook 无 dependency                                                           | 没有 renderer-owned QueryClient 生命周期，也没有 identity/profile cache clear                  | 两个 authenticated renderer 各创建一个 QueryClient、安装 VueQueryPlugin、把同一 client/dispatcher 注入 startup sources；auth-only renderer不安装    |
| Dependency/test config          | `packages/app-vue/package.json:86-128` 无 Vue Query；`packages/app-vue/vitest.config.ts:9-38` 使用 happy-dom；现有 notification/task composable specs 通过 Pinia + injected service mount                                | 测试模式可直接扩展 QueryClient，但目前没有 deterministic retry/gc helper                       | 加 test QueryClient factory（retry off、gc deterministic）与 direct Vitest coverage；禁止用会 hang 的 `pnpm nx run <pkg>:test`                      |

### 2.2 实施前 fetch-count 基线

Step 0 必须先用 service spies 固定以下**当前调用路径**，再迁移实现；基线记录到 `docs/analysis/2026-08-15-query-cache-pilot-evidence.md`，不得只凭人工感受宣称减少请求。

| Journey                                               | 当前静态调用路径                                                     | 迁移后 gate                                                                                      |
| ----------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Notification page + capsule 在同一 stale window mount | page list 1 + unread 1；capsule list 1（不同 limit）+ unread 1       | 两个不同 list keys 各 1；相同 unread key 合计 1                                                  |
| 两个 consumer 并发订阅完全相同 Notification list key  | 每个 consumer 可各调用 fetch                                         | service `findNotifications` 恰好 1 次                                                            |
| Notification mark-read in capsule                     | mutation 1 + caller `refreshStats` 1                                 | mutation 1；success patch 后同一批次最多触发 list/unread active refetch 各 1；组件不额外 refresh |
| Task management mount → edit → return within 60s      | graph mount 1；update 1；caller graph refresh 1；remount可再次 fetch | graph initial 1；update 1；invalidate 后 graph refetch 1；60s 内无第二次无因 remount fetch       |
| Task detail mount/update                              | detail + graph；update 后 detail + graph 再取                        | 每个 canonical detail/graph key initial 1；update onSettled 后每个 active affected key最多 1 次  |
| SSE/eventBus duplicate operation                      | eventBus 可直接 patch，Web SSE未接入                                 | 相同 `dedupeKey` 只产生一批 invalidation；每个 active key最多 1 次 refetch                       |

## 3. 契约冻结（实现前必须先签字）

### 3.1 Authority 与生命周期

- 每个 authenticated renderer runtime 恰好创建一个 `QueryClient`；Web 与 Desktop 不共享实例，auth-only entry 不安装 Query Cache。
- Query Cache 是 pilot server state 的唯一 renderer authority。组件可通过 query data、derived computed 或 mutation state 读取，不得把 query data镜像回 Pinia。
- client service 仍是 query/mutation function 的 source：Web 使用当前 HTTP adapter，Desktop 使用当前 IPC adapter；不在 app-vue 判定或调用 Prisma/PowerSync。
- key 必须包含 effective `identityScope`。Web 使用 cloud auth identity；Desktop 优先当前 local/effective account/profile identity，不能用全局 `'anonymous'` key承载已认证数据。
- logout、profile lock/switch 或 identity 变化时，先 stop SSE/event sources，再 `removeQueries`/`clear` 当前 identity cache；不得让前一 identity 数据闪现给后一 identity。
- Query Cache 不持久化。Desktop durable fact 始终在 PowerSync/local DB；Web 离线仅保留当前 renderer 内存已有数据。

### 3.2 Query key scheme

新增 `packages/app-vue/src/platform/server-state/query-keys.ts`，冻结以下 public shape（实际 exported declarations 必须有中英文 JSDoc）：

```ts
const notificationQueryKeys = {
  all: ['server-state', 'notification'] as const,
  identity: (identityScope: string) => [...notificationQueryKeys.all, identityScope] as const,
  lists: (identityScope: string) =>
    [...notificationQueryKeys.identity(identityScope), 'list'] as const,
  list: (identityScope: string, query: CanonicalNotificationListQuery) =>
    [...notificationQueryKeys.lists(identityScope), query] as const,
  details: (identityScope: string) =>
    [...notificationQueryKeys.identity(identityScope), 'detail'] as const,
  detail: (identityScope: string, id: string) =>
    [...notificationQueryKeys.details(identityScope), id] as const,
  unread: (identityScope: string) =>
    [...notificationQueryKeys.identity(identityScope), 'unread-count'] as const,
};

const taskTemplateQueryKeys = {
  all: ['server-state', 'task-template'] as const,
  identity: (identityScope: string) => [...taskTemplateQueryKeys.all, identityScope] as const,
  lists: (identityScope: string) =>
    [...taskTemplateQueryKeys.identity(identityScope), 'list'] as const,
  list: (identityScope: string, query: CanonicalTaskTemplateListQuery) =>
    [...taskTemplateQueryKeys.lists(identityScope), query] as const,
  details: (identityScope: string) =>
    [...taskTemplateQueryKeys.identity(identityScope), 'detail'] as const,
  detail: (identityScope: string, id: string) =>
    [...taskTemplateQueryKeys.details(identityScope), id] as const,
  graphs: (identityScope: string) =>
    [...taskTemplateQueryKeys.identity(identityScope), 'graph'] as const,
  graph: (identityScope: string, query: CanonicalTaskTemplateListQuery) =>
    [...taskTemplateQueryKeys.graphs(identityScope), query] as const,
};
```

Canonicalization rules:

- materialize pagination defaults (`page=1`, Notification `limit=20`; Task callsite显式 limit保持原值)，删除 `undefined`，只保留 transport 接受的 primitive fields；不得放 Vue ref、class instance、Date、service、translated label 或 Pinia object。
- Notification canonical order 为 `page/limit/type/isRead/startDate/endDate`。
- Task canonical order 为 `page/limit/status/goalId/folderId/tags`；`status/tags` copy、dedupe、sort 后进入 key，调用 transport 时保留等价语义。
- `identityScope` 只用于 cache isolation，不写回 request body；HTTP/IPC identity 继续来自现有 auth context。
- runtime lane 不进入 key：Web/Desktop 各自拥有独立 QueryClient，lane 已由 composition 隔离；把 lane写入 key只会制造无收益的维度。

### 3.3 Invalidation contract

新增 `packages/app-vue/src/platform/server-state/invalidation-dispatcher.ts`，唯一 public interface 如下（命名可按实现微调，语义不得扩张）：

```ts
type ServerStateInvalidation =
  | {
      target: 'notification';
      identityScope: string;
      source: 'mutation' | 'event-bus' | 'sse' | 'powersync' | 'reconnect';
      entityId?: string;
      dedupeKey?: string;
    }
  | {
      target: 'task-template';
      identityScope: string;
      source: 'mutation' | 'powersync' | 'reconnect';
      projection?: 'all' | 'lists' | 'details' | 'graphs';
      entityId?: string;
      dedupeKey?: string;
    };

interface ServerStateInvalidationDispatcher {
  invalidate(intent: ServerStateInvalidation): Promise<void>;
  clearIdentity(identityScope: string): void;
}
```

Mapping and execution rules:

| Intent                                              | Keys marked stale                                                 | Active refetch                                                         |
| --------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Notification event/SSE/`notifications` table change | all notification lists + unread；known id additionally detail(id) | `refetchType: 'active'`；inactive只 stale                              |
| mark read/delete success                            | lists + unread + detail(id)                                       | patch server-confirmed data first where safe, then one batched refetch |
| mark all/batch delete success                       | all notification identity keys                                    | active projections once                                                |
| Task template create/delete/update/status           | template lists + graphs；known id additionally detail(id)         | affected active projections once                                       |
| `task_templates` table                              | lists + graphs + details prefix                                   | active affected keys once                                              |
| `task_dependencies` table                           | graphs only                                                       | active graphs once                                                     |
| reconnect                                           | pilot identity roots that are stale/invalidated                   | active queries only                                                    |

- dispatcher owns `queryClient.invalidateQueries`; event adapters and components不得直接调用 it。
- 同一 JavaScript turn 的 intents 按 identity + target + projection 合并。带 `dedupeKey`（Notification 优先 `operationId`，fallback SSE `lastEventId`）的重复事件由 bounded 256-entry per-runtime LRU 抑制；不得使用无界 Set。
- 没有 stable dedupe key 的 PowerSync table batch仍按 turn 合并；correctness 依靠 idempotent refetch，而不是丢弃未知事件。
- eventBus/SSE/PowerSync payload 是 freshness hint，不得调用 `setQueryData`；只有 mutation lifecycle 可以 patch/snapshot Query Cache。
- identity mismatch 或空 identity fail closed：不 invalidate 其它 identity，也不退化为 global key。

### 3.4 Mutation 与 optimistic update policy

Query/mutation function 将现有 `Result.fail` 转成 typed thrown error，让 Vue Query 进入 `error/onError`；UI 仍通过现有 i18n/toast adapter 显示错误，不改变 transport Result contract。

| Mutation                                 | Pilot policy                                                                                                    | Rollback / convergence                                                                |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Notification `markAsRead`                | **不 speculative**；成功后用 server-returned DTO patch已缓存 list/detail，并仅在原 item unread 时安全调整 count | 无 optimistic rollback；onSettled invalidate list/unread/detail                       |
| Notification single delete               | **不 speculative**；server success 后从 cached lists/remove detail，count只在已知被删 item unread 时调整        | error保留原 cache；onSettled invalidate                                               |
| Notification mark-all / batch delete     | 不 optimistic，不从不完整 response猜测多 projection                                                             | success 后 invalidate identity root；失败不改 cache                                   |
| Task create                              | 不伪造临时 id；使用 server response seed detail，可选 patch exact unfiltered list                               | lists/graphs onSettled invalidate；保留 `instanceCount/todayInstanceCreated` feedback |
| Task update / activate / pause / archive | **optimistic pilot**：cancel affected queries，snapshot全部匹配 list/detail/graph entries，再按 id patch        | 任一 failure exact restore `[queryKey, previousData]` snapshots；onSettled invalidate |
| Task single delete                       | server-confirmed 后 remove detail/list/graph item，不 optimistic                                                | error保留 cache；onSettled invalidate                                                 |
| Task batch delete                        | 保持当前逐项、首错停止、已成功项不回滚的 API语义；不得伪装原子批量                                              | 每个 confirmed success 移除对应 cache item；finally invalidate；失败 toast一次        |

Optimistic gate：如果实现无法对所有已 patch keys 保存并精确恢复 snapshot，则该 mutation 降级为 server-confirmed，不允许“部分 rollback”。Web offline 时 HTTP mutation 使用 `networkMode: 'always'` + `retry: 0`，网络失败立即进入 onError/rollback，不把未持久化 optimistic write 无限期暂停在内存。

### 3.5 Freshness 与 offline policy（pilot 值）

| Policy                    | Web HTTP lane                                                                                | Desktop PowerSync/IPC lane                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Notification `staleTime`  | 30s；SSE/dispatcher可立即失效                                                                | 30s；`db:changed`可立即失效                                                                            |
| Task template `staleTime` | 60s                                                                                          | 60s                                                                                                    |
| `gcTime`                  | 10min，memory-only                                                                           | 10min，memory-only；不是离线存储                                                                       |
| query `networkMode`       | `online`；offline保留已有 data/error不清空                                                   | `always`；IPC/local DB read必须可离线运行                                                              |
| mutation `networkMode`    | `always` + retry 0，使 HTTP failure及时 rollback                                             | `always` + retry 0，维持现有 local mutation语义                                                        |
| focus/reconnect           | focus不自动 refetch；SSE reconnect dispatch一次，browser online refetch stale active queries | focus不自动 refetch；PowerSync `DB_CHANGED` + online/reconnect dispatch，active queries从 local DB重读 |
| cache persistence         | 禁止                                                                                         | 禁止；PowerSync才是 durable authority                                                                  |

- query error 不清空 previous successful data；UI 可继续显示 stale data并呈现既有错误反馈。
- Desktop profile locked/switched 时 clear identity cache；重新打开 profile 后从 local DB重建，不依赖旧 memory cache。
- Pilot 稳定前上述值不提升为全仓标准。最终 PowerSync offline/freshness、reconnect ordering、profile isolation、是否持久化 query metadata 必须在独立 `ADR-045`（编号实施时复核）中接受/拒绝；本计划不预先宣称已采纳。

### 3.6 Public surface 与 JSDoc

- 新增/修改的 exported query-key factory、canonical query type、runtime policy、dispatcher interface/factory、SSE source、startup hook options 与 composable 必须写**中英文 JSDoc**。
- `packages/app-vue` root 只导出 host composition 必需的 `createServerStateRuntime`、policy/dispatcher type 和 notification startup source；feature keys/cache patch helpers 保持 package internal，避免把 TanStack internals扩散成全仓 public contract。
- UI components不 import `QueryClient`；composable tests与 transport adapters通过同一 public interface验证。

## 4. 分步实施（PR-able steps）

### Step 0 — 固定 Pinia baseline 与可比较指标

**Files**

- 更新 `packages/app-vue/src/modules/notification/stores/notificationStore.spec.ts`、新增/补齐 `composables/useNotification.spec.ts`。
- 更新 `packages/app-vue/src/modules/task/composables/useTaskTemplates.spec.ts`、`stores/taskStore.spec.ts`。
- 新增 `docs/analysis/2026-08-15-query-cache-pilot-evidence.md`，只记录相同 journey 的 before/after service call count、stale timing、rollback、Web/Desktop/offline结果。

**Changes**

- 用 fake service call counters固定 §2.2 journeys；使用 fake timers固定 mount、30s/60s窗口与 mutation failure，不引入 Query Cache。
- 记录现有 direct store patch、部分 batch delete和错误后保留旧数据语义，防止迁移时顺手改变业务行为。

**Tests / gates**

- direct Vitest：
  - `pnpm exec vitest run --config packages/app-vue/vitest.config.ts src/modules/notification/stores/notificationStore.spec.ts src/modules/notification/composables/useNotification.spec.ts`
  - `pnpm exec vitest run --config packages/app-vue/vitest.config.ts src/modules/task/composables/useTaskTemplates.spec.ts src/modules/task/stores/taskStore.spec.ts`
- **Gate**：evidence 有可复现数字；迁移 PR 不接受“可能减少 fetch”的无基线描述。

### Step 1 — 建立 renderer server-state runtime、keys 与 dispatcher

**Files**

- 修改 `packages/app-vue/package.json`、`pnpm-lock.yaml`：增加 exact `@tanstack/vue-query@5.101.4`。
- 新增 `packages/app-vue/src/platform/server-state/{query-client.ts,query-keys.ts,query-policy.ts,result-query.ts,invalidation-dispatcher.ts,index.ts}` 及对应 specs。
- 修改 `packages/app-vue/src/index.ts`、`web-bootstrap.ts` 或新增最小 `./server-state` export（按 package export audit选择），只暴露 host composition surface。
- 修改 `apps/web/src/bootstrap/app.ts`、`apps/desktop/src/renderer/bootstrap/app.ts` 与各自 bootstrap specs：认证完成并取得 identity 后创建/安装 VueQueryPlugin；mount 前完成 service + server-state runtime composition。
- 修改 Web/Desktop logout/profile lock/switch handler：stop event sources并 clear identity cache。

**Changes**

- 实现 §3.1-§3.5 contracts；test factory固定 `retry:false`、短 gc并在 afterEach clear，避免 Vitest open handle。
- 一个 runtime 对外只给 `queryClient`、`dispatcher`、`dispose/clearIdentity`；canonicalization、dedupe LRU和 key mapping隐藏在模块内部。
- 不迁移 feature data；Step 1 合入后生产行为应与当前 Pinia一致。

**Tests / gates**

- key canonicalization、identity isolation、active/inactive invalidation、turn batching、bounded dedupe、empty identity fail-closed、dispose tests。
- direct Vitest：
  - `pnpm exec vitest run --config packages/app-vue/vitest.config.ts src/platform/server-state`
  - `pnpm exec vitest run --config apps/web/vitest.config.ts src/bootstrap/app.spec.ts`
  - `pnpm exec vitest run --config apps/desktop/vitest.config.ts src/renderer/bootstrap/app.spec.ts`
- `pnpm nx run app-vue:typecheck --skip-nx-cache`、`web:typecheck`、`desktop:typecheck`。
- **Gate**：一个 renderer只创建一个 QueryClient；identity切换清空；没有 feature query/Pinia behavior change；所有新增 public surface中英 JSDoc完整。

### Step 2 — Notification Query Cache authority 与 mutation convergence

**Files**

- 新增 `packages/app-vue/src/modules/notification/composables/{useNotificationListQuery.ts,useNotificationUnreadQuery.ts,useNotificationMutations.ts}` 和 specs；按需要将 `useNotification.ts` 收敛为兼容 facade或删除内部调用方后缩小 export。
- 修改 `packages/app-vue/src/modules/notification/stores/notification-store.ts`、`notificationStore.spec.ts`：删除 server data/count/loading/error/actions，只保留 page/pageSize/read filter及 persistence。
- 修改 `NotificationListPage.vue`、`NotificationCapsulePreview.vue`、`AppShell.vue` 与相关 specs：使用显式 list/unread composable，删除 imperative mount refresh与 mutation后手动 `refreshStats`。
- 修改 `packages/app-vue/src/modules/notification/index.ts` 与 package surface tests。

**Changes**

- page、capsule分别用 canonical params；同一 unread key共享 cache，capsule不再覆盖 page list。
- query functions unwrap Result；previous data在refetch error时保留。
- mutation严格按 §3.4 server-confirmed patch/invalidate；`markAsRead` count只在 cache证明原 item unread时减一且不得低于0。
- 删除 Notification Pinia server fields后，任何 component/composable不得保留第二份 notification array/count。

**Tests / gates**

- composable：相同 key并发一次 fetch、不同 keys隔离、30s remount、read/delete success patch、failure no patch、mark-all/batch invalidation、identity change。
- component：page/capsule同时 mount unread只 fetch一次；Shell只订阅 unread，不隐式拉 list；loading/error/empty states不回退。
- surface：Notification store不含 `NotificationClientDTO/notifications/unreadCount/isLoading/error/isInitialized`；production feature代码不从 query data写 store。
- direct Vitest：Notification composable/store/component specs + `layouts/shell/AppShell.spec.ts`。
- **Gate**：Query Cache 是 Notification唯一 server-state authority；§2.2 Notification fetch-count全部满足；HTTP/IPC client calls和UI反馈契约不变。

### Step 3 — EventBus、Web SSE 与 Desktop PowerSync 只进入 dispatcher

**Files**

- 重写 `packages/app-vue/src/modules/notification/initialization/index.ts` 及新增 lifecycle spec：startup hook接收 dispatcher/identity/source dependencies，不 import store或构造 DTO。
- 新增 `packages/app-vue/src/modules/notification/initialization/notification-sse-invalidation-source.ts` 与 specs；Web host启用，Desktop不启用 cloud SSE。
- 修改 `apps/web/src/bootstrap/app.ts`/spec：用 `/api/notifications/sse`（或从现有 HTTP base resolver导出等价地址）启动 authenticated same-origin SSE source，stop时保留/清理 identity-scoped cursor。
- 修改 `apps/desktop/src/renderer/platform/electron.ts` 与 specs：Pilot table names走 dispatcher；其它 module invalidators保持现状。
- 必要时新增 `apps/desktop/src/renderer/platform/server-state.ts`，集中 bridge tables → invalidation intent mapping。

**Changes**

- eventBus `notification:dispatch_in_app` 只 dispatch `target=notification`；`operationId` 优先作为 dedupeKey，fallback id。
- Web SSE `message`/named `notification` event只解析最小 metadata（identity/id/operationId/lastEventId），不 parse成 Notification DTO；SSE cursor/reconnect沿用现有 server contract。
- Desktop `notifications` 失效 notification keys；`task_templates`失效 Task template lists/details/graphs；`task_dependencies`只失效 graphs；其余 tables继续旧 Pinia path。
- stop/dispose 必须解除 eventBus、EventSource、bridge listeners；重复 start幂等。

**Tests / gates**

- lifecycle：start一次、stop一次、restart、identity mismatch、malformed event、duplicate operation、SSE reconnect、listener disposal。
- Desktop renderer：一个 `DB_CHANGED` table batch只 dispatch预期 intents；不调用 pilot stores；非 pilot modules仍调用原 invalidators。
- Web API smoke：SSE authenticated、event id/cursor存在、event到达后 active unread/list各最多一次 refetch；断线重连后 catch-up不重复可见通知。
- **Gate**：`initialization/index.ts` 不 import Notification store/DTO；SSE/eventBus/PowerSync production handlers不直接 `setQueryData`/`invalidateQueries`。

### Step 4 — Task templates Query Cache 对照试点

**Files**

- 新增 `packages/app-vue/src/modules/task/composables/{useTaskTemplateListQuery.ts,useTaskTemplateDetailQuery.ts,useTaskTemplateGraphQuery.ts,useTaskTemplateMutations.ts}` 及 specs；更新 `useTaskTemplates.ts`/`useTask.ts` 为小 facade或迁移内部 callers。
- 修改 `packages/app-vue/src/modules/task/stores/task-store.ts`、`taskStore.spec.ts`：移除 templates/currentTemplate及 template pagination total/loading/error authority；保留 instances/currentInstance与明确的 UI state。Graph consumer不把 Query data写回 `dependencies`。
- 修改 `TaskManagementView.vue`、`TaskDetailView.vue`、`DailyTodoWidget.vue` 与相关 specs；dependency mutations完成后invalidate graph key，而非直接要求 template graph写 store。
- 修改 task module exports与authority surface spec。

**Changes**

- primary management flow使用 graph query（templates + dependencies同一 projection）；Daily widget用template list key；detail用detail key，各自不互相覆盖。
- update/activate/pause/archive执行 §3.4 exact multi-key snapshot/rollback；create/delete/batch维持server-confirmed/部分成功语义。
- callsite删除mutation后无条件 `refreshTaskManagement/fetchTemplate/fetchTaskGraph`；只在业务上需要重新读取非 pilot Goal binding时保留对应调用。
- 记录同一 journeys的Query Cache service call count、stale命中、rollback耗时与cache keys数量到evidence文档。

**Tests / gates**

- list/detail/graph key隔离、相同 key并发 dedupe、60s stale window、active invalidation、inactive stale、previous data on error。
- optimistic update/status成功与失败：所有 lists/details/graphs一致 patch，failure exact restore，onSettled只产生一批 refetch。
- batch delete第二项失败：第一项保持已删除，第二项恢复/保留，toast一次，与当前语义一致。
- component journeys：management CRUD/status、detail edit、Daily widget coexistence、dependency graph refresh。
- direct Vitest：targeted task composable/store/view/widget specs；不得执行 `pnpm nx run app-vue:test`。
- **Gate**：§2.2 Task fetch-count不高于 baseline且同 key重复 fetch下降；rollback无残留；Task instances行为零变化。

### Step 5 — 稳定性门禁、ADR 与是否推广决策

**Files**

- 完成 `docs/analysis/2026-08-15-query-cache-pilot-evidence.md` before/after矩阵。
- 单独新增 `docs/architecture/adr/ADR-045-query-cache-powersync-offline-policy.md`（实施时复核下一个可用编号）并更新 ADR index；ADR只在实测后决定 Desktop `networkMode`、freshness/reconnect ordering、profile isolation、cache persistence明确拒绝/接受。
- 更新 test inventory/generated manifest（若测试系统要求）与 pilot authority governance/surface specs；完成后更新本计划状态或归档，不在同一决定中批量迁移其它 modules。

**Changes**

- 按 §5 全门禁收集 Web/Desktop online/offline/reconnect证据。
- 召开 go/no-go：任何 correctness、identity isolation、Desktop offline、rollback或 fetch-count gate不稳定均是 no-go；先修 pilot或 revert，不扩大覆盖面。
- go只表示“允许另写模块迁移计划”，不表示自动迁移 Goal/Reminder 等模块。

**Tests / gates**

- 完整执行 §5 命令与 scenarios，ADR/docs/inventory/governance全部通过。
- **Gate**：两 pilot稳定至少覆盖一次离线写入→重启→重连同步 journey；没有双 authority与 listener leak；评审接受 evidence + ADR后才关闭阶段 5。

## 5. 验证与门禁

### 5.1 自动化命令

实现阶段按 PR 最近范围执行；所有 unit/composable/store tests 直接调用 Vitest，**禁止** `pnpm nx run <pkg>:test`：

```bash
# Direct Vitest only for app-vue/web/desktop unit tests
pnpm exec vitest run --config packages/app-vue/vitest.config.ts \
  src/platform/server-state \
  src/modules/notification \
  src/modules/task

pnpm exec vitest run --config apps/web/vitest.config.ts \
  src/bootstrap/app.spec.ts

pnpm exec vitest run --config apps/desktop/vitest.config.ts \
  src/renderer/bootstrap/app.spec.ts \
  src/renderer/platform

# Non-test quality gates
pnpm nx run app-vue:typecheck --skip-nx-cache
pnpm nx run web:typecheck --skip-nx-cache
pnpm nx run desktop:typecheck --skip-nx-cache
pnpm nx run app-vue:lint --skip-nx-cache
pnpm nx run web:lint --skip-nx-cache
pnpm nx run desktop:lint --skip-nx-cache
pnpm nx run app-vue:build --skip-nx-cache
pnpm nx run web:build --skip-nx-cache
pnpm nx run desktop:build --skip-nx-cache
pnpm test:inventory
pnpm test:inventory:check
pnpm nx run memoflow:governance-check --skip-nx-cache
pnpm nx run memoflow:docs-check --skip-nx-cache
```

Web Playwright最小集（复用现有 files并补 Query Cache/SSE assertions）：

```bash
pnpm exec playwright test \
  e2e/notification/notification-center.spec.ts \
  e2e/notification/reminder-notification-loop.spec.ts \
  e2e/task/task-template-crud.spec.ts \
  --config apps/web/playwright.config.ts
```

若从 root执行时现有 Playwright config要求以 `apps/web` 为 cwd，则使用等价的 `pnpm --dir apps/web exec playwright test ...`；不得修改测试语义来迎合命令。

### 5.2 Composable/store correctness matrix

| Gate      | 必须覆盖                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------------- |
| Authority | Pilot Pinia stores没有 server DTO/list/count/total/loading/error副本；query data不镜像到store             |
| Key       | identity隔离、defaults canonical、array normalize、page/filter不同key、list/detail/graph prefix targeting |
| Fetch     | concurrent同 key 1次；stale window内 remount 0次；失效后 active key 1次；inactive只stale                  |
| Errors    | Result.fail进入query error；previous data保留；translated feedback不变                                    |
| Mutations | Notification confirmed patch；Task optimistic snapshots全恢复；batch partial success不改语义              |
| Events    | eventBus/SSE/PowerSync只dispatch；duplicate operation/burst coalesce；stop后零refetch                     |
| Lifecycle | logout/profile switch clear；QueryClient/EventSource/bridge listeners无泄漏；test afterEach clear         |

### 5.3 Web e2e / smoke

1. Notification page与capsule同时打开，list params不互相覆盖，badge/unread一致。
2. 另一请求/fixture创建Notification后，SSE触发 active query刷新；重复同 operation event不产生重复item或重复 refetch。
3. mark read、mark all、single delete、batch delete成功/失败；toast、count、filter、pagination保持。
4. Task management create/edit/pause/resume/delete；graph/card/detail/Daily widget在各自query projection下同步。
5. 浏览器 offline：已有Notification/Task data继续显示；HTTP mutation失败后Task optimistic state回滚；online后stale active queries收敛。
6. logout/login另一个identity：前一identity cache不可见，SSE source已重建。

### 5.4 Desktop renderer smoke

1. 通过 `pnpm nx run desktop:serve-safe` 或 Desktop Playwright lane打开已有local profile，Notification/Task initial read走IPC成功。
2. 断网后重新打开Notification、Task management/detail；query仍调用local IPC/PowerSync，不因browser offline manager暂停。
3. 断网完成Task template create/update/status/delete以及Notification read/delete；重启Desktop后local durable结果仍存在。
4. `DB_CHANGED` 的 `notifications/task_templates/task_dependencies` batch触发正确key刷新；其它module仍走既有Pinia invalidator。
5. 重连PowerSync后remote changes收敛；无事件风暴、旧 optimistic row或count漂移。
6. lock/switch profile并打开另一profile：无前一profile query data闪现；切回后从对应local DB重建。

### 5.5 Offline/reconnect ordering scenarios

| Scenario                                            | 期望                                                                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Web query完成后断网                                 | 保留success data；不清空list；显示既有error反馈                                                                                             |
| Web offline Task optimistic mutation                | network failure触发exact rollback；不留下paused speculative write                                                                           |
| Web SSE断开期间产生Notification                     | reconnect携带cursor/catch-up；dispatcher dedupe；最终list/count一致                                                                         |
| Desktop offline local mutation                      | IPC/PowerSync local write成功，query patch/invalidate后可读；重启仍存在                                                                     |
| Desktop reconnect收到同一local/remote table变化多次 | bounded dedupe/turn batch限制refetch；最终以local DB read为准                                                                               |
| PowerSync change callback与query refetch race       | onChange后的read必须看见committed local row；若实测不保证，在ADR中记录并由source adapter加入settled/second-read策略，不在component加timeout |

### 5.6 Governance、docs 与 inventory

- authority surface spec fail closed：Notification/Task pilot store再次出现server DTO或event handler直接写store时失败。
- invalidation surface spec：event source不得 import Pinia store、不得调用 `setQueryData/invalidateQueries`；dispatcher是唯一 `invalidateQueries` owner（mutation cache helper可按明确allowlist使用 `setQueryData`）。
- package public exports都通过 `public-surface-audit`/package export audit，新增exports有中英JSDoc。
- 新/迁移 tests纳入 Test System V2 inventory；generated inventory无未提交漂移。
- evidence文档记录命令、日期、host、identity lane、before/after fetch counts与failure evidence；ADR与index同PR通过docs/governance checks。

### 5.7 Go / no-go thresholds

只有全部满足才可规划更多模块：

- 0 个已知 identity/profile data bleed、0 个双 authority字段、0 个 event listener leak。
- §2.2 同 key fetch count全部达到gate；任何代表journey总fetch不得高于baseline，例外必须有correctness理由和书面评审。
- Notification event到可见数据在正常网络下一次active refetch内收敛；重复operation不重复refetch/item。
- Task optimistic failure 100%恢复全部受影响 keys；batch partial success与当前语义一致。
- Web e2e、Desktop renderer smoke、offline/restart/reconnect、typecheck/lint/build、inventory、governance/docs全绿。
- ADR-045明确接受或拒绝pilot offline policy；未定稿即 no-go。

## 6. 风险与回滚

| 风险                                          | 触发信号                                                             | 缓解 / 回滚                                                                                                                                                                         |
| --------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PowerSync freshness race                      | `DB_CHANGED` 后refetch仍读旧row，之后无新事件导致cache停留旧值       | 真实Desktop test固定onChange→IPC read ordering；必要时只在PowerSync invalidation source做settled/second-read，不在components散布delay；未解决则revert Desktop pilot，保留Pinia path |
| Optimistic rollback不完整                     | Task detail恢复但list/graph仍为optimistic值，或filter total漂移      | snapshot `getQueriesData`全prefix并逐keyrestore；无法精确覆盖的mutation降级server-confirmed；失败revert Step 4，不影响Notification                                                  |
| Event duplication/refetch storm               | eventBus + SSE + PowerSync同operation导致多次active refetch          | stable dedupeKey bounded LRU + turn batching + active-only refetch；记录queryFn counters；仍超threshold则关闭相应source并revert Step 3                                              |
| SSE authority误用                             | handler从event payload构造DTO，shape/version差异再次出现             | surface spec禁止DTO/store/cache patch imports；event只带identity/id/dedupe metadata；回滚只需移除Web SSE source，queries仍可按stale/reconnect工作                                   |
| Identity/profile data bleed                   | logout/switch后短暂显示上一账户数据                                  | identity是key强制字段；source先stop再clear；host lifecycle test + Desktop profile smoke；任何bleed为release blocker并revert pilot                                                   |
| Web offline optimistic write悬挂              | offline mutation长时间paused且UI显示未持久化状态                     | HTTP mutations `networkMode: always`, retry 0；立即失败rollback；不持久化mutation queue                                                                                             |
| Desktop offline被onlineManager阻断            | 断网后IPC query/mutation进入paused                                   | Desktop lane query/mutation `networkMode: always`；offline renderer tests；失败revert host policy/runtime PR                                                                        |
| Migration cost扩大                            | `useNotification/useTask` facade同时兼容Pinia与Query、caller长期混用 | 每Step结束删除pilot双写；authority surface test；facade仅为composition，不暴露两套source；no-go时revert完整pilot PR而非保留shim                                                     |
| Cache内存/无界dedupe                          | 长会话query/dedupe keys持续增长                                      | `gcTime=10min`、canonical bounded keys、dedupe LRU 256、logout/profile clear；用query cache size evidence验证                                                                       |
| Mutation response与cache projection shape不同 | domain-client class/DTO转换漏掉，patch抛错或写入class instance       | queryFn边界统一转Client DTO；key cache只保存plain response projection；patch失败时invalidate authoritative read，不扩大API contract                                                 |
| 推广过早                                      | Pilot尚有offline/rollback gap却开始迁移Goal/Reminder                 | §5.7全部为hard gate；ADR未接受或evidence未完成时禁止新增module scope                                                                                                                |

### 6.1 回滚单元

1. **Step 4 Task pilot可独立revert**：恢复Task Pinia templates/currentTemplate/graph hydration和callsite refetch；Notification/runtime不变。
2. **Step 3 realtime adapters可独立revert**：停止Web SSE和pilot dispatcher source，恢复Desktop pilot table的Pinia invalidator；Query仍可依赖stale/manual mutation invalidation暂时工作。
3. **Step 2 Notification pilot可独立revert**：恢复Notification store/composable；server/API/IPC/SSE contract与数据无需迁移。
4. **Step 1 foundation可保留为无consumer inert code或最后revert**：移除host plugin/runtime与dependency；没有持久化cache或数据库migration需要清理。
5. 回滚不得通过同时保留Pinia与Query写入来“求稳”；以PR/commit边界revert恢复单一authority，并重新运行最近direct Vitest、Web/Desktop smoke、governance/docs gates。
