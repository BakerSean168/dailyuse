/**
 * Example Status Changed Event
 * 
 * 【规范说明：状态变更事件】
 * 记录 Example 状态转换的事实。
 * 包含前后状态，便于追溯和审计。
 * 
 * 【触发时机】
 * Example 状态转换完成后触发
 * 
 * 【订阅者】
 * - 工作流引擎：触发下一步流程
 * - 通知服务：通知相关用户
 */
export interface ExampleStatusChangedEvent {
  /** Example 唯一标识符 */
  id: string;
  
  /** 变更前的状态 */
  oldStatus: string;
  
  /** 变更后的状态 */
  newStatus: string;
  
  /** 状态变更时间戳（Unix 毫秒） */
  changedAt: number;
}
