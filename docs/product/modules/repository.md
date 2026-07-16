---
tags:
  - product
  - module
  - repository
description: 资源库模块当前实现、本地 Vault、可选 GitHub 同步与跨端边界
created: 2026-06-02T00:00:00
updated: 2026-07-16T00:00:00
---

# 资源库模块说明

## 1. 功能定位

资源库模块负责把用户的 Markdown 知识资产接入 Daily Use 的浏览、搜索、引用、AI 和跨端流程。长期定位不是独立知识编辑器，而是本地 Obsidian Vault、可选 GitHub private repository 和 Memory Flow 业务能力之间的边界。

[ADR-034](../../architecture/adr/ADR-034-obsidian-vault-repository.md) 已采纳：本地 Vault 优先；GitHub 登录与仓库授权解耦；用户需要同步时再连接 GitHub；绑定后 Web 可以安全地快捷创建新笔记。

## 2. 当前实现（尚未完成 ADR-034）

- 每个用户自动创建一个数据库 Repository 工作区。
- 支持文件夹、资源、标签、书签、搜索、上传和批量导入。
- Desktop 内容仍位于 profile 的 `storage/repository-storage`。
- Web 仍挂载完整 Repository/Editor HTTP service，提供数据库笔记的新建、编辑和保存。
- OAuth binding 数据结构存在，但 GitHub 登录、GitHub App 安装和仓库连接尚未落地。
- `SyncRepositoryUseCase` 仍是占位，没有 Git runtime 或 webhook ingestion。

以上是迁移前代码事实，不代表最终产品边界。

## 3. 已采纳目标态

### 本地 Desktop

- 账密用户、GitHub 用户和访客都可以选择本地 Obsidian Vault。
- 未连接 GitHub 时，所有笔记和附件只存在本地。
- Desktop 扫描、监听、预览、搜索，并使用 `obsidian://` 外部编辑。
- Agent 根据运行时可用上下文、知识库结构和用户当前指令提出路径和内容，用户确认后写入 Vault。

### GitHub 同步

- 登录方式和知识仓库授权分开。
- 账密或 GitHub 在线账号可创建/连接一个 private repository。
- Desktop 将 Vault 作为 Git working tree，批量 commit、pull/rebase 和 push。
- GitHub App webhook 驱动服务端 read model、链接索引和 RAG。
- GitHub 故障或撤销授权不影响本地 Vault。

### Web 与 Mobile

- 未连接仓库时提示去 Desktop 连接同步。
- 连接后支持浏览、搜索、预览、反链和 RAG。
- Web 首期支持创建唯一的新 Markdown 文件和确认 AI 草稿入库。
- 已有笔记编辑、移动、重命名、删除和冲突解决暂不开放。
- 所有 Web 写入先创建 Git commit，不能只写服务端数据库。

## 4. 核心数据流

```text
Local Obsidian Vault
  <-> Desktop Git runtime
  <-> GitHub private repository
       -> verified webhook
       -> server read model + RAG
       -> Web/Mobile

Web create
  -> Daily Use API
  -> GitHub App commit
  -> webhook/read model
  -> Desktop pull
```

## 5. 目标用户路径

- 访客：进入 Desktop → 选择 Vault → 本地浏览与 Obsidian 编辑。
- 在线但未同步：登录 → 选择 Vault → 保持仅本地，或主动连接 GitHub。
- 创建仓库：连接 GitHub → 确认 private repo → 安装 App 到该仓库 → 首次 push。
- 连接已有仓库：授权指定 repo → 选择空目录 clone，或显式处理本地/远端差异。
- Web 快捷创建：Agent 生成完整写入提案 → 用户确认 → Git commit → Desktop pull。
- 访客升级：注册/登录 → 保留原 Vault → 再决定是否连接 GitHub。

## 6. 业务规则

- GitHub 登录不自动授权知识仓库；账密用户同样可以绑定 GitHub。
- 未绑定 GitHub 时不上传 Vault 内容。
- 新建 GitHub 仓库默认 private，GitHub App 安装范围限定到该仓库。
- 本地和远端都非空时不得自动覆盖或静默合并。
- Desktop 不 force push；冲突时暂停并保留双方内容。
- Web 创建按 repository 串行提交，以 request ID 和 commit SHA 幂等。
- 服务端投影可以从 default branch 重建，不是可独立编辑的数据源。
- Agent 写入提案包含 path、title、frontmatter、content 和 reason；写入始终需要用户确认。
- Agent 上下文的载体和注入机制待专项设计，不预先规定固定 Vault 文件。
- 移除 AI 固定默认目录设置；无指令时由用户确认提议路径。
- 仓库改为 public 时告警并暂停新的 RAG ingestion。

## 7. 当前差距

- 缺少本地 Vault 绑定、扫描和外部打开。
- 缺少 GitHub 登录的完整 OAuth UI、回调和 Desktop deep link。
- 缺少独立 GitHub App installation/仓库授权。
- 缺少 private repo 创建、首次对账和 Git runtime。
- 缺少 webhook ingestion、read model 和仓库生命周期处理。
- Web 创建仍写数据库，不会创建 Git commit。
- AI 仍可能走固定路径或数据库 Resource 写入，尚未接入统一写入提案和用户确认契约。
- Markdown 预览缺少真实仓库内容所需的 sanitizer。

## 8. 风险点

- GitHub private repository 不是对 GitHub/Daily Use 服务端不可见的 E2E 加密。
- Git 冲突、仓库体积、大附件和 Git LFS 会增加 Desktop 复杂度。
- GitHub App 撤销、仓库删除/公开、账号限制会影响跨端能力。
- 同时使用 Obsidian Git 插件与 Daily Use 自动 Git 可能产生 lock 和竞态。
- Agent 读取的知识内容不可信，必须防止路径穿越、命令执行和提示注入越权。
- Web 创建和 Desktop push 并发时必须通过远端 HEAD 和串行提交控制。

## 9. 相关资料

- [ADR-034: 本地 Obsidian Vault 与可选 GitHub 知识仓库](../../architecture/adr/ADR-034-obsidian-vault-repository.md)
- [Obsidian Vault 与 GitHub 知识仓库后续优化方案](../../plan/active/2026-07-16-obsidian-vault-repository-optimization.md)
- [编辑器模块说明](./editor.md)
- [AI 模块说明](./ai.md)
- [资源库模块文件索引](../module-index/repository-files.md)
