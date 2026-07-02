---
tags:
  - plan
  - active
  - ai
  - agent
  - knowledge
  - rag
  - workflow
description: Knowledge Q&A Agent 方案，覆盖个人知识库问答、索引、检索、引用、证据不足和问答沉淀
created: 2026-06-04T00:00:00
updated: 2026-06-04T00:00:00
---

# Knowledge Q&A Workflow 方案

## 1. 目标

Knowledge Q&A Agent 的目标是让用户可以自然地问自己的知识库，并得到可信、可追溯、可继续沉淀的答案。

推荐主流程：

`parse_question -> ensure_relevant_index -> retrieve_hybrid -> rerank_citations -> answer_grounded -> grounding_check -> result -> optional_save_note`

与普通聊天不同，Knowledge Q&A 必须默认展示证据：

- answer。
- citations。
- related notes。
- evidence status。
- open source action。
- save as note action。

## 2. 多方案比较

### 方案 A：普通 Chat + 附加知识上下文

流程：

`query -> retrieve resources -> prompt answer`

优点：

- 最快。
- 复用当前 `KnowledgeQueryService`。

缺点：

- 前端难以表达 citation。
- 证据不足时容易退化成普通聊天。
- 无法沉淀问答。

适用：

- 临时内部 API。

### 方案 B：RAG Use Case + Citation Panel

流程：

`query -> sync relevant index -> query -> citations -> answer panel`

优点：

- 贴合当前 TS `QueryKnowledgeUseCase`。
- 可快速启用前端“问知识库”。
- 保留现有 index repository 和 ai-service knowledge query。

缺点：

- workflow 阶段不够显式。
- 后续加 rerank、grounding check、save note 会继续堆 service。

适用：

- 第一阶段产品落地。

### 方案 C：Knowledge Q&A Graph

流程：

`parse_question -> ensure_relevant_index -> retrieve_hybrid -> rerank_citations -> answer_grounded -> grounding_check -> result -> optional_save_note`

优点：

- 每个环节可观测。
- citation、证据不足、索引刷新可作为独立 artifact。
- 与 Knowledge Generation workflow 衔接自然。
- 适合后续加入 reranker、多源检索、记忆和评估。

缺点：

- 需要定义更完整的 `KnowledgeAnswerArtifact`。
- 初期实现比直接 use case 更复杂。

推荐程度：最高。

## 3. 推荐 Workflow

### 3.1 parse_question

输入：

- 用户问题。
- 当前 conversation。
- 用户选中的意图。

输出：

- `question`
- `question_type`
- `requires_personal_knowledge`
- `filters`

question type：

- `fact_lookup`
- `decision_recall`
- `summary`
- `comparison`
- `actionable_advice`
- `open_chat`

规则：

- 用户点击“问知识库”时强制进入 Knowledge Q&A。
- 用户普通输入时可由 intent classifier 判断是否进入知识库问答。

### 3.2 ensure_relevant_index

复用当前 TS 侧能力：

- `SyncRelevantKnowledgeUseCase`
- `SyncKnowledgeResourcesUseCase`
- `KnowledgeIndexRepository`
- `IKnowledgeIngestionPort`

职责：

- 优先查已有索引。
- 需要时同步相关资源。
- 缓存可复用时不重复索引。
- 返回索引状态。

输出：

- `indexed_resources`
- `indexed_count`
- `reused_count`
- `failed_count`
- `index_warnings`

规则：

- 索引失败不直接中断问答；有缓存则继续。
- 没有任何可用资源时返回 evidence insufficient。

### 3.3 retrieve_hybrid

检索策略：

- 关键词检索。
- embedding 相似度。
- resource title/path boost。
- 最近访问或最近更新可作为弱信号。

现状：

- Python `KnowledgeIndexingService` 已有 chunk、embedding、keyword、score 雏形。
- TS index repository 已有 relevant resources 查询。

输出：

- `candidate_chunks`
- `candidate_resources`
- `retrieval_scores`

第一阶段不强制引入独立向量数据库；先强化现有索引表和 hybrid scoring。

### 3.4 rerank_citations

职责：

- 从候选 chunk 中选 citation。
- 去重同一资源的重复片段。
- 控制 citation 数量。
- 标记证据强弱。

输出：

- `citations`
- `evidence_status`

evidence status：

- `strong`
- `partial`
- `insufficient`

默认规则：

- citation 数量 3-5。
- `insufficient` 时不生成肯定答案。
- citation score 低于阈值时降级为“证据不足”。

### 3.5 answer_grounded

职责：

- 只基于 citations 回答。
- 引用来源路径或标题。
- 区分“知识库明确记录”和“基于记录推断”。

输出：

- `answer`
- `answer_outline`
- `used_citation_ids`
- `limitations`

提示规则：

- 不使用 citations 中没有的事实。
- 不把通用模型知识伪装为个人知识库事实。
- 证据不足时明确说明。

### 3.6 grounding_check

检查：

- answer 是否引用至少一个 citation。
- answer 中关键断言是否能映射到 citation。
- 是否出现 citations 外的新事实。
- 是否需要提示“知识库证据不足”。

输出：

- `grounding_status`
- `unsupported_claims`
- `final_answer`

规则：

- `grounding_status=failed` 时重写 answer。
- 仍失败时返回证据不足，不强答。

### 3.7 result

前端展示：

- 答案正文。
- citations 列表。
- 相关笔记。
- 证据状态。
- 打开来源。
- 沉淀为知识笔记。
- 重新索引。

`KnowledgeAnswerArtifact`：

```text
- question
- answer
- evidence_status
- citations
- related_resources
- index_status
- limitations
- suggested_followups
```

### 3.8 optional_save_note

用户点击“沉淀为知识笔记”后，不直接保存。

进入 Knowledge Generation workflow：

- source type: `qa-summary`
- source content: answer。
- source refs: citations。
- candidate title: 基于问题生成。

## 4. 前端体验

入口：

- 意图按钮：“问知识库”。
- 输入框工具菜单。
- 普通聊天中自动识别后提示切换。

右侧面板：

- `CitationPanel`
- `RelatedNotesPanel`
- `IndexStatusPanel`
- `SaveAsNotePanel`

空结果：

- 不展示普通聊天式长回答。
- 展示“当前知识库证据不足”。
- 给出动作：
  - 扩大搜索。
  - 重新索引。
  - 添加材料。
  - 改问法。

## 5. 与当前实现的迁移关系

保留：

- `QueryKnowledgeUseCase`
- `SyncRelevantKnowledgeUseCase`
- `KnowledgeQueryService`
- `KnowledgeIndexingService`
- `KnowledgeCitation` DTO。

调整：

- 前端 `WorkflowMode` 增加 `knowledge-qa` 或用意图层映射到 Knowledge Q&A。
- `AIChatService` 暴露 `queryKnowledge`。
- `AIMessagePanel` 或右侧 context panel 展示 citations。
- Knowledge answer 不只作为 message content，还作为 structured artifact。

## 6. 评估用例

需要建立 eval cases：

- 能从明确笔记中找回用户过往决策。
- 多篇笔记意见冲突时能说明差异。
- 证据不足时不编造。
- 引用路径正确。
- citation excerpt 与 answer 相关。
- 索引部分失败时仍能基于缓存回答。

## 7. 验收标准

- 用户能在统一聊天工作台问知识库。
- answer 必须带 citations 或明确证据不足。
- citation 可打开来源。
- 证据不足时不会编造确定答案。
- 索引状态可见。
- 用户能把问答沉淀为知识笔记草稿。
- 刷新后能恢复当前 answer artifact。
