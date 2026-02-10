/**
 * Authentication Web Module
 * 认证 Web 模块导出
 */

// 应用层服务
export * from './application/services';

// 应用层事件
export { AUTH_EVENTS } from '@dailyuse/authentication/application-client';

// 基础设施层 API 客户端
export * from './infrastructure/api';

// 展示层
export { useAuthenticationStore } from './presentation/stores/authenticationStore';
export {
  useAuth,
  useLogin,
  useRegistration,
  useSession,
  usePassword,
  useApiKey,
} from './presentation/composables';

// 初始化
export { registerAuthenticationInitializationTasks } from './initialization/authenticationInitialization';
