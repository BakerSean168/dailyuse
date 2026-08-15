/**
 * useTaskTemplateListQuery — Task template list query (Daily widget / calendar / capsule).
 *
 * template list 用独立 list key，与 management 的 graph key、detail 的 detail key 互不覆盖。
 * 支持 static/ref/getter params，供命令式 facade（`useTask().fetchTemplates(params)`）复用。
 */

import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { unwrap } from '@memoflow/contracts/result';
import type { TaskTemplateClientDTO } from '@memoflow/contracts/task';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { TASK_SERVICE_KEY } from '../../../di/keys';
import { useServerStateIdentityScope } from '../../../platform/server-state';
import {
  canonicalizeTaskTemplateListQuery,
  taskTemplateQueryKeys,
  type TaskTemplateListQueryInput,
} from '../../../platform/server-state/query-keys';
import { TASK_TEMPLATE_STALE_TIME_MS } from '../../../platform/server-state/query-policy';
import { translateResultError } from '../../../shared/utils/translate-result-error';
import { sanitizeForIpc } from '../../../shared/utils/ipc';

/** Options for the Task template list query. 任务模板列表查询选项。 */
export type UseTaskTemplateListQueryOptions = TaskTemplateListQueryInput;

/** Options for the Task template list query composable. 列表查询 composable 选项。 */
export interface UseTaskTemplateListQueryComposableOptions {
  /** Query params (static/ref/getter). 查询参数（静态/ref/getter）。 */
  params?: MaybeRefOrGetter<UseTaskTemplateListQueryOptions>;
  /**
   * Whether the query is enabled. Defaults to true; `useTask()` keeps it false until
   * `fetchTemplates(params)` is requested so no default `limit:20` fetch fires early (P2-4).
   * 查询是否启用。默认 true；`useTask()` 在 `fetchTemplates(params)` 被请求前保持 false，
   * 避免过早发起默认 `limit:20` 请求（P2-4）。
   */
  enabled?: MaybeRefOrGetter<boolean>;
}

/**
 * Create the identity-scoped Task template list query.
 * 创建 identity-scoped 任务模板列表查询。
 */
export function useTaskTemplateListQuery(
  params: MaybeRefOrGetter<UseTaskTemplateListQueryOptions>,
): ReturnType<typeof useTaskTemplateListQueryImpl>;
export function useTaskTemplateListQuery(
  options?: UseTaskTemplateListQueryComposableOptions,
): ReturnType<typeof useTaskTemplateListQueryImpl>;
export function useTaskTemplateListQuery(
  paramsOrOptions?:
    MaybeRefOrGetter<UseTaskTemplateListQueryOptions> | UseTaskTemplateListQueryComposableOptions,
) {
  const options: UseTaskTemplateListQueryComposableOptions =
    paramsOrOptions !== null && typeof paramsOrOptions === 'object' && 'params' in paramsOrOptions
      ? (paramsOrOptions as UseTaskTemplateListQueryComposableOptions)
      : { params: paramsOrOptions as MaybeRefOrGetter<UseTaskTemplateListQueryOptions> };
  return useTaskTemplateListQueryImpl(options);
}

function useTaskTemplateListQueryImpl({
  params = {},
  enabled = true,
}: UseTaskTemplateListQueryComposableOptions) {
  const service = useStrictInject(TASK_SERVICE_KEY, 'TaskService');
  const resolveIdentityScope = useServerStateIdentityScope();
  const { t } = useI18n();

  const canonical = computed(() =>
    canonicalizeTaskTemplateListQuery({
      page: 1,
      limit: 20,
      ...toValue(params),
    }),
  );

  const query = useQuery(() => {
    const identityScope = resolveIdentityScope();
    const queryParams = canonical.value;
    return {
      queryKey: taskTemplateQueryKeys.list(identityScope, queryParams),
      queryFn: async () => {
        const result = await service.listTemplates(
          sanitizeForIpc(queryParams) as Parameters<typeof service.listTemplates>[0],
        );
        const data = unwrap(result);
        return {
          templates: (data.templates ?? []).map((template: { toDTO(): TaskTemplateClientDTO }) =>
            template.toDTO(),
          ),
          total: data.total ?? 0,
        };
      },
      staleTime: TASK_TEMPLATE_STALE_TIME_MS,
      enabled: toValue(enabled),
    };
  });

  const templates = computed<TaskTemplateClientDTO[]>(() => query.data.value?.templates ?? []);
  const total = computed(() => query.data.value?.total ?? 0);
  const isLoading = computed(() => query.isPending.value);
  const isError = computed(() => query.isError.value);
  const error = computed(() =>
    query.error.value
      ? translateResultError(query.error.value, t, {
          fallbackKey: 'task.error.loadTemplatesFailed',
        })
      : null,
  );

  return {
    query,
    templates,
    total,
    isLoading,
    isError,
    error,
    refetch: query.refetch,
  };
}
