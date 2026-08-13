import { useAccountStore } from '../../account/stores/account-store';
import { useUserSettingStore } from '../../setting/stores/user-setting-store';

/**
 * 获取当前用户的时区配置。
 * 优先级：账号设置时区 → 偏好设置时区 → 本地宿主时区 → null
 */
export function getUserTimezone(): string | null {
  try {
    const accountStore = useAccountStore();
    if (accountStore.currentAccount?.settings?.timezone) {
      return accountStore.currentAccount.settings.timezone;
    }
  } catch {
    // pinia store not initialized or active
  }
  try {
    const settingStore = useUserSettingStore();
    const tz = settingStore.userSetting?.preferences?.locale?.timezone;
    if (tz) return tz;
  } catch {
    // pinia store not initialized or active
  }
  try {
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (localTz) return localTz;
  } catch {
    // fallback
  }
  return null;
}
