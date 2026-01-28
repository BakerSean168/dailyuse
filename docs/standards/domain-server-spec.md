# Domain Server 开发规范：聚合根与实体

**版本**: 1.0
**适用范围**: `libs/domain-server`
**读者**: 开发人员, AI 助手

## 1. 核心设计理念

Server 端的领域模型是业务逻辑的核心心脏。它是 **"Rich Domain Model" (充血模型)**。
它不仅仅是数据的容器，更是**业务规则的守护者**。

**核心职责**:

1. **Enforce Invariants (强制不变量)**: 确保对象随时处于合法状态（例如：余额不能小于0，已冻结账户不能交易）。
2. **State Mutation (状态变更)**: 所有的状态修改必须通过类的方法（Methods）进行，禁止外部直接修改属性。
3. **Domain Events (领域事件)**: 当重要状态变更发生时，必须发出事件通知其他聚合根或模块。
4. **No Infrastructure (无基础设施)**: 领域模型不应包含 SQL、HTTP 请求或任何框架特定的代码。

---

## 2. 依赖规则

Domain Server 处于架构的核心层，依赖必须极其严格：

* ✅ **允许依赖**:
* `@dailyuse/utils` (AggregateRoot 基类, Entity 基类)
* `@dailyuse/contracts` (DTO 定义, 事件 Map)
* `@dailyuse/domain-shared` (值对象, 枚举, 纯业务逻辑)


* ❌ **禁止依赖**:
* `@dailyuse/domain-client` (禁止！防止循环依赖和逻辑泄漏)
* `@dailyuse/infrastructure` (禁止！Repository 的实现不应出现在这里)
* API 层代码 (Controller, Resolver)
* 外部 I/O 库 (fs, axios, prisma, typeorm)



---

## 3. 代码结构规范

### 3.1 类定义

* 必须继承自 `AggregateRoot<TId>` 或 `Entity<TId>`。
* 必须实现 `contracts` 中定义的 Server 接口（如 `AccountServer`）。

### 3.2 状态管理 (State)

* **Private Fields**: 所有状态必须是 `private` 的。
* **Value Objects**: 极度推荐使用 `domain-shared` 中的值对象来封装状态（如 `Email`, `PhoneNumber`），而不是 `string`。
* **Readonly Getters**: 通过 `public get` 暴露状态，确保外部只读。

### 3.3 构造与工厂 (Construction)

* **Constructor**: 必须为 `private`。禁止外部 `new Account(...)`。
* **Static create(...)**: 业务工厂。用于创建**新**实体。负责生成 ID、默认值、初始校验。
* **Static fromPersistenceDTO(...)**: 重建工厂。用于从数据库**恢复**实体。不应包含业务校验。

### 3.4 业务方法 (Business Methods)

* **命名**: 使用**业务动词** (e.g., `close()`, `changePassword()`, `verifyEmail()`)，而不是 `setStatus()`, `setReason()`。
* **流程**:
1. **Check**: 检查业务规则（如果不满足，抛出 Error）。
2. **Act**: 修改内部私有状态。
3. **Event**: 调用 `this.addDomainEvent(...)`。



### 3.5 序列化 (Serialization)

* **必须包含**: `toPersistenceDTO()`，用于 Repository 持久化。
* **禁止包含**: `toClientDTO()`。Server 模型不应关心前端如何展示数据。

---

## 4. 代码模板 (AI 参照标准)

请 AI 在生成代码时严格参照以下模板：

```typescript
import { AggregateRoot } from '@dailyuse/utils';
// 1. 引入 Contract 定义 (DTO 和 Events)
import type { UserPersistenceDTO, UserServerDTO } from '@dailyuse/contracts/user';
import type { UserEventMap } from '@dailyuse/contracts/user';
// 2. 引入 Shared 值对象
import { UserId, Email, UserStatus } from '@dailyuse/domain-shared/user';

export class User extends AggregateRoot<UserId> {
  // ================= 内部状态 =================
  private _email: Email;
  private _status: UserStatus;
  private _updatedAt: Date;

  // ================= 构造函数 =================
  private constructor(props: UserServerDTO) {
    super(UserId.of(props.id));
    this._email = Email.create(props.email); // 使用值对象工厂
    this._status = UserStatus.of(props.status);
    this._updatedAt = new Date(props.updatedAt);
  }

  // ================= Getters =================
  get email(): Email { return this._email; }
  get status(): UserStatus { return this._status; }
  get updatedAt(): Date { return this._updatedAt; }

  // ================= 工厂方法 =================
  
  // 1. 创建新用户 (业务入口)
  public static create(emailStr: string): User {
    // 业务规则：初始创建逻辑
    const user = new User({
      id: UserId.generate().toString(),
      email: { address: emailStr, isVerified: false }, // 构造 DTO
      status: UserStatus.PENDING,
      updatedAt: Date.now()
    });
    
    // 发出创建事件
    user.addDomainEvent<UserEventMap['user:registered']>('user:registered', {
      email: emailStr
    });
    
    return user;
  }

  // 2. 从数据库恢复 (持久化入口)
  public static fromPersistenceDTO(dto: UserPersistenceDTO): User {
    return new User({
      id: dto.id,
      email: dto.email, // 假设结构匹配
      status: dto.status,
      updatedAt: dto.updatedAt.getTime()
    });
  }

  // ================= 业务行为 =================

  /**
   * 激活用户
   */
  public activate(): void {
    // 1. 规则校验
    if (this._status === UserStatus.ACTIVE) {
      return; // 幂等处理
    }
    if (this._status === UserStatus.BANNED) {
      throw new Error('Cannot activate banned user');
    }

    // 2. 状态变更
    this._status = UserStatus.ACTIVE;
    this._updatedAt = new Date();

    // 3. 发出事件
    this.addDomainEvent<UserEventMap['user:activated']>('user:activated', {
      userId: this.id.toString(),
      timestamp: Date.now()
    });
  }

  // ================= 序列化 =================
  public toPersistenceDTO(): UserPersistenceDTO {
    return {
      id: this.id,
      email: this._email.toPersistenceDTO(),
      status: this._status,
      updatedAt: this._updatedAt
    };
  }
}

```

---

## 5. 常见误区检查清单 (Checklist)

在提交代码或生成代码前，请检查：

* [ ] **是否实现了 `toClientDTO`？** (如果有，请删除。Server 模型不负责 API 格式化)
* [ ] **是否使用了 `public` 属性？** (除了 `readonly` 的 getter，属性必须为 private)
* [ ] **是否在 `fromPersistenceDTO` 里做了业务校验？** (恢复工厂不应抛出业务错误，相信数据库的数据是合法的)
* [ ] **事件 Key 是否匹配 Contracts？** (确保 `addDomainEvent` 使用了 `Contracts` 中的类型，而不是硬编码字符串)
* [ ] **是否引用了具体的 Repository 实现？** (Entity/Aggregate 不应该知道 Repository 的存在)
* [ ] **时间更新是否自动化？** (修改状态的方法里，记得更新 `updatedAt`)