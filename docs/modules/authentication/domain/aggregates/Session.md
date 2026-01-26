# Session (会话聚合根)

## 概述

`Session` 是认证模块的**第二个核心聚合根**，代表一个**活跃的登录会话**。

它管理动态的、短生命周期的登录状态，与 `AuthenticationIdentity` 的静态身份管理形成互补。

## 核心职责

1. **会话生命周期管理** - 创建、续期、撤销、过期判定
2. **设备指纹管理** - 记录登录设备的标识信息
3. **令牌管理** - 与 Access Token/Refresh Token 的对应关系
4. **多设备控制** - 支持设备管理和强制下线

## 为什么需要独立的 Session 聚合？

❌ **错误做法**：把 Session 作为 AuthenticationIdentity 的内部列表

```typescript
// 这样设计会导致问题：
class AuthenticationIdentity {
  sessions: List<Session>; // ❌ 问题来了
}
```

**问题**：
- 每次用户刷新 Token（高频操作），都要修改 Identity 聚合
- 引发数据库行级锁，影响并发登录、修改密码等核心操作
- Session 过期需要定时删除，会积累大量垃圾数据

✅ **正确做法**：Session 是**独立聚合根**

```typescript
class Session {}      // 独立聚合
class Identity {}     // 独立聚合
```

**优势**：
- Session 的高频操作（刷新）不会锁定 Identity
- 可以独立管理 Session 的生命周期
- 支持设备级别的细粒度控制（踢单个设备）

## 核心属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `id` | `SessionId` | 会话唯一标识（即 Refresh Token） |
| `identityId` | `IdentityId` | 关联的用户身份ID（外键关系） |
| `deviceInfo` | `DeviceInfo` | 登录设备信息（值对象） |
| `status` | `SessionStatus` | 会话状态（ACTIVE/EXPIRED/REVOKED） |
| `createdAt` | `Date` | 创建时间 |
| `expiresAt` | `Date` | 过期时间 |
| `lastRefreshedAt` | `Date` | 最后刷新时间 |
| `isRevoked` | `boolean` | 是否被撤销 |

## 关键概念

### SessionId = Refresh Token

这是一个重要的架构决策：

```
SessionId (服务端唯一标识，UUID)
    ↓ 发送给客户端
Refresh Token (客户端持有)
    ↓ 用户下次请求时携带
SessionId (服务端根据 ID 查询聚合)
```

**流程示例**：

```
1. 用户登录成功
   ↓
2. 创建 Session，生成 SessionId = "550e8400-e29b-41d4-a716-446655440000"
   ↓
3. 返回给客户端：{ refreshToken: "550e8400-..." }
   ↓
4. 客户端保存在 localStorage 或 Cookie
   ↓
5. 一周后，Access Token 快要过期
   ↓
6. 客户端发送：{ refreshToken: "550e8400-..." }
   ↓
7. 服务端：sessionRepo.findById("550e8400-...")
   ↓
8. 返回 Session 聚合 → 执行 session.refresh()
```

### Access Token (不属于 Session，属于应用层)

Access Token 是一个 **快照投影（Snapshot Projection）**，由 Session 衍生但不完全一致：

```typescript
// Session 本体（服务端）
{
  id: "550e8400-...",        // SessionId
  identityId: "user-123",
  deviceInfo: { ... },
  expiresAt: Date(now + 30d),
  isRevoked: false
}

// 由 Session 生成的 JWT (Access Token)
{
  "sub": "user-123",         // identityId
  "sid": "550e8400-...",     // SessionId (关联回 Session)
  "exp": now + 1h,           // 短期，与 Session 的过期时间不同
  "scope": "read:profile write:data"
}
```

**为什么区分**：
- Session 在服务端持久化，可以被撤销、刷新
- Access Token 是无状态的短期令牌，颁出去就不能改
- 刷新 Token 时，生成新的 Access Token，Session 本身继续存活

## 核心业务方法

### 1. `refresh(durationSeconds: number): void`

续期会话（Refresh Token 续期）。

**流程**：
1. 检查会话是否有效（未过期、未撤销）
2. 延长 `expiresAt` 时间
3. 更新 `lastRefreshedAt`
4. 发布 `SessionRefreshedEvent`

**不变式**：
- 过期或被撤销的会话不能续期（抛 `SessionExpiredException`）

```typescript
session.refresh(30 * 24 * 60 * 60); // 延期30天
// session.expiresAt = now + 30天
// session.lastRefreshedAt = now
```

### 2. `revoke(): void`

主动撤销会话（用户登出或被踢下线）。

**流程**：
1. 设置 `isRevoked = true`
2. 发布 `SessionRevokedEvent`

```typescript
session.revoke();
// 现在这个 Refresh Token 失效，用户需要重新登录
```

### 3. `isValid(): boolean`

检查会话是否有效。

**条件**：
```
isValid = !isRevoked && expiresAt > now
```

### 4. `hasExpired(): boolean`

检查是否已过期。

```typescript
if (session.hasExpired()) {
  throw new SessionExpiredException();
}
```

## 不变式 (Invariants)

任何时刻这些规则必须成立：

1. ✅ SessionId 全局唯一
2. ✅ identityId 必须是有效的 IdentityId
3. ✅ 过期时间 > 创建时间
4. ✅ lastRefreshedAt <= 当前时间
5. ✅ 已撤销的会话不能续期

## 领域事件

- `SessionCreated(sessionId, identityId, deviceInfo)` - 新会话创建
- `SessionRefreshed(sessionId, newExpiresAt)` - 会话续期
- `SessionRevoked(sessionId, reason)` - 会话撤销
- `SessionExpired(sessionId)` - 会话自然过期（由定时任务触发）

## TypeScript 接口定义

```typescript
export interface ISession {
  readonly id: SessionId;
  readonly identityId: IdentityId;
  readonly deviceInfo: DeviceInfo;
  readonly status: SessionStatus;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly lastRefreshedAt: Date;
  readonly isRevoked: boolean;

  // 业务方法
  refresh(durationSeconds: number): void;
  revoke(): void;

  // 查询方法
  isValid(): boolean;
  hasExpired(): boolean;
  isRevoked(): boolean;
}
```

## 工厂方法

### 创建新会话

```typescript
static create(
  identityId: IdentityId,
  deviceInfo: DeviceInfo,
  durationSeconds: number = 30 * 24 * 60 * 60 // 30天
): Session
```

实现细节：
- 生成新的 SessionId（UUID）
- 设置 status = ACTIVE
- 计算 expiresAt = now + durationSeconds
- 发布 `SessionCreatedEvent`

## 使用示例

### 场景1：用户首次登录

```typescript
// 1. 验证凭证（AuthenticationIdentity）
const identity = await identityRepo.findByEmail(email);
identity.authenticate(email, password, encryptionService);

// 2. 创建会话（Session）
const session = Session.create(identity.id, deviceInfo);
await sessionRepo.save(session);

// 3. 生成 JWT Token（应用层）
const accessToken = tokenService.sign({
  sub: identity.id,
  sid: session.id,
  exp: now + 1h
});

// 4. 返回给客户端
return {
  accessToken,
  refreshToken: session.id.toString(),
  expiresIn: 3600
};
```

### 场景2：访问令牌快要过期，客户端刷新

```typescript
// 1. 客户端发送 refreshToken
const refreshToken = request.headers['X-Refresh-Token'];

// 2. 服务端查询 Session
const session = await sessionRepo.findById(refreshToken);

// 3. 续期会话
session.refresh(30 * 24 * 60 * 60);
await sessionRepo.save(session);

// 4. 生成新的 Access Token
const newAccessToken = tokenService.sign({
  sub: session.identityId,
  sid: session.id,
  exp: now + 1h
});

return { accessToken: newAccessToken };
```

### 场景3：用户登出（撤销会话）

```typescript
const session = await sessionRepo.findById(sessionId);
session.revoke();
await sessionRepo.save(session);

// 事件被发布 → 审计日志记录 → 用户前端清空 Token
```

### 场景4：管理员踢用户下线

```typescript
// 查找该用户所有活跃的会话
const activeSessions = await sessionRepo.findByIdentityId(
  identityId,
  { status: SessionStatus.ACTIVE }
);

// 全部撤销
for (const session of activeSessions) {
  session.revoke();
  await sessionRepo.save(session);
}
```

## 与其他聚合的关系

```
┌─────────────────────────────────┐
│  AuthenticationIdentity (Root)  │
│  - 管理凭证、安全策略           │
│  - 静态、长生命周期             │
└─────────────────────────────────┘
           │ references (外键)
           │ 1-to-Many
           ▼
┌─────────────────────────────────┐
│   Session (独立Root)            │
│   - 管理会话、设备、令牌        │
│   - 动态、短生命周期            │
└─────────────────────────────────┘
```

**隔离的好处**：
- ✅ Session 的刷新（高频）不影响 Identity 的修改
- ✅ 可以独立扩展：Session 表可以分片、异地备份
- ✅ 支持单个设备踢下线（粒度细）

## 数据库表映射

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,              -- SessionId，也是 Refresh Token
  identity_id UUID NOT NULL,        -- 外键
  status VARCHAR(20),               -- ACTIVE, EXPIRED, REVOKED
  device_type VARCHAR(20),          -- MOBILE, WEB, DESKTOP
  device_name VARCHAR(255),         -- "iPhone 13", "Chrome on Windows"
  ip_address VARCHAR(45),           -- IPv4 or IPv6
  user_agent VARCHAR(500),
  location VARCHAR(100),            -- "Shanghai, China"
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  last_refreshed_at TIMESTAMP,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP,             -- 撤销时间
  revoke_reason VARCHAR(255),       -- 撤销原因
  
  FOREIGN KEY (identity_id) REFERENCES auth_identities(id)
    ON DELETE CASCADE,
  INDEX idx_identity_id (identity_id),
  INDEX idx_expires_at (expires_at)  -- 用于清理过期会话
);
```
