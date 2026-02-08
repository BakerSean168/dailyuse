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
 * ✅ 私有backing字段 + readonly getters：_code, _title, etc.
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
import type { RuleServer, RulePersistenceDTO } from '../../contracts/aggregates/rule-server';
import type { RuleClientDTO } from '../../contracts/aggregates/rule-client';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import type { GovernanceEventMap } from '../../contracts/protocol/governance-event-map';

// ================= Props Objects（参数对象模式） =================

/**
 * 创建规则的参数对象
 * 
 * 使用 Props Object 模式的优势：
 * - 参数清晰，避免位置混淆
 * - 易于扩展，新增参数不破坏现有调用
 * - 便于验证，集中校验逻辑
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
  goodExamples: Array<{ language: string; content: string; caption?: string }>;
  
  /** Bad Example 代码示例列表（至少 1 个） */
  badExamples: Array<{ language: string; content: string; caption?: string }>;
  
  /** 实际应用位置（可选），例如：'packages/domain-server/src/account/aggregates/account.ts' */
  liveReferenceLocation?: string;
  
  /** 创建人 ID */
  authorId: string;
}

/**
 * 更新规则的参数对象
 * 
 * 所有字段为可选，仅更新指定的字段
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
 * Rule 的内部 Props 结构
 * 
 * 仅用于内部状态管理，外部通过业务方法或 readonly getters 访问
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
export class Rule extends AggregateRoot<RuleId> implements RuleServer {
  // ================= 私有 backing 字段 =================
  // 遵循 DDD 原则：封装内部状态，仅通过 readonly getters 暴露
  
  /** 规则编码（不可变） */
  private _code: string;
  
  /** 规则标题 */
  private _title: string;
  
  /** 规则描述 */
  private _description: string;
  
  /** 严重程度 */
  private _severity: RuleSeverity;
  
  /** 规则状态（受状态机约束）*/
  private _status: RuleStatus;
  
  /** 废弃原因（仅当状态为 Deprecated 时有值） */
  private _deprecationReason?: string;
  
  /** 替代规则 ID（仅当状态为 Deprecated 时有值） */
  private _replacementRuleId?: RuleId;
  
  /** 实际应用位置 */
  private _liveReferenceLocation?: string;
  
  /** 标签列表（值对象数组） */
  private _tags: RuleTag[];
  
  /** 代码示例列表（值对象数组） */
  private _codeSnippets: CodeSnippet[];
  
  /** 创建人 ID（不可变） */
  private readonly _authorId: IdentityId;
  
  /** 创建时间（不可变） */
  private readonly _createdAt: Date;
  
  /** 更新时间（每次修改自动更新） */
  private _updatedAt: Date;

  // ================= 构造函数（私有） =================
  // 外部不能直接 new Rule()，必须通过工厂方法创建
  
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
    const tagResults = props.tags.map(RuleTag.create);
    const failedTag = tagResults.find(r => !r.ok);
    if (failedTag) {
      return failedTag as any;
    }
    const tags = tagResults.filter(r => r.ok).map(r => (r as any).data);

    // Validate and create Good examples (min 1)
    if (props.goodExamples.length === 0) {
      return error('VALIDATION_ERROR', 'At least one Good Example is required');
    }
    const goodSnippetResults = props.goodExamples.map(ex => 
      CodeSnippet.create({ 
        ...ex, 
        type: 'GoodExample' as any, 
        language: ex.language as any,
        caption: ex.caption ?? null
      })
    );
    const failedGood = goodSnippetResults.find(r => !r.ok);
    if (failedGood) {
      return failedGood as any;
    }

    // Validate and create Bad examples (min 1)
    if (props.badExamples.length === 0) {
      return error('VALIDATION_ERROR', 'At least one Bad Example is required');
    }
    const badSnippetResults = props.badExamples.map(ex => 
      CodeSnippet.create({ 
        ...ex, 
        type: 'BadExample' as any, 
        language: ex.language as any,
        caption: ex.caption ?? null
      })
    );
    const failedBad = badSnippetResults.find(r => !r.ok);
    if (failedBad) {
      return failedBad as any;
    }

    const codeSnippets = [
      ...goodSnippetResults.filter(r => r.ok).map(r => (r as any).data),
      ...badSnippetResults.filter(r => r.ok).map(r => (r as any).data),
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
      authorId: props.authorId as IdentityId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Emit domain event
    rule.addDomainEvent<GovernanceEventMap['governance:rule-created']>('governance:rule-created', {
      code: rule._code,
      title: rule._title,
      severity: rule._severity,
      tags: rule._tags.map(tag => tag.value),
      authorId: rule._authorId,
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
    const transitionResult = RuleStatus.canTransitionTo(
      this._status,
      RuleStatus.Active,
      { severity: this._severity }
    );

    if (!transitionResult.ok) {
      return transitionResult as any;
    }

    const oldStatus = this._status;
    this._status = RuleStatus.Active;
    this._updatedAt = new Date();

    this.addDomainEvent<GovernanceEventMap['governance:rule-status-changed']>('governance:rule-status-changed', {
      ruleId: this.id,
      code: this._code,
      previousStatus: oldStatus,
      newStatus: RuleStatus.Active,
    });

    return ok(undefined);
  }

  /**
   * Deprecates rule (Active → Deprecated)
   */
  deprecate(reason: string, replacementRuleId?: RuleId): Result<void> {
    const transitionResult = RuleStatus.canTransitionTo(
      this._status,
      RuleStatus.Deprecated,
      { severity: this._severity }
    );

    if (!transitionResult.ok) {
      return transitionResult as any;
    }

    if (!reason || reason.trim().length === 0) {
      return error('VALIDATION_ERROR', 'Deprecation reason is required');
    }

    if (reason.length < 10 || reason.length > 500) {
      return error('VALIDATION_ERROR', 'Deprecation reason must be 10-500 characters');
    }

    this._status = RuleStatus.Deprecated;
    this._deprecationReason = reason;
    this._replacementRuleId = replacementRuleId;
    this._updatedAt = new Date();

    this.addDomainEvent<GovernanceEventMap['governance:rule-deprecated']>('governance:rule-deprecated', {
      ruleId: this.id,
      code: this._code,
      reason,
      replacementRuleId,
    });

    return ok(undefined);
  }

  /**
   * Reactivates deprecated rule (Deprecated → Active)
   */
  reactivate(): Result<void> {
    const transitionResult = RuleStatus.canTransitionTo(
      this._status,
      RuleStatus.Active,
      { severity: this._severity }
    );

    if (!transitionResult.ok) {
      return transitionResult as any;
    }

    this._status = RuleStatus.Active;
    this._deprecationReason = undefined;
    this._replacementRuleId = undefined;
    this._updatedAt = new Date();

    this.addDomainEvent<GovernanceEventMap['governance:rule-reactivated']>('governance:rule-reactivated', {
      ruleId: this.id,
      code: this._code,
      title: this._title,
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
        return error('VALIDATION_ERROR', 'Title must be 3-100 characters');
      }
      this._title = props.title;
      changedFields.push('title');
    }

    if (props.description) {
      if (props.description.length < 10 || props.description.length > 5000) {
        return error('VALIDATION_ERROR', 'Description must be 10-5000 characters');
      }
      this._description = props.description;
      changedFields.push('description');
    }

    if (props.tags) {
      if (props.tags.length === 0) {
        return error('VALIDATION_ERROR', 'At least one tag is required');
      }
      const tagResults =props.tags.map(RuleTag.create);
      const failedTag = tagResults.find(r => !r.ok);
      if (failedTag) {
        return failedTag as any;
      }
      this._tags = tagResults.filter(r => r.ok).map(r => (r as any).data);
      changedFields.push('tags');
    }

    if (props.liveReferenceLocation !== undefined) {
      this._liveReferenceLocation = props.liveReferenceLocation;
      changedFields.push('liveReferenceLocation');
    }

    if (changedFields.length > 0) {
      this._updatedAt = new Date();

      const eventPayload: GovernanceEventMap['governance:rule-updated'] = {
        ruleId: this.id,
        changedFields,
      };
      
      if (props.title) {
        eventPayload.title = this._title;
      }
      
      if (props.tags) {
        eventPayload.tags = this._tags.map(tag => tag.value);
      }

      this.addDomainEvent<GovernanceEventMap['governance:rule-updated']>('governance:rule-updated', eventPayload);
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
    if (!tagResult.ok) {
      return tagResult as any;
    }

    const tag = (tagResult as any).data;
    
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
    if (!tagResult.ok) {
      return tagResult as any;
    }

    if (this._tags.length <= 1) {
      return error('BUSINESS_ERROR', 'Cannot remove last tag - at least one tag is required');
    }

    const tag = (tagResult as any).data;
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
      return error('NOT_FOUND', 'Code snippet not found');
    }

    // Count Good and Bad examples after removal
    const remaining = this._codeSnippets.filter(s => s.id !== snippetId);
    const goodCount = remaining.filter(s => s.type === 'GoodExample').length;
    const badCount = remaining.filter(s => s.type === 'BadExample').length;

    if (goodCount === 0) {
      return error('BUSINESS_ERROR', 'Cannot remove last Good Example - at least one is required');
    }

    if (badCount === 0) {
      return error('BUSINESS_ERROR', 'Cannot remove last Bad Example - at least one is required');
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
  get deprecationReason(): string | null { return this._deprecationReason ?? null; }
  get replacementRuleId(): RuleId | null { return this._replacementRuleId ?? null; }
  get liveReferenceLocation(): string | null { return this._liveReferenceLocation ?? null; }
  get tags(): RuleTag[] { return this._tags; }
  get codeSnippets(): ReadonlyArray<CodeSnippet> { return this._codeSnippets; }
  get goodExamples(): CodeSnippet[] { 
    return this._codeSnippets.filter(snippet => snippet.isGoodExample); 
  }
  get badExamples(): CodeSnippet[] { 
    return this._codeSnippets.filter(snippet => snippet.isBadExample); 
  }
  get authorId(): IdentityId { return this._authorId; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  // ================= 序列化方法 =================

  /**
   * 转换为 Client DTO（用于 API 响应）
   */
  toClientDTO(): RuleClientDTO {
    return {
      id: this.id,
      code: this._code,
      title: this._title,
      description: this._description,
      severity: this._severity,
      status: this._status,
      deprecationReason: this._deprecationReason ?? null,
      replacementRuleId: this._replacementRuleId ?? null,
      liveReferenceLocation: this._liveReferenceLocation ?? null,
      tags: this._tags.map(tag => tag.toDTO()),
      goodExamples: this.goodExamples.map(snippet => snippet.toDTO()),
      badExamples: this.badExamples.map(snippet => snippet.toDTO()),
      authorId: this._authorId,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  /**
   * 转换为 Persistence DTO（用于数据库存储）
   */
  toPersistenceDTO(): RulePersistenceDTO {
    return {
      id: this.id,
      code: this._code,
      title: this._title,
      description: this._description,
      severity: this._severity,
      status: this._status,
      deprecationReason: this._deprecationReason ?? null,
      replacementRuleId: this._replacementRuleId ?? null,
      liveReferenceLocation: this._liveReferenceLocation ?? null,
      tags: JSON.stringify(this._tags.map(tag => tag.value)),
      goodExamples: JSON.stringify(this.goodExamples.map(snippet => snippet.toPersistenceDTO())),
      badExamples: JSON.stringify(this.badExamples.map(snippet => snippet.toPersistenceDTO())),
      authorId: this._authorId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
 
  }
}
