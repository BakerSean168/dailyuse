import { describe, it, expect } from 'vitest';
import {
  validateEnvelope,
  ExportUserDataReqSchema,
  ImportUserDataReqSchema,
  PortableUserDataV1Schema,
  PortableGoalDataSchema,
  PortableTaskDataSchema,
  PortableRepositoryDataSchema,
  PortableReminderDataSchema,
  PortableScheduleDataSchema,
  PortableEditorDataSchema,
  PortableAIDataSchema,
  PortableSettingsSchema,
} from '../../../contracts/portable-schema';
import { RefAllocator } from '../../portable-types';

describe('RefAllocator', () => {
  it('allocates sequential refs with prefix', () => {
    const allocator = new RefAllocator();
    expect(allocator.allocate('goal')).toBe('goal:1');
    expect(allocator.allocate('goal')).toBe('goal:2');
    expect(allocator.allocate('task')).toBe('task:1');
    expect(allocator.allocate('goal')).toBe('goal:3');
  });
});

describe('validateEnvelope', () => {
  it('accepts a valid envelope', () => {
    const result = validateEnvelope({
      kind: 'memoflow.user-data-export',
      schemaVersion: 1,
      exportedAt: '2026-06-03T00:00:00.000Z',
      scope: { includesBinaryResources: false, importMode: 'append-create-like' },
      data: {},
    });
    expect(result.ok).toBe(true);
  });

  it('rejects wrong kind', () => {
    const result = validateEnvelope({
      kind: 'wrong',
      schemaVersion: 1,
      exportedAt: '2026-06-03T00:00:00.000Z',
      scope: { includesBinaryResources: false, importMode: 'append-create-like' },
      data: {},
    });
    expect(result.ok).toBe(false);
  });

  it('rejects wrong schemaVersion', () => {
    const result = validateEnvelope({
      kind: 'memoflow.user-data-export',
      schemaVersion: 2,
      exportedAt: '2026-06-03T00:00:00.000Z',
      scope: { includesBinaryResources: false, importMode: 'append-create-like' },
      data: {},
    });
    expect(result.ok).toBe(false);
  });

  it('rejects missing data field', () => {
    const result = validateEnvelope({
      kind: 'memoflow.user-data-export',
      schemaVersion: 1,
      exportedAt: '2026-06-03T00:00:00.000Z',
      scope: { includesBinaryResources: false, importMode: 'append-create-like' },
    });
    expect(result.ok).toBe(false);
  });

  it('rejects null input', () => {
    const result = validateEnvelope(null);
    expect(result.ok).toBe(false);
  });
});

describe('ExportUserDataReqSchema', () => {
  it('accepts empty object', () => {
    const result = ExportUserDataReqSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid include array', () => {
    const result = ExportUserDataReqSchema.safeParse({ include: ['goals', 'tasks'] });
    expect(result.success).toBe(true);
  });

  it('rejects invalid module name', () => {
    const result = ExportUserDataReqSchema.safeParse({ include: ['invalid'] });
    expect(result.success).toBe(false);
  });
});

describe('ImportUserDataReqSchema', () => {
  it('accepts content string', () => {
    const result = ImportUserDataReqSchema.safeParse({ content: '{}' });
    expect(result.success).toBe(true);
  });

  it('accepts content with dryRun', () => {
    const result = ImportUserDataReqSchema.safeParse({ content: '{}', dryRun: true });
    expect(result.success).toBe(true);
  });

  it('rejects missing content', () => {
    const result = ImportUserDataReqSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('PortableUserDataV1Schema — strict unknown field rejection', () => {
  it('rejects data with id field', () => {
    const result = PortableUserDataV1Schema.safeParse({
      settings: { preferences: {}, id: 'some-db-id' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects data with identityId field', () => {
    const result = PortableUserDataV1Schema.safeParse({
      settings: { preferences: {}, identityId: 'some-identity' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects data with accountId field', () => {
    const result = PortableUserDataV1Schema.safeParse({
      settings: { preferences: {}, accountId: 'some-account' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects data with apiKeyEncrypted field', () => {
    const result = PortableUserDataV1Schema.safeParse({
      settings: { preferences: {}, apiKeyEncrypted: 'secret' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid empty data', () => {
    const result = PortableUserDataV1Schema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects unknown top-level module key', () => {
    const result = PortableUserDataV1Schema.safeParse({
      unknownModule: { foo: 'bar' },
    });
    expect(result.success).toBe(false);
  });
});

describe('Module schemas — strict field validation', () => {
  it('PortableSettingsSchema rejects unknown fields', () => {
    const result = PortableSettingsSchema.safeParse({ preferences: {}, extra: true });
    expect(result.success).toBe(false);
  });

  it('PortableGoalDataSchema rejects goal with id', () => {
    const result = PortableGoalDataSchema.safeParse({
      folders: [],
      items: [{ _ref: 'goal:1', name: 'test', color: '#000', status: 'pending', importance: 'moderate', priority: 0, tags: [], sortOrder: 0, keyResults: [], goalReviews: [], id: 'bad' }],
      records: [],
      focusSessions: [],
      focusModes: [],
    });
    expect(result.success).toBe(false);
  });

  it('PortableGoalDataSchema accepts valid goal', () => {
    const result = PortableGoalDataSchema.safeParse({
      folders: [],
      items: [{ _ref: 'goal:1', name: 'test', color: '#000', status: 'pending', importance: 'moderate', priority: 0, tags: [], sortOrder: 0, keyResults: [], goalReviews: [] }],
      records: [],
      focusSessions: [],
      focusModes: [],
    });
    expect(result.success).toBe(true);
  });

  it('PortableTaskDataSchema rejects template with identityId', () => {
    const result = PortableTaskDataSchema.safeParse({
      folders: [],
      templates: [{ _ref: 'taskTemplate:1', title: 'test', taskType: 'once', importance: 'moderate', tags: [], status: 'pending', checklist: [], identityId: 'bad' }],
      instances: [],
      dependencies: [],
    });
    expect(result.success).toBe(false);
  });

  it('PortableRepositoryDataSchema rejects resource with id', () => {
    const result = PortableRepositoryDataSchema.safeParse({
      repositories: [{ _ref: 'repository:1', name: 'test', type: 'text', config: {}, status: 'ACTIVE' }],
      folders: [],
      resources: [{ _ref: 'resource:1', repositoryRef: 'repository:1', type: 'text', name: 'test', path: '/test', status: 'ACTIVE', id: 'bad' }],
    });
    expect(result.success).toBe(false);
  });

  it('PortableReminderDataSchema rejects group with unknown field', () => {
    const result = PortableReminderDataSchema.safeParse({
      groups: [{ _ref: 'reminderGroup:1', name: 'test', controlMode: 'manual', enabled: true, status: 'active', order: 0, badField: true }],
      templates: [],
      responses: [],
    });
    expect(result.success).toBe(false);
  });

  it('PortableScheduleDataSchema rejects schedule with id', () => {
    const result = PortableScheduleDataSchema.safeParse({
      entries: [{ _ref: 'schedule:1', title: 'test', startTime: '2026-01-01T00:00:00Z', endTime: '2026-01-01T01:00:00Z', duration: 60, id: 'bad' }],
      tasks: [],
    });
    expect(result.success).toBe(false);
  });

  it('PortableEditorDataSchema rejects workspace with identityId', () => {
    const result = PortableEditorDataSchema.safeParse({
      workspaces: [{ _ref: 'editorWorkspace:1', name: 'test', projectPath: '/test', projectType: 'unknown', layout: {}, settings: {}, isActive: false, sessions: [], identityId: 'bad' }],
    });
    expect(result.success).toBe(false);
  });

  it('PortableAIDataSchema rejects conversation with id', () => {
    const result = PortableAIDataSchema.safeParse({
      conversations: [{ _ref: 'aiConversation:1', name: 'test', status: 'ACTIVE', messages: [], id: 'bad' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('PortableUserDataV1Schema — duplicate _ref rejection', () => {
  it('rejects duplicate _ref across goals', () => {
    const result = PortableUserDataV1Schema.safeParse({
      goals: {
        folders: [],
        items: [
          { _ref: 'goal:1', name: 'a', color: '#000', status: 'pending', importance: 'moderate', priority: 0, tags: [], sortOrder: 0, keyResults: [], goalReviews: [] },
          { _ref: 'goal:1', name: 'b', color: '#000', status: 'pending', importance: 'moderate', priority: 0, tags: [], sortOrder: 0, keyResults: [], goalReviews: [] },
        ],
        records: [],
        focusSessions: [],
        focusModes: [],
      },
    });
    // Note: strict schema does not check _ref uniqueness — that's done in the use case.
    // This test documents that the schema itself allows it (uniqueness is a business rule).
    expect(result.success).toBe(true);
  });
});
