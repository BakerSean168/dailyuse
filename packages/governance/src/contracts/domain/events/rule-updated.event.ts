/**
 * Rule Updated Event.
 * 规则更新事件。
 *
 * 【触发时机 / Trigger】
 * Emitted after Rule aggregate content is updated via update(), addTag(),
 * removeTag(), addCodeSnippet(), or removeCodeSnippet().
 * Rule 聚合根通过 update()、addTag()、removeTag()、addCodeSnippet()
 * 或 removeCodeSnippet() 方法成功更新后触发。
 *
 * 【订阅者 / Subscribers】
 * - 通知模块：通知相关人员规则变更
 * - 搜索索引服务：更新规则索引
 * - 审计日志：记录规则修改历史
 * - 缓存服务：清除规则缓存
 */
import type { RuleId } from '../../primitives/ids';
import type { IdentityId } from '@dailyuse/contracts/primitives';

export interface RuleUpdatedEvent {
  /** Rule ID. 规则 ID。 */
  ruleId: RuleId;

  /** List of changed field names. 变更的字段列表。 */
  changedFields: string[];

  /** New title (if changed). 新的标题（如果有变更）。 */
  title?: string;

  /** New tag list (if changed). 新的标签列表（如果有变更）。 */
  tags?: string[];

  /** ID of the user who performed the update (if available). 执行更新的用户 ID（如有）。 */
  actorId?: IdentityId;
}
