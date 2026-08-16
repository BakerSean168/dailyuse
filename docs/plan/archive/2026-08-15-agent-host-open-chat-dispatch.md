---
tags:
  - plan
  - active
  - ai
  - agent-host
  - open-chat
  - sse
  - electron
description: Agent Host open chat dispatch 主路径的契约收口、跨端加固与兼容回退实施计划
created: 2026-08-15T00:00:00Z
updated: 2026-08-15T00:00:00Z
---

# Agent Host open chat dispatch 收口计划

## 1. 文档地位与结论

本计划执行 [ADR-035](../../architecture/adr/ADR-035-unified-assistant-agent-host.md)，承接
[`2026-07-17-unified-assistant-agent-host.md`](./2026-07-17-unified-assistant-agent-host.md)
中 residual 343/345/347/349/351，并把 residual 353 的 Desktop IPC stream 一并纳入同一切片。

基于 `main@5bb17b232daf` 的代码盘点，以上 residual **已经名义落地**：Facade、应用端口、HTTP
SSE、Web/Desktop client adapter、Vue 薄入口以及 open chat 默认 dispatch 均已存在。因此下一切片不是
重复创建这些 surface，而是冻结跨端契约、补齐行为证据、让 Vue 真正复用薄入口、修正 Desktop
surface，并为旧 Server/Desktop host 提供不会造成重复发送的窄兼容回退。

本计划只定义后续实现，不把当前名义接线等同于父计划 §20 的完整完成定义。

## 2. 目标与非目标

### 2.1 目标

- [x] 冻结 `dispatchAssistant` 的请求、`AssistantEvent`、终止结果、HTTP SSE 和 Desktop IPC
      契约；跨边界 payload 均由共享 runtime schema 校验。
- [x] 保持 open chat 默认发送经 `dispatchAssistant` → `AssistantFacade` →
      `DirectTurnEngine`，逐 delta 更新当前 assistant draft，并在完成时以持久消息替换 draft。
- [x] 将模型选择稳定映射为 `providerId + model`，Web 与 Desktop 均传递真实 `surface`。
- [x] 让 `useAIChatSession` 通过 `useAssistantDispatch` 薄入口发送，不再直接依赖 service 的
      dispatch 细节。
- [x] 补齐 server route、Web SSE、Desktop IPC main/renderer 和 Vue chat session 的行为测试，保留
      ADR-035 双 Turn Engine conformance 证据。
- [x] 当旧部署明确不支持 dispatch，open chat direct-turn 可回退现有 `streamMessage`；一旦 dispatch
      可能已经执行，则禁止重试旧路径，避免重复持久化消息。
- [x] 保持 host-composition：API/Electron transport 只绑定 composition root 创建的同一个 AI
      instance，不在 transport 内创建数据库、repository、配置或第二个 runtime。

### 2.2 非目标

- [x] 不实现完整 Artifact 编辑器或 Task/Goal/Knowledge 共用的完整右侧工作台。
- [x] 不接入或 spawn 真实 Pi SDK/CLI；`pi_readonly` 继续使用现有受控 Turn Engine。
- [x] 不新增 Web ↔ API ↔ provider 或 Electron ↔ main ↔ provider 的跨端 E2E；本切片仅做分层行为
      测试与人工 smoke。
- [x] 不实现 Conversation ↔ AgentRun/Host run 的持久多对一恢复模型。
- [x] 不改变 ProposalKernel 的审批/执行边界，不让 approve 自动执行业务 mutation。
- [x] 不删除 legacy `sendMessage`/`streamMessage`，也不迁移 app-react 的遗留调用方。
- [x] 不宣称父计划的统一助手、完整 multi-engine E2E、完整 Artifact 或全部 §20 已完成。

## 3. 当前状态盘点

### 3.1 Residual 与真实缺口

| Residual            | 当前已有实现（`main@5bb17b232daf`）                                                                                                                                                                                                                                                                                                                                                                                                                    | 仍需收口的缺口                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 343 Facade          | `AssistantFacade.dispatch` 已分派 `message`、proposal lifecycle 和 `cancel_run`；direct turn 已流式转发 delta（`packages/ai/src/server/infrastructure/assistant-facade/assistant.facade.ts:38`、`:47`、`:87`、`:150`）                                                                                                                                                                                                                                 | 不重写 Facade；冻结成功/错误/abort 事件序列并让 transport/client 以共享 schema 验证                                                                                                                         |
| 345 Server dispatch | `AIApplicationPort.dispatchAssistant` 已存在（`packages/ai/src/server/application/ai.application.port.ts:185`），module implementation 迭代 Facade 事件（`packages/ai/src/server/infrastructure/ai.module.ts:567`），controller 注入可信 identity（`packages/ai/src/server/transport/ai-assistant-facade.controller.ts:136`），SSE route 已挂载（`packages/ai/src/api/routes/ai-assistant.routes.ts:22`、`packages/ai/src/api/module.ts:252`、`:300`） | request schema 仍定义在 controller；result 是匿名 `{ eventCount }`；route 没有 focused behavioral test                                                                                                      |
| 347 Web client      | `AIClientPort.dispatchAssistant` 和 `AIClientService` 委托已存在（`packages/ai/src/application-client/ai-client.port.ts:100`、`packages/ai/src/application-client/ai-client-service.ts:222`）；HTTP adapter 解析 `assistant/error/done`（`packages/ai/src/infrastructure-client/adapters/http/ai-assistant-http.adapter.ts:18`）                                                                                                                       | `JSON.parse(...) as ...` 未做 runtime contract validation；缺 dispatch-unavailable 的稳定错误分类与 guarded fallback                                                                                        |
| 353 Desktop client  | IPC channels 已冻结为 `ASSISTANT_DISPATCH_*`（`packages/contracts/src/electron/ipc-channels.ts:172`、`:188`）；renderer adapter 已做 streamId 过滤/cleanup（`packages/ai/src/infrastructure-client/adapters/ipc/ai-assistant-ipc.adapter.ts:24`）；main handler 已注册 start/cancel（`packages/ai/src/electron/index.ts:389`）                                                                                                                         | push payload 仍靠 cast；main handler 没有 focused lifecycle 行为覆盖；需验证 sender ownership、listener cleanup、abort 与缺 handler 分类                                                                    |
| 349 Vue entry       | `useAssistantDispatch` 已存在并导出，提供 message/proposal/cancel 薄方法（`packages/app-vue/src/modules/ai/composables/useAssistantDispatch.ts:16`、`:69`）                                                                                                                                                                                                                                                                                            | open chat 未使用该入口；文件注释仍声称默认路径未切换（`:2`–`:6`）；默认 `surface: 'web'`（`:84`）不适用于 Desktop                                                                                           |
| 351 Open chat       | `handleSendChat` 已默认调用 `loadService.dispatchAssistant`（`packages/app-vue/src/modules/ai/composables/useAIChatSession.ts:294`、`:337`），消费 `message.delta`（`:386`）和 `message.completed`（`:396`），并传递 `providerId/model`（`:348`–`:349`）；model selection 已按会话持久（`packages/app-vue/src/modules/ai/composables/useAIModelSelection.ts:14`）                                                                                      | 调用绕过薄入口；`surface` 硬编码为 Web（`:344`）；异常只标记 draft error（`:463`），没有旧 host 的兼容回退；现有锁主要是源码文本测试（`use-ai-chat-host-dispatch.surface.spec.ts`）而非 composable 行为测试 |

### 3.2 组合根现状与约束

API composition root 先调用 `createAIModule(...)`，再把所得 instance 传给
`createAIApiModule({ instance })`（`apps/api/src/runtime/compose-ai.ts:186`–`:209`）。Desktop 同样先创建
instance，再调用 `createAIElectronModule({ instance })`
（`apps/desktop/src/main/runtime/compose-ai.ts:130`–`:152`）。`packages/ai/src/api/module.ts:199`–`:202`
基于该 instance 的 handlers 创建 assistant controller。

后续实现必须保持这一 ownership：

```text
API host                         Desktop host
createAIModule(dependencies)     createAIModule(dependencies)
  -> instance                     -> instance
  -> createAIApiModule             -> createAIElectronModule
       ({ instance })                  ({ instance })
  -> HTTP SSE route                -> IPC start/event/done/error
```

- [x] `registerAIAssistantRoutes`、controller 和 Electron handlers 不创建第二个 AI module。
- [x] 新配置（例如 rollout policy）由 host composition 显式传入 client factory，不从 package 内部读取
      全局环境变量。
- [x] route/IPC lifecycle 随所属 instance start/dispose，不引入 module-global singleton。

### 3.3 测试现状

已有 focused evidence 包括：

- `packages/ai/src/server/infrastructure/assistant-facade/__tests__/assistant.facade.spec.ts`
- `packages/ai/src/server/transport/__tests__/ai-assistant-facade.controller.spec.ts`
- `packages/ai/src/infrastructure-client/adapters/http/ai-assistant-http.adapter.test.ts`
- `packages/ai/src/infrastructure-client/adapters/ipc/ai-assistant-ipc.adapter.test.ts`
- `packages/app-vue/src/modules/ai/composables/useAssistantDispatch.spec.ts`
- `packages/app-vue/src/modules/ai/composables/use-ai-chat-host-dispatch.surface.spec.ts`
- `packages/ai/src/server/infrastructure/runtime/__tests__/adr-035-multi-engine-turn-conformance.harness.spec.ts`
- `packages/ai/src/server/infrastructure/runtime/__tests__/adr-035-production-multi-engine-host.journey.spec.ts`

明显缺口是 `ai-assistant.routes.ts` 行为测试、Electron main dispatch lifecycle 测试和 open-chat
composable 行为测试。源码字符串 surface 只作为架构护栏，不能替代流式状态测试。

## 4. 契约冻结（PR 0，先于 A–D）

### 4.1 共享类型与 runtime schema

**涉及文件**：

- `packages/contracts/src/modules/ai/agent-host/ports.ts`
- `packages/contracts/src/modules/ai/agent-host/assistant-dispatch.ts`（新增）
- `packages/contracts/src/modules/ai/agent-host/index.ts`
- `packages/contracts/src/modules/ai/agent-host/assistant-dispatch.contract.spec.ts`（新增）
- `packages/ai/src/server/transport/ai-assistant-facade.controller.ts`
- `packages/ai/src/application-client/ports/ai-api-client.port.ts`
- `packages/ai/src/application-client/ai-client.port.ts`

冻结并公开以下唯一契约；禁止 server、HTTP adapter、IPC adapter 各自维护第二份 shape：

| 名称                            | 冻结内容                                                                                                                                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AssistantClientCommandSchema`  | discriminated union；message 必含 `conversationId/content/surface`，可含 `runId/executionProfileId/providerId/model`；proposal/cancel 保持现状；body 出现 `identityId` 必须 validation failure，而不是忽略 |
| `AssistantEventSchema`          | 覆盖现有 `run.started`、`message.delta`、`message.completed`、proposal lifecycle、`run.cancelled`、`error`；对象的新增可选字段向后兼容，但未知 `type` 必须 protocol failure                                |
| `AssistantDispatchResultSchema` | `{ eventCount: nonnegative integer }`；类型名固定为 `AssistantDispatchResult`，替换各层匿名对象                                                                                                            |
| `AssistantDispatchHandlers`     | `{ onEvent?, onDone? }` 的命名 client 类型，供 port、service 与两个 adapter 共用                                                                                                                           |

- [x] schema 与 TypeScript 类型只保留一个推导源；如需兼容现有类型引用，保留 type re-export，不复制
      union。
- [x] 所有新增 public export 写 English-first、中文-second 的双语 JSDoc。
- [x] `identityId` 只存在于 server-side `AssistantCommand`，HTTP auth context 和 Desktop authenticated
      context 注入；client command 永远不携带。
- [x] payload 解析失败统一为 `ASSISTANT_PROTOCOL_ERROR`（或仓库已冻结的等价 code），且绝不触发
      legacy fallback。

### 4.2 Open-chat message request

wire request 维持当前形状：

```ts
type AssistantOpenChatCommand = {
  type: 'message';
  conversationId: string;
  content: string;
  surface: 'web' | 'desktop' | 'server';
  runId?: string;
  executionProfileId?: 'direct_turn' | 'pi_readonly';
  providerId?: string;
  model?: string;
};
```

- `executionProfileId` 缺省等价 `direct_turn`。
- `providerId` 与 `model` 原样来自当前 `ChatModelOption`；fallback 也必须原样映射到
  `SendMessageReq`，不得重新选择默认模型。
- `surface` 是调用 host 的事实标签：Web 提供 `web`，Desktop renderer 提供 `desktop`；共享 Vue
  composable 不自行猜测平台。
- `runId` 保持可选以兼容既有调用方；产品 open chat 继续预生成它，以支持 stop/cancel 和安全回退
  的事件关联。

### 4.3 AssistantEvent 与顺序

本切片**不新增** provider-native、SSE-native 或 fallback-specific 的公共事件。live delta 与 dispatch
事件已经由现有 contract 表达，本轮将其冻结为：

| 事件                | 语义与不变量                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `run.started`       | Host 接受运行；含 `runId/engineId/profile`，open chat 有非空 conversation 时带 `conversationId`              |
| `message.delta`     | 仅含 Host-normalized 文本增量；同一 run 按到达顺序追加，不携带 provider chunk                                |
| `message.completed` | 产品 terminal event；含 status，可带最终 content 与持久化 user/assistant message；一个成功 dispatch 至多一次 |
| `error`             | 产品/Facade 事件，属于 `AssistantEvent`；与 transport SSE `event: error` 严格区分                            |

成功的真实 Host open-chat 顺序固定为：

```text
run.started -> message.delta* -> message.completed -> transport done
```

Facade 业务拒绝可表现为 `AssistantEvent.error -> transport done`；controller/transport 失败表现为 transport
`error` 后关闭，不能再发送 `done`。abort 不能补发成功 terminal。proposal 和 cancel 事件保持现有语义，
不在本切片扩展。

legacy compatibility adapter 只在确认 Host **未开始**后运行，可投影 `message.delta*` 与
`message.completed`；它不伪造 Host `run.started`，也不增加 `fallback.started`。fallback 命中只能通过内部
log/metric 观察，不能污染公共事件 union。

### 4.4 HTTP SSE 与 Desktop IPC

HTTP 路径和事件名冻结如下：

- `POST /api/v1/ai/assistant/dispatch/sse`
- `Content-Type: text/event-stream`
- `event: assistant` + `data: AssistantEvent`
- `event: error` + `data: { code, message, details? }`
- `event: done` + `data: AssistantDispatchResult`

Desktop 名称冻结如下：

- invoke：`AIChannels.ASSISTANT_DISPATCH_START`、`AIChannels.ASSISTANT_DISPATCH_CANCEL`
- push：`AIStreamChannels.ASSISTANT_DISPATCH_EVENT`、`ASSISTANT_DISPATCH_DONE`、
  `ASSISTANT_DISPATCH_ERROR`
- 所有 push payload 必含 `streamId`；renderer 只消费自己 streamId 的 payload。

HTTP 与 IPC 都以一个 `assistant`/`EVENT` frame 承载一个完整 `AssistantEvent`，不得把 SSE event name
变成产品事件 discriminator。`done` 是传输完成确认，不是新的 `AssistantEvent`。

### 4.5 兼容与 fallback 判定

默认 policy 为 `prefer_dispatch`；同时冻结 `dispatch_only`（诊断/强制 Host）与 `legacy_only`（紧急回滚）
两个 host-provided 模式。`legacy_only` 只允许 direct-turn message，不能覆盖其他 Host command。

`prefer_dispatch` 只在以下全部条件成立时调用 legacy `streamMessage`：

- command 是 `message`，profile 缺省或为 `direct_turn`；
- dispatch 尚未产生任何 `AssistantEvent`；
- 失败明确发生在 dispatch bootstrap 前；
- HTTP 为 route absence `404/405/501`，或 Desktop 为 bridge/handler 在 START 接受前明确返回
  `NOT_SUPPORTED/NOT_FOUND`；
- 原 command 的 `conversationId/content/providerId/model` 可无损映射。

以下情况**禁止 fallback**：

- `pi_readonly`、proposal approve/revise/reject、`cancel_run`；
- 已收到任意 `AssistantEvent`，特别是 `run.started`；
- 普通网络错误、timeout、abort、`STREAM_TERMINATED`；
- auth、validation、rate limit、provider/model 或 Facade application error；
- malformed SSE/IPC frame、未知 event type、done/result schema 错误；
- Desktop START 已被接受后的 main crash、sender destroy 或 stream error。

原因：Facade 在 provider/persistence 工作前就发出 `run.started`。模糊失败可能已经在远端执行；此时重试
legacy path 会重复保存 user/assistant message。fallback 资格必须由稳定 error code 判断，禁止以错误文本
或“没有收到 completed”推断。

现有 [`ai-runtime-path-map.md`](../../architecture/ai-runtime-path-map.md) 明确禁止产品 open chat 回退
`streamMessage`。实施 Step D 时必须同步修订该文档与 ADR-035：legacy 永远不是默认 UI 路径，但允许由
`AIClientService` 承担上述“确认 dispatch 未执行”的版本兼容 adapter；Vue 不获得 `streamMessage`
依赖。

## 5. 分步实施

### Step A：Server dispatch SSE 契约与 route 行为

**目标**：收口 residual 343/345 的既有实现；不创建第二条 route 或第二个 Facade。

**涉及文件**：

- `packages/contracts/src/modules/ai/agent-host/assistant-dispatch.ts`
- `packages/ai/src/server/application/ai.application.port.ts`
- `packages/ai/src/server/infrastructure/ai.module.ts`
- `packages/ai/src/server/transport/ai-assistant-facade.controller.ts`
- `packages/ai/src/server/transport/__tests__/ai-assistant-facade.controller.spec.ts`
- `packages/ai/src/api/routes/ai-assistant.routes.ts`
- `packages/ai/src/api/routes/ai-assistant.routes.test.ts`（新增）
- `packages/ai/src/api/module.ts`
- `packages/ai/src/api/module-lifecycle.spec.ts`

**改动**：

- [x] `AIApplicationPort.dispatchAssistant` 和 controller service 使用命名
      `AssistantDispatchResult/AssistantDispatchHandlers`；module 仍遍历同一个
      `runtime.assistantFacade.dispatch`。
- [x] controller 改用 contracts 共享 `AssistantClientCommandSchema`，strict reject `identityId`，再从
      `ExecutionContext` 注入 identity。
- [x] route 保持 `assistant/error/done` framing；锁定 no-cache、no-transform、keep-alive、
      `X-Accel-Buffering: no` headers。
- [x] request aborted 或 response close 时 abort controller，移除 listeners，并且不再写 terminal frame。
- [x] controller `Result` failure 只写一个 transport `error`；正常迭代只写一个 `done`；始终安全 end。
- [x] `createAIApiModule({ instance })` 继续先 `instance.start()` 再挂载 `/ai/assistant`，失败回滚 route
      stack；不在 route factory 创建 runtime。

**测试**：

- [x] controller：合法 message、各 command、body identity rejection、auth identity 注入、validation、
      abort signal 和 eventCount。
- [x] route：401 JSON 不启动 SSE；headers/framing；多 assistant frame 顺序；done；Result error；throw；
      request aborted/response close；listener cleanup；write failure。
- [x] module lifecycle：已有 instance 只 start/dispose 一次，挂载失败不留下半套路由。

**门禁**：

```bash
pnpm --dir packages/contracts exec vitest run --config vitest.config.ts src/modules/ai/agent-host/assistant-dispatch.contract.spec.ts
pnpm --dir packages/ai exec vitest run --config vitest.config.ts src/server/transport/__tests__/ai-assistant-facade.controller.spec.ts src/api/routes/ai-assistant.routes.test.ts src/api/module-lifecycle.spec.ts
```

### Step B：Web SSE 与 Desktop IPC stream 加固

**目标**：收口 residual 347/353；两个 transport 消费同一 contract，并能明确区分“未支持”与“已开始后
失败”。

**涉及文件**：

- `packages/ai/src/application-client/ports/ai-api-client.port.ts`
- `packages/ai/src/application-client/ai-client.port.ts`
- `packages/ai/src/application-client/ai-client-service.ts`
- `packages/ai/src/infrastructure-client/adapters/http/ai-assistant-http.adapter.ts`
- `packages/ai/src/infrastructure-client/adapters/http/ai-assistant-http.adapter.test.ts`
- `packages/ai/src/infrastructure-client/adapters/ipc/ai-assistant-ipc.adapter.ts`
- `packages/ai/src/infrastructure-client/adapters/ipc/ai-assistant-ipc.adapter.test.ts`
- `packages/contracts/src/electron/ipc-channels.ts`
- `packages/ai/src/electron/index.ts`
- `packages/ai/src/electron/index-lifecycle.spec.ts`
- `packages/ai/src/electron/assistant-dispatch-lifecycle.spec.ts`（新增；若 lifecycle fixture 可复用则并入现有文件）

**改动**：

- [x] Web adapter 对 `assistant` 和 `done` data 先 `JSON.parse` 再过共享 schema；malformed JSON、错误
      shape 与 unknown event 统一为 protocol error。
- [x] Web 仅把 bootstrap `404/405/501` 规范化为 `ASSISTANT_DISPATCH_UNAVAILABLE`；已进入 2xx SSE
      后的任何 `error`/断流都不是 unavailable。
- [x] IPC adapter 对 EVENT/DONE/ERROR envelope 和内层 payload 做 runtime validation；保持 streamId
      isolation、once settlement 与 listener/abort cleanup。
- [x] Desktop 缺 bridge 或 START handler 明确归一为 dispatch unavailable；START 成功后 ERROR/断流不得
      降级为 unavailable。
- [x] main START 在 authenticated context 注入 identity，拒绝 renderer identity；session 绑定
      `webContentsId`；其他 sender 不能 cancel；sender destroyed 后不 push。
- [x] main 的 success/error/catch/abort/dispose 所有分支都删除 active session，且不双发 DONE/ERROR。
- [x] IPC channel 字符串保持不变；仅增加 contract tests，不另设 channel alias。

**测试**：

- [x] HTTP：split/multi-line SSE、assistant/done schema、malformed frame、transport error、premature EOF、
      abort，以及 404/405/501 的 unavailable 分类。
- [x] IPC renderer：并发 streamId 隔离、foreign event ignore、malformed payload、done/error once、
      abort-before-start、abort-after-start、invoke rejection、所有 listener cleanup。
- [x] IPC main：start/event/done、application error、throw、cancel ownership、sender destroy、module dispose、
      identity injection/rejection 和 active session cleanup。

**门禁**：

```bash
pnpm --dir packages/ai exec vitest run --config vitest.config.ts src/infrastructure-client/adapters/http/ai-assistant-http.adapter.test.ts src/infrastructure-client/adapters/ipc/ai-assistant-ipc.adapter.test.ts src/electron/assistant-dispatch-lifecycle.spec.ts src/electron/index-lifecycle.spec.ts
```

### Step C：Vue 薄入口、真实 surface 与模型选择

**目标**：收口 residual 349，并让 residual 351 的既有默认路径真正通过唯一 Vue entry。

**涉及文件**：

- `packages/app-vue/src/di/keys.ts`
- `packages/app-vue/src/modules/ai/composables/useAssistantDispatch.ts`
- `packages/app-vue/src/modules/ai/composables/useAssistantDispatch.spec.ts`
- `packages/app-vue/src/modules/ai/composables/useAIChatSession.ts`
- `packages/app-vue/src/modules/ai/composables/useAIChatSession.spec.ts`（新增）
- `packages/app-vue/src/modules/ai/composables/useAIChatView.ts`
- `packages/app-vue/src/modules/ai/composables/useAIModelSelection.ts`
- `packages/app-vue/src/modules/ai/composables/use-ai-chat-host-dispatch.surface.spec.ts`
- `apps/web/src/platform/di-app.ts`
- `apps/desktop/src/renderer/platform/di-app.ts`

**改动**：

- [x] 新增 host-provided `AssistantSurface` injection（或等价显式 option）；Web 提供 `web`，Desktop
      renderer 提供 `desktop`，shared composable 不读 `window` 猜平台。
- [x] 清理 `useAssistantDispatch` 的过时注释；入口继续只接 `dispatchAssistant`，不接
      `streamMessage`。
- [x] `useAIChatSession` 初始化并调用 `useAssistantDispatch().dispatchMessage`；移除对
      `loadService.dispatchAssistant` 的直接调用，cancel/proposal 仍可按各自既有入口渐进收口。
- [x] command 原样带 client-owned `runId`、当前 `executionProfileId`、注入的 `surface`、
      `selectedModel.providerId` 和 `selectedModel.modelId`。
- [x] `message.delta` 只追加当前 run 的 assistant draft；`message.completed` 以持久 message id/content
      替换 draft；error/abort 不残留 generating 状态。
- [x] 保持 per-conversation model selection 和 open-chat Host turn memory，不新增模型默认值的第二份
      state。

**测试**：

- [x] `useAssistantDispatch`：command 映射、identity guard、event order、abort、state reset，以及显式
      Web/Desktop surface。
- [x] `useAIChatSession` 行为：创建 conversation 后 dispatch；选择模型透传；多 delta 实时累加；
      completed 替换两个 draft；failed/abort；server 改写 runId；完成后刷新 conversation list。
- [x] 分别用 `web` 与 `desktop` host option 断言 command surface；删除硬编码 Web 的 source-only 假绿。
- [x] 保留 surface test 只锁“Vue open chat 不直接调用 `streamMessage/sendMessage`”和薄入口使用关系。

**门禁**：

```bash
pnpm --dir packages/app-vue exec vitest run --config vitest.config.ts src/modules/ai/composables/useAssistantDispatch.spec.ts src/modules/ai/composables/useAIChatSession.spec.ts src/modules/ai/composables/use-ai-chat-host-dispatch.surface.spec.ts
```

### Step D：默认 dispatch、live delta 与受限兼容回退

**目标**：完成 residual 351 的可发布闭环。Host dispatch 始终是默认；旧 host 兼容只存在于 client
service 内部。

**涉及文件**：

- `packages/ai/src/application-client/assistant-dispatch-policy.ts`（新增）
- `packages/ai/src/application-client/ai-client-service.ts`
- `packages/ai/src/application-client/ai-client-service.dispatch-assistant.spec.ts`（新增）
- `packages/ai/src/application-client/ai-http-service-factory.ts`
- `packages/ai/src/client/index.ts`
- `apps/web/src/platform/di-app.ts`
- `apps/desktop/src/renderer/platform/di-app.ts`
- `packages/app-vue/src/modules/ai/composables/useAIChatSession.spec.ts`
- `docs/architecture/adr/ADR-035-unified-assistant-agent-host.md`
- `docs/architecture/ai-runtime-path-map.md`

**改动**：

- [x] `AIClientService.dispatchAssistant` 包装 onEvent 并记录是否已见 event；默认先调用 assistant
      adapter。
- [x] 新增纯函数 `classifyAssistantDispatchFallback(error, command, observedState)`；只实现 §4.5 的白名单，
      所有未知值默认 fail-closed。
- [x] eligible 时由 service 内部把 message 映射到 `messageApi.streamMessage`，将 chunk/completion 投影为
      `message.delta/message.completed`，保留 command runId 和持久 message 内容。
- [x] UI-facing `AIChatService` 仍不暴露 `streamMessage`；Vue 不分支判断 transport，不展示
      fallback-specific product event。
- [x] factories 接受 host-provided `prefer_dispatch | dispatch_only | legacy_only`；生产缺省
      `prefer_dispatch`，紧急回滚必须显式配置并记录 telemetry。
- [x] `legacy_only` 对 `pi_readonly`/proposal/cancel 返回明确 unsupported，不把它们错误发送到 message
      endpoint。
- [x] 修订 ADR/path map，记录该窄版本兼容例外、禁止条件和移除条件；不得把 legacy 重新描述为产品
      默认路径。

**测试**：

- [x] dispatch success：无 legacy 调用，delta/completed 原样转发。
- [x] route/handler definitely unavailable 且未见 event：恰好 fallback 一次，并透传
      conversation/content/provider/model。
- [x] 收到 `run.started` 后断流：拒绝 fallback；普通 network/timeout/abort/auth/validation/provider/
      protocol error 同样拒绝。
- [x] `pi_readonly`、proposal、cancel 永不 fallback。
- [x] fallback chunk 顺序、completed 持久 message、abort 和 legacy failure 正确投影；不得伪造
      `run.started`。
- [x] `dispatch_only/legacy_only` flag 行为和 host 默认值；无配置时仍先 dispatch。

**门禁**：

```bash
pnpm --dir packages/ai exec vitest run --config vitest.config.ts src/application-client/ai-client-service.dispatch-assistant.spec.ts src/infrastructure-client/adapters/http/ai-assistant-http.adapter.test.ts src/infrastructure-client/adapters/ipc/ai-assistant-ipc.adapter.test.ts
pnpm --dir packages/app-vue exec vitest run --config vitest.config.ts src/modules/ai/composables/useAIChatSession.spec.ts src/modules/ai/composables/use-ai-chat-host-dispatch.surface.spec.ts
```

## 6. 验证矩阵与门禁

### 6.1 分层验证

| 层                  | 必须证明                                                                                              | 证据                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Contract            | command/event/result 跨端同 schema；identity 不在 client body；unknown event fail-closed              | contracts 正/负向 schema tests                            |
| Facade/engine       | direct_turn delta 顺序、completed/abort/error；pi_readonly isolation；模型绑定不改变 Engine ownership | 既有 Facade spec + 两个 ADR-035 conformance/journey specs |
| Server transport    | auth identity、SSE headers/framing、close abort、单 terminal、instance-bound lifecycle                | controller + 新 route test + module lifecycle             |
| Web client          | chunk boundary、schema parse、done/error/EOF、unavailable 分类                                        | HTTP adapter tests                                        |
| Desktop client/main | stream ownership、start/cancel、event/done/error、cleanup、dispose                                    | IPC adapter + main lifecycle tests                        |
| Vue                 | 薄入口、真实 surface、selected model、live draft、completed replacement、abort/error                  | composable behavioral tests + narrow surface lock         |
| Compatibility       | 只在 definite unavailable 且 zero-event 时 fallback；其他失败不重复 send                              | AIClientService policy table tests                        |

### 6.2 全切片命令

实施每一步使用 direct Vitest，禁止 `pnpm nx run <pkg>:test`：

```bash
pnpm --dir packages/contracts exec vitest run --config vitest.config.ts src/modules/ai/agent-host/assistant-dispatch.contract.spec.ts
pnpm --dir packages/ai exec vitest run --config vitest.config.ts src/server/infrastructure/assistant-facade/__tests__/assistant.facade.spec.ts src/server/transport/__tests__/ai-assistant-facade.controller.spec.ts src/api/routes/ai-assistant.routes.test.ts src/infrastructure-client/adapters/http/ai-assistant-http.adapter.test.ts src/infrastructure-client/adapters/ipc/ai-assistant-ipc.adapter.test.ts src/electron/assistant-dispatch-lifecycle.spec.ts src/application-client/ai-client-service.dispatch-assistant.spec.ts
pnpm --dir packages/ai exec vitest run --config vitest.config.ts src/server/infrastructure/runtime/__tests__/adr-035-multi-engine-turn-conformance.harness.spec.ts src/server/infrastructure/runtime/__tests__/adr-035-production-multi-engine-host.journey.spec.ts
pnpm --dir packages/app-vue exec vitest run --config vitest.config.ts src/modules/ai/composables/useAssistantDispatch.spec.ts src/modules/ai/composables/useAIChatSession.spec.ts src/modules/ai/composables/use-ai-chat-host-dispatch.surface.spec.ts
```

新增/移动测试文件后更新并检查 inventory：

```bash
pnpm test:inventory
pnpm test:inventory:check
```

最终治理与文档门禁：

```bash
pnpm nx run memoflow:governance-check --skip-nx-cache
pnpm nx run memoflow:docs-check --skip-nx-cache
```

### 6.3 Focused smoke（不新增跨端 E2E）

- [x] Web：选择非默认 provider/model，发送普通消息；首个 delta 到达即显示，完成后刷新仍为同一持久
      user/assistant message。
- [x] Web：模拟 dispatch route 404，direct_turn 走一次 legacy；模拟 500/断流/收到 `run.started` 后断线
      时不 fallback。
- [x] Web：stop 后 UI 为 aborted，不补发 completed，不触发 fallback。
- [x] Desktop：同一 renderer 完成 START → EVENT* → DONE；取消只影响自己的 stream，关闭窗口后无残余
      listener/session。
- [x] Desktop：command 标注 `surface: desktop`，Web 标注 `surface: web`；两端选择的 provider/model 均到达
      DirectTurnEngine。
- [x] `pi_readonly` unavailable 时明确失败，绝不落入 legacy direct chat。

## 7. 切片完成标准

以下只对本 dispatch slice 生效，并与父计划 §19/§20 对齐；不会勾选父计划的完整统一助手完成定义。

- [x] residual 343：既有 `AssistantFacade` message dispatch 事件序列有共享 contract 和行为证据。
- [x] residual 345：instance-bound server route 以 authenticated identity 输出合法 SSE，disconnect 可 abort，
      route 有 focused behavior tests。
- [x] residual 347/353：Web HTTP/SSE 与 Desktop IPC 通过同一 schema，Desktop start/cancel/push lifecycle
      无 listener/session 泄漏。
- [x] residual 349：open chat 生产调用通过 `useAssistantDispatch`；thin entry 无业务编排、无 legacy API
      依赖。
- [x] residual 351：默认 send 先 dispatch；live delta、completion、abort/error 和 selected model 在 Web/
      Desktop 行为测试中成立。
- [x] 旧 host 只有在 definite unavailable + zero-event + direct_turn message 时 fallback；任何可能已执行的
      请求都不会双发。
- [x] `createAIApiModule({ instance })` / `createAIElectronModule({ instance })` ownership 不变，composition
      tests 保持通过。
- [x] 两个既有 Turn Engine conformance/journey suites 保持绿；这只证明本切片未破坏现有 isolation，
      **不代表**完整 multi-engine 跨端 E2E 已完成。
- [x] focused tests、inventory、governance、docs-check 和 smoke 全部通过。
- [x] 父计划仍保持部分完成：完整 Artifact、Pi spawn、Conversation ↔ run 持久多对一、跨端 E2E 继续
      open。

## 8. 风险与回滚

| 风险                                        | 预防/检测                                                                                          | 回滚                                                                                    |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| SSE proxy buffering、frame 截断或 done 丢失 | 固定 headers；boundary/malformed/EOF tests；2xx stream 中断归类为 `STREAM_TERMINATED`              | 保持错误可重试 UI；不得因断流自动 legacy 重发                                           |
| fallback 造成重复 user/assistant message    | 仅稳定 unavailable code + zero observed event；白名单纯函数表测；记录命中 telemetry                | 立即把 policy 切到 `dispatch_only`，不改 Vue 路径                                       |
| 新 dispatch 在旧 Server/Desktop 不可用      | HTTP route absence、Desktop bridge/handler absence 有明确 code；`prefer_dispatch` direct-turn 兼容 | 临时设置 `legacy_only`；只影响 direct-turn message，pi/proposal/cancel 继续 fail-closed |
| model selection 丢失或被换成默认模型        | request/fallback 映射均断言 `providerId + model`；用非默认模型 smoke                               | 切 `legacy_only` 前仍保留同一 model 映射；若映射无法保证则禁用 fallback                 |
| Desktop IPC listener/session 泄漏或串流     | streamId + webContents ownership；done/error/abort/dispose cleanup tests                           | 禁用 Desktop dispatch policy 或切 direct-turn `legacy_only`；保留 Web Host path         |
| Desktop 被误标为 Web                        | surface 由 host DI 显式提供，双 host tests                                                         | 回滚 surface injection 单独 PR，不回滚 dispatch contracts                               |
| runtime schema 与滚动部署不兼容             | 可选字段允许向后兼容；新 discriminator 必须先升级 client/协商版本；protocol error 不 fallback      | 回滚 schema consumer 或 server 新事件；禁止用 unchecked cast 绕过                       |
| composition root 被 transport 内部化        | API/Desktop module lifecycle tests 锁同一 instance                                                 | 回滚相关 transport PR；保留 `createAI*Module({ instance })` 接口                        |

`legacy_only` 是短期发布止血开关，不是完成态。每次启用必须记录原因、平台/版本、命中量和移除日期；
稳定窗口后应删除旧版本兼容，而不是长期维护双默认路径。

## 9. 交付顺序

- [x] PR 0：共享 contract/schema、双语 JSDoc 和兼容判定表；无行为切换。
- [x] PR A：server controller/route 收口与行为测试。
- [x] PR B：Web/Desktop transport runtime validation 与 IPC lifecycle 测试。
- [x] PR C：Vue 薄入口接管、surface 注入、model/live-delta 行为测试。
- [x] PR D：client-layer guarded fallback、rollout policy、ADR/path-map 更新与 smoke。

每个 PR 独立可回滚、通过自己的 direct Vitest 和治理门禁；只有 A–D 全部完成后，才可在父计划中把
343/345/347/349/351/353 标记为本切片闭环，且仍不得宣称 ADR-035 全量完成。
