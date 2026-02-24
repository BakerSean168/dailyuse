/**
 * Authentication Web Module
 * 认证 Web 模块导出
 *
 * Store + Composables are now re-exported from @dailyuse/app-vue.
 * Only web-specific initialization logic remains here.
 */

// Re-export from shared app-vue package
export {
  useAuthenticationStore,
  type AuthenticationState,
  useAuth,
  useSession,
  usePassword,
} from '@dailyuse/app-vue';

// Web-specific initialization (uses @/shared/di, @/shared/i18n, localStorage)
export { registerAuthenticationInitializationTasks } from './initialization/authenticationInitialization';
