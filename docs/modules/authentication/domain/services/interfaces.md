# Authentication 领域服务 (Domain Services)

## 概述

领域服务用于处理那些：
1. **涉及具体算法**（如加密、签名），不适合放在纯实体里的逻辑。
2. **需要跨聚合协调**（如 Identity 和 Session），通过领域服务聚合更优雅。

---

## 1. IEncryptionService (加密服务)

**职责**：处理敏感数据的 Hash 加密与验证。
**特点**：领域层只定义**接口**，基础设施层（Infrastructure）使用 BCrypt 或 Argon2 实现。

### 接口定义
```typescript
export interface IEncryptionService {
  /**
   * 将明文加密
   */
  hash(plain: string): string;

  /**
   * 验证明文是否与 Hash 匹配
   */
  verify(plain: string, hashed: string): boolean;
}
```

---

## 2. ITokenService (访问令牌服务)

**职责**：负责颁发和解析 JWT (Access Token)。
**特点**：解耦 JWT 库（如 jsonwebtoken）的细节。

### 接口定义
```typescript
export interface ITokenService {
  /**
   * 为 Session 签发 Access Token
   */
  issueAccessToken(payload: JwtPayload): string;

  /**
   * 解析 Token 得到 Payload
   */
  parseToken(token: string): JwtPayload;
}
```

---

## 3. AuthenticationManager (认证管理器)

**职责**：**认证的核心编排逻辑**。
这是一个显式的领域服务，负责串联所有积木，协助应用层调用。

### 业务流程
1. 根据用户名从 `IdentityRepository` 获取 `AuthenticationIdentity` 聚合。
2. 调用聚合根的 `identity.authenticate(...)`。
3. 如果抛出异常，记录失败次数并保存聚合。
4. 如果成功：
   - 触发 `Session.create()`。
   - 保存 Session。
   - 调用 `ITokenService` 生成 Access Token。
5. 返回完整的登录结果（Access Token + Refresh Token）。

---

## 4. Policy (安全策略服务)

**职责**：定义全系统的动态安全规则。

### 接口示例
* `canCreateSession(identityId): boolean`: 例如限制一个用户只能同时在 5 个端登录。
* `isPasswordStrong(plain): boolean`: 动态检查密码强度。
* `getLockingPolicy()`: 获取锁定策略（5次失败锁15分钟）。
