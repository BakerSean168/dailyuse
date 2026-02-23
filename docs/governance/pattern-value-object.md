# 值对象模式（Value Object Pattern）

> **模式笔记** — 基于 `packages/governance` 活文档

## 定义

值对象是没有唯一标识的不可变对象。相等性通过值判断，而非引用。
值对象封装验证逻辑和行为，确保始终处于合法状态。

## governance 中的参考实现

### Class 类型值对象

- **RuleTag**: `packages/governance/src/domain-shared/value-objects/rule-tag.ts`
- **CodeSnippet**: `packages/governance/src/domain-shared/value-objects/code-snippet.ts`

### Const Object 枚举类型值对象

- **RuleStatus**: `packages/governance/src/domain-shared/value-objects/rule-status.ts`
- **RuleSeverity**: `packages/governance/src/domain-shared/value-objects/rule-severity.ts`
- **Language**: `packages/governance/src/domain-shared/value-objects/language.ts`
- **SnippetType**: `packages/governance/src/domain-shared/value-objects/snippet-type.ts`

## Class 类型值对象设计

### 工厂方法三件套

```typescript
// 1. create() — 标准创建（带校验和规范化）
static create(raw: string): Result<RuleTag>

// 2. fromDTO() — 从 DTO 恢复（假定已校验）
static fromDTO(dto: RuleTagDTO): RuleTag

// 3. fromPersistenceDTO() — 从数据库恢复
static fromPersistenceDTO(dto: RuleTagPersistenceDTO): RuleTag
```

### 不可变性保证

```typescript
// ❌ 不可变 — 不提供 setter
tag.value = 'new-value'; // 错误

// ✅ 修改返回新实例
const newSnippet = snippet.updateContent('new code');
```

### 序列化方法

```typescript
toDTO(): RuleTagDTO           // API 传输
toPersistenceDTO(): RuleTagPersistenceDTO  // 数据库存储
toString(): string             // 字符串表示
```

## Const Object 枚举设计

### Branded Type 防止误用

```typescript
// 类型定义
export type RuleStatus = IRuleStatus & { readonly __brand: unique symbol };

// ❌ 编译时防止原始字符串误传
function activate(status: RuleStatus) { /* ... */ }
activate('Active'); // 类型错误

// ✅ 必须通过对象常量或工厂方法获取
activate(RuleStatus.Active);       // 正确
activate(RuleStatus.create('Active').data); // 正确
```

### 丰富逻辑封装

```typescript
// 状态机逻辑
RuleStatus.canTransitionTo(from, to, context);

// 比较逻辑
RuleSeverity.isStricterThan(a, b);

// 判断辅助
RuleStatus.isDraft(status);
RuleSeverity.isMandatory(severity);
```

## 选择指南

| 场景 | 推荐类型 | 示例 |
|------|---------|------|
| 有限枚举值 | Const Object | RuleStatus, Language |
| 需要规范化/验证的字符串 | Class | RuleTag |
| 复合属性的不可变对象 | Class | CodeSnippet |
| 需要状态机逻辑 | Const Object | RuleStatus |

## 检查清单

新建值对象时确保：

- [ ] 不可变（Class 类型使用私有构造 + 工厂方法，Const Object 使用 `as const`）
- [ ] 带校验的 `create()` 工厂方法（返回 `Result<T>`）
- [ ] 序列化方法（`toDTO()` / `toPersistenceDTO()`）
- [ ] 恢复方法（`fromDTO()` / `fromPersistenceDTO()`）
- [ ] Const Object 枚举使用 Branded Type
