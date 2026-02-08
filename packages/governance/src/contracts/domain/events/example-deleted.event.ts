/**
 * Example Deleted Event
 * 
 * 【规范说明：删除事件】
 * 记录 Example 被删除的事实。
 * 
 * 【软删除 vs 硬删除】
 * - 软删除：设置 deletedAt 时间戳，数据保留
 * - 硬删除：物理删除数据，不可恢复
 * 
 * 【触发时机】
 * Example 聚合根被删除后触发
 * 
 * 【订阅者】
 * - 清理服务：清理关联数据
 * - 审计日志：记录删除操作
 */
export interface ExampleDeletedEvent {
  /** Example 唯一标识符 */
  id: string;
  
  /** 删除时间戳（Unix 毫秒） */
  deletedAt: number;
}
