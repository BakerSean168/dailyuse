---
tags:
  - plan
  - active
  - ai
  - agent
  - knowledge
  - workflow
description: Knowledge Generation Agent 方案，覆盖知识库创建、知识笔记生成、去重、确认写入与索引刷新
created: 2026-06-04T00:00:00
updated: 2026-06-04T00:00:00
---

# Knowledge Generation Workflow 方案

## 1. 目标

Knowledge Generation Agent 的目标是把用户输入、聊天上下文、资料片段和问答结果转化为可长期复用的个人知识资产。

推荐主流程：

`capture_source -> normalize_material -> retrieve_related -> draft_note -> quality_check -> approval_interrupt -> persist_note -> index_note -> result`

它服务三个入口：

- 整理当前对话为知识笔记。
- 把一段材料生成知识笔记。
- 把一次知识问答沉淀为总结笔记。

## 2. 多方案比较

### 方案 A：直接生成 Markdown 并保存

流程：

`topic -> markdown -> save`

优点：

- 最快。
- 复用当前 `KnowledgeNoteService`。
- 交互简单。

缺点：

- 容易重复建笔记。
- 缺少来源和引用。
- 用户确认边界不清晰。
- 写入后索引刷新不稳定。

适用：

- demo 或临时生成笔记。

### 方案 B：生成草稿后确认保存

流程：

`source -> draft -> confirm -> save -> index`

优点：

- 符合写入确认原则。
- 容易接现有 repository persistence。
- 前端可快速落地。

缺点：

- 相关知识去重和引用仍弱。
- 后续扩展到问答沉淀时需要补节点。

适用：

- 第一阶段最小可用版本。

### 方案 C：Knowledge Generation Graph

流程：

`capture_source -> normalize_material -> retrieve_related -> draft_note -> quality_check -> approval_interrupt -> persist_note -> index_note -> result`

优点：

- 能处理对话、材料、问答多入口。
- 支持去重、引用、路径建议、确认写入。
- 写入后可自动刷新索引或标记待索引。
- 与 Knowledge Q&A 共用 citation 和 retrieval 能力。

缺点：

- 需要设计 note draft artifact。
- 需要更清晰的 repository write executor。

推荐程度：最高。

## 3. 推荐 Workflow

### 3.1 capture_source

输入来源：

- 用户粘贴的资料。
- 当前 AI conversation。
- Knowledge Q&A 的 answer + citations。
- 已有 repository resource。

输出：

- `source_type`
- `source_content`
- `source_refs`
- `conversation_range`

规则：

- 如果来源是问答结果，必须带上原始 citations。
- 如果来源是对话，记录涉及的 message ids。

### 3.2 normalize_material

职责：

- 提炼主题。
- 生成候选标题。
- 生成候选路径。
- 生成 tags。
- 判断笔记类型。

建议 note types：

- `concept`
- `decision`
- `summary`
- `how-to`
- `reference`
- `meeting`
- `qa-summary`

输出：

- `normalized_topic`
- `candidate_title`
- `candidate_path`
- `tags`
- `note_type`
- `summary`

### 3.3 retrieve_related

只读工具：

- `find_related_notes`
- `search_knowledge`
- `fetch_resource`

职责：

- 找已有相关笔记。
- 判断是否应该新建、合并、更新。
- 给出重复风险。

输出：

- `related_notes`
- `duplicate_risk`
- `recommended_write_mode`

write mode：

- `create_new`
- `append_existing`
- `update_existing`
- `skip_save`

默认第一阶段只实现 `create_new`，但文档和 UI 预留提示。

### 3.4 draft_note

输出：

- `note_draft.title`
- `note_draft.path`
- `note_draft.markdown`
- `note_draft.tags`
- `note_draft.sources`
- `note_draft.related_resource_ids`

Markdown 结构建议：

```markdown
# Title

## Summary

## Key Points

## Details

## Sources
```

规则：

- 不把没有证据的内容写成事实。
- 来自 AI 推断的内容要表达为建议或假设。
- 如果是问答沉淀，保留引用来源列表。

### 3.5 quality_check

检查：

- 标题是否明确。
- 内容是否过短或空泛。
- 是否包含来源。
- 是否与已有笔记重复。
- 是否包含不能确认的事实。
- 路径是否可写。

输出：

- `quality_status`
- `warnings`
- `required_edits`

规则：

- 严重问题必须回到 draft。
- 轻微问题可进入确认面板。

### 3.6 approval_interrupt

前端展示：

- 标题。
- 保存路径。
- tags。
- markdown preview。
- 来源。
- 相关笔记和重复风险。
- 确认保存、取消、重新生成。

resume payload：

- `approved_note`
- `edited_markdown`
- `edited_path`
- `edited_tags`
- `write_mode`
- `user_decision`

规则：

- 未确认不写 repository。
- 用户编辑后保存编辑后的内容。
- 写入路径由 Repository 模块最终校验。

### 3.7 persist_note

执行边界：

- Agent runtime 不直接写 repository。
- 调用现有 `knowledgeNotePersistence` / Repository module adapter。

输出：

- `resource_id`
- `repository_id`
- `resource_path`
- `created_at`

失败策略：

- 路径冲突：提示用户改名或覆盖策略。
- repository 不可用：保留草稿，可重试。
- 权限失败：标记失败，不重试写入。

### 3.8 index_note

写入后：

- 调用 knowledge indexing。
- 成功则返回 indexed 状态。
- 失败则标记 `index_pending` 或 `index_failed`。

规则：

- 笔记保存成功但索引失败时，不回滚笔记。
- UI 展示“已保存，索引稍后刷新”。

### 3.9 result

展示：

- 新知识笔记入口。
- 索引状态。
- 相关来源。
- 后续动作：
  - 打开笔记。
  - 继续扩展。
  - 基于这篇笔记提问。
  - 关联到目标。

## 4. State Contract

```text
KnowledgeGenerationState
- run_id
- thread_id
- conversation_id
- source_type
- source_content
- source_refs
- normalized_topic
- related_notes
- duplicate_risk
- note_draft
- quality_check
- pending_actions
- approved_note
- persisted_resource
- index_result
- usage
- errors
```

## 5. 前端体验

入口：

- 底部输入意图：“整理知识”。
- Knowledge Q&A answer 后的“沉淀为知识笔记”。
- 当前会话菜单：“整理当前对话”。

右侧面板：

- `NoteDraftPanel`
- `RelatedNotesPanel`
- `SourcePanel`
- `SaveConfirmationPanel`
- `IndexStatusPanel`

注意：

- 不要把完整 markdown 塞进对话气泡。
- 对话区给摘要，右侧承载编辑和确认。

## 6. 验收标准

- 用户能从一段材料生成知识笔记草稿。
- 用户能从一次问答沉淀知识笔记草稿。
- 确认前不会写入 repository。
- 确认面板展示标题、路径、正文、来源和重复风险。
- 写入后返回笔记入口。
- 写入后触发索引或显示待索引状态。
- 索引失败不丢失已保存笔记。
