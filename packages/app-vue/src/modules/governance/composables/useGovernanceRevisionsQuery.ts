/**
 * useGovernanceRevisionsQuery — identity-scoped Governance rule revisions query.
 *
 * 规则修订历史用 revision(ruleId) key；相同 key 的并发 consumer 共享一次 request。
 */

import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { unwrap } from '@memoflow/contracts/result';
import type { RuleRevisionClientDTO } from '@memoflow/contracts/governance';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { RULE_SERVICE_KEY } from '../../../di/keys';
import { useServerStateIdentityScope } from '../../../platform/server-state';
import { governanceQueryKeys } from '../../../platform/server-state/query-keys';
import { translateResultError } from '../../../shared/utils/translate-result-error';
import { GOVERNANCE_STALE_TIME_MS } from '../../../platform/server-state/query-policy';

/**
 * Create the identity-scoped Governance rule revisions query for a (reactive) rule id.
 * 为（响应式）规则 id 创建 identity-scoped 治理修订历史查询。
 */
export function useGovernanceRevisionsQuery(ruleId: MaybeRefOrGetter<string | undefined | null>) {
  const service = useStrictInject(RULE_SERVICE_KEY, 'GovernanceService');
  const resolveIdentityScope = useServerStateIdentityScope();
  const { t } = useI18n();

  const query = useQuery(() => {
    const revisionRuleId = toValue(ruleId);
    const enabled = !!revisionRuleId;
    return {
      queryKey: governanceQueryKeys.revisions(resolveIdentityScope(), revisionRuleId ?? ''),
      queryFn: async () => {
        const result = await service.getRevisions({
          ruleId: revisionRuleId as RuleRevisionClientDTO['ruleId'],
          page: 1,
          pageSize: 50,
        });
        const data = unwrap(result);
        return {
          items: data.items as RuleRevisionClientDTO[],
          total: data.total ?? 0,
        };
      },
      enabled,
      staleTime: GOVERNANCE_STALE_TIME_MS,
    };
  });

  const revisions = computed<RuleRevisionClientDTO[]>(() => query.data.value?.items ?? []);
  const isLoading = computed(() => query.isPending.value);
  const isError = computed(() => query.isError.value);
  const error = computed(() =>
    query.error.value
      ? translateResultError(query.error.value, t, {
          fallbackKey: 'governance.error.loadRevisionFailed',
        })
      : null,
  );

  return {
    query,
    revisions,
    isLoading,
    isError,
    error,
    refetch: query.refetch,
  };
}
