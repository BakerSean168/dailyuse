# Goal 模块重构分析报告

**分析日期**: 2026年2月4日  
**当前文件**: `packages/domain-server/src/goal/aggregates/goal.ts` (1195 行)

---

## 📋 执行摘要

Goal 聚合根虽然已遵循基本 DDD 原则，但与 Account/Authentication 模块相比，存在 **代码结构优化空间** 和 **一致性问题**。大部分功能已实现，主要改进方向是：

1. **代码组织** - 合并相关方法、减少重复
2. **命名一致性** - 与 Account/Authentication 保持统一
3. **时间类型处理** - 规范 DomainDate 使用
4. **错误处理** - 强化不变量验证
5. **只读字段** - 规范 readonly 字段的处理

---

## ✅ 现状评估

### 已做正确的部分

| 特性 | 状态 | 评价 |
|------|------|------|
| 私有构造函数 | ✅ | 符合 DDD，防止直接 new |
| 工厂方法 | ✅✅ | 有 3 个 (create, fromServerDTO, fromPersistenceDTO) |
| 值对象集成 | ✅✅ | 集成了 KeyResult, GoalReview, GoalReminderConfig 等 |
| Backing Fields | ✅ | 大部分用 _ 前缀，但部分用 readonly 混淆意图 |
| Getters | ✅✅ | 完整的公共属性访问 |
| 业务方法 | ✅✅ | 丰富的业务逻辑 (更新、标签、状态、回顾等) |
| 领域事件 | ✅ | 在关键操作发出事件 |
| 计算属性 | ✅ | priority, priorityLevel, priorityText |
| 不变量检查 | ⚠️ | 基础但不完整 |

---

## 🔴 需要改进的部分

### 1. 只读字段混乱 (HIGH PRIORITY)

**问题**: 使用了 `readonly` 修饰符，打破了统一的 backing field 模式

```typescript
// ❌ 当前
private readonly _startDate: Date | null;      // 为什么是 readonly？
private readonly _completedAt: Date | null;    // readonly 和 private 混淆
private readonly _archivedAt: Date | null;

// ✅ 应该
private _startDate: Date | null;       // 私有就够了
private _completedAt: Date | null;
private _archivedAt: Date | null;
```

**影响**: Account/Authentication 完全没有用 `readonly`，造成不一致

---

### 2. 时间类型处理不规范 (MEDIUM PRIORITY)

**问题**: 时间字段没有统一使用 DomainDate 类型

```typescript
// ❌ 当前混用 Date 和 timestamp
private _startDate: Date | null;
private _targetDate: Date | null;
private _createdAt: Date;            // 应该是 DomainDate
private _updatedAt: Date;            // 应该是 DomainDate

// ✅ 应该（参考 Example.ts）
private _startDate: DomainDate | null;
private _targetDate: DomainDate | null;
private _createdAt: DomainDate;
private _updatedAt: DomainDate;
```

**参考**: Example 模块已经做了正确的实现

---

### 3. 子实体初始化方式不一致 (MEDIUM PRIORITY)

**问题**: 在构造函数初始化子实体为空数组，然后在 fromServerDTO 中再填充

```typescript
// ❌ 当前
private constructor(props: GoalServerDTO) {
  // ...
  this._keyResults = [];          // 为空，稍后填充
  this._goalReviews = [];
  this._weightSnapshots = [];
}

public static fromServerDTO(dto: GoalServerDTO): Goal {
  const goal = new Goal(dto);
  
  // 后填充（不够 DRY）
  if (dto.keyResults && dto.keyResults.length > 0) {
    goal._keyResults = dto.keyResults.map(...);
  }
}

// ✅ 应该像 Account 一样
private constructor(props: GoalServerDTO) {
  super(props.id);
  this._keyResults = (props.keyResults || []).map(kr => 
    KeyResult.fromServerDTO(kr)
  );
}
```

---

### 4. 计算属性与 getter 混淆 (LOW PRIORITY)

**问题**: 动态计算的属性散落在 getter 中，不易发现

```typescript
// 计算属性混在一般属性中
get priority(): number { ... }           // 计算的
get priorityLevel(): 'CRITICAL' | ...{ } // 计算的
get priorityText(): string { ... }       // 计算的
get status(): GoalStatus { ... }         // 简单访问

// 应该分组或特别标记
```

---

### 5. 错误处理不一致 (MEDIUM PRIORITY)

**问题**: 有些地方用 Error，有些用自定义异常

```typescript
// ❌ 混用异常
if (!kr) {
  throw new KeyResultNotFoundInGoalError(krId, this._id);  // 自定义
}
if (extensionDays <= 0) {
  throw new Error('Extension days must be positive');       // 通用
}
if (!params.name || params.name.trim().length === 0) {
  throw new Error('Name is required');                      // 通用
}
```

**建议**: 统一使用有意义的自定义异常类

---

### 6. 方法命名不一致 (LOW PRIORITY)

**问题**: 同义词使用不同的名称

```typescript
// ❌ 重复
get goalReviews(): GoalReview[] { ... }
public getgoalReviews(): GoalReview[] { ... }  // 方法名小写?

public getDaysRemaining(): number | null { ... }
public getRemainingDays(): number | null { ... }  // 两个同义方法

// ✅ 应该统一
get reviews(): readonly GoalReview[] { ... }
public getRemainingDays(): number | null { ... }
```

---

### 7. 类型导入冗长 (LOW PRIORITY)

```typescript
// ❌ 当前
import {
  GoalStatus,
  ReminderTriggerType,
} from '@dailyuse/contracts/goal';
import type {
  SnapshotTrigger,
  GoalReminderConfigDTO,
} from '@dailyuse/contracts/goal';

// ✅ 应该合并
import type {
  GoalStatus,
  ReminderTriggerType,
  SnapshotTrigger,
  GoalReminderConfigDTO,
} from '@dailyuse/contracts/goal';
```

---

### 8. 文档字符串缺失完整性 (LOW PRIORITY)

大部分方法都有 JSDoc，但缺少：
- @throws 说明
- @returns 类型信息（某些）
- 不变量描述

---

## 📊 改进影响分析

| 问题 | 优先级 | 改进工作量 | 影响范围 |
|------|--------|----------|---------|
| 只读字段混乱 | 🔴 HIGH | 中 | Goal 内部 |
| 时间类型规范 | 🟠 MEDIUM | 中 | Goal, 所有使用 Goal 的代码 |
| 子实体初始化 | 🟠 MEDIUM | 小 | Goal 内部 |
| 计算属性组织 | 🟡 LOW | 小 | Goal 内部 |
| 错误处理 | 🟠 MEDIUM | 中 | Goal, 异常处理代码 |
| 方法命名 | 🟡 LOW | 小 | Goal API |
| 类型导入 | 🟡 LOW | 极小 | Goal 导入 |
| 文档完整性 | 🟡 LOW | 小 | Goal 文档 |

---

## 🎯 重构策略

### 阶段 1: 代码结构现代化 (必须做)
1. 移除 `readonly` 修饰符，统一使用私有字段
2. 重组 getter 部分，分离计算属性
3. 统一子实体初始化逻辑

### 阶段 2: 类型与约定一致性 (建议做)
1. 导入 DomainDate 并应用到时间字段
2. 统一异常处理机制
3. 统一方法命名（移除重复方法）

### 阶段 3: 文档增强 (可选)
1. 补充 @throws 标注
2. 增强不变量文档
3. 补充跨界(cross-boundary)说明

---

## 💡 实施建议

### 推荐方案：两步走

**第一步** ✅ (本次)
- 修复 readonly 字段
- 规范子实体初始化
- 合并重复方法
- 基础测试通过

**第二步** 📋 (后续)
- 应用 DomainDate 类型
- 自定义异常类
- 完善文档

---

## 📋 改造检查清单

```typescript
// 改造后的目标代码结构

export class Goal extends AggregateRoot<GoalId> implements GoalServer {
  // ✅ 1. 所有字段私有，统一用下划线，不用 readonly
  private _identityId: IdentityId;
  private _name: string;
  private _startDate: DomainDate | null;
  private _targetDate: DomainDate | null;
  private _completedAt: DomainDate | null;
  private _archivedAt: DomainDate | null;
  private _createdAt: DomainDate;
  private _updatedAt: DomainDate;
  
  // ✅ 2. 子实体在构造时初始化
  private _keyResults: KeyResult[];
  private _goalReviews: GoalReview[];
  private _weightSnapshots: KeyResultWeightSnapshot[];

  // ✅ 3. 私有构造函数
  private constructor(props: GoalServerDTO) { ... }

  // ✅ 4. 公共 Getters（分组）
  // 基本属性
  get identityId(): IdentityId { ... }
  get name(): string { ... }
  
  // 关系
  get keyResults(): readonly KeyResult[] { ... }
  get reviews(): readonly GoalReview[] { ... }
  
  // 计算属性（特别标记）
  get priority(): number { ... }
  get priorityLevel(): ... { ... }
  get remainingDays(): number | null { ... }

  // ✅ 5. 工厂方法（统一命名）
  public static create(params: ...): Goal { ... }
  public static reconstruct(dto: GoalServerDTO): Goal { ... }

  // ✅ 6. 业务方法（强制不变量）
  public updateBasicInfo(...): void { ... }
  public addKeyResult(...): KeyResult { ... }

  // ✅ 7. 统一异常处理
  private validateInvariants(): void {
    if (!this._identityId) throw new InvalidGoalStateError(...);
    if (this._keyResults.length > 0 && !this.isValidCombination()) {
      throw new GoalInvariantViolationError(...);
    }
  }
}
```

---

## 📌 下一步

**需要我做**:
1. ✅ 创建改造方案 (已完成)
2. 🔄 开始实施改造 (等待确认)
3. 📝 运行测试验证 (实施后)

**你需要确认**:
- [ ] 是否同意上述改进方向？
- [ ] 是否优先处理 HIGH/MEDIUM 优先级问题？
- [ ] 是否需要保持向后兼容性？(API 层面)
- [ ] 是否现在开始实施？
