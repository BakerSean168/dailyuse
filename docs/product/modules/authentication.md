---
tags:
  - product
  - module
  - authentication
description: 认证模块当前功能资产说明
created: 2026-06-02T00:00:00
updated: 2026-06-02T00:00:00
---

# 认证模块说明

## 1. 功能定位

认证模块用于管理用户登录、注册、密码、会话和身份验证。它围绕登录、注册、密码管理、短信验证码、游客模式、会话状态和记住账号形成闭环，是 Web、Desktop 和 API 认证链路的统一入口。

## 2. 当前功能说明

- 邮箱登录/注册：支持邮箱+密码的登录和注册。
- 手机登录/注册：支持手机号+短信验证码的登录和注册（当前返回 SERVICE_UNAVAILABLE）。
- 密码管理：修改密码、忘记密码、重置密码。
- 会话管理：创建会话、刷新 token、撤销会话、列出活跃会话。
- 游客模式：Desktop 端支持游客模式进入，无需注册。
- 记住账号：Desktop 端支持记住已登录账号，快速切换。
- 自动登录：Desktop 端支持启动时自动登录上次的账号。
- 身份锁定：连续 5 次密码错误后锁定 15 分钟。
- OAuth 绑定：支持 OAuth provider 绑定（当前基础设施已就绪）。
- Desktop 多 profile：Desktop 端支持多 profile 管理，每个 profile 独立的认证状态。
- 离线认证：Desktop 端支持离线模式下的认证（基于本地 token）。

## 3. 用户路径

- Web 登录路径：用户进入登录页面，输入邮箱和密码，系统验证后创建会话，跳转到主页。
- Web 注册路径：用户进入注册页面，输入邮箱和密码，系统创建身份和会话，跳转到主页。
- Desktop 登录路径：Desktop 启动后检查本地 token，如果有有效 token 则自动登录；否则显示登录页面，支持邮箱登录、游客模式和记住账号切换。
- 密码重置路径：用户点击忘记密码，输入邮箱，系统发送重置码，用户输入新密码完成重置。

## 4. 业务规则

- AuthIdentity 是认证模块核心聚合，AuthSession 是独立聚合。
- PasswordCredential 和 OAuthBinding 是 AuthIdentity 的关联实体。
- AuthIdentifier（邮箱/手机号）是 AuthIdentity 的值对象存储。
- 会话 token 策略：access token 15 分钟，refresh token 7 天，滑动窗口 1 小时。
- 身份状态：Unverified → Active → Locked/Disabled。
- 密码使用 Argon2 算法哈希存储。
- 身份创建后发布 `auth:identity-created` 事件，Account 模块监听此事件创建对应账户。
- Desktop 端的认证架构独立于 packages/authentication，有自己的 application/infrastructure 层。
- 客户端通过 HTTP 或 IPC 适配器访问认证能力，服务端通过模块组合根装配用例和仓储实现。

## 5. 相关文件索引

详细文件清单见 [认证模块文件索引](../module-index/authentication-files.md)。

## 6. 当前问题

- 会话恢复、离线认证、token 刷新和桌面 profile 之间的边界需要在优化前确认。
- 认证状态对所有 requiresAuth 页面和模块入口的影响范围较广。
- 手机登录/注册当前返回 SERVICE_UNAVAILABLE，需要确认实现优先级。
- Desktop 端的认证架构与 packages/authentication 之间的关系较复杂。
- OAuth 绑定基础设施已就绪但没有完整的 UI 和流程。

## 7. 优化机会

- 梳理 Web 和 Desktop 认证链路的差异，建立统一的认证体验。
- 完成手机登录/注册的实现。
- 为 OAuth 提供完整的绑定和登录流程。
- 强化会话管理的可视化，让用户了解活跃会话和设备。
- 考虑双因素认证（2FA）的实现。

## 8. 风险点

- 会话恢复和 token 刷新的可靠性直接影响用户体验。
- 离线认证的安全性：本地 token 的有效期和刷新策略。
- 认证状态变更对所有 requiresAuth 页面的影响。
- Desktop 多 profile 场景下的数据隔离。
- 密码安全：Argon2 参数配置和暴力破解防护。

## 9. 后续待确认

- 手机登录/注册的实现优先级和 SMS 服务选型。
- OAuth 支持的 provider 列表和实现优先级。
- 双因素认证（2FA）的需求和实现方案。
- Desktop 端离线认证的安全策略。
- 会话管理的用户可见能力（查看/撤销活跃会话）。

## 10. 相关资料

- [账户模块说明](./account.md)
- [认证模块文件索引](../module-index/authentication-files.md)
