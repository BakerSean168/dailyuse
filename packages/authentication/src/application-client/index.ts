/**
 * Authentication Application Client Layer
 * 认证模块客户端应用层
 */

export type { IAuthApiClient } from './ports/auth-api-client.port';
export { AuthClientService } from './services/auth-client-service';

// Re-export as alias for backward compatibility
export { AuthClientService as AuthenticationApplicationService } from './services/auth-client-service';

// Singleton placeholder
let _authenticationApplicationService: any = null;

export function setAuthenticationApplicationService(service: any) {
  _authenticationApplicationService = service;
}

export const authenticationApplicationService: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!_authenticationApplicationService) {
      throw new Error('authenticationApplicationService not initialized. Call setAuthenticationApplicationService first.');
    }
    return (_authenticationApplicationService as any)[prop];
  }
});
