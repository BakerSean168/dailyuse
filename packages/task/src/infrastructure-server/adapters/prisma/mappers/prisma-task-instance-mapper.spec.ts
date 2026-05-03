import { describe, expect, it } from 'vitest';
import { PrismaTaskInstanceMapper } from './prisma-task-instance-mapper';
import type { TaskInstance as PrismaTaskInstance } from '@dailyuse/database';
import { TaskInstance } from '@/domain-server/aggregates/task-instance';

describe('PrismaTaskInstanceMapper', () => {
  const createMinimalRow = (): PrismaTaskInstance => ({
    id: 'instance-1',
    templateId: 'template-1',
    identityId: 'identity-1',
    instanceDate: new Date('2024-03-15T00:00:00Z'),
    timeConfig: '{}',
    importance: 'Moderate',
    priority: null,
    status: 'Pending',
    actualStartTime: null,
    actualEndTime: null,
    comment: null,
    version: 1,
    createdAt: new Date('2024-03-01T00:00:00Z'),
    updatedAt: new Date('2024-03-01T00:00:00Z'),
    deletedAt: null,
  });

  const createFullRow = (): PrismaTaskInstance => ({
    id: 'instance-2',
    templateId: 'template-2',
    identityId: 'identity-2',
    instanceDate: new Date('2024-04-10T08:30:00Z'),
    timeConfig: JSON.stringify({
      timeType: 'FixedTime',
      timePoint: '09:00',
      startDate: 1710000000000,
    }),
    importance: 'Important',
    priority: 1,
    status: 'Completed',
    actualStartTime: new Date('2024-04-10T09:00:00Z'),
    actualEndTime: new Date('2024-04-10T10:30:00Z'),
    comment: 'Task completed on time',
    version: 3,
    createdAt: new Date('2024-02-01T12:00:00Z'),
    updatedAt: new Date('2024-04-10T10:30:00Z'),
    deletedAt: null,
  });

  /** Creates a TaskInstance aggregate from a Prisma row for use with toPersistence */
  const createTestAggregate = (rowOverrides?: Partial<PrismaTaskInstance>): TaskInstance => {
    const row = { ...createMinimalRow(), ...rowOverrides };
    return PrismaTaskInstanceMapper.toDomain(row);
  };

  describe('toDomain', () => {
    it('maps minimal Prisma row to domain aggregate', () => {
      const row = createMinimalRow();
      const domain = PrismaTaskInstanceMapper.toDomain(row);

      expect(domain.id).toBe('instance-1');
      expect(domain.templateId).toBe('template-1');
      expect(domain.identityId).toBe('identity-1');
      expect(domain.instanceDate).toBe(row.instanceDate.getTime());
      expect(domain.importance).toBe('Moderate');
      expect(domain.priority).toBeUndefined();
      expect(domain.status).toBe('Pending');
      expect(domain.actualStartTime).toBeNull();
      expect(domain.actualEndTime).toBeNull();
      expect(domain.note).toBeNull();
      expect(domain.version).toBe(1);
      expect(domain.createdAt).toBe(row.createdAt.getTime());
      expect(domain.updatedAt).toBe(row.updatedAt.getTime());
    });

    it('maps full Prisma row with all fields to domain', () => {
      const row = createFullRow();
      const domain = PrismaTaskInstanceMapper.toDomain(row);

      expect(domain.id).toBe('instance-2');
      expect(domain.templateId).toBe('template-2');
      expect(domain.identityId).toBe('identity-2');
      expect(domain.instanceDate).toBe(row.instanceDate.getTime());
      expect(domain.importance).toBe('Important');
      expect(domain.priority).toBe(1);
      expect(domain.status).toBe('Completed');
      expect(domain.actualStartTime).toBe(row.actualStartTime!.getTime());
      expect(domain.actualEndTime).toBe(row.actualEndTime!.getTime());
      expect(domain.note).toBe('Task completed on time');
      expect(domain.version).toBe(3);
    });

    it('parses JSON timeConfig correctly', () => {
      const row = createFullRow();
      const domain = PrismaTaskInstanceMapper.toDomain(row);

      const timeConfig = domain.timeConfig;
      expect(timeConfig.timeType).toBe('FixedTime');
      expect(timeConfig.timePoint).toBe('09:00');
    });

    it('handles empty timeConfig JSON', () => {
      const row = createMinimalRow();
      const domain = PrismaTaskInstanceMapper.toDomain(row);

      expect(domain.timeConfig).toBeDefined();
    });

    it('defaults importance to "Moderate" when missing', () => {
      const row: PrismaTaskInstance = {
        ...createMinimalRow(),
        importance: null as any,
      };
      const domain = PrismaTaskInstanceMapper.toDomain(row);
      expect(domain.importance).toBe('Moderate');
    });

    it('converts timestamps to milliseconds', () => {
      const row = createFullRow();
      const domain = PrismaTaskInstanceMapper.toDomain(row);

      expect(domain.createdAt).toBe(row.createdAt.getTime());
      expect(domain.updatedAt).toBe(row.updatedAt.getTime());
      expect(domain.instanceDate).toBe(row.instanceDate.getTime());
      expect(domain.actualStartTime).toBe(row.actualStartTime!.getTime());
      expect(domain.actualEndTime).toBe(row.actualEndTime!.getTime());
    });

    it('maps comment to note field', () => {
      const row = createFullRow();
      const domain = PrismaTaskInstanceMapper.toDomain(row);
      expect(domain.note).toBe(row.comment);
    });

    it('handles all task statuses', () => {
      const statuses = ['Pending', 'InProgress', 'Completed', 'Skipped'] as const;

      for (const status of statuses) {
        const row: PrismaTaskInstance = {
          ...createMinimalRow(),
          status: status as any,
        };
        const domain = PrismaTaskInstanceMapper.toDomain(row);
        expect(domain.status).toBe(status);
      }
    });
  });

  describe('toPersistence', () => {
    it('converts minimal aggregate to persistence format', () => {
      const aggregate = createTestAggregate({
        id: 'instance-3',
        templateId: 'template-3',
        identityId: 'identity-3',
        instanceDate: new Date('2024-05-01T00:00:00Z').getTime(),
        importance: 'Minor',
        status: 'Pending',
        version: 1,
      });

      const persistence = PrismaTaskInstanceMapper.toPersistence(aggregate);

      expect(persistence.templateId).toBe('template-3');
      expect(persistence.identityId).toBe('identity-3');
      expect(persistence.importance).toBe('Minor');
      expect(persistence.status).toBe('Pending');
      expect(persistence.priority).toBeNull();
      expect(persistence.actualStartTime).toBeNull();
      expect(persistence.actualEndTime).toBeNull();
      expect(persistence.comment).toBeNull();
      expect(persistence.version).toBe(1);
    });

    it('converts full aggregate with all fields to persistence', () => {
      const aggregate = createTestAggregate(createFullRow());

      const persistence = PrismaTaskInstanceMapper.toPersistence(aggregate);

      expect(persistence.templateId).toBe('template-2');
      expect(persistence.importance).toBe('Important');
      expect(persistence.priority).toBe(1);
      expect(persistence.status).toBe('Completed');
      expect(persistence.comment).toBe('Task completed on time');
      expect(persistence.version).toBe(3);
    });

    it('stringifies timeConfig as JSON', () => {
      const aggregate = createTestAggregate(createFullRow());

      const persistence = PrismaTaskInstanceMapper.toPersistence(aggregate);

      expect(typeof persistence.timeConfig).toBe('string');
      const parsed = JSON.parse(persistence.timeConfig);
      expect(parsed.timeType).toBe('FixedTime');
    });

    it('defaults timeConfig to empty JSON object for minimal aggregate', () => {
      const aggregate = createTestAggregate();

      const persistence = PrismaTaskInstanceMapper.toPersistence(aggregate);

      expect(typeof persistence.timeConfig).toBe('string');
      expect(JSON.parse(persistence.timeConfig)).toEqual({ timeType: 'Flexible', startDate: null, timePoint: null, timeRange: null });
    });

    it('converts timestamp numbers to Date objects for time fields', () => {
      const aggregate = createTestAggregate(createFullRow());

      const persistence = PrismaTaskInstanceMapper.toPersistence(aggregate);

      expect(persistence.actualStartTime).toEqual(new Date('2024-04-10T09:00:00Z'));
      expect(persistence.actualEndTime).toEqual(new Date('2024-04-10T10:30:00Z'));
    });

    it('defaults importance to "Moderate" when missing', () => {
      const aggregate = createTestAggregate({
        importance: null as any,
      });

      const persistence = PrismaTaskInstanceMapper.toPersistence(aggregate);

      expect(persistence.importance).toBe('Moderate');
    });
  });

  describe('Round-trip: toDomain -> toPersistence', () => {
    it('preserves task instance data after toDomain then toPersistence', () => {
      const originalRow = createFullRow();
      const aggregate = PrismaTaskInstanceMapper.toDomain(originalRow);
      const persistence = PrismaTaskInstanceMapper.toPersistence(aggregate);

      expect(persistence.templateId).toBe(originalRow.templateId);
      expect(persistence.identityId).toBe(originalRow.identityId);
      expect(persistence.status).toBe(originalRow.status);
      expect(persistence.importance).toBe(originalRow.importance);
      expect(persistence.version).toBe(originalRow.version);
    });
  });

  describe('toDomainList', () => {
    it('maps empty list', () => {
      const result = PrismaTaskInstanceMapper.toDomainList([]);
      expect(result).toEqual([]);
    });

    it('maps multiple rows preserving order', () => {
      const rows = [createMinimalRow(), createFullRow(), createMinimalRow()];
      const domains = PrismaTaskInstanceMapper.toDomainList(rows);

      expect(domains).toHaveLength(3);
      expect(domains[0].id).toBe('instance-1');
      expect(domains[1].id).toBe('instance-2');
      expect(domains[2].id).toBe('instance-1');
    });
  });
});
