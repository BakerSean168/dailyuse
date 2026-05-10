import { useAppClientRegistry } from '../providers/app-client-registry-provider';

export function useScheduleService() {
  return useAppClientRegistry().scheduleService;
}
