/**
 * @deprecated Use useTask() instead. This is a backward compatibility shim.
 */
import { ref } from 'vue';
import { useTask } from './useTask';

export function useTaskBatchOperations() {
  const task = useTask();
  const selectedIds = ref<string[]>([]);

  async function batchDelete() {
    for (const id of selectedIds.value) await task.deleteTemplate(id);
    selectedIds.value = [];
  }

  async function batchArchive() {
    for (const id of selectedIds.value) await task.archiveTemplate(id);
    selectedIds.value = [];
  }

  return { selectedIds, batchDelete, batchArchive, ...task };
}
