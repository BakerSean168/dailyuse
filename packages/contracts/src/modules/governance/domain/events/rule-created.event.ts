/**
 * Rule Created Event.
 * 规则创建事件。
 *
 * 【规范说明：领域事件 - payload-only 接口】
 * 领域事件接口只需定义 **payload**（业务数据），不需要包含信封字段（type、aggregateId、occurredAt）。
 * 原因：AggregateRoot.addDomainEvent<GovernanceEventMap['governance:rule-created']>('governance:rule-created', payload)
 * 工具方法会自动将 payload 包裹为完整事件信封：
 *   { type: 'governance:rule-created', aggregateId: '...', occurredAt: 1234567890, payload: { ... } }
 *
 * 如果事件接口包含 type/aggregateId/timestamp 字段，属于反模式（见 editor/repository/schedule 模块的问题）。
 *
 * 领域事件特点：
 * - 使用过去时态命名（Created、Updated、Deprecated）
 * - 包含事件发生时的必要数据
 * - 不可变，不包含行为
 *
 * 【触发时机 / Trigger】
 * Rule 聚合根通过 Rule.create() 成功创建后触发。
 * Emitted after a new Rule is successfully created via Rule.create().
 *
 * 【订阅者 / Subscribers】
 * - 通知模块：通知相关人员新规则创建
 * - 搜索索引服务：更新规则索引
 * - 审计日志：记录规则创建历史
 */
import type { RuleSeverity } from '../../value-objects/rule-severity';
import type { IdentityId } from '../../../../primitives';

export interface RuleCreatedEvent {
  /** Rule code (e.g. DDD-001). 规则编码（例如：DDD-001）。 */
  code: string;

  /** Rule title. 规则标题。 */
  title: string;

  /** Severity level (Mandatory or Recommended). 严重程度（Mandatory 或 Recommended）。 */
  severity: RuleSeverity;

  /** Tag list. 标签列表。 */
  tags: string[];

  /** ID of the user who created the rule. 创建人 ID。 */
  authorId: IdentityId;
}
