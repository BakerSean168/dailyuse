import { AggregateRoot } from '@dailyuse/utils/domain';
import { IdentityId } from '@dailyuse/domain-shared';
import type {
  CalendarEntryClientDTO,
  CalendarEntryServerDTO,
  ConflictDetail,
  ConflictDetectionResult,
  ConflictSuggestion,
  ScheduleEventMap,
} from '@dailyuse/contracts/schedule';
import { ConflictSeverity } from '@dailyuse/contracts/schedule';
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
  createdAt: Date;
  updatedAt: Date;
}

export class CalendarEntry extends AggregateRoot<ScheduleId> {
  private _props: CalendarEntryState;

  private constructor(state: CalendarEntryState) {
    super(state.id);
    this._props = state;
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
    return new CalendarEntry(state);
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
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
    };
  }

  public toServerDTO(): CalendarEntryServerDTO {
    return this.toClientDTO();
  }

  public markAsConflicting(conflictingIds: string[]): void {
    this._props.hasConflict = true;
    this._props.conflictingEntries = [...conflictingIds];
    this._props.updatedAt = new Date();
  }

  public clearConflicts(): void {
    this._props.hasConflict = false;
    this._props.conflictingEntries = null;
    this._props.updatedAt = new Date();
  }

  public delete(): void {
    this._props.updatedAt = new Date();

    this.addDomainEvent<ScheduleEventMap['schedule:calendar-entry-deleted']>(
      'schedule:calendar-entry-deleted',
      { entryId: this.id as ScheduleId },
    );
  }

  public reschedule(newStartTime: number, newEndTime: number): void {
    if (newStartTime >= newEndTime) {
      throw new Error('Invalid time range: startTime must be before endTime');
    }

    const oldStartTime = this._props.startTime;
    const oldEndTime = this._props.endTime;

    this._props.startTime = newStartTime;
    this._props.endTime = newEndTime;
    this._props.duration = this.calculateDuration(newStartTime, newEndTime);
    this._props.updatedAt = new Date();

    this.addDomainEvent<ScheduleEventMap['schedule:calendar-entry-rescheduled']>(
      'schedule:calendar-entry-rescheduled',
      {
        entryId: this.id as ScheduleId,
        oldStartTime,
        oldEndTime,
        newStartTime,
        newEndTime,
      },
    );
  }

  public updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }
    this._props.title = title;
    this._props.updatedAt = new Date();

    this.addDomainEvent<ScheduleEventMap['schedule:calendar-entry-updated']>(
      'schedule:calendar-entry-updated',
      { entryId: this.id as ScheduleId, changedFields: ['title'] },
    );
  }

  public updateDescription(description: string | null): void {
    this._props.description = description;
    this._props.updatedAt = new Date();

    this.addDomainEvent<ScheduleEventMap['schedule:calendar-entry-updated']>(
      'schedule:calendar-entry-updated',
      { entryId: this.id as ScheduleId, changedFields: ['description'] },
    );
  }

  public updatePriority(priority: number | null): void {
    if (priority !== null && (priority < 1 || priority > 5)) {
      throw new Error('Priority must be between 1 and 5');
    }
    this._props.priority = priority;
    this._props.updatedAt = new Date();

    this.addDomainEvent<ScheduleEventMap['schedule:calendar-entry-updated']>(
      'schedule:calendar-entry-updated',
      { entryId: this.id as ScheduleId, changedFields: ['priority'] },
    );
  }

  public updateLocation(location: string | null): void {
    this._props.location = location;
    this._props.updatedAt = new Date();

    this.addDomainEvent<ScheduleEventMap['schedule:calendar-entry-updated']>(
      'schedule:calendar-entry-updated',
      { entryId: this.id as ScheduleId, changedFields: ['location'] },
    );
  }

  public updateAttendees(attendees: string[] | null): void {
    this._props.attendees = attendees ? [...attendees] : null;
    this._props.updatedAt = new Date();

    this.addDomainEvent<ScheduleEventMap['schedule:calendar-entry-updated']>(
      'schedule:calendar-entry-updated',
      { entryId: this.id as ScheduleId, changedFields: ['attendees'] },
    );
  }
}
