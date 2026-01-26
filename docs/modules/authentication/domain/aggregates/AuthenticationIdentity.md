# AuthenticationIdentity (认证身份聚合根)

## 概述

`AuthenticationIdentity` 是认证模块的**核心聚合根**，代表一个**可被认证的主体**（用户）。

它不是完整的用户资料（如昵称、头像），而是**专注于安全与凭证管理**的纯业务对象。

## 核心职责

1. **凭证管理** - 维护用户的多个登录方式（密码、微信、GitHub等）
2. **身份验证** - 核心的 `authenticate()` 业务逻辑
3. **安全策略** - 管理失败次数、锁定状态、解封机制
4. **生命周期** - 注册、启用、禁用、锁定等状态转换

## 核心属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `id` | `IdentityId` | 全局唯一标识（强类型UUID） |
| `status` | `IdentityStatus` | 当前状态（ACTIVE/LOCKED/DISABLED/UNVERIFIED） |
| `failedLoginAttempts` | `number` | 连续失败次数 |
| `lastFailedAttempt` | `Date` | 最后一次失败时间 |
| `lockedUntil` | `Date \| null` | 锁定截止时间（null=永久锁定） |
| `credentials` | `AuthCredential[]` | 凭证列表（多态） |
| `createdAt` | `Date` | 创建时间 |
| `updatedAt` | `Date` | 最后修改时间 |

## 核心业务方法

### 1. `authenticate(identifier, secret, encryptionService): void`

尝试用凭证登录。这是DDD中最关键的业务规则实现。

**流程**：
1. 检查锁定状态（如果被锁定则抛异常）
2. 查找匹配的凭证
3. 验证密码/Token（调用加密服务）
4. 失败则记录失败次数，达到阈值则自动锁定
5. 成功则重置失败次数，发布 `IdentityAuthenticatedEvent`

**异常**：
- `AccountLockedException` - 账号被锁定
- `InvalidCredentialsException` - 凭证不匹配

### 2. `changePassword(oldPasswordHash, newPasswordHash): void`

修改密码。

**流程**：
1. 验证旧密码是否正确
2. 更新 PasswordCredential 中的 Hash
3. 更新 `passwordChangedAt`
4. 发布 `PasswordChangedEvent`

### 3. `bindCredential(credential: AuthCredential): void`

绑定一个新的凭证方式（如新增微信登录）。

**校验**：
- 检查该凭证的标识符不能被其他用户使用
- 相同类型的凭证不能重复绑定

### 4. `unbindCredential(type: CredentialType): void`

解除绑定一个凭证方式。

**规则**：
- 必须保留至少一个凭证方式
- 抛异常如果只剩一个凭证

### 5. `lock(durationMinutes?: number): void`

锁定账号（因为多次失败登录）。

**参数**：
- `durationMinutes` - 锁定时长（秒），为空则永久锁定

### 6. `unlock(): void`

解除锁定，重置失败次数。

### 7. `disable(): void`

永久禁用账号（管理员操作）。状态转为 DISABLED，所有凭证全部失效。

## 不变式 (Invariants) 

在任何时刻，这些规则必须成立：

1. ✅ 至少有一个凭证方式
2. ✅ 同一 `type + identifier` 组合全局唯一
3. ✅ 失败次数 >= 5 时自动锁定
4. ✅ 已禁用的身份不能登录
5. ✅ 未验证的身份可以有受限功能

## 领域事件

当以下业务事件发生时，触发相应的领域事件：

- `IdentityRegistered(identityId, email)` - 新用户注册
- `IdentityAuthenticated(identityId)` - 登录成功
- `IdentityLocked(identityId, reason)` - 账号被锁定
- `PasswordChanged(identityId)` - 密码已修改
- `CredentialBound(identityId, type)` - 新凭证已绑定
- `IdentityDisabled(identityId)` - 账号被禁用

## TypeScript 接口定义

```typescript
export interface IAuthenticationIdentity {
  readonly id: IdentityId;
  readonly status: IdentityStatus;
  readonly failedLoginAttempts: number;
  readonly lastFailedAttempt?: Date;
  readonly lockedUntil?: Date;
  readonly credentials: IAuthCredential[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // 业务方法
  authenticate(
    identifier: string,
    secret: string,
    encryptionService: IEncryptionService
  ): void;

  changePassword(
    oldPasswordHash: HashedPassword,
    newPasswordHash: HashedPassword
  ): void;

  bindCredential(credential: IAuthCredential): void;
  unbindCredential(type: CredentialType): void;
  lock(durationMinutes?: number): void;
  unlock(): void;
  disable(): void;
  
  // 查询方法
  isLocked(): boolean;
  isDisabled(): boolean;
  canLogin(): boolean;
}
```

## 工厂方法

### 创建新身份 (注册时)

```typescript
static create(email: string, plainPassword: PlainPassword): AuthenticationIdentity
```

实现细节：
- 生成新的 IdentityId
- 创建 PasswordCredential 并进行 Hash
- 初始状态为 UNVERIFIED（邮箱需验证）
- 发布 `IdentityRegisteredEvent`

## 使用示例

### 场景1：用户尝试登录

```typescript
const identity = await identityRepository.findByEmail("user@example.com");

try {
  identity.authenticate(
    "user@example.com",
    plainPassword,
    encryptionService
  );
  // 成功！可以创建 Session
  const session = new Session(identity.id, deviceInfo);
  await sessionRepository.save(session);
} catch (error) {
  if (error instanceof AccountLockedException) {
    // 提示用户账号已锁定
  }
}
```

### 场景2：用户修改密码

```typescript
const newPasswordHash = encryptionService.hash(newPlainPassword);
identity.changePassword(currentHash, newPasswordHash);
await identityRepository.save(identity);
// 触发事件 → 通知服务发送邮件 → Session 管理器踢出所有旧设备
```

### 场景3：绑定微信登录

```typescript
const wechatCredential = new OAuthCredential({
  provider: "WECHAT",
  externalUserId: wechatOpenId,
  accessToken: wechatToken
});

identity.bindCredential(wechatCredential);
await identityRepository.save(identity);
```

## 与其他聚合的关系

```
┌─────────────────────────────────┐
│  AuthenticationIdentity (Root)  │
│  - id, status, failedAttempts   │
└──────────┬──────────────────────┘
           │ owns (1-to-Many)
           ▼
  ┌────────────────────────┐
  │ AuthCredential (Entity)│
  │ - PasswordCredential   │
  │ - OAuthCredential      │
  │ - PhoneCredential      │
  └────────────────────────┘
           │ references (Foreign Key)
           ▼
┌─────────────────────────────────┐
│   Session (独立聚合根)          │
│   - sessionId, deviceInfo       │
└─────────────────────────────────┘
```

## 数据库表映射

通常映射到这些表：
- `auth_identities` - 主表
- `auth_credentials` - 凭证表（单表继承）

```sql
CREATE TABLE auth_identities (
  id UUID PRIMARY KEY,
  status VARCHAR(20),
  failed_login_attempts INT DEFAULT 0,
  last_failed_attempt TIMESTAMP,
  locked_until TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE auth_credentials (
  id UUID PRIMARY KEY,
  identity_id UUID FOREIGN KEY,
  type VARCHAR(20),        -- PASSWORD, OAUTH_WECHAT, PHONE_SMS
  identifier VARCHAR(255), -- email, openId, phone
  secret VARCHAR(500),     -- passwordHash or token
  is_verified BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  UNIQUE(identity_id, type, identifier)
);
```
