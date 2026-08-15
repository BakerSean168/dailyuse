---
tags:
  - plan
  - active
  - architecture
  - reference-architecture
  - request-context
  - observability
  - p0
  - p1
description: Reference architecture phase 2: unify API Request/Execution Context across HTTP, IPC, and the internal AI request chain / 参考架构阶段 2：统一 HTTP、IPC 与 AI 内部调用链的 Request/Execution Context
created: 2026-08-15T00:00:00Z
updated: 2026-08-15T00:00:00Z
---

# Reference Architecture Phase 2: Unified Request/Execution Context / 参考架构阶段 2：统一 Request/Execution Context

## 文档状态

- **状态**：Active，read-only implementation plan；本文只冻结契约和实施顺序，本轮不修改生产代码、测试或既有文档。
- **分支基线**：`feat/refarch-phase2-request-context`，`HEAD = 93c04c4fc328e88f45348cf8845a11e70d9fd1aa`。
- **依据**：
  - `docs/analysis/2026-08-13-architecture-refactor-review.md`：§1 item 5、§3.5、§3.6、§4 P0/P1/P2 context rows、§6 阶段 2。
  - 当前 contracts、API middleware/bootstrap、HTTP/IPC result adapters、Desktop auth context、AI internal client 与 Python AI service request context 实现。
  - `AGENT.md` 的 governance-first 试点顺序与文档/治理门禁。
- **实施原则**：平台能力先建立，feature 层以 `packages/governance` 验证，再推广到 Goal/Task/其余模块；每一步保持可独立审查、验证和回滚。

## 1. 目标与非目标

### 1.1 目标

1. 在 API 最外层加入统一 Request Context middleware：为每次 HTTP 请求建立 `requestId`、`traceId`、`startedAt`、`source`，在响应 `X-Request-Id`、现有 JSON envelope 和结构化日志中使用同一份元数据。
2. 将 `packages/contracts/src/shared/execution-context.ts` 作为唯一 context interface：HTTP、IPC 和 system entry 都向 Controller/Application 传递同一 `ExecutionContext` shape；删除/别名化重复的 `Context` type body 和 governance 私有 context body。
3. 保持 Principal 只在入口解析：HTTP 继续由 Cloud Auth middleware 解析一次，Electron 继续由 profile-owned auth context 解析一次；Controller/Application 不读取 Authorization、cookie 或 transport event。
4. 让 API → Python AI service 的现有 HMAC 调用优先透传入口 `requestId`；只有真正没有入口 context 的内部调用才由 `AIServiceInternalClient` 生成 fallback UUID。
5. 保持现有 HTTP response envelope、status code、204、OpenAPI 与 SSE event framing 不变；新增 header 与 context propagation 不得改变业务 payload。
6. 建立可执行的 middleware、adapter、SSE、AI internal client、surface/governance 测试和 inventory gates，使 API 与 Python 日志可用同一个 `requestId` 检索。

### 1.2 非目标

- 不引入完整 OpenTelemetry SDK、span exporter、collector、W3C `traceparent` 解析或 sampling；本阶段 `traceId` 与 `requestId` 相同，未来接入 tracing 后才允许二者分离。
- 不把 Goal/Task/Account、Prisma model、repository、transaction、完整 User/Principal、HTTP request/response 或 Electron event 放入 context。
- 不改变 Cloud Auth / Better Auth 的 identity resolution、Account Active 检查、role/ownership policy、email-verification gate 或 Desktop profile owner 规则。
- 不新增第二套 Principal 解析；`req.user` 仍是 HTTP transport representation，`IElectronAuthContext` 仍是 IPC entry resolver。
- 不改变现有 response envelope 字段：JSON 继续使用 `traceId`/`duration`，不新增必需的 `requestId` body 字段，不改变错误码和 HTTP status。
- 不把 `X-Request-Id` 当成认证、授权、幂等键、Agent run ID、proposal ID、checkpoint ID 或 retry-attempt 唯一键。
- 不改变 AI HMAC canonical payload/header、secret、timestamp/content hash、timeout/abort 语义或 Python internal endpoint contract。
- 不重构业务 Controller/Application Port，不借本阶段做通用 transport parity、route validation、Query Cache、Composition Root 或业务日志重写。
- 不调整 SSE event 名称、data payload、CRLF/LF parser、keep-alive、disconnect/cancel、catch-up cursor 或 delivery semantics。

## 2. 当前状态盘点

### 2.1 Gap table

| 优先级   | 现状 / gap                                        | 证据（file:line）                                                                                                                                                                     | 阶段 2 目标                                                                                                                           |
| -------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | API 没有统一 request context middleware           | `apps/api/src/shared/infrastructure/middleware/global.ts:24-84` 只挂载 Helmet/Cookie/CORS/JSON/Compression/Performance；`:49` 也未允许/暴露 `X-Request-Id`                            | 在所有路由、auth、adapter 和 error handler 之前创建 request metadata，并先写 response header                                          |
| P0       | 两个 shared context body 重叠但不相同             | `packages/contracts/src/shared/context.ts:1-16` 要求 `identityId/deviceId`；`execution-context.ts:5-24` 只要求 identity、device 可选；`shared/index.ts:25-26` 同时导出两者            | `ExecutionContext` 成为唯一 interface；`Context` 仅为指向它的兼容 type alias，不保留第二份字段定义                                    |
| P0       | Principal 与 request metadata 没有汇合点          | `auth-middleware.ts:23-50` 解析 `CloudPrincipal` 后只写 `req.user`；`:51-53` 用裸 `console.error`                                                                                     | auth 仍只解析 Principal；Express extractor 把 `req.user.identityId` 与已有 `RequestContext` 合成一次，错误日志带 correlation metadata |
| P0       | HTTP adapter 只构造 identity/device context       | `packages/utils/src/result/express-adapter.ts:51-65,100-164` 从 request/body 组装旧 `Context`；`:208-221` 单独读取 `req.traceId/req.id/startTime` 构建 envelope                       | adapter/controller 与 envelope 读取同一 carrier；上下文不再丢失 request metadata                                                      |
| P1       | IPC adapter 默认返回静态 stub                     | `packages/utils/src/result/ipc-adapter.ts:44-75,94-104` 默认 `{ identityId: '', deviceId: 'desktop' }`；HTTP/IPC extractor 语义分叉                                                   | IPC extractor 返回 canonical `ExecutionContext`；authenticated IPC 必须使用 entry auth resolver 产生的完整 context                    |
| P1       | Desktop auth context 没有 invocation metadata     | `apps/desktop/src/main/profile/profile-access-context.ts:29-37` 每次只返回 owner 与固定 device ID                                                                                     | 每次 `requireRequestContext()` 建立新的 `ipc` request/trace/start metadata，同时只解析一次 owner                                      |
| P1       | governance 有第三份本地 ExecutionContext 并丢字段 | `packages/governance/src/server/application/use-cases/execution-context.ts:9-13` 只定义 branded identity；`governance.controller.ts:56-59,133-134` 手工转换并只保留 identity          | governance 先行删除本地 body，Application 直接消费 shared canonical interface，并用测试证明 HTTP/IPC metadata 不丢失                  |
| P0       | AI HTTP routes 主动把 context 截成 identity-only  | `packages/ai/src/api/routes/ai-chat.routes.ts:43-172,175-224`、`ai-agent-runtime.routes.ts:43-158` 及 provider/knowledge/analytics routes 有多处 `{ identityId } as ExecutionContext` | 普通 route 直接传 adapter 给出的 `ctx`；专用 SSE route 使用同一个 extractor，不再手工重建 context                                     |
| P0       | AI use case 生成局部 request ID                   | `send-ai-message.use-case.ts:35-46`、`stream-ai-message.use-case.ts:51-63`、knowledge/query/analytics use cases 调用 `createAIRequestId()`；当前 request ID 还可能兼任 run ID         | outbound/log correlation 使用 `cx.requestId`；durable run/proposal/checkpoint identity 单独保留，不与 transport request ID 混用       |
| 已有能力 | AI internal client 已支持透传和 fallback          | `ai-service-internal-client.ts:24-37` request ID 可选，`:100` 无值时 `randomUUID()`，`:125-135` 保持 HMAC headers 并发送 `X-Request-Id`                                               | 保持实现 seam，只补优先级、调用链和 forward/fallback tests；不改签名算法                                                              |
| 已有能力 | Python AI service 已接收、记录、回传 request ID   | `apps/ai-service/src/ai_service/middleware/request_context.py:16-55` 接收或生成 ID、记录 completion、回传 header；`tests/test_chat.py:282-288` 已验证 echo                            | TS 入口 ID 原样到达 Python；Python 只补必要的 end-to-end assertion，不另建 context 模型                                               |
| P0       | 现有 envelope 有 trace hook，但没有可靠生产赋值   | `apps/api/src/shared/infrastructure/http/response-builder.ts:17-23`、`packages/contracts/src/result/http.ts:202-259` 支持 `traceId/startTime`；Request 尚无统一 producer              | 继续输出同一 envelope shape；middleware producer 让成功、auth error、404、global error 都共享 correlation ID                          |
| P0       | SSE 在 flush 前手工构造 identity-only context     | `ai-assistant.routes.ts:22-38,64-72`、`ai-chat.routes.ts:175-224`、`notification/src/api/routes.ts:327-340` 都在 route 内直接 flush headers                                           | middleware 必须在 flush 前写 `X-Request-Id`；SSE route 不改 framing/header 集合，只改 context extraction 和测试                       |

### 2.2 当前 pipeline 与 ownership

当前 HTTP 顺序实际为：

```text
global security/body/compression/performance
  -> module route auth middleware
  -> expressAdapter / custom SSE route
  -> Controller / Application
  -> optional AI internal client
  -> global 404/error handlers
```

目标顺序冻结为：

```text
RequestContext middleware
  -> security/CORS/body/compression/performance
  -> Principal middleware (required/optional auth)
  -> Express/SSE adapter
  -> Controller / Application (ExecutionContext)
  -> AI internal client (same requestId)
  -> Python RequestContext middleware
```

- `ApiBootstrapper.init()` 在 `apps/api/src/bootstrap.ts:87-155` 先调用 `applyGlobalMiddleware`，之后为 module context 创建 auth middleware，再注册 modules。因此 RequestContext 属于 global platform middleware，不加入 `IApiMiddleware` 让每个 feature 重复挂载。
- `IApiModuleContext` / `IApiMiddleware`（`apps/api/src/shared/contracts/api-module.ts:43-60`）保持 transport registration toolbox；本阶段只更新双语 JSDoc 说明默认 adapter 可依赖 global request carrier，字段 shape 不扩张。
- Performance middleware（`performance.middleware.ts:98-137`）继续负责 metrics 与 `X-Response-Time`；统一 RequestContext middleware 负责一次 terminal structured request log，避免两处竞争 request lifecycle ownership。

## 3. 契约冻结（实现前必须先签字）

### 3.1 Canonical Request/Execution Context

`packages/contracts/src/shared/execution-context.ts` 冻结以下 public interface。所有新增/修改的 public type、factory、adapter option 和 request carrier 必须有英文 + 中文 JSDoc。

```ts
export type ExecutionSource = 'http' | 'ipc' | 'system';

export interface RequestContext {
  readonly requestId: string;
  readonly traceId: string;
  readonly startedAt: number;
  readonly source: ExecutionSource;
}

export interface ExecutionContext extends RequestContext {
  readonly identityId: string;
  readonly deviceId?: string;
  readonly device?: {
    readonly deviceName?: string | null;
    readonly os?: string | null;
    readonly browser?: string | null;
    readonly ipAddress?: string | null;
    readonly userAgent?: string | null;
    readonly deviceType?: string;
    readonly deviceFingerprint?: string;
  };
  readonly agentRunId?: string;
  readonly threadId?: string;
  readonly checkpointId?: string;
}

/** @deprecated Import ExecutionContext directly. / 请直接导入 ExecutionContext。 */
export type Context = ExecutionContext;
```

- `requestId`、`traceId`、`startedAt`、`source` 在 canonical types 中为 **required**；禁止以 optional 字段维持 identity-only 调用。
- `startedAt` 是 entry 创建时的 Unix epoch milliseconds（`Date.now()`），不是 `Date`、ISO string 或 monotonic duration。
- `source` 表示最外层 entry：HTTP 为 `http`、Electron invocation 为 `ipc`、cron/module manifest/无用户 transport 的显式调用为 `system`；向下游传播时不得改成 `internal`。
- `agentRunId/threadId/checkpointId` 只允许 opaque identifier，不允许嵌套 run/proposal/approval object。没有真实 caller 时保持 absent。
- `approvalState` 不进入共享 context：它是可变 workflow state，应保留在 AI run/proposal aggregate 或显式 command 中。
- `sessionId/role/email/emailVerified` 继续属于 transport Principal，不因“metadata-only”名义进入所有业务用例。
- `packages/contracts/src/shared/context.ts` 不再声明 interface body；governance 私有 `execution-context.ts` 删除或改为 shared type re-export，最终 inventory 只允许一个 `interface ExecutionContext` body。

### 3.2 HTTP RequestContext 与 ID 语义

- 新增 `apps/api/src/shared/infrastructure/http/middlewares/request-context.middleware.ts`，以 `createRequestContextMiddleware({ idFactory, now, logger })` factory 形式提供可测试实现；默认使用 `randomUUID`、`Date.now` 和共享 logger。
- middleware 是 `applyGlobalMiddleware()` 的第一个 `app.use`，早于 Helmet、CORS、body parser、performance、auth、route 与 error handler。
- incoming `X-Request-Id` 只有在 trim 后匹配 `^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$` 时才接受；空值、数组/重复值、超长、空白/控制字符或其它字符均不返回 400，而是生成 UUID。
- 接受 client/proxy ID 只代表它适合 correlation/logging，不代表请求已受信任；auth/authorization/idempotency 禁止读取此字段。
- Phase 2 不读取 `X-Trace-Id` 或 `traceparent`；`traceId = requestId`。现有 `req.id/req.traceId/req.startTime` 可作为带 deprecated JSDoc 的 compatibility projections，但 `req.requestContext` 是唯一 producer-owned carrier。
- middleware 在调用 downstream 前设置 `X-Request-Id`，因此 JSON、204、auth failure、404、500 和 SSE `flushHeaders()` 都能回传同一值。
- CORS 同时允许请求 header 并通过 `exposedHeaders` 暴露响应 `X-Request-Id`；不暴露 auth/internal HMAC headers。
- retry/proxy 可显式复用 `X-Request-Id` 表示同一 logical request；多次 attempt 可有同一个 request ID。它不是幂等键，日志以 timestamp/startedAt/status 区分 attempts。

### 3.3 Structured request logger

- 每个 HTTP attempt 最多一条 terminal request log：正常 `finish` 记录 `requestId/traceId/source/method/path/statusCode/durationMs/identityId?`；client abort/stream close 在未 finish 时记录 `aborted: true`。
- 不记录 body、query values、cookie、Authorization、HMAC、provider API key 或完整 headers；path 使用 pathname/route pattern，不拼接 query string。
- logger 不调用 `res.json/res.end/res.write`，不包裹 stream body，不在 `headersSent` 后设置 header；SSE 生命周期以 close/finish event 计算时长。
- `performance.middleware.ts` 保留 metrics sampling 与 `X-Response-Time`，删除或降为非重复的 metrics-only debug output；request completion ownership只在新 middleware。
- `auth-middleware.ts` 与 global error handler 使用共享 structured logger，并从 request carrier读取 correlation metadata；不改变对外 error message/envelope。

### 3.4 Principal 与 adapter contract

- HTTP：RequestContext middleware 只创建无身份的 `RequestContext`；Cloud Auth middleware 继续调用一次 `resolveNodePrincipal` 并写 `req.user`；Express extractor 在 adapter seam 合成 `ExecutionContext`。
- IPC：`DesktopProfileAccessContext.requireRequestContext()` 每次 invocation 解析一次 owner，并返回完整 `ExecutionContext`；`createAuthenticatedIpcWrapper` 原样把它交给 handler。
- Application/Controller 不接受 `Request`、headers 或 auth resolver，也不二次解析 Principal。需要完整 Account 时仍通过 Account application/repository。
- `expressAdapter`、`expressAdapterWithValidation`、`RouteRegistrar` 和专用 SSE routes 使用同一个 exported extractor/carrier interface；`ipcAdapter`、`ipcAdapterWithValidation` 和 authenticated IPC wrapper 使用同一个 `ExecutionContext` type。
- `ExpressAdapterOptions.extractContext` / `IpcAdapterOptions.extractContext` 继续允许测试或第二宿主提供完整 context，但返回值必须是 `ExecutionContext`，不得回退为 partial shape。
- adapter missing global carrier 时 fail closed（测试必须显式提供 carrier/custom extractor），不在 adapter 内悄悄生成第二个 request ID。
- response builder 从 `req.requestContext.traceId/startedAt` 读取；现有 `traceId/startTime` fallback 只服务短期 compatibility，并由 surface test 防止新 caller 依赖。

### 3.5 AI correlation 与 durable run identity

- AI HTTP/IPC entry 把完整 `ExecutionContext` 传给 Controller/Application。禁止 `{ identityId } as ExecutionContext`、从 request header 再调用 `getRequestId` 或在 Controller 重建 context。
- 对 Python 的 outbound `requestId` 优先级固定为：
  1. entry `ExecutionContext.requestId`；
  2. 无 entry context 的明确 internal/background caller 提供的 request ID；
  3. `AIServiceInternalClient` 内的 `randomUUID()` fallback。
- `AIServiceInternalClient` 同一个 resolved ID 必须同时进入 structured logs、`AIServiceInternalRequestError.requestId` 和 `X-Request-Id`；不为 body 和 header各生成一次。
- Agent `runId`、`agentRunId`、proposal/confirmation request reference、checkpoint ID 与 operation/idempotency key 保持现有独立生命周期。若当前 use case 用一个局部 `requestId` 同时充当 run ID（例如 `send-ai-message.use-case.ts:35-46`），实施时拆为 `requestId = cx.requestId` 与独立 `runId`，不得把可复用的 proxy request ID 变成 durable identity。
- knowledge-note `confirmation.requestId` 继续表示既有 proposal/confirmation 写入契约，不被 transport request ID 覆盖；outbound generation/log correlation 使用 entry request ID，并同时记录必要的 proposal ID。
- HMAC canonical signing inputs保持 method/path/timestamp/body；`X-Request-Id`、`X-Identity-Id` 传播不进入新的签名算法，不改变 Python auth middleware。

### 3.6 Response envelope 与 SSE compatibility

- JSON envelope 保持 `{ ok, data|error, timestamp, traceId?, duration? }`；`traceId` 值来自 `ExecutionContext.traceId`，本阶段等于 request ID。
- HTTP 204 继续无 body；新增 `X-Request-Id` 不改变 status、content length 或 adapter `end()` 行为。
- SSE route 在 `flushHeaders()` 前已经拥有 `X-Request-Id`，并继续保留各自现有 `Content-Type: text/event-stream`、`Cache-Control`、`Connection`、`X-Accel-Buffering`（若原 route 已设置）与 event/data framing。
- stream 开始后的错误继续通过 SSE `error` event 返回，不切换成 JSON envelope；stream 开始前的 auth/validation error 继续用现有 JSON envelope。
- Request logger/performance middleware 不压缩、buffer、消费或追加 SSE chunk；disconnect 仍触发现有 AbortController/unsubscribe。

## 4. 分步实施（PR-able steps）

### Step 1 — Canonical contracts + API RequestContext foundation（P0）

**目标**：建立唯一 context interface 与最外层 HTTP producer；所有后续 adapter 都只消费这一 producer。

**文件与变更**

- [x] 修改 `packages/contracts/src/shared/execution-context.ts`：加入 `ExecutionSource`、`RequestContext`、required request metadata、optional opaque run IDs；所有 public surface 增加中英双语 JSDoc。
- [x] 修改 `packages/contracts/src/shared/context.ts`、`shared/index.ts`：`Context` 只做 deprecated type alias；不保留 duplicate interface body。
- [x] 更新 `packages/contracts/src/shared/dual-registry.surface.spec.ts`：锁住唯一 `ExecutionContext` body、`Context` alias、metadata-only forbidden inventory（不出现 Prisma/repository/business aggregate fields）。
- [x] 新增 `apps/api/src/shared/infrastructure/http/middlewares/request-context.middleware.ts` 与 spec；从 middleware barrel 导出 factory/carrier types。
- [x] 修改 `apps/api/src/shared/infrastructure/middleware/global.ts`：把 middleware 放在第一个 `app.use`；更新 CORS `allowedHeaders/exposedHeaders`；保持 auth passthrough callback/body parser 顺序。
- [x] 修改 `apps/api/src/shared/infrastructure/http/response-builder.ts`、global error handler 与 `api-module.ts` JSDoc：使用 canonical carrier，保持 envelope shape 和 `IApiMiddleware` methods 不变。
- [x] 修改 `performance.middleware.ts`：只保留 metrics/response-time ownership，避免重复 request completion log；SSE skip 行为不扩大或缩小。

**测试与门禁**

- [x] Middleware spec 覆盖：valid header preserve、missing/invalid/duplicate/129-char fallback、UUID factory只调用一次、`traceId === requestId`、startedAt/source、response header 在 `next()` 前存在。
- [x] Lifecycle spec 覆盖：finish/abort 每 attempt 仅一条 terminal structured log、duration 来自 injected clock、敏感 headers/body 不进入 metadata、headersSent 后不 mutation。
- [x] Error/envelope specs 覆盖 auth 401、404、global 500 都回显同一 header 和现有 `traceId` body；204 body 仍为空。
- [x] Direct gates：
  - `node node_modules/vitest/vitest.mjs run --config packages/contracts/vitest.config.ts packages/contracts/src/shared/dual-registry.surface.spec.ts`
  - `node node_modules/vitest/vitest.mjs run --config apps/api/vitest.config.ts apps/api/src/shared/infrastructure/http/middlewares/request-context.middleware.spec.ts apps/api/src/shared/infrastructure/middleware/error.spec.ts apps/api/src/shared/infrastructure/middleware/error-result-envelope.surface.spec.ts`
  - `pnpm nx run contracts:typecheck --skip-nx-cache`
  - `pnpm nx run api:typecheck --skip-nx-cache`

**Step gate**：一份 request metadata 能覆盖正常、auth error、404、500；没有 feature route 修改，也没有 response body diff。

### Step 2 — Governance-first HTTP/IPC adapter pilot（P0/P1）

**目标**：先在 governance 证明 canonical interface 同时穿过 Express 与 authenticated IPC，且 Application 不需要 transport knowledge。

**文件与变更**

- [x] 修改 `packages/utils/src/result/express-adapter.ts`、`route-registrar.ts`：request-like interface 包含 canonical carrier；default/exported extractor 合成 Principal + request/device metadata；envelope 使用同一 trace/start。
- [x] 修改 `packages/utils/src/result/ipc-adapter.ts`：所有 callback/options 使用 `ExecutionContext`；默认/custom extractor 不再返回 identity-only desktop stub。
- [x] 修改 `packages/contracts/src/electron/auth-context.ts`、`authenticated-ipc.ts`：`IElectronAuthContext` 与 handler 明确返回/消费 canonical `ExecutionContext`。
- [x] 修改 `apps/desktop/src/main/profile/profile-access-context.ts`：每个 invocation 生成新的 request ID、相同 trace ID、startedAt、`source: 'ipc'`；owner resolver 只调用一次。
- [x] 删除 `packages/governance/src/server/application/use-cases/execution-context.ts` 的私有 body，Application Port/use cases import shared `ExecutionContext`；`governance.controller.ts` 删除 identity-only `toExecutionContext`。
- [x] 更新 governance HTTP/Electron route/controller/lifecycle specs：同一 fixture 的 full context 到达同一个 `GovernanceApplicationPort` method。

**测试与门禁**

- [x] `express-adapter.spec.ts` 同时断言 identity/device/request/trace/start/source 全字段和 envelope trace；custom extractor 也必须返回完整 shape。
- [x] `ipc-adapter.spec.ts`、`authenticated-ipc.spec.ts` 断言每次 invocation 独立 ID、同 invocation 不重建、auth failure 不调用 handler。
- [x] Governance parity test 使用固定 context fixture分别走 HTTP adapter 与 IPC wrapper，断言 metadata不被 controller截断；无新增 governance business behavior。
- [x] Direct gates：
  - `node node_modules/vitest/vitest.mjs run --config packages/utils/vitest.config.ts packages/utils/src/result/express-adapter.spec.ts packages/utils/src/result/ipc-adapter.spec.ts`
  - `node node_modules/vitest/vitest.mjs run --config packages/contracts/vitest.config.ts packages/contracts/src/electron/authenticated-ipc.spec.ts`
  - `node node_modules/vitest/vitest.mjs run --config packages/governance/vitest.config.ts`
  - `pnpm nx run utils:typecheck --skip-nx-cache`
  - `pnpm nx run governance:typecheck --skip-nx-cache`
  - `pnpm nx run desktop:typecheck --skip-nx-cache`

**Step gate**：governance HTTP/IPC Application call收到同一 shape；仓库只剩 contracts 中一个 `ExecutionContext` interface body。

### Step 3 — Principal ordering + adapter rollout（P0/P1）

**目标**：把已验证模式推广到 API modules 和 Desktop handlers，删除 identity-only/unsafe casts，同时保持 auth 入口和业务 Port 不变。

**文件与变更**

- [x] 修改 `apps/api/src/shared/infrastructure/http/middlewares/auth-middleware.ts` 与 specs：注入/共享 logger，记录 request correlation；`resolveNodePrincipal`、Account Active 查询、`req.user` shape、401/500 message 不变。
- [x] 更新 Goal/Task/Reminder/Schedule/Notification/Account/Repository/Data Portability/Setting 的 route/controller tests 与 Electron auth fixtures，使 required metadata 由 entry fixture 产生，而不是在 controller 手工补齐。
- [x] 删除 `packages/goal/src/electron/index.ts` 中 `requestContext as ExecutionContext` casts；Goal module manifest 的 system command 显式创建 `source: 'system'` context，并生成独立 request ID。
- [x] 检查所有 `IApiModule.register(context)` call site：模块仍只使用 `context.middleware.auth` 等 platform middleware，不重复挂载 RequestContext；router mount 顺序不变。
- [x] 更新所有生产/测试 `ExecutionContext` fixtures：HTTP=`http`、IPC=`ipc`、明确 background=`system`；不得用 `as ExecutionContext` 绕过 required fields。

**测试与门禁**

- [x] `authMiddleware.spec.ts` 增加顺序断言：request carrier 已存在后才解析 Principal；success 只解析一次；failure envelope/header correlation 不丢失。
- [x] Goal/Task/governance selected transport specs 断言 controller 获得完整 context；业务 payload、identity scoping 和 route middleware arrays 不变。
- [x] Desktop profile/auth specs 断言两次 IPC invocation 有不同 request IDs，单次 invocation 的 handler/application/response meta 使用同一 trace。
- [x] `rg` gate：生产代码没有 `{ identityId } as ExecutionContext`、`requestContext as ExecutionContext` 或第二次 Authorization parsing。
- [x] Direct gates（不得运行 `pnpm nx run <pkg>:test`）：按各 package `vitest.config.ts` 直接执行被修改的 route/controller/auth specs；随后运行 `api/contracts/utils/desktop/governance/goal/task` typecheck 与 lint targets。

**Step gate**：运行时顺序固定为 RequestContext → Principal → adapter；所有 feature context 都来自 entry，没有 route-local partial reconstruction。

### Step 4 — AI entry-to-Python request ID propagation（P0/P1）

**目标**：让 Web HTTP/SSE 和 Desktop IPC 的入口 request ID 原样进入 AI Application、internal client、Python middleware 与日志，同时保护 durable run/proposal identity。

**文件与变更**

- [x] 修改 `packages/ai/src/api/routes/ai-chat.routes.ts`、`ai-assistant.routes.ts`、`ai-agent-runtime.routes.ts`、provider/knowledge/analytics/checkpoint routes：普通 routes 直接传 `ctx`；SSE routes 使用共享 Express extractor；删除 identity-only casts 与 route-local `getRequestId` reconstruction。
- [x] 更新 `packages/ai/src/shared/get-request-id.ts` 及 dual surface spec：若 helper 已无 caller则删除；若专用 route仍需要，则只读 canonical carrier，并以双语 JSDoc 标明它不是新的 ID producer。
- [x] 修改有 entry `ExecutionContext` 的 AI use cases（chat stream/complete、goal generation、knowledge note/query/expand/reindex、analytics、agent runtime）：outbound request/log correlation 使用 `cx.requestId`。
- [x] 对当前 `runId: requestId` 的 chat/agent paths 拆分 durable `runId`；proposal confirmation/checkpoint/operation IDs 保持现有字段与幂等语义，日志同时记录 request ID 与 run/proposal ID。
- [x] 保持 `packages/ai/src/server/infrastructure/chat-execution/ai-service-internal-client.ts` 的 HMAC 实现和 optional request option；补充精确 forward/fallback tests，不把 fallback上移到每个 adapter。
- [x] 更新各 `ai-service-*.adapter` tests：传入 entry ID 时 request header/body中需要 correlation 的字段一致；无值时 client只生成一次 fallback ID；abort/error exception携带 resolved ID。

**测试与门禁**

- [x] AI route/controller tests 断言完整 context到达 Application；SSE controller input与 response header使用同一 request ID。
- [x] AI use-case tests用固定 `cx.requestId`，断言 internal port收到该值；另断言 run/proposal IDs仍独立且 retry不会把 request ID 当成幂等键。
- [x] Internal client tests覆盖 HMAC headers未变、exact `X-Request-Id` forwarding、missing-context UUID fallback、GET/POST/SSE、timeout/abort/error request ID。
- [x] Python focused tests验证 incoming `X-Request-Id`在 `request.state`、completion log、response header中一致；不运行无关 provider/eval 全套。
- [x] Direct gates：
  - `node node_modules/vitest/vitest.mjs run --config packages/ai/vitest.config.ts`（可用文件参数缩小到本 step 修改的 routes/use cases/internal-client specs）
  - `node node_modules/vitest/vitest.mjs run --config apps/api/vitest.config.ts apps/api/src/modules/ai/backend-automation-tool-executor.adapter.test.ts`
  - `cd apps/ai-service && uv run pytest tests/test_health.py tests/test_chat.py -q`
  - `pnpm nx run ai:typecheck --skip-nx-cache`

**Step gate**：一个固定入口 ID 可在 API request log、TS AI internal request log 和 Python completion log中关联；fallback只在无 entry caller发生；HMAC与AI业务标识无 diff。

### Step 5 — SSE/smoke/governance/docs closure（P0 gate）

**目标**：用真实 streaming/header、API smoke和静态 inventory封住兼容性，并回收架构文档真值。

**文件与变更**

- [x] 扩展 `packages/ai/src/api/routes/ai-chat.routes.test.ts`、assistant route tests、`packages/notification/src/api/routes` 相关 specs：锁定 header-before-flush 与现有 SSE header/event framing。
- [x] 扩展 `apps/api/src/__tests__/smoke`：至少一个 JSON route、一个 auth failure、一个 AI SSE route验证 client-supplied/generated request ID、response header、envelope trace与 Principal ordering。
- [x] 在现有 contracts/AI dual registry或 governance audit中加入最小 fail-closed inventory：唯一 context body、无 production identity-only casts、无 adapter-local request ID producer、无 context business-object fields。
- [x] 更新 `docs/standards/architecture.md` 或新增 canonical request-context ADR（按实施时文档ownership选择其一），记录字段、顺序、header/retry/Principal/SSE语义；更新 AI streaming/current workflow文档中的 correlation ID来源。
- [x] 更新 `docs/plan/active/README.md` 状态；完成后将本计划移入 archive，并回填每个 gate的命令/结果。文档不得复制实现细节，以 contracts/middleware/tests为真值。

**测试与门禁**

- [x] SSE smoke 断言 `X-Request-Id` 在第一次 chunk前可见，原有 `Content-Type/Cache-Control/Connection/X-Accel-Buffering`、event names、done/error、disconnect cancel均不变。
- [x] API smoke 对 generated 与 caller-provided ID各跑一次；invalid input回退 UUID而非400；response JSON字段快照无新增/删除。
- [x] `rg` inventory 输出附在 PR：context definitions、casts、`randomUUID/createAIRequestId` request-correlation producers、`X-Request-Id` writers/readers均符合 allowlist。
- [x] 运行最终门禁：direct Vitest focused suites、API smoke target、affected typecheck/lint、`pnpm nx run memoflow:governance-check --skip-nx-cache`、`pnpm nx run memoflow:docs-check --skip-nx-cache`。

**Step gate**：compatibility、governance与文档证据齐全后才宣称阶段 2 完成；不能只凭 typecheck或单元测试完成。

## 5. 验证与门禁总表

### 5.1 必测矩阵

| 层                   | 必测行为                                                            | 主要测试入口                                                              | Gate |
| -------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---- |
| Request middleware   | accept/fallback、carrier、header、finish/abort logger、敏感字段排除 | `apps/api/.../request-context.middleware.spec.ts`                         | P0   |
| Principal middleware | 顺序、单次解析、401/500 envelope/header、structured error log       | `authMiddleware.spec.ts`                                                  | P0   |
| Express adapter      | full context、custom extractor、success/error/204 envelope trace    | `packages/utils/src/result/express-adapter.spec.ts`                       | P0   |
| IPC adapter/auth     | per-invocation context、auth failure、full shape、no static stub    | `ipc-adapter.spec.ts`、`authenticated-ipc.spec.ts`、Desktop profile specs | P1   |
| Governance pilot     | HTTP/IPC same fixture 到同一 Application Port                       | governance route/controller/Electron specs                                | P0   |
| AI internal client   | exact forward、single fallback、HMAC unchanged、error/abort ID      | chat execution/agent runtime/internal client specs                        | P0   |
| SSE                  | header-before-flush、framing/header/disconnect兼容                  | AI chat/assistant、Notification SSE tests + API smoke                     | P0   |
| Python               | request state/log/response echo                                     | focused `test_health.py`、`test_chat.py`                                  | P1   |
| Governance/docs      | unique body、no casts/producers、双语 JSDoc、canonical docs         | dual/surface specs、governance/docs checks、`rg` inventory                | P0   |

### 5.2 每个 PR 的共同 gate

- [x] Diff 只包含该 Step 列出的生产/测试/文档/治理文件；不得夹带业务功能、schema migration 或 unrelated formatting。
- [x] 所有新增 public type/interface/factory/adapter option 有英文 + 中文 JSDoc；private implementation不为满足规则制造空洞注释。
- [x] 不运行已知会 hang 的 `pnpm nx run <pkg>:test`；测试用 `node node_modules/vitest/vitest.mjs run --config ... [files]` 直接执行。
- [x] 对修改的 package运行 direct Vitest、typecheck与 lint；对 platform/shared contract影响在最终 Step运行 API smoke、governance、docs check。
- [x] 测试 fixtures不通过 `as ExecutionContext`、partial object或 optional metadata掩盖 contract错误。

### 5.3 最终完成门禁

- [x] `requestId/traceId/startedAt/source` 在 HTTP、IPC 与 system entry均为required并有真实 producer。
- [x] API middleware顺序为 RequestContext → Principal → adapter；Principal只解析一次，Application没有 header parsing。
- [x] response envelope快照、status、204与SSE framing/header兼容，新增 `X-Request-Id` 在所有 response types可见。
- [x] AI entry request ID原样到达 Python；无 entry caller才触发 internal client fallback；durable run/proposal/checkpoint/idempotency identity不受影响。
- [x] governance pilot先于 Goal/Task/批量推广；仓库只有一个 `ExecutionContext` interface body且没有 identity-only casts。
- [x] Public surface双语 JSDoc、surface tests、inventory、canonical architecture/AI docs完成。
- [x] Focused direct Vitest、API smoke、affected typecheck/lint、`memoflow:governance-check`、`memoflow:docs-check`全部通过。

## 6. 风险与回滚

| 风险                         | 触发/影响                                                                         | 防护                                                                                      | 回滚单位                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Envelope compatibility       | 改 extractor/response builder导致 `traceId/duration` 消失、字段新增或204带 body   | 冻结 snapshot + auth/404/500/204 tests；body不新增 requestId                              | 回滚 Step 1 adapter/response-builder commit；middleware可独立保留 header         |
| SSE header时机               | route先 `flushHeaders()` 后middleware/logger再写 header，触发异常或丢 header      | middleware第一个挂载并在 `next()` 前 set；真实 SSE smoke检查 first chunk前 header         | 回滚 Step 5 SSE route改动；不回滚 contracts                                      |
| SSE lifecycle/logger         | `close` 与 `finish` 都触发，重复日志；logger包裹 response破坏stream/cancel        | terminal flag；只监听事件，不包裹 `write/end/json`；disconnect tests                      | 回滚 request logger listener，不移除 context carrier                             |
| Proxy/client spoofing        | 任意 header污染日志或被误当安全标识                                               | allowlist regex/length、invalid fallback、禁止auth/idempotency使用；proxy需要时覆盖header | 收紧accept policy或临时只生成UUID；不改下游shape                                 |
| Retry semantics              | proxy复用requestId导致 durable run ID碰撞或被误判重复                             | 明确 correlation-only；拆分 run/proposal/checkpoint/idempotency IDs；retry tests          | 回滚 AI Step 4，internal client恢复局部fallback；HTTP context可保留              |
| Auth ordering                | auth在RequestContext前运行，401/500无ID；或request middleware读取身份造成二次解析 | bootstrap/middleware-order spec；RequestContext不读auth，adapter才合成                    | 回滚 Step 3 auth日志改动；保持原auth行为                                         |
| IPC identity resolution      | 为生成context多次调用owner resolver，profile切换窗口产生不一致identity            | 每invocation只resolve一次；metadata在同一返回对象构造                                     | 回滚 Desktop Step 2到旧resolver，IPC adapter custom extractor临时提供完整context |
| Required fields blast radius | 大量测试/system caller仍构造identity-only object，使用casts绕过                   | required types + typecheck + no-cast inventory；按governance-first顺序迁移fixtures        | Step级回滚；不得把字段改optional作为长期兼容层                                   |
| AI ID语义混用                | 当前局部requestId兼作run/log/proposal reference，直接替换改变幂等/恢复            | Step 4先列每个producer/consumer inventory，request vs durable ID逐项命名测试              | 单独回滚对应use case，不回滚internal header tests                                |
| 日志重复/敏感泄露            | performance/auth/request三处重复或metadata含headers/body                          | request middleware唯一terminal owner；字段allowlist；日志transport snapshot               | 回滚logger部分，保留carrier/header/context propagation                           |

### 6.1 回滚顺序

1. 发现 SSE/body/status regression：先回滚 Step 5 专用 route/smoke相关实现，再检查 Step 1 header timing；不要用删除 envelope tests掩盖问题。
2. 发现 AI run/proposal semantics regression：回滚受影响的 Step 4 use case propagation，保留 HTTP/IPC canonical context；internal client继续允许显式 ID 和 fallback。
3. 发现 Desktop profile/IPC regression：回滚 Step 2 Desktop producer与IPC extractor，governance HTTP pilot和contracts可独立保留。
4. 发现 auth regression：回滚 Step 3 auth logger/order wiring，恢复原Principal middleware；RequestContext仍可作为auth之前的无身份metadata运行。
5. 只有 canonical required shape本身不可接受时才整体回滚 Steps 1–3；禁止留下 `Context`/`ExecutionContext` 双 body或长期 optional shim。

## 7. 完成定义

- [x] 五个 Steps 均形成独立 PR-able diff并通过各自 gates，governance feature pilot先于批量 rollout。
- [x] HTTP、IPC、system entry创建同一 `ExecutionContext` interface，Request ID可从 API一路关联到Python AI service。
- [x] Principal、response envelope、SSE、HMAC、AI durable identity与业务行为满足冻结契约。
- [x] `rg`/surface/governance证据防止 duplicate context body、partial casts、adapter-local ID producer与business object context回归。
- [x] 所有新增public surface中英双语JSDoc齐全；canonical architecture/AI docs与代码/测试一致。
- [x] Direct Vitest、API smoke、affected typecheck/lint、`pnpm nx run memoflow:governance-check --skip-nx-cache`、`pnpm nx run memoflow:docs-check --skip-nx-cache`全部通过。
- [x] 本阶段不宣称完整OpenTelemetry、阶段4 Transport parity、阶段5 Query Cache或阶段6长期可观测平台完成。

---

## 完成记录（2026-08-15，实现后回填）

- 状态：Archived（全部 5 个 Step 已实施并跑通各自 gate）。
- Steps 1–5 均为独立可审查 diff；governance-first 试点先于批量 rollout。
- 唯一 `ExecutionContext` interface body 位于 `packages/contracts/src/shared/execution-context.ts`；`Context` 为 deprecated alias；governance 私有 body 已删除。
- HTTP/IPC/system 均有真实 producer；AI outbound `requestId` 优先级 = entry `cx.requestId` → explicit caller ID → internal client fallback。
- 最终验证见下方命令结果；因“required fields blast radius”，Step 1/2 的 `api:typecheck`/`desktop:typecheck` 只能在 Step 3/4 迁移下游 partial casts 后通过（一次会话内连续实施，未按 step 逐条独立提交）。

## 最终门禁验证（review round 回填，2026-08-15）

### Direct Vitest（不跑 `pnpm nx run <pkg>:test`）

```text
node node_modules/vitest/vitest.mjs run --config packages/contracts/vitest.config.ts   # 60 files, 530 tests passed
node node_modules/vitest/vitest.mjs run --config packages/utils/vitest.config.ts       # 13 files, 128 tests passed
node node_modules/vitest/vitest.mjs run --config packages/ai/vitest.config.ts          # 120 files, 812 tests passed
node node_modules/vitest/vitest.mjs run --config packages/governance/vitest.config.ts  # 23 files, 176 tests passed
node node_modules/vitest/vitest.mjs run --config packages/data-portability/vitest.config.ts # 32 files, 139 tests passed
node node_modules/vitest/vitest.mjs run --config apps/api/vitest.config.ts             # 53 files, 224 tests passed
node node_modules/vitest/vitest.mjs run --config apps/api/vitest.smoke.config.ts       # 3 files, 69 tests passed
node node_modules/vitest/vitest.mjs run --config apps/desktop/vitest.config.ts apps/desktop/src/main/profile/profile-access-context.spec.ts # 1 file, 4 tests passed
node --test tools/test-system-v2/__tests__/inventory.test.mjs                          # 3 tests passed
```

### Typecheck / Lint（`--skip-nx-cache`）

```text
pnpm nx run contracts:typecheck --skip-nx-cache   # Successfully ran target typecheck for project contracts
pnpm nx run api:typecheck --skip-nx-cache         # Successfully ran target typecheck for project api and 25 tasks it depends on
pnpm nx run ai:typecheck --skip-nx-cache          # Successfully ran target typecheck for project ai
pnpm nx run desktop:typecheck --skip-nx-cache     # Successfully ran target typecheck for project desktop（retry；contracts:build 一次 flaky 后通过）
pnpm nx run api:lint --skip-nx-cache              # All files pass linting
pnpm nx run contracts:lint --skip-nx-cache        # Successfully ran target lint for project contracts
pnpm nx run utils:lint --skip-nx-cache            # Successfully ran target lint for project utils
pnpm nx run ai:lint --skip-nx-cache               # Successfully ran target lint for project ai
pnpm nx run data-portability:lint --skip-nx-cache # Successfully ran target lint for project data-portability
pnpm nx run desktop:lint --skip-nx-cache          # Successfully ran target lint for project desktop
```

### Governance / Docs / Inventory

```text
pnpm nx run memoflow:governance-check --skip-nx-cache  # Successfully ran target governance-check（Scope Constraint Audit / inventory / boundary 全绿）
pnpm nx run memoflow:docs-check --skip-nx-cache        # [governance-check] passed；docs-check passed
node tools/test-system-v2/inventory.mjs --check         # 1079 files; {"unit":939,"integration":25,"smoke":3,"boundary-ipc":9,"boundary-main":5,"e2e":63,"perf":4,"governance":31}
```

### Review round 修复（review-out.log FAIL 后的 P1/P2 修复）

- **P1-1（Spec）**：`OpenChatTurnInput` 新增独立 correlation `requestId`；`send/stream-ai-message` use cases 透传 `cx.requestId`；Desktop Electron（goal generate、agent start/resume/get/list/events、assistant dispatch）从 `requestContext` 读取 `requestId`；AssistantFacade 经 `dispatch(command, signal, requestId)` 传播；嵌套 agent 工具调用（`withKnowledgeQaAnswer`、`executeKnowledgeGenerateInterrupt`）复用 `cx.requestId` 而非 mint 新 ID。固定 ID 端到端断言：`ai-chat-application-service.test.ts`、`direct-turn.engine.spec.ts`、`assistant.facade.spec.ts`、`ai-assistant-facade.controller.spec.ts`、`request-context.smoke.test.ts`（entry → AI service requestId → `AIServiceInternalClient` 的 `X-Request-Id`，即 Python `request.state` 值）。
- **P1-2（Standards）**：`dual-registry.surface.spec.ts` 的 forbidden-field inventory 改为大小写不敏感（`emailVerified`/`sessionId` 等 token 转小写匹配），并为每个 forbidden 字段新增 mutation fixture（一个字段一个 mutation，证明检测无 false negative）。
- **P2-1**：`defaultExtractContext` 从 `express-adapter.ts` 导出并在 `@memoflow/utils/result` 复用；AI `express-execution-context.ts` 委托给同一 composer；两个 adapter variant 先经（可能自定义的）extractor 解析 context，envelope metadata 来自结果 context（second-host 无需全局 carrier）。
- **P2-2**：`request-context.smoke.test.ts` 以真实 AI AssistantFacade SSE 路由替换合成 `/api/sse`；覆盖 header-before-first-chunk、done/error framing、disconnect cancellation（abort signal）、entry→Python `request.state`/`X-Request-Id` 断言。
- **P2-3**：`data-portability.controller.test.ts` 的 identity-only cast 替换为完整 `ExecutionContext` fixture；新增 `apps/desktop/src/main/profile/profile-access-context.spec.ts`（每 invocation 全新 ID、owner 只解析一次、完整 shape、AUTH_REQUIRED fail-closed）。
- **P2-4**：ADR-045 修正 `identityId` 为必填；本计划回填真实 gate 证据（本段）。
- **P2-5**：移除 `express-adapter.ts` 未使用的 `Context` import 与 `ai-service-internal-client.spec.ts` 未使用的 `AIServiceInternalRequestError`；对全部改动文件执行 `prettier --write`。

### Review round 2 修复（review2-out.log FAIL 后关闭，2026-08-15）

R2（closure check）FAIL：P1-1 的 `runId` fallback 与可绕过的运行时 requestId 传播未关闭；P1-2 的 mutation fixture 自引用（移除真实 inventory 的 token 后套件仍绿）；Python SSE 断言合成；smoke 绕过包 exports；临时双轨兼容残留；prettier 49 文件不干净。以下逐项关闭（提交为 R2 修复 diff）：

- **P1-1（Spec，关闭）**：`direct-turn.engine.ts` 删除 `requestId ?? runId` fallback，仅透传 `input.requestId`，缺失时由 `AIServiceInternalClient` 生成 UUID fallback；`direct-turn.engine.spec.ts` 改为断言「永不 fallback 到 runId」。`createAgentRuntimeService` 的 `startRun/resumeRun/getRun/listRuns/getEvents` 删除独立的 `requestId?` 参数，统一从 `cx.requestId` 派生（不可旁路）；`AIApplicationPort`/`ai.module.ts` wiring、`ai-agent-runtime.controller.ts`、`ai-agent-runtime.routes.ts`（不再传 `ctx.requestId`）、`electron/index.ts` 同步删除重复参数。
- **P1-2（Standards，关闭）**：`dual-registry.surface.spec.ts` 提取唯一真实检测器 `detectForbiddenContextFields`（负向 inventory 检查与 mutation fixtures 共用同一 `forbiddenContextFieldTokens`）；mutation 测试断言每个 fixture 字段必须仍存在于真实 inventory（移除 token 即失败），且被真实检测器检出、真实 type body 不含该字段。
- **P2（Python SSE 断言，关闭）**：`request-context.smoke.test.ts` 的 dispatch 改为真实链：真实 `registerAIAssistantRoutes` → `AIAssistantFacadeController` → `AssistantFacade` → `DirectTurnEngine` → `AIServiceChatExecutionAdapter` → 真实 `AIServiceInternalClient`；仅 fetch 边界用 Python 等价的 fake（捕获 `X-Request-Id` = `request.state.request_id`、记录 completion log、回传 `X-Request-Id` 响应头），并断言三者与 entry ID 一致。删除手工构造 internal client 的合成断言。
- **P2（包 exports，关闭）**：新增 `@memoflow/ai/testing` 显式 testing 导出（`packages/ai/src/testing/index.ts` + `package.json#exports`）；`vitest.smoke.config.ts` 的 catch-all `@memoflow/ai/*` alias 收窄为 `@memoflow/ai/testing` 单项。
- **P2（临时双轨，关闭）**：`request-context.middleware.ts` 删除 deprecated `id/traceId/startTime` 投影写入与 `RequestContextCarrierRequest` 字段；`response-builder.ts` 删除 `req.traceId/req.id/req.startTime` fallback 读取；`express-adapter.ts` 的 `ExpressLikeRequest` 同步删除同款 deprecated 字段；相关 spec 断言同步移除。
- **P2（prettier，关闭）**：对分支全部改动文件执行 `prettier --write`（含 R2 前 49 个不干净文件），`prettier --check` 全绿；本节修正上一条「P2-5 已 prettier 干净」的不实声明。

R2 修复后门禁（直接 Vitest / typecheck / lint / prettier / governance / docs / inventory 均绿）见下方「R2 修复验证」。

### R2 修复验证（2026-08-15，review2-out.log FAIL 关闭后的真实门禁）

```text
# Direct Vitest（不跑 pnpm nx run <pkg>:test）
node node_modules/vitest/vitest.mjs run --config packages/contracts/vitest.config.ts   # 60 files, 530 tests passed
node node_modules/vitest/vitest.mjs run --config packages/ai/vitest.config.ts          # 120 files, 812 tests passed
node node_modules/vitest/vitest.mjs run --config packages/utils/vitest.config.ts       # 13 files, 128 tests passed
node node_modules/vitest/vitest.mjs run --config apps/api/vitest.config.ts             # 53 files, 224 tests passed
node node_modules/vitest/vitest.mjs run --config apps/api/vitest.smoke.config.ts       # 3 files, 69 tests passed
node node_modules/vitest/vitest.mjs run --config apps/desktop/vitest.config.ts apps/desktop/src/main/profile/profile-access-context.spec.ts # 1 file, 4 tests passed

# Typecheck / Lint（--skip-nx-cache）
pnpm nx run contracts:typecheck --skip-nx-cache   # passed
pnpm nx run api:typecheck --skip-nx-cache         # passed（含 25 个依赖任务）
pnpm nx run ai:typecheck --skip-nx-cache          # passed
pnpm nx run utils:typecheck --skip-nx-cache       # passed
pnpm nx run api:lint --skip-nx-cache              # passed
pnpm nx run contracts:lint --skip-nx-cache        # passed
pnpm nx run ai:lint --skip-nx-cache               # passed（0 errors）
pnpm nx run utils:lint --skip-nx-cache            # passed

# Format / Governance / Docs / Inventory
prettier --check <branch + worktree 全部改动文件>        # All matched files use Prettier code style!
pnpm nx run memoflow:governance-check --skip-nx-cache  # passed（package-export-audit 放行 ai ./testing）
pnpm nx run memoflow:docs-check --skip-nx-cache        # passed
node tools/test-system-v2/inventory.mjs --check         # 1079 files; {"unit":939,"integration":25,"smoke":3,"boundary-ipc":9,"boundary-main":5,"e2e":63,"perf":4,"governance":31}

# Mutation 复核（P1-2 不再自引用）
# 临时从 forbiddenContextFieldTokens 移除 'emailverified' → mutation fixtures 立即 FAIL（1 failed / 12 passed），
# 证明真实 inventory 的 token 被移除时套件会失败；恢复后 13/13 绿。
```
