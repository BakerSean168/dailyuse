---
tags:
  - concepts
  - ddd
  - domain-driven-design
  - patterns
description: 领域驱动设计(DDD)核心模式详解与实践指南
created: 2025-11-23T15:00:00
updated: 2025-11-23T15:00:00
---

# 🏛 DDD 模式指南

领域驱动设计 (Domain-Driven Design) 的核心模式及在 DailyUse 项目中的应用。

## 📚 目录

- [核心概念](#核心概念)
- [战术模式](#战术模式)
- [战略模式](#战略模式)
- [实践指南](#实践指南)

---

## 🎯 核心概念

### 通用语言 (Ubiquitous Language)

团队（开发者、产品经理、领域专家）使用统一的业务术语。

**示例**:
- ✅ 使用 `Goal`（目标）而非 `Item`
- ✅ 使用 `KeyResult`（关键结果）而非 `Metric`
- ✅ 使用 `complete()`（完成）而非 `setStatus(DONE)`

### 领域 (Domain)

业务领域，如"个人效率管理"。

### 子域 (Subdomain)

领域的细分：
- **核心子域** (Core Domain): 目标管理、任务管理
- **支撑子域** (Supporting Subdomain): 提醒、通知
- **通用子域** (Generic Subdomain): 认证、日志

### 边界上下文 (Bounded Context)

明确的业务边界，不同上下文中相同概念可有不同含义。

**示例**:
```
┌──────────────────┐     ┌──────────────────┐
│  Goal Context    │     │  Task Context    │
│  ┌────────────┐  │     │  ┌────────────┐  │
│  │   Goal     │  │     │  │   Task     │  │
│  │  - title   │  │     │  │  - title   │  │
│  │  - deadline│  │     │  │  - dueDate │  │
│  └────────────┘  │     │  └────────────┘  │
└──────────────────┘     └──────────────────┘
```

---

## ⚔️ 战术模式

### 1. Entity (实体)

**定义**: 具有唯一标识的领域对象，通过 ID 而非属性判断相等性。

**特征**:
- 有唯一标识 (UUID)
- 可变 (Mutable)
- 有生命周期

**示例**:

```typescript
// packages/domain-server/src/goal/entities/goal.entity.ts
export class Goal {
  constructor(
    public readonly uuid: string,      // 唯一标识
    public title: string,               // 可变属性
    public deadline: Date,
    public status: GoalStatus,
    private keyResults: KeyResult[] = []
  ) {}

  // 业务行为
  complete(): void {
    if (this.status === GoalStatus.COMPLETED) {
      throw new DomainException('Goal is already completed');
    }
    this.status = GoalStatus.COMPLETED;
    this.completedAt = new Date();
  }

  addKeyResult(keyResult: KeyResult): void {
    if (this.keyResults.length >= 5) {
      throw new DomainException('Maximum 5 key results allowed');
    }
    this.keyResults.push(keyResult);
  }

  // 相等性判断
  equals(other: Goal): boolean {
    return this.uuid === other.uuid;
  }
}
```

**何时使用**:
- ✅ 需要跟踪生命周期（创建、修改、删除）
- ✅ 需要唯一标识
- ✅ 有复杂业务行为

**何时不使用**:
- ❌ 简单的数据容器
- ❌ 无需持久化
- ❌ 无业务行为

---

### 2. Value Object (值对象)

**定义**: 通过属性值描述特征的不可变对象，无唯一标识。

**特征**:
- 无唯一标识
- 不可变 (Immutable)
- 通过值判断相等性

**示例**:

```typescript
// packages/domain-server/src/goal/value-objects/deadline.vo.ts
export class Deadline {
  private readonly _date: Date;

  constructor(date: Date) {
    if (date < new Date()) {
      throw new DomainException('Deadline cannot be in the past');
    }
    this._date = new Date(date); // 防御性复制
  }

  get date(): Date {
    return new Date(this._date); // 返回副本保持不可变
  }

  isOverdue(): boolean {
    return this._date < new Date();
  }

  daysRemaining(): number {
    const now = new Date();
    const diff = this._date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // 相等性判断
  equals(other: Deadline): boolean {
    return this._date.getTime() === other._date.getTime();
  }

  // 不可变：返回新对象
  extend(days: number): Deadline {
    const newDate = new Date(this._date);
    newDate.setDate(newDate.getDate() + days);
    return new Deadline(newDate);
  }
}
```

**其他示例**:

```typescript
// Email 值对象
export class Email {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new DomainException('Invalid email format');
    }
  }

  private isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  equals(other: Email): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  toString(): string {
    return this.value;
  }
}

// Money 值对象
export class Money {
  constructor(
    private readonly amount: number,
    private readonly currency: string
  ) {
    if (amount < 0) {
      throw new DomainException('Amount cannot be negative');
    }
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new DomainException('Cannot add different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && 
           this.currency === other.currency;
  }
}
```

**何时使用**:
- ✅ 描述、量化或度量领域概念
- ✅ 可以作为不可变对象
- ✅ 需要验证规则
- ✅ 可以被多个实体共享

**何时不使用**:
- ❌ 需要唯一标识
- ❌ 需要持久化跟踪
- ❌ 有独立生命周期

---

### 3. Aggregate (聚合)

**定义**: 一组相关对象的集合，对外保持一致性边界。

**特征**:
- 有聚合根 (Aggregate Root)
- 聚合根负责维护一致性
- 外部只能通过聚合根访问

**示例**:

```typescript
// Goal 是聚合根
export class Goal {
  private constructor(
    public readonly uuid: string,
    public title: string,
    public deadline: Deadline,  // 值对象
    private keyResults: KeyResult[],  // 聚合内实体
    private status: GoalStatus
  ) {}

  // 工厂方法
  static create(data: CreateGoalData): Goal {
    // 业务规则验证
    if (!data.title || data.title.length < 3) {
      throw new DomainException('Title must be at least 3 characters');
    }

    return new Goal(
      uuid(),
      data.title,
      new Deadline(data.deadline),
      [],
      GoalStatus.ACTIVE
    );
  }

  // 通过聚合根操作内部实体
  addKeyResult(title: string, weight: number): void {
    // 业务规则：最多 5 个关键结果
    if (this.keyResults.length >= 5) {
      throw new DomainException('Maximum 5 key results');
    }

    // 业务规则：总权重不超过 100
    const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (totalWeight + weight > 100) {
      throw new DomainException('Total weight cannot exceed 100');
    }

    const keyResult = new KeyResult(uuid(), title, weight, 0);
    this.keyResults.push(keyResult);
  }

  updateKeyResultProgress(keyResultUuid: string, progress: number): void {
    const keyResult = this.keyResults.find(kr => kr.uuid === keyResultUuid);
    if (!keyResult) {
      throw new DomainException('KeyResult not found');
    }

    keyResult.updateProgress(progress);

    // 自动完成逻辑
    if (this.calculateProgress() === 100) {
      this.complete();
    }
  }

  private calculateProgress(): number {
    if (this.keyResults.length === 0) return 0;
    
    return this.keyResults.reduce((total, kr) => {
      return total + (kr.progress * kr.weight / 100);
    }, 0);
  }

  // 聚合根控制访问
  getKeyResults(): ReadonlyArray<KeyResult> {
    return Object.freeze([...this.keyResults]);
  }
}

// 聚合内实体（不直接暴露）
class KeyResult {
  constructor(
    public readonly uuid: string,
    public title: string,
    public weight: number,
    public progress: number
  ) {}

  updateProgress(progress: number): void {
    if (progress < 0 || progress > 100) {
      throw new DomainException('Progress must be between 0 and 100');
    }
    this.progress = progress;
  }
}
```

**聚合设计原则**:

1. **小聚合优于大聚合**
   ```typescript
   // ❌ 大聚合 - 不推荐
   class User {
     goals: Goal[];         // 可能有 100+ 个
     tasks: Task[];         // 可能有 1000+ 个
     notifications: Notification[];
   }

   // ✅ 小聚合 - 推荐
   class User {
     uuid: string;
     email: Email;
     profile: UserProfile;
   }
   // Goal、Task 单独管理
   ```

2. **通过 ID 引用其他聚合**
   ```typescript
   class Task {
     goalUuid: string;  // ✅ 引用 Goal 的 ID
     // goal: Goal;     // ❌ 不要直接持有
   }
   ```

3. **一个事务修改一个聚合**
   ```typescript
   // ✅ 正确
   await goalRepository.save(goal);

   // ❌ 错误
   await goalRepository.save(goal);
   await taskRepository.save(task);  // 不同聚合，避免同一事务
   ```

**何时使用**:
- ✅ 需要保证一致性的一组对象
- ✅ 有明确的边界
- ✅ 有复杂的业务规则

---

### 4. Domain Service (领域服务)

**定义**: 跨多个实体或聚合的业务逻辑。

**特征**:
- 无状态
- 操作多个领域对象
- 不属于任何实体

**示例**:

```typescript
// packages/domain-server/src/goal/services/goal-progress-calculator.service.ts
export class GoalProgressCalculatorService {
  // 计算目标加权进度
  calculateWeightedProgress(goal: Goal): number {
    const keyResults = goal.getKeyResults();
    
    if (keyResults.length === 0) {
      return 0;
    }

    const totalWeight = keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    
    if (totalWeight === 0) {
      return 0;
    }

    return keyResults.reduce((progress, kr) => {
      return progress + (kr.progress * kr.weight / totalWeight);
    }, 0);
  }

  // 预测完成时间
  predictCompletionDate(goal: Goal, historicalData: ProgressHistory[]): Date {
    const currentProgress = this.calculateWeightedProgress(goal);
    const averageSpeed = this.calculateAverageSpeed(historicalData);
    
    if (averageSpeed === 0) {
      return goal.deadline.date;
    }

    const remainingProgress = 100 - currentProgress;
    const daysNeeded = remainingProgress / averageSpeed;
    
    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + daysNeeded);
    
    return predictedDate;
  }

  private calculateAverageSpeed(history: ProgressHistory[]): number {
    // 计算平均进度速度
    // ...
  }
}
```

**其他示例**:

```typescript
// 转账领域服务（涉及两个账户）
export class TransferService {
  transfer(from: Account, to: Account, amount: Money): void {
    // 验证业务规则
    if (!from.canWithdraw(amount)) {
      throw new DomainException('Insufficient balance');
    }

    // 操作多个聚合
    from.withdraw(amount);
    to.deposit(amount);
  }
}
```

**何时使用**:
- ✅ 逻辑跨多个实体/聚合
- ✅ 逻辑不自然属于任何实体
- ✅ 需要复杂计算或算法

**何时不使用**:
- ❌ 逻辑属于单个实体 → 放在实体中
- ❌ 纯技术逻辑 → 放在应用层或基础设施层

---

### 5. Repository (仓储)

**定义**: 聚合的持久化抽象，提供类似集合的接口。

**特征**:
- 每个聚合根一个仓储
- 隐藏持久化细节
- 返回领域对象

**示例**:

```typescript
// packages/domain-client/src/goal/repositories/goal.repository.ts
export interface IGoalRepository {
  // 查询
  findById(uuid: string): Promise<Goal | null>;
  findByUserId(userId: string): Promise<Goal[]>;
  findActive(userId: string): Promise<Goal[]>;

  // 持久化
  save(goal: Goal): Promise<void>;
  delete(uuid: string): Promise<void>;

  // 规格模式（可选）
  find(specification: Specification<Goal>): Promise<Goal[]>;
}

// apps/web/src/modules/goal/infrastructure/repositories/goal-api.repository.ts
export class GoalApiRepository implements IGoalRepository {
  constructor(private apiClient: ApiClient) {}

  async findById(uuid: string): Promise<Goal | null> {
    try {
      const response = await this.apiClient.get<GoalDto>(`/goals/${uuid}`);
      return GoalMapper.toDomain(response.data);
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  async save(goal: Goal): Promise<void> {
    const dto = GoalMapper.toDto(goal);
    
    if (goal.isNew) {
      await this.apiClient.post('/goals', dto);
    } else {
      await this.apiClient.put(`/goals/${goal.uuid}`, dto);
    }
  }

  async delete(uuid: string): Promise<void> {
    await this.apiClient.delete(`/goals/${uuid}`);
  }
}
```

**服务端实现**:

```typescript
// apps/api/src/modules/goal/infrastructure/repositories/goal-prisma.repository.ts
export class GoalPrismaRepository implements IGoalRepository {
  constructor(private prisma: PrismaService) {}

  async findById(uuid: string): Promise<Goal | null> {
    const record = await this.prisma.goal.findUnique({
      where: { uuid },
      include: { keyResults: true }
    });

    return record ? GoalMapper.toDomain(record) : null;
  }

  async save(goal: Goal): Promise<void> {
    const data = GoalMapper.toPersistence(goal);

    await this.prisma.goal.upsert({
      where: { uuid: goal.uuid },
      create: data,
      update: data
    });
  }
}
```

**何时使用**:
- ✅ 每个聚合根需要一个仓储
- ✅ 需要持久化领域对象

**反模式**:
- ❌ 为实体创建仓储（只为聚合根）
- ❌ 仓储中包含业务逻辑
- ❌ 返回 DTO 而非领域对象

---

### 6. Domain Event (领域事件)

**定义**: 领域内发生的重要业务事件。

**特征**:
- 不可变
- 过去式命名
- 携带最少必要信息

**示例**:

```typescript
// packages/contracts/src/goal/events.types.ts
export interface GoalCompletedEvent {
  type: 'goal.completed';
  payload: {
    goalUuid: string;
    userId: string;
    completedAt: Date;
    progress: number;
  };
  metadata: {
    correlationId: string;
    timestamp: Date;
  };
}

// 在实体中发布事件
export class Goal {
  private domainEvents: DomainEvent[] = [];

  complete(): void {
    if (this.status === GoalStatus.COMPLETED) {
      throw new DomainException('Goal already completed');
    }

    this.status = GoalStatus.COMPLETED;
    this.completedAt = new Date();

    // 记录领域事件
    this.addDomainEvent({
      type: 'goal.completed',
      payload: {
        goalUuid: this.uuid,
        userId: this.userId,
        completedAt: this.completedAt,
        progress: 100
      }
    });
  }

  getDomainEvents(): readonly DomainEvent[] {
    return Object.freeze([...this.domainEvents]);
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}

// 在应用层发布
export class GoalService {
  async completeGoal(uuid: string): Promise<void> {
    const goal = await this.repository.findById(uuid);
    goal.complete();
    await this.repository.save(goal);

    // 发布领域事件
    for (const event of goal.getDomainEvents()) {
      await this.eventBus.publish(event);
    }
    goal.clearDomainEvents();
  }
}
```

详见 [[event-driven|事件驱动架构]]。

---

## 🗺 战略模式

### Bounded Context (边界上下文)

将大型系统划分为多个边界上下文。

```
DailyUse System
├── Goal Management Context      (核心)
├── Task Management Context      (核心)
├── Schedule Context             (核心)
├── Reminder Context             (支撑)
├── Notification Context         (支撑)
└── Authentication Context       (通用)
```

### Context Map (上下文映射)

描述边界上下文之间的关系。

```
Goal Context ──(published event)──> Notification Context
Task Context ──(published event)──> Reminder Context
Schedule Context ──(shared kernel)─> Task Context
```

---

## 💡 实践指南

### 设计流程

1. **识别领域概念** - 与领域专家沟通
2. **建立通用语言** - 统一术语
3. **划分边界上下文** - 确定模块边界
4. **识别聚合** - 找到一致性边界
5. **设计实体和值对象** - 建模领域对象
6. **定义仓储** - 持久化抽象
7. **识别领域事件** - 重要业务事件

### 常见陷阱

#### 贫血模型 (Anemic Domain Model)

❌ **贫血模型** - 实体只有数据，无行为：
```typescript
class Goal {
  uuid: string;
  title: string;
  status: string;
  // 无业务方法
}

class GoalService {
  completeGoal(goal: Goal) {
    goal.status = 'COMPLETED';  // 业务逻辑在外部
  }
}
```

✅ **富领域模型** - 实体包含业务行为：
```typescript
class Goal {
  uuid: string;
  title: string;
  private status: GoalStatus;

  complete(): void {
    if (this.status === GoalStatus.COMPLETED) {
      throw new Error('Already completed');
    }
    this.status = GoalStatus.COMPLETED;
  }
}
```

#### 过大的聚合

❌ **大聚合**：
```typescript
class User {
  goals: Goal[];       // 100+ 个
  tasks: Task[];       // 1000+ 个
  // 事务边界太大，性能问题
}
```

✅ **小聚合**：
```typescript
class User {
  uuid: string;
  profile: UserProfile;
}
// Goal 和 Task 独立管理
```

---

## 📚 相关文档

- [[002-ddd-pattern|ADR-002: 采用 DDD 架构模式]]
- [[event-driven|事件驱动架构]]
- [[system-overview|系统架构概览]]
- [[coding-standards|代码规范]]

## 📖 延伸阅读

- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/)
- [Implementing DDD (Vaughn Vernon)](https://vaughnvernon.com/)
- [DDD Reference](https://www.domainlanguage.com/ddd/reference/)

---

**提示**: DDD 不是银弹，对简单 CRUD 可能过度设计。在复杂业务领域使用 DDD，简单模块使用传统架构即可。