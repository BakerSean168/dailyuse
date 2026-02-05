/**
 * ScheduleTaskFactory 领域服务
 * 
 * 职责：
 * - 协调策略工厂和聚合根创建
 * - 从源实体数据创建 ScheduleTask 聚合根
 * - 处理调度任务的创建业务逻辑
 */

import { SourceModule } from '@dailyuse/contracts/schedule';
import { ScheduleTask } from '../aggregates/ScheduleTask';
import { ScheduleStrategyFactory } from './strategies/ScheduleStrategyFactory';
import type { ScheduleStrategyInput } from './strategies/IScheduleStrategy';
import { ExecutionInfo } from '../value-objects/ExecutionInfo';
import { RetryPolicy } from '../value-objects/RetryPolicy';
import {
  ScheduleStrategyNotFoundError,
  SourceEntityNoScheduleRequiredError,
  ScheduleTaskCreationError,
  ScheduleTaskUpdateError,
} from '../value-objects/ScheduleErrors';

/**
 * ScheduleTaskFactory 领域服务
 */
export class ScheduleTaskFactory {
  private strategyFactory: ScheduleStrategyFactory;

  constructor() {
    this.strategyFactory = ScheduleStrategyFactory.getInstance();
  }

  /**
   * 从源实体创建调度任务
   * 
   * @param input 策略输入数据
   * @returns ScheduleTask 聚合根实例
   * @throws ScheduleStrategyNotFoundError 如果源模块不支持
   * @throws SourceEntityNoScheduleRequiredError 如果源实体不需要调度
   * @throws ScheduleTaskCreationError 如果创建过程失败
   */
  public createFromSourceEntity(input: ScheduleStrategyInput): ScheduleTask {
    const { identityId, sourceModule, sourceEntityId, sourceEntity } = input;
    const operationId = `create-schedule-task-${sourceModule}-${sourceEntityId}-${Date.now()}`;

    try {
      // 获取对应的策略
      const strategy = this.strategyFactory.getStrategy(sourceModule);
      if (!strategy) {
        const availableModules = this.strategyFactory.getSupportedModules();
        throw new ScheduleStrategyNotFoundError(sourceModule, {
          availableModules,
          operationId,
        });
      }

      // 检查是否需要创建调度任务
      if (!strategy.shouldCreateSchedule(sourceEntity)) {
        throw new SourceEntityNoScheduleRequiredError(
          sourceModule,
          sourceEntityId,
          'Source entity does not meet scheduling requirements',
        );
      }

      // 使用策略生成调度配置
      const strategyOutput = strategy.createSchedule(input);

      // 创建 ScheduleTask 聚合根
      const scheduleTask = ScheduleTask.create({
        identityId,
        name: strategyOutput.name,
        description: strategyOutput.description ?? undefined,
        sourceModule,
        sourceEntityId,
        schedule: strategyOutput.scheduleConfig,
        retryPolicy: RetryPolicy.createDefault(),
        metadata: strategyOutput.metadata,
      });

      return scheduleTask;
    } catch (error) {
      // 如果已经是我们的错误类型，直接重新抛出
      if (
        error instanceof ScheduleStrategyNotFoundError ||
        error instanceof SourceEntityNoScheduleRequiredError
      ) {
        throw error;
      }

      // 其他错误包装为 ScheduleTaskCreationError
      throw new ScheduleTaskCreationError(
        sourceModule,
        sourceEntityId,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 批量创建调度任务
   * 
   * @param inputs 多个策略输入
   * @returns 成功创建的任务列表
   */
  public createBatch(inputs: ScheduleStrategyInput[]): ScheduleTask[] {
    const tasks: ScheduleTask[] = [];

    for (const input of inputs) {
      try {
        const task = this.createFromSourceEntity(input);
        tasks.push(task);
      } catch (error) {
        // 记录错误但继续处理其他任务
        console.error(
          `Failed to create schedule task for ${input.sourceModule}:${input.sourceEntityId}`,
          error,
        );
      }
    }

    return tasks;
  }

  /**
   * 更新现有调度任务（当源实体变更时）
   * 
   * @param existingTask 现有的调度任务
   * @param input 更新的源实体数据
   * @returns 更新后的任务（修改现有实例）
   */
  public updateFromSourceEntity(
    existingTask: ScheduleTask,
    input: ScheduleStrategyInput,
  ): void {
    const { sourceModule, sourceEntity } = input;

    // 获取对应的策略
    const strategy = this.strategyFactory.getStrategy(sourceModule);
    if (!strategy) {
      throw new Error(`No schedule strategy found for source module: ${sourceModule}`);
    }

    // 检查是否需要保留调度任务
    if (!strategy.shouldCreateSchedule(sourceEntity)) {
      // 如果源实体不再需要调度，应该删除任务（由调用方处理）
      throw new Error(`Source entity no longer requires scheduling`);
    }

    // 使用策略生成新的调度配置
    const strategyOutput = strategy.createSchedule(input);

    // 更新任务配置（使用聚合根提供的方法）
    existingTask.updateSchedule(strategyOutput.scheduleConfig.toServerDTO());
    
    // TODO: 添加更多更新方法到 ScheduleTask 聚合根
    // existingTask.updateMetadata(strategyOutput.metadata);
    // existingTask.updateDescription(strategyOutput.description);
  }

  /**
   * 判断源实体是否支持调度
   */
  public supportsSourceModule(sourceModule: SourceModule): boolean {
    return this.strategyFactory.supports(sourceModule);
  }
}
