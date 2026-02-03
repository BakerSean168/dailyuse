/**
 * Example 聚合根 - Client 端实现
 * 
 * 【规范说明：Client 端聚合根 - 参考 domain-client-spec.md】
 * 
 * Client 端的领域模型与 Server 端截然不同：
 * - Server 端：侧重于数据一致性、业务规则校验、持久化、事件分发
 * - Client 端：侧重于数据展示（View Model）、UI 状态辅助、交互逻辑
 * 
 * 原则：Client 端是 "Anemic Domain Model"（贫血模型）与 "Rich View Model"（富视图模型）的结合
 * 
 * 【依赖规则】
 * ✅ 允许依赖：
 * - @dailyuse/utils (AggregateRoot 基类)
 * - @dailyuse/contracts (DTO 定义)
 * - @dailyuse/domain-shared (值对象, 枚举)
 * 
 * ❌ 禁止依赖：
 * - @dailyuse/domain-server（绝对禁止！）
 * - 数据库相关库
 * - UI 框架组件（领域对象应保持框架无关）
 */

import { AggregateRoot } from '@dailyuse/utils';
import type { 
  ExampleClientDTO,
  ExampleServerDTO,
} from '@dailyuse/contracts/example';
import type { IdentityId } from '@dailyuse/contracts/primitives';
// 引入时间类型（防腐层 ACL）
import type {
  TransferDate,
  DomainDate,
} from '@dailyuse/contracts/primitives';
// 复用 Shared 里的值对象
import { 
  ExampleId, 
  ExampleStatus,
  ExampleStatusType,
  ExampleProperty, 
  ExampleTag 
} from '@dailyuse/domain-shared/example';

/**
 * 【时间类型防腐层 - ACL（Anti-Corruption Layer）】
 * - TransferDate = number：API 响应中的时间字段
 * - DomainDate = Date：客户端内部存储，便于日期计算和格式化
 * 
 * 注意：Client 端不需要 PersistenceDate，因为不直接操作数据库
 */
export class Example extends AggregateRoot<ExampleId> {
  // ================= 1. 内部状态 =================
  /**
   * 【规范说明：Client 端时间存储】
   * Client 端内部使用 DomainDate（Date）存储
   * 便于进行日期格式化、相对时间计算等 UI 操作
   */
  private _identityId: IdentityId;
  private _name: string;
  private _description: string | null;
  private _status: ExampleStatusType;
  private _priority: number;
  private _isPublic: boolean;
  private _viewCount: number;
  private _likeCount: number;
  private _tags: ExampleTag[];
  private _properties: Map<string, ExampleProperty>;

  // 时间字段：使用 DomainDate（Date）便于格式化
  public readonly createdAt: DomainDate;  // ✅ 使用 DomainDate
  public readonly updatedAt: DomainDate;  // ✅ 使用 DomainDate

  // ================= 2. 构造函数（Private）=================
  /**
   * 【规范说明】
   * - 构造函数必须为 private
   * - 参数必须只接收 API DTO（ClientDTO）
   * - Client 端的数据源头永远是 API，不是零散的参数
   * 
   * 【时间类型转换：TransferDate → DomainDate】
   * ClientDTO 中的时间是 TransferDate（number）
   * 内部存储转为 DomainDate（Date）便于 UI 格式化
   */
  private constructor(props: ExampleClientDTO) {
    super(ExampleId.of(props.id));

    this._identityId = props.identityId as IdentityId;
    this._name = props.name;
    this._description = props.description;
    this._status = ExampleStatus.of(props.status);
    this._priority = props.priority;
    this._isPublic = props.isPublic;
    this._viewCount = props.viewCount;
    this._likeCount = props.likeCount;
    this._tags = props.tags.map(t => ExampleTag.fromDTO(t));
    this._properties = new Map(
      props.properties.map(p => [p.key, ExampleProperty.fromDTO(p)])
    );
    // ✅ TransferDate(number) → DomainDate(Date)
    this.createdAt = new Date(props.createdAt);
    this.updatedAt = new Date(props.updatedAt);
  }

  // ================= 3. 工厂方法 =================
  
  /**
   * 从 ClientDTO 恢复（主要工厂方法）
   * 
   * 【规范说明】
   * - Client 端必须包含 fromClientDTO()
   * - 客户端的数据源永远是 API 响应
   * 
   * @example
   * ```typescript
   * const example = Example.fromClientDTO(apiResponse.data);
   * ```
   */
  public static fromClientDTO(dto: ExampleClientDTO): Example {
    return new Example(dto);
  }

  /**
   * 从 ServerDTO 恢复（用于 SSR 或直接获取服务端数据时）
   */
  public static fromServerDTO(dto: ExampleServerDTO): Example {
    const clientDTO: ExampleClientDTO = {
      id: dto.id,
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      isPublic: dto.isPublic,
      viewCount: dto.viewCount,
      likeCount: dto.likeCount,
      tags: dto.tags,
      properties: dto.properties,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
    return new Example(clientDTO);
  }

  /**
   * ❌ Client 端通常不需要 create() 工厂
   * 
   * 因为客户端创建实体是发起 API 请求，
   * 而不是在本地内存里 new 一个对象然后保存
   */

  // ================= 4. 基础 Getters =================

  get identityId(): IdentityId { return this._identityId; }
  get name(): string { return this._name; }
  get description(): string | null { return this._description; }
  get status(): ExampleStatusType { return this._status; }
  get priority(): number { return this._priority; }
  get isPublic(): boolean { return this._isPublic; }
  get viewCount(): number { return this._viewCount; }
  get likeCount(): number { return this._likeCount; }
  get tags(): ExampleTag[] { return [...this._tags]; }
  get properties(): Map<string, ExampleProperty> { return new Map(this._properties); }

  // ================= 5. UI 辅助 Getters（View Model 逻辑）=================
  /**
   * 【规范说明：Computed Properties】
   * 用于 UI 展示的衍生数据
   * 这是 Client 端聚合根的主要价值
   */

  /**
   * ✨ 显示状态（本地化）
   */
  get displayStatus(): string {
    const statusLabels: Record<ExampleStatusType, string> = {
      [ExampleStatus.Draft]: '草稿',
      [ExampleStatus.Active]: '已发布',
      [ExampleStatus.Rejected]: '已拒绝',
      [ExampleStatus.Archived]: '已归档',
    };
    return statusLabels[this._status] ?? this._status;
  }

  /**
   * ✨ 是否可编辑
   */
  get canEdit(): boolean {
    return this._status === ExampleStatus.Draft || this._status === ExampleStatus.Active;
  }

  /**
   * ✨ 是否可删除
   */
  get canDelete(): boolean {
    return this._status !== ExampleStatus.Archived;
  }

  /**
   * ✨ 是否可发布
   */
  get canPublish(): boolean {
    return this._status === ExampleStatus.Draft;
  }

  /**
   * ✨ 是否已归档
   */
  get isArchived(): boolean {
    return this._status === ExampleStatus.Archived;
  }

  /**
   * ✨ 获取优先级标签
   */
  get priorityLabel(): string {
    if (this._priority >= 8) return '高';
    if (this._priority >= 4) return '中';
    return '低';
  }

  /**
   * ✨ 获取优先级颜色（用于 UI 展示）
   */
  get priorityColor(): string {
    if (this._priority >= 8) return 'red';
    if (this._priority >= 4) return 'orange';
    return 'green';
  }

  /**
   * ✨ 格式化创建时间（相对时间）
   */
  get createdAtRelative(): string {
    const now = Date.now();
    const diff = now - this.createdAt.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    if (days < 365) return `${Math.floor(days / 30)}个月前`;
    return `${Math.floor(days / 365)}年前`;
  }

  /**
   * ✨ 获取标签名称列表
   */
  get tagNames(): string[] {
    return this._tags.map(t => t.name);
  }

  /**
   * ✨ 是否有标签
   */
  get hasTags(): boolean {
    return this._tags.length > 0;
  }

  // ================= 6. 行为方法（用于乐观更新）=================
  /**
   * 【规范说明：Immutability Helpers】
   * 如果配合 React/Vue 使用，提供 cloneWith 方法支持不可变更新
   */

  /**
   * Clone 并应用部分更新（用于乐观更新）
   * 
   * @example
   * ```typescript
   * // React 中的乐观更新
   * setExample(prev => prev.cloneWith({ name: 'New Name' }));
   * ```
   */
  public cloneWith(changes: Partial<ExampleClientDTO>): Example {
    const currentDTO = this.toClientDTO();
    // updatedAt 使用 TransferDate（number）
    const now: TransferDate = Date.now();
    return new Example({
      ...currentDTO,
      ...changes,
      updatedAt: now, // 本地更新时间
    });
  }

  /**
   * 本地添加标签（乐观更新）
   */
  public withTag(tag: ExampleTag): Example {
    const now: TransferDate = Date.now();
    return new Example({
      ...this.toClientDTO(),
      tags: [...this._tags.map(t => t.toDTO()), tag.toDTO()],
      updatedAt: now,
    });
  }

  /**
   * 本地移除标签（乐观更新）
   */
  public withoutTag(tagId: string): Example {
    const now: TransferDate = Date.now();
    return new Example({
      ...this.toClientDTO(),
      tags: this._tags.filter(t => t.id !== tagId).map(t => t.toDTO()),
      updatedAt: now,
    });
  }

  // ================= 7. 序列化 =================

  /**
   * 转换为 ClientDTO
   * 
   * 【规范说明】
   * - 必须实现，用于序列化后传递给 UI 组件或打印日志
   * 
   * 【时间类型转换：DomainDate → TransferDate】
   * 序列化时将 Date 转回 number
   */
  public toClientDTO(): ExampleClientDTO {
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
      tags: this._tags.map(t => t.toDTO()),
      properties: Array.from(this._properties.values()).map(p => p.toDTO()),
      // ✅ DomainDate(Date) → TransferDate(number)
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }
}
