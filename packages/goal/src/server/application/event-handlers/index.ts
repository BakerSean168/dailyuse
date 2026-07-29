/**
 * Goal Event Handlers (Server)
 *
 * 跨模块「通知式反应」的落地点（ADR-033 范式 A）：订阅 Task 的
 * `task:instance-completed`，据自包含的 payload 更新关联 KR 进度。
 *
 * 反应逻辑收敛在 Goal 包内，`apps/api` 与 `apps/desktop` 两宿主挂载同一实现，
 * 不再各自维护 bespoke 副本；订阅方直接消费 payload，不回查 Task 的 repository。
 */

import type { TaskEventMap } from '@memoflow/contracts/task';
import { TaskGoalBindingTrigger } from '@memoflow/contracts/task';
import { createTypedEventSubscriber, eventBus } from '@memoflow/utils/domain';
import { createLogger } from '@memoflow/utils/logger';
import type { IGoalRepository, IGoalRecordRepository } from '../../domain';
import { CreateGoalRecordUseCase } from '../use-cases/commands/create-goal-record.use-case';

const logger = createLogger('GoalEventListeners');

type GoalReactionEventMap = Pick<TaskEventMap, 'task:instance-completed'>;

const taskSubscriber = createTypedEventSubscriber<GoalReactionEventMap>(eventBus);

/**
 * Register Goal event listeners.
 *
 * 返回可幂等启停的 runtime（仿 register-account-event-listeners）。
 * 宿主在启动时 `start()`，关闭时 `stop()`。
 */
export function registerGoalEventListeners(
  goalRepository: IGoalRepository,
  goalRecordRepository: IGoalRecordRepository,
): { start(): void; stop(): void } {
  const createGoalRecord = new CreateGoalRecordUseCase(goalRepository, goalRecordRepository);

  const onTaskInstanceCompleted = async (
    payload: GoalReactionEventMap['task:instance-completed'],
  ): Promise<void> => {
    try {
      const { identityId, goalBinding, allInstancesCompleted, taskTitle } = payload;

      // 未绑定目标：与本联动无关，忽略。
      if (!goalBinding) {
        return;
      }

      const shouldCreateRecord =
        goalBinding.progressTrigger === TaskGoalBindingTrigger.AllInstancesCompleted
          ? allInstancesCompleted
          : true;

      if (!shouldCreateRecord) {
        return;
      }

      const note =
        goalBinding.progressTrigger === TaskGoalBindingTrigger.AllInstancesCompleted
          ? `模板实例全部完成: ${taskTitle}`
          : `任务实例完成: ${taskTitle}`;

      const result = await createGoalRecord.execute(
        String(goalBinding.goalId),
        String(goalBinding.keyResultId),
        { value: goalBinding.goalRecordValue, note },
        String(identityId),
      );

      if (!result.ok) {
        logger.error('[GoalEventListeners] Failed to create goal record from task completion', {
          goalId: String(goalBinding.goalId),
          keyResultId: String(goalBinding.keyResultId),
          error: result.error,
        });
        return;
      }

      logger.info('[GoalEventListeners] Goal record created from task completion', {
        goalId: String(goalBinding.goalId),
        keyResultId: String(goalBinding.keyResultId),
        value: goalBinding.goalRecordValue,
      });
    } catch (error) {
      logger.error('[GoalEventListeners] Error handling task:instance-completed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }
      taskSubscriber.on('task:instance-completed', onTaskInstanceCompleted);
      started = true;
      logger.info('[GoalEventListeners] Goal event listeners registered');
    },
    stop(): void {
      if (!started) {
        return;
      }
      taskSubscriber.off('task:instance-completed', onTaskInstanceCompleted);
      started = false;
      logger.info('[GoalEventListeners] Goal event listeners unregistered');
    },
  };
}
