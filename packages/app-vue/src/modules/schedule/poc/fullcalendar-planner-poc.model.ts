export type PlannerSourceType = 'schedule' | 'task' | 'goal' | 'routine';

export interface PlannerEditableCapabilities {
  readonly move: boolean;
  readonly resize: boolean;
}

export interface PlannerOwnerCommandTarget {
  readonly ownerType: string;
  readonly ownerId: string;
}

/** PoC-local shape intentionally mirrors the PLAN-4302 candidate projection. */
export interface CalendarEventProjectionFixture {
  readonly sourceType: PlannerSourceType;
  readonly sourceId: string;
  readonly start: string;
  readonly end: string | null;
  readonly allDay: boolean;
  readonly title: string;
  readonly displayMetadata: {
    readonly subtitle?: string;
    readonly tone?: 'default' | 'muted' | 'accent';
  };
  readonly editableCapabilities: PlannerEditableCapabilities;
  readonly ownerCommandTarget: PlannerOwnerCommandTarget;
  readonly revision: number;
}

export type PlannerOwnerMutationKind = 'move' | 'resize';

export interface PlannerOwnerMutationCommand {
  readonly kind: PlannerOwnerMutationKind;
  readonly target: PlannerOwnerCommandTarget;
  readonly sourceType: PlannerSourceType;
  readonly sourceId: string;
  readonly revision: number;
  readonly start: string;
  readonly end: string | null;
  readonly allDay: boolean;
}

export interface PlannerOwnerCommandPort {
  execute(command: PlannerOwnerMutationCommand): Promise<{ readonly ok: boolean }>;
}

export const plannerPocFixture: readonly CalendarEventProjectionFixture[] = [
  {
    sourceType: 'schedule',
    sourceId: 'schedule-deep-work',
    start: '2026-08-27T09:00:00+08:00',
    end: '2026-08-27T10:30:00+08:00',
    allDay: false,
    title: 'Deep work',
    displayMetadata: { subtitle: 'Schedule · editable', tone: 'accent' },
    editableCapabilities: { move: true, resize: true },
    ownerCommandTarget: { ownerType: 'schedule.calendar-entry', ownerId: 'schedule-deep-work' },
    revision: 7,
  },
  {
    sourceType: 'task',
    sourceId: 'task-review-pr',
    start: '2026-08-28T14:00:00+08:00',
    end: '2026-08-28T14:45:00+08:00',
    allDay: false,
    title: 'Review Core vNext PR',
    displayMetadata: { subtitle: 'Task · movable only', tone: 'default' },
    editableCapabilities: { move: true, resize: false },
    ownerCommandTarget: { ownerType: 'task.instance', ownerId: 'task-review-pr' },
    revision: 3,
  },
  {
    sourceType: 'goal',
    sourceId: 'goal-quarterly-review',
    start: '2026-08-29',
    end: null,
    allDay: true,
    title: 'Quarterly goal review',
    displayMetadata: { subtitle: 'Goal · read only', tone: 'muted' },
    editableCapabilities: { move: false, resize: false },
    ownerCommandTarget: { ownerType: 'goal.goal', ownerId: 'goal-quarterly-review' },
    revision: 12,
  },
  {
    sourceType: 'routine',
    sourceId: 'routine-evening-wind-down',
    start: '2026-08-30T22:00:00+08:00',
    end: '2026-08-30T22:20:00+08:00',
    allDay: false,
    title: 'Evening wind-down',
    displayMetadata: { subtitle: 'Routine · projected', tone: 'default' },
    editableCapabilities: { move: false, resize: false },
    ownerCommandTarget: { ownerType: 'routine.routine', ownerId: 'routine-evening-wind-down' },
    revision: 4,
  },
];
