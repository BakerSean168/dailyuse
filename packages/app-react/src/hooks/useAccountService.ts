import { useAppClientRegistry } from '../providers/app-client-registry-provider';

export function useAccountService() {
  return useAppClientRegistry().accountService;
}
