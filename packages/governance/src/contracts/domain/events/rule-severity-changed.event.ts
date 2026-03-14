/**
 * Rule Severity Changed Event
 * 规则严重级别变更事件
 *
 * 【触发时机】
 * Rule 聚合根通过 changeSeverity() 方法成功变更严重级别后触发
 *
 * 【订阅者】
 * - 通知模块：通知相关人员严重级别变更
 * - 审计日志：记录严重级别变更历史
 * - 统计服务：更新规则严重级别统计
 */
export interface RuleSeverityChangedEvent {
  /** Rule ID. 规则 ID。 */
  ruleId: string;

  /** Rule code (e.g. DDD-001). 规则编码。 */
  code: string;

  /** Previous severity level. 变更前的严重级别。 */
  previousSeverity: string;

  /** New severity level. 变更后的严重级别。 */
  newSeverity: string;
}
