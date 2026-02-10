/**
 * Goal 模块的 Task 事件处理器
 * 监听任务模块事件并执行相应的业务逻辑
 */

import { eventBus } from '@dailyuse/utils';
import type {
  TaskTemplateServerDTO,
  TaskInstanceServerDTO,
  TaskInstanceCompletedEvent,
} from '@dailyuse/contracts/task';
import { GoalRecordApplicationService } from '../services/GoalRecordApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalTaskEventHandlers');

/**
 * Goal 模块的 Task 事件处理器类
 */
export class GoalTaskEventHandlers {
  private recordService: GoalRecordApplicationService | null = null;
  private isInitialized = false;

  constructor() {}

  /**
   * 初始化事件监听器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Event handlers already initialized');
      return;
    }

    logger.info('Initializing Goal module task event handlers...');

    // 获取 GoalRecordApplicationService 实例
    this.recordService = new GoalRecordApplicationService(repositoryFactory);

    // 监听任务完成事件
    eventBus.on('task.instance.completed', this.handleTaskInstanceCompleted.bind(this));

    this.isInitialized = true;
    logger.info('✅ Goal module task event handlers initialized');
  }

  /**
   * 处理任务实例完成事件
   * 当任务实例完成且有关联的目标绑定时，自动创建进度记录
   */
  private async handleTaskInstanceCompleted(event: TaskInstanceCompletedEvent): Promise<void> {
    const { payload } = event;
    const { goalBinding, title, completedAt, accountUuid } = payload;

    // 如果没有目标绑定，直接返回
    if (!goalBinding) {
      logger.debug('Task completed without goal binding, skipping record creation');
      return;
    }

    try {
      logger.info('📝 Creating progress record for completed task', {
        taskTitle: title,
        goalUuid: goalBinding.goalUuid,
        keyResultUuid: goalBinding.keyResultUuid,
        incrementValue: goalBinding.incrementValue,
      });

      // 创建进度记录
      await this.recordService!.createGoalRecord(goalBinding.goalUuid, goalBinding.keyResultUuid, {
        value: goalBinding.incrementValue,
        note: `完成任务：${title}`,
        recordedAt: completedAt,
      });

      logger.info('✅ Progress record created successfully for task completion');
    } catch (error) {
      logger.error('❌ Failed to create progress record for task completion', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        taskTitle: title,
        goalBinding,
      });

      // 不抛出错误，避免影响任务完成流程
      // 可以在这里添加重试逻辑或发送告警通知
    }
  }

  /**
   * 销毁事件监听器（用于测试或模块卸载）
   */
  destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    logger.info('Destroying Goal module task event handlers...');

    eventBus.off('task.instance.completed', this.handleTaskInstanceCompleted.bind(this));

    this.isInitialized = false;
    this.recordService = null;

    logger.info('✅ Goal module task event handlers destroyed');
  }
}
