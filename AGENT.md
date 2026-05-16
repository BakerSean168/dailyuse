# Memoflow Agent Guide

本文件是仓库内 AI 协作的唯一维护入口。`AGENTS.md`、`CLAUDE.md` 和 GitHub/Copilot 相关入口只允许指向这里或补充平台特有说明，不再维护平行规则。

## 真值顺序

1. 当前代码、配置和测试
2. 根配置与项目配置：`nx.json`、`project.json`、`package.json`、`eslint.config.ts`、`tsconfig.base.json`、`tsconfig.workspace-src.json`
3. `docs/` 下的正式文档
4. 历史说明、背景材料和归档计划

文档与代码冲突时，以当前代码、配置和测试为准，然后回收或修正文档。

## 工作方式

- 先读代码和配置，再修改。
- 优先使用 `pnpm` 而非 `npm`
- 所有 Nx 命令统一使用 `pnpm nx ...`。
- 需要 build、lint、test、e2e 时，优先运行离改动最近的 Nx target。
- 复杂任务先写计划，再实施。计划统一放在 [`docs/plan/active/README.md`](docs/plan/active/README.md) 说明的目录下。
- 如果在 plan 模式下已经生成了可执行方案，那么在开始实施前，必须先把该方案写入 `docs/plan/active`，再进入执行阶段。
- 已完成或只保留历史参考价值的计划移到 [`docs/plan/archive/README.md`](docs/plan/archive/README.md)。

## 变更策略

- 项目处于活跃开发期，不要求向后兼容。
- 不需要数据迁移路径。
- 优先做根因修复，不引入临时 shim、补丁层或双轨兼容。
- 如果更干净的结构性重构可行，优先于局部修补。
- 保持实现直接、明确、易读。

## 配置与文档边界

- 规则入口看 [`docs/standards/README.md`](docs/standards/README.md)。
- 开发流程入口看 [`docs/guides/development/README.md`](docs/guides/development/README.md)。
- 治理入口看 [`docs/governance/README.md`](docs/governance/README.md)。
- 不在多个文件重复抄同一套配置；配置细节以配置文件本身为准。
- 局部配置允许存在，但必须继承根配置并只保留最小例外。

## 协作入口约定

- `AGENT.md`：唯一维护中的协作规范。
- `AGENTS.md`、`CLAUDE.md`：只做 shim。
- `.github/copilot-instructions.md`：只补 GitHub/Copilot 特有约束，不复制仓库规范。
- `.github/prompts/*.md`：只保留轻量入口，引用 canonical docs，不维护过时项目结构说明。
- 旧的辅助工作区和历史计划目录已退役，不再作为协作入口。

## 最小验证

- 文档和治理相关改动至少运行 `pnpm nx run daily-use:governance-check`。
- 代码和配置改动再补离改动最近的 `lint`、`typecheck`、`test` 或其他相关 target。

桌面端在 Windows 开发模式下的日志目录：
`C:\Users\xx\AppData\Roaming\Memoflow-Dev\logs`
