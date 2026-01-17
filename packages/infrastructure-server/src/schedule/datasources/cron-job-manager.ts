/**
 * CronJobManager - Cron 任务管理器
 * 
 * @responsibility
 * - 管理所有 ScheduleTask 的 Cron 任务
 * - 支持动态注册/注销 Cron 任务
 * - 触发时调用 ScheduleTaskExecutor 执行任务
 * 
 * @architecture
 * - 基础设施层（Infrastructure）
 * - 使用 node-cron 管理定时任务
 * - 内存中维护 taskUuid → CronJob 映射
 */

import cron from 'node-cron';
import { createLogger } from '@dailyuse/utils';
import { ScheduleTask } from '@dailyuse/domain-server/schedule';
import { ScheduleTaskExecutor } from '../../application/services/ScheduleTaskExecutor';
import { ScheduleMonitor } from '../monitoring/ScheduleMonitor';

const logger = createLogger('CronJobManager');

type CronJob = ReturnType<typeof cron.schedule>;

export class CronJobManager {
  private static instance: CronJobManager;
  
  /** taskUuid → CronJob 映射表 */
  private jobs: Map<string, CronJob> = new Map();
  
  /** taskUuid → cron 表达式映射表（用于调试） */
  private cronExpressions: Map<string, string> = new Map();

  private executor: ScheduleTaskExecutor;
  private monitor: ScheduleMonitor;

  private constructor() {
    this.executor = ScheduleTaskExecutor.getInstance();
    this.monitor = ScheduleMonitor.getInstance();
  }

  public static getInstance(): CronJobManager {
    if (!CronJobManager.instance) {
      CronJobManager.instance = new CronJobManager();
    }
    return CronJobManager.instance;
  }

  /**
   * 注册任务的 Cron Job
   * 
   * @param task - ScheduleTask 聚合根
   * @returns 是否成功注册
   */
  public registerTask(task: ScheduleTask): boolean {

    const taskUuid = task.uuid;
    const cronExpression = task.schedule.cronExpression;

    if (!cronExpression) {
      logger.warn('⚠️ 任务没有 cron 表达式，跳过注册', {
        taskUuid,
        taskName: task.name,
      });
      return false;
    }

    // 如果任务已经注册，先注销
    if (this.jobs.has(taskUuid)) {
      this.unregisterTask(taskUuid);
    }

    try {
      // 验证 cron 表达式
      if (!cron.validate(cronExpression)) {
        logger.error('❌ 无效的 cron 表达式', {
          taskUuid,
          cronExpression,
        });
        return false;
      }

      // 创建 Cron Job
      const job = cron.schedule(
        cronExpression,
        async () => {
          logger.info('⏰ Cron 触发', {
            taskUuid,
            taskName: task.name,
            cronExpression,
            triggeredAt: new Date().toISOString(),
          });

          try {
            await this.executor!.executeTaskByUuid(taskUuid);
          } catch (error) {
            logger.error('❌ Cron 执行任务失败', {
              taskUuid,
              error,
            });
          }
        },
        {
          timezone: task.schedule.timezone || 'Asia/Shanghai',
        },
      );

      // 根据状态决定是否启动
      // 只有 ACTIVE 状态且 enabled=true 的任务才启动
      if (task.isActive() && task.enabled) {
        job.start();
        logger.info('✅ 任务注册并启动成功', {
          taskUuid,
          taskName: task.name,
          cronExpression,
          timezone: task.schedule.timezone,
          status: task.status,
        });
      } else {
        // 任务已注册但未启动（暂停状态）
        logger.info('⏸️ 任务已注册但未启动（暂停或禁用）', {
          taskUuid,
          taskName: task.name,
          status: task.status,
          enabled: task.enabled,
        });
      }

      // 保存到映射表
      this.jobs.set(taskUuid, job);
      this.cronExpressions.set(taskUuid, cronExpression);

      return true;
    } catch (error) {
      logger.error('❌ 注册任务失败', {
        taskUuid,
        cronExpression,
        error,
      });
      return false;
    }
  }

  /**
   * 注销任务的 Cron Job
   * 
   * @param taskUuid - 任务 UUID
   * @returns 是否成功注销
   */
  public unregisterTask(taskUuid: string): boolean {
    const job = this.jobs.get(taskUuid);
    
    if (!job) {
      logger.warn('⚠️ 任务未注册，无法注销', { taskUuid });
      return false;
    }

    try {
      job.stop();
      this.jobs.delete(taskUuid);
      this.cronExpressions.delete(taskUuid);

      logger.info('✅ 任务注销成功', { taskUuid });
      return true;
    } catch (error) {
      logger.error('❌ 注销任务失败', { taskUuid, error });
      return false;
    }
  }

  /**
   * 启动任务的 Cron Job
   */
  public startTask(taskUuid: string): boolean {
    const job = this.jobs.get(taskUuid);
    
    if (!job) {
      logger.warn('⚠️ 任务未注册，无法启动', { taskUuid });
      return false;
    }

    job.start();
    logger.info('▶️ 任务已启动', { taskUuid });
    return true;
  }

  /**
   * 停止任务的 Cron Job
   */
  public stopTask(taskUuid: string): boolean {
    const job = this.jobs.get(taskUuid);
    
    if (!job) {
      logger.warn('⚠️ 任务未注册，无法停止', { taskUuid });
      return false;
    }

    job.stop();
    logger.info('⏸️ 任务已停止', { taskUuid });
    return true;
  }

  /**
   * 更新任务（重新注册）
   */
  public async updateTask(task: ScheduleTask): Promise<boolean> {
    this.unregisterTask(task.uuid);
    return await this.registerTask(task);
  }

  /**
   * 获取所有已注册任务的统计信息
   */
  public getStats(): {
    totalJobs: number;
    registeredTasks: string[];
    cronExpressions: Record<string, string>;
  } {
    return {
      totalJobs: this.jobs.size,
      registeredTasks: Array.from(this.jobs.keys()),
      cronExpressions: Object.fromEntries(this.cronExpressions),
    };
  }

  /**
   * 获取当前注册的所有任务信息
   */
  public getRegisteredTasks(): Array<{ taskUuid: string; cronExpression: string; isRunning: boolean }> {
    return Array.from(this.jobs.entries()).map(([taskUuid, job]) => ({
      taskUuid,
      cronExpression: this.cronExpressions.get(taskUuid) || 'unknown',
      isRunning: job ? true : false,
    }));
  }

  /**
   * 打印 Cron 任务监控报告
   */
  public printCronMonitorReport(): void {
    const registeredTasks = this.getRegisteredTasks();
    const runningCount = registeredTasks.filter((t) => t.isRunning).length;

    logger.info('📋 CronJobManager 监控报告', {
      已注册任务总数: registeredTasks.length,
      运行中任务: runningCount,
      停止任务: registeredTasks.length - runningCount,
    });

    if (registeredTasks.length > 0) {
      logger.info('任务列表:', {
        tasks: registeredTasks.map((t) => ({
          taskUuid: t.taskUuid,
          cron表达式: t.cronExpression,
          状态: t.isRunning ? '运行中' : '已停止',
        })),
      });
    }

    // 打印执行统计
    this.monitor.printMonitorReport();
  }

  /**
   * 停止所有任务
   */
  public stopAll(): void {
    for (const [taskUuid, job] of this.jobs.entries()) {
      job.stop();
      logger.info('⏸️ 任务已停止', { taskUuid });
    }
  }

  /**
   * 清空所有任务
   */
  public clear(): void {
    this.stopAll();
    this.jobs.clear();
    this.cronExpressions.clear();
    logger.info('🗑️ 所有任务已清空');
  }
}
