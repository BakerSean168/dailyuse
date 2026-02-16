import { eventBus, type DomainEvent } from '@dailyuse/utils';
import type { ScheduleTask } from '../../domain-server/aggregates/schedule-task';
import { ScheduleTaskFactory } from './schedule-task-factory';
import {
  ScheduleStrategyNotFoundError,
  SourceEntityNoScheduleRequiredError,
  ScheduleTaskCreationError,
} from '../../domain-server/value-objects/errors';
import type {
  CreateScheduleTaskUseCase,
  DeleteScheduleTaskUseCase,
  ListScheduleTasksBySourceUseCase,
  PauseScheduleTaskUseCase,
  ResumeScheduleTaskUseCase,
} from '../use-cases';
import type { GoalServerDTO } from '@dailyuse/contracts/goal';
import type { TaskTemplateServerDTO } from '@dailyuse/contracts/task';
import { SourceModule } from '@dailyuse/contracts/schedule';

/**
 * Schedule 领域事件发布器
 * 负责：
 * 1. 监听其他模块（Goal、Task、Reminder）的事件，创建对应的调度任务
 * 2. 发布 ScheduleTask 聚合根的领域事件到事件总线
 * 3. 将领域事件转换为统计事件并更新统计
 */
export class ScheduleEventPublisher {
  private static isInitialized = false;
  private static taskFactory: ScheduleTaskFactory;
  private static useCases: {
    createScheduleTask: CreateScheduleTaskUseCase;
    listScheduleTasksBySource: ListScheduleTasksBySourceUseCase;
    deleteScheduleTask: DeleteScheduleTaskUseCase;
    pauseScheduleTask: PauseScheduleTaskUseCase;
    resumeScheduleTask: ResumeScheduleTaskUseCase;
  } | null = null;

  static configure(useCases: {
    createScheduleTask: CreateScheduleTaskUseCase;
    listScheduleTasksBySource: ListScheduleTasksBySourceUseCase;
    deleteScheduleTask: DeleteScheduleTaskUseCase;
    pauseScheduleTask: PauseScheduleTaskUseCase;
    resumeScheduleTask: ResumeScheduleTaskUseCase;
  }): void {
    this.useCases = useCases;
  }

  /**
   * 初始化事件监听器（在应用启动时调用一次）
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️  [ScheduleEventPublisher] Already initialized, skipping...');
      return;
    }

    console.log('🚀 [ScheduleEventPublisher] Initializing Schedule event listeners...');

    // 初始化工厂
    this.taskFactory = new ScheduleTaskFactory();

    // ============ 监听 Goal 模块事件 ============

    /**
     * 监听 Goal 创建事件，如果有重复模式则创建调度任务
     */
    eventBus.on('goal.created', async (event: DomainEvent) => {
      try {
        if (!event.identityId) {
          console.error('❌ [ScheduleEventPublisher] Missing identityId in goal.created event');
          return;
        }

        const { goal } = event.payload as {
          goal: GoalServerDTO;
        };

        await this.handleGoalCreated(event.identityId, goal);
      } catch (error) {
        console.error('❌ [ScheduleEventPublisher] Error handling goal.created:', error);
      }
    });

    /**
     * 监听 Goal 删除事件，删除对应的调度任务
     */
    eventBus.on('goal.deleted', async (event: DomainEvent) => {
      try {
        if (!event.identityId) {
          console.error('❌ [ScheduleEventPublisher] Missing identityId in goal.deleted event');
          return;
        }

        await this.handleGoalDeleted(event.identityId, event.aggregateId);
      } catch (error) {
        console.error('❌ [ScheduleEventPublisher] Error handling goal.deleted:', error);
      }
    });

    /**
     * 监听 Goal 的计划时间或提醒配置变更事件
     */
    const handleGoalUpdate = async (event: DomainEvent) => {
      try {
        if (!event.identityId) {
          console.error(
            `❌ [ScheduleEventPublisher] Missing identityId in ${event.eventType} event`,
          );
          return;
        }
        const { goal } = event.payload as { goal: GoalServerDTO };
        await this.handleGoalScheduleChanged(event.identityId, goal);
      } catch (error) {
        console.error(`❌ [ScheduleEventPublisher] Error handling ${event.eventType}:`, error);
      }
    };

    eventBus.on('goal.schedule_time_changed', handleGoalUpdate);
    eventBus.on('goal.reminder_config_changed', handleGoalUpdate);

    // ============ 监听 Task 模块事件 ============

    const handleTaskTemplateUpdate = async (event: DomainEvent) => {
      try {
        if (!event.identityId) {
          console.error(
            `❌ [ScheduleEventPublisher] Missing identityId in ${event.eventType} event`,
          );
          return;
        }
        const { taskTemplateData } = event.payload as {
          taskTemplateData: TaskTemplateServerDTO;
        };

        if (!taskTemplateData) {
          console.error(
            `❌ [ScheduleEventPublisher] Missing taskTemplateData in ${event.eventType}`,
          );
          return;
        }

        await this.handleTaskTemplateScheduleChanged(event.identityId, taskTemplateData);
      } catch (error) {
        console.error(`❌ [ScheduleEventPublisher] Error handling ${event.eventType}:`, error);
      }
    };

    // 修正事件名称监听
    eventBus.on('task.template.schedule_changed', handleTaskTemplateUpdate);

    /**
     * 监听 TaskTemplate 暂停事件，删除调度任务
     */
    eventBus.on('task.template.paused', async (event: DomainEvent) => {
      try {
        if (!event.identityId) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing identityId in task.template.paused event',
          );
          return;
        }

        const { taskTemplateId } = event.payload as { taskTemplateId: string };
        console.log(`⏸️  [ScheduleEventPublisher] 处理任务模板暂停: ${taskTemplateId}`);
        // 使用 pause 而不是 delete
        await this.pauseTasksBySource(event.identityId, SourceModule.TASK, taskTemplateId);
      } catch (error) {
        console.error('❌ [ScheduleEventPublisher] Error handling task.template.paused:', error);
      }
    });

    /**
     * 监听 TaskTemplate 恢复/激活事件，重新创建调度任务
     */
    eventBus.on('task.template.resumed', async (event: DomainEvent) => {
      try {
        if (!event.identityId) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing identityId in task.template.resumed event',
          );
          return;
        }

        const { taskTemplateId } = event.payload as {
          taskTemplateId: string;
          taskTemplateData?: TaskTemplateServerDTO;
        };

        console.log(`▶️  [ScheduleEventPublisher] 处理任务模板恢复: ${taskTemplateId}`);
        // 使用 resume 而不是 recreate
        await this.resumeTasksBySource(event.identityId, SourceModule.TASK, taskTemplateId);
      } catch (error) {
        console.error('❌ [ScheduleEventPublisher] Error handling task.template.resumed:', error);
      }
    });

    /**
     * 监听 Task 创建事件
     */
    eventBus.on('task.created', async (event: DomainEvent) => {
      try {
        if (!event.identityId) {
          console.error('❌ [ScheduleEventPublisher] Missing identityId in task.created event');
          return;
        }

        const { task } = event.payload as {
          task: any; // TaskServerDTO
        };

        await this.handleTaskCreated(event.identityId, task);
      } catch (error) {
        console.error('❌ [ScheduleEventPublisher] Error handling task.created:', error);
      }
    });

    /**
     * 监听 Task 删除事件
     */
    eventBus.on('task.deleted', async (event: DomainEvent) => {
      try {
        if (!event.identityId) {
          console.error('❌ [ScheduleEventPublisher] Missing identityId in task.deleted event');
          return;
        }

        await this.handleTaskDeleted(event.identityId, event.aggregateId);
      } catch (error) {
        console.error('❌ [ScheduleEventPublisher] Error handling task.deleted:', error);
      }
    });

    // ============ 监听 Reminder 模块事件 ============

    /**
     * 监听 Reminder 创建事件
     */
    eventBus.on('reminder.template.created', async (event: DomainEvent) => {
      console.log('🎯 [ScheduleEventPublisher] Received reminder.template.created event:', {
        identityId: event.identityId,
        aggregateId: event.aggregateId,
        hasPayload: !!event.payload,
        hasReminder: !!(event.payload as any)?.reminder,
      });

      try {
        if (!event.identityId) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing identityId in reminder.template.created event',
          );
          return;
        }

        const { reminder } = event.payload as {
          reminder: any; // ReminderServerDTO
        };

        if (!reminder) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing reminder in event payload',
            event.payload,
          );
          return;
        }

        await this.handleReminderCreated(event.identityId, reminder);
      } catch (error) {
        console.error(
          '❌ [ScheduleEventPublisher] Error handling reminder.template.created:',
          error,
        );
      }
    });

    /**
     * 监听 Reminder 更新事件（触发器配置变更时需要重新创建调度）
     */
    eventBus.on('reminder.template.updated', async (event: DomainEvent) => {
      try {
        if (!event.identityId) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing identityId in reminder.template.updated event',
          );
          return;
        }

        const { template } = event.payload as { template: any };

        if (!template) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing template in reminder.template.updated event payload',
          );
          return;
        }

        // 使用事件携带的完整数据更新调度
        await this.handleReminderUpdated(event.identityId, template);
      } catch (error) {
        console.error(
          '❌ [ScheduleEventPublisher] Error handling reminder.template.updated:',
          error,
        );
      }
    });

    /**
     * 监听 Reminder 启用事件
     */
    eventBus.on('reminder.template.enabled', async (event: DomainEvent) => {
      try {
        if (!event.identityId) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing identityId in reminder.template.enabled event',
          );
          return;
        }

        // 启用时：恢复调度任务
        await this.resumeTasksBySource(event.identityId, SourceModule.REMINDER, event.aggregateId);
      } catch (error) {
        console.error(
          '❌ [ScheduleEventPublisher] Error handling reminder.template.enabled:',
          error,
        );
      }
    });

    /**
     * 监听 Reminder 禁用事件
     */
    eventBus.on('reminder.template.paused', async (event: DomainEvent) => {
      try {
        if (!event.identityId) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing identityId in reminder.template.paused event',
          );
          return;
        }

        // 禁用时：暂停调度任务
        await this.pauseTasksBySource(event.identityId, SourceModule.REMINDER, event.aggregateId);
      } catch (error) {
        console.error(
          '❌ [ScheduleEventPublisher] Error handling reminder.template.paused:',
          error,
        );
      }
    });

    /**
     * 监听 Reminder 删除事件
     */
    eventBus.on('reminder.template.deleted', async (event: DomainEvent) => {
      try {
        if (!event.identityId) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing identityId in reminder.template.deleted event',
          );
          return;
        }

        await this.handleReminderDeleted(event.identityId, event.aggregateId);
      } catch (error) {
        console.error(
          '❌ [ScheduleEventPublisher] Error handling reminder.template.deleted:',
          error,
        );
      }
    });

    // ============ 监听 ScheduleTask 自身事件（用于统计） ============

    /**
     * 监听调度任务创建事件
     */
    eventBus.on('schedule.task.created', async (event: DomainEvent) => {
      try {
        if (!event.identityId) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing identityId in schedule.task.created event',
          );
          return;
        }

        // TODO: 更新统计数据（待 ScheduleStatisticsApplicationService 实现事件驱动更新）
        console.log(
          `✅ [ScheduleEventPublisher] Handled schedule.task.created for ${event.aggregateId}`,
        );
      } catch (error) {
        console.error('❌ [ScheduleEventPublisher] Error handling schedule.task.created:', error);
      }
    });

    /**
     * 监听调度任务执行成功事件
     */
    eventBus.on('schedule.task.execution_succeeded', async (event: DomainEvent) => {
      try {
        if (!event.identityId) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing identityId in schedule.task.execution_succeeded event',
          );
          return;
        }

        // TODO: 更新统计数据
        console.log(
          `✅ [ScheduleEventPublisher] Handled schedule.task.execution_succeeded for ${event.aggregateId}`,
        );
      } catch (error) {
        console.error(
          '❌ [ScheduleEventPublisher] Error handling schedule.task.execution_succeeded:',
          error,
        );
      }
    });

    /**
     * 监听调度任务执行失败事件
     */
    eventBus.on('schedule.task.execution_failed', async (event: DomainEvent) => {
      try {
        if (!event.identityId) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing identityId in schedule.task.execution_failed event',
          );
          return;
        }

        // TODO: 更新统计数据
        console.log(
          `✅ [ScheduleEventPublisher] Handled schedule.task.execution_failed for ${event.aggregateId}`,
        );
      } catch (error) {
        console.error(
          '❌ [ScheduleEventPublisher] Error handling schedule.task.execution_failed:',
          error,
        );
      }
    });

    /**
     * 监听调度任务完成事件
     */
    eventBus.on('schedule.task.completed', async (event: DomainEvent) => {
      try {
        if (!event.identityId) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing identityId in schedule.task.completed event',
          );
          return;
        }

        // TODO: 更新统计数据
        console.log(
          `✅ [ScheduleEventPublisher] Handled schedule.task.completed for ${event.aggregateId}`,
        );
      } catch (error) {
        console.error('❌ [ScheduleEventPublisher] Error handling schedule.task.completed:', error);
      }
    });

    this.isInitialized = true;
    console.log('✅ [ScheduleEventPublisher] All event listeners registered successfully!');
  }

  /**
   * 处理 Goal 创建事件
   */
  private static async handleGoalCreated(
    identityId: string,
    goal: GoalServerDTO,
  ): Promise<void> {
    try {
      if (!this.useCases) {
        console.error('❌ [ScheduleEventPublisher] Use cases not configured');
        return;
      }

      // 使用工厂创建调度任务
      const scheduleTask = this.taskFactory.createFromSourceEntity({
        identityId,
        sourceModule: SourceModule.GOAL,
        sourceEntityId: goal.id,
        sourceEntity: goal,
      });

      // 保存调度任务
      const metadataDTO = scheduleTask.metadata.toServerDTO();

      await this.useCases.createScheduleTask.execute({
        identityId,
        name: scheduleTask.name,
        description: scheduleTask.description ?? undefined,
        sourceModule: scheduleTask.sourceModule,
        sourceId: scheduleTask.sourceEntityId,
        scheduleConfig: scheduleTask.schedule.toServerDTO(),
        handlerType: 'domain-event',
        handlerPayload: metadataDTO.payload,
        retryPolicy: scheduleTask.retryPolicy,
      });

      console.log(`✅ [ScheduleEventPublisher] Created schedule task for Goal ${goal.id}`);
    } catch (error: any) {
      // 如果 Goal 不需要调度（没有启用 reminderConfig），这是正常情况
      if (error.message?.includes('does not require')) {
        console.log(`ℹ️  [ScheduleEventPublisher] Goal ${goal.id} does not require scheduling`);
      } else {
        console.error(
          `❌ [ScheduleEventPublisher] Failed to create schedule for Goal ${goal.id}:`,
          error,
        );
      }
    }
  }

  /**
   * 处理 Goal 删除事件
   */
  private static async handleGoalDeleted(identityId: string, goalId: string): Promise<void> {
    console.log(`🗑️ [ScheduleEventPublisher] Handling goal deletion for: ${goalId}`);
    await this.deleteTasksBySource(identityId, SourceModule.GOAL, goalId);
  }

  /**
   * 处理 Goal 计划变更事件
   * (删除旧的调度，并根据新配置创建新的调度)
   */
  private static async handleGoalScheduleChanged(
    identityId: string,
    goal: GoalServerDTO,
  ): Promise<void> {
    console.log(`🔄 [ScheduleEventPublisher] Handling goal schedule change for: ${goal.id}`);

    // 1. 删除此目标的所有现有调度任务
    await this.handleGoalDeleted(identityId, goal.id);

    // 2. 根据更新后的目标信息重新创建调度任务
    await this.handleGoalCreated(identityId, goal);

    console.log(
      `✅ [ScheduleEventPublisher] Successfully handled goal schedule change for: ${goal.id}`,
    );
  }

  /**
   * 处理 TaskTemplate 计划变更事件
   */
  private static async handleTaskTemplateScheduleChanged(
    identityId: string,
    taskTemplate: TaskTemplateServerDTO,
  ): Promise<void> {
    console.log(
      `🔄 [ScheduleEventPublisher] Handling task template schedule change for: ${taskTemplate.id}`,
    );

    // 1. 删除此模板的所有现有调度任务
    await this.deleteTasksBySource(identityId, SourceModule.TASK, taskTemplate.id);

    // 2. 根据更新后的模板信息重新创建调度任务
    await this.handleTaskCreated(identityId, taskTemplate);

    console.log(
      `✅ [ScheduleEventPublisher] Successfully handled task template schedule change for: ${taskTemplate.id}`,
    );
  }

  /**
   * Helper to delete schedule tasks for a given source.
   */
  private static async deleteTasksBySource(
    identityId: string,
    sourceType: SourceModule,
    sourceId: string,
  ): Promise<void> {
    try {
      if (!this.useCases) {
        console.error('❌ [ScheduleEventPublisher] Use cases not configured');
        return;
      }

      const tasks = await this.useCases.listScheduleTasksBySource.execute(sourceType, sourceId);
      const deletions = tasks
        .filter((task) => task.identityId === identityId)
        .map((task) => this.useCases!.deleteScheduleTask.execute(task.id));

      await Promise.all(deletions);
      console.log(
        `✅ [ScheduleEventPublisher] Triggered deletion for tasks related to ${sourceType} ${sourceId}`,
      );
    } catch (error) {
      console.error(
        `❌ [ScheduleEventPublisher] Error deleting tasks for ${sourceType} ${sourceId}:`,
        error,
      );
    }
  }

  /**
   * Helper to pause schedule tasks for a given source.
   */
  private static async pauseTasksBySource(
    identityId: string,
    sourceType: SourceModule,
    sourceId: string,
  ): Promise<void> {
    try {
      if (!this.useCases) {
        console.error('❌ [ScheduleEventPublisher] Use cases not configured');
        return;
      }

      const tasks = await this.useCases.listScheduleTasksBySource.execute(sourceType, sourceId);

      for (const task of tasks) {
        if (task.identityId !== identityId) continue;
        await this.useCases.pauseScheduleTask.execute(task.id);
      }

      console.log(
        `✅ [ScheduleEventPublisher] Paused ${tasks.length} tasks related to ${sourceType} ${sourceId}`,
      );
    } catch (error) {
      console.error(
        `❌ [ScheduleEventPublisher] Error pausing tasks for ${sourceType} ${sourceId}:`,
        error,
      );
    }
  }

  /**
   * Helper to resume schedule tasks for a given source.
   */
  private static async resumeTasksBySource(
    identityId: string,
    sourceType: SourceModule,
    sourceId: string,
  ): Promise<void> {
    try {
      if (!this.useCases) {
        console.error('❌ [ScheduleEventPublisher] Use cases not configured');
        return;
      }

      const tasks = await this.useCases.listScheduleTasksBySource.execute(sourceType, sourceId);

      for (const task of tasks) {
        if (task.identityId !== identityId) continue;
        await this.useCases.resumeScheduleTask.execute(task.id);
      }

      console.log(
        `✅ [ScheduleEventPublisher] Resumed ${tasks.length} tasks related to ${sourceType} ${sourceId}`,
      );
    } catch (error) {
      console.error(
        `❌ [ScheduleEventPublisher] Error resuming tasks for ${sourceType} ${sourceId}:`,
        error,
      );
    }
  }

  /**
   * 处理 Task 创建事件
   */
  private static async handleTaskCreated(
    identityId: string,
    task: any, // TaskServerDTO
  ): Promise<void> {
    try {
      if (!this.useCases) {
        console.error('❌ [ScheduleEventPublisher] Use cases not configured');
        return;
      }

      // 使用工厂创建调度任务
      const scheduleTask = this.taskFactory.createFromSourceEntity({
        identityId,
        sourceModule: SourceModule.TASK,
        sourceEntityId: task.id,
        sourceEntity: task,
      });

      // 保存调度任务
      const metadataDTO = scheduleTask.metadata.toServerDTO();

      await this.useCases.createScheduleTask.execute({
        identityId,
        name: scheduleTask.name,
        description: scheduleTask.description ?? undefined,
        sourceModule: scheduleTask.sourceModule,
        sourceId: scheduleTask.sourceEntityId,
        scheduleConfig: scheduleTask.schedule.toServerDTO(),
        handlerType: 'domain-event',
        handlerPayload: metadataDTO.payload,
        retryPolicy: scheduleTask.retryPolicy,
      });

      console.log(`✅ [ScheduleEventPublisher] Created schedule task for Task ${task.id}`);
    } catch (error: any) {
      // 如果 Task 不需要调度（不是循环任务或没有提醒配置），这是正常情况
      if (error.message?.includes('does not have valid')) {
        console.log(`ℹ️  [ScheduleEventPublisher] Task ${task.id} does not require scheduling`);
      } else {
        console.error(
          `❌ [ScheduleEventPublisher] Failed to create schedule for Task ${task.id}:`,
          error,
        );
      }
    }
  }

  /**
   * 处理 Task 删除事件
   */
  private static async handleTaskDeleted(identityId: string, taskId: string): Promise<void> {
    console.log(`🗑️ [ScheduleEventPublisher] Handling task deletion for: ${taskId}`);
    await this.deleteTasksBySource(identityId, SourceModule.TASK, taskId);
  }

  /**
   * 处理 Reminder 删除事件
   */
  private static async handleReminderDeleted(
    identityId: string,
    reminderId: string,
  ): Promise<void> {
    console.log(`🗑️ [ScheduleEventPublisher] Handling reminder deletion for: ${reminderId}`);
    await this.deleteTasksBySource(identityId, SourceModule.REMINDER, reminderId);
  }

  /**
   * 处理 Reminder 创建事件
   */
  private static async handleReminderCreated(
    identityId: string,
    reminder: any, // ReminderServerDTO
  ): Promise<void> {
    const operationId = `handle-reminder-created-${reminder.id}-${Date.now()}`;

    try {
      if (!this.useCases) {
        console.error('❌ [ScheduleEventPublisher] Use cases not configured');
        return;
      }

      // 使用工厂创建调度任务
      const scheduleTask = this.taskFactory.createFromSourceEntity({
        identityId,
        sourceModule: SourceModule.REMINDER,
        sourceEntityId: reminder.id,
        sourceEntity: reminder,
      });

      // 保存调度任务
      const metadataDTO = scheduleTask.metadata.toServerDTO();

      await this.useCases.createScheduleTask.execute({
        identityId,
        name: scheduleTask.name,
        description: scheduleTask.description ?? undefined,
        sourceModule: scheduleTask.sourceModule,
        sourceId: scheduleTask.sourceEntityId,
        scheduleConfig: scheduleTask.schedule.toServerDTO(),
        handlerType: 'domain-event',
        handlerPayload: metadataDTO.payload,
        retryPolicy: scheduleTask.retryPolicy,
      });

      console.log(
        `✅ [ScheduleEventPublisher] Created schedule task for Reminder ${reminder.id}`,
      );
    } catch (error: any) {
      // 如果 Reminder 不需要调度（未启用或配置无效），这是正常情况
      if (error instanceof SourceEntityNoScheduleRequiredError) {
        console.log(
          `ℹ️  [ScheduleEventPublisher] Reminder ${reminder.id} does not require scheduling: ${error.message}`,
          {
            operationId,
            context: error.context,
          },
        );
        return;
      }

      // 策略未找到是配置错误
      if (error instanceof ScheduleStrategyNotFoundError) {
        console.error(
          `❌ [ScheduleEventPublisher] Strategy not found for Reminder ${reminder.id}:`,
          {
            operationId,
            error: error.toLogString(),
            availableModules: error.context?.availableModules,
          },
        );
        return;
      }

      // 其他错误需要记录详细信息
      if (error instanceof ScheduleTaskCreationError) {
        console.error(
          `❌ [ScheduleEventPublisher] Failed to create schedule for Reminder ${reminder.id}:`,
          {
            operationId,
            error: error.toLogString(),
            errorChain: error.getErrorChain(),
          },
        );
      } else {
        console.error(
          `❌ [ScheduleEventPublisher] Unexpected error creating schedule for Reminder ${reminder.id}:`,
          {
            operationId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
        );
      }
    }
  }

  /**
   * 处理 Reminder 更新事件
   * 删除旧的调度任务并根据新配置创建新的调度任务
   */
  private static async handleReminderUpdated(
    identityId: string,
    reminder: any, // ReminderServerDTO
  ): Promise<void> {
    const reminderId = reminder.id;
    console.log(`🔄 [ScheduleEventPublisher] Handling reminder update for: ${reminderId}`);

    try {
      // 1. 删除此提醒的所有现有调度任务
      await this.handleReminderDeleted(identityId, reminderId);

      // 2. 根据更新后的提醒信息重新创建调度任务
      await this.handleReminderCreated(identityId, reminder);

      console.log(
        `✅ [ScheduleEventPublisher] Successfully handled reminder update for: ${reminderId}`,
      );
    } catch (error) {
      console.error(
        `❌ [ScheduleEventPublisher] Error handling reminder update for ${reminderId}:`,
        error,
      );
    }
  }

  /**
   * 发布 ScheduleTask 聚合根的领域事件
   * @param task ScheduleTask 聚合根实例
   */
  static async publishScheduleTaskEvents(task: ScheduleTask): Promise<void> {
    const events = task.getDomainEvents();
    if (events.length === 0) {
      return;
    }

    console.log(
      `📤 [ScheduleEventPublisher] Publishing ${events.length} events for schedule task ${task.id}`,
    );

    for (const event of events) {
      await eventBus.publish(event);
    }

    // 清除已发布的事件
    task.clearDomainEvents();
  }

  /**
   * 重置事件监听器（主要用于测试）
   */
  static reset(): void {
    console.log('🔄 [ScheduleEventPublisher] Resetting event listeners...');

    // 移除所有 Schedule 相关的事件监听器
    const eventTypes = [
      // Goal 模块事件
      'goal.created',
      'goal.deleted',
      'goal.schedule_time_changed',
      'goal.reminder_config_changed',
      // Task 模块事件
      'task.created',
      'task.deleted',
      'task.template.paused',
      'task.template.resumed',
      'task_template.schedule_time_changed',
      'task_template.recurrence_changed',
      // Reminder 模块事件
      'reminder.template.created',
      'reminder.template.updated',
      'reminder.template.enabled',
      'reminder.template.paused',
      'reminder.template.deleted',
      // ScheduleTask 自身事件
      'schedule.task.created',
      'schedule.task.execution_succeeded',
      'schedule.task.execution_failed',
      'schedule.task.completed',
    ];

    for (const eventType of eventTypes) {
      eventBus.off(eventType);
    }

    this.isInitialized = false;
  }
}
