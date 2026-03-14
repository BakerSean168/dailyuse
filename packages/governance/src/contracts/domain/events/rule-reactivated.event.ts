/**
 * Rule Reactivated Event.
 * 规则重新激活事件。
 *
 * 【触发时机 / Trigger】
 * Emitted after a deprecated Rule is reactivated via reactivate().
 * Rule 聚合根通过 reactivate() 方法成功重新激活后触发。
 *
 * 【订阅者 / Subscribers】
 * - 通知模块：通知相关人员规则已重新激活
 * - 搜索索引服务：更新规则状态索引
 * - 审计日志：记录规则激活历史
 */
import type { RuleId } from '../../primitives/ids';
import type { IdentityId } from '@dailyuse/contracts/primitives';

export interface RuleReactivatedEvent {
  /** Rule ID. 规则 ID。 */
  ruleId: RuleId;

  /** Rule code. 规则编码。 */
  code: string;

  /** Rule title. 规则标题。 */
  title: string;

  /** ID of the user who reactivated the rule (if available). 执行重新激活的用户 ID（如有）。 */
  actorId?: IdentityId;
}
