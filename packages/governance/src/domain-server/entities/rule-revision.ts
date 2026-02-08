/**
 * RuleRevision Entity
 * 
 * Immutable audit record for Rule changes.
 * Demonstrates append-only pattern - NO update or delete methods.
 */

import { Entity } from '@dailyuse/utils/domain';

/**
 * Props Object for RuleRevision
 */
interface RuleRevisionProps {
  id: string;
  ruleId: string;
  revisionNumber: number;
  authorId: string;
  changedFields: string[];
  previousValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  changeType: 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';
  createdAt: Date;
}

export class RuleRevision extends Entity<string> {
  private readonly _ruleId: string;
  private readonly _revisionNumber: number;
  private readonly _authorId: string;
  private readonly _changedFields: string[];
  private readonly _previousValues: Record<string, unknown>;
  private readonly _newValues: Record<string, unknown>;
  private readonly _changeType: 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';
  private readonly _createdAt: Date;

  // Private constructor - use factory method
  private constructor(props: RuleRevisionProps) {
    super(props.id);
    this._ruleId = props.ruleId;
    this._revisionNumber = props.revisionNumber;
    this._authorId = props.authorId;
    this._changedFields = [...props.changedFields]; // Defensive copy
    this._previousValues = { ...props.previousValues }; // Defensive copy
    this._newValues = { ...props.newValues }; // Defensive copy
    this._changeType = props.changeType;
    this._createdAt = props.createdAt;
  }

  /**
   * Creates new revision (always succeeds - no validation needed)
   * 
   * @param props - Revision properties
   * @returns RuleRevision instance
   */
  static create(props: Omit<RuleRevisionProps, 'id' | 'createdAt'> & { id?: string }): RuleRevision {
    if (props.changedFields.length === 0) {
      throw new Error('RuleRevision must have at least one changed field');
    }

    return new RuleRevision({
      id: props.id || crypto.randomUUID(),
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

  get ruleId(): string { return this._ruleId; }
  get revisionNumber(): number { return this._revisionNumber; }
  get authorId(): string { return this._authorId; }
  get changedFields(): readonly string[] { return this._changedFields; }
  get previousValues(): Readonly<Record<string, unknown>> { return this._previousValues; }
  get newValues(): Readonly<Record<string, unknown>> { return this._newValues; }
  get changeType(): 'Created' | 'Updated' | 'Deprecated' | 'Reactivated' { return this._changeType; }
  get createdAt(): Date { return this._createdAt; }
}
