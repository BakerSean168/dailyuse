import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import { createTypedEventPublisher, eventBus } from '@memoflow/utils/domain';
import { TaskGoalBindingTrigger } from '@memoflow/contracts/task';
import type { TaskEventMap, TaskGoalBindingDTO } from '@memoflow/contracts/task';
import { ok } from '@memoflow/contracts/result';
import type { IGoalRepository } from '../../../domain/repositories/i-goal-repository';
import type { IGoalRecordRepository } from '../../../domain/repositories/i-goal-record-repository';
import { CreateGoalRecordUseCase } from '../../use-cases/commands/create-goal-record.use-case';
import { registerGoalEventListeners } from '../index';

type CompletedEvent = TaskEventMap['task:instance-completed'];

const taskPublisher = createTypedEventPublisher<Pick<TaskEventMap, 'task:instance-completed'>>(
  eventBus,
);

function aGoalBinding(overrides: Partial<TaskGoalBindingDTO> = {}): TaskGoalBindingDTO {
  return {
    goalId: 'goal-1' as TaskGoalBindingDTO['goalId'],
    keyResultId: 'kr-1' as TaskGoalBindingDTO['keyResultId'],
    goalRecordValue: 1,
    progressTrigger: TaskGoalBindingTrigger.PerInstance,
    ...overrides,
  };
}

function aCompletedEvent(overrides: Partial<CompletedEvent> = {}): CompletedEvent {
  return {
    identityId: 'identity-1' as CompletedEvent['identityId'],
    taskInstanceId: 'ti-1' as CompletedEvent['taskInstanceId'],
    taskTemplateId: 'tt-1' as CompletedEvent['taskTemplateId'],
    completedAt: Date.now(),
    taskTitle: 'Write ADR',
    goalBinding: aGoalBinding(),
    allInstancesCompleted: false,
    ...overrides,
  };
}

describe('registerGoalEventListeners', () => {
  let goalRepository: ReturnType<typeof createMockRepo<IGoalRepository>>;
  let goalRecordRepository: ReturnType<typeof createMockRepo<IGoalRecordRepository>>;
  let executeSpy: ReturnType<typeof vi.spyOn>;
  let listeners: { start(): void; stop(): void };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    goalRepository = createMockRepo<IGoalRepository>({});
    goalRecordRepository = createMockRepo<IGoalRecordRepository>({});
    executeSpy = vi
      .spyOn(CreateGoalRecordUseCase.prototype, 'execute')
      .mockResolvedValue(ok({} as never));
    listeners = registerGoalEventListeners(goalRepository, goalRecordRepository);
    listeners.start();
  });

  afterEach(() => {
    listeners.stop();
    vi.restoreAllMocks();
  });

  it('creates a goal record from a bound task completion (PerInstance)', async () => {
    taskPublisher.send('task:instance-completed', aCompletedEvent());
    await Promise.resolve();

    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(executeSpy).toHaveBeenCalledWith(
      'goal-1',
      'kr-1',
      {
        value: 1,
        note: '任务实例完成: Write ADR',
        source: { type: 'TASK_INSTANCE', id: 'ti-1' },
      },
      'identity-1',
    );
  });

  it('ignores completions without a goal binding', async () => {
    taskPublisher.send('task:instance-completed', aCompletedEvent({ goalBinding: null }));
    await Promise.resolve();

    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('skips AllInstancesCompleted trigger until all instances are completed', async () => {
    taskPublisher.send(
      'task:instance-completed',
      aCompletedEvent({
        goalBinding: aGoalBinding({
          progressTrigger: TaskGoalBindingTrigger.AllInstancesCompleted,
        }),
        allInstancesCompleted: false,
      }),
    );
    await Promise.resolve();

    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('creates a record for AllInstancesCompleted once all instances are completed', async () => {
    taskPublisher.send(
      'task:instance-completed',
      aCompletedEvent({
        goalBinding: aGoalBinding({
          progressTrigger: TaskGoalBindingTrigger.AllInstancesCompleted,
        }),
        allInstancesCompleted: true,
      }),
    );
    await Promise.resolve();

    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(executeSpy).toHaveBeenCalledWith(
      'goal-1',
      'kr-1',
      {
        value: 1,
        note: '模板实例全部完成: Write ADR',
        source: { type: 'TASK_TEMPLATE', id: 'tt-1' },
      },
      'identity-1',
    );
  });

  it('stops reacting after stop()', async () => {
    listeners.stop();
    taskPublisher.send('task:instance-completed', aCompletedEvent());
    await Promise.resolve();

    expect(executeSpy).not.toHaveBeenCalled();
  });
});
