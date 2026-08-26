/**
 * GoalTimeRange 值对象
 *
 * ADR-037 W6: getters expose Instant (epoch ms), not DomainDate/Date.
 * Internal storage remains TransferDate ≡ Instant.
 */

import { ValueObject } from '@memoflow/utils/domain';
import type { GoalTimeRange as IGoalTimeRange, GoalTimeRangeDTO } from '@memoflow/contracts/goal';
import type { Instant } from '@memoflow/contracts/primitives';
import { createTimeFacade } from '@memoflow/time';

const time = createTimeFacade();

export class GoalTimeRange extends ValueObject<GoalTimeRangeDTO> implements IGoalTimeRange {
  private constructor(props: GoalTimeRangeDTO) {
    super(props);
  }

  public static create(props: GoalTimeRangeDTO): GoalTimeRange {
    this.validate(props);
    return new GoalTimeRange(props);
  }

  public static createDefault(startDate?: Instant | null): GoalTimeRange {
    return new GoalTimeRange({
      startDate: startDate ?? null,
      dueDate: null,
      completedAt: null,
      archivedAt: null,
    });
  }

  public static fromDTO(dto: GoalTimeRangeDTO): GoalTimeRange {
    return new GoalTimeRange(dto);
  }

  private static validate(props: GoalTimeRangeDTO): void {
    const { startDate, dueDate } = props;

    if (startDate !== null && dueDate !== null && startDate > dueDate) {
      throw new Error('Start date must be before or equal to due date');
    }
  }

  public get startDate(): Instant | null {
    return this.props.startDate;
  }

  public get dueDate(): Instant | null {
    return this.props.dueDate;
  }

  public get completedAt(): Instant | null {
    return this.props.completedAt;
  }

  public get archivedAt(): Instant | null {
    return this.props.archivedAt;
  }

  public setStartDate(startDate: Instant | null): GoalTimeRange {
    const newProps = { ...this.props, startDate };
    GoalTimeRange.validate(newProps);
    return new GoalTimeRange(newProps);
  }

  public setDueDate(dueDate: Instant | null): GoalTimeRange {
    const newProps = { ...this.props, dueDate };
    GoalTimeRange.validate(newProps);
    return new GoalTimeRange(newProps);
  }

  public markAsCompleted(completedAt: Instant = time.now()): GoalTimeRange {
    const newProps = { ...this.props, completedAt };
    GoalTimeRange.validate(newProps);
    return new GoalTimeRange(newProps);
  }

  public markAsArchived(archivedAt: Instant = time.now()): GoalTimeRange {
    const newProps = { ...this.props, archivedAt };
    GoalTimeRange.validate(newProps);
    return new GoalTimeRange(newProps);
  }

  public unmarkAsCompleted(): GoalTimeRange {
    return new GoalTimeRange({ ...this.props, completedAt: null });
  }

  public unmarkAsArchived(): GoalTimeRange {
    return new GoalTimeRange({ ...this.props, archivedAt: null });
  }

  public get isCompleted(): boolean {
    return this.props.completedAt !== null;
  }

  public get isArchived(): boolean {
    return this.props.archivedAt !== null;
  }

  /** Archive is a display/persistence attribute, not a business terminal state. */
  public get isTerminal(): boolean {
    return this.isCompleted;
  }

  public get isOverdue(): boolean {
    if (this.props.dueDate === null || this.isCompleted || this.isArchived) {
      return false;
    }
    return time.now() > this.props.dueDate;
  }

  public getDaysToDueDate(): number | null {
    if (this.props.dueDate === null) return null;
    return time.calendar.diffCalendarDays(time.now(), this.props.dueDate as Instant);
  }

  public getElapsedDays(): number | null {
    if (this.props.startDate === null) return null;
    const end = (this.props.completedAt ?? time.now()) as Instant;
    return time.calendar.diffCalendarDays(end, this.props.startDate as Instant);
  }

  public getPlannedDays(): number | null {
    if (this.props.startDate === null || this.props.dueDate === null) return null;
    return time.calendar.diffCalendarDays(
      this.props.dueDate as Instant,
      this.props.startDate as Instant,
    );
  }

  public toDTO(): GoalTimeRangeDTO {
    return {
      startDate: this.props.startDate,
      dueDate: this.props.dueDate,
      completedAt: this.props.completedAt,
      archivedAt: this.props.archivedAt,
    };
  }
}
