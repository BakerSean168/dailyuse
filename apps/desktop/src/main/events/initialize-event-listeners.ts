/**
 * Desktop App Event Listeners Initialization
 *
 * Initializes global event listeners for the desktop application.
 * These listeners orchestrate cross-module business logic, such as updating
 * goal progress when a task is completed.
 *
 * @module events/initialize-event-listeners
 */

import { eventBus } from '@dailyuse/utils';
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
 * Registers a listener for the 'task:instance:completed' event.
 * Automatically updates the associated Goal's Key Result progress when a task is finished.
 */
function initializeTaskToGoalProgressListener(): void {
  const bus = eventBus as any;
  bus.on('task:instance:completed', async (event: any) => {
    try {
      const identityId = event.identityId as string | undefined;
      if (!identityId) {
        console.error(
          '❌ [TaskToGoalProgress] Missing identityId in task:instance:completed event',
        );
        return;
      }

      const { goalBinding, taskInstanceId, title } = event.payload as {
        goalBinding?: {
          goalId: string;
          keyResultId?: string;
          incrementValue: number;
        };
        taskInstanceId: string;
        title: string;
      };

      // If the task is not bound to a goal, ignore
      if (!goalBinding) {
        console.log(
          `ℹ️ [TaskToGoalProgress] Task ${taskInstanceId} completed without goal binding`,
        );
        return;
      }

      console.log(`🎯 [TaskToGoalProgress] Task "${title}" completed, updating goal progress`, {
        goalId: goalBinding.goalId,
        keyResultId: goalBinding.keyResultId,
        incrementValue: goalBinding.incrementValue,
      });

      // If a Key Result is specified, add a progress record
      if (goalBinding.keyResultId) {
        const goalRepository = getGoalRepository();

        // 1. Fetch goal with children (Key Results)
        const goal = await goalRepository.findById(goalBinding.goalId, { includeChildren: true });
        if (!goal) {
          console.error(`❌ [TaskToGoalProgress] Goal not found: ${goalBinding.goalId}`);
          return;
        }

        // 2. Find the target Key Result
        const keyResult = goal.keyResults.find(
          (kr: KeyResult) => kr.id === goalBinding.keyResultId,
        );
        if (!keyResult) {
          console.error(`❌ [TaskToGoalProgress] KeyResult not found: ${goalBinding.keyResultId}`);
          return;
        }

        // 3. Create a new GoalRecord entity
        const record = GoalRecord.create({
          keyResultId: goalBinding.keyResultId as any,
          identityId: identityId as any,
          value: goalBinding.incrementValue,
          note: `任务完成: ${title}`,
          recordedAt: new Date(),
        });

        // 4. Add record to Key Result (triggers recalculation of current value)
        keyResult.addRecord(record.toServerDTO());

        // 5. Persist changes
        await goalRepository.save(goal);

        console.log(
          `✅ [TaskToGoalProgress] Added progress record for key result ${goalBinding.keyResultId} with value ${goalBinding.incrementValue}`,
        );
      } else {
        // TODO: Handle goal-level progress update if no specific key result is targeted
        console.log(
          `ℹ️ [TaskToGoalProgress] Task completed for goal ${goalBinding.goalId}, but no key result specified`,
        );
      }
    } catch (error) {
      console.error('❌ [TaskToGoalProgress] Error handling task:instance:completed:', error);
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
  const bus = eventBus as any;
  bus.off('task:instance:completed');
  isInitialized = false;
}
