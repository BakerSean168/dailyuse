---
tags: [standard, domain/client]
---

# Domain Client 开发规范：聚合根与实体

**版本**: 1.0
**适用范围**: `libs/domain-client`
**读者**: 开发人员, AI 助手

## 1. 核心设计理念

在 Client 端（前端/桌面端），领域模型（Domain Model）的职责与 Server 端截然不同。

* **Server 端**: 侧重于**数据一致性**、**业务规则校验**、**持久化**和**事件分发**。
* **Client 端**: 侧重于**数据展示（View Model）**、**UI 状态辅助**、**交互逻辑**以及**数据消费**。

**原则**: Client 端的聚合根是 "Anemic Domain Model" (贫血模型) 与 "Rich View Model" (富视图模型) 的结合体。它**不包含**复杂的业务规则校验和持久化逻辑。

---

## 2. 依赖规则

Client 端领域对象应当遵守以下依赖限制：

* ✅ **允许依赖**:
* `@dailyuse/utils` (基础工具类，如 `AggregateRoot` 基类)
* `@dailyuse/contracts` (DTO 定义, API 接口)
* `@dailyuse/domain-shared` (值对象, 枚举, 通用纯函数)


* ❌ **禁止依赖**:
* `@dailyuse/domain-server` (绝对禁止，避免引入 Node.js 依赖)
* 数据库相关库 (Prisma, TypeORM 等)
* UI 框架组件 (React, Vue 组件) —— 领域对象应保持框架无关。



---

## 3. 代码结构规范

### 3.1 类定义与继承

* 所有聚合根必须继承自 `AggregateRoot<TId>`。
* 所有实体必须继承自 `Entity<TId>`。
* 必须实现对应的 `Contract` 中定义的 Client 接口（如果有）。

```typescript
import { AggregateRoot } from '@dailyuse/utils';
import { IdentityId } from '@dailyuse/domain-shared/account';
import type { AccountClientDTO } from '@dailyuse/contracts/account';

export class Account extends AggregateRoot<IdentityId> {
  // ...
}

```

### 3.2 属性 (Properties)

* **可见性**: 内部状态使用 `private`，通过 `public` 的 getter 暴露。
* **类型**: 优先使用 **值对象 (Value Objects)** (来自 `domain-shared`)，而不是原始类型。这保证了展示格式化逻辑的复用。
* **只读性**: ID 和创建时间等元数据应为 `readonly`。

### 3.3 构造函数 (Constructor)

* **可见性**: `private`。禁止外部直接 `new`。
* **参数**: 必须只接收 **API DTO (`ClientDTO`)**。Client 端的数据源头永远是 API，而不是零散的参数。

### 3.4 工厂方法 (Factory Methods)

* **必须包含**: `fromClientDTO(dto: ClientDTO): ClassName`。
* **禁止包含**: `create(...)` (用于生成新数据的工厂)。客户端的新建操作是 RPC 调用，不是本地对象创建。

### 3.5 方法 (Methods)职责

#### ✅ 允许的方法类型：

1. **Getters**: 直接暴露内部状态。
2. **Computed Properties (计算属性)**:
* 用于 UI 展示的衍生数据。
* *示例*: `get displayName()`, `get isVip()`, `get progressPercentage()`


3. **UI Helpers**:
* *示例*: `canEdit()`, `hasPermission(p)`


4. **Immutability Helpers (可选)**:
* 如果配合 React 使用，提供 `cloneWith(...)` 方法以支持不可变更新。


5. **Serialization**:
* `toClientDTO()`: 必须实现，用于序列化后传递给 UI 组件或打印日志。



#### ❌ 禁止的方法类型：

1. **Business Validation**: 复杂的业务规则校验（应在 Server 端）。
2. **Persistence**: `save()`, `update()`, `delete()` (应在 Service/Store 层调用 API)。
3. **Domain Events**: `addDomainEvent()` (Client 端通常只处理 UI 事件，不生产领域事件)。

---

## 4. 代码模板 (AI 参照标准)

请 AI 在生成代码时严格参照以下模板：

```typescript
import { AggregateRoot } from '@dailyuse/utils';
// 1. 引入 Contract 定义的 DTO
import type { UserClientDTO } from '@dailyuse/contracts/user';
// 2. 引入 Shared 中的值对象
import { UserId, Email, UserStatus } from '@dailyuse/domain-shared/user';

export class User extends AggregateRoot<UserId> {
  // ================= 状态定义 =================
  private _email: Email;
  private _status: UserStatus;
  private _nickname: string | null;
  private _avatarUrl: string | null;

  public readonly createdAt: Date;

  // ================= 构造函数 =================
  private constructor(dto: UserClientDTO) {
    super(UserId.of(dto.id));
    
    // 还原值对象
    this._email = Email.fromDTO(dto.email);
    this._status = UserStatus.of(dto.status);
    this._nickname = dto.nickname ?? null;
    this._avatarUrl = dto.avatarUrl ?? null;
    
    this.createdAt = new Date(dto.createdAt);
  }

  // ================= 工厂方法 =================
  public static fromClientDTO(dto: UserClientDTO): User {
    return new User(dto);
  }

  public static createDefault(id: string, emailStr: string): User {
    return new User({
      id,
      email: Email.create(emailStr).toDTO(),
      status: UserStatus.PENDING,
      nickname: null,
      avatarUrl: null,
      createdAt: Date.now(),
    });
  }

  // ================= Getters (基础数据) =================
  get email(): Email { return this._email; }
  get status(): UserStatus { return this._status; }
  get nickname(): string | null { return this._nickname; }
  get avatarUrl(): string | null { return this._avatarUrl; }

  // ================= Computed Properties (UI 逻辑核心) =================
  
  /**
   * UI 展示名称逻辑：有昵称显示昵称，没有显示脱敏邮箱
   */
  get displayName(): string {
    return this._nickname || this._email.getMasked();
  }

  /**
   * UI 头像逻辑：有头像显示头像，没有显示默认图
   */
  get displayAvatar(): string {
    return this._avatarUrl || '/assets/default-avatar.png';
  }

  get isActive(): boolean {
    return this._status === UserStatus.ACTIVE;
  }

  // ================= 序列化 =================
  public toClientDTO(): UserClientDTO {
    return {
      id: this.id.toString(),
      email: this._email.toDTO(),
      status: this._status,
      nickname: this._nickname,
      avatarUrl: this._avatarUrl,
      createdAt: this.createdAt.getTime(),
    };
  }
}

```

---

## 5. 常见误区检查清单 (Checklist)

在提交代码或生成代码前，请检查：

* [ ] **是否引用了 Server 代码？** (检查 import 路径是否包含 `domain-server`)
* [ ] **是否包含了 `create` 方法？** (Client 端不应该负责生成 ID 和初始状态)
* [ ] **是否包含了 `update` / `save` 方法？** (Client 模型应该是纯内存对象，不负责 I/O)
* [ ] **是否使用了 `addDomainEvent`？** (Client 模型不产生领域事件)
* [ ] **构造函数是否为 private？** (强制使用 `fromClientDTO`)
* [ ] **是否复用了 `domain-shared` 里的值对象？** (不要在 Client 端重写一遍 Email 校验逻辑)