---
created: 2026-01-30T19:34:55
updated: 2026-01-30T19:36:30
tags: [ddd, event, standard]
---

# 领域事件开发规范 (Domain Event Standards)

**版本**: 1.0

**核心原则**: 聚合根是事件的工厂，仓储层是事件的邮递员。

## 1. 基础接口定义 (Shared Kernel)

所有领域事件必须遵循统一的接口结构。

**文件**: `packages/contracts/src/shared/domain-event.interface.ts`

```TypeScript
/**
 * 📨 领域事件基础接口
 * 代表过去发生的一个业务事实
 */
export interface IDomainEvent<P = unknown> {
  /**
   * 事件唯一标识 (UUID) - 用于去重和追踪
   */
  eventId: string;

  /**
   * 聚合根 ID - 发生在哪一个实体上
   */
  aggregateId: string;

  /**
   * 事件类型 - 命名规范: [Context]:[Noun]-[VerbPastTense]
   * 例: "auth:identity-created", "order:payment-received"
   */
  eventType: string;

  /**
   * 事件发生时间
   */
  occurredAt: Date;

  /**
   * 事件载荷 - 包含下游所需的最小数据集合
   */
  payload: P;
}
```

---

## 2. 聚合根基类 (Abstract Base Class)

聚合根基类负责管理事件的生命周期（收集、清理）。

**文件**: `libs/utils/src/ddd/aggregate-root.ts`

```TypeScript
import { Entity } from './entity';
import type { IDomainEvent } from '@dailyuse/contracts/shared';
import { v4 as uuidv4 } from 'uuid'; // 假设你使用 uuid 库

export abstract class AggregateRoot<TId> extends Entity<TId> {
  // 1. 内部暂存数组 (不暴露给外部修改)
  private _domainEvents: IDomainEvent[] = [];

  // 2. 只读访问器
  get domainEvents(): ReadonlyArray<IDomainEvent> {
    return [...this._domainEvents];
  }

  /**
   * ✅ 核心方法: 添加领域事件
   * Protected: 只能由聚合根内部的业务逻辑调用
   */
  protected addDomainEvent<P>(eventType: string, payload: P): void {
    const event: IDomainEvent<P> = {
      eventId: uuidv4(),
      aggregateId: String(this.id), // 确保 ID 转为字符串
      eventType,
      payload,
      occurredAt: new Date(),
    };
    
    this._domainEvents.push(event);
    // console.log(`[DomainEvent] Recorded: ${eventType}`);
  }

  /**
   * 🧹 清空事件 (发送后调用)
   */
  public clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
```

---

## 3. 聚合根实现 (Domain Layer)

在业务动作完成时，记录事件。

**规范**:

1. 事件名必须是**过去式** (Created, Changed, Deleted)。
2. 不要在构造函数之外的地方随便 `new` 事件，使用 `addDomainEvent`。

**文件**: `libs/domain-server/src/modules/auth/aggregates/auth-identity.ts`

TypeScript

```
export class AuthIdentity extends AggregateRoot<IdentityId> {
  // ...

  public static createWithEmail(params: {
    email: string;
    hashedPassword: HashedPassword;
  }): AuthIdentity {
    const id = IdentityId.generate();
    
    // 1. 执行核心业务逻辑 (组装实体)
    const identity = new AuthIdentity({ 
      id, 
      // ... 
    });

    // 2. ✅ 记录事件 (隐式暂存)
    // 注意：这里没有调用 EventBus，只是记录！
    identity.addDomainEvent('auth:identity-created', {
      identityId: id.toString(),
      email: params.email,
      registerMethod: 'EMAIL',
      occurredAt: new Date()
    });

    return identity;
  }

  public changePassword(newHash: HashedPassword): void {
    // 1. 改变状态
    this.credentials[0].hashedPassword = newHash;
    
    // 2. ✅ 记录事件
    this.addDomainEvent('auth:password-changed', {
      identityId: this.id.toString(),
      changedAt: new Date()
    });
  }
}
```

---

## 4. 仓储层实现 (Infrastructure Layer) - **核心魔法**

这是“隐式发送”发生的地方。仓储层的 `save` 方法充当了拦截器。

**文件**: `libs/infrastructure/src/persistence/repositories/prisma-auth-identity.repo.ts`

TypeScript

```
import { IEventBus } from '@dailyuse/utils'; // 你的事件总线接口

export class PrismaAuthIdentityRepository implements AuthIdentityRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventBus: IEventBus, // 注入事件总线
  ) {}

  /**
   * ✅ 隐式发送的核心实现
   */
  async save(aggregate: AuthIdentity): Promise<void> {
    
    // 1. 提取事件 (此时还没发)
    const events = aggregate.domainEvents;

    // 2. 开启数据库事务 (保证数据一致性)
    await this.prisma.$transaction(async (tx) => {
      
      // A. 持久化聚合根数据 (Persistence Logic)
      const persistenceDTO = aggregate.toPersistenceDTO();
      await tx.identity.upsert({
        where: { id: persistenceDTO.id },
        create: persistenceDTO,
        update: persistenceDTO,
      });

      // B. 分发事件
      // 策略 1: 直接发送 (简单，适合不需要强一致性的场景)
      // 策略 2: Outbox Pattern (推荐生产环境，将事件写入 event_outbox 表)
      
      // 这里演示策略 1 (直接发送):
      for (const event of events) {
        // 注意：如果是直接发送，建议用 publish (Fire-and-forget) 
        // 或者在这里只是把事件推到一个内存队列，事务提交后再真正发出去
        await this.eventBus.publish(event.eventType, event.payload);
      }
    });

    // 3. ✅ 保存成功后，清理聚合根内的事件
    // 防止同一个实例被二次 save 时重复发送
    aggregate.clearDomainEvents();
  }
}
```

---

## 5. 领域服务 (Domain Service) - **零污染**

现在你的领域服务变得非常干净，完全不需要处理 EventBus。

**文件**: `libs/domain-server/.../registration.service.ts`

TypeScript

```
export class RegistrationService {
  constructor(private repo: AuthIdentityRepository) {}

  async register(req: RegisterReq) {
    // 1. 业务检查
    // ...

    // 2. 创建聚合 (内部产生了事件)
    const identity = AuthIdentity.createWithEmail(...);

    // 3. 保存
    // Repo 会自动发现内部的事件，并在保存数据时发出去
    await this.repo.save(identity); 
    
    // 🎉 完事！没有任何显式的 eventBus 代码
  }
}
```

---

## 总结：为什么这样做？

|**之前的做法 (显式发送)**|**现在的规范 (隐式发送)**|
|---|---|
|**容易遗忘**: 必须记得写 `eventBus.publish`|**自动化**: 只要调了 `save`，事件就会发|
|**逻辑泄露**: Service 层需要知道有哪些事件|**高内聚**: 事件是聚合根内部的事|
|**事务风险**: 可能数据回滚了但消息发出去了|**一致性**: 可以绑定在数据库事务中|
|**代码冗余**: 到处都是 `publish` 代码|**DRY**: 发送逻辑只写在 Repository 一处|