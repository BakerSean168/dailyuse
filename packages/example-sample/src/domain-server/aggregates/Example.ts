/**
 * Example 聚合根 - Server 端实现
 * 
 * 【规范说明：Server 端聚合根 - 参考 domain-server-spec.md】
 * 
 * Server 端的领域模型是业务逻辑的核心心脏。它是 "Rich Domain Model"（充血模型）。
 * 
 * 核心职责：
 * 1. Enforce Invariants（强制不变量）：确保对象随时处于合法状态
 * 2. State Mutation（状态变更）：所有状态修改必须通过类方法进行
 * 3. Domain Events（领域事件）：重要状态变更时发出事件
 * 4. No Infrastructure（无基础设施）：不应包含 SQL、HTTP 请求等
 * 
 * 【依赖规则】
 * ✅ 允许依赖：
 * - @dailyuse/utils (AggregateRoot 基类)
 * - @dailyuse/contracts (DTO 定义, 事件 Map)
 * - @dailyuse/domain-shared (值对象, 枚举)
 * 
 * ❌ 禁止依赖：
 * - @dailyuse/domain-client
 * - @dailyuse/infrastructure
 * - 外部 I/O 库 (fs, axios, prisma)
 */

import { AggregateRoot } from '@dailyuse/utils';
// 1. 引入 Contract 定义 (DTO 和 Events)
import type { 
  ExampleServer as IExampleServer,
  ExampleServerDTO,
  ExamplePersistenceDTO,
  ExampleEventMap,
} from '@dailyuse/contracts/example';
import type { IdentityId } from '@dailyuse/contracts/primitives';
// 2. 引入时间类型（防腐层 ACL）
import type {
  DomainDate,
  TransferDate,
  PersistenceDate,
} from '@dailyuse/contracts/primitives';
// 3. 引入 Shared 值对象
import { 
  ExampleId, 
  ExampleStatus, 
  ExampleProperty, 
} from '@dailyuse/domain-shared/example';

export class Example extends AggregateRoot<ExampleId> implements IExampleServer {
  // ================= 1. 内部状态（Private Backing Fields）=================
  /**
   * 【规范说明：时间字段类型】
   * 
   * Server 端聚合/实体内部存储使用 DomainDate（Date 类型）
   * 便于在业务逻辑中进行日期计算、比较
   */
  // 命名习惯：加下划线 _ 表示私有 backing field
  private _identityId: IdentityId;
  private _name: string;
  private _description: string | null;
  private _status: ExampleStatus;
  private _priority: number;
  private _isPublic: boolean;
  private _viewCount: number;
  private _likeCount: number;
  private _createdAt: DomainDate;   // ✅ 使用 DomainDate
  private _updatedAt: DomainDate;   // ✅ 使用 DomainDate
  private _deletedAt: DomainDate | null;  // ✅ 使用 DomainDate

  // ================= 2. 构造函数（必须 Private）=================
  /**
   * 【规范说明】
   * 构造函数必须为 private，禁止外部 new Example(...)
   * 只能通过工厂方法创建实例
   */
  private constructor(props: ExampleServerDTO) {
    super(ExampleId.of(props.id)); // 使用值对象还原 ID

    this._identityId = props.identityId as IdentityId;
    this._name = props.name;
    this._description = props.description;
    this._status = ExampleStatus.of(props.status);
    this._priority = props.priority;
    this._isPublic = props.isPublic;
    this._viewCount = props.viewCount;
    this._likeCount = props.likeCount;
    this._createdAt = new Date(props.createdAt);
    this._updatedAt = new Date(props.updatedAt);
    this._deletedAt = props.deletedAt ? new Date(props.deletedAt) : null;

  }

  // ================= 3. 公共属性（Readonly Getters）=================
  /**
   * 【规范说明】
   * - 通过 public get 暴露状态
   * - 确保外部只读
   * - 极度推荐使用值对象而不是原始类型
   * - 时间字段返回 DomainDate（Date）
   */
  get identityId(): IdentityId { return this._identityId; }
  get name(): string { return this._name; }
  get description(): string | null { return this._description; }
  get status(): ExampleStatus { return this._status; }
  get priority(): number { return this._priority; }
  get isPublic(): boolean { return this._isPublic; }
  get viewCount(): number { return this._viewCount; }
  get likeCount(): number { return this._likeCount; }
  get createdAt(): DomainDate { return this._createdAt; }  // ✅ 返回 DomainDate
  get updatedAt(): DomainDate { return this._updatedAt; }  // ✅ 返回 DomainDate
  get deletedAt(): DomainDate | null { return this._deletedAt; }  // ✅ 返回 DomainDate

  // ================= 4. 工厂方法（Factories）=================

  /**
   * 🏭 业务工厂：创建一个全新的 Example
   * 
   * 【规范说明】
   * - 用于创建**新**实体
   * - 负责生成 ID、默认值、初始校验
   * - 必须发出 Created 事件
   * 
   * @example
   * ```typescript
   * const example = Example.create({
   *   identityId: userId,
   *   name: 'My Example',
   *   description: 'Description',
   * });
   * ```
   */
  public static create(params: {
    identityId: IdentityId;
    name: string;
    description?: string | null;
    priority?: number;
    isPublic?: boolean;
  }): Example {
    // 1. 校验
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('Example name cannot be empty');
    }
    if (params.name.length > 256) {
      throw new Error('Example name too long (max 256 characters)');
    }

    // 2. 生成初始状态
    // now: TransferDate (number) 用于 ServerDTO
    const now: TransferDate = Date.now();
    const dto: ExampleServerDTO = {
      id: ExampleId.generate(),
      identityId: params.identityId,
      name: params.name.trim(),
      description: params.description ?? null,
      status: ExampleStatus.Draft, // 新创建默认为草稿
      priority: params.priority ?? 5,
      isPublic: params.isPublic ?? false,
      viewCount: 0,
      likeCount: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    // 3. 创建实例
    const example = new Example(dto);

    // 4. 发出领域事件
    example.addDomainEvent<ExampleEventMap['example:created']>('example:created', {
      id: dto.id,
      name: dto.name,
      createdAt: now,
    });

    return example;
  }

  /**
   * 🏭 重建工厂：从数据库恢复实体
   * 
   * 【规范说明】
   * - 用于从数据库恢复实体
   * - 不应包含业务校验（数据已经在数据库中）
   * - 不发出事件
   * 
   * 【时间类型转换：PersistenceDate → TransferDate】
   * PersistenceDTO 中的时间是 PersistenceDate（Date）
   * ServerDTO 中的时间是 TransferDate（number）
   */
  public static fromPersistenceDTO(dto: ExamplePersistenceDTO): Example {
    const serverDTO: ExampleServerDTO = {
      id: dto.id,
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      isPublic: dto.isPublic,
      viewCount: dto.viewCount,
      likeCount: dto.likeCount,
      // ✅ PersistenceDate(Date) → TransferDate(number)
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
      deletedAt: dto.deletedAt?.getTime() ?? null,
    };
    return new Example(serverDTO);
  }

  // ================= 5. 业务行为（Business Methods）=================
  /**
   * 【规范说明：业务方法命名】
   * - 使用业务动词：activate(), archive(), updateName()
   * - 不用 setter：setStatus(), setName()
   * 
   * 【规范说明：业务方法流程】
   * 1. Check：检查业务规则（不满足则抛出 Error）
   * 2. Act：修改内部私有状态
   * 3. Event：调用 this.addDomainEvent(...)
   */

  // 辅助方法：刷新更新时间
  private refreshUpdatedAt(): void {
    this._updatedAt = new Date();
  }

  /**
   * ✅ 更新名称
   */
  public updateName(name: string): void {
    // 1. Check
    if (!name || name.trim().length === 0) {
      throw new Error('Example name cannot be empty');
    }
    if (name.length > 256) {
      throw new Error('Example name too long (max 256 characters)');
    }
    if (this._status === ExampleStatus.Archived) {
      throw new Error('Cannot update archived example');
    }

    const oldName = this._name;

    // 2. Act
    this._name = name.trim();
    this.refreshUpdatedAt();

    // 3. Event
    this.addDomainEvent<ExampleEventMap['example:updated']>('example:updated', {
      id: this.id,
      updatedFields: { name: { oldValue: oldName, newValue: this._name } },
      updatedAt: this._updatedAt.getTime(),
    });
  }

  /**
   * ✅ 更新描述
   */
  public updateDescription(description: string | null): void {
    if (this._status === ExampleStatus.Archived) {
      throw new Error('Cannot update archived example');
    }

    this._description = description;
    this.refreshUpdatedAt();
  }

  /**
   * ✅ 激活（发布）
   * 
   * 业务规则：只有 Draft 状态可以激活
   */
  public activate(): void {
    // 1. Check - 状态转换校验
    if (!ExampleStatus.canTransitionTo(this._status, ExampleStatus.Active)) {
      throw new Error(`Cannot activate example from status: ${this._status}`);
    }

    // 2. Act
    this._status = ExampleStatus.Active;
    this.refreshUpdatedAt();

    // 3. Event
    this.addDomainEvent<ExampleEventMap['example:status-changed']>('example:status-changed', {
      id: this.id,
      oldStatus: ExampleStatus.Draft,
      newStatus: ExampleStatus.Active,
      changedAt: this._updatedAt.getTime(),
    });
  }

  /**
   * ✅ 归档
   * 
   * 业务规则：只有 Active 或 Rejected 状态可以归档
   */
  public archive(): void {
    if (!ExampleStatus.canTransitionTo(this._status, ExampleStatus.Archived)) {
      throw new Error(`Cannot archive example from status: ${this._status}`);
    }

    const oldStatus = this._status;
    this._status = ExampleStatus.Archived;
    this.refreshUpdatedAt();

    this.addDomainEvent<ExampleEventMap['example:status-changed']>('example:status-changed', {
      id: this.id,
      oldStatus,
      newStatus: ExampleStatus.Archived,
      changedAt: this._updatedAt.getTime(),
    });
  }

  /**
   * ✅ 添加标签
   */
  public addTag(tag: ExampleTag): void {
    if (this._status === ExampleStatus.Archived) {
      throw new Error('Cannot modify archived example');
    }
    
    // 检查重复
    if (this._tags.some(t => t.id === tag.id)) {
      throw new Error('Tag already exists');
    }

    this._tags.push(tag);
    this.refreshUpdatedAt();
  }

  /**
   * ✅ 移除标签
   */
  public removeTag(tagId: string): void {
    if (this._status === ExampleStatus.Archived) {
      throw new Error('Cannot modify archived example');
    }

    const index = this._tags.findIndex(t => t.id === tagId);
    if (index === -1) {
      throw new Error('Tag not found');
    }

    this._tags.splice(index, 1);
    this.refreshUpdatedAt();
  }

  /**
   * ✅ 增加浏览次数（不发事件，因为太频繁）
   */
  public incrementViewCount(): void {
    this._viewCount++;
    // 不刷新 updatedAt，因为这不是用户主动的修改
  }

  // ================= 6. 序列化（Serialization）=================

  /**
   * 转换为持久化 DTO（用于 Repository 保存）
   * 
   * 【规范说明】
   * - Server 模型必须包含 toPersistenceDTO()
   * - 禁止包含 toClientDTO()（Server 模型不关心前端展示）
   * 
   * 【时间类型转换：DomainDate → PersistenceDate】
   * 目前两者都是 Date，直接赋值即可
   * 如果未来 PersistenceDate 变为 number，需要 .getTime()
   */
  public toPersistenceDTO(): ExamplePersistenceDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      name: this._name,
      description: this._description,
      status: this._status,
      priority: this._priority,
      isPublic: this._isPublic,
      viewCount: this._viewCount,
      likeCount: this._likeCount,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }

  /**
   * 转换为 ServerDTO（用于服务间通信）
   * 
   * 【时间类型转换：DomainDate → TransferDate】
   * ServerDTO 用于 API 传输，时间字段必须是 TransferDate（number）
   */
  public toServerDTO(): ExampleServerDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      name: this._name,
      description: this._description,
      status: this._status,
      priority: this._priority,
      isPublic: this._isPublic,
      viewCount: this._viewCount,
      likeCount: this._likeCount,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }
}
