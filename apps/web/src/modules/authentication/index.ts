/**
 * Authentication Web Module
 * 认证 Web 模块导出
 */

// 展示层 - API Service
export { authApi, AuthApiError } from './presentation/services/authApi';

// 展示层 - Store
export { useAuthenticationStore } from './presentation/stores/authenticationStore';
export type { AuthenticationState } from './presentation/stores/authenticationStore';

// 展示层 - Composables
export { useAuth, useSession, usePassword } from './presentation/composables';

// 初始化
export { registerAuthenticationInitializationTasks } from './initialization/authenticationInitialization';
