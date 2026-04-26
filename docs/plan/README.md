---
tags:
  - plan
  - governance
  - index
description: 仓库计划目录入口
created: 2026-04-26T00:00:00
updated: 2026-04-26T00:00:00
---

# 计划目录

`docs/plan` 是仓库内唯一维护中的任务计划目录。新的实施计划、系统分析、重构路线图和 agent 执行计划统一落在这里。

## 目录约定

- [`active/`](./active/README.md)：当前仍在推进、还会继续更新的计划
- [`archive/`](./archive/README.md)：已完成、暂停或只保留参考价值的历史计划

## 命名规则

- 推荐格式：`YYYY-MM-DD-topic-slug.md`
- 文件名使用小写 kebab-case
- 一个文件只表达一个明确主题，不混合无关任务

## 使用约定

- 新计划默认放 `docs/plan/active`
- 完成后移动到 `docs/plan/archive`
- 产品/架构背景说明继续留在各自主题文档中，不把它们当成执行计划目录
- 旧目录中的计划逐步迁移到这里，不再新增新的分散计划入口
- 旧辅助工作区里的计划目录已退役，不再作为计划真值目录
