import { describe, expect, it } from 'vitest';
import { mapTablesToInvalidationIntents } from './server-state';

describe('mapTablesToInvalidationIntents (plan §3.3 pilot table mapping)', () => {
  it('maps notifications → notification intent', () => {
    expect(mapTablesToInvalidationIntents(['notifications'], 'id-1')).toEqual([
      { target: 'notification', identityScope: 'id-1', source: 'powersync' },
    ]);
  });

  it('maps task_templates → task-template projection all (lists/graphs/details)', () => {
    expect(mapTablesToInvalidationIntents(['task_templates'], 'id-1')).toEqual([
      { target: 'task-template', identityScope: 'id-1', source: 'powersync', projection: 'all' },
    ]);
  });

  it('maps task_dependencies → task-template graphs only', () => {
    expect(mapTablesToInvalidationIntents(['task_dependencies'], 'id-1')).toEqual([
      { target: 'task-template', identityScope: 'id-1', source: 'powersync', projection: 'graphs' },
    ]);
  });

  it('maps rules → governance all (lists/details/revisions)', () => {
    expect(mapTablesToInvalidationIntents(['rules'], 'id-1')).toEqual([
      { target: 'governance', identityScope: 'id-1', source: 'powersync', projection: 'all' },
    ]);
  });

  it('maps rule_revisions → governance revisions only', () => {
    expect(mapTablesToInvalidationIntents(['rule_revisions'], 'id-1')).toEqual([
      { target: 'governance', identityScope: 'id-1', source: 'powersync', projection: 'revisions' },
    ]);
  });

  it('emits one intent per pilot table for a mixed batch (deduped)', () => {
    const intents = mapTablesToInvalidationIntents(
      ['notifications', 'task_templates', 'notifications', 'task_dependencies', 'rules'],
      'id-1',
    );
    expect(intents).toHaveLength(4);
    expect(intents.map((i) => `${i.target}:${i.projection ?? ''}`).sort()).toEqual([
      'governance:all',
      'notification:',
      'task-template:all',
      'task-template:graphs',
    ]);
  });

  it('ignores non-pilot tables so they keep flowing through the legacy Pinia invalidator', () => {
    expect(mapTablesToInvalidationIntents(['goals', 'schedules', 'user_settings'], 'id-1')).toEqual(
      [],
    );
  });

  it('carries the identityScope through for cache isolation', () => {
    const [intent] = mapTablesToInvalidationIntents(['notifications'], 'profile-9');
    expect(intent.identityScope).toBe('profile-9');
  });
});
