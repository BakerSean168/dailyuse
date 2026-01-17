/**
 * ScheduleBootstrap - Schedule 模块启动器
 * 
 * @responsibility
 * - 在 API 服务启动时初始化 Schedule 模块
 * - 从数据库加载所有活跃任务到 CronJobManager
 * - 注册事件监听器
 * 
 * @usage
 * 在 apps/api/src/main.ts 中调用：
 * await ScheduleBootstrap.getInstance().initialize();
 */

import { createLogger } from '@dailyuse/utils';
import { CronJobManager } from '../../infrastructure/cron/CronJobManager';
import { PrismaScheduleTaskRepository } from '../../infrastructure/repositories/PrismaScheduleTaskRepository';
import { ScheduleMonitor } from '../../infrastructure/monitoring/ScheduleMonitor';
import { ReminderContainer } from '../../../reminder/infrastructure/di/ReminderContainer';

const logger = createLogger('ScheduleBootstrap');

export class ScheduleBootstrap {
  private static instance: ScheduleBootstrap;
  private initialized = false;
  private cronManager: CronJobManager;
  private repository: PrismaScheduleTaskRepository;
  private monitor: ScheduleMonitor;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    const prisma = ReminderContainer.getInstance().getPrismaClient();
    this.repository = new PrismaScheduleTaskRepository(prisma);
    this.cronManager = CronJobManager.getInstance();
    this.monitor = ScheduleMonitor.getInstance();
    
    // 启动定期监控报告（每10分钟）
    this.startPeriodicMonitoring();
  }

  public static getInstance(): ScheduleBootstrap {
    if (!ScheduleBootstrap.instance) {
      ScheduleBootstrap.instance = new ScheduleBootstrap();
    }
    return ScheduleBootstrap.instance;
  }

  /**
   * 初始化 Schedule 模块
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('⚠️ Schedule 模块已经初始化过了');
      return;
    }

    try {
      logger.info('🚀 开始初始化 Schedule 模块...');

      // 从数据库加载所有活跃任务
      await this.loadActiveTasks();

      this.initialized = true;
      logger.info('✅ Schedule 模块初始化完成');
    } catch (error) {
      logger.error('❌ Schedule 模块初始化失败', { error });
      throw error;
    }
  }

  /**
   * 从数据库加载所有活跃任务到 CronJobManager
   */
  private async loadActiveTasks(): Promise<void> {
    try {
      // 查询所有启用的活跃任务
      const tasks = await this.repository.findEnabled();

      logger.info('📋 查询到活跃任务', { count: tasks.length });

      // 注册到 CronJobManager
      let successCount = 0;
      let failedCount = 0;

      for (const task of tasks) {
        try {
          // 只注册状态为 active 的任务
          if (task.status !== 'active') {
            continue;
          }
          
          const registered = this.cronManager.registerTask(task);
          if (registered) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          logger.error('❌ 注册任务失败', {
            taskUuid: task.uuid,
            taskName: task.taskName,
            error,
          });
          failedCount++;
        }
      }

      logger.info('✅ 任务加载完成', {
        total: tasks.length,
        success: successCount,
        failed: failedCount,
      });

      // 打印统计信息
      const stats = this.cronManager.getStats();
      logger.info('📊 CronJobManager 统计', stats);
    } catch (error) {
      logger.error('❌ 加载活跃任务失败', { error });
      throw error;
    }
  }

  /**
   * 关闭 Schedule 模块
   */
  public async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    logger.info('🛑 关闭 Schedule 模块...');
    this.stopPeriodicMonitoring();
    this.cronManager.stopAll();
    this.initialized = false;
    logger.info('✅ Schedule 模块已关闭');
  }

  /**
   * 重新加载所有任务（用于配置变更后）
   */
  public async reload(): Promise<void> {
    logger.info('🔄 重新加载 Schedule 任务...');
    this.cronManager.clear();
    await this.loadActiveTasks();
    logger.info('✅ 任务重新加载完成');
  }

  /**
   * 启动定期监控报告
   */
  private startPeriodicMonitoring(): void {
    // 每10分钟打印一次监控报告
    this.monitoringInterval = setInterval(() => {
      logger.info('=== 定期监控报告 ===');
      this.cronManager.printCronMonitorReport();
    }, 10 * 60 * 1000); // 10分钟

    logger.info('定期监控已启动 (每10分钟报告一次)');
  }

  /**
   * 停止定期监控报告
   */
  private stopPeriodicMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('定期监控已停止');
    }
  }
}
