# Authentication Shared Integration Plan

## 背景

当前 `authentication` 在 Desktop 上存在两套主进程实现：

- 共享包实现：`packages/authentication/src/electron-entry/index.ts`
- Desktop 本地实现：`apps/desktop/src/main/modules/authentication/**`

这会带来几个直接问题：

- 同一个 IPC channel（如 `auth:register`）可能由不同实现接管，行为不一致。
- 离线、访客模式、本地缓存登录等增强能力没有统一落在共享认证模块中。
- Desktop 侧出现重复应用服务，偏离了其他模块主要通过共享 package 实现的模式。
- UI、IPC、主进程服务、网络状态判断之间的职责边界不清晰，容易出现“改了代码但未实际生效”的情况。

本方案的目标，是把 Desktop 认证重新收敛到共享 `packages/authentication` 中，让 Desktop 只负责注入平台能力，而不再维护一套独立的本地认证应用服务。

---

## 系统上下文

这份方案必须放在 DailyUse 的真实系统架构里理解，而不是只从单一 Desktop 进程出发。

### 当前系统形态

DailyUse 不是单体前端，也不是单机桌面应用，而是一个多端协同系统：

- `apps/web`: Web 端应用
- `apps/desktop`: Desktop 端应用（Electron，含 main/preload/renderer）
- `apps/api`: 远程 API 服务（Express）
- `packages/*`: 各类共享业务包、UI 包、契约包、基础设施包

### 当前真实能力边界

- 远程 API 既提供账户与认证权威能力，也提供数据同步相关能力。
- Web 和 Desktop 都是前端宿主，但运行时能力不同。
- Desktop 额外具备本地数据库、离线缓存、本地同步状态管理等能力。
- 共享包承载跨端复用的业务模型、契约、客户端服务、Electron entry、API entry 等。

### 系统架构应包含的三个维度

#### 1. DDD 架构

系统核心业务按照 DDD 分层组织：

- `contracts`: 跨层 DTO、Result、协议契约
- `domain-*`: 领域模型、聚合、值对象、领域服务
- `application-*`: 用例与应用编排
- `infrastructure-*`: HTTP、IPC、SQLite、Prisma、外部系统适配

`authentication` 的统一方案也必须遵守这个分层，而不是在 Desktop 本地再复制一套应用服务。

#### 2. 联邦 UI 架构

这里的“联邦 UI”不是指必须使用某个特定打包器的运行时模块联邦，而是指：

- Web 与 Desktop Renderer 作为两个宿主 UI
- 共享 `packages/app-vue`、`packages/ui-*`、共享模块 composables/stores/views
- 平台差异通过 DI、adapter、platform bridge 注入

也就是说，认证 UI 不应该在 Desktop 再单独重写一套业务逻辑，而应由共享 UI 模块消费共享认证服务，只在宿主层注入平台能力。

#### 3. Monorepo 架构

DailyUse 当前是 Nx Monorepo。

- 应用边界在 `apps/*`
- 共享能力在 `packages/*`
- 各端通过统一 contracts、shared services、composition root 协作

因此 `authentication` 的目标形态应该和其他模块一致：共享包中沉淀核心逻辑，宿主应用负责装配，而不是让 Desktop 形成一条旁路实现。

---

## 目标

### 核心目标

- `authentication` 与其他业务模块保持一致：核心逻辑放在共享 package 中。
- Desktop main 不再保留独立的认证应用服务实现。
- Desktop 只提供平台增强能力：IPC、SQLite、本地凭证缓存、网络状态、PowerSync/同步生命周期。
- 在线/离线/访客模式的决策逻辑只保留一份。
- Renderer 继续通过共享 `AuthClientService` 使用认证能力，不直连 `window.electronAPI` 做业务决策。
- 远程 API 仍然是正式账号注册、远程认证、远程同步的权威入口。
- 认证方案必须兼容 Web、Desktop、API、同步服务四者协同，而不是只解决单个端内调用。

### 非目标

- 不把 Web/Desktop 的 transport 强行统一成同一种实现。
- 不让离线注册直接创建正式云端账号。
- 不要求一次性重写整个 authentication 模块；应采用分阶段迁移。

---

## 目标架构

### 总体思路

把“认证策略和编排”收敛到共享包，把“平台能力实现”留给宿主注入。

```text
Web Host / Desktop Renderer Host
-> shared app-vue / shared UI modules
-> AuthClientService
-> transport adapter (web=http, desktop=ipc)
-> Shared Authentication Application Service
-> Injected Ports / Strategies
   - NetworkStatusPort
   - RemoteAuthPort
   - LocalAuthPort
   - GuestAuthPort
   - AuthSyncPort
   - Session/Tokens persistence ports
-> API authority + Sync service
```

### 系统级协作图

```text
Nx Monorepo

apps/web -------------------------------> apps/api (Express)
   |                                          |
   | HTTP / SSE / sync APIs                   | auth authority + sync endpoints
   |                                          |
   v                                          v
shared packages/app-vue                 PostgreSQL / remote services
shared packages/authentication
shared packages/contracts
shared packages/ui-*

apps/desktop (renderer)
   |
   | IPC
   v
apps/desktop (main)
   |
   | uses shared authentication application layer
   | + injects local SQLite / network / sync adapters
   v
local SQLite + local sync runtime <----> apps/api sync service
```

### 职责边界

#### 共享包 `packages/authentication` 负责

- 登录/注册/登出/刷新 token 的统一编排。
- 在线优先、离线回退、访客模式的决策。
- 认证契约与返回值统一。
- Electron/Web/API 可复用的应用层接口与端口定义。
- 面向远程 API 权威能力与本地平台能力的统一抽象。

#### Desktop 宿主负责

- 注入 SQLite 仓储、本地密码校验、本地 guest identity 存储。
- 注入网络状态实现。
- 注入远程 API 调用实现。
- 注入 PowerSync 本地/联网切换实现。
- 注册 preload 白名单和 IPC handler。
- 不拥有独立认证业务规则，只做平台适配与组装。

#### Renderer 负责

- 只消费共享 auth service 暴露的能力。
- 不直接决定“在线还是离线”。
- 不直接调用 desktop 私有 channel 完成业务编排。
- 保持 UI 模块在 Web/Desktop 之间尽量共享。

#### API 宿主负责

- 提供注册、登录、refresh token、会话治理等权威能力。
- 提供远程数据同步相关服务。
- 持有正式账户、正式会话、正式身份的最终真相来源。

---

## 建议的共享抽象

建议在 `packages/authentication` 中新增一层面向宿主注入的应用层端口，避免把 Electron/HTTP/SQLite 细节写进共享服务。

### 1. `NetworkStatusPort`

职责：提供当前网络状态和可选的健康检查能力。

建议接口：

```ts
export interface NetworkStatusPort {
  isOnline(): Promise<boolean> | boolean;
  getStatus?(): Promise<'online' | 'offline' | 'unknown'> | 'online' | 'offline' | 'unknown';
}
```

Desktop 实现：

- 基于 Electron `net` + 可选 API health check
- 可继续复用现有 `NetworkStateManager`

Web 实现：

- 基于 `navigator.onLine`
- 如有需要再加 health check

### 2. `RemoteAuthPort`

职责：所有需要服务端权威的操作。

建议接口：

```ts
export interface RemoteAuthPort {
  loginByEmail(req: LoginByEmailReq): Promise<Result<AuthResponseDTO>>;
  loginByPhone(req: LoginByPhoneReq): Promise<Result<AuthResponseDTO>>;
  registerByEmail(req: RegisterByEmailReq): Promise<Result<AuthResponseDTO>>;
  registerByPhone(req: RegisterByPhoneReq): Promise<Result<AuthResponseDTO>>;
  refreshToken(req: RefreshTokenReq): Promise<Result<RefreshTokenRes>>;
  logout(): Promise<Result<void>>;
}
```

Desktop/Web 都可用 HTTP adapter，底层指向远程 Express API。

### 3. `LocalAuthPort`

职责：本地身份与离线登录能力。

建议接口：

```ts
export interface LocalAuthPort {
  loginOfflineByEmail(req: LoginByEmailReq): Promise<Result<AuthResponseDTO>>;
  cacheCredentialsFromOnlineAuth(input: {
    identityId: string;
    email?: string;
    password?: string;
  }): Promise<void>;
}
```

Desktop 提供真实实现；Web 提供 unsupported/null object。

### 4. `GuestAuthPort`

职责：访客模式能力。

建议接口：

```ts
export interface GuestAuthPort {
  enterGuestMode(): Promise<Result<AuthResponseDTO>>;
}
```

说明：建议让访客模式也返回标准 `AuthResponseDTO` 或一个可兼容的扩展 DTO，不再让 UI 手工伪造 token 和 identity。

### 5. `AuthSyncPort`

职责：认证状态变化后的同步生命周期处理。

建议接口：

```ts
export interface AuthSyncPort {
  onOnlineUserAuthenticated(): Promise<void>;
  onOfflineUserAuthenticated(): Promise<void>;
  onGuestAuthenticated(): Promise<void>;
  onLogout(): Promise<void>;
  onNetworkRecovered?(mode: string): Promise<void>;
}
```

Desktop 里可以映射到现有 PowerSync/本地同步行为；Web 用空实现或轻量实现。

### 6. 持久化相关端口

认证实际上还需要统一 token/session/identity 的持久化边界，避免 UI 或平台层随意拼状态。

建议增加：

```ts
export interface AuthStatePersistencePort {
  saveAuthState(data: AuthResponseDTO): Promise<void>;
  clearAuthState(): Promise<void>;
  loadAuthState(): Promise<AuthResponseDTO | null>;
}
```

这样 guest、offline user、online user 都能通过统一状态装配进入 renderer，而不是由 UI 手工设置 store。

---

## 共享应用服务设计

建议在 `packages/authentication` 中引入新的共享应用服务，例如：

- `HybridAuthApplicationService`
- 或 `UnifiedAuthApplicationService`

它负责统一编排，而不是直接处理平台细节。

### 建议构造参数

```ts
export interface UnifiedAuthDependencies {
  remote: RemoteAuthPort;
  local?: LocalAuthPort;
  guest?: GuestAuthPort;
  network: NetworkStatusPort;
  sync?: AuthSyncPort;
}
```

### 核心行为规则

#### 登录

- 在线时优先走 `remote.loginByEmail()`。
- 在线登录成功后，调用 `local.cacheCredentialsFromOnlineAuth()` 缓存本地凭证。
- 离线时若存在 `local`，走 `local.loginOfflineByEmail()`。
- 离线且不支持本地登录时，返回统一错误。

#### 注册

- 注册默认必须走 `remote.registerByEmail()`。
- 调用前先问 `network.isOnline()`。
- 离线时直接返回统一错误：注册需要网络连接。
- 注册成功后同样缓存离线登录所需信息。
- 注册成功后，如需初始化同步上下文，应由 `sync` 统一接管。

#### 访客模式

- 通过 `guest.enterGuestMode()` 进入。
- 返回统一认证结果，UI 无需自己拼装 guest identity。
- 同步层通过 `sync.onGuestAuthenticated()` 切换到本地模式。
- 访客模式只影响本地能力，不替代远程正式账户。

#### 刷新 token

- 仅在线模式允许远程刷新。
- 离线模式和 guest 模式不进行远程刷新。

#### 网络恢复

- 由 Desktop 的网络管理器触发。
- 调用共享服务暴露的 `handleNetworkRecovered()` 或单独策略对象。
- 对 `OFFLINE_USER` 可尝试升级回 `ONLINE_USER`。
- 对 `GUEST` 不自动升级。
- 如存在同步服务恢复逻辑，也应在这里统一协调，而不是散落在多个 main 进程服务中。

---

## 与系统架构的一致性要求

### 与 DDD 一致

- 认证策略属于应用层，不属于 Electron main 私有层。
- 网络、HTTP、IPC、SQLite、同步客户端都属于基础设施适配。
- UI store/composable 只消费契约和服务，不承载核心认证规则。

### 与联邦 UI 一致

- `packages/app-vue` 中的认证视图、composable、store 应尽量共享。
- 平台差异通过宿主注入，不通过共享 UI 中硬编码 `window.electronAPI`。
- Desktop 和 Web 的认证体验可以有差异化入口，但不能分裂出两套核心流程。

### 与 Monorepo 一致

- `apps/*` 负责装配和运行。
- `packages/*` 负责复用与边界清晰的模块能力。
- `authentication` 不应成为唯一一个在 Desktop 里整套重写应用层的模块。

---

## 推荐返回契约

当前一个关键问题是 Desktop 某些路径返回的不是共享契约，例如注册只回 `{ identityId, message }`，但前端期待 `AuthResponseDTO`。

建议规则：

- `loginByEmail`、`registerByEmail`、`enterGuestMode` 最终都回统一认证结果。
- 若 guest 不适合返回真实 token，则应明确定义 `GuestAuthResponseDTO`，再让上层统一适配，而不是 UI 手工伪造状态。

更推荐的做法是扩展共享契约：

```ts
export interface AuthResponseDTO {
  accessToken: string | null;
  refreshToken?: string | null;
  identity: AuthIdentityClientDTO;
  session: AuthSessionClientDTO | null;
  mode?: 'ONLINE_USER' | 'OFFLINE_USER' | 'GUEST';
}
```

如果不想修改现有契约过大，也可以新增：

- `ResolvedAuthStateDTO`
- `InteractiveAuthResultDTO`

但无论选哪种，必须满足一点：

- UI 不能再依赖“某个平台自己拼的特殊返回结构”。

---

## Desktop 侧最终应保留什么

Desktop 最终应该只保留三类代码。

### 1. Composition Root

例如：

- `apps/desktop/src/main/auth/desktop-auth.composition-root.ts`

职责：

- 创建本地仓储
- 创建远程 API adapter
- 创建网络状态 adapter
- 创建 PowerSync adapter
- 创建共享 `UnifiedAuthApplicationService`
- 注册 IPC handler 到 Electron
- 连接远程 API 认证与同步服务

### 2. Platform Adapters

例如：

- `apps/desktop/src/main/auth/adapters/DesktopNetworkStatusAdapter.ts`
- `apps/desktop/src/main/auth/adapters/DesktopRemoteAuthAdapter.ts`
- `apps/desktop/src/main/auth/adapters/DesktopLocalAuthAdapter.ts`
- `apps/desktop/src/main/auth/adapters/DesktopGuestAuthAdapter.ts`
- `apps/desktop/src/main/auth/adapters/DesktopAuthSyncAdapter.ts`

这些文件里可以包含 Electron、SQLite、PowerSync、fetch 等平台细节。

### 3. IPC Registration

例如：

- `apps/desktop/src/main/auth/ipc/register-auth-ipc.ts`

这里只做 channel 到共享 service 方法的映射，不再放业务决策。

---

## Desktop 侧最终不应保留什么

不应继续保留一整套 Desktop 专属认证应用服务，例如：

- `apps/desktop/src/main/modules/authentication/application/AuthDesktopApplicationService.ts`
- `apps/desktop/src/main/modules/authentication/ipc/auth.ipc-handlers.ts`

如果这些文件里的某些逻辑有价值，应迁移方式如下：

- 编排逻辑 -> 移入 `packages/authentication`
- Electron/SQLite/PowerSync 细节 -> 下沉为 Desktop adapter
- 仅与窗口切换相关的逻辑 -> 留在 Desktop 壳层

---

## 迁移方案

建议分四个阶段迁移，避免一次性切太大。

### Phase 1: 统一认证入口

目标：保证 Desktop 主进程只有一套 `auth:*` handler 生效。

动作：

- 明确保留 `packages/authentication/src/electron-entry/index.ts` 作为唯一主进程入口。
- 停止 `apps/desktop/src/main/modules/authentication/**` 参与实际 handler 注册。
- 删除或标记废弃重复的 desktop auth handler/service。
- 先修复 `auth:register`、`auth:login`、`auth:refresh-token` 的实际接线。

验收：

- 任意 `auth:*` channel 都只有一处注册源。
- 改共享包实现时，Desktop 实际行为同步变化。

### Phase 2: 抽取共享策略端口

目标：把离线/在线/guest 的决策从 desktop 本地服务搬进共享包。

动作：

- 在 `packages/authentication` 新增上文提到的 ports。
- 新增 `UnifiedAuthApplicationService`。
- 将“注册必须在线”“登录可离线回退”“guest 不自动升级”等规则搬入共享应用层。

验收：

- 这些规则不再出现在 Desktop 专属应用服务中。
- Web/Desktop 可共用同一份决策逻辑。

### Phase 3: Desktop 适配器化

目标：让 Desktop 只注入能力，不再重写认证服务。

动作：

- 把 `NetworkStateManager` 包装成 `NetworkStatusPort`。
- 把现有本地 identity/session/password 校验能力包装成 `LocalAuthPort`。
- 把 API 调用包装成 `RemoteAuthPort`。
- 把 guest identity 与 PowerSync 模式切换包装成 `GuestAuthPort` / `AuthSyncPort`。

验收：

- Desktop main 中不存在独立认证业务编排类。
- Desktop 只剩组合与平台实现。

### Phase 4: 清理 UI 特判

目标：Renderer 重新完全依赖共享 auth service 契约。

动作：

- 把 `useAuth.ts` 中直连 `window.electronAPI.invoke('auth:enter-guest-mode')` 的逻辑移除。
- 让 `AuthClientService` 显式支持 `enterGuestMode()`。
- 统一 login/register/guest 的成功返回和 store 更新逻辑。

验收：

- `app-vue` 不感知 Desktop 特有编排。
- guest 不再靠 UI 伪造 token/identity。

---

## 推荐目录结构

### 共享包

```text
packages/authentication/src/
  application/
    services/
      unified-auth-application-service.ts
    ports/
      network-status.port.ts
      remote-auth.port.ts
      local-auth.port.ts
      guest-auth.port.ts
      auth-sync.port.ts
  application-client/
    services/
      auth-client-service.ts
  infrastructure-client/
    adapters/
      http/
      ipc/
  electron-entry/
    index.ts
```

### Desktop 宿主

```text
apps/desktop/src/main/auth/
  adapters/
    desktop-network-status.adapter.ts
    desktop-remote-auth.adapter.ts
    desktop-local-auth.adapter.ts
    desktop-guest-auth.adapter.ts
    desktop-auth-sync.adapter.ts
  ipc/
    register-auth-ipc.ts
  desktop-auth.composition-root.ts
```

说明：这里保留的是宿主集成层，不再保留独立业务服务层。

---

## 关键设计决策

### 1. 注册保持在线权威

不建议支持“离线正式注册”。

原因：

- 邮箱唯一性必须由服务端保证。
- 账号创建必须由服务端权威持有。
- 离线注册很容易产生本地与云端身份冲突。
- 远程同步服务所需的正式身份上下文也必须由服务端创建。

因此建议：

- 离线时 `register` 统一失败。
- 引导用户使用 guest 或已有账户离线登录。

### 2. 离线登录允许本地回退

这才是 Desktop 的核心增强价值。

- 用户曾在线登录成功过
- Desktop 缓存了本地凭证或派生校验材料
- 离线时可继续进入 `OFFLINE_USER`

### 3. Guest 是正式能力，不是 UI hack

guest 模式应该是共享认证模块的一等能力，而不是：

- 新增一个 Desktop 特有按钮
- UI 直接调 IPC
- UI 手工拼出 guest token

正确做法是：

- guest 走共享 service 方法
- 返回共享契约
- store 正常消费共享认证结果

### 4. 网络状态要区分“有网”和“API 可达”

`net.isOnline()` 只能说明网络接口在线，不等于 API 真可用。

建议策略：

- `isOnline()` 作为快速判断
- 对关键远程操作可增加轻量 health check 或 fetch 错误回退
- 最终以远程调用结果作为权威

### 5. 同步能力要纳入认证编排

在 DailyUse 里，认证并不是独立子系统，它直接影响：

- 用户能否连接远程数据
- 本地数据库是否处于仅本地模式
- 同步服务是否可挂载/升级/断开

因此认证方案必须把“同步生命周期”作为正式依赖考虑进去，而不是当成外围副作用。

---

## 对现有代码的具体调整建议

### 保留并演进

- `packages/authentication/src/application-client/services/auth-client-service.ts`
- `packages/authentication/src/infrastructure-client/adapters/ipc/auth-ipc.adapter.ts`
- `packages/authentication/src/electron-entry/index.ts`

### 重点重构

- `packages/authentication/src/electron-entry/index.ts`
  - 从“直接 controller/usecase 接线”升级为“组装共享 UnifiedAuthApplicationService + adapters”

- `packages/app-vue/src/modules/authentication/composables/useAuth.ts`
  - 移除 guest 的 desktop 特判
  - 只消费共享 service 暴露的方法

### 最终移除或废弃

- `apps/desktop/src/main/modules/authentication/application/AuthDesktopApplicationService.ts`
- `apps/desktop/src/main/modules/authentication/ipc/auth.ipc-handlers.ts`
- `apps/desktop/src/main/modules/authentication/ipc/auth-ipc-handler.ts`
- 任何仅为了重复实现认证编排而存在的 desktop 本地 auth service

---

## 最小落地顺序

如果希望先小步落地，而不是大改一波，建议按这个顺序：

1. 先统一 `auth:register`、`auth:login`、`auth:enter-guest-mode` 只走共享包入口。
2. 在共享 `AuthClientService` 中加入 `enterGuestMode()`，消除 `useAuth` 里的 desktop 直连 IPC。
3. 在共享包引入 `NetworkStatusPort` 和 `GuestAuthPort`。
4. 把“注册必须在线”的规则搬到共享应用服务。
5. 再把离线登录、本地凭证缓存、PowerSync 切换逐步迁到共享编排层。
6. 最后删除 Desktop 本地认证应用服务和重复 handler。

这样可以先消除双实现，再逐步收敛策略逻辑。

---

## 验收标准

重构完成后，应满足以下标准：

- Desktop 主进程中只有一套认证业务入口。
- `auth:*` 核心行为由共享包统一定义。
- Desktop 不再维护独立认证应用服务类。
- Desktop 只实现 adapter/composition root/ipc registration。
- `register` 在线时成功、离线时稳定失败，且返回共享错误契约。
- `login` 在线时走远程、离线时可回退本地。
- `guest` 通过共享 service 调用，不再由 UI 自己拼状态。
- Web 和 Desktop 使用同一份认证策略，只注入不同平台能力。

---

## 一句话结论

`authentication` 应该和其他模块一样，回到“共享应用层 + 宿主注入平台能力”的模式；Desktop 只做组装和适配，不再保留一整套本地重写的认证服务。
