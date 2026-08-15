# Query Cache Pilot — Before/After Evidence / 前后对照证据

> 状态：**完成（三模块试点）**——governance 先行，notification、task templates 随后；Step 5 门禁与
> offline/restart/reconnect 实测见下（无 Playwright/e2e 基建部分如实记录 gap，不宣称已完成）。
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

| Journey                                       | 基线 spec                                                                         | before fetch counts                                             | 记录的语义                                                                           |
| --------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Governance 列表 mount + search                | `useGovernance.ts`（迁移前）：mount 手动 `fetchRules`；`searchRules` 每次手动请求 | `listRules`=1 + `searchRules`=1（每次搜索）                     | 无 key/dedupe；loading/error/total 写 store                                          |
| Governance rule detail + revisions            | `useGovernance.ts`（迁移前）：`fetchRule`/`fetchRevisions` 每次手动请求           | `getRule`=1 + `getRevisions`=1                                  | 无 stale 窗口；重复进入 detail 重复请求                                              |
| Notification page + capsule 同窗口 mount      | `useNotification.spec.ts`「page + capsule mount」                                 | `findNotifications`=2（page 1 + capsule 1）；`getUnreadCount`=2 | 共享 store 把 capsule 显式 `limit:10` 覆盖为 `pageSize:20`，两 consumer 请求同一 key |
| 两 consumer 并发订阅相同 list key             | `useNotification.spec.ts`「same list key」                                        | `findNotifications`=2                                           | 无 key dedupe                                                                        |
| Notification capsule mark read                | `useNotification.spec.ts`「capsule mark-read」                                    | `markAsRead`=1 + 显式 `refreshStats`=`getUnreadCount` 1         | capsule 在 mark-read 后强制 refreshStats                                             |
| Notification mark-read 失败                   | `useNotification.spec.ts`                                                         | service 1                                                       | list/unread 原样保留；error 写入 store                                               |
| Notification fetch 失败                       | `useNotification.spec.ts`                                                         | service 1                                                       | 前一次数据保留；loading 归位                                                         |
| Notification mark-all / dismiss / dismissAll  | `useNotification.spec.ts`                                                         | 各 service 1                                                    | 本地 patch unread/isRead；dismissAll 清空 list+count                                 |
| Task management mount → edit → 60s 内 remount | `useTaskTemplates.spec.ts`「management mount」                                    | `getTaskGraph`=3，`updateTemplate`=1                            | 无 stale window；mutation patch 被后续 graph refresh 整表覆盖（overwrite quirk）     |
| Task detail mount（detail + graph 并发）      | `useTaskTemplates.spec.ts`「detail mount」                                        | `getTemplate`=1，`getTaskGraph`=1                               | currentTemplate 由 detail 写入 store                                                 |
| Task batch delete 部分成功                    | `useTaskTemplates.spec.ts`「stops after first failure」                           | `deleteTemplate`=2（首项成功，第二项失败即停止）                | 已成功项保留删除；toast 一次                                                         |
| Pinia 整表覆盖 quirk                          | `notificationStore.spec.ts` / `taskStore.spec.ts`「overwrite quirk」              | —                                                               | `setNotifications/setTemplates` 整表替换，二次写入 clobber 一次                      |

## 3. After 矩阵（迁移后逐项填写）

| Journey                                      | after fetch counts                                                                                                                                                                      | 满足 §2.2 gate                                                            | 备注                                                                                                              |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Governance 列表 mount（首试点）**          | `useGovernanceQueries.spec`：`useGovernanceListQuery` 同 key 并发 consumer `listRules` 恰好 1                                                                                           | 恰好 1                                                                    | 视图不再手动 `fetchRules`；查询随 store filter/search 自动收敛                                                    |
| Governance 30s stale window（R2 P2-1）       | `useGovernanceQueries.spec`：list/detail/revisions 三个 stale 测试——30s 窗口内 remount 0 次额外 fetch，越过 31s 后 remount 各 +1                                                        | 30s 内 0 额外；>30s 恰 1                                                  | `GOVERNANCE_STALE_TIME_MS=30_000` 进入 `query-policy` staleTime 并应用到三个 query                                |
| Governance 列表按 filter/search 换 key       | `useGovernanceQueries.spec`：不同 `status/severity/tags/search` 各自独立 canonical key                                                                                                  | 每 key ≤1                                                                 | `canonicalizeGovernanceListQuery` 规范化 tags/search                                                              |
| Governance rule detail + revisions           | `useGovernanceQueries.spec`：`useGovernanceDetailQuery`/`useGovernanceRevisionsQuery` 同 id 恰好 1                                                                                      | 每 key 1                                                                  | detail 按 id key；revisions 按 ruleId key                                                                         |
| Governance mutation server-confirmed         | `useGovernanceQueries.spec`：create/update/delete success patch cache + onSettled invalidate identity；失败不改 cache                                                                   | 满足                                                                      | 不 optimistic；P1-2 identityScope 在 begin 捕获                                                                   |
| Governance authority surface                 | `governance-authority.surface.spec.ts`：store 无 server DTO/list/detail/revisions/loading/error/total                                                                                   | 满足                                                                      | `setQueryData`/`invalidateQueries` 仅限允许文件                                                                   |
| Notification page + capsule 同窗口 mount     | `useNotificationListQuery.spec`：page list key（limit 20）1 + capsule list key（limit 10）1；`useNotificationUnreadQuery.spec`：unread 合计 1                                           | 两 list key 各 1；unread 合计 1                                           | capsule 显式 limit 不再被 store pageSize 覆盖；组件无 onMounted imperative fetch                                  |
| 两 consumer 并发订阅相同 list key            | `useNotificationListQuery.spec`「dedupes concurrent」：`findNotifications` 恰好 1                                                                                                       | 恰好 1                                                                    | unread 共享 key 同样 1（`useNotificationUnreadQuery.spec`）                                                       |
| Notification mark read（capsule）            | `useNotificationMutations.spec`：mutation 1；success patch；onSettled invalidate → active list/unread refetch ≤1；组件不额外 refresh                                                    | mutation 1；同批 active ≤1                                                | capsule 不再 `refreshStats()`；invalidate 经 dispatcher                                                           |
| Notification mark-all / batch delete         | `useNotificationMutations.spec`：invalidate identity root；active 各 ≤1                                                                                                                 | 满足                                                                      | 不 optimistic；失败不改 cache                                                                                     |
| SSE/eventBus duplicate operation             | `invalidation-dispatcher.spec`：同 dedupeKey 一批；bounded LRU 256；`index.spec` eventBus 只 dispatch                                                                                   | 同 dedupeKey 一批；active key ≤1                                          | eventBus/SSE 均不 `setQueryData`/`invalidateQueries`                                                              |
| Task management mount → edit → return 60s    | `useTaskTemplateQueries.spec`：graph initial 1；`useTaskTemplateMutations.spec` update 1 + invalidate 后 active graph refetch 1；60s 窗口内 remount 0 次额外 fetch                      | graph initial 1；update 1；invalidate refetch 1；60s 内无第二次无因 fetch | 视图删除无条件 `refreshTaskManagement`/`fetchTaskGraph`                                                           |
| Task detail mount/update                     | `useTaskTemplateQueries.spec`：detail key 1 + graph key 1；update onSettled 后 active affected key ≤1                                                                                   | 每 canonical key initial 1；onSettled ≤1                                  | `useTaskTemplateDetailQuery` 随 route param 自动收敛                                                              |
| Task optimistic failure                      | `useTaskTemplateMutations.spec`：update/status failure exact restore 全部 affected keys（list/graph/detail）                                                                            | 100% 恢复                                                                 | snapshot/restore 逐 key；P1-1 回滚移除 patch 新建的 detail key                                                    |
| Task batch delete 部分成功                   | `useTaskTemplateMutations.spec`：首错停止；已成功项保持删除；toast 一次；P1-2 回归：identity 在 begin 捕获并经闭包复用，执行时切换 identity 不污染其他身份 cache                        | 与当前语义一致                                                            | 不伪装原子批量；`mutationFn` 不再重解析 identityScope                                                             |
| Task list error via legacy facade（R2 P2-2） | `useTask.spec`：list query 失败时 facade `error` 暴露翻译后消息；再次 `fetchTemplates` 触发真正 refetch（成功收敛）；`TaskCapsulePreview.spec`：失败显示 retry 状态、点 retry 重新 load | error 暴露 + retry 真实 refetch                                           | facade `error = store.error ?? listQuery.error`；`fetchTemplates` 对 error 态 key 显式 `refetch`（waiter 不挂起） |
| Desktop lifecycle guard（R2 P2-3）           | `app.spec`：disposed 后延迟启动不启动 notification hook；`server-state.spec`：logout/lock 触发 pending startup cancel、stop 已注册 sources、置 disposed                                 | cancel 一次且不重复；源全部 stop                                          | 与 web 一致：`isDesktopServerStateDisposed` + `registerDesktopServerStateStartupCancel`（P2-5 同款）              |
| Desktop auth-only install gate（R2 P2-4）    | `app.spec`：profile LOCKED（auth-only entry）不安装 Query Cache runtime；UNLOCKED 才安装                                                                                                | auth-only 不安装                                                          | 与 web `cloudSession.ok` 门禁同构；desktop 以 `unlockState==='UNLOCKED'` 判定已认证                               |
| Desktop DB_CHANGED pilot tables              | `electron.spec.ts`：`notifications`/`task_templates`/`task_dependencies`/`rules`/`rule_revisions` 只 dispatch 5 类 intents；非 pilot 走旧 invalidator                                   | 只 dispatch intents                                                       | `mapTablesToInvalidationIntents` 集中映射                                                                         |
| Desktop offline local read/write             | 单元 gate：desktop lane query/mutation `networkMode: 'always'`；重启 durable 依赖 PowerSync（见 §5 gap）                                                                                | 部分（重启/重连为手动 gap）                                               | 见 §5 与 ADR-045                                                                                                  |

## 4. Rollback / 语义契约（防止迁移中顺手改变行为）

- Notification：fetch 失败保留 previous data；mark-read 失败不改 list/unread；markAllAsRead 本地 patch 全部 unread 并清零 count；dismiss 单条移除；dismissAll 清空 list+count。
- Task：batch delete 逐项、首错停止、已成功项不回滚；update/activate/pause/archive 采用 optimistic snapshot/rollback，失败 100% 恢复所有受影响 keys 并移除 patch 新建的 detail；create/delete/batch 保持 server-confirmed；create 从 server response seed detail。
- Governance：create/update/delete server-confirmed；成功 patch 已缓存 list/detail，onSettled invalidate identity；失败不改 cache。
- Web/Desktop 两个 lane 各自独立 QueryClient；identity 变化必须 stop sources 后 clear identity cache，禁止跨 identity 数据闪现；mutation 的 identityScope 在 begin 捕获并贯穿所有回调（P1-2）。

## 5. 执行命令记录

- 2026-08-15（UTC，Linux worktree，direct Vitest only）：
  - `node node_modules/vitest/vitest.mjs run --config packages/app-vue/vitest.config.ts` → **185 files / 996 tests passed**。
  - `node node_modules/vitest/vitest.mjs run --config apps/web/vitest.config.ts` → **16 files / 67 tests passed**。
  - `node node_modules/vitest/vitest.mjs run --config apps/desktop/vitest.config.ts` → **38 files / 218 tests passed**。
  - `pnpm nx run app-vue:typecheck` / `web:typecheck` / `desktop:typecheck` → all pass。
  - `pnpm nx run app-vue:lint` → 0 errors。
  - Prettier over changed files → clean（`prettier --check` 全量通过；R2 修复后已 `--write` 补格式）。
- Review R2 修复（2026-08-15，同 worktree）：
  - P1-2 batch-delete：`useTaskTemplateMutations.deleteTemplates` 的 identityScope 改为在 onMutate（mutation begin）捕获一次，mutationFn 经闭包复用同一 scope；新增「begin 捕获 → 执行时 identity 已切换，仍 patch begin-scope cache、execution-time cache 不动」回归测试（`useTaskTemplateMutations.spec.ts`，先红后绿）。
  - P2-1 Governance stale window：`query-policy.ts` 新增 `GOVERNANCE_STALE_TIME_MS=30_000`（policy `staleTime` 增 `governance` 字段）；`useGovernanceListQuery`/`useGovernanceDetailQuery`/`useGovernanceRevisionsQuery` 全部补 `staleTime`；`useGovernanceQueries.spec` 新增 3 个 fake-timer 30s 窗口测试（窗口内 remount 0 额外 fetch、31s 后 +1）。
  - P2-2 Task list error：`useTask` facade `error` 改为 `store.error ?? templateList.error`，`fetchTemplates` 对 error 态 key 显式 `refetch` 让 retry 真实重试；新增 `useTask.spec`（error 暴露 + 重试 refetch）与 `TaskCapsulePreview.spec` retry 状态/点击重试测试。
  - P2-3 Desktop lifecycle guard：desktop `server-state.ts` 对齐 web，新增 `isDesktopServerStateDisposed`/`registerDesktopServerStateStartupCancel`；`clearDesktopServerStateIdentity` 置 disposed、fire cancel、再 stop sources；`app.ts` 延迟启动带 disposed 守卫并注册 cancel；`app.spec`/`server-state.spec` 覆盖 cancel、stop、disposed、不启动源。
  - P2-4 Desktop auth-only install gate：`app.ts` 仅在 `unlockState==='UNLOCKED'` 时安装 Query Cache runtime（plan §3.1 认证后安装）；`app.spec` 断言 LOCKED 不安装。
  - P2 Prettier：全量 changed files `pnpm exec prettier --check` 全绿；evidence.md 据此如实记录。

### 5.1 离线 / 重启 / 重连 / identity-switch / SSE catch-up / PowerSync ordering journeys（Step 5）

计划 §5.3/§5.4/§5.5 要求 Web/Desktop 的 offline、restart、reconnect、identity-switch、SSE catch-up、
PowerSync ordering 实测。仓库当前 **没有 Web Playwright/e2e 基建变更**（`apps/web` 无 Playwright spec
改动，`e2e/` 未提供可运行的 Query Cache/SSE 断言），Desktop 的 offline/restart 需要 Electron 真实
runtime（本 CI/worktree 无法启动 Electron）。**如实记录 gap，不宣称完成**：

| Journey                                          | 可自动验证的部分（真实测试）                                                                                         | 未验证 gap                                     | 已用替代验证                                                                                                                                      |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web offline 保留已有 data                        | query `networkMode: 'online'` + query error 保留 previous data                                                       | 真实断网 e2e                                   | `useTaskTemplateQueries.spec`「preserves previous data and surfaces a translated error on refetch failure」                                       |
| Web offline Task optimistic rollback             | mutation `networkMode:'always'` + `retry:0` → failure 立即 onError/rollback                                          | 真实断网 e2e                                   | `useTaskTemplateMutations.spec` update/status failure exact restore                                                                               |
| Web SSE 断开期间产生 Notification → catch-up     | SSE source 复用 `Last-Event-ID`/`lastCursor`；dispatcher dedupe（LRU 256）                                           | 真实 SSE 断线/重连 e2e                         | `notification-sse-invalidation-source.spec`（cursor/identity/malformed/duplicate）；`invalidation-dispatcher.spec`（dedupe/batch/active-only）    |
| Web identity-switch / logout                     | `clearWebServerStateIdentity` 先 stop sources 再 clearIdentity；SSE cursor 按 identity 隔离；deferred startup 可取消 | 多账户浏览器 e2e                               | `runtime.spec`（identity clear）；web `app.spec`（cursor 按 identity、startup cancel 注册）；`invalidation-dispatcher.spec`（identity isolation） |
| Desktop offline local mutation / restart durable | desktop lane query/mutation `networkMode:'always'`；PowerSync 是 durable authority                                   | Electron 真实 offline/restart smoke            | ADR-045 决策 + desktop renderer 单测（`electron.spec`、`server-state.spec`）                                                                      |
| Desktop reconnect 收重复 table changes           | dispatcher bounded dedupe/turn batch 限制 refetch                                                                    | PowerSync onChange→read ordering 实测          | ADR-045 §3 记录为「pilot 语义接受，全仓顺序另议」                                                                                                 |
| PowerSync ordering race                          | dispatcher 只 dispatch；最终以 local DB read 收敛                                                                    | onChange 后 read 必须看见 committed row 的实测 | ADR-045 记录：若实测不保证，需在 PowerSync invalidation source 加 settled/second-read                                                             |

> 结论：Step 5 的**单元级** gate（fetch-count、stale、rollback、dedupe、identity、authority surface）
> 全部通过并有可复现数字；**需要 Playwright/e2e 基建或 Electron runtime 的旅程保留为 gap**，ADR-045
> 明确接受 pilot 语义、拒绝 cache persistence，并在未实测项上不做「已通过」声明。go/no-go 判断据此
> 修正为：单元 gate 通过；e2e/Electron smoke 为 merge 前待办，不影响本 PR 的可合并性判定之外，
> 需要在后续 PR（带 e2e 基建）中补齐。
