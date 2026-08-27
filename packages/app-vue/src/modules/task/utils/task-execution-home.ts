import type { TaskInstanceClientDTO, TaskTemplateClientDTO } from '@memoflow/contracts/task';
import { TASK_INSTANCE_VIEW_CONFIG } from '@memoflow/contracts/task';
import { endOfDayMs, getProductTime, startOfDayMs } from '../../../shared/utils/product-time';

export type TaskExecutionView = 'today' | 'upcoming' | 'all' | 'completed';

export type TaskExecutionFetchPlan =
  | { kind: 'range'; startDate: number; endDate: number }
  | { kind: 'list'; status?: TaskInstanceClientDTO['status'] };

export interface TaskExecutionRow {
  instance: TaskInstanceClientDTO;
  template: TaskTemplateClientDTO;
}

/**
 * Resolve the occurrence query for a Task Home system view using the product-time calendar.
 * Today is a local product day; Upcoming starts tomorrow and spans the standard 30-day view.
 */
export function resolveTaskExecutionFetchPlan(
  view: TaskExecutionView,
  nowMs: number = Date.now(),
): TaskExecutionFetchPlan {
  if (view === 'all') return { kind: 'list' };
  if (view === 'completed') return { kind: 'list', status: 'Completed' };

  const calendar = getProductTime().calendar;
  if (view === 'today') {
    return {
      kind: 'range',
      startDate: startOfDayMs(nowMs),
      endDate: endOfDayMs(nowMs),
    };
  }

  const tomorrow = calendar.addDays(startOfDayMs(nowMs), 1);
  const lastDay = calendar.addDays(tomorrow, TASK_INSTANCE_VIEW_CONFIG.DEFAULT_VIEW_RANGE_DAYS - 1);
  return {
    kind: 'range',
    startDate: Number(tomorrow),
    endDate: endOfDayMs(Number(lastDay)),
  };
}

function timeRank(instance: TaskInstanceClientDTO): number {
  const minutes = instance.timeConfig?.timeRange?.start ?? instance.timeConfig?.timePoint;
  return typeof minutes === 'number' ? minutes : -1;
}

function terminalRank(instance: TaskInstanceClientDTO): number {
  return ['Completed', 'Skipped', 'Missed'].includes(instance.status) ? 1 : 0;
}

/**
 * Join occurrences to the already-filtered template projection.
 *
 * The template list is authoritative for Label AND / Goal filters. An occurrence whose template
 * is absent from that projection is intentionally excluded instead of re-implementing those
 * domain filters in the renderer. Key Result and All-view text search are renderer-only refinements
 * over that complete projection.
 */
export function projectTaskExecutionRows(
  instances: readonly TaskInstanceClientDTO[],
  templates: readonly TaskTemplateClientDTO[],
  options: { keyResultId?: string | null; search?: string } = {},
): TaskExecutionRow[] {
  const templateById = new Map(templates.map((template) => [String(template.id), template]));
  const search = options.search?.trim().toLocaleLowerCase() ?? '';

  return instances
    .flatMap((instance): TaskExecutionRow[] => {
      const template = templateById.get(String(instance.templateId));
      if (!template) return [];
      if (options.keyResultId && String(template.goalBinding?.keyResultId ?? '') !== options.keyResultId) {
        return [];
      }
      if (search) {
        const haystack = [template.name, template.description ?? '', ...template.labels.map((label) => label.name)]
          .join(' ')
          .toLocaleLowerCase();
        if (!haystack.includes(search)) return [];
      }
      return [{ instance, template }];
    })
    .sort((a, b) => {
      const byDay = Number(a.instance.instanceDate) - Number(b.instance.instanceDate);
      if (byDay !== 0) return byDay;
      const byTerminal = terminalRank(a.instance) - terminalRank(b.instance);
      if (byTerminal !== 0) return byTerminal;
      const byTime = timeRank(a.instance) - timeRank(b.instance);
      if (byTime !== 0) return byTime;
      return a.template.name.localeCompare(b.template.name);
    });
}
