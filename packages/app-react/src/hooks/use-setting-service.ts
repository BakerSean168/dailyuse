import { useAppClientRegistry } from '../providers/app-client-registry-provider';

export function useSettingService() {
  return useAppClientRegistry().settingService;
}
