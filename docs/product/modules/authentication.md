---
tags:
  - product
  - module
  - authentication
description: 认证模块当前实现及账密、GitHub、访客三入口目标态
created: 2026-06-02T00:00:00
updated: 2026-07-18T06:50:00
---

# 认证模块说明

## 1. 功能定位

认证模块管理账密账号、GitHub 身份、访客 profile 和 Daily Use 会话。GitHub 登录只解决“用户是谁”，GitHub 知识仓库连接属于 Repository 的独立同步授权，不能混成一个权限动作。

## 2. 当前实现

- 邮箱密码登录/注册、密码修改、找回和重置。
- 统一 Verification Challenge（`PasswordReset` / `EmailVerify`）：6 位码、hash 存储、冷却与重放防护；开发期 `ConsoleEmailSender`。
- 邮箱验证 API：`POST /api/v1/auth/email/send-code`、`POST /api/v1/auth/email/verify`；验证成功发 `auth:email-verified` 并可将 `Unverified` 身份 `activate`。
- Unverified 门禁：敏感路由需已验证邮箱；白名单含 me / logout / refresh / email/* / password/*。
- IP 限流：`/password/forgot` 与 `/email/send-code`（内存实现，多实例需外置）。
- Web 认证页场景：password-login / register / forgot / reset / verify-email（含重发冷却与 domainCode i18n）。
- access/refresh token、会话撤销和身份锁定。
- Desktop 访客、离线认证、记住账号、自动登录和多 profile。
- OAuthBinding 领域与持久化基础设施。
- GitHub 登录服务端骨架：授权码换取 GitHub numeric user ID、按 OAuth binding 查找或创建 AuthIdentity，并签发 Daily Use session。
- `POST /api/v1/auth/oauth/callback` 已接线；仅在 `GITHUB_OAUTH_CLIENT_ID` 与 `GITHUB_OAUTH_CLIENT_SECRET` 同时配置时启用 GitHub provider，未启用时返回 `SERVICE_UNAVAILABLE`。
- 手机短信入口当前不可用。
- OAuth 授权发起、state/PKCE、Web 登录/回调、providers 门控、账号 bind/unbind 与 Desktop IPC 已接线；生产需配置 GitHub client，e2e 可用 mock。

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
- 完整 OAuth 流程必须校验 state，并在 provider 支持时使用 PKCE；Desktop 只接收一次性 code，不在 deep link 暴露 provider token。服务端 authorize URL 与 state/PKCE 存储校验已接入；Desktop 仅接收一次性 code。

## 6. 可插拔认证架构（已实现服务端骨架）

服务端已落地"抽象登录接口 + 可插拔方式"的架构，为三入口和未来 SSO 提供优雅扩展点：

- `AuthenticationProvider`：抽象登录契约，每种方式实现凭据校验并返回已验证身份，不签发会话。
- `AuthenticationProviderRegistry`：按方式 id 分发，组合期重复注册即快速失败。
- `PasswordAuthenticationProvider`：包装既有 `LoginService`，账密行为不变。
- `GithubAuthenticationProvider`：经 `IGithubOAuthClient` 端口用授权码换取稳定 numeric subject，find-or-create 身份；仅身份认证，不申请仓库权限。
- `AuthenticateUseCase`：统一编排 provider 校验 + Daily Use 会话签发，新增方式无需重复会话逻辑或修改用例。
- `GithubOAuthClient`：具体基础设施适配器（GitHub App user authorization），用授权码临时换取 user access token，再读取 `/user` 的 numeric ID；client secret 仅存服务端，user token 不写入 Daily Use session。
- GitHub 登录通过 `POST /api/v1/auth/oauth/callback` 接收 `{ provider, code, state }`；`GITHUB_OAUTH_CLIENT_ID` 与 `GITHUB_OAUTH_CLIENT_SECRET` 配置齐全时才注册 GitHub provider，缺省仅账密登录。
- 该端点当前是服务端骨架，不等于完整 OAuth 产品流程；授权 URL、state/PKCE 校验、浏览器回跳和 Desktop deep link 仍需后续接线。

## 7. 当前差距

- 邮箱验证与密码找回：**服务端 + Web 已闭环**；e2e、主应用 Unverified banner、Desktop IPC 真实现、生产 SMTP 仍缺。
- 注销未级联：`closeAccount` 未同步禁用 Auth / 撤销全部 session（计划 Phase C）。
- challenge 存储与 IP 限流为内存实现，多实例与生产需 Redis/外置。
- 缺少 OAuth 授权发起、state/PKCE 存储校验、Web/Desktop GitHub 登录 UI、浏览器回跳与 Desktop deep link。
- 缺少已登录账号的 GitHub binding 添加/移除与账号合并流程。
- 访客升级：Desktop login/register/OAuth 在访客态重绑 profile ownership，保留 profileId/本地 Vault 目录；目标 identity 已有其他 profile 时拒绝静默合并。
- GitHub 登录与知识仓库授权需要在 UI 和 contract 上明确分离。
- 手机短信和 2FA 占位会增加设置复杂度，应在无真实实现时隐藏。

## 8. 风险点

- 同一邮箱可能对应已有账密账号和新的 GitHub identity，需要安全的账号合并确认。
- GitHub 用户名和邮箱可变或隐藏，不能作为稳定主键。
- OAuth token、refresh token 和一次性 callback code 必须隔离存储。
- 访客升级失败不能破坏本地 profile。
- GitHub App 仓库授权不能被误当成登录授权的一部分。

## 9. 相关资料

- [ADR-034: 本地 Obsidian Vault 与可选 GitHub 知识仓库](../../architecture/adr/ADR-034-obsidian-vault-repository.md)
- [Obsidian Vault 与 GitHub 知识仓库后续优化方案](../../plan/active/2026-07-16-obsidian-vault-repository-optimization.md)
- [账户模块说明](./account.md)
- [ADR-036: Auth / Account 边界与验证安全模型](../../architecture/adr/ADR-036-auth-account-boundary-and-verification.md)
- [Auth + Account 安全闭环计划](../../plan/active/2026-07-17-auth-account-security-closure.md)
- [认证模块文件索引](../module-index/authentication-files.md)
