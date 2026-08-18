---
tags:
  - plan
  - active
  - architecture
  - contracts
  - error-handling
  - refactor
description: MemoFlow 全应用领域/应用/边界契约、失败语义、组合根与治理的大重构实施计划
created: 2026-08-17T00:00:00+09:00
updated: 2026-08-17T00:00:00+09:00
---

# Application Contract and Architecture Refactor / 应用契约与架构大重构

## 文档状态

- **状态**：Active implementation program；ACR-R01/R02/R03 已完成，生产实施从 ACR-001 起解锁。
- **基线**：oracle3 `/home/ubuntu/projects/memoflow`，`main` = `8258d415e`。
- **触发事件**：Auth 登录错误映射回归与 PR #229 暴露 provider code、raw message、UI state、
  E2E fixture 和运行版本验证的系统性缺口。
- **依据**：
  - `docs/audit/2026-08-17-application-architecture-and-failure-contract-audit.md`；
  - `docs/analysis/2026-08-17-failure-contract-library-and-open-source-study.md`；
  - `docs/analysis/2026-08-17-failure-contract-spike-evidence.md`；
  - `docs/architecture/adr/ADR-049-domain-outcome-and-failure-contracts.md`；
  - `docs/standards/failure-and-outcome-contracts.md`；
  - ADR-045、ADR-048 和现有 architecture/governance surface locks。

## 1. Executive Decision Summary

本计划不以“统一 Error class”为目标，而是重建以下所有权：

```text
Domain Fault        -> owning feature domain
Operation Outcome   -> owning feature application/public contract
Public Failure      -> contracts/<feature>
Provider Failure    -> infrastructure adapter private
Transport Mapping   -> HTTP/IPC/SSE adapter
Presentation        -> stable code/outcome -> i18n/recovery
Diagnostics         -> observer/logger only
```

重构顺序采用“外部研究与设计 spike → 设计 Gate → 基础契约 → Auth 垂直切片 → 高风险模块迁移 →
contracts 收缩 → 组合根收敛 → UI/测试/部署硬化 → 删除旧轨”的方式。禁止先做全仓机械替换，
也禁止同时维持两套长期协议。`ts-pattern`、XState、neverthrow、Effect 等任何库都必须先经过
adopt/borrow/defer/reject 决策，不能因为重构规模大就直接成为新底座。

## 2. 目标结果与主要用户路径

### 2.1 目标结果

完成后，MemoFlow 对任何 operation 都能回答：

1. 这是正常 outcome 还是 failure；
2. failure 是哪个 feature 拥有的稳定语义；
3. provider/DB 错误如何被转换；
4. HTTP、IPC、Web、Desktop 如何得到一致行为；
5. 用户应该重试、重新认证、修正输入还是执行下一步；
6. UI 如何在 locale 变化后重新翻译；
7. 工程师如何通过 trace 获取内部 cause，而用户看不到敏感信息；
8. 新增 code/provider/transport 时，哪一个 CI gate 会证明覆盖完整；
9. 哪些能力由 MemoFlow 自己拥有，哪些库只作为可替换实现细节。

### 2.2 首个端到端路径：Auth Sign-in

```text
user submits credentials
  -> BetterAuth adapter parses provider response
  -> MemoFlow SignInOutcome/AuthFailure
  -> Web/IPC client receives canonical semantics
  -> one application state owner updates scene/failure
  -> presentation translates code or renders outcome
  -> E2E verifies invalid credentials, verification required, verified login
  -> observer records internal provider code without exposing it
```

必须覆盖：

- 错误密码；
- 不存在邮箱；
- 正确密码但未验证；
- 验证链接有效/无效/过期；
- 验证后登录；
- 重复注册；
- network/provider unavailable；
- locale 切换；
- repeated login 清除旧 state；
- Web/Desktop/HTTP/IPC parity；
- deterministic test user setup。

## 3. 范围

### 3.1 In scope

- library/standard/open-source research 与隔离 design spikes；
- shared Result/public failure primitives；
- feature failure/outcome registries；
- Auth、Account、Repository、AI、Goal、Task、Reminder、Schedule 的迁移；
- provider ACL；
- HTTP/IPC/SSE projection；
- presentation state/i18n/recovery；
- `DomainError` 退役；
- contracts boundary-first 分类和迁移；
- feature package layering/tag clarification；
- cross-feature application ports/composition roots；
- E2E fixture、build provenance、environment schema；
- governance、inventory、mutation fixtures；
- docs/ADR/standards 更新。

### 3.2 Out of scope

- 改变现有产品功能或新增业务模块；
- 重写数据库/PowerSync schema，除非某个 failure/receipt contract 必需；
- 改变 AI approval、安全权限、account closure、reliable messaging 的业务政策；
- 一次性删除所有现有 `ResultError.message/context`；
- 一次性移动 contracts 的 551 个文件；
- 把所有 domain method 强制改成 Result；
- 创建新的全局 error god package；
- 在本计划中重做整个 UI shell、Agent runtime 或 CI/CD platform；
- 全仓迁移 Effect、neverthrow、XState、Connect 或 Temporal；
- 违反 ACR-R03 已冻结 library/ownership boundary 的 production foundation。

## 4. 当前系统与 Gap

| Gap                       | Observed                                                   | Desired                                       | Impact                |
| ------------------------- | ---------------------------------------------------------- | --------------------------------------------- | --------------------- |
| Provider leakage          | BetterAuth/GitHub/provider code/status 进入 application/UI | adapter 输出 MemoFlow semantics               | 第三方升级不穿透全栈  |
| Raw message protocol      | message 分支、直接显示、rethrow                            | code/outcome/typed details                    | i18n、安全、测试稳定  |
| Error object overload     | DomainError 含 HTTP/log/diagnostic                         | 六层类型分离                                  | 分层和序列化安全      |
| Untyped Result            | `ResultError.code: string`                                 | operation-specific failure generic            | exhaustive handling   |
| Outcome/error mixing      | verification/approval 作为 error                           | normal outcome union                          | 状态机和 metrics 正确 |
| Retry/recovery conflation | failure 同时决定自动 retry 与 UI action                    | retry hint / operation policy / recovery 分离 | 幂等与 UX 正确        |
| Library adoption risk     | 可因“大重构”引入第二套 Result/runtime/state machine        | spike + explicit adoption boundary            | 避免平台级重写        |
| Contracts god registry    | domain/wire/internal 类型集中                              | boundary-first contracts                      | bounded context 清晰  |
| HTTP in shared contracts  | 全局 code map                                              | transport-local policy                        | 非 HTTP host 解耦     |
| Composition fan-out       | feature 直接依赖多 feature                                 | consumer-owned ports + host wiring            | 可测试、可替换        |
| UI error ownership        | raw refs/store/composable 双轨                             | operation state owner                         | recovery 一致         |
| Test fixture coupling     | UI 文案决定注册                                            | deterministic setup                           | 非目标 suite 不级联   |
| Runtime provenance        | image revision dirty/old                                   | source=build=runtime                          | 验收可信              |
| Governance gap            | 无 failure registry/leakage gate                           | fail-closed audit                             | 防止复发              |

## 5. North-star Architecture

```text
                      +-------------------------+
                      |     Feature Domain      |
                      | state + DomainFault     |
                      +------------+------------+
                                   |
                                   v
                      +-------------------------+
                      |  Feature Application    |
                      | use case + Outcome      |
                      | fault/failure mapping   |
                      +------------+------------+
                                   |
                      public application port
                                   |
             FailureRetryHint + OperationRetryPolicy + RecoveryPolicy
                                   |
                 +-----------------+-----------------+
                 | @memoflow/contracts/<feature>     |
                 | schema + outcome + public failure |
                 +-----------------+-----------------+
                                   |
              +--------------------+---------------------+
              |                    |                     |
              v                    v                     v
         HTTP adapter          IPC adapter         durable adapter
         status/header         envelope            event/receipt
              |                    |                     |
              +--------------------+---------------------+
                                   |
                           client/application state
                                   |
                         i18n + recovery projection

provider/db/sdk -> infrastructure ACL -> application semantics
cause/stack/raw detail -> observer only
```

## 6. Protected Contracts

所有 ticket 必须声明并保护：

1. 当前 `Result<T>`、`HttpResponse<T>`、`IpcResult<T>` wire envelope；
2. ADR-048 adapter-owned validation 和 HTTP/IPC parity fixtures；
3. ADR-045 ExecutionContext、requestId、traceId、principal ordering；
4. public routes、IPC channels、SSE event ordering、deep links；
5. AI approval/proposal lifecycle、finite retry、execution receipt；
6. account closure、auth security、password reset enumeration policy；
7. PowerSync offline/profile isolation；
8. reliable operation receipt、timeline/replay/audit；
9. existing test selectors 和 product journeys；
10. database uniqueness、idempotency、transaction 和 migration invariants；
11. package public subpaths，直到 compatibility migration 完成；
12. Docker compose entry points 和 deployment environment names；
13. library type 不进入 public wire、Domain Fault identity 或 durable fact；
14. library/type 选择必须符合 ACR-R03 已冻结的 adopt/borrow/defer/reject 决策。

## 7. Phased Roadmap

### Phase -1 — Library, Standard and Open-Source Design Validation — Completed

**目标**：在修改生产代码前，验证是否应采用 `ts-pattern`、XState 或其它库，并吸收 RFC/AIP、Connect、
OpenTelemetry、Temporal 和成熟开源项目的设计原则。

**为何先做**：第一版架构方向正确，但 retry/recovery 仍有混合，且未经证据选择 library 会把本轮重构
扩大为新的 runtime/platform 迁移。

**Deliverables**：

- library/standard/open-source study（ACR-R01，已完成）；
- native switch、`ts-pattern`、neverthrow ergonomics mapper spike；
- typed reducer 与 XState Auth state-model spike；
- Zod single-source registry + retry policy spike；
- dependency、bundle、typecheck、test、Agent 修改体验证据；
- adopt/borrow/defer/reject decision record；
- ADR-049 与标准的最终设计修订。

**Acceptance evidence**：

- spike 在实验目录或隔离 worktree，不接产品入口；
- wire envelope、routes、channels、receipt 无变化；
- 明确 `ts-pattern`/XState 是否进入生产依赖；
- 明确 neverthrow/Effect 不形成第二套基础设施；
- retry hint、operation retry policy、recovery action 三分模型通过 fixtures；
- ACR-R03 形成签字式 Gate 结论。

**Evidence**：`docs/analysis/2026-08-17-failure-contract-spike-evidence.md`；native mapper/reducer 与 Zod strict registry 被采用，`ts-pattern`/XState 延期，neverthrow/Effect 拒绝作为本轮底座。

**Rollback**：实验代码和临时依赖已保持在仓库外；研究与证据文档作为决策记录保留。

### Phase 0 — Baseline and Stop-the-Bleeding

**目标**：建立可重复 inventory，先阻止新增同类问题，并修复 PR #229 的正确抽象边界。

**为何先做**：没有 baseline 和 gate，后续迁移过程中旧模式会继续增长；Auth 是已复现的 vertical slice。

**Deliverables**：

- failure/message/provider leakage inventory；
- registry schema design；
- Auth provider mapper compatibility patch；
- PR #229 Web Flow 修复；
- docs/ADR/standard/plan；
- initial governance report-only mode。

**Acceptance evidence**：

- inventory 可在本地和 CI 重复生成；
- Auth raw provider message 不进入 UI；
- Web Flow shards 全绿；
- docs/governance checks 通过；
- no production code allowlist without owner/retire date。

**Rollback**：Auth mapping 可单独回滚；report-only governance 不阻塞其它模块。

### Phase 1 — Shared Failure/Outcome Foundation

**目标**：建立 JSON-safe public failure、typed Result、failure retry hint、operation retry policy、recovery policy、diagnostic separation 和 single-source registry。

**Dependencies**：Phase -1 ACR-R03 Gate 与 Phase 0 baseline。

**Deliverables**：

- `FailureCategory`、`PublicFailure`、`FailureRetryHint`；
- `OperationRetryPolicy` 与 `RecoveryAction` boundary；
- Result generic compatibility；
- registry schema and validators；
- HTTP/IPC projection helper；
- safe compatibility serializer；
- observer diagnostic API；
- governance unit/mutation fixtures。

**Acceptance evidence**：contracts/http-client/API adapter direct tests、typecheck、transport parity。

**Rollback**：新 primitives 可与旧 `ResultError` 并存一个受控迁移周期；wire shape 不变。

### Phase 2 — Auth Vertical Slice

**目标**：从 BetterAuth 到 Web/Desktop/E2E 完整采用新模型。

**Dependencies**：Phase 1 primitives。

**Deliverables**：

- BetterAuth ACL；
- SignIn/SignUp outcomes；
- Auth public failure registry；
- one Auth application state owner；
- safe i18n/recovery registry；
- deterministic auth fixtures；
- HTTP/IPC/Web parity；
- provider leakage fail-closed gate。

**Acceptance evidence**：Auth matrix、Web Flow、locale retranslation、secret-negative tests。

**Rollback**：保留 current wire compatibility adapter；不恢复 provider code exposure。

### Phase 3 — High-risk Failure Protocol Migration

**目标**：清理最危险的 message/status/string protocol。

**顺序**：Account/Repository → AI → Goal/Task → Reminder/Schedule → remaining UI。

**Deliverables**：

- Account closure 不再 message branch；
- GitHub/provider status 止于 Repository adapter；
- AI turn/stream failure 不再使用 `error?: string`；
- Task/Goal domain fault + public failure pilots；
- Reminder/Schedule typed outcome；
- UI raw message inventory 清零或限期 allowlist。

**Acceptance evidence**：每个 feature 的 mapper table tests、transport parity、UI i18n coverage。

### Phase 4 — Contracts Boundary Refactor

**目标**：将 `packages/contracts` 从绝对类型仓库收敛为边界契约包。

**Dependencies**：至少两个 feature 完成新 failure/outcome 模式，证明 mapper 结构。

**Deliverables**：

- contracts ownership inventory；
- domain/wire/internal/provider 分类；
- Goal/Task 试点迁移；
- root/subpath export 收敛；
- compatibility aliases；
- ADR-010/017 migration closure；
- contracts size/fan-out trend report。

**Acceptance evidence**：package export audits、consumer compilation、wire snapshot parity、no domain class implements wire DTO。

### Phase 5 — Feature Boundary and Composition Refactor

**目标**：让跨 feature 编排依赖 Port/Contract，host 拥有 composition。

**Deliverables**：

- Data Portability capability ports；
- Schedule Orchestration consumer-owned ports；
- AI host adapters 去重；
- app/API/Desktop module identity tests；
- feature tag strategy (`layer:feature`/`type:feature`)；
- AST internal layering gate。

**Acceptance evidence**：Nx graph no cycles、feature direct import inventory 降低、single module instance tests。

### Phase 6 — Presentation, Test and Deployment Hardening

**目标**：状态、测试和运行版本都基于稳定契约。

**Deliverables**：

- presentation failure/outcome state pattern；
- shared recovery registry approach；
- deterministic E2E fixture service；
- source/build/runtime revision gate；
- typed environment schema；
- UI raw message/secret persistence negative tests；
- operational metrics。

**Acceptance evidence**：Web/Desktop product journeys、local Docker revision parity、env validation、locale tests。

### Phase 7 — Legacy Removal and Hardening

**目标**：删除旧轨、alias 和过期规则，完成架构闭合。

**Deliverables**：

- `DomainError` 删除；
- `ResultError.cause` 从 public contract 分离；
- legacy status map/aliases 删除；
- message branching inventory 清零；
- old ADR implementation notes 更新；
- final mutation tests and architecture surface locks。

**Acceptance evidence**：全仓 governance、typecheck/lint/tests、API/Web/Desktop/local Docker journeys。

## 8. Ticket Dependency Order

```text
ACR-R01 -> ACR-R02 -> ACR-R03 -> ACR-001 -> ACR-002 -> ACR-010 -> ACR-011 -> ACR-012
                                      |
                                      v
            ACR-020 -> ACR-021 -> ACR-022 -> ACR-023
                                      |
              +-----------------------+---------------------+
              v                       v                     v
          ACR-030                 ACR-031               ACR-032
              |                       |                     |
              +---------------+-------+---------------------+
                              v
                          ACR-040 -> ACR-041
                              |
                          ACR-050 -> ACR-051
                              |
                          ACR-060 -> ACR-061
                              |
                          ACR-070 -> ACR-071
                              |
                          ACR-080 -> ACR-081
```

## 9. Execution-ready Tickets

## ACR-R01 — Research libraries, standards and open-source implementations

**Status:** Completed as design evidence on 2026-08-17.

**Goal:** 在生产重构前比较可复用 TypeScript 库、协议标准和优雅开源实现，修正第一版方案。

**Why now:** 避免重复造轮子，也避免把错误契约重构误变成 Effect/XState/Result runtime 迁移。

**Scope:** `ts-pattern`、neverthrow、Effect、XState、Zod；RFC 9457、AIP-193/194、Connect、
OpenTelemetry、Temporal；Lark CLI、Ardan Labs、Memos、Vendure。

**Out of scope:** 不安装生产依赖，不修改产品入口。

**Protected contracts:** 当前 Result/HTTP/IPC envelope、ADR-048 parity、reliable receipt、Auth routes/state behavior。

**Implementation:**

1. 盘点现有依赖与重叠能力；
2. 建立评估标准；
3. 对每个候选做 adopt/borrow/defer/reject 分析；
4. 对开源项目追踪真实 source/contract；
5. 修订 retry/recovery 模型；
6. 形成研究文档和 spike 建议。

**Tests:** 文档链接、docs-check、governance-check。

**Acceptance:** 研究文档明确推荐组合、拒绝的全局 runtime 和待验证 spike。

**Dependencies:** 无。

**Risks:** 只看 API 文档忽略真实集成成本；由 ACR-R02 用本仓库 spike 补证据。

## ACR-R02 — Run isolated mapper, state-machine and registry spikes

**Status:** Completed on 2026-08-17. Evidence: `docs/analysis/2026-08-17-failure-contract-spike-evidence.md`.

**Goal:** 用 MemoFlow fixture 对关键方案做可重复比较，不接入生产代码。

**Why now:** Library 的类型体验、编译成本和状态机收益不能只由文档推断。

**Scope:** 临时 worktree 或 `tools/experiments/failure-contract-spike/**`；三组 spike：

1. native `switch + assertNever` vs `ts-pattern` vs neverthrow ergonomics；
2. typed reducer vs XState v5 Auth flow；
3. Zod single-source failure registry + retry policy evaluation。

**Out of scope:** 不修改 feature production code，不提交未经选择的 lockfile 变化。

**Protected contracts:** 所有输入/输出 fixture 使用当前兼容 wire shape；无 route/channel/runtime registration。

**Implementation:**

1. 冻结同一 Auth provider fixture 和 union；
2. 实现三版 exhaustive mapper；
3. 注入新增 case，记录编译/测试失败质量；
4. 比较 typecheck time、bundle delta、LOC、测试与 Agent 修改体验；
5. 实现 reducer/XState 两版完整 Auth state graph；
6. 验证 cancel、retry、unmount/remount、locale change；
7. 实现 registry 推导 code/schema/http/i18n/telemetry；
8. 记录结果并删除无关实验产物。

**Tests:** spike-local Vitest、TypeScript noEmit、bundle/metafile comparison、mutation fixtures。

**Acceptance:** 每个候选有量化/可复现证据；结果不依赖主观“更优雅”。

**Dependencies:** ACR-R01。

**Risks:** microbenchmark 不能代表全仓；选择真实 Auth union 和当前 tsconfig，并把结果视为准入证据而非性能承诺。

## ACR-R03 — Freeze library adoption and approve ADR-049 implementation

**Status:** Completed on 2026-08-17. ADR-049 accepted for implementation; production work unlocked from ACR-001.

**Goal:** 形成签字式 adopt/borrow/defer/reject 决策，并解除生产重构冻结。

**Why now:** Phase 0–7 的 production tickets 必须依赖稳定的基础模型。

**Scope:** ADR-049、研究文档、标准、active plan、spike report。

**Out of scope:** 不在同一 ticket 开始 Auth 或 shared foundation 生产实现。

**Protected contracts:** ADR-049 ownership decisions、existing wire/deployment contracts。

**Implementation:**

1. 审阅 ACR-R02 evidence；
2. 记录 `ts-pattern` 延期、本轮不加入依赖；
3. 记录 Auth 采用 typed reducer，XState 延期到未来复杂 workflow ADR；
4. 确认 neverthrow/Effect/Connect/Temporal 不形成第二轨；
5. 冻结 `FailureRetryHint`、`OperationRetryPolicy`、`RecoveryAction`；
6. 冻结 single-source registry shape；
7. 更新依赖、风险、验证命令；
8. 明确 Phase 0 production work 是否解锁。

**Tests:** docs-check、governance-check、spike evidence link validation。

**Acceptance:** ADR 和计划没有未决基础模型；生产 ticket 明确允许的库和 ownership 边界。

**Dependencies:** ACR-R02。

**Risks:** 为追求一次完美设计长期阻塞；Gate 只冻结基础语义和 library boundary，不预先设计每个 feature code。

## ACR-001 — Freeze the architecture and failure inventory

**Status:** Completed on 2026-08-17. The AST inventory and 219-entry owned/expiring baseline are active in `governance-check`; evidence is recorded in `docs/analysis/2026-08-17-failure-contract-foundation-review.md`.

**Goal:** 生成可重复的全仓 inventory，记录 failure code、message branch、raw rethrow、provider leakage、
UI raw message、contracts ownership 和 feature dependencies。

**Why now:** 没有 baseline 无法证明迁移减少了问题，也无法区分新回归和历史债务。

**Scope:** `tools/governance` 新 inventory 脚本、机器 JSON 输出、human audit summary；排除 generated/report/test artifacts。

**Out of scope:** 不把所有命中直接定为错误；不修改生产代码。

**Protected contracts:** 现有 governance target 和 target-baseline 格式。

**Implementation:**

1. 将本审计使用的启发式扫描整理为 AST/structured scanner；
2. 输出按 package、pattern、file 的 JSON；
3. 分类 production/test/generated；
4. 对 message branch/provider code 建 allowlist schema，字段含 owner/reason/retireBy；
5. 保存初始 baseline，不自动豁免新增文件；
6. 添加 scanner unit tests 和 mutation fixtures；
7. 将 human summary 链接到本审计。

**Tests:** scanner positive/negative fixtures；删除/新增命中后 baseline diff 必须可见。

**Acceptance:** CI 可生成同一 inventory；新 production violation 不被历史 baseline 吞掉。

**Dependencies:** ACR-R03。

**Risks:** regex false positive；通过 AST 和明确 scope 分类控制。

## ACR-002 — Add report-only failure governance

**Status:** Completed on 2026-08-17. Historical findings remain visible; new or expired findings fail immediately, stale fixed entries are reported, and repository-level mutation evidence is recorded in the batch review.

**Goal:** 在不阻塞迁移前提下报告 provider leakage、message branching、raw message rethrow 和 UI raw message。

**Why now:** 先观测再逐类 fail closed，避免一次性阻塞全仓。

**Scope:** `tools/governance`、governance target summary、allowlist policy。

**Out of scope:** 不修改 feature code。

**Protected contracts:** `pnpm nx run memoflow:governance-check` 的现有检查顺序和输出可读性。

**Implementation:**

1. 添加四类 rule ID；
2. 只对新增 diff fail，历史项 report；
3. provider literal allowlist 仅允许 infrastructure adapter/fixture；
4. message parser allowlist 必须有 retireBy；
5. raw `throw new Error(result.error.message)` 无新豁免；
6. 将 summary artifact 接入 CI evidence。

**Tests:** mutation fixtures；allowlist 过期测试；generated code exclusion。

**Acceptance:** 在当前 main 上 report 稳定；人为新增违规会红。

**Dependencies:** ACR-001。

**Risks:** 噪音使规则失去信任；先限定高置信模式。

## ACR-010 — Introduce JSON-safe PublicFailure primitives

**Status:** Completed on 2026-08-17. `PublicFailure`, strict details schemas, retry hints, operation policy, recovery actions, registry-derived schemas, compatibility envelopes, and JSON-safety tests are implemented without adding a new runtime dependency.

**Goal:** 在 `@memoflow/contracts/result` 引入 category、typed details、failure retry hint 和 typed public failure，并定义 operation retry/recovery boundary，保持现有 wire 兼容。

**Why now:** 所有 feature migration 的共同依赖。

**Scope:** contracts result primitives、schema/validator、exports、unit tests。

**Out of scope:** 不立即删除 `ResultError`、message/context/cause。

**Protected contracts:** `Result<T>`、HttpResponse/IpcResult serialized shape、existing imports。

**Implementation:**

1. 新增 `failure-category.ts`、`failure-retry-hint.ts`、`public-failure.ts`；
2. 定义 per-code typed details、FailureReference 与 JSON-safety restriction；
3. 在 operation contract/patterns seam 定义 `OperationRetryPolicy`、backoff 与 `RecoveryAction`；
4. 为 `Result<T, E>` 增加受约束 generic compatibility；
5. 提供 legacy ResultError → PublicFailure compatibility mapper；
6. serializer 明确排除 cause/Error instance；
7. 更新 subpath exports 和 JSDoc；
8. 添加 compile-time `satisfies`、retry-safety 与 secret-negative fixtures。

**Tests:**

```bash
node node_modules/vitest/vitest.mjs run --config packages/contracts/vitest.config.ts
pnpm nx run contracts:typecheck
pnpm nx run contracts:lint
```

**Acceptance:** 现有 consumers 无 wire break；新 typed Result 可穷尽 code；JSON-safety tests 通过。

**Dependencies:** ACR-002。

**Risks:** TypeScript 泛型传播导致大面积 errors；先使用 default generic 保持兼容。

## ACR-011 — Separate diagnostic failures from public failures

**Status:** Completed on 2026-08-17. New mapping code returns safe public errors and observer/logger-only diagnostics; HTTP/IPC serializers drop causes and unknown IPC errors use a fixed safe message.

**Goal:** cause/stack/provider detail 通过 observer/logger 传递，不再依赖 public ResultError。

**Why now:** provider ACL 和 safe serialization 前必须有内部排障通道。

**Scope:** observer diagnostic API、ResultErrorException bridge、API middleware/http-client logging。

**Out of scope:** 不重做整个 observability pipeline。

**Protected contracts:** ADR-045 trace/request context、ADR-047 single observer、existing log correlation。

**Implementation:**

1. 定义 internal diagnostic input，不放 contracts public exports；
2. mapper 在返回 safe failure 同时 record diagnostic；
3. API global handler 对 unknown error 只返回 safe internal failure；
4. client network cause 留在 local observer，不入 IPC/HTTP envelope；
5. durable receipt builder只接受 PublicFailure；
6. 添加 secret redaction tests。

**Tests:** API middleware、http-client、receipt persistence、trace correlation unit tests。

**Acceptance:** public serialization 不能包含 Error/cause/stack/provider body；trace 仍可定位真实原因。

**Dependencies:** ACR-010。

**Risks:** 诊断信息丢失；先建立 observer tests 再删除旧 cause 路径。

## ACR-012 — Create feature failure registry and projection validators

**Status:** Completed on 2026-08-17. The single-source registry derives code/details/schema and enforces strict detail safety, exact retry hints, complete projections, and complete HTTP policies. Auth will be the first feature registry in ACR-020.

**Goal:** 每个 public code 都有 category、operation、typed details、retry hint、HTTP/IPC/i18n/telemetry coverage，并从一个 registry object 推导。

**Why now:** 防止新 code 再次成为任意 string。

**Scope:** registry schema、validator、governance fixtures；Auth registry 作为首个实例。

**Out of scope:** 不一次登记全仓所有历史 code。

**Protected contracts:** existing code strings during compatibility period。

**Implementation:**

1. 定义 registry schema；
2. 支持 feature-local registry；
3. 验证 code union 与 registry 双向完整；
4. 验证 HTTP policy、i18n key、typed details schema 与 retry hint；
5. 未登记新 code fail closed；
6. legacy code 可登记 alias + retireBy；
7. 从同一 object 推导 code union、Zod schema、HTTP/i18n/telemetry tables；
8. 添加 registry mutation、unknown-code 和 unsafe-retry fixtures。

**Tests:** contracts/governance direct tests；删除 registry row 必须红。

**Acceptance:** Auth 新增 code 时缺任何 projection 都无法通过 CI。

**Dependencies:** ACR-010、ACR-011。

**Risks:** registry 成为第二套手工清单；后续从同一 object 推导 type/schema，禁止平行维护。

## ACR-020 — Map BetterAuth into MemoFlow-owned semantics

**Goal:** BetterAuth code/message 止于 `packages/cloud-auth` adapter。

**Why now:** 修复已复现 P0，并作为目标模式试点。

**Scope:** cloud-auth client/server adapter、Auth failure/outcome contracts、compatibility mapping。

**Out of scope:** 不改变 BetterAuth provider、DB schema、OAuth product policy。

**Protected contracts:** auth routes、cookies/session、email verification security、device authorization、account closure。

**Implementation:**

1. 定义 Auth failure registry；
2. 定义 SignIn/SignUp outcome union；
3. 建立 provider response parser + native exhaustive mapper；
4. invalid credentials 映射 MemoFlow code；
5. email unverified 映射 normal outcome；
6. duplicate signup 以 DB/provider unique 为 authoritative，pre-check 只优化；
7. provider code 仅写 internal diagnostic；
8. 保持 legacy client response compatibility bridge。

**Tests:** BetterAuth in-memory matrix、client mapping、provider-code-negative assertion。

```bash
node node_modules/vitest/vitest.mjs run --config packages/cloud-auth/vitest.config.ts
pnpm nx run cloud-auth:typecheck
pnpm nx run cloud-auth:lint
```

**Acceptance:** cloud-auth public Result/outcome 不含 BetterAuth code/raw message。

**Dependencies:** ACR-012。

**Risks:** BetterAuth 真实 response shape 版本漂移；用 fixture + integration harness 锁定。

## ACR-021 — Establish one Auth application state owner

**Goal:** 登录、注册、验证、forgot/reset 的 operation state、outcome、failure、receipt 只有一个 owner。

**Why now:** provider mapping完成后，必须消除 `useWebAuth`/app-vue/Pinia 双轨。

**Scope:** app-vue auth application state/composables、Web host-specific OAuth/redirect adapter、DI keys。

**Out of scope:** 不强迫 Desktop 与 Web 使用同一个 store 实例；共享的是 application semantics。

**Protected contracts:** Web auth route/scenes、Desktop device flow、password receipt security、test selectors。

**Implementation:**

1. 使用 ACR-R03 批准的 feature-owned typed reducer；
2. 将 login/register/password outcome/failure 归同一 composable/store boundary；
3. Web 只保留 browser redirect/OAuth host adapter；
4. 清除重复 DI key 或明确 host extension；
5. pending verification 由 current outcome 派生；
6. 每次 operation start 清理 incompatible state；
7. receipt 只持久化 safe failure fields；
8. locale message 改 computed projection。

**Tests:** state transitions、unmount/remount、locale change、concurrent submit、secret-negative tests。

```bash
node node_modules/vitest/vitest.mjs run --config packages/app-vue/vitest.config.ts
node node_modules/vitest/vitest.mjs run --config apps/web/vitest.config.ts
pnpm nx run app-vue:typecheck
pnpm nx run web:typecheck
```

**Acceptance:** 一个 operation 不再同时写 local refs 和 Pinia 两套失败真值；raw message 不持久化。

**Dependencies:** ACR-020。

**Risks:** Web/AuthApp 与 main app bootstrap 生命周期不同；通过 host adapter 而非复制 state machine 解决。

## ACR-022 — Make Auth HTTP/IPC/UI semantics parity-complete

**Goal:** Auth outcome/failure 在 server/client/Web/Desktop 具有同一 canonical semantics。

**Why now:** 证明新模型可跨所有边界。

**Scope:** HTTP/IPC projection、Web/desktop consumers、i18n registry、parity fixtures。

**Out of scope:** 不改变 routes/channels。

**Protected contracts:** ADR-048 parity、existing session/cookie/device flow。

**Implementation:**

1. 为 Auth registry建立 HTTP policy；
2. IPC 不携带 HTTP status；
3. Web/Desktop consume同一 outcome/failure union；
4. 全 locale i18n coverage；
5. recovery policy、message registry 与 failure retry hint 分离；
6. unknown/provider failure safe fallback；
7. 添加 locale live retranslation fixture；
8. 添加 provider raw message not rendered fixture。

**Tests:** HTTP/IPC parity、component tests、Web auth contract E2E。

**Acceptance:** 相同 Auth fixture 在 HTTP/IPC 得到相同 code/outcome；只有 HTTP status不同。

**Dependencies:** ACR-021。

**Risks:** Desktop cloud connection有独立状态；只共享语义，不强制相同 UI flow。

## ACR-023 — Replace Auth E2E implicit registration with deterministic fixtures

**Goal:** 通用 login helper 只登录，不根据 UI message 猜数据库状态并自动注册。

**Why now:** 当前一个 Auth 文案回归使多个非 Auth shards 失败。

**Scope:** Web E2E global setup/helpers/test user factory、mail verification fixture。

**Out of scope:** 不删除专门的 signup/verification E2E。

**Protected contracts:** existing test users、test DB isolation、mail capture。

**Implementation:**

1. global setup 通过 API/DB 创建 verified user；
2. fixture 创建使用 deterministic id/email namespace；
3. login helper 对失败立即报告 stable code/trace；
4. 移除 UI 文案驱动注册；
5. signup tests 使用独立新邮箱；
6. parallel shard 用户隔离；
7. teardown清理；
8. suite start 校验 build revision。

**Tests:** auth login/signup/verification、dashboard/shell dependent suites、parallel shard repeat run。

**Acceptance:** 更改错误文案不会触发 fixture 行为变化；非 Auth suites 不再因账号准备失败级联。

**Dependencies:** ACR-022。

**Risks:** DB fixture绕过真实 signup；真实 signup由专门 E2E继续覆盖。

## ACR-030 — Remove Account and Repository message/status leakage

**Status:** Completed on 2026-08-18. Account closure now persists a typed failure code and Repository GitHub HTTP semantics stop at the infrastructure adapter. Evidence: `docs/analysis/2026-08-18-failure-contract-feature-migration-batch-1-review.md`.

**Goal:** Account closure 和 GitHub repository flows 不在 application 中解析 message/provider status。

**Why now:** 两者是 Auth 之外最明确的 provider leakage 证据。

**Scope:** account close use case、repository GitHub adapters/application ports、failure registries。

**Out of scope:** 不改变 account closure saga 或 GitHub permission policy。

**Protected contracts:** closure events/receipts、repository connection/write request/idempotency。

**Implementation:**

1. Account repository/coordinator返回 typed not-found/closure failure；
2. 删除 `message.includes('Account not found')`；
3. GitHub adapter将 401/403/404/413 映射 repository-owned failures；
4. application不 import/inspect provider error status；
5. UI 使用 registry translation/recovery；
6. webhook安全错误保持中性；
7. 添加 provider fixture matrix。

**Tests:**

```bash
node node_modules/vitest/vitest.mjs run --config packages/account/vitest.config.ts
node node_modules/vitest/vitest.mjs run --config packages/repository/vitest.config.ts
pnpm nx run account:typecheck
pnpm nx run repository:typecheck
```

**Acceptance:** Account/Repository application production code无 message/provider-status branch。

**Dependencies:** ACR-023。

**Risks:** 相同 HTTP status在不同 operation语义不同；mapper必须 operation-specific。

## ACR-031 — Replace AI stringly typed failures with typed turn outcomes

**Status:** In progress on 2026-08-18. Server/provider/runtime message branching has been removed and the AI production package has zero failure-message-branch / DomainError findings; client/UI failure ownership closes with ACR-032. Evidence: `docs/analysis/2026-08-18-failure-contract-feature-migration-batch-1-review.md`.

**Goal:** AI turn/stream/host runtime 不再用 `error?: string` 混合 code/message/provider detail。

**Why now:** AI 是 failure protocol 密度最高、跨 runtime 最复杂的区域。

**Scope:** turn engines、assistant facade events、client stream events、UI chat session、provider adapters。

**Out of scope:** 不改变审批 gate、tool schema、model selection 或 conversation persistence。

**Protected contracts:** streaming ordering、proposal approval、thread/conversation identity、cancellation semantics。

**Implementation:**

1. 定义 `TurnOutcome` 和 `TurnFailure` registry；
2. completed/aborted/waiting_approval 作为 outcome；
3. provider unavailable/ownership/internal 等作为 typed failure；
4. provider raw detail止于 gateway；
5. SSE event传 public failure；
6. UI chat item保存 failure而非 errorMessage；
7. abort detection优先 AbortSignal/typed cause，清除 message parser；
8. runtime invariant constants改 typed fault/guard。

**Tests:** direct/readonly engines、SSE fixtures、cancel/approval/retry、UI rendering。

```bash
node node_modules/vitest/vitest.mjs run --config packages/ai/vitest.config.ts
pnpm nx run ai:typecheck
pnpm nx run ai:lint
```

**Acceptance:** AI production public status不再含 arbitrary `error?: string`；stream terminal failure schema稳定。

**Dependencies:** ACR-023。

**Risks:** streaming compatibility；先双读 legacy field，单写新 field，再版本化移除。

## ACR-032 — Eliminate presentation raw-message ownership

**Goal:** app-vue/Web/Desktop presentation不直接展示或持久化任意 `result.error.message`。

**Why now:** provider/application迁移后，UI必须完成消费闭环。

**Scope:** shared translator、repository/settings/auth/AI surfaces、global error boundary、durable receipts。

**Out of scope:** 不重做所有 UI layout。

**Protected contracts:** user-visible recovery、test selectors、receipt request IDs。

**Implementation:**

1. 建立 typed failure translation adapter；
2. UI refs/store保存 failure/outcome；
3. raw message direct assignments迁移；
4. global error boundary区分 programmer crash 与 public operation failure；
5. i18n registry完整性 gate；
6. locale live retranslation；
7. receipt safe schema；
8. raw-message negative render tests。

**Tests:** app-vue/web component tests、locale tests、persistence tests。

**Acceptance:** production UI raw message inventory清零或全部仅用于 internal developer surface。

**Dependencies:** ACR-030、ACR-031。

**Risks:** 某些 provider错误无对应code；先映射 generic feature unavailable/internal，不展示raw message。

## ACR-040 — Pilot DomainFault and operation failures in Task and Goal

**Goal:** 证明 domain fault、application mapper、public failure不需要共享 Error class。

**Why now:** Task/Goal有丰富不变量、并发和跨模块语义，是最有代表性的 domain pilot。

**Scope:** Task complete/update/hierarchy；Goal update/archive/weight/review selected operations。

**Out of scope:** 不一次迁移全部 use case。

**Protected contracts:** optimistic locking、Goal contribution、reliable receipt、existing DTO/route。

**Implementation:**

1. 建立 Task/Goal domain fault unions；
2. 选择 2-3 个 operation定义 outcome/failure；
3. domain不再返回 generic ResultError/HTTP code；
4. application mapper穷尽fault；
5. feature contracts增加typed failure/outcome；
6. HTTP/IPC policy与i18n registry；
7. legacy code compatibility mapping；
8. 禁止新增 DomainError subclass。

**Tests:** domain state tests、mapper table tests、transport parity、UI recovery。

```bash
node node_modules/vitest/vitest.mjs run --config packages/task/vitest.use-cases.config.ts
node node_modules/vitest/vitest.mjs run --config packages/goal/vitest.use-cases.config.ts
pnpm nx run task:typecheck
pnpm nx run goal:typecheck
```

**Acceptance:** pilot operation从 domain 到 UI 无 HTTP/provider/raw message coupling。

**Dependencies:** ACR-032。

**Risks:** fault和public code重复看似增加类型；文档和mapper明确它们不同稳定边界。

## ACR-041 — Migrate Reminder and Schedule operational outcomes

**Goal:** reminder response/snooze、schedule execution/claim/retry 使用 typed outcome/failure。

**Why now:** 这些模块包含用户动作、后台执行和 durable recovery，不能继续用 string error。

**Scope:** selected Reminder response and Schedule execution operations。

**Out of scope:** 不重做 occurrence/outbox 模型本身。

**Protected contracts:** scheduler ownership、claim/lease、notification delivery、execution receipts。

**Implementation:**

1. 定义 Reminder response outcome；
2. snooze/complete/dismiss 失败使用 operation codes；
3. Schedule execution status与failure拆分；
4. persisted last_error只存 safe code/summary，internal cause在observer；
5. worker retry根据 directive/typed category；
6. HTTP/IPC/UI mapping；
7. PowerSync/Prisma parity fixtures。

**Tests:**

```bash
node node_modules/vitest/vitest.mjs run --config packages/reminder/vitest.config.ts
node node_modules/vitest/vitest.mjs run --config packages/schedule/vitest.config.ts
pnpm nx run reminder:typecheck
pnpm nx run schedule:typecheck
```

**Acceptance:** durable state可区分 business failure code、retry state和diagnostic detail。

**Dependencies:** ACR-040。

**Risks:** 持久化 schema兼容；先增加code字段/codec version，不覆盖历史文本直到迁移完成。

## ACR-050 — Classify and shrink contracts by ownership

**Goal:** 为 contracts 551 个文件建立 owner分类，开始从 absolute registry迁向 boundary-first。

**Why now:** 新模式已通过多个feature证明，才能安全迁移中央类型。

**Scope:** contracts inventory、分类manifest、Goal/Task试点、exports/aliases。

**Out of scope:** 不一次移动全部文件。

**Protected contracts:** published subpaths、Zod/OpenAPI schema、RPC maps、durable events。

**Implementation:**

1. 每个contracts文件标记 `wire/public`、`durable`、`domain`、`internal`、`provider`、`legacy`；
2. 自动检查未分类新增文件；
3. Goal/Task选择domain entity interfaces迁回feature；
4. 保留snapshot/command/outcome schema；
5. 增加命名 mapper；
6. compatibility re-export登记retireBy；
7. 收窄root exports；
8. 记录lines/fan-out趋势。

**Tests:** contracts build/typecheck、consumer affected typecheck、wire schema snapshots、package export audit。

**Acceptance:** pilot domain class不再implements wire interface；public subpath兼容；中央domain inventory下降。

**Dependencies:** ACR-041。

**Risks:** import churn巨大；每PR只迁一个语义簇并保持compatibility alias。

## ACR-051 — Align feature tags with vertical-slice reality

**Goal:** Nx package tag和包内分层规则不再互相矛盾。

**Why now:** contracts/feature ownership清晰后再调整graph语义。

**Scope:** project tags、eslint constraints、package-internal AST audit、architecture docs。

**Out of scope:** 不拆分每个feature为四个独立npm package。

**Protected contracts:** current package names/build targets/import paths。

**Implementation:**

1. 引入 `layer:feature` 或等价tag；
2. feature package不再宣称整个包是domain；
3. Nx约束feature isolation；
4. AST audit约束domain/application/transport/infrastructure；
5. composition-only paths显式规则；
6. 移除允许domain→infra的误导性说明；
7. migration一次覆盖所有feature project tags。

**Tests:** Nx graph、eslint fixtures、package internal mutation tests、全workspace lint。

**Acceptance:** package graph表达vertical slice；domain source仍不能import infra；无长期path allowlist。

**Dependencies:** ACR-050。

**Risks:** Nx affected graph变化；在单独PR执行并比较targets/cache行为。

## ACR-060 — Replace cross-feature implementation dependencies with capability ports

**Goal:** Data Portability、Schedule Orchestration、AI等编排只依赖public ports/contracts。

**Why now:** feature ownership和tags稳定后才能收敛跨featuregraph。

**Scope:** verified direct dependencies and host wiring。

**Out of scope:** 不改变业务执行顺序和数据语义。

**Protected contracts:** export/import transaction、schedule projection、AI actions、module lifecycle。

**Implementation:**

1. 为consumer定义所需最小read/write capability port；
2. provider feature或host adapter实现；
3. apps/api/Desktop composer注入；
4. 删除consumer对provider concrete/internal import；
5. parity/object-identity tests；
6. graph inventory确认fan-out下降；
7. architecture surface manifest锁定port/provider/wiring。

**Tests:** affected feature direct tests、API/Desktop composer tests、architecture surface mutation fixtures。

**Acceptance:** Data Portability/Schedule Orchestration/AI application不依赖feature implementation。

**Dependencies:** ACR-051。

**Risks:** 创建过宽“万能port”；坚持consumer-owned最小接口和operation-specific DTO。

## ACR-061 — Enforce single host composition and module identity

**Goal:** API/Desktop/AI executor不重复创建同一feature module/runtime。

**Why now:** ports完成后，host可以成为唯一composition owner。

**Scope:** host composers、module handles、lifecycle/order、AI API/Desktop adapters。

**Out of scope:** 不合并API和Desktop host；它们仍有不同platform adapters。

**Protected contracts:** bootstrap order、start/stop/drain、routes/channels、worker ownership。

**Implementation:**

1. composer显式返回application ports；
   2.跨featureexecutor只消费port；
2. 删除module factory deep construction；
3. object identity tests；
4. start/stop reverse order tests；
5. host-specific adapter共享application executor；
6. single runtime owner/lease policy文档与gate。

**Tests:** API smoke、Desktop main tests、composer identity/surface tests。

**Acceptance:** 每host每feature一个module instance；AI/portability/orchestration不持有第二套lifecycle。

**Dependencies:** ACR-060。

**Risks:** bootstrap顺序改变；先characterization tests，保持registration order。

## ACR-070 — Standardize deterministic test fixtures and semantic assertions

**Goal:** 测试断言 code/outcome/typed metadata，fixture不通过UI文案和隐式副作用准备。

**Why now:** 生产语义迁移完成后，测试应成为长期contract gate。

**Scope:** test-utils、global setup、E2E helpers、contract test conventions。

**Out of scope:** 不重写所有历史测试。

**Protected contracts:** product journey coverage、sharding、test DB isolation。

**Implementation:**

1. 新建fixture API/factory；
2. 稳定账号/实体/verification状态；
3. helper职责单一；
4. error path断言code/category/outcome；
5. 文案只在i18n/presentation tests断言；
6. parallel-safe namespace；
7. retry/flaky evidence分类；
8. test inventory标注contract layer。

**Tests:** repeated sharded Web Flow、API/Desktop integration、fixture cleanup。

**Acceptance:** 修改文案不使domain/fixture tests失败；修改code/mapping会使contract tests失败。

**Dependencies:** ACR-061。

**Risks:** fixtures绕过业务路径；真实用户journey仍保留独立E2E。

## ACR-071 — Make source/build/runtime configuration verifiable

**Goal:** 验收前证明源码revision、Web/API image和环境schema一致。

**Why now:** 防止使用旧/dirty部署验证新代码。

**Scope:** OCI labels、build-info endpoint/meta、compose validation、env schema。

**Out of scope:** 不重做CI/CD平台。

**Protected contracts:** compose file names、health endpoints、secret handling。

**Implementation:**

1. clean build要求revision+dirty flag；
2. API暴露sanitized build identity；
3. Web嵌入build meta；
4. E2E preflight比较expected/web/api revision；
5. mismatch fail fast；
6. 定义local/production env schemas；
7. public/secret/required/forbidden分类；
8. diagnostics artifact记录compose config和revision，不记录secret。

**Tests:** build identity unit、compose smoke、env missing/forbidden fixtures。

**Acceptance:** E2E无法对旧revision继续执行；production-like build拒绝dirty source。

**Dependencies:** ACR-070。

**Risks:** 本地开发需要dirty build；允许显式dev模式，但不得作为验收evidence。

## ACR-080 — Retire DomainError and legacy failure plumbing

**Goal:** 删除混合HTTP/diagnostic的global DomainError和已迁移legacy paths。

**Why now:** 所有主要feature已拥有新语义后再删除旧轨。

**Scope:** utils error hierarchy、ResultError compatibility fields、global status map、aliases。

**Out of scope:** 不删除仍被明确延期feature使用的alias，除非有迁移计划。

**Protected contracts:** current public wire version，直到versioned migration完成。

**Implementation:**

1. inventory剩余subclass；
2. feature-by-feature迁移；
3. transport不读取httpStatus；
4. diagnostics不读取DomainError context；
5. 删除global class/helpers；
6. 收缩ResultError public fields；
7. 删除feature-specific global HTTP map rows；
8. 清理aliases和旧i18n keys。

**Tests:**全仓 typecheck/lint/tests、wire compatibility、governance inventory zero。

**Acceptance:** production不引用`DomainError`；public failure无cause/arbitrary context；旧status map不拥有feature codes。

**Dependencies:** ACR-071。

**Risks:** 隐藏consumer；先把root export标deprecated并用package export audit定位。

## ACR-081 — Close the architecture with fail-closed governance

**Goal:** 将report-only规则升级为全仓fail-closed并冻结目标架构surface。

**Why now:** legacy清零后才能避免永久baseline。

**Scope:** governance target、architecture surface manifest、docs/status updates。

**Out of scope:** 不保留无期限historical allowlist。

**Protected contracts:** governance runtime、CI evidence、mutation test policy。

**Implementation:**

1. message/provider/raw UI rules全量fail；
2. registry/i18n/transport/json-safety全量fail；
3. compatibility allowlist过期fail；
4. architecture surface锁定primitives/ports/mappers/wiring；
5. mutation tests证明每条规则有效；
6. ADR-049状态改为 implemented，并回填全部证据；
7. 计划归档并回填actual evidence。

**Tests:**

```bash
pnpm nx run memoflow:docs-check --skip-nx-cache
pnpm nx run memoflow:governance-check --skip-nx-cache
pnpm typecheck
pnpm lint
```

加上受影响direct Vitest、integration、Web Flow、API smoke、Desktop/local Docker journeys。

**Acceptance:** 新增未登记code/provider leakage/message branch/raw public message会在单次CI中失败。

**Dependencies:** ACR-080。

**Risks:** gate runtime增长；复用inventory、增量扫描和Nx cache，不能降低规则完整性。

## 10. Verification Matrix

| Layer            | 必须验证                                       | 证据                       |
| ---------------- | ---------------------------------------------- | -------------------------- |
| Domain           | fault kind/invariant/state                     | feature domain tests       |
| Application      | fault/port failure → outcome/public failure    | table-driven mapper tests  |
| Provider adapter | provider fixture → MemoFlow semantics          | adapter contract tests     |
| Contracts        | JSON-safe schema/code registry                 | contracts tests/typecheck  |
| HTTP             | status/header/safe envelope                    | API adapter tests          |
| IPC              | same data/code without HTTP leakage            | IPC parity tests           |
| SSE              | ordering + terminal typed failure              | stream integration tests   |
| UI               | code/details → message/recovery; locale change | component tests            |
| Retry executor   | retry hint ∩ idempotency/policy/attempt budget | policy/mutation tests      |
| Persistence      | receipt contains only safe fields              | integration/negative tests |
| E2E              | deterministic journey, no fixture guessing     | Web/Desktop flows          |
| Governance       | violation/mutation causes failure              | governance tests           |
| Deployment       | source=build=runtime revision                  | preflight/smoke artifact   |

## 11. Standard Validation Commands

### Docs and governance

```bash
pnpm nx run memoflow:docs-check --skip-nx-cache
pnpm nx run memoflow:governance-check --skip-nx-cache
```

### Shared foundation

```bash
node node_modules/vitest/vitest.mjs run --config packages/contracts/vitest.config.ts
node node_modules/vitest/vitest.mjs run --config packages/http-client/vitest.config.ts
pnpm nx run contracts:typecheck
pnpm nx run http-client:typecheck
```

### Auth vertical slice

```bash
node node_modules/vitest/vitest.mjs run --config packages/cloud-auth/vitest.config.ts
node node_modules/vitest/vitest.mjs run --config packages/app-vue/vitest.config.ts
node node_modules/vitest/vitest.mjs run --config apps/web/vitest.config.ts
pnpm nx run cloud-auth:typecheck
pnpm nx run app-vue:typecheck
pnpm nx run web:typecheck
```

### Feature migrations

```bash
node node_modules/vitest/vitest.mjs run --config packages/account/vitest.config.ts
node node_modules/vitest/vitest.mjs run --config packages/repository/vitest.config.ts
node node_modules/vitest/vitest.mjs run --config packages/ai/vitest.config.ts
node node_modules/vitest/vitest.mjs run --config packages/task/vitest.config.ts
node node_modules/vitest/vitest.mjs run --config packages/goal/vitest.config.ts
node node_modules/vitest/vitest.mjs run --config packages/reminder/vitest.config.ts
node node_modules/vitest/vitest.mjs run --config packages/schedule/vitest.config.ts
```

需要真实数据库时使用对应 `vitest.integration.config.ts`，串行执行并记录环境前置条件。

## 12. Risk Ledger

| Risk                        | Severity | Containment                                                        |
| --------------------------- | -------- | ------------------------------------------------------------------ |
| wire shape break            | P0       | compatibility serializer + parity fixtures + versioned removal     |
| public code爆炸             | P1       | operation-specific unions，shared只保留category                    |
| mapper样板增多              | P2       | codegen/registry推导，不回退provider leakage                       |
| contracts迁移churn          | P1       | one semantic cluster per PR + compatibility re-export              |
| UI丢失细节                  | P1       | typed details + requestId，internal detail进入observer             |
| diagnostics退化             | P0       | observer evidence先行，negative public serialization tests         |
| E2E fixture绕过业务         | P2       | fixture和真实journey分层保留                                       |
| host wiring回归             | P0       | module identity/lifecycle/bootstrap characterization tests         |
| governance噪音              | P1       | high-confidence rules、AST、到期allowlist                          |
| long migration dual-track   | P1       | 每个alias有owner/retireBy；Phase 7强制清理                         |
| unknown feature code变500   | P1       | category required + registry completeness + safe internal fallback |
| provider升级                | P1       | adapter fixtures/version matrix，application无provider依赖         |
| unsafe automatic retry      | P0       | retry hint 与 operation idempotency/receipt policy 交叉验证        |
| library lock-in             | P1       | library types 不出 boundary；spike + approved usage scope          |
| typecheck/bundle regression | P1       | spike baseline、dependency budget、targeted adoption               |

## 13. Review and Repair Protocol

每个 Phase 完成后进行 batch review，按以下层级检查：

1. **Contract correctness**：code/outcome/schema/status/IPC parity；
2. **Vertical completeness**：provider/domain → application → transport → client → UI；
3. **Behavioral completeness**：success、normal outcome、validation、retry hint/policy、recovery、cancel、unknown；
4. **Engineering quality**：owner、duplication、typing、security、observability；
5. **Plan integrity**：acceptance evidence、实际命令、remaining inventory。

Finding 分级：

- P0：wire/security/data/primary path broken；
- P1：required semantics或boundary bypass；
- P2：robustness/test/maintainability；
- P3：polish。

Repair pass 按根因分组，不按文件数量分组。修复后先运行 narrow tests，再运行 affected packages、
governance、integration和product journey。Green build不能替代行为证据。

## 14. Completion Definition

计划完成必须同时满足：

- [x] ACR-R01/R02/R03 的研究、spike 和 library decision 有实际证据；
- [x] 未批准 library 未进入 production；批准 library type 未成为 contract/durable owner；
- [x] failure retry hint、operation retry policy、recovery action 已在 ADR/标准中分离；
- [ ] Auth、Account、Repository、AI、Goal、Task、Reminder、Schedule 使用 MemoFlow-owned failure/outcome；
- [ ] provider code/status/message 不离开 infrastructure adapter；
- [ ] production message branching 和 raw Result message rethrow inventory 清零；
- [ ] UI 不直接展示/持久化 arbitrary result message；
- [ ] `DomainError` 退役；
- [ ] public failure JSON-safe、typed、registered、localized、transport-covered；
- [ ] normal outcomes 不计为 error；
- [ ] contracts 明确 boundary-first，absolute type centralization 已退役；
- [ ] cross-feature orchestration依赖port并由host装配；
- [ ] feature package tags和包内分层规则一致；
- [ ] E2E fixture deterministic；
- [ ] source/build/runtime revision可验证一致；
- [ ] docs/governance/typecheck/lint/direct tests/integration/product journeys全部有实际证据；
- [ ] 所有compatibility alias和allowlist已删除或有明确、尚未到期的外部阻塞原因；
- [ ] ADR-049状态和本计划归档信息与实际实现一致。
