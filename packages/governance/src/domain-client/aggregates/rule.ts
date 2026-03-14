/**
 * Rule Aggregate Root - Domain Client
 * 规则聚合根 - 客户端领域
 *
 * Provides client-side rule capabilities:
 * - Rule browsing and search
 * - UI display logic (formatting, status labels)
 * - Optimistic update support
 *
 * 提供客户端规则功能：
 * - 规则浏览和搜索
 * - UI 展示逻辑（格式化、状态标签）
 * - 乐观更新支持
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { RuleClientDTO } from '../../contracts/aggregates/rule-client';
import type { RuleStatus } from '../../contracts/value-objects/rule-status';
import type { RuleSeverity } from '../../contracts/value-objects/rule-severity';
import { AggregateRoot } from '@dailyuse/utils';
import type { RuleId } from '../../contracts/primitives/ids';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import { CodeSnippet } from '../../domain-shared/value-objects/code-snippet';
import { RuleTag } from '../../domain-shared/value-objects/rule-tag';

// ================= Internal State Interface =================
// ================= 内部状态接口 =================

/**
 * Internal state for the Rule client-side aggregate.
 * 规则客户端聚合根的内部状态。
 *
 * @internal Hydration state for client-side mappers only. Not part of the public API.
 * @internal 仅供客户端映射器使用的水化状态，非公开 API。
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
// ================= 聚合根实现 =================

/**
 * Rule Aggregate Root - Client side.
 * 规则聚合根 - 客户端。
 *
 * Provides a client-side view of a rule, supporting:
 * - Instance creation from API responses
 * - UI helper methods (status formatting, tag filtering)
 * - Data conversion (toDTO)
 *
 * 提供规则的客户端视图，支持：
 * - 从 API 响应创建实例
 * - UI 辅助方法（状态格式化、标签过滤）
 * - 数据转换（toDTO）
 */
export class Rule extends AggregateRoot<RuleId> {
  private readonly _props: RuleState;

  // ================= Constructor (Private) =================
  // ================= 私有构造函数 =================

  private constructor(state: RuleState) {
    super(state.id);
    this._props = state;
  }

  // ================= Public Properties (Getters) =================
  // ================= 公开属性（Getter） =================

  /**
   * Rule code (e.g. DDD-001).
   * 规则代码（例如 DDD-001）。
   */
  get code(): string {
    return this._props.code;
  }

  /** Rule title. 规则标题。 */
  get title(): string {
    return this._props.title;
  }

  /** Rule description. 规则描述。 */
  get description(): string {
    return this._props.description;
  }

  /** Severity level: Mandatory or Recommended. 严重级别：强制或推荐。 */
  get severity(): RuleSeverity {
    return this._props.severity;
  }

  /** Rule status: Draft, Active, or Deprecated. 规则状态：草稿、生效或已废弃。 */
  get status(): RuleStatus {
    return this._props.status;
  }

  /** Deprecation reason (only set when status is Deprecated). 废弃原因（仅在状态为"已废弃"时设置）。 */
  get deprecationReason(): string | null {
    return this._props.deprecationReason;
  }

  /** Replacement rule ID (only set when status is Deprecated). 替代规则 ID（仅在状态为"已废弃"时设置）。 */
  get replacementRuleId(): RuleId | null {
    return this._props.replacementRuleId;
  }

  /** Live reference location in code (file path or URL). 代码中的实时参考位置（文件路径或 URL）。 */
  get liveReferenceLocation(): string | null {
    return this._props.liveReferenceLocation;
  }

  /** Tag list (e.g. ['ddd', 'entity', 'value-object']). 标签列表（例如 ['ddd', 'entity', 'value-object']）。 */
  get tags(): ReadonlyArray<RuleTag> {
    return [...this._props.tags];
  }

  /** Code snippet list (good examples and bad examples). 代码片段列表（好示例和坏示例）。 */
  get codeSnippets(): ReadonlyArray<CodeSnippet> {
    return [...this._props.codeSnippets];
  }

  /** Author identity ID. 作者身份 ID。 */
  get authorId(): IdentityId {
    return this._props.authorId;
  }

  /** Creation timestamp. 创建时间戳。 */
  get createdAt(): Date {
    return this._props.createdAt;
  }

  /** Last updated timestamp. 上次更新时间戳。 */
  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  // ================= UI Helper Methods =================
  // ================= UI 辅助方法 =================

  /**
   * Returns the display label for the current status.
   * 返回当前状态的显示标签。
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
   * 返回严重级别的显示标签。
   *
   * @example
   * rule.displaySeverity // 'Mandatory'
   */
  get displaySeverity(): string {
    const severityMap: Record<RuleSeverity, string> = {
      Mandatory: '强制执行',
      Recommended: '建议遵守',
    };
    return severityMap[this._props.severity];
  }

  /**
   * Returns the UI label color for the severity level.
   * 返回严重级别的 UI 标签颜色。
   *
   * @returns 'error' | 'warning'
   */
  get severityColor(): 'error' | 'warning' {
    return this._props.severity === 'Mandatory' ? 'error' : 'warning';
  }

  /**
   * Returns the UI label color for the status.
   * 返回状态的 UI 标签颜色。
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

  /** Returns all "good example" code snippets. 返回所有"好示例"代码片段。 */
  get goodExamples(): CodeSnippet[] {
    return this._props.codeSnippets.filter((s) => s.type === 'GoodExample');
  }

  /** Returns all "bad example" code snippets. 返回所有"坏示例"代码片段。 */
  get badExamples(): CodeSnippet[] {
    return this._props.codeSnippets.filter((s) => s.type === 'BadExample');
  }

  /**
   * Checks whether the rule has the specified tag.
   * 检查规则是否具有指定的标签。
   *
   * @param tag - Tag name (case-insensitive)
   * @example
   * rule.hasTag('ddd') // true
   */
  public hasTag(tag: string): boolean {
    return this._props.tags.some((t) => t.value.toLowerCase() === tag.toLowerCase());
  }

  /** Checks whether the rule is deprecated. 检查规则是否已废弃。 */
  public isDeprecated(): boolean {
    return this._props.status === 'Deprecated';
  }

  /** Checks whether the rule is a draft. 检查规则是否为草稿。 */
  public isDraft(): boolean {
    return this._props.status === 'Draft';
  }

  /** Checks whether the rule is active. 检查规则是否生效。 */
  public isActive(): boolean {
    return this._props.status === 'Active';
  }

  // ================= Factory Methods =================
  // ================= 工厂方法 =================

  /**
   * Creates a Rule instance from state.
   * 从状态创建 Rule 实例。
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

  /**
   * Hydrates a client-side Rule entity from RuleClientDTO.
   * 从 RuleClientDTO 水化客户端 Rule 实体。
   */
  public static fromClientDTO(dto: RuleClientDTO): Result<Rule> {
    const codeSnippets: CodeSnippet[] = [];

    for (const example of dto.goodExamples) {
      const result = CodeSnippet.fromDTO(example);
      if (!result.ok) {
        return error(
          'VALIDATION_ERROR',
          `Invalid good-example in RuleClientDTO: ${result.error.message}`,
        );
      }
      codeSnippets.push(result.data);
    }

    for (const example of dto.badExamples) {
      const result = CodeSnippet.fromDTO(example);
      if (!result.ok) {
        return error(
          'VALIDATION_ERROR',
          `Invalid bad-example in RuleClientDTO: ${result.error.message}`,
        );
      }
      codeSnippets.push(result.data);
    }

    return ok(
      Rule.load({
        id: dto.id,
        code: dto.code,
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        status: dto.status,
        deprecationReason: dto.deprecationReason,
        replacementRuleId: dto.replacementRuleId,
        liveReferenceLocation: dto.liveReferenceLocation,
        tags: dto.tags.map((tag) => RuleTag.fromDTO(tag)),
        codeSnippets,
        authorId: dto.authorId,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
      }),
    );
  }

  // ================= DTO Conversion =================
  // ================= DTO 转换 =================

  /**
   * Converts to a Client DTO.
   * 转换为客户端 DTO。
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
