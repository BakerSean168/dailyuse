/**
 * Rule Created Event.
 * 规则创建事件。
 *
 * 【规范说明：领域事件】
 * 领域事件是业务过程中发生的重要事实。
 * 特点：
 * - 使用过去时态命名（Created、Updated、Deprecated）
 * - 包含事件发生时的必要数据
 * - 不可变，不包含行为
 * - utils 的 addDomainEvent 能接收 type 和 payload，自动生成 aggregateId 和 occurredAt
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
import type { IdentityId } from '@dailyuse/contracts/primitives';

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
