/**
 * useTask - 任务模块主 composable
 *
 * 薄编排层，组合 useTaskTemplates / useTaskInstances / useTaskDependencies。
 * 所有具体逻辑由子 composable 承载。
 */

import { computed } from 'vue';
import { useTaskStore } from '../stores/task-store';
import { useTaskTemplates } from './useTaskTemplates';
import { useTaskInstances } from './useTaskInstances';
import { useTaskDependencies } from './useTaskDependencies';

export function useTask() {
  const store = useTaskStore();
  const templateOps = useTaskTemplates();
  const instanceOps = useTaskInstances();
  const dependencyOps = useTaskDependencies();

  function setPage(p: number) {
    store.setPage(p);
    templateOps.fetchTemplates();
  }

  return {
    // State
    templates: computed(() => store.templates),
    instances: computed(() => store.instances),
    dependencies: computed(() => store.dependencies),
    currentTemplate: computed(() => store.currentTemplate),
    currentInstance: computed(() => store.currentInstance),
    isLoading: computed(() => store.isLoading),
    isSaving: templateOps.isSaving,
    error: computed(() => store.error),
    pagination: computed(() => store.pagination),
    // Template operations
    fetchTemplates: templateOps.fetchTemplates,
    fetchTaskGraph: templateOps.fetchTaskGraph,
    fetchTemplate: templateOps.fetchTemplate,
    createTemplate: templateOps.createTemplate,
    updateTemplate: templateOps.updateTemplate,
    deleteTemplate: templateOps.deleteTemplate,
    activateTemplate: templateOps.activateTemplate,
    pauseTemplate: templateOps.pauseTemplate,
    archiveTemplate: templateOps.archiveTemplate,
    // Instance operations
    fetchInstances: instanceOps.fetchInstances,
    fetchInstancesByDateRange: instanceOps.fetchInstancesByDateRange,
    startInstance: instanceOps.startInstance,
    completeInstance: instanceOps.completeInstance,
    skipInstance: instanceOps.skipInstance,
    // Dependency operations
    createDependency: dependencyOps.createDependency,
    deleteDependency: dependencyOps.deleteDependency,
    // Pagination
    setPage,
  };
}
