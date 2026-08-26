import { afterEach, describe, expect, it, vi } from 'vitest';
import { ok } from '@memoflow/contracts/result';
import type { TaskTemplateClientDTO } from '@memoflow/contracts/task';
import { createServerStateRuntime } from '../../../platform/server-state';
import { mountTaskComposable } from './taskQueryTestUtils';
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
    getTemplate: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    activateTemplate: vi.fn(),
    pauseTemplate: vi.fn(),
    archiveTemplate: vi.fn(),
  };
}

describe('useTaskTemplateListQuery', () => {
  afterEach(() => vi.useRealTimers());

  it('fetches the flat Task Plan list and dedupes same-key consumers', async () => {
    const service = makeService();
    service.listTemplates.mockResolvedValue(ok({ templates: [entity(template())], total: 1 }));
    const runtime = createServerStateRuntime('web');
    const first = mountTaskComposable(() => useTaskTemplateListQuery({ page: 1, limit: 20 }), {
      service,
      runtime,
    });
    const second = mountTaskComposable(() => useTaskTemplateListQuery({ page: 1, limit: 20 }), {
      service,
      runtime,
    });

    await vi.waitFor(() => expect(first.api.isLoading.value).toBe(false));
    await vi.waitFor(() => expect(second.api.isLoading.value).toBe(false));
    expect(service.listTemplates).toHaveBeenCalledTimes(1);
    expect(first.api.templates.value).toHaveLength(1);
    expect(first.api.total.value).toBe(1);
  });

  it('isolates the Task Plan list cache by identity scope', async () => {
    const service = makeService();
    service.listTemplates.mockResolvedValue(ok({ templates: [], total: 0 }));
    const runtime = createServerStateRuntime('web');
    const a = mountTaskComposable(() => useTaskTemplateListQuery({ page: 1, limit: 20 }), {
      service,
      runtime,
      identityScope: 'identity-a',
    });
    const b = mountTaskComposable(() => useTaskTemplateListQuery({ page: 1, limit: 20 }), {
      service,
      runtime,
      identityScope: 'identity-b',
    });
    await vi.waitFor(() => expect(a.api.isLoading.value).toBe(false));
    await vi.waitFor(() => expect(b.api.isLoading.value).toBe(false));
    expect(service.listTemplates).toHaveBeenCalledTimes(2);
  });
});

describe('useTaskTemplateDetailQuery', () => {
  afterEach(() => vi.useRealTimers());

  it('stays disabled when the id is missing or "new"', async () => {
    const service = makeService();
    service.getTemplate.mockResolvedValue(ok(entity(template())));
    const missing = mountTaskComposable(() => useTaskTemplateDetailQuery(() => null), { service });
    const creating = mountTaskComposable(() => useTaskTemplateDetailQuery(() => 'new'), { service });
    await Promise.resolve();
    expect(missing.api.currentTemplate.value).toBeNull();
    expect(creating.api.currentTemplate.value).toBeNull();
    expect(service.getTemplate).not.toHaveBeenCalled();
  });

  it('fetches detail once for a stable id and isolates a different id', async () => {
    const service = makeService();
    service.getTemplate.mockResolvedValue(ok(entity(template())));
    const first = mountTaskComposable(() => useTaskTemplateDetailQuery(() => 'template-1'), { service });
    await vi.waitFor(() => expect(first.api.isLoading.value).toBe(false));
    expect(service.getTemplate).toHaveBeenCalledTimes(1);
    expect(first.api.currentTemplate.value?.id).toBe('template-1');

    const second = mountTaskComposable(() => useTaskTemplateDetailQuery(() => 'template-2'), {
      service,
      runtime: first.runtime,
    });
    await vi.waitFor(() => expect(second.api.isLoading.value).toBe(false));
    expect(service.getTemplate).toHaveBeenCalledTimes(2);
  });
});
