# Query Cache Pilot — Before/After Evidence / 前后对照证据

> 状态：**进行中**（Step 0 baseline 已固定；Step 1-4 每步完成后追加「after」数字）。
> 基线 commit：`feat/refarch-phase5-query-cache` @ `93c04c4fc32888e45348cf8845a11e70d9fd1aa`（2026-08-15）。
> 计划：`docs/plan/active/2026-08-15-refarch-phase5-query-cache-pilot.md`。
> 方法：全部数字来自 **direct Vitest**（禁止 `pnpm nx run <pkg>:test`）；service 层用 fake spies 计数；fake timers 固定 stale 窗口与 mutation failure。

## 1. 环境

- 命令（Step 0 baseline）：
  - `node node_modules/vitest/vitest.mjs run --config packages/app-vue/vitest.config.ts src/modules/notification/stores/notificationStore.spec.ts src/modules/notification/composables/useNotification.spec.ts`
  - `node node_modules/vitest/vitest.mjs run --config packages/app-vue/vitest.config.ts src/modules/task/composables/useTaskTemplates.spec.ts src/modules/task/stores/taskStore.spec.ts`
- 日期：2026-08-15（UTC）
- Host：CI/dev worktree（Linux），identity lane：web `authStore.account.id`；desktop `accountStore.currentAccount.id`（本地 profile）。

## 2. Before 基线（Pinia authority）

| Journey | 基线 spec | before fetch counts | 记录的语义 |
| --- | --- | --- | --- |
| Notification page + capsule 同窗口 mount | `useNotification.spec.ts`「page + capsule mount」 | `findNotifications`=2（page 1 + capsule 1）；`getUnreadCount`=2 | 共享 store 把 capsule 显式 `limit:10` 覆盖为 `pageSize:20`，两 consumer 请求同一 key |
| 两 consumer 并发订阅相同 list key | `useNotification.spec.ts`「same list key」 | `findNotifications`=2 | 无 key dedupe |
| Notification capsule mark read | `useNotification.spec.ts`「capsule mark-read」 | `markAsRead`=1 + 显式 `refreshStats`=`getUnreadCount` 1 | capsule 在 mark-read 后强制 refreshStats |
| Notification mark-read 失败 | `useNotification.spec.ts` | service 1 | list/unread 原样保留；error 写入 store |
| Notification fetch 失败 | `useNotification.spec.ts` | service 1 | 前一次数据保留；loading 归位 |
| Notification mark-all / dismiss / dismissAll | `useNotification.spec.ts` | 各 service 1 | 本地 patch unread/isRead；dismissAll 清空 list+count |
| Task management mount → edit → 60s 内 remount | `useTaskTemplates.spec.ts`「management mount」 | `getTaskGraph`=3，`updateTemplate`=1 | 无 stale window；mutation patch 被后续 graph refresh 整表覆盖（overwrite quirk） |
| Task detail mount（detail + graph 并发） | `useTaskTemplates.spec.ts`「detail mount」 | `getTemplate`=1，`getTaskGraph`=1 | currentTemplate 由 detail 写入 store |
| Task batch delete 部分成功 | `useTaskTemplates.spec.ts`「stops after first failure」 | `deleteTemplate`=2（首项成功，第二项失败即停止） | 已成功项保留删除；toast 一次 |
| Pinia 整表覆盖 quirk | `notificationStore.spec.ts` / `taskStore.spec.ts`「overwrite quirk」 | — | `setNotifications/setTemplates` 整表替换，二次写入 clobber 一次 |

## 3. After 矩阵（迁移后逐项填写）

| Journey | after fetch counts | 满足 §2.2 gate | 备注 |
| --- | --- | --- | --- |
| Notification page + capsule 同窗口 mount | `useNotificationListQuery.spec`：page list key（limit 20）1 + capsule list key（limit 10）1；`useNotificationUnreadQuery.spec`：unread 合计 1 | 两 list key 各 1；unread 合计 1 | capsule 显式 limit 不再被 store pageSize 覆盖；组件无 onMounted imperative fetch |
| 两 consumer 并发订阅相同 list key | `useNotificationListQuery.spec`「dedupes concurrent」：`findNotifications` 恰好 1 | 恰好 1 | unread 共享 key 同样 1（`useNotificationUnreadQuery.spec`） |
| Notification mark read（capsule） | `useNotificationMutations.spec`：mutation 1；success patch；onSettled invalidate → active list/unread refetch ≤1；组件不额外 refresh | mutation 1；同批 active ≤1 | capsule 不再 `refreshStats()`；invalidate 经 dispatcher |
| Notification mark-all / batch delete | `useNotificationMutations.spec`：invalidate identity root；active 各 ≤1 | 满足 | 不 optimistic；失败不改 cache |
| SSE/eventBus duplicate operation | `invalidation-dispatcher.spec`：同 dedupeKey 一批；bounded LRU 256；`index.spec` eventBus 只 dispatch | 同 dedupeKey 一批；active key ≤1 | eventBus/SSE 均不 `setQueryData`/`invalidateQueries` |
| Task management mount → edit → return 60s | `useTaskTemplateQueries.spec`：graph initial 1；`useTaskTemplateMutations.spec` update 1 + invalidate 后 active graph refetch 1；60s 窗口内 remount 0 次额外 fetch | graph initial 1；update 1；invalidate refetch 1；60s 内无第二次无因 fetch | 视图删除无条件 `refreshTaskManagement`/`fetchTaskGraph` |
| Task detail mount/update | `useTaskTemplateQueries.spec`：detail key 1 + graph key 1；update onSettled 后 active affected key ≤1 | 每 canonical key initial 1；onSettled ≤1 | `useTaskTemplateDetailQuery` 随 route param 自动收敛 |
| Task optimistic failure | `useTaskTemplateMutations.spec`：update/status failure exact restore 全部 affected keys（list/graph/detail） | 100% 恢复 | snapshot/restore 逐 key |
| Task batch delete 部分成功 | `useTaskTemplateMutations.spec`：首错停止；已成功项保持删除；toast 一次 | 与当前语义一致 | 不伪装原子批量 |
| Desktop DB_CHANGED pilot tables | `electron.spec.ts`：`notifications`/`task_templates`/`task_dependencies` 只 dispatch 3 intents；非 pilot 走旧 invalidator | 只 dispatch intents | `mapTablesToInvalidationIntents` 集中映射 |
| Desktop offline local read/write | Step 5 实测待填 | IPC/PowerSync `networkMode: always`；重启 durable | desktop lane runtime `networkMode: 'always'` |

## 4. Rollback / 语义契约（防止迁移中顺手改变行为）

- Notification：fetch 失败保留 previous data；mark-read 失败不改 list/unread；markAllAsRead 本地 patch 全部 unread 并清零 count；dismiss 单条移除；dismissAll 清空 list+count。
- Task：batch delete 逐项、首错停止、已成功项不回滚；update/activate/pause/archive 在迁移后采用 optimistic snapshot/rollback；create/delete/batch 保持 server-confirmed。
- Web/Desktop 两个 lane 各自独立 QueryClient；identity 变化必须 stop sources 后 clear identity cache，禁止跨 identity 数据闪现。

## 5. 执行命令记录

- 2026-08-15（UTC，Linux worktree，direct Vitest only）：
  - `node node_modules/vitest/vitest.mjs run --config packages/app-vue/vitest.config.ts` → **180 files / 961 tests passed**。
  - `node node_modules/vitest/vitest.mjs run --config apps/web/vitest.config.ts` → **16 files / 67 tests passed**。
  - `node node_modules/vitest/vitest.mjs run --config apps/desktop/vitest.config.ts` → **38 files / 216 tests passed**。
  - `pnpm nx run app-vue:typecheck` / `web:typecheck` / `desktop:typecheck` → all pass。
  - `pnpm nx run app-vue:lint` → 0 errors（44 → 41 pre-existing warnings，新增代码零警告）。
  - Desktop PowerSync offline/restart/reconnect 场景与 Web offline optimistic rollback e2e 属手动 smoke，记录于 ADR-045 决策。当前 pilot 使用 `networkMode: 'always'` + `retry:0`（mutation），desktop lane query `networkMode: 'always'`，web lane query `networkMode: 'online'`。

