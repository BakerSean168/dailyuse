---
tags:
  - plan
  - governance
  - ai-collaboration
description: 仓库一致性治理收敛方案
created: 2026-04-26T00:00:00
updated: 2026-04-26T00:00:00
status: archived
---

# 仓库一致性治理收敛方案

## Archive Note

这份计划对应上一阶段的仓库治理收敛工作，现已转入归档目录。当前活跃计划见 `docs/plan/active/` 下的新阶段方案。

## Summary

第一波优化按“全面盘整 + 强约束”执行，目标是把协作入口、计划落点、配置真值、项目元数据和自动检查统一成一个闭环。

当前最突出的不一致有三类：

- 协作入口冲突：根 `AGENTS.md`、`CLAUDE.md`、`.github/copilot-instructions.md`、`.github/prompts/*` 同时存在，且内容新旧混杂。
- 计划资产分散：旧辅助工作区中的计划目录、`docs/guides/ai/*plan*.md`、历史 prompt/agent 资产都在表达“如何计划”，但没有统一落点。
- 工程治理未收口：已有 `docs/governance` 和 `tools/docs/check-docs-config.mjs`，但还没覆盖 agent 文件、计划目录、旧 prompt 漂移、project tags 和局部配置例外。

## Key Changes

### 1. 建立唯一协作真值

- 新建根 `AGENT.md` 作为唯一维护中的 AI 协作规范入口。
- `AGENTS.md`、`CLAUDE.md` 改为极薄 shim，只做指向 `AGENT.md`。
- `.github/copilot-instructions.md` 保留为平台入口，但只引用 `AGENT.md` 和少量 GitHub/Copilot 专属补充。
- `.github/prompts/dailyuse.*` 改成轻量入口，引用 canonical docs，不再重复仓库规范。
- 旧 GitFlow 文档退役，不再作为正式流程来源。

### 2. 统一计划目录与计划生命周期

- 新建 `docs/plan/README.md`、`docs/plan/active/`、`docs/plan/archive/`。
- 新计划统一落在 `docs/plan/active/`。
- 已完成或历史计划移动到 `docs/plan/archive/`。
- 在 `AGENT.md` 中明确计划命名、迁移和目录约定。

### 3. 收紧文档与配置治理边界

- 在 `docs/governance` 下新增配置治理文档，定义根配置所有权和局部配置例外规则。
- 规范 package/app 级 `eslint` 配置：默认继承根配置，只保留最小差异。
- 补强 `.editorconfig`，统一基础格式规则。
- 标准化 `project.json` tags 的最小结构：`scope:*`、`type:*`、`layer:*`。

### 4. 把治理变成可执行检查

- 升级 `tools/docs/check-docs-config.mjs`，新增 agent 入口、计划目录、dailyuse prompt、deprecated gitflow 文档、project tags 和局部 eslint 配置检查。
- 在根 `project.json` 增加 `governance-check` target，并保留 `docs-check` 兼容入口。
- 在根 `package.json` 增加 `governance:check` 脚本。

## Public Interfaces / Repo Contracts

- canonical 协作入口：`AGENT.md`
- canonical 计划目录：`docs/plan/active`、`docs/plan/archive`
- 治理检查入口：`pnpm nx run daily-use:governance-check`
- `AGENTS.md`、`CLAUDE.md`、`.github/copilot-instructions.md` 不再承载独立仓库规范

## Test Plan

- 运行 `pnpm nx run daily-use:governance-check`
- 运行 `pnpm nx run-many -t lint,typecheck --all`
- 人工核对 `README.md`、`docs/governance/README.md`、`AGENT.md`、`.github/copilot-instructions.md` 的入口一致性

## Assumptions And Defaults

- 不保留旧协作入口的独立规则，只保留 shim 或平台补充。
- `AGENTS.md` / `CLAUDE.md` 使用普通文本 shim，不使用 symlink。
- `docs/guides/ai` 继续承担背景说明职责，不承担执行计划目录职责。
- 这一轮先优先完成治理和入口一致性，再继续推进更深层的代码结构收敛。
