import { beforeEach, describe, expect, it } from 'vitest';
import type { TaskInstanceClientDTO } from '@memoflow/contracts/task';
import type { TaskInstanceId, TaskTemplateId } from '@memoflow/contracts/primitives';
import { createTestPinia } from '@memoflow/test-utils';
import { useTaskStore } from './task-store';

function createInstance(overrides: Partial<TaskInstanceClientDTO> = {}): TaskInstanceClientDTO {
  return {
    id: 'instance-1' as TaskInstanceId,
    templateId: 'template-1' as TaskTemplateId,
    status: 'Pending',
    ...overrides,
  } as TaskInstanceClientDTO;
}

describe('useTaskStore (instances/currentInstance + UI state; templates in query cache)', () => {
  beforeEach(() => {
    createTestPinia();
  });

  it('manages instances, current instance, and UI pagination/loading/error state', () => {
    const store = useTaskStore();
    const instance = createInstance();
    const updated = createInstance({
      id: instance.id,
      status: 'Completed',
    });

    store.setInstances([instance]);
    store.setCurrentInstance(instance);
    store.addInstance(createInstance({ id: 'instance-2' as TaskInstanceClientDTO['id'] }));
    store.updateInstance(updated);
    store.setLoading(true);
    store.setError('failed');
    store.setPage(3);
    store.setInitialized(true);

    expect(store.getInstanceById(instance.id)?.status).toBe('Completed');
    expect(store.currentInstance?.status).toBe('Completed');
    expect(store.pagination.page).toBe(3);
    expect(store.isLoading).toBe(true);
    expect(store.error).toBe('failed');
    expect(store.isInitialized).toBe(true);

    store.removeInstance(instance.id);
    expect(store.getInstanceById(instance.id)).toBeUndefined();

    store.reset();
    expect(store.instances).toEqual([]);
    expect(store.currentInstance).toBeNull();
    expect(store.pagination.page).toBe(1);
    expect(store.isInitialized).toBe(false);
  });

  it('holds no template / graph / dependency server DTO or template total', () => {
    const store = useTaskStore();
    expect(store).not.toHaveProperty('templates');
    expect(store).not.toHaveProperty('currentTemplate');
    expect(store).not.toHaveProperty('dependencies');
    expect(store.pagination).not.toHaveProperty('total');
  });
});
