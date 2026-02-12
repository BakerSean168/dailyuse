/**
 * RuleRevision Entity - Domain Client
 * 规则修订记录实体 - 领域客户�?
 *
 * Client 端的修订记录提供�?
 * - 审计历史查看
 * - 变更详情展示
 * - UI 辅助方法（时间格式化、变更摘要）
 */

import type {
  RuleRevisionClient,
  RuleRevisionClientDTO,
} from '@/contracts/entities/rule-revision-client';
import { Entity } from '@dailyuse/utils';
import type { RuleId } from '@/contracts/primitives/ids';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import { RuleRevisionId } from '../../domain-shared/value-objects/rule-revision-id';
// ================= 内部状态接�?=================

/**
 * RuleRevision 客户端内部状�?
 */
interface RuleRevisionState {
  id: RuleRevisionId;
  ruleId: RuleId;
  revisionNumber: number;
  authorId: IdentityId;
  changedFields: readonly string[];
  previousValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  changeType: 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';
  createdAt: Date;
}

// ================= 实体实现 =================

/**
 * RuleRevision 实体 - Client 端
 * 
 * 提供修订记录的客户端视图，支持：
 * - 从 API 响应创建实例
 * - UI 辅助方法（变更摘要、字段对比）
 * - 数据转换（toDTO）
 */
export class RuleRevision extends Entity<RuleRevisionId> implements RuleRevisionClient {
  private readonly _props: RuleRevisionState;

  // ================= 构造函�?(Private) =================

  private constructor(state: RuleRevisionState) {
    super(state.id);
    // 防御性复制，确保不可变�?
    this._props = {
      ...state,
      changedFields: [...state.changedFields],
      previousValues: { ...state.previousValues },
      newValues: { ...state.newValues },
    };
  }

  // ================= 公共属�?(Getters) =================

  /**
   * 关联的规�?ID
   */
  get ruleId(): RuleId {
    return this._props.ruleId;
  }

  /**
   * 修订版本号（�?1 开始递增�?
   */
  get revisionNumber(): number {
    return this._props.revisionNumber;
  }

  /**
   * 修改�?ID
   */
  get authorId(): IdentityId {
    return this._props.authorId;
  }

  /**
   * 变更的字段列�?
   */
  get changedFields(): readonly string[] {
    return this._props.changedFields;
  }

  /**
   * 修改前的�?
   */
  get previousValues(): Record<string, unknown> {
    return { ...this._props.previousValues };
  }

  /**
   * 修改后的�?
   */
  get newValues(): Record<string, unknown> {
    return { ...this._props.newValues };
  }

  /**
   * 变更类型
   */
  get changeType(): 'Created' | 'Updated' | 'Deprecated' | 'Reactivated' {
    return this._props.changeType;
  }

  /**
   * 创建时间
   */
  get createdAt(): Date {
    return this._props.createdAt;
  }

  // ================= UI 辅助方法 =================

  /**
   * 获取变更类型的中文显示名�?
   * 
   * @example
   * revision.displayChangeType // '已更�?
   */
  get displayChangeType(): string {
    const typeMap: Record<typeof this._props.changeType, string> = {
      Created: '新建',
      Updated: '已更新',
      Deprecated: '已废弃',
      Reactivated: '重新激活',
    };
    return typeMap[this._props.changeType];
  }

  /**
   * 获取变更类型�?UI 标签颜色
   * 
   * @returns 'success' | 'info' | 'warning' | 'error'
   */
  get changeTypeColor(): 'success' | 'info' | 'warning' | 'error' {
    const colorMap: Record<typeof this._props.changeType, 'success' | 'info' | 'warning' | 'error'> = {
      Created: 'success',
      Updated: 'info',
      Deprecated: 'warning',
      Reactivated: 'success',
    };
    return colorMap[this._props.changeType];
  }

  /**
   * 获取相对时间格式（例如：'5分钟�?�?2小时�?�?
   * 
   * @returns 相对时间字符�?
   */
  get relativeCreatedAt(): string {
    const now = new Date();
    const diffMs = now.getTime() - this._props.createdAt.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 30) return `${diffDays}天前`;
    
    // 超过 30 天，显示具体日期
    return this._props.createdAt.toLocaleDateString('zh-CN');
  }

  /**
   * 生成变更摘要（用于列表展示）
   * 
   * @example
   * revision.changeSummary 
   * // '更新了字段：标题, 严重程度'
   */
  get changeSummary(): string {
    if (this._props.changeType === 'Created') {
      return '创建了规则';
    }
    if (this._props.changeType === 'Deprecated') {
      return '废弃了规则';
    }
    if (this._props.changeType === 'Reactivated') {
      return '重新激活了规则';
    }
    
    // Updated
    const fieldNames = this._props.changedFields.join(', ');
    return `更新了字段：${fieldNames}`;
  }

  /**
   * 获取指定字段的变更详�?
   * 
   * @param field - 字段�?
   * @returns { before: unknown, after: unknown } | null
   * 
   * @example
   * const change = revision.getFieldChange('title');
   * if (change) {
   *   console.log(`�?"${change.before}" 改为 "${change.after}"`);
   * }
   */
  public getFieldChange(field: string): { before: unknown; after: unknown } | null {
    if (!this._props.changedFields.includes(field)) {
      return null;
    }
    return {
      before: this._props.previousValues[field],
      after: this._props.newValues[field],
    };
  }

  /**
   * 检查是否修改了指定字段
   * 
   * @param field - 字段�?
   * @example
   * if (revision.hasFieldChanged('severity')) {
   *   console.log('严重程度已变�?);
   * }
   */
  public hasFieldChanged(field: string): boolean {
    return this._props.changedFields.includes(field);
  }

  // ================= 工厂方法 (Factory Methods) =================

  /**
   * �?Client DTO 创建 RuleRevision 实例
   * 
   * @param dto - API 响应中的 RuleRevisionClientDTO
   * @returns RuleRevision 实例
   * 
   * @example
   * const revision = RuleRevision.fromDTO(apiResponse.data);
   */
  public static fromDTO(dto: RuleRevisionClientDTO): RuleRevision {
    return new RuleRevision({
      id: dto.id,
      ruleId: dto.ruleId,
      revisionNumber: dto.revisionNumber,
      authorId: dto.authorId,
      changedFields: [...dto.changedFields],
      previousValues: { ...dto.previousValues },
      newValues: { ...dto.newValues },
      changeType: dto.changeType,
      createdAt: new Date(dto.createdAt),
    });
  }

  // ================= DTO 转换 =================

  /**
   * 转换�?Client DTO
   * 
   * @returns RuleRevisionClientDTO（可用于 API 请求�?
   * 
   * @example
   * const dto = revision.toDTO();
   */
  public toDTO(): RuleRevisionClientDTO {
    return {
      id: this.id,
      ruleId: this._props.ruleId,
      revisionNumber: this._props.revisionNumber,
      authorId: this._props.authorId,
      changedFields: [...this._props.changedFields],
      previousValues: { ...this._props.previousValues },
      newValues: { ...this._props.newValues },
      changeType: this._props.changeType,
      createdAt: this._props.createdAt.getTime(),
    };
  }
}
