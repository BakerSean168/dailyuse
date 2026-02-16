/**
 * Desktop App Event Listeners Initialization
 * 
 * Initializes global event listeners for the desktop application.
 * These listeners orchestrate cross-module business logic, such as updating
 * goal progress when a task is completed.
 *
 * @module events/initialize-event-listeners
 */

import { eventBus, type DomainEvent } from '@dailyuse/utils';
import { getGoalRepository } from '@dailyuse/goal/electron-entry';
import { GoalRecord, type KeyResult } from '@dailyuse/goal/domain-server';

let isInitialized = false;

/**
 * Initializes all desktop application event listeners.
 * Idempotent: safe to call multiple times, but will only initialize once.
 *
 * @returns {Promise<void>} A promise that resolves when all listeners are set up.
 */
export async function initializeEventListeners(): Promise<void> {
  if (isInitialized) {
    console.log('⚠️ [EventListeners] Already initialized, skipping...');
    return;
  }

  console.log('🚀 [EventListeners] Initializing desktop app event listeners...');

  // Initialize Task Completion -> Goal Progress Update listener
  initializeTaskToGoalProgressListener();

  isInitialized = true;
  console.log('✅ [EventListeners] All event listeners registered successfully!');
}

/**
 * Registers a listener for the 'task.instance.completed' event.
 * Automatically updates the associated Goal's Key Result progress when a task is finished.
 */
function initializeTaskToGoalProgressListener(): void {
  eventBus.on('task.instance.completed', async (event: DomainEvent) => {
    try {
      if (!event.accountUuid) {
        console.error(
          '❌ [TaskToGoalProgress] Missing accountUuid in task.instance.completed event',
        );
        return;
      }

      const { goalBinding, taskInstanceUuid, title } = event.payload as {
        goalBinding?: {
          goalUuid: string;
          keyResultUuid?: string;
          incrementValue: number;
        };
        taskInstanceUuid: string;
        title: string;
      };

      // If the task is not bound to a goal, ignore
      if (!goalBinding) {
        console.log(
          `ℹ️ [TaskToGoalProgress] Task ${taskInstanceUuid} completed without goal binding`,
        );
        return;
      }

      console.log(
        `🎯 [TaskToGoalProgress] Task "${title}" completed, updating goal progress`,
        {
          goalUuid: goalBinding.goalUuid,
          keyResultUuid: goalBinding.keyResultUuid,
          incrementValue: goalBinding.incrementValue,
        },
      );

      // If a Key Result is specified, add a progress record
      if (goalBinding.keyResultUuid) {
        const goalRepository = getGoalRepository();

        // 1. Fetch goal with children (Key Results)
        const goal = await goalRepository.findById(goalBinding.goalUuid, { includeChildren: true });
        if (!goal) {
          console.error(`❌ [TaskToGoalProgress] Goal not found: ${goalBinding.goalUuid}`);
          return;
        }

        // 2. Find the target Key Result
        const keyResult = goal.keyResults.find((kr: KeyResult) => kr.uuid === goalBinding.keyResultUuid);
        if (!keyResult) {
          console.error(
            `❌ [TaskToGoalProgress] KeyResult not found: ${goalBinding.keyResultUuid}`,
          );
          return;
        }

        // 3. Create a new GoalRecord entity
        const record = GoalRecord.create({
          keyResultUuid: goalBinding.keyResultUuid,
          goalUuid: goalBinding.goalUuid,
          value: goalBinding.incrementValue,
          note: `任务完成: ${title}`,
          recordedAt: Date.now(),
        });

        // 4. Add record to Key Result (triggers recalculation of current value)
        keyResult.addRecord(record.toServerDTO());

        // 5. Persist changes
        await goalRepository.save(goal);

        console.log(
          `✅ [TaskToGoalProgress] Added progress record for key result ${goalBinding.keyResultUuid} with value ${goalBinding.incrementValue}`,
        );
      } else {
        // TODO: Handle goal-level progress update if no specific key result is targeted
        console.log(
          `ℹ️ [TaskToGoalProgress] Task completed for goal ${goalBinding.goalUuid}, but no key result specified`,
        );
      }
    } catch (error) {
      console.error('❌ [TaskToGoalProgress] Error handling task.instance.completed:', error);
    }
  });

  console.log('✅ [TaskToGoalProgress] Task completion → Goal progress listener registered');
}

/**
 * Resets all event listeners.
 * Primarily used for testing to clean up side effects.
 */
export function resetEventListeners(): void {
  console.log('🔄 [EventListeners] Resetting event listeners...');
  eventBus.off('task.instance.completed');
  isInitialized = false;
}
