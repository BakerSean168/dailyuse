/**
 * useGovernanceDetailQuery — identity-scoped Governance rule detail query.
 *
 * 规则详情用 detail(id) key；相同 key 的并发 consumer 共享一次 request。无 id 时 query 不启用。
 */

import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { unwrap } from '@memoflow/contracts/result';
import type { RuleClientDTO } from '@memoflow/contracts/governance';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { RULE_SERVICE_KEY } from '../../../di/keys';
import { useServerStateIdentityScope } from '../../../platform/server-state';
import { governanceQueryKeys } from '../../../platform/server-state/query-keys';
import { translateResultError } from '../../../shared/utils/translate-result-error';
import { GOVERNANCE_STALE_TIME_MS } from '../../../platform/server-state/query-policy';

/**
 * Create the identity-scoped Governance rule detail query for a (reactive) id.
 * 为（响应式）id 创建 identity-scoped 治理规则详情查询。
 */
export function useGovernanceDetailQuery(id: MaybeRefOrGetter<string | undefined | null>) {
  const service = useStrictInject(RULE_SERVICE_KEY, 'GovernanceService');
  const resolveIdentityScope = useServerStateIdentityScope();
  const { t } = useI18n();

  const query = useQuery(() => {
    const ruleId = toValue(id);
    const enabled = !!ruleId;
    return {
      queryKey: governanceQueryKeys.detail(resolveIdentityScope(), ruleId ?? ''),
      queryFn: async () => {
        const result = await service.getRule({ id: ruleId as RuleClientDTO['id'] });
        const dto = unwrap(result);
        return dto;
      },
      enabled,
      staleTime: GOVERNANCE_STALE_TIME_MS,
    };
  });

  const currentRule = computed<RuleClientDTO | null>(() => query.data.value ?? null);
  const isLoading = computed(() => query.isPending.value);
  const isError = computed(() => query.isError.value);
  const error = computed(() =>
    query.error.value
      ? translateResultError(query.error.value, t, {
          fallbackKey: 'governance.error.loadRuleFailed',
        })
      : null,
  );

  return {
    query,
    currentRule,
    isLoading,
    isError,
    error,
    refetch: query.refetch,
  };
}
