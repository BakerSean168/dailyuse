/**
 * RuleRevision Entity - Domain Client
 * 规则修订版本实体 - 客户端领域
 *
 * Provides client-side revision record capabilities:
 * - Audit history viewing
 * - Change detail display
 * - UI helper methods (time formatting, change summaries)
 *
 * 提供客户端修订版本记录功能：
 * - 审计历史查看
 * - 更改详情显示
 * - UI 辅助方法（时间格式化、更改摘要）
 */

import type { RuleRevisionClientDTO } from '../../contracts/entities/rule-revision-client';
import { Entity } from '@dailyuse/utils';
import type { RuleId } from '../../contracts/primitives/ids';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import { RuleRevisionId } from '../../domain-shared/value-objects/rule-revision-id';
// ================= Internal State Interface =================
// ================= 内部状态接口 =================

/**
 * Internal state for the RuleRevision client-side entity.
 * RuleRevision 客户端实体的内部状态。
 *
 * @internal Hydration state for client-side mappers only. Not part of the public API.
 * @internal 仅供客户端映射器使用的水化状态，非公开 API。
 */
export interface RuleRevisionState {
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

// ================= Entity Implementation =================
// ================= 实体实现 =================

/**
 * RuleRevision Entity - Client side.
 * RuleRevision 实体 - 客户端侧。
 *
 * Provides a client-side view of revision records, supporting:
 * 提供修订版本记录的客户端视图，支持：
 * - Instance creation from API responses
 *   从 API 响应创建实例
 * - UI helper methods (change summaries, field comparisons)
 *   UI 辅助方法（更改摘要、字段比较）
 * - Data conversion (toDTO)
 *   数据转换（toDTO）
 */
export class RuleRevision extends Entity<RuleRevisionId> {
  private readonly _props: RuleRevisionState;

  // ================= Constructor (Private) =================
  // ================= 构造函数（私有） =================

  private constructor(state: RuleRevisionState) {
    super(state.id);
    // Defensive copy to ensure immutability
    // 防御性复制以确保不可变性
    this._props = {
      ...state,
      changedFields: [...state.changedFields],
      previousValues: { ...state.previousValues },
      newValues: { ...state.newValues },
    };
  }

  // ================= Public Properties (Getters) =================
  // ================= 公开属性（Getter） =================

  /** Associated rule ID. 关联的规则 ID。 */
  get ruleId(): RuleId {
    return this._props.ruleId;
  }

  /** Revision number (incrementing from 1). 修订版本号（从 1 开始递增）。 */
  get revisionNumber(): number {
    return this._props.revisionNumber;
  }

  /** Author identity ID. 作者身份 ID。 */
  get authorId(): IdentityId {
    return this._props.authorId;
  }

  /** List of changed field names. 更改的字段名称列表。 */
  get changedFields(): readonly string[] {
    return this._props.changedFields;
  }

  /** Previous field values before the change. 更改前的字段值。 */
  get previousValues(): Record<string, unknown> {
    return { ...this._props.previousValues };
  }

  /** New field values after the change. 更改后的字段值。 */
  get newValues(): Record<string, unknown> {
    return { ...this._props.newValues };
  }

  /** Type of change. 更改类型。 */
  get changeType(): 'Created' | 'Updated' | 'Deprecated' | 'Reactivated' {
    return this._props.changeType;
  }

  /** Creation timestamp. 创建时间戳。 */
  get createdAt(): Date {
    return this._props.createdAt;
  }

  // ================= UI Helper Methods =================
  // ================= UI 辅助方法 =================

  /**
   * Returns the display label for the change type.
   * 返回更改类型的显示标签。
   *
   * @example
   * revision.displayChangeType // '已更新'
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
   * Returns the UI label color for the change type.
   * 返回更改类型对应的 UI 标签颜色。
   *
   * @returns 'success' | 'info' | 'warning' | 'error'
   */
  get changeTypeColor(): 'success' | 'info' | 'warning' | 'error' {
    const colorMap: Record<
      typeof this._props.changeType,
      'success' | 'info' | 'warning' | 'error'
    > = {
      Created: 'success',
      Updated: 'info',
      Deprecated: 'warning',
      Reactivated: 'success',
    };
    return colorMap[this._props.changeType];
  }

  /**
   * Returns a relative time string (e.g. '5分钟前', '2小时前').
   * 返回相对时间字符串（例如 '5分钟前'、'2小时前'）。
   *
   * @returns Relative time string 相对时间字符串
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

    // Beyond 30 days, show the exact date
    // 超过 30 天，显示精确日期
    return this._props.createdAt.toLocaleDateString('zh-CN');
  }

  /**
   * Generates a change summary for list display.
   * 生成用于列表显示的更改摘要。
   *
   * @example
   * revision.changeSummary
   * // '更新了字段：title, severity'
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
    // 更新
    const fieldNames = this._props.changedFields.join(', ');
    return `更新了字段：${fieldNames}`;
  }

  /**
   * Returns the change details for a specific field.
   * 返回指定字段的更改详情。
   *
   * @param field - Field name 字段名称
   * @returns { before: unknown, after: unknown } | null
   *
   * @example
   * const change = revision.getFieldChange('title');
   * if (change) {
   *   console.log(`Changed from "${change.before}" to "${change.after}"`);
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
   * Checks whether the specified field was changed in this revision.
   * 检查指定字段在本次修订中是否被更改。
   *
   * @param field - Field name 字段名称
   * @example
   * if (revision.hasFieldChanged('severity')) {
   *   console.log('Severity was changed');
   * }
   */
  public hasFieldChanged(field: string): boolean {
    return this._props.changedFields.includes(field);
  }

  // ================= Factory Methods =================
  // ================= 工厂方法 =================

  /**
   * Creates a RuleRevision instance from state.
   * 从状态创建 RuleRevision 实例。
   *
   * @param state - RuleRevision internal state RuleRevision 内部状态
   * @returns RuleRevision instance RuleRevision 实例
   *
   * @example
   * const revision = RuleRevision.load(state);
   */
  public static load(state: RuleRevisionState): RuleRevision {
    return new RuleRevision(state);
  }

  // ================= DTO Conversion =================
  // ================= DTO 转换 =================

  /**
   * Converts to a Client DTO.
   * 转换为客户端 DTO。
   *
   * @returns RuleRevisionClientDTO for API requests 用于 API 请求的 RuleRevisionClientDTO
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
