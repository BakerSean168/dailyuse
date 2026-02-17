/**
 * Rule Aggregate Root - Domain Client
 * 规则聚合�?- 领域客户�?
 *
 * Client 端的规则提供�?
 * - 规则浏览和搜�?
 * - UI 展示逻辑（格式化、状态标签）
 * - 乐观更新支持
 */

import type {
  RuleClientDTO,
  RuleClient,
} from '@/contracts/aggregates/rule-client';
import type { RuleStatus } from '@/contracts/value-objects/rule-status';
import type { RuleSeverity } from '@/contracts/value-objects/rule-severity';
import { AggregateRoot } from '@dailyuse/utils';
import type { RuleId } from '@/contracts/primitives/ids';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import { CodeSnippet } from '../../domain-shared/value-objects/code-snippet';
import { RuleTag } from '../../domain-shared/value-objects/rule-tag';

// ================= 内部状态接�?=================

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
  tags: RuleTag[];
  codeSnippets: CodeSnippet[];
  authorId: IdentityId;
  createdAt: Date;
  updatedAt: Date;
}

// ================= 聚合根实�?=================

/**
 * Rule 聚合�?- Client �?
 * 
 * 提供规则的客户端视图，支持：
 * - �?API 响应创建实例
 * - UI 辅助方法（状态格式化、标签过滤）
 * - 数据转换（toDTO�?
 */
export class Rule extends AggregateRoot<RuleId> implements RuleClient {
  private readonly _props: RuleState;

  // ================= 构造函�?(Private) =================

  private constructor(state: RuleState) {
    super(state.id);
    this._props = state;
  }

  // ================= 公共属�?(Getters) =================

  /**
   * 规则编码（例如：DDD-001�?
   */
  get code(): string {
    return this._props.code;
  }

  /**
   * 规则标题
   */
  get title(): string {
    return this._props.title;
  }

  /**
   * 规则描述
   */
  get description(): string {
    return this._props.description;
  }

  /**
   * 严重程度：Mandatory（强制）�?Recommended（推荐）
   */
  get severity(): RuleSeverity {
    return this._props.severity;
  }

  /**
   * 规则状态：Draft（草稿）、Active（生效）、Deprecated（废弃）
   */
  get status(): RuleStatus {
    return this._props.status;
  }

  /**
   * 废弃原因（仅当状态为 Deprecated 时有值）
   */
  get deprecationReason(): string | null {
    return this._props.deprecationReason;
  }

  /**
   * 替代规则�?ID（仅当状态为 Deprecated 时有值）
   */
  get replacementRuleId(): RuleId | null {
    return this._props.replacementRuleId;
  }

  /**
   * 代码中的实际应用位置（文件路径或 URL�?
   */
  get liveReferenceLocation(): string | null {
    return this._props.liveReferenceLocation;
  }

  /**
   * 标签列表（例如：['ddd', 'entity', 'value-object']�?
   */
  get tags(): RuleTag[] {
    return this._props.tags;
  }

  /**
   * 代码示例列表（Good Example 和 Bad Example）
   */
  get codeSnippets(): CodeSnippet[] {
    return this._props.codeSnippets;
  }

  /**
   * 创建�?ID
   */
  get authorId(): IdentityId {
    return this._props.authorId;
  }

  /**
   * 创建时间
   */
  get createdAt(): Date {
    return this._props.createdAt;
  }

  /**
   * 更新时间
   */
  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  // ================= UI 辅助方法 =================

  /**
   * 获取状态的中文显示名称
   * 
   * @example
   * rule.displayStatus // '生效�?
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
   * 获取严重程度的中文显示名�?
   * 
   * @example
   * rule.displaySeverity // '强制执行'
   */
  get displaySeverity(): string {
    const severityMap: Record<RuleSeverity, string> = {
      Mandatory: '强制执行',
      Recommended: '建议遵守',
    };
    return this._props.severity;
  }

  /**
   * 获取严重程度�?UI 标签颜色
   * 
   * @returns 'error' | 'warning'
   */
  get severityColor(): 'error' | 'warning' {
    return this._props.severity === 'Mandatory' ? 'error' : 'warning';
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
    return colorMap[this._props.status];
  }

  /**
   * 获取所�?Good Example 代码示例
   */
  get goodExamples(): CodeSnippet[] {
    return this._props.codeSnippets.filter(s => s.type === 'GoodExample');
  }

  /**
   * 获取所有 Bad Example 代码示例
   */
  get badExamples(): CodeSnippet[] {
    return this._props.codeSnippets.filter(s => s.type === 'BadExample');
  }

  /**
   * 检查规则是否包含指定标�?
   * 
   * @param tag - 标签名（不区分大小写�?
   * @example
   * rule.hasTag('ddd') // true
   */
  public hasTag(tag: string): boolean {
    return this._props.tags.some(t => t.value.toLowerCase() === tag.toLowerCase());
  }

  /**
   * 检查规则是否已废弃
   */
  public isDeprecated(): boolean {
    return this._props.status === 'Deprecated';
  }

  /**
   * 检查规则是否为草稿
   */
  public isDraft(): boolean {
    return this._props.status === 'Draft';
  }

  /**
   * 检查规则是否已生效
   */
  public isActive(): boolean {
    return this._props.status === 'Active';
  }

  // ================= 工厂方法 (Factory Methods) =================

  /**
   * �?Client DTO 创建 Rule 实例
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
      tags: dto.tags.map(t => RuleTag.fromDTO(t)),
      codeSnippets: [
        ...dto.goodExamples.map(e => CodeSnippet.fromDTO(e)),
        ...dto.badExamples.map(e => CodeSnippet.fromDTO(e)),
      ],
      authorId: dto.authorId,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  // ================= DTO 转换 =================

  /**
   * 转换�?Client DTO
   * 
   * @returns RuleClientDTO（可用于 API 请求�?
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
      tags: this._props.tags.map(t => t.toDTO()),
      goodExamples: this.goodExamples.map(s => s.toDTO()),
      badExamples: this.badExamples.map(s => s.toDTO()),
      authorId: this._props.authorId,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
    };
  }
}
