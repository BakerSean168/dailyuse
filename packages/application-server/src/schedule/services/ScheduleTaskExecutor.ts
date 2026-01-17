/**
 * ScheduleTaskExecutor - Schedule 任务执行器
 * 
 * @responsibility
 * - 执行到期的 ScheduleTask
 * - 协调领域层和基础设施层
 * - 发布领域事件到事件总线
 * 
 * @architecture
 * - 应用服务层（Application Service）
 * - 使用 Repository 加载聚合根
 * - 调用聚合根的 execute() 方法
 * - 发布领域事件
 */

import { createLogger } from '@dailyuse/utils';
import { ScheduleTask } from '@dailyuse/domain-server/schedule';
import { PrismaScheduleTaskRepository } from '../../infrastructure/repositories/PrismaScheduleTaskRepository';
import { eventBus } from '@dailyuse/utils';
import { ScheduleMonitor } from '../../infrastructure/monitoring/ScheduleMonitor';
import { ReminderContainer } from '../../../reminder/infrastructure/di/ReminderContainer';

const logger = createLogger('ScheduleTaskExecutor');

export class ScheduleTaskExecutor {
  private static instance: ScheduleTaskExecutor;
  private repository: PrismaScheduleTaskRepository;
  private monitor: ScheduleMonitor;

  private constructor() {
    const prisma = ReminderContainer.getInstance().getPrismaClient();
    this.repository = new PrismaScheduleTaskRepository(prisma);
    this.monitor = ScheduleMonitor.getInstance();
  }

  public static getInstance(): ScheduleTaskExecutor {
    if (!ScheduleTaskExecutor.instance) {
      ScheduleTaskExecutor.instance = new ScheduleTaskExecutor();
    }
    return ScheduleTaskExecutor.instance;
  }

  /**
   * 查询所有到期的任务
   * 
   * @param beforeTime - 查询截止时间（默认当前时间）
   * @returns 到期任务列表
   */
  public async findDueTasks(beforeTime?: number): Promise<ScheduleTask[]> {
    const queryTime = beforeTime ?? Date.now();
    
    try {
      const tasks = await this.repository.findDueTasksForExecution(
        new Date(queryTime),
        100, // 限制每次最多100个任务
      );
      
      logger.info('📋 查询到期任务', {
        queryTime: new Date(queryTime).toISOString(),
        foundCount: tasks.length,
      });

      return tasks;
    } catch (error) {
      logger.error('❌ 查询到期任务失败', { error });
      throw error;
    }
  }

  /**
   * 执行单个任务
   * 
   * @param task - 要执行的任务
   */
  public async executeTask(task: ScheduleTask): Promise<void> {
    const taskUuid = task.uuid;
    const taskName = task.taskName;

    // 记录任务开始执行
    this.monitor.recordExecutionStart(taskUuid, taskName);

    try {
      // 执行任务
      const success = task.execute();
      
      if (!success) {
        throw new Error('Task execution returned false');
      }

      // 保存任务状态更新
      await this.repository.save(task);

      // 发布领域事件
      const events = task.getDomainEvents();
      for (const event of events) {
        logger.debug(`发布领域事件: ${event.eventType}`, {
          taskUuid: task.uuid,
          eventType: event.eventType,
        });

        // 使用 emit 发布事件
        eventBus.emit(event.eventType, event);
      }

      // 记录任务执行成功
      this.monitor.recordExecutionSuccess(taskUuid, taskName);
    } catch (error) {
      // 记录任务执行失败
      this.monitor.recordExecutionFailure(taskUuid, taskName, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * 批量执行所有到期任务
   * 
   * @param beforeTime - 查询截止时间
   * @returns 执行结果统计
   */
  public async executeDueTasks(beforeTime?: number): Promise<{
    total: number;
    executed: number;
    skipped: number;
    failed: number;
  }> {
    const tasks = await this.findDueTasks(beforeTime);
    
    const results = {
      total: tasks.length,
      executed: 0,
      skipped: 0,
      failed: 0,
    };

      for (const task of tasks) {
      try {
        if (!task.canExecute()) {
          const reason = this.getCannotExecuteReason(task);
          this.monitor.recordExecutionSkipped(task.uuid, task.taskName, reason);
          results.skipped++;
          continue;
        }

        await this.executeTask(task);
        results.executed++;
      } catch (error) {
        results.failed++;
        logger.error('❌ 任务执行异常', {
          taskUuid: task.uuid,
          error,
        });
      }
    }    logger.info('📊 批量执行完成', results);
    
    return results;
  }

  /**
   * 执行指定 UUID 的任务
   */
  public async executeTaskByUuid(taskUuid: string): Promise<void> {
    const task = await this.repository.findByUuid(taskUuid);
    if (!task) {
      const errorMsg = `任务不存在: ${taskUuid}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const taskName = task.taskName;

    // 检查任务是否可以执行
    if (!task.canExecute()) {
      const reason = this.getCannotExecuteReason(task);
      this.monitor.recordExecutionSkipped(taskUuid, taskName, reason);
      logger.warn(`任务不满足执行条件，跳过执行`, { taskUuid, taskName, reason });
      return;
    }

    await this.executeTask(task);
  }

  /**
   * 获取任务不能执行的原因
   */
  private getCannotExecuteReason(task: ScheduleTask): string {
    if (task.status !== 'active') {
      return `任务状态不是 active: ${task.status}`;
    }
    if (!task.enabled) {
      return '任务未启用';
    }
    const nextRunAt = task.nextRunAt;
    if (!nextRunAt || nextRunAt > new Date()) {
      return `任务尚未到执行时间: ${nextRunAt?.toISOString() || 'N/A'}`;
    }
    const maxExecutions = task.maxExecutions;
    const executionCount = task.executionCount;
    if (maxExecutions && executionCount >= maxExecutions) {
      return `已达到最大执行次数: ${executionCount}/${maxExecutions}`;
    }
    return '未知原因';
  }
}
