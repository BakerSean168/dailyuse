import { AggregateRoot } from '@memoflow/utils/domain';
import { IdentityId } from '@memoflow/domain-shared';
import type {
  CalendarEntryClientDTO,
  CalendarEntryServerDTO,
  ConflictDetail,
  ConflictDetectionResult,
  ConflictSuggestion,
  ScheduleEventMap,
} from '@memoflow/contracts/schedule';
import { ConflictSeverity } from '@memoflow/contracts/schedule';
import { ScheduleId } from '../value-objects/schedule-id';

/** Domain state interface for the CalendarEntry aggregate */
export interface CalendarEntryState {
  id: ScheduleId;
  identityId: IdentityId;
  title: string;
  description: string | null;
  startTime: number;
  endTime: number;
  duration: number;
  hasConflict: boolean;
  conflictingEntries: string[] | null;
  priority: number | null;
  location: string | null;
  attendees: string[] | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class CalendarEntry extends AggregateRoot<ScheduleId> {
  private _props: CalendarEntryState;

  private constructor(state: CalendarEntryState) {
    super(state.id);
    this._props = state;
  }

  public get version(): number {
    return this._props.version;
  }

  public incrementVersion(): void {
    this._props.version += 1;
  }

  public get identityId(): IdentityId {
    return this._props.identityId;
  }

  public get title(): string {
    return this._props.title;
  }

  public get description(): string | null {
    return this._props.description;
  }

  public get startTime(): number {
    return this._props.startTime;
  }

  public get endTime(): number {
    return this._props.endTime;
  }

  public get duration(): number {
    return this._props.duration;
  }

  public get hasConflict(): boolean {
    return this._props.hasConflict;
  }

  public get conflictingEntries(): string[] | null {
    return this._props.conflictingEntries ? [...this._props.conflictingEntries] : null;
  }

  public get priority(): number | null {
    return this._props.priority;
  }

  public get location(): string | null {
    return this._props.location;
  }

  public get attendees(): string[] | null {
    return this._props.attendees ? [...this._props.attendees] : null;
  }

  public get createdAt(): Date {
    return this._props.createdAt;
  }

  public get updatedAt(): Date {
    return this._props.updatedAt;
  }

  public static create(params: {
    identityId: IdentityId;
    title: string;
    description?: string;
    startTime: number;
    endTime: number;
    priority?: number;
    location?: string;
    attendees?: string[];
  }): CalendarEntry {
    if (params.startTime >= params.endTime) {
      throw new Error('CalendarEntry startTime must be before endTime');
    }
    if (params.priority !== undefined && (params.priority < 1 || params.priority > 5)) {
      throw new Error('Priority must be between 1 and 5');
    }

    const now = new Date();
    const duration = Math.round((params.endTime - params.startTime) / 60000);

    const entry = new CalendarEntry({
      id: ScheduleId.generate(),
      identityId: params.identityId,
      title: params.title,
      description: params.description ?? null,
      startTime: params.startTime,
      endTime: params.endTime,
      duration,
      hasConflict: false,
      conflictingEntries: null,
      priority: params.priority ?? null,
      location: params.location ?? null,
      attendees: params.attendees ? [...params.attendees] : null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    entry.addDomainEvent<ScheduleEventMap['schedule:calendar-entry-created']>(
      'schedule:calendar-entry-created',
      {
        identityId: params.identityId,
        title: params.title,
        startTime: params.startTime,
        endTime: params.endTime,
      },
    );

    return entry;
  }

  public static load(state: CalendarEntryState): CalendarEntry {
    return new CalendarEntry({
      ...state,
      version: state.version ?? 1,
    });
  }

  public detectConflicts(otherEntries: CalendarEntry[]): ConflictDetectionResult {
    const conflictingEntries = otherEntries.filter((other) => this.isOverlapping(other));

    if (conflictingEntries.length === 0) {
      return { hasConflict: false, conflicts: [], suggestions: [] };
    }

    const conflicts: ConflictDetail[] = conflictingEntries.map((entry) => {
      const overlapDuration = this.calculateOverlap(entry);
      return {
        scheduleId: entry.id,
        scheduleTitle: entry.title,
        overlapStart: Math.max(this._props.startTime, entry.startTime),
        overlapEnd: Math.min(this._props.endTime, entry.endTime),
        overlapDuration,
        severity: this.classifySeverity(overlapDuration),
      };
    });

    return {
      hasConflict: true,
      conflicts,
      suggestions: this.generateSuggestions(conflictingEntries),
    };
  }

  private isOverlapping(other: CalendarEntry): boolean {
    return this._props.startTime < other.endTime && this._props.endTime > other.startTime;
  }

  private calculateOverlap(other: CalendarEntry): number {
    const overlapStart = Math.max(this._props.startTime, other.startTime);
    const overlapEnd = Math.min(this._props.endTime, other.endTime);
    return this.calculateDuration(overlapStart, overlapEnd);
  }

  private calculateDuration(startTime: number, endTime: number): number {
    return Math.round((endTime - startTime) / 60000);
  }

  /**
   * Classify conflict severity based on overlap duration in minutes.
   * - Minor: overlap < 15 minutes
   * - Moderate: overlap 15-60 minutes
   * - Severe: overlap > 60 minutes
   */
  private classifySeverity(overlapMinutes: number): ConflictSeverity {
    if (overlapMinutes > 60) {
      return ConflictSeverity.Severe;
    }
    if (overlapMinutes >= 15) {
      return ConflictSeverity.Moderate;
    }
    return ConflictSeverity.Minor;
  }

  private generateSuggestions(conflicts: CalendarEntry[]): ConflictSuggestion[] {
    const suggestions: ConflictSuggestion[] = [];
    const sorted = [...conflicts].sort((a, b) => a.startTime - b.startTime);
    const earliest = sorted[0];
    const latest = sorted[sorted.length - 1];

    if (earliest) {
      const newEndTime = earliest.startTime;
      const newStartTime = newEndTime - (this._props.endTime - this._props.startTime);
      suggestions.push({ type: 'MoveEarlier', newStartTime, newEndTime });
    }

    if (latest) {
      const newStartTime = latest.endTime;
      const newEndTime = newStartTime + (this._props.endTime - this._props.startTime);
      suggestions.push({ type: 'MoveLater', newStartTime, newEndTime });
    }

    if (earliest && this._props.startTime < earliest.startTime) {
      suggestions.push({
        type: 'Shorten',
        newStartTime: this._props.startTime,
        newEndTime: earliest.startTime,
      });
    }

    return suggestions;
  }

  public toClientDTO(): CalendarEntryClientDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      title: this._props.title,
      description: this._props.description ?? undefined,
      startTime: this._props.startTime,
      endTime: this._props.endTime,
      duration: this._props.duration,
      hasConflict: this._props.hasConflict,
      conflictingEntries: this._props.conflictingEntries ?? undefined,
      priority: this._props.priority ?? undefined,
      location: this._props.location ?? undefined,
      attendees: this._props.attendees ?? undefined,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
    };
  }

  public toServerDTO(): CalendarEntryServerDTO {
    return this.toClientDTO();
  }

  public markAsConflicting(conflictingIds: string[]): void {
    this._props.version += 1;
    this._props.hasConflict = true;
    this._props.conflictingEntries = [...conflictingIds];
    this._props.updatedAt = new Date();
  }

  public clearConflicts(): void {
    this._props.version += 1;
    this._props.hasConflict = false;
    this._props.conflictingEntries = null;
    this._props.updatedAt = new Date();
  }

  public delete(): void {
    this._props.version += 1;
    this._props.updatedAt = new Date();

    this.addDomainEvent<ScheduleEventMap['schedule:calendar-entry-deleted']>(
      'schedule:calendar-entry-deleted',
      { entryId: this.id as ScheduleId },
    );
  }

  public update(params: {
    title?: string;
    description?: string | null;
    startTime?: number;
    endTime?: number;
    location?: string | null;
    priority?: number | null;
    attendees?: string[] | null;
  }): void {
    let changed = false;
    const changedFields: string[] = [];

    if (params.title !== undefined && params.title !== this._props.title) {
      if (!params.title || params.title.trim().length === 0) {
        throw new Error('Title cannot be empty');
      }
      this._props.title = params.title;
      changedFields.push('title');
      changed = true;
    }

    if (params.description !== undefined && params.description !== this._props.description) {
      this._props.description = params.description;
      changedFields.push('description');
      changed = true;
    }

    if (params.location !== undefined && params.location !== this._props.location) {
      this._props.location = params.location;
      changedFields.push('location');
      changed = true;
    }

    if (params.priority !== undefined && params.priority !== this._props.priority) {
      if (params.priority !== null && (params.priority < 1 || params.priority > 5)) {
        throw new Error('Priority must be between 1 and 5');
      }
      this._props.priority = params.priority;
      changedFields.push('priority');
      changed = true;
    }

    if (params.attendees !== undefined) {
      const newAttendees = params.attendees ? [...params.attendees] : null;
      this._props.attendees = newAttendees;
      changedFields.push('attendees');
      changed = true;
    }

    let isRescheduled = false;
    let oldStart = this._props.startTime;
    let oldEnd = this._props.endTime;
    if (params.startTime !== undefined || params.endTime !== undefined) {
      const newStart = params.startTime ?? this._props.startTime;
      const newEnd = params.endTime ?? this._props.endTime;
      if (newStart >= newEnd) {
        throw new Error('Invalid time range: startTime must be before endTime');
      }
      if (newStart !== this._props.startTime || newEnd !== this._props.endTime) {
        oldStart = this._props.startTime;
        oldEnd = this._props.endTime;
        this._props.startTime = newStart;
        this._props.endTime = newEnd;
        this._props.duration = this.calculateDuration(newStart, newEnd);
        isRescheduled = true;
        changed = true;
      }
    }

    if (changed) {
      this._props.version += 1;
      this._props.updatedAt = new Date();

      if (isRescheduled) {
        this.addDomainEvent<ScheduleEventMap['schedule:calendar-entry-rescheduled']>(
          'schedule:calendar-entry-rescheduled',
          {
            entryId: this.id as ScheduleId,
            oldStartTime: oldStart,
            oldEndTime: oldEnd,
            newStartTime: this._props.startTime,
            newEndTime: this._props.endTime,
          },
        );
      }

      if (changedFields.length > 0) {
        this.addDomainEvent<ScheduleEventMap['schedule:calendar-entry-updated']>(
          'schedule:calendar-entry-updated',
          { entryId: this.id as ScheduleId, changedFields },
        );
      }
    }
  }

  public reschedule(newStartTime: number, newEndTime: number): void {
    this.update({ startTime: newStartTime, endTime: newEndTime });
  }

  public updateTitle(title: string): void {
    this.update({ title });
  }

  public updateDescription(description: string | null): void {
    this.update({ description });
  }

  public updatePriority(priority: number | null): void {
    this.update({ priority });
  }

  public updateLocation(location: string | null): void {
    this.update({ location });
  }

  public updateAttendees(attendees: string[] | null): void {
    this.update({ attendees });
  }
}
