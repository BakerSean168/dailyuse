import type { TaskInstanceClientDTO, TaskTemplateClientDTO } from '@memoflow/contracts/task';

const TERMINAL = new Set<TaskInstanceClientDTO['status']>(['Completed', 'Skipped', 'Missed']);

export interface TaskRepeatPosition {
  position: number;
  total: number | null;
}

export function sortTaskOccurrences(
  instances: readonly TaskInstanceClientDTO[],
): TaskInstanceClientDTO[] {
  return [...instances].sort(
    (a, b) => a.instanceDate - b.instanceDate || String(a.id).localeCompare(String(b.id)),
  );
}

export function resolveTaskRepeatPosition(
  instanceId: string,
  template: TaskTemplateClientDTO,
  instances: readonly TaskInstanceClientDTO[],
): TaskRepeatPosition | null {
  if (!template.recurrenceRule) return null;
  const ordered = sortTaskOccurrences(instances).filter(
    (instance) => String(instance.templateId) === String(template.id),
  );
  const index = ordered.findIndex((instance) => String(instance.id) === instanceId);
  if (index < 0) return null;
  return {
    position: index + 1,
    total: template.recurrenceRule.occurrences ?? null,
  };
}

export function resolveTaskPlanNextOccurrence(
  templateId: string,
  instances: readonly TaskInstanceClientDTO[],
): TaskInstanceClientDTO | null {
  return (
    sortTaskOccurrences(instances).find(
      (instance) =>
        String(instance.templateId) === templateId && !TERMINAL.has(instance.status),
    ) ?? null
  );
}

export function isTaskOccurrenceTerminal(status: TaskInstanceClientDTO['status']): boolean {
  return TERMINAL.has(status);
}

export function canCompleteTaskOccurrence(status: TaskInstanceClientDTO['status']): boolean {
  return status !== 'Completed';
}

export function canCorrectTaskOccurrence(status: TaskInstanceClientDTO['status']): boolean {
  return status === 'Pending' || status === 'InProgress';
}
