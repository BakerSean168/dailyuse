/**
 * Account Application Client Layer
 * 客户端应用服�?
 */

export { AccountClientService } from './services/account-client-service';
export type { IAccountApiClient } from './ports/account-api-client.port';

// Re-export as alias for backward compatibility
export { AccountClientService as AccountApplicationService } from './services/account-client-service';

// Singleton placeholder
let _accountApplicationService: any = null;

export function setAccountApplicationService(service: any) {
  _accountApplicationService = service;
}

export const accountApplicationService: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!_accountApplicationService) {
      throw new Error('accountApplicationService not initialized. Call setAccountApplicationService first.');
    }
    return (_accountApplicationService as any)[prop];
  }
});
