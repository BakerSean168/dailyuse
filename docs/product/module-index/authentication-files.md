---
tags:
  - product
  - module-index
  - authentication
description: 认证模块相关文件索引
created: 2026-06-02T00:00:00
updated: 2026-07-22T00:00:00
---

# 认证模块文件索引

本索引用于连接[认证模块说明](../modules/authentication.md)与当前代码。GitHub 登录（OAuth identity）主路径已贯通：authorize URL（state/PKCE + identity-only scopes `read:user` / `user:email`）、callback 会话签发、AuthApp UI、账户 bind/unbind。知识仓库 GitHub App installation/token 仍属 Repository 独立授权，不在本模块登录 OAuth 内。真实 GitHub fixture 跨端 E2E 与跨账号合并 UX 仍为后续/外部项。

## 前端页面、状态与组件

| 文件 | 说明 |
| --- | --- |
| [`packages/app-vue/src/router/index.ts`](../../../packages/app-vue/src/router/index.ts) | 顶层路由与 `/auth` 入口 |
| [`packages/app-vue/src/router/guards.ts`](../../../packages/app-vue/src/router/guards.ts) | requiresAuth 路由守卫 |
| [`packages/app-vue/src/views/DesktopAuthView.vue`](../../../packages/app-vue/src/views/DesktopAuthView.vue) | Desktop 认证视图（账密 + 访客；无 GitHub 登录按钮） |
| [`packages/app-vue/src/modules/authentication/stores/authentication-store.ts`](../../../packages/app-vue/src/modules/authentication/stores/authentication-store.ts) | 认证 Pinia store |
| [`packages/app-vue/src/modules/authentication/composables/useAuth.ts`](../../../packages/app-vue/src/modules/authentication/composables/useAuth.ts) | 认证状态与动作编排 |
| [`packages/app-vue/src/modules/authentication/composables/useLogin.ts`](../../../packages/app-vue/src/modules/authentication/composables/useLogin.ts) | 登录组合函数 |
| [`packages/app-vue/src/modules/authentication/composables/useRegister.ts`](../../../packages/app-vue/src/modules/authentication/composables/useRegister.ts) | 注册组合函数 |
| [`packages/app-vue/src/modules/authentication/composables/useGuestMode.ts`](../../../packages/app-vue/src/modules/authentication/composables/useGuestMode.ts) | 访客模式入口 |
| [`packages/app-vue/src/modules/authentication/composables/useRememberedAccounts.ts`](../../../packages/app-vue/src/modules/authentication/composables/useRememberedAccounts.ts) | 记住账号能力 |
| [`packages/app-vue/src/modules/authentication/composables/useSession.ts`](../../../packages/app-vue/src/modules/authentication/composables/useSession.ts) | 会话管理 |
| [`packages/app-vue/src/modules/authentication/composables/usePassword.ts`](../../../packages/app-vue/src/modules/authentication/composables/usePassword.ts) | 密码管理 |
| [`packages/app-vue/src/views/AuthPlatformEntry.vue`](../../../packages/app-vue/src/views/AuthPlatformEntry.vue) | Web 主壳 `/auth` full-page 硬跳转 AuthApp（无 GitHub/访客） |
| [`apps/web/src/auth/WebAuthView.vue`](../../../apps/web/src/auth/WebAuthView.vue) | AuthApp：账密 + 条件 GitHub OAuth 登录/callback |
| [`packages/app-vue/src/views/three-login-surface.matrix.spec.ts`](../../../packages/app-vue/src/views/three-login-surface.matrix.spec.ts) | 三入口矩阵 + step 10 identity≠knowledge-repo 锁 |

## 客户端服务与传输适配器

| 文件 | 说明 |
| --- | --- |
| [`packages/authentication/src/application-client/services/auth-client-service.ts`](../../../packages/authentication/src/application-client/services/auth-client-service.ts) | 客户端认证应用服务 |
| [`packages/authentication/src/application-client/ports/auth-api-client.port.ts`](../../../packages/authentication/src/application-client/ports/auth-api-client.port.ts) | 客户端 API 端口 |
| [`packages/authentication/src/infrastructure-client/adapters/http/auth-http.adapter.ts`](../../../packages/authentication/src/infrastructure-client/adapters/http/auth-http.adapter.ts) | Web HTTP 适配器 |
| [`packages/authentication/src/infrastructure-client/adapters/ipc/auth-ipc.adapter.ts`](../../../packages/authentication/src/infrastructure-client/adapters/ipc/auth-ipc.adapter.ts) | Desktop IPC 适配器 |

## Desktop 认证架构

| 文件 | 说明 |
| --- | --- |
| [`apps/desktop/src/main/modules/authentication/desktop-auth-shell.ts`](../../../apps/desktop/src/main/modules/authentication/desktop-auth-shell.ts) | Desktop 认证 IPC shell |
| [`apps/desktop/src/main/modules/authentication/application/auth-desktop-application-service.ts`](../../../apps/desktop/src/main/modules/authentication/application/auth-desktop-application-service.ts) | Desktop 认证应用服务 |
| [`apps/desktop/src/main/modules/authentication/application/desktop-credential-auth-coordinator.ts`](../../../apps/desktop/src/main/modules/authentication/application/desktop-credential-auth-coordinator.ts) | 账密认证协调器 |
| [`apps/desktop/src/main/modules/authentication/application/desktop-auth-lifecycle-coordinator.ts`](../../../apps/desktop/src/main/modules/authentication/application/desktop-auth-lifecycle-coordinator.ts) | profile 与认证生命周期协调器 |
| [`apps/desktop/src/main/modules/authentication/application/desktop-remembered-account-service.ts`](../../../apps/desktop/src/main/modules/authentication/application/desktop-remembered-account-service.ts) | 记住账号应用服务 |
| [`apps/desktop/src/main/modules/authentication/infrastructure/guest-identity-helper.ts`](../../../apps/desktop/src/main/modules/authentication/infrastructure/guest-identity-helper.ts) | 本地访客身份辅助 |
| [`apps/desktop/src/main/modules/authentication/infrastructure/token-manager.ts`](../../../apps/desktop/src/main/modules/authentication/infrastructure/token-manager.ts) | Token 管理器 |
| [`apps/desktop/src/main/modules/authentication/infrastructure/session-manager.ts`](../../../apps/desktop/src/main/modules/authentication/infrastructure/session-manager.ts) | 会话管理器 |
| [`apps/desktop/src/main/modules/authentication/infrastructure/offline-auth-helper.ts`](../../../apps/desktop/src/main/modules/authentication/infrastructure/offline-auth-helper.ts) | 离线认证辅助 |

## HTTP API 与应用组合

| 文件 | 说明 |
| --- | --- |
| [`packages/authentication/src/api/routes.ts`](../../../packages/authentication/src/api/routes.ts) | 认证 HTTP routes（14 个端点，含 `/oauth/callback`） |
| [`packages/authentication/src/api/module.ts`](../../../packages/authentication/src/api/module.ts) | API 模块生命周期与可选 GitHub 配置入口 |
| [`packages/authentication/src/server/transport/authentication.controller.ts`](../../../packages/authentication/src/server/transport/authentication.controller.ts) | 输入校验与应用端口调用 |
| [`packages/authentication/src/server/application/authentication.application.port.ts`](../../../packages/authentication/src/server/application/authentication.application.port.ts) | transport-neutral 认证应用端口 |
| [`apps/api/src/main.ts`](../../../apps/api/src/main.ts) | API composition root，注入 JWT 与可选 GitHub OAuth 配置 |
| [`apps/api/src/shared/infrastructure/config/env.schema.ts`](../../../apps/api/src/shared/infrastructure/config/env.schema.ts) | `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET` 环境变量 schema |
| [`apps/api/src/shared/infrastructure/config/env.ts`](../../../apps/api/src/shared/infrastructure/config/env.ts) | GitHub OAuth 可选配置读取 |
| [`.env.example`](../../../.env.example) | GitHub 登录环境变量示例与权限边界说明 |


## ADR-034 GitHub 登录 OAuth 生产路径（residual 307/333/335）

| 文件 | 说明 |
| --- | --- |
| [`packages/authentication/src/server/application/use-cases/commands/get-oauth-url.use-case.ts`](../../../packages/authentication/src/server/application/use-cases/commands/get-oauth-url.use-case.ts) | authorize URL + state/PKCE；identity-only scopes `read:user` / `user:email`（永不 repo Contents） |
| [`packages/authentication/src/server/application/use-cases/commands/list-oauth-providers.use-case.ts`](../../../packages/authentication/src/server/application/use-cases/commands/list-oauth-providers.use-case.ts) | 已配置 provider 列表门控 |
| [`packages/authentication/src/server/application/use-cases/commands/bind-oauth.use-case.ts`](../../../packages/authentication/src/server/application/use-cases/commands/bind-oauth.use-case.ts) | 已登录账户 bind GitHub identity |
| [`packages/authentication/src/server/domain/services/providers/github-authentication.provider.ts`](../../../packages/authentication/src/server/domain/services/providers/github-authentication.provider.ts) | GitHub subject find-or-create AuthIdentity（仅身份） |
| [`packages/authentication/src/server/infrastructure/services/github-oauth-client.ts`](../../../packages/authentication/src/server/infrastructure/services/github-oauth-client.ts) | code→user token→`/user` numeric id；token 不写业务 session |
| [`packages/authentication/src/api/routes.ts`](../../../packages/authentication/src/api/routes.ts) | `/oauth/providers` `/oauth/url` `/oauth/callback` `/oauth/bind` `/oauth/unbind` |
| [`packages/repository/src/api/routes/knowledge-repository-connection.routes.ts`](../../../packages/repository/src/api/routes/knowledge-repository-connection.routes.ts) | 知识仓库 GitHub App install/token（与登录 OAuth 分离） |
| [`docs/product/modules/authentication.md`](../modules/authentication.md) | 产品边界：identity-only scopes + 知识仓库 App 独立 |

## 可插拔认证服务端

| 文件 | 说明 |
| --- | --- |
| [`packages/authentication/src/server/application/use-cases/commands/authenticate.use-case.ts`](../../../packages/authentication/src/server/application/use-cases/commands/authenticate.use-case.ts) | provider 分发后统一签发 MemoFlow session |
| [`packages/authentication/src/server/domain/services/authentication-provider.ts`](../../../packages/authentication/src/server/domain/services/authentication-provider.ts) | `AuthenticationProvider` 契约、方式 ID 与领域错误 |
| [`packages/authentication/src/server/domain/services/authentication-provider-registry.ts`](../../../packages/authentication/src/server/domain/services/authentication-provider-registry.ts) | provider 注册、重复检测与运行时解析 |
| [`packages/authentication/src/server/domain/services/providers/password-authentication.provider.ts`](../../../packages/authentication/src/server/domain/services/providers/password-authentication.provider.ts) | 既有账密校验的 provider 适配 |
| [`packages/authentication/src/server/domain/services/providers/github-authentication.provider.ts`](../../../packages/authentication/src/server/domain/services/providers/github-authentication.provider.ts) | GitHub subject 查找或创建 AuthIdentity |
| [`packages/authentication/src/server/domain/services/providers/i-github-oauth-client.ts`](../../../packages/authentication/src/server/domain/services/providers/i-github-oauth-client.ts) | GitHub 授权码换取稳定身份的领域端口 |
| [`packages/authentication/src/server/infrastructure/services/github-oauth-client.ts`](../../../packages/authentication/src/server/infrastructure/services/github-oauth-client.ts) | GitHub token 与 `/user` API 适配器 |
| [`packages/authentication/src/server/infrastructure/authentication.module.ts`](../../../packages/authentication/src/server/infrastructure/authentication.module.ts) | 默认账密 provider、额外 provider 与应用端口组装 |
| [`packages/authentication/src/server/infrastructure/prisma.ts`](../../../packages/authentication/src/server/infrastructure/prisma.ts) | Prisma 仓储与可选 GitHub provider 组合根 |

## 核心领域与持久化

| 文件 | 说明 |
| --- | --- |
| [`packages/authentication/src/server/domain/aggregates/auth-identity.ts`](../../../packages/authentication/src/server/domain/aggregates/auth-identity.ts) | AuthIdentity 聚合根 |
| [`packages/authentication/src/server/domain/aggregates/auth-session.ts`](../../../packages/authentication/src/server/domain/aggregates/auth-session.ts) | AuthSession 聚合根 |
| [`packages/authentication/src/server/domain/entities/password-credential.ts`](../../../packages/authentication/src/server/domain/entities/password-credential.ts) | PasswordCredential 实体 |
| [`packages/authentication/src/server/domain/entities/oauth-binding.ts`](../../../packages/authentication/src/server/domain/entities/oauth-binding.ts) | OAuthBinding 实体 |
| [`packages/authentication/src/server/domain/services/login.ts`](../../../packages/authentication/src/server/domain/services/login.ts) | 账密登录领域服务 |
| [`packages/authentication/src/server/domain/services/registration.ts`](../../../packages/authentication/src/server/domain/services/registration.ts) | 注册领域服务 |
| [`packages/authentication/src/server/domain/repositories/i-auth-identity.repository.ts`](../../../packages/authentication/src/server/domain/repositories/i-auth-identity.repository.ts) | 身份仓储端口，含 OAuth subject 查询 |
| [`packages/authentication/src/server/domain/repositories/i-auth-session.repository.ts`](../../../packages/authentication/src/server/domain/repositories/i-auth-session.repository.ts) | 会话仓储端口 |
| [`packages/authentication/src/server/infrastructure/adapters/prisma/prisma-auth-identity.repository.ts`](../../../packages/authentication/src/server/infrastructure/adapters/prisma/prisma-auth-identity.repository.ts) | Prisma 身份仓储 |
| [`packages/authentication/src/server/infrastructure/adapters/prisma/prisma-auth-session.repository.ts`](../../../packages/authentication/src/server/infrastructure/adapters/prisma/prisma-auth-session.repository.ts) | Prisma 会话仓储 |
| [`packages/database/prisma/schema/auth.prisma`](../../../packages/database/prisma/schema/auth.prisma) | 认证 Prisma schema |

## Contracts 与协议

| 文件 | 说明 |
| --- | --- |
| [`packages/contracts/src/modules/authentication/api/login.dto.ts`](../../../packages/contracts/src/modules/authentication/api/login.dto.ts) | 账密登录 DTO |
| [`packages/contracts/src/modules/authentication/api/oauth.dto.ts`](../../../packages/contracts/src/modules/authentication/api/oauth.dto.ts) | OAuth callback 与授权 DTO |
| [`packages/contracts/src/modules/authentication/api/register.dto.ts`](../../../packages/contracts/src/modules/authentication/api/register.dto.ts) | 注册 DTO |
| [`packages/contracts/src/modules/authentication/api/session.dto.ts`](../../../packages/contracts/src/modules/authentication/api/session.dto.ts) | 会话 DTO |
| [`packages/contracts/src/modules/authentication/dtos/auth-response.ts`](../../../packages/contracts/src/modules/authentication/dtos/auth-response.ts) | 登录成功响应 DTO |
| [`packages/contracts/src/modules/authentication/protocol/auth-event-map.ts`](../../../packages/contracts/src/modules/authentication/protocol/auth-event-map.ts) | 认证事件 map |
| [`packages/contracts/src/modules/authentication/protocol/auth-rpc-map.ts`](../../../packages/contracts/src/modules/authentication/protocol/auth-rpc-map.ts) | 认证 RPC map，含 `auth:oauth-callback` |
| [`packages/contracts/src/modules/authentication/protocol/desktop-auth.types.ts`](../../../packages/contracts/src/modules/authentication/protocol/desktop-auth.types.ts) | Desktop 认证协议类型 |

## 测试入口

| 文件 | 说明 |
| --- | --- |
| [`packages/authentication/src/api/routes.spec.ts`](../../../packages/authentication/src/api/routes.spec.ts) | HTTP route schema 与状态码文档测试 |
| [`packages/authentication/src/api/module.spec.ts`](../../../packages/authentication/src/api/module.spec.ts) | API 模块生命周期测试 |
| [`packages/authentication/src/server/domain/services/__tests__/authentication-provider-registry.spec.ts`](../../../packages/authentication/src/server/domain/services/__tests__/authentication-provider-registry.spec.ts) | provider 注册表测试 |
| [`packages/authentication/src/server/domain/services/__tests__/password-authentication.provider.spec.ts`](../../../packages/authentication/src/server/domain/services/__tests__/password-authentication.provider.spec.ts) | 账密 provider 测试 |
| [`packages/authentication/src/server/domain/services/__tests__/github-authentication.provider.spec.ts`](../../../packages/authentication/src/server/domain/services/__tests__/github-authentication.provider.spec.ts) | GitHub subject 与身份创建测试 |
| [`packages/authentication/src/server/infrastructure/services/__tests__/github-oauth-client.spec.ts`](../../../packages/authentication/src/server/infrastructure/services/__tests__/github-oauth-client.spec.ts) | GitHub API 适配器测试 |
| [`packages/authentication/src/server/infrastructure/__tests__/pluggable-authentication.spec.ts`](../../../packages/authentication/src/server/infrastructure/__tests__/pluggable-authentication.spec.ts) | 可插拔 provider 组合测试 |
| [`packages/authentication/src/server/application/use-cases/commands/__tests__/login.test.ts`](../../../packages/authentication/src/server/application/use-cases/commands/__tests__/login.test.ts) | 既有登录用例回归测试 |
| [`packages/app-vue/src/modules/authentication/stores/authenticationStore.spec.ts`](../../../packages/app-vue/src/modules/authentication/stores/authenticationStore.spec.ts) | 前端认证 store 测试 |
| [`apps/desktop/src/main/modules/authentication/application/__tests__/AuthDesktopApplicationService.spec.ts`](../../../apps/desktop/src/main/modules/authentication/application/__tests__/AuthDesktopApplicationService.spec.ts) | Desktop 认证应用服务测试 |
| [`apps/web/e2e/authentication/auth-flow.spec.ts`](../../../apps/web/e2e/authentication/auth-flow.spec.ts) | Web 认证流程 E2E |

## 需要重点关注的改动风险

- GitHub 登录主路径已接线（authorize + state/PKCE + callback）；勿再写成“仅 callback 骨架”。真实 fixture 跨端 E2E 与账号合并 UX 仍可加强。
- GitHub numeric user ID 才是稳定 subject；用户名和邮箱只能用于展示或显式账号合并。
- GitHub 登录 binding 与知识仓库 GitHub App installation/token 必须隔离（IPC `auth:oauth*` vs `repository:knowledge-connection*`；scopes 仅 `read:user` / `user:email`，永不 repo Contents）；撤销流程也必须独立。
- 会话恢复、refresh token、Desktop 离线 profile 和访客升级不能因 GitHub 故障失效。
- client secret、GitHub user token、MemoFlow token 和一次性 callback code 不得进入浏览器日志、deep link 或仓库配置。
