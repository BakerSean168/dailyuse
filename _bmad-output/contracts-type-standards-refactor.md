# Contracts 模块类型规范检查与修复报告

**检查时间**: 2026年1月30日  
**检查范围**: `packages/contracts/src/modules/account` 和 `packages/contracts/src/modules/authentication`  
**规范依据**: [types-undefined-or-null-spec.md](../docs/standards/types-undefined-or-null-spec.md)

---

## 执行概况

✅ **检查完成** | 发现并修复 **4 个文件** | **18 处** 混用问题

### 修复文件清单

| 文件 | 问题数 | 修复类型 |
|------|--------|----------|
| [account/value-objects/account-profile.ts](../../packages/contracts/src/modules/account/value-objects/account-profile.ts) | 6 | `?` → `\| null` |
| [account/value-objects/contact-phone.ts](../../packages/contracts/src/modules/account/value-objects/contact-phone.ts) | 3 | `?: Type \| null` → `: Type \| null` |
| [account/value-objects/contact-email.ts](../../packages/contracts/src/modules/account/value-objects/contact-email.ts) | 3 | `?: Type \| null` → `: Type \| null` |
| [authentication/value-objects/device-info.ts](../../packages/contracts/src/modules/authentication/value-objects/device-info.ts) | 6 | `?: Type \| null` → `: Type \| null` |

---

## 详细修复说明

### 1. account-profile.ts

**问题**: 所有三个 DTO 层级混用了 `?` 和 `| null`

#### 修复内容:

**Domain 层 (AccountProfile)**
```typescript
// ❌ 修复前
realName?: string;
avatarUrl?: string;
bio?: string;
birthday?: DomainDate;

// ✅ 修复后
realName: string | null;
avatarUrl: string | null;
bio: string | null;
birthday: DomainDate | null;
```
**理由**: Domain 对象应保持稳定形状 (Stable Shape)，属性始终存在但可能为 null

**Transfer DTO (AccountProfileDTO)**
```typescript
// ❌ 修复前
realName?: string;
birthday?: TransferDate;

// ✅ 修复后
realName: string | null;
birthday: TransferDate | null;
```
**理由**: API Response 应提供显式契约，前端明确知道字段是否存在

**Persistence DTO (AccountProfilePersistenceDTO)**
```typescript
// ❌ 修复前
realName?: string;
birthday?: PersistenceDate;

// ✅ 修复后
realName: string | null;
birthday: PersistenceDate | null;
```
**理由**: 数据库字段定义是固定的，列永远存在，用 `| null` 明确对应 SQL NULL

---

### 2. contact-phone.ts

**问题**: Domain 和两个 DTO 中的 `verifiedAt` 混用了 `?: Type | null`

#### 修复内容:

```typescript
// ❌ 修复前 (所有三个接口)
verifiedAt?: DomainDate | null;    // Domain
verifiedAt?: TransferDate | null;  // Transfer DTO
verifiedAt?: PersistenceDate | null; // Persistence DTO

// ✅ 修复后
verifiedAt: DomainDate | null;
verifiedAt: TransferDate | null;
verifiedAt: PersistenceDate | null;
```

**违反规范**: 黄金法则 - 严禁使用 `key?: Type | null` (既可选又可空)

---

### 3. contact-email.ts

**问题**: Domain 和两个 DTO 中的 `verifiedAt` 混用了 `?: Type | null`

#### 修复内容:

同 contact-phone.ts，所有三个接口中的 `verifiedAt` 字段统一改为:
```typescript
verifiedAt: TransferDate | null;  // 对应层级
```

---

### 4. device-info.ts

**问题**: 三个层级中所有可空字段都混用了 `?: Type | null`

#### 修复内容:

**Domain 层 (DeviceInfo)**
```typescript
// ❌ 修复前
deviceName?: string | null;
os?: string | null;
ipAddress?: string | null;
userAgent?: string | null;
location?: { ... } | null;

// ✅ 修复后
deviceName: string | null;
os: string | null;
ipAddress: string | null;
userAgent: string | null;
location: { ... } | null;
```

嵌套对象内部也统一:
```typescript
// ❌ 修复前
country?: string | null;
region?: string | null;

// ✅ 修复后
country: string | null;
region: string | null;
```

**Transfer DTO 和 Persistence DTO**: 同样规范处理所有字段

---

## 规范总结

根据 [types-undefined-or-null-spec.md](../docs/standards/types-undefined-or-null-spec.md)，修复遵循以下原则:

| 层级 | 规则 | 写法 | 说明 |
|------|------|------|------|
| **Persistence** | 严禁 `?` | `key: Type \| null` | 数据库列固定存在 |
| **Domain** | 避免 `?` | `key: Type \| null` | 对象形状稳定 (Stable Shape) |
| **Transfer Response** | 使用 `\| null` | `key: Type \| null` | 显式契约 (Explicit Contract) |
| **Transfer Request** | 仅此处允许 `?` | `key?: Type` 或 `key?: Type \| null` | Partial Update 场景 |

---

## 验证结果

✅ **混用检查**: 无残留 `?: Type | null` 模式  
✅ **PersistenceDTO**: 所有字段都用 `| null` 表示 NULL  
✅ **Domain & Transfer**: 保持一致的 `| null` 模式  
✅ **嵌套对象**: 内部字段也规范化

---

## 影响范围

- ✅ 类型检查无影响 (TypeScript 语义等价)
- ⚠️ Runtime 实现代码需确保完整初始化对象 (初始值为 null 而非省略字段)
- 📝 前端代码条件判断可简化: `if (val != null)` 而非 `if (val !== undefined && val !== null)`

---

## 后续建议

1. **自动化检查**: 考虑在 CI 中添加 ESLint 规则防止新的 `?: Type | null` 写法
2. **代码评审检查点**: Code Review 时重点关注新增 DTO/Entity 是否遵循规范
3. **文档更新**: 在项目的 TypeScript 风格指南中突出此规范
