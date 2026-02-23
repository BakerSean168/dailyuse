# 聚合根模式（Aggregate Root Pattern）

> **模式笔记** — 基于 `packages/governance` 活文档

## 定义

聚合根是 DDD 中的核心模式，它是一组相关对象的入口点。
外部只能通过聚合根访问聚合内部的实体和值对象。

## governance 中的参考实现

**文件**: `packages/governance/src/domain-server/aggregates/rule.ts`

## 关键设计决策

### 1. 私有构造函数 + 工厂方法

```typescript
// ❌ 禁止直接实例化
const rule = new Rule(props); // 编译错误

// ✅ 通过工厂方法创建（带完整校验）
const result = Rule.create(props);   // 新建
const rule = Rule.load(state);       // 从持久化恢复（不校验、不触发事件）
```

**原因**: `create()` 保证所有业务规则（标签数量、描述长度等）在创建时就被校验。
`load()` 从数据库恢复已验证数据，跳过校验以提升性能。

### 2. Props Object 模式

```typescript
interface CreateRuleProps {
  code: string;        // 规则编码
  title: string;       // 标题（3-100 字符）
  description: string; // 描述（10-5000 字符）
  severity: RuleSeverity;
  tags: string[];
  goodExamples: Array<{ language: Language; content: string; caption?: string }>;
  badExamples: Array<{ language: Language; content: string; caption?: string }>;
  authorId: IdentityId;
}
```

**优势**: 参数清晰、易扩展、便于集中校验。

### 3. 私有 Backing 字段 + Readonly Getters

```typescript
private _title: string;
private _status: RuleStatus;

get title(): string { return this._title; }
get status(): RuleStatus { return this._status; }
```

**原因**: 确保状态只能通过业务方法变更，外部无法直接赋值。

### 4. Result<T> 返回模式

```typescript
activate(): Result<void> {
  const transitionResult = RuleStatus.canTransitionTo(this._status, RuleStatus.Active, ...);
  if (!transitionResult.ok) {
    return error(transitionResult.error.code, transitionResult.error.message);
  }
  // ... 状态变更
  return ok(undefined);
}
```

**原因**: 替代异常驱动的错误处理，使错误成为可预期的返回值。

### 5. 领域事件自动发布

```typescript
rule.addDomainEvent<GovernanceEventMap['governance:rule-created']>('governance:rule-created', {
  code: rule._code,
  title: rule._title,
  // ...
});
```

**原因**: 聚合根的状态变更对外部模块透明通知。

## 检查清单

新建聚合根时确保：

- [ ] 私有构造函数
- [ ] `create()` 工厂方法（带完整校验，返回 `Result<T>`）
- [ ] `load()` 工厂方法（从持久化恢复，不校验）
- [ ] 私有 backing 字段 + readonly getters
- [ ] 所有业务方法返回 `Result<T>`
- [ ] 关键状态变更发布领域事件
- [ ] `toClientDTO()` 序列化方法
