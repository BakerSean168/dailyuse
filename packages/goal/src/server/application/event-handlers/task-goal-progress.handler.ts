import { GoalRecordSourceType } from '@memoflow/contracts/goal';
import type { TaskGoalProgressOutboxEventV1 } from '@memoflow/contracts/task';
import { TaskGoalBindingTrigger } from '@memoflow/contracts/task';
import type { IGoalRecordRepository, IGoalRepository } from '../../domain';
import { CreateGoalRecordUseCase } from '../use-cases/commands/create-goal-record.use-case';
import type { GoalWriteTransactionRunner } from '../use-cases/commands/goal-write-support';

export interface TaskGoalProgressHandler {
  handle(event: TaskGoalProgressOutboxEventV1): Promise<void>;
}

type CreateGoalRecordPort = Pick<CreateGoalRecordUseCase, 'execute'>;

/**
 * Goal-owned consumer for the durable Task -> Goal contract.
 *
 * Idempotency is expressed in Goal's own language: GoalRecord has a database
 * unique key over identity + source type + source ID. Replaying an outbox event
 * therefore returns the existing contribution instead of incrementing twice.
 */
export class GoalTaskProgressHandler implements TaskGoalProgressHandler {
  constructor(private readonly createGoalRecord: CreateGoalRecordPort) {}

  async handle(event: TaskGoalProgressOutboxEventV1): Promise<void> {
    if (event.schemaVersion !== 1 || event.eventType !== 'task.goal-progress-requested') {
      throw new Error(`Unsupported Task -> Goal event contract: ${event.eventType}`);
    }

    const allInstances = event.progressTrigger === TaskGoalBindingTrigger.AllInstancesCompleted;
    const source = allInstances
      ? { type: GoalRecordSourceType.TaskTemplate, id: String(event.taskTemplateId) }
      : { type: GoalRecordSourceType.TaskInstance, id: String(event.taskInstanceId) };
    const note = allInstances
      ? `模板实例全部完成: ${event.taskTitle}`
      : `任务实例完成: ${event.taskTitle}`;

    const result = await this.createGoalRecord.execute(
      String(event.goalId),
      String(event.keyResultId),
      { value: event.goalRecordValue, note, source },
      String(event.identityId),
    );

    if (!result.ok) {
      throw new Error(
        `Task -> Goal delivery failed (${result.error.code}): ${result.error.message}`,
      );
    }
  }
}

export function createGoalTaskProgressHandler(
  goalRepository: IGoalRepository,
  goalRecordRepository: IGoalRecordRepository,
  transactionRunner?: GoalWriteTransactionRunner,
): TaskGoalProgressHandler {
  return new GoalTaskProgressHandler(
    new CreateGoalRecordUseCase(goalRepository, goalRecordRepository, transactionRunner),
  );
}
