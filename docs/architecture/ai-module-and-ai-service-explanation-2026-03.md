# AI 模块与 ai-service 说明

这份文档面向现在的 `dailyuse` 仓库实现，目标是用尽量直接的方式说明：

1. `packages/ai` 和 `apps/ai-service` 各自负责什么
2. 一次 AI 请求在系统里是怎么流动的
3. 现在为什么要用“TypeScript 业务边界 + Python 执行服务”这套结构
4. 如果以后要继续改，应该优先从哪里下手

## 一句话总结

现在的架构可以概括成一句话：

- `packages/ai` 负责业务编排、身份隔离、Provider 配置、对话和知识笔记等应用层逻辑
- `apps/ai-service` 负责真正执行大模型请求，是内部 Python 执行服务

也就是说：

- TypeScript 负责“系统怎么用 AI”
- Python 负责“把一次 AI 调用真正打出去并拿回结果”

## 为什么这样拆

这次重构的核心判断是：

- 业务边界、仓储、身份、API/Electron 入口仍然应该留在现有 TypeScript 模块体系里
- provider 协议适配、模型执行、后续 Python 生态能力更适合放在独立 Python 服务里

这样拆有几个直接好处：

- 不会让 Python 服务反过来接管业务系统
- 现有 API、Electron、Prisma、PowerSync 结构不用整体推翻
- 后面如果要接更多 AI 能力，可以继续复用同一个执行通道
- Python 侧可以更自然地接入 AI 生态库和推理相关工程能力

## 现在的职责边界

### `packages/ai`

这里是 AI 模块的主业务层。

它现在负责：

- Provider 配置的增删改查
- 对话与消息的业务编排
- 目标生成、知识笔记生成这类上层用例
- API 和 Electron 的入口装配
- 决定当前运行时到底是“直连 provider”还是“走内部 ai-service”

最关键的入口文件是：

- [`packages/ai/src/infrastructure-server/ai.module.ts`](/D:/home/projects/dailyuse/packages/ai/src/infrastructure-server/ai.module.ts)

这就是 TypeScript 侧的组合根。它会把仓储、执行端口、知识笔记持久化端口等依赖组装起来，然后暴露一个统一的 `api` 门面给 HTTP 和 IPC 使用。

### `apps/ai-service`

这里是 Python 执行服务。

它现在负责：

- 接收内部签名请求
- 校验内部鉴权
- 解析标准化的 chat completion 请求
- 调用具体 provider
- 把 provider 的结果统一返回给上游 TypeScript

最关键的入口文件是：

- [`apps/ai-service/src/ai_service/app.py`](/D:/home/projects/dailyuse/apps/ai-service/src/ai_service/app.py)
- [`apps/ai-service/src/ai_service/security/request_signing.py`](/D:/home/projects/dailyuse/apps/ai-service/src/ai_service/security/request_signing.py)
- [`apps/ai-service/src/ai_service/middleware/auth.py`](/D:/home/projects/dailyuse/apps/ai-service/src/ai_service/middleware/auth.py)

## 一次请求是怎么走的

下面用“聊天发送消息”举例。

### 第 1 步：入口层收到请求

入口可能来自：

- API 模块
- Electron IPC

在 API 路径里，装配发生在：

- [`packages/ai/src/api/module.ts`](/D:/home/projects/dailyuse/packages/ai/src/api/module.ts)

这里会读取环境变量。如果配置了：

- `AI_SERVICE_BASE_URL`
- `AI_SERVICE_SECRET`

那么 `packages/ai` 会自动选择内部 Python 适配器；否则退回直连 provider 的适配器。

### 第 2 步：TypeScript 业务层编排请求

聊天主用例在：

- [`packages/ai/src/application-server/use-cases/commands/a-i-chat-application-service.ts`](/D:/home/projects/dailyuse/packages/ai/src/application-server/use-cases/commands/a-i-chat-application-service.ts)

它负责：

- 校验对话归属
- 保存用户消息
- 读取消息历史
- 选择当前 identity 可用的 provider
- 把历史消息转换成执行端口能理解的标准消息格式
- 调用执行端口
- 保存 assistant 回复

这里有一个重要变化：

- 它已经不再直接写 `fetch` 或 provider gateway
- 它现在只依赖 `IAIChatExecutionPort`

这意味着上层业务不用关心“底层到底是 OpenAI HTTP、别的 provider，还是 Python ai-service”

### 第 3 步：TypeScript 侧执行端口决定怎么执行

执行端口相关代码在：

- [`packages/ai/src/application-server/ports/chat-execution.port.ts`](/D:/home/projects/dailyuse/packages/ai/src/application-server/ports/chat-execution.port.ts)
- [`packages/ai/src/infrastructure-server/chat-execution/ai-service-chat-execution.adapter.ts`](/D:/home/projects/dailyuse/packages/ai/src/infrastructure-server/chat-execution/ai-service-chat-execution.adapter.ts)
- [`packages/ai/src/infrastructure-server/chat-execution/direct-provider-chat-execution.adapter.ts`](/D:/home/projects/dailyuse/packages/ai/src/infrastructure-server/chat-execution/direct-provider-chat-execution.adapter.ts)

两种实现分别是：

- `DirectProviderChatExecutionAdapter`
- `AIServiceChatExecutionAdapter`

前者用于没有接 Python 服务的场景，后者用于正式走内部 `ai-service`。

### 第 4 步：如果走 ai-service，TypeScript 会先签名

签名逻辑在：

- [`packages/ai/src/infrastructure-server/chat-execution/internal-ai-service-request-signer.ts`](/D:/home/projects/dailyuse/packages/ai/src/infrastructure-server/chat-execution/internal-ai-service-request-signer.ts)

当前签名绑定了：

- service name
- HTTP method
- path
- timestamp
- body sha256

这样做的原因是避免以前那种“只签服务名”的弱鉴权。

### 第 5 步：Python ai-service 校验并执行

Python 侧会在 middleware 中校验签名，然后进入内部路由执行 provider 调用。

这一层的意义是：

- TypeScript 不再关心 provider 协议细节
- Python 可以集中处理执行层问题，比如 provider 适配、重试、观测、后续 SDK 接入

## 为什么要有“执行端口”

执行端口是这次重构里最关键的设计点。

如果没有执行端口，业务用例会直接依赖：

- `fetch`
- OpenAI gateway
- Anthropic gateway
- 某个内部 HTTP 协议

问题是这样会导致：

- 每个用例都要自己处理 provider 细节
- 很难统一切换到底层执行方式
- 后面接 ai-service 会变成全项目散点改造

有了执行端口以后，上层只说一件事：

- “请用这些消息和这个 provider 配置，帮我完成一次 AI 调用”

至于真正怎么执行，由适配器决定。

## 为什么 `testConnection` 也要走统一执行端口

这次后续清理里，把 provider 的 `testConnection` 也接入了执行端口，相关代码在：

- [`packages/ai/src/application-server/use-cases/commands/a-i-provider-config-service.ts`](/D:/home/projects/dailyuse/packages/ai/src/application-server/use-cases/commands/a-i-provider-config-service.ts)

原因很简单：

- 如果聊天走 ai-service，但 `testConnection` 仍然直连 gateway，那么系统其实有两套执行链路
- 两套链路意味着行为差异、测试重复、后续维护成本更高

现在统一以后：

- 聊天、目标生成、知识笔记、provider 测试连接，都走同一执行抽象

## 为什么还保留 direct provider adapter

这是为了过渡和兼容。

当前仓库里并不是所有运行时都一定已经配置好 Python `ai-service`。比如有些本地开发或桌面场景，可能还需要直接走 provider。

所以现在的策略是：

- 如果运行时配置了 ai-service，就走 Python 服务
- 否则退回 direct provider adapter

这个设计比“强行全部切过去”更稳，因为它允许分阶段迁移。

## 现在这套结构和以前比，具体好在哪里

### 以前的问题

以前更像“能跑起来”的结构：

- 不同 use case 自己拿 gateway、自己调 provider
- `testConnection`、聊天、知识笔记这些能力之间没有统一执行抽象
- 一部分低层 use case 是占位实现，但又仍然暴露在装配层里
- Prisma 和 PowerSync 对 provider `apiKey` 的处理不一致

### 现在的改进

现在更接近“可以长期维护”的结构：

- 所有 AI 执行走统一端口
- API 和 Electron 入口都复用同一个组合根
- TypeScript 侧的 controller 依赖变成窄接口，不再大量 `as any`
- Python 侧鉴权变成真正绑定 method/path/body/timestamp 的签名协议
- Prisma 和 PowerSync 路径对 provider `apiKey` 的语义已经统一

## 现在建议你怎么读这个项目

如果你对 Python 和这套联动都不熟，建议按下面顺序看。

### 第 1 层：先看入口和装配

- [`packages/ai/src/api/module.ts`](/D:/home/projects/dailyuse/packages/ai/src/api/module.ts)
- [`packages/ai/src/infrastructure-server/ai.module.ts`](/D:/home/projects/dailyuse/packages/ai/src/infrastructure-server/ai.module.ts)
- [`apps/ai-service/src/ai_service/app.py`](/D:/home/projects/dailyuse/apps/ai-service/src/ai_service/app.py)

先建立一个概念：

- 谁在组装依赖
- 谁在暴露 API
- 谁在真正执行

### 第 2 层：再看执行端口

- [`packages/ai/src/application-server/ports/chat-execution.port.ts`](/D:/home/projects/dailyuse/packages/ai/src/application-server/ports/chat-execution.port.ts)
- [`packages/ai/src/infrastructure-server/chat-execution/ai-service-chat-execution.adapter.ts`](/D:/home/projects/dailyuse/packages/ai/src/infrastructure-server/chat-execution/ai-service-chat-execution.adapter.ts)

看懂这一层之后，你会明白为什么上层业务代码可以和底层 provider 解耦。

### 第 3 层：再看一个具体用例

建议按这个顺序：

- [`packages/ai/src/application-server/use-cases/commands/a-i-chat-application-service.ts`](/D:/home/projects/dailyuse/packages/ai/src/application-server/use-cases/commands/a-i-chat-application-service.ts)
- [`packages/ai/src/application-server/use-cases/commands/goal-generation-application-service.ts`](/D:/home/projects/dailyuse/packages/ai/src/application-server/use-cases/commands/goal-generation-application-service.ts)
- [`packages/ai/src/application-server/use-cases/commands/ai-knowledge-note.service.ts`](/D:/home/projects/dailyuse/packages/ai/src/application-server/use-cases/commands/ai-knowledge-note.service.ts)

这三者很适合用来理解：

- 上层如何组织 prompt
- 如何选 provider
- 如何把执行结果再变回业务结果

### 第 4 层：最后看 Python 内部鉴权和 provider 层

- [`apps/ai-service/src/ai_service/security/request_signing.py`](/D:/home/projects/dailyuse/apps/ai-service/src/ai_service/security/request_signing.py)
- [`apps/ai-service/src/ai_service/middleware/auth.py`](/D:/home/projects/dailyuse/apps/ai-service/src/ai_service/middleware/auth.py)
- [`apps/ai-service/src/ai_service/providers/`](/D:/home/projects/dailyuse/apps/ai-service/src/ai_service/providers)

这一层更偏“执行基础设施”，而不是业务编排。

## 以后继续演进时的建议

如果继续做下一轮，我建议优先级如下：

1. 在 Python `ai-service` 中逐步把 raw HTTP provider 调用收敛到更薄的 provider adapter，必要时切官方 SDK
2. 给 `ai-service` 增加更清晰的结构化日志、request id、token usage 观测
3. 在 TS 和 Python 两侧补一份共享的内部协议说明，明确请求/响应 schema
4. 如果后续 AI 能力继续增多，可以把“纯执行端口”继续细分，例如 chat、structured output、embedding 分端口

## 当前状态结论

当前这套实现已经从“散点式 AI 调用”演进成了“统一执行通道 + 明确业务边界”的结构。

它还不是最终形态，但已经具备几个重要特征：

- 可以维护
- 可以扩展
- 可以逐步替换底层执行实现
- 不会让 Python 服务反向侵入业务主系统

这是一个比最初版本更稳、更清楚、也更适合继续迭代的架构。
