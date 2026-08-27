import { describe, expect, it } from 'vitest';
import type { TaskInstanceClientDTO, TaskTemplateClientDTO } from '@memoflow/contracts/task';
import {
  canCompleteTaskOccurrence,
  canCorrectTaskOccurrence,
  resolveTaskPlanNextOccurrence,
  resolveTaskRepeatPosition,
} from './task-detail-projection';

const template = {
  id: 'TaskTemplateId_plan',
  recurrenceRule: {
    frequency: 'Daily', interval: 1, daysOfWeek: [], endDate: null, occurrences: 15,
  },
} as unknown as TaskTemplateClientDTO;

function instance(id: string, day: number, status: TaskInstanceClientDTO['status']): TaskInstanceClientDTO {
  return { id, templateId: template.id, instanceDate: day, status } as unknown as TaskInstanceClientDTO;
}

describe('task detail projection', () => {
  it('derives repeat position from ordered occurrence facts and finite plan total', () => {
    const items = [instance('i3', 3, 'Pending'), instance('i1', 1, 'Completed'), instance('i2', 2, 'Missed')];
    expect(resolveTaskRepeatPosition('i3', template, items)).toEqual({ position: 3, total: 15 });
  });

  it('uses null total for open-ended recurrence and null position for one-time tasks', () => {
    const open = { ...template, recurrenceRule: { ...template.recurrenceRule!, occurrences: null } };
    expect(resolveTaskRepeatPosition('i1', open, [instance('i1', 1, 'Pending')])).toEqual({ position: 1, total: null });
    expect(resolveTaskRepeatPosition('i1', { ...template, recurrenceRule: null }, [instance('i1', 1, 'Pending')])).toBeNull();
  });

  it('selects the earliest non-terminal occurrence as the plan next occurrence', () => {
    const items = [
      instance('done', 1, 'Completed'),
      instance('skip', 2, 'Skipped'),
      instance('next', 3, 'Pending'),
      instance('later', 4, 'InProgress'),
    ];
    expect(resolveTaskPlanNextOccurrence(String(template.id), items)?.id).toBe('next');
  });

  it('allows missed/skipped correction to completed but only pending/in-progress can be marked missed or skipped', () => {
    expect(canCompleteTaskOccurrence('Missed')).toBe(true);
    expect(canCompleteTaskOccurrence('Skipped')).toBe(true);
    expect(canCompleteTaskOccurrence('Completed')).toBe(false);
    expect(canCorrectTaskOccurrence('Pending')).toBe(true);
    expect(canCorrectTaskOccurrence('InProgress')).toBe(true);
    expect(canCorrectTaskOccurrence('Missed')).toBe(false);
  });
});
