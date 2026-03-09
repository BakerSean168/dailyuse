/**
 * Authentication Infrastructure Exports
 *
 * 导出认证基础设施层的核心组件：
 * - TokenManager: Token 加密存储管理
 * - SessionManager: 会话生命周期管理
 * - NetworkStateManager: 网络状态管理
 *
 * 类型定义统一从 @dailyuse/contracts/authentication 导入
 */

// Re-export types from contracts for convenience
export type {
  TokenStorageData,
  SaveTokenRequest,
  TokenRefreshResult,
  TokenStatus,
  SessionRestoreResult as ContractSessionRestoreResult,
  AutoLoginResult as ContractAutoLoginResult,
  SessionStatusDTO,
  RefreshSessionRequest,
  RefreshSessionResponse,
  LoginRequest,
  LoginResponse,
  AuthMode,
  AuthStatusDTO,
  AuthOperationResult,
  DeviceInfoClientDTO,
} from '@dailyuse/contracts/authentication';

// Export managers
export { TokenManager, getTokenManager } from './TokenManager';
export { SessionManager, createSessionManager } from './SessionManager';
export { NetworkStateManager, getNetworkStateManager } from './NetworkStateManager';
export {
  RememberedAccountsService,
  getRememberedAccountsService,
} from './RememberedAccountsService';
export type {
  NetworkStatus,
  NetworkStateChangeEvent,
  NetworkStateManagerConfig,
} from './NetworkStateManager';

// Export local types
export type { TokenData } from './TokenManager';

export type { SessionRestoreResult, AutoLoginResult, SessionStatus } from './SessionManager';
export type { RememberedAccountRecord } from './RememberedAccountsService';
