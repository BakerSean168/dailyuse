/**
 * RuleRevision Entity - Domain Client
 *
 * Provides client-side revision record capabilities:
 * - Audit history viewing
 * - Change detail display
 * - UI helper methods (time formatting, change summaries)
 */

import type { RuleRevisionClientDTO } from '../../contracts/entities/rule-revision-client';
import { Entity } from '@dailyuse/utils';
import type { RuleId } from '../../contracts/primitives/ids';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import { RuleRevisionId } from '../../domain-shared/value-objects/rule-revision-id';
// ================= Internal State Interface =================

/**
 * Internal state for the RuleRevision client-side entity.
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

/**
 * RuleRevision Entity - Client side.
 *
 * Provides a client-side view of revision records, supporting:
 * - Instance creation from API responses
 * - UI helper methods (change summaries, field comparisons)
 * - Data conversion (toDTO)
 */
export class RuleRevision extends Entity<RuleRevisionId> {
  private readonly _props: RuleRevisionState;

  // ================= Constructor (Private) =================

  private constructor(state: RuleRevisionState) {
    super(state.id);
    // Defensive copy to ensure immutability
    this._props = {
      ...state,
      changedFields: [...state.changedFields],
      previousValues: { ...state.previousValues },
      newValues: { ...state.newValues },
    };
  }

  // ================= Public Properties (Getters) =================

  /** Associated rule ID. */
  get ruleId(): RuleId {
    return this._props.ruleId;
  }

  /** Revision number (incrementing from 1). */
  get revisionNumber(): number {
    return this._props.revisionNumber;
  }

  /** Author identity ID. */
  get authorId(): IdentityId {
    return this._props.authorId;
  }

  /** List of changed field names. */
  get changedFields(): readonly string[] {
    return this._props.changedFields;
  }

  /** Previous field values before the change. */
  get previousValues(): Record<string, unknown> {
    return { ...this._props.previousValues };
  }

  /** New field values after the change. */
  get newValues(): Record<string, unknown> {
    return { ...this._props.newValues };
  }

  /** Type of change. */
  get changeType(): 'Created' | 'Updated' | 'Deprecated' | 'Reactivated' {
    return this._props.changeType;
  }

  /** Creation timestamp. */
  get createdAt(): Date {
    return this._props.createdAt;
  }

  // ================= UI Helper Methods =================

  /**
   * Returns the display label for the change type.
   *
   * @example
   * revision.displayChangeType // 'Updated'
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
   * Returns a relative time string (e.g. '5 minutes ago', '2 hours ago').
   *
   * @returns Relative time string
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
    return this._props.createdAt.toLocaleDateString('zh-CN');
  }

  /**
   * Generates a change summary for list display.
   *
   * @example
   * revision.changeSummary
   * // 'Updated fields: title, severity'
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
   * Returns the change details for a specific field.
   *
   * @param field - Field name
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
   *
   * @param field - Field name
   * @example
   * if (revision.hasFieldChanged('severity')) {
   *   console.log('Severity was changed');
   * }
   */
  public hasFieldChanged(field: string): boolean {
    return this._props.changedFields.includes(field);
  }

  // ================= Factory Methods =================

  /**
   * Creates a RuleRevision instance from state.
   *
   * @param state - RuleRevision internal state
   * @returns RuleRevision instance
   *
   * @example
   * const revision = RuleRevision.load(state);
   */
  public static load(state: RuleRevisionState): RuleRevision {
    return new RuleRevision(state);
  }

  // ================= DTO Conversion =================

  /**
   * Converts to a Client DTO.
   *
   * @returns RuleRevisionClientDTO for API requests
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
