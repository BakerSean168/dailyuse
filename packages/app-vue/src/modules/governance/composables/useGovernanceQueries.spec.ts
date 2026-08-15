import { afterEach, describe, expect, it, vi } from 'vitest';
import { fail, ok } from '@memoflow/contracts/result';
import type { RuleClientDTO } from '@memoflow/contracts/governance';
import { governanceQueryKeys } from '../../../platform/server-state/query-keys';
import { mountGovernanceComposable } from './governanceQueryTestUtils';
import { useGovernanceListQuery } from './useGovernanceListQuery';
import { useGovernanceDetailQuery } from './useGovernanceDetailQuery';
import { useGovernanceRevisionsQuery } from './useGovernanceRevisionsQuery';
import { useGovernanceMutations } from './useGovernanceMutations';

const SCOPE = 'identity-1';

function rule(overrides: Partial<RuleClientDTO> = {}): RuleClientDTO {
  return {
    id: 'RuleId_00000000-0000-0000-0000-000000000001' as RuleClientDTO['id'],
    code: 'GOV-001',
    title: 'Prefer intentional boundaries',
    description: 'Use module boundaries and explicit contracts.',
    severity: 'Mandatory',
    status: 'Active',
    deprecationReason: null,
    replacementRuleId: null,
    liveReferenceLocation: null,
    tags: [{ value: 'architecture' }],
    goodExamples: [],
    badExamples: [],
    authorId: 'user-1' as RuleClientDTO['authorId'],
    createdAt: 1741910400000,
    updatedAt: 1741914000000,
    ...overrides,
  };
}

function makeService(overrides: Record<string, ReturnType<typeof vi.fn>> = {}) {
  return {
    listRules: vi.fn(),
    searchRules: vi.fn(),
    getRule: vi.fn(),
    getRevisions: vi.fn(),
    createRule: vi.fn(),
    updateRule: vi.fn(),
    deleteRule: vi.fn(),
    ...overrides,
  };
}

describe('useGovernanceListQuery (pilot authority)', () => {
  afterEach(() => vi.useRealTimers());

  it('fetches once and dedupes same-key concurrent consumers', async () => {
    const service = makeService({
      listRules: vi
        .fn()
        .mockResolvedValue(ok({ items: [rule()], total: 1, page: 1, pageSize: 20 })),
    });
    const { api: first, runtime } = mountGovernanceComposable(() => useGovernanceListQuery(), {
      service,
    });
    const { api: second } = mountGovernanceComposable(() => useGovernanceListQuery(), {
      service,
      runtime,
    });

    await vi.waitFor(() => expect(first.isLoading.value).toBe(false));
    await vi.waitFor(() => expect(second.isLoading.value).toBe(false));

    expect(service.listRules).toHaveBeenCalledTimes(1);
    expect(first.rules.value).toHaveLength(1);
    expect(second.rules.value).toHaveLength(1);
  });

  it('routes search query to searchRules under the same canonical list key', async () => {
    const service = makeService({
      searchRules: vi
        .fn()
        .mockResolvedValue(ok({ items: [rule()], total: 1, page: 1, pageSize: 20 })),
    });
    const { api } = mountGovernanceComposable(
      () => useGovernanceListQuery({ params: { search: 'boundary' } }),
      { service },
    );

    await vi.waitFor(() => expect(api.isLoading.value).toBe(false));
    expect(service.searchRules).toHaveBeenCalledTimes(1);
    expect(service.listRules).not.toHaveBeenCalled();
    expect(api.rules.value).toHaveLength(1);
  });

  it('isolates caches by identity scope', async () => {
    const service = makeService({
      listRules: vi.fn().mockResolvedValue(ok({ items: [], total: 0, page: 1, pageSize: 20 })),
    });
    const { api: a, runtime } = mountGovernanceComposable(() => useGovernanceListQuery(), {
      service,
      identityScope: 'identity-a',
    });
    const { api: b } = mountGovernanceComposable(() => useGovernanceListQuery(), {
      service,
      runtime,
      identityScope: 'identity-b',
    });

    await vi.waitFor(() => expect(a.isLoading.value).toBe(false));
    await vi.waitFor(() => expect(b.isLoading.value).toBe(false));

    expect(service.listRules).toHaveBeenCalledTimes(2);
  });
});

describe('useGovernanceDetailQuery', () => {
  it('fetches the detail once and stays disabled without an id', async () => {
    const service = makeService({
      getRule: vi.fn().mockResolvedValue(ok(rule())),
    });
    const { api: missing } = mountGovernanceComposable(() => useGovernanceDetailQuery(() => null), {
      service,
    });
    const { api: detail } = mountGovernanceComposable(
      () => useGovernanceDetailQuery(() => rule().id),
      { service },
    );

    await Promise.resolve();
    expect(missing.currentRule.value).toBeNull();
    await vi.waitFor(() => expect(detail.isLoading.value).toBe(false));
    expect(service.getRule).toHaveBeenCalledTimes(1);
    expect(detail.currentRule.value?.id).toBe(rule().id);
  });
});

describe('useGovernanceRevisionsQuery', () => {
  it('fetches revisions for the rule id', async () => {
    const service = makeService({
      getRevisions: vi
        .fn()
        .mockResolvedValue(
          ok({ items: [{ id: 'rev-1', ruleId: rule().id }], total: 1, page: 1, pageSize: 50 }),
        ),
    });
    const { api } = mountGovernanceComposable(() => useGovernanceRevisionsQuery(() => rule().id), {
      service,
    });

    await vi.waitFor(() => expect(api.isLoading.value).toBe(false));
    expect(service.getRevisions).toHaveBeenCalledTimes(1);
    expect(api.revisions.value).toHaveLength(1);
  });
});

describe('useGovernanceMutations (plan §3.4 server-confirmed patch / invalidate)', () => {
  it('create success seeds the detail key and invalidates via dispatcher', async () => {
    const created = rule({
      id: 'RuleId_00000000-0000-0000-0000-000000000099' as RuleClientDTO['id'],
      code: 'GOV-099',
    });
    const service = makeService({ createRule: vi.fn().mockResolvedValue(ok(created)) });
    const { api, runtime } = mountGovernanceComposable(() => useGovernanceMutations(), { service });

    const listKey = governanceQueryKeys.list(SCOPE, { page: 1, pageSize: 20 });
    runtime.queryClient.setQueryData(listKey, { items: [], total: 0 });
    const invalidate = vi.spyOn(runtime.dispatcher, 'invalidate');

    await api.createRule.mutateAsync({ title: 'New' } as never);

    // Plan §3.4: create seeds the detail from the server response; lists repopulate via
    // the dispatcher invalidation onSettled.
    expect(
      runtime.queryClient.getQueryData(governanceQueryKeys.detail(SCOPE, created.id))?.id,
    ).toBe(created.id);
    expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({ target: 'governance', identityScope: SCOPE, source: 'mutation' }),
    );
  });

  it('update success patches the cached entry and invalidates detail', async () => {
    const existing = rule();
    const updated = rule({ title: 'Renamed rule' });
    const service = makeService({ updateRule: vi.fn().mockResolvedValue(ok(updated)) });
    const { api, runtime } = mountGovernanceComposable(() => useGovernanceMutations(), { service });

    const listKey = governanceQueryKeys.list(SCOPE, { page: 1, pageSize: 20 });
    runtime.queryClient.setQueryData(listKey, { items: [existing], total: 1 });
    const invalidate = vi.spyOn(runtime.dispatcher, 'invalidate');

    await api.updateRule.mutateAsync({ id: existing.id, req: { title: 'Renamed rule' } as never });

    const listData = runtime.queryClient.getQueryData(listKey) as { items: RuleClientDTO[] };
    expect(listData.items[0].title).toBe('Renamed rule');
    expect(
      runtime.queryClient.getQueryData(governanceQueryKeys.detail(SCOPE, existing.id))?.title,
    ).toBe('Renamed rule');
    expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({
        target: 'governance',
        identityScope: SCOPE,
        source: 'mutation',
        entityId: existing.id,
      }),
    );
  });

  it('delete success removes the item from the list + detail', async () => {
    const existing = rule();
    const service = makeService({ deleteRule: vi.fn().mockResolvedValue(ok(null)) });
    const { api, runtime } = mountGovernanceComposable(() => useGovernanceMutations(), { service });

    const listKey = governanceQueryKeys.list(SCOPE, { page: 1, pageSize: 20 });
    runtime.queryClient.setQueryData(listKey, { items: [existing], total: 1 });
    runtime.queryClient.setQueryData(governanceQueryKeys.detail(SCOPE, existing.id), existing);

    await api.deleteRule.mutateAsync(existing.id);

    const listData = runtime.queryClient.getQueryData(listKey) as { items: RuleClientDTO[] };
    expect(listData.items.some((r) => r.id === existing.id)).toBe(false);
    expect(
      runtime.queryClient.getQueryData(governanceQueryKeys.detail(SCOPE, existing.id)),
    ).toBeUndefined();
  });

  it('resolves identityScope at mutation begin and never at completion (P1-2)', async () => {
    const updated = rule({ title: 'Confirmed' });
    const service = makeService({ updateRule: vi.fn().mockResolvedValue(ok(updated)) });
    const { api, runtime } = mountGovernanceComposable(() => useGovernanceMutations(), { service });

    const listKey = governanceQueryKeys.list(SCOPE, { page: 1, pageSize: 20 });
    runtime.queryClient.setQueryData(listKey, { items: [rule()], total: 1 });
    const invalidate = vi.spyOn(runtime.dispatcher, 'invalidate');

    await api.updateRule.mutateAsync({ id: rule().id, req: {} as never });

    expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({ identityScope: SCOPE, target: 'governance' }),
    );
    expect(
      runtime.queryClient.getQueryData(governanceQueryKeys.detail(SCOPE, rule().id))?.title,
    ).toBe('Confirmed');
  });

  it('create failure leaves the cache untouched but still dispatches an invalidation', async () => {
    const service = makeService({
      createRule: vi.fn().mockResolvedValue(fail({ code: 'VALIDATION_ERROR', message: 'nope' })),
    });
    const { api, runtime } = mountGovernanceComposable(() => useGovernanceMutations(), { service });

    const listKey = governanceQueryKeys.list(SCOPE, { page: 1, pageSize: 20 });
    runtime.queryClient.setQueryData(listKey, { items: [], total: 0 });
    const invalidate = vi.spyOn(runtime.dispatcher, 'invalidate');

    await expect(api.createRule.mutateAsync({ title: 'New' } as never)).rejects.toBeTruthy();

    expect(runtime.queryClient.getQueryData(listKey)).toMatchObject({ items: [], total: 0 });
    expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({ target: 'governance', source: 'mutation' }),
    );
  });
});
