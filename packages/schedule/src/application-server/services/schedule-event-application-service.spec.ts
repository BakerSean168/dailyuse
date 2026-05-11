import { describe, expect, it } from 'vitest';
import { IdentityId } from '@dailyuse/domain-shared';
import type { IScheduleRepository } from '../../domain-server/repositories/IScheduleRepository';
import { CalendarEntry } from '../../domain-server/aggregates/calendar-entry';
import { ScheduleConflictDetectionService } from './schedule-conflict-detection-service';
import { ScheduleEventApplicationService } from './schedule-event-application-service';

class InMemoryScheduleRepository implements IScheduleRepository {
  private readonly schedules = new Map<string, CalendarEntry>();
  public saveCalls = 0;

  async save(schedule: CalendarEntry): Promise<void> {
    this.saveCalls += 1;
    this.schedules.set(schedule.id, schedule);
  }

  async findById(id: string): Promise<CalendarEntry | null> {
    return this.schedules.get(id) ?? null;
  }

  async findByIdentityId(identityId: string): Promise<CalendarEntry[]> {
    return Array.from(this.schedules.values()).filter((schedule) => schedule.identityId === identityId);
  }

  async deleteById(id: string): Promise<void> {
    this.schedules.delete(id);
  }

  async deleteAggregate(entry: CalendarEntry): Promise<void> {
    this.schedules.delete(entry.id);
  }

  async findByTimeRange(
    identityId: string,
    startTime: number,
    endTime: number,
    excludeId?: string,
  ): Promise<CalendarEntry[]> {
    return Array.from(this.schedules.values())
      .filter((schedule) => {
        if (schedule.identityId !== identityId) return false;
        if (excludeId && schedule.id === excludeId) return false;
        return schedule.startTime < endTime && schedule.endTime > startTime;
      })
      .sort((left, right) => left.startTime - right.startTime);
  }

  async withTransaction<T>(fn: (repo: IScheduleRepository) => Promise<T>): Promise<T> {
    return fn(this);
  }
}

const hour = (h: number): number => {
  return new Date('2026-05-02T00:00:00.000Z').getTime() + h * 60 * 60 * 1000;
};

describe('Schedule services', () => {
  it('detectConflictsForTimeRange is analysis-only and does not save', async () => {
    const repository = new InMemoryScheduleRepository();
    const existing = CalendarEntry.create({
      identityId: IdentityId.generate(),
      title: 'Existing',
      startTime: hour(9),
      endTime: hour(10),
    });
    await repository.save(existing);

    const service = new ScheduleConflictDetectionService(repository);
    const result = await service.detectConflictsForTimeRange({
      identityId: 'acc-1',
      startTime: hour(9.5),
      endTime: hour(10.5),
    });

    expect(result.hasConflict).toBe(true);
    expect(result.conflicts).toHaveLength(1);
    expect(repository.saveCalls).toBe(1);
  });

  it('createSchedule refreshes conflict state for the new and existing events', async () => {
    const repository = new InMemoryScheduleRepository();
    const identityId = IdentityId.generate();
    const existing = CalendarEntry.create({
      identityId,
      title: 'Existing',
      startTime: hour(9),
      endTime: hour(10),
    });
    await repository.save(existing);

    const service = new ScheduleEventApplicationService(repository);
    const created = await service.createSchedule({
      identityId,
      title: 'Created',
      startTime: hour(9.5),
      endTime: hour(10.5),
    });

    const refreshedExisting = await repository.findById(existing.id);

    expect(created.hasConflict).toBe(true);
    expect(created.conflictingEntries).toContain(existing.id);
    expect(refreshedExisting?.hasConflict).toBe(true);
    expect(refreshedExisting?.conflictingEntries).toContain(created.id);
  });

  it('updateSchedule persists metadata changes and clears stale conflicts after moving the event', async () => {
    const repository = new InMemoryScheduleRepository();
    const service = new ScheduleEventApplicationService(repository);
    const identityId = IdentityId.generate();

    const first = await service.createSchedule({
      identityId,
      title: 'First',
      startTime: hour(9),
      endTime: hour(10),
    });
    const second = await service.createSchedule({
      identityId,
      title: 'Second',
      startTime: hour(9.5),
      endTime: hour(10.5),
    });

    const updated = await service.updateSchedule(first.id, {
      startTime: hour(12),
      endTime: hour(13),
      description: 'Updated notes',
      location: 'Room B',
      priority: 4,
      attendees: ['a@example.com', 'b@example.com'],
    });

    const refreshedSecond = await repository.findById(second.id);

    expect(updated.hasConflict).toBe(false);
    expect(updated.description).toBe('Updated notes');
    expect(updated.location).toBe('Room B');
    expect(updated.priority).toBe(4);
    expect(updated.attendees).toEqual(['a@example.com', 'b@example.com']);
    expect(refreshedSecond?.hasConflict).toBe(false);
    expect(refreshedSecond?.conflictingEntries).toBeNull();
  });

  it('deleteSchedule refreshes remaining events in the old conflict window', async () => {
    const repository = new InMemoryScheduleRepository();
    const service = new ScheduleEventApplicationService(repository);
    const identityId = IdentityId.generate();

    const first = await service.createSchedule({
      identityId,
      title: 'First',
      startTime: hour(9),
      endTime: hour(10),
    });
    const second = await service.createSchedule({
      identityId,
      title: 'Second',
      startTime: hour(9.5),
      endTime: hour(10.5),
    });

    await service.deleteSchedule(first.id);

    const deleted = await repository.findById(first.id);
    const refreshedSecond = await repository.findById(second.id);

    expect(deleted).toBeNull();
    expect(refreshedSecond?.hasConflict).toBe(false);
    expect(refreshedSecond?.conflictingEntries).toBeNull();
  });
});
