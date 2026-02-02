/**
 * Reminder Group - Event Map
 * 提醒分组 - 事件映射
 * 
 * 【规范说明：Event Map】
 * 定义提醒分组发出的所有事件类型和数据结构
 * 用于模块间异步通信和事件驱动架构
 */

export type ReminderGroupEventMap = {
  /**
   * 提醒分组创建事件
   */
  'reminder:group-created': {
    uuid: string;
    name: string;
    accountUuid: string;
    createdAt: number;
  };

  /**
   * 提醒分组更新事件
   */
  'reminder:group-updated': {
    uuid: string;
    changes: string[];
    updatedAt: number;
  };

  /**
   * 提醒分组删除事件
   */
  'reminder:group-deleted': {
    uuid: string;
    name: string;
    deletedAt: number;
  };

  /**
   * 提醒分组控制模式切换事件
   */
  'reminder:group-control-mode-switched': {
    uuid: string;
    previousMode: string;
    newMode: string;
    switchedAt: number;
  };

  /**
   * 提醒分组启用事件
   */
  'reminder:group-enabled': {
    uuid: string;
    enabledAt: number;
  };

  /**
   * 提醒分组暂停事件
   */
  'reminder:group-paused': {
    uuid: string;
    pausedAt: number;
  };
};
