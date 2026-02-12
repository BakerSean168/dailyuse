/**
 * Rule Updated Event
 * 规则更新事件
 * 
 * 【触发时机】
 * Rule 聚合根通过 update() 方法成功更新后触发
 * 
 * 【订阅者】
 * - 通知模块：通知相关人员规则变更
 * - 搜索索引服务：更新规则索引
 * - 审计日志：记录规则修改历史
 * - 缓存服务：清除规则缓存
 */
export interface RuleUpdatedEvent {
  /** 规则 ID */
  ruleId: string;
  
  /** 变更的字段列表 */
  changedFields: string[];
  
  /** 新的标题（如果有变更） */
  title?: string;
  
  /** 新的标签列表（如果有变更） */
  tags?: string[];
}
