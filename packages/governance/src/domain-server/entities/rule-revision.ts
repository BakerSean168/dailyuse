/**
 * RuleRevision Entity - Domain Server
 * 规则修订记录实体 - 领域服务端
 * 
 * 【业务职责】
 * 作为不可变的审计记录，追踪 Rule 聚合根的所有变更历史：
 * - 记录每次修改的字段、前后值
 * - 支持审计合规要求
 * - 支持变更历史回溯
 * 
 * 【不可变性（Immutable）原则】
 * ❌ NO update() 方法 - 审计记录一旦创建不可修改
 * ❌ NO delete() 方法 - 审计记录不可删除
 * ❌ NO setters - 所有字段创建后不可变
 * ✅ 只有 create() 和 fromPersistence() 工厂方法
 * 
 * 【DDD 模式示范】
 * 本实体作为 Governance 模块的样例，展示了以下最佳实践：
 * ✅ 不可变实体：创建后不可修改
 * ✅ 私有构造函数 + 工厂方法
 * ✅ 防御性复制：数组和对象字段
 * ✅ 完整审计信息：who, what, when
 * 
 * 【使用场景】
 * ```typescript
 * // 当 Rule 被修改时，自动创建 RuleRevision
 * const revision = RuleRevision.create({
 *   ruleId: rule.id,
 *   revisionNumber: 3,
 *   authorId: currentUserId,
 *   changedFields: ['title', 'severity'],
 *   previousValues: { title: '旧标题', severity: 'Recommended' },
 *   newValues: { title: '新标题', severity: 'Mandatory' },
 *   changeType: 'Updated',
 * });
 * ```
 */

import { Entity } from '@dailyuse/utils/domain';
import type { RuleRevisionServer, RuleRevisionPersistenceDTO } from '../../contracts/entities/rule-revision-server';
import type { RuleRevisionClientDTO } from '../../contracts/entities/rule-revision-client';
import { RuleRevisionId } from '../../domain-shared/value-objects/rule-revision-id';
import { RuleId } from '../../domain-shared/value-objects/rule-id';
import type { IdentityId } from '@dailyuse/contracts/primitives';

// ================= Props Object（参数对象） =================

/**
 * RuleRevision 内部 Props
 * 
 * 包含完整的审计信息
 */
interface RuleRevisionProps {
  /** 修订记录 ID */
  id: RuleRevisionId;
  
  /** 关联的规则 ID */
  ruleId: RuleId;
  
  /** 修订版本号（从 1 开始递增） */
  revisionNumber: number;
  
  /** 修改人 ID */
  authorId: IdentityId;
  
  /** 变更的字段列表 */
  changedFields: string[];
  
  /** 修改前的值 */
  previousValues: Record<string, unknown>;
  
  /** 修改后的值 */
  newValues: Record<string, unknown>;
  
  /** 变更类型 */
  changeType: 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';
  
  /** 创建时间 */
  createdAt: Date;
}

// ================= 实体实现 =================

/**
 * RuleRevision 不可变实体
 * 
 * 【关键设计】
 * - 所有字段 private readonly - 创建后完全不可变
 * - 防御性复制数组和对象 - 防止外部修改引用
 * - 仅提供 readonly getters - 无任何 setters
 * - changedFields 至少包含 1 个字段
 */
export class RuleRevision extends Entity<RuleRevisionId> implements RuleRevisionServer {
  // ================= 私有 readonly 字段 =================
  // 所有字段不可变，保证审计记录完整性
  
  private readonly _ruleId: RuleId;
  private readonly _revisionNumber: number;
  private readonly _authorId: IdentityId;
  private readonly _changedFields: string[];
  private readonly _previousValues: Record<string, unknown>;
  private readonly _newValues: Record<string, unknown>;
  private readonly _changeType: 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';
  private readonly _createdAt: Date;

  // ================= 构造函数（私有） =================
  // 外部不能直接 new RuleRevision()，必须通过工厂方法创建
  
  private constructor(props: RuleRevisionProps) {
    super(props.id);
    this._ruleId = props.ruleId;
    this._revisionNumber = props.revisionNumber;
    this._authorId = props.authorId;
    // 防御性复制：确保外部修改不影响内部状态
    this._changedFields = [...props.changedFields];
    this._previousValues = { ...props.previousValues };
    this._newValues = { ...props.newValues };
    this._changeType = props.changeType;
    this._createdAt = props.createdAt;
  }

  // ================= 工厂方法（Factory Methods） =================

  /**
   * 创建新的修订记录
   * 
   * @param props - 修订记录属性（id 和 createdAt 可选，会自动生成）
   * @returns RuleRevision 实例
   * @throws Error 如果 changedFields 为空
   * 
   * @example
   * const revision = RuleRevision.create({
   *   ruleId: 'rule-123',
   *   revisionNumber: 2,
   *   authorId: 'user-456',
   *   changedFields: ['title'],
   *   previousValues: { title: '旧标题' },
   *   newValues: { title: '新标题' },
   *   changeType: 'Updated',
   * });
   */
  static create(props: Omit<RuleRevisionProps, 'id' | 'createdAt'> & { id?: RuleRevisionId }): RuleRevision {
    if (props.changedFields.length === 0) {
      throw new Error('RuleRevision must have at least one changed field');
    }

    return new RuleRevision({
      id: props.id || RuleRevisionId.generate(),
      ruleId: props.ruleId,
      revisionNumber: props.revisionNumber,
      authorId: props.authorId,
      changedFields: props.changedFields,
      previousValues: props.previousValues,
      newValues: props.newValues,
      changeType: props.changeType,
      createdAt: new Date(),
    });
  }

  /**
   * Restores RuleRevision from database (no validation)
   */
  static fromPersistence(props: RuleRevisionProps): RuleRevision {
    return new RuleRevision(props);
  }

  // ============ NO UPDATE OR DELETE METHODS ============
  // RuleRevision is immutable - append-only audit trail

  // ============ Readonly Getters ============

  get ruleId(): RuleId { return this._ruleId; }
  get revisionNumber(): number { return this._revisionNumber; }
  get authorId(): IdentityId { return this._authorId; }
  get changedFields(): readonly string[] { return this._changedFields; }
  get previousValues(): Readonly<Record<string, unknown>> { return this._previousValues; }
  get newValues(): Readonly<Record<string, unknown>> { return this._newValues; }
  get changeType(): 'Created' | 'Updated' | 'Deprecated' | 'Reactivated' { return this._changeType; }
  get createdAt(): Date { return this._createdAt; }

  // ================= 序列化方法 =================

  /**
   * 转换为 Server DTO（用于内部服务通信）
   */
  toServerDTO(): import('../../contracts/entities/rule-revision-server').RuleRevisionServerDTO {
    return {
      id: this.id,
      ruleId: this._ruleId,
      revisionNumber: this._revisionNumber,
      authorId: this._authorId,
      changedFields: [...this._changedFields],
      previousValues: { ...this._previousValues },
      newValues: { ...this._newValues },
      changeType: this._changeType,
      createdAt: this._createdAt.getTime(),
    };
  }

  /**
   * 转换为 Client DTO（用于 API 响应）
   */
  toClientDTO(): RuleRevisionClientDTO {
    return {
      id: this.id,
      ruleId: this._ruleId,
      revisionNumber: this._revisionNumber,
      authorId: this._authorId,
      changedFields: [...this._changedFields],
      previousValues: { ...this._previousValues },
      newValues: { ...this._newValues },
      changeType: this._changeType,
      createdAt: this._createdAt.getTime(),
    };
  }

  /**
   * 转换为 Persistence DTO（用于数据库存储）
   */
  toPersistenceDTO(): RuleRevisionPersistenceDTO {
    return {
      id: this.id,
      ruleId: this._ruleId,
      revisionNumber: this._revisionNumber,
      authorId: this._authorId,
      changedFields: JSON.stringify(this._changedFields),
      previousValues: JSON.stringify(this._previousValues),
      newValues: JSON.stringify(this._newValues),
      changeType: this._changeType,
      createdAt: this._createdAt,
    };
  }
}
