/**
 * PrismaReminderResponseMapper Unit Tests
 *
 * Covers:
 * - toDomain: Prisma row to domain entity
 * - toDomainList: Batch conversion
 * - Timestamp conversion (seconds in DB to milliseconds in JS)
 * - Edge cases (null responseTime)
 */

import { describe, it, expect } from 'vitest';
import { PrismaReminderResponseMapper } from './prisma-reminder-response-mapper';
import type { ReminderResponse as PrismaReminderResponse } from '@dailyuse/database';
import type { ReminderResponseAction } from '@dailyuse/contracts/reminder';

// ─── Test Helpers ───────────────────────────────────────────────────

function createMinimalRow(): PrismaReminderResponse {
  const now = new Date();
  return {
    id: 'response-1',
    templateId: 'template-1',
    identityId: 'identity-1',
    action: 'Dismiss' as unknown as ReminderResponseAction,
    responseTime: null,
    timestamp: now,
  } as PrismaReminderResponse;
}

function createFullRow(): PrismaReminderResponse {
  const now = new Date();
  const responseSeconds = Math.floor(now.getTime() / 1000);
  
  return {
    id: 'response-2',
    templateId: 'template-2',
    identityId: 'identity-2',
    action: 'Snooze' as unknown as ReminderResponseAction,
    responseTime: responseSeconds,
    timestamp: now,
  } as PrismaReminderResponse;
}

// ─── Tests ───────────────────────────────────────────────────────

describe('PrismaReminderResponseMapper', () => {
  describe('toDomain', () => {
    it('maps minimal Prisma row to domain entity', () => {
      const row = createMinimalRow();
      const domain = PrismaReminderResponseMapper.toDomain(row);

      expect(domain.id).toBe('response-1');
      expect(domain.reminderTemplateId).toBe('template-1');
      expect(domain.identityId).toBe('identity-1');
      expect(domain.action).toBe('Dismiss');
      expect(domain.responseTime).toBeNull();
    });

    it('maps full Prisma row with all fields to domain', () => {
      const row = createFullRow();
      const domain = PrismaReminderResponseMapper.toDomain(row);

      expect(domain.id).toBe('response-2');
      expect(domain.reminderTemplateId).toBe('template-2');
      expect(domain.identityId).toBe('identity-2');
      expect(domain.action).toBe('Snooze');
      expect(domain.responseTime).toBeInstanceOf(Date);
    });

    it('converts responseTime from seconds to milliseconds', () => {
      const now = new Date();
      const responseSeconds = Math.floor(now.getTime() / 1000);
      const row = {
        ...createMinimalRow(),
        responseTime: responseSeconds,
      };
      
      const domain = PrismaReminderResponseMapper.toDomain(row);
      
      // Allow 1 second of variance due to rounding
      expect(Math.abs(domain.responseTime!.getTime() - now.getTime())).toBeLessThan(1000);
    });

    it('handles null responseTime', () => {
      const row = createMinimalRow();
      const domain = PrismaReminderResponseMapper.toDomain(row);

      expect(domain.responseTime).toBeNull();
    });

    it('preserves timestamp', () => {
      const now = new Date();
      const row = { ...createMinimalRow(), timestamp: now };
      const domain = PrismaReminderResponseMapper.toDomain(row);

      expect(domain.timestamp).toEqual(now);
    });

    it('maps all response action types', () => {
      const actions = ['Dismiss', 'Snooze', 'Complete', 'Custom'];

      for (const action of actions) {
        const row = { ...createMinimalRow(), action: action as unknown as ReminderResponseAction };
        const domain = PrismaReminderResponseMapper.toDomain(row);
        expect(domain.action).toBe(action);
      }
    });
  });

  describe('toDomainList', () => {
    it('maps empty list', () => {
      const result = PrismaReminderResponseMapper.toDomainList([]);
      expect(result).toEqual([]);
    });

    it('maps multiple rows preserving order', () => {
      const rows = [createMinimalRow(), createFullRow(), createMinimalRow()];
      const domains = PrismaReminderResponseMapper.toDomainList(rows);

      expect(domains).toHaveLength(3);
      expect(domains[0].id).toBe('response-1');
      expect(domains[1].id).toBe('response-2');
      expect(domains[2].id).toBe('response-1');
    });

    it('preserves all properties in batch conversion', () => {
      const rows = [
        { ...createMinimalRow(), action: 'Dismiss' as unknown as ReminderResponseAction },
        { ...createFullRow(), action: 'Snooze' as unknown as ReminderResponseAction },
      ];
      const domains = PrismaReminderResponseMapper.toDomainList(rows);

      expect(domains[0].action).toBe('Dismiss');
      expect(domains[1].action).toBe('Snooze');
      expect(domains[0].responseTime).toBeNull();
      expect(domains[1].responseTime).toBeInstanceOf(Date);
    });
  });
});
