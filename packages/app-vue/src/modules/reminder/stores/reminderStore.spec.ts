import { beforeEach, describe, expect, it } from 'vitest';
import type {
  ReminderGroupClientDTO,
  ReminderTemplateClientDTO,
  UserReminderPreferencesClientDTO,
} from '@dailyuse/contracts/reminder';
import { createTestPinia } from '@dailyuse/test-utils';
import { useReminderStore } from './reminder-store';

function createTemplate(
  overrides: Partial<ReminderTemplateClientDTO> = {},
): ReminderTemplateClientDTO {
  return {
    id: 'template-1' as ReminderTemplateClientDTO['id'],
    name: 'Stand up and stretch',
    ...overrides,
  } as ReminderTemplateClientDTO;
}

function createGroup(
  overrides: Partial<ReminderGroupClientDTO> = {},
): ReminderGroupClientDTO {
  return {
    id: 'group-1' as ReminderGroupClientDTO['id'],
    name: 'Health',
    ...overrides,
  } as ReminderGroupClientDTO;
}

describe('useReminderStore', () => {
  beforeEach(() => {
    createTestPinia();
  });

  it('mutates templates, groups, preferences, and common status flags', () => {
    const store = useReminderStore();
    const template = createTemplate();
    const group = createGroup();
    const preferences = {
      id: 'pref-1',
    } as UserReminderPreferencesClientDTO;

    store.setTemplates([template]);
    store.addTemplate(createTemplate({ id: 'template-2' as ReminderTemplateClientDTO['id'] }));
    store.updateTemplate(createTemplate({ id: template.id, name: 'Drink water' }));
    store.removeTemplate('template-2');

    store.setGroups([group]);
    store.addGroup(createGroup({ id: 'group-2' as ReminderGroupClientDTO['id'] }));
    store.updateGroup(createGroup({ id: 'group-2' as ReminderGroupClientDTO['id'], name: 'Work' }));
    store.removeGroup(group.id);

    store.setPreferences(preferences);
    store.setLoading(true);
    store.setError('boom');
    store.setInitialized(true);

    expect(store.templates.map((item) => item.name)).toEqual(['Drink water']);
    expect(store.groups.map((item) => item.name)).toEqual(['Work']);
    expect(store.preferences).toStrictEqual(preferences);
    expect(store.isLoading).toBe(true);
    expect(store.error).toBe('boom');
    expect(store.isInitialized).toBe(true);

    store.reset();
    expect(store.templates).toEqual([]);
    expect(store.groups).toEqual([]);
    expect(store.preferences).toBeNull();
    expect(store.isInitialized).toBe(false);
  });
});
