# 仓储与领域事件模式（Repository & Domain Events）

> **模式笔记** — 基于 `packages/governance` 活文档

## 仓储模式（Repository Pattern）

### 定义

仓储是领域层定义的持久化抽象接口。
具体实现在基础设施层，通过依赖倒置保证领域层的纯粹性。

### 参考文件

- **接口定义**: `packages/governance/src/domain-server/repositories/i-rule-repository.ts`
- **Prisma 实现**: `packages/governance/src/infrastructure-server/adapters/prisma/rule-prisma.repository.ts`

### 关键设计

```typescript
// 领域层：定义接口
export interface IRuleRepository {
  save(rule: Rule): Promise<Result<void>>;
  findById(id: RuleId): Promise<Result<Rule | null>>;
  findByCode(code: string): Promise<Result<Rule | null>>;
  findAll(filter?: RuleFilter): Promise<Result<Rule[]>>;
  search(query: string, filter?: RuleFilter): Promise<Result<Rule[]>>;
  delete(id: RuleId): Promise<Result<void>>;
  exists(code: string): Promise<boolean>;
}

// DI 绑定 Token
export const RULE_REPOSITORY_TOKEN = Symbol('IRuleRepository');
```

### 设计原则

- **依赖倒置**: 领域层定义接口，基础设施层实现
- **聚合整体存取**: `save()` 保存整个聚合根，不暴露部分更新
- **Result 返回**: 持久化操作也返回 `Result<T>`，不抛异常
- **Filter 对象**: 使用独立的 `RuleFilter` 接口封装查询条件

---

## 领域事件模式（Domain Events）

### 定义

领域事件是聚合根状态变更的通知。
其他模块可以订阅这些事件来响应变化，实现模块间松耦合。

### 参考文件

- **事件类型定义**: `packages/governance/src/contracts/domain/events/`
- **事件发布**: `packages/governance/src/domain-server/aggregates/rule.ts`
- **事件映射**: `packages/governance/src/contracts/protocol/governance-event-map.ts`

### 事件命名规范

```
格式: module:entity-action
示例:
- governance:rule-created
- governance:rule-updated
- governance:rule-deprecated
- governance:rule-reactivated
- governance:rule-status-changed
```

### 事件发布时机

在聚合根的业务方法中，**状态变更完成后**发布事件：

```typescript
// Rule.create() 中
rule.addDomainEvent<GovernanceEventMap['governance:rule-created']>(
  'governance:rule-created',
  {
    code: rule._code,
    title: rule._title,
    severity: rule._severity,
    tags: rule._tags.map(tag => tag.value),
    authorId: rule._authorId,
  }
);
```

### 设计原则

- **事件载荷最小化**: 只包含必要数据，不携带完整实体
- **类型安全**: 通过 EventMap 泛型约束事件载荷类型
- **聚合根内发布**: 事件在聚合根内部产生，保证一致性

---

## 组合根与 DI 容器

### 参考文件

- **组合根**: `packages/governance/src/infrastructure-server/governance.module.ts`
- **DI 容器**: `packages/governance/src/infrastructure-server/di/governance-container.ts`

### 组装流程

```
外部传入 Repository 实现
    ↓
GovernanceModule 构造函数
    ↓
注册到 GovernanceContainer（Singleton）
    ↓
实例化 6 个 Use Case（注入 Repository 接口）
    ↓
暴露 Use Case 供控制器/API 使用
```

## 检查清单

新建仓储时：
- [ ] 在 `domain-server/repositories/` 定义接口
- [ ] 在 `infrastructure-server/adapters/` 实现
- [ ] 定义 DI Token（`Symbol`）
- [ ] 所有方法返回 `Promise<Result<T>>`

新建领域事件时：
- [ ] 在 `contracts/domain/events/` 定义事件类型
- [ ] 在 `contracts/protocol/` 的 EventMap 中注册
- [ ] 在聚合根业务方法中通过 `addDomainEvent()` 发布
- [ ] 事件载荷只包含必要字段
