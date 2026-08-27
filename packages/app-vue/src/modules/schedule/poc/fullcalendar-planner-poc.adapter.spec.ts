import { describe, expect, it, vi } from 'vitest';
import type { EventApi } from '@fullcalendar/vue3';
import {
  createFullCalendarPlannerPocOptions,
  toFullCalendarEvent,
} from './fullcalendar-planner-poc.adapter';
import {
  plannerPocFixture,
  type CalendarEventProjectionFixture,
  type PlannerOwnerCommandPort,
} from './fullcalendar-planner-poc.model';

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

describe('FullCalendar Standard Planner PoC adapter (PLAN-4301)', () => {
  it('configures only Standard day/week/month/list views with select/edit/now indicator', () => {
    const options = createFullCalendarPlannerPocOptions({
      projections: plannerPocFixture,
      ownerCommands: { execute: vi.fn(async () => ({ ok: true })) },
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

  it('routes drop/resize through fake owner commands and reverts a failed mutation', async () => {
    const execute = vi
      .fn<PlannerOwnerCommandPort['execute']>()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false });
    const options = createFullCalendarPlannerPocOptions({
      projections: plannerPocFixture,
      ownerCommands: { execute },
    });
    const projection = plannerPocFixture[0]!;
    const dropRevert = vi.fn();
    const resizeRevert = vi.fn();
    let visualState = 'original';

    options.eventDrop!({ event: eventFor(projection), revert: dropRevert } as never);
    await vi.waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
    expect(execute.mock.calls[0]?.[0]).toMatchObject({
      kind: 'move',
      target: projection.ownerCommandTarget,
      revision: 7,
    });
    expect(dropRevert).not.toHaveBeenCalled();

    visualState = 'optimistic-resize';
    const visualRevert = () => {
      visualState = 'original';
      resizeRevert();
    };
    options.eventResize!({ event: eventFor(projection), revert: visualRevert } as never);
    await vi.waitFor(() => expect(execute).toHaveBeenCalledTimes(2));
    expect(execute.mock.calls[1]?.[0]).toMatchObject({ kind: 'resize' });
    expect(resizeRevert).toHaveBeenCalledTimes(1);
    expect(visualState).toBe('original');
  });

  it('reverts defensive mutation attempts against read-only events without issuing owner commands', async () => {
    const execute = vi.fn<PlannerOwnerCommandPort['execute']>(async () => ({ ok: true }));
    const options = createFullCalendarPlannerPocOptions({
      projections: plannerPocFixture,
      ownerCommands: { execute },
    });
    const revert = vi.fn();

    options.eventDrop!({ event: eventFor(plannerPocFixture[2]!), revert } as never);
    await Promise.resolve();

    expect(execute).not.toHaveBeenCalled();
    expect(revert).toHaveBeenCalledTimes(1);
  });

  it('forwards user selection as an owner-neutral projection request', () => {
    const onSelect = vi.fn();
    const options = createFullCalendarPlannerPocOptions({
      projections: plannerPocFixture,
      ownerCommands: { execute: vi.fn(async () => ({ ok: true })) },
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
