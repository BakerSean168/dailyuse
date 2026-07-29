---
tags:
  - architecture
  - ai
  - path-map
  - elegance
description: AI 运行路径地图——Host open-chat / Workflow AgentRun / legacy message API
created: 2026-07-26T00:00:00
updated: 2026-07-26T00:00:00
---

# AI 运行路径地图

> elegance plan **E4 / C1–C2**。产品 open-chat **不得**回退到 `streamMessage` 双路径。  
> Dual 账本：[`../governance/dual-registry.md`](../governance/dual-registry.md)。  
> 产品 plan：[`../plan/active/2026-07-17-unified-assistant-agent-host.md`](../plan/active/2026-07-17-unified-assistant-agent-host.md)（勿假绿 §20）。

## 三条路径（一眼）

| # | 名称 | 主入口 | 持久化 / 事件 | 产品用途 |
|---|------|--------|---------------|----------|
| **①** | **Host open-chat** | `AIClientPort.dispatchAssistant` → HTTP SSE `/ai/assistant/dispatch/sse` 或 Desktop IPC | 会话消息 + Host 事件（`assistant-run-*` 绑定 **conversation**，**不是** 持久 `AgentRun` 行） | **产品默认聊天**（Web `useAIChatSession` / `useAssistantDispatch` / proposal lifecycle） |
| **②** | **Workflow AgentRun** | `startAgentRun` / `resumeAgentRun` / `listAgentRuns` | 持久 `AgentRun`（可带 `conversationId` 过滤） | Goal/知识工作流、可恢复 run 列表 |
| **③** | **Legacy message API** | `sendMessage` / `streamMessage` | 经典 chat message 流 | **遗留**；仅 adapter/Electron 桥与 **app-react** 工作区；**Vue 产品 open-chat 禁止作为默认发送** |

## ① Host open-chat（主路径）

```text
UI (app-vue)
  useAIChatSession / useAssistantDispatch / hostProposalLifecycle
    → AIChatService.dispatchAssistant
      → AIAssistantHttpAdapter (Web SSE) | AIAssistantIpcAdapter (Desktop)
        → AIAssistantFacadeController.dispatchAssistant
          → AssistantFacade / ProposalKernel
```

**允许调用方（生产）**

| 位置 | 角色 |
|------|------|
| `packages/app-vue/.../useAIChatSession.ts` | open-chat 发送 / cancel / load |
| `packages/app-vue/.../useAssistantDispatch.ts` | Host command 路由 |
| `packages/app-vue/.../hostProposalLifecycle.ts` | approve/reject/cancel proposal |
| `packages/app-vue/.../useAIKnowledgeNoteWorkflow.ts` | 知识笔记工作流可经 Host |
| `packages/ai/src/electron/index.ts` | Desktop IPC 桥到 facade |
| `packages/ai` adapters / controllers / module wiring | 传输与装配（非 UI） |

**禁止**

- 产品 open-chat 默认路径改回 `streamMessage` / `sendMessage`。
- 把 Host `assistant-run-*` 事件当成 `listAgentRuns` 持久行（见 N2 association surface）。

## ② Workflow AgentRun

```text
UI / API
  startAgentRun | resumeAgentRun | listAgentRuns
    → agent-runtime HTTP/IPC adapters
      → AIAgentRuntimeController
        → 持久 AgentRun 存储
```

**允许调用方（生产）**

| 位置 | 角色 |
|------|------|
| `packages/app-vue/.../useAIChatView.ts` | `listAgentRuns({ limit })` 工作流侧栏/最近 run |
| `packages/app-vue` goal/knowledge composables（经 `startAgentRun`/`resumeAgentRun`） | 工作流 |
| `packages/ai/src/electron/index.ts` | IPC list/start/resume |
| server controller + module | 装配 |

**边界（N2）**：`listAgentRuns` ≠ Host open-chat 会话恢复列表；产品「按会话恢复 Host 列表」仍 open（AH-2）。

## ③ Legacy message API

```text
sendMessage / streamMessage
  → AIMessageHttpAdapter | AIMessageIpcAdapter
    → AIChatController
      → chatService
```

**仍存在的生产调用方**

| 位置 | 说明 |
|------|------|
| `packages/app-react/src/hooks/useAIWorkspace.ts` | React 工作区仍走 stream/send（**非** Vue 主产品壳） |
| `packages/ai/src/electron/index.ts` | IPC 仍暴露 message 通道（兼容） |
| `packages/ai` routes/controllers/adapters | 传输层保留 |

**Vue `app-vue` 产品 open-chat**：不得新增对 `streamMessage`/`sendMessage` 的默认发送依赖。

## 调用方审计快照（C2，2026-07-26）

| API | 生产 UI 主用 | 遗留 / 桥 | 测试-only |
|-----|--------------|-----------|-----------|
| `dispatchAssistant` | app-vue Host composables | electron IPC、HTTP/IPC adapters | `*.test.ts` |
| `listAgentRuns` | `useAIChatView`（workflow） | electron、HTTP/IPC | controller tests |
| `sendMessage`/`streamMessage` | **app-react** workspace | electron message 通道、HTTP/IPC | message adapter tests |

死调用方本轮：**无额外 S 删除**（message API 仍被 React + Electron 使用；保留为 ③，不在本 PR 强制摘除）。

## Surface 锁

- 既有 Host dispatch / association / stale-approve surfaces 继续有效。
- Dual Registry path lock：`packages/governance/src/dual-registry-path.surface.spec.ts`。
- 本文件路径可由文档与 residual 引用；产品 open-chat 回归 `streamMessage` 视为 elegance 回归。

## 相关

- [ADR-035](./adr/ADR-035-unified-assistant-agent-host.md)
- [elegance foundation plan](../plan/archive/2026-07-26-codebase-elegance-foundation.md)
- [nightly hygiene](../plan/active/2026-07-25-nightly-hygiene-and-agent-host.md)
