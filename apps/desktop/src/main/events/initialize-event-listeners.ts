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
import { CreateGoalRecordUseCase } from '@dailyuse/goal';
import { getGoalRecordRepository, getGoalRepository } from '@dailyuse/goal/electron-entry';
import { getTaskInstanceRepository, getTaskTemplateRepository } from '@dailyuse/task/electron-entry';
import { TaskGoalBindingTrigger, TaskInstanceStatus } from '@dailyuse/contracts/task';

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
 * Registers a listener for the 'task:instance-completed' event.
 * Automatically updates the associated Goal's Key Result progress when a task is finished.
 */
function initializeTaskToGoalProgressListener(): void {
  const bus = eventBus as any;
  bus.on('task:instance-completed', async (event: any) => {
    try {
      const payload = event?.payload ?? event;
      const identityId = (event?.identityId ?? payload?.identityId) as string | undefined;
      if (!identityId) {
        console.error(
          '❌ [TaskToGoalProgress] Missing identityId in task:instance-completed event',
        );
        return;
      }

      const { taskInstanceId, taskTemplateId } = payload as {
        taskInstanceId: string;
        taskTemplateId: string;
      };

      const taskInstanceRepository = getTaskInstanceRepository();
      const taskInstance = await taskInstanceRepository.findById(taskInstanceId);
      if (!taskInstance) {
        console.error(`❌ [TaskToGoalProgress] Task instance not found: ${taskInstanceId}`);
        return;
      }

      const taskTemplateRepository = getTaskTemplateRepository();
      const template = await taskTemplateRepository.findById(taskTemplateId);
      if (!template) {
        console.error(`❌ [TaskToGoalProgress] Task template not found: ${taskTemplateId}`);
        return;
      }

      const title = template.title;
      const goalBinding = template.goalBinding;

      // If the task is not bound to a goal, ignore
      if (!goalBinding) {
        console.log(
          `ℹ️ [TaskToGoalProgress] Task ${taskInstanceId} completed without goal binding`,
        );
        return;
      }

      const shouldCreateRecord =
        goalBinding.progressTrigger === TaskGoalBindingTrigger.AllInstancesCompleted
          ? await shouldTriggerOnAllInstancesCompleted(taskTemplateId, taskInstance.instanceDate)
          : true;

      if (!shouldCreateRecord) {
        console.log(
          `ℹ️ [TaskToGoalProgress] Task ${taskInstanceId} completed, but template ${taskTemplateId} is not fully completed yet`,
        );
        return;
      }

      console.log(`🎯 [TaskToGoalProgress] Task "${title}" completed, updating goal progress`, {
        goalId: goalBinding.goalId,
        keyResultId: goalBinding.keyResultId,
        incrementValue: goalBinding.goalRecordValue,
        progressTrigger: goalBinding.progressTrigger,
      });

      const goalRepository = getGoalRepository();
      const goalRecordRepository = getGoalRecordRepository();
      const createGoalRecord = new CreateGoalRecordUseCase(
        goalRepository,
        goalRecordRepository,
      );

      const recordResult = await createGoalRecord.execute(
        String(goalBinding.goalId),
        String(goalBinding.keyResultId),
        {
          value: goalBinding.goalRecordValue,
          note:
            goalBinding.progressTrigger === TaskGoalBindingTrigger.AllInstancesCompleted
              ? `模板实例全部完成: ${title}`
              : `任务实例完成: ${title}`,
        },
        identityId,
      );

      if (!recordResult.ok) {
        console.error('❌ [TaskToGoalProgress] Failed to create goal record', recordResult.error);
        return;
      }

      console.log(
        `✅ [TaskToGoalProgress] Added progress record for key result ${goalBinding.keyResultId} with value ${goalBinding.goalRecordValue}`,
      );
    } catch (error) {
      console.error('❌ [TaskToGoalProgress] Error handling task:instance-completed:', error);
    }
  });

  console.log('✅ [TaskToGoalProgress] Task completion → Goal progress listener registered');
}

async function shouldTriggerOnAllInstancesCompleted(
  templateId: string,
  completedThroughDate: number,
): Promise<boolean> {
  const taskInstanceRepository = getTaskInstanceRepository();
  const instances = await taskInstanceRepository.findByTemplateId(templateId);
  const relevantInstances = instances.filter(
    (instance) => instance.instanceDate <= completedThroughDate,
  );

  if (relevantInstances.length === 0) {
    return false;
  }

  return relevantInstances.every((instance) => instance.status === TaskInstanceStatus.Completed);
}

/**
 * Resets all event listeners.
 * Primarily used for testing to clean up side effects.
 */
export function resetEventListeners(): void {
  console.log('🔄 [EventListeners] Resetting event listeners...');
  const bus = eventBus as any;
  bus.off('task:instance-completed');
  isInitialized = false;
}
