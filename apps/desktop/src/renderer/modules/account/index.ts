/**
 * Account Module - Renderer
 *
 * 账户模块 - 渲染进程
 * 遵循 DDD 分层架构
 */

// ===== Application Layer =====
export {
  AccountApplicationService,
  accountApplicationService,
} from '@dailyuse/account/application-client';

// ===== Presentation Layer =====
// Hooks
export { useAccount } from './presentation/hooks/useAccount';
export type { UseAccountReturn, AccountState } from './presentation/hooks/useAccount';
export { useAccountProfile } from './presentation/hooks/useAccountProfile';

// Views (按需导出)
// export { AccountProfileView } from './presentation/views/AccountProfileView';

// ===== Initialization =====
export { registerAccountModule, initializeAccountModule } from './initialization';
