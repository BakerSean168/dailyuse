/**
 * @deprecated Use useTask() instead. This is a backward compatibility shim.
 */
import { useTask } from './useTask';

export function useTaskTemplate() {
  const task = useTask();
  return {
    ...task,
    deleteTaskTemplate: task.deleteTemplate,
    pauseTaskTemplate: task.pauseTemplate,
    activateTaskTemplate: task.activateTemplate,
    createTaskTemplate: task.createTemplate,
    updateTaskTemplate: task.updateTemplate,
  };
}

export const useTaskTemplateData = useTaskTemplate;
