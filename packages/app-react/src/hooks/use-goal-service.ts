import { useAppClientRegistry } from '../providers/app-client-registry-provider';

export function useGoalService() {
  return useAppClientRegistry().goalService;
}
