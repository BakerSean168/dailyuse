/**
 * Rule Deprecated Event
 * 规则废弃事件
 * 
 * 【触发时机】
 * Rule 聚合根通过 deprecate() 方法成功废弃后触发
 * 
 * 【订阅者】
 * - 通知模块：通知相关人员规则已废弃
 * - 代码扫描服务：标记使用该规则的代码位置
 * - 审计日志：记录规则废弃历史
 */
export interface RuleDeprecatedEvent {
  /** 规则 ID */
  ruleId: string;
  
  /** 规则编码 */
  code: string;
  
  /** 废弃原因 */
  reason: string;
  
  /** 替代规则的 ID（可选） */
  replacementRuleId?: string;
}
