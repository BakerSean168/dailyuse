import interactionPlugin from '@fullcalendar/vue3/interaction';
import dayGridPlugin from '@fullcalendar/vue3/daygrid';
import timeGridPlugin from '@fullcalendar/vue3/timegrid';
import listPlugin from '@fullcalendar/vue3/list';
import type {
  CalendarOptions,
  DateSelectInfo,
  EventApi,
  EventDropInfo,
  EventInput,
  EventResizeDoneInfo,
} from '@fullcalendar/vue3';
import type {
  CalendarEventProjectionFixture,
  PlannerOwnerCommandPort,
  PlannerOwnerMutationKind,
} from './fullcalendar-planner-poc.model';

export interface FullCalendarPlannerPocAdapterOptions {
  readonly projections: readonly CalendarEventProjectionFixture[];
  readonly ownerCommands: PlannerOwnerCommandPort;
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

function getProjection(event: EventApi): CalendarEventProjectionFixture {
  return event.extendedProps.projection as CalendarEventProjectionFixture;
}

async function applyOwnerMutation(
  kind: PlannerOwnerMutationKind,
  info: EventDropInfo | EventResizeDoneInfo,
  ownerCommands: PlannerOwnerCommandPort,
): Promise<void> {
  const projection = getProjection(info.event);
  const allowed =
    kind === 'move' ? projection.editableCapabilities.move : projection.editableCapabilities.resize;
  if (!allowed || info.event.start == null) {
    info.revert();
    return;
  }

  try {
    const result = await ownerCommands.execute({
      kind,
      target: projection.ownerCommandTarget,
      sourceType: projection.sourceType,
      sourceId: projection.sourceId,
      revision: projection.revision,
      start: info.event.start.toISOString(),
      end: info.event.end?.toISOString() ?? null,
      allDay: info.event.allDay,
    });
    if (!result.ok) info.revert();
  } catch {
    info.revert();
  }
}

export function createFullCalendarPlannerPocOptions(
  options: FullCalendarPlannerPocAdapterOptions,
): CalendarOptions {
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
    eventDrop: (info) => void applyOwnerMutation('move', info, options.ownerCommands),
    eventResize: (info) => void applyOwnerMutation('resize', info, options.ownerCommands),
    select: (info: DateSelectInfo) => {
      options.onSelect?.({
        start: info.start.toISOString(),
        end: info.end.toISOString(),
        allDay: info.allDay,
      });
    },
  };
}
