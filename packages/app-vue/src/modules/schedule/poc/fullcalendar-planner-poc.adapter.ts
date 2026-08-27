import interactionPlugin from '@fullcalendar/vue3/interaction';
import dayGridPlugin from '@fullcalendar/vue3/daygrid';
import timeGridPlugin from '@fullcalendar/vue3/timegrid';
import listPlugin from '@fullcalendar/vue3/list';
import type { CalendarOptions, DateSelectInfo, EventInput } from '@fullcalendar/vue3';
import type { CalendarEventProjectionFixture } from './fullcalendar-planner-poc.model';
import {
  applyFullCalendarPlannerMutation,
  defaultPlannerMutationTimePort,
  type PlannerMutationTimePort,
  type PlannerOwnerCommandRouter,
} from '../planner';

export interface FullCalendarPlannerPocAdapterOptions {
  readonly projections: readonly CalendarEventProjectionFixture[];
  /** Canonical PLAN-4303 owner router; the PoC no longer owns a second mutation protocol. */
  readonly ownerCommands: PlannerOwnerCommandRouter;
  readonly time?: PlannerMutationTimePort;
  readonly onSelect?: (selection: { start: string; end: string; allDay: boolean }) => void;
  readonly initialDate?: string;
}

export function toFullCalendarEvent(projection: CalendarEventProjectionFixture): EventInput {
  return {
    id: `${projection.sourceType}:${projection.sourceId}`,
    title: projection.title,
    start: projection.start,
    end: projection.end ?? undefined,
    allDay: projection.allDay,
    editable: projection.editableCapabilities.move || projection.editableCapabilities.resize,
    startEditable: projection.editableCapabilities.move,
    durationEditable: projection.editableCapabilities.resize,
    extendedProps: { projection },
  };
}

export function createFullCalendarPlannerPocOptions(
  options: FullCalendarPlannerPocAdapterOptions,
): CalendarOptions {
  const time = options.time ?? defaultPlannerMutationTimePort;
  return {
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    initialView: 'timeGridWeek',
    initialDate: options.initialDate ?? '2026-08-27',
    headerToolbar: {
      start: 'prev,next today',
      center: 'title',
      end: 'timeGridDay,timeGridWeek dayGridMonth,listWeek',
    },
    events: options.projections.map(toFullCalendarEvent),
    selectable: true,
    selectMirror: true,
    editable: true,
    nowIndicator: true,
    height: '100%',
    eventDrop: (info) =>
      void applyFullCalendarPlannerMutation('move', info, options.ownerCommands, time),
    eventResize: (info) =>
      void applyFullCalendarPlannerMutation('resize', info, options.ownerCommands, time),
    select: (info: DateSelectInfo) => {
      options.onSelect?.({
        start: info.start.toISOString(),
        end: info.end.toISOString(),
        allDay: info.allDay,
      });
    },
  };
}
