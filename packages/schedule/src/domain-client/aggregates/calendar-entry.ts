import type { CalendarEntryClientDTO } from '@dailyuse/contracts/schedule';
import { AggregateRoot } from '@dailyuse/utils';
import { ScheduleId } from '../../domain-shared/value-objects/schedule-id';
import { IdentityId } from '@dailyuse/domain-shared';

export interface CalendarEntryState {
  id: ScheduleId;
  identityId: IdentityId;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  duration: number;
  hasConflict: boolean;
  conflictingEntries: string[] | null;
  priority: number | null;
  location: string | null;
  attendees: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CalendarEntry extends AggregateRoot<ScheduleId> {
  private readonly _props: CalendarEntryState;

  private constructor(props: CalendarEntryState) {
    super(props.id);
    this._props = props;
  }

  get identityId(): IdentityId {
    return this._props.identityId;
  }

  get title(): string {
    return this._props.title;
  }

  get description(): string | null {
    return this._props.description;
  }

  get startTime(): Date {
    return this._props.startTime;
  }

  get endTime(): Date {
    return this._props.endTime;
  }

  get duration(): number {
    return this._props.duration;
  }

  get hasConflict(): boolean {
    return this._props.hasConflict;
  }

  get conflictingEntries(): string[] | null {
    return this._props.conflictingEntries ? [...this._props.conflictingEntries] : null;
  }

  get priority(): number | null {
    return this._props.priority;
  }

  get location(): string | null {
    return this._props.location;
  }

  get attendees(): string[] | null {
    return this._props.attendees ? [...this._props.attendees] : null;
  }

  public static load(state: CalendarEntryState): CalendarEntry {
    return new CalendarEntry(state);
  }

  public toDTO(): CalendarEntryClientDTO {
    return {
      id: String(this.id),
      identityId: String(this._props.identityId),
      title: this._props.title,
      description: this._props.description ?? undefined,
      startTime: this._props.startTime.getTime(),
      endTime: this._props.endTime.getTime(),
      duration: this._props.duration,
      hasConflict: this._props.hasConflict,
      conflictingEntries: this._props.conflictingEntries ?? undefined,
      priority: this._props.priority ?? undefined,
      location: this._props.location ?? undefined,
      attendees: this._props.attendees ?? undefined,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
    };
  }
}
