/**
 * Authentication Application Client Layer
 * 认证模块客户端应用层
 *
 * Exports the client-side service and port interface.
 * 导出客户端服务和端口接口。
 */

export type { IAuthApiClient } from './ports/auth-api-client.port';
export type { AuthenticationClientPort } from './services/auth-client-service';
export { AuthClientService, createAuthenticationClientService } from './services/auth-client-service';
