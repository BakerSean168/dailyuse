/**
 * Reminder Template - Event Map
 * 提醒模板 - 事件映射
 * 
 * 【规范说明：Event Map】
 * 定义提醒模板发出的所有事件类型和数据结构
 * 用于模块间异步通信和事件驱动架构
 */

export type ReminderEventMap = {
  /**
   * 提醒模板创建事件
   */
  'reminder:template-created': {
    uuid: string;
    name: string;
    type: string;
    accountUuid: string;
    createdAt: number;
  };

  /**
   * 提醒模板更新事件
   */
  'reminder:template-updated': {
    uuid: string;
    changes: string[];
    updatedAt: number;
  };

  /**
   * 提醒模板删除事件
   */
  'reminder:template-deleted': {
    uuid: string;
    name: string;
    deletedAt: number;
  };

  /**
   * 提醒模板启用事件
   */
  'reminder:template-enabled': {
    uuid: string;
    enabledAt: number;
  };

  /**
   * 提醒模板暂停事件
   */
  'reminder:template-paused': {
    uuid: string;
    pausedAt: number;
  };

  /**
   * 提醒模板触发事件
   */
  'reminder:template-triggered': {
    uuid: string;
    triggeredAt: number;
    nextTriggerAt?: number | null;
  };

  /**
   * 提醒模板移动到分组事件
   */
  'reminder:template-moved': {
    uuid: string;
    oldGroupUuid?: string | null;
    newGroupUuid?: string | null;
    movedAt: number;
  };
};

