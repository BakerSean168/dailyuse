/**
 * useGovernanceListQuery — identity-scoped Governance rule list query (pilot authority).
 *
 * 治理规则列表的唯一 renderer server-state authority 是 TanStack Query Cache；本 composable
 * 以 canonical list key 暴露规则列表 query，相同 key 的并发 consumer 共享一次 request。
 * Search 状态（store.searchQuery 非空）走 `searchRules`，否则走 `listRules`，二者共享同一
 * canonical list key（search 字段进入 key，因此搜索结果与普通列表天然隔离）。
 *
 * `page/pageSize/status/severity/tags/search` 缺省取自 Governance Pinia（保留 UI state）。
 */

import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { unwrap } from '@memoflow/contracts/result';
import type { RuleClientDTO } from '@memoflow/contracts/governance';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { RULE_SERVICE_KEY } from '../../../di/keys';
import { useServerStateIdentityScope } from '../../../platform/server-state';
import {
  canonicalizeGovernanceListQuery,
  governanceQueryKeys,
  type GovernanceListQueryInput,
} from '../../../platform/server-state/query-keys';
import { translateResultError } from '../../../shared/utils/translate-result-error';
import { GOVERNANCE_STALE_TIME_MS } from '../../../platform/server-state/query-policy';

/** Options for the Governance rule list query composable. 治理规则列表查询选项。 */
export interface UseGovernanceListQueryOptions {
  /** Query params (static/ref/getter). 查询参数（静态/ref/getter）。 */
  params?: MaybeRefOrGetter<GovernanceListQueryInput>;
}

/**
 * Create the identity-scoped Governance rule list query.
 * 创建 identity-scoped 治理规则列表查询。
 */
export function useGovernanceListQuery(options: UseGovernanceListQueryOptions = {}) {
  const service = useStrictInject(RULE_SERVICE_KEY, 'GovernanceService');
  const resolveIdentityScope = useServerStateIdentityScope();
  const { t } = useI18n();

  const canonical = computed(() => canonicalizeGovernanceListQuery(toValue(options.params)));

  const query = useQuery(() => {
    const identityScope = resolveIdentityScope();
    const queryParams = canonical.value;
    return {
      queryKey: governanceQueryKeys.list(identityScope, queryParams),
      queryFn: async () => {
        const { search, ...rest } = queryParams;
        const isSearch = typeof search === 'string' && search.length > 0;
        const result = isSearch
          ? await service.searchRules({ query: search, ...rest } as never)
          : await service.listRules(rest);
        const data = unwrap(result);
        return {
          items: data.items as RuleClientDTO[],
          total: data.total ?? 0,
        };
      },
      staleTime: GOVERNANCE_STALE_TIME_MS,
    };
  });

  const rules = computed<RuleClientDTO[]>(() => query.data.value?.items ?? []);
  const total = computed(() => query.data.value?.total ?? 0);
  const isLoading = computed(() => query.isPending.value);
  const isError = computed(() => query.isError.value);
  const error = computed(() =>
    query.error.value
      ? translateResultError(query.error.value, t, {
          fallbackKey: 'governance.error.loadListFailed',
        })
      : null,
  );

  return {
    query,
    rules,
    total,
    isLoading,
    isError,
    error,
    refetch: query.refetch,
  };
}
