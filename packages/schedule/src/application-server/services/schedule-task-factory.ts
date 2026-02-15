/**
 * ScheduleTaskFactory application service
 *
 * Orchestrates strategy selection and aggregate creation for schedule tasks.
 */

import { SourceModule } from '@dailyuse/contracts/schedule';
import { ScheduleTask } from '../../domain-server/aggregates/schedule-task';
import { ScheduleStrategyFactory } from '../../domain-server/services/strategies/ScheduleStrategyFactory';
import type { ScheduleStrategyInput } from '../../domain-server/services/strategies/IScheduleStrategy';
import { RetryPolicy } from '../../domain-server/value-objects/RetryPolicy';
import {
  ScheduleStrategyNotFoundError,
  SourceEntityNoScheduleRequiredError,
  ScheduleTaskCreationError,
} from '../../domain-server/value-objects/ScheduleErrors';

/**
 * ScheduleTaskFactory
 */
export class ScheduleTaskFactory {
  private strategyFactory: ScheduleStrategyFactory;

  constructor() {
    this.strategyFactory = ScheduleStrategyFactory.getInstance();
  }

  /**
   * Create a schedule task from a source entity.
   */
  public createFromSourceEntity(input: ScheduleStrategyInput): ScheduleTask {
    const { sourceModule, sourceEntityId, sourceEntity } = input;

    try {
      const strategy = this.strategyFactory.getStrategy(sourceModule);
      if (!strategy) {
        const availableModules = this.strategyFactory.getSupportedModules();
        throw new ScheduleStrategyNotFoundError(sourceModule, {
          availableModules,
          operationId: `create-schedule-task-${sourceModule}-${sourceEntityId}-${Date.now()}`,
        });
      }

      if (!strategy.shouldCreateSchedule(sourceEntity)) {
        throw new SourceEntityNoScheduleRequiredError(
          sourceModule,
          sourceEntityId,
          'Source entity does not meet scheduling requirements',
        );
      }

      const strategyOutput = strategy.createSchedule(input);

      return ScheduleTask.create({
        identityId: input.identityId,
        name: strategyOutput.name,
        description: strategyOutput.description ?? undefined,
        sourceModule,
        sourceEntityId,
        schedule: strategyOutput.scheduleConfig,
        retryPolicy: RetryPolicy.createDefault(),
        metadata: strategyOutput.metadata,
      });
    } catch (error) {
      if (
        error instanceof ScheduleStrategyNotFoundError ||
        error instanceof SourceEntityNoScheduleRequiredError
      ) {
        throw error;
      }

      throw new ScheduleTaskCreationError(
        sourceModule,
        sourceEntityId,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Create schedule tasks in batch.
   */
  public createBatch(inputs: ScheduleStrategyInput[]): ScheduleTask[] {
    const tasks: ScheduleTask[] = [];

    for (const input of inputs) {
      try {
        const task = this.createFromSourceEntity(input);
        tasks.push(task);
      } catch (error) {
        console.error(
          `Failed to create schedule task for ${input.sourceModule}:${input.sourceEntityId}`,
          error,
        );
      }
    }

    return tasks;
  }

  /**
   * Update an existing task when the source entity changes.
   */
  public updateFromSourceEntity(existingTask: ScheduleTask, input: ScheduleStrategyInput): void {
    const { sourceModule, sourceEntity } = input;

    const strategy = this.strategyFactory.getStrategy(sourceModule);
    if (!strategy) {
      throw new Error(`No schedule strategy found for source module: ${sourceModule}`);
    }

    if (!strategy.shouldCreateSchedule(sourceEntity)) {
      throw new Error('Source entity no longer requires scheduling');
    }

    const strategyOutput = strategy.createSchedule(input);

    existingTask.updateSchedule(strategyOutput.scheduleConfig.toServerDTO());
  }

  /**
   * Check whether a source module is supported.
   */
  public supportsSourceModule(sourceModule: SourceModule): boolean {
    return this.strategyFactory.supports(sourceModule);
  }
}
