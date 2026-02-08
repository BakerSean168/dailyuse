/**
 * Rule Aggregate Root
 * 
 * Represents an architectural rule with strict lifecycle enforcement.
 * Demonstrates canonical DDD patterns (Props Object, private constructors,
 * factory methods, domain events, state machine).
 */

import { AggregateRoot } from '@dailyuse/utils/domain';
import { RuleId } from '../../domain-shared/value-objects/rule-id';
import { RuleTag } from '../../domain-shared/value-objects/rule-tag';
import { CodeSnippet } from '../../domain-shared/value-objects/code-snippet';
import { RuleStatusCompanion } from '../../domain-shared/value-objects/rule-status-companion';
import { RuleStatus } from '../../contracts/value-objects/rule-status';
import { RuleSeverity } from '../../contracts/value-objects/rule-severity';
import type { Result, ok, fail } from '@dailyuse/contracts/result';

/**
 * Props Object for Rule creation
 */
export interface CreateRuleProps {
  code: string; // Pattern: PREFIX-NUMBER (e.g., DDD-001)
  title: string; // 3-100 chars
  description: string; // 10-5000 chars, Markdown
  severity: RuleSeverity;
  tags: string[]; // Will be normalized
  goodExamples: Array<{ language: string; content: string; caption?: string }>;
  badExamples: Array<{ language: string; content: string; caption?: string }>;
  liveReferenceLocation?: string;
  authorId: string;
}

/**
 * Props Object for Rule updates
 */
export interface UpdateRuleProps {
  title?: string;
  description?: string;
  tags?: string[];
  liveReferenceLocation?: string;
}

/**
 * Internal Rule properties (private backing fields)
 */
interface RuleProps {
  id: RuleId;
  code: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  status: RuleStatus;
  deprecationReason?: string;
  replacementRuleId?: RuleId;
  liveReferenceLocation?: string;
  tags: RuleTag[];
  codeSnippets: CodeSnippet[];
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Rule extends AggregateRoot<RuleId> {
  // Private backing fields with readonly getters
  private _code: string;
  private _title: string;
  private _description: string;
  private _severity: RuleSeverity;
  private _status: RuleStatus;
  private _deprecationReason?: string;
  private _replacementRuleId?: RuleId;
  private _liveReferenceLocation?: string;
  private _tags: RuleTag[];
  private _codeSnippets: CodeSnippet[];
  private readonly _authorId: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  // Private constructor - use factory methods
  private constructor(props: RuleProps) {
    super(props.id);
    this._code = props.code;
    this._title = props.title;
    this._description = props.description;
    this._severity = props.severity;
    this._status = props.status;
    this._deprecationReason = props.deprecationReason;
    this._replacementRuleId = props.replacementRuleId;
    this._liveReferenceLocation = props.liveReferenceLocation;
    this._tags = props.tags;
    this._codeSnippets = props.codeSnippets;
    this._authorId = props.authorId;
   this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // ============ Factory Methods ============

  /**
   * Creates new Rule in Draft status
   * 
   * Validates:
   * - Unique code pattern (enforced by repository)
   * - Min 1 tag, 1 Good, 1 Bad example
   * - String length constraints
   * 
   * Emits: rule:created event
   */
  static create(props: CreateRuleProps): Result<Rule> {
    // Validate code pattern
    if (!/^[A-Z]+-[0-9]+$/.test(props.code)) {
      return fail('Code must match pattern: PREFIX-NUMBER (e.g., DDD-001)');
    }

    // Validate title length
    if (props.title.length < 3 || props.title.length > 100) {
      return fail('Title must be 3-100 characters');
    }

    // Validate description length
    if (props.description.length < 10 || props.description.length > 5000) {
      return fail('Description must be 10-5000 characters');
    }

    // Validate min 1 tag
    if (props.tags.length === 0) {
      return fail('At least one tag is required');
    }

    // Normalize tags
    const tagResults = props.tags.map(RuleTag.create);
    const failedTag = tagResults.find(r => !r.isSuccess);
    if (failedTag) {
      return fail(failedTag.error!);
    }
    const tags = tagResults.map(r => r.getValue()!);

    // Validate and create Good examples (min 1)
    if (props.goodExamples.length === 0) {
      return fail('At least one Good Example is required');
    }
    const goodSnippetResults = props.goodExamples.map(ex => 
      CodeSnippet.create({ ...ex, type: 'GoodExample' as any, language: ex.language as any })
    );
    const failedGood = goodSnippetResults.find(r => !r.isSuccess);
    if (failedGood) {
      return fail(`Good Example: ${failedGood.error}`);
    }

    // Validate and create Bad examples (min 1)
    if (props.badExamples.length === 0) {
      return fail('At least one Bad Example is required');
    }
    const badSnippetResults = props.badExamples.map(ex => 
      CodeSnippet.create({ ...ex, type: 'BadExample' as any, language: ex.language as any })
    );
    const failedBad = badSnippetResults.find(r => !r.isSuccess);
    if (failedBad) {
      return fail(`Bad Example: ${failedBad.error}`);
    }

    const codeSnippets = [
      ...goodSnippetResults.map(r => r.getValue()!),
      ...badSnippetResults.map(r => r.getValue()!),
    ];

    const rule = new Rule({
      id: RuleId.generate(),
      code: props.code,
      title: props.title,
      description: props.description,
      severity: props.severity,
      status: RuleStatus.Draft,
      liveReferenceLocation: props.liveReferenceLocation,
      tags,
      codeSnippets,
      authorId: props.authorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Emit domain event
    rule.addDomainEvent({
      eventName: 'rule:created',
      aggregateId: rule.id,
      occurredAt: new Date(),
      payload: {
        ruleId: rule.id,
        code: rule._code,
        title: rule._title,
        authorId: rule._authorId,
      },
    });

    return ok(rule);
  }

  /**
   * Restores Rule from database (no validation, no events)
   */
  static fromPersistence(props: RuleProps): Rule {
    return new Rule(props);
  }

  // ============ Lifecycle Methods ============

  /**
   * Publishes rule (Draft → Active)
   */
  activate(): Result<void> {
    if (!RuleStatusCompanion.canTransitionTo(this._status, RuleStatus.Active, this._severity)) {
      return fail('Cannot activate rule from current status');
    }

    const oldStatus = this._status;
    this._status = RuleStatus.Active;
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventName: 'rule:status-changed',
      aggregateId: this.id,
      occurredAt: new Date(),
      payload: {
        ruleId: this.id,
        oldStatus,
        newStatus: RuleStatus.Active,
      },
    });

    return ok(undefined);
  }

  /**
   * Deprecates rule (Active → Deprecated)
   * 
   * Validates:
   * - Status is Active
   * - Severity is RECOMMENDED (MANDATORY must downgrade first)
   * - Reason is provided
   */
  deprecate(reason: string, replacementRuleId?: RuleId): Result<void> {
    if (this._severity === RuleSeverity.Mandatory) {
      return fail('MANDATORY rules must be downgraded to RECOMMENDED before deprecation');
    }

    if (!RuleStatusCompanion.canTransitionTo(this._status, RuleStatus.Deprecated, this._severity)) {
      return fail('Invalid status transition to Deprecated');
    }

    if (!reason || reason.trim().length === 0) {
      return fail('Deprecation reason is required');
    }

    if (reason.length < 10 || reason.length > 500) {
      return fail('Deprecation reason must be 10-500 characters');
    }

    this._status = RuleStatus.Deprecated;
    this._deprecationReason = reason;
    this._replacementRuleId = replacementRuleId;
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventName: 'rule:deprecated',
      aggregateId: this.id,
      occurredAt: new Date(),
      payload: {
        ruleId: this.id,
        reason,
        replacementRuleId,
      },
    });

    return ok(undefined);
  }

  /**
   * Reactivates deprecated rule (Deprecated → Active)
   */
  reactivate(): Result<void> {
    if (!RuleStatusCompanion.canTransitionTo(this._status, RuleStatus.Active, this._severity)) {
      return fail('Cannot reactivate rule from current status');
    }

    this._status = RuleStatus.Active;
    this._deprecationReason = undefined;
    this._replacementRuleId = undefined;
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventName: 'rule:reactivated',
      aggregateId: this.id,
      occurredAt: new Date(),
      payload: {
        ruleId: this.id,
      },
    });

    return ok(undefined);
  }

  // ============ Mutation Methods ============

  /**
   * Updates rule content (title, description, tags, live reference)
   * 
   * Emits: rule:updated event
   */
  update(props: UpdateRuleProps): Result<void> {
    const changedFields: string[] = [];

    if (props.title) {
      if (props.title.length < 3 || props.title.length > 100) {
        return fail('Title must be 3-100 characters');
      }
      this._title = props.title;
      changedFields.push('title');
    }

    if (props.description) {
      if (props.description.length < 10 || props.description.length > 5000) {
        return fail('Description must be 10-5000 characters');
      }
      this._description = props.description;
      changedFields.push('description');
    }

    if (props.tags) {
      if (props.tags.length === 0) {
        return fail('At least one tag is required');
      }
      const tagResults =props.tags.map(RuleTag.create);
      const failedTag = tagResults.find(r => !r.isSuccess);
      if (failedTag) {
        return fail(failedTag.error!);
      }
      this._tags = tagResults.map(r => r.getValue()!);
      changedFields.push('tags');
    }

    if (props.liveReferenceLocation !== undefined) {
      this._liveReferenceLocation = props.liveReferenceLocation;
      changedFields.push('liveReferenceLocation');
    }

    if (changedFields.length > 0) {
      this._updatedAt = new Date();

      this.addDomainEvent({
        eventName: 'rule:updated',
        aggregateId: this.id,
        occurredAt: new Date(),
        payload: {
          ruleId: this.id,
          changedFields,
        },
      });
    }

    return ok(undefined);
  }

  /**
   * Changes severity level
   * 
   * Validates: Cannot directly deprecate MANDATORY rule
   */
  changeSeverity(newSeverity: RuleSeverity): Result<void> {
    if (this._severity === newSeverity) {
      return ok(undefined); // No change needed
    }

    this._severity = newSeverity;
    this._updatedAt = new Date();

    return ok(undefined);
  }

  /**
   * Adds normalized tag (prevents duplicates)
   */
  addTag(rawTag: string): Result<void> {
    const tagResult = RuleTag.create(rawTag);
    if (!tagResult.isSuccess) {
      return fail(tagResult.error!);
    }

    const tag = tagResult.getValue()!;
    
    // Check for duplicates
    const exists = this._tags.some(t => t.equals(tag));
    if (exists) {
      return ok(undefined); // Silently ignore duplicate
    }

    this._tags.push(tag);
    this._updatedAt = new Date();

    return ok(undefined);
  }

  /**
   * Removes tag (validates min 1 remains)
   */
  removeTag(rawTag: string): Result<void> {
    const tagResult = RuleTag.create(rawTag);
    if (!tagResult.isSuccess) {
      return fail(tagResult.error!);
    }

    if (this._tags.length <= 1) {
      return fail('Cannot remove last tag - at least one tag is required');
    }

    const tag = tagResult.getValue()!;
    this._tags = this._tags.filter(t => !t.equals(tag));
    this._updatedAt = new Date();

    return ok(undefined);
  }

  /**
   * Adds code snippet (Good or Bad example)
   */
  addCodeSnippet(snippet: CodeSnippet): Result<void> {
    this._codeSnippets.push(snippet);
    this._updatedAt = new Date();
    return ok(undefined);
  }

  /**
   * Removes code snippet (validates min 1 Good + 1 Bad remain)
   */
  removeCodeSnippet(snippetId: string): Result<void> {
    const snippet = this._codeSnippets.find(s => s.id === snippetId);
    if (!snippet) {
      return fail('Code snippet not found');
    }

    // Count Good and Bad examples after removal
    const remaining = this._codeSnippets.filter(s => s.id !== snippetId);
    const goodCount = remaining.filter(s => s.type === 'GoodExample').length;
    const badCount = remaining.filter(s => s.type === 'BadExample').length;

    if (goodCount === 0) {
      return fail('Cannot remove last Good Example - at least one is required');
    }

    if (badCount === 0) {
      return fail('Cannot remove last Bad Example - at least one is required');
    }

    this._codeSnippets = remaining;
    this._updatedAt = new Date();

    return ok(undefined);
  }

  // ============ Readonly Getters ============

  get code(): string { return this._code; }
  get title(): string { return this._title; }
  get description(): string { return this._description; }
  get severity(): RuleSeverity { return this._severity; }
  get status(): RuleStatus { return this._status; }
  get deprecationReason(): string | undefined { return this._deprecationReason; }
  get replacementRuleId(): RuleId | undefined { return this._replacementRuleId; }
  get liveReferenceLocation(): string | undefined { return this._liveReferenceLocation; }
  get tags(): ReadonlyArray<RuleTag> { return this._tags; }
  get codeSnippets(): ReadonlyArray<CodeSnippet> { return this._codeSnippets; }
  get authorId(): string { return this._authorId; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
}
