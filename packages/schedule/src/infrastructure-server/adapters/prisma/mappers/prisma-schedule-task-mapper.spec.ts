/**
 * PrismaScheduleTaskMapper Unit Tests
 *
 * Maps between ScheduleTask domain aggregate and Prisma model with nested value objects.
 * Covers:
 * - toDomain: Prisma record to domain aggregate
 * - Nested value object parsing (schedule, execution, retryPolicy, metadata)
 * - Optional child entities (executions)
 */

import { describe, it, expect } from 'vitest';
import { PrismaScheduleTaskMapper } from './prisma-schedule-task-mapper';
import type { PrismaScheduleTaskWithExecutions } from './prisma-schedule-task-mapper';
import type { ScheduleExecution as PrismaScheduleExecution } from '@dailyuse/database';
import { ExecutionStatus } from '@dailyuse/contracts/schedule';
import type { SourceModule, ScheduleTaskStatus } from '@dailyuse/contracts/schedule';

// ─── Test Helpers ───────────────────────────────────────────────────

function createMinimalRow(): PrismaScheduleTaskWithExecutions {
  const now = new Date();
  return {
    id: 'task-1',
    identityId: 'identity-1',
    name: 'Daily Data Sync',
    description: null,
    sourceModule: 'reminder' as SourceModule,
    sourceEntityId: 'entity-1',
    status: 'Active' as ScheduleTaskStatus,
    enabled: true,
    cronExpression: '0 0 * * *',
    timezone: 'UTC',
    startDate: null,
    endDate: null,
    maxExecutions: null,
    nextRunAt: null,
    lastRunAt: null,
    executionCount: 0,
    lastExecutionStatus: null,
    lastExecutionDuration: null,
    consecutiveFailures: 0,
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    payload: '{}',
    tags: '[]',
    priority: 'Normal',
    timeout: 60000,
    version: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  } as PrismaScheduleTaskWithExecutions;
}

function createFullRow(): PrismaScheduleTaskWithExecutions {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  return {
    id: 'task-2',
    identityId: 'identity-2',
    name: 'Weekly Report Generation',
    description: 'Generate and email weekly reports',
    sourceModule: 'notification' as SourceModule,
    sourceEntityId: 'entity-2',
    status: 'Active' as ScheduleTaskStatus,
    enabled: true,
    cronExpression: '0 9 * * 1',
    timezone: 'America/New_York',
    startDate: now,
    endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
    maxExecutions: 52,
    nextRunAt: tomorrow,
    lastRunAt: now,
    executionCount: 10,
    lastExecutionStatus: ExecutionStatus.Success,
    lastExecutionDuration: 5000,
    consecutiveFailures: 0,
    maxRetries: 5,
    initialDelayMs: 2000,
    maxDelayMs: 60000,
    backoffMultiplier: 3,
    payload: JSON.stringify({ reportType: 'summary', includeMetrics: true }),
    tags: JSON.stringify(['reporting', 'weekly', 'automated']),
    priority: 'High',
    timeout: 120000,
    version: 2,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    executions: [],
  } as PrismaScheduleTaskWithExecutions;
}

function createExecutionRow(
  overrides: Partial<PrismaScheduleExecution> = {},
): PrismaScheduleExecution {
  const now = new Date();
  return {
    id: 'exec-1',
    taskId: 'task-2',
    identityId: 'identity-2',
    executionTime: now,
    status: ExecutionStatus.Success,
    duration: 1200,
    result: JSON.stringify({ ok: true }),
    error: null,
    retryCount: 0,
    createdAt: now,
    ...overrides,
  } as PrismaScheduleExecution;
}

// ─── Tests ───────────────────────────────────────────────────────

describe('PrismaScheduleTaskMapper', () => {
  describe('toDomain', () => {
    it('maps minimal Prisma row to domain aggregate', () => {
      const row = createMinimalRow();
      const domain = PrismaScheduleTaskMapper.toDomain(row);

      expect(domain.id).toBe('task-1');
      expect(domain.identityId).toBe('identity-1');
      expect(domain.name).toBe('Daily Data Sync');
      expect(domain.description).toBeNull();
      expect(domain.sourceModule).toBe('reminder');
      expect(domain.sourceEntityId).toBe('entity-1');
      expect(domain.status).toBe('Active');
      expect(domain.enabled).toBe(true);
    });

    it('maps full Prisma row with all fields to domain', () => {
      const row = createFullRow();
      const domain = PrismaScheduleTaskMapper.toDomain(row);

      expect(domain.id).toBe('task-2');
      expect(domain.identityId).toBe('identity-2');
      expect(domain.name).toBe('Weekly Report Generation');
      expect(domain.description).toBe('Generate and email weekly reports');
      expect(domain.sourceModule).toBe('notification');
      expect(domain.status).toBe('Active');
    });

    it('parses schedule config correctly', () => {
      const row = createFullRow();
      const domain = PrismaScheduleTaskMapper.toDomain(row);

      expect(domain.schedule).toBeDefined();
      expect(domain.schedule.cronExpression).toBe('0 9 * * 1');
      expect(domain.schedule.timezone).toBe('America/New_York');
      expect(domain.schedule.maxExecutions).toBe(52);
    });

    it('parses execution info correctly', () => {
      const row = createFullRow();
      const domain = PrismaScheduleTaskMapper.toDomain(row);

      expect(domain.execution).toBeDefined();
      expect(domain.execution.executionCount).toBe(10);
      expect(domain.execution.lastExecutionStatus).toBe(ExecutionStatus.Success);
      expect(domain.execution.lastExecutionDuration).toBe(5000);
    });

    it('parses retry policy correctly', () => {
      const row = createFullRow();
      const domain = PrismaScheduleTaskMapper.toDomain(row);

      expect(domain.retryPolicy).toBeDefined();
      expect(domain.retryPolicy.maxRetries).toBe(5);
    });

    it('parses metadata correctly', () => {
      const row = createFullRow();
      const domain = PrismaScheduleTaskMapper.toDomain(row);

      expect(domain.metadata).toBeDefined();
      expect(domain.metadata.priority).toBe('High');
      expect(domain.metadata.timeout).toBe(120000);
    });

    it('preserves timestamps', () => {
      const now = new Date();
      const row = { ...createMinimalRow(), createdAt: now, updatedAt: now };
      const domain = PrismaScheduleTaskMapper.toDomain(row);

      expect(domain.createdAt).toEqual(now);
      expect(domain.updatedAt).toEqual(now);
    });

    it('handles empty executions array', () => {
      const row = { ...createFullRow(), executions: [] };
      const domain = PrismaScheduleTaskMapper.toDomain(row);

      expect(domain).toBeDefined();
    });

    it('maps execution children and parses mixed result payload types', () => {
      const row = {
        ...createFullRow(),
        executions: [
          createExecutionRow({
            id: 'exec-string',
            result: JSON.stringify({ mode: 'string' }),
          }),
          createExecutionRow({
            id: 'exec-object',
            status: ExecutionStatus.Failed,
            result: { mode: 'object', retried: true },
          }),
          createExecutionRow({
            id: 'exec-null',
            status: ExecutionStatus.Timeout,
            result: null,
            error: 'timed out',
          }),
        ],
      };

      const domain = PrismaScheduleTaskMapper.toDomain(row);
      const executions = domain.executions;

      expect(executions).toHaveLength(3);
      expect(executions?.[0]?.result).toEqual({ mode: 'string' });
      expect(executions?.[1]?.result).toEqual({ mode: 'object', retried: true });
      expect(executions?.[2]?.result).toBeNull();
      expect(executions?.[2]?.error).toBe('timed out');
    });
  });

  describe('toPersistence', () => {
    it('converts domain aggregate to Prisma write data', () => {
      const row = createFullRow();
      const domain = PrismaScheduleTaskMapper.toDomain(row);
      const persistence = PrismaScheduleTaskMapper.toPersistence(domain);

      expect(persistence.identityId).toBe('identity-2');
      expect(persistence.name).toBe('Weekly Report Generation');
      expect(persistence.description).toBe('Generate and email weekly reports');
      expect(persistence.sourceModule).toBe('notification');
      expect(persistence.enabled).toBe(true);
    });

    it('serializes schedule fields correctly', () => {
      const row = createFullRow();
      const domain = PrismaScheduleTaskMapper.toDomain(row);
      const persistence = PrismaScheduleTaskMapper.toPersistence(domain);

      expect(persistence.cronExpression).toBe('0 9 * * 1');
      expect(persistence.timezone).toBe('America/New_York');
      expect(persistence.maxExecutions).toBe(52);
    });

    it('converts dates to Date objects', () => {
      const row = createFullRow();
      const domain = PrismaScheduleTaskMapper.toDomain(row);
      const persistence = PrismaScheduleTaskMapper.toPersistence(domain);

      if (persistence.startDate) {
        expect(persistence.startDate).toBeInstanceOf(Date);
      }
      if (persistence.nextRunAt) {
        expect(persistence.nextRunAt).toBeInstanceOf(Date);
      }
    });

    it('preserves execution info', () => {
      const row = createFullRow();
      const domain = PrismaScheduleTaskMapper.toDomain(row);
      const persistence = PrismaScheduleTaskMapper.toPersistence(domain);

      expect(persistence.executionCount).toBe(10);
      expect(persistence.consecutiveFailures).toBe(0);
    });
  });
});
