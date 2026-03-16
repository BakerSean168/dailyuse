/**
 * Authentication Application Client Layer
 * 认证模块客户端应用层
 *
 * Exports the client-side service and port interface.
 * 导出客户端服务和端口接口。
 */

export type { IAuthApiClient } from './ports/auth-api-client.port';
export { AuthClientService } from './services/auth-client-service';

// Re-export as alias for backward compatibility
// 向后兼容别名
export { AuthClientService as AuthenticationApplicationService } from './services/auth-client-service';

// ---------------------------------------------------------------------------
// Legacy singleton proxy — 旧版单例代理（向后兼容）
// ---------------------------------------------------------------------------

/**
 * @deprecated Use explicit DI instead. Construct `AuthClientService` with an `IAuthApiClient` adapter.
 * 已废弃：请使用显式依赖注入代替。用 `IAuthApiClient` 适配器构造 `AuthClientService`。
 */
let _authenticationApplicationService: any = null;

/**
 * @deprecated Use explicit DI instead. 已废弃：请使用显式依赖注入代替。
 */
export function setAuthenticationApplicationService(service: any) {
  _authenticationApplicationService = service;
}

/**
 * @deprecated Use explicit DI instead. 已废弃：请使用显式依赖注入代替。
 */
export const authenticationApplicationService: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!_authenticationApplicationService) {
      throw new Error(
        'authenticationApplicationService not initialized. Call setAuthenticationApplicationService first.',
      );
    }
    return (_authenticationApplicationService as any)[prop];
  },
});
