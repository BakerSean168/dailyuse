/**
 * Setting Application Client Layer
 */

export { SettingClientService } from './setting-client-service';

// Re-export as alias for backward compatibility
export { SettingClientService as SettingApplicationService } from './setting-client-service';

// Singleton placeholder
let _settingApplicationService: any = null;

export function setSettingApplicationService(service: any) {
  _settingApplicationService = service;
}

export const settingApplicationService: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!_settingApplicationService) {
      throw new Error('settingApplicationService not initialized. Call setSettingApplicationService first.');
    }
    return (_settingApplicationService as any)[prop];
  }
});

