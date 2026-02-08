/**
 * Rule Aggregate Root - Domain Client
 * 规则聚合根 - 领域客户端
 *
 * Client 端的规则提供：
 * - 规则浏览和搜索
 * - UI 展示逻辑（格式化、状态标签）
 * - 乐观更新支持
 */

import type {
  RuleClientDTO,
  RuleClient,
  RuleStatus,
  RuleSeverity,
  Language,
  SnippetType,
} from '@dailyuse/contracts/governance';
import { AggregateRoot } from '@dailyuse/utils';
import type { RuleId, UserId } from '@dailyuse/contracts/governance';

// ================= 内部状态接口 =================

/**
 * Rule 客户端内部状态
 */
interface RuleState {
  id: RuleId;
  code: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  status: RuleStatus;
  deprecationReason: string | null;
  replacementRuleId: RuleId | null;
  liveReferenceLocation: string | null;
  tags: readonly string[];
  codeSnippets: readonly CodeSnippetState[];
  authorId: UserId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CodeSnippet 客户端内部状态
 */
interface CodeSnippetState {
  id: string;
  language: Language;
  type: SnippetType;
  content: string;
  caption: string;
}

// ================= 聚合根实现 =================

/**
 * Rule 聚合根 - Client 端
 * 
 * 提供规则的客户端视图，支持：
 * - 从 API 响应创建实例
 * - UI 辅助方法（状态格式化、标签过滤）
 * - 数据转换（toDTO）
 */
export class Rule extends AggregateRoot<RuleId> implements RuleClient {
  private readonly _state: RuleState;

  // ================= 构造函数 (Private) =================

  private constructor(state: RuleState) {
    super(state.id);
    this._state = state;
  }

  // ================= 公共属性 (Getters) =================

  /**
   * 规则编码（例如：DDD-001）
   */
  get code(): string {
    return this._state.code;
  }

  /**
   * 规则标题
   */
  get title(): string {
    return this._state.title;
  }

  /**
   * 规则描述
   */
  get description(): string {
    return this._state.description;
  }

  /**
   * 严重程度：Mandatory（强制）或 Recommended（推荐）
   */
  get severity(): RuleSeverity {
    return this._state.severity;
  }

  /**
   * 规则状态：Draft（草稿）、Active（生效）、Deprecated（废弃）
   */
  get status(): RuleStatus {
    return this._state.status;
  }

  /**
   * 废弃原因（仅当状态为 Deprecated 时有值）
   */
  get deprecationReason(): string | null {
    return this._state.deprecationReason;
  }

  /**
   * 替代规则的 ID（仅当状态为 Deprecated 时有值）
   */
  get replacementRuleId(): RuleId | null {
    return this._state.replacementRuleId;
  }

  /**
   * 代码中的实际应用位置（文件路径或 URL）
   */
  get liveReferenceLocation(): string | null {
    return this._state.liveReferenceLocation;
  }

  /**
   * 标签列表（例如：['ddd', 'entity', 'value-object']）
   */
  get tags(): readonly string[] {
    return this._state.tags;
  }

  /**
   * 代码示例列表（Good Example 和 Bad Example）
   */
  get codeSnippets(): readonly CodeSnippetState[] {
    return this._state.codeSnippets;
  }

  /**
   * 创建人 ID
   */
  get authorId(): UserId {
    return this._state.authorId;
  }

  /**
   * 创建时间
   */
  get createdAt(): Date {
    return this._state.createdAt;
  }

  /**
   * 更新时间
   */
  get updatedAt(): Date {
    return this._state.updatedAt;
  }

  // ================= UI 辅助方法 =================

  /**
   * 获取状态的中文显示名称
   * 
   * @example
   * rule.displayStatus // '生效中'
   */
  get displayStatus(): string {
    const statusMap: Record<RuleStatus, string> = {
      Draft: '草稿',
      Active: '生效中',
      Deprecated: '已废弃',
    };
    return statusMap[this._state.status];
  }

  /**
   * 获取严重程度的中文显示名称
   * 
   * @example
   * rule.displaySeverity // '强制执行'
   */
  get displaySeverity(): string {
    const severityMap: Record<RuleSeverity, string> = {
      Mandatory: '强制执行',
      Recommended: '建议遵守',
    };
    return this._state.severity;
  }

  /**
   * 获取严重程度的 UI 标签颜色
   * 
   * @returns 'error' | 'warning'
   */
  get severityColor(): 'error' | 'warning' {
    return this._state.severity === 'Mandatory' ? 'error' : 'warning';
  }

  /**
   * 获取状态的 UI 标签颜色
   * 
   * @returns 'success' | 'info' | 'default'
   */
  get statusColor(): 'success' | 'info' | 'default' {
    const colorMap: Record<RuleStatus, 'success' | 'info' | 'default'> = {
      Draft: 'info',
      Active: 'success',
      Deprecated: 'default',
    };
    return colorMap[this._state.status];
  }

  /**
   * 获取所有 Good Example 代码示例
   */
  get goodExamples(): readonly CodeSnippetState[] {
    return this._state.codeSnippets.filter(s => s.type === 'GoodExample');
  }

  /**
   * 获取所有 Bad Example 代码示例
   */
  get badExamples(): readonly CodeSnippetState[] {
    return this._state.codeSnippets.filter(s => s.type === 'BadExample');
  }

  /**
   * 检查规则是否包含指定标签
   * 
   * @param tag - 标签名（不区分大小写）
   * @example
   * rule.hasTag('ddd') // true
   */
  public hasTag(tag: string): boolean {
    return this._state.tags.some(t => t.toLowerCase() === tag.toLowerCase());
  }

  /**
   * 检查规则是否已废弃
   */
  public isDeprecated(): boolean {
    return this._state.status === 'Deprecated';
  }

  /**
   * 检查规则是否为草稿
   */
  public isDraft(): boolean {
    return this._state.status === 'Draft';
  }

  /**
   * 检查规则是否已生效
   */
  public isActive(): boolean {
    return this._state.status === 'Active';
  }

  // ================= 工厂方法 (Factory Methods) =================

  /**
   * 从 Client DTO 创建 Rule 实例
   * 
   * @param dto - API 响应中的 RuleClientDTO
   * @returns Rule 实例
   * 
   * @example
   * const rule = Rule.fromDTO(apiResponse.data);
   */
  public static fromDTO(dto: RuleClientDTO): Rule {
    return new Rule({
      id: dto.id,
      code: dto.code,
      title: dto.title,
      description: dto.description,
      severity: dto.severity,
      status: dto.status,
      deprecationReason: dto.deprecationReason,
      replacementRuleId: dto.replacementRuleId,
      liveReferenceLocation: dto.liveReferenceLocation,
      tags: [...dto.tags], // 防御性复制
      codeSnippets: dto.codeSnippets.map(s => ({ ...s })), // 防御性复制
      authorId: dto.authorId,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  // ================= DTO 转换 =================

  /**
   * 转换为 Client DTO
   * 
   * @returns RuleClientDTO（可用于 API 请求）
   * 
   * @example
   * const dto = rule.toDTO();
   * await apiClient.updateRule(dto);
   */
  public toDTO(): RuleClientDTO {
    return {
      id: this._state.id,
      code: this._state.code,
      title: this._state.title,
      description: this._state.description,
      severity: this._state.severity,
      status: this._state.status,
      deprecationReason: this._state.deprecationReason,
      replacementRuleId: this._state.replacementRuleId,
      liveReferenceLocation: this._state.liveReferenceLocation,
      tags: [...this._state.tags],
      codeSnippets: this._state.codeSnippets.map(s => ({ ...s })),
      authorId: this._state.authorId,
      createdAt: this._state.createdAt.getTime(),
      updatedAt: this._state.updatedAt.getTime(),
    };
  }
}
