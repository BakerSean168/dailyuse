/**
 * useGovernanceMutations — Governance rule server-state mutations (pilot authority).
 *
 * 全部 mutation 只操作 Query Cache（plan §3.4）：
 * - create / update / delete：**server-confirmed**；成功后用 server-returned DTO patch 已缓存
 *   list/detail，onSettled 经 dispatcher invalidate（组件不再手动 refresh）。
 * - 网络失败经 runtime `networkMode: 'always'` + `retry:0` 立即进入 onError。
 */

import { computed } from 'vue';
import { useMutation } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { unwrap } from '@memoflow/contracts/result';
import type { CreateRuleReq, UpdateRuleReq } from '@memoflow/contracts/governance';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { RULE_SERVICE_KEY } from '../../../di/keys';
import { useServerStateIdentityScope, useServerStateRuntime } from '../../../platform/server-state';
import { createComposableHandleError } from '../../../shared/utils/create-composable-handle-error';
import { patchRuleFromServer, removeRuleFromCache } from './governanceCache';

/**
 * Create the Governance rule mutation set (create/update/delete).
 * 创建治理规则 mutation 集合（新增/更新/删除）。
 */
export function useGovernanceMutations() {
  const service = useStrictInject(RULE_SERVICE_KEY, 'GovernanceService');
  const runtime = useServerStateRuntime();
  const resolveIdentityScope = useServerStateIdentityScope();
  const { t } = useI18n();

  const handleError = createComposableHandleError({
    t,
    setError: () => {},
  });

  const createRule = useMutation({
    mutationFn: async (req: CreateRuleReq) => {
      const result = await service.createRule(req);
      return unwrap(result);
    },
    onMutate: () => ({ identityScope: resolveIdentityScope() }),
    onSuccess: (rule, _vars, context) => {
      patchRuleFromServer(runtime.queryClient, context!.identityScope, rule);
    },
    onSettled: (_data, error, _vars, context) => {
      if (error) handleError(error, 'governance.error.createRuleFailed');
      void runtime.dispatcher.invalidate({
        target: 'governance',
        identityScope: context!.identityScope,
        source: 'mutation',
      });
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, req }: { id: string; req: UpdateRuleReq }) => {
      const result = await service.updateRule(id, req);
      return unwrap(result);
    },
    onMutate: () => ({ identityScope: resolveIdentityScope() }),
    onSuccess: (rule, _vars, context) => {
      patchRuleFromServer(runtime.queryClient, context!.identityScope, rule);
    },
    onSettled: (_data, error, vars, context) => {
      if (error) handleError(error, 'governance.error.updateRuleFailed');
      void runtime.dispatcher.invalidate({
        target: 'governance',
        identityScope: context!.identityScope,
        source: 'mutation',
        entityId: vars.id,
      });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const result = await service.deleteRule({ id: id as never });
      unwrap(result);
      return id;
    },
    onMutate: () => ({ identityScope: resolveIdentityScope() }),
    onSuccess: (id, _vars, context) => {
      removeRuleFromCache(runtime.queryClient, context!.identityScope, id);
    },
    onSettled: (_data, error, id, context) => {
      if (error) handleError(error, 'governance.error.deleteRuleFailed');
      void runtime.dispatcher.invalidate({
        target: 'governance',
        identityScope: context!.identityScope,
        source: 'mutation',
        entityId: id,
      });
    },
  });

  return {
    createRule,
    updateRule,
    deleteRule,
    isMutating: computed(
      () => createRule.isPending.value || updateRule.isPending.value || deleteRule.isPending.value,
    ),
  };
}
