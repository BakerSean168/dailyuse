import { describe, expect, it } from 'vitest';
import type { TaskInstanceClientDTO, TaskTemplateClientDTO } from '@memoflow/contracts/task';
import { getProductTime, startOfDayMs, endOfDayMs } from '../../../shared/utils/product-time';
import {
  projectTaskExecutionRows,
  resolveTaskExecutionFetchPlan,
} from './task-execution-home';

function template(
  id: string,
  overrides: Partial<TaskTemplateClientDTO> = {},
): TaskTemplateClientDTO {
  return {
    id,
    name: `Task ${id}`,
    description: null,
    labels: [],
    goalBinding: null,
    ...overrides,
  } as TaskTemplateClientDTO;
}

function instance(
  id: string,
  templateId: string,
  overrides: Partial<TaskInstanceClientDTO> = {},
): TaskInstanceClientDTO {
  return {
    id,
    templateId,
    instanceDate: 1_700_000_000_000,
    timeConfig: { timeType: 'AllDay', startDate: null, timePoint: null, timeRange: null },
    status: 'Pending',
    ...overrides,
  } as TaskInstanceClientDTO;
}

describe('Task execution home projection', () => {
  it('uses product-time day boundaries for Today and starts Upcoming tomorrow', () => {
    const now = 1_700_000_000_000;
    expect(resolveTaskExecutionFetchPlan('today', now)).toEqual({
      kind: 'range',
      startDate: startOfDayMs(now),
      endDate: endOfDayMs(now),
    });

    const upcoming = resolveTaskExecutionFetchPlan('upcoming', now);
    expect(upcoming.kind).toBe('range');
    if (upcoming.kind === 'range') {
      const tomorrow = Number(getProductTime().calendar.addDays(startOfDayMs(now), 1));
      expect(upcoming.startDate).toBe(tomorrow);
      expect(upcoming.endDate).toBeGreaterThan(upcoming.startDate);
    }
  });

  it('treats the server-filtered template projection as authority for Label/Goal filtering', () => {
    const rows = projectTaskExecutionRows(
      [instance('i-work', 't-work'), instance('i-personal', 't-personal')],
      [template('t-work', { labels: [{ id: 'work', name: 'Work', color: null }] as never })],
    );

    expect(rows.map((row) => row.instance.id)).toEqual(['i-work']);
  });

  it('refines the complete template projection by Key Result and All-view search metadata', () => {
    const rows = projectTaskExecutionRows(
      [instance('i-ai', 't-ai'), instance('i-health', 't-health')],
      [
        template('t-ai', {
          name: 'Refactor provider UI',
          labels: [{ id: 'ai', name: 'AI', color: null }] as never,
          goalBinding: { goalId: 'goal-1', keyResultId: 'kr-ai', contribution: null },
        }),
        template('t-health', {
          name: 'Walk outside',
          labels: [{ id: 'health', name: 'Health', color: null }] as never,
          goalBinding: { goalId: 'goal-1', keyResultId: 'kr-health', contribution: null },
        }),
      ],
      { keyResultId: 'kr-ai', search: 'provider' },
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.template.name).toBe('Refactor provider UI');
  });

  it('keeps active occurrences ahead of terminal ones within a day', () => {
    const sameDay = 1_700_000_000_000;
    const rows = projectTaskExecutionRows(
      [
        instance('i-complete', 't-complete', { instanceDate: sameDay, status: 'Completed' }),
        instance('i-pending', 't-pending', { instanceDate: sameDay, status: 'Pending' }),
      ],
      [template('t-complete'), template('t-pending')],
    );

    expect(rows.map((row) => row.instance.id)).toEqual(['i-pending', 'i-complete']);
  });
});
