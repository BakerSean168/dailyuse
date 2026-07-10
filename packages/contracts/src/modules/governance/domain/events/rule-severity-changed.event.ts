/**
 * Rule Severity Changed Event.
 * 规则严重级别变更事件。
 *
 * 【触发时机 / Trigger】
 * Emitted after a Rule's severity is changed via changeSeverity().
 * Rule 聚合根通过 changeSeverity() 方法成功变更严重级别后触发。
 *
 * 【订阅者 / Subscribers】
 * - 通知模块：通知相关人员严重级别变更
 * - 审计日志：记录严重级别变更历史
 * - 统计服务：更新规则严重级别统计
 */
import type { RuleId } from '../../primitives/ids';
import type { RuleSeverity } from '../../value-objects/rule-severity';
import type { IdentityId } from '../../../../primitives';

export interface RuleSeverityChangedEvent {
  /** Rule ID. 规则 ID。 */
  ruleId: RuleId;

  /** Rule code (e.g. DDD-001). 规则编码。 */
  code: string;

  /** Previous severity level. 变更前的严重级别。 */
  previousSeverity: RuleSeverity;

  /** New severity level. 变更后的严重级别。 */
  newSeverity: RuleSeverity;

  /** ID of the user who changed the severity (if available). 执行变更的用户 ID（如有）。 */
  actorId?: IdentityId;
}
