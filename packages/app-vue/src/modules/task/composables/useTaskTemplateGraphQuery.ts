/**
 * useTaskTemplateGraphQuery — Task template graph projection (management + detail views).
 *
 * 管理主流程使用 graph query（templates + dependencies 同一 projection）；graph key 按
 * canonical params 隔离，相同 key 的并发 consumer 共享一次 request。query 数据只保留 plain
 * DTO projection，不写回 Pinia（§2.2 / §3.6）。
 */

import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { unwrap } from '@memoflow/contracts/result';
import type { TaskGraphDependencyDTO } from '@memoflow/contracts/task';
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
import type { TaskTemplateClientDTO } from '@memoflow/contracts/task';

/** Options for the Task template graph query. 任务模板图查询选项。 */
export interface UseTaskTemplateGraphQueryOptions extends TaskTemplateListQueryInput {}

/** Params input: static object, ref, or getter. 参数输入：静态对象 / ref / getter。 */
export type TaskTemplateQueryParamsInput = MaybeRefOrGetter<UseTaskTemplateGraphQueryOptions>;

/**
 * Create the identity-scoped Task template graph query (templates + dependencies projection).
 * 创建 identity-scoped 任务模板图查询（templates + dependencies 同一 projection）。
 */
export function useTaskTemplateGraphQuery(params: TaskTemplateQueryParamsInput = {}) {
  const service = useStrictInject(TASK_SERVICE_KEY, 'TaskService');
  const resolveIdentityScope = useServerStateIdentityScope();
  const { t } = useI18n();

  const canonical = computed(() =>
    canonicalizeTaskTemplateListQuery({
      page: 1,
      limit: 1000,
      ...toValue(params),
    }),
  );

  const query = useQuery(() => {
    const identityScope = resolveIdentityScope();
    const queryParams = canonical.value;
    return {
      queryKey: taskTemplateQueryKeys.graph(identityScope, queryParams),
      queryFn: async () => {
        const result = await service.getTaskGraph(
          sanitizeForIpc(queryParams) as Parameters<typeof service.getTaskGraph>[0],
        );
        const data = unwrap(result);
        return {
          templates: (data.templates ?? []).map((template: { toDTO(): TaskTemplateClientDTO }) =>
            template.toDTO(),
          ),
          dependencies: (data.dependencies ?? []) as TaskGraphDependencyDTO[],
          total: data.total ?? 0,
        };
      },
      staleTime: TASK_TEMPLATE_STALE_TIME_MS,
    };
  });

  const templates = computed<TaskTemplateClientDTO[]>(() => query.data.value?.templates ?? []);
  const dependencies = computed<TaskGraphDependencyDTO[]>(
    () => query.data.value?.dependencies ?? [],
  );
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
    dependencies,
    total,
    isLoading,
    isError,
    error,
    refetch: query.refetch,
  };
}
