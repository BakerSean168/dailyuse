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

  it('status mutation derives from the complete cached projection, not a bare {id,status} DTO', async () => {
    const tpl = template({ name: 'Full DTO', description: 'kept' });
    const service = makeService({
      pauseTemplate: vi.fn().mockResolvedValue(fail({ code: 'VALIDATION_ERROR', message: 'nope' })),
    });
    const { api, runtime } = mountTaskComposable(() => useTaskTemplateMutations(), { service });

    // Only the list entry is cached — no detail key. A bare `{id,status}` patch would have
    // clobbered the list entry's other fields; the implementation must derive from the
    // complete cached projection and roll back residue-free.
    const listKey = taskTemplateQueryKeys.list(SCOPE, { page: 1, limit: 20 });
    runtime.queryClient.setQueryData(listKey, { templates: [tpl], total: 1 });

    await api.pauseTemplateSafe(tpl.id);

    const listData = runtime.queryClient.getQueryData(listKey) as {
      templates: TaskTemplateClientDTO[];
    };
    // The list entry keeps its full projection after the failed mutation.
    expect(listData.templates[0].name).toBe('Full DTO');
    expect(listData.templates[0].description).toBe('kept');
    expect(listData.templates[0].status).toBe('Active');
  });

  it('rolls back a newly-created detail key (optimistic patch residue) when the mutation fails', async () => {
    const tpl = template();
    const service = makeService({
      updateTemplate: vi
        .fn()
        .mockResolvedValue(fail({ code: 'VALIDATION_ERROR', message: 'nope' })),
    });
    const { api, runtime } = mountTaskComposable(() => useTaskTemplateMutations(), { service });

    // Only the list entry is cached; no detail key exists before the mutation.
    const listKey = taskTemplateQueryKeys.list(SCOPE, { page: 1, limit: 20 });
    const detailKey = taskTemplateQueryKeys.detail(SCOPE, tpl.id);
    runtime.queryClient.setQueryData(listKey, { templates: [tpl], total: 1 });
    expect(runtime.queryClient.getQueryData(detailKey)).toBeUndefined();

    await api.updateTemplateSafe(tpl.id, { name: 'Broken' });

    // The optimistic patch may create a detail key, but a failed mutation must remove it.
    expect(runtime.queryClient.getQueryData(detailKey)).toBeUndefined();
  });

  it('create success keeps server-confirmed semantics (no fake id) and invalidates lists/graphs', async () => {
    const created = template({ id: 'template-new' as TaskTemplateClientDTO['id'] });
    const service = makeService({
      createTemplate: vi
        .fn()
        .mockResolvedValue(
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
    // Plan §3.4: create seeds the detail key from the server response.
    const detailKey = taskTemplateQueryKeys.detail(SCOPE, created.id);
    expect(runtime.queryClient.getQueryData(detailKey)?.id).toBe('template-new');
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
    const remaining = (
      runtime.queryClient.getQueryData(listKey) as {
        templates: TaskTemplateClientDTO[];
      }
    ).templates;
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
    const remaining = (
      runtime.queryClient.getQueryData(listKey) as {
        templates: TaskTemplateClientDTO[];
      }
    ).templates;
    // First confirmed removal stays gone; the failed second item is restored by invalidation.
    expect(remaining.some((t) => t.id === first.id)).toBe(false);
  });

  it('resolves identityScope at mutation begin and carries it through callbacks (P1-2)', async () => {
    const tpl = template();
    const service = makeService({
      updateTemplate: vi.fn().mockResolvedValue(ok(entity(template({ name: 'Confirmed' })))),
    });
    const { api, runtime } = mountTaskComposable(() => useTaskTemplateMutations(), { service });

    const detailKey = taskTemplateQueryKeys.detail(SCOPE, tpl.id);
    const listKey = taskTemplateQueryKeys.list(SCOPE, { page: 1, limit: 20 });
    runtime.queryClient.setQueryData(listKey, { templates: [tpl], total: 1 });
    const invalidate = vi.spyOn(runtime.dispatcher, 'invalidate');

    await api.updateTemplateSafe(tpl.id, { name: 'Renamed' });

    // The mutation patched and invalidated the begin-scope identity.
    expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({ identityScope: SCOPE, target: 'task-template' }),
    );
    expect(runtime.queryClient.getQueryData(detailKey)?.name).toBe('Confirmed');
    expect(runtime.queryClient.getQueryData(listKey)?.templates?.[0].name).toBe('Confirmed');
  });

  it('batch delete patches the mutation-begin identity cache, not the execution-time identity (P1-2)', async () => {
    const tpl = template();
    const service = makeService({
      deleteTemplate: vi.fn().mockResolvedValue(ok(undefined)),
    });
    // Model an identity switch between mutation begin (onMutate) and execution (mutationFn):
    // the resolver flips to a new identity on its second call. A mutationFn that re-resolves
    // the scope would remove from the execution-time identity (B) and leave A stale.
    let calls = 0;
    let currentIdentity = 'identity-a';
    const { api, runtime } = mountTaskComposable(() => useTaskTemplateMutations(), {
      service,
      identityScope: () => {
        calls += 1;
        if (calls > 1) currentIdentity = 'identity-b';
        return currentIdentity;
      },
    });

    const listKeyA = taskTemplateQueryKeys.list('identity-a', { page: 1, limit: 20 });
    const listKeyB = taskTemplateQueryKeys.list('identity-b', { page: 1, limit: 20 });
    runtime.queryClient.setQueryData(listKeyA, { templates: [tpl], total: 1 });
    runtime.queryClient.setQueryData(listKeyB, { templates: [tpl], total: 1 });

    await api.deleteTemplatesSafe([tpl.id]);

    // The begin-scope identity (A) cache is patched; the execution-time identity (B) is untouched.
    const remainingA = runtime.queryClient.getQueryData(listKeyA) as {
      templates: TaskTemplateClientDTO[];
    };
    expect(remainingA.templates.some((t) => t.id === tpl.id)).toBe(false);
    const remainingB = runtime.queryClient.getQueryData(listKeyB) as {
      templates: TaskTemplateClientDTO[];
    };
    expect(remainingB.templates.some((t) => t.id === tpl.id)).toBe(true);
  });
});
