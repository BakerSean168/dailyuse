/**
 * Rule Reactivated Event
 * 规则重新激活事件
 * 
 * 【触发时机】
 * Rule 聚合根通过 reactivate() 方法成功重新激活后触发
 * 
 * 【订阅者】
 * - 通知模块：通知相关人员规则已重新激活
 * - 搜索索引服务：更新规则状态索引
 * - 审计日志：记录规则激活历史
 */
export interface RuleReactivatedEvent {
  /** 规则 ID */
  ruleId: string;
  
  /** 规则编码 */
  code: string;
  
  /** 规则标题 */
  title: string;
}
