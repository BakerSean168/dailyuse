/**
 * RuleRevision Entity - Domain Client
 * 规则修订记录实体 - 领域客户端
 *
 * Client 端的修订记录提供：
 * - 审计历史查看
 * - 变更详情展示
 * - UI 辅助方法（时间格式化、变更摘要）
 */

import type {
  RuleRevisionClient,
  RuleRevisionClientDTO,
} from '@dailyuse/contracts/governance';
import { Entity } from '@dailyuse/utils';
import type { RuleId, UserId } from '@dailyuse/contracts/governance';

// ================= 内部状态接口 =================

/**
 * RuleRevision 客户端内部状态
 */
interface RuleRevisionState {
  id: string;
  ruleId: RuleId;
  revisionNumber: number;
  authorId: UserId;
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
export class RuleRevision extends Entity<string> implements RuleRevisionClient {
  private readonly _state: RuleRevisionState;

  // ================= 构造函数 (Private) =================

  private constructor(state: RuleRevisionState) {
    super(state.id);
    // 防御性复制，确保不可变性
    this._state = {
      ...state,
      changedFields: [...state.changedFields],
      previousValues: { ...state.previousValues },
      newValues: { ...state.newValues },
    };
  }

  // ================= 公共属性 (Getters) =================

  /**
   * 关联的规则 ID
   */
  get ruleId(): RuleId {
    return this._state.ruleId;
  }

  /**
   * 修订版本号（从 1 开始递增）
   */
  get revisionNumber(): number {
    return this._state.revisionNumber;
  }

  /**
   * 修改人 ID
   */
  get authorId(): UserId {
    return this._state.authorId;
  }

  /**
   * 变更的字段列表
   */
  get changedFields(): readonly string[] {
    return this._state.changedFields;
  }

  /**
   * 修改前的值
   */
  get previousValues(): Record<string, unknown> {
    return { ...this._state.previousValues };
  }

  /**
   * 修改后的值
   */
  get newValues(): Record<string, unknown> {
    return { ...this._state.newValues };
  }

  /**
   * 变更类型
   */
  get changeType(): 'Created' | 'Updated' | 'Deprecated' | 'Reactivated' {
    return this._state.changeType;
  }

  /**
   * 创建时间
   */
  get createdAt(): Date {
    return this._state.createdAt;
  }

  // ================= UI 辅助方法 =================

  /**
   * 获取变更类型的中文显示名称
   * 
   * @example
   * revision.displayChangeType // '已更新'
   */
  get displayChangeType(): string {
    const typeMap: Record<typeof this._state.changeType, string> = {
      Created: '新建',
      Updated: '已更新',
      Deprecated: '已废弃',
      Reactivated: '重新激活',
    };
    return typeMap[this._state.changeType];
  }

  /**
   * 获取变更类型的 UI 标签颜色
   * 
   * @returns 'success' | 'info' | 'warning' | 'error'
   */
  get changeTypeColor(): 'success' | 'info' | 'warning' | 'error' {
    const colorMap: Record<typeof this._state.changeType, 'success' | 'info' | 'warning' | 'error'> = {
      Created: 'success',
      Updated: 'info',
      Deprecated: 'warning',
      Reactivated: 'success',
    };
    return colorMap[this._state.changeType];
  }

  /**
   * 获取相对时间格式（例如：'5分钟前'、'2小时前'）
   * 
   * @returns 相对时间字符串
   */
  get relativeCreatedAt(): string {
    const now = new Date();
    const diffMs = now.getTime() - this._state.createdAt.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 30) return `${diffDays}天前`;
    
    // 超过 30 天，显示具体日期
    return this._state.createdAt.toLocaleDateString('zh-CN');
  }

  /**
   * 生成变更摘要（用于列表展示）
   * 
   * @example
   * revision.changeSummary 
   * // '更新了字段：标题, 严重程度'
   */
  get changeSummary(): string {
    if (this._state.changeType === 'Created') {
      return '创建了规则';
    }
    if (this._state.changeType === 'Deprecated') {
      return '废弃了规则';
    }
    if (this._state.changeType === 'Reactivated') {
      return '重新激活了规则';
    }
    
    // Updated
    const fieldNames = this._state.changedFields.join(', ');
    return `更新了字段：${fieldNames}`;
  }

  /**
   * 获取指定字段的变更详情
   * 
   * @param field - 字段名
   * @returns { before: unknown, after: unknown } | null
   * 
   * @example
   * const change = revision.getFieldChange('title');
   * if (change) {
   *   console.log(`从 "${change.before}" 改为 "${change.after}"`);
   * }
   */
  public getFieldChange(field: string): { before: unknown; after: unknown } | null {
    if (!this._state.changedFields.includes(field)) {
      return null;
    }
    return {
      before: this._state.previousValues[field],
      after: this._state.newValues[field],
    };
  }

  /**
   * 检查是否修改了指定字段
   * 
   * @param field - 字段名
   * @example
   * if (revision.hasFieldChanged('severity')) {
   *   console.log('严重程度已变更');
   * }
   */
  public hasFieldChanged(field: string): boolean {
    return this._state.changedFields.includes(field);
  }

  // ================= 工厂方法 (Factory Methods) =================

  /**
   * 从 Client DTO 创建 RuleRevision 实例
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
   * 转换为 Client DTO
   * 
   * @returns RuleRevisionClientDTO（可用于 API 请求）
   * 
   * @example
   * const dto = revision.toDTO();
   */
  public toDTO(): RuleRevisionClientDTO {
    return {
      id: this._state.id,
      ruleId: this._state.ruleId,
      revisionNumber: this._state.revisionNumber,
      authorId: this._state.authorId,
      changedFields: [...this._state.changedFields],
      previousValues: { ...this._state.previousValues },
      newValues: { ...this._state.newValues },
      changeType: this._state.changeType,
      createdAt: this._state.createdAt.getTime(),
    };
  }
}
