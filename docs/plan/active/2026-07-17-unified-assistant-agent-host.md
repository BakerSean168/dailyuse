---
tags:
  - plan
  - active
  - ai
  - agent
  - assistant
  - workflow
  - pi
  - cli
description: 统一助手、右侧工作台与可插拔 Agent Host 的详细实施方案
created: 2026-07-17T00:00:00
updated: 2026-07-22T00:00:00
---

# 统一助手与可插拔 Agent Host 实施方案

## 1. 文档地位

本文执行 [ADR-035](../../architecture/adr/ADR-035-unified-assistant-agent-host.md)，承接 Open Design、`earendil-works/pi`、当前 TypeScript AI 模块、Python LangGraph runtime、checkpoint、tool executor 和 Obsidian/GitHub 知识仓库方案的专项调研。

状态：**实施中**（阶段 0/1/2/3/4 部分起步 + AssistantFacade residual 343 + 阶段 6 CustomModelGateway 部分；完成定义未宣称）。

本文描述目标架构和渐进迁移顺序，不把尚未实现的 Capability Resolver、Turn Engine、CLI adapter 或 AgentActivity 描述成当前能力。

### 当前进展（2026-07-22，与 vault plan residual 305–387 对齐）

- **阶段 0 部分已落地（契约冻结）**：
  - `packages/contracts` agent-host：`ITurnEnginePort` / `ICapabilityResolverPort` /
    `IWorkflowAdapterPort` / `IProposalKernelPort` / `IModelGatewayPort` / `IAssistantFacadePort`
    + `resolveRunPlan` / capability kinds 已冻结。
  - stage-0 surface：生产侧允许 `DirectTurnEngine` + `ReadonlyAnalysisTurnEngine` +
    `LangGraphWorkflowAdapter` + `ProposalKernel` + `CapabilityResolver` + `CustomModelGateway` +
    `AssistantFacade`。runtime `buildAgentRuntimeCapabilityOffers` 不静默 emit `engine.*`。
  - ADR-035 journey（capability/turn isolation steps 1–16）+ multi-engine conformance harness
    （`engine.direct_turn` + `engine.langgraph_workflow` 同 suite isolation；**in-suite doubles only**）
    在 vault active plan residual 305/309/311 证据中通过。
- **阶段 1 部分起步（residual 320）**：
  - 生产 `ProposalKernel` 实现 `IProposalKernelPort`；revision 乐观并发 + `requestId` 幂等；
    `executeApproved` 仅 lifecycle receipt，不执行业务 mutation。
  - `module.proposalKernel` 在 direct/remote 均有值；`tool.proposal` providerId=`proposal-kernel`。
  - Host Proposal UI 工作台已部分落地（vault residual 355–371 approve/revise/workbench；
    仍非完整 Artifact 编辑器/全业务面切换）。
- **阶段 2 部分起步（residual 322/324）**：
  - 生产 `CapabilityResolver` 实现 `ICapabilityResolverPort`；fail-closed `resolveRunPlan`；
    不静默 expand `engine.*`。
  - `module.capabilityResolver` 由 runtime offers（+ remote workflow adapter offers）构造。
  - residual 324：`createAgentRuntimeService`/`startRun` knowledge.generate 门禁使用共享 resolver。
- **阶段 3 部分起步（residual 318）**：
  - 生产 `LangGraphWorkflowAdapter` 包装 `IAgentRuntimePort`；`module.workflowAdapter` 在 remote 有值。
  - workflow offers 永不含 `tool.mutation`/`tool.proposal`。
- **阶段 4 部分起步（residual 314/316/341）**：
  - 生产 `DirectTurnEngine`（`engine.direct_turn`）已实现 `ITurnEnginePort`，由 `createAIModule().turnEngine` 暴露。
  - 第二生产 `ReadonlyAnalysisTurnEngine`（`engine.pi_readonly`）经 `CustomModelGateway`；
    `module.readonlyTurnEngine` 接线；不接管 open chat 默认路径。
  - 开放式 chat/analysis only；ownership fail-closed + abort；不自动 emit `engine.*` capability offers。
  - `sendMessage`/`streamMessage` 已经同一 `DirectTurnEngine`（IOpenChatTurnPort）；统一助手 UI 未切换。
- **AssistantFacade 部分起步（residual 343/345）**：
  - 生产 `AssistantFacade` 实现 `IAssistantFacadePort`；`module.assistantFacade` 在 direct/remote 均有值。
  - `message` 默认 DirectTurn open chat；`executionProfileId: pi_readonly` 走 ReadonlyAnalysis。
  - `approve_proposal`/`reject_proposal` 仅 ProposalKernel 生命周期，永不 `executeApproved`。
  - `cancel_run` 中止 primary + readonly + openChat。
  - residual 345：`AIApplicationPort.dispatchAssistant` + `AIAssistantFacadeController` +
    `POST /api/v1/ai/assistant/dispatch/sse`；identityId 仅 auth ExecutionContext。
  - residual 347/353：`AIClientPort.dispatchAssistant` + Web HTTP/SSE + Desktop IPC stream
    （`ASSISTANT_DISPATCH_*`）。
  - residual 349：Vue `useAssistantDispatch` 薄入口。
  - residual 351：open chat 默认发送经 `dispatchAssistant`（live delta + model selection）。
  - residual 355–387：Host 右侧工作台部分落地——Proposal 面板、execution receipt 富回放、
    时间线 Artifact 卡、focus/scroll；仍缺 Task 共用 Artifact、真实 Pi spawn、跨端 multi-engine E2E。
- **阶段 6 部分起步（residual 337）**：
  - 生产 `CustomModelGateway` 实现 `IModelGatewayPort`；结果只回 `modelBindingId`，凭据仅请求作用域。
- **仍未实现 / 仍仅部分（不得勾完成定义）**：
  - 真实 Pi SDK/CLI 进程 adapter 与 product spawn 路径；
  - Host UI 完整 Artifact 富编辑与 Task 共用工作台（Goal/Knowledge Host 路径已部分落地）；
  - 完整 multi-engine runtime E2E 与跨端 Playwright/Electron。
- 更完整的 vault/知识仓库边界与 §13.2 证据见
  [2026-07-16-obsidian-vault-repository-optimization.md](./2026-07-16-obsidian-vault-repository-optimization.md)。

## 2. 目标与非目标

### 2.1 目标

1. 产品只呈现一个统一助手，右侧业务面板成为结构化工作台。
2. 复用现有 LangGraph durable workflow、AgentRun contracts、Provider 配置和 TS Executor。
3. 允许沿不同扩展轴接入：
   - 内置 Turn Engine。
   - Pi 等开源 Agent loop。
   - 用户自定义模型 API。
   - 远程 Agent API。
   - Desktop 本地 Codex、Claude Code、Pi 等 CLI。
4. 保持 UI、业务模块、审批、上下文和副作用边界不依赖具体框架。
5. 通过静态 Port/Adapter 和组合根实现首期可插拔，不先建设插件市场。
6. 在运行时明确能力、数据位置、工具权限和结构化输出要求，禁止危险的静默 fallback。

### 2.2 非目标

- 不在首期替换 Python `ai-service` 或重写现有 LangGraph graph。
- 不采用 Pi coding-agent CLI、默认文件工具、extension 或 RPC 作为产品核心。
- 不承诺在同一个 Run 中无损切换不同 Engine。
- 不允许模型或本地 CLI 直接执行业务 Mutation。
- 不开放任意第三方 JavaScript/TypeScript 插件加载。
- 不实现多 Agent 自主协作、Agent 社交网络或开放式自治任务市场。
- 不把内部 chain-of-thought 暴露给用户。

## 3. 当前基线

### 3.1 已有资产

- `IAgentRuntimePort` 提供 AgentRun 的 start、resume、list、get 和 events 边界。
- `IAgentCheckpointPort` 持久化 AgentRun、AgentState、events 和 interrupts。
- `IAIChatExecutionPort` 抽象 complete/stream，隔离直连 Provider 与 Python service。
- `AgentRun` 已具备 `waiting_clarification`、`waiting_approval` 和 `waiting_execution`。
- `AgentState` 已包含 messages、artifacts、citations、pending/approved/executed actions。
- LangGraph 已实现 Goal 与 Knowledge 的 checkpoint、interrupt 和 resume。
- TypeScript runtime 已实现审批后受控业务执行。
- AI 模块组合根使用显式 dependencies 和 runtime contributions，不依赖全局容器。

### 3.2 当前问题

- UI 同时承担普通 Chat 和多个 workflow 的状态拼装，Conversation 与 AgentRun 的关系不够清晰。
- `direct-provider` 与 `remote-ai-service` 仍以整套运行时模式表达，不能按任务能力组合实现。
- `AICapabilities` 使用不断增长的 `supportsXxx` 布尔值，无法表达数据位置、工具归属和降级限制。
- `AgentAction` 仍是 tool enum 加开放 payload，审批边界类型不够强。
- Workflow、模型调用和 Provider 配置之间仍有重复适配路径。
- 缺少统一 Proposal revision、CapabilitySnapshot、ContextItem 和 ExecutionReceipt。
- 本地 CLI 没有统一 probe、进程、事件、session 和权限 adapter。
- 当前事件中的 `node.started/completed` 带有 LangGraph 实现色彩，不应成为工作台长期 UI contract。

## 4. 产品交互目标

### 4.1 统一助手

用户不选择“Goal Agent”或“Knowledge Agent”。助手根据输入和当前页面判断：

- 直接进行开放式对话或只读查询。
- 要求澄清。
- 启动一个结构化 Workflow。
- 生成 Artifact/Proposal 并在右侧工作台等待用户操作。

高级设置可以选择执行偏好，例如“内置”“自定义 API”“本地 CLI”，但具体 Engine 不是业务导航结构。

### 4.2 中间对话区

负责：

- 用户输入和流式回答。
- 检索、工具活动和失败重试等可验证进度。
- 对工作台 Artifact 的自然语言解释。
- 从开放式对话进入结构化 Workflow。

不负责：

- 展示内部推理文本。
- 承载大型目标草稿、知识笔记正文或复杂审批表单。
- 根据框架原生 node/session 状态渲染 UI。

### 4.3 右侧工作台

负责：

- Goal/KR 草稿、行动计划、知识笔记、Citation 和执行报告。
- Proposal revision 的编辑、确认、拒绝和重新生成。
- waiting/failed/conflict/auth-required 等明确状态。
- 执行结果、实体链接、Git commit 和恢复建议。

工作台宽度是主要生产力空间；中间对话区可以缩小到约 150px 的最小宽度，为结构化任务让出空间。

### 4.4 Conversation 与 AgentRun

- Conversation 是连续的人机交流容器。
- AgentRun 是一次可恢复、可审计的结构化任务。
- 一个 Conversation 可以启动多个 AgentRun。
- 一个 AgentRun 固定一个 Workflow、ResolvedRunPlan 和 CapabilitySnapshot。
- Run 完成后 Artifact 和 ExecutionReceipt 仍可从 Conversation 时间线重新打开。

## 5. 目标架构

```text
Web/Desktop/Mobile UI
        -> AssistantFacade
        -> Daily Use Agent Host
             |- Run Coordinator
             |- Event Journal / Projection
             |- Workflow Registry
             |- Capability Resolver
             |- Context Assembler
             |- Tool Catalog + Tool Policy
             |- Proposal Store
             |- Engine State Store
             `- TS Mutation Executor
                  |
                  |- Workflow Engine
                  |    `- LangGraph adapter
                  |
                  |- Turn Engine
                  |    |- Direct turn adapter
                  |    |- Pi adapter
                  |    |- Remote Agent adapter
                  |    `- Local CLI adapter
                  |
                  `- Model Gateway
                       |- OpenAI/Anthropic
                       `- OpenAI-compatible custom API
```

### 5.1 依赖方向

```text
contracts <- application ports <- Agent Host <- infrastructure adapters
                                                   |- LangGraph HTTP
                                                   |- Pi SDK
                                                   |- Provider SDK
                                                   `- CLI process
```

业务模块只实现 Agent Host 所需的 Query Port 和 Mutation Executor adapter，不依赖任何 AI 框架。

## 6. 稳定公共契约

### 6.1 AssistantFacade

```ts
type AssistantCommand =
  | {
      type: 'message';
      conversationId: string;
      content: string;
      surfaceContext: SurfaceContext;
      executionProfileId?: string;
    }
  | {
      type: 'approve_proposal';
      runId: string;
      proposalId: string;
      revision: number;
    }
  | {
      type: 'reject_proposal';
      runId: string;
      proposalId: string;
      reason?: string;
    }
  | {
      type: 'cancel_run';
      runId: string;
    };

interface AssistantFacade {
  dispatch(command: AssistantCommand, signal?: AbortSignal): AsyncIterable<AssistantEvent>;
}
```

HTTP、SSE 和 Electron IPC adapter 实现同一个 client-side surface。现有细粒度 AI API 可以在迁移期保留，但新工作台不直接编排底层 runtime ports。

### 6.2 AgentProposal

```ts
interface AgentProposal {
  proposalId: string;
  runId: string;
  revision: number;
  kind: 'goal_plan' | 'knowledge_note' | 'task_plan';
  artifacts: AgentArtifact[];
  actions: ProposedAction[];
  preconditions: ProposalPrecondition[];
  capabilitySnapshotId: string;
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: number;
}
```

规则：

- Proposal 发布后不可原地修改；用户编辑产生新 revision。
- 确认绑定 `proposalId + revision`，不能确认“当前最新任意版本”。
- Executor 执行前重新验证 preconditions。
- Provider、Engine、Context 或权限变化不自动修改已发布 Proposal。
- 关键 precondition 失效时，Proposal 进入 stale/conflict，必须重新确认或重新生成。

知识笔记至少包含目标仓库、相对路径、标题、frontmatter、正文、reason、预期 Git HEAD/路径不存在条件；Goal/Task action 至少包含 request ID、依赖顺序和领域校验输入。

### 6.3 ProposedAction 与 ToolCall 分离

Engine 内部 ToolCall 可以使用开放 tool ID 和 JSON Schema；进入审批与 Executor 的 ProposedAction 必须是 Daily Use 维护的 Zod discriminated union。

```ts
type ProposedAction =
  CreateGoalAction | CreateKeyResultAction | CreateTaskTemplateAction | CreateKnowledgeNoteAction;
```

不得把任意外部 CLI 的 JSON 或自然语言直接解释为可执行 action。

### 6.4 ExecutionReceipt

```ts
interface ExecutionReceipt {
  receiptId: string;
  proposalId: string;
  revision: number;
  status: 'completed' | 'partial' | 'failed';
  actions: ExecutedAction[];
  idempotencyKeys: string[];
  references: Array<
    | { kind: 'entity'; module: string; id: string }
    | { kind: 'git_commit'; repositoryId: string; sha: string }
  >;
  completedAt: number;
}
```

### 6.5 AssistantEvent

工作台长期依赖的标准事件应保持小而稳定：

```text
run.started / run.status_changed / run.completed / run.failed
message.delta / message.completed
activity.started / activity.completed
artifact.updated / citation.selected
proposal.ready / proposal.stale
approval.required
execution.started / action.executed / execution.completed
```

LangGraph `node.*`、Pi tool event 和 CLI frame 进入诊断 trace，不作为 UI 必需语义。vendor-specific data 必须命名空间化，UI 不得依赖。

## 7. 执行扩展轴

### 7.1 WorkflowEngine

```ts
interface WorkflowEngine {
  readonly descriptor: WorkflowDescriptor;
  start(input: WorkflowStartInput): Promise<WorkflowYield>;
  resume(input: WorkflowResumeInput): Promise<WorkflowYield>;
}

interface WorkflowYield {
  status: AgentRunStatus;
  statePatch: Partial<AgentState>;
  events: AgentEvent[];
  interrupt?: ClarificationInterrupt | ActivityInterrupt | ApprovalInterrupt | ExecutionInterrupt;
}
```

首个实现是对现有 `IAgentRuntimePort` 的 LangGraph adapter。Host 负责身份、Run projection 和事件归一；adapter 负责 HTTP/HMAC、thread/checkpoint 和 Python schema 映射。

### 7.2 TurnEngine

```ts
interface TurnEngine {
  readonly descriptor: TurnEngineDescriptor;
  run(input: AgentTurnInput, host: CapabilityHost): AsyncIterable<AgentEngineEvent>;
  dispose?(): Promise<void>;
}

interface AgentTurnInput {
  runId: string;
  turnId: string;
  messages: CanonicalMessage[];
  instructions: PromptRecipe;
  context: ContextItem[];
  tools: AgentToolDescriptor[];
  responseSchema?: JsonSchema;
  modelBindingId?: string;
  continuation?: OpaqueContinuation;
  signal?: AbortSignal;
}
```

Turn Engine 不能修改 AgentRun 状态、发布 execution completed 或获得 Mutation adapter。

### 7.3 ModelGateway

```ts
interface ModelGateway {
  readonly descriptor: ModelGatewayDescriptor;
  listModels(): Promise<ModelDescriptor[]>;
  stream(input: CanonicalModelRequest, signal?: AbortSignal): AsyncIterable<ModelEvent>;
}
```

现有 `IAIChatExecutionPort` 作为迁移起点。目标接口使用 `modelBindingId` 或 `CredentialHandle`，不让 Engine 和公共 contract 长期传递明文 API key。

区分：

- OpenAI-compatible endpoint 是 ModelGateway。
- 自带 session/tool loop 的远程 Agent API 是 TurnEngine。
- 本地 Codex/Claude/Pi CLI 是 TurnEngine。

## 8. Capability 与运行计划

### 8.1 CapabilityOffer

```ts
type AgentCapability =
  | 'text.streaming'
  | 'tool.host-managed'
  | 'tool.backend-managed'
  | 'output.json-schema'
  | 'run.abort'
  | 'turn.steering'
  | 'session.native'
  | 'execution.in-process'
  | 'execution.local-process'
  | 'execution.remote';

interface CapabilityOffer {
  capabilities: ReadonlySet<AgentCapability>;
  placement: 'desktop' | 'server';
  dataLocation: 'local' | 'dailyuse-server' | 'third-party';
  toolExecution: 'none' | 'host' | 'backend' | 'hybrid';
  limits?: {
    contextTokens?: number;
    maxParallelTools?: number;
  };
}
```

### 8.2 CapabilityRequirement

Workflow/Profile 声明：

- required、preferred、forbidden capabilities。
- allowed placements/data locations。
- 是否要求 host-managed tools 和 JSON Schema。
- context sensitivity 和最大数据外传等级。

Resolver 返回明确成功或不可用原因。不能因为用户选择的 Engine 不支持某能力而默默换成另一种隐私边界。

### 8.3 ResolvedRunPlan

```ts
interface ResolvedRunPlan {
  planId: string;
  workflowId?: string;
  turnEngineId: string;
  turnEngineVersion: string;
  modelBindingId?: string;
  toolPolicyId: string;
  contextProfileId: string;
  capabilitySnapshotId: string;
  resolvedAt: number;
}
```

Run 开始后固定 plan。配置更新只影响新 Run；继续旧 Run 时如果原 Engine 不可用，明确要求 retry、fork 或选择新的执行配置。

## 9. Tool Catalog 与安全边界

### 9.1 Tool descriptor

```ts
type AgentToolKind = 'query' | 'proposal' | 'mutation';

interface AgentToolDescriptor {
  id: string;
  version: string;
  kind: AgentToolKind;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  risk: 'low' | 'medium' | 'high';
  requiredScopes: string[];
}
```

### 9.2 Scoped CapabilityHost

CapabilityHost 在每个 Run/Turn 创建，并绑定：

- identity/account/profile。
- runId/turnId。
- allowed tool IDs 和 tool versions。
- data scope 与 repository/vault ID。
- ToolPolicySnapshot 和审计 request ID。

Engine 不能通过参数自选 identity、扩大 repository 范围或发现未授权工具。

### 9.3 工具集合

首期 Query 候选：

```text
query_goals
query_tasks
fetch_goal_stats
search_knowledge
fetch_resource_excerpt
list_knowledge_structure
find_related_notes
```

Proposal 候选：

```text
propose_goal_plan
propose_task_plan
propose_knowledge_note
```

Mutation 仅供 Executor：

```text
create_goal
create_key_result
create_task_template
create_reminder
write_vault_file
commit_github_note
```

## 10. Context Assembler

### 10.1 ContextItem

```ts
interface ContextItem {
  id: string;
  kind: 'instruction' | 'page-state' | 'domain-data' | 'retrieved-document';
  content: string | Record<string, unknown>;
  trust: 'system' | 'application' | 'user' | 'untrusted';
  sensitivity: 'public' | 'private' | 'secret';
  tokenEstimate: number;
  provenance: Record<string, string>;
}
```

Context Source 只收集结构化 item，不直接拼接 system prompt。Assembler 负责：

- 授权过滤和数据位置校验。
- 优先级、去重、token budget 和截断。
- Prompt injection 边界标记。
- Provenance 与 Citation 关联。
- 为 Engine 渲染标准 PromptRecipe。

### 10.2 来源

- SystemPolicySource。
- WorkflowPolicySource。
- UserPreferenceSource。
- SurfaceContextSource。
- Goal/Task Query Source。
- LocalVaultIndexSource。
- ServerKnowledgeProjectionSource。

不一次性注入整个 Vault。优先提供目录、标题、标签和摘要，Engine 再通过 scoped query tool 读取必要片段。

### 10.3 Desktop 与 Web

Desktop 可使用本地 Vault 和本地索引；Web 只能使用 GitHub 投影/read model。两端共享 ContextItem contract，但 Source 实现和 CapabilitySnapshot 不同。

## 11. 各类 adapter 设计

### 11.1 LangGraphWorkflowAdapter

首期直接包装现有 `IAgentRuntimePort`：

- `startRun` -> `WorkflowEngine.start`。
- `resumeRun` -> `WorkflowEngine.resume`。
- AgentRunResult -> WorkflowYield/标准事件。
- threadId、checkpoint 和 interrupt 原始 payload 保留在 adapter/engine state store。

不要求第一阶段修改 Python graph。

### 11.2 PiTurnEngine

只复用 `pi-agent-core` 的低层 loop 或稳定 side-effect-free 入口：

- 显式注入 `streamFn`/ModelGateway。
- 只注册 scoped Query/Proposal tools。
- 禁用默认 bash、read/write/edit、extension discovery、AGENTS/CLAUDE context files。
- 不使用 Pi JSONL Session 作为 Daily Use transcript/checkpoint 真值。
- 将 Pi event 映射到标准 AgentEngineEvent。
- Pi continuation 仅作为可丢弃优化。

正式引入前必须解决或隔离当前 `pi-agent-core` 对 `pi-ai/compat` 的静态副作用依赖。

### 11.3 CustomModelGateway

用户配置的 OpenAI-compatible/Anthropic API：

- 使用现有 AIProviderConfig 和加密凭据。
- adapter 负责模型目录、认证、base URL、错误归一、重试和 usage。
- Agent Host/Turn Engine 使用 modelBindingId，不把 API key 写入事件、日志和公共 state。
- 自定义远程地址必须显示数据将发送到第三方的产品提示。

### 11.4 RemoteAgentTurnEngine

对已经提供完整 Agent API 的服务：

- adapter 映射 session、tool call、stream 和 continuation。
- 必须声明 backend-managed/host-managed tools。
- Proposal 必须再次通过 Daily Use schema 校验。
- 远程服务不能直接获得业务 Mutation token。

### 11.5 LocalCliTurnEngine

首个 CLI adapter 可以独立实现，不先抽象通用 Transport。出现第二个稳定实现后再提取：

```text
LocalCliDialect + StdioProcessTransport
```

adapter 负责：

- executable/version/login probe。
- allow-listed 参数和环境变量清理。
- 受限临时工作目录。
- stdout/stderr、JSONL、退出码、超时和 kill tree。
- CLI session ID/continuation。
- 标准事件和 Artifact/Proposal 映射。

首期禁止：

- 把真实 Vault 设为 CLI 工作目录。
- 把 Daily Use/GitHub/Provider token 注入 CLI 环境。
- 允许任意用户命令模板。
- 把 CLI 自带文件写入结果当成已完成业务 Mutation。
- CLI 失败后静默上传本地上下文到云端。

## 12. LangGraph AgentActivity 演进

现有 graph 可以继续直接调用 Provider。新增 Workflow 认知节点最终通过标准 activity 请求 Turn Engine：

```ts
interface AgentActivityRequest {
  activityId: string;
  runId: string;
  purpose: 'classify' | 'research' | 'draft' | 'plan';
  promptRecipe: PromptRecipe;
  contextQuery: ContextQuery;
  toolPolicyId: string;
  responseSchema: JsonSchema;
  requirements: CapabilityRequirement;
}
```

```text
LangGraph checkpoint
  -> activity.required
  -> Host resolves Turn Engine
  -> Engine returns validated ActivityResult
  -> Host resumes LangGraph
  -> Workflow creates Proposal/interrupt
```

Server Engine 可以同步/异步执行。Desktop local CLI 若要参与 Server workflow，需要后续 Activity Lease：

- Server 创建 durable activity。
- 已登录 Desktop claim activity 并获得短期 lease。
- Desktop 在本地执行并提交 schema-validated result。
- lease 超时可以重新 claim，但不能自动重复非幂等操作。
- Workflow 收到结果后 resume。

该能力不进入首期。

## 13. Engine state、恢复与并发

- AgentRun/Proposal/ExecutionReceipt 是产品持久状态。
- Workflow checkpoint 是 Workflow adapter 私有恢复状态。
- Turn continuation 是 adapter 私有优化，不保证跨 Engine 可移植。
- pending tool call 不在崩溃后自动重试，除非工具声明幂等且 Host 有稳定 call ID。
- 同一个 Run 同一时刻只允许一个 active turn/workflow operation。
- Proposal approval 使用乐观并发：revision 不匹配返回 stale。
- Mutation 使用 request ID、proposal revision 和领域 precondition 幂等。
- EventJournal 分配单调 sequence，adapter 原始事件不能直接决定公共 sequence。

## 14. 路由、fallback 与用户偏好

Execution Profile 是用户可选择的产品级偏好：

```text
Auto / Built-in
Custom API
Local CLI (Desktop only)
```

Resolver 同时考虑：

- Workflow requirements。
- 当前 Web/Desktop/Server placement。
- 数据敏感度和允许的 data location。
- Engine probe 和版本状态。
- 用户明确偏好。
- 成本、延迟和模型能力。

规则：

- Auto 只能在同一数据外传边界内 fallback。
- local-only 不能 fallback 到 third-party。
- 需要 host-managed tools 的任务不能选择只支持 backend-managed tools 的 CLI。
- 需要 JSON Schema 的 Proposal 任务不能用无法可靠结构化输出的 Engine。
- fallback 必须写入 ResolvedRunPlan 和用户可见活动记录。

## 15. 安全与隐私

### 15.1 Secret

- 公共 contract 和 Engine event 不包含 API key、OAuth token、GitHub installation token。
- Model/CLI adapter 只获得最小 CredentialHandle 或受控环境变量。
- 日志默认脱敏 request header、CLI env、路径和 prompt 中的 secret。

### 15.2 数据外传

- 每个 ContextItem 携带 sensitivity。
- 每个 Engine 声明 dataLocation。
- Resolver 在请求开始前验证兼容性。
- 用户选择第三方 API 前明确说明上下文会发送到哪里。
- 本地 Engine 失败不自动转云。

### 15.3 Prompt injection

- 检索内容不作为 system instruction。
- Context 中的“调用工具、修改权限、忽略系统规则”只被视为引用内容。
- CapabilityHost 独立验证 identity、scope、schema 和 tool policy。
- Proposal/Executor 再次进行领域校验，不信任 Engine 输出。

## 16. 观测、评测与诊断

每次 Run 至少记录：

- workflow/engine/model binding 和版本。
- CapabilitySnapshot、ToolPolicy 和 ContextProfile ID。
- request/run/turn/activity/tool call ID。
- 标准事件时间线、usage、耗时、重试和取消原因。
- Proposal revision、审批人/时间和 ExecutionReceipt。

诊断 trace 可以保存经过脱敏的 vendor event，但不能让 UI contract 依赖。

评测分层：

- Model Gateway contract tests。
- Turn Engine adapter conformance tests。
- Workflow checkpoint/resume tests。
- Tool policy/security tests。
- Proposal schema/precondition/idempotency tests。
- 端到端统一助手与工作台 tests。
- 同一 eval case 在不同 Engine/Model 上的质量、成本和延迟对比。

## 17. 建议模块形状

目标目录按现有 Clean Architecture 与模块组合模式落地，实际实施时可以根据当前目录微调：

```text
packages/ai/src/server/application/
  ports/
    workflow-engine.port.ts
    turn-engine.port.ts
    model-gateway.port.ts
    context-source.port.ts
    agent-tool.port.ts
  services/
    assistant-facade.ts
    run-coordinator.ts
    capability-resolver.ts
    context-assembler.ts
    tool-policy.ts
    proposal-service.ts

packages/ai/src/server/infrastructure/
  workflow-engines/langgraph/
  turn-engines/direct/
  turn-engines/pi/
  turn-engines/remote-agent/
  model-gateways/

packages/ai/src/electron/
  turn-engines/local-cli/

packages/contracts/src/modules/ai/
  assistant/
  proposal/
  capability/
```

不创建全局 service locator。所有实现通过 `createAIModule()`、API composition root 或 Desktop main composition root 显式注入。

## 18. 实施阶段

### 阶段 0：契约与现状基线

- 固化 ADR-035。 **（已采纳）**
- 为当前 AgentRun/Action/Event 建立 contract tests 和当前行为 fixture。 **（部分：journey + ownership surfaces）**
- 明确 Conversation 与 AgentRun 的关联和恢复路径。 **（部分：现有 AgentRun 模型；统一助手关联未做）**
- 记录当前 direct/remote capability 差异。 **（部分：`buildAgentRuntimeCapabilityOffers` + assert start gate）**
- Agent Host Port 形状冻结（Turn/Workflow/Capability/Proposal）+ 生产侧允许 DirectTurn/LangGraph/ProposalKernel/CapabilityResolver。 **（已证明，residual 305/311/314/318/320/322）**
- multi-engine isolation conformance harness（同 suite 双引擎标签；test doubles only）。 **（部分：residual 309；非生产 adapter）**

### 阶段 1：统一助手与 Proposal Kernel

- 定义 AssistantCommand/Event、AgentProposal、ExecutionReceipt。 **（类型已冻结）**
- 将 AgentAction 逐步收紧为 discriminated union。
- 建立 Proposal revision、stale、precondition 和幂等规则。 **（ProposalKernel residual 320 部分：lifecycle + 幂等；precondition 产品规则仍待）**
- 右侧工作台统一承载 Goal/Knowledge Artifact 与审批。 **（部分：residual 355–387 Host Proposal/receipt/timeline；residual 419–431 task.create lane（live + domain + settle/receipt + AgentType + product toolMode + start 基础）；完整 Task 工作流与富编辑未齐）**
- 保留现有 LangGraph 和 Provider 实现。

### 阶段 2：Host Tool/Context/Capability

- 建立 Tool Catalog、Scoped CapabilityHost 和 ToolPolicySnapshot。
- 将 Query/Proposal 与 Mutation 结构性分离。
- 建立 ContextItem/ContextSource/Assembler。
- 引入 CapabilityOffer/Requirement 和 ResolvedRunPlan。 **（类型 + CapabilityResolver residual 322 部分）**
- 将当前静态 `supportsXxx` 逐步映射到 capability projection。 **（部分：buildAgentRuntimeCapabilityOffers）**

### 阶段 3：Workflow Adapter 收口

- 用 LangGraphWorkflowAdapter 包装现有 `IAgentRuntimePort`。 **（部分：residual 318 生产 class + remote 接线；offeredKinds isolation）**
- Host 统一持久化标准 Run/Event projection。 **（未完成：仍用既有 AgentRun 路径）**
- LangGraph 原生 node/thread/interrupt 留在 adapter 私有状态。 **（部分：adapter 仅委托；原生态未额外投影）**
- 不改写 Python graph 的业务阶段。 **（保持）**

### 阶段 4：首个 TurnEngine

- 使用现有直连 Provider/ChatExecution 实现 DirectTurnEngine。 **（部分：生产 class + module.turnEngine；residual 314）**
- 第二生产 Turn Engine：`ReadonlyAnalysisTurnEngine`（`engine.pi_readonly`，经 Model Gateway；residual 341）。 **（部分：生产 class + module.readonlyTurnEngine；Pi SDK spike 仍开）**
- 验证流式事件、Abort、Context、Tool 和结构化输出契约。 **（部分：abort/ownership/complete 单测；stream/tool schema 未齐）**
- 新的开放式 Chat 经 TurnEngine，不影响业务 Workflow。 **（部分：send/stream 经 DirectTurnEngine/IOpenChatTurnPort；统一助手 UI 未切换）**

### 阶段 5：Pi 只读 Spike

- 固定 Pi 版本并隔离 compat side effect。
- 只接 Query/Proposal 工具和受控 ModelGateway。
- 用知识查询/草稿场景验证 Engine 可替换性。
- 对比 DirectTurnEngine 的质量、延迟、成本和故障行为。
- 未达到 conformance/security 要求则保留为研究结果，不进入产品默认路径。

### 阶段 6：Custom API 与本地 CLI

- 将现有 OpenAI-compatible 配置收敛为 CustomModelGateway。 **（部分：residual 337 生产 `CustomModelGateway` + `IModelGatewayPort` + direct adapters；remote chat 仍可旁路）**
- 实现一个 Codex 或 Claude Code CLI 只读 adapter。
- probe 版本/登录、规范进程生命周期并显示执行限制。
- 验证本地数据不发生未确认云 fallback。

### 阶段 7：Workflow Activity 渐进迁移

- 新 Workflow 的认知节点优先使用 AgentActivityRequest。
- 选一个低风险 LangGraph draft/research 节点做 activity spike。
- 逐步禁止新 graph 直接依赖具体 Provider SDK。
- 评估是否需要 Desktop Activity Lease；无真实跨端需求时不建设。

### 阶段 8：遗留收缩

- 收敛整套 direct/remote runtime mode 分支为按 capability 组装。
- 删除重复 Provider/tool/context adapter。
- 移除 UI 对 framework node 和 runtimeMode 的依赖。
- 在至少两个稳定 CLI/remote transport 实现出现后，再抽公共 Transport。

## 19. 测试矩阵

### 19.1 Contract

- AssistantCommand/Event 向后/跨端解析。
- Proposal revision、编辑、stale 和确认。
- ProposedAction discriminated union。
- Capability requirement/offer 匹配。

### 19.2 Engine conformance

- message delta 顺序和完成语义。
- Abort/timeout/error normalization。
- Tool schema 校验、未知工具和越权工具拒绝。
- JSON Schema 输出失败与 regenerate。
- continuation 丢失后的标准 transcript 恢复。

### 19.3 Security

- Engine 无法看到 Mutation tools。
- identity/repository/vault scope 不可由模型参数覆盖。
- local-only 数据不路由到 third-party。
- CLI env/log 不泄漏 token 和本机敏感路径。
- 恶意笔记不能提升 Capability 或绕过审批。

### 19.4 Workflow

- clarification/approval/execution interrupt 刷新恢复。
- 重复 confirm 不重复执行。
- precondition 变化触发 stale/conflict。
- Engine 不可用时明确失败或 fork，不静默更换。

### 19.5 UI/E2E

- 普通对话流式展示。
- 对话启动 Goal/Knowledge Run。
- 右侧工作台编辑并确认 Proposal。
- Desktop/Web 使用不同 CapabilitySnapshot 得到正确限制。
- CLI 未安装、未登录、版本不支持和进程中断。

## 20. 完成定义

- [ ] 用户只面对统一助手和右侧工作台。 **（部分：residual 343/351 AssistantFacade + open chat dispatch；residual 355–387 Host Proposal/receipt/timeline 工作台部分落地；仍非全业务 Artifact 面）**
- [ ] Conversation 与 AgentRun 有明确、多对一的关联。
- [ ] Workflow、Turn Engine、Model Gateway 是独立 Port。 **（部分：Port 形状 + DirectTurnEngine + LangGraphWorkflowAdapter；Model Gateway 生产 adapter 未齐）**
- [ ] LangGraph 通过 adapter 保留且不泄漏原生状态到 UI。 **（部分：LangGraphWorkflowAdapter 委托 IAgentRuntimePort；residual 413 Host allowlist + residual 415 Goal workflow 诊断展示脱敏；内部 filter 仍可读 node.*）**
- [ ] 至少两个 Turn Engine 通过同一 conformance suite。 **（部分：harness 双标签 isolation + 生产 DirectTurnEngine + ReadonlyAnalysisTurnEngine；完整 multi-engine runtime E2E/Pi SDK 仍缺）**
- [ ] 自定义模型 API 不需要实现完整 Agent runtime。
- [ ] 本地 CLI 不需要伪装成 Model Provider。
- [ ] Run 固定 ResolvedRunPlan 和 CapabilitySnapshot。
- [ ] Query/Proposal 与 Mutation tools 结构性分离。
- [ ] Proposal revision、precondition、审批和 ExecutionReceipt 可审计。
- [ ] 所有业务 Mutation 仍由 TypeScript Executor 调用领域模块。
- [ ] Context 有来源、信任、敏感度和 token budget。
- [ ] local-only 不发生未确认云 fallback。
- [ ] Pi/CLI/Provider 的原生 session、事件和错误不进入公共 contracts。
- [ ] 相关 lint、typecheck、test、E2E、governance 和 prod-like 验证通过。

## 21. 延后决策

以下内容只在出现真实需求后决定：

- 是否开放第三方 Agent 插件 SDK 或插件市场。
- 是否实现 Desktop Activity Lease 让 Server workflow 等待本地 CLI。
- 是否将部分 LangGraph workflow 迁移到 TypeScript。
- 是否允许低风险、可撤销 Mutation 建立长期用户授权后自动执行。
- 是否支持跨 Engine fork 时迁移 provider-native session。

## 22. 相关资料

- [ADR-035: 统一助手与可插拔 Agent Host](../../architecture/adr/ADR-035-unified-assistant-agent-host.md)
- [AI 模块说明](../../product/modules/ai.md)
- [Obsidian Vault 与 GitHub 知识仓库后续优化方案](./2026-07-16-obsidian-vault-repository-optimization.md)
- [AI Agent checkpoint persistence](../../architecture/ai-agent-checkpoint-persistence.md)
- [AI Agent 框架选型方案（历史）](../archive/2026-06-04-ai-agent-framework-options.md)
- [AI Agent runtime 架构方案（历史）](../archive/2026-06-04-ai-agent-runtime-architecture-options.md)
- [earendil-works/pi](https://github.com/earendil-works/pi)
- [nexu-io/open-design](https://github.com/nexu-io/open-design)
