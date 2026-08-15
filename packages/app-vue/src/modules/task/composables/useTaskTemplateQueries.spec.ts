import { afterEach, describe, expect, it, vi } from 'vitest';
import { fail, ok } from '@memoflow/contracts/result';
import type { TaskTemplateClientDTO } from '@memoflow/contracts/task';
import { createServerStateRuntime } from '../../../platform/server-state';
import { mountTaskComposable } from './taskQueryTestUtils';
import { useTaskTemplateGraphQuery } from './useTaskTemplateGraphQuery';
import { useTaskTemplateListQuery } from './useTaskTemplateListQuery';
import { useTaskTemplateDetailQuery } from './useTaskTemplateDetailQuery';

function template(overrides: Partial<TaskTemplateClientDTO> = {}): TaskTemplateClientDTO {
  return {
    id: 'template-1' as TaskTemplateClientDTO['id'],
    name: 'Write tests',
    status: 'Active',
    ...overrides,
  } as TaskTemplateClientDTO;
}

function entity(dto: TaskTemplateClientDTO) {
  return { toDTO: () => dto };
}

function makeService() {
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
  };
}

describe('useTaskTemplateGraphQuery (management projection)', () => {
  afterEach(() => vi.useRealTimers());

  it('keeps list / detail / graph keys isolated and dedupes same-key concurrent consumers', async () => {
    const service = makeService();
    const tpl = template();
    service.getTaskGraph.mockResolvedValue(
      ok({ templates: [entity(tpl)], dependencies: [], total: 1 }),
    );
    service.getTemplate.mockResolvedValue(ok(entity(tpl)));
    const { api: graph, runtime } = mountTaskComposable(() => useTaskTemplateGraphQuery(), {
      service,
    });
    const { api: list } = mountTaskComposable(() => useTaskTemplateListQuery(), { service, runtime });
    const { api: detail } = mountTaskComposable(
      () => useTaskTemplateDetailQuery(() => 'template-1'),
      { service, runtime },
    );

    await vi.waitFor(() => expect(graph.isLoading.value).toBe(false));
    await vi.waitFor(() => expect(list.isLoading.value).toBe(false));
    await vi.waitFor(() => expect(detail.isLoading.value).toBe(false));

    expect(service.getTaskGraph).toHaveBeenCalledTimes(1);
    expect(service.listTemplates).toHaveBeenCalledTimes(1);
    expect(service.getTemplate).toHaveBeenCalledTimes(1);
    expect(graph.templates.value).toHaveLength(1);
    expect(detail.currentTemplate.value?.id).toBe('template-1');
  });

  it('does not refetch within the 60s stale window on remount', async () => {
    vi.useFakeTimers();
    const service = makeService();
    service.getTaskGraph.mockResolvedValue(ok({ templates: [], dependencies: [], total: 0 }));
    const runtime = createServerStateRuntime('web');

    const first = mountTaskComposable(() => useTaskTemplateGraphQuery(), { service, runtime });
    await vi.waitFor(() => expect(first.api.isLoading.value).toBe(false));
    expect(service.getTaskGraph).toHaveBeenCalledTimes(1);

    const second = mountTaskComposable(() => useTaskTemplateGraphQuery(), { service, runtime });
    await vi.waitFor(() => expect(second.api.isLoading.value).toBe(false));
    expect(service.getTaskGraph).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(61_000);
    const third = mountTaskComposable(() => useTaskTemplateGraphQuery(), { service, runtime });
    await vi.waitFor(() => expect(third.api.isLoading.value).toBe(false));
    expect(service.getTaskGraph).toHaveBeenCalledTimes(2);
  });

  it('preserves previous data and surfaces a translated error on refetch failure', async () => {
    const service = makeService();
    const tpl = template();
    service.getTaskGraph
      .mockResolvedValueOnce(ok({ templates: [entity(tpl)], dependencies: [], total: 1 }))
      .mockResolvedValueOnce(
        fail({ code: 'VALIDATION_ERROR', message: 'Backend failure' }),
      );
    const { api } = mountTaskComposable(() => useTaskTemplateGraphQuery(), { service });

    await vi.waitFor(() => expect(api.isLoading.value).toBe(false));
    expect(api.templates.value).toHaveLength(1);

    await api.refetch();
    await vi.waitFor(() => expect(api.error.value).toBeTruthy());

    expect(api.templates.value).toHaveLength(1);
    expect(api.error.value).toBe('Please check your input');
  });

  it('isolates caches by identity scope', async () => {
    const service = makeService();
    service.getTaskGraph.mockResolvedValue(ok({ templates: [], dependencies: [], total: 0 }));
    const { api: a, runtime } = mountTaskComposable(() => useTaskTemplateGraphQuery(), {
      service,
      identityScope: 'identity-a',
    });
    const { api: b } = mountTaskComposable(() => useTaskTemplateGraphQuery(), {
      service,
      runtime,
      identityScope: 'identity-b',
    });

    await vi.waitFor(() => expect(a.isLoading.value).toBe(false));
    await vi.waitFor(() => expect(b.isLoading.value).toBe(false));

    expect(service.getTaskGraph).toHaveBeenCalledTimes(2);
  });

  it('refetches once after an active invalidation and only marks inactive stale', async () => {
    const service = makeService();
    service.getTaskGraph.mockResolvedValue(ok({ templates: [], dependencies: [], total: 0 }));
    const { api, runtime } = mountTaskComposable(() => useTaskTemplateGraphQuery(), { service });

    await vi.waitFor(() => expect(api.isLoading.value).toBe(false));
    const calls = service.getTaskGraph.mock.calls.length;

    await runtime.dispatcher.invalidate({
      target: 'task-template',
      identityScope: 'identity-1',
      source: 'mutation',
    });
    await vi.waitFor(() => expect(service.getTaskGraph.mock.calls.length).toBe(calls + 1));
  });
});

describe('useTaskTemplateDetailQuery', () => {
  afterEach(() => vi.useRealTimers());

  it('stays disabled (currentTemplate null) when the id is missing or "new"', async () => {
    const service = makeService();
    service.getTemplate.mockResolvedValue(ok(entity(template())));
    const { api: missing } = mountTaskComposable(
      () => useTaskTemplateDetailQuery(() => null),
      { service },
    );
    const { api: creating } = mountTaskComposable(
      () => useTaskTemplateDetailQuery(() => 'new'),
      { service },
    );

    await Promise.resolve();
    expect(missing.currentTemplate.value).toBeNull();
    expect(creating.currentTemplate.value).toBeNull();
    expect(service.getTemplate).not.toHaveBeenCalled();
  });

  it('fetches the detail once for a stable id and switches keys when the id changes', async () => {
    const service = makeService();
    service.getTemplate.mockResolvedValue(ok(entity(template())));
    const { api, runtime } = mountTaskComposable(
      () => useTaskTemplateDetailQuery(() => 'template-1'),
      { service },
    );

    await vi.waitFor(() => expect(api.isLoading.value).toBe(false));
    expect(service.getTemplate).toHaveBeenCalledTimes(1);
    expect(api.currentTemplate.value?.id).toBe('template-1');

    const second = mountTaskComposable(
      () => useTaskTemplateDetailQuery(() => 'template-2'),
      { service, runtime },
    );
    await vi.waitFor(() => expect(second.api.isLoading.value).toBe(false));
    expect(service.getTemplate).toHaveBeenCalledTimes(2);
  });
});
