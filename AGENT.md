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
- 涉及 Docker、运行时、env 注入、部署链路或生产镜像的改动，默认先用 `docker-compose.local.yml` 做本地 prod-like 验证，再进入 PR。
- 复杂任务先写计划，再实施。计划统一放在 [`docs/plan/active/README.md`](docs/plan/active/README.md) 说明的目录下。
- 如果在 plan 模式下已经生成了可执行方案，那么在开始实施前，必须先把该方案写入 `docs/plan/active`，再进入执行阶段。
- 已完成或只保留历史参考价值的计划移到 [`docs/plan/archive/README.md`](docs/plan/archive/README.md)。

## 本地验证与发布主线

- 本地容器验证入口：[`docs/guides/development/local.docker.md`](docs/guides/development/local.docker.md)
- 标准发布链路入口：[`docs/guides/development/release-workflow.md`](docs/guides/development/release-workflow.md)
- 默认顺序固定为：
  1. 本地用 `docker compose -f docker-compose.local.yml --env-file .env.production.local up -d --build` 验证
  2. 发起 PR，合并到 `main`
  3. 等待 `release-please` 更新或创建 release PR
  4. 合并 release PR，触发正式 tag / release
  5. 由 `docker-deploy.yml` 构建并推送生产镜像
- 不把“手工替换生产镜像 tag”“手工改生产 compose”“直接在生产机试错”当成默认开发流程；这些只属于例外的 rollout、回滚或故障处理动作。

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

## Repository Skills

- 项目专属 agent skills 统一放在 `tools/agent-skills/`。
- 当前本地部署验证 skill 位于 `tools/agent-skills/validate-local-deploy/`。
- 需要给其他开发者或 agent 安装时，从仓库内 skill 目录复制或软链接到本机 `$CODEX_HOME/skills`；若未设置 `CODEX_HOME`，则使用 `~/.codex/skills`。
- 安装示例与目录约定见 `tools/agent-skills/README.md`。

## 最小验证

- 文档和治理相关改动至少运行 `pnpm nx run daily-use:governance-check`。
- 代码和配置改动再补离改动最近的 `lint`、`typecheck`、`test` 或其他相关 target。

桌面端在 Windows 开发模式下的日志目录：
`C:\Users\xx\AppData\Roaming\Memoflow-Dev\logs`
