# Authentication 领域值对象清单

认证模块中通过大量的**强类型值对象（Value Objects）**来封装验证逻辑，防止“原始类型偏执”。

---

## 1. IdentityId
**职责**：认证主体的强类型唯一 ID。
- **验证**：必须是合法的 UUID 格式。
- **意义**：与 `AccountId` 可能相同，但从语义上区分它代表的是“认证凭证持有者”。

## 2. SessionId
**职责**：会话的强类型唯一 ID。
- **验证**：高质量随机 UUID。
- **使用**：直接作为 **Refresh Token** 给前端使用。

## 3. IdentityStatus (枚举)
**值**：
- `ACTIVE`: 正常。
- `LOCKED`: 临时锁定（因密码错误过多）。
- `DISABLED`: 永久禁用。
- `UNVERIFIED`: 待验证（如邮箱注册未点链接）。

## 4. HashedPassword
**职责**：封装**已加密**的密码串。
- **内部值**：`$2a$10$Xj...` (BCrypt 或 Argon2 格式)。
- **规则**：
  - 构造时检测是否包含算法前缀。
  - **不包含**明文。
  - **方法**：`equals(hash)`。

## 5. PlainPassword
**职责**：封装用户输入的**明文**原始密码。
- **规则（强迫式校验）**：
  - 构造时校验：长度 >= 8，必须含大小写字母和数字。
  - 校验失败直接抛出 `DomainException`。
- **安全**：在完成加密后应立即从内存中销毁或清空（取决于环境）。

## 6. EmailAddress
**职责**：合法的邮箱地址。
- **校验**：Regex 验证。
- **方法**：`toDomain()`, `toLocalPart()`。

## 7. PhoneNumber
**职责**：合法的手机号码。
- **校验**：遵循 **E.164** 国际规范（如 `+8613800138000`）。

## 8. DeviceInfo
**职责**：登录设备元数据快照。
- **包含属性**：
  - `ipAddress`: 来源 IP。
  - `userAgent`: 浏览器、操作系统标识库。
  - `deviceType`: `MOBILE` | `WEB` | `DESKTOP` | `TV`。
  - `location`: (可选) 基于 IP 的地理位置。
  - `fingerprint`: 设备指纹。

## 9. JsonWebToken (JWT)
**职责**：颁给前端的 Access Token 投影。
- **内部属性**：
  - `header`
  - `payload` (Claims: `sub`, `sid`, `exp`, `role`)
  - `signature`
- **生命周期**：通常为 15 分钟 - 2 小时。

## 10. SessionStatus (枚举)
**值**：
- `ACTIVE`: 正常会话。
- `EXPIRED`: 已自然过期。
- `REVOKED`: 被手动撤销（登出或被踢）。

## 11. AuthType (枚举)
**值**：
- `PASSWORD`: 账号密码登录。
- `WECHAT`: 微信登录。
- `GOOGLE`: 谷歌登录。
- `SMS`: 短信登录。
- `API_KEY`: 机器人登录。

## TypeScript 示例代码

```typescript
// IdentityId.ts
export type IdentityId = string & { readonly brand: unique symbol };

// PlainPassword.ts
export class PlainPassword {
  constructor(private readonly value: string) {
    if (value.length < 8) {
      throw new Error("Password too short");
    }
    // 更多复杂度校验...
  }
}

// DeviceInfo.ts
export interface DeviceInfo {
  ip: string;
  userAgent: string;
  type: 'MOBILE' | 'WEB' | 'DESKTOP';
}
```
