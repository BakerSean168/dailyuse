import { describe, expect, it } from 'vitest';
import { PrismaTaskInstanceMapper } from './prisma-task-instance-mapper';
import type { TaskInstance as PrismaTaskInstance } from '@dailyuse/database';

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
    it('converts domain DTO to persistence format with minimal fields', () => {
      const dto = {
        id: 'instance-3',
        templateId: 'template-3',
        identityId: 'identity-3',
        instanceDate: new Date('2024-05-01T00:00:00Z').getTime(),
        timeConfig: { timeType: 'Flexible' },
        status: 'Pending' as const,
        importance: 'Minor' as const,
        version: 1,
      } as any;

      const persistence = PrismaTaskInstanceMapper.toPersistence(dto);

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

    it('converts domain DTO with all fields to persistence', () => {
      const dto = {
        id: 'instance-4',
        templateId: 'template-4',
        identityId: 'identity-4',
        instanceDate: new Date('2024-05-15T08:00:00Z').getTime(),
        timeConfig: { timeType: 'FixedTime', timePoint: '08:00' },
        status: 'Completed' as const,
        importance: 'Important' as const,
        priority: 2,
        actualStartTime: new Date('2024-05-15T08:00:00Z').getTime(),
        actualEndTime: new Date('2024-05-15T09:30:00Z').getTime(),
        comment: 'Successfully completed',
        version: 2,
      } as any;

      const persistence = PrismaTaskInstanceMapper.toPersistence(dto);

      expect(persistence.templateId).toBe('template-4');
      expect(persistence.importance).toBe('Important');
      expect(persistence.priority).toBe(2);
      expect(persistence.status).toBe('Completed');
      expect(persistence.comment).toBe('Successfully completed');
      expect(persistence.version).toBe(2);
    });

    it('stringifies timeConfig if it is an object', () => {
      const dto = {
        templateId: 'template-5',
        identityId: 'identity-5',
        instanceDate: Date.now(),
        timeConfig: { timeType: 'Flexible', startDate: 1710000000000 },
        status: 'Pending' as const,
        version: 1,
      } as any;

      const persistence = PrismaTaskInstanceMapper.toPersistence(dto);

      expect(typeof persistence.timeConfig).toBe('string');
      expect(JSON.parse(persistence.timeConfig)).toEqual(dto.timeConfig);
    });

    it('keeps timeConfig as-is if already a string', () => {
      const timeConfigStr = JSON.stringify({ timeType: 'Flexible' });
      const dto = {
        templateId: 'template-6',
        identityId: 'identity-6',
        instanceDate: Date.now(),
        timeConfig: timeConfigStr,
        status: 'Pending' as const,
        version: 1,
      } as any;

      const persistence = PrismaTaskInstanceMapper.toPersistence(dto);

      expect(persistence.timeConfig).toBe(timeConfigStr);
    });

    it('defaults timeConfig to empty JSON object', () => {
      const dto = {
        templateId: 'template-7',
        identityId: 'identity-7',
        instanceDate: Date.now(),
        timeConfig: undefined,
        status: 'Pending' as const,
        version: 1,
      } as any;

      const persistence = PrismaTaskInstanceMapper.toPersistence(dto);

      expect(persistence.timeConfig).toBe('{}');
    });

    it('converts timestamp numbers to Date objects for time fields', () => {
      const startTime = new Date('2024-05-20T10:00:00Z').getTime();
      const endTime = new Date('2024-05-20T11:00:00Z').getTime();

      const dto = {
        templateId: 'template-8',
        identityId: 'identity-8',
        instanceDate: Date.now(),
        status: 'Completed' as const,
        actualStartTime: startTime,
        actualEndTime: endTime,
        version: 1,
      } as any;

      const persistence = PrismaTaskInstanceMapper.toPersistence(dto);

      expect(persistence.actualStartTime).toEqual(new Date(startTime));
      expect(persistence.actualEndTime).toEqual(new Date(endTime));
    });

    it('defaults importance to "Moderate" when missing', () => {
      const dto = {
        templateId: 'template-9',
        identityId: 'identity-9',
        instanceDate: Date.now(),
        status: 'Pending' as const,
        version: 1,
      } as any;

      const persistence = PrismaTaskInstanceMapper.toPersistence(dto);

      expect(persistence.importance).toBe('Moderate');
    });
  });

  describe('Round-trip: toDomain -> toPersistence', () => {
    it('preserves task instance data after toDomain then toPersistence', () => {
      const originalRow = createFullRow();
      const domain = PrismaTaskInstanceMapper.toDomain(originalRow);
      
      // Create a simplified DTO from domain for persistence
      const persistence = PrismaTaskInstanceMapper.toPersistence({
        id: domain.id,
        templateId: domain.templateId,
        identityId: domain.identityId,
        instanceDate: domain.instanceDate,
        timeConfig: domain.timeConfig,
        status: domain.status,
        importance: domain.importance,
        priority: domain.priority,
        actualStartTime: domain.actualStartTime,
        actualEndTime: domain.actualEndTime,
        comment: domain.note,
        version: domain.version,
      } as any);

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
