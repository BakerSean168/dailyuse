---
tags:
  - product
  - module
  - ai
description: AI 模块当前功能资产说明
created: 2026-06-02T00:00:00
updated: 2026-06-02T00:00:00
---

# AI 模块说明

## 1. 功能定位

AI 模块用于用 AI 辅助用户整理上下文并生成结构化行动。它围绕 AI Chat、目标生成、知识笔记、模型选择和 workflow persistence 形成闭环，是 AI 能力的统一入口。AI 模块产出结构化中间态，真实业务写入仍由业务模块（goal、task、repository）完成。

## 2. 当前功能说明

- AI Chat：用户与 AI 进行对话，支持消息发送和流式响应。
- 目标生成：通过 goal workflow 生成结构化目标草稿，支持澄清、编辑和确认后写入目标模块。
- 目标自动化：AI 可生成任务模板并绑定到目标，支持自动化 tool execution。
- 知识笔记：AI 从对话或资源生成知识笔记，写入 repository 模块。
- 知识查询：基于向量索引的知识检索和问答。
- 知识扩展：对已有知识进行扩展和深化。
- 知识索引：自动同步和索引 repository 中的资源内容。
- 模型选择：用户可配置多个 AI provider（OpenAI、Anthropic 等），选择默认模型。
- Provider 管理：创建、更新、删除、测试连接和刷新模型列表。
- 分析查询：AI 可查询目标、任务和 Dashboard 的分析数据。
- 评估报告：离线评估 harness 用于评估 goal workflow 质量。
- 会话管理：创建、删除、列出对话，支持对话状态管理。
- 双运行时模式：支持直连 LLM provider 和远程 ai-service 两种运行时。

## 3. 用户路径

- AI Chat 路径：用户进入 AI Chat 页面，选择模型，开始对话。AI 可根据对话内容触发 goal workflow 或 knowledge workflow。
- 目标生成路径：用户在 AI Chat 中表达目标意图，AI 生成目标草稿，用户编辑确认后创建真实目标和关键结果。
- 知识笔记路径：用户在 AI Chat 中请求生成知识笔记，AI 生成后写入 repository。
- Provider 配置路径：用户在设置中配置 AI provider，添加 API key，选择默认模型。
- 移动端路径：移动端提供 AI Chat 入口。

## 4. 业务规则

- AIConversation 是 AI 模块核心聚合，AIProviderConfig 是独立聚合，Message 是关联实体。
- AI 模块不绕过业务模块写入业务数据：draft/plan 阶段产出结构化草稿或计划；execute/auto-execute 阶段可在 approved plan/actions 约束下通过 tool executor 调用 Goal、Task、Repository 等业务模块完成写入。
- Goal workflow 分为多个阶段：clarification → draft → automation，每个阶段有独立的 contract 和 handler。
- Knowledge workflow 包括 note generation、expansion、indexing、query 四个子流程。
- Provider 配置使用 AES-256-GCM 加密存储 API key。
- 运行时模式选择：direct-provider（直连 LLM API）或 remote-ai-service（委托给 Python FastAPI 服务）。
- ai-service 是独立的 Python/FastAPI 应用，通过 HMAC 签名的 HTTP 请求与主应用通信。
- 客户端通过 HTTP 或 IPC 适配器访问 AI 能力，服务端通过模块组合根装配用例和仓储实现。

## 5. 相关文件索引

详细文件清单见 [AI 模块文件索引](../module-index/ai-files.md)。

## 6. 当前问题

- AI 写入边界必须清晰：当前 goal automation 可在 approved plan/actions 约束下通过 tool executor 调用 Goal/Task 模块创建目标和任务，需要确认自动执行场景的产品边界。
- Goal workflow、Knowledge workflow 与业务模块之间的耦合较深，workflow 变更可能影响多个模块。
- Provider capability、workflow command、response contract 的一致性需要持续维护。
- ai-service 的部署和运维复杂度较高（独立 Python 应用 + HMAC 签名 + LLM provider 抽象）。
- 知识索引的向量搜索能力和准确性需要进一步验证。

## 7. 优化机会

- 梳理 AI 模块与业务模块的写入边界，建立更清晰的"AI 建议 → 用户确认 → 业务写入"链路。
- 强化 goal workflow 的可视化和进度展示。
- 为知识索引提供更好的管理和维护能力。
- 考虑 AI 模块的缓存和成本控制策略。
- 统一 direct-provider 和 remote-ai-service 两种运行时的行为差异。

## 8. 风险点

- AI 写入边界必须清晰：允许的副作用必须经过 approved plan/actions 和业务模块 executor，不能绕过 Goal/Task/Repository 等模块直接落库。
- Provider capability、workflow command、response contract 的一致性。
- Goal workflow、Knowledge workflow 与业务模块之间的耦合。
- ai-service 的可用性和延迟直接影响 AI 功能的用户体验。
- API key 的安全存储和传输。
- 知识索引的向量数据一致性和存储成本。

## 9. 后续待确认

- AI 自动执行应开放到什么程度：严格限制为"建议 → 确认"模式，还是允许在 approved plan/actions 约束下自动执行。
- Knowledge workflow 的产品价值和用户场景是否需要重新评估。
- ai-service 是否需要支持更多 LLM provider。
- AI 模块的成本控制和使用配额策略。
- 知识索引是否需要支持更多数据源。

## 10. 相关资料

- [目标模块说明](./goal.md)
- [资源库模块说明](./repository.md)
- [AI 模块文件索引](../module-index/ai-files.md)
- [AI Goal workflow v1 文档集](../../guides/ai/goal-workflow-v1/README.md)
