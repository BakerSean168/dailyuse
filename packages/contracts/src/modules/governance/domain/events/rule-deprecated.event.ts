/**
 * Rule Deprecated Event.
 * 规则废弃事件。
 *
 * 【触发时机 / Trigger】
 * Emitted after a Rule is deprecated via deprecate().
 * Rule 聚合根通过 deprecate() 方法成功废弃后触发。
 *
 * 【订阅者 / Subscribers】
 * - 通知模块：通知相关人员规则已废弃
 * - 代码扫描服务：标记使用该规则的代码位置
 * - 审计日志：记录规则废弃历史
 */
import type { RuleId } from '../../primitives/ids';
import type { IdentityId } from '../../../../primitives';

export interface RuleDeprecatedEvent {
  /** Rule ID. 规则 ID。 */
  ruleId: RuleId;

  /** Rule code. 规则编码。 */
  code: string;

  /** Deprecation reason. 废弃原因。 */
  reason: string;

  /** Replacement rule ID (optional). 替代规则的 ID（可选）。 */
  replacementRuleId?: RuleId;

  /** ID of the user who deprecated the rule (if available). 执行废弃操作的用户 ID（如有）。 */
  actorId?: IdentityId;
}
