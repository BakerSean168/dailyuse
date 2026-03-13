/**
 * Rule Aggregate Root - Domain Client
 *
 * Provides client-side rule capabilities:
 * - Rule browsing and search
 * - UI display logic (formatting, status labels)
 * - Optimistic update support
 */

import type { RuleClientDTO } from '../../contracts/aggregates/rule-client';
import type { RuleStatus } from '../../contracts/value-objects/rule-status';
import type { RuleSeverity } from '../../contracts/value-objects/rule-severity';
import { AggregateRoot } from '@dailyuse/utils';
import type { RuleId } from '../../contracts/primitives/ids';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import { CodeSnippet } from '../../domain-shared/value-objects/code-snippet';
import { RuleTag } from '../../domain-shared/value-objects/rule-tag';

// ================= Internal State Interface =================

/**
 * Internal state for the Rule client-side aggregate.
 */
export interface RuleState {
  id: RuleId;
  code: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  status: RuleStatus;
  deprecationReason: string | null;
  replacementRuleId: RuleId | null;
  liveReferenceLocation: string | null;
  tags: RuleTag[];
  codeSnippets: CodeSnippet[];
  authorId: IdentityId;
  createdAt: Date;
  updatedAt: Date;
}

// ================= Aggregate Root Implementation =================

/**
 * Rule Aggregate Root - Client side.
 *
 * Provides a client-side view of a rule, supporting:
 * - Instance creation from API responses
 * - UI helper methods (status formatting, tag filtering)
 * - Data conversion (toDTO)
 */
export class Rule extends AggregateRoot<RuleId> {
  private readonly _props: RuleState;

  // ================= Constructor (Private) =================

  private constructor(state: RuleState) {
    super(state.id);
    this._props = state;
  }

  // ================= Public Properties (Getters) =================

  /**
   * Rule code (e.g. DDD-001).
   */
  get code(): string {
    return this._props.code;
  }

  /** Rule title. */
  get title(): string {
    return this._props.title;
  }

  /** Rule description. */
  get description(): string {
    return this._props.description;
  }

  /** Severity level: Mandatory or Recommended. */
  get severity(): RuleSeverity {
    return this._props.severity;
  }

  /** Rule status: Draft, Active, or Deprecated. */
  get status(): RuleStatus {
    return this._props.status;
  }

  /** Deprecation reason (only set when status is Deprecated). */
  get deprecationReason(): string | null {
    return this._props.deprecationReason;
  }

  /** Replacement rule ID (only set when status is Deprecated). */
  get replacementRuleId(): RuleId | null {
    return this._props.replacementRuleId;
  }

  /** Live reference location in code (file path or URL). */
  get liveReferenceLocation(): string | null {
    return this._props.liveReferenceLocation;
  }

  /** Tag list (e.g. ['ddd', 'entity', 'value-object']). */
  get tags(): RuleTag[] {
    return this._props.tags;
  }

  /** Code snippet list (good examples and bad examples). */
  get codeSnippets(): CodeSnippet[] {
    return this._props.codeSnippets;
  }

  /** Author identity ID. */
  get authorId(): IdentityId {
    return this._props.authorId;
  }

  /** Creation timestamp. */
  get createdAt(): Date {
    return this._props.createdAt;
  }

  /** Last updated timestamp. */
  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  // ================= UI Helper Methods =================

  /**
   * Returns the display label for the current status.
   *
   * @example
   * rule.displayStatus // 'Active'
   */
  get displayStatus(): string {
    const statusMap: Record<RuleStatus, string> = {
      Draft: '草稿',
      Active: '生效',
      Deprecated: '已废弃',
    };
    return statusMap[this._props.status];
  }

  /**
   * Returns the display label for the severity level.
   *
   * @example
   * rule.displaySeverity // 'Mandatory'
   */
  get displaySeverity(): string {
    const severityMap: Record<RuleSeverity, string> = {
      Mandatory: '强制执行',
      Recommended: '建议遵守',
    };
    return this._props.severity;
  }

  /**
   * Returns the UI label color for the severity level.
   *
   * @returns 'error' | 'warning'
   */
  get severityColor(): 'error' | 'warning' {
    return this._props.severity === 'Mandatory' ? 'error' : 'warning';
  }

  /**
   * Returns the UI label color for the status.
   *
   * @returns 'success' | 'info' | 'default'
   */
  get statusColor(): 'success' | 'info' | 'default' {
    const colorMap: Record<RuleStatus, 'success' | 'info' | 'default'> = {
      Draft: 'info',
      Active: 'success',
      Deprecated: 'default',
    };
    return colorMap[this._props.status];
  }

  /** Returns all "good example" code snippets. */
  get goodExamples(): CodeSnippet[] {
    return this._props.codeSnippets.filter((s) => s.type === 'GoodExample');
  }

  /** Returns all "bad example" code snippets. */
  get badExamples(): CodeSnippet[] {
    return this._props.codeSnippets.filter((s) => s.type === 'BadExample');
  }

  /**
   * Checks whether the rule has the specified tag.
   *
   * @param tag - Tag name (case-insensitive)
   * @example
   * rule.hasTag('ddd') // true
   */
  public hasTag(tag: string): boolean {
    return this._props.tags.some((t) => t.value.toLowerCase() === tag.toLowerCase());
  }

  /** Checks whether the rule is deprecated. */
  public isDeprecated(): boolean {
    return this._props.status === 'Deprecated';
  }

  /** Checks whether the rule is a draft. */
  public isDraft(): boolean {
    return this._props.status === 'Draft';
  }

  /** Checks whether the rule is active. */
  public isActive(): boolean {
    return this._props.status === 'Active';
  }

  // ================= Factory Methods =================

  /**
   * Creates a Rule instance from state.
   *
   * @param state - Rule internal state
   * @returns Rule instance
   *
   * @example
   * const rule = Rule.load(state);
   */
  public static load(state: RuleState): Rule {
    return new Rule(state);
  }

  // ================= DTO Conversion =================

  /**
   * Converts to a Client DTO.
   *
   * @returns RuleClientDTO for API requests
   *
   * @example
   * const dto = rule.toDTO();
   * await apiClient.updateRule(dto);
   */
  public toDTO(): RuleClientDTO {
    return {
      id: this._props.id,
      code: this._props.code,
      title: this._props.title,
      description: this._props.description,
      severity: this._props.severity,
      status: this._props.status,
      deprecationReason: this._props.deprecationReason,
      replacementRuleId: this._props.replacementRuleId,
      liveReferenceLocation: this._props.liveReferenceLocation,
      tags: this._props.tags.map((t) => t.toDTO()),
      goodExamples: this.goodExamples.map((s) => s.toDTO()),
      badExamples: this.badExamples.map((s) => s.toDTO()),
      authorId: this._props.authorId,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
    };
  }
}
