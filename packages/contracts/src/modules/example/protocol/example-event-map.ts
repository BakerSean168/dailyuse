/**
 * Example Module - Event Map
 * 
 * 【规范说明：Event Map】
 * 定义模块发出的所有事件类型和数据结构
 * 用于模块间异步通信和事件驱动架构
 * 
 * 事件命名规范：'module-name:action-name'
 */

export type ExampleEventMap = {
  /**
   * Example 创建事件
   * 当新 Example 被创建时发出
   */
  'example:created': {
    id: string;
    name: string;
    createdAt: number;
  };

  /**
   * Example 更新事件
   * 当 Example 被更新时发出
   */
  'example:updated': {
    id: string;
    updatedFields: string[];
    updatedAt: number;
  };

  /**
   * Example 删除事件
   * 当 Example 被删除时发出
   */
  'example:deleted': {
    id: string;
    deletedAt: number;
  };

  /**
   * Example 状态变更事件
   * 当 Example 状态改变时发出
   */
  'example:status-changed': {
    id: string;
    oldStatus: string;
    newStatus: string;
    changedAt: number;
  };
};
