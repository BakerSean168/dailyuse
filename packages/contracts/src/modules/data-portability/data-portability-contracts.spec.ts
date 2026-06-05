import { describe, expect, it } from 'vitest';
import {
  ExportUserDataReqSchema,
  ImportUserDataReqSchema,
  parseUserDataExportEnvelope,
  PortableAIDataSchema,
  PortableEditorDataSchema,
  PortableGoalDataSchema,
  PortableReminderDataSchema,
  PortableRepositoryDataSchema,
  PortableScheduleDataSchema,
  PortableSettingsSchema,
  PortableTaskDataSchema,
  PortableUserDataV1Schema,
} from './index';

describe('parseUserDataExportEnvelope', () => {
  const baseEnvelope = {
    kind: 'memoflow.user-data-export' as const,
    schemaVersion: 1 as const,
    exportedAt: '2026-06-03T00:00:00.000Z',
    scope: {
      includesBinaryResources: false as const,
      importMode: 'append-create-like' as const,
    },
  };

  it('accepts a valid envelope', () => {
    const result = parseUserDataExportEnvelope({
      ...baseEnvelope,
      data: {},
    });

    expect(result.ok).toBe(true);
  });

  it('rejects wrong kind', () => {
    const result = parseUserDataExportEnvelope({
      ...baseEnvelope,
      kind: 'wrong.kind' as 'memoflow.user-data-export',
      data: {},
    });

    expect(result.ok).toBe(false);
  });

  it('rejects wrong schemaVersion', () => {
    const result = parseUserDataExportEnvelope({
      ...baseEnvelope,
      schemaVersion: 99 as 1,
      data: {},
    });

    expect(result.ok).toBe(false);
  });

  it('rejects missing data field', () => {
    const result = parseUserDataExportEnvelope(baseEnvelope);
    expect(result.ok).toBe(false);
  });

  it('rejects null input', () => {
    const result = parseUserDataExportEnvelope(null);
    expect(result.ok).toBe(false);
  });

  it('rejects nested identity fields inside unknown settings payloads', () => {
    const result = parseUserDataExportEnvelope({
      ...baseEnvelope,
      data: {
        settings: {
          preferences: {
            appearance: { theme: 'dark' },
            profile: { identityId: 'leaked-identity' },
          },
        },
      },
    });

    expect(result).toEqual({
      ok: false,
      error: 'Envelope validation failed: data.settings.preferences.profile.identityId — banned import field',
    });
  });

  it('rejects nested auth config inside repository payloads', () => {
    const result = parseUserDataExportEnvelope({
      ...baseEnvelope,
      data: {
        repositories: {
          repositories: [
            {
              _ref: 'repository:1',
              name: 'Knowledge',
              type: 'local',
              config: { auth: { token: 'secret-token' } },
              status: 'ACTIVE',
            },
          ],
          folders: [],
          resources: [],
        },
      },
    });

    expect(result).toEqual({
      ok: false,
      error: 'Envelope validation failed: data.repositories.repositories.0.config.auth — banned import field',
    });
  });

  it('rejects nested persistent id fields inside resource metadata', () => {
    const result = parseUserDataExportEnvelope({
      ...baseEnvelope,
      data: {
        repositories: {
          repositories: [
            { _ref: 'repository:1', name: 'Knowledge', type: 'local', config: {}, status: 'ACTIVE' },
          ],
          folders: [],
          resources: [
            {
              _ref: 'resource:1',
              repositoryRef: 'repository:1',
              type: 'markdown',
              name: 'note.md',
              path: '/note.md',
              status: 'ACTIVE',
              metadata: { source: { resourceId: 'db-resource-id' } },
            },
          ],
        },
      },
    });

    expect(result).toEqual({
      ok: false,
      error: 'Envelope validation failed: data.repositories.resources.0.metadata.source.resourceId — banned import field',
    });
  });

  it('accepts valid goals', () => {
    const result = parseUserDataExportEnvelope({
      ...baseEnvelope,
      data: {
        goals: {
          folders: [{ _ref: 'goalFolder:1', name: 'Work', sortOrder: 0, isSystemFolder: false }],
          items: [{
            _ref: 'goal:1',
            name: 'Ship V1',
            color: '#3B82F6',
            status: 'active',
            importance: 'high',
            priority: 1,
            tags: ['release'],
            sortOrder: 0,
            keyResults: [{ _ref: 'keyResult:1', title: 'All tests pass', progress: {}, weight: 1, sortOrder: 0 }],
            goalReviews: [],
          }],
          records: [{ _ref: 'goalRecord:1', keyResultRef: 'keyResult:1', value: 1, recordedAt: '2026-06-03T00:00:00Z' }],
          focusSessions: [],
          focusModes: [],
        },
      },
    });

    expect(result.ok).toBe(true);
  });

  it('allows sensitive-looking words in user-authored string values', () => {
    const result = parseUserDataExportEnvelope({
      ...baseEnvelope,
      data: {
        ai: {
          conversations: [
            {
              _ref: 'aiConversation:1',
              name: 'Chat',
              status: 'ACTIVE',
              messages: [
                {
                  _ref: 'aiMessage:1',
                  role: 'user',
                  content: 'Remember to rotate the API token after migration.',
                },
              ],
            },
          ],
        },
      },
    });

    expect(result.ok).toBe(true);
  });
});

describe('request schemas', () => {
  it('ExportUserDataReqSchema accepts empty object', () => {
    expect(ExportUserDataReqSchema.safeParse({}).success).toBe(true);
  });

  it('ExportUserDataReqSchema accepts valid include array', () => {
    expect(ExportUserDataReqSchema.safeParse({ include: ['goals', 'tasks'] }).success).toBe(true);
  });

  it('ExportUserDataReqSchema rejects invalid module name', () => {
    expect(ExportUserDataReqSchema.safeParse({ include: ['invalid'] }).success).toBe(false);
  });

  it('ImportUserDataReqSchema accepts content string', () => {
    expect(ImportUserDataReqSchema.safeParse({ content: '{}' }).success).toBe(true);
  });

  it('ImportUserDataReqSchema accepts content with dryRun', () => {
    expect(ImportUserDataReqSchema.safeParse({ content: '{}', dryRun: true }).success).toBe(true);
  });

  it('ImportUserDataReqSchema rejects missing content', () => {
    expect(ImportUserDataReqSchema.safeParse({}).success).toBe(false);
  });
});

describe('PortableUserDataV1Schema', () => {
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
    expect(PortableUserDataV1Schema.safeParse({}).success).toBe(true);
  });

  it('rejects unknown top-level module key', () => {
    expect(PortableUserDataV1Schema.safeParse({ unknownModule: { foo: 'bar' } }).success).toBe(false);
  });

  it('rejects goal with missing required fields', () => {
    const result = PortableUserDataV1Schema.safeParse({
      goals: {
        folders: [],
        items: [{ _ref: 'goal:1' }],
        records: [],
        focusSessions: [],
        focusModes: [],
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects task template with invalid _ref format', () => {
    const result = PortableUserDataV1Schema.safeParse({
      tasks: {
        folders: [],
        templates: [{ _ref: 'invalid-ref', title: 'test', taskType: 'once', importance: 'moderate', tags: [], status: 'pending', checklist: [] }],
        instances: [],
        dependencies: [],
      },
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid reminder data', () => {
    const result = PortableUserDataV1Schema.safeParse({
      reminders: {
        groups: [{ _ref: 'reminderGroup:1', name: 'Daily', controlMode: 'manual', enabled: true, status: 'active', order: 0 }],
        templates: [{
          _ref: 'reminderTemplate:1',
          title: 'Standup',
          type: 'once',
          trigger: {},
          activeTime: {},
          notificationConfig: {},
          selfEnabled: true,
          status: 'active',
          importanceLevel: 'moderate',
          tags: [],
          smartFrequencyEnabled: false,
        }],
        responses: [],
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts valid AI data', () => {
    const result = PortableUserDataV1Schema.safeParse({
      ai: {
        conversations: [{
          _ref: 'aiConversation:1',
          name: 'Chat',
          status: 'ACTIVE',
          messages: [{ _ref: 'aiMessage:1', role: 'user', content: 'Hello' }],
        }],
      },
    });

    expect(result.success).toBe(true);
  });

  it('documents that duplicate _ref is a business-rule concern, not a schema concern', () => {
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

    expect(result.success).toBe(true);
  });
});

describe('module schemas', () => {
  it('PortableSettingsSchema rejects unknown fields', () => {
    expect(PortableSettingsSchema.safeParse({ preferences: {}, extra: true }).success).toBe(false);
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

describe('ref format validation', () => {
  it('rejects ref without colon', () => {
    const result = PortableUserDataV1Schema.safeParse({
      goals: {
        folders: [{ _ref: 'badref', name: 'test', sortOrder: 0, isSystemFolder: false }],
        items: [],
        records: [],
        focusSessions: [],
        focusModes: [],
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects ref with uppercase prefix', () => {
    const result = PortableUserDataV1Schema.safeParse({
      goals: {
        folders: [{ _ref: 'GoalFolder:1', name: 'test', sortOrder: 0, isSystemFolder: false }],
        items: [],
        records: [],
        focusSessions: [],
        focusModes: [],
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects ref with non-numeric suffix', () => {
    const result = PortableUserDataV1Schema.safeParse({
      goals: {
        folders: [{ _ref: 'goalFolder:abc', name: 'test', sortOrder: 0, isSystemFolder: false }],
        items: [],
        records: [],
        focusSessions: [],
        focusModes: [],
      },
    });

    expect(result.success).toBe(false);
  });
});
