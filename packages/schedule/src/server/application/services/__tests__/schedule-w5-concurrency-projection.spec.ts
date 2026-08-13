import { describe, expect, it, vi } from 'vitest';
import { CalendarEntry } from '../../../domain/aggregates/calendar-entry';
import { ScheduleEventApplicationService } from '../schedule-event-application-service';
import { ScheduleRebuildWorkerService } from '../schedule-rebuild-worker-service';
import { ScheduleConflictIntegrityService } from '../schedule-conflict-integrity-service';
import type { IScheduleRepository, ScheduleRebuildOutboxDTO } from '../../../domain/repositories/i-schedule-repository';

class InMemoryScheduleRepository implements IScheduleRepository {
  public schedules = new Map<string, CalendarEntry>();
  public outbox: ScheduleRebuildOutboxDTO[] = [];

  async save(schedule: CalendarEntry, expectedVersion?: number): Promise<void> {
    const existing = this.schedules.get(schedule.id);
    if (expectedVersion !== undefined && existing) {
      if (existing.version !== expectedVersion) {
        const err: any = new Error(
          `Schedule event ${schedule.id} version conflict (expected ${expectedVersion}, current version is ${existing.version})`,
        );
        err.code = 'CONFLICT';
        err.statusCode = 409;
        err.context = { currentVersion: existing.version, expectedVersion };
        throw err;
      }
    }
    const state = {
      id: schedule.id as any,
      identityId: schedule.identityId,
      title: schedule.title,
      description: schedule.description,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      duration: schedule.duration,
      hasConflict: schedule.hasConflict,
      conflictingEntries: schedule.conflictingEntries,
      priority: schedule.priority,
      location: schedule.location,
      attendees: schedule.attendees,
      version: expectedVersion !== undefined ? expectedVersion + 1 : schedule.version,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    };
    this.schedules.set(schedule.id, CalendarEntry.load(state));
  }

  async findByIdForIdentity(identityId: string, id: string): Promise<CalendarEntry | null> {
    const s = this.schedules.get(id);
    if (!s || s.identityId !== identityId) return null;
    return CalendarEntry.load({
      id: s.id as any,
      identityId: s.identityId,
      title: s.title,
      description: s.description,
      startTime: s.startTime,
      endTime: s.endTime,
      duration: s.duration,
      hasConflict: s.hasConflict,
      conflictingEntries: s.conflictingEntries,
      priority: s.priority,
      location: s.location,
      attendees: s.attendees,
      version: s.version,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    });
  }

  async findByIdentityId(identityId: string): Promise<CalendarEntry[]> {
    return Array.from(this.schedules.values()).filter((s) => s.identityId === identityId);
  }

  async deleteById(identityId: string, id: string, expectedVersion: number): Promise<void> {
    const s = this.schedules.get(id);
    if (!s || s.identityId !== identityId) {
      const err: any = new Error(`Schedule event ${id} not found`);
      err.code = 'NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    if (s.version !== expectedVersion) {
      const err: any = new Error(
        `Schedule event ${id} version conflict (expected ${expectedVersion}, current version is ${s.version})`,
      );
      err.code = 'CONFLICT';
      err.statusCode = 409;
      err.context = { currentVersion: s.version, expectedVersion };
      throw err;
    }
    this.schedules.delete(id);
  }

  async deleteAggregate(entry: CalendarEntry, expectedVersion: number): Promise<void> {
    await this.deleteById(entry.identityId, entry.id, expectedVersion);
  }

  async findByTimeRange(
    identityId: string,
    startTime: number,
    endTime: number,
    excludeId?: string,
  ): Promise<CalendarEntry[]> {
    return Array.from(this.schedules.values()).filter(
      (s) =>
        s.identityId === identityId &&
        s.startTime < endTime &&
        s.endTime > startTime &&
        s.id !== excludeId,
    );
  }

  async updateConflictProjection(
    identityId: string,
    id: string,
    hasConflict: boolean,
    conflictingEntries: string[] | null,
    sourceRevision: number,
  ): Promise<void> {
    const s = this.schedules.get(id);
    if (!s || s.identityId !== identityId) return;
    if (s.version > sourceRevision) return;

    const state = {
      id: s.id as any,
      identityId: s.identityId,
      title: s.title,
      description: s.description,
      startTime: s.startTime,
      endTime: s.endTime,
      duration: s.duration,
      hasConflict,
      conflictingEntries,
      priority: s.priority,
      location: s.location,
      attendees: s.attendees,
      version: s.version,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
    this.schedules.set(id, CalendarEntry.load(state));
  }

  async createRebuildOutbox(item: {
    identityId: string;
    scheduleId?: string;
    startTime: number;
    endTime: number;
    sourceRevision: number;
    idempotencyKey?: string;
  }): Promise<void> {
    const key = item.idempotencyKey ?? `rebuild:${item.identityId}:${item.sourceRevision}`;
    const existingIndex = this.outbox.findIndex((o) => o.idempotencyKey === key);
    const dto: ScheduleRebuildOutboxDTO = {
      id: existingIndex >= 0 ? this.outbox[existingIndex].id : `outbox-${Date.now()}-${Math.random()}`,
      identityId: item.identityId,
      scheduleId: item.scheduleId ?? null,
      startTime: new Date(item.startTime),
      endTime: new Date(item.endTime),
      sourceRevision: item.sourceRevision,
      idempotencyKey: key,
      status: 'pending',
      attempts: 0,
      lastError: null,
      processedAt: null,
      createdAt: new Date(),
    };
    if (existingIndex >= 0) {
      this.outbox[existingIndex] = dto;
    } else {
      this.outbox.push(dto);
    }
  }

  async fetchPendingRebuildOutbox(identityId?: string): Promise<ScheduleRebuildOutboxDTO[]> {
    return this.outbox.filter((o) => o.status === 'pending' && (!identityId || o.identityId === identityId));
  }

  async claimRebuildOutboxItems(
    claimToken: string,
    limit = 50,
  ): Promise<ScheduleRebuildOutboxDTO[]> {
    const pending = this.outbox.filter((o) => o.status === 'pending' || o.status === 'retry').slice(0, limit);
    for (const item of pending) {
      item.status = 'processing';
      item.claimToken = claimToken;
      item.claimedAt = new Date();
    }
    return pending;
  }

  async markRebuildOutboxProcessed(
    id: string,
    claimToken: string,
    error?: string,
    maxAttempts = 5,
  ): Promise<void> {
    const item = this.outbox.find((o) => o.id === id);
    if (item) {
      if (!error) {
        item.status = 'completed';
        item.processedAt = new Date();
        item.lastError = null;
        item.claimToken = null;
      } else {
        item.attempts += 1;
        item.lastError = error;
        item.claimToken = null;
        item.status = item.attempts >= maxAttempts ? 'failed' : 'retry';
      }
    }
  }

  async withTransaction<T>(fn: (repo: IScheduleRepository) => Promise<T>): Promise<T> {
    const snapshot = new Map(this.schedules);
    const outboxSnapshot = JSON.parse(JSON.stringify(this.outbox));
    try {
      return await fn(this);
    } catch (err) {
      this.schedules = snapshot;
      this.outbox = outboxSnapshot;
      throw err;
    }
  }
}

describe('W5: Schedule OCC Concurrency, Outbox & Projection Integrity', () => {
  const identityId = 'acc_user_w5_test';

  it('Requirement 1: dual client update with expectedVersion optimistic locking — only one succeeds & conflict receipt contains currentVersion', async () => {
    const repo = new InMemoryScheduleRepository();
    const service = new ScheduleEventApplicationService(repo);

    const created = await service.createSchedule({
      identityId,
      title: 'Initial Event',
      startTime: 1000,
      endTime: 2000,
    });

    expect(created.version).toBe(1);

    // Client A updates with expectedVersion: 1
    const updatedA = await service.updateSchedule(created.id, identityId, {
      title: 'Updated by A',
      expectedVersion: 1,
    });
    expect(updatedA.title).toBe('Updated by A');
    expect(updatedA.version).toBe(2);

    // Client B attempts to update with stale expectedVersion: 1
    await expect(
      service.updateSchedule(created.id, identityId, {
        title: 'Updated by B',
        expectedVersion: 1,
      }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      context: {
        currentVersion: 2,
        expectedVersion: 1,
      },
    });

    // Delete with stale version 1 also fails with CONFLICT
    await expect(
      service.deleteSchedule(created.id, identityId, 1),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      context: {
        currentVersion: 2,
        expectedVersion: 1,
      },
    });

    // Delete with matching version 2 succeeds
    await service.deleteSchedule(created.id, identityId, 2);
    expect(await repo.findByIdForIdentity(identityId, created.id)).toBeNull();
  });

  it('Requirement 2: update/delete and conflict changes commit in same transaction — rollback on conflict write error', async () => {
    const repo = new InMemoryScheduleRepository();
    const service = new ScheduleEventApplicationService(repo);

    const created = await service.createSchedule({
      identityId,
      title: 'Event To Rollback',
      startTime: 1000,
      endTime: 2000,
    });

    // Fault injection: throw during outbox creation inside transaction
    vi.spyOn(repo, 'createRebuildOutbox').mockImplementationOnce(async () => {
      throw new Error('Database transaction fault injected: outbox write error');
    });

    await expect(
      service.updateSchedule(created.id, identityId, {
        title: 'Should Rollback Title',
        expectedVersion: 1,
      }),
    ).rejects.toThrow('Database transaction fault injected');

    // Verify aggregate title was rolled back completely
    const afterFailedUpdate = await service.getSchedule(created.id, identityId);
    expect(afterFailedUpdate?.title).toBe('Event To Rollback');
    expect(afterFailedUpdate?.version).toBe(1);
  });

  it('Requirement 3 & 4: versioned rebuild outbox, lease worker restart accurately rebuilds conflicts & handles duplicate consumption idempotently', async () => {
    const repo = new InMemoryScheduleRepository();
    const service = new ScheduleEventApplicationService(repo);
    const worker = new ScheduleRebuildWorkerService(repo, {
      execute: async (_key, task) => ({ acquired: true, value: await task({ ensureHeld: async () => undefined }) }),
    });

    const e1 = await service.createSchedule({ identityId, title: 'Event 1', startTime: 1000, endTime: 2000 });
    const e2 = await service.createSchedule({ identityId, title: 'Event 2', startTime: 1200, endTime: 1800 });
    const e3 = await service.createSchedule({ identityId, title: 'Event 3', startTime: 1500, endTime: 2500 });

    const s1 = await service.getSchedule(e1.id, identityId);
    const s2 = await service.getSchedule(e2.id, identityId);
    const s3 = await service.getSchedule(e3.id, identityId);

    expect(s1?.hasConflict).toBe(true);
    expect(s2?.hasConflict).toBe(true);
    expect(s3?.hasConflict).toBe(true);

    // Delete Event 3
    await service.deleteSchedule(e3.id, identityId, e3.version);

    // Worker restart simulation: worker processes outbox
    const workerRes1 = await worker.processOutbox(identityId);
    expect(workerRes1.processedCount).toBeGreaterThan(0);
    expect(workerRes1.failedCount).toBe(0);

    // Duplicate consumption test: process outbox again idempotently
    const workerRes2 = await worker.processOutbox(identityId);
    expect(workerRes2.processedCount).toBe(0); // already completed

    // Delete Event 2 and run worker rebuild
    const latestE2 = await service.getSchedule(e2.id, identityId);
    await service.deleteSchedule(e2.id, identityId, latestE2!.version);
    await worker.processOutbox(identityId);

    // Now e1 has no remaining overlapping events
    const afterDeleteS1 = await service.getSchedule(e1.id, identityId);
    expect(afterDeleteS1?.hasConflict).toBe(false);
  });

  it('Requirement 5: cache vs base event query comparison validation test', async () => {
    const repo = new InMemoryScheduleRepository();
    const service = new ScheduleEventApplicationService(repo);
    const integrityService = new ScheduleConflictIntegrityService(repo);

    await service.createSchedule({ identityId, title: 'Meeting A', startTime: 100, endTime: 300 });
    await service.createSchedule({ identityId, title: 'Meeting B', startTime: 200, endTime: 400 });
    await service.createSchedule({ identityId, title: 'Meeting C', startTime: 500, endTime: 600 });

    const report = await integrityService.verifyConflictCacheIntegrity(identityId, 0, 1000);

    expect(report.isConsistent).toBe(true);
    expect(report.totalSchedules).toBe(3);
    expect(report.conflictingCount).toBe(2);
    expect(report.mismatchedCount).toBe(0);
  });
});
