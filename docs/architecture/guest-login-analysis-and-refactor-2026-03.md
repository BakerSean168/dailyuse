# Guest Login Analysis And Refactor Plan (2026-03-18)

## 问题结论

当前桌面端“访客模式”报错，根因不是读取了登录输入框。

真正的失败点在主进程：

1. 点击“访客模式”后，前端直接调用 `enterGuestMode()`，没有读取邮箱输入框。
2. 主进程成功拿到当前主机唯一的 `guestId` 之后，又尝试为这个访客身份自动创建 `Account` 投影。
3. 这个投影在没有真实邮箱时，硬编码回退到 `guest@local`。
4. `Account` 聚合内部使用 `ContactEmail` 值对象校验邮箱格式，要求 `@` 后面必须包含 `.`。
5. `guest@local` 不符合当前领域规则，于是抛出 `Invalid email address format: guest@local`。

所以，当前报错本质上是：

`访客身份` 被错误地强绑定到了 `必须有合法邮箱的 Account 聚合`。

## 现状实现链路

### 1. Renderer 入口

文件：

- `packages/app-vue/src/views/DesktopAuthView.vue`
- `packages/app-vue/src/modules/authentication/composables/useAuth.ts`

当前桌面登录页里，“访客模式”按钮直接绑定 `enterGuestMode`，没有读取邮箱输入框。

`useAuth.ts` 中当前实现：

- 调用 `service.enterGuestMode()`
- 成功后手动给认证 store 塞一个 synthetic identity
- 人工写入 `email: 'guest@local'`
- 人工写入 `accessToken: 'guest-local-token'`

这说明：

- 访客入口本来就不依赖输入框
- 但前端自己也在传播一个假的邮箱字符串

### 2. Main 进程访客模式

文件：

- `apps/desktop/src/main/modules/authentication/application/AuthDesktopApplicationService.ts`
- `apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts`

当前主流程：

1. `AuthDesktopApplicationService.enterGuestMode()`
2. `SessionManager.getOrCreateGuestIdentity()`
3. 生成或恢复持久化的 `GuestIdentity_<uuid>`
4. 保存本地 token：`guest-local-token`
5. 回到 `AuthDesktopApplicationService.enterGuestMode()`
6. 调用 `ensureAccountProjection(guestId, null)`

这里第 6 步就是当前实现的关键问题。

### 3. Account 投影的失败点

文件：

- `apps/desktop/src/main/modules/authentication/application/AuthDesktopApplicationService.ts`
- `packages/account/src/domain-server/aggregates/account.ts`
- `packages/account/src/domain-shared/value-objects/contact-email.ts`

当前逻辑：

`ensureAccountProjection(identityId, email)` 会在 `email` 为空时调用 `getProjectionFallbackEmail(identityId)`。

对于访客身份，`getProjectionFallbackEmail()` 返回：

```ts
'guest@local'
```

随后执行：

```ts
Account.create({
  id: identityId,
  email: normalizedEmail,
})
```

而 `Account.create()` 内部会构造：

```ts
ContactEmail.create({
  address: params.email,
  ...
})
```

`ContactEmail` 当前使用的正则是：

```ts
/^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

因此 `guest@local` 会直接失败。

## 为什么这不是“输入框污染”

从现有代码看，访客模式和登录表单是两条链路：

- 登录：读取输入框邮箱和密码
- 访客：直接进入 `enterGuestMode()`

所以“访客模式不应该依赖输入框内容”这个判断是对的，当前实现也基本如此。

报错出现的原因，不是输入框内容串进来了，而是系统内部自己制造了一个假的邮箱值 `guest@local`，并把它送进了严格邮箱校验的领域模型。

## 当前实现的问题

### 1. 访客身份和 Account 聚合被错误耦合

当前代码默认认为：

- 只要进入认证态，就必须存在 `Account`
- 只要创建 `Account`，就必须有合法邮箱

这对在线账号成立，但对 guest 不成立。

访客身份的本质应当是：

- 本机唯一
- 本地持久化
- 无需邮箱
- 无需云端账号

### 2. 用魔法字符串补领域约束

`guest@local` 是一个 transport / UI 占位值，不是合法业务数据。

现在它被同时用于：

- 前端 synthetic identity
- 主进程 Account 投影 fallback

这会导致两个问题：

- magic string 在多层扩散
- UI 占位值泄漏到领域层

### 3. 认证成功与账户投影成功被绑死

当前 `enterGuestMode()` 的核心目标是“进入访客态”。

但它在完成 guest session 建立后，又同步执行 `ensureAccountProjection()`。

结果是：

- guest session 实际已经可用
- 但因为 Account 投影失败，整个访客登录被判定失败

这属于职责倒置。

更合理的顺序应该是：

- 先保证 guest auth 成功
- 账户资料相关能力按 guest 专门处理，而不是阻塞登录

### 4. Renderer 也在伪造一份不符合契约的身份数据

`AuthIdentityClientDTO` 的核心邮箱来源其实是 `identifiers`，不是顶层 `email` 字段。

但前端 `useAuth.ts` 里手工构造：

```ts
{
  id: guestData.identityId,
  email: 'guest@local',
  status: 'ACTIVE',
}
```

这说明当前 renderer 为了让 `isAuthenticated` 变成 `true`，在绕过正式契约。

这会导致：

- store 数据结构与真实 contract 漂移
- guest UI 依赖非正式字段
- 后续模块可能继续误用这个假邮箱

### 5. Guest / Offline / Online 三种身份模型边界不清晰

当前系统里至少有三种身份形态：

- online user
- offline user
- guest

但很多模块默认把三者都当成“有完整 Account 的用户”处理。

这就是 guest 模式脆弱的根因之一。

## 推荐重构方向

## 目标

重构后的 guest 模式应满足：

1. 不依赖登录输入框
2. 不依赖任何 fake email
3. 只依赖 `SessionManager` 生成/恢复本机唯一 guest identity
4. guest 登录成功不应被 Account 投影阻塞
5. UI 对 guest 的展示应由 `auth mode` 或显式 `isGuest` 驱动，而不是由邮箱字符串驱动

## 方案 A：最小风险修复方案

这是最适合先落地的方案。

### A1. 主进程去掉 guest 的邮箱 fallback

修改点：

- `AuthDesktopApplicationService.getProjectionFallbackEmail()`
- `AuthDesktopApplicationService.ensureAccountProjection()`

建议：

- 对 guest 身份返回 `null`
- `ensureAccountProjection()` 在没有邮箱时直接跳过

即：

- online user：有邮箱，照常创建 Account 投影
- guest：没有邮箱，不创建 Account 投影

这样可以直接消除当前报错。

### A2. `enterGuestMode()` 不再把 Account 投影作为成功前置条件

`enterGuestMode()` 的成功条件应仅包括：

- 已拿到 guest identity
- 已保存 guest token
- 已建立 guest session
- 已切换到 `AuthMode.GUEST`

至于 Account 资料，不应阻塞访客进入主界面。

### A3. Renderer 不再写入 `guest@local`

修改点：

- `packages/app-vue/src/modules/authentication/composables/useAuth.ts`

建议：

- 不再写入 `email: 'guest@local'`
- 如果只是为了让 `isAuthenticated` 成立，构造一份最小合法的 `AuthIdentityClientDTO`
- 或者更好，调用一次 `getCurrentUser()`，由 main 返回标准 identity DTO

关键点：

- guest 的展示名应是“访客”或“本地访客”
- 不应继续依赖 fake email

### A4. Account 页面对 guest 做显式分支

当前 `AccountCenterView` 在挂载时会调用 `loadMyProfile()`。

而 `account:get-me` 当前逻辑要求仓库中存在真实 `Account` 记录。

所以最小修复下还需要二选一：

1. guest 模式下禁用/隐藏 AccountCenter
2. guest 模式下显示专用“本地访客资料”视图，不走 `account:get-me`

如果短期目标只是先修复登录失败，建议先做第 1 种。

## 方案 B：结构化重构方案

这是更干净的长期方案。

### B1. 引入明确的 Current Actor / Principal 模型

不要把“当前使用者”直接等价为 `Account`。

建议单独定义一个桌面侧统一模型，例如：

```ts
type CurrentActor =
  | { kind: 'online'; identityId: string; email: string | null; nickname: string | null }
  | { kind: 'offline'; identityId: string; email: string | null; nickname: string | null }
  | { kind: 'guest'; identityId: string; nickname: '访客'; email: null };
```

然后：

- 认证模块负责返回 `CurrentActor`
- renderer 按 `kind` 决定展示
- Account 模块只处理真正有账户资料的数据

### B2. Account 变成“可选能力”，不是认证必备前提

设计上应改成：

- Auth 负责“我是谁”
- Account 负责“我的账户资料”

对于 guest：

- 有 identity
- 没有 account

对于 online user：

- 有 identity
- 有 account

这样模块边界会清晰很多。

### B3. 用 `authMode` / `actor.kind` 驱动 UI，而不是邮箱

当前 guest UI 能工作，部分是靠：

- synthetic identity 非空
- token 非空

这会诱导系统用假数据维持状态。

更合理的做法是让 store 的认证态来源于：

- `accessToken`
- `currentIdentity`
- `authMode`

或者进一步直接使用：

- `authStatus.authenticated`
- `authStatus.mode`

guest UI 文案应根据 `mode === GUEST` 显示“访客模式”，而不是依赖 `guest@local`。

### B4. 把 guest 的展示资料下沉到本地 profile，而不是 Account.email

如果访客也需要昵称、头像、本地偏好，可以单独设计：

- `LocalProfile`
- `GuestProfile`
- 或复用 setting / local metadata

但不要强行塞进 `Account.email`。

## 建议落地顺序

### Phase 1：止血

1. 删掉 guest 的 `guest@local` fallback
2. guest 模式下跳过 `ensureAccountProjection()`
3. renderer 不再写 `guest@local`
4. 增加回归测试，覆盖“空输入框下也能进入访客模式”

### Phase 2：补齐 guest 专用 UI 分支

1. AccountCenter 对 guest 做分支处理
2. 统一主界面顶部、个人中心、设置页的 guest 展示文案
3. 用 `authMode` 明确区分 guest / offline / online

### Phase 3：模型收敛

1. 引入 `CurrentActor` 或等价 DTO
2. 让 renderer 从正式 contract 获取当前 actor，而不是伪造 identity
3. 把 `Account` 从“认证态必需品”降级为“在线账户资料能力”

## 建议测试用例

至少补以下测试：

### 认证主流程

1. 点击访客模式时，即使邮箱/密码输入框为空，也能成功进入主界面
2. guest 第一次进入时会创建持久化 guest identity
3. guest 再次进入时会复用同一主机上的 guest identity
4. guest 登录过程中不会触发邮箱格式校验错误

### 账户边界

1. guest 模式下不会创建带 fake email 的 `Account`
2. online login 仍会正常创建/确保 `Account` 投影
3. offline user 不受 guest 修复影响

### Renderer 状态

1. guest 登录后 store 进入 authenticated 状态
2. guest store 不包含 `guest@local`
3. 依赖当前用户展示的页面不会因为缺少 email 而崩溃

## 最终建议

如果目标是尽快恢复访客登录，建议直接采用“方案 A”。

原因很简单：

- 改动小
- 风险低
- 可以直接消除当前异常
- 不会破坏 online/offline 的既有账户链路

如果目标是把桌面认证模型彻底理顺，则应继续推进“方案 B”：

- guest 是 guest
- account 是 account
- 不再用 fake email 在多层系统里凑契约

这才符合“每个主机唯一访客账号”的真实设计意图。
