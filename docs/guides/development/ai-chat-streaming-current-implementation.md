---
tags:
  - guide
  - development
  - ai
  - chat
  - streaming
description: AIChatView 当前对话与流式实现分析，包含代码入口、状态流转、已实现能力、缺失能力和建议的手动扩展顺序
created: 2026-04-14T00:00:00
updated: 2026-04-14T00:00:00
---

# AIChatView 当前实现学习笔记

这篇文档只分析仓库里当前已经存在的 AI 对话页实现，目标不是抽象讨论 AI 聊天该怎么做，而是回答下面几个问题：

1. 这个页面现在到底已经做了什么。
2. 一次发送请求从前端到后端、再回到前端是怎么流动的。
3. 它离一个完整的 AI 对话与流式界面还差什么。
4. 如果要靠手动实现把剩余特性补齐，建议按什么顺序做。

## 代码入口

当前实现的关键入口文件：

- [packages/app-vue/src/modules/ai/views/AIChatView.vue](../../../packages/app-vue/src/modules/ai/views/AIChatView.vue)
- [packages/app-vue/src/modules/ai/composables/useAI.ts](../../../packages/app-vue/src/modules/ai/composables/useAI.ts)
- [packages/ai/src/application-client/ai-client-service.ts](../../../packages/ai/src/application-client/ai-client-service.ts)
- [packages/ai/src/infrastructure-client/adapters/http/ai-message-http.adapter.ts](../../../packages/ai/src/infrastructure-client/adapters/http/ai-message-http.adapter.ts)
- [packages/ai/src/api/routes/ai-chat.routes.ts](../../../packages/ai/src/api/routes/ai-chat.routes.ts)
- [packages/ai/src/api/controllers/ai-chat.controller.ts](../../../packages/ai/src/api/controllers/ai-chat.controller.ts)
- [packages/ai/src/application-server/use-cases/commands/a-i-chat-application-service.ts](../../../packages/ai/src/application-server/use-cases/commands/a-i-chat-application-service.ts)

可以把这条链路记成：

`AIChatView -> useAI.service -> AIClientService -> AIMessageHttpAdapter -> /ai/chat/messages/sse -> controller -> application service`

## 当前页面已经实现了什么

如果只看 `AIChatView.vue`，它已经不是一个“只会显示文本”的 demo，而是一个具备基本工程结构的聊天页。

### 1. 基础聊天壳子已经完整

当前页面已经具备：

- 会话列表
- 当前会话切换
- 新建会话
- 删除会话
- 输入框自动增高
- 模型选择
- 发送消息
- 流式追加 assistant 内容
- 会话标题更新
- 会话恢复

对应代码主要在：

- 会话列表和聊天区模板：`AIChatView.vue` 顶部 template
- 会话加载：`loadConversationList()`、`selectConversation()`
- 发送消息：`handleSendChat()`

### 2. 已经在用“占位 assistant 消息 + chunk 追加”的基础流式模式

这部分是当前实现里最值得学习的点。

发送时，页面不是等后端全部完成再插入 assistant 消息，而是：

1. 先创建会话 id，如果还没有会话。
2. 先往 `chatTimeline` 里插入一条用户消息草稿。
3. 再插入一条空的 assistant 占位消息。
4. 收到 SSE `message` 事件时，把增量文本持续 append 到占位消息。
5. 收到 SSE `done` 事件时，再用服务端持久化后的真实 message id 和最终内容替换草稿消息。

这正对应 AI 对话前端里最经典的实现骨架：

- 用户消息提交
- assistant 占位消息创建
- 增量 chunk 追加
- 完成态替换为正式消息

对应代码在：

- `AIChatView.vue` 的 `handleSendChat()`
- `AIMessageHttpAdapter.streamMessage()`

### 3. 已经把“会话消息”和“工作流衍生状态”分开存

这是当前设计里另一个很实用的点。

当前页面不只是纯聊天，还复用了同一个聊天壳来承载两个工具工作流：

- `goal`
- `knowledge-note`

因此页面里实际存在两类状态：

一类是服务端会保存的聊天消息：

- `chatConversationId`
- `chatTimeline`
- `conversationTitle`

另一类是只存在于前端、由聊天内容衍生出来的工作流状态：

- `toolMode`
- `goalDraft`
- `editableGoal`
- `editableKeyResults`
- `noteSummary`
- `showGoalDraftEditor`

当前实现把第二类状态放到了 `localStorage`：

- `ai:conversation-workflow-map`
- `ai:last-conversation-id`
- `ai:last-model-key`
- `ai:conversation-model-map`

这意味着：

- 消息历史以服务端为准
- 页面级工作流上下文以前端本地恢复为准

这是一个很现实的取舍，避免后端数据模型在第一版就过度复杂。

## 一次流式发送的完整链路

下面按一次实际发送来拆。

## 第 1 步：用户点击发送

入口在 `AIChatView.vue` 的 `handleSendChat()`。

先做的事情有：

- 确认已经选中模型
- 把 `chatLoading` 设为 `true`
- 读取并 trim 当前输入
- 如果没有会话则调用 `ensureConversationCreated()`

这里值得注意的是：当前页面不是在“点击新建会话”时立刻创建服务端会话，而是在第一次真正发送消息时才懒创建。

这个设计的好处：

- 避免空会话污染列表
- 用户只切模式、不发送时，不会生成垃圾数据

## 第 2 步：插入本地草稿消息

`handleSendChat()` 会先构造两个临时 id：

- `user-draft-${Date.now()}`
- `assistant-draft-${Date.now()}`

然后立即往 `chatTimeline` 里 push 两条记录：

- 用户消息，内容是当前输入
- assistant 空消息，内容是 `''`

这样做的意义很重要：

- UI 不需要等待首个 chunk 才显示 assistant 气泡
- 流式中断时，前端知道这次请求对应哪条占位消息
- `scrollMessagesToBottom()` 可以立刻工作

这就是你在面试里可以讲的“占位 assistant 消息”模式。

## 第 3 步：前端发起 SSE 流式请求

发送逻辑走的是：

- `useAI().service.streamMessage(...)`
- `AIClientService.streamMessage(...)`
- `AIMessageHttpAdapter.streamMessage(...)`

`AIMessageHttpAdapter` 不是用浏览器原生 `EventSource`，而是用项目自己的 `httpClient.stream()` 读取响应体，再手动解析 SSE。

这说明当前实现更偏向下面这种方案：

- 用 HTTP POST 发送消息体
- 用 `ReadableStream` 读取响应
- 自己做 SSE framing 解析

而不是：

- 先建一个 GET 类型的 `EventSource`

这样做很适合 AI 聊天，因为消息发送通常要带 JSON body，不太适合原生 `EventSource` 的 GET-only 方式。

## 第 4 步：前端手动解析 SSE

`AIMessageHttpAdapter` 的 `parseSSE()` 做了几件事：

1. 从 `response.body.getReader()` 持续读取字节流。
2. 用 `TextDecoder` 转成文本。
3. 把文本累积到 `buffer`。
4. 通过空行边界拆出完整 SSE event。
5. 解析出：
   - `event: message`
   - `event: done`
   - `event: error`

当前还兼容了两种边界：

- `\r\n\r\n`
- `\n\n`

这点非常工程化，因为不同服务和代理链路可能会改写换行风格。

## 第 5 步：收到 chunk，持续 append 到 assistant 占位消息

当 `AIChatView` 收到 `onChunk` 回调时，会：

1. 通过 `assistantDraftId` 找到那条占位 assistant 消息。
2. 把 `chunk.content` 直接拼到 `target.content` 后面。

也就是说，当前页面采用的是最朴素、也最容易掌握的流式 UI 更新方式：

- 不建 token 队列
- 不做时间片合并
- 不做 chunk 去重
- 直接字符串 append

这个模式在中小体量对话里非常好理解，也很适合作为第一版。

## 第 6 步：收到 done，替换成服务端正式消息

当后端发出 `done` 事件时，前端会拿到：

- `userMessage`
- `assistantMessage`

然后把刚才的临时 draft 行替换掉。

这样替换而不是“保持原地不动”的价值在于：

- 消息 id 会和服务端一致
- 后续重新加载会话时，客户端状态和服务端历史能完全对齐
- 后续如果要做消息级操作，基础 id 已经可靠

## 第 7 步：服务端流结束并落盘

服务端链路大致是：

1. `POST /ai/chat/messages/sse`
2. `AIChatController.streamMessage()`
3. `AIChatApplicationService.sendMessageStream()`

在 `AIChatApplicationService.sendMessageStream()` 中，服务端会：

1. 校验会话归属。
2. 先保存用户消息。
3. 取历史消息组装成执行上下文。
4. 调用 `chatExecutionPort.stream(...)` 获取模型增量输出。
5. 每收到一个 chunk，就通过 `onChunk()` 往 SSE 响应里写一条 `message` event。
6. 同时在服务端把 `fullContent` 持续累积起来。
7. 流结束后，把完整 assistant 文本保存成消息。
8. 最后通过 SSE `done` 事件把正式消息返回前端。

这个设计说明当前系统已经明确区分了两件事：

- 流式展示用的增量输出
- 最终持久化用的完整消息

### Correlation ID 来源（RefArch Phase 2）

- 入口 `requestId` 由 API 全局 RequestContext middleware 建立（接受 `X-Request-Id` 或生成 UUID），并写入 `req.requestContext`。
- SSE 路由通过共享 Express extractor 把该 carrier 合成完整 `ExecutionContext`；use case 的 outbound/log correlation 使用 `cx.requestId`。
- 对 Python 的 `X-Request-Id` 只透传入口 ID；无 entry context 的内部调用才由 `AIServiceInternalClient` 生成 fallback UUID。
- durable `runId` 与 transport request ID 分离：请求可复用 proxy request ID，但 run/proposal/checkpoint 身份不依赖它。
- API request log、TS AI internal request log 与 Python completion log 可用同一个 `requestId` 检索。

## 当前状态模型是什么

如果按工程能力拆，当前页面已经有一部分状态模型，但还没有完全展开。

### 当前已有的页面级状态

- `chatLoading`
- `conversationListLoading`
- `goalDraftLoading`
- `creatingGoal`
- `noteCreating`

### 当前已有的消息核心字段

`ChatItem` 目前只有：

```ts
type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};
```

这代表当前消息模型还比较轻：

- 有角色
- 有内容
- 有 id

但还没有：

- `status`
- `errorMessage`
- `requestId`
- `createdAt`
- `isStreaming`
- `isRetryable`

### 当前“生成中”是怎么表现的

当前没有真正的消息级 `generating` 状态。

页面是通过这套组合来表现“正在生成”：

- 页面级 `chatLoading = true`
- assistant 占位消息的 `content === ''`
- `typingPlaceholder(item)` 返回 `'...'`

这能工作，但它有明显边界：

- 只能表示“当前全页有一条消息在生成”
- 不能表示某一条历史消息失败
- 不能表示某一条消息是 aborted
- 不能支持更细粒度的重试和重新生成

## 当前实现已经解决了哪些真实问题

### 1. 首 token 前的 UI 空档

通过提前插入 assistant 占位消息，页面不会在首个 chunk 到来前完全没有 assistant 气泡。

### 2. 刷新后恢复上下文

通过服务端会话历史 + 本地 workflow state，页面刷新后能恢复：

- 上次会话
- 上次模型
- 工具模式
- 已生成的 goal draft / note summary

### 3. 流式过程中的滚动

通过监听 `chatTimeline` 中每条消息内容长度变化，页面会在流式追加期间自动滚到底部。

这是一个相对便宜的 watcher，因为它不是深度监听整个对象，而是只监听：

- `id`
- `content.length`

### 4. 非纯聊天场景的复用

当前页面已经证明一个聊天壳可以承载更高层的 AI 工作流，这对于后续扩展：

- regenerate
- continue
- planning
- note expansion

都很有价值。

## 当前还缺什么

这部分就是你后面适合手动补的重点。

### 1. 缺少消息级状态机

当前没有显式的：

- `idle`
- `generating`
- `success`
- `error`
- `aborted`

这会导致很多能力不好做：

- 某条消息失败后保留在列表里
- 某条消息显示“已取消”
- 某条消息允许单独重试
- 某条消息展示错误说明

这是最优先该补的一层。

### 2. 缺少取消生成

当前 `streamMessage()` 没有暴露取消句柄，`AIChatView` 也没有 `AbortController` 或 stop 按钮。

因此用户一旦发出请求：

- 前端不能主动中止读取
- 页面也没有 aborted 状态落地

如果你要完整掌握 AI 对话页，这一块必须手写一次。

### 3. 缺少失败保留和局部重试

当前 catch 分支会直接把那次发送的两个 draft 消息删掉：

- 用户草稿删掉
- assistant 草稿删掉

这很干净，但不够产品化。

一个更完整的实现通常会：

- 保留用户消息
- 保留 assistant 占位消息
- 给 assistant 标记 `error`
- 展示 retry / regenerate 按钮

### 4. 缺少部分输出保留策略

服务端在某些情况下允许“有部分内容就继续”，但前端 catch 后仍然会删掉草稿消息。

这意味着：

- 服务端可能已经拿到部分输出
- 但前端最终把这段输出抹掉了

如果你后面想更深入掌握流式体验，这里可以做成：

- 有内容时保留 partial response
- 标记为 `error` 或 `interrupted`

### 5. 缺少重复 chunk / 乱序 chunk 防御

当前前端默认假设：

- chunk 只会顺序到达
- chunk 不会重复

这在大多数场景可行，但如果要做更稳的实现，应该至少思考：

- 是否需要 sequence id
- 是否需要去重
- 是否要防止 done 之后又收到 chunk

### 6. 缺少 markdown / code block 渲染

当前模板里 assistant 内容仍然是：

```vue
<p class="whitespace-pre-wrap break-words">
  {{ item.content || typingPlaceholder(item) }}
</p>
```

也就是说现在只是纯文本展示，最多保留换行。

还没有：

- markdown 解析
- code fence 高亮
- 代码块复制
- 表格 / 引用 / 列表样式
- 流式中的未闭合 code block 处理

这是 AI 聊天页非常重要的一层。

### 7. 缺少更细的滚动策略

当前策略是“内容长度变了就滚到底”。

这对第一版很有效，但完整产品通常还会区分：

- 用户当前是否手动上滑
- 只有接近底部时才自动跟随
- 新消息到达时显示“回到底部”按钮

### 8. 缺少性能分层

当前实现直接在每个 chunk 到达时改响应式字符串。

如果后续输出很长、chunk 很密，可能出现：

- 频繁重渲染
- markdown 重算成本高
- 滚动卡顿

第一版先不复杂化是对的，但如果你要深度掌握，这一层最终要补。

## 当前实现最适合你学习的点

如果你的目标是“完整掌握 AI 对话和流式界面”，那当前代码最值得学的不是 UI 样式，而是下面三件事。

### 1. 最小可用流式链路是怎么闭环的

当前实现已经把下面这条链路跑通了：

- 前端创建占位消息
- 传输层接收 SSE
- 页面 append chunk
- 服务端聚合完整输出
- 前端拿正式消息替换草稿

这是你后续做更复杂状态机的基础。

### 2. 一个聊天壳如何承载更高层的 AI 工作流

`goal` 和 `knowledge-note` 已经展示了：

- 聊天记录不只是展示文本
- 它可以作为后续 AI 操作的上下文输入

这对做“继续追问 / 重新总结 / 生成计划 / 导出知识卡片”都很关键。

### 3. 前端和服务端如何分工

当前分工很清楚：

- 前端负责流式体验和本地 UI 过渡态
- 服务端负责消息持久化和最终权威结果

这个边界比“前端自己拼最终消息并假装它就是正式记录”更稳。

## 建议你手动实现剩余特性的顺序

如果你的目标是“不要靠抽象库，要自己完整掌握”，建议按下面顺序做。

### 第一阶段：先补消息级状态机

先改 `ChatItem`，把消息状态明确下来，例如：

```ts
type MessageStatus = 'generating' | 'success' | 'error' | 'aborted';

type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: MessageStatus;
  errorMessage?: string;
};
```

这一层补完后，再做取消、重试、重新生成会顺很多。

### 第二阶段：补取消生成

目标是把一次流式请求从“只能等它结束”改成“可中止”。

建议你优先做：

- adapter 层支持 abort signal
- view 层持有当前请求控制器
- UI 增加 stop 按钮
- 中止后把消息状态改为 `aborted`

### 第三阶段：补失败保留和重试

建议不要再在 catch 里直接删消息，而是：

- 保留用户消息
- 保留 assistant 行
- assistant 标为 `error`
- 允许对最后一条失败 assistant 做 retry / regenerate

### 第四阶段：补 markdown 与 code block

这是对聊天页感知最明显的一层。

建议分两步做：

1. 先做非流式 markdown 渲染，稳定解析最终消息。
2. 再处理流式中未闭合代码块、未闭合列表等增量渲染问题。

### 第五阶段：补滚动与性能

这阶段再做：

- 用户上滑时暂停自动跟随
- chunk 合并更新
- 长消息节流渲染
- 长列表虚拟化

把难点拆开，避免一开始就在“高并发 token 渲染”上过度设计。

## 面试表达时怎么总结当前实现

如果你要基于这份代码回答“有没有对接过大模型官方 API 和流式输出”，比较稳的说法可以是：

> 我做过基于 SSE 的 AI 对话页，前端会先创建用户消息和 assistant 占位消息，然后通过流式接口接收 chunk，持续把内容 append 到 assistant 占位消息上，流结束后再用服务端持久化后的正式消息替换本地草稿。页面除了消息列表，还处理了会话恢复、模型选择、滚动到底部，以及基于聊天上下文继续触发 goal draft 和 knowledge note 这类上层 AI 工作流。当前版本已经跑通最小闭环，下一步我会把消息级状态机、取消生成、失败保留、重试和 markdown/code block 渲染补完整。

这段话的优势是：

- 不是只说“我调过接口”
- 能体现你理解流式占位消息模式
- 能体现你知道当前实现的边界
- 能自然引出你下一步会补什么

## 一句话结论

当前 `AIChatView` 已经具备一个真实可用的 AI 对话页骨架，核心能力是“占位 assistant 消息 + SSE chunk 追加 + done 后替换正式消息 + 本地恢复 workflow 状态”。它距离完整产品还差消息级状态机、取消、重试、markdown/code block 渲染和更细的滚动性能策略，但作为你继续手动深挖 AI 对话与流式界面的基础已经足够好了。
