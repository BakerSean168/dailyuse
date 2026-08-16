---
tags:
  - plan
  - active
  - architecture
  - reference-architecture
  - observability
  - assembly-governance
  - p2
description: Reference architecture phase 6: API observability and enforceable runtime-owned module assembly / 参考架构阶段 6：API 可观测性与可执行的宿主装配治理
created: 2026-08-15T00:00:00Z
updated: 2026-08-15T00:00:00Z
---

# Reference Architecture Phase 6: Observability and Assembly Governance / 参考架构阶段 6：可观测性与装配治理

## 文档状态

- **状态**：Active，read-only implementation plan；本文只冻结契约、实施顺序与门禁，本轮不修改生产代码、测试、依赖或既有 ADR。
- **分支基线**：`feat/refarch-phase6-observability`，`HEAD = f4840035022083439895b293786a34fe5b464da8`。
- **依据**：
  - `docs/analysis/2026-08-13-architecture-refactor-review.md`：§1 items 2/5/7、§2.1/2.5、§3.1/3.2/3.3/3.5/3.11、§4 P1/P2 rows、§6 阶段 6。
  - Phase 1/2/3-5 已落地结果：Application/Infrastructure 分层、canonical Request/Execution Context、全部 feature 的 host runtime composer、HTTP/IPC parity 与 Query Cache pilot。
  - ADR-025/031/033/035/042/043/045，以及当前 API logger、RequestContext middleware、metrics endpoint、AI proposal/approval 和 reliable messaging 实现。
  - `AGENT.md` 的 governance-first 试点、direct verification、文档与治理门禁。
- **实施原则**：先固定单一 request lifecycle，再接 metrics/trace；先以 `packages/governance` 收紧 module contract，再推广；surface test 锁架构边界，不复制业务单测。

## 1. 目标与非目标

### 1.1 目标

1. 让 API 进程中的 logger provider 在任何 feature/module-level logger 创建前完成初始化；请求完成日志、错误日志、启动/关闭日志都走同一 `@memoflow/utils/logger` provider 和结构化 metadata 约定。
2. 让一个 request lifecycle observer 同时驱动 terminal log、低基数 request metrics 与 trace span；每次 HTTP attempt 只能结算一次，JSON、204、404、500、下载与 SSE 都覆盖，abort 与 finish 不重复。
3. 将 `/metrics` 收敛为稳定的 Prometheus counter/histogram 语义：route template、method、status、outcome 标签有界，不把 identity、request ID、query 或实体 ID 放进 label；`/metrics/json` 继续使用 Result envelope。
4. 提供默认 no-op 的 trace Port，并允许通过显式 env opt-in 启用 OpenTelemetry；默认部署不需要 collector，禁用时保持 Phase 2 的 request ID correlation 行为。
5. 将 `IApiModule` 从“约定上兼容”升级为可编译、可审计的 shared lifecycle-handle contract；registration context 不再暴露 `db`，所有数据库/adapter/application instance 必须在 runtime composer/factory 中先绑定。
6. 建立三组 repo-level architecture surface tests：跨模块 read Ports、AI Proposal/Approval/Mutation 边界、reliable operation receipt/schema validation 边界，并把检测器接入 governance check。
7. 以 governance check、全量 typecheck/lint、API/AI/Web/Desktop 关键 journey 和 prod-like local-docker 证据完成阶段闭环。
8. 所有本阶段新增或修改的 public type/interface/class/factory/options/export 都具备 **English first、中文 second** 的双语 JSDoc；函数包含 `@param`/`@returns`，泛型包含 `@typeParam`，内部 adapter 明确 `@internal`。

### 1.2 非目标

- 不建设 Grafana/Tempo/Jaeger/Prometheus 集群，不把 collector 加入默认 local/prod compose，不提交外部 dashboard 或告警规则。
- 不把 OpenTelemetry 设为启动必需能力；`OTEL_TRACING_ENABLED=0` 是默认且完整支持的生产路径。
- 不在本阶段给 Python AI service 建完整 OTel SDK/exporter；API -> AI 继续以 `X-Request-Id` 为必需 correlation，启用 OTel 时额外透传 W3C trace headers。
- 不把 request body、query values、cookie、Authorization、HMAC、provider key、知识正文、proposal payload 或 identity ID 写入 metrics label/span attribute。
- 不把 `requestId`、`traceId`、proposal ID、run ID、operation ID 或 idempotency key 合并成一个字段；它们继续拥有不同生命周期。
- 不重写 Winston/日志框架，不引入第二套 logger facade，不要求浏览器/Desktop 与 API 使用同一 transport。
- 不重写 feature 业务、repository、route DTO、AI workflow 或 reliable worker；surface tests 只锁已采纳架构，不增加虚构业务。
- 不以 surface test 替代行为测试、故障注入、数据库 integration 或产品 journey。
- 不为兼容旧模块长期保留 `context.db`、optional instance、双 module contract 或旧/新 metrics 双计数。

## 2. 当前状态盘点

### 2.1 Gap table

| 优先级 | 当前状态 / gap                                                      | 当前证据                                                                                                                                                                                            | 阶段 6 目标                                                                                                                     |
| ------ | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| P0     | Logger 初始化晚于 ESM dependency evaluation                         | `apps/api/src/main.ts` 的 `initializeLogger()` 位于静态 imports 之后；多个 imported modules 在顶层 `createLogger(...)`，已持有 default provider 实例，`LoggerFactory.clearCache()` 无法替换这些引用 | 最小 entry 先初始化 logger/optional tracing，再 dynamic import server graph；所有 API module-level logger 从同一 provider 创建  |
| P0     | Request lifecycle 有两个 owner                                      | `request-context.middleware.ts` 监听 finish/close 记录 terminal log；`performance.middleware.ts` 另包裹 `res.json`、监听 finish、跳过 SSE                                                           | 一个 observer 结算 log/metrics/span；删除 response monkey patch 与第二个 duration owner                                         |
| P0     | Metrics label 可被实体路径撑爆                                      | performance middleware 在 route dispatch 前计算 `${req.method} ${req.route?.path                                                                                                                    |                                                                                                                                 | req.path}`，常退回 raw `req.path` | terminal 时解析 route template；无法解析统一标记 `__unmatched__`，绝不回退 raw URL |
| P0     | 当前 Prometheus “histogram” 不符合 histogram exposition             | `metrics.controller.ts` 输出 `_sum/_count/_avg/_p50/_p95/_p99/_max`，没有 cumulative `_bucket{le=...}`                                                                                              | 固定 bucket + cumulative exposition；request total 按 method/route/status/outcome 计数；JSON debug stats 可保留 quantile        |
| P1     | SSE 完全跳过 request metrics                                        | `performance.middleware.ts` 对 `/sse/` 直接 `next()`                                                                                                                                                | SSE finish/abort 进入同一 observer；不读取/包裹 stream body                                                                     |
| P1     | `X-Response-Time` 依赖 `res.json` monkey patch且不覆盖所有 response | 只有 JSON 在发 header 前得到该值，finish 后通常已无法再写 header                                                                                                                                    | 明确退役该非公共 header；duration 以 terminal metric/log/span 为真值，ADR-045 同步更新                                          |
| P1     | Phase 2 的 `traceId` 仍等于 `requestId`                             | ADR-045 与 RequestContext spec 明确 `traceId === requestId`，没有 W3C parent/sampling/export                                                                                                        | 默认继续相等；显式启用 OTel 后由 server span 提供 trace ID并透传 `traceparent`，request ID仍独立                                |
| P0     | `IApiModuleContext` 仍暴露 `db`                                     | `api-module.ts` extends `ServerModuleContext<DatabaseClient>`；PowerSync/Dashboard 在 `register()` 读取 `context.db`                                                                                | registration context只含 app/router/middleware/OpenAPI；PowerSync/Dashboard 也在 runtime factory先绑定 DB                       |
| P1     | Feature module Def 只有结构兼容                                     | 11 个 `packages/*/src/api/module.ts` 各自声明 `*ApiModuleDef`，JSDoc 只称 `IApiModule-compatible`                                                                                                   | shared `ServerModuleHandle<TContext>`；每个 Def 显式 extends；typecheck negative fixture锁 `context.db` 不可见、`instance` 必填 |
| P1     | Composition 规则分散在大量 source prose                             | package modules已有详尽说明，但 generic contract 与 governance没有完整机器约束                                                                                                                      | governance pilot + AST audit锁 transport-only register、instance injection、无 repository/Prisma construction                   |
| P1     | 跨模块 Port/approval/receipt 依赖局部 tests                         | Goal/AI/reliable messaging 分别已有行为 tests，但没有一组 repo-level architecture inventory                                                                                                         | 三个 manifest-driven AST surface locks + mutation fixtures，随 governance check执行                                             |
| P1     | 双语 JSDoc audit 只严格覆盖 governance package                      | `governance-module-docs-audit.mjs` 不覆盖 shared module contract/API observability/其它 feature api module public exports                                                                           | 新增 targeted public-surface JSDoc audit，覆盖本阶段 public surfaces，避免全仓遗留债一次性爆炸                                  |

### 2.2 目标 ownership

```text
apps/api/src/main.ts (preflight entry)
  -> load validated env
  -> initialize one logger provider
  -> initialize optional trace runtime
  -> dynamic import server graph

HTTP attempt
  -> RequestContext + optional SERVER span
  -> security/body/auth/routes/application
  -> exactly one terminal observation (finished | aborted)
       -> structured request logger
       -> bounded HTTP metrics recorder
       -> span status/end

Host runtime composer/factory
  -> choose DB/adapter/runtime contributions
  -> create transport-neutral module instance
  -> create ServerModuleHandle({ instance })
  -> ApiBootstrapper.register(handle)
       -> register(context WITHOUT db)
       -> transport mount + start/dispose only
```

- Request observer属于 API platform；Application/Domain 不 import logger、metrics 或 OTel。
- Feature packages own consumer-facing Ports；API/Desktop host composers own concrete adapter selection与注入。
- `packages/contracts` 提供 host-neutral module-handle/context contract；feature package不得依赖 `apps/api`。
- Surface audit属于 `tools/governance`；行为测试仍留在拥有行为的 package/app。

## 3. 契约冻结（Step 1 前评审确认）

### 3.1 Request observation contract

新增的 API-local observation shape只表达安全、低基数、terminal facts：

```ts
export type HttpRequestOutcome = 'finished' | 'aborted';

export interface HttpRequestObservation {
  readonly requestId: string;
  readonly traceId: string;
  readonly method: string;
  readonly routeTemplate: string;
  readonly statusCode: number;
  readonly outcome: HttpRequestOutcome;
  readonly durationMs: number;
  readonly identityId?: string;
}

export interface HttpRequestObserver {
  complete(observation: HttpRequestObservation): void;
}
```

- `routeTemplate` 必须来自 Express registered route template + mount path；参数保持 `:id`，query被移除。无法解析时为固定 `__unmatched__`，不得使用 raw `req.path/originalUrl/url`。
- `identityId` 仅允许进入 access log metadata，不进入 metrics label或span attribute。
- `durationMs` 由 canonical `RequestContext.startedAt` 与同一 injectable clock计算，不另建 start time。
- finish/close共享 terminal guard；finish后close不二次结算。SSE disconnect是 `aborted`，正常结束是 `finished`。
- observer failure不得改变response；logger/metrics/exporter异常由 platform logger报告并隔离。

### 3.2 Metrics contract

- `http_requests_total{method,route,status,outcome}` 是counter；`status`使用实际三位HTTP状态码，不得含error message/code。
- `http_request_duration_ms` 是标准histogram；bucket固定为`5,10,25,50,100,250,500,1000,2500,5000,10000,+Inf`毫秒，`_bucket`必须cumulative，同时输出`_sum`与`_count`。
- 进程内store按有限 label key聚合；不得为每个request保存永久对象。若 `/metrics/json` 继续提供p50/p95/p99，只允许每个label key保留固定上限ring buffer，且Prometheus不把quantile伪装成histogram。
- `/metrics` 保持 `text/plain; version=0.0.4`；`/metrics/json` 保持 `HttpResponse<Result>` envelope；现有 `memoflow_operation_metrics` 与process metrics保留。
- metrics自身可以被观测，但label必须稳定为 `/metrics`/`/metrics/json`；不得因scrape产生新series。
- `X-Response-Time` 在本阶段退役：没有仓库消费者，且它只表示部分response的pre-send duration。真实duration以terminal observation为准。

### 3.3 Trace contract（OpenTelemetry opt-in）

- API platform定义`HttpRequestTrace`/`HttpRequestSpan` Port；默认`NoopHttpRequestTrace`不分配SDK对象、不发网络请求。
- `OTEL_TRACING_ENABLED=0`（默认）：忽略incoming `traceparent/tracestate`，`traceId = requestId`，与ADR-045当前行为一致。
- `OTEL_TRACING_ENABLED=1`：在导入server graph前初始化Node SDK；有效incoming W3C context被继续，无效context创建新root span；`RequestContext.traceId`取有效span trace ID，`requestId`仍来自`X-Request-Id`/UUID且不改变。
- 启用时必须显式配置OTLP endpoint/service name；配置组合不完整fail-fast于启动阶段，不允许“已启用但静默无 exporter”。export失败记录错误但不让单个业务请求失败。
- SERVER span attributes只包含HTTP semantic fields、route template、status/outcome和request ID；exception只记录type/message，禁止body/query/header/identity/proposal content。
- API -> Python AI internal HTTP在active context中注入`traceparent/tracestate`，继续同时发送现有`X-Request-Id`与HMAC headers；W3C headers不进入现有HMAC canonical payload。
- shutdown顺序固定为：停止接收/worker -> module destroy -> DB disconnect -> trace forceFlush/shutdown -> process exit。

### 3.4 Module handle contract

`packages/contracts/src/shared/server-module-context.ts`（或相邻单一文件）成为host-neutral真值源：

```ts
export interface ServerTransportModuleContext {
  readonly app: import('express').Express;
  readonly router: import('express').Router;
  readonly middleware: {/* existing transport middleware surface */};
  readonly openApiRegistry?: {/* existing registry surface */};
}

export interface ServerModuleHandle<TContext extends ServerTransportModuleContext> {
  readonly name: string;
  register(context: TContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}
```

- `IApiModuleContext extends ServerTransportModuleContext`，不含`db`；`IApiModule extends ServerModuleHandle<IApiModuleContext>`。
- Feature `*ApiModuleContext` alias/extends transport context；`*ApiModuleDef extends ServerModuleHandle<*ApiModuleContext>`；不复制name/register/destroy body。
- Feature `*ApiModuleOptions` 必须含required `instance`（以及真正的transport-only Port，如Data Portability disclosure）；不得接`db/repository/config factory`。
- `register()` 只允许route/handler binding与已注入instance的start；`destroy()`只dispose/stop同一instance，保持一次注册、失败清理、幂等销毁的现有状态机。
- API-local PowerSync/Dashboard改为`compose/create*ApiModule({ db, ... })` closure-bound handle；Dashboard listener在factory/instance中拥有可停止lifecycle，`destroy()`必须解绑。
- `ApiBootstrapper` 可为auth middleware私有持有Database capability，但传给module的context不含DB；不得用intersection cast重新暴露。

### 3.5 Architecture surface contract

1. **Cross-module read Ports**：首批manifest固定`GoalDependencyReadPort`、`IAnalyticsReadPort`、`IKnowledgeSourcePort`。检测consumer-owned contract、Application对抽象依赖、API/Desktop各自adapter实现、host composer显式注入，以及consumer code不deep-import provider infrastructure。
2. **AI proposal approval**：Turn Engine capability不含`tool.mutation`；`AssistantFacade` approve/revise/reject只改变Proposal lifecycle；business mutation只从显式`waiting_approval` confirm/approved action路径进入host executor；非approved/stale revision/identity mismatch必须fail closed。
3. **Reliable operation receipt**：唯一`BusinessOperationReceipt`/`ProjectionOperation` body在contracts；reliable Port输出使用canonical类型；manifest中的adapter/mappers在输出边界调用`assertValidBusinessOperationReceipt`/`assertValidProjectionOperation`；不得新增local receipt shape或unparsed success。
4. 检测器使用TypeScript compiler AST/structured manifest，不用脆弱全文substring作为唯一证据；每条negative rule都有mutated fixture证明删除/绕过边界会使测试变红。

### 3.6 Public surface bilingual JSDoc

- English description first，中文说明second；两种语言必须解释ownership/contract，而不是逐词重复名称。
- Public exported type/interface/class/function/factory/options必须有JSDoc；参数、返回值、type parameter完整；internal adapter标`@internal`。
- 覆盖本阶段触及的shared module contract、API observability public seam、11个feature `api/module.ts` public exports及新增governance detector helpers。
- 新audit使用明确路径scope，先覆盖本阶段表面，不以大allowlist吞掉旧债，也不在本阶段强迫全仓遗留public types一次性补文档。

## 4. 分步实施（PR-able Steps）

### Step 1 - Logger preflight与单一API provider（P0）

**目标**：消除ESM静态import期间创建default logger的双provider窗口，先固定同一结构化logger，再改变request lifecycle。

**文件与变更**

- 将`apps/api/src/main.ts`收窄为preflight entry：加载validated env，调用幂等`initializeLogger()`，然后dynamic import新增的`apps/api/src/server.ts`；当前bootstrap/signal/shutdown逻辑原样移动到`server.ts`，`tsup`产物入口仍保持`dist/main.js`。
- 修改`apps/api/src/shared/infrastructure/config/logger.config.ts`：相同配置的重复初始化幂等no-op，冲突配置的重复初始化fail-fast；provider/config完成前不import feature graph。
- 修改`packages/utils/src/logger/winston-logger.ts`与focused specs：结构化metadata/error shape一致；`child()`复用parent logger/transports，不为每个child重复创建daily-rotate transport；生产console保持可机器解析JSON，开发可保留pretty格式。
- 将`apps/api/src/shared/infrastructure/config/swagger.ts`运行期`console.log`迁到shared logger；env schema在logger尚不能启动时输出fatal validation error是唯一保留的preflight console例外。
- 新增`apps/api/src/shared/infrastructure/config/logger-bootstrap.spec.ts`，使用fake provider证明feature module-level logger在初始化后才创建，并覆盖相同/冲突配置的重复初始化；不通过检查logger cache推断成功。
- 本Step新增/修改public logger factory/option/return surface全部补English-first/中文-second JSDoc。

**测试与直接门禁**

```bash
node node_modules/vitest/vitest.mjs run --config packages/utils/vitest.config.ts \
  packages/utils/src/logger

node node_modules/vitest/vitest.mjs run --config apps/api/vitest.config.ts \
  apps/api/src/shared/infrastructure/config/logger-bootstrap.spec.ts \
  apps/api/src/bootstrap.spec.ts

pnpm nx run utils:typecheck --skip-nx-cache
pnpm nx run api:typecheck --skip-nx-cache
pnpm nx run utils:lint --skip-nx-cache
pnpm nx run api:lint --skip-nx-cache
```

- 禁止调用`pnpm nx run utils:test`或`pnpm nx run api:test`；Vitest只用上述direct CLI。
- **Step gate / 完成条件**：测试能捕获“feature logger先于provider创建”的mutation；真实entry中每个API context只创建一个provider-backed logger family，child不增加transport数量，server bootstrap与shutdown行为无差异。
- **回滚单位**：整体回滚entry/server拆分与logger实现；不得留下双入口或在`main`和`server`各初始化一次。后续metrics/trace尚未依赖本Step时可独立回滚。

### Step 2 - 单一request observer与有界metrics（P0）

**目标**：由RequestContext middleware的一次terminal settlement同时产生日志和request metrics，修正cardinality与Prometheus语义。

**文件与变更**

- 新增`apps/api/src/shared/infrastructure/observability/http-request-observation.ts`、`http-request-metrics.ts`，实现§3.1/3.2 contracts、route template resolver、fixed-bucket store与observer fan-out。
- 修改`request-context.middleware.ts`：保留ID accept/fallback/header-before-next与Principal ordering；将inline terminal logger替换为injected observer；finish/close共用exactly-once guard；observer异常隔离。
- 删除`performance.middleware.ts`中的`res.json` monkey patch、第二个finish listener与SSE skip。完成切换后删除该文件或只保留兼容re-export一个release内；本仓库不要求兼容，优先同Step直接删除并改imports。
- 修改`global.ts`：只挂一次request context/observation middleware；退役`X-Response-Time`。
- 修改`ApiBootstrapper`：构造/持有一个metrics recorder并注入global middleware和infrastructure router，不允许global singleton在tests间泄漏。
- 修改`metrics.controller.ts`、`infrastructure-routes.ts`与specs：输出真实Prometheus buckets/counters，保留process与`memoflow_operation_metrics`；JSON summary按request count加权，不再对endpoint averages做未加权平均。
- 扩展API smoke：参数化route不泄漏实体ID；404统一`__unmatched__`；SSE正常/abort均各计一次；finish+close不双计；metrics请求不会产生无界series。
- 更新ADR-045对terminal owner与`X-Response-Time`的说明（完整observability ADR在Step 7创建）。

**测试与直接门禁**

```bash
node node_modules/vitest/vitest.mjs run --config apps/api/vitest.config.ts \
  apps/api/src/shared/infrastructure/http/middlewares/request-context.middleware.spec.ts \
  apps/api/src/shared/infrastructure/observability \
  apps/api/src/shared/infrastructure/http/controllers/metrics.controller.spec.ts \
  apps/api/src/shared/infrastructure/http/controllers/metrics-result-envelope.surface.spec.ts \
  apps/api/src/shared/infrastructure/middleware/error.spec.ts

node node_modules/vitest/vitest.mjs run --config apps/api/vitest.smoke.config.ts \
  apps/api/src/__tests__/smoke/request-context/request-context.smoke.test.ts

pnpm nx run api:typecheck --skip-nx-cache
pnpm nx run api:lint --skip-nx-cache
```

- Prometheus spec必须断言每个`le` bucket cumulative、`+Inf == _count`、sum/count正确、labels转义正确；JSON spec断言Result envelope不退化。
- 增加mutation assertion：route resolver退回raw path、SSE skip恢复、terminal guard移除或第二个recorder出现时套件必须失败。
- **Step gate / 完成条件**：JSON/204/404/500/SSE finish/SSE abort各产生一条terminal log和一份metric；两个不同实体ID聚合到同一route series；源码没有`res.json =`和第二个request-duration middleware。
- **回滚单位**：observer+metrics controller+global wiring作为一个commit回滚；不得同时挂新旧middleware。必须临时回滚时恢复旧`/metrics`完整输出，而不是只回滚controller造成空store。

### Step 3 - Trace Port与可选OpenTelemetry（P1/P2）

**目标**：在不要求collector的前提下建立可替换trace seam；opt-in时产生真实server span并把W3C context带到AI internal HTTP。

**文件与变更**

- 新增`apps/api/src/shared/infrastructure/observability/http-request-trace.ts`、`noop-http-request-trace.ts`、`opentelemetry-http-request-trace.ts`和runtime initializer；observer调用span status/error/end，不让route/application import OTel。
- 在`apps/api/package.json`添加明确的OTel API/SDK/OTLP exporter/semantic conventions direct dependencies；在`packages/ai/package.json`添加`@opentelemetry/api` direct dependency用于active context header injection；更新`pnpm-lock.yaml`，不得依赖当前transitive optional package偶然存在。
- 扩展`env.schema.ts`/spec、`.env.example`、`docker-compose.local.yml`、`docker-compose.prod.yml`：`OTEL_TRACING_ENABLED`默认false，endpoint/service name/sampling配置有组合校验；默认compose不新增collector。
- `main.ts` preflight在dynamic import server前await trace initializer；`server.ts` graceful shutdown调用trace runtime shutdown且有timeout/failure log。
- RequestContext middleware在启用时于active span context内调用`next()`；有效span ID写入canonical`traceId`，disabled/noop继续`traceId=requestId`。CORS允许`traceparent/tracestate`但不暴露内部HMAC headers。
- 修改`AIServiceInternalClient`：用OTel propagation API向新carrier注入active`traceparent/tracestate`并与现有HMAC/request headers合并；不改变签名input、timeout、abort、request ID fallback。
- 测试使用in-memory exporter/fake OTLP endpoint：一个API request恰好一个SERVER span，AI fetch是其child/propagated context；401/500标error，SSE正常/abort正确end；disabled模式零export且现有Phase 2 snapshots不变。
- 更新ADR-045：只有OTel enabled时`traceId`可与`requestId`分离；明确incoming W3C header不是auth/idempotency。

**测试与直接门禁**

```bash
node node_modules/vitest/vitest.mjs run --config apps/api/vitest.config.ts \
  apps/api/src/shared/infrastructure/config/env.schema.spec.ts \
  apps/api/src/shared/infrastructure/observability \
  apps/api/src/shared/infrastructure/http/middlewares/request-context.middleware.spec.ts

node node_modules/vitest/vitest.mjs run --config packages/ai/vitest.config.ts \
  packages/ai/src/server/infrastructure/chat-execution/__tests__/ai-service-internal-client.spec.ts

node node_modules/vitest/vitest.mjs run --config apps/api/vitest.smoke.config.ts \
  apps/api/src/__tests__/smoke/request-context/request-context.smoke.test.ts

pnpm nx run api:typecheck --skip-nx-cache
pnpm nx run ai:typecheck --skip-nx-cache
pnpm nx run api:lint --skip-nx-cache
pnpm nx run ai:lint --skip-nx-cache
```

- 精确断言disabled/enabled两个配置分支；enabled但endpoint缺失必须在listen前fail-fast；exporter失败不得改变HTTP response。
- HMAC test固定原canonical签名与headers；只允许新增W3C propagation headers。
- **Step gate / 完成条件**：默认配置无collector依赖且Phase 2 request ID journey全绿；opt-in测试可证明API SERVER span -> AI internal request同一trace，shutdown flush完成；敏感字段inventory为零。
- **回滚单位**：运行时紧急回滚先设`OTEL_TRACING_ENABLED=0`切到noop；代码回滚只移除OTel adapter/dependencies/header injection，保留Step 2 observer与request metrics。

### Step 4 - Governance-first shared module handle contract（P0 governance pilot）

**目标**：先用reference module证明shared generic contract能表达“runtime注入instance，register只做transport/lifecycle”，且feature package不依赖`apps/api`。

**文件与变更**

- 重构`packages/contracts/src/shared/server-module-context.ts`并更新`shared/index.ts`：新增§3.4的`ServerTransportModuleContext`与`ServerModuleHandle<TContext>`；保留需要DB的host composition type时必须另名，不能让transport context继承DB。
- 修改`apps/api/src/shared/contracts/api-module.ts`/index：`IApiModuleContext`只extends transport context，`IApiModule`extends shared handle；`DatabaseClient`只作为bootstrap private dependency/test helper type，绝不进入module registration context。
- 先只修改`packages/governance/src/api/module.ts`：`GovernanceApiModuleContext`复用canonical transport context，`GovernanceApiModuleDef extends ServerModuleHandle<...>`，options仍required instance；行为状态机不改。
- 扩展governance module lifecycle/composition surface specs：compile-time正向赋值到shared handle；`@ts-expect-error`负向fixture证明`context.db`不可访问、缺`instance`不可构造、register不能收更宽的DB context。
- 更新`packages/governance/README.md`与ADR-025/031中的pilot说明：删除“未迁移 sibling可暂时在register读context.db”的历史fallback。
- 对shared/governance所有触及public exports补完整双语JSDoc；Step 6的通用audit尚未接入前，先在focused spec中锁文档存在与顺序。

**测试与直接门禁**

```bash
node node_modules/vitest/vitest.mjs run --config packages/contracts/vitest.config.ts \
  packages/contracts/src/shared

node node_modules/vitest/vitest.mjs run --config packages/governance/vitest.config.ts \
  packages/governance/src/api/module-lifecycle.spec.ts \
  packages/governance/src/server/infrastructure/__tests__/governance-composition-root.surface.spec.ts

node node_modules/vitest/vitest.mjs run --config apps/api/vitest.config.ts \
  apps/api/src/bootstrap.spec.ts \
  apps/api/src/runtime/compose-governance.spec.ts

pnpm nx run contracts:typecheck --skip-nx-cache
pnpm nx run governance:typecheck --skip-nx-cache
pnpm nx run api:typecheck --skip-nx-cache
pnpm nx run contracts:lint --skip-nx-cache
pnpm nx run governance:lint --skip-nx-cache
pnpm nx run api:lint --skip-nx-cache
```

- **Step gate / 完成条件**：governance composer返回的handle可直接注册为`IApiModule`；governance api module源码/类型均无法访问DB，仍通过全部start/register failure/destroy幂等测试；contracts不import app。
- **回滚单位**：shared contract + governance pilot + API specialization一起回滚；不得只回滚type alias而留下两套context body。未推广其它modules前该回滚不影响业务行为。

### Step 5 - 全模块contract rollout与app-local residual关闭（P1）

**目标**：把governance模式推广到所有feature，并移除PowerSync/Dashboard两个registration-time DB消费者。

**文件与变更**

- 按`governance -> goal/task -> account/ai/data-portability/notification/reminder/repository/schedule/setting`顺序修改各`packages/*/src/api/module.ts`与public api index：context复用canonical type，Def extends shared handle，options required instance；现有lifecycle/error rollback语义不变。
- 每一批先跑该package module-lifecycle + composer specs，再开始下一批；Goal/Task仍是第二批，不与剩余八个包一次性blind rewrite。
- 将`PowerSyncApiModule`改为`composePowerSyncApiModule({ db, config? })`或同义runtime factory：DB/config在factory closure绑定，register只挂route；更新module specs和`main.ts`。
- 将`DashboardApiModule`改为`composeDashboardApiModule({ dashboardReadPort, activityLedgerRuntime })`：DB-backed adapter/ledger在runtime组装，handle start/stop同一listener；更新focused lifecycle specs和`main.ts`。
- 修改`ApiBootstrapper`构造的module context删除`db`；删除所有`IApiModuleContext & ServerModuleContext<PrismaClient>`intersection；bootstrap仍可私有使用DB构造auth middleware。
- 新增/扩展`apps/api/src/shared/contracts/api-module.surface.spec.ts`：扫描所有audited feature api modules无`context.db`、Prisma、repository/module factory construction，且每个Def绑定shared handle。
- 更新`docs/standards/architecture.md`、ADR-025/031与`packages/governance/README.md`的app-local例外列表，PowerSync/Dashboard不再作为registration-context例外。

**测试与直接门禁**

```bash
# Governance + Goal/Task rollout
node node_modules/vitest/vitest.mjs run --config packages/governance/vitest.config.ts packages/governance/src/api/module-lifecycle.spec.ts
node node_modules/vitest/vitest.mjs run --config packages/goal/vitest.config.ts packages/goal/src/api/module-lifecycle.spec.ts
node node_modules/vitest/vitest.mjs run --config packages/task/vitest.config.ts packages/task/src/api/module-lifecycle.spec.ts

# Remaining feature API handles (one direct Vitest process per package config)
node node_modules/vitest/vitest.mjs run --config packages/account/vitest.config.ts packages/account/src/api/module-lifecycle.spec.ts
node node_modules/vitest/vitest.mjs run --config packages/ai/vitest.config.ts packages/ai/src/api/module-lifecycle.spec.ts
node node_modules/vitest/vitest.mjs run --config packages/data-portability/vitest.config.ts packages/data-portability/src/api/module-lifecycle.spec.ts
node node_modules/vitest/vitest.mjs run --config packages/notification/vitest.config.ts packages/notification/src/api/module-lifecycle.spec.ts
node node_modules/vitest/vitest.mjs run --config packages/reminder/vitest.config.ts packages/reminder/src/api/module-lifecycle.spec.ts
node node_modules/vitest/vitest.mjs run --config packages/repository/vitest.config.ts packages/repository/src/api/module-lifecycle.spec.ts
node node_modules/vitest/vitest.mjs run --config packages/schedule/vitest.config.ts packages/schedule/src/api/module-lifecycle.spec.ts
node node_modules/vitest/vitest.mjs run --config packages/setting/vitest.config.ts packages/setting/src/api/module-lifecycle.spec.ts

# API bootstrap/app-local modules/runtime composers
node node_modules/vitest/vitest.mjs run --config apps/api/vitest.config.ts \
  apps/api/src/bootstrap.spec.ts \
  apps/api/src/modules/powersync/module.spec.ts \
  apps/api/src/modules/dashboard \
  apps/api/src/runtime

pnpm nx run-many -t typecheck --projects=contracts,governance,goal,task,account,ai,data-portability,notification,reminder,repository,schedule,setting,api --parallel=5 --skip-nx-cache
pnpm nx run-many -t lint --projects=contracts,governance,goal,task,account,ai,data-portability,notification,reminder,repository,schedule,setting,api --parallel=5 --skip-nx-cache
```

- 以上所有Vitest命令直接调用CLI；禁止替换成`pnpm nx run <package>:test`或`run-many -t test`。
- **Step gate / 完成条件**：`IApiModuleContext`与所有feature api contexts都没有DB；每个package Def显式继承shared handle；PowerSync/Dashboard依赖在register前绑定且Dashboard listener可dispose；全套module lifecycle与composer tests通过。
- **回滚单位**：按推广逆序逐slice回滚（batch -> goal/task -> governance/shared）；PowerSync与Dashboard各自可独立回滚，但一旦恢复`context.db`就必须同时回滚“registration context无DB”的contract，禁止用cast制造半迁移状态。

### Step 6 - 三组architecture surface locks + 双语JSDoc audit（P0 governance gate）

**目标**：把Phase 6要求的长期架构事实转成可维护、可mutation验证的repo-level governance，而不是更多易漂移prose。

**文件与变更**

- 新增`tools/governance/architecture-surface-audit.mjs`、`lib/architecture-surface.mjs`与小型JSON/JS manifest。用TypeScript compiler API解析imports、interfaces/classes/method calls/type references；报告file:symbol与违反的rule ID。
- 新增`tools/governance/__tests__/architecture-surface.test.mjs`，每条规则至少一个positive fixture和一个mutated negative fixture；manifest中声明的每个path/symbol缺失都fail closed，不能因文件重命名静默减少coverage。
- **Read Port rules**：
  - `GoalDependencyReadPort` -> Task Prisma/PowerSync adapters -> API/Desktop `composeGoal` injection；
  - `IAnalyticsReadPort` -> Controlled/Desktop adapters -> API/Desktop `composeAI` injection；
  - `IKnowledgeSourcePort` -> Repository/Desktop adapters -> API/Desktop `composeAI` injection；
  - consumer Application不import provider concrete infrastructure，host composer不得用untyped object/cast代替Port。
- **AI approval rules**：AST锁Turn Engine/proposal capability没有`tool.mutation`，`AssistantFacade.dispatchApprove/Revise/Reject`不引用executor或`executeApproved`，mutation executor只由显式approved/confirm path调用；配合现有ProposalKernel与host task journey行为tests覆盖stale revision、not-approved、identity mismatch、idempotent receipt。
- **Reliable receipt rules**：AST锁canonical contracts唯一body、reliable Port return types、manifest adapter output-boundary validator call；配合contracts 8-state/idempotency tests与Goal/Reminder/Notification adapter behavior tests，不在surface test复制状态机。
- 新增targeted `public-surface-jsdoc-audit.mjs`或扩展现有docs audit：覆盖§3.6 paths与export kinds；English-first/中文-second、`@param/@returns/@typeParam/@internal`均有mutation fixtures。
- 将两个audit加入root `project.json#governance-check` command与inputs；若新增tool source需同步target baseline/test inventory，不创建长期allowlist。
- 更新ADR-033/035/042/043的Enforcement段，指向rule IDs、manifest与行为tests。

**测试与直接门禁**

```bash
node node_modules/vitest/vitest.mjs run --config tools/governance/vitest.config.ts \
  tools/governance/__tests__/architecture-surface.test.mjs \
  tools/governance/__tests__/public-surface-jsdoc.test.mjs

node node_modules/vitest/vitest.mjs run --config packages/contracts/vitest.config.ts \
  packages/contracts/src/modules/reliable-messaging/reliable-messaging-contracts.spec.ts \
  packages/contracts/src/modules/ai/agent-host

node node_modules/vitest/vitest.mjs run --config packages/ai/vitest.config.ts \
  packages/ai/src/server/infrastructure/proposal-kernel/__tests__/proposal.kernel.spec.ts \
  packages/ai/src/server/infrastructure/assistant-facade/__tests__/assistant.facade.spec.ts \
  packages/ai/src/server/infrastructure/runtime/__tests__/agent-host-stage0-composition.surface.spec.ts \
  packages/ai/src/server/infrastructure/runtime/__tests__/host-task-create-product.journey.spec.ts

node node_modules/vitest/vitest.mjs run --config packages/goal/vitest.config.ts \
  packages/goal/src/server/infrastructure/adapters/powersync/__tests__/powersync-goal-reliable-operation.adapter.test.ts

node node_modules/vitest/vitest.mjs run --config packages/reminder/vitest.config.ts \
  packages/reminder/src/server/infrastructure/adapters/prisma/__tests__/reminder-reliable-operation.integration.test.ts

node node_modules/vitest/vitest.mjs run --config packages/notification/vitest.config.ts \
  packages/notification/src/server/infrastructure/adapters/powersync/__tests__/notification-powersync-durable-worker.spec.ts

pnpm nx run memoflow:governance-check --skip-nx-cache
pnpm nx run memoflow:docs-check --skip-nx-cache
```

- 若focused adapter路径在实施前复核后不同，以`rg --files`找到的真实test为准并回填计划；不得因此删除该模块行为gate。
- `memoflow:governance-check`是仓库规定的governance orchestrator，允许其内部依赖governance/test-system targets；本计划仍禁止人为调用任一package Nx `:test` target执行Vitest。
- **Step gate / 完成条件**：三组architecture audit各自的真实代码检查、manifest completeness、mutation fixtures全部绿；删除一个adapter injection、在approve path接executor、移除receipt validator或删中文JSDoc都会稳定变红。
- **回滚单位**：surface audit/runtime代码解耦，可独立回滚误报检测器；但只能回滚到同等强度的修正版，不能以allowlist或删除manifest项掩盖真实架构回退。

### Step 7 - ADR、全量质量门禁与四宿主关键journey（P0 final gate）

**目标**：把可观测性与module contract写回canonical docs，并用API/AI/Web/Desktop真实路径证明没有只在单测中成立。

**文件与变更**

- 新增`docs/architecture/adr/ADR-047-api-observability-pipeline.md`并更新ADR index：记录single observer、safe fields、bounded metrics、default-noop/opt-in OTel、trace/request ID语义、shutdown与failure policy。
- 更新ADR-025/031与`docs/standards/architecture.md`：shared module handle、registration context无DB、runtime-injected instance、PowerSync/Dashboard closure-bound factory、governance-first顺序。
- 更新ADR-033/035/042/043/045的Enforcement/relationship；不复制manifest细节，只链接canonical detector/tests。
- 新增或更新`docs/guides/development/observability.md`：本机读structured logs、scrape `/metrics`/`/metrics/json`、启用外部OTLP endpoint、验证trace propagation、关闭/回滚开关；明确敏感字段政策。
- 更新`.env.example`/compose注释、API runtime docs、test inventory/generated manifest；完成后回填本计划各gate结果并移入archive，更新active README。

**最终自动化门禁**

```bash
# Direct Vitest only; never pnpm nx run <package>:test
node node_modules/vitest/vitest.mjs run --config packages/utils/vitest.config.ts
node node_modules/vitest/vitest.mjs run --config packages/contracts/vitest.config.ts
node node_modules/vitest/vitest.mjs run --config packages/governance/vitest.config.ts
node node_modules/vitest/vitest.mjs run --config packages/ai/vitest.config.ts
node node_modules/vitest/vitest.mjs run --config apps/api/vitest.config.ts
node node_modules/vitest/vitest.mjs run --config apps/api/vitest.smoke.config.ts
node node_modules/vitest/vitest.mjs run --config apps/desktop/vitest.config.ts \
  apps/desktop/src/main/runtime \
  apps/desktop/src/main/modules/ai \
  apps/desktop/src/main/profile/profile-access-context.spec.ts
node node_modules/vitest/vitest.mjs run --config tools/governance/vitest.config.ts

# Python AI focused journey
cd apps/ai-service
uv run pytest tests/test_health.py tests/test_chat.py tests/test_agent_runtime_routes.py -q
cd ../..

# Full repository typecheck/lint + build/inventory/docs/governance
pnpm nx run-many -t typecheck --all --parallel=5 --skip-nx-cache
pnpm nx run-many -t lint --all --parallel=5 --skip-nx-cache
pnpm nx run api:build --skip-nx-cache
pnpm nx run web:build --skip-nx-cache
pnpm nx run desktop:build --skip-nx-cache
pnpm test:inventory
pnpm test:inventory:check
pnpm nx run memoflow:governance-check --skip-nx-cache
pnpm nx run memoflow:docs-check --skip-nx-cache
pnpm exec prettier --check <all changed source/test/config/doc files>
```

**关键journey矩阵**

| 宿主/边界 | 必须证明                                                                                                                                                    | 入口                                                            |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| API       | health/JSON/auth error/404/SSE都回同一request ID；terminal log/metric/span各一次；`/metrics` labels有界且Prometheus shape合法                               | direct API smoke + local-docker `curl`/Playwright evidence      |
| AI        | API request ID到Python；OTel enabled fixture额外同一traceparent；proposal停在approval，只有显式confirm后executor产生receipt；stale/not-approved fail closed | AI direct Vitest journeys + focused Python pytest + Web Phase E |
| Web       | Goal -> Task contribution写链与审批工作台无回归；浏览器能读取`X-Request-Id`；无console/page errors                                                          | local-docker Phase A + Phase E                                  |
| Desktop   | guest offline/profile reopen、cloud adoption不回归；PowerSync Goal read Port、Desktop AI read Ports仍由Desktop composer注入                                 | Desktop focused Vitest + Electron auth e2e                      |

```bash
# Prod-like API/AI/Web journeys (runner also records image/runtime evidence)
pnpm runtime:preflight:local-docker
pnpm docker:local:up
node apps/web/e2e/helpers/run-local-docker-playwright.mjs \
  e2e/local-docker/core-product-phase-a.spec.ts \
  e2e/local-docker/core-product-phase-e.spec.ts

# Desktop key journey; build/native ABI are explicit, Playwright is direct
pnpm nx run desktop:build --skip-nx-cache
pnpm nx run desktop:native-rebuild --skip-nx-cache
pnpm --dir apps/desktop exec playwright test \
  e2e/authentication/desktop-auth-flow.spec.ts \
  --config playwright.config.ts

pnpm docker:local:down
```

- local-docker启动后额外验证：`/metrics`可scrape、两个不同Goal/Task实体ID不产生不同route labels、日志中可按同一request ID关联API与Python；OTel runtime journey只在有测试OTLP sink时启用，不依赖个人collector。
- **Step gate / 完成条件**：所有direct suites、full typecheck/lint、三build、inventory、governance/docs、Web local-docker A/E和Desktop e2e通过；ADR/docs与实际env/metric names一致；OTel disabled与enabled证据都存在。
- **回滚单位**：docs最后回滚；若journey失败，回到最早失败Step处理，禁止只改ADR/测试期待。local-docker/OTel临时资源必须在失败路径也关闭。

## 5. 验证矩阵与共同门禁

### 5.1 必测矩阵

| 层                 | 必测行为                                                                                  | 主要入口                                                    | Gate     |
| ------------------ | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------- |
| Logger bootstrap   | provider-before-import、single transport family、child metadata/error                     | utils logger + API logger bootstrap specs                   | P0       |
| Request observer   | header-before-next、finish/abort exactly once、SSE、observer isolation                    | request context/observation specs + API smoke               | P0       |
| Metrics            | stable route、bounded labels、counter/histogram、weighted JSON、operation/process metrics | metrics store/controller + smoke                            | P0       |
| Trace              | noop default、W3C parent、span status/end、AI propagation、shutdown                       | OTel in-memory exporter + internal client + smoke           | P1       |
| Module contract    | shared handle、no context DB、required instance、lifecycle rollback/dispose               | contracts + governance pilot + all module lifecycle specs   | P0       |
| Cross-module reads | 3 Ports x API/Desktop adapter/injection，无consumer concrete import                       | governance AST audit + composer tests                       | P0       |
| AI approval        | no mutation capability、lifecycle-only approve、confirm gate、receipt/idempotency         | AST audit + ProposalKernel/AssistantFacade/host journey     | P0       |
| Reliable receipt   | unique schemas、canonical return type、output parse、8-state invariants                   | AST audit + contracts/adapter tests                         | P0       |
| JSDoc              | public export coverage、English-first/中文-second、tags                                   | targeted audit + mutation fixtures                          | P0       |
| Product journeys   | API/AI/Web/Desktop真实启动/交互                                                           | smoke, pytest, local-docker Playwright, Electron Playwright | P0 final |

### 5.2 每个Step共同门禁

- Diff只包含该Step列出的生产/测试/config/docs/governance文件；不夹带业务功能、数据库schema migration、UI redesign或无关formatting。
- 所有Vitest通过`node node_modules/vitest/vitest.mjs run --config ...`直接执行；禁止`pnpm nx run <package>:test`、`pnpm test`或`run-many -t test`。
- Nx只用于typecheck/lint/build/governance/docs/e2e/native preparation等非Vitest target。
- 每个Step至少运行受影响project的typecheck/lint；共享contracts/API runtime影响在Step 7跑全仓。
- 新增/修改public surface满足§3.6；测试fixture不得用`as unknown as`掩盖本Step要验证的contract（与目标无关的existing test double可保留并登记）。
- Surface test必须包含positive、negative/mutation和manifest completeness，不能只`toContain`一段实现文字。
- 不在metrics/span/log中记录敏感字段；相关测试以deny inventory断言，而不是人工review一句话带过。
- 每Step先记录red原因，再完成green；完成条件和回滚单位均满足后才进入下一Step。

## 6. 风险与回滚策略

| 风险                 | 触发/影响                                                           | 防护                                                                  | 回滚                                                   |
| -------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------ |
| ESM entry顺序错误    | logger仍在初始化前创建，API出现两种格式/transport                   | fake provider import-order test + runtime startup log inventory       | 回滚Step 1整体，恢复单main；不得双初始化               |
| Request重复结算      | finish+close或新旧middleware同时记录，metrics/log翻倍               | shared terminal guard、mutation test、源码inventory                   | 回滚Step 2整体到旧middleware；禁止双轨                 |
| Metrics高基数        | raw entity path/requestId/identity进入labels导致内存/Prometheus爆炸 | route-template-only resolver、fixed fallback、series-count smoke      | 暂时把未知route聚合到`__unmatched__`；不放开raw path   |
| Prometheus兼容破坏   | scraper解析失败或operation metrics丢失                              | exact exposition tests、local scrape、保留metric names                | 回滚controller+store同一unit；不只回滚一半             |
| SSE lifecycle        | span/metric过早结束或disconnect不结束                               | real SSE normal/abort smoke，不包裹write/end/body                     | disable trace adapter；observer修正后再启用            |
| OTel配置/出口故障    | startup失败、出口阻塞请求、关机丢span                               | default off、config fail-fast、batch exporter、shutdown timeout       | 立即env关闭；保留noop和metrics                         |
| Trace/request ID混用 | retry/approval/operation幂等被trace影响                             | ADR-045 tests、独立字段、HMAC/AI ID tests                             | 回滚trace propagation，不回滚request context           |
| Module lifecycle改变 | route半挂载、listener重复、dispose漏掉                              | governance-first、per-module state-machine tests、Dashboard stop test | 逆序逐slice回滚；不靠cast恢复DB context                |
| Generic variance漏洞 | narrower/wider register签名结构赋值意外通过                         | compile-time positive/negative fixtures + AST audit                   | 修shared generic后再推广，不在feature加local duplicate |
| Audit误报/漏报       | rename后coverage静默消失或regex误判                                 | TS AST、manifest completeness、mutation fixtures                      | 修detector；不能删manifest/加宽allowlist               |
| 全量journey环境串线  | local-docker/e2e占错端口或旧镜像产生假证据                          | runtime preflight、OCI revision evidence、finally down                | 清理正确lane后重跑，不接受旧容器结果                   |

### 6.1 回滚顺序

1. 生产trace/export异常：先设`OTEL_TRACING_ENABLED=0`，确认noop路径恢复；只回滚Step 3，不动logger/metrics。
2. metrics/log double count或response regression：整体回滚Step 2 observer/store/controller/global wiring；Step 1 logger可保留。
3. logger provider/startup regression：整体回滚Step 1 entry/server拆分；不要在module中散落临时`initializeLogger()`。
4. module lifecycle regression：从Step 5最后一个batch开始按逆序回滚；若需要恢复`context.db`，连同Step 4 shared contract一起回滚，不使用intersection cast。
5. architecture audit误报：回滚/修正Step 6 detector本身，保留已验证runtime代码；真实违规不得用allowlist隐藏。
6. 最终docs/journey失败：先修最早失败的production Step，再更新ADR证据；文档永远最后归档。

## 7. 完成定义

- [ ] Steps 1-7分别形成可审查、可回滚的diff并通过各自direct gates；governance pilot先于Goal/Task与batch rollout。
- [ ] API logger provider在server graph导入前初始化；API runtime没有第二套logger transport或非preflight `console.*`。
- [ ] 一个request observer是terminal log/metrics/span的唯一owner；所有response类型exactly once，raw path/sensitive label为零。
- [ ] `/metrics`是有界、合法的Prometheus counter/histogram；`/metrics/json`保持Result envelope；operation/process metrics保留。
- [ ] OTel默认disabled且无需collector；enabled测试证明W3C trace贯穿API server span与AI internal request，shutdown可flush。
- [ ] `IApiModuleContext`不含DB；所有feature Def显式extends shared handle并required instance；PowerSync/Dashboard也在register前绑定依赖。
- [ ] Cross-module read Ports、AI approval、reliable receipt三组AST surface audits与mutation fixtures接入governance check。
- [ ] 本阶段所有public surfaces通过English-first/中文-second JSDoc audit，无长期baseline豁免。
- [ ] Direct Vitest、focused Python pytest、全仓typecheck/lint、API/Web/Desktop builds、inventory、governance/docs全部通过。
- [ ] API/AI/Web local-docker Phase A/E与Desktop Electron关键journey通过，运行证据对应当前revision。
- [ ] ADR-047及既有ADR/standards/guide回收完成；计划回填真实命令结果后移入archive。

## 8. 实施结果回填（2026-08-16）

> RefArch Phase 6 已按 Step 1→7 顺序完成并全部通过直接门禁；未 commit，工作树保留变更。

### Step 1 — Logger preflight 与单一 provider（PASS）

- `apps/api/src/main.ts` 收窄为 preflight entry，`initializeLogger()` 后 dynamic import `server.ts`；tsup 保持 `dist/main.js` 入口并单独输出 `dist/server.js`，动态 import 为真实运行时边界。
- `logger.config.ts` 幂等 + 冲突 fail-fast，新增 `LoggerBootstrapOptions`（level/enableInProduction/provider 测试 seam）与 `@internal` reset helper。
- `winston-logger.ts`：`child()` 复用父级 transport 实例（不再为每个 child 建 daily-rotate）；生产 console 输出机器可解析 JSON；error 结构化 shape 一致。
- `swagger.ts` console.log → shared logger。
- 门禁：`packages/utils/src/logger`（7 tests）、`logger-bootstrap.spec.ts` + `bootstrap.spec.ts`（7 tests）、utils/api typecheck、utils/api lint、api build 全绿。

### Step 2 — 单一 request observer 与有界 metrics（PASS）

- 新增 observability `http-request-observation.ts`（`HttpRequestObservation`/`HttpRequestObserver`/route resolver/logger observer/fan-out）与 `http-request-metrics.ts`（固定 bucket、有界 label key、ring buffer）。
- RequestContext middleware 以 finish/close exactly-once guard 驱动 observer；observer/span 异常隔离；删除 `performance.middleware.ts` 与 `X-Response-Time`。
- `metrics.controller.ts` 输出真实 cumulative histogram（`_bucket{le}`/`_sum`/`_count`）+ counter + process/operation metrics；JSON summary 按 request count 加权。
- 门禁：request-context/observability/metrics controller/envelope/error specs（41 tests）、smoke（12 tests）、api typecheck/lint 全绿；ADR-045 更新。

### Step 3 — Trace Port 与可选 OpenTelemetry（PASS）

- 新增 `http-request-trace.ts` Port、`noop-http-request-trace.ts`、`opentelemetry-http-request-trace.ts`、`trace-runtime.ts`（`OTEL_TRACING_ENABLED` 默认 0 → noop；=1 → NodeSDK+OTLP，env schema 组合校验 fail-fast）。
- RequestContext 集成 span：启用时 SERVER span context 贯穿 `next()`，`traceId` 取 span、`requestId` 独立；CORS 放行 `traceparent/tracestate`。
- `AIServiceInternalClient` 用 OTel propagation 注入 W3C headers（HMAC canonical 不变）；`apps/api` 与 `packages/ai` 增加 direct OTel deps；compose/.env.example 增加默认关闭的 OTel 配置。
- 门禁：env.schema/observability/request-context specs（49 tests）、ai internal client spec（9 tests）、smoke（12 tests）、api/ai typecheck/lint、api build 全绿；ADR-045 更新。
- 注：本环境 `pnpm add` 触碰 `XDG_DATA_HOME` 默认 store，会话内以 `unset XDG_DATA_HOME` 恢复与仓库 node_modules 一致的 store。

### Step 4 — Governance-first shared module handle contract（PASS）

- `packages/contracts/src/shared/server-module-context.ts` 新增 `ServerTransportModuleContext`（无 db）与 `ServerModuleHandle<TContext>`；`ServerModuleContext<DbClient>` 保留为 legacy db-bearing host-composition 类型。
- `IApiModuleContext extends ServerTransportModuleContext`（无 db），`IApiModule extends ServerModuleHandle<IApiModuleContext>`；`DatabaseClient` 仅 bootstrap 私有。
- `GovernanceApiModuleContext` 复用 canonical transport context，`GovernanceApiModuleDef extends ServerModuleHandle<...>`；新增 compile-time 正/负向 fixtures（`context.db` 不可访问、缺 `instance` 不可构造、register 参数无 db、variance 负向）。
- README/ADR-025/031 移除"未迁移 sibling 可读 context.db"fallback。
- 门禁：contracts shared（15）、governance lifecycle+composition surface（16）、api bootstrap+compose-governance（7）、contracts/governance/api typecheck+lint 全绿。

### Step 5 — 全模块 contract rollout 与 app-local residual 关闭（PASS）

- 11 个 feature `api/module.ts` 全部：`*ApiModuleContext = ServerTransportModuleContext`、`*ApiModuleDef extends ServerModuleHandle<*ApiModuleContext>`、options required instance；Repository 保留 `getApplicationPort` 附加成员。
- PowerSync → `composePowerSyncApiModule({ db, config? })`；Dashboard → `composeDashboardApiModule({ dashboardReadPort, activityLedgerRuntime })`（`PrismaDashboardReadPort` adapter + ledger runtime 由 host 组装，destroy 停止 listener）；`server.ts` 相应接线。
- 新增 `api-module.surface.spec.ts` 扫描 11+2 模块：无 `context.db`/Prisma/repository 构造，Def 绑定 shared handle；新增 dashboard module lifecycle spec。
- 门禁：11 包 module-lifecycle specs、api bootstrap+powersync+dashboard+runtime（130 tests）、13 项目 typecheck+lint、api build、desktop typecheck 全绿；architecture.md 更新。

### Step 6 — 三组架构表面 locks + 双语 JSDoc audit（PASS）

- 新增 `tools/governance/architecture-surface-audit.mjs` + `architecture-surface-manifest.json`（TypeScript AST，manifest 完整性 fail-closed）与 `lib/architecture-surface.mjs`。
- 三条 read-port 规则（`READ_PORT_GOAL_TASK_BINDING`/`READ_PORT_AI_ANALYTICS`/`READ_PORT_AI_KNOWLEDGE_SOURCE`）、`AI_APPROVAL_LIFECYCLE_ONLY`、`RELIABLE_RECEIPT_CANONICAL`；`__tests__/architecture-surface.test.mjs` 16 tests（含 mutation fixtures：删 implements、删文件、consumer deep-import、approve 接 executor、turn engine 提供 mutation、移除 validator、local duplicate 均变红）。
- 新增 `public-surface-jsdoc-audit.mjs`（覆盖 shared contract、observability seam、PowerSync/Dashboard、11 feature api module、governance helpers）与 mutation fixtures（删中文/删 @param/@returns/@typeParam/删 JSDoc 均变红）。
- 两 audit 接入 `project.json#governance-check` command + inputs；ADR-033/035/042/043 Enforcement 更新。
- 门禁：governance tools（78）、contracts reliable+agent-host（78）、ai approval（61）、goal/reminder/notification reliable（4/27/8）、governance-check、docs-check 全绿。

### Step 7 — ADR、全量质量门禁与四宿主关键 journey（PASS*）

- 新增 `ADR-047-api-observability-pipeline.md` + ADR index；新增 `docs/guides/development/observability.md`；`.env.example`/compose 增加默认关闭的 OTel 配置。
- 直接 Vitest：utils（136）、contracts（551）、governance（181）、ai（856）、api（290）、api smoke（73）、desktop main（198 + 聚焦 50）、tools/governance（78）全绿。
- Python：`uv run pytest tests/test_health.py tests/test_chat.py tests/test_agent_runtime_routes.py -q` → 43 passed。
- 全仓 typecheck（36 projects）、lint（40 projects）、api/web/desktop build、test:inventory + check、governance-check、docs-check、prettier --check 全绿。
- local-docker：`runtime:preflight:local-docker` OK；`docker:local:up` 后 `core-product-phase-a` + `core-product-phase-e` Playwright → 4 passed（evidence 已写入 reports/local-deploy-validation）；`/metrics` 可 scrape 且 label 有界（route template + `__unmatched__`）。
- Desktop Electron e2e：`desktop-auth-flow.spec.ts` 在 xvfb 下 1 passed / 1 failed；failed 为 renderer `[app-vue] Missing injection: AuthService`（非本阶段改动面，本环境无 DISPLAY 时的预存在问题），记为环境偏差。

### 偏差记录

1. `apps/api/src/runtime/compose-*.surface.spec.ts` 与 `bootstrap-module-names.surface.spec.ts` 断言对象从 `main.ts` 改为 `server.ts`（Step 1 entry/server 拆分的直接后果）。
2. `XDG_DATA_HOME=/tmp/opencode-obs1` 使 pnpm 默认 store 与仓库不一致；会话内 `unset XDG_DATA_HOME` 后 nx 触发 install 正常。
3. `pnpm-workspace.yaml` 的 `protobufjs` allowBuilds 占位符改为显式 `false`（OTel 传递依赖引入，nx strict-dep-builds 下否则失败）。
4. Desktop Electron e2e 一项失败为 renderer AuthService DI（环境/预存在），其余 Desktop 证据（typecheck/build/native-rebuild/main vitest/composer 注入 audit）全绿。
5. 无 X server 环境通过 `apt install xvfb` 提供虚拟显示后运行 Electron e2e。
