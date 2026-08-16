---
tags:
  - plan
  - active
  - architecture
  - reference-architecture
  - transport-parity
  - contracts
  - p1
description: Reference architecture phase 4: converge HTTP/IPC transport validation and contracts / 参考架构阶段 4：收敛 HTTP/IPC 传输验证与契约
created: 2026-08-15T00:00:00Z
updated: 2026-08-15T00:00:00Z
---

# Reference Architecture Phase 4: Transport Parity and Contract Convergence / 参考架构阶段 4：Transport parity 与 contracts 收敛

## 文档状态

- **状态**：Active，read-only implementation plan；本文冻结契约、迁移顺序、测试矩阵和回滚单位。本轮写计划，不修改生产代码、测试或 ADR。
- **分支基线**：`feat/refarch-phase4-transport-parity`，`HEAD = f48400350`。
- **依据**：
  - `docs/analysis/2026-08-13-architecture-refactor-review.md`：§1、§3.4、§3.7、§3.8、§4、§6 阶段 4。
  - `docs/plan/archive/2026-08-15-refarch-phase2-request-context.md`：canonical `ExecutionContext`、HTTP/IPC adapter 和 direct Vitest gate 约束。
  - `AGENT.md`：governance-first 顺序（governance → goal/task → 批量模块）、复杂任务先写计划和文档/治理门禁；本阶段按任务要求只使用 direct Vitest，不使用 Nx package test。
  - 当前 `packages/contracts` RPC/schema/response surface、`packages/utils/src/result/*adapter.ts`、Goal/Task/Notification routes/controllers/Electron handlers 与 OpenAPI registry。
- **实施原则**：先在 `packages/governance` 验证 adapter、fixture、response envelope 和 public-surface 规则，再按 Goal → Task → Notification 推广；每一步是可审查、可直接测试、可单独回滚的 diff。

## 1. 目标与非目标

### 1.1 目标

1. 将 Goal、Task、Notification 的 transport 输入验证移到共享 `expressAdapterWithValidation` 与 `ipcAdapterWithValidation`；HTTP route 和 Electron IPC handler 不再各自调用 `safeParse`、手工拼装 validation error 或接受未经 contract 解析的 DTO。
2. 为每一个 mutation 建立同一 canonical fixture 的 HTTP/IPC parity test：两条 transport 只负责提取/验证/响应转换，最终调用同一个 `ApplicationPort`/controller method，并返回相同业务 `Result`、错误 code/details 和 response data shape。
3. 让每个 mutation 的 RPC map、Zod request schema、Zod response/envelope schema 和 HTTP/IPC registration 可追踪且只有一个 source of truth；OpenAPI 直接复用该 schema，不复制 inline DTO。
4. 清理生产代码中跨 transport、domain、database 的 `as unknown as` DTO 强转；在边界增加命名 mapper，并保留必要的测试 doubles、Electron/Prisma native API casts 作为明确 allowlist。
5. 建立 contracts surface specs、HTTP route specs、Electron IPC specs、OpenAPI generation check 和 mutation inventory，阻止 validation、RPC、response envelope 或 channel drift。
6. 所有新增/修改的 public type、adapter option、mapper、factory、fixture helper 和 transport registration 都有英文 + 中文双语 JSDoc；private helper 不为满足规则添加空洞注释。

### 1.2 非目标

- 不改变 Goal/Task/Notification Application Port、domain rule、repository、transaction、event、outbox、PowerSync 或 Prisma 业务语义。
- 不改变 HTTP path、method、status code、IPC channel string、renderer-facing positional invocation 的兼容行为；需要改 wire payload 时先记录迁移/回滚策略并在本阶段停止推广。
- 不把 HTTP DTO、IPC payload、domain aggregate、Prisma row 或 Python shape 合并为万能类型；mapper 是边界而不是统一大类型。
- 不把 `identityId` 放回 request body/query；identity 只来自 Phase 2 canonical `ExecutionContext`，contract schema 不为 transport workaround 增加 identity 字段。
- 不在 controller/application 重复做同一 Zod shape validation；领域不变量和权限/所有权规则仍在 application/domain。
- 不迁移 AI、Reminder、Schedule、Account 等非样本模块；本阶段只留下可复制的 governance/Goal/Task/Notification pattern。
- 不运行已知会 hang 或扩大依赖范围的 `pnpm nx run <package>:test`；实现 gate 使用 direct Vitest 文件/config 命令。

## 2. 当前状态盘点

### 2.1 已有能力与缺口

| 区域                  | 当前证据                                                                                                                                                                                                 | 本阶段处理                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Shared adapters       | `packages/utils/src/result/express-adapter.ts` 已有 `expressAdapterWithValidation`，但只默认解析 `req.body`；`ipc-adapter.ts` 已有 `ipcAdapterWithValidation`                                            | 扩展为可验证 body/params/query 或 IPC projected args 的单一入口，保持旧 body shorthand 和 envelope 行为               |
| Route registration    | `packages/utils/src/result/route-registrar.ts` 现在总是调用 `expressAdapter`；Goal/Task/Notification routes 仅把 schema 放入 OpenAPI definition                                                          | 让 route definition 显式绑定 validation schema/input projector；OpenAPI definition 与 runtime schema 必须来自同一对象 |
| Controller validation | Goal、Task、Notification controllers 多处 `Schema.safeParse`（例如 `goal.controller.ts`、`task-template.controller.ts`、`notification.controller.ts`）                                                   | 把 transport shape parse 前移；controller 接收 inferred input，保留业务错误和 application result mapping              |
| HTTP/IPC split        | Goal/Task/Notification Electron handlers 直接把 raw dto/positional args 传入 controller；部分 Notification handlers只接 identity                                                                         | 用 shared projected fixture、canonical context 和 validation adapter，使两个宿主走同一 controller/application seam    |
| Contract chain        | `packages/contracts/src/modules/{goal,task,notification}/protocol/*-rpc-map.ts`、`api/*dto.ts`、`api/response-schemas.ts` 已存在，但不是每个 live mutation 都被 map、schema、route、IPC surface 同时锁定 | 建立 mutation ledger 和 surface specs；缺失项先补 contract，再补 transport                                            |
| Response envelope     | `@memoflow/contracts/result` 与 `@memoflow/utils/result` 已统一 Result/HTTP/IPC conversion；route response registrations 分散                                                                            | 每 mutation 固定 response schema/envelope，HTTP/IPC parity 断言 payload、code、details 和 void/204 语义               |
| DTO casts             | 生产 transport/infrastructure 仍有 Goal `goal.controller.ts`/`goal-folder.controller.ts`、Task mappers/controllers、Notification Prisma mappers 等 `as unknown as` 边界转换                              | 按跨边界 inventory 增加 mapper；测试 doubles/native handles 不扩大为生产 DTO 例外                                     |

### 2.2 冻结的 transport pipeline

```text
HTTP:  auth -> request input projector -> expressAdapterWithValidation
       -> canonical ExecutionContext -> controller -> ApplicationPort -> Result
       -> shared HTTP response envelope + OpenAPI response schema

IPC:   authenticated profile context -> args projector -> ipcAdapterWithValidation
       -> canonical ExecutionContext -> same controller -> same ApplicationPort -> Result
       -> shared IPC result envelope
```

- Adapter 是唯一 transport shape validation owner；controller 不再从 raw `Request`、Electron event 或 body 读取 identity/header，也不再二次 `safeParse` 同一 schema。
- Projector 只把现有 wire payload（包括 positional IPC args）组成 contract input；它不改变 renderer/API wire shape，也不执行业务默认值以外的规则。
- HTTP/IPC 的 context 必须是同一个 Phase 2 `ExecutionContext` fixture shape。HTTP identity 来自 auth middleware，IPC identity 来自 authenticated profile context；fixture body 中出现 `identityId` 必须被 schema 拒绝或忽略，不能覆盖 context。
- Response conversion 只消费 `Result<T>`；HTTP status/envelope 与 IPC `IpcResult<T>` 由 shared result adapters 生成，不能在 route/handler 中手工包装成功或错误对象。

## 3. 契约冻结

### 3.1 Single source of truth rule

每个 mutation 必须能沿下列链路反向追踪，且链路中每个名称只指向一个定义：

```text
Zod request schema (input) + z.infer type
  -> RpcMap[operation][0]
  -> HTTP route / IPC channel registration
  -> controller/application method
  -> Zod response schema (data) + z.infer type
  -> shared HTTP/IPC response envelope
```

- RPC map 只 import `../api` 的 inferred request/response types；禁止 map 内联 object type。
- Request schema 是输入唯一 runtime validator；response schema 是 data 唯一 runtime validator/OpenAPI component。`HttpResponse`/`IpcResult` envelope schema 继续来自 shared result contracts。
- HTTP OpenAPI `request` 与 `responses` 注册必须引用相同 schema objects；不得以 `z.object(...)` 在 route 中重写已存在的 contract。
- 需要 path/query/body 合并时，新增命名 contract schema（例如 `GoalMutationInvocationSchema`）或显式 input projector；不得在 route callback 内拼一个未命名 object 后再 cast。
- `identityId`、`deviceId`、request metadata 和 auth principal 不属于 public mutation body schema；由 `ExecutionContext` 传入 application。

### 3.2 Mutation ledger（实施顺序与测试覆盖）

下表是必须逐项关闭的 ledger。`*Schema`/`*ResSchema` 以当前 contracts export 为准；若某 operation 当前没有正式 schema，先在 contracts step 补齐再改 transport。

| 模块/operation                   | HTTP surface                                                                                                                                            | IPC channel                                                                                                                               | Contract chain / response                                                                                                                              | Parity fixture                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Goal core                        | create, update, delete, archive-expired, archive, activate, complete, clone, batch key-result weights                                                   | `GoalChannels.CREATE/UPDATE/DELETE/ARCHIVE_EXPIRED/ARCHIVE/ACTIVATE/COMPLETE/CLONE/KEY_RESULT_BATCH_UPDATE_WEIGHTS`                       | `goal-rpc-map.ts` + `goal-crud.dto.ts`/`response-schemas.ts` + `GoalMutationReceiptSchema`/`ArchiveExpiredResSchema`                                   | one valid input, one malformed input, one domain error, one context owner                              |
| Goal sub-entities                | key-result add/update/progress/delete; review create/update/delete; record create/delete; focus activate/deactivate/extend; folder create/update/delete | corresponding `GoalChannels.KEY_RESULT_*`, `REVIEW_*`, `RECORD_*`, `FOCUS_MODE_*`, `FOLDER_*`                                             | named API schemas in `packages/contracts/src/modules/goal/api`; response schemas for receipt/entity/null                                               | same fixture ids and expectedVersion; no body identity                                                 |
| Task templates                   | create/update/delete, activate, pause, archive/restore, generate instances, bind/unbind goal                                                            | `TaskChannels.TEMPLATE_CREATE/UPDATE/DELETE/ARCHIVE/RESTORE/PAUSE/GENERATE_INSTANCES/BIND_GOAL/UNBIND_GOAL`                               | `task-rpc-map.ts` + task template schemas + `TaskTemplateResponseSchema`/operation response                                                            | object fixture projected from existing IPC payload                                                     |
| Task instances                   | create/delete, complete/uncomplete, skip, start, check expired                                                                                          | `TaskChannels.INSTANCE_CREATE/DELETE/COMPLETE/UNCOMPLETE/SKIP` and `INSTANCE_CHECK_EXPIRED`                                               | task instance DTO/request schemas + `TaskInstanceResponseSchema`/check-expired response                                                                | same instance id, note/reason and expected result                                                      |
| Task dependencies                | create, update, delete; validate is a command-like mutation and is included                                                                             | `TaskChannels.DEPENDENCY_CREATE/UPDATE/DELETE/VALIDATE`                                                                                   | `CreateDependencyBodySchema`, `UpdateDependencyBodySchema`, `ValidateDependencyBodySchema` + dependency/validation responses                           | same template ids and dependency body                                                                  |
| Notification CRUD/status         | create, update, delete, mark one read, mark all read, batch read, batch delete, cleanup                                                                 | HTTP routes plus `NotificationChannels.CREATE/DELETE/MARK_READ/MARK_ALL_READ/CLEAR_ALL`                                                   | `notification-rpc-map.ts` + notification CRUD/batch schemas + `NotificationResponseSchema`/`NotificationBatchResultSchema`/`UnreadCountResponseSchema` | same notification ids and context identity                                                             |
| Notification preferences/actions | update preferences; action/send/retry where an application port/channel exists                                                                          | `NotificationChannels.PREFERENCES_UPDATE`; protocol keys `notification:execute-action`, `notification:send`, `notification-channel:retry` | preference/action/send/retry schemas + response schema; no ad hoc DTO                                                                                  | same action/channel fixture; assert unsupported transport is explicitly absent, not silently divergent |

Read/query operations are not parity mutations, but every route touched by the adapter extension must retain a route spec for query/params validation and response envelope. SSE remains a dedicated stream adapter; this plan only asserts that it does not regress shared context/envelope ownership.

### 3.3 Validation semantics

- `expressAdapterWithValidation` gains a minimal input source/projector option. Body-only callers keep the existing shorthand; composite routes validate one named schema over `{ params, query, body }` projected into the contract input. The adapter returns the existing `VALIDATION_ERROR` details and never calls the controller on failure.
- `ipcAdapterWithValidation` validates the projected canonical input, not an arbitrary `arguments` array. Existing positional channels use a named projector next to the channel registration; the projector is tested and contains no schema logic.
- Validation runs after auth/context extraction and before controller/application invocation. Missing auth remains `401`; malformed input remains `400`/`VALIDATION_ERROR`; domain/application errors preserve existing result code/status.
- Parsed data, not raw data, reaches controller/application. Unknown keys follow the schema’s existing strictness; this phase does not silently strip or accept identity fields to make parity pass.
- The same fixture is fed to both transports at the canonical input level. Tests may use different wire encodings only where the existing HTTP/IPC contract requires it, and must assert both project to byte-for-byte equivalent canonical input.

### 3.4 Mapper and cast policy

- Add small, named mappers at each real boundary: `toGoal*Input/fromGoal*Response`, `toTask*Input/fromTask*Response`, `toNotification*Input/fromNotification*Response`, and Prisma row mappers where the generated row shape differs from a contract/domain DTO.
- Mappers own branded-id conversion, enum narrowing, nullable/default fields, date/timestamp conversion and nested response projection. They must not perform persistence, authorization or business decisions.
- Add a production-only cast inventory surface spec. It fails for new `as unknown as` in transport DTO/application boundary and Prisma-row-to-contract boundary, while allowing test doubles, generated/native APIs and explicit low-level transaction adapters with a comment and owner.
- Do not replace a cast with `any`, a broad `Record<string, unknown>`, or a second DTO that duplicates the contract. If a mapper cannot type-check, fix the source type or add the missing contract field.

### 3.5 Public documentation contract

Every new/changed public declaration must include an English sentence and a Chinese sentence in the same JSDoc block: adapter options and projector types, mutation fixture helpers, mapper exports, RPC map additions, and any public surface test helper. Existing public declarations touched for migration receive bilingual JSDoc in the same diff. ADR/docs record the policy; comments do not replace tests.

## 4. 分步实施（PR-able steps）

### Step 0 — Baseline, inventory, and rollback marker (P0 gate)

**目标**：在修改 contract 前固定当前 behavior、mutation ledger 和 cast allowlist。

**文件与变更**

- Add `packages/contracts/src/modules/{goal,task,notification}/protocol/*-rpc-map.surface.spec.ts` or extend the existing dual-registry surface specs to enumerate every ledger row and detect missing schema/type references.
- Add a short machine-readable mutation inventory under `docs/analysis/2026-08-15-refarch-phase4-transport-parity-inventory.md` only if implementation needs a durable before/after record; record route path, channel, request schema, response schema, controller method and current validation owner.
- Capture the baseline `as unknown as` inventory with file/line, boundary category and allowed reason. Test fixture casts are not migration targets.
- Do not modify production code in this step.

**测试与直接门禁**

- Direct contracts/route/IPC focused Vitest suites for existing surface specs.
- `node node_modules/vitest/vitest.mjs run --config packages/contracts/vitest.config.ts <focused surface files>`.
- `node node_modules/vitest/vitest.mjs run --config packages/goal/vitest.config.ts packages/goal/src/api/routes/*.spec.ts` (and equivalent Task/Notification files where supported; use explicit files, not package Nx targets).
- `pnpm exec prettier --check docs/plan/active/2026-08-15-refarch-phase4-transport-parity.md`.

**完成条件**：ledger has no unowned operation, baseline fixtures preserve current status/envelope behavior, and cast allowlist distinguishes production DTO casts from test/native infrastructure casts.

### Step 1 — Contract source and governance-first adapter pilot (P0/P1)

**目标**：先让 reference module demonstrate one complete schema → RPC → HTTP/IPC → envelope chain before touching Goal/Task/Notification.

**文件与变更**

- Update `packages/contracts/src/modules/{goal,task,notification}/api/*` and `protocol/*-rpc-map.ts` only where the ledger exposes a missing request/response schema or map entry; preserve existing names and inferred types.
- Extend `packages/utils/src/result/express-adapter.ts`, `ipc-adapter.ts`, `route-registrar.ts` with the minimal input projector/source option. Keep body-only compatibility, shared `formatZodErrors`, `Result` mapping and 204 behavior. Add bilingual JSDoc for every new public option/type.
- Add governance sample route/controller/IPC fixture using one representative mutation and the real `expressAdapterWithValidation`/`ipcAdapterWithValidation`; do not create a parallel validation helper.
- Add surface rules that require route registration to bind the same schema object used by OpenAPI and reject controller/route `safeParse` for the migrated operation.
- If the rule needs an architecture decision, add `docs/architecture/adr/ADR-047-transport-contract-parity.md` and update `docs/architecture/adr/README.md`; otherwise update the Phase 4 section of `docs/standards/architecture.md` with the same source-of-truth rule. Do not create both.

**测试与直接门禁**

- `packages/utils/src/result/express-adapter.spec.ts`, `ipc-adapter.spec.ts`, `route-registrar.spec.ts`: valid/invalid projected input, parsed data reaches controller, auth ordering, error details, 204 and envelope parity.
- `packages/governance/src/api/routes/*.spec.ts`, `packages/governance/src/electron/*.spec.ts`, and a new governance transport parity spec: same fixture calls one spy Application method from HTTP and IPC and returns equivalent data/error.
- `packages/contracts/src/modules/*/protocol/*surface.spec.ts`: map/schema/response references and no inline RPC DTO.
- Direct gate: `node node_modules/vitest/vitest.mjs run --config packages/utils/vitest.config.ts <changed result specs>`; `node node_modules/vitest/vitest.mjs run --config packages/contracts/vitest.config.ts <changed surface specs>`; `node node_modules/vitest/vitest.mjs run --config packages/governance/vitest.config.ts <focused transport specs>`.

**Step gate**：governance proves validation is adapter-owned, HTTP/IPC use the same fixture and envelope, and direct tests pass before feature rollout. A failing governance pilot blocks Goal/Task/Notification.

### Step 2 — Goal transport parity and validation migration (P1)

**目标**：迁移 Goal 全部 mutation routes/IPC handlers，保留 wire、controller/application semantics，并让每个 ledger row 有双宿主 fixture。

**文件与变更**

- Update `packages/goal/src/api/routes/goal.routes.ts`, `goal-folder.routes.ts`, `key-result.routes.ts`, `goal-record.routes.ts`, `review.routes.ts`, `focus-mode.routes.ts` to bind contract schemas through the validation-aware registrar/adapter. Remove route callback casts and controller-facing `safeParse` duplication; query alias normalization remains a pure projector, not a validator.
- Update `packages/goal/src/electron/index.ts`, `authenticated-ipc.ts` and `infrastructure-client/adapters/ipc/{goal,goal-folder,goal-focus}-ipc.adapter.ts` to validate projected existing args with `ipcAdapterWithValidation`. Preserve `GoalChannels` names and positional invocations.
- Update `packages/goal/src/server/transport/{goal,goal-folder}.controller.ts` to accept inferred parsed inputs, retain domain/application errors, and return the response schema’s data shape without transport validation branches.
- Update `packages/goal/src/server/transport/goal.transport-handlers.ts` only if a method signature needs an explicit mapper; HTTP and IPC must continue to consume the same `GoalApplicationPort`.
- Add `packages/goal/src/server/transport/__tests__/goal-transport-parity.spec.ts` with one `it.each` row per Goal ledger operation. Include valid, malformed, context identity mismatch, domain error and void/receipt response cases.
- Add/extend route and Electron specs to assert no controller call on invalid input, exact `GoalChannels` registration, same `GoalMutationReceiptSchema` parse and same Result error code/details.

**测试与直接门禁**

- `node node_modules/vitest/vitest.mjs run --config packages/goal/vitest.config.ts packages/goal/src/api/routes/*.spec.ts packages/goal/src/electron/index.spec.ts packages/goal/src/server/transport/__tests__/goal-transport-parity.spec.ts`.
- Direct contracts focused run for Goal response/RPC surface specs.
- `pnpm exec prettier --check` on all changed Goal/contracts/utils files; no `pnpm nx run goal:test`.

**完成条件**：all Goal mutation ledger rows are adapter-validated, HTTP/IPC parity tests pass against the same fixture, route/controller `safeParse` inventory has no migrated operation, and existing HTTP status/channel/envelope snapshots are unchanged.

### Step 3 — Task transport parity and validation migration (P1)

**目标**：在 Goal pattern 通过后迁移 Task template/instance/dependency mutations without changing recurrence, completion, dependency or transaction behavior.

**文件与变更**

- Update `packages/task/src/api/routes/task-template.routes.ts`, `task-instance.routes.ts`, `task-dependency.routes.ts` and any route index to use the validation-aware registrar/adapter for body/params/query projectors. Remove transport `safeParse` from `packages/task/src/server/transport/task-{template,instance,dependency}.controller.ts` once adapter input is typed.
- Update `packages/task/src/electron/index.ts` and `packages/task/src/infrastructure-client/adapters/ipc/*` to use `ipcAdapterWithValidation` for template, instance and dependency command payloads. Existing positional payloads are projected into the exact RPC map request type.
- Update `packages/contracts/src/modules/task/api` and `task-rpc-map.ts` for any missing mutation request/response schema; response registrations must use `response-schemas.ts` and shared envelope helpers.
- Add `packages/task/src/server/transport/__tests__/task-transport-parity.spec.ts` with one row per template/instance/dependency mutation, including `check-expired`/`validate` command-like operations. Assert parsed input equality, same controller spy call, same error details and same response schema.
- Keep domain/application validation (circular dependency, completion transition, recurrence rules) in application/domain; only shape/primitive validation moves to adapters.

**测试与直接门禁**

- `node node_modules/vitest/vitest.mjs run --config packages/task/vitest.config.ts packages/task/src/api/routes/*.spec.ts packages/task/src/electron/index.spec.ts packages/task/src/server/transport/__tests__/task-transport-parity.spec.ts`.
- Direct contracts Task surface specs and focused utils adapter specs.
- `pnpm exec prettier --check` on changed files; any typecheck/lint is scoped to directly changed projects and does not replace direct Vitest.

**完成条件**：Task ledger is green for HTTP and IPC; no migrated controller/route owns Zod shape parsing; task domain/application tests remain green and no IPC channel or status/envelope drift is observed.

### Step 4 — Notification transport parity and validation migration (P1)

**目标**：迁移 Notification CRUD/status/preferences mutation paths while treating SSE and custom-renderer channel ownership as separate concerns.

**文件与变更**

- Update `packages/notification/src/api/routes.ts` to bind create, update, delete, mark-read, batch-read, batch-delete, cleanup, read-all and preference update schemas through the shared validation adapter. Keep SSE route’s stream lifecycle and Phase 2 context extraction; do not make SSE a JSON mutation adapter.
- Update `packages/notification/src/electron/index.ts` so core channels use `ipcAdapterWithValidation` for payload-bearing commands. Empty payload commands use an explicit `z.undefined()`/void contract rather than ad hoc array checks; `CLEAR_ALL` validates the canonical batch request before calling the controller.
- Update `packages/notification/src/server/transport/notification.controller.ts` to remove duplicate transport `safeParse`, retain identity-scoped application calls, and return the response schemas/envelopes declared in contracts.
- Reconcile `notification-rpc-map.ts` with actual live HTTP/IPC operations. For protocol-only execute/send/retry operations, either register both transports with their canonical schema or record an explicit unsupported-surface spec; never leave a map entry that silently has a different payload on one host.
- Add `packages/notification/src/server/transport/__tests__/notification-transport-parity.spec.ts` and extend `packages/notification/src/api/routes.spec.ts`, `src/electron/index-lifecycle.spec.ts` to cover every Notification ledger mutation, validation failure, batch empty input, preference identity scoping, null/delete response and error envelope.

**测试与直接门禁**

- `node node_modules/vitest/vitest.mjs run --config packages/notification/vitest.config.ts packages/notification/src/api/routes.spec.ts packages/notification/src/electron/index-lifecycle.spec.ts packages/notification/src/server/transport/__tests__/notification-transport-parity.spec.ts`.
- Direct contracts Notification surface specs and focused utils adapter specs.
- Existing SSE-focused specs must run directly if `routes.ts` changes; assert first-header/framing behavior is unchanged.

**完成条件**：all Notification mutation rows have a validated canonical fixture and matching HTTP/IPC result; core channel cleanup still owns exactly its channels; SSE/custom-renderer behavior is unchanged.

### Step 5 — Mapper completion and production cast cleanup (P1)

**目标**：在 transport input/output shapes stabilize 后清理真实跨边界强转，避免用 casts 掩盖 contract mismatch。

**文件与变更**

- Goal: add/update named mappers near `packages/goal/src/server/transport` and `server/infrastructure/adapters/*/mappers`; replace `goal.controller.ts` response `Record` cast, `goal-folder.controller.ts` query/id casts, and DTO-to-domain casts with typed projector/mapper calls.
- Task: add/update `packages/task/src/server/transport/mappers/*` and Prisma/PowerSync mapper functions for template/instance/dependency enum/date/nullable fields; remove production DTO casts in task controllers and mapper files where contract types now describe the shape.
- Notification: add/update explicit notification response and Prisma row mappers under `packages/notification/src/server/infrastructure/adapters/prisma/mappers`; remove row/DTO `as unknown as` conversions that can be expressed from generated row types or contract schemas.
- Add a shared or module-local `transport-mapper` surface spec that proves each mapper preserves branded ids, nullable values, enum values, timestamps and response schema parse. Keep mapper names and public exports bilingual-documented.
- Add a production cast inventory spec (or extend existing governance surface) with an allowlist file/comment format. It must fail if a new cross-boundary DTO cast appears after this step.

**测试与直接门禁**

- Direct Goal/Task/Notification mapper and controller suites, plus contracts schema parsers.
- `rg -n "as unknown as" packages/{goal,task,notification}/src/{api,server,transport,infrastructure-client}` reviewed against the allowlist; test files and low-level native/transaction adapters are not silently counted as DTO exceptions.
- Direct Vitest commands for each changed package; `pnpm exec prettier --check` on all changed source/docs.

**完成条件**：no unallowlisted production transport DTO/domain/Prisma conversion uses `as unknown as`; named mappers pass schema/fixture tests and behavior is unchanged.

### Step 6 — Contract surfaces, route/IPC specs, OpenAPI and docs closure (P0/P1 gate)

**目标**：用静态 surface、真实 route/IPC registration 和 OpenAPI generation 把 Phase 4 封口。

**文件与变更**

- Extend `packages/contracts/src/modules/{goal,task,notification}/api/dual-registry.surface.spec.ts`, `protocol/*-rpc-map` surface specs and `packages/contracts/src/electron/ipc-channels.*.surface.spec.ts` to assert mutation ledger completeness, schema identity, response envelope ownership and no identity in mutation body.
- Add/extend HTTP route specs in `packages/{goal,task,notification}/src/api/*.routes.spec.ts` to inspect registered handlers and run valid/invalid request fixtures through the real adapter, not only call `schema.safeParse` in isolation.
- Add/extend Electron IPC specs in each module’s `src/electron/*.spec.ts` plus `packages/contracts/src/electron/authenticated-ipc.spec.ts` to invoke registered handlers with the same fixture and canonical context, assert malformed payload rejection before controller and exact channel ownership/cleanup.
- Add `apps/api/src/shared/infrastructure/openapi/generator.spec.ts` or a focused generation check that calls `generateOpenApiDocument()` after module registration and asserts every ledger HTTP operation has path, request schema and response envelope/data schema. Check no duplicate inline component or missing response.
- Update `docs/architecture/adr/README.md` if ADR-047 was added; update the chosen architecture standard/ADR with the HTTP/IPC parity rule, mapper policy, direct Vitest policy and bilingual public-surface requirement. Do not duplicate the entire ledger outside the plan/inventory and executable specs.
- Add a final plan evidence section only after implementation, recording commands/results; do not pre-fill pass claims now.

**测试与直接门禁**

- Direct focused Vitest: contracts, utils, governance, Goal, Task, Notification, API OpenAPI generator and route/IPC specs. Use explicit files/configs and `node node_modules/vitest/vitest.mjs run`.
- `pnpm exec prettier --check docs/plan/active/2026-08-15-refarch-phase4-transport-parity.md` and all changed files.
- `pnpm nx run memoflow:docs-check --skip-nx-cache`.
- `pnpm nx run memoflow:governance-check --skip-nx-cache`.
- If the implementation changes package exports, run the direct package export/surface tests and the governance check; do not substitute a package Nx test.

**Step gate**：all ledger rows have executable contract, HTTP route, IPC and OpenAPI evidence; direct Vitest, Prettier, docs-check and governance-check pass; only then can Phase 4 be declared complete.

## 5. 验证与门禁总表

### 5.1 必测矩阵

| 层              | 必测行为                                                                                       | 主要入口                                                                          | Gate |
| --------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---- |
| Adapter         | projector, parsed input, auth ordering, validation error, 204/null, Result error mapping       | `packages/utils/src/result/{express-adapter,ipc-adapter,route-registrar}.spec.ts` | P0   |
| Contracts       | request schema ↔ inferred type ↔ RPC map, response schema ↔ envelope, no identity body         | `packages/contracts/src/modules/*/api/*surface.spec.ts`, protocol specs           | P0   |
| Governance      | one mutation fixture through HTTP and IPC into one app spy                                     | governance route/electron parity spec                                             | P0   |
| Goal            | every core/sub-entity/focus/folder mutation; malformed input before controller                 | Goal route/electron/parity specs                                                  | P1   |
| Task            | template/instance/dependency mutations, recurrence/domain errors remain downstream             | Task route/electron/parity specs                                                  | P1   |
| Notification    | CRUD/status/batch/cleanup/preferences, empty batch, identity scope, SSE compatibility          | Notification route/electron/parity/SSE specs                                      | P1   |
| Mappers         | branded ids, enums, null/date fields, response schema parse, no unallowlisted casts            | module mapper specs + inventory surface                                           | P1   |
| OpenAPI         | generated document has all HTTP ledger paths, request and response components, shared envelope | `apps/api/.../openapi/generator.spec.ts`                                          | P0   |
| Docs/governance | bilingual JSDoc, file naming, public exports, route/IPC surface consistency                    | `docs-check`, `governance-check`                                                  | P0   |

### 5.2 每一步的共同 gate

- Diff 只包含该 Step 的 contracts, adapter, feature transport, tests, mapper, governance or ADR/doc files；不得夹带业务功能、schema migration、cache、composition-root 或 unrelated formatting。
- 直接使用 `node node_modules/vitest/vitest.mjs run --config ... [explicit files]`；禁止把 `pnpm nx run <package>:test` 当作本阶段 gate。
- 修改 package 的 direct Vitest 必须在同一步通过；跨 package contract/adapter 改动必须至少运行 utils + contracts + governance focused suites。
- Fixtures 使用完整 canonical `ExecutionContext`，不通过 `as ExecutionContext`、partial object、`identityId` body 或 `any` 掩盖错误。
- 所有新增/修改 public surface 有双语 JSDoc；surface specs 断言内容而不是只靠人工 review。
- Prettier 只对本计划和本 Step 改动文件执行；不得用全仓 formatter 产生无关 diff。

### 5.3 最终完成定义

- Goal/Task/Notification 每一个 mutation ledger row 均有 canonical request schema、RPC map entry、HTTP registration、IPC registration/explicit unsupported spec、response schema 和 parity fixture。
- HTTP 与 IPC 对同一 fixture 调用同一个 controller/Application method；validation failure 不到达业务层；domain/application errors 与 response envelope/status 未改变。
- Routes/controllers/IPC handlers 不再重复验证迁移 operation 的 Zod shape；OpenAPI generation 复用同一 schema objects。
- 生产跨边界 DTO `as unknown as` 已由 named mapper 替代，剩余 casts 有可审查 allowlist；无新增 unallowlisted cast。
- contracts surface、HTTP route specs、Electron IPC specs、OpenAPI generation check、direct Vitest、Prettier、docs-check、governance-check 全部通过。
- 阶段完成只代表 Phase 4 transport parity/contracts convergence；不宣称 Phase 5 Query Cache、Phase 6 observability 或全仓 transport 迁移完成。

## 6. 风险与回滚

| 风险                                | 触发/影响                                                                             | 防护                                                                                         | 回滚单位                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Adapter input projection drift      | HTTP body/query/params 与 IPC positional args 投影成不同 canonical input              | 每 mutation 一个 fixture，断言 projector output 相等；projector 不含 schema/business logic   | 回滚对应 feature Step 的 route/IPC registrations，保留 contracts/adapter tests |
| Validation ordering/auth regression | malformed unauthenticated input变成400，或 auth/context resolver 被调用多次           | adapter ordering spec：auth/context → validation → controller；per-invocation resolver spy   | 回滚 adapter binding，恢复旧 handler；不将 schema改optional                    |
| Response/envelope drift             | status、204、null、error details、trace metadata 改变                                 | response schema + HTTP/IPC snapshot/parity tests；shared result adapter only                 | 回滚对应 feature transport Step；保留 mapper/contract additions若兼容          |
| RPC/schema/OpenAPI duplication      | map、route、OpenAPI 使用不同 DTO，生成文档漏路径                                      | surface identity/completeness specs + generator check                                        | 回滚该 contract row；不手工修生成文档                                          |
| Domain rule accidentally moved      | shape validation迁移时把 business rule 放 adapter 或删除 controller/application rule  | domain/application tests remain required；adapter只验证 contract                             | 回滚该 operation mapper/validation binding，恢复 application rule              |
| Positional IPC compatibility        | 将 args 改成 object 破坏旧 renderer/client                                            | named projector over existing args；channel/adapter specs assert invocation arity and values | 回滚 IPC registration only；保留 canonical schema/map                          |
| Cast cleanup changes runtime shape  | mapper 忘记 nullable/default/enum/date semantics                                      | before/after fixture, schema parse and mapper unit tests；禁止 broad `Record` fallback       | 回滚 mapper for the affected boundary, not the whole transport phase           |
| Notification SSE/channel ownership  | broad IPC cleanup removes custom renderer handler or route change alters flush timing | core channel ownership specs; SSE tests run directly after routes change                     | 回滚 Notification transport Step; do not remove Phase 2 context changes        |
| Governance/docs gate noise          | new ADR/index/public-surface comments cause unrelated audit failures                  | keep files scoped; run Prettier/docs/governance after each doc/contract step                 | revert only doc/index change or fix its declared public surface                |

### 6.1 回滚顺序

1. 首先回滚最后一个 feature transport binding (Notification → Task → Goal)，恢复原 route/IPC adapter selection；保留 already-accepted contract definitions only if they are unused and type-safe.
2. 若 shared adapter regression 影响多个模块，回滚 Step 1 adapter/registrar change as one unit and temporarily keep the governance fixture/spec to reproduce the defect; do not fork a second validation helper.
3. 若 mapper changes alter response shape, roll back only the affected mapper and its parity tests, then re-run that module’s direct suite; do not weaken schemas or reintroduce a broad cast.
4. 若 OpenAPI/docs/governance fails without runtime regression, revert only the ADR/index or surface-rule diff, fix the declared source-of-truth issue, and rerun checks before continuing rollout.
5. 只有 canonical contract itself proven wrong时才回滚 contract row and its RPC map together; never leave an RPC map entry pointing at a deleted schema or an optional validation shim.

## 7. 预期文档/ADR 更新

- Prefer one new ADR, `ADR-047-transport-contract-parity.md`, only if the source-of-truth and adapter-owned validation decision is not already covered by ADR-010/027/030/031. It must state: Zod schema + inferred type + RPC map + response envelope relationship, HTTP/IPC parity fixture rule, mapper boundary and direct Vitest gate.
- Update `docs/architecture/adr/README.md` in the same diff if ADR-047 is created.
- Otherwise update the existing architecture standard section and this plan’s completion record; do not maintain a second prose mutation ledger.
- After implementation, update `docs/plan/active/README.md` only when the plan changes status or moves to archive, following the active/archive README rules.

## 8. 完成记录（实现后回填）

> Implemented on branch `feat/refarch-phase4-transport-parity` (worktree `refarch-tp`),
> 2026-08-16. Working tree changed; nothing committed.

### Steps

- **Step 0** — 完成：mutation ledger（`docs/analysis/2026-08-15-refarch-phase4-transport-parity-inventory.md`）、生产 cast allowlist、goal/task/notification `protocol/*-rpc-map.surface.spec.ts`（枚举 ledger 行 + schema/type 引用检测）。
- **Step 1** — 完成：`expressAdapterWithValidation` / `ipcAdapterWithValidation` / `RouteRegistrar.routeWithValidation` 增加 `projectInput` / `projectArgs` / `validation` 绑定（双语 JSDoc）；governance `createRule` 试点（routeWithValidation + `withAuthenticatedValidation`）；`governance-transport-parity.spec.ts`、`governance-validation-binding.surface.spec.ts`；新增 ADR-047 + ADR README 索引。
- **Step 2** — 完成：Goal 全部 mutation route/IPC 迁移到 adapter 校验（`routeWithValidation` + `registerValidatedChannel`）；新增 goal invocation schemas + RPC map 补齐；controller 接收 inferred input；`goal-transport-parity.spec.ts`（22 行 it.each）。
- **Step 3** — 完成：Task template/instance/dependency 全部 mutation 迁移；`task-invocation.schemas.ts` + RPC map channel 对齐；`task-transport-parity.spec.ts`（16 行）；controller 单测更新为 adapter-owned validation。
- **Step 4** — 完成：Notification CRUD/status/preferences mutation 迁移；`notification-invocation.schemas.ts` + RPC map 对齐（含 protocol-only unsupported 行）；`notification-transport-parity.spec.ts`（7 行）；SSE 路由保持专用 stream adapter 不变。
- **Step 5** — 完成：goal/task/notification 生产 cast 清理为命名 mapper（`goal-transport.mapper.ts`、`task-row.mapper.ts`、`notification-http.mapper.ts`、Prisma row `RowLike` 宽化）；`transport-cast-inventory.surface.spec.ts`（allowlist + 新增 cast 失败门禁）；mapper surface specs。
- **Step 6** — 完成：rpc-map surface specs 增加 ledger completeness；route specs 增加真实 adapter 运行（valid/invalid fixture）；`apps/api/.../openapi/generator.spec.ts`（Goal/Task/Governance ledger path + request + response envelope）；docs-check / governance-check 通过。

### Direct Vitest commands / results

```
node node_modules/vitest/vitest.mjs run --config packages/goal/vitest.config.ts        # 95 files / 523 tests passed
node node_modules/vitest/vitest.mjs run --config packages/task/vitest.config.ts        # 75 files / 839 tests passed
node node_modules/vitest/vitest.mjs run --config packages/notification/vitest.config.ts # 41 files / 283 tests passed
node node_modules/vitest/vitest.mjs run --config packages/contracts/vitest.config.ts    # 65 files / 572 tests passed
node node_modules/vitest/vitest.mjs run --config packages/utils/vitest.config.ts        # 14 files / 138 tests passed
node node_modules/vitest/vitest.mjs run --config packages/governance/vitest.config.ts   # 25 files / 180 tests passed
node node_modules/vitest/vitest.mjs run --config apps/api/vitest.config.ts src/shared/infrastructure/openapi/generator.spec.ts # 3 tests passed
```

### Typecheck

```
pnpm nx run goal:typecheck --skip-nx-cache        # pass
pnpm nx run task:typecheck --skip-nx-cache        # pass
pnpm nx run notification:typecheck --skip-nx-cache # pass
pnpm nx run contracts:typecheck --skip-nx-cache   # pass
pnpm nx run utils:typecheck --skip-nx-cache       # pass
pnpm nx run governance:typecheck --skip-nx-cache  # pass
```

### Governance / docs / inventory / Prettier

```
pnpm nx run memoflow:governance-check --skip-nx-cache   # pass
pnpm nx run memoflow:docs-check --skip-nx-cache         # pass
pnpm test:inventory                                      # regenerated (1113 files)
node tools/test-system-v2/inventory.mjs --check          # pass
pnpm exec prettier --check docs/plan/active/2026-08-15-refarch-phase4-transport-parity.md  # pass
pnpm exec prettier --check <all changed files>           # pass
```

### Deviations / notes

- `pnpm nx run <package>:test` was never used as a gate; only direct Vitest commands were run, per plan constraint. `test-system-v2:test:governance` initially failed only because the test inventory was stale after adding new spec files; `pnpm test:inventory` regenerated it and the check passed.
- Goal `deleteKeyResult`/`deleteReview`/`deleteRecord` response remain `GoalMutationReceiptSchema` (not `z.null()`); only goal-folder delete is void — unchanged baseline behavior.
- Task RPC map keys were aligned to `TaskChannels` (`task:template:create` etc.) and response types to `z.infer<typeof *ResponseSchema>`; the old kebab keys (`task:create-template`) were removed in the same diff.
- Notification `notification:update`, `notification:get-stats`, `notification:execute-action`, `notification:send`, `notification-channel:retry`, `notification-channel:list` remain protocol-only (no live transport); documented as explicit unsupported surface in the RPC map + surface spec rather than silently divergent.
- Pre-existing `as unknown as` casts in test doubles, domain-client branded-id boundaries, SSE structural probes and low-level native transaction/runtime adapters are allowlisted in `transport-cast-inventory.surface.spec.ts` and were not migrated.
