---
tags:
  - product
  - module
  - authentication
description: 认证模块当前实现及账密、GitHub、访客三入口目标态
created: 2026-06-02T00:00:00
updated: 2026-07-16T00:00:00
---

# 认证模块说明

## 1. 功能定位

认证模块管理账密账号、GitHub 身份、访客 profile 和 Daily Use 会话。GitHub 登录只解决“用户是谁”，GitHub 知识仓库连接属于 Repository 的独立同步授权，不能混成一个权限动作。

## 2. 当前实现

- 邮箱密码登录/注册、密码修改、找回和重置。
- access/refresh token、会话撤销和身份锁定。
- Desktop 访客、离线认证、记住账号、自动登录和多 profile。
- OAuthBinding 领域与持久化基础设施。
- 手机短信入口当前不可用。
- GitHub 登录的完整 UI、回调、Desktop deep link 和账号绑定尚未实现。

## 3. 已采纳目标态

| 入口          | 能力                                                  |
| ------------- | ----------------------------------------------------- |
| 账密注册/登录 | 在线账号、业务同步、可后续绑定 GitHub 知识仓库        |
| GitHub 登录   | 在线账号、业务同步；知识仓库仍需单独授权              |
| 访客          | Desktop 本地 profile；不能使用 Web 笔记或 GitHub 同步 |

- GitHub 登录使用稳定 numeric user ID 作为外部 subject。
- 登录成功后仍由 Daily Use 签发自己的 session，不用 GitHub token 直接访问业务 API。
- GitHub 登录只请求身份所需权限，不自动创建仓库或申请 Contents 权限。
- 账密用户可以绑定 GitHub 仓库，不要求切换主登录方式。
- 访客启用同步时先升级账号，原 Vault 和本地内容保持不变。

## 4. 目标用户路径

- 账密：注册/登录 → 进入应用 → 可本地选择 Vault → 可选连接 GitHub。
- GitHub：选择 GitHub 登录 → 系统浏览器授权 → Daily Use callback/session → 可选连接知识仓库。
- 访客：直接进入 Desktop → 本地使用 → 启用同步时升级为在线账号。
- GitHub 绑定：已登录账号在账户页添加/移除 GitHub OAuth binding。
- 仓库授权：在知识仓库页单独安装 GitHub App 到指定 repository。

## 5. 业务规则

- AuthIdentity 是核心聚合，PasswordCredential 和 OAuthBinding 是关联实体。
- GitHub 登录 binding 与 KnowledgeRepositoryConnection 是不同模型、scope 和撤销流程。
- GitHub-only 账号移除最后一个 OAuth binding 前，需要增加账密凭据或明确处置账号。
- 访客 profile 不上传业务和 Vault 数据。
- Desktop 离线时允许已建立 profile 继续本地使用；GitHub/Daily Use 故障不得锁住 Vault。
- OAuth callback 使用 state/PKCE；Desktop 只接收一次性 code，不在 deep link 暴露 provider token。

## 6. 当前差距

- 缺少 GitHub provider、callback 和账号合并/绑定流程。
- 缺少 Web 与 Desktop 的统一 OAuth 状态处理。
- 访客升级后 profile/Vault ownership 的无移动接管尚未固化。
- GitHub 登录与知识仓库授权需要在 UI 和 contract 上明确分离。
- 手机短信和 2FA 占位会增加设置复杂度，应在无真实实现时隐藏。

## 7. 风险点

- 同一邮箱可能对应已有账密账号和新的 GitHub identity，需要安全的账号合并确认。
- GitHub 用户名和邮箱可变或隐藏，不能作为稳定主键。
- OAuth token、refresh token 和一次性 callback code 必须隔离存储。
- 访客升级失败不能破坏本地 profile。
- GitHub App 仓库授权不能被误当成登录授权的一部分。

## 8. 相关资料

- [ADR-034: 本地 Obsidian Vault 与可选 GitHub 知识仓库](../../architecture/adr/ADR-034-obsidian-vault-repository.md)
- [Obsidian Vault 与 GitHub 知识仓库后续优化方案](../../plan/active/2026-07-16-obsidian-vault-repository-optimization.md)
- [账户模块说明](./account.md)
- [认证模块文件索引](../module-index/authentication-files.md)
