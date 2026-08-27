import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { unwrap } from '@memoflow/contracts/result';
import type { TaskInstanceClientDTO, TaskTemplateClientDTO } from '@memoflow/contracts/task';
import { TASK_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { translateResultError } from '../../../shared/utils/translate-result-error';
import { useServerStateIdentityScope } from '../../../platform/server-state';
import { taskOccurrenceQueryKeys } from '../../../platform/server-state/query-keys';

type InstanceLike = { toDTO(): TaskInstanceClientDTO };
type TemplateLike = { toDTO(): TaskTemplateClientDTO };

export function useTaskOccurrenceDetailQuery(id: MaybeRefOrGetter<string | undefined | null>) {
  const service = useStrictInject(TASK_SERVICE_KEY, 'TaskService');
  const resolveIdentityScope = useServerStateIdentityScope();
  const { t } = useI18n();

  const query = useQuery(() => {
    const instanceId = toValue(id) ?? '';
    return {
      queryKey: taskOccurrenceQueryKeys.detail(resolveIdentityScope(), instanceId),
      enabled: Boolean(instanceId),
      queryFn: async () => {
        const instance = (unwrap(await service.getInstance(instanceId)) as InstanceLike).toDTO();
        const template = (unwrap(await service.getTemplate(String(instance.templateId))) as TemplateLike).toDTO();
        const allInstances = unwrap(await service.listInstances({ templateId: String(instance.templateId) }));
        return {
          instance,
          template,
          planInstances: allInstances.map((item) => (item as InstanceLike).toDTO()),
        };
      },
      staleTime: 15_000,
    };
  });

  return {
    query,
    detail: computed(() => query.data.value ?? null),
    isLoading: computed(() => query.isPending.value),
    error: computed(() =>
      query.error.value
        ? translateResultError(query.error.value, t, { fallbackKey: 'task.error.loadInstancesFailed' })
        : null,
    ),
    refetch: query.refetch,
  };
}

export function useTaskOccurrenceListQuery(templateId?: MaybeRefOrGetter<string | undefined | null>) {
  const service = useStrictInject(TASK_SERVICE_KEY, 'TaskService');
  const resolveIdentityScope = useServerStateIdentityScope();
  const { t } = useI18n();

  const query = useQuery(() => {
    const id = toValue(templateId) ?? '';
    return {
      queryKey: taskOccurrenceQueryKeys.list(resolveIdentityScope(), id),
      queryFn: async () => {
        const result = unwrap(await service.listInstances(id ? { templateId: id } : undefined));
        return result.map((item) => (item as InstanceLike).toDTO());
      },
      staleTime: 15_000,
    };
  });

  return {
    query,
    instances: computed<TaskInstanceClientDTO[]>(() => query.data.value ?? []),
    isLoading: computed(() => query.isPending.value),
    error: computed(() =>
      query.error.value
        ? translateResultError(query.error.value, t, { fallbackKey: 'task.error.loadInstancesFailed' })
        : null,
    ),
    refetch: query.refetch,
  };
}
