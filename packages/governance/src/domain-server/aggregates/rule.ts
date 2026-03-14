/**
 * Rule Aggregate Root - Domain Server
 * 规则聚合根 - 领域服务端
 *
 * 【业务职责】
 * 表示一条架构规则，其完整的生命周期管理和业务规则强制执行：
 * - 规则的创建、激活、更新、废弃、重新激活
 * - 严重程度（Mandatory/Recommended）管理
 * - 标签和代码示例管理
 * - 状态机约束（Draft → Active → Deprecated）
 *
 * 【DDD 模式示范】
 * 本聚合根作为 Governance 模块的样例，展示了以下 DDD 最佳实践：
 * ✅ Props Object 模式：CreateRuleProps, UpdateRuleProps
 * ✅ 私有构造函数 + 工厂方法：Rule.create()
 * ✅ 私有状态对象 + readonly getters：_props: RuleState
 * ✅ 状态机强制：RuleStatus.canTransitionTo()
 * ✅ 领域事件发布：rule:created, rule:updated, rule:deprecated, etc.
 * ✅ Result<T> 模式：所有业务方法返回 Result
 * ✅ 防御性校验：参数合法性、业务规则约束
 *
 * 【状态机规则】
 * - Draft → Active: 激活规则
 * - Active → Deprecated: 仅允许 Recommended 规则废弃（Mandatory 必须先降级）
 * - Deprecated → Active: 重新激活
 * - Draft → Deprecated: ❌ 禁止（草稿必须先激活）
 *
 * 【不可变性保证】
 * - 所有修改通过业务方法进行，不暴露 setters
 * - 数组/对象防御性复制
 * - 每次修改自动更新 updatedAt 时间戳
 *
 * @see {@link CreateRuleProps} 创建规则的参数对象
 * @see {@link UpdateRuleProps} 更新规则的参数对象
 * @see {@link RuleStatus} 状态转换规则
 */

import { AggregateRoot } from '@dailyuse/utils';
import { RuleId } from '../../domain-shared/value-objects/rule-id';
import { RuleTag } from '../../domain-shared/value-objects/rule-tag';
import { CodeSnippet } from '../../domain-shared/value-objects/code-snippet';
import { RuleStatus } from '../../domain-shared/value-objects/rule-status';
import { RuleSeverity } from '../../domain-shared/value-objects/rule-severity';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { RuleClientDTO } from '../../contracts/aggregates/rule-client';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import type { GovernanceEventMap } from '../../contracts/protocol/governance-event-map';
import type { Language } from '../../domain-shared/value-objects/language';

// ================= Props Objects（参数对象模式） =================

/**
 * Props object for creating a new Rule aggregate.
 * 创建规则的参数对象。
 *
 * Benefits of Props Object pattern:
 * - Clear parameter names avoid positional confusion
 * - Easy to extend without breaking existing call sites
 * - Centralized validation logic
 *
 * Props Object 模式的优势：
 * - 参数清晰，避免位置混淆
 * - 易于扩展，新增参数不破坏现有调用
 * - 便于验证，集中校验逻辑
 *
 * @internal Used by Rule.create() factory method. Consumers should use the factory.
 * @internal 供 Rule.create() 工厂方法使用，消费者应使用工厂方法。
 */
export interface CreateRuleProps {
  /** 规则编码，格式：PREFIX-NUMBER (例如：DDD-001) */
  code: string;

  /** 规则标题，长度：3-100 字符 */
  title: string;

  /** 规则描述，长度：10-5000 字符，支持 Markdown 格式 */
  description: string;

  /** 严重程度：Mandatory（强制执行）或 Recommended（推荐遵守） */
  severity: RuleSeverity;

  /** 标签列表，将自动规范化为 lowercase-kebab-case */
  tags: string[];

  /** Good Example 代码示例列表（至少 1 个） */
  goodExamples: Array<{ language: Language; content: string; caption?: string }>;

  /** Bad Example 代码示例列表（至少 1 个） */
  badExamples: Array<{ language: Language; content: string; caption?: string }>;

  /** 实际应用位置（可选），例如：'packages/domain-server/src/account/aggregates/account.ts' */
  liveReferenceLocation?: string;

  /** 创建人 ID */
  authorId: IdentityId;
}

/**
 * Props object for updating an existing Rule aggregate.
 * 更新规则的参数对象。
 *
 * All fields are optional — only specified fields are updated.
 * 所有字段为可选，仅更新指定的字段。
 *
 * @internal Used by Rule.update() method. Consumers should use the method directly.
 * @internal 供 Rule.update() 方法使用，消费者应直接使用该方法。
 */
export interface UpdateRuleProps {
  /** 更新标题 */
  title?: string;

  /** 更新描述 */
  description?: string;

  /** 更新标签列表 */
  tags?: string[];

  /** 更新实际应用位置 */
  liveReferenceLocation?: string;
}

// ================= 内部状态（私有backing字段） =================

/**
 * Rule aggregate internal state — used to hydrate from persistence via `Rule.load()`.
 * Uses domain types (value objects), not DTOs.
 *
 * 规则聚合根内部状态 — 用于通过 `Rule.load()` 从持久化层恢复。
 * 使用领域类型（值对象），而非 DTO。
 *
 * @internal Hydration state for repository mappers only. Not part of the public API.
 * @internal 仅供仓储映射器使用的水化状态，非公开 API。
 */
export interface RuleState {
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
  authorId: IdentityId;
  createdAt: Date;
  updatedAt: Date;
}

// ================= 聚合根实现 =================

/**
 * Rule 聚合根类
 *
 * 【设计原则】
 * - 所有业务逻辑集中在此聚合根中
 * - 状态变更只能通过业务方法进行
 * - 每个业务方法返回 Result<T>，表示成功或失败
 * - 状态变更自动触发领域事件
 * - 使用值对象（RuleTag, CodeSnippet）封装验证逻辑
 */
export class Rule extends AggregateRoot<RuleId> {
  private _props: RuleState;

  // ================= 构造函数（私有） =================
  // 外部不能直接 new Rule()，必须通过工厂方法创建

  private constructor(state: RuleState) {
    super(state.id);
    this._props = {
      ...state,
      tags: [...state.tags],
      codeSnippets: [...state.codeSnippets],
    };
  }

  // ================= 工厂方法（Factory Methods） =================

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
      return error('VALIDATION_ERROR', 'Code must match pattern: PREFIX-NUMBER (e.g., DDD-001)');
    }

    // Validate title length
    if (props.title.length < 3 || props.title.length > 100) {
      return error('VALIDATION_ERROR', 'Title must be 3-100 characters');
    }

    // Validate description length
    if (props.description.length < 10 || props.description.length > 5000) {
      return error('VALIDATION_ERROR', 'Description must be 10-5000 characters');
    }

    // Validate min 1 tag
    if (props.tags.length === 0) {
      return error('VALIDATION_ERROR', 'At least one tag is required');
    }

    // Normalize tags
    const tags: RuleTag[] = [];
    for (const rawTag of props.tags) {
      const tagResult = RuleTag.create(rawTag);
      if (!tagResult.ok) {
        return error(tagResult.error.code, tagResult.error.message, tagResult.error.details);
      }
      tags.push(tagResult.data);
    }

    // Validate and create Good examples (min 1)
    if (props.goodExamples.length === 0) {
      return error('VALIDATION_ERROR', 'At least one Good Example is required');
    }
    const goodSnippets: CodeSnippet[] = [];
    for (const example of props.goodExamples) {
      const snippetResult = CodeSnippet.create({
        ...example,
        type: 'GoodExample',
        caption: example.caption ?? null,
      });

      if (!snippetResult.ok) {
        return error(
          snippetResult.error.code,
          snippetResult.error.message,
          snippetResult.error.details,
        );
      }

      goodSnippets.push(snippetResult.data);
    }

    // Validate and create Bad examples (min 1)
    if (props.badExamples.length === 0) {
      return error('VALIDATION_ERROR', 'At least one Bad Example is required');
    }
    const badSnippets: CodeSnippet[] = [];
    for (const example of props.badExamples) {
      const snippetResult = CodeSnippet.create({
        ...example,
        type: 'BadExample',
        caption: example.caption ?? null,
      });

      if (!snippetResult.ok) {
        return error(
          snippetResult.error.code,
          snippetResult.error.message,
          snippetResult.error.details,
        );
      }

      badSnippets.push(snippetResult.data);
    }

    const codeSnippets = [...goodSnippets, ...badSnippets];

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
    rule.addDomainEvent<GovernanceEventMap['governance:rule-created']>('governance:rule-created', {
      code: rule._props.code,
      title: rule._props.title,
      severity: rule._props.severity,
      tags: rule._props.tags.map((tag) => tag.value),
      authorId: rule._props.authorId,
    });

    return ok(rule);
  }

  /**
   * Restores Rule from persisted state (no validation, no events)
   */
  static load(state: RuleState): Rule {
    return new Rule(state);
  }

  // ============ Lifecycle Methods ============

  /**
   * Publishes rule (Draft → Active)
   */
  activate(): Result<void> {
    const transitionResult = RuleStatus.canTransitionTo(this._props.status, RuleStatus.Active, {
      severity: this._props.severity,
    });

    if (!transitionResult.ok) {
      return error(
        transitionResult.error.code,
        transitionResult.error.message,
        transitionResult.error.details,
      );
    }

    const oldStatus = this._props.status;
    this._props.status = RuleStatus.Active;
    this._props.updatedAt = new Date();

    this.addDomainEvent<GovernanceEventMap['governance:rule-status-changed']>(
      'governance:rule-status-changed',
      {
        ruleId: this.id,
        code: this._props.code,
        previousStatus: oldStatus,
        newStatus: RuleStatus.Active,
      },
    );

    return ok(undefined);
  }

  /**
   * Deprecates rule (Active → Deprecated)
   */
  deprecate(reason: string, replacementRuleId?: RuleId): Result<void> {
    const transitionResult = RuleStatus.canTransitionTo(this._props.status, RuleStatus.Deprecated, {
      severity: this._props.severity,
    });

    if (!transitionResult.ok) {
      return error(
        transitionResult.error.code,
        transitionResult.error.message,
        transitionResult.error.details,
      );
    }

    if (!reason || reason.trim().length === 0) {
      return error('VALIDATION_ERROR', 'Deprecation reason is required');
    }

    if (reason.length < 10 || reason.length > 500) {
      return error('VALIDATION_ERROR', 'Deprecation reason must be 10-500 characters');
    }

    this._props.status = RuleStatus.Deprecated;
    this._props.deprecationReason = reason;
    this._props.replacementRuleId = replacementRuleId;
    this._props.updatedAt = new Date();

    this.addDomainEvent<GovernanceEventMap['governance:rule-deprecated']>(
      'governance:rule-deprecated',
      {
        ruleId: this.id,
        code: this._props.code,
        reason,
        replacementRuleId,
      },
    );

    return ok(undefined);
  }

  /**
   * Reactivates deprecated rule (Deprecated → Active)
   */
  reactivate(): Result<void> {
    const transitionResult = RuleStatus.canTransitionTo(this._props.status, RuleStatus.Active, {
      severity: this._props.severity,
    });

    if (!transitionResult.ok) {
      return error(
        transitionResult.error.code,
        transitionResult.error.message,
        transitionResult.error.details,
      );
    }

    this._props.status = RuleStatus.Active;
    this._props.deprecationReason = undefined;
    this._props.replacementRuleId = undefined;
    this._props.updatedAt = new Date();

    this.addDomainEvent<GovernanceEventMap['governance:rule-reactivated']>(
      'governance:rule-reactivated',
      {
        ruleId: this.id,
        code: this._props.code,
        title: this._props.title,
      },
    );

    return ok(undefined);
  }

  // ============ Mutation Methods ============

  /**
   * Updates rule content (title, description, tags, live reference).
   * Atomic: validates all fields first, then applies mutations only if all pass.
   *
   * 更新规则内容（标题、描述、标签、实际引用位置）。
   * 原子性：先校验所有字段，仅当全部通过后才应用变更。
   *
   * Emits: governance:rule-updated event
   */
  update(props: UpdateRuleProps): Result<void> {
    // ---- Phase 1: Validate all fields (no mutations) ----

    const changedFields: string[] = [];
    let validatedTitle: string | undefined;
    let validatedDescription: string | undefined;
    let validatedTags: RuleTag[] | undefined;

    if (props.title !== undefined) {
      if (props.title.length < 3 || props.title.length > 100) {
        return error('VALIDATION_ERROR', 'Title must be 3-100 characters');
      }
      validatedTitle = props.title;
      changedFields.push('title');
    }

    if (props.description !== undefined) {
      if (props.description.length < 10 || props.description.length > 5000) {
        return error('VALIDATION_ERROR', 'Description must be 10-5000 characters');
      }
      validatedDescription = props.description;
      changedFields.push('description');
    }

    if (props.tags !== undefined) {
      if (props.tags.length === 0) {
        return error('VALIDATION_ERROR', 'At least one tag is required');
      }
      const tagResults = props.tags.map(RuleTag.create);
      const failedTag = tagResults.find((result) => !result.ok);
      if (failedTag && !failedTag.ok) {
        return error(failedTag.error.code, failedTag.error.message, failedTag.error.details);
      }

      validatedTags = [];
      for (const tagResult of tagResults) {
        if (tagResult.ok) {
          validatedTags.push(tagResult.data);
        }
      }
      changedFields.push('tags');
    }

    if (props.liveReferenceLocation !== undefined) {
      changedFields.push('liveReferenceLocation');
    }

    // ---- Phase 2: Apply all mutations (all validations passed) ----

    if (changedFields.length === 0) {
      return ok(undefined);
    }

    if (validatedTitle !== undefined) {
      this._props.title = validatedTitle;
    }
    if (validatedDescription !== undefined) {
      this._props.description = validatedDescription;
    }
    if (validatedTags !== undefined) {
      this._props.tags = validatedTags;
    }
    if (props.liveReferenceLocation !== undefined) {
      this._props.liveReferenceLocation = props.liveReferenceLocation;
    }

    this._props.updatedAt = new Date();

    const eventPayload: GovernanceEventMap['governance:rule-updated'] = {
      ruleId: this.id,
      changedFields,
    };

    if (validatedTitle !== undefined) {
      eventPayload.title = this._props.title;
    }

    if (validatedTags !== undefined) {
      eventPayload.tags = this._props.tags.map((tag) => tag.value);
    }

    this.addDomainEvent<GovernanceEventMap['governance:rule-updated']>(
      'governance:rule-updated',
      eventPayload,
    );

    return ok(undefined);
  }

  /**
   * Changes severity level.
   * 变更严重级别。
   *
   * Cannot change severity of a Deprecated rule — reactivate first.
   * 不能变更已废弃规则的严重级别 — 需先重新激活。
   *
   * Emits: governance:rule-severity-changed event
   */
  changeSeverity(newSeverity: RuleSeverity): Result<void> {
    if (this._props.status === RuleStatus.Deprecated) {
      return error(
        'BUSINESS_ERROR',
        'Cannot change severity of a Deprecated rule. Reactivate the rule first.',
      );
    }

    if (this._props.severity === newSeverity) {
      return ok(undefined); // No change needed. 无需变更。
    }

    const previousSeverity = this._props.severity;
    this._props.severity = newSeverity;
    this._props.updatedAt = new Date();

    this.addDomainEvent<GovernanceEventMap['governance:rule-severity-changed']>(
      'governance:rule-severity-changed',
      {
        ruleId: this.id,
        code: this._props.code,
        previousSeverity,
        newSeverity,
      },
    );

    return ok(undefined);
  }

  /**
   * Adds normalized tag (prevents duplicates)
   */
  addTag(rawTag: string): Result<void> {
    const tagResult = RuleTag.create(rawTag);
    if (!tagResult.ok) {
      return error(tagResult.error.code, tagResult.error.message, tagResult.error.details);
    }

    const tag = tagResult.data;

    // Check for duplicates
    const exists = this._props.tags.some((t) => t.equals(tag));
    if (exists) {
      return ok(undefined); // Silently ignore duplicate
    }

    this._props.tags.push(tag);
    this._props.updatedAt = new Date();

    return ok(undefined);
  }

  /**
   * Removes tag (validates min 1 remains).
   * 移除标签（确保至少保留 1 个）。
   *
   * No-op if the tag does not exist on the rule.
   * 若标签不存在于规则上，则无操作。
   */
  removeTag(rawTag: string): Result<void> {
    const tagResult = RuleTag.create(rawTag);
    if (!tagResult.ok) {
      return error(tagResult.error.code, tagResult.error.message, tagResult.error.details);
    }

    const tag = tagResult.data;

    // Check if tag actually exists before applying removal. 移除前检查标签是否存在。
    const tagExists = this._props.tags.some((t) => t.equals(tag));
    if (!tagExists) {
      return ok(undefined); // Tag not present — no-op. 标签不存在 — 无操作。
    }

    if (this._props.tags.length <= 1) {
      return error('BUSINESS_ERROR', 'Cannot remove last tag - at least one tag is required');
    }

    this._props.tags = this._props.tags.filter((t) => !t.equals(tag));
    this._props.updatedAt = new Date();

    return ok(undefined);
  }

  /** Maximum number of code snippets per rule. 每条规则最大代码片段数。 */
  private static readonly MAX_CODE_SNIPPETS = 20;

  /**
   * Adds code snippet (Good or Bad example).
   * 添加代码示例（Good 或 Bad）。
   *
   * Validates:
   * - No duplicate snippet IDs. 不允许重复 ID。
   * - Maximum 20 snippets per rule. 每条规则最多 20 个片段。
   */
  addCodeSnippet(snippet: CodeSnippet): Result<void> {
    // Check for duplicate snippet ID. 检查 ID 是否重复。
    const duplicate = this._props.codeSnippets.some((s) => s.id === snippet.id);
    if (duplicate) {
      return error('BUSINESS_ERROR', `Code snippet with ID '${snippet.id}' already exists`);
    }

    // Check upper bound. 检查上限。
    if (this._props.codeSnippets.length >= Rule.MAX_CODE_SNIPPETS) {
      return error(
        'BUSINESS_ERROR',
        `Cannot add more than ${Rule.MAX_CODE_SNIPPETS} code snippets per rule`,
      );
    }

    this._props.codeSnippets.push(snippet);
    this._props.updatedAt = new Date();
    return ok(undefined);
  }

  /**
   * Removes code snippet (validates min 1 Good + 1 Bad remain)
   */
  removeCodeSnippet(snippetId: string): Result<void> {
    const snippet = this._props.codeSnippets.find((s) => s.id === snippetId);
    if (!snippet) {
      return error('NOT_FOUND', 'Code snippet not found');
    }

    // Count Good and Bad examples after removal
    const remaining = this._props.codeSnippets.filter((s) => s.id !== snippetId);
    const goodCount = remaining.filter((s) => s.type === 'GoodExample').length;
    const badCount = remaining.filter((s) => s.type === 'BadExample').length;

    if (goodCount === 0) {
      return error('BUSINESS_ERROR', 'Cannot remove last Good Example - at least one is required');
    }

    if (badCount === 0) {
      return error('BUSINESS_ERROR', 'Cannot remove last Bad Example - at least one is required');
    }

    this._props.codeSnippets = remaining;
    this._props.updatedAt = new Date();

    return ok(undefined);
  }

  // ============ Readonly Getters ============

  get code(): string {
    return this._props.code;
  }
  get title(): string {
    return this._props.title;
  }
  get description(): string {
    return this._props.description;
  }
  get severity(): RuleSeverity {
    return this._props.severity;
  }
  get status(): RuleStatus {
    return this._props.status;
  }
  get deprecationReason(): string | null {
    return this._props.deprecationReason ?? null;
  }
  get replacementRuleId(): RuleId | null {
    return this._props.replacementRuleId ?? null;
  }
  get liveReferenceLocation(): string | null {
    return this._props.liveReferenceLocation ?? null;
  }
  get tags(): ReadonlyArray<RuleTag> {
    return [...this._props.tags];
  }
  get codeSnippets(): ReadonlyArray<CodeSnippet> {
    return [...this._props.codeSnippets];
  }
  get goodExamples(): ReadonlyArray<CodeSnippet> {
    return this._props.codeSnippets.filter((snippet) => snippet.isGoodExample);
  }
  get badExamples(): ReadonlyArray<CodeSnippet> {
    return this._props.codeSnippets.filter((snippet) => snippet.isBadExample);
  }
  get authorId(): IdentityId {
    return this._props.authorId;
  }
  get createdAt(): Date {
    return new Date(this._props.createdAt.getTime());
  }
  get updatedAt(): Date {
    return new Date(this._props.updatedAt.getTime());
  }

  // ================= 序列化方法 =================

  /**
   * 转换为 Client DTO（用于 API 响应）
   */
  toClientDTO(): RuleClientDTO {
    return {
      id: this.id,
      code: this._props.code,
      title: this._props.title,
      description: this._props.description,
      severity: this._props.severity,
      status: this._props.status,
      deprecationReason: this._props.deprecationReason ?? null,
      replacementRuleId: this._props.replacementRuleId ?? null,
      liveReferenceLocation: this._props.liveReferenceLocation ?? null,
      tags: this._props.tags.map((tag) => tag.toDTO()),
      goodExamples: this.goodExamples.map((snippet) => snippet.toDTO()),
      badExamples: this.badExamples.map((snippet) => snippet.toDTO()),
      authorId: this._props.authorId,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
    };
  }
}
