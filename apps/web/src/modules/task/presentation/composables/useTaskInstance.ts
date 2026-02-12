/**
 * @deprecated Use useTask() instead. This is a backward compatibility shim.
 */
import { computed } from 'vue';
import { useTask } from './useTask';

export function useTaskInstance() {
  const task = useTask();
  return {
    ...task,
    taskInstances: task.instances,
    completeTaskInstance: task.completeInstance,
    startTaskInstance: task.startInstance,
    skipTaskInstance: task.skipInstance,
    undoCompleteTaskInstance: async (_id: string) => {
      console.warn('[useTaskInstance] undoCompleteTaskInstance is not yet implemented');
    },
    updateTaskInstance: async (id: string, data: Record<string, unknown>) => {
      console.warn('[useTaskInstance] updateTaskInstance — use useTask().updateTemplate() for templates');
    },
  };
}

export const useTaskInstanceData = useTaskInstance;
