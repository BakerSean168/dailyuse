import { useAppClientRegistry } from '../providers/app-client-registry-provider';

export function useNotificationService() {
  return useAppClientRegistry().notificationService;
}
