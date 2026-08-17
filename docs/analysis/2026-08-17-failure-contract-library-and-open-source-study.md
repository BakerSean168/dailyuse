---
tags:
  - analysis
  - architecture
  - contracts
  - error-handling
  - libraries
  - open-source
description: MemoFlow failure/outcome 重构前的 TypeScript 库、协议标准与开源实现研究及设计修订
created: 2026-08-17T00:00:00+09:00
updated: 2026-08-17T00:00:00+09:00
---

# Failure Contract Library and Open-Source Study / 失败契约库与开源实现研究

## 1. 文档定位

本文是 ADR-049 与全应用架构重构计划的**前置设计验证材料**。

第一版审计已经确认 MemoFlow 存在 provider error 泄漏、message 作为隐式协议、DomainError 混合
HTTP/diagnostic、正常流程状态被建模成 error、contracts 绝对中心化等系统性问题。但在修改生产代码前，
还需要回答三个问题：

1. TypeScript 生态中是否已有值得直接复用的 Result、pattern matching、state machine、effect/runtime
   或 error contract 库；
2. 成熟开源项目和协议标准如何划分 code、message、details、retry、recovery、provider cause 与
   transport status；
3. MemoFlow 应该采用、借鉴、延后还是明确拒绝哪些方案，避免重复造轮子，也避免为“统一错误”
   引入一个新的全局框架。

本文只更新设计与计划，不引入 npm 依赖，不修改生产代码，不宣称 ADR-049 已被实施。

## 2. 当前 MemoFlow 技术基线

### 2.1 已有能力

MemoFlow 已经拥有：

- 自有 `Result<T>`、`HttpResponse<T>`、`IpcResult<T>`；
- Zod 4 schema 与 Zod-to-OpenAPI；
- HTTP/IPC adapter-owned validation 与 parity fixtures；
- Vue 3、TanStack Vue Query；
- TypeScript strict mode；
- host runtime composer、feature package、consumer-owned Port 的部分实践；
- reliable operation receipt、lease、retry/dead-letter、timeline/replay；
- OpenTelemetry opt-in 与结构化日志；
- AST-based governance 和 architecture surface mutation tests。

因此，候选库必须证明它解决的是 MemoFlow **尚未解决的问题**，而不是重新实现已有基础设施。

### 2.2 当前依赖事实

仓库当前未安装：

- `ts-pattern`；
- `neverthrow`；
- `effect`；
- `xstate`；
- `@xstate/vue`；
- `fp-ts`；
- `true-myth`；
- `oxide.ts`。

已经广泛安装：

- `zod@4.4.x`；
- `@tanstack/vue-query@5.101.x`（app-vue）；
- TypeScript 6.x；
- RxJS 7.x（但不是当前 operation Result 的所有者）。

这意味着任何新库都会新增认知、依赖、构建和治理成本，不能以“社区流行”作为采用理由。

## 3. 评估标准

所有候选方案按以下标准评估：

| 维度            | 问题                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------- |
| 语义适配        | 是否支持 Domain Fault、Outcome、Public Failure、Provider ACL 的分层，而不是只提供 Error class？ |
| 增量采用        | 能否在一个 operation 或一个 feature 中试点，而不要求全仓重写？                                  |
| 现有契约保护    | 是否能保持当前 Result/HTTP/IPC wire envelope？                                                  |
| 类型穷尽        | 新增 union member/code 后，遗漏 mapping 是否能编译失败或测试失败？                              |
| 运行时安全      | 是否支持 Zod/schema、JSON-safe payload、unknown/provider input validation？                     |
| 状态机适配      | 是否适合 Auth、AI HITL、Cloud Connection 等复杂流程，而不是把简单 CRUD 复杂化？                 |
| 重试正确性      | 是否区分 failure hint、operation idempotency、transaction/workflow-level retry？                |
| 可观测性        | 是否能区分 expected outcome 与 true failure，避免重复记录 exception？                           |
| 包体与编译成本  | 对 Web bundle、TypeScript 检查和 CI 时间有什么影响？                                            |
| 锁定风险        | 是否会把 MemoFlow 的 architecture semantics 绑定到库的 runtime/model？                          |
| AI/Agent 可读性 | 类型、registry、mapper 与状态图是否容易被人和 Agent 正确修改？                                  |
| 维护成熟度      | 官方文档、许可证、版本演进、生态和长期维护是否足够可信？                                        |

## 4. 决策摘要

### 4.1 总结表

| 候选                                           | 决策                                     | 用途                                                                | 不用于                                            |
| ---------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------- |
| TypeScript discriminated union + `assertNever` | **采用，基础能力**                       | Domain Fault、Outcome、Failure union、mapper 穷尽                   | 不单独承担 runtime validation                     |
| Zod                                            | **继续采用，唯一 wire runtime schema**   | provider input、public failure details、HTTP/IPC/durable validation | 不放进纯 Domain invariant 内部                    |
| `ts-pattern`                                   | **延期，本轮不引入依赖**                 | 未来 bounded mapper benchmark 候选                                  | 不替代默认 `switch + assertNever`                 |
| `neverthrow`                                   | **不替换核心；借鉴 API 与 lint 思想**    | `mapErr`/`andThen`/Result consumption 设计参考                      | 不重建现有 Result/envelope                        |
| `eslint-plugin-neverthrow`                     | **不直接采用**                           | “Result 必须消费”理念参考                                           | 不在未采用 neverthrow 时绑定插件                  |
| XState                                         | **延期；Auth 不采用**                    | 未来 nested/parallel/invoked actor workflow 的独立 ADR 候选         | 不替代 typed reducer、Pinia 或 durable state      |
| Effect                                         | **本轮不采用；未来隔离实验**             | 未来可能用于独立 AI/worker runtime 的 structured concurrency        | 不作为全仓 failure foundation                     |
| RFC 9457                                       | **语义参考，暂不替换 envelope**          | HTTP problem projection、type/detail/security 设计                  | 不破坏当前 HTTP/IPC parity                        |
| Google AIP-193                                 | **采用设计原则**                         | stable reason + typed metadata；message 不可解析                    | 不采用 server-side localized message 作为 UI 真值 |
| Google AIP-194                                 | **采用重试原则**                         | retry 由 code + idempotency + operation policy 共同决定             | 不允许 failure 自己单方面决定自动重试             |
| Connect errors                                 | **采用抽象原则，暂不换 transport**       | 小型公共 category、typed details、protocol-neutral code             | 不迁移到 Connect/gRPC 作为本轮目标                |
| Temporal Retry Policy                          | **借鉴，不引入平台**                     | activity/workflow retry 分层、declarative policy                    | 不替换现有 reliable messaging/runtime             |
| Lark CLI error contract                        | **主要治理参考**                         | closed category、stable subtype、cause 不出 wire、CI lint           | 不照搬 CLI exit code 模型                         |
| Ardan Labs `errs`                              | **参考 public/internal separation**      | safe client message、internal-only diagnostic                       | 不照搬 HTTP status 进入 Domain Error              |
| Memos                                          | **参考认证安全与 single-flight refresh** | code-driven auth、账号枚举保护、一次 retry                          | 不复制过粗的公共 taxonomy                         |
| Vendure ErrorResult                            | **参考 expected result union**           | 正常但非成功的 operation branch 进入 schema                         | 不引入 GraphQL                                    |

### 4.2 推荐技术组合

本轮目标组合是：

```text
MemoFlow-owned Result<T, E>
  + TypeScript discriminated unions
  + Zod schemas at boundaries
  + optional ts-pattern at exhaustive mapping hotspots
  + optional XState for explicitly approved complex workflows
  + AST/governance registry checks
```

不是：

```text
Effect everywhere
neverthrow everywhere
XState everywhere
one global Error framework
```

## 5. TypeScript 库评估

## 5.1 TypeScript discriminated unions + `assertNever`

### 能解决什么

TypeScript 原生 discriminated union 足以表达：

```ts
type SignInOutcome =
  | { kind: 'authenticated'; session: SessionSnapshot }
  | { kind: 'email_verification_required'; email: string };

type AuthFailure =
  | { code: 'AUTH_INVALID_CREDENTIALS'; category: 'unauthenticated' }
  | { code: 'AUTH_PROVIDER_UNAVAILABLE'; category: 'unavailable' };
```

配合：

```ts
function assertNever(value: never, message?: string): never {
  throw new Error(message ?? `Unexpected value: ${String(value)}`);
}
```

可以在 `switch` 中完成编译期穷尽检查。

### 优势

- 零依赖；
- 不改变运行时；
- 与现有 Result、Zod、HTTP/IPC 完全兼容；
- Agent 和开发者容易理解；
- 可以逐 operation 迁移。

### 局限

- 嵌套 state/event、双 union 匹配会出现大量嵌套 `switch`；
- `assertNever` 容易忘记写；
- 不能直接验证网络/provider 输入。

### 决策

作为**默认基础**。任何库都只能增强该模型，不能取代 MemoFlow-owned union 和 contract ownership。

## 5.2 Zod

### 当前价值

MemoFlow 已经使用 Zod 4，且 ADR-048 已将 runtime validation 和 OpenAPI schema 绑定到相同对象。
因此不应再引入 Effect Schema、ArkType 或第二套 wire schema 作为本轮 failure contract 基础。

Zod 应负责：

- provider response 的最小安全解析；
- Public Failure params/details；
- HTTP/IPC/SSE/durable payload；
- registry 的 machine-readable validation；
- versioned compatibility parsing。

Zod 不应负责：

- 聚合内部所有不变量；
- Domain Fault 控制流；
- UI state machine；
- retry policy 执行。

### 决策

继续作为**唯一 runtime boundary schema**。这可以减少依赖和 schema 双轨。

## 5.3 `ts-pattern`

官方项目定位是 TypeScript 的 exhaustive pattern matching，支持 discriminated union、嵌套对象、tuple、
state/event reducer 与 `.exhaustive()`。它适合 MemoFlow 的两个高价值热点：

1. Domain Fault / Provider Failure → Outcome/Public Failure；
2. complex operation state × event → next state。

示例：

```ts
return match<[AuthState, AuthEvent]>([state, event])
  .with([{ status: 'submitting' }, { type: 'verified' }], ([, e]) => ({
    status: 'authenticated',
    session: e.session,
  }))
  .with([{ status: 'submitting' }, { type: 'verification_required' }], ([, e]) => ({
    status: 'awaiting_verification',
    email: e.email,
  }))
  .otherwise(() => state);
```

### 优点

- `.exhaustive()` 可将新增 union member 变成编译错误；
- 对嵌套 union 和 state/event pair 比手写嵌套 switch 更清晰；
- 运行时包体较小；
- 只需在热点使用，可增量采用。

### 风险

- 官方明确说明 exhaustive type checking 会增加 TypeScript 编译工作；
- 大型 union 与深层模式可能让类型错误难读；
- 如果到处使用，会形成 DSL 依赖并降低普通 TypeScript 可读性；
- `.otherwise()` 会吞掉新增分支，不能无条件使用。

### Spike 结果

ACR-R02 以同一十成员 provider union 比较 native `switch + assertNever` 与 `ts-pattern`：两者都能在
新增 union member 后编译失败；`ts-pattern` 减少了行数，但 isolated median typecheck 为 0.9409 秒，
native switch 为 0.6515 秒。诊断质量均可接受，native 方案不增加依赖且更符合现有代码风格。

### 决策

**延期，本轮不引入依赖**。默认使用 native `switch + assertNever`。未来只有 bounded mapper 的独立
benchmark 证明显著可读性收益且 affected typecheck 成本可接受时，才允许另行提出。

官方来源：<https://github.com/gvergnaud/ts-pattern>

## 5.4 `neverthrow`

`neverthrow` 提供 `Result`、`ResultAsync`、`mapErr`、`andThen`、`fromPromise`、`fromThrowable` 和
`safeTry`。它还提供 lint 思路：Result 必须通过 `match`、`unwrapOr` 或 unsafe unwrap 被消费。

### 与 MemoFlow 的重叠

MemoFlow 已经拥有：

- 自有 `Result<T>`；
- HTTP/IPC envelope；
- client adapters；
- Result-to-transport converters；
- reliable receipt；
- 大量 consumer code。

直接换成 neverthrow 会产生：

```text
Neverthrow Result
  -> MemoFlow Result
  -> HttpResponse/IpcResult
```

或者迫使整个 contracts、client 和 transport 重写。这是另一条长期双轨。

### 值得借鉴的部分

- `map` / `mapErr` / `andThen` 的组合器 API；
- Promise/throw boundary 必须显式 `fromPromise` / `fromThrowable`；
- Result 必须被消费的 lint/gate；
- async pipeline 不在中间重新抛 generic Error。

### 可能的 MemoFlow 实现

在自有 Result 上增加少量函数式 helper：

```ts
mapResult;
mapResultError;
andThenResult;
fromPromiseResult;
fromThrowableResult;
matchResult;
```

并用自有 governance 检查：

- 未消费的 Result；
- Result → generic Error rethrow；
- unchecked `.data` / `.error`；
- operation boundary 未提供 failure generic。

### 决策

**不替换核心 Result**。借鉴 API 与治理，micro-spike 只验证其 ergonomics，不把它加入生产依赖。

官方来源：<https://github.com/supermacro/neverthrow>

## 5.5 Effect

Effect 提供完整 runtime：

```text
Effect<Success, Error, Requirements>
```

以及 typed errors、dependency injection、structured concurrency、scheduling/retry、tracing、metrics、
schema 和资源管理。

### 优点

- error、dependency、concurrency 在类型中显式；
- structured concurrency 和 interruption 对 AI/worker 有价值；
- retry/backoff、resource scope、observability 一体化；
- 可以渐进地从 Promise 包装进入 Effect。

### 与 MemoFlow 的高重叠

MemoFlow 已经有：

- Result；
- DI/host composer；
- Zod schema；
- reliable messaging、lease、retry/dead-letter；
- OpenTelemetry；
- RxJS；
- TanStack Query；
- AI Agent runtime、checkpoint、approval、SSE。

引入 Effect 作为底座会同时改变：

- use case signature；
- dependency injection；
- retry；
- resource lifecycle；
- observability；
- async mental model；
- testing；
- AI/Agent-generated code conventions。

这已经不是错误契约重构，而是 runtime/platform 迁移。

### 版本与迁移风险

Effect 官方正在推进下一代版本演进。即使当前稳定版本可用于生产，本轮也不应在 MemoFlow 大重构
中同时承担 Effect runtime 迁移风险。

### 未来可能的试点

若后续 AI worker 或独立服务出现以下问题，可以另立实验：

- orphan async task；
- cancellation/resource scope 难以保证；
- provider fan-out 与限流复杂；
- retry/timeout/parallelism 组合代码重复；
- 单独 deployable service，不要求 Web/Desktop 全仓迁移。

实验必须通过普通 Promise/Port 暴露边界，不能让 Effect type 穿透全部 feature contracts。

### 决策

**本轮不采用**。未来仅允许隔离、可撤销的 AI/worker spike。

官方来源：<https://www.effect.website/>

## 5.6 XState

XState 使用 state machine、statechart 和 actor model 管理复杂状态和异步 actor 生命周期。
官方支持 Vue，并可检查 actor 生命周期、事件、snapshot 和 transition microstep。

### 真正适合的场景

- Auth：password / GitHub / device code / email verification / reset / retry / cancel；
- Desktop Cloud Connection：guest/profile/authorization/adoption/reauth；
- AI HITL：streaming → waiting approval → approved/revised/rejected → executing → receipt；
- 长生命周期导入/导出或 account closure workflow。

这些流程具备：

- 明确的有限状态；
- 事件驱动；
- 并发/取消；
- invoked async work；
- 非法 transition；
- 需要可视化/检查。

### 不适合的场景

- 单个 CRUD mutation 的 idle/loading/success/failure；
- TanStack Query 已经拥有的 server-state；
- 简单表单；
- 仅为统一风格替代 Pinia；
- durable workflow 的数据库真值（XState actor 不是 durable ledger）。

### 复杂度准入规则

只有满足至少三项才允许提出 XState：

1. 5 个以上业务状态；
2. 事件在不同状态下有不同合法性；
3. 有取消、超时、retry 或并行子流程；
4. 有 invoked actor 生命周期；
5. 有 Web/Desktop host 差异但共享语义；
6. 状态图能够明显改善 review 和测试；
7. 状态需要持久化/恢复的明确定义。

### 与 durable state 的边界

XState 可以拥有内存中的 orchestration state，但：

- session、receipt、approval、operation status 的 durable fact 仍在 DB/ledger；
- actor snapshot 不能替代 reliable operation receipt；
- restart/replay 必须从 durable fact 重建；
- provider adapter 仍输出 MemoFlow outcome/failure。

### Spike 结果与决策

ACR-R02 中 typed reducer 与 XState machine 源码规模相近；XState isolated median typecheck 为 1.0628
秒，typed reducer 为 0.6530 秒。Auth 流程没有展示出足以抵消第二套 actor/snapshot lifecycle 的收益。

**延期；Auth 不采用**。Auth 使用 feature-owned typed reducer。未来只有 nested/parallel state、invoked
actors、durable resume 等更复杂 workflow 才可通过独立 ADR/spike 提出，且 actor snapshot 不得成为
durable fact。

官方来源：

- <https://stately.ai/docs/xstate>
- <https://stately.ai/docs/actors>
- <https://stately.ai/docs/invoke>
- <https://stately.ai/docs/inspection>

## 6. 协议与行业标准

## 6.1 RFC 9457 Problem Details

RFC 9457 定义 HTTP API 的 machine-readable problem details，核心成员包括：

```text
type
status
title
detail
instance
extension members
```

对 MemoFlow 最有价值的原则：

- HTTP status 无法表达全部业务原因；
- machine identity 应使用稳定 `type`，不是解析 `detail`；
- `detail` 是 human-readable，消费者不应解析；
- extension fields 应被明确设计；
- problem details 不是暴露 stack/provider internals 的调试工具；
- 如果应用已有合适格式，不要求强行替换。

### 是否采用

MemoFlow 当前有受保护的 Result/HttpResponse/IpcResult envelope，并要求 HTTP/IPC parity。
因此不应立即替换成 `application/problem+json`。

建议：

1. 将 ADR-049 的 Public Failure 设计与 RFC 9457 语义对齐；
2. 为未来外部 HTTP API v2 或 content negotiation 保留 problem-details projection；
3. 当前内部 Web/Desktop API 继续使用兼容 envelope；
4. `type` 可由 MemoFlow feature code 文档 URI 推导，但不作为本轮前置条件。

官方来源：<https://www.rfc-editor.org/rfc/rfc9457.html>

## 6.2 Google AIP-193 Errors

AIP-193 的关键设计：

- canonical status code 只提供大类；
- `ErrorInfo.reason + domain` 是 machine-readable identity；
  -动态信息放在 typed/defined metadata；
- message 是开发者可读文本；
- 任何 message 中的动态事实也必须出现在 metadata，避免客户端解析字符串；
- metadata key 一旦公开，需要稳定演进；
  -权限和资源存在性的检查顺序具有安全含义。

### 对 MemoFlow 的直接影响

1. `FailureCategory` 对应大类；
2. feature failure code 对应 reason；
3. feature/operation 对应 domain/namespace；
4. `params` 必须 per-code schema，不能是 arbitrary context；
5. raw message 不可成为行为协议；
6. 登录错误必须继续合并不存在账号和密码错误；
7. UI 本地化继续由客户端完成，才能支持 locale live retranslation。

官方来源：<https://google.aip.dev/193>

## 6.3 Google AIP-194 Automatic Retry

AIP-194 强调：

- 是否自动 retry 不仅由错误码决定；
- 重复执行不能造成意外状态变化；
- transaction 不应只 retry 单个请求，而应在更高层重跑完整 transaction；
- `ABORTED`/concurrency failure 往往需要上层 retry；
- unauthenticated、permission、not-found、already-exists 等一般不能盲目自动 retry。

这说明第一版 `RetryDirective` 设计混合了三个不同概念，必须拆开。

### 修订后的模型

```ts
export type FailureRetryHint =
  { kind: 'not_retryable' } | { kind: 'transient' } | { kind: 'after'; afterMs: number };

export interface OperationRetryPolicy {
  readonly mode: 'never' | 'safe_read' | 'idempotent_write' | 'transaction' | 'workflow_step';
  readonly maxAttempts: number;
  readonly backoff: BackoffPolicy;
  readonly requiresIdempotencyKey: boolean;
}

export type RecoveryAction =
  | { kind: 'none' }
  | { kind: 'reauthenticate' }
  | { kind: 'verify_email'; email: string }
  | { kind: 'correct_input'; fields?: readonly string[] }
  | { kind: 'resolve_conflict'; resource: string }
  | { kind: 'retry_manually' };
```

最终自动 retry 条件：

```text
failure hint
  ∩ operation retry policy
  ∩ idempotency/transaction state
  ∩ attempt budget/deadline
  ∩ cancellation state
```

Public Failure 可以携带服务端事实 `retryAfterMs`，但不能单方面命令客户端重试一个非幂等写入。

官方来源：<https://google.aip.dev/194>

## 6.4 Connect Error Model

Connect 在不同协议间提供同一套 error code API，并支持 typed error details；不同协议再投影成不同 HTTP
表示。Web client 暴露 code、message/rawMessage、metadata 和 schema-decoded details。

可借鉴：

- 小型全局 category/code set；
- typed details，不使用 arbitrary context；
- protocol-neutral application semantics；
- HTTP representation 是投影，不是核心错误本身；
- details 应限制为组织内小型、稳定的类型集合；
- retry/backoff 信息可以作为 typed detail。

不采用：

- 本轮不迁移 Connect/gRPC transport；
- 不把 16 个 Connect code 当成足够的 feature semantics；
- 不把 backend raw message 当作 UI 文案。

官方来源：

- <https://connectrpc.com/docs/web/errors/>
- <https://connectrpc.com/docs/go/errors/>

## 6.5 OpenTelemetry Error Recording

OpenTelemetry semantic conventions 对 MemoFlow 有两个关键约束：

1. 已经被 retry/handle 且 operation 最终正常完成的错误，不应计入该 operation 的 error span/metric；
2. 同一个 exception 不应在每层重复记录。

因此：

- `email_verification_required`、`waiting_approval`、`already_exists` 幂等 outcome 不应成为 error rate；
- provider exception 应在最终负责的 instrumentation boundary 记录一次；
- `error.type` 必须低基数、可预测，不能使用 raw message；
- public failure code 与 internal provider code 应使用不同 attribute；
- application 成功处理 provider/transient error 后，不应重复把整个 operation 标成失败。

建议 attributes：

```text
memoflow.feature
memoflow.operation
memoflow.outcome.kind
memoflow.failure.code
memoflow.failure.category
memoflow.provider
memoflow.provider.code
```

其中 provider attributes 仅内部 telemetry，不出 public wire。

官方来源：<https://opentelemetry.io/docs/specs/semconv/general/recording-errors/>

## 6.6 Temporal Retry Policy

Temporal 将 Workflow 和 Activity 区分：外部、易失败、非确定性的工作放在 Activity，Activity 有声明式 retry；
Workflow 本身默认不自动 retry，而是通过 durable history/replay 保持确定性。

MemoFlow 不需要为了错误契约引入 Temporal，但应借鉴：

- retry policy 属于 execution boundary，不属于领域错误对象；
- provider API、LLM、email、GitHub 等外部动作是 activity-like step；
- workflow-level retry 和 step-level retry 不相同；
- retry 必须结合幂等键；
- durable receipt 记录每个 attempt，而不是只保留最终 message；
- permanent/non-retryable failure 要显式分类。

MemoFlow 已有 lease、receipt、retry/dead-letter 和 replay，因此当前决策是借鉴模型，不引入平台。

官方来源：<https://docs.temporal.io/encyclopedia/retry-policies>

## 7. 开源项目实现研究

## 7.1 Lark CLI：最值得借鉴的治理模型

Lark CLI 的 error contract 明确区分：

- closed Category；
- declared stable Subtype；
- upstream numeric Code；
- informational Message；
- actionable Hint；
- non-serialized Cause；
- declared per-subtype extension fields；
- CI 检查未声明 subtype、缺失 required fields 和错误结构。

其核心不变量包括：

```text
Category + Subtype = wire-stable
Message = informational
Cause = internal only
Unknown fields = forward-compatible
Undeclared subtype = CI failure
```

### MemoFlow 应借鉴

1. feature code 和 category 的稳定性等级；
2. message、recovery hint、cause 分离；
3. provider code 独立字段，只在内部/特定 wire policy 中存在；
4. per-code typed extension fields；
5. mutation/lint 证明 contract gate 有效；
6. AI Agent 和脚本只根据 stable fields 分支；
7. compatibility/deprecation policy。

### MemoFlow 不照搬

- CLI exit code；
  -所有错误必须是 Go typed struct；
- CLI `hint` 直接出 wire 的统一做法。

MemoFlow 的 recovery 应由 application/presentation policy 结合 host/context 决定，不能把 UI action 固化为服务端字符串。

官方来源：<https://github.com/larksuite/cli/blob/main/errs/ERROR_CONTRACT.md>

## 7.2 Ardan Labs Service：public 与 internal 的分离

Ardan Labs `errs` package 提供稳定 ErrCode、HTTP status mapping、FieldErrors，并有 `InternalOnlyLog`：
内部错误 message 不发送给客户端。其 Error 中的函数名/文件名也不会进入 JSON。

### 值得借鉴

- safe public error 与 internal diagnostic 明确分开；
- code → transport status 在统一 adapter 中处理；
- unknown/internal 不泄漏真实 message；
- validation field errors 有明确结构。

### 不应照搬

Ardan 的 error package 是 web/service 边界模型，并不意味着 MemoFlow Domain Fault 应携带 HTTP status。
MemoFlow 的目标比该模板更进一步：Domain Fault 与 public web error 是两层不同类型。

官方来源：
<https://pkg.go.dev/github.com/ardanlabs/service/app/sdk/errs>

## 7.3 Memos：认证安全与客户端 code-driven behavior

Memos 的密码登录对以下两种内部原因返回同一公开错误：

```text
user not found
password mismatch
  -> same public invalid-credentials response
```

这可以防止登录账号枚举。

其 Web Connect interceptor：

- 只根据 `ConnectError.code === Code.Unauthenticated` 判断 refresh；
- retry attempt 只允许一次；
- 使用 token refresh manager 合并并发 refresh；
- refresh transport 不挂同一 auth interceptor，避免递归。

### MemoFlow 应借鉴

- 登录不存在与错误密码必须继续统一；
- code 驱动行为，不匹配 message；
- single-flight refresh；
- bounded retry；
- refresh path 和普通 auth interceptor 分离。

### 不应照搬

Memos 的 `InvalidArgument` 对 MemoFlow 来说过粗。MemoFlow 有 email verification、device authorization、
account closure、profile binding 等更复杂的 outcome，需要 feature-owned semantics。

官方来源：

- <https://github.com/usememos/memos/blob/main/server/router/api/v1/auth_service.go>
- <https://github.com/usememos/memos/blob/main/web/src/connect.ts>

## 7.4 Vendure：Expected Error 进入 schema union

Vendure 把可预期 mutation error 编码进 GraphQL schema union。客户端通过 `__typename` 区分正常实体结果
和具体 ErrorResult，而 unexpected error 仍走异常路径。

### MemoFlow 应借鉴

- expected alternate result 是 operation schema 的一部分；
  -客户端可以穷尽处理；
- operation-specific fields 随具体结果携带；
  -不把所有非成功结果都压成 generic exception。

这支持 ADR-049 的判断：

```text
email verification required
waiting approval
conflict resolution required
```

应优先成为 outcome union。

### 不应照搬

不需要为了该模型引入 GraphQL；TypeScript union + Zod + Result envelope 已足够。

官方来源：<https://docs.vendure.io/guides/developer-guide/error-handling/>

## 7.5 Connect：协议无关 code 与 typed details

Connect 最值得学的是：应用层 code/details 保持协议无关，而 gRPC、gRPC-Web、Connect protocol 各自采用不同
HTTP 表达。这验证了 MemoFlow 的目标：

```text
Public Failure / Outcome
  -> HTTP projection
  -> IPC projection
  -> SSE projection
```

而不是 Domain Error 自己携带 HTTP status。

## 8. 对 ADR-049 的关键修订

## 8.1 从六层模型扩展为“六层语义 + 三类政策”

六层语义继续成立：

1. Domain Fault；
2. Operation Outcome；
3. Public Failure；
4. Provider/Infrastructure Failure；
5. Transport Projection；
6. Diagnostic Failure。

但第一版把 retry/recovery 混进 Public Failure，需要拆成三个政策：

### Failure Retry Hint

表达服务端观察到的事实：

```ts
not_retryable;
transient;
after(delay);
```

它不是自动执行命令。

### Operation Retry Policy

由调用 operation/executor 拥有：

```text
read/write/transaction/workflow step
idempotent or not
idempotency key
attempt budget
deadline
backoff/jitter
```

### Recovery Action

由 application/presentation 拥有：

```text
reauthenticate
verify email
correct input
resolve conflict
retry manually
contact support
```

它不能使用可翻译 message 表达，也不应简单作为 provider hint 透传。

## 8.2 Public Failure 目标形状修订

```ts
export interface PublicFailure<
  Code extends string,
  Category extends FailureCategory,
  Details = never,
> {
  readonly code: Code;
  readonly category: Category;
  readonly details?: Details;
  readonly retryHint?: FailureRetryHint;
  readonly reference?: FailureReference;
}
```

### `details` 而不是 arbitrary `params`

每个 code 必须绑定具体 Zod schema：

```ts
const TaskVersionConflictDetailsSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  actualVersion: z.number().int().nonnegative(),
});
```

不允许公共：

```ts
Record<string, unknown>;
```

### `reference`

只允许安全追踪引用：

```ts
interface FailureReference {
  requestId?: string;
  traceId?: string;
}
```

具体是否出 wire 由 transport policy 决定。

## 8.3 Registry 应从同一对象推导，不维护多套清单

目标 registry：

```ts
export const AuthFailures = defineFailureRegistry({
  AUTH_INVALID_CREDENTIALS: {
    category: 'unauthenticated',
    details: z.never().optional(),
    retryHint: { kind: 'not_retryable' },
    i18nKey: 'auth.errors.invalidCredentials',
    http: { status: 401 },
  },
  AUTH_PROVIDER_UNAVAILABLE: {
    category: 'unavailable',
    details: z.object({ retryAfterMs: z.number().int().positive().optional() }),
    retryHint: { kind: 'transient' },
    i18nKey: 'auth.errors.providerUnavailable',
    http: { status: 503 },
  },
});
```

从该定义推导：

- code union；
- Zod failure schema；
- HTTP policy completeness；
- i18n key completeness；
- telemetry mapping；
- docs table；
- mutation/gate inventory。

不能再单独手写五份平行 map。

## 8.4 库使用必须服从 architecture ownership

即使采用 `ts-pattern` 或 XState：

- Domain Fault/Outcome/Public Failure 仍是 MemoFlow contract；
- library type 不进入 wire；
- provider mapping ownership 不变；
- durable fact 不由内存 actor 代替；
- transport parity 不变；
- library 可以替换，contract 不受影响。

## 9. 推荐 North-Star 设计

```text
Provider / DB / SDK
        |
        v
Infrastructure ACL + Zod parse
        |
        +---- DiagnosticIncident -> observer once
        |
        v
Feature Application Port
        |
        +---- DomainFault -> operation mapper
        |
        v
Result<OperationOutcome, PublicFailure>
        |
        +---- OperationRetryPolicy evaluates retryHint + idempotency + attempts
        |
        +---- RecoveryPolicy derives host/user next action
        |
        v
Contracts schema / registry
        |
   +----+-----------+-------------+
   |                |             |
 HTTP projection   IPC          SSE/durable
   |                |             |
   +----------------+-------------+
                    |
          presentation operation state
                    |
         code/outcome -> i18n + recovery UI
```

## 10. 已执行的设计 Spike

ACR-R02 已在 `/tmp/memoflow-failure-spikes` 完成，详细数据、源码规模、TypeScript timing、mutation
diagnostic、Zod 安全负向测试与 retry-policy fixture 见：

- [Failure Contract Spike Evidence and Design Gate](./2026-08-17-failure-contract-spike-evidence.md)。

实验使用与仓库一致的 TypeScript 6.0.3 和 Zod 4.4.3，并比较：

1. native `switch + assertNever`、`ts-pattern`、neverthrow mapper；
2. typed reducer 与 XState v5 Auth state model；
3. TypeScript + Zod 单源 registry 与 retry-policy intersection。

主要结果：

| 项目                                   | 结果                                          |
| -------------------------------------- | --------------------------------------------- |
| mapper fixture                         | 10/10 三版输出完全一致                        |
| native mapper median typecheck         | 0.6515 s                                      |
| `ts-pattern` median typecheck          | 0.9409 s                                      |
| neverthrow median typecheck            | 0.7036 s                                      |
| typed reducer median typecheck         | 0.6530 s                                      |
| XState median typecheck                | 1.0628 s                                      |
| exhaustiveness mutation                | native / ts-pattern / neverthrow 全部编译失败 |
| registry unknown code                  | fail closed                                   |
| strict details secret field            | fail closed                                   |
| retry without required idempotency key | denied                                        |

Spike 同时发现两个必须进入规范的安全约束：

- 不依赖 Zod 未导出的内部 union option 类型；registry builder 只依赖 Zod 公共 API；
- Zod object 默认剥离未知字段，public failure details 必须使用 strict schema，并有 token/provider-body
  negative tests。

## 11. ACR-R03 设计 Gate 结论

设计 Gate 已于 2026-08-17 通过。生产重构从 ACR-001 起解锁。

### 11.1 Adopt

1. MemoFlow-owned `Result<T, E>`；
2. TypeScript discriminated union；
3. native `switch + assertNever` 作为默认穷尽映射；
4. Zod 4 public API 与 strict details schema；
5. one-source feature failure registry；
6. provider anti-corruption layer；
7. expected outcome union；
8. public/diagnostic separation；
9. `FailureRetryHint`、`OperationRetryPolicy`、`RecoveryAction` 三分；
10. mutation-based governance。

### 11.2 Borrow

- neverthrow 的组合器与“Result 必须消费”思想，但不引入 neverthrow runtime；
- RFC 9457、Connect、AIP-193/194 的稳定 code、typed details、retry 原则；
- Temporal 的 operation/activity retry 与 durable workflow retry 分层；
- Lark CLI、Ardan Labs、Memos、Vendure 的 public/internal、expected outcome 和治理模式。

### 11.3 Defer

- `ts-pattern`：本轮不加入依赖。只有独立 bounded mapper benchmark 显示显著可读性收益且 affected
  typecheck 成本可接受时，才允许单独提出；
- XState：Auth 不采用。未来只有 nested/parallel state、invoked actors、durable resume 等复杂流程才可
  通过新 ADR/spike 提出；actor snapshot 不得成为 durable fact。

### 11.4 Reject for this program

1. 全仓 Effect 迁移；
2. neverthrow 替换 MemoFlow Result；
3. XState 取代普通 store/composable；
4. Connect/gRPC transport 迁移；
5. Temporal 平台迁移；
6. 新建全局 Error class hierarchy；
7. 同时维持多个 Result/schema/runtime。

## 12. 最终建议

MemoFlow 不需要先引入一个“更强的错误库”。经过源码研究和隔离实验后，最优方案是使用已有的
TypeScript、Zod、Result、HTTP/IPC parity、ExecutionContext、observer 和 governance 地基，在正确的
ownership boundary 上增加极少量自有 primitive 与 builder。

这意味着后续生产实现必须坚持：

```text
Domain owns business faults
Application owns outcome and operation policy
Contracts own stable public data
Infrastructure owns provider translation
Transport owns protocol projection
Presentation owns recovery projection
Observer owns diagnostics
```

库只能是可替换实现细节，不能成为 code identity、wire schema、durable fact 或业务状态的所有者。
