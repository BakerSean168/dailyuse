/**
 * Rule Status Changed Event.
 * 规则状态变更事件。
 *
 * 【触发时机 / Trigger】
 * Emitted on any Rule status transition (activate, deprecate, reactivate).
 * This is a generic status change event.
 * Rule 聚合根的状态发生变更时触发（activate、deprecate、reactivate），
 * 这是一个通用的状态变更事件。
 *
 * 【订阅者 / Subscribers】
 * - 统计服务：更新规则状态统计
 * - 仪表板服务：更新规则状态展示
 * - 审计日志：记录状态转换历史
 */
import type { RuleId } from '../../primitives/ids';
import type { RuleStatus } from '../../value-objects/rule-status';
import type { IdentityId } from '../../../../primitives';

export interface RuleStatusChangedEvent {
  /** Rule ID. 规则 ID。 */
  ruleId: RuleId;

  /** Rule code. 规则编码。 */
  code: string;

  /** Previous status. 旧状态。 */
  previousStatus: RuleStatus;

  /** New status. 新状态。 */
  newStatus: RuleStatus;

  /** ID of the user who changed the status (if available). 执行状态变更的用户 ID（如有）。 */
  actorId?: IdentityId;
}
