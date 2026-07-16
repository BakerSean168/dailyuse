---
tags:
  - product
  - module
  - editor
description: 编辑器模块当前实现及 Obsidian 外部编辑、Web 快捷创建目标态
created: 2026-06-02T00:00:00
updated: 2026-07-16T00:00:00
---

# 编辑器模块说明

## 1. 功能定位

编辑器模块当前提供 CodeMirror Markdown 编辑、预览、自动保存、链接和引用能力。根据 [ADR-034](../../architecture/adr/ADR-034-obsidian-vault-repository.md)，长期职责收缩为安全预览、知识关系、Web 新笔记确认和 Obsidian 外部编辑。

## 2. 当前实现（迁移前）

- Markdown 编辑器与实时预览。
- 自保存与未保存变更保护。
- Wiki-link 建议、反链、链接图和失效引用处理。
- Web 与 Desktop 共用编辑组件，内容写入数据库 Repository。
- `EditorPreview.vue` 使用 `v-html` 且允许原始 HTML。

当前能力继续作为迁移期事实存在，但跨端完整自建编辑器不再是长期方向。

## 3. 已采纳目标态

### 保留

- Markdown 安全预览、properties、内部链接、嵌入和附件。
- 反链、链接图、搜索命中和 AI 引用跳转。
- Desktop AI/普通新笔记写入前的内容与路径确认。
- Web 新笔记和 AI 草稿的 path/title/frontmatter/content 确认界面。

### 收缩或退役

- Desktop 通用重编辑、自保存、多标签和分屏工作区。
- Web 已有笔记全文编辑与保存。
- 与 Vault/Git 重复的上传、批量导入和自包含导出。
- AI 固定默认目录设置。

### Desktop 主操作

使用经过编码的 `obsidian://open?path=<absolute-path>`，必要时回退到 `vault + file`。Obsidian CLI 只作为可选增强；协议不可用时提供“在文件管理器中显示”和“复制路径”。

### Web 创建

Web 不直接修改 read model。用户确认新笔记后，Repository 服务通过 GitHub App 创建唯一文件和 commit。已有文件编辑等需要 base commit/blob SHA 与冲突 UI 的能力延期。

## 4. 业务规则

- Editor 不直接管理 GitHub token 或 Git 操作，通过 Repository port 协作。
- 未连接 GitHub 的账号和访客不在 Web 展示笔记工作区。
- Web 新建必须基于用户确认的完整 Agent 写入提案创建 Git commit。
- Agent 上下文不能关闭确认、执行代码、扩大授权或允许 Vault 外路径。
- Markdown 输出必须经过 sanitizer；附件使用受认证 URL。
- Web/Mobile 不执行 Dataview、Tasks 查询、主题、CSS snippets 或社区插件代码。

## 5. 当前差距

- Web/desktop 仍共享完整可编辑 `MarkdownEditor`。
- Web 新建/保存写数据库，而不是 Git commit。
- Desktop 尚未提供 Obsidian deep link 与 Git 同步状态。
- 缺少统一 Agent 写入提案和用户确认模型。
- 当前原始 HTML 渲染是接入真实 GitHub/Vault 内容前的安全阻断项。

## 6. 风险点

- Web 和 Desktop 同时创建或未来编辑时存在 Git HEAD 竞争。
- 原始 HTML、危险 URL、SVG/iframe 和递归嵌入可能造成 XSS。
- Obsidian 插件语法无法在独立 Web renderer 中完全复刻。
- 删除旧编辑器前必须保留路径/内容确认、预览和引用跳转能力。

## 7. 相关资料

- [ADR-034: 本地 Obsidian Vault 与可选 GitHub 知识仓库](../../architecture/adr/ADR-034-obsidian-vault-repository.md)
- [Obsidian Vault 与 GitHub 知识仓库后续优化方案](../../plan/active/2026-07-16-obsidian-vault-repository-optimization.md)
- [资源库模块说明](./repository.md)
- [编辑器模块文件索引](../module-index/editor-files.md)
