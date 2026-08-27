import { describe, expect, it, vi } from 'vitest';
import type { EventApi } from '@fullcalendar/vue3';
import { fail, ok } from '@memoflow/contracts/result';
import {
  createFullCalendarPlannerPocOptions,
  toFullCalendarEvent,
} from './fullcalendar-planner-poc.adapter';
import { plannerPocFixture, type CalendarEventProjectionFixture } from './fullcalendar-planner-poc.model';
import { createPlannerOwnerCommandRouter } from '../planner';

function eventFor(
  projection: CalendarEventProjectionFixture,
  start = new Date('2026-08-27T02:00:00.000Z'),
  end = new Date('2026-08-27T03:00:00.000Z'),
): EventApi {
  return {
    start,
    end,
    allDay: projection.allDay,
    extendedProps: { projection },
  } as unknown as EventApi;
}

function unusedRouter() {
  return createPlannerOwnerCommandRouter({});
}

describe('FullCalendar Standard Planner PoC adapter (PLAN-4301/4303)', () => {
  it('configures only Standard day/week/month/list views with select/edit/now indicator', () => {
    const options = createFullCalendarPlannerPocOptions({
      projections: plannerPocFixture,
      ownerCommands: unusedRouter(),
    });

    expect(options.initialView).toBe('timeGridWeek');
    expect(options.selectable).toBe(true);
    expect(options.editable).toBe(true);
    expect(options.nowIndicator).toBe(true);
    expect(options.headerToolbar).toEqual(
      expect.objectContaining({ end: 'timeGridDay,timeGridWeek dayGridMonth,listWeek' }),
    );
    expect(options.plugins).toHaveLength(4);
  });

  it('maps MemoFlow ownership capabilities into event-level editability', () => {
    const editable = toFullCalendarEvent(plannerPocFixture[0]!);
    const readOnly = toFullCalendarEvent(plannerPocFixture[2]!);

    expect(editable).toMatchObject({ editable: true, startEditable: true, durationEditable: true });
    expect(readOnly).toMatchObject({
      editable: false,
      startEditable: false,
      durationEditable: false,
    });
  });

  it('routes drop/resize through the canonical Schedule owner command and reverts a failed mutation', async () => {
    const updateSchedule = vi
      .fn()
      .mockResolvedValueOnce(ok({}))
      .mockResolvedValueOnce(fail({ code: 'CONFLICT', message: 'stale schedule revision' }));
    const options = createFullCalendarPlannerPocOptions({
      projections: plannerPocFixture,
      ownerCommands: createPlannerOwnerCommandRouter({ schedule: { updateSchedule } }),
    });
    const projection = plannerPocFixture[0]!;
    const dropRevert = vi.fn();
    const resizeRevert = vi.fn();
    let visualState = 'original';

    options.eventDrop!({ event: eventFor(projection), revert: dropRevert } as never);
    await vi.waitFor(() => expect(updateSchedule).toHaveBeenCalledTimes(1));
    expect(updateSchedule.mock.calls[0]).toEqual([
      projection.ownerCommandTarget.ownerId,
      {
        startTime: Date.parse('2026-08-27T02:00:00.000Z'),
        endTime: Date.parse('2026-08-27T03:00:00.000Z'),
        expectedVersion: projection.revision,
      },
    ]);
    expect(dropRevert).not.toHaveBeenCalled();

    visualState = 'optimistic-resize';
    const visualRevert = () => {
      visualState = 'original';
      resizeRevert();
    };
    options.eventResize!({ event: eventFor(projection), revert: visualRevert } as never);
    await vi.waitFor(() => expect(updateSchedule).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(resizeRevert).toHaveBeenCalledTimes(1));
    expect(visualState).toBe('original');
  });

  it('reverts defensive mutation attempts against read-only events without issuing owner commands', async () => {
    const updateGoal = vi.fn().mockResolvedValue(ok({}));
    const options = createFullCalendarPlannerPocOptions({
      projections: plannerPocFixture,
      ownerCommands: createPlannerOwnerCommandRouter({ goal: { updateGoal } }),
    });
    const revert = vi.fn();

    options.eventDrop!({ event: eventFor(plannerPocFixture[2]!), revert } as never);
    await vi.waitFor(() => expect(revert).toHaveBeenCalledTimes(1));

    expect(updateGoal).not.toHaveBeenCalled();
  });

  it('forwards user selection as an owner-neutral projection request', () => {
    const onSelect = vi.fn();
    const options = createFullCalendarPlannerPocOptions({
      projections: plannerPocFixture,
      ownerCommands: unusedRouter(),
      onSelect,
    });

    options.select!({
      start: new Date('2026-08-27T01:00:00.000Z'),
      end: new Date('2026-08-27T02:00:00.000Z'),
      allDay: false,
    } as never);

    expect(onSelect).toHaveBeenCalledWith({
      start: '2026-08-27T01:00:00.000Z',
      end: '2026-08-27T02:00:00.000Z',
      allDay: false,
    });
  });
});
