# 状态机模式（State Machine Pattern）

> **模式笔记** — 基于 `packages/governance` 活文档

## 定义

状态机模式将对象的状态转换规则封装到值对象中，
聚合根通过调用值对象的 `canTransitionTo()` 来验证转换合法性。

## governance 中的参考实现

**文件**: `packages/governance/src/domain-shared/value-objects/rule-status.ts`

## 状态流转图

```
    ┌──────────┐
    │  Draft   │
    └────┬─────┘
         │ activate()
         ▼
    ┌──────────┐       deprecate()      ┌──────────────┐
    │  Active  │ ──────────────────────▶ │  Deprecated  │
    └──────────┘                         └──────┬───────┘
         ▲                                      │
         │            reactivate()              │
         └──────────────────────────────────────┘
```

**禁止的转换**: Draft → Deprecated（草稿必须先激活）

## 实现策略

### 转换矩阵

```typescript
const validTransitions: Record<IRuleStatus, Set<IRuleStatus>> = {
  'Draft': new Set(['Active']),
  'Active': new Set(['Deprecated']),
  'Deprecated': new Set(['Active']),
};
```

### 业务约束注入

```typescript
canTransitionTo(
  from: RuleStatus,
  to: RuleStatus,
  context?: { severity?: RuleSeverity }  // 业务上下文
): Result<true> {
  // 1. 基础转换合法性检查
  const allowedTargets = validTransitions[from];
  if (!allowedTargets?.has(to)) {
    return error('BUSINESS_ERROR', `Cannot transition from ${from} to ${to}`);
  }

  // 2. 业务规则约束
  if (from === 'Active' && to === 'Deprecated') {
    if (context?.severity === RuleSeverity.Mandatory) {
      return error('BUSINESS_ERROR',
        'Cannot deprecate MANDATORY rule. Downgrade to RECOMMENDED first.');
    }
  }

  return ok(true);
}
```

### 聚合根中的使用

```typescript
// Rule.activate()
activate(): Result<void> {
  const transitionResult = RuleStatus.canTransitionTo(
    this._status, RuleStatus.Active, { severity: this._severity }
  );
  if (!transitionResult.ok) return error(...);

  this._status = RuleStatus.Active;
  this._updatedAt = new Date();
  // 发布领域事件...
  return ok(undefined);
}
```

## 设计原则

- **状态逻辑内聚**: 所有转换规则集中在值对象中，不散落在聚合根各方法里
- **业务约束可扩展**: 通过 `context` 参数注入额外的业务条件
- **Result 返回**: 转换失败返回明确的错误信息，而非抛异常
- **不可变**: 状态值本身不可变，每次转换在聚合根中重新赋值

## 检查清单

新建状态机时：

- [ ] 在 `domain-shared/value-objects/` 定义状态值对象
- [ ] 使用 Const Object + Branded Type 模式
- [ ] 定义转换矩阵（`Record<Status, Set<Status>>`）
- [ ] `canTransitionTo()` 方法返回 `Result<true>`
- [ ] 支持通过 `context` 注入业务约束
- [ ] 聚合根中调用 `canTransitionTo()` 后才修改状态
