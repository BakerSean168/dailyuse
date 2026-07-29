/**
 * PrismaScheduleMapper Unit Tests
 *
 * Maps between CalendarEntry domain aggregate and Prisma Schedule model.
 * Covers:
 * - toDomain: Prisma record to domain aggregate
 * - toPersistence: Aggregate to Prisma write data
 * - toDomainList: Batch conversion
 * - Timestamp conversion and JSON serialization
 * - Optional fields (null handling)
 */

import { describe, it, expect } from 'vitest';
import { aPrefixedUuid } from '@memoflow/test-utils/fixtures';
import { PrismaScheduleMapper } from './prisma-schedule-mapper';
import type { Schedule as PrismaSchedule } from '@memoflow/database';

// ─── Test Helpers ───────────────────────────────────────────────────

const SCHEDULE_ID_1 = aPrefixedUuid('IScheduleId', 'schedule-1');
const SCHEDULE_ID_2 = aPrefixedUuid('IScheduleId', 'schedule-2');
const IDENTITY_ID_1 = aPrefixedUuid('IdentityId', 'schedule-owner-1');
const IDENTITY_ID_2 = aPrefixedUuid('IdentityId', 'schedule-owner-2');

function createMinimalRow(): PrismaSchedule {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  
  return {
    id: SCHEDULE_ID_1,
    identityId: IDENTITY_ID_1,
    title: 'Team Meeting',
    description: null,
    startTime: now,
    endTime: oneHourLater,
    duration: 60,
    hasConflict: false,
    conflictingSchedules: null,
    priority: null,
    location: null,
    attendees: null,
    createdAt: now,
    updatedAt: now,
  } as PrismaSchedule;
}

function createFullRow(): PrismaSchedule {
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  
  return {
    id: SCHEDULE_ID_2,
    identityId: IDENTITY_ID_2,
    title: 'Project Planning',
    description: 'Q2 roadmap planning session',
    startTime: now,
    endTime: twoHoursLater,
    duration: 120,
    hasConflict: true,
    conflictingSchedules: JSON.stringify(['schedule-3', 'schedule-4']),
    priority: 'High',
    location: 'Conference Room A',
    attendees: JSON.stringify([
      { name: 'Alice', email: 'alice@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
    ]),
    createdAt: now,
    updatedAt: now,
  } as PrismaSchedule;
}

// ─── Tests ───────────────────────────────────────────────────────

describe('PrismaScheduleMapper', () => {
  describe('toDomain', () => {
    it('maps minimal Prisma row to domain aggregate', () => {
      const row = createMinimalRow();
      const domain = PrismaScheduleMapper.toDomain(row);

      expect(domain.id).toBe(SCHEDULE_ID_1);
      expect(domain.identityId).toBe(IDENTITY_ID_1);
      expect(domain.title).toBe('Team Meeting');
      expect(domain.description).toBeNull();
      expect(domain.duration).toBe(60);
      expect(domain.hasConflict).toBe(false);
      expect(domain.conflictingEntries).toBeNull();
      expect(domain.priority).toBeNull();
      expect(domain.location).toBeNull();
      expect(domain.attendees).toBeNull();
    });

    it('maps full Prisma row with all fields to domain', () => {
      const row = createFullRow();
      const domain = PrismaScheduleMapper.toDomain(row);

      expect(domain.id).toBe(SCHEDULE_ID_2);
      expect(domain.identityId).toBe(IDENTITY_ID_2);
      expect(domain.title).toBe('Project Planning');
      expect(domain.description).toBe('Q2 roadmap planning session');
      expect(domain.duration).toBe(120);
      expect(domain.hasConflict).toBe(true);
      expect(domain.priority).toBe('High');
      expect(domain.location).toBe('Conference Room A');
    });

    it('converts startTime from Date to timestamp', () => {
      const now = new Date();
      const row = { ...createMinimalRow(), startTime: now };
      const domain = PrismaScheduleMapper.toDomain(row);

      expect(domain.startTime).toBe(now.getTime());
    });

    it('converts endTime from Date to timestamp', () => {
      const twoHoursLater = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const row = { ...createMinimalRow(), endTime: twoHoursLater };
      const domain = PrismaScheduleMapper.toDomain(row);

      expect(domain.endTime).toBe(twoHoursLater.getTime());
    });

    it('parses conflictingSchedules JSON correctly', () => {
      const row = createFullRow();
      const domain = PrismaScheduleMapper.toDomain(row);

      expect(domain.conflictingEntries).toEqual(['schedule-3', 'schedule-4']);
    });

    it('handles null conflictingSchedules', () => {
      const row = createMinimalRow();
      const domain = PrismaScheduleMapper.toDomain(row);

      expect(domain.conflictingEntries).toBeNull();
    });

    it('parses attendees JSON correctly', () => {
      const row = createFullRow();
      const domain = PrismaScheduleMapper.toDomain(row);

      expect(domain.attendees).toHaveLength(2);
      expect(domain.attendees?.[0]).toEqual({ name: 'Alice', email: 'alice@example.com' });
      expect(domain.attendees?.[1]).toEqual({ name: 'Bob', email: 'bob@example.com' });
    });

    it('handles null attendees', () => {
      const row = createMinimalRow();
      const domain = PrismaScheduleMapper.toDomain(row);

      expect(domain.attendees).toBeNull();
    });

    it('preserves timestamps', () => {
      const now = new Date();
      const row = { ...createMinimalRow(), createdAt: now, updatedAt: now };
      const domain = PrismaScheduleMapper.toDomain(row);

      expect(domain.createdAt).toEqual(now);
      expect(domain.updatedAt).toEqual(now);
    });
  });

  describe('toPersistence', () => {
    it('converts domain aggregate to Prisma write data', () => {
      const row = createFullRow();
      const domain = PrismaScheduleMapper.toDomain(row);
      const persistence = PrismaScheduleMapper.toPersistence(domain);

      expect(persistence.identityId).toBe(IDENTITY_ID_2);
      expect(persistence.title).toBe('Project Planning');
      expect(persistence.description).toBe('Q2 roadmap planning session');
      expect(persistence.duration).toBe(120);
      expect(persistence.hasConflict).toBe(true);
      expect(persistence.priority).toBe('High');
      expect(persistence.location).toBe('Conference Room A');
    });

    it('converts startTime back to Date', () => {
      const row = createFullRow();
      const domain = PrismaScheduleMapper.toDomain(row);
      const persistence = PrismaScheduleMapper.toPersistence(domain);

      expect(persistence.startTime).toBeInstanceOf(Date);
      expect(persistence.startTime.getTime()).toBe(domain.startTime);
    });

    it('converts endTime back to Date', () => {
      const row = createFullRow();
      const domain = PrismaScheduleMapper.toDomain(row);
      const persistence = PrismaScheduleMapper.toPersistence(domain);

      expect(persistence.endTime).toBeInstanceOf(Date);
      expect(persistence.endTime.getTime()).toBe(domain.endTime);
    });

    it('serializes conflictingSchedules to JSON string', () => {
      const row = createFullRow();
      const domain = PrismaScheduleMapper.toDomain(row);
      const persistence = PrismaScheduleMapper.toPersistence(domain);

      expect(typeof persistence.conflictingSchedules).toBe('string');
      const parsed = JSON.parse(persistence.conflictingSchedules!);
      expect(parsed).toEqual(['schedule-3', 'schedule-4']);
    });

    it('handles empty conflictingSchedules', () => {
      const row = createMinimalRow();
      const domain = PrismaScheduleMapper.toDomain(row);
      const persistence = PrismaScheduleMapper.toPersistence(domain);

      expect(persistence.conflictingSchedules).toBeNull();
    });

    it('serializes attendees to JSON string', () => {
      const row = createFullRow();
      const domain = PrismaScheduleMapper.toDomain(row);
      const persistence = PrismaScheduleMapper.toPersistence(domain);

      expect(typeof persistence.attendees).toBe('string');
      const parsed = JSON.parse(persistence.attendees!);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('Alice');
    });

    it('handles null attendees', () => {
      const row = createMinimalRow();
      const domain = PrismaScheduleMapper.toDomain(row);
      const persistence = PrismaScheduleMapper.toPersistence(domain);

      expect(persistence.attendees).toBeNull();
    });

    it('preserves timestamps', () => {
      const row = createFullRow();
      const domain = PrismaScheduleMapper.toDomain(row);
      const persistence = PrismaScheduleMapper.toPersistence(domain);

      expect(persistence.createdAt).toEqual(domain.createdAt);
      expect(persistence.updatedAt).toEqual(domain.updatedAt);
    });
  });

  describe('toDomainList', () => {
    it('maps empty list', () => {
      const result = PrismaScheduleMapper.toDomainList([]);
      expect(result).toEqual([]);
    });

    it('maps multiple rows preserving order', () => {
      const rows = [createMinimalRow(), createFullRow(), createMinimalRow()];
      const domains = PrismaScheduleMapper.toDomainList(rows);

      expect(domains).toHaveLength(3);
      expect(domains[0].id).toBe(SCHEDULE_ID_1);
      expect(domains[1].id).toBe(SCHEDULE_ID_2);
      expect(domains[2].id).toBe(SCHEDULE_ID_1);
    });

    it('preserves all properties in batch conversion', () => {
      const rows = [createMinimalRow(), createFullRow()];
      const domains = PrismaScheduleMapper.toDomainList(rows);

      expect(domains[0].title).toBe('Team Meeting');
      expect(domains[1].title).toBe('Project Planning');
      expect(domains[0].hasConflict).toBe(false);
      expect(domains[1].hasConflict).toBe(true);
    });
  });
});
