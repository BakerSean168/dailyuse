/**
 * Rule Deleted Event.
 * 规则删除事件。
 *
 * 【触发时机 / Trigger】
 * Emitted when a Draft rule is hard-deleted via DeleteRuleUseCase.
 * 当草稿规则通过 DeleteRuleUseCase 被硬删除时触发。
 *
 * Note: Soft-deletes (Active → Deprecated) emit `governance:rule-deprecated` instead.
 * 注意：软删除（Active → Deprecated）触发的是 `governance:rule-deprecated` 事件。
 *
 * 【订阅者 / Subscribers】
 * - Audit log: record rule deletion history.
 *   审计日志：记录规则删除历史。
 * - Search index: remove rule from search index.
 *   搜索索引：从搜索索引中移除规则。
 * - Cache invalidation: evict cached rule data.
 *   缓存失效：清除缓存的规则数据。
 */
import type { RuleId } from '../../primitives/ids';
import type { IdentityId } from '../../../../primitives';

export interface RuleDeletedEvent {
  /** Rule ID of the deleted rule. 被删除规则的 ID。 */
  ruleId: RuleId;

  /** Rule code (e.g. DDD-001). 规则编码。 */
  code: string;

  /** ID of the user who deleted the rule. 执行删除操作的用户 ID。 */
  deletedBy: IdentityId;
}
