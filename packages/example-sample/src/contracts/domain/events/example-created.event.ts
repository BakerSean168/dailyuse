/**
 * Example Created Event
 * 
 * 【规范说明：领域事件】
 * 领域事件是业务过程中发生的重要事实。
 * 特点：
 * - 使用过去时态命名（Created、Deleted）
 * - 包含事件发生时的必要数据
 * - 不可变，不包含行为
 * - utils 的 addDomainEvent 能接收 type 和 payload，自动生成 aggregateId 和 occurredAt，所以Event 中不需要包含这些字段
 * 
 * 【触发时机】
 * Example 聚合根成功持久化后触发
 * 
 * 【订阅者】
 * - 通知模块：发送创建成功通知
 * - 搜索索引服务：更新索引
 * - 审计日志：记录操作历史
 */
export interface ExampleCreatedEvent {
  /** Example 唯一标识符 */
  // id: string; // aggregateId 已由 addDomainEvent 自动生成，无需重复定义
  
  /** Example 名称 */
  name: string;
  
  /** 创建时间戳（Unix 毫秒） */
  //  occurredAt: number; // occurredAt 已由 addDomainEvent 自动生成，无需重复定义
}
