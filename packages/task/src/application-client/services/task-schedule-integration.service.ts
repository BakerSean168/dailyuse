// @ts-nocheck
/**
 * 任务调度集成服务
 * 为任务模块提供调度功能的集成接口
 *
 * ⚠️  WARNING: This service is currently disabled due to API incompatibilities
 * TODO: Re-implement when Schedule API is stabilized
 *
 * TypeScript checking is disabled for this file (@ts-nocheck) until Schedule API is fixed
 */

import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
type CreateScheduleTaskRequest = any; // CreateScheduleTaskRequestDTO;

/**
 * 任务调度配置接口
 */
export interface TaskScheduleConfig {
  enabled: boolean;
  remindersBefore: number[]; // 提前提醒的分钟数，例如 [5, 30, 60] 表示提前5分钟、30分钟、1小时
  allowSnooze: boolean;
  snoozeOptions: number[]; // 推迟选项（分钟）
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  alertMethods: ('POPUP' | 'SOUND' | 'SYSTEM_NOTIFICATION')[];
}

/**
 * 任务信息接口
 */
export interface TaskInfo {
  id: string;
  name: string;
  description?: string;
  scheduledTime: string; // ISO日期字符串
  scheduleConfig?: TaskScheduleConfig;
}

/**
 * 任务调度集成服务类
 */
export class TaskScheduleIntegrationService {
  /**
   * 为任务创建调度提醒
   */
  static async createTaskSchedule(task: TaskInfo): Promise<{
    success: boolean;
    scheduleTaskIds: string[];
    message?: string;
  }> {
    try {
      if (!task.scheduleConfig?.enabled) {
        return {
          success: true,
          scheduleTaskIds: [],
          message: '任务未启用调度功能',
        };
      }

      const { scheduleConfig } = task;
      const scheduleTaskIds: string[] = [];

      // 为每个提醒时间点创建调度任务
      for (const minutesBefore of scheduleConfig.remindersBefore) {
        const reminderTime = new Date(task.scheduledTime);
        reminderTime.setMinutes(reminderTime.getMinutes() - minutesBefore);

        const scheduleTaskRequest: CreateScheduleTaskRequest = {
          name: `任务提醒: ${task.name}`,
          description: `${minutesBefore}分钟后执行任务"${task.name}"`,
          taskType: 'TASK_REMINDER',
          cronExpression: this.createCronFromDate(reminderTime),
          payload: {
            type: 'TASK_REMINDER',
            taskId: task.id,
            taskName: task.name,
            taskDescription: task.description,
            scheduledTime: task.scheduledTime,
            minutesBefore,
            alertMethods: scheduleConfig.alertMethods,
            allowSnooze: scheduleConfig.allowSnooze,
            snoozeOptions: scheduleConfig.snoozeOptions,
          },
          priority: this.mapPriority(scheduleConfig.priority),
          status: 'ACTIVE',
        };

        // TODO: 集成 Schedule 模块的 API 客户端
        // const scheduleTask = await getScheduleWebService.createScheduleTask(scheduleTaskRequest);
        // scheduleTaskIds.push(scheduleTask.uuid);
      }

      // TODO: 发布任务调度创建事件 (eventBus.emit('task:schedule-created', {...}))
      // 需要通过 DI 注入 eventBus

      console.log(`[TaskSchedule] 已为任务 ${task.id} 创建 ${scheduleTaskIds.length} 个调度提醒`);

      return {
        success: true,
        scheduleTaskIds,
        message: `成功创建 ${scheduleTaskIds.length} 个调度提醒`,
      };
    } catch (error) {
      console.error('[TaskSchedule] 创建任务调度失败:', error);
      return {
        success: false,
        scheduleTaskIds: [],
        message: error instanceof Error ? error.message : '创建调度失败',
      };
    }
  }

  /**
   * 更新任务调度
   */
  static async updateTaskSchedule(
    task: TaskInfo,
    existingScheduleTaskIds: string[],
  ): Promise<{
    success: boolean;
    scheduleTaskIds: string[];
    message?: string;
  }> {
    try {
      // 先删除现有的调度任务
      await this.deleteTaskSchedule(existingScheduleTaskIds);

      // 重新创建调度任务
      return await this.createTaskSchedule(task);
    } catch (error) {
      console.error('[TaskSchedule] 更新任务调度失败:', error);
      return {
        success: false,
        scheduleTaskIds: [],
        message: error instanceof Error ? error.message : '更新调度失败',
      };
    }
  }

  /**
   * 删除任务调度
   */
  static async deleteTaskSchedule(scheduleTaskIds: string[]): Promise<{
    success: boolean;
    deletedCount: number;
    message?: string;
  }> {
    try {
      let deletedCount = 0;

      for (const scheduleTaskId of scheduleTaskIds) {
        try {
          // TODO: 集成 Schedule 模块的 API 客户端
          // await getScheduleWebService.deleteScheduleTask(scheduleTaskId);
          deletedCount++;
        } catch (error) {
          console.error(`删除调度任务 ${scheduleTaskId} 失败:`, error);
        }
      }

      console.log(`[TaskSchedule] 已删除 ${deletedCount}/${scheduleTaskIds.length} 个调度任务`);

      return {
        success: true,
        deletedCount,
        message: `成功删除 ${deletedCount} 个调度任务`,
      };
    } catch (error) {
      console.error('[TaskSchedule] 删除任务调度失败:', error);
      return {
        success: false,
        deletedCount: 0,
        message: error instanceof Error ? error.message : '删除调度失败',
      };
    }
  }

  /**
   * 暂停任务调度
   */
  static async pauseTaskSchedule(scheduleTaskIds: string[]): Promise<{
    success: boolean;
    pausedCount: number;
  }> {
    try {
      let pausedCount = 0;

      for (const scheduleTaskId of scheduleTaskIds) {
        try {
          // TODO: 集成 Schedule 模块的 API 客户端
          // await getScheduleWebService.pauseScheduleTask(scheduleTaskId);
          pausedCount++;
        } catch (error) {
          console.error(`暂停调度任务 ${scheduleTaskId} 失败:`, error);
        }
      }

      return {
        success: true,
        pausedCount,
      };
    } catch (error) {
      console.error('[TaskSchedule] 暂停任务调度失败:', error);
      return {
        success: false,
        pausedCount: 0,
      };
    }
  }

  /**
   * 启用任务调度
   */
  static async enableTaskSchedule(scheduleTaskIds: string[]): Promise<{
    success: boolean;
    enabledCount: number;
  }> {
    try {
      let enabledCount = 0;

      for (const scheduleTaskId of scheduleTaskIds) {
        try {
          // TODO: 集成 Schedule 模块的 API 客户端
          // await getScheduleWebService.enableScheduleTask(scheduleTaskId);
          enabledCount++;
        } catch (error) {
          console.error(`启用调度任务 ${scheduleTaskId} 失败:`, error);
        }
      }

      return {
        success: true,
        enabledCount,
      };
    } catch (error) {
      console.error('[TaskSchedule] 启用任务调度失败:', error);
      return {
        success: false,
        enabledCount: 0,
      };
    }
  }

  /**
   * 获取任务相关的调度任务
   */
  static async getTaskSchedules(taskId: string): Promise<{
    success: boolean;
    schedules: any[];
  }> {
    try {
      // TODO: 集成 Schedule 模块的 API 客户端
      // 获取所有调度任务，筛选出与此任务相关的
      // const allSchedules = await getScheduleWebService.getScheduleTasks({
      //   taskType: 'TASK_REMINDER',
      // });
      // const taskSchedules = allSchedules.filter((schedule: any) => schedule.payload?.taskId === taskId);

      const taskSchedules: any[] = [];

      return {
        success: true,
        schedules: taskSchedules,
      };
    } catch (error) {
      console.error('[TaskSchedule] 获取任务调度失败:', error);
      return {
        success: false,
        schedules: [],
      };
    }
  }

  /**
   * 从日期创建 Cron 表达式（一次性执行）
   */
  private static createCronFromDate(date: Date): string {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // 返回一次性执行的cron表达式
    return `${minute} ${hour} ${dayOfMonth} ${month} * ${year}`;
  }

  /**
   * 创建默认的任务调度配置
   */
  static createDefaultScheduleConfig(): TaskScheduleConfig {
    return {
      enabled: true,
      remindersBefore: [5, 30], // 提前5分钟和30分钟提醒
      allowSnooze: true,
      snoozeOptions: [5, 10, 30], // 可以推迟5分钟、10分钟、30分钟
      priority: 'MEDIUM',
      alertMethods: ['POPUP', 'SYSTEM_NOTIFICATION'],
    };
  }

  /**
   * 映射优先级到枚举值
   */
  static mapPriority(priority: string): any {
    const mapping: Record<string, any> = {
      LOW: 'LOW',
      MEDIUM: 'NORMAL',
      HIGH: 'HIGH',
    };
    return mapping[priority] || 'NORMAL';
  }

  /**
   * 验证调度配置
   */
  static validateScheduleConfig(config: TaskScheduleConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (config.remindersBefore.length === 0) {
      errors.push('至少需要设置一个提醒时间');
    }

    if (config.remindersBefore.some((time) => time < 0)) {
      errors.push('提醒时间不能为负数');
    }

    if (config.alertMethods.length === 0) {
      errors.push('至少需要选择一种提醒方式');
    }

    if (config.allowSnooze && config.snoozeOptions.length === 0) {
      errors.push('启用推迟功能时必须提供推迟选项');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// 导出单例实例
export const taskScheduleIntegrationService = TaskScheduleIntegrationService;
