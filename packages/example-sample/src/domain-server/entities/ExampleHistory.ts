/**
 * ExampleHistory 实体 - Server 端实现
 * 
 * 【规范说明：Entity vs Aggregate】
 * - Entity：有唯一标识符、有生命周期、从属于聚合根
 * - Aggregate：是聚合的根节点，对外代表整个聚合
 * 
 * 本实体展示：
 * 1. 继承 Entity 基类（带 uuid）
 * 2. 时间字段使用防腐层类型（DomainDate, TransferDate, PersistenceDate）
 * 3. 业务方法与 UI 辅助分离
 * 
 * 【时间类型防腐层 - ACL（Anti-Corruption Layer）】
 * - TransferDate = number：用于 API 交互（DTO），Unix 时间戳
 * - DomainDate = Date：用于业务逻辑运算（Entity/Service 方法）
 * - PersistenceDate = Date：用于数据库存储（Prisma 返回）
 * 
 * 【依赖规则】
 * ✅ 允许依赖：
 * - @dailyuse/utils (Entity 基类)
 * - @dailyuse/contracts (DTO 定义, primitives)
 * - @dailyuse/domain-shared (值对象)
 * 
 * ❌ 禁止依赖：
 * - @dailyuse/domain-client
 * - 外部 I/O 库
 */

import { Entity } from '@dailyuse/utils';
import type { 
  DomainDate, 
  TransferDate, 
  PersistenceDate 
} from '@dailyuse/contracts/primitives';
import type { 
  ExampleHistoryServerDTO,
  ExampleHistoryPersistenceDTO,
} from '@dailyuse/contracts/example';

/**
 * 【基类 Entity 自带方法】
 * - uuid: string (readonly) - 实体唯一标识符
 * - _uuid: string (protected) - 内部 uuid 存储
 * - static generateUUID(): string - 生成新的 UUID
 */
export class ExampleHistory extends Entity {
  // ================= 1. 内部状态 =================
  /**
   * 【规范说明：时间字段类型】
   * 
   * Server 端实体/聚合内部存储使用 DomainDate（Date 类型）
   * 便于在业务逻辑中进行日期计算、比较
   */
  private _exampleId: string;
  private _action: ExampleHistoryAction;
  private _changes: Record<string, unknown> | null;
  private _performedBy: string; // 操作人 ID
  private _createdAt: DomainDate; // ✅ 内部使用 DomainDate

  // ================= 2. 构造函数（Private）=================
  private constructor(params: {
    uuid?: string;
    exampleId: string;
    action: ExampleHistoryAction;
    changes?: Record<string, unknown> | null;
    performedBy: string;
    createdAt: DomainDate;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._exampleId = params.exampleId;
    this._action = params.action;
    this._changes = params.changes ?? null;
    this._performedBy = params.performedBy;
    this._createdAt = params.createdAt;
  }

  // ================= 3. Getters =================
  
  public override get uuid(): string {
    return this._uuid;
  }

  get exampleId(): string { 
    return this._exampleId; 
  }

  get action(): ExampleHistoryAction { 
    return this._action; 
  }

  get changes(): Record<string, unknown> | null { 
    return this._changes ? { ...this._changes } : null; 
  }

  get performedBy(): string { 
    return this._performedBy; 
  }

  /**
   * 【规范说明：Getter 返回 DomainDate】
   * 外部代码拿到 Date 后可以直接做日期运算
   */
  get createdAt(): DomainDate { 
    return this._createdAt; 
  }

  // ================= 4. 工厂方法 =================

  /**
   * 创建新的历史记录
   * 
   * @example
   * ```typescript
   * const history = ExampleHistory.create({
   *   exampleId: example.id,
   *   action: 'Created',
   *   performedBy: userId,
   * });
   * ```
   */
  public static create(params: {
    exampleId: string;
    action: ExampleHistoryAction;
    changes?: Record<string, unknown> | null;
    performedBy: string;
  }): ExampleHistory {
    return new ExampleHistory({
      ...params,
      createdAt: new Date(), // 新建时使用当前时间
    });
  }

  /**
   * 从持久化 DTO 恢复
   * 
   * 【规范说明：PersistenceDate → DomainDate 转换】
   * PersistenceDate 目前也是 Date，直接赋值即可
   * 如果未来 PersistenceDate 变为 number，需要 new Date(dto.createdAt)
   */
  public static fromPersistenceDTO(dto: ExampleHistoryPersistenceDTO): ExampleHistory {
    return new ExampleHistory({
      uuid: dto.uuid,
      exampleId: dto.exampleId,
      action: dto.action as ExampleHistoryAction,
      changes: dto.changes,
      performedBy: dto.performedBy,
      createdAt: dto.createdAt, // PersistenceDate → DomainDate（目前都是 Date）
    });
  }

  // ================= 5. 业务方法 =================

  /**
   * 检查是否包含特定字段的变更
   */
  public hasChangeFor(field: string): boolean {
    return this._changes !== null && field in this._changes;
  }

  /**
   * 获取特定字段的变更值
   */
  public getChange<T>(field: string): T | undefined {
    if (!this._changes) return undefined;
    return this._changes[field] as T;
  }

  // ================= 6. 序列化 =================

  /**
   * 转换为 ServerDTO
   * 
   * 【规范说明：DomainDate → TransferDate 转换】
   * ServerDTO 用于 API 传输，时间字段必须是 TransferDate（number）
   */
  public toServerDTO(): ExampleHistoryServerDTO {
    return {
      uuid: this.uuid,
      exampleId: this._exampleId,
      action: this._action,
      changes: this._changes,
      performedBy: this._performedBy,
      createdAt: this._createdAt.getTime(), // ✅ DomainDate → TransferDate
    };
  }

  /**
   * 转换为持久化 DTO
   * 
   * 【规范说明：DomainDate → PersistenceDate 转换】
   * PersistenceDTO 用于数据库存储，目前 PersistenceDate 也是 Date
   */
  public toPersistenceDTO(): ExampleHistoryPersistenceDTO {
    return {
      uuid: this.uuid,
      exampleId: this._exampleId,
      action: this._action,
      changes: this._changes,
      performedBy: this._performedBy,
      createdAt: this._createdAt, // ✅ DomainDate → PersistenceDate（目前都是 Date）
    };
  }
}

// ================= 相关类型定义 =================

/**
 * 历史操作类型枚举
 */
export const ExampleHistoryAction = {
  Created: 'Created',
  Updated: 'Updated',
  Activated: 'Activated',
  Archived: 'Archived',
  Deleted: 'Deleted',
  TagAdded: 'TagAdded',
  TagRemoved: 'TagRemoved',
} as const;

export type ExampleHistoryAction = typeof ExampleHistoryAction[keyof typeof ExampleHistoryAction];
