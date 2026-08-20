---
tags:
  - architecture
  - ai
  - path-map
  - mastra
description: AI vNext 运行路径地图——Mastra open chat / canonical Workflow / transitional legacy paths
created: 2026-07-26T00:00:00
updated: 2026-08-20T14:10:00+08:00
---

# AI 运行路径地图

> ADR-050 / AI-VNEXT-03。**产品默认 open chat 只允许走 Mastra Assistant runtime。**
> `AIClientService.dispatchAssistant`、`DirectTurnEngine`、`pi_readonly` 和 classic
> `streamMessage/sendMessage` 都是迁移中的 legacy surfaces，不得成为 open-chat fallback。

## 当前四条路径

| #     | 路径                             | 主入口                                                                           | Authority                          | 当前用途                                             |
| ----- | -------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------- |
| **①** | **Mastra open chat**             | `AssistantRuntimeClient` → `/ai/runtime/assistant/*` 或 `ai:runtime:assistant:*` | Mastra Thread / Memory             | **Web + Desktop 默认聊天**                           |
| **②** | **Canonical Workflow**           | `WorkflowRuntimeClient` → `/ai/runtime/workflow/*` 或 `ai:runtime:workflow:*`    | Mastra Workflow runtime            | vNext Goal/Knowledge/Task workflow；具体实现逐批迁移 |
| **③** | **Legacy Agent Host / AgentRun** | `dispatchAssistant`, `startAgentRun`, `resumeAgentRun`                           | legacy Host / AgentRun persistence | 尚未迁移的 Goal/Knowledge workflow 与兼容面          |
| **④** | **Legacy message API**           | `sendMessage` / `streamMessage`                                                  | `AiMessage` / legacy chat service  | 非 vNext 调用方与待删除兼容面                        |

## ① Mastra open chat — 唯一默认聊天路径

```text
app-vue useAIChatSession
  → AI_ASSISTANT_RUNTIME_KEY
    → Web: AssistantRuntimeHttpClient
       → POST /ai/runtime/assistant/history
       → POST /ai/runtime/assistant/delete
       → POST /ai/runtime/assistant/sse
       → POST /ai/runtime/assistant/cancel
    → Desktop: AssistantRuntimeIpcClient
       → ai:runtime:assistant:history
       → ai:runtime:assistant:delete
       → ai:runtime:assistant:start + push event
       → ai:runtime:assistant:cancel
          → MastraAIRuntime
            → MemoFlow Assistant
            → Mastra Memory / Thread
```

### Cross-boundary contract

- client command 不携带 `identityId`；Web auth / Desktop authenticated IPC 注入 identity；
- `identityId -> resourceId`；`conversationId -> threadId`；
- BYOK model selection 只携带 `providerId/modelId` 标识，credential 留在 server-side resolver；
- runtime event 只暴露 canonical `assistant.*` event，不暴露 Mastra private snapshot / provider raw error；
- cancel 使用 runtime 产生的 `runId`，并由 server 以 authenticated identity 做 owner check；
- usage 通过 `assistant.usage.updated` 投影；model metadata 通过 canonical run-start metadata 投影；
- stream 结束后 UI 重新读取 Mastra persisted history，以持久化 transcript 覆盖 local draft。

### Transcript cutover

旧 Conversation aggregate 暂时只保留 shell（id/name/list/delete 等产品壳能力）。第一次访问旧 conversation 时：

1. `ConversationTranscriptBootstrapSource` 先用 authenticated identity 验证 ownership；
2. 只读提取现有 `AiMessage` transcript；
3. 使用旧 message id 幂等 upsert 到同 id Mastra thread；
4. 成功后在 thread metadata 写 `memoflowTranscriptBootstrapVersion` marker；
5. marker 存在后永远不再读取旧 transcript；后续 history 只读 Mastra Memory；
6. 新 open-chat message **不双写 `AiMessage`**；
7. 删除 conversation 时先 owner-scoped 删除 Mastra thread，再删除 legacy shell。若 shell delete 失败，仍可由保留的 shell/transcript 重新 bootstrap；不会留下不可见的 Mastra orphan。

这使中断重试保持幂等，并允许进程重启后直接从 Mastra storage 恢复同一 conversation。

### 禁止

- 默认聊天回退 `AIClientService.dispatchAssistant` / `AssistantFacade`；
- 默认聊天进入 `DirectTurnEngine` 或 Python `AIServiceChatExecutionAdapter`；
- UI 暴露 `direct_turn` / `pi_readonly` execution-profile selector；
- client 自造 Host runId；
- history 从 legacy `listMessages` 读取；
- transcript 同时写 Mastra + `AiMessage`；
- provider API key、Mastra private snapshot、raw provider exception 跨 transport。

## ② Canonical Workflow

```text
WorkflowRuntimeClient
  → workflow start / resume / get / list / cancel
    → AIWorkflowRuntimePort
      → concrete Mastra Workflow runtime
```

Transport contract 已在 AI-VNEXT-02 固定。未注册具体 Workflow runtime 时必须
`SERVICE_UNAVAILABLE` fail closed，**不得自动回退 AgentRun**。`goal.create` 是第一条参考实现。

## ③ Legacy Agent Host / AgentRun

`dispatchAssistant`、`AssistantFacade`、`ProposalKernel`、`startAgentRun/resumeAgentRun`
暂时服务尚未迁移的 Goal/Knowledge/Task workflow。它们不再是 open-chat architecture。

迁移约束：

- 新 `server/mastra/**` 不得依赖旧 Host / LangGraph / TurnEngine；
- legacy workflow 每迁移一条，即从该调用链删除对应 client/server surface；
- `listAgentRuns` 不能作为 Mastra open-chat history authority。

## ④ Legacy message API

`sendMessage/streamMessage` 与对应 HTTP/IPC adapters 仍可能有非 vNext 调用方，但 Vue
默认 open chat 禁止调用。其 Python-backed chat adapter 已从 API/Desktop 默认 composition 移除。

## Surface locks

- `use-ai-chat-host-dispatch.surface.spec.ts` 锁定 Mastra-only default chat；
- `mastra-vnext-architecture.surface.spec.ts` 锁定新 runtime 不反向依赖 legacy Host；
- Assistant HTTP/IPC/client parity tests 锁定 auth injection、history、delete、stream、cancel；
- transcript bootstrap + real LibSQL restart tests 锁定一次性迁移和 restart recovery。

## 相关

- [ADR-050 — Mastra Native AI Runtime](./adr/ADR-050-mastra-native-ai-runtime.md)
- [ADR-051 — AI Primitive Taxonomy](./adr/ADR-051-ai-primitive-taxonomy.md)
- [AI vNext active plan](../plan/active/2026-08-20-mastra-native-ai-vnext-refactor.md)
