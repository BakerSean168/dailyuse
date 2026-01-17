/**
 * Task 事件监听器注册
 * 
 * @responsibility
 * - 注册 Task 模块的事件监听器
 * - 处理 ScheduleTask 触发事件
 * - 发送任务提醒通知
 * 
 * @architecture
 * - 应用服务层（Application Service）
 * - 事件驱动架构（Event-Driven）
 * - 混合方案（方案 C）：
 *   * TaskTemplate → 创建 1 个循环 ScheduleTask
 *   * ScheduleTask 触发时检查当天 Instance
 *   * 直接发送通知，不创建 100 个 Reminder
 */

import { createLogger, eventBus } from '@dailyuse/utils';
import { ScheduleTaskEventTypes } from '@dailyuse/contracts/schedule';
import { TaskReminderScheduleHandler } from './task-reminder-schedule.handler';
import { TaskEventHandler } from '../services/task-event.handler';

const logger = createLogger('TaskEventListeners');

/**
 * 注册 Task 事件监听器
 */
export function registerTaskEventListeners(): void {
  // 初始化 TaskEventHandler（监听实例生成等事件）
  TaskEventHandler.initialize();
  logger.info('✅ TaskEventHandler 已初始化（监听实例生成、模板创建、实例完成事件）');
  
  // 监听 schedule.task.triggered 事件
  eventBus.subscribe(ScheduleTaskEventTypes.TRIGGERED, async (event: any) => {
    try {
      // 只处理 TASK 模块的事件
      if (event.payload?.sourceModule !== 'TASK') {
        return;
      }

      logger.info(`📩 接收到 ${ScheduleTaskEventTypes.TRIGGERED} 事件 (Task)`, {
        taskUuid: event.payload?.taskUuid,
        templateUuid: event.payload?.sourceEntityId,
        taskName: event.payload?.taskName,
        accountUuid: event.accountUuid,
      });

      // 创建事件处理器
      const handler = new TaskReminderScheduleHandler();
      
      // 处理事件
      await handler.handle(event);

    } catch (error) {
      logger.error(`❌ 处理 ${ScheduleTaskEventTypes.TRIGGERED} 事件失败`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        event: {
          accountUuid: event.accountUuid,
          taskUuid: event.payload?.taskUuid,
          templateUuid: event.payload?.sourceEntityId,
        },
      });
    }
  });

  logger.info(`✅ Task 事件监听器注册完成（监听 ${ScheduleTaskEventTypes.TRIGGERED} 事件）`);
}

