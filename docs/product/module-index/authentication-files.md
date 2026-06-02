---
tags:
  - product
  - module-index
  - authentication
description: 认证模块相关文件索引
created: 2026-06-02T00:00:00
updated: 2026-06-02T00:00:00
---

# 认证模块文件索引

本索引用于连接认证模块的业务说明和真实代码。

## 前端页面与路由

| 文件 | 说明 |
| --- | --- |
| [`packages/app-vue/src/router/index.ts`](../../../packages/app-vue/src/router/index.ts) | 顶层路由，定义 /auth 路由 |
| [`packages/app-vue/src/router/guards.ts`](../../../packages/app-vue/src/router/guards.ts) | 认证守卫，重定向未认证用户 |
| [`packages/app-vue/src/views/DesktopAuthView.vue`](../../../packages/app-vue/src/views/DesktopAuthView.vue) | Desktop 认证视图 |

## 前端状态、组合函数与组件

| 文件 | 说明 |
| --- | --- |
| [`packages/app-vue/src/modules/authentication/stores/authentication-store.ts`](../../../packages/app-vue/src/modules/authentication/stores/authentication-store.ts) | 认证 Pinia store |
| [`packages/app-vue/src/modules/authentication/composables/useAuth.ts`](../../../packages/app-vue/src/modules/authentication/composables/useAuth.ts) | 认证编排组合函数 |
| [`packages/app-vue/src/modules/authentication/composables/useLogin.ts`](../../../packages/app-vue/src/modules/authentication/composables/useLogin.ts) | 登录组合函数 |
| [`packages/app-vue/src/modules/authentication/composables/useRegister.ts`](../../../packages/app-vue/src/modules/authentication/composables/useRegister.ts) | 注册组合函数 |
| [`packages/app-vue/src/modules/authentication/composables/useGuestMode.ts`](../../../packages/app-vue/src/modules/authentication/composables/useGuestMode.ts) | 游客模式组合函数 |
| [`packages/app-vue/src/modules/authentication/composables/useRememberedAccounts.ts`](../../../packages/app-vue/src/modules/authentication/composables/useRememberedAccounts.ts) | 记住账号组合函数 |
| [`packages/app-vue/src/modules/authentication/composables/useSession.ts`](../../../packages/app-vue/src/modules/authentication/composables/useSession.ts) | 会话管理组合函数 |
| [`packages/app-vue/src/modules/authentication/composables/usePassword.ts`](../../../packages/app-vue/src/modules/authentication/composables/usePassword.ts) | 密码管理组合函数 |
| [`packages/app-vue/src/modules/authentication/composables/useSmsCodeCountdown.ts`](../../../packages/app-vue/src/modules/authentication/composables/useSmsCodeCountdown.ts) | 短信验证码倒计时 |
| [`packages/app-vue/src/modules/authentication/components/LoginForm.vue`](../../../packages/app-vue/src/modules/authentication/components/LoginForm.vue) | 登录表单组件 |
| [`packages/app-vue/src/modules/authentication/components/RegisterForm.vue`](../../../packages/app-vue/src/modules/authentication/components/RegisterForm.vue) | 注册表单组件 |

## Desktop 认证架构

| 文件 | 说明 |
| --- | --- |
| [`apps/desktop/src/main/modules/authentication/desktop-auth-shell.ts`](../../../apps/desktop/src/main/modules/authentication/desktop-auth-shell.ts) | Desktop 认证 IPC shell |
| [`apps/desktop/src/main/modules/authentication/application/auth-desktop-application-service.ts`](../../../apps/desktop/src/main/modules/authentication/application/auth-desktop-application-service.ts) | Desktop 认证应用服务 |
| [`apps/desktop/src/main/modules/authentication/application/desktop-credential-auth-coordinator.ts`](../../../apps/desktop/src/main/modules/authentication/application/desktop-credential-auth-coordinator.ts) | 凭证认证协调器 |
| [`apps/desktop/src/main/modules/authentication/application/desktop-auth-lifecycle-coordinator.ts`](../../../apps/desktop/src/main/modules/authentication/application/desktop-auth-lifecycle-coordinator.ts) | 认证生命周期协调器 |
| [`apps/desktop/src/main/modules/authentication/application/desktop-remembered-account-service.ts`](../../../apps/desktop/src/main/modules/authentication/application/desktop-remembered-account-service.ts) | 记住账号服务 |
| [`apps/desktop/src/main/modules/authentication/infrastructure/token-manager.ts`](../../../apps/desktop/src/main/modules/authentication/infrastructure/token-manager.ts) | Token 管理器 |
| [`apps/desktop/src/main/modules/authentication/infrastructure/session-manager.ts`](../../../apps/desktop/src/main/modules/authentication/infrastructure/session-manager.ts) | 会话管理器 |
| [`apps/desktop/src/main/modules/authentication/infrastructure/offline-auth-helper.ts`](../../../apps/desktop/src/main/modules/authentication/infrastructure/offline-auth-helper.ts) | 离线认证辅助 |

## API、控制器与适配器

| 文件 | 说明 |
| --- | --- |
| [`packages/authentication/src/api/routes.ts`](../../../packages/authentication/src/api/routes.ts) | 认证 HTTP routes（13 个端点） |
| [`packages/authentication/src/api/module.ts`](../../../packages/authentication/src/api/module.ts) | 认证 API 模块定义 |
| [`packages/authentication/src/controllers/auth.controller.ts`](../../../packages/authentication/src/controllers/auth.controller.ts) | 认证控制器 |

## 领域、用例与仓储

| 文件 | 说明 |
| --- | --- |
| [`packages/authentication/src/domain-server/aggregates/auth-identity.ts`](../../../packages/authentication/src/domain-server/aggregates/auth-identity.ts) | AuthIdentity 聚合根 |
| [`packages/authentication/src/domain-server/aggregates/auth-session.ts`](../../../packages/authentication/src/domain-server/aggregates/auth-session.ts) | AuthSession 聚合根 |
| [`packages/authentication/src/domain-server/entities/password-credential.ts`](../../../packages/authentication/src/domain-server/entities/password-credential.ts) | PasswordCredential 实体 |
| [`packages/authentication/src/domain-server/services/login.ts`](../../../packages/authentication/src/domain-server/services/login.ts) | 登录领域服务 |
| [`packages/authentication/src/domain-server/services/registration.ts`](../../../packages/authentication/src/domain-server/services/registration.ts) | 注册领域服务 |
| [`packages/authentication/src/application-server/use-cases/commands/login.use-case.ts`](../../../packages/authentication/src/application-server/use-cases/commands/login.use-case.ts) | 登录用例 |
| [`packages/authentication/src/application-server/use-cases/commands/register.use-case.ts`](../../../packages/authentication/src/application-server/use-cases/commands/register.use-case.ts) | 注册用例 |
| [`packages/authentication/src/application-server/use-cases/commands/refresh-token.use-case.ts`](../../../packages/authentication/src/application-server/use-cases/commands/refresh-token.use-case.ts) | 刷新 token 用例 |
| [`packages/authentication/src/infrastructure-server/authentication.module.ts`](../../../packages/authentication/src/infrastructure-server/authentication.module.ts) | 服务端认证模块组合根 |
| [`packages/authentication/src/infrastructure-server/encryptors/argon2-hasher.ts`](../../../packages/authentication/src/infrastructure-server/encryptors/argon2-hasher.ts) | Argon2 密码哈希 |

## Contracts 与数据结构

| 文件 | 说明 |
| --- | --- |
| [`packages/contracts/src/modules/authentication/aggregates/auth-identity-server.ts`](../../../packages/contracts/src/modules/authentication/aggregates/auth-identity-server.ts) | AuthIdentity 服务端 DTO |
| [`packages/contracts/src/modules/authentication/aggregates/auth-session-server.ts`](../../../packages/contracts/src/modules/authentication/aggregates/auth-session-server.ts) | AuthSession 服务端 DTO |
| [`packages/contracts/src/modules/authentication/api/login.dto.ts`](../../../packages/contracts/src/modules/authentication/api/login.dto.ts) | 登录 API DTO |
| [`packages/contracts/src/modules/authentication/api/register.dto.ts`](../../../packages/contracts/src/modules/authentication/api/register.dto.ts) | 注册 API DTO |
| [`packages/contracts/src/modules/authentication/protocol/auth-event-map.ts`](../../../packages/contracts/src/modules/authentication/protocol/auth-event-map.ts) | 认证事件 map |
| [`packages/contracts/src/modules/authentication/protocol/auth-rpc-map.ts`](../../../packages/contracts/src/modules/authentication/protocol/auth-rpc-map.ts) | 认证 RPC map |
| [`packages/contracts/src/modules/authentication/protocol/desktop-auth.types.ts`](../../../packages/contracts/src/modules/authentication/protocol/desktop-auth.types.ts) | Desktop 认证类型 |
| [`packages/database/prisma/schema/auth.prisma`](../../../packages/database/prisma/schema/auth.prisma) | 认证 Prisma schema |

## 测试入口

| 文件 | 说明 |
| --- | --- |
| [`packages/authentication/src/domain-server/aggregates/__tests__/auth-identity.spec.ts`](../../../packages/authentication/src/domain-server/aggregates/__tests__/auth-identity.spec.ts) | AuthIdentity 聚合测试 |
| [`packages/authentication/src/domain-server/services/__tests__/login.spec.ts`](../../../packages/authentication/src/domain-server/services/__tests__/login.spec.ts) | 登录服务测试 |
| [`packages/authentication/src/application-server/use-cases/commands/__tests__/login.test.ts`](../../../packages/authentication/src/application-server/use-cases/commands/__tests__/login.test.ts) | 登录用例测试 |
| [`packages/authentication/src/api/routes.spec.ts`](../../../packages/authentication/src/api/routes.spec.ts) | 认证 routes 测试 |
| [`packages/app-vue/src/modules/authentication/stores/authenticationStore.spec.ts`](../../../packages/app-vue/src/modules/authentication/stores/authenticationStore.spec.ts) | 认证 store 测试 |
| [`apps/web/e2e/authentication/auth-flow.spec.ts`](../../../apps/web/e2e/authentication/auth-flow.spec.ts) | Web 认证流程 e2e |
| [`apps/desktop/src/main/modules/authentication/application/__tests__/AuthDesktopApplicationService.spec.ts`](../../../apps/desktop/src/main/modules/authentication/application/__tests__/AuthDesktopApplicationService.spec.ts) | Desktop 认证服务测试 |

## 需要重点关注的改动风险

- 会话恢复和 token 刷新的可靠性。
- 认证状态对所有 requiresAuth 页面的影响。
- Desktop 认证架构与 packages/authentication 的一致性。
- 密码安全和暴力破解防护。
