import { beforeEach, describe, expect, it } from 'vitest';
import type {
  TaskGraphDependencyDTO,
  TaskInstanceClientDTO,
  TaskTemplateClientDTO,
} from '@dailyuse/contracts/task';
import { createTestPinia } from '@dailyuse/test-utils';
import { useTaskStore } from './taskStore';

function createTemplate(
  overrides: Partial<TaskTemplateClientDTO> = {},
): TaskTemplateClientDTO {
  return {
    id: 'template-1' as TaskTemplateClientDTO['id'],
    status: 'Active',
    title: 'Write tests',
    ...overrides,
  } as TaskTemplateClientDTO;
}

function createInstance(
  overrides: Partial<TaskInstanceClientDTO> = {},
): TaskInstanceClientDTO {
  return {
    id: 'instance-1' as TaskInstanceClientDTO['id'],
    templateId: 'template-1',
    status: 'Pending',
    ...overrides,
  } as TaskInstanceClientDTO;
}

describe('useTaskStore', () => {
  beforeEach(() => {
    createTestPinia();
  });

  it('keeps template list, current template, pagination, and getters in sync', () => {
    const store = useTaskStore();
    const active = createTemplate();
    const archived = createTemplate({
      id: 'template-2' as TaskTemplateClientDTO['id'],
      status: 'Archived',
      title: 'Archive old flow',
    });

    store.setTemplates([archived], 21);
    store.addTemplate(active);
    store.setCurrentTemplate(active);
    store.updateTemplate({
      ...active,
      title: 'Write stronger tests',
    });

    expect(store.getTemplateById(active.id)?.title).toBe('Write stronger tests');
    expect(store.activeTemplateCount).toBe(1);
    expect(store.totalPages).toBe(2);

    store.removeTemplate(active.id);

    expect(store.currentTemplate).toBeNull();
    expect(store.pagination.total).toBe(21);
  });

  it('updates instance, dependency, loading, and reset state', () => {
    const store = useTaskStore();
    const instance = createInstance();
    const updated = createInstance({
      id: instance.id,
      status: 'Completed',
    });
    const dependency = {
      id: 'dependency-1',
      blockerId: 'template-1',
      blockedId: 'template-2',
    } as TaskGraphDependencyDTO;

    store.setInstances([instance]);
    store.setCurrentInstance(instance);
    store.addInstance(createInstance({ id: 'instance-2' as TaskInstanceClientDTO['id'] }));
    store.updateInstance(updated);
    store.setDependencies([dependency]);
    store.setLoading(true);
    store.setError('failed');
    store.setPage(3);
    store.setInitialized(true);

    expect(store.getInstanceById(instance.id)?.status).toBe('Completed');
    expect(store.currentInstance?.status).toBe('Completed');
    expect(store.dependencies).toEqual([dependency]);
    expect(store.pagination.page).toBe(3);
    expect(store.isLoading).toBe(true);
    expect(store.error).toBe('failed');
    expect(store.isInitialized).toBe(true);

    store.removeInstance(instance.id);
    expect(store.getInstanceById(instance.id)).toBeUndefined();

    store.reset();
    expect(store.instances).toEqual([]);
    expect(store.dependencies).toEqual([]);
    expect(store.currentInstance).toBeNull();
    expect(store.pagination.page).toBe(1);
    expect(store.isInitialized).toBe(false);
  });
});
