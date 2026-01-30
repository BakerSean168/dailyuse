# Contracts 类型规范检查清单

用于代码审查和新代码编写的快速检查清单。

## 📋 Code Review 检查点

### 新增 PersistenceDTO 时
- [ ] **禁用**: `key?: Type`（Optional）
- [ ] **禁用**: `key?: Type | null`（混用）
- [ ] **必须**: `key: Type | null`（明确 NULL）
- [ ] 所有字段都应声明，没有省略

### 新增 Domain Object / Value Object 时
- [ ] **避免**: `key?: Type`（不稳定形状）
- [ ] **推荐**: `key: Type | null`（稳定形状）
- [ ] 对象完全水合（Fully Hydrated）
- [ ] 嵌套对象也遵循规则

### 新增 Transfer Response DTO 时
- [ ] 与 Domain 保持一致：`key: Type | null`
- [ ] 显式返回 null 而非省略字段
- [ ] 嵌套对象内部字段也遵循规则

### 新增 Transfer Request DTO 时
- [ ] **仅此处允许** `?` 用于 Partial Update
- [ ] 选择 `key?: Type`（不修改）或 `key?: Type | null`（修改为 null）
- [ ] 文档注明语义：未传 = 不修改，传 null = 清空字段

---

## ✅ 自检脚本

在提交前运行以下 grep 命令检查混用:

```bash
# 检查所有混用 ?: Type | null 的地方
grep -rn "?.*:.*|.*null" packages/contracts/src/modules/

# 只检查 PersistenceDTO
grep -rn "PersistenceDTO" packages/contracts/src/modules/ | \
  grep -E ":\s*\w+\?\s*:" 

# 只检查 Domain Entity/VO（避免 ?）
grep -rn "export interface [A-Z]" packages/contracts/src/modules/ | \
  grep "?.*|.*null"
```

---

## 📚 关键文件参考

| 文件 | 类型 | 规则 |
|------|------|------|
| `account/value-objects/account-profile.ts` | Domain + DTO | `key: Type \| null` |
| `account/value-objects/contact-phone.ts` | Domain + DTO | `key: Type \| null` |
| `account/value-objects/contact-email.ts` | Domain + DTO | `key: Type \| null` |
| `authentication/value-objects/device-info.ts` | Domain + DTO | `key: Type \| null` |

---

## 🔍 常见错误模式

### ❌ 错误 1: Persistence 层使用 ?
```typescript
export interface UserPersistenceDTO {
  id: string;
  email?: string;  // ❌ 错误！应该用 | null
}
```

**修正**:
```typescript
export interface UserPersistenceDTO {
  id: string;
  email: string | null;  // ✅ 数据库字段固定存在
}
```

---

### ❌ 错误 2: 混用 ?: Type | null
```typescript
export interface DeviceInfo {
  os?: string | null;  // ❌ 既可选又可空，违反黄金法则
}
```

**修正**:
```typescript
// 选项 1: 只 Optional（传输层用）
key?: string;

// 选项 2: 只 Nullable（Domain 和 Persistence 用）
key: string | null;

// 绝不混用！
```

---

### ❌ 错误 3: Domain 层使用 ? 导致形状不稳定
```typescript
export interface Product {
  name: string;
  description?: string;  // ❌ 形状不稳定
}

// 一个对象可能是: { name, description: "..." }
// 另一个对象可能是: { name }（没有 description）
// V8 引擎无法优化
```

**修正**:
```typescript
export interface Product {
  name: string;
  description: string | null;  // ✅ 形状稳定
}
```

---

## 📝 模板代码

### PersistenceDTO 模板
```typescript
export interface MyEntityPersistenceDTO {
  id: string;
  // 必填字段
  name: string;
  type: EntityType;
  // 可空字段
  description: string | null;
  metaData: string | null;
  // 日期
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

### Domain Entity 模板
```typescript
export interface MyEntity {
  id: EntityId;
  // 必填字段
  name: string;
  type: EntityType;
  // 可空字段
  description: string | null;
  metaData: string | null;
  // 日期
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
}
```

### Transfer Request (Patch) 模板
```typescript
export interface UpdateMyEntityReq {
  // 唯一标识（通常必须）
  id: string;
  // 仅在需要更新时传递，不传 = 不修改
  name?: string;
  description?: string | null;  // 允许混用：传 null = 清空
  type?: EntityType;
}
```

---

## 🎯 性能影响说明

使用 `key: Type | null` 而非 `key?: Type` 的好处:

1. **V8 优化**: 对象形状固定，V8 可以为相同形状的对象共享 Hidden Classes
2. **内存**: 初始化为 null 的字段比不存在的字段性能更好
3. **开发体验**: 减少"是不是忘了初始化"的困惑

```typescript
// ✅ 推荐：V8 可以优化
const user1 = { name: "Alice", email: null };
const user2 = { name: "Bob", email: "bob@ex.com" };

// ❌ 不推荐：V8 无法优化
const user1 = { name: "Alice" };
const user2 = { name: "Bob", email: "bob@ex.com" };
```

---

## 📞 疑问排查

**Q: 能否使用 `key?: string` 来表示可选字段？**  
A: 仅在 API Request (Patch/Put) 中允许，表示"如果不传则不修改"。Domain 和 Persistence 不允许。

**Q: 如果字段在数据库中 NOT NULL，该怎么办？**  
A: 必须在构造器中确保初始化，类型为 `key: string`（无 null）。

**Q: 嵌套对象是否也要遵循规则？**  
A: 是的，嵌套对象的每个字段都要遵循相同规则，包括对象本身可能为 null。

**Q: 为什么不用 Optional<T> 或其他工具？**  
A: Keep it simple。TypeScript 原生的 `?` 和 `| null` 足够表达语义，不需要额外工具。

