import { describe, expect, it } from 'vitest';
import { PrismaTaskTemplateMapper } from './prisma-task-template-mapper';
import type { TaskTemplate as PrismaTaskTemplate } from '@dailyuse/database';

describe('PrismaTaskTemplateMapper', () => {
  const createMinimalRow = (): PrismaTaskTemplate => ({
    id: 'template-1',
    identityId: 'identity-1',
    name: 'Simple Task',
    description: null,
    importance: 'Moderate',
    color: null,
    tags: '[]',
    folderId: null,
    parentTaskId: null,
    status: 'Active',
    version: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    deletedAt: null,
    // Time config fields
    timeConfigType: null,
    timeConfigStartTime: null,
    timeConfigEndTime: null,
    timeConfigDurationMinutes: null,
    timeConfigTimePoint: null,
    timeConfigTimeRangeStart: null,
    timeConfigTimeRangeEnd: null,
    // Recurrence fields
    recurrenceRuleType: null,
    recurrenceRuleInterval: null,
    recurrenceRuleDaysOfWeek: null,
    recurrenceRuleDayOfMonth: null,
    recurrenceRuleMonthOfYear: null,
    recurrenceRuleEndDate: null,
    recurrenceRuleCount: null,
    // Reminder fields
    reminderConfigEnabled: null,
    reminderConfigTimeOffsetMinutes: null,
    reminderConfigUnit: null,
    reminderConfigChannel: null,
    // Other fields
    goalBinding: null,
    checklist: null,
    lastGeneratedDate: null,
    generateAheadDays: null,
    dependencyStatus: 'NONE',
    isBlocked: false,
    blockingReason: null,
  });

  const createFullRow = (): PrismaTaskTemplate => ({
    id: 'template-2',
    identityId: 'identity-2',
    name: 'Complex Recurring Task',
    description: 'A task with full configuration',
    importance: 'High',
    color: '#FF5733',
    tags: JSON.stringify(['urgent', 'work']),
    folderId: 'folder-1',
    parentTaskId: 'template-1',
    status: 'Active',
    version: 2,
    createdAt: new Date('2024-02-01T10:30:45Z'),
    updatedAt: new Date('2024-02-15T14:45:30Z'),
    deletedAt: null,
    // Time config fields
    timeConfigType: 'FixedTime',
    timeConfigStartTime: new Date('2024-03-01T00:00:00Z'),
    timeConfigEndTime: null,
    timeConfigDurationMinutes: 60,
    timeConfigTimePoint: '09:00',
    timeConfigTimeRangeStart: 9,
    timeConfigTimeRangeEnd: 17,
    // Recurrence fields
    recurrenceRuleType: 'DAILY',
    recurrenceRuleInterval: 1,
    recurrenceRuleDaysOfWeek: JSON.stringify(['MON', 'WED', 'FRI']),
    recurrenceRuleDayOfMonth: null,
    recurrenceRuleMonthOfYear: null,
    recurrenceRuleEndDate: new Date('2024-12-31T00:00:00Z'),
    recurrenceRuleCount: null,
    // Reminder fields
    reminderConfigEnabled: true,
    reminderConfigTimeOffsetMinutes: 15,
    reminderConfigUnit: 'minutes',
    reminderConfigChannel: 'PUSH',
    // Other fields
    goalBinding: JSON.stringify({ type: 'KeyResult', id: 'kr-1' }),
    checklist: JSON.stringify([
      { title: 'Step 1', order: 1 },
      { title: 'Step 2', order: 2 },
    ]),
    lastGeneratedDate: new Date('2024-02-29T00:00:00Z'),
    generateAheadDays: 7,
    dependencyStatus: 'BLOCKED',
    isBlocked: true,
    blockingReason: 'Waiting for approval',
  });

  describe('toDomain', () => {
    it('maps minimal Prisma row to domain aggregate', () => {
      const row = createMinimalRow();
      const domain = PrismaTaskTemplateMapper.toDomain(row);

      expect(domain.id).toBe('template-1');
      expect(domain.title).toBe('Simple Task');
      expect(domain.description).toBeNull();
      expect(domain.importance).toBe('Moderate');
      expect(domain.color).toBeNull();
      expect(domain.tags).toEqual([]);
      expect(domain.folderId).toBeNull();
      expect(domain.parentTaskId).toBeNull();
      expect(domain.status).toBe('Active');
      expect(domain.version).toBe(1);
      expect(domain.timeConfig).toBeNull();
      expect(domain.recurrenceRule).toBeNull();
      expect(domain.reminderConfig).toBeNull();
      expect(domain.goalBinding).toBeNull();
      expect(domain.checklist).toEqual([]);
      expect(domain.isBlocked).toBe(false);
    });

    it('maps full Prisma row with all fields to domain', () => {
      const row = createFullRow();
      const domain = PrismaTaskTemplateMapper.toDomain(row);

      expect(domain.id).toBe('template-2');
      expect(domain.title).toBe('Complex Recurring Task');
      expect(domain.description).toBe('A task with full configuration');
      expect(domain.importance).toBe('High');
      expect(domain.color).toBe('#FF5733');
      expect(domain.tags).toEqual(['urgent', 'work']);
      expect(domain.folderId).toBe('folder-1');
      expect(domain.parentTaskId).toBe('template-1');
      expect(domain.status).toBe('Active');
      expect(domain.version).toBe(2);
    });

    it('parses JSON tags correctly', () => {
      const row = createFullRow();
      const domain = PrismaTaskTemplateMapper.toDomain(row);

      expect(domain.tags).toEqual(['urgent', 'work']);
    });

    it('parses timeConfig when present', () => {
      const row = createFullRow();
      const domain = PrismaTaskTemplateMapper.toDomain(row);

      expect(domain.timeConfig).toBeDefined();
      expect(domain.timeConfig?.timeType).toBe('FixedTime');
      expect(domain.timeConfig?.timePoint).toBe('09:00');
    });

    it('returns null timeConfig when not configured', () => {
      const row = createMinimalRow();
      const domain = PrismaTaskTemplateMapper.toDomain(row);

      expect(domain.timeConfig).toBeNull();
    });

    it('parses recurrenceRule when present', () => {
      const row = createFullRow();
      const domain = PrismaTaskTemplateMapper.toDomain(row);

      expect(domain.recurrenceRule).toBeDefined();
      expect(domain.recurrenceRule?.frequency).toBe('DAILY');
      expect(domain.recurrenceRule?.interval).toBe(1);
      expect(domain.recurrenceRule?.daysOfWeek).toEqual(['MON', 'WED', 'FRI']);
    });

    it('returns null recurrenceRule when not configured', () => {
      const row = createMinimalRow();
      const domain = PrismaTaskTemplateMapper.toDomain(row);

      expect(domain.recurrenceRule).toBeNull();
    });

    it('parses reminderConfig when enabled', () => {
      const row = createFullRow();
      const domain = PrismaTaskTemplateMapper.toDomain(row);

      expect(domain.reminderConfig).toBeDefined();
      expect(domain.reminderConfig?.enabled).toBe(true);
      expect(domain.reminderConfig?.triggers).toBeDefined();
      expect(domain.reminderConfig?.triggers[0].relativeValue).toBe(15);
      expect(domain.reminderConfig?.triggers[0].relativeUnit).toBe('minutes');
    });

    it('returns null reminderConfig when disabled', () => {
      const row = createMinimalRow();
      const domain = PrismaTaskTemplateMapper.toDomain(row);

      expect(domain.reminderConfig).toBeNull();
    });

    it('parses goalBinding JSON correctly', () => {
      const row = createFullRow();
      const domain = PrismaTaskTemplateMapper.toDomain(row);

      expect(domain.goalBinding).toBeDefined();
    });

    it('parses checklist from JSON', () => {
      const row = createFullRow();
      const domain = PrismaTaskTemplateMapper.toDomain(row);

      expect(domain.checklist).toHaveLength(2);
      expect(domain.checklist[0].title).toBe('Step 1');
      expect(domain.checklist[1].title).toBe('Step 2');
    });

    it('returns empty checklist when not configured', () => {
      const row = createMinimalRow();
      const domain = PrismaTaskTemplateMapper.toDomain(row);

      expect(domain.checklist).toEqual([]);
    });

    it('maps blocking status correctly', () => {
      const row = createFullRow();
      const domain = PrismaTaskTemplateMapper.toDomain(row);

      expect(domain.isBlocked).toBe(true);
      expect(domain.blockingReason).toBe('Waiting for approval');
      expect(domain.dependencyStatus).toBe('BLOCKED');
    });
  });

  describe('toPersistence', () => {
    it('converts minimal domain DTO to persistence format', () => {
      const dto = {
        id: 'template-3',
        identityId: 'identity-3',
        name: 'New Task',
        description: null,
        importance: 'Low',
        color: null,
        tags: [],
        folderId: null,
        parentTaskId: null,
        status: 'Active',
        version: 1,
        timeConfig: null,
        recurrenceRule: null,
        reminderConfig: null,
        goalBinding: null,
        checklist: [],
        lastGeneratedDate: null,
        generateAheadDays: null,
        isBlocked: false,
        blockingReason: null,
        dependencyStatus: 'NONE',
      } as any;

      const persistence = PrismaTaskTemplateMapper.toPersistence(dto);

      expect(persistence.name).toBe('New Task');
      expect(persistence.description).toBeNull();
      expect(persistence.importance).toBe('Low');
      expect(persistence.tags).toBe('[]');
      expect(persistence.timeConfigType).toBeNull();
      expect(persistence.recurrenceRuleType).toBeNull();
      expect(persistence.reminderConfigEnabled).toBeNull();
      expect(persistence.goalBinding).toBeNull();
      expect(persistence.checklist).toBeNull();
    });

    it('converts full domain DTO with all fields to persistence', () => {
      const dto = {
        id: 'template-4',
        identityId: 'identity-4',
        name: 'Full Task',
        description: 'Complete description',
        importance: 'High',
        color: '#FF5733',
        tags: ['important', 'urgent'],
        folderId: 'folder-2',
        parentTaskId: 'template-2',
        status: 'Active',
        version: 3,
        timeConfig: {
          timeType: 'FixedTime',
          startDate: new Date('2024-03-15T00:00:00Z').getTime(),
          timePoint: '10:00',
          timeRange: { start: 10, end: 18 },
        },
        recurrenceRule: {
          frequency: 'WEEKLY',
          interval: 2,
          daysOfWeek: ['MON', 'THU'],
          endDate: new Date('2024-12-31T00:00:00Z').getTime(),
          occurrences: null,
        },
        reminderConfig: {
          enabled: true,
          triggers: [{ type: 'Relative' as const, relativeValue: 30, relativeUnit: 'minutes' }],
        },
        goalBinding: { type: 'KeyResult', id: 'kr-2' },
        checklist: [{ title: 'Item 1', order: 1 }, { title: 'Item 2', order: 2 }],
        lastGeneratedDate: new Date('2024-02-28T00:00:00Z').getTime(),
        generateAheadDays: 7,
        isBlocked: true,
        blockingReason: 'Pending decision',
        dependencyStatus: 'BLOCKED',
      } as any;

      const persistence = PrismaTaskTemplateMapper.toPersistence(dto);

      expect(persistence.name).toBe('Full Task');
      expect(persistence.importance).toBe('High');
      expect(persistence.color).toBe('#FF5733');
      expect(persistence.folderId).toBe('folder-2');
      expect(persistence.parentTaskId).toBe('template-2');
      expect(persistence.timeConfigType).toBe('FixedTime');
      expect(persistence.timeConfigTimePoint).toBe('10:00');
      expect(persistence.recurrenceRuleType).toBe('WEEKLY');
      expect(persistence.recurrenceRuleInterval).toBe(2);
      expect(persistence.reminderConfigEnabled).toBe(true);
      expect(persistence.reminderConfigTimeOffsetMinutes).toBe(30);
      expect(persistence.generateAheadDays).toBe(7);
      expect(persistence.isBlocked).toBe(true);
      expect(persistence.blockingReason).toBe('Pending decision');
    });

    it('stringifies complex objects (tags, goalBinding, checklist)', () => {
      const dto = {
        identityId: 'identity-5',
        name: 'Task',
        tags: ['tag1', 'tag2'],
        goalBinding: { type: 'Goal', id: 'goal-1' },
        checklist: [{ title: 'Check', order: 1 }],
        status: 'Active',
        version: 1,
      } as any;

      const persistence = PrismaTaskTemplateMapper.toPersistence(dto);

      expect(typeof persistence.tags).toBe('string');
      expect(JSON.parse(persistence.tags!)).toEqual(['tag1', 'tag2']);
      expect(typeof persistence.goalBinding).toBe('string');
      expect(typeof persistence.checklist).toBe('string');
    });

    it('stringifies JSON for recurrence days of week', () => {
      const dto = {
        identityId: 'identity-6',
        name: 'Weekly Task',
        recurrenceRule: {
          frequency: 'WEEKLY',
          interval: 1,
          daysOfWeek: ['MON', 'WED', 'FRI'],
          endDate: null,
          occurrences: null,
        },
        status: 'Active',
        version: 1,
      } as any;

      const persistence = PrismaTaskTemplateMapper.toPersistence(dto);

      expect(typeof persistence.recurrenceRuleDaysOfWeek).toBe('string');
      expect(JSON.parse(persistence.recurrenceRuleDaysOfWeek!)).toEqual(['MON', 'WED', 'FRI']);
    });

    it('handles empty checklist correctly', () => {
      const dto = {
        identityId: 'identity-7',
        name: 'Task without checklist',
        checklist: [],
        status: 'Active',
        version: 1,
      } as any;

      const persistence = PrismaTaskTemplateMapper.toPersistence(dto);

      expect(persistence.checklist).toBeNull();
    });

    it('handles null fields correctly', () => {
      const dto = {
        identityId: 'identity-8',
        name: 'Minimal Task',
        description: null,
        color: null,
        folderId: null,
        parentTaskId: null,
        timeConfig: null,
        recurrenceRule: null,
        reminderConfig: null,
        goalBinding: null,
        checklist: null,
        lastGeneratedDate: null,
        generateAheadDays: null,
        blockingReason: null,
        status: 'Active',
        version: 1,
      } as any;

      const persistence = PrismaTaskTemplateMapper.toPersistence(dto);

      expect(persistence.description).toBeNull();
      expect(persistence.color).toBeNull();
      expect(persistence.folderId).toBeNull();
      expect(persistence.timeConfigType).toBeNull();
      expect(persistence.goalBinding).toBeNull();
    });
  });

  describe('Round-trip: toDomain -> toPersistence', () => {
    it('preserves task template data integrity', () => {
      const originalRow = createFullRow();
      const domain = PrismaTaskTemplateMapper.toDomain(originalRow);

      // Create a DTO from domain for persistence
      const persistence = PrismaTaskTemplateMapper.toPersistence({
        id: domain.id.value,
        identityId: domain.identityId.value,
        name: domain.title,
        description: domain.description,
        importance: domain.importance,
        color: domain.color,
        tags: domain.tags,
        folderId: domain.folderId?.value ?? null,
        parentTaskId: domain.parentTaskId?.value ?? null,
        status: domain.status,
        version: domain.version,
        timeConfig: domain.timeConfig,
        recurrenceRule: domain.recurrenceRule,
        reminderConfig: domain.reminderConfig,
        goalBinding: domain.goalBinding,
        checklist: domain.checklist,
        lastGeneratedDate: domain.lastGeneratedDate,
        generateAheadDays: domain.generateAheadDays,
        isBlocked: domain.isBlocked,
        blockingReason: domain.blockingReason,
        dependencyStatus: domain.dependencyStatus,
      } as any);

      expect(persistence.name).toBe(originalRow.name);
      expect(persistence.description).toBe(originalRow.description);
      expect(persistence.importance).toBe(originalRow.importance);
      expect(persistence.status).toBe(originalRow.status);
      expect(persistence.version).toBe(originalRow.version);
    });
  });

  describe('toDomainList', () => {
    it('maps empty list', () => {
      const result = PrismaTaskTemplateMapper.toDomainList([]);
      expect(result).toEqual([]);
    });

    it('maps multiple rows preserving order', () => {
      const rows = [createMinimalRow(), createFullRow(), createMinimalRow()];
      const domains = PrismaTaskTemplateMapper.toDomainList(rows);

      expect(domains).toHaveLength(3);
      expect(domains[0].id).toBe('template-1');
      expect(domains[1].id).toBe('template-2');
      expect(domains[2].id).toBe('template-1');
    });
  });
});
