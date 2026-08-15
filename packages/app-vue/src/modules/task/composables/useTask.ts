/**
 * useTask - 任务模块薄编排 facade（RefArch Phase 5 迁移后）
 *
 * 组合 template list query、instances（非 pilot，维持现状）与 dependencies 操作。
 * Management/Detail 视图直接使用 graph/detail query 与 template mutations（Step 4），
 * 本 facade 只服务 Daily widget / calendar / capsule 等非 pilot consumer：
 * `templates` 来自 template list key，`fetchTemplates(params)` 以 canonical key 预取并
 * await 收敛，保留命令式语义。
 */

import { computed, ref } from 'vue';
import { useTaskStore } from '../stores/task-store';
import { useServerStateIdentityScope, useServerStateRuntime } from '../../../platform/server-state';
import {
  canonicalizeTaskTemplateListQuery,
  taskTemplateQueryKeys,
  type TaskTemplateListQueryInput,
} from '../../../platform/server-state/query-keys';
import { useTaskInstances } from './useTaskInstances';
import { useTaskDependencies } from './useTaskDependencies';
import { useTaskTemplateListQuery } from './useTaskTemplateListQuery';
import { waitForTaskTemplateQuery } from './taskTemplateCache';

export function useTask() {
  const store = useTaskStore();
  const runtime = useServerStateRuntime();
  const resolveIdentityScope = useServerStateIdentityScope();
  const listParams = ref<TaskTemplateListQueryInput>({});
  // P2-4: keep the default list query disabled until `fetchTemplates` requests it, so no
  // avoidable default `limit:20` fetch fires before a consumer supplies its own params.
  // P2-4：默认 list query 保持禁用，直到 `fetchTemplates` 被调用，避免提前发起默认 limit:20 请求。
  const listRequested = ref(false);
  const templateList = useTaskTemplateListQuery({
    params: listParams,
    enabled: listRequested,
  });
  const instanceOps = useTaskInstances();
  const dependencyOps = useTaskDependencies();

  async function fetchTemplates(query?: TaskTemplateListQueryInput) {
    listParams.value = {
      page: query?.page ?? store.pagination.page,
      limit: query?.limit ?? store.pagination.pageSize,
      status: query?.status,
      goalId: query?.goalId,
      folderId: query?.folderId,
      tags: query?.tags,
    };
    listRequested.value = true;
    await waitForTaskTemplateQuery(
      runtime.queryClient,
      taskTemplateQueryKeys.list(
        resolveIdentityScope(),
        canonicalizeTaskTemplateListQuery(listParams.value),
      ),
    );
  }

  function setPage(p: number) {
    store.setPage(p);
    void fetchTemplates();
  }

  return {
    // State
    templates: templateList.templates,
    instances: computed(() => store.instances),
    isLoading: computed(() => templateList.isLoading.value || store.isLoading),
    error: computed(() => store.error),
    pagination: computed(() => store.pagination),
    // Template operations (list key)
    fetchTemplates,
    // Instance operations
    fetchInstances: instanceOps.fetchInstances,
    fetchInstancesByDateRange: instanceOps.fetchInstancesByDateRange,
    startInstance: instanceOps.startInstance,
    completeInstance: instanceOps.completeInstance,
    uncompleteInstance: instanceOps.uncompleteInstance,
    skipInstance: instanceOps.skipInstance,
    // Dependency operations
    createDependency: dependencyOps.createDependency,
    deleteDependency: dependencyOps.deleteDependency,
    // Pagination
    setPage,
  };
}
