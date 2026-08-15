import { describe, expect, it, vi } from 'vitest';
import { fail, ok } from '@memoflow/contracts/result';
import type { TaskTemplateClientDTO } from '@memoflow/contracts/task';
import { taskTemplateQueryKeys } from '../../../platform/server-state/query-keys';
import { mountTaskComposable } from './taskQueryTestUtils';
import { useTaskTemplateMutations } from './useTaskTemplateMutations';

const SCOPE = 'identity-1';

function template(overrides: Partial<TaskTemplateClientDTO> = {}): TaskTemplateClientDTO {
  return {
    id: 'template-1' as TaskTemplateClientDTO['id'],
    identityId: SCOPE as TaskTemplateClientDTO['identityId'],
    name: 'Draft',
    description: null,
    timeConfig: { timeType: 'AllDay', startDate: 1 },
    recurrenceRule: null,
    reminderConfig: null,
    importance: 'Moderate',
    folderId: null,
    tags: [],
    color: null,
    status: 'Active',
    version: 1,
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
    goalBinding: null,
    parentTaskId: null,
    blockingReason: null,
    instanceCount: 0,
    completedInstanceCount: 0,
    pendingInstanceCount: 0,
    ...overrides,
  } as TaskTemplateClientDTO;
}

function entity(dto: TaskTemplateClientDTO) {
  return { toDTO: () => dto };
}

function makeService(overrides: Record<string, ReturnType<typeof vi.fn>> = {}) {
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

describe('useTaskTemplateMutations (plan §3.4)', () => {
  it('optimistic update patches all matching list/detail/graph entries and rolls back exactly on failure', async () => {
    const tpl = template();
    const service = makeService({
      updateTemplate: vi
        .fn()
        .mockResolvedValueOnce(ok(entity(template({ name: 'Published', version: 2 }))))
        .mockResolvedValueOnce(fail({ code: 'VALIDATION_ERROR', message: 'nope' })),
    });
    const { api, runtime } = mountTaskComposable(() => useTaskTemplateMutations(), { service });

    const listKey = taskTemplateQueryKeys.list(SCOPE, { page: 1, limit: 20 });
    const graphKey = taskTemplateQueryKeys.graph(SCOPE, { page: 1, limit: 1000 });
    const detailKey = taskTemplateQueryKeys.detail(SCOPE, tpl.id);
    runtime.queryClient.setQueryData(listKey, { templates: [tpl], total: 1 });
    runtime.queryClient.setQueryData(graphKey, { templates: [tpl], dependencies: [], total: 1 });
    runtime.queryClient.setQueryData(detailKey, tpl);

    // Success: optimistic patch converges to the server-confirmed DTO everywhere.
    const okResult = await api.updateTemplateSafe(tpl.id, { name: 'Published' });
    expect(okResult).toBeTruthy();
    const afterOk = runtime.queryClient.getQueryData(graphKey) as {
      templates: TaskTemplateClientDTO[];
    };
    expect(afterOk.templates[0].name).toBe('Published');

    // Failure: exact restore of every snapshot key (to the pre-mutation 'Published' state).
    await api.updateTemplateSafe(tpl.id, { name: 'Broken' });
    expect(runtime.queryClient.getQueryData(detailKey)?.name).toBe('Published');
    const afterFail = runtime.queryClient.getQueryData(graphKey) as {
      templates: TaskTemplateClientDTO[];
    };
    expect(afterFail.templates[0].name).toBe('Published');
    const afterFailList = runtime.queryClient.getQueryData(listKey) as {
      templates: TaskTemplateClientDTO[];
    };
    expect(afterFailList.templates[0].name).toBe('Published');
  });

  it('status mutations (activate/pause) apply optimistic status and restore on failure', async () => {
    const tpl = template();
    const service = makeService({
      activateTemplate: vi.fn().mockResolvedValue(ok(entity(template({ status: 'Active' })))),
      pauseTemplate: vi.fn().mockResolvedValue(fail({ code: 'VALIDATION_ERROR', message: 'nope' })),
    });
    const { api, runtime } = mountTaskComposable(() => useTaskTemplateMutations(), { service });

    const detailKey = taskTemplateQueryKeys.detail(SCOPE, tpl.id);
    const listKey = taskTemplateQueryKeys.list(SCOPE, { page: 1, limit: 20 });
    runtime.queryClient.setQueryData(detailKey, tpl);
    runtime.queryClient.setQueryData(listKey, { templates: [tpl], total: 1 });

    await api.activateTemplateSafe(tpl.id);
    expect(runtime.queryClient.getQueryData(detailKey)?.status).toBe('Active');

    // Pause failure restores the pre-mutation status.
    await api.pauseTemplateSafe(tpl.id);
    expect(runtime.queryClient.getQueryData(detailKey)?.status).toBe('Active');
  });

  it('create success keeps server-confirmed semantics (no fake id) and invalidates lists/graphs', async () => {
    const created = template({ id: 'template-new' as TaskTemplateClientDTO['id'] });
    const service = makeService({
      createTemplate: vi.fn().mockResolvedValue(
        ok({ template: entity(created), instanceCount: 7, todayInstanceCreated: true }),
      ),
    });
    const { api, runtime } = mountTaskComposable(() => useTaskTemplateMutations(), { service });
    const invalidate = vi.spyOn(runtime.dispatcher, 'invalidate');

    const result = await api.createTemplateSafe({ name: 'New' } as never);
    expect(result?.instanceCount).toBe(7);
    expect(result?.todayInstanceCreated).toBe(true);
    expect(result?.template.toDTO().id).toBe('template-new');
    expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({ target: 'task-template', source: 'mutation' }),
    );
  });

  it('single delete removes the item from cache after server confirmation and invalidates detail', async () => {
    const tpl = template();
    const service = makeService({
      deleteTemplate: vi.fn().mockResolvedValue(ok(undefined)),
    });
    const { api, runtime } = mountTaskComposable(() => useTaskTemplateMutations(), { service });

    const listKey = taskTemplateQueryKeys.list(SCOPE, { page: 1, limit: 20 });
    const detailKey = taskTemplateQueryKeys.detail(SCOPE, tpl.id);
    runtime.queryClient.setQueryData(listKey, { templates: [tpl], total: 1 });
    runtime.queryClient.setQueryData(detailKey, tpl);
    const invalidate = vi.spyOn(runtime.dispatcher, 'invalidate');

    const deleted = await api.deleteTemplateSafe(tpl.id);
    expect(deleted).toBe(true);
    const remaining = (runtime.queryClient.getQueryData(listKey) as {
      templates: TaskTemplateClientDTO[];
    }).templates;
    expect(remaining.some((t) => t.id === tpl.id)).toBe(false);
    expect(runtime.queryClient.getQueryData(detailKey)).toBeUndefined();
    expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({ target: 'task-template', source: 'mutation', entityId: tpl.id }),
    );
  });

  it('batch delete preserves partial success (first failure stops, confirmed removals stay)', async () => {
    const first = template();
    const second = template({ id: 'template-2' as TaskTemplateClientDTO['id'] });
    const service = makeService({
      deleteTemplate: vi
        .fn()
        .mockResolvedValueOnce(ok(undefined))
        .mockResolvedValueOnce(fail({ code: 'VALIDATION_ERROR', message: 'Cannot delete' })),
    });
    const { api, runtime } = mountTaskComposable(() => useTaskTemplateMutations(), { service });

    const listKey = taskTemplateQueryKeys.list(SCOPE, { page: 1, limit: 20 });
    runtime.queryClient.setQueryData(listKey, { templates: [first, second], total: 2 });

    const deleted = await api.deleteTemplatesSafe([first.id, second.id]);
    expect(deleted).toBe(false);
    expect(service.deleteTemplate).toHaveBeenCalledTimes(2);
    const remaining = (runtime.queryClient.getQueryData(listKey) as {
      templates: TaskTemplateClientDTO[];
    }).templates;
    // First confirmed removal stays gone; the failed second item is restored by invalidation.
    expect(remaining.some((t) => t.id === first.id)).toBe(false);
  });
});
