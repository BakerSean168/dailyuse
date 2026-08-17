---
tags:
  - audit
  - architecture
  - contracts
  - error-handling
  - refactor
  - governance
description: MemoFlow 全应用架构、领域/应用/传输契约与失败语义的系统审计
created: 2026-08-17T00:00:00+09:00
updated: 2026-08-17T00:00:00+09:00
---

# MemoFlow 全应用架构与失败契约系统审计

## 1. 文档定位

本文不是 Auth PR 的复盘，也不是一份只讨论错误提示的编码规范。它以
`/home/ubuntu/projects/memoflow` 当前 `main` 为基线，把 Auth 暴露出的缺陷扩展到整个
MemoFlow，审查以下长期结构：

1. 领域模型、应用结果、跨边界契约、传输协议和诊断信息分别由谁拥有；
2. `packages/contracts`、feature package、`domain-shared`、`utils` 和 apps 的职责是否清晰；
3. HTTP、IPC、Web、Desktop、PowerSync、第三方 provider 之间是否存在语义泄漏；
4. 失败、正常分支、重试、用户恢复动作和可观测性是否使用稳定协议；
5. 当前包边界、组合根、测试与治理是否能阻止同类问题再次扩散；
6. 应采用怎样的目标架构和迁移顺序，才能一次治理整类问题而不是逐个补丁。

本轮只修改架构文档、ADR、规范与实施计划，不修改生产代码，不宣称现有问题已修复。
第一版审计完成后，又补充了 TypeScript 库、协议标准和开源实现研究；研究结论与设计修订见
[失败契约库与开源实现研究](../analysis/2026-08-17-failure-contract-library-and-open-source-study.md)。
ACR-R02 隔离实验与 ACR-R03 设计 Gate 已完成，生产实施从 ACR-001 起解锁；实验依据见 `docs/analysis/2026-08-17-failure-contract-spike-evidence.md`。

## 2. 结论先行

MemoFlow 已经建立了 Result envelope、HTTP/IPC adapter、ExecutionContext、host composer、
package boundary audit、transport parity 和 architecture surface locks。这些是很好的地基。

但当前仍存在一个贯穿全仓的根问题：

> 系统把“发生了什么”“调用方应该怎么做”“怎么通过网络表达”“给用户显示什么”以及
> “内部如何诊断”压进了同一个 `Error` / `ResultError` 对象。

Auth 只是最先把它暴露出来。相同模式已经出现在 Account、AI、Goal、Task、Reminder、
Schedule、Repository、Setting、Web、Desktop 和 API 中：

- provider code 或 provider HTTP status 直接进入 application/UI；
- application 通过 `message.includes(...)` 判断业务原因；
- `ResultError.message` 被重新包装为普通 `Error`，机器语义和 trace 丢失；
- UI 直接展示 `result.error.message`；
- 领域错误类携带 HTTP status、timestamp、operationId 和原始异常；
- feature-specific code 未登记在全局 HTTP map 时默认成为 500；
- 正常但未完成的状态被建模成 error；
- `packages/contracts` 同时保存 wire DTO、领域实体接口、聚合、协议、事件和 schema，
  逐渐成为全局语义仓库；
- feature package 在一个 Nx `layer:domain` 标签下同时包含 domain、application、transport、
  infrastructure 和部分 composition，包级标签无法表达真实依赖方向。

因此，真正需要重构的不是“错误工具函数”，而是以下五个所有权：

```text
领域事实       -> feature domain
用例结果       -> feature application
跨边界稳定契约 -> contracts/<feature>
provider/技术异常 -> infrastructure adapter
HTTP/IPC/UI/日志 -> 各自边界 adapter
```

## 3. 核心决策摘要

### 3.1 错误码不应该只放一个地方

“错误码放领域层还是 contracts”这个问题没有单一答案，因为当前所谓的错误码其实混合了
不同语义。目标架构必须区分：

| 类型            | 示例                                              | 所有者                              | 是否跨进程稳定   |
| --------------- | ------------------------------------------------- | ----------------------------------- | ---------------- |
| 领域故障标识    | `TaskAlreadyCompleted`、`GoalArchived`            | feature domain                      | 否，除非明确公开 |
| 应用失败码      | `TASK_STATE_CONFLICT`、`GOAL_NOT_FOUND`           | feature application/public contract | 是               |
| 正常结果分支    | `email_verification_required`、`waiting_approval` | operation outcome contract          | 是               |
| provider 错误码 | `EMAIL_NOT_VERIFIED`、GitHub `422`                | infrastructure adapter 私有         | 否               |
| 通用失败类别    | `validation`、`conflict`、`unavailable`           | shared contracts                    | 是               |
| HTTP status     | `409`、`503`                                      | HTTP transport adapter              | 仅 HTTP          |
| UI 文案 key     | `auth.errors.INVALID_CREDENTIALS`                 | presentation                        | 仅 UI            |
| 诊断原因        | stack、cause、query、provider body                | observability/infrastructure        | 绝不出 wire      |

### 3.2 contracts 只集中“边界”，不集中“整个世界”

`@memoflow/contracts` 应继续作为跨包、跨进程、跨语言、持久化消息和公开 Port 的稳定契约源，
但不应继续充当所有领域实体、内部 helper type、provider type 和实现接口的绝对注册中心。

新的原则是：

> Boundary-first contracts，而不是 absolute type centralization。

领域模型先在 owning feature 中表达业务不变量；contracts 保存它在边界上的 command、query、
outcome、event 和 snapshot 投影。领域类不再 `implements` 一份为了网络传输而设计的全局接口。

### 3.3 Result 是边界语言，不是所有内部控制流的唯一语言

`Result<T, E>` 继续作为 application-facing boundary、HTTP、IPC 和 client port 的标准结果。
领域内部可以使用 feature-owned discriminated union、typed decision 或 feature-specific fault；
基础设施可以抛出 adapter-private 异常。关键要求是每个边界只有一个显式 mapper。

### 3.4 message 不能驱动行为

所有行为分支必须基于 stable code、outcome kind 或 typed metadata。`message` 只能作为兼容期的
安全 fallback，不能用于：

- `includes` / regex 分类；
- HTTP status 选择；
- retry 决策；
- UI scene 切换；
- E2E fixture 准备；
- provider error 识别。

### 3.5 预期分支不是错误

以下状态应优先建模为成功结果的 discriminated outcome，而不是 generic failure：

- 邮箱需要验证；
- AI 等待审批；
- 用户需要选择冲突解决方案；
- durable operation 已接受并等待处理；
- OAuth/device flow 等待用户动作；
- import dry-run 需要确认。

### 3.6 库与开源研究修正了第一版方案

研究结论不是“找一个更强的 Error 库”，而是：

- 保留 MemoFlow-owned `Result<T, E>`、Zod 和现有 HTTP/IPC envelope；
- TypeScript discriminated union + `assertNever` 是默认基础；
- `ts-pattern` 经 spike 后延期，本轮默认使用 native `switch + assertNever`；
- neverthrow 只借鉴 combinator 与 Result-consumption 治理，不替换现有 Result；
- Auth 经 spike 后采用 typed reducer；XState 只可由未来复杂 workflow 的独立 ADR/spike 提出；
- Effect、Connect、Temporal 不作为本轮全仓 runtime/transport 基础；
- RFC 9457、Google AIP、Connect、OpenTelemetry、Temporal 主要用于修正 public details、retry、
  transport projection 与 observability 语义；
- Lark CLI、Ardan Labs、Memos、Vendure 用于验证 stable code、internal cause、认证安全和 expected outcome。

更关键的设计修正是把原先笼统的 retry directive 拆成：

1. `FailureRetryHint`：失败是否暂态的事实；
2. `OperationRetryPolicy`：operation/executor 根据幂等、transaction、attempt budget 和 deadline 决定；
3. `RecoveryAction`：application/presentation 推导用户或 host 下一步。

三者不得互相代替。Public Failure 不能单方面授权重试一个非幂等写操作，也不能固化 UI action。

## 4. 审计范围与方法

### 4.1 检查范围

- `apps/api`、`apps/web`、`apps/desktop`；
- `packages/contracts`、`packages/utils`、`packages/http-client`、`packages/cloud-auth`；
- Account、AI、Goal、Task、Reminder、Schedule、Notification、Repository、Setting、
  Governance、Data Portability；
- Nx tags、package dependencies、feature-to-feature imports；
- HTTP/IPC result mapping、UI error translation、E2E auth helper；
- governance scripts、architecture surface manifest、ADR 和 standards。

### 4.2 证据方法

本审计使用：

1. 源码直接阅读；
2. workspace package graph 与 Nx project tags；
3. 针对 `throw new Error`、`message.includes`、`ResultError`、`fail/error`、
   raw message rethrow 的启发式静态扫描；
4. PR #229 的 GitHub Actions Web Flow 日志；
5. 当前 Docker image OCI revision 与运行 compose metadata；
6. 现有 ADR、架构规范和治理脚本；
7. `ts-pattern`、neverthrow、Effect、XState 官方资料；
8. RFC 9457、AIP-193/194、Connect、OpenTelemetry、Temporal；
9. Lark CLI、Ardan Labs、Memos、Vendure 的公开源码/契约。

静态数量是用于识别结构性密度的启发式指标，不等同于逐条已确认缺陷；严重级别只对本文列出的
有源码证据的模式负责。

## 5. 当前架构地图

```text
                          apps/api
                             |
                     host runtime composers
                             |
       +---------------------+----------------------+
       |                     |                      |
  feature package       feature package       feature package
  domain/application    transport/infra       client/electron
       |                     |                      |
       +---------- @memoflow/contracts -------------+
                             |
                  HTTP / IPC / PowerSync wire
                             |
              Web / Desktop presentation state
```

在理想设计里，apps 只拥有装配和平台适配；feature package 内部依赖方向为：

```text
transport -> application -> domain
infrastructure -> application/domain ports
```

当前现实有三个偏差：

1. 一个 feature package 的 Nx tag 统一是 `layer:domain`，但包内同时包含 infra 和 transport；
2. `layer:domain` 在 Nx 规则中被允许依赖 `layer:infra`，真实纯度依赖额外 repo audit；
3. Data Portability、Schedule Orchestration、AI 等跨 feature 编排仍存在直接 feature 依赖或
   app/feature 双重 composition ownership。

## 6. 证据快照

### 6.1 contracts 规模

当前 `packages/contracts/src` 的生产 TypeScript 约为：

- 551 个文件；
- 23,548 行；
- 325 个 `interface`；
- 423 个 `z.object`；
- 同时包含 AI、Goal、Task、Reminder、Notification、Schedule、Governance、Repository、
  Data Portability、Result、Electron、shared primitives 等。

按行数最大的模块：

| 模块               | 文件 |  行数 |
| ------------------ | ---: | ----: |
| AI                 |   57 | 3,499 |
| Goal               |   75 | 3,130 |
| Task               |   65 | 2,298 |
| Reminder           |   52 | 1,724 |
| Notification       |   55 | 1,533 |
| Schedule           |   47 | 1,509 |
| Governance         |   36 | 1,437 |
| Data Portability   |   28 | 1,258 |
| Reliable Messaging |    6 | 1,177 |
| Result             |    5 |   885 |

规模本身不是问题；问题是这些文件同时承担 wire schema、领域接口、聚合/实体语义、事件、
mock 和基础协议，修改原因不再单一。

### 6.2 全仓错误处理启发式扫描

排除主要生成目录后，扫描得到：

| 模式                                    | 近似数量 | 风险                                    |
| --------------------------------------- | -------: | --------------------------------------- |
| `throw new Error(...)`                  |      953 | generic exception 大量承担业务/协议语义 |
| `throw` 任意值/宽类型                   |      204 | 边界难以稳定归类                        |
| `as unknown as`                         |      127 | 边界 shape 漂移被强转掩盖               |
| message-based branch                    |       53 | 文案成为行为协议                        |
| `throw new Error(result.error.message)` |       23 | code/meta/trace 丢失                    |
| inline `fail({ ... })`                  |      273 | public code 无集中 registry/coverage    |
| uppercase code literals                 |      336 | code taxonomy 分散且语义层级混合        |

高密度区域包括 `apps/web`、`packages/ai`、`packages/goal`、
`packages/notification`、`apps/desktop`、`packages/task` 和 `packages/schedule`。

### 6.3 代表性证据

- `packages/account/.../close-account.use-case.ts` 通过
  `message.includes('Account not found')` 选择 `NOT_FOUND`；
- AI observability/runtime 通过 `timeout`、`unauthorized`、固定 message 常量分类；
- Repository application service 直接检查 provider `status === 401/403/404/413`；
- API、Desktop、app-vue 多处把 `result.error.message` 重新抛成普通 `Error`；
- Repository/Setting UI 多处直接将 `result.error.message` 写入页面状态；
- AI turn engine 的 `{ status: 'failed', error?: string }` 中，`error` 有时是 code、
  有时是 `CODE: message`、有时是 provider/raw message；
- `packages/utils/src/errors/domain-error.ts` 的领域错误同时携带 HTTP status、timestamp、
  operationId、step、originalError，并提供 API JSON 和 log formatting；
- `packages/contracts/src/result/http.ts` 在 shared contracts 内维护 HTTP status map，
  未登记的 feature code 默认映射 500；
- `packages/http-client/src/result-error.ts` 在找不到 i18n code 后返回 raw `message`；
- Auth E2E helper 通过页面文案判断“账号不存在”并自动注册，导致一个文案漂移扩散成多个
  Dashboard Web Flow 失败；
- 当前 local Docker images 标记为 `8258d...-dirty`，且构建早于待验证 Auth commit，
  运行版本无法精确证明当前源码行为。

## 7. Findings 总表

| ID   | 严重度 | 根因                                                   | 主要影响                         |
| ---- | ------ | ------------------------------------------------------ | -------------------------------- |
| F-01 | P0     | 领域、应用、wire、transport、diagnostic 错误合一       | 泄漏、误分类、错误恢复           |
| F-02 | P0     | provider error 没有 ACL                                | 第三方升级穿透全栈               |
| F-03 | P0     | message/string 承担机器协议                            | i18n、测试、重试和安全不稳定     |
| F-04 | P0     | `ResultError` 同时包含 public data 与 `cause/context`  | wire 安全和可序列化边界不清      |
| F-05 | P1     | 正常分支被建模为 error                                 | UI 状态机充满特殊判断            |
| F-06 | P1     | contracts 绝对中心化                                   | god registry、领域贫血、变更放大 |
| F-07 | P1     | HTTP mapping 位于 shared contracts                     | 非 HTTP host 被 HTTP 语义污染    |
| F-08 | P1     | feature package/Nx layer 与真实子层不一致              | 包边界可读性和治理不足           |
| F-09 | P1     | composition/cross-feature ownership 分散               | 重复实例、直接依赖、宿主行为漂移 |
| F-10 | P1     | Presentation state 和错误翻译无单一 owner              | Web/Desktop/scene/receipt 双轨   |
| F-11 | P1     | E2E fixture 通过 UI 文案和副作用准备数据               | 非目标测试级联失败               |
| F-12 | P1     | provider/infra status 在 application 中分支            | application 依赖技术细节         |
| F-13 | P2     | 治理未覆盖 failure registry/provider leakage           | 同类问题持续新增                 |
| F-14 | P2     | build/config provenance 不构成验收契约                 | 验证源码与运行物不一致           |
| F-15 | P2     | 旧 ADR 同时宣称 absolute centralization                | 架构规则自相矛盾                 |
| F-16 | P1     | retry hint、operation retry 与 UI recovery 混合        | 非幂等重试和错误 UX 风险         |
| F-17 | P1     | 未经 spike 的库采用可能形成第二套 runtime/Result/state | 重构范围失控与长期锁定           |

## 8. 详细诊断

### F-01：一个 Error 对象承担了五层职责

当前 `DomainError` 名称暗示它属于领域层，但其字段包含：

- domain/application code；
- HTTP status；
- API JSON shape；
- timestamp；
- operationId / step；
- originalError；
- log formatter；
- error chain traversal。

这违反单一变化原因。领域规则改变、HTTP policy 改变、日志结构改变、trace policy 改变都会修改
同一个基类。更严重的是，领域层因此知道 HTTP，并且 `context` 是否安全出网没有类型保证。

目标不是创建一个更大的 `AppError`，而是拆开：

```text
DomainFault        只表达业务事实
ApplicationFailure 只表达调用方可处理的失败
TransportMapping   只表达协议投影
DiagnosticRecord   只表达内部排障信息
```

### F-02：第三方 provider 语义进入 MemoFlow public contract

Auth 的 `INVALID_EMAIL_OR_PASSWORD` / `EMAIL_NOT_VERIFIED` 是当前最明显例子；Repository 中
GitHub status、AI provider message、Prisma code 也存在同类风险。

正确边界是 Anti-Corruption Layer：

```text
provider response
       |
       v
adapter-private parser
       |
       v
MemoFlow-owned outcome/failure
```

provider code 可以保留在内部 diagnostic attributes 中，但不能成为 UI、application、E2E 或
跨进程 schema 的依赖。

### F-03：message 成为隐藏的第二套协议

系统表面上使用 `ResultError.code`，实际又通过 message 完成：

- not-found 分类；
- abort/timeout/auth 判断；
- UI 文案；
- E2E fixture 决策；
- AI runtime invariant 识别；
- generic Error rethrow。

因此仓库同时存在两套协议：显式 code 和隐式 English string。后者没有 schema、没有版本、没有
编译检查，并会被 provider、i18n 和文案调整随时改变。

必须把 message branching 视为架构违规；只有 adapter 内解析无法提供结构化信息的 legacy
provider 时允许临时 allowlist，并要求 owner/retire date。

### F-04：public failure 与 diagnostic cause 没有类型隔离

`ResultError` 当前同时允许 `context` 和 `cause`，而同一个类型被 server、client、HTTP、IPC、
store 和 UI 使用。虽然 HTTP serializer 当前不会主动序列化 `cause`，但类型层没有防止：

- context 放入 token、query、provider response、PII；
- client 误依赖 server-only cause；
- durable receipt 持久化 raw message/context；
- adapter 将 Error 对象塞入 wire data。

目标 public failure 必须是 JSON-safe、allowlisted 和无 cause 的类型。内部诊断使用独立类型，
由 observer/logger 绑定 traceId，不进入 Result payload。

### F-05：正常状态与失败状态混合

“密码正确但邮箱未验证”不是系统故障；“AI 等待审批”不是失败；“任务已进入 durable queue”
也不是失败。这些状态都要求调用方执行明确下一步，应由 outcome union 表达。

将它们建模为 error 会导致：

- success/failure 统计失真；
- retry policy 不清；
- UI 用 error code 切 scene；
- toast、error banner 与正常指引混用；
- provider-specific error code 被迫成为 workflow state。

### F-06：Absolute Type Centralization 使 contracts 成为语义仓库

ADR-010/017 原意是消除 Web/API/Desktop DTO 漂移，但规则扩展为“所有 public data types、business
entities、domain entity interfaces 都必须在 contracts”。结果是：

1. domain class 需要实现 wire-oriented interface；
2. feature 内部变化先修改中央包；
3. contracts 同时知道多个 bounded context 的内部模型；
4. 每个 feature 仍存在 domain-server/domain-client 类型，形成“中央接口 + 本地实现”双模型；
5. package root 构建和依赖 fan-out 增大；
6. AI agent 容易把“共享类型”误解为“所有语义都属于 shared”。

正确规则应是：

- 跨边界、跨语言、durable event、public port 类型集中在 contracts；
- domain entities、domain faults、repository ports、application-internal types 留在 owning feature；
- 真正跨领域且语义完全相同的值对象才进入 `domain-shared`；
- wire DTO 是 domain snapshot/projection，不是 domain interface。

### F-07：HTTP status mapping 不属于 contracts/result

`ResultCodeToHttpStatus` 和 `errorCodeToHttpStatus` 当前位于 contracts。它让 shared result package
知道 HTTP，并让所有 feature code 依赖一个中央 map。新 code 未登记时默认为 500，导致：

- 业务冲突被错误报告为服务器故障；
- HTTP map 成为中央修改点；
- IPC/Desktop 继承并不需要的 HTTP 分类；
- feature code 与 transport policy 无法独立演进。

目标：shared contracts 只提供 failure category；HTTP adapter 按 category 提供默认 status，并允许
feature HTTP registry 对 operation/code 做显式覆盖。IPC 使用自己的 envelope，不携带 HTTP status。

### F-08：Nx `layer:domain` 无法表达单包多层现实

Goal、Task 等 package 被标记为 `layer:domain`，但内部包含 domain、application、transport、
infrastructure 和 host-facing factory。为了允许 composition，Nx 又允许 domain package 依赖 infra。
实际纯度依赖 `package-internal-boundary-audit.mjs` 补救。

这套设计可以运行，但命名误导：package 不是 domain library，而是 vertical feature slice。
建议长期改为：

```text
type:feature / layer:feature
```

并把 domain/application/transport/infrastructure 依赖方向全部交给 AST-based in-package governance。
Nx package graph 管 feature isolation，source audit 管 feature 内层次。

### F-09：组合根和跨 feature 编排仍然分散

当前 package graph 没有循环，这是优点；但仍有高 fan-out：

- Schedule Orchestration 直接依赖 Goal、Task、Reminder、Notification、Schedule；
- Data Portability infrastructure 直接依赖多个 feature implementation；
- AI 直接依赖 Repository、Setting；
- Goal/Task/Reminder 直接依赖 Schedule contracts/implementation surface；
- API 与 Desktop 对部分业务执行各有一套 adapter/orchestrator。

跨 feature application service 可以存在，但它应该依赖 consumer-owned ports/public contracts，
由 host composer 注入 provider adapters，而不是把 feature package implementation graph固定下来。

### F-10：Presentation 失败状态没有单一 owner

Auth 同时存在 `useWebAuth`、app-vue auth composables、Pinia receipt、Web scene-local state；其他模块也
同时使用 translator、raw message、local ref、query error 和 toast。结果是同一个失败可能被：

- 翻译两次或不翻译；
- 存为 code、message 或完整 ResultError；
- 在 locale 变化后无法重新翻译；
- 在 reload 后持久化不安全内容；
- Web 和 Desktop 给出不同 recovery。

目标 presentation state 保存 stable failure/outcome，不保存最终文案；文案是 computed projection。
每个 operation 由一个 application state owner 管 loading/outcome/failure/retry receipt。

### F-11：测试 fixture 依赖用户界面行为

通用 login helper 在页面失败后查找具体文案，再决定是否自动注册。这使一个 Auth 文案问题导致
Dashboard、deep-link、shell 等非 Auth 场景失败。

测试层应严格分工：

- global setup/API/DB fixture 确定性建立 verified user；
- login helper 只登录；
- signup/verification E2E 独立验证；
- UI test 根据 data-testid 和 stable state 断言，不把文案当 fixture protocol；
- locale test 专门验证 code 在语言切换后重新投影。

### F-12：application 直接理解 provider status

Repository application service 直接判断 GitHub/HTTP status，Auth application 判断 BetterAuth code，
AI application 从 provider message 分类。这表明 adapter 没有完成技术语义到应用语义的翻译。

所有 provider-specific status/body/header 应止于 infrastructure。Application port 返回 MemoFlow-owned
result/outcome，application 不 import provider SDK error class。

### F-13：现有 governance 很强，但缺一类核心规则

仓库已有：

- package internal boundary；
- package export audit；
- architecture surface locks；
- raw event bus / mitt RPC / unflushed events；
- transport parity；
- public JSDoc；
- target baseline。

缺失的是 failure contract governance：

1. public failure code registry；
2. provider code leakage scan；
3. message-based branch ban；
4. raw Result message rethrow ban；
5. i18n coverage；
6. HTTP/IPC mapping coverage；
7. JSON-safe public failure schema；
8. code removal/versioning check。

### F-14：源码、构建物和运行物没有成为同一验收事实

Docker image 已带 OCI revision，这是良好基础；但当前 image revision 带 `-dirty`，且运行 stack 的构建
时间早于待验证 commit。测试如果不先校验 build identity，就可能验证旧 UI/API。

目标是 E2E 启动时 fail fast：

```text
expected source revision
  == web build revision
  == api build revision
  == compose evidence revision
```

同时 `.env.local` / `.env.production.local` 应由 typed environment schema 说明 required/public/secret/
forbidden，而不是只靠文件内容约定。

### F-15：旧 ADR 与当前目标互相冲突

ADR-010/017 的 absolute centralization、ADR-012 的 error class + HTTP status、ADR-030 的 Result
描述与当前 RefArch/transport parity 已有明显张力。若不正式 supersede/amend，后续开发者和 Agent 会继续
依据旧文档生成错误结构。

本审计配套 ADR-049，用正式决策关闭该冲突。

### F-16：失败暂态事实、自动重试策略和用户恢复动作混为一谈

第一版 `RetryDirective` 同时包含 `never/immediate/after/reauthenticate/user_action`。这把三个不同 owner
放进同一字段：provider/server 对失败性质的判断、operation 对幂等和副作用的判断，以及 UI 下一步。
Google AIP-194、Temporal Activity/Workflow retry 模型和现有 reliable receipt 都说明：是否自动 retry 必须
结合 operation policy、idempotency key、transaction/workflow 边界、attempt budget、deadline 和部分副作用。
`Retry-After` 或 transient failure 只是输入事实，不是执行许可。

目标拆分为：

```text
FailureRetryHint
  ∩ OperationRetryPolicy
  ∩ idempotency / durable receipt state
  ∩ attempt budget / deadline / cancellation
  -> retry decision

PublicFailure + Outcome + host context
  -> RecoveryAction
```

### F-17：大重构容易借机引入第二套平台

MemoFlow 已有 Result、Zod、DI/composer、reliable messaging、retry/dead-letter、OpenTelemetry、TanStack Query
和 AI runtime。直接引入 neverthrow、Effect、XState 或 Connect 作为全仓底座，会同时重写 Result、schema、
DI、lifecycle、transport、state 和测试。

目标不是拒绝所有库，而是规定准入：

- `ts-pattern`：只在 exhaustive mapper/complex reducer 使用，先测 typecheck 与错误质量；
- XState：只在满足复杂度阈值的长流程使用，actor snapshot 不替代 durable fact；
- neverthrow：借鉴组合器和 Result-consumption lint；
- Effect：未来只允许隔离 AI/worker 实验；
- 所有 library type 不得进入 wire、Domain Fault identity 或 durable schema。

## 9. “错误码放哪里”的完整答案

### 9.1 Domain 层放什么

Domain 层放 feature-owned fault identity，表达业务不变量和状态转移为什么被拒绝。例如：

```ts
type TaskDomainFault =
  | { kind: 'TaskAlreadyCompleted'; taskId: TaskId }
  | { kind: 'TaskHierarchyCycle'; parentId: TaskId }
  | { kind: 'TaskArchived'; taskId: TaskId };
```

约束：

- 不含 HTTP status；
- 不含 i18n message；
- 不含 provider code；
- 不含 stack/trace/timestamp；
- 不要求所有 fault 跨边界稳定；
- domain 不 import `@memoflow/contracts/result` 只是为了生成 HTTP-friendly code。

### 9.2 Application 层放什么

Application 层拥有 operation semantics：成功、正常替代结果和公开失败的映射。

```ts
type CompleteTaskOutcome =
  { kind: 'completed'; task: TaskSnapshot } | { kind: 'already_completed'; task: TaskSnapshot };

type CompleteTaskFailureCode =
  'TASK_NOT_FOUND' | 'TASK_VERSION_CONFLICT' | 'TASK_COMPLETION_REJECTED';
```

Application 将 domain fault、repository fault、policy decision 映射为调用方可以处理的稳定语义。

### 9.3 contracts 放什么

contracts 放跨边界稳定的：

- command/query request schema；
- response snapshot；
- operation outcome union；
- public failure code union + JSON schema；
- HTTP/IPC 共用的 canonical input/output；
- durable events/messages；
- public client/application port。

不要放：

- domain entity interface 只为了让 class implements；
- Prisma/provider types；
- private repository row；
- UI component props；
- feature internal helper types；
- stack/cause/logger context。

### 9.4 Infrastructure 放什么

- provider code parser；
- Prisma/GitHub/BetterAuth/OpenAI/PowerSync error mapper；
- network/SDK exception；
- retry-after/header/body 解析；
- internal diagnostic attributes。

这些类型默认 private，只有 MemoFlow-owned result/outcome 可以离开 adapter。

### 9.5 Transport 放什么

HTTP adapter 决定 status/header/cache/retry-after；IPC adapter 决定 channel envelope；SSE adapter 决定
terminal event。它们都消费同一个 public failure/outcome，但不能反向影响 domain model。

### 9.6 Presentation 放什么

UI 保存：

```text
outcome kind
public failure code/category/typed details/retry hint
operation retry state
recovery action
request/trace reference
```

UI 不保存 raw provider/server message，也不根据 message 分支。locale 变化时重新根据 code/typed details
计算文案。RecoveryAction 根据 public semantics 和 host context 推导，不能从 translated message 或 retry hint 推导。

## 10. 目标架构

```text
+--------------------------- Owning Feature ---------------------------+
|                                                                      |
|  Domain Model                                                        |
|  aggregate / value object / DomainFault                              |
|          |                                                           |
|          v                                                           |
|  Application Use Case                                                |
|  command/query + OperationOutcome + failure mapper                   |
|  OperationRetryPolicy + RecoveryPolicy                               |
|          |                                                           |
|          +---------------- public feature port -------------------+   |
|                                                                  |   |
+------------------------------------------------------------------|---+
                                                                   |
                          @memoflow/contracts/<feature>              |
                  request / outcome / public failure / snapshot      |
                                                                   |
               +-------------------+-------------------+             |
               |                   |                   |             |
               v                   v                   v             |
          HTTP adapter         IPC adapter        durable message    |
          status/header        channel envelope   schema/version     |
               |                   |                   |             |
               +-------------------+-------------------+             |
                                   |                                 |
                              client adapter                           |
                                   |                                 |
                         presentation state machine                   |
                                   |                                 |
                         i18n(code, typed details)                   |

Provider/DB/SDK errors -> infrastructure ACL -> domain/application semantics
Internal cause/stack   -> observer/logger only -> never enters public contract
```

## 11. 目标 package ownership

| Package/目录                                   | 目标职责                                                               |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| `packages/<feature>/src/server/domain`         | aggregate、VO、policy、domain fault、domain-owned port                 |
| `packages/<feature>/src/server/application`    | use case、application port、outcome/failure mapper、orchestration      |
| `packages/<feature>/src/server/infrastructure` | DB/provider adapter、ACL、technical retry、diagnostic enrichment       |
| `packages/<feature>/src/server/transport`      | HTTP/IPC-independent controller input/output delegation                |
| `packages/contracts/src/modules/<feature>`     | wire schema、public outcome/failure、snapshot、event、RPC map          |
| `packages/contracts/src/result`                | generic Result、public failure category、JSON-safe primitives          |
| `packages/domain-shared`                       | 真正跨 bounded context 且语义一致的 domain primitive                   |
| `packages/utils`                               | 纯技术工具；不再拥有全局 DomainError 业务层级                          |
| `packages/http-client`                         | MemoFlow envelope transport、network classification；不做 feature i18n |
| `packages/app-vue`                             | presentation/application state adapter；只消费 stable public semantics |
| `apps/*`                                       | composition root、platform adapter、runtime lifecycle、environment     |

## 12. Public failure 目标形状

推荐的目标结构：

```ts
type FailureCategory =
  | 'validation'
  | 'unauthenticated'
  | 'permission'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'unavailable'
  | 'timeout'
  | 'canceled'
  | 'internal';

type FailureRetryHint =
  { kind: 'not_retryable' } | { kind: 'transient' } | { kind: 'after'; afterMs: number };

interface PublicFailure<Code extends string = string, Details = never> {
  readonly code: Code;
  readonly category: FailureCategory;
  readonly details?: Details;
  readonly retryHint?: FailureRetryHint;
  readonly reference?: { requestId?: string; traceId?: string };
}

interface OperationRetryPolicy {
  readonly mode: 'never' | 'safe_read' | 'idempotent_write' | 'transaction' | 'workflow_step';
  readonly maxAttempts: number;
  readonly requiresIdempotencyKey: boolean;
  readonly backoff: BackoffPolicy;
}

// Application/presentation-owned, not provider-owned.
type RecoveryAction =
  | { kind: 'none' }
  | { kind: 'reauthenticate' }
  | { kind: 'verify_email'; email: string }
  | { kind: 'correct_input'; fields?: readonly string[] }
  | { kind: 'resolve_conflict'; resource: string }
  | { kind: 'retry_manually' };
```

兼容迁移期可以保留 `message`，但必须满足：

- 由 MemoFlow allowlist 生成；
- 不包含 provider response、token、query 或 PII；
- UI 不根据它分支；
- UI 优先根据 code + typed details 本地化；
- 最终考虑从 canonical contract 移除或改为 `fallbackMessage`。

内部诊断另用：

```ts
interface DiagnosticFailure {
  readonly cause?: unknown;
  readonly provider?: string;
  readonly providerCode?: string;
  readonly operation: string;
  readonly attributes?: Record<string, unknown>;
}
```

该对象只送 observer/logger，不可作为 HTTP/IPC/durable payload。

### 12.1 Registry 与库边界

每个 feature failure registry 应从一个对象推导：code union、Zod details schema、HTTP policy、i18n key、
telemetry mapping 和文档。禁止维护多份平行 map，也禁止使用 arbitrary `Record<string, unknown>` 作为公开 details。

默认使用 TypeScript union、Zod strict schema 和 `switch + assertNever`。ACR-R03 已决定本轮不引入 `ts-pattern`、neverthrow、XState 或 Effect 作为 foundation；XState 仅可由未来复杂 workflow 的独立 ADR/spike 提出。

## 13. Protected contracts

大重构必须保护：

1. 当前 `Result<T>`、`HttpResponse<T>`、`IpcResult<T>` wire shape，在显式版本迁移前不破坏；
2. ADR-048 的 HTTP/IPC canonical fixture 与 adapter-owned validation；
3. ADR-045 的 ExecutionContext、requestId、traceId、identity ordering；
4. ADR-042/043 的 reliable operation receipt、timeline、replay 和审计；
5. AI approval gate、proposal lifecycle 和 single mutation owner；
6. PowerSync offline/profile isolation 和已有 transport routes/channels；
7. public deep links、test selectors、auth routes；
8. database uniqueness/idempotency/receipt invariants；
9. current build/export subpath，直到迁移调用方完成；
10. library type 不进入 public wire、Domain Fault identity 或 durable fact；
11. production failure foundation 只能使用 ACR-R03 已批准的 TypeScript/Zod/Result 组合。

## 14. 重构原则

### 14.1 先研究和 spike，再建立兼容层

不能因为目标是“大刀阔斧重构”就直接选定新 runtime。先完成 library/standard/open-source research、
exhaustive mapper spike、Auth reducer/XState spike、single-source registry/retry-policy spike，再由 ACR-R03
冻结采用范围。之后才建立 compatibility layer 和迁移 feature。

不能一次删除 `ResultError.message` 或移动数百个 contracts 文件。先建立新 primitives、registry、mappers
和 governance，然后以 Auth 为 vertical slice，之后按风险迁移。

### 14.2 Retry hint、operation policy 与 recovery 分属不同 owner

Public Failure 可携带 `retryHint`，但 executor 只有结合 operation idempotency、receipt、attempt budget、deadline
和 cancellation 后才能自动重试。UI recovery 根据 code/outcome/details 与 host context 推导，不解析 message。

### 14.3 每个 feature 只有一个 public failure vocabulary

Web、Desktop、API、IPC、worker 对同一 operation 使用同一 public code/outcome。Provider、Prisma、
HTTP status 和 UI key 都只是这个 vocabulary 的投影。

### 14.4 每个 state transition 只有一个 owner

Auth login、AI turn、Task completion、Reminder response、Repository sync 都必须有一个 application
state owner。UI/composable/helper 不再复制业务状态机。

### 14.5 Contracts 通过 mapper 与 domain 相连

禁止 domain class 为了“共享类型”实现 wire DTO。使用显式：

```text
toTaskSnapshot(domain)
fromCreateTaskCommand(contract)
mapTaskFaultToFailure(fault)
```

### 14.6 所有临时兼容都必须可退役

兼容 alias、旧 code、raw message、allowlist 必须有 owner、reason、target date 和测试。不得通过新增
第二套 helper 永久共存。

## 15. 建议的实施顺序

1. 完成 library/standard/open-source study；
2. 完成 exhaustive mapper、Auth state model、single-source registry/retry-policy 三组隔离 spike；
3. 通过 ACR-R03 冻结 adopt/borrow/defer/reject 和基础类型；
4. 建立 ADR-049、failure/outcome 标准和静态 inventory；
5. 扩展 generic Result 为 typed public failure，同时保持 wire 兼容；
6. Auth 作为第一条端到端 vertical slice：provider ACL → outcome → HTTP/IPC → UI → E2E；
7. 新增 failure registry/i18n/transport/governance gates；
8. 迁移 Account、Repository、AI 中 message/status/provider leakage；
9. 迁移 Goal/Task/Reminder/Schedule 的 domain fault 与 operation-specific outcomes；
10. 将 `DomainError` 退役，拆出 domain fault 和 diagnostics；
11. 将 contracts 从 absolute type registry 收缩为 boundary contract package；
12. 收敛 host composition 与跨 feature ports；
13. 完成 UI state、test fixture、build provenance 和 env schema hardening。

具体 ticket、依赖、验收命令和回滚策略见：

- `docs/analysis/2026-08-17-failure-contract-library-and-open-source-study.md`；
- `docs/plan/active/2026-08-17-application-contract-and-architecture-refactor.md`；
- `docs/architecture/adr/ADR-049-domain-outcome-and-failure-contracts.md`；
- `docs/standards/failure-and-outcome-contracts.md`。

## 16. 非目标

本轮方案不主张：

- 创建一个新的全局 `errors` god package；
- 为每个异常创建 class；
- 把所有 domain method 都改成 Result；
- 把 HTTP status 写入 domain/public code；
- 为了“统一”强迫 Web、Desktop 和 server 使用同一个状态 store；
- 一次性改完 551 个 contracts 文件；
- 通过添加更多 fallback/alias 掩盖 provider leakage；
- 在没有 migration/compatibility tests 时破坏现有 wire envelope；
- 全仓迁移 Effect、neverthrow、XState、Connect 或 Temporal；
- 未完成设计 Gate 就把 library type 写入 public contract 或 durable schema。

## 17. 最终判断

MemoFlow 当前的主要风险不是缺少抽象，而是抽象边界错位：

- contracts 管得太多；
- domain error 知道得太多；
- provider adapter 翻译得太少；
- application outcome 表达得太少；
- UI 和测试依赖 message 太多；
- governance 对失败协议约束得太少；
- retry 暂态事实、执行安全和 UI recovery 混得太多；
- 未经 spike 的库采用可能替代了原本要保护的 architecture ownership。

目标不是得到一套更复杂的 Error class hierarchy，而是让每个层只拥有自己的语义：

```text
Domain 说明为什么业务拒绝
Application 说明调用方下一步是什么
Contracts 说明边界上稳定传什么
Transport 说明协议如何表达
Presentation 说明用户看到什么
Observability 说明工程师如何排障
```

当这六件事不再由同一个对象承担时，Auth 这类问题才会从“修一次”变成“结构上不再发生”。
库只能减少 mapper 或复杂状态机样板，不能成为领域语义、public contract、重试安全或 durable fact 的所有者。
