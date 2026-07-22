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

// Contracts types: single import path (no manager dual re-export track).
export type {
  TokenStorageData,
  SaveTokenRequest,
  TokenRefreshResult,
  TokenStatus,
  NetworkStatus,
  NetworkStateChangeEvent,
  NetworkCheckConfig,
  SessionRestoreResult as ContractSessionRestoreResult,
  AutoLoginResult as ContractAutoLoginResult,
  SessionStatusDTO,
  RefreshSessionRequest,
  RefreshSessionResponse,
  LoginRequest,
  LoginResponse,
  AuthMode,
  AuthStatusDTO,
  DeviceInfoClientDTO,
} from '@dailyuse/contracts/authentication';

// Export managers
export { TokenManager } from './token-manager';
export { SessionManager } from './session-manager';
export type {
  SessionRestoreResult,
  AutoLoginResult,
  SessionStatus,
  OfflineLoginResponse,
} from './session-types';
export { NetworkStateManager } from './network-state-manager';
export type { NetworkStateManagerConfig } from './network-state-manager';
export { RememberedAccountsService } from './remembered-accounts-service';
export type { RememberedAccountRecord } from './remembered-accounts-service';
