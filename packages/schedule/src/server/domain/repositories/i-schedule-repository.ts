/**
 * IScheduleRepository
 * Interface for user-facing calendar schedule repository
 *
 * @module Schedule
 * @since Story 9.2 (EPIC-SCHEDULE-001)
 */

import type { CalendarEntry } from '../aggregates/calendar-entry';

export interface ScheduleRebuildOutboxDTO {
  id: string;
  identityId: string;
  scheduleId: string | null;
  startTime: Date;
  endTime: Date;
  sourceRevision: number;
  idempotencyKey: string | null;
  status: string;
  attempts: number;
  claimToken?: string | null;
  claimedAt?: Date | null;
  nextAttemptAt?: Date | null;
  lastError: string | null;
  processedAt: Date | null;
  createdAt: Date;
}

export interface ScheduleDomainEventOutboxDTO {
  id: string;
  identityId: string;
  scheduleId: string;
  eventType: string;
  payload: string;
  status: string;
  attempts: number;
  claimToken?: string | null;
  claimedAt?: Date | null;
  nextAttemptAt?: Date | null;
  publishedAt?: Date | null;
  lastError?: string | null;
  idempotencyKey: string;
  createdAt: Date;
}

export interface IScheduleRepository {
  /**
   * Persist a schedule aggregate with optional expectedVersion optimistic locking
   */
  save(schedule: CalendarEntry, expectedVersion?: number): Promise<void>;

  /**
   * Find a schedule by UUID owned by the given identity (only load path)
   */
  findByIdForIdentity(identityId: string, id: string): Promise<CalendarEntry | null>;

  /**
   * Find all schedules for an account
   */
  findByIdentityId(identityId: string): Promise<CalendarEntry[]>;

  /**
   * Delete schedule by UUID for the owning identity with required expectedVersion
   */
  deleteById(identityId: string, id: string, expectedVersion: number): Promise<void>;

  /**
   * Domain-command delete — deletes persistently then publishes aggregate domain events.
   */
  deleteAggregate(entry: CalendarEntry, expectedVersion: number): Promise<void>;

  /**
   * Find schedules that overlap a given time range for an account.
   */
  findByTimeRange(
    identityId: string,
    startTime: number,
    endTime: number,
    excludeId?: string
  ): Promise<CalendarEntry[]>;

  /**
   * Update conflict projection columns only without mutating business revision or fields.
   */
  updateConflictProjection(
    identityId: string,
    id: string,
    hasConflict: boolean,
    conflictingEntries: string[] | null,
    sourceRevision: number
  ): Promise<void>;

  /**
   * Create a versioned rebuild outbox entry for background conflict recalculation
   */
  createRebuildOutbox(item: {
    identityId: string;
    scheduleId?: string;
    startTime: number;
    endTime: number;
    sourceRevision: number;
    idempotencyKey?: string;
  }): Promise<void>;

  /**
   * Fetch pending rebuild outbox entries
   */
  fetchPendingRebuildOutbox(
    identityId?: string,
    limit?: number,
  ): Promise<ScheduleRebuildOutboxDTO[]>;

  /**
   * Atomically claim pending rebuild outbox items for worker processing
   */
  claimRebuildOutboxItems(
    claimToken: string,
    limit?: number,
    timeoutMs?: number,
  ): Promise<ScheduleRebuildOutboxDTO[]>;

  /**
   * Mark a rebuild outbox entry as processed (or retry/failed)
   */
  markRebuildOutboxProcessed(
    id: string,
    claimToken: string,
    error?: string,
    maxAttempts?: number,
  ): Promise<void>;

  /**
   * Create domain event outbox entries within the same database transaction
   */
  createDomainEventOutbox(
    events: {
      identityId: string;
      scheduleId: string;
      eventType: string;
      payload: string;
      idempotencyKey: string;
    }[],
  ): Promise<void>;

  /**
   * Fetch pending domain event outbox entries
   */
  fetchPendingDomainEventOutbox(
    identityId?: string,
    limit?: number,
  ): Promise<ScheduleDomainEventOutboxDTO[]>;

  /**
   * Atomically claim pending domain event outbox items for publisher processing
   */
  claimDomainEventOutboxItems(
    claimToken: string,
    limit?: number,
    timeoutMs?: number,
  ): Promise<ScheduleDomainEventOutboxDTO[]>;

  /**
   * Mark a domain event outbox entry as processed (completed, or retry/failed)
   */
  markDomainEventOutboxProcessed(
    id: string,
    claimToken: string,
    error?: string,
    maxAttempts?: number,
  ): Promise<void>;

  /**
   * Mandatory transaction wrapper — fails fast if unsupported
   */
  withTransaction<T>(fn: (repo: IScheduleRepository) => Promise<T>): Promise<T>;
}
