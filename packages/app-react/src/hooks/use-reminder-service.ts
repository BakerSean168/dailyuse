import { useAppClientRegistry } from '../providers/app-client-registry-provider';

export function useReminderService() {
  return useAppClientRegistry().reminderService;
}
