import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'vue-sonner';
import { fail, ok } from '@dailyuse/contracts/result';
import type {
  CreateTaskTemplateReq,
  TaskGraphDependencyDTO,
  TaskTemplateClientDTO,
  UpdateTaskTemplateReq,
} from '@dailyuse/contracts/task';
import { DependencyType } from '@dailyuse/contracts/task';
import type { TaskDependencyId, TaskTemplateId } from '@dailyuse/contracts/primitives';
import { createTestPinia } from '@dailyuse/test-utils';
import { TASK_SERVICE_KEY } from '../../../di/keys';
import { useTaskStore } from '../stores/task-store';
import { useTaskTemplates } from './useTaskTemplates';

vi.mock('vue-sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    en: {
      errors: {
        VALIDATION_ERROR: 'Please check your input',
        unknown: 'Unexpected error',
      },
      task: {
        error: {
          operationFailed: 'Task operation failed',
          loadTemplatesFailed: 'Could not load task templates',
          createFailed: 'Could not create task template',
          createSuccess: 'Task template created',
          createTemplateWithTodayInstanceSuccess:
            "Task template created and today's instance generated ({count})",
          createTemplateWithoutTodayInstanceSuccess:
            "Task template created without today's instance ({count})",
          updateFailed: 'Could not update task template',
          updateSuccess: 'Task template updated',
          deleteFailed: 'Could not delete task template',
          deleteSuccess: 'Task template deleted',
        },
      },
    },
    'en-US': {
      errors: {
        VALIDATION_ERROR: 'Please check your input',
        unknown: 'Unexpected error',
        validation: 'Please check your input',
      },
      task: {
        error: {
          operationFailed: 'Task operation failed',
          loadTemplatesFailed: 'Could not load task templates',
          createFailed: 'Could not create task template',
          createSuccess: 'Task template created',
          createTemplateWithTodayInstanceSuccess:
            "Task template created and today's instance generated ({count})",
          createTemplateWithoutTodayInstanceSuccess:
            "Task template created without today's instance ({count})",
          updateFailed: 'Could not update task template',
          updateSuccess: 'Task template updated',
          deleteFailed: 'Could not delete task template',
          deleteSuccess: 'Task template deleted',
        },
      },
    },
  },
});

function createTemplate(
  overrides: Partial<TaskTemplateClientDTO> = {},
): TaskTemplateClientDTO {
  return {
    id: 'template-1' as TaskTemplateId,
    name: 'Write sharper tests',
    status: 'Active',
    ...overrides,
  } as TaskTemplateClientDTO;
}

function createTemplateEntity(overrides: Partial<TaskTemplateClientDTO> = {}) {
  const dto = createTemplate(overrides);
  return {
    toDTO: vi.fn(() => dto),
  };
}

function createDependency(
  overrides: Partial<TaskGraphDependencyDTO> = {},
): TaskGraphDependencyDTO {
  return {
    id: 'dependency-1' as TaskDependencyId,
    predecessorTaskId: 'template-1' as TaskTemplateId,
    successorTaskId: 'template-2' as TaskTemplateId,
    dependencyType: DependencyType.FinishToStart,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

type TaskServiceStub = {
  listTemplates: ReturnType<typeof vi.fn>;
  getTaskGraph: ReturnType<typeof vi.fn>;
  getTemplate: ReturnType<typeof vi.fn>;
  createTemplate: ReturnType<typeof vi.fn>;
  updateTemplate: ReturnType<typeof vi.fn>;
  deleteTemplate: ReturnType<typeof vi.fn>;
  activateTemplate: ReturnType<typeof vi.fn>;
  pauseTemplate: ReturnType<typeof vi.fn>;
  archiveTemplate: ReturnType<typeof vi.fn>;
};

function createServiceStub(overrides: Partial<TaskServiceStub> = {}): TaskServiceStub {
  return {
    listTemplates: vi.fn(),
    getTaskGraph: vi.fn(),
    getTemplate: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    activateTemplate: vi.fn(),
    pauseTemplate: vi.fn(),
    archiveTemplate: vi.fn(),
    ...overrides,
  };
}

function mountComposable(serviceOverrides: Partial<TaskServiceStub> = {}) {
  let composable!: ReturnType<typeof useTaskTemplates>;
  const service = createServiceStub(serviceOverrides);
  const pinia = createTestPinia();

  mount(
    defineComponent({
      setup() {
        composable = useTaskTemplates();
        return () => h('div');
      },
    }),
    {
      global: {
        plugins: [pinia, i18n],
        provide: {
          [TASK_SERVICE_KEY as symbol]: service,
        },
      },
    },
  );

  return { composable, service };
}

describe('useTaskTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates templates from the list service using explicit query params', async () => {
    const template = createTemplateEntity();
    const { composable, service } = mountComposable({
      listTemplates: vi.fn().mockResolvedValue(ok({ templates: [template], total: 1 })),
    });

    await composable.fetchTemplates({
      page: 2,
      limit: 5,
      status: ['Active'],
      goalId: 'goal-1',
      folderId: 'folder-1',
      tags: ['deep-work'],
    });

    expect(service.listTemplates).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      status: ['Active'],
      goalId: 'goal-1',
      folderId: 'folder-1',
      tags: ['deep-work'],
    });
    expect(template.toDTO).toHaveBeenCalledTimes(1);
    expect(useTaskStore().templates).toEqual([createTemplate()]);
    expect(useTaskStore().pagination.total).toBe(1);
    expect(useTaskStore().isLoading).toBe(false);
  });

  it('syncs graph dependencies along with templates', async () => {
    const dependency = createDependency();
    const { composable, service } = mountComposable({
      getTaskGraph: vi.fn().mockResolvedValue(
        ok({
          templates: [createTemplateEntity({ id: 'template-2' as TaskTemplateId })],
          dependencies: [dependency],
          total: 1,
        }),
      ),
    });

    await composable.fetchTaskGraph();

    expect(service.getTaskGraph).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(useTaskStore().templates).toEqual([
      createTemplate({ id: 'template-2' as TaskTemplateId }),
    ]);
    expect(useTaskStore().dependencies).toEqual([dependency]);
  });

  it('updates saving state and store entries for create, update, and delete operations', async () => {
    const existing = createTemplate({ id: 'template-1' as TaskTemplateId, name: 'Draft' });
    const updated = createTemplate({ id: existing.id, name: 'Published' });
    const { composable, service } = mountComposable({
      createTemplate: vi.fn().mockResolvedValue(
        ok({
          template: createTemplateEntity(existing),
          instanceCount: 7,
          todayInstanceCreated: true,
        }),
      ),
      updateTemplate: vi.fn().mockResolvedValue(ok(createTemplateEntity(updated))),
      deleteTemplate: vi.fn().mockResolvedValue(ok(undefined)),
    });

    expect(composable.isSaving.value).toBe(false);

    const created = await composable.createTemplate({
      name: 'Draft',
    } as CreateTaskTemplateReq);

    expect(created).toEqual({
      template: existing,
      instanceCount: 7,
      todayInstanceCreated: true,
    });
    expect(useTaskStore().templates).toEqual([existing]);
    expect(composable.isSaving.value).toBe(false);
    expect(toast.success).toHaveBeenCalledWith(
      "Task template created and today's instance generated (7)",
    );

    const result = await composable.updateTemplate(existing.id, {
      name: 'Published',
    } as UpdateTaskTemplateReq);

    expect(result).toEqual(updated);
    expect(useTaskStore().templates).toEqual([updated]);

    await expect(composable.deleteTemplate(existing.id)).resolves.toBe(true);
    expect(useTaskStore().templates).toEqual([]);
    expect(useTaskStore().pagination.total).toBe(0);
  });

  it('deletes a batch without emitting per-template success feedback', async () => {
    const first = createTemplate({ id: 'template-1' as TaskTemplateId });
    const second = createTemplate({ id: 'template-2' as TaskTemplateId });
    const { composable, service } = mountComposable({
      deleteTemplate: vi.fn().mockResolvedValue(ok(undefined)),
    });
    useTaskStore().setTemplates([first, second], 2);

    await expect(composable.deleteTemplates([first.id, second.id])).resolves.toBe(true);

    expect(service.deleteTemplate).toHaveBeenNthCalledWith(1, first.id);
    expect(service.deleteTemplate).toHaveBeenNthCalledWith(2, second.id);
    expect(useTaskStore().templates).toEqual([]);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('stops a batch delete after the first failure and emits no success feedback', async () => {
    const first = createTemplate({ id: 'template-1' as TaskTemplateId });
    const second = createTemplate({ id: 'template-2' as TaskTemplateId });
    const { composable, service } = mountComposable({
      deleteTemplate: vi
        .fn()
        .mockResolvedValueOnce(ok(undefined))
        .mockResolvedValueOnce(
          fail({ code: 'VALIDATION_ERROR', message: 'Cannot delete template' }),
        ),
    });
    useTaskStore().setTemplates([first, second], 2);

    await expect(composable.deleteTemplates([first.id, second.id])).resolves.toBe(false);

    expect(service.deleteTemplate).toHaveBeenCalledTimes(2);
    expect(useTaskStore().templates).toEqual([second]);
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it("reports when template creation does not generate today's instance", async () => {
    const template = createTemplate();
    const { composable } = mountComposable({
      createTemplate: vi.fn().mockResolvedValue(
        ok({
          template: createTemplateEntity(template),
          instanceCount: 3,
          todayInstanceCreated: false,
        }),
      ),
    });

    await composable.createTemplate({ name: template.name } as CreateTaskTemplateReq);

    expect(toast.success).toHaveBeenCalledWith(
      "Task template created without today's instance (3)",
    );
  });

  it('stores translated errors and leaves previous templates untouched on failure', async () => {
    const previous = createTemplate();
    const { composable, service } = mountComposable({
      listTemplates: vi.fn().mockResolvedValue(
        fail({
          code: 'VALIDATION_ERROR',
          message: 'Backend validation details',
        }),
      ),
    });
    const store = useTaskStore();
    store.setTemplates([previous], 1);

    await composable.fetchTemplates();

    expect(service.listTemplates).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(store.templates).toEqual([previous]);
    expect(store.error).toBe('Please check your input');
    expect(store.isLoading).toBe(false);
  });
});
