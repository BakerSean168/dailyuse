---
tags:
  - guide
  - development
  - ai
  - chat
  - streaming
description: AI Chat 当前 Mastra-native streaming / history / usage 实现
created: 2026-04-14T00:00:00
updated: 2026-08-22T12:50:00+08:00
---

# AI Chat 当前实现

## 主链路

```text
AIChatView
  → useAIChatView / useAIChatSession
  → AssistantRuntimeClient
     ├─ Web: AssistantRuntimeHttpClient → /ai/runtime/assistant/*
     └─ Desktop: AssistantRuntimeIpcClient → ai:runtime:assistant:*
  → MastraAIRuntime.dispatchMessage
  → Mastra Assistant + thread/memory
```

Python ai-service、legacy message streaming、AssistantFacade/DirectTurn 不再是 chat fallback。

## Streaming

`useAIChatSession` 在发送时创建本地 user/assistant draft，随后只消费 canonical `AssistantRuntimeEvent`：

- `assistant.run.started`
- `assistant.message.updated`
- `assistant.usage.updated`
- `assistant.run.completed`
- `assistant.run.failed`
- `assistant.run.cancelled`

Web 通过 SSE `event: runtime` 传输；Desktop 通过 typed IPC push event。UI 不解析 provider/Mastra 私有 event。

terminal event 后，UI 重新读取 Mastra persisted history，以持久 transcript 覆盖 local draft，从而避免断流/重试造成双写或草稿漂移。

## History / migration

`conversationId` 是产品 thread id。旧 Conversation shell 仍提供产品列表/命名/删除；旧 `AiMessage` 只用于一次性 transcript bootstrap：

1. authenticated identity 验证 owner；
2. 只读旧 transcript；
3. 幂等写入同 id Mastra thread；
4. 写 bootstrap marker；
5. 以后 history 只读 Mastra；
6. 新 turn 不双写旧 message store。

## Cancel

运行时产生 `runId`。Cancel command 只接受 runId；Host 使用 authenticated identity 做 owner check，客户端不能提供 identity。

## Usage / cost

stream 中 `assistant.usage.updated` 提供即时 turn usage。结束后 `RuntimeUsageClient` 按 conversation 查询持久累计值：

```text
POST /ai/runtime/usage { conversationId }
IPC  ai:runtime:usage:get { conversationId }
```

execution log 保存一等 `conversation_id/run_id/request_id/trace_id/provider_id/model`，以及 token/cost；usage query 在 DB predicate 中强制 identity 隔离。

`AIRuntimeUsageBadge` 在聊天头显示累计 token/cost。usage 查询失败是 observability failure，不阻断 chat/history。

## Credential / error safety

- provider API key 只在 server-side resolver；
- raw prompt 不写 execution log，仅记录 `contentLength`；
- raw provider exception 不跨 transport；
- RequestContext 只携带 requestId/traceId/identity 等安全关联信息；
- HTTP requestId 在入口一次产生并原样进入 Mastra execution log。

## 关键文件

- `packages/app-vue/src/modules/ai/composables/useAIChatSession.ts`
- `packages/ai/src/client/runtime-assistant.ts`
- `packages/ai/src/client/runtime-usage.ts`
- `packages/ai/src/api/routes/ai-runtime.routes.ts`
- `packages/ai/src/electron/index.ts`
- `packages/ai/src/server/mastra/runtime/mastra-ai.runtime.ts`
- `packages/ai/src/server/mastra/runtime/assistant-observability.ts`
