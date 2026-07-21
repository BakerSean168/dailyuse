import { describe, expect, it } from 'vitest';
import { IdentityId } from '@dailyuse/domain-shared';
import type { IScheduleRepository } from '@/server/domain/repositories/i-schedule-repository';
import { CalendarEntry } from '@/server/domain/aggregates/calendar-entry';
import { ScheduleConflictDetectionService } from './schedule-conflict-detection-service';
import { ScheduleConflictResolutionService } from './schedule-conflict-resolution-service';
import { ScheduleEventApplicationService } from './schedule-event-application-service';

class InMemoryScheduleRepository implements IScheduleRepository {
  private readonly schedules = new Map<string, CalendarEntry>();

  async save(schedule: CalendarEntry): Promise<void> {
    this.schedules.set(schedule.id, schedule);
  }


  async findById(id: string): Promise<CalendarEntry | null> {
    return this.schedules.get(id) ?? null;
  }

  async findByIdForIdentity(identityId: string, id: string): Promise<CalendarEntry | null> {
    const schedule = this.schedules.get(id) ?? null;
    if (!schedule || schedule.identityId !== identityId) {
      return null;
    }
    return schedule;
  }

  async findByIdentityId(identityId: string): Promise<CalendarEntry[]> {
    return Array.from(this.schedules.values()).filter((schedule) => schedule.identityId === identityId);
  }

  async deleteById(identityId: string, id: string): Promise<void> {
    const schedule = await this.findByIdForIdentity(identityId, id);
    if (!schedule) {
      throw new Error('Schedule event not found for the current identity.');
    }
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

describe('ScheduleConflictResolutionService', () => {
  it('creates a schedule and returns refreshed conflict information', async () => {
    const repository = new InMemoryScheduleRepository();
    const identityId = IdentityId.generate();
    const existing = CalendarEntry.create({
      identityId,
      title: 'Existing',
      startTime: hour(9),
      endTime: hour(10),
    });
    await repository.save(existing);

    const service = new ScheduleConflictResolutionService(
      new ScheduleEventApplicationService(repository),
      new ScheduleConflictDetectionService(repository),
    );

    const result = await service.createWithConflictDetection(
      {
        name: 'Created',
        startTime: hour(9.5),
        endTime: hour(10.5),
        duration: 60,
      },
      identityId,
    );

    expect(result.schedule.hasConflict).toBe(true);
    expect(result.conflicts.hasConflict).toBe(true);
    expect(result.conflicts.conflicts).toHaveLength(1);
  });

  it('auto-resolves a conflicting schedule using the first suggestion', async () => {
    const repository = new InMemoryScheduleRepository();
    const eventService = new ScheduleEventApplicationService(repository);
    const identityId = IdentityId.generate();
    const first = await eventService.createSchedule({
      identityId,
      title: 'First',
      startTime: hour(9),
      endTime: hour(10),
    });
    const second = await eventService.createSchedule({
      identityId,
      title: 'Second',
      startTime: hour(9.5),
      endTime: hour(10.5),
    });

    const service = new ScheduleConflictResolutionService(
      eventService,
      new ScheduleConflictDetectionService(repository),
    );

    const result = await service.resolveConflict(second.id, { resolution: 'AUTO' }, identityId);

    expect(result.schedule.id).toBe(second.id);
    expect(result.applied.strategy).toBe('AUTO');
    expect(result.applied.previousStartTime).toBe(second.startTime);
    expect(result.schedule.startTime).not.toBe(second.startTime);
    expect(result.conflicts.hasConflict).toBe(true);
    expect(result.conflicts.conflicts.some((conflict) => conflict.scheduleId === first.id)).toBe(true);
  });
});
