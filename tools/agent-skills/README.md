# Repository Agent Skills

项目专属 agent skills 统一保存在这个目录，仓库内版本是 canonical source。

当前可安装 skills：

- `validate-local-deploy`
  - 位置：`tools/agent-skills/validate-local-deploy`
  - 用途：代码改动完成后，按本仓库现有 `pnpm nx ...` 和 `pnpm docker:local:*` 工作流做本地部署验证，并生成 `reports/local-deploy-validation/` 报告

## Install

把目标 skill 目录复制或软链接到本机 Codex skills 目录：

- 默认目录：`$CODEX_HOME/skills`
- 如果 `CODEX_HOME` 未设置：`~/.codex/skills`

PowerShell 复制示例：

```powershell
Copy-Item -Recurse -Force `
  .\tools\agent-skills\validate-local-deploy `
  "$HOME\.codex\skills\validate-local-deploy"
```

PowerShell 软链接示例：

```powershell
New-Item -ItemType SymbolicLink `
  -Path "$HOME\.codex\skills\validate-local-deploy" `
  -Target (Resolve-Path .\tools\agent-skills\validate-local-deploy)
```

安装后，agent 可直接使用仓库内 skill 的同名能力。
