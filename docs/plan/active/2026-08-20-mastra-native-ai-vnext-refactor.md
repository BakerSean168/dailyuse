---
tags:
  - plan
  - active
  - ai
  - agent
  - mastra
  - refactor
description: MemoFlow AI vNext Mastra-native 一次性大重构实施计划
created: 2026-08-20T00:00:00+08:00
updated: 2026-08-20T13:40:00+08:00
---

# MemoFlow AI vNext — Mastra-native 一次性大重构实施计划

## 1. 文档地位

本计划执行：

- [ADR-050](../../architecture/adr/ADR-050-mastra-native-ai-runtime.md)
- [ADR-051](../../architecture/adr/ADR-051-ai-primitive-taxonomy.md)
- [ADR-052](../../architecture/adr/ADR-052-goal-create-reference-workflow.md)

这是 AI runtime 的**唯一 active 重构计划**。旧 Agent Host / LangGraph / Pi 目标态计划已归档，不再作为目标架构约束。

## 2. 实施姿态

本任务采用 **single-branch decisive rewrite**，不是长期双轨迁移：

- 目标架构优先，现有实现只决定迁移成本；
- 允许同一 PR 大范围修改 contracts、server、desktop、Vue、database、docs/tests；
- 不为兼容旧 Agent Host 长期保留 adapter/shim；
- 临时兼容代码只能存在于同一分支的中间 commit，最终 PR 必须删除；
- 不拆成多个长期 PR 让旧/新 runtime 并存；
- 但每个批次仍必须有可运行验证，防止“大改”退化成不可审查的盲改。

最终拓扑：

```text
UI
 -> existing HTTP/IPC host
 -> @memoflow/ai Mastra Runtime
      |- AgentController / Assistant
      |- Workflows
      |- Memory / Storage
      |- ModelResolver
      |- Observability / Eval
      `- typed Domain Tools / Application Ports
 -> Goal / Task / Reminder / Knowledge domains
```

必须消失：Python AI business runtime、LangGraph checkpoint bridge、自研 Turn/Workflow/Capability/Proposal runtime、UI AgentAction DAG orchestration。

## 3. Protected Business Invariants

大重构不保护旧实现，但保护下列已经正确的业务 invariant：

1. authenticated `ExecutionContext.identityId` 是身份真值；客户端不能注入 identity。
2. Goal/Task/Reminder/Knowledge mutation 走各自 Application Port/Use Case，不让 Agent 直写 persistence。
3. Provider credential 加密保存，API key 不进入 client DTO/prompt trace/snapshot。
4. Desktop Local Obsidian Vault 是本地知识 source；Web 不获得 Desktop 绝对路径。
5. 高影响业务 draft 在 apply 前需要明确用户确认。
6. mutation retry 必须幂等，不能因断线/重复 approve 创建重复实体。
7. HTTP/IPC 对同一产品能力保持契约 parity。
8. 现有 deep link（例如 `/goals/:id`）和核心 Goal/Task/Knowledge 产品结果保持可达。
9. business audit/reliable operation 继续由现有 domain/application 体系负责。

## 4. Target Contracts

### 4.1 Assistant

客户端只需要：

```text
send assistant message
cancel active turn
observe message/activity/usage/workflow-link events
```

proposal approve/revise/reject 不再是 Assistant 通用 command。

### 4.2 Workflow

统一 API/IPC：

```text
startWorkflow(kind, input)
resumeWorkflow(runId, command)
getWorkflow(runId)
listWorkflows(conversationId?)
cancelWorkflow(runId)
```

`WorkflowRunView` 只投影产品 UI 需要的状态，不复制 Mastra private checkpoint：

```text
runId
kind
conversationId
status
suspension?
result?
usage?
createdAt/updatedAt
```

### 4.3 Suspension

首期 discriminated union：

```text
clarification_required
goal_draft_review
knowledge_draft_review
task_draft_review
recovery_required
```

resume command：

```text
answer
approve
cancel
edit_structured
revise_natural_language
regenerate
retry
accept_partial
```

## 5. Primitive Map

| Product capability                                 | Primitive                                                     |
| -------------------------------------------------- | ------------------------------------------------------------- |
| open chat / intent routing                         | `MemoFlow Assistant`                                          |
| goal planning reasoning                            | `GoalPlannerAgent` worker                                     |
| `goal.create`                                      | Workflow                                                      |
| `task.create`                                      | Workflow                                                      |
| `knowledge.generate/capture`                       | Workflow                                                      |
| `knowledge.qa`                                     | Assistant + query tools（必要时薄 Workflow）                  |
| `searchKnowledge`, `readGoal`, `readTask`          | query Tool                                                    |
| `ApplyGoalPlan`, `CreateTask`, `SaveKnowledgeNote` | deterministic Application Service / mutation Tool at boundary |
| Goal planning method / note conventions            | Skill                                                         |
| conversation history / stable user preferences     | Memory                                                        |
| selected page/entity/retrieved notes               | Context                                                       |
| large Vault reorganization                         | staging Workspace + Workflow/Agent                            |

## 5.1 Initial Recovery Checkpoint — 2026-08-20

> **Historical recovery snapshot.** 本节记录接管 worktree 时的状态；AI-VNEXT-01/02 已随后闭合，当前事实以 §5.6 为准。

本计划已进入实施，不是纯设计状态。当前仓库证据如下：

**已经落地的 Mastra foundation：**

- `@memoflow/ai` 已引入 `@mastra/core`、`@mastra/memory`、`@mastra/pg`、`@mastra/libsql`；
- `packages/ai/src/server/mastra/models/model-resolver.ts` 已建立 request-scoped BYOK `MastraModelResolver`，credential 只停留在 server-side model config；
- `packages/ai/src/server/mastra/runtime/storage.ts` 已建立 Server PostgreSQL / Desktop LibSQL 两种 storage composition primitive；
- `packages/ai/src/server/mastra/agents/memoflow-assistant.ts` 已建立单一 user-facing `MemoFlow Assistant`；
- `packages/ai/src/server/mastra/runtime/mastra-ai.runtime.ts` 已建立 `Mastra + Memory + AgentController` runtime，并具备基本 stream / abort 投影；
- `identityId -> resourceId`、`conversationId -> threadId` 已在 runtime 内开始按 ADR-050 映射。

**尚未闭合、因此不能宣称 Batch A/B 完成：**

- `mastra/context`、`tools`、`workflows`、`observability`、`evals` 仍为空；
- 旧 `AssistantFacade / CapabilityResolver / TurnEngine / ModelGateway / ProposalKernel / LangGraphWorkflowAdapter` 仍在生产树；
- `AIService*Adapter` 与 Python `apps/ai-service` 仍存在；
- `packages/contracts` 仍以 `AgentRun / AgentState / AgentAction[] / dependsOn[] / AgentResumePayload` 为主要 runtime contract；
- 当前 Mastra runtime 仍把 framework event 投影成带 `engineId/profile` 的旧 `AssistantEvent`，尚未形成 vNext canonical assistant/workflow event envelope；
- `MemoFlow Assistant` 当前没有 domain/query/orchestration tools，尚不能代表完整产品 AI capability；
- 尚无 `goal.create` Mastra Workflow，因此 UI/Host/Python 的旧 workflow ownership 尚未解除。

**恢复结论：** 从 `AI-VNEXT-01` 的 closure 继续，不重启 discovery，不重新设计另一个 runtime。先把 foundation、contract 与 host composition 闭合，再进入 Goal vertical slice；旧 runtime 只允许作为同一重构分支中的暂时迁移面存在。

## 5.2 Canonical Runtime Event / Reconnect Semantics

vNext 不直接把 Mastra private event 透传给 UI。HTTP SSE 与 Desktop IPC 共享一个稳定 envelope：

```text
RuntimeEvent
- eventId
- runId
- conversationId
- sequence
- createdAt
- type
- data
```

Assistant 首期 canonical types：

```text
assistant.run.started
assistant.message.delta
assistant.activity
assistant.usage.updated
assistant.workflow.linked
assistant.run.completed
assistant.run.failed
assistant.run.cancelled
```

Workflow 首期 canonical types：

```text
workflow.started
workflow.suspended
workflow.resumed
workflow.usage.updated
workflow.completed
workflow.failed
workflow.cancelled
```

规则：

1. `sequence` 在单 run 内严格单调递增；UI 不根据 framework callback 到达顺序自行推断状态。
2. Runtime event 是 transport projection，不复制为第二份 workflow checkpoint。
3. 断线重连不要求重放所有 token delta；客户端重新读取 Mastra thread 的 authoritative message history，并查询 `WorkflowRunView` 恢复 durable workflow 状态。
4. unknown event / unknown suspension type 必须 fail closed，显示可恢复错误而不是静默忽略。
5. provider/model/tool 原始 error 先 server-side sanitize，再进入 public event；credential、Authorization header、raw provider request 不得出现在 event。

## 5.3 Cancel / Retry / Resume Semantics

- **Assistant cancel**：终止当前 AgentController run；已完成的 query 无副作用；mutation 不允许由开放 chat 直接无审批执行。
- **Workflow cancel**：停止未来 workflow step，不承诺回滚已经成为 domain fact 的 mutation。
- **Retry**：模型/网络 transient retry 与业务 mutation retry 分开；业务 mutation 只通过 deterministic idempotency key 重试。
- **Resume**：只接受 typed resume command；`identityId` 从 trusted host context 注入并重新校验 run ownership，客户端不得通过 runId 越权恢复他人 workflow。
- **Process restart**：Assistant history 由 Mastra Memory/Storage 恢复；Workflow suspend/resume 由 Mastra snapshot 恢复；不再依赖 MemoFlow 自研 checkpoint bridge。

## 5.4 Product Data / Runtime State Migration Policy

必须区分“用户内容”与“可丢弃 runtime state”：

- `AIProviderConfig`、Conversation shell、Goal/Task/Reminder/Knowledge 等产品事实原样保留；
- 现有 `AiMessage` transcript 属于用户可见内容，**不得因为 runtime 切换静默丢失**；Batch B 必须做一次性、可重复执行的 history import/cutover，使既有 conversation 能在 Mastra thread 中继续读取；cutover 后只允许 Mastra 写 transcript，禁止长期双写；
- `AgentRunCheckpoint`、`LangGraphCheckpoint*`、旧 Proposal/Action runtime state 属于退休执行器的技术状态，可在 Batch F 删除；
- destructive runtime migration 放在全部 vNext journey 验证通过之后执行；PR 合并前的回滚策略是回退整个重构分支，而不是长期保留双 runtime feature flag；
- Mastra Server storage 使用独立 schema/namespace，避免与业务 Prisma table ownership 混淆。

## 5.5 Foundation Closure Gate

进入 `goal.create` 大规模迁移前，`AI-VNEXT-01/02` 必须同时满足：

1. API host 能构造 PostgreSQL-backed Mastra runtime，Desktop host 能构造 LibSQL-backed runtime；
2. `MastraModelResolver` 校验 provider 属于当前 identity，且 provider/model selection 不允许绕过 active/enabled policy；
3. credential serialization / prompt / memory / snapshot / event 泄露测试通过；
4. canonical Assistant + Workflow contracts 已进入 `@memoflow/contracts`，HTTP/IPC 使用同一 schema；
5. Assistant send/stream/cancel/reconnect 至少有 package-level characterization tests；
6. legacy `AgentAction DAG` contract 不再被新 Mastra code 引用；
7. 建立 architecture lock：新代码不得新增 `AIService*Adapter`、LangGraph checkpoint bridge、`TurnEngine`/`ModelGateway` 依赖；
8. `pnpm nx run ai:typecheck`、`ai:test`、`ai:build` 与 contracts focused tests 全绿。

## 5.6 Foundation Closure Checkpoint — 2026-08-20

**AI-VNEXT-01 / AI-VNEXT-02 已完成。** Foundation closure gate 已从“目录/原型存在”推进到有 transport、host composition、security、test/governance 证据的可依赖状态：

- API host 以 PostgreSQL-backed Mastra storage 组装单一 `MastraAIRuntime`；Desktop host 以 profile-local `mastra.db` / LibSQL 组装同一 runtime owner；两端 lifecycle 都等待 `init/dispose`，失败执行 rollback；
- `MastraModelResolver` 只从 authenticated identity 的 provider repository 解析 active provider/model，BYOK credential 不跨 server boundary；
- Assistant 已有 canonical command/event、HTTP SSE/cancel、Desktop IPC start/cancel/event/error 与共享 HTTP/IPC client seam；
- Workflow 已有 canonical start/resume/get/list/cancel contracts、HTTP/IPC request surface 与共享 client seam；**具体 Mastra Workflow implementation 由 Batch C 注册**，在此之前 transport 明确 `SERVICE_UNAVAILABLE` fail closed，绝不回退旧 AgentRun runtime；
- 新 `server/mastra/**` 由 architecture lock 禁止依赖 `AIService*Adapter`、LangGraph checkpoint bridge、`TurnEngine`、`ModelGateway`、`CapabilityResolver`、`ProposalKernel`、`AgentAction DAG`；
- runtime public event 对 provider/model/tool raw error 做 sanitize；credential-shaped serialized event 字段被剥离；旧 `AIServiceInternalClient` request/error 日志也已增加递归 credential redaction，同时真实 request body/HMAC 不变；
- Node contract 对齐 Mastra 1.60.0：engine `>=22.13.0`，本地 `.nvmrc` 对齐 Node 24；
- 新 Desktop composition spec 已纳入 test-system-v2 inventory，治理元数据同步更新。

**Closure evidence：**

- `contracts:typecheck` PASS；`contracts:test` = **68 files / 593 tests PASS**；
- `ai` direct typecheck PASS；`ai:test` = **130 files / 901 tests PASS**；`ai:build` PASS；
- API composition = **12/12 PASS**；API target-equivalent typecheck PASS；
- Desktop composition = **4/4 PASS**；`assets:build` + Desktop target-equivalent typecheck PASS；
- changed-file Prettier check PASS；contracts/ai/api/desktop lint targets均无 error，vNext 新增面 focused lint clean；
- `docs:check` PASS；`governance:check` PASS；test-system-v2 inventory/governance PASS。

**Next owner:** `AI-VNEXT-03 / Batch B — Open chat cutover to Mastra Assistant`。从这里开始，默认 open chat 必须逐步切断 `AssistantFacade -> DirectTurnEngine -> AIServiceChatExecutionAdapter` 路径，并完成 transcript 一次性 import / Mastra authoritative history cutover。

## 6. Implementation Batches

### Batch A — Foundation rewrite: contracts + dependencies + runtime composition

**Goal:** 让 TypeScript repository 原生构建并由 API/Desktop host 装配 Mastra runtime，建立唯一的 Assistant / Workflow cross-boundary language。

**Current status:** **COMPLETED — AI-VNEXT-01/02 closed**，见 §5.6。Batch A 的 runtime composition、canonical Assistant/Workflow transport language、host seams、architecture locks 与验证证据已闭合；具体业务 Workflow implementation 不属于 Batch A。

**A1 — Runtime composition closure**

- finish host-owned PostgreSQL / LibSQL storage wiring and lifecycle (`init/dispose`);
- keep `AIProviderConfigRepository -> MastraModelResolver -> Agent/Workflow` as the only BYOK model path;
- validate identity ownership / active provider / selected model before returning runtime model config;
- keep OpenAI-compatible BYOK as the current product provider contract; do not introduce LiteLLM or a second gateway abstraction in vNext foundation.

**A2 — Contract rewrite**

- add canonical `AssistantCommand/Event`、`WorkflowCommand/RunView/Suspension/ResumeCommand` schemas to `@memoflow/contracts`;
- HTTP/IPC must consume the same schemas and public failure contract;
- replace legacy `AgentRunResult / AgentState / AgentAction DAG` references in newly migrated paths;
- define sequence / reconnect / cancel / error semantics from §5.2–5.3 in contract tests, not only prose.

**A3 — Host integration**

- API composer injects authenticated `ExecutionContext.identityId`, PostgreSQL storage and provider repository into one Mastra runtime owner;
- Desktop composer injects authenticated profile identity, local LibSQL storage and the same model resolution boundary;
- expose Assistant send/stream/cancel and Workflow start/resume/get/list/cancel without exposing Mastra private types;
- verify HTTP/IPC transport parity with shared fixtures.

**A4 — Architecture locks**

- forbid credentials in serialized event/snapshot/context fixtures;
- forbid new production imports of Python AI adapters, LangGraph checkpoint bridge, `TurnEngine`, `ModelGateway`, `CapabilityResolver`, `ProposalKernel` from vNext code;
- keep old code only until its replacement journey is green in the same branch, then delete it in Batch F.

**Delete in same batch where replacement exists:** `ModelGateway`, `TurnEngine`, `CapabilityResolver` public contracts.

**Acceptance:** §5.5 全部满足；focused contract/runtime tests + `ai` typecheck/test/build green；API/Desktop composition smoke green；no credential in serialized runtime event/snapshot。

### Batch B — Open chat cutover to Mastra Assistant / AgentController

**Goal:** 默认聊天不再经过 `DirectTurnEngine` 或 Python service。

**Changes:**

- create single user-facing `MemoFlow Assistant`;
- dynamic model resolution from BYOK config;
- persistent thread/memory binding;
- stream assistant output through existing HTTP/IPC transport projection;
- expose usage/model metadata;
- retain Conversation shell only; remove transcript dual-write once UI load uses Mastra thread history;
- delete `ReadonlyAnalysisTurnEngine` / `pi_readonly` product profile and speculative Pi runtime surface.

**Acceptance:** send/stream/cancel over Web + Desktop; same conversation resumes after process restart using persistent store; no `AIServiceChatExecutionAdapter` wiring.

### Batch C — `goal.create` reference Workflow

**Goal:** 完成 ADR-052 全旅程并成为 vNext canonical pattern。

**Changes:**

- typed `GoalCreateInput`, `GoalPlanningDecision`, `GoalPlanDraft`, suspension/resume commands;
- `GoalPlannerAgent` structured output；clarification max rounds；context loading；
- review suspend/resume；structured edit without LLM；natural-language revision with worker agent；
- `ApplyGoalPlanService` calling Goal/Task/Reminder application ports；
- deterministic idempotency/recovery receipt；
- replace `useAIGoalWorkflow` with thin run projection；
- delete Goal AgentAction construction, dependsOn patching, Host Proposal bridge lifecycle.

**Acceptance journey:** clarification → draft → edit → approve → Goal/KR/task/reminder → deep link；restart resume；double approve idempotent；cancel no mutation；partial retry safe。

### Batch D — Remaining workflow migration

**Goal:** Python graphs no longer own any product AI path。

**Migrate:**

- `task.create` -> typed TaskCreateWorkflow;
- `knowledge.generate` -> KnowledgeCaptureWorkflow with draft review + semantic Knowledge persistence port;
- `knowledge.qa` -> Assistant query capability using knowledge retrieval/context and citations;
- knowledge note generation and analytics query -> Mastra/AI SDK typed worker/tool paths;
- knowledge indexing remains deterministic repository/index service; replace Python-only inference with TS model/embedding path or deterministic fallback as appropriate.

**Acceptance:** all current UI user journeys have a vNext path; no production request to `/internal` Python AI endpoints.

### Batch E — UI/workbench rewrite

**Goal:** Vue 只投影 runtime，不实现 runtime。

**Changes:**

- replace `AgentRunResult` composables with `WorkflowRunView`;
- remove `hostProposalLifecycle` and AgentAction patch helpers;
- workbench renders typed suspension payloads；
- conversation and workflow timeline use server projection；
- usage/token/cost display surface added at conversation/run level；
- HTTP/IPC adapters share schemas and unknown-event fail closed。

**Acceptance:** Vue typecheck/tests + Web journeys；no `pendingActions`, `approvedActions`, `dependsOn` in production UI。

### Batch F — Hard delete legacy runtime and persistence

**Goal:** final tree contains only vNext runtime。

**Delete:**

- `apps/ai-service`；
- Docker/service/env/HMAC configuration for ai-service；
- all `AIService*Adapter`；
- Python runtime/checkpoint/eval scripts that only serve retired runtime；
- `AgentRunCheckpoint`, `LangGraphCheckpoint`, `LangGraphCheckpointWrite` schema + repositories/controllers/routes；
- Agent Host `AssistantFacade`, `ProposalKernel`, `CapabilityResolver`, `TurnEngine`, `WorkflowAdapter`, `CustomModelGateway`；
- old `AgentRun/AgentAction/AgentArtifact` contracts if no longer used；
- old direct-provider/remote-ai-service dual runtime；
- obsolete surface tests/governance rules，replaced with vNext architecture locks。

**Data migration policy:** old execution/checkpoint rows are non-product runtime state and may be dropped by migration；Goal/Task/Reminder/Knowledge/ProviderConfig product rows untouched。

### Batch G — Observability, eval, governance

**Goal:** framework adoption不牺牲治理。

**Changes:**

- Mastra tracing/usage projection；
- token/cost aggregate query for conversation/workflow；
- eval datasets for open chat + goal planning + knowledge answer；
- release gates cover quality/governance/cost/latency；
- architecture surface checks forbid Python AI runtime、AIService adapters、AgentAction DAG、direct persistence from Mastra tools；
- docs current-system map rewritten。

**Acceptance:** eval runner can compare configuration bundles；usage可按 run/thread 查询；governance catches forbidden legacy reintroduction。

### Batch H — Review / repair / delivery

**Goal:** zero known blockers，完整 PR 可合并。

1. focused tests per changed package；
2. `pnpm nx run ai:typecheck` / `test` / `build`；
3. `pnpm typecheck`；
4. `pnpm lint`；
5. `pnpm test`；
6. `pnpm build`；
7. `pnpm docs:check`；
8. `pnpm governance:check`；
9. local Docker build/preflight + AI journey；
10. batch review: contracts / vertical completeness / behavior / ownership / security / diff hygiene；
11. repair P0/P1/P2 findings and rerun narrow + wide gates；
12. commit、push、open PR；
13. wait/check GitHub CI；失败则读取 logs、修复、push、直到 required checks green；
14. PR ready-to-merge only after no unresolved review blocker。

## 7. Ticket Dependency Order

### AI-VNEXT-01 — Adopt Mastra runtime foundation

**Status:** **COMPLETE**（§5.6）。  
**Goal:** TypeScript runtime instantiates Mastra with host-owned storage/model resolution。  
**Files:** `packages/ai/package.json`, `packages/ai/src/server/mastra/**`, API/Desktop composers。  
**Acceptance:** build/typecheck + storage smoke。

### AI-VNEXT-02 — Replace Agent Host contracts

**Status:** **COMPLETE**（§5.6；未迁移旧路径仍暂时保留旧 contract，但所有 vNext execution seam 只接受 canonical Assistant/Workflow contract）。  
**Goal:** new Assistant + Workflow contracts become sole cross-boundary AI execution language。  
**Dependency:** 01。  
**Acceptance:** contracts tests + HTTP/IPC parity tests。

### AI-VNEXT-03 — Cut open chat to MemoFlow Assistant

**Status:** **IN PROGRESS — next active implementation owner**。  
**Goal:** stream/cancel/history/usage via Mastra。  
**Dependency:** 01–02。  
**Acceptance:** Web/Desktop journey。

### AI-VNEXT-04 — Implement GoalCreateWorkflow + ApplyGoalPlan

**Goal:** ADR-052 canonical journey。  
**Dependency:** 01–02。  
**Acceptance:** clarify/review/revise/approve/cancel/retry/idempotency/restart tests。

### AI-VNEXT-05 — Rewrite Goal workbench UI

**Goal:** UI no longer owns workflow state。  
**Dependency:** 04。  
**Acceptance:** composable/component tests + deep link。

### AI-VNEXT-06 — Migrate Task/Knowledge capabilities

**Goal:** all product AI journeys Mastra-native。  
**Dependency:** 03–04。  
**Acceptance:** task/knowledge focused tests and journeys。

### AI-VNEXT-07 — Remove Python/AgentHost legacy

**Goal:** no dual runtime。  
**Dependency:** 03–06。  
**Acceptance:** forbidden-surface grep/governance + full build。

### AI-VNEXT-08 — Observability/eval/release gates

**Goal:** token/cost/quality/governance evidence complete。  
**Dependency:** 03–07。  
**Acceptance:** metrics/eval/governance tests。

### AI-VNEXT-09 — Whole-repo validation + PR

**Goal:** complete delivery。  
**Dependency:** all。  
**Acceptance:** required local gates + GitHub CI green。

## 8. Review Protocol

审查不是确认“能编译”，而是检查：

- **P0:** auth/credential 泄露、重复 mutation、数据损坏、主要 AI path 断裂；
- **P1:** UI 仍拥有 workflow engine、存在双 runtime truth、Agent 直写 persistence、resume 不 durable；
- **P2:** usage/cost 关联缺失、边界 test 缺口、错误/取消/retry 不一致；
- **P3:** 文案/命名/低风险清理。

P0/P1/P2 在 PR ready 前全部修复或有明确不可实施的外部理由；本重构不以“以后再清理”为默认结论。

## 9. Definition of Done

- [ ] ADR-050/051/052 与 current-system docs 同步；
- [ ] Mastra 是唯一核心 Agent/Workflow runtime；
- [ ] Python `apps/ai-service` 退役；
- [ ] open chat Mastra-native；
- [ ] `goal.create` reference workflow 完整；
- [ ] task/knowledge 现有产品 AI 路径迁移；
- [ ] UI 不再维护 AgentAction DAG / double approval；
- [ ] old checkpoint/AgentHost runtime persistence removed；
- [ ] ProviderConfig/BYOK 保留且 credential 不泄露；
- [ ] token/cost/trace + eval/release gates 有证据；
- [ ] Web + Desktop transport parity；
- [ ] full typecheck/lint/test/build/docs/governance green；
- [ ] local Docker AI journey 通过；
- [ ] PR opened and required CI checks green；
- [ ] no unresolved P0/P1/P2 review findings。
