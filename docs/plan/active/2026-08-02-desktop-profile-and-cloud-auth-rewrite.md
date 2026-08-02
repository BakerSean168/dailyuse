---
tags:
  - plan
  - active
  - authentication
  - desktop
  - profile
  - local-first
description: 一次性重写 MemoFlow 云端认证与 Desktop 本地 Profile/Unlock，删除访客伪会话、离线密码登录和旧认证双轨
created: 2026-08-02T00:00:00+08:00
updated: 2026-08-02T00:00:00+08:00
---

# Desktop Profile 与云端认证一次性重写

## 1. 决策摘要

本计划不是在当前 Desktop 认证链上修补 guest session TTL、记住密码或离线 fallback，而是一次性替换旧模型：

1. Desktop 以本地 Profile 为第一入口；Profile 解锁后即可进入主应用。
2. 访客是完整的本地 Profile，不创建 access token、refresh token 或 `AuthSession`。
3. 注册用户的本地使用权与云端 session 分离；云端失效只暂停同步，不锁住本地数据。
4. 云端账号、邮箱密码、OAuth、验证和 session 由 Better Auth 接管。
5. 现有业务 `identityId` 继续表示云端 Account/tenant ID；本地容器使用稳定 `profileId`，不把本地 UUID 扩散进服务端业务表。
6. 不保留 legacy runtime、feature flag、旧数据迁移或兼容 DTO；开发期直接重置旧认证数据。

最终必须只存在一套运行时。提交可以分阶段，但合并完成时不得存在新旧认证双轨。

## 2. 为什么原方案需要调整

### 2.1 可行部分

以下方向成立，应直接执行：

- 区分云端 `Login` 与本地 `Unlock`。
- Profile 是本地数据、Vault、设置和运行时的所有权边界。
- Cloud session 只决定同步和云端功能，不决定是否进入 Desktop 主页面。
- guest 不应伪装成服务器用户或持有伪 token/session。
- 服务器密码不应作为长期本地解锁凭据保存。
- guest 注册/登录后必须保留原 `profileId`、Profile 目录和 Vault 路径。
- 现有 `GUEST_ACCESS_TOKEN`、`LOCAL_ACCESS_TOKEN`、guest/offline `AuthSession` 应全部删除。

### 2.2 修正：不让 localPrincipalId 取代业务 identityId

原设想为每个 Profile 引入永久 `localPrincipalId`，并在注册后保持所有本地数据 owner 不变。概念上正确，但若把它直接作为所有业务行的 `identityId`，会产生更大的系统性成本：

- 服务端几乎全部业务表以 `identityId` 关联 `Account.id`。
- PowerSync 过滤、API `ExecutionContext`、数据导入导出均以云端 identity 为租户键。
- 本地每个 Profile 已经物理隔离数据库，不需要再用全局稳定 principal 实现目录隔离。

因此采用双标识但不混用：

| 标识             | 语义                         | 稳定性             | 使用范围                                    |
| ---------------- | ---------------------------- | ------------------ | ------------------------------------------- |
| `profileId`      | 本地 Profile 容器            | 永久稳定           | 路径、注册表、Vault、窗口状态、密钥命名空间 |
| `localOwnerId`   | 未绑定云端时的本地业务 owner | guest 期间稳定     | 当前 Profile 本地数据库中的 `identity_id`   |
| `cloudAccountId` | 云端 Account/tenant          | 账号生命周期内稳定 | API、PowerSync、服务端业务表、云端 session  |

guest 绑定云端账号时执行一次受控的本地 tenant adoption：在同一个 Profile 数据库事务内将 owner 从 `localOwnerId` 改为 `cloudAccountId`，然后写入 CloudBinding。Profile 目录、`profileId`、Vault 和本地密钥不变化。

这不是旧实现中“把 Profile Registry 的 identityId 当作 Profile 本身”的重绑；它是一个显式、可验证、仅发生一次的本地数据 owner 采纳动作。

### 2.3 修正：第一版不做本地数据库全盘加密

第一版生成 `profileKey`，但只用于：

- 包装云端 bearer/session credential；
- 保护未来需要本地加密的敏感配置；
- 建立 PIN/设备解锁的正确密钥层次。

不在本轮切换 PowerSync/SQLite 到全盘 SQLCipher，也不重新加密 Vault 文件。原因：

- 这是独立的数据静态加密项目，不能与认证替换混为一体。
- Windows `safeStorage`/DPAPI 已能提供第一层设备用户隔离。
- Profile 的普通业务数据库当前并非按高敏感 Vault 设计；强行全盘加密会扩大原生模块、备份和恢复复杂度。

## 3. 开源采用矩阵

### 3.1 直接采用：Better Auth

[Better Auth](https://github.com/better-auth/better-auth) 为 MIT、TypeScript、框架无关认证框架，直接承担：

- email/password 注册和登录；
- 邮箱验证、忘记密码和密码重置；
- GitHub OAuth identity；
- session 创建、查询、撤销和过期；
- Web cookie session；
- Desktop bearer session token；
- 后续 passkey、2FA 和设备管理扩展。

禁止把 Better Auth session 当作 Desktop Profile 解锁凭据。

### 3.2 可移植结构：AFFiNE

[AFFiNE](https://github.com/toeverything/AFFiNE) 前端和 Electron 主体采用 MIT，可借鉴：

- workspace/profile-first 启动；
- Electron main process 中独立的 auth transport；
- 本地 workspace 与 cloud account 的分离；
- workspace metadata 与 runtime activation 的分层。

如复制实质性源码，必须保留 MIT copyright notice，并将来源写入 `THIRD_PARTY_NOTICES.md`。不得复制其特殊许可证 backend 目录。

### 3.3 只借鉴模型：Bitwarden、Notesnook、Anytype、AppFlowy

- Bitwarden：借鉴 Login/Unlock、PIN envelope、device trust、lock timeout；默认 GPLv3，不复制实现。
- Notesnook：借鉴 vault unlock 与 biometric fallback；GPLv3，不复制实现。
- Anytype：借鉴本地 key 和 permissionless local access；source-available，不复制实现。
- AppFlowy：借鉴 local-first/workspace 语义；AGPLv3，不复制实现。

### 3.4 许可证前置动作

MemoFlow 当前根目录没有 `LICENSE`。实施前必须：

1. 明确 MemoFlow 自身许可证策略，或至少明确当前为 proprietary/unlicensed private repository。
2. 新增 `THIRD_PARTY_NOTICES.md`。
3. 所有直接移植代码记录源仓库、commit、文件和许可证。
4. GPL/AGPL/source-available 项目只允许 clean-room reimplementation。

## 4. 目标领域模型

### 4.1 Profile Registry

```ts
interface DesktopProfileDescriptor {
  profileId: string;
  profileKind: 'guest' | 'registered';
  localOwnerId: string;
  displayName: string;
  avatarSeed: string;
  identifierHint: string | null;
  cloudBinding: CloudBinding | null;
  unlockPolicy: UnlockPolicy;
  createdAt: number;
  lastOpenedAt: number;
  status: 'ready' | 'error';
}

interface CloudBinding {
  cloudAccountId: string;
  boundAt: number;
  lastValidatedAt: number | null;
}
```

约束：

- `profileId` 创建后不可变化。
- `localOwnerId` 在 guest 期间不可变化。
- 一个 `cloudAccountId` 默认只能绑定一个本机 Profile。
- 不自动合并两个已有 Profile。
- 已有云端 Profile 冲突时必须要求用户选择打开已有 Profile、删除空 Profile，或取消绑定。

### 4.2 Unlock 与 Profile Key

```ts
type UnlockPolicy =
  | { type: 'device'; keyEnvelopeId: string }
  | {
      type: 'pin';
      keyEnvelopeId: string;
      salt: string;
      argon2: { memoryCost: number; timeCost: number; parallelism: number };
    };

type UnlockState = 'LOCKED' | 'UNLOCKING' | 'UNLOCKED';
```

规则：

- Profile 创建时生成 256-bit 随机 `profileKey`。
- device 模式使用 Electron async `safeStorage` 包装 `profileKey`。
- PIN 模式使用 Argon2id 派生 KEK，再以 AEAD 包装 `profileKey`。
- 不保存 PIN 明文，也不把服务器密码作为 PIN。
- PIN 连续失败采用内存与持久化联合计数、指数退避；不远程锁定本地 Profile。
- 解锁后的 `profileKey` 只存在 main process 内存中，锁定/退出时清除引用。
- Linux 检测 `safeStorage` fallback/basic backend；不安全时禁止无提示启用自动解锁。

### 4.3 Desktop Access Snapshot

```ts
interface DesktopAccessSnapshot {
  profile: DesktopProfileSummary | null;
  unlockState: UnlockState;
  cloudState: 'UNBOUND' | 'CHECKING' | 'ONLINE' | 'OFFLINE' | 'REAUTH_REQUIRED';
  cloudAccount: CloudAccountSummary | null;
  capabilities: {
    local: boolean;
    sync: boolean;
    cloudAi: boolean;
    repositoryConnection: boolean;
  };
}
```

主路由只判断：

```ts
snapshot.profile !== null && snapshot.unlockState === 'UNLOCKED';
```

任何组件不得使用 `cloudState` 决定能否访问本地 Task、Goal、Schedule、Reminder 或 Vault。

### 4.4 云端 Account 与 Better Auth User

采用一对一主键共享：

- Better Auth `user.id` 直接作为 MemoFlow `Account.id` 和业务 `identityId`。
- 不保留平行 `AuthIdentity` 表或额外 ID mapping 表。
- Better Auth user 创建成功后，在同一注册编排内创建 Account。
- OAuth 不按相同邮箱静默绑定已有账号；沿用显式 linking 安全边界。

该方案避免全域 tenant ID 迁移，同时删除旧 `AuthIdentity -> Account` 一对一投影复杂度。

## 5. 模块边界

### 5.1 Cloud Auth

新包建议命名 `@memoflow/cloud-auth`，只负责 Better Auth 组合与 MemoFlow adapter：

```text
packages/cloud-auth/
  src/server/auth.ts
  src/server/express-handler.ts
  src/server/execution-context.ts
  src/server/account-hooks.ts
  src/client/web-client.ts
  src/client/desktop-client.ts
```

职责：

- 配置 Better Auth Prisma adapter、email/password、GitHub、bearer 插件。
- 将 Better Auth session 转换为 `ExecutionContext`。
- 将 auth user 生命周期与 Account 生命周期编排。
- 对外暴露 MemoFlow 需要的最小接口，禁止业务模块直接依赖 Better Auth 内部类型。

### 5.2 Desktop Profile Access

```text
apps/desktop/src/main/profile-access/
  profile-registry.ts
  profile-key-store.ts
  local-unlock-service.ts
  profile-activation-service.ts
  cloud-binding-service.ts
  local-tenant-adoption-service.ts
  desktop-access-coordinator.ts
  desktop-access-snapshot.ts
```

职责分离：

- `ProfileRegistry`：Profile 元数据与唯一性。
- `ProfileKeyStore`：key envelope 持久化。
- `LocalUnlockService`：device/PIN 解锁和锁定。
- `ProfileActivationService`：打开 Profile DB、模块和窗口。
- `CloudBindingService`：绑定、验证、解除绑定，不负责本地解锁。
- `LocalTenantAdoptionService`：guest owner 到 cloud account owner 的事务性变更。
- `DesktopAccessCoordinator`：唯一状态协调者和 IPC 提供者。

### 5.3 Account

Account 继续拥有昵称、头像、简介、用户偏好和业务 tenant 根。

Desktop guest 也必须使用真实的本地 Account row，而不是 renderer mock。Account electron adapter 通过当前 Profile 的 local execution context 读写本地数据库，因此 guest 可以修改资料和设置。

注册后本地 Account row 的 ID 在 tenant adoption 中变为 `cloudAccountId`；资料冲突策略默认“保留本地资料，云端缺失字段由本地补齐”，禁止无提示覆盖非空云端资料。

## 6. 数据库设计

### 6.1 服务端 Prisma

删除：

- `AuthIdentity`
- `AuthIdentifier`
- `AuthCredential`
- `AuthOAuthBinding`
- `AuthSession`

引入 Better Auth 官方 schema：

- `User`
- `Session`
- `Account`（Better Auth credential/provider account；为避免与 MemoFlow Account 冲突，Prisma model 使用清晰别名并通过 `@@map` 固定表名）
- `Verification`

命名必须避免与 MemoFlow `Account` 聚合冲突。推荐：

```prisma
model AuthUser { @@map("auth_users") }
model AuthSession { @@map("auth_sessions") }
model AuthProviderAccount { @@map("auth_provider_accounts") }
model AuthVerification { @@map("auth_verifications") }
```

MemoFlow `Account.id` 外键改指向 `AuthUser.id`，业务表无需改 tenant 字段。

### 6.2 Desktop Profile Registry

注册表只保存非敏感 Profile metadata。云端 bearer token、profile key envelope 不写入 registry JSON。

共享目录：

```text
shared/profiles/registry.json
shared/secure/profile-keys/<profileId>.bin
shared/secure/cloud-sessions/<profileId>.bin
profiles/<profileId>/...
```

### 6.3 本地 tenant adoption

由于 PowerSync 本地 schema 中大量表使用 `identity_id`，adoption 必须由结构化表清单驱动，禁止任意 SQL 字符串扫描。

流程：

1. 确认 Profile 未绑定云端。
2. 确认目标 `cloudAccountId` 未绑定其他本机 Profile。
3. 暂停本地业务写入和同步 runtime。
4. 开启数据库事务。
5. 按 canonical identity-owned table registry 更新 `identity_id`。
6. 更新本地 Account row 主键及所有外键。
7. 写入 CloudBinding 与 adoption marker。
8. 提交事务。
9. 重建 runtime execution context。
10. 启动首次同步。

失败时事务回滚，Profile 保持 guest。必须有表覆盖测试，确保新增 identity-owned 表未加入 adoption registry 时治理检查失败。

## 7. API 与会话设计

### 7.1 Web

- 使用 Better Auth cookie session。
- Web Auth 页面切换到 Better Auth client。
- API middleware 使用 `auth.api.getSession({ headers })` 构建 `ExecutionContext`。

### 7.2 Desktop

- 在线登录/注册由 main process 调用 cloud-auth Desktop client。
- bearer session token 只存入 `safeStorage` 包装的 profile-scoped credential store。
- renderer 不持有 bearer token，不写 `localStorage`/Pinia persistence。
- main process 代理业务 HTTP 请求或向现有 HTTP client 注入短期内存 token。
- session 失效映射为 `REAUTH_REQUIRED`，不清空 Profile、不关闭主窗口。
- 网络不可达映射为 `OFFLINE`，不视为凭据失效。

### 7.3 PowerSync

Better Auth bearer session 不能直接作为 PowerSync token。保持独立的短期 PowerSync JWT：

1. Desktop 以有效 Better Auth session 请求 PowerSync token endpoint。
2. API 从 Better Auth session 提取 `identityId`。
3. PowerSync issuer 签发仅包含同步所需 claims 的短期 JWT。
4. guest、OFFLINE、REAUTH_REQUIRED 不得请求或缓存伪同步 token。

## 8. 启动与交互流程

### 8.1 首次启动

```text
无 Profile
→ 创建 guest Profile
→ 随机昵称“访客 ####”与 avatarSeed
→ 创建本地 Account
→ 默认 device unlock
→ 激活 Profile
→ 进入主页面
```

首次启动不展示服务器登录墙。登录/注册是“启用同步”的可选动作。

### 8.2 后续启动

```text
读取最近 Profile
→ device/PIN 解锁
→ 立即进入本地主页面
→ 后台检查 cloud session
→ ONLINE / OFFLINE / REAUTH_REQUIRED
```

多 Profile 时显示 Profile picker；单 Profile 且 device unlock 成功时直接进入。

### 8.3 访客注册/登录

```text
已解锁 guest Profile
→ 用户选择“登录并启用同步”
→ Better Auth 在线认证
→ 检查 cloud account 本机绑定冲突
→ local tenant adoption
→ 写 CloudBinding
→ 首次同步
```

### 8.4 云端密码改变或 session 撤销

```text
本地 Profile 仍 UNLOCKED
→ cloudState = REAUTH_REQUIRED
→ 停止同步和云端功能
→ 提示重新认证
→ 本地编辑继续可用
```

重新认证成功只替换 cloud credential，不重建 Profile。

### 8.5 Logout、Lock、Unbind、Delete 的语义

必须彻底区分：

| 命令                     | 行为                                                               |
| ------------------------ | ------------------------------------------------------------------ |
| Lock Profile             | 清除内存 profileKey，关闭 Profile runtime，保留 cloud credential   |
| Sign out cloud           | 撤销/删除 cloud session，Profile 保持 registered + REAUTH_REQUIRED |
| Disconnect cloud account | 停止同步并删除 CloudBinding；需要明确处理云端已同步数据语义        |
| Remove local Profile     | 删除本地 Profile、Vault 绑定和本地数据；必须二次确认               |
| Close cloud account      | 服务端关闭账号并撤销 session；本地 Profile默认保留为本地可用状态   |

“退出登录”不再等同于“离开应用”或“删除本地数据”。

## 9. 删除清单

### 9.1 Desktop main

删除或完全重写：

- `guest-identity-helper.ts`
- `offline-auth-helper.ts`
- `session-manager.ts`
- `session-restore.ts`
- `token-refresh.ts`
- `login-orchestrator.ts` 中本地 session 分支
- `remembered-accounts-service.ts` 的 encrypted password/auto-login 模型
- `desktop-auth-lifecycle-coordinator.ts`
- 旧 `DesktopAuthContextProvider` 对 auth session 的依赖
- `GUEST_ACCESS_TOKEN`、`LOCAL_ACCESS_TOKEN`
- guest/offline `AuthSession` repository 使用
- `upgradeGuestProfileToOnlineIdentity` registry identity 替换模型

### 9.2 Contracts

删除：

- `AuthMode.ONLINE_USER/OFFLINE_USER/GUEST`
- `AuthRuntimeState`
- Desktop token/session restore DTO
- offline login DTO
- guest mode token/session DTO
- remembered password login DTO

新增：

- Profile summary/list/select/create/remove DTO
- unlock/lock/PIN DTO
- Desktop access snapshot
- cloud bind/sign-in/sign-out/reauth DTO

### 9.3 Renderer

删除：

- `isAuthenticated` 同时控制路由和云端 UI 的逻辑
- guest mock Account
- guest 禁止更新资料/设置分支
- guest 登录成功后的 `store.reset()` + 等待新窗口 bootstrap 模型
- 记住密码账号列表

新增：

- `profileUnlocked`
- `cloudState`
- Profile picker/unlock UI
- 云端连接状态与 reauth banner
- guest/registered 统一资料编辑

### 9.4 Server

删除旧 `@memoflow/authentication` 服务端认证内核，包括：

- 聚合、凭证、session、JWT provider；
- Prisma/PowerSync auth repositories；
- 登录注册刷新 token 用例；
- OAuth state 和 provider 编排中被 Better Auth 覆盖的部分；
- 平行客户端 DTO 和 mapper。

邮件 provider 可提取为独立通用包供 Better Auth callback 使用，不应为保留旧认证模块而留下双轨。

## 10. ADR 与文档治理

本计划与 ADR-036 “不替换认证内核”冲突。实施第一步必须新增 ADR，明确：

- supersede ADR-036 第 1 节及所有依赖自建 AuthIdentity/AuthSession 的内容；
- 保留 Auth/Account 资料边界、邮箱真源、OAuth 不静默合并、GitHub 登录与知识仓库授权分离；
- 将新的云端身份真源改为 Better Auth `AuthUser`；
- 将 Desktop 本地访问移出 Authentication，归入 Profile Access。

同步更新：

- `docs/product/modules/authentication.md`
- `docs/product/modules/account.md`
- `docs/product/modules/repository.md`
- authentication/account 文件索引
- ADR-034 中 guest upgrade 的 ownership 表述

## 11. 实施批次

虽然运行时不保留中间状态，代码提交仍按可审查依赖顺序推进。

### W0：决策与依赖冻结

- 新 ADR supersede ADR-036 认证内核决策。
- 明确许可证与第三方 notice。
- 固定 Better Auth 版本，不跟随浮动 latest。
- 建立最终 contract 草案和删除清单门禁。

完成条件：不存在未决的 identity 主键、Profile owner、logout 语义问题。

### W1：Better Auth 云端内核

- 新建 `@memoflow/cloud-auth`。
- 接入 Prisma adapter、email/password、verification、reset、GitHub、bearer。
- 建立 AuthUser 与 MemoFlow Account 一对一创建/关闭编排。
- 替换 API middleware 的 ExecutionContext 来源。
- 替换 PowerSync token endpoint 的身份解析。

完成条件：Web 主要认证旅程通过，业务 API 不再依赖旧 JWT strategy。

### W2：Desktop Profile Access 核心

- 重写 Profile Registry schema。
- 实现 ProfileKeyStore、device unlock、PIN unlock。
- 实现 DesktopAccessCoordinator 和 snapshot IPC。
- ProfileActivationService 不再创建 `AuthDesktopApplicationService`。
- guest Profile 创建真实本地 Account。

完成条件：完全删除 guest token/session 后，Desktop 可冷启动进入本地主页面。

### W3：Cloud Binding 与 tenant adoption

- Desktop Better Auth bearer client。
- profile-scoped cloud credential store。
- CloudBindingService。
- LocalTenantAdoptionService 和 canonical table registry。
- 绑定冲突与资料合并策略。

完成条件：guest 注册后 Profile/Vault 路径不变，本地 owner 统一为 cloudAccountId，可启动首次同步。

### W4：Renderer 与产品交互

- 路由切换到 `profileUnlocked`。
- Profile picker/lock/PIN UI。
- 账户菜单区分 Profile、cloud connection 和 lock/logout。
- guest 资料与设置本地持久化。
- OFFLINE/REAUTH_REQUIRED banner 和 capability gating。

完成条件：UI 不再出现“访客但未登录”的矛盾状态。

### W5：旧认证彻底删除

- 删除旧 Desktop auth infrastructure/application。
- 删除旧 server authentication domain/infrastructure。
- 删除旧 contracts、Prisma models、PowerSync auth projection。
- 删除旧测试和 surface residual；新增禁止旧符号回归的治理测试。

完成条件：全仓 `rg` 不再命中旧伪 token、OfflineAuthHelper、GuestIdentityHelper 或旧 AuthMode。

### W6：全链路验证与文档收口

- 重置数据库并生成 Prisma client。
- 完成 Web、Desktop、API、PowerSync 回归。
- prod-like Docker 验证。
- 更新产品文档、文件索引和 ADR 状态。
- active plan 完成后归档。

## 12. 测试矩阵

### 12.1 Profile/Unlock

- 首次启动创建唯一 guest Profile。
- 重启后恢复同一 `profileId`、昵称、头像和设置。
- device unlock 成功/不可用/fallback 行为。
- PIN 正确、错误、退避、修改、删除。
- lock 后业务 IPC 拒绝访问；重新 unlock 恢复。
- 多 Profile 切换不会串数据库、Vault、窗口状态或 credential。

### 12.2 云端认证

- 注册、邮箱验证、登录、重置密码、GitHub OAuth。
- bearer token 签发、API 使用、撤销和过期。
- 密码改变后 Desktop 变为 REAUTH_REQUIRED。
- 网络失败映射为 OFFLINE，不清除有效 credential。
- 关闭账号后云端操作拒绝，本地 Profile 保留。

### 12.3 guest 升级

- `profileId`、Profile 目录、Vault 路径保持不变。
- 所有 identity-owned 表 owner 更新完整。
- 任一步失败时 adoption 全部回滚。
- 目标账号已有本机 Profile 时拒绝静默合并。
- 首次同步不会把其他 Profile 数据上传。

### 12.4 Capability

| 状态               | 本地业务 | Vault | 同步 | 云端 AI | GitHub 仓库授权 |
| ------------------ | -------- | ----- | ---- | ------- | --------------- |
| guest/unbound      | 是       | 是    | 否   | 否      | 否              |
| registered/offline | 是       | 是    | 暂停 | 暂停    | 否              |
| registered/reauth  | 是       | 是    | 暂停 | 暂停    | 否              |
| registered/online  | 是       | 是    | 是   | 是      | 是              |

### 12.5 必要验证 target

- `pnpm nx run cloud-auth:test`
- `pnpm nx run cloud-auth:typecheck`
- `pnpm nx run desktop:test`
- `pnpm nx run desktop:typecheck`
- `pnpm nx run app-vue:test`
- `pnpm nx run api:test`
- `pnpm nx run web:test`
- `pnpm nx run memoflow:governance-check`
- `pnpm docker:local:up` 后执行核心 Web/Desktop 产品旅程

## 13. 删除完成门禁

最终治理检查至少禁止以下符号重新出现：

```text
GUEST_ACCESS_TOKEN
LOCAL_ACCESS_TOKEN
GuestIdentityHelper
OfflineAuthHelper
OFFLINE_USER
loginRememberedDesktopAccount
encryptedPassword
AuthRuntimeState
```

同时禁止：

- renderer 持久化 bearer token；
- guest 创建 AuthSession；
- cloud session 失效导致删除/锁定 Profile；
- Account profile 更新在 guest 模式被拒绝；
- 业务路由使用 `cloudState === ONLINE` 作为本地准入条件。

## 14. 风险与应对

### Better Auth 与现有 Account model 命名冲突

通过 Prisma model alias + `@@map` 解决，禁止两个领域都直接使用裸 `Account` 名称。

### Better Auth 版本升级影响

固定精确版本；cloud-auth 包隔离第三方类型；只向其他包暴露 MemoFlow contract。

### tenant adoption 漏表

从 PowerSync schema/Prisma metadata 生成或校验 canonical registry；治理测试比较所有 `identity_id` 表与 adoption coverage。

### safeStorage 不等于强本地防护

文档明确威胁模型；Linux 不安全 backend 禁用静默 auto-unlock；高安全模式使用 PIN。全盘加密另立计划。

### 一次性重写爆炸半径

不通过运行时双轨缓解，而通过提交顺序、fixture 和端到端测试控制。最终切换提交必须同时删除旧入口。

## 15. 完成定义

只有同时满足以下条件才算完成：

1. Desktop 无网络、无 cloud session 时可以创建、打开和编辑 guest Profile。
2. 注册用户 cloud session 失效后仍可本地解锁和使用全部本地功能。
3. guest 不存在 token/session/renderer mock Account。
4. 注册后 Profile/Vault 不移动，tenant adoption 原子完成。
5. 云端认证完全由 Better Auth 提供，旧自研认证内核已删除。
6. Web、Desktop、PowerSync 都以同一个 Better Auth user ID 作为云端 `identityId`。
7. 路由准入、同步能力和用户展示不再共享含混的 `isAuthenticated` 布尔值。
8. 全仓无 legacy fallback、feature flag 或旧认证兼容 DTO。
9. 相关单测、集成测试、Desktop journey 和本地 Docker prod-like 验证全部通过。

## 16. 参考资料

- [Better Auth](https://github.com/better-auth/better-auth)
- [Better Auth Bearer Plugin](https://better-auth.com/docs/plugins/bearer)
- [AFFiNE](https://github.com/toeverything/AFFiNE)
- [Bitwarden Unlock with PIN](https://bitwarden.com/help/unlock-with-pin/)
- [Steam Offline Mode](https://help.steampowered.com/en/faqs/view/0E18-319B-E34B-B2C8)
- [Electron safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage)
- [Anytype Privacy & Encryption](https://doc.anytype.io/anytype/data/privacy-and-encryption)
- [Joplin E2EE](https://joplinapp.org/help/apps/sync/e2ee/)
- [ADR-034](../../architecture/adr/ADR-034-obsidian-vault-repository.md)
- [ADR-036](../../architecture/adr/ADR-036-auth-account-boundary-and-verification.md)
