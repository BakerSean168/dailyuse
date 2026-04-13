---
tags:
  - guide
  - development
  - git
  - workflow
description: Git 协作流程入口
created: 2025-11-23T16:20:00
updated: 2026-04-13T00:00:00
---

# Git 工作流

这篇文档只保留仓库当前需要的最小协作约定，不再维护大段 Git 教程、分支案例库或历史流程说明。

## 当前约定

- 使用短生命周期分支，默认从 `main` 切出并通过 PR 合回 `main`。
- 提交信息遵循 Conventional Commits，重点是 `feat`、`fix`、`refactor`、`docs`、`test`、`chore`。
- 提交前先跑离改动最近的 Nx target；测试入口见 [`testing.md`](./testing.md)。
- 不在仓库文档里维护和平台配置强绑定的 PR 审批、保护分支或发布面板操作细节。

## 最小实践

- 分支命名保持直接可读，例如 `feat/sync-token`, `fix/desktop-ipc-timeout`, `refactor/task-module`。
- commit message 只表达一次原子变更，不把多类修改揉进同一条提交。
- 文档改动如果同时伴随代码或配置变化，应和对应实现一起提交，避免“文档先于代码”或“代码已变、文档未跟”。
- 如果流程规则已经固化在 CI、仓库设置或发布配置中，文档只保留入口说明，不重复解释平台操作。
