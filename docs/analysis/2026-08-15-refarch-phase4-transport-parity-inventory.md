---
tags:
  - analysis
  - reference-architecture
  - transport-parity
  - contracts
  - inventory
description: Phase 4 transport-parity baseline — mutation ledger, validation owner, and production `as unknown as` cast allowlist / 阶段 4 baseline：mutation ledger、validation owner 与生产 `as unknown as` cast allowlist
created: 2026-08-16T00:00:00Z
updated: 2026-08-16T00:00:00Z
---

# Phase 4 Transport Parity — Baseline Inventory / Baseline 清单

> Step 0 durable before/after record for
> `docs/plan/active/2026-08-15-refarch-phase4-transport-parity.md`.
> Before Phase 4, **every mutation validates inside its controller**
> (`Schema.safeParse` → `VALIDATION_ERROR`), HTTP routes bind
> `expressAdapter` only via `RouteRegistrar.route`, and Electron IPC handlers
> wrap controllers with `withAuthenticatedValue`. The shared
> `expressAdapterWithValidation` / `ipcAdapterWithValidation` are **not yet
> used** by any module.

## 1. Mutation ledger（按 module）

`V` = validation owner before Phase 4（全部 `controller`）。`Chain` 列记录
contract chain 是否已闭合（request schema + RPC map + route + IPC +
response schema）。`-` 表示当前缺失，将在对应 Step 补齐。

### 1.1 Goal（Step 2 target）

| operation                | HTTP surface                                      | IPC channel                                    | Request schema                         | Response schema             | Chain                        |
| ------------------------ | ------------------------------------------------- | ---------------------------------------------- | -------------------------------------- | --------------------------- | ---------------------------- |
| create                   | `POST /`                                          | `GoalChannels.CREATE`                          | `CreateGoalSchema`                     | `GoalMutationReceiptSchema` | map 有，route 未绑定 runtime |
| update                   | `PUT/PATCH /:id`                                  | `GoalChannels.UPDATE`                          | `UpdateGoalSchema`                     | `GoalMutationReceiptSchema` | map 缺                       |
| delete                   | `DELETE /:id`                                     | `GoalChannels.DELETE`                          | `GoalVersionCommandSchema`(query)      | `GoalMutationReceiptSchema` | map 缺                       |
| archive-expired          | `POST /archive-expired`                           | `GoalChannels.ARCHIVE_EXPIRED`                 | —                                      | `ArchiveExpiredResSchema`   | map 缺                       |
| archive                  | `POST /:id/archive`                               | `GoalChannels.ARCHIVE`                         | `GoalVersionCommandSchema`             | `GoalMutationReceiptSchema` | map 缺                       |
| activate                 | `POST /:id/activate`                              | `GoalChannels.ACTIVATE`                        | `GoalVersionCommandSchema`             | `GoalMutationReceiptSchema` | map 缺                       |
| complete                 | `POST /:id/complete`                              | `GoalChannels.COMPLETE`                        | `GoalVersionCommandSchema`             | `GoalMutationReceiptSchema` | map 缺                       |
| clone                    | `POST /:id/clone`                                 | `GoalChannels.CLONE`                           | `CloneGoalSchema`                      | `GoalMutationReceiptSchema` | map 缺                       |
| key-result add           | `POST /:id/key-results`                           | `GoalChannels.KEY_RESULT_ADD`                  | `AddKeyResultSchema`                   | `GoalMutationReceiptSchema` | map 有                       |
| key-result update        | `PUT /:id/key-results/:krId`                      | `GoalChannels.KEY_RESULT_UPDATE`               | `UpdateKeyResultSchema`                | `GoalMutationReceiptSchema` | map 缺                       |
| key-result progress      | `PATCH /:id/key-results/:krId/progress`           | —                                              | `UpdateKeyResultProgressSchema`        | `GoalMutationReceiptSchema` | map 缺                       |
| key-result delete        | `DELETE /:id/key-results/:krId`                   | `GoalChannels.KEY_RESULT_DELETE`               | `DeleteKeyResultSchema`                | `GoalMutationReceiptSchema` | map 缺                       |
| key-result batch weights | `PUT /:id/key-results/batch-weight`               | `GoalChannels.KEY_RESULT_BATCH_UPDATE_WEIGHTS` | `BatchUpdateKeyResultWeightsReqSchema` | `GoalMutationReceiptSchema` | map 缺                       |
| review create            | `POST /:id/reviews`                               | `GoalChannels.REVIEW_CREATE`                   | `CreateGoalReviewSchema`               | `GoalMutationReceiptSchema` | map 缺                       |
| review update            | `PUT /:id/reviews/:reviewId`                      | `GoalChannels.REVIEW_UPDATE`                   | `UpdateGoalReviewSchema`               | `GoalMutationReceiptSchema` | map 缺                       |
| review delete            | `DELETE /:id/reviews/:reviewId`                   | `GoalChannels.REVIEW_DELETE`                   | `DeleteGoalReviewSchema`               | `GoalMutationReceiptSchema` | map 缺                       |
| record create            | `POST /:id/key-results/:krId/records`             | `GoalChannels.RECORD_CREATE`                   | `CreateGoalRecordSchema`               | `GoalMutationReceiptSchema` | map 缺                       |
| record delete            | `DELETE /:id/key-results/:krId/records/:recordId` | `GoalChannels.RECORD_DELETE`                   | `DeleteGoalRecordSchema`               | `GoalMutationReceiptSchema` | map 缺                       |
| focus activate           | `POST /focus-mode/activate`                       | `GoalChannels.FOCUS_MODE_ACTIVATE`             | `ActivateFocusModeSchema`              | `FocusModeClientDTOSchema`  | map 缺                       |
| focus deactivate         | `POST /focus-mode/deactivate`                     | `GoalChannels.FOCUS_MODE_DEACTIVATE`           | —                                      | `FocusModeClientDTOSchema`  | map 缺                       |
| focus extend             | `POST /focus-mode/extend`                         | `GoalChannels.FOCUS_MODE_EXTEND`               | `ExtendFocusModeSchema`                | `FocusModeClientDTOSchema`  | map 缺                       |
| folder create            | `POST /`                                          | `GoalChannels.FOLDER_CREATE`                   | `CreateGoalFolderSchema`               | `GoalFolderClientDTOSchema` | map 有                       |
| folder update            | `PUT/PATCH /:id`                                  | `GoalChannels.FOLDER_UPDATE`                   | `UpdateGoalFolderSchema`               | `GoalFolderClientDTOSchema` | map 缺                       |
| folder delete            | `DELETE /:id`                                     | `GoalChannels.FOLDER_DELETE`                   | —                                      | `z.null()`                  | map 缺                       |

Read/query rows（route spec 保留，非 parity mutation）：list、search、get、
aggregate、progress-breakdown、key-result list、review list、record list、
focus-mode get、folder list/get。

### 1.2 Task（Step 3 target）

| operation                   | HTTP surface                         | IPC channel                   | Request schema                 | Response schema                           | Chain  |
| --------------------------- | ------------------------------------ | ----------------------------- | ------------------------------ | ----------------------------------------- | ------ |
| template create             | `POST /task-templates`               | `TEMPLATE_CREATE`             | `CreateTaskTemplateSchema`     | `CreateTaskTemplateResponseSchema`        | map 有 |
| template update             | `PUT/PATCH /:id`                     | `TEMPLATE_UPDATE`             | `UpdateTaskTemplateSchema`     | `TaskTemplateResponseSchema`              | map 有 |
| template delete             | `DELETE /:id`                        | `TEMPLATE_DELETE`             | —                              | `z.null()`                                | map 缺 |
| template activate           | `POST /:id/activate`                 | `TEMPLATE_RESTORE`            | —                              | `TaskTemplateResponseSchema`              | map 缺 |
| template pause              | `POST /:id/pause`                    | `TEMPLATE_PAUSE`              | —                              | `TaskTemplateResponseSchema`              | map 缺 |
| template archive            | `POST /:id/archive`                  | `TEMPLATE_ARCHIVE`            | —                              | `TaskTemplateResponseSchema`              | map 缺 |
| template generate instances | `POST /:id/generate-instances`       | `TEMPLATE_GENERATE_INSTANCES` | `GenerateInstancesSchema`      | `z.array(TaskInstanceResponseSchema)`     | map 有 |
| template bind goal          | `POST /:id/bind-goal`                | `TEMPLATE_BIND_GOAL`          | `TaskGoalBindingSchema`        | `TaskTemplateResponseSchema`              | map 有 |
| template unbind goal        | `POST /:id/unbind-goal`              | `TEMPLATE_UNBIND_GOAL`        | —                              | `TaskTemplateResponseSchema`              | map 有 |
| instance create(start)      | `POST /task-instances/:id/start`     | `INSTANCE_CREATE`             | —                              | `TaskInstanceResponseSchema`              | map 缺 |
| instance delete             | `DELETE /:id`                        | `INSTANCE_DELETE`             | —                              | `z.null()`                                | map 缺 |
| instance complete           | `POST /:id/complete`                 | `INSTANCE_COMPLETE`           | `CompleteTaskInstanceSchema`   | `TaskInstanceResponseSchema`              | map 有 |
| instance uncomplete         | `POST /:id/uncomplete`               | `INSTANCE_UNCOMPLETE`         | —                              | `TaskInstanceResponseSchema`              | map 缺 |
| instance skip               | `POST /:id/skip`                     | `INSTANCE_SKIP`               | `SkipTaskInstanceSchema`       | `TaskInstanceResponseSchema`              | map 有 |
| instance check expired      | `POST /task-instances/check-expired` | `INSTANCE_CHECK_EXPIRED`      | —                              | `CheckExpiredTaskInstancesResponseSchema` | map 缺 |
| dependency create           | `POST /tasks/:taskId/dependencies`   | `DEPENDENCY_CREATE`           | `CreateDependencyBodySchema`   | `TaskDependencyResponseSchema`            | map 缺 |
| dependency update           | `PUT /tasks/dependencies/:id`        | `DEPENDENCY_UPDATE`           | `UpdateDependencyBodySchema`   | `TaskDependencyResponseSchema`            | map 缺 |
| dependency delete           | `DELETE /tasks/dependencies/:id`     | `DEPENDENCY_DELETE`           | —                              | `z.null()`                                | map 缺 |
| dependency validate         | `POST /tasks/dependencies/validate`  | `DEPENDENCY_VALIDATE`         | `ValidateDependencyBodySchema` | `ValidateDependencyResponseSchema`        | map 缺 |

Read/query rows：template list/graph/get-by-priority/get/instances、instance
list/by-date-range/get、dependency list/dependents/chain。

### 1.3 Notification（Step 4 target）

| operation          | HTTP surface          | IPC channel                               | Request schema                       | Response schema                        | Chain                                        |
| ------------------ | --------------------- | ----------------------------------------- | ------------------------------------ | -------------------------------------- | -------------------------------------------- |
| create             | `POST /notifications` | `NotificationChannels.CREATE`             | `CreateNotificationSchema`           | `NotificationResponseSchema`           | map 有                                       |
| delete             | `DELETE /:id`         | `NotificationChannels.DELETE`             | —                                    | `z.null()`                             | map 缺（仅 delete-batch）                    |
| mark read          | `PATCH /:id/read`     | `NotificationChannels.MARK_READ`          | —                                    | `NotificationResponseSchema`           | map 缺                                       |
| mark all read      | `PATCH /read-all`     | `NotificationChannels.MARK_ALL_READ`      | —                                    | `UnreadCountResponseSchema`            | map 缺                                       |
| batch read         | `POST /batch-read`    | —                                         | `NotificationIdsBatchSchema`         | `NotificationBatchResultSchema`        | map 有（mark-as-read-batch）                 |
| batch delete       | `POST /batch-delete`  | `NotificationChannels.CLEAR_ALL`          | `NotificationIdsBatchSchema`         | `NotificationBatchResultSchema`        | map 有（delete-batch）；CLEAR_ALL 传 raw ids |
| cleanup            | `POST /cleanup`       | —                                         | `CleanupOldNotificationsSchema`      | `NotificationBatchResultSchema`        | map 有                                       |
| preferences update | `PUT /preferences`    | `NotificationChannels.PREFERENCES_UPDATE` | `UpdateNotificationPreferenceSchema` | `NotificationPreferenceResponseSchema` | map 有（preference:update）                  |

Read/query rows：list、get、unread-count、preferences get、dead-letters、
receipts、timeline、audit、SSE。Protocol-only rows（无 transport wiring）：
`notification:update`、`notification:get-stats`、`notification:execute-action`、
`notification:send`、`notification-channel:retry`、`notification-channel:list`
→ Step 4 记录 unsupported-surface spec，不静默保持不同 payload。

## 2. Production `as unknown as` cast allowlist（Step 0 baseline）

> Step 5 目标：把 **transport DTO / application 边界 / Prisma-row→contract 边界**
> 的生产 cast 替换为 named mapper；低层 native/transaction/domain-client
> 与 SSE 结构 cast 保留为显式 allowlist。test fixture casts（`*.spec.ts` /
> `*.test.ts` / `testing/`）不是迁移目标。

### 2.1 Goal

| file:line                                                                                   | boundary                                                    | 处理                                  |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------- |
| `goal/src/api/routes/goal-folder.routes.ts:90`                                              | HTTP query → branded folder id（transport DTO）             | Step 5 mapper / query schema          |
| `goal/src/server/transport/goal.controller.ts:272`                                          | DTO → Record（keyResults 提取）                             | Step 5 mapper                         |
| `goal/src/server/transport/goal-folder.controller.ts:57,74`                                 | context identity → branded `IdentityId`（application 边界） | Step 5 mapper                         |
| `goal/src/server/application/use-cases/commands/create-goal.use-case.ts:66,67`              | input branded folder/goal id（application 边界）            | Step 5 mapper                         |
| `goal/src/server/application/use-cases/commands/update-goal.use-case.ts:62,110`             | input branded folder/goal id（application 边界）            | Step 5 mapper                         |
| `goal/src/server/domain/aggregates/goal.ts:1214-1224`                                       | domain 内部 snapshot branded ids                            | 保留（domain 内部，非 transport DTO） |
| `goal/src/server/infrastructure/adapters/prisma/prisma-goal-write-transaction-runner.ts:24` | 低层 transaction native cast                                | allowlist（native handle）            |

### 2.2 Task

| file:line                                                                                        | boundary                          | 处理                                |
| ------------------------------------------------------------------------------------------------ | --------------------------------- | ----------------------------------- |
| `task/src/application-client/task-client-service.ts:136,137`                                     | client DTO → branded goal binding | Step 5 mapper（application-client） |
| `task/src/server/infrastructure/adapters/prisma/mappers/prisma-task-template-mapper.ts:130`      | Prisma row enum → domain          | Step 5 mapper                       |
| `task/src/server/infrastructure/adapters/powersync/mappers/powersync-task-instance.mapper.ts:37` | PowerSync row enum → domain       | Step 5 mapper                       |
| `task/src/server/application/outbox/task-goal-outbox-dispatcher.ts:94`                           | outbox event version cast         | allowlist（event 版本化边界）       |
| `task/src/testing/task-smoke-app.ts:125,157`                                                     | test helper                       | allowlist（testing）                |

### 2.3 Notification

| file:line                                                                                                                   | boundary                                   | 处理                                            |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| `notification/src/api/routes.ts:352,371,372`                                                                                | SSE res flush / event id（stream adapter） | allowlist（SSE native，Step 4 不改 SSE）        |
| `notification/src/infrastructure-client/adapters/http/notification-http.adapter.ts:43`                                      | client HTTP query                          | Step 5 mapper（若可表达）                       |
| `notification/src/server/infrastructure/powersync.ts:234,238`                                                               | desktop transport ack native opts          | allowlist（native handle）                      |
| `notification/src/server/infrastructure/runtime/notification.runtime.ts:290,305,483,853,896,906,1016`                       | runtime 结构探测（isAvailable/getAck 等）  | allowlist（native runtime）                     |
| `notification/src/server/infrastructure/adapters/deliverers/real-channel-deliverers.ts:30,37,73,174,177,198`                | deliverer 结构探测                         | allowlist（native runtime）                     |
| `notification/src/server/infrastructure/adapters/prisma/notification-reliable-operation-prisma.adapter.ts:431,446,450`      | Prisma ret `applied` 标记                  | allowlist（native Prisma 返回变异）             |
| `notification/src/server/infrastructure/adapters/powersync/power-sync-notification-reliable.adapter.ts:666,676,680`         | PowerSync ret `applied` 标记               | allowlist（native PowerSync 返回变异）          |
| `notification/src/server/infrastructure/adapters/prisma/notification-template-prisma.repository.ts:133,149,158,177,197,208` | Prisma row → domain                        | Step 5 mapper（mapPrismaTemplateToDomain 内收） |
| `notification/src/server/infrastructure/adapters/prisma/notification-preference-prisma.repository.ts:55,63`                 | Prisma row → domain                        | Step 5 mapper                                   |
| `notification/src/domain-client/aggregates/notification.ts:169,170`                                                         | domain-client branded id                   | allowlist（domain-client 边界）                 |
| `notification/src/domain-client/aggregates/notification-preference.ts:93,94`                                                | domain-client branded id                   | allowlist（domain-client 边界）                 |
| `notification/src/domain-client/entities/notification-channel.ts:152,153`                                                   | domain-client branded id                   | allowlist（domain-client 边界）                 |

## 3. Validation ordering & envelope baseline

- 缺失 auth → `401`；malformed input → controller `VALIDATION_ERROR` 400
  （HTTP）/ `fail`（IPC）；domain/application errors 保持现有 Result code/status。
- HTTP success envelope：`createHttpResponseBuilder`（`ok/code/message/data/timestamp`）；
  IPC success：`IpcResult<T>` via `toIpcResult`。204/null 语义按 residual 108 处理。
- SSE：`GET /sse` 专用 stream adapter，不入 JSON mutation adapter；本阶段只断言
  其不回归 shared context/envelope ownership。
