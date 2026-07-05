import type { SourceModule, ScheduleEventMap } from '@dailyuse/contracts/schedule';
import type { IScheduleTaskRepository, ScheduleTask } from '@dailyuse/schedule';
import type { Publisher } from '@dailyuse/utils/domain';

export interface ProjectionSelection {
  readonly sourceModule: SourceModule;
  readonly identityId?: string;
  readonly sourceEntityId?: string;
  matches(task: ScheduleTask): boolean;
}

export interface ProjectionPlan {
  readonly selection: ProjectionSelection;
  readonly nextTasks: readonly ScheduleTask[];
}

export async function findMatchingTasks(
  scheduleTaskRepository: IScheduleTaskRepository,
  selection: ProjectionSelection,
): Promise<readonly ScheduleTask[]> {
  const existingTasks = selection.sourceEntityId
    ? await scheduleTaskRepository.findBySourceEntity(
        selection.sourceModule,
        selection.sourceEntityId,
        selection.identityId,
      )
    : await scheduleTaskRepository.findBySourceModule(selection.sourceModule, selection.identityId);

  return existingTasks.filter((task) => selection.matches(task));
}

export async function deleteSelection(
  scheduleTaskRepository: IScheduleTaskRepository,
  selection: ProjectionSelection,
  scheduleEvents: Publisher<Pick<ScheduleEventMap, 'schedule:task-deleted'>>,
): Promise<void> {
  const existingTasks = await findMatchingTasks(scheduleTaskRepository, selection);
  if (existingTasks.length === 0) {
    return;
  }

  await scheduleTaskRepository.deleteBatch(existingTasks.map((task) => task.id));
  for (const task of existingTasks) {
    scheduleEvents.send('schedule:task-deleted', { taskId: task.id });
  }
}

export async function replaceSelection(
  scheduleTaskRepository: IScheduleTaskRepository,
  plan: ProjectionPlan,
  scheduleEvents: Publisher<Pick<ScheduleEventMap, 'schedule:task-deleted'>>,
): Promise<void> {
  await deleteSelection(scheduleTaskRepository, plan.selection, scheduleEvents);
  if (plan.nextTasks.length > 0) {
    await scheduleTaskRepository.saveBatch(Array.from(plan.nextTasks));
  }
}
