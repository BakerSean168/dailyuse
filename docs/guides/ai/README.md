---
tags:
  - guide
  - ai
  - index
description: AI 学习与转岗指南目录索引
created: 2026-04-18T00:00:00
updated: 2026-04-19T00:00:00
---

# AI 学习指南

本目录聚焦两个问题：

1. 想转向 `AI Agent / AI 应用工程化`，岗位画像、JD 共性和技能主线是什么。
2. 想把当前仓库当作主训练项目，应该如何围绕 `AI 辅助创建 Goal` 做系统学习。

## 当前入口

| 文档 | 用途 |
| --- | --- |
| [goal-workflow-v1/README.md](./goal-workflow-v1/README.md) | 冻结 2026-04-19 当前第一版 AI 创建 Goal 实现，按链路、运行时、状态与调试拆成多篇笔记 |
| [ai-agent-role-and-skills-guide.md](./ai-agent-role-and-skills-guide.md) | 梳理相关岗位、JD 共性、技能地图、投递关键词和公开岗位样本 |
| [memoflow-ai-goal-learning-guide.md](./memoflow-ai-goal-learning-guide.md) | 基于本项目现状，说明 AI 创建 Goal 的工作流、终极目标、需要学习的技能和详细学习流程 |
| [memoflow-ai-goal-feature-backlog.md](./memoflow-ai-goal-feature-backlog.md) | 把学习路线落成可执行 backlog，按功能项列出改动入口、学习目标和验收标准 |
| [route-2-unified-ai-workflow-orchestrator-plan.md](./route-2-unified-ai-workflow-orchestrator-plan.md) | Route 2 技术方案：以 Chat Goal Tool 为当前唯一主入口，统一到 AI Workflow Orchestrator 与 provider-native function calling runtime |

## 配套阅读

- 当前 AI 创建 Goal 实现说明：[`../development/ai-goal-creation-current-workflow.md`](../development/ai-goal-creation-current-workflow.md)
- 当前 AI 聊天与流式实现说明：[`../development/ai-chat-streaming-current-implementation.md`](../development/ai-chat-streaming-current-implementation.md)
- 开发流程入口：[`../development/README.md`](../development/README.md)
- 项目根入口：[`../../../README.md`](../../../README.md)

## 使用约定

- 这里优先维护学习路径、岗位理解和项目训练路线，不重复维护运行命令总表。
- 涉及具体实现细节时，以当前代码和 `docs/guides/development` 中的实现文档为准。
- 涉及岗位市场判断时，以文档中的公开来源日期为准；招聘信息本身具有时效性。
- `goal-workflow-v1/` 目录是冻结实现记录；后续规划请优先看统一主线文档，而不是把 v1 结构直接当成未来产品结构。
