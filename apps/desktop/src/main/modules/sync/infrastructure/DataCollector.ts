/**
 * DataCollector - 数据收集器
 *
 * 负责从各模块收集需要同步的数据：
 * - Goal 目标数据
 * - Task 任务数据
 * - Schedule 日程数据
 * - Reminder 提醒数据
 * - Settings 用户设置
 *
 * 实现 IDataCollector 接口，供 SyncManager 使用
 */

import { createLogger, type ILogger } from '@dailyuse/utils';
import type {
  SyncDataBundle,
  SyncGoalData,
  SyncTaskData,
  SyncScheduleData,
  SyncReminderData,
  SyncSettingsData,
} from '@dailyuse/contracts/sync';
import type { IDataCollector } from './SyncManager';

// Import application services
import { GoalDesktopApplicationService } from '../../goal/application/GoalDesktopApplicationService';
import { TaskDesktopApplicationService } from '../../task/application/TaskDesktopApplicationService';
import { ScheduleDesktopApplicationService } from '../../schedule/application/ScheduleDesktopApplicationService';
import { ReminderDesktopApplicationService } from '../../reminder/application/ReminderDesktopApplicationService';

// 本地存储 key
const SYNC_VERSION_KEY = 'dailyuse-sync-version';
const DEFAULT_ACCOUNT_UUID = 'local-user';

/**
 * DataCollector 配置
 */
export interface DataCollectorConfig {
  /** 默认账户 UUID */
  accountUuid?: string;
}

/**
 * 数据收集器
 *
 * 实现 IDataCollector 接口，从各模块收集和应用同步数据
 */
export class DataCollector implements IDataCollector {
  private static instance: DataCollector | null = null;

  private readonly logger: ILogger;
  private readonly accountUuid: string;

  // Application Services
  private goalService: GoalDesktopApplicationService;
  private taskService: TaskDesktopApplicationService;
  private scheduleService: ScheduleDesktopApplicationService;
  private reminderService: ReminderDesktopApplicationService;

  // 同步版本（存储在内存中，也会持久化）
  private syncVersion = 0;

  private constructor(config: DataCollectorConfig = {}, logger?: ILogger) {
    this.logger = logger || createLogger('DataCollector');
    this.accountUuid = config.accountUuid || DEFAULT_ACCOUNT_UUID;

    // 初始化 Application Services
    this.goalService = new GoalDesktopApplicationService();
    this.taskService = new TaskDesktopApplicationService();
    this.scheduleService = new ScheduleDesktopApplicationService();
    this.reminderService = new ReminderDesktopApplicationService();

    // 加载持久化的版本号
    this.loadSyncVersion();
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: DataCollectorConfig, logger?: ILogger): DataCollector {
    if (!DataCollector.instance) {
      DataCollector.instance = new DataCollector(config, logger);
    }
    return DataCollector.instance;
  }

  /**
   * 重置单例（仅用于测试）
   */
  static resetInstance(): void {
    DataCollector.instance = null;
  }

  // ============ IDataCollector 接口实现 ============

  /**
   * 收集所有数据用于同步
   */
  async collectAllData(): Promise<SyncDataBundle> {
    this.logger.info('Collecting all data for sync');

    const [goals, tasks, schedules, reminders, settings] = await Promise.all([
      this.collectGoals(),
      this.collectTasks(),
      this.collectSchedules(),
      this.collectReminders(),
      this.collectSettings(),
    ]);

    const bundle: SyncDataBundle = {
      goals,
      tasks,
      schedules,
      reminders,
      settings,
    };

    this.logger.info('Data collection complete', {
      goals: goals.length,
      tasks: tasks.length,
      schedules: schedules.length,
      reminders: reminders.length,
    });

    return bundle;
  }

  /**
   * 应用同步数据到本地
   */
  async applyData(data: SyncDataBundle): Promise<void> {
    this.logger.info('Applying sync data', {
      goals: data.goals?.length || 0,
      tasks: data.tasks?.length || 0,
      schedules: data.schedules?.length || 0,
      reminders: data.reminders?.length || 0,
    });

    // 按顺序应用数据（保持依赖关系）
    if (data.goals?.length) {
      await this.applyGoals(data.goals);
    }

    if (data.tasks?.length) {
      await this.applyTasks(data.tasks);
    }

    if (data.schedules?.length) {
      await this.applySchedules(data.schedules);
    }

    if (data.reminders?.length) {
      await this.applyReminders(data.reminders);
    }

    if (data.settings) {
      await this.applySettings(data.settings);
    }

    this.logger.info('Sync data applied successfully');
  }

  /**
   * 获取上次同步版本
   */
  async getLastSyncVersion(): Promise<number> {
    return this.syncVersion;
  }

  /**
   * 更新同步版本
   */
  async updateSyncVersion(version: number): Promise<void> {
    this.syncVersion = version;
    this.saveSyncVersion();
    this.logger.info('Sync version updated', { version });
  }

  // ============ 数据收集方法 ============

  /**
   * 收集目标数据
   */
  private async collectGoals(): Promise<SyncGoalData[]> {
    try {
      const result = await this.goalService.listGoals({
        accountUuid: this.accountUuid,
        includeChildren: true,
      });

      return result.goals.map((goal) => ({
        uuid: goal.uuid,
        title: goal.title,
        description: goal.description,
        status: goal.status,
        priority: goal.priority || 0,
        startDate: goal.startDate ? new Date(goal.startDate).getTime() : undefined,
        endDate: goal.endDate ? new Date(goal.endDate).getTime() : undefined,
        progress: goal.progress || 0,
        tags: goal.tags,
        parentGoalUuid: goal.parentGoalUuid,
        createdAt: new Date(goal.createdAt).getTime(),
        updatedAt: new Date(goal.updatedAt).getTime(),
      }));
    } catch (error) {
      this.logger.error('Failed to collect goals', { error });
      return [];
    }
  }

  /**
   * 收集任务数据
   */
  private async collectTasks(): Promise<SyncTaskData[]> {
    try {
      const result = await this.taskService.listTemplates({
        accountUuid: this.accountUuid,
      });

      return result.templates.map((task) => ({
        uuid: task.uuid,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority || 0,
        dueDate: task.dueDate ? new Date(task.dueDate).getTime() : undefined,
        estimatedMinutes: task.estimatedMinutes,
        tags: task.tags,
        goalUuid: task.goalUuid,
        createdAt: new Date(task.createdAt).getTime(),
        updatedAt: new Date(task.updatedAt).getTime(),
      }));
    } catch (error) {
      this.logger.error('Failed to collect tasks', { error });
      return [];
    }
  }

  /**
   * 收集日程数据
   */
  private async collectSchedules(): Promise<SyncScheduleData[]> {
    try {
      // 获取当前账户的所有日程任务
      const result = await this.scheduleService.listTasksByAccount(this.accountUuid);

      return result.tasks.map((schedule) => ({
        uuid: schedule.uuid,
        title: schedule.title || '',
        description: schedule.description,
        type: schedule.type || 'task',
        startTime: schedule.scheduledAt ? new Date(schedule.scheduledAt).getTime() : Date.now(),
        endTime: schedule.dueAt ? new Date(schedule.dueAt).getTime() : undefined,
        allDay: false,
        taskUuid: schedule.sourceEntityUuid,
        createdAt: new Date(schedule.createdAt).getTime(),
        updatedAt: new Date(schedule.updatedAt).getTime(),
      }));
    } catch (error) {
      this.logger.error('Failed to collect schedules', { error });
      return [];
    }
  }

  /**
   * 收集提醒数据
   */
  private async collectReminders(): Promise<SyncReminderData[]> {
    try {
      const result = await this.reminderService.listTemplates(this.accountUuid, {});

      return result.templates.map((reminder) => ({
        uuid: reminder.uuid,
        title: reminder.title,
        message: reminder.message || reminder.description,
        triggerAt: reminder.triggerTime ? new Date(reminder.triggerTime).getTime() : Date.now(),
        isCompleted: reminder.status === 'COMPLETED',
        type: reminder.type || 'reminder',
        linkedEntityType: reminder.linkedEntityType,
        linkedEntityUuid: reminder.linkedEntityUuid,
        createdAt: new Date(reminder.createdAt).getTime(),
        updatedAt: new Date(reminder.updatedAt).getTime(),
      }));
    } catch (error) {
      this.logger.error('Failed to collect reminders', { error });
      return [];
    }
  }

  /**
   * 收集用户设置
   */
  private async collectSettings(): Promise<SyncSettingsData> {
    try {
      // 从 localStorage 或其他存储读取设置
      // 这里返回默认设置，实际应该从 SettingService 获取
      return {
        theme: 'auto',
        language: 'zh',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        weekStartsOn: 1,
        notifications: {
          enabled: true,
          sound: true,
          desktop: true,
          email: false,
        },
        sync: {
          autoSync: true,
          syncInterval: 5,
          conflictStrategy: 'latest-wins',
        },
        privacy: {
          analytics: false,
          crashReports: true,
        },
      };
    } catch (error) {
      this.logger.error('Failed to collect settings', { error });
      return this.getDefaultSettings();
    }
  }

  // ============ 数据应用方法 ============

  /**
   * 应用目标数据
   */
  private async applyGoals(goals: SyncGoalData[]): Promise<void> {
    this.logger.info('Applying goals', { count: goals.length });

    for (const goal of goals) {
      try {
        // 检查是否存在
        const existing = await this.goalService.getGoal(goal.uuid);

        if (existing) {
          // 更新现有目标
          await this.goalService.updateGoal(goal.uuid, {
            title: goal.title,
            description: goal.description,
            priority: goal.priority,
            tags: goal.tags,
          });
        } else {
          // 创建新目标
          await this.goalService.createGoal(this.accountUuid, {
            uuid: goal.uuid,
            title: goal.title,
            description: goal.description,
            priority: goal.priority,
            tags: goal.tags,
            startDate: goal.startDate ? new Date(goal.startDate).toISOString() : undefined,
            endDate: goal.endDate ? new Date(goal.endDate).toISOString() : undefined,
            parentGoalUuid: goal.parentGoalUuid,
          });
        }
      } catch (error) {
        this.logger.error('Failed to apply goal', { uuid: goal.uuid, error });
      }
    }
  }

  /**
   * 应用任务数据
   */
  private async applyTasks(tasks: SyncTaskData[]): Promise<void> {
    this.logger.info('Applying tasks', { count: tasks.length });

    for (const task of tasks) {
      try {
        const existing = await this.taskService.getTemplate(task.uuid);

        if (existing) {
          await this.taskService.updateTemplate(task.uuid, {
            title: task.title,
            description: task.description,
            priority: task.priority,
            tags: task.tags,
          });
        } else {
          await this.taskService.createTemplate({
            accountUuid: this.accountUuid,
            title: task.title,
            description: task.description,
            priority: task.priority,
            tags: task.tags,
            goalUuid: task.goalUuid,
          });
        }
      } catch (error) {
        this.logger.error('Failed to apply task', { uuid: task.uuid, error });
      }
    }
  }

  /**
   * 应用日程数据
   */
  private async applySchedules(schedules: SyncScheduleData[]): Promise<void> {
    this.logger.info('Applying schedules', { count: schedules.length });

    for (const schedule of schedules) {
      try {
        // TODO: 实现日程数据应用
        // 需要 ScheduleService 的 upsert 方法
        this.logger.debug('Schedule apply not implemented', { uuid: schedule.uuid });
      } catch (error) {
        this.logger.error('Failed to apply schedule', { uuid: schedule.uuid, error });
      }
    }
  }

  /**
   * 应用提醒数据
   */
  private async applyReminders(reminders: SyncReminderData[]): Promise<void> {
    this.logger.info('Applying reminders', { count: reminders.length });

    for (const reminder of reminders) {
      try {
        // TODO: 实现提醒数据应用
        // 需要 ReminderService 的 upsert 方法
        this.logger.debug('Reminder apply not implemented', { uuid: reminder.uuid });
      } catch (error) {
        this.logger.error('Failed to apply reminder', { uuid: reminder.uuid, error });
      }
    }
  }

  /**
   * 应用设置数据
   */
  private async applySettings(settings: SyncSettingsData): Promise<void> {
    this.logger.info('Applying settings');

    try {
      // TODO: 实现设置数据应用
      // 需要 SettingService 的 update 方法
      this.logger.debug('Settings apply not implemented', { settings });
    } catch (error) {
      this.logger.error('Failed to apply settings', { error });
    }
  }

  // ============ 辅助方法 ============

  /**
   * 加载同步版本
   */
  private loadSyncVersion(): void {
    try {
      // 在 Electron main 进程中使用 electron-store 或文件存储
      // 这里简化处理
      this.syncVersion = 0;
    } catch (error) {
      this.logger.error('Failed to load sync version', { error });
      this.syncVersion = 0;
    }
  }

  /**
   * 保存同步版本
   */
  private saveSyncVersion(): void {
    try {
      // 在 Electron main 进程中使用 electron-store 或文件存储
      // 这里简化处理
      this.logger.debug('Sync version saved', { version: this.syncVersion });
    } catch (error) {
      this.logger.error('Failed to save sync version', { error });
    }
  }

  /**
   * 获取默认设置
   */
  private getDefaultSettings(): SyncSettingsData {
    return {
      theme: 'auto',
      language: 'zh',
      timezone: 'Asia/Shanghai',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'HH:mm',
      weekStartsOn: 1,
      notifications: {
        enabled: true,
        sound: true,
        desktop: true,
        email: false,
      },
      sync: {
        autoSync: true,
        syncInterval: 5,
        conflictStrategy: 'latest-wins',
      },
      privacy: {
        analytics: false,
        crashReports: true,
      },
    };
  }
}

/**
 * 获取 DataCollector 实例
 */
export function getDataCollector(
  config?: DataCollectorConfig,
  logger?: ILogger
): DataCollector {
  return DataCollector.getInstance(config, logger);
}
