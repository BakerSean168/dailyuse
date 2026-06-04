/**
 * Import validation tests — covers schema rejection, dry-run, and ref resolution
 * without requiring a real database.
 */

import { describe, it, expect } from 'vitest';
import { validateEnvelope, PortableUserDataV1Schema } from '../../../contracts/portable-schema';

describe('Envelope validation — identity field rejection', () => {
  const baseEnvelope = {
    kind: 'memoflow.user-data-export' as const,
    schemaVersion: 1 as const,
    exportedAt: '2026-06-03T00:00:00.000Z',
    scope: { includesBinaryResources: false as const, importMode: 'append-create-like' as const },
  };

  it('rejects envelope with id in settings', () => {
    const result = validateEnvelope({
      ...baseEnvelope,
      data: { settings: { preferences: {}, id: 'db-id-123' } },
    });
    expect(result.ok).toBe(false);
  });

  it('rejects envelope with identityId in goal', () => {
    const result = validateEnvelope({
      ...baseEnvelope,
      data: {
        goals: {
          folders: [],
          items: [{ _ref: 'goal:1', name: 'test', color: '#000', status: 'pending', importance: 'moderate', priority: 0, tags: [], sortOrder: 0, keyResults: [], goalReviews: [], identityId: 'leaked' }],
          records: [], focusSessions: [], focusModes: [],
        },
      },
    });
    expect(result.ok).toBe(false);
  });

  it('rejects nested identity fields inside unknown settings payloads', () => {
    const result = validateEnvelope({
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
    const result = validateEnvelope({
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
    const result = validateEnvelope({
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

  it('rejects envelope with unknown schemaVersion', () => {
    const result = validateEnvelope({
      ...baseEnvelope,
      schemaVersion: 99 as 1,
      data: {},
    });
    expect(result.ok).toBe(false);
  });

  it('rejects envelope with wrong kind', () => {
    const result = validateEnvelope({
      ...baseEnvelope,
      kind: 'wrong.kind' as 'memoflow.user-data-export',
      data: {},
    });
    expect(result.ok).toBe(false);
  });

  it('accepts envelope with empty data', () => {
    const result = validateEnvelope({
      ...baseEnvelope,
      data: {},
    });
    expect(result.ok).toBe(true);
  });

  it('accepts envelope with valid goals', () => {
    const result = validateEnvelope({
      ...baseEnvelope,
      data: {
        goals: {
          folders: [{ _ref: 'goalFolder:1', name: 'Work', sortOrder: 0, isSystemFolder: false }],
          items: [{
            _ref: 'goal:1', name: 'Ship V1', color: '#3B82F6', status: 'active',
            importance: 'high', priority: 1, tags: ['release'], sortOrder: 0,
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
    const result = validateEnvelope({
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

describe('PortableUserDataV1Schema — structural validation', () => {
  it('rejects unknown top-level key', () => {
    const result = PortableUserDataV1Schema.safeParse({ unknownModule: {} });
    expect(result.success).toBe(false);
  });

  it('rejects goal with missing required fields', () => {
    const result = PortableUserDataV1Schema.safeParse({
      goals: {
        folders: [],
        items: [{ _ref: 'goal:1' }], // missing name, color, status, etc.
        records: [], focusSessions: [], focusModes: [],
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects task template with invalid _ref format', () => {
    const result = PortableUserDataV1Schema.safeParse({
      tasks: {
        folders: [],
        templates: [{ _ref: 'invalid-ref', title: 'test', taskType: 'once', importance: 'moderate', tags: [], status: 'pending', checklist: [] }],
        instances: [], dependencies: [],
      },
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid reminder data', () => {
    const result = PortableUserDataV1Schema.safeParse({
      reminders: {
        groups: [{ _ref: 'reminderGroup:1', name: 'Daily', controlMode: 'manual', enabled: true, status: 'active', order: 0 }],
        templates: [{
          _ref: 'reminderTemplate:1', title: 'Standup', type: 'once',
          trigger: {}, activeTime: {}, notificationConfig: {},
          selfEnabled: true, status: 'active', importanceLevel: 'moderate',
          tags: [], smartFrequencyEnabled: false,
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
          _ref: 'aiConversation:1', name: 'Chat', status: 'ACTIVE',
          messages: [{ _ref: 'aiMessage:1', role: 'user', content: 'Hello' }],
        }],
      },
    });
    expect(result.success).toBe(true);
  });
});

describe('Ref format validation', () => {
  it('rejects ref without colon', () => {
    const result = PortableUserDataV1Schema.safeParse({
      goals: {
        folders: [{ _ref: 'badref', name: 'test', sortOrder: 0, isSystemFolder: false }],
        items: [], records: [], focusSessions: [], focusModes: [],
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects ref with uppercase prefix', () => {
    const result = PortableUserDataV1Schema.safeParse({
      goals: {
        folders: [{ _ref: 'GoalFolder:1', name: 'test', sortOrder: 0, isSystemFolder: false }],
        items: [], records: [], focusSessions: [], focusModes: [],
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects ref with non-numeric suffix', () => {
    const result = PortableUserDataV1Schema.safeParse({
      goals: {
        folders: [{ _ref: 'goalFolder:abc', name: 'test', sortOrder: 0, isSystemFolder: false }],
        items: [], records: [], focusSessions: [], focusModes: [],
      },
    });
    expect(result.success).toBe(false);
  });
});
