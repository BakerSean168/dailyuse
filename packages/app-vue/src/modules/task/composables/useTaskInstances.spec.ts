import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ok } from '@memoflow/contracts/result';
import type { TaskInstanceClientDTO, TaskTemplateClientDTO } from '@memoflow/contracts/task';
import { createTestPinia } from '@memoflow/test-utils';
import { TASK_SERVICE_KEY } from '../../../di/keys';
import { useTaskStore } from '../stores/task-store';
import { useTaskInstances } from './useTaskInstances';

vi.mock('vue-sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      errors: { unknown: 'Unknown error' },
      task: {
        error: {
          operationFailed: 'Operation failed',
          completeFailed: 'Complete failed',
          completeSuccess: 'Completed',
          uncompleteFailed: 'Undo failed',
          uncompleteSuccess: 'Restored',
          loadTemplatesFailed: 'Template refresh failed',
        },
      },
    },
  },
});

function instance(status: TaskInstanceClientDTO['status']): TaskInstanceClientDTO {
  return {
    id: 'instance-a',
    templateId: 'template-a',
    status,
  } as TaskInstanceClientDTO;
}

function template(completionRate: number): TaskTemplateClientDTO {
  return {
    id: 'template-a',
    name: 'Daily plan',
    completionRate,
  } as TaskTemplateClientDTO;
}

function entity<T>(dto: T) {
  return { toDTO: vi.fn(() => dto) };
}

function mountComposable() {
  const completed = instance('Completed');
  const pending = instance('Pending');
  const service = {
    completeInstance: vi.fn().mockResolvedValue(ok(entity(completed))),
    uncompleteInstance: vi.fn().mockResolvedValue(ok(entity(pending))),
    getTemplate: vi
      .fn()
      .mockResolvedValueOnce(ok(entity(template(100))))
      .mockResolvedValueOnce(ok(entity(template(0)))),
  };
  const pinia = createTestPinia();
  let composable!: ReturnType<typeof useTaskInstances>;

  mount(
    defineComponent({
      setup() {
        composable = useTaskInstances();
        return () => h('div');
      },
    }),
    {
      global: {
        plugins: [pinia, i18n],
        provide: { [TASK_SERVICE_KEY as symbol]: service },
      },
    },
  );

  useTaskStore().setTemplates([template(0)]);
  useTaskStore().setInstances([instance('Pending')]);
  return { composable, service };
}

describe('useTaskInstances template projection refresh', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refreshes the canonical template after complete and uncomplete', async () => {
    const { composable, service } = mountComposable();

    await composable.completeInstance('instance-a');
    expect(service.getTemplate).toHaveBeenNthCalledWith(1, 'template-a');
    expect(useTaskStore().getTemplateById('template-a')?.completionRate).toBe(100);

    await composable.uncompleteInstance('instance-a');
    expect(service.getTemplate).toHaveBeenNthCalledWith(2, 'template-a');
    expect(useTaskStore().getTemplateById('template-a')?.completionRate).toBe(0);
  });
});
