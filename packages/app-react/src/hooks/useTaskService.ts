import { useAppClientRegistry } from '../providers/app-client-registry-provider';

export function useTaskService() {
  return useAppClientRegistry().taskService;
}
