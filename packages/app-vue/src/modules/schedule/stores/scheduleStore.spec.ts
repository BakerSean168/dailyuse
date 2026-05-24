import { beforeEach, describe, expect, it } from 'vitest';
import type {
  CalendarEntryClientDTO,
  ScheduleExecutionClientDTO,
  ScheduleTaskClientDTO,
} from '@dailyuse/contracts/schedule';
import { createTestPinia } from '@dailyuse/test-utils';
import { useScheduleStore } from './schedule-store';

function createTask(
  overrides: Partial<ScheduleTaskClientDTO> = {},
): ScheduleTaskClientDTO {
  return {
    id: 'task-1' as ScheduleTaskClientDTO['id'],
    name: 'Dispatch digest',
    ...overrides,
  } as ScheduleTaskClientDTO;
}

describe('useScheduleStore', () => {
  beforeEach(() => {
    createTestPinia();
  });

  it('mutates task list, pagination, current task, and common status flags', () => {
    const store = useScheduleStore();
    const task = createTask();

    store.setTasks([task], 21);
    store.addTask(createTask({ id: 'task-2' as ScheduleTaskClientDTO['id'], name: 'Sync queue' }));
    store.updateTask(createTask({ id: task.id, name: 'Dispatch nightly digest' }));
    store.setCurrentTask(task);
    store.removeTask('task-2');
    store.setExecutions([{ id: 'exec-1' } as ScheduleExecutionClientDTO]);
    store.setCalendarEntries([{ id: 'entry-1' } as CalendarEntryClientDTO]);
    store.setLoading(true);
    store.setError('failed');
    store.setPage(3);
    store.setInitialized(true);

    expect(store.tasks.map((item) => item.name)).toEqual(['Dispatch nightly digest']);
    expect(store.pagination.total).toBe(21);
    expect(store.currentTask).toStrictEqual(task);
    expect(store.executions).toHaveLength(1);
    expect(store.calendarEntries).toHaveLength(1);
    expect(store.pagination.page).toBe(3);
    expect(store.isLoading).toBe(true);
    expect(store.error).toBe('failed');

    store.reset();
    expect(store.tasks).toEqual([]);
    expect(store.executions).toEqual([]);
    expect(store.currentTask).toBeNull();
    expect(store.pagination.page).toBe(1);
    expect(store.isInitialized).toBe(false);
  });
});
