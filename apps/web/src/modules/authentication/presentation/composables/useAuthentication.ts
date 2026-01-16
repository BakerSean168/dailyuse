import { ref, computed, readonly } from 'vue';
import { useRouter } from 'vue-router';
import { AuthApplicationService } from '../../application/services/AuthApplicationService';
import { useAuthenticationStore } from '../stores/authenticationStore';
import { AuthManager } from '@/shared/api';
import type { LoginRequest, RegisterRequest, AuthTokens, ChangePasswordRequest } from '@dailyuse/contracts/authentication';

type LoginRequestDTO = LoginRequest;
type ChangePasswordRequestDTO = ChangePasswordRequest;

/**
 * 认证模块 Composable
 *
 * 职责：
 * - 从 store 获取响应式数据
 * - 提供只读查询方法
 * - 管理本地 UI 状态
 * - 委托业务操作给 ApplicationService
 */
export function useAuthentication() {
  const router = useRouter();
  const authStore = useAuthenticationStore();

  // ===== 本地 UI 状态 =====
  const loginFormVisible = ref(false);
  const currentOperation = ref<string | null>(null);

  // ===== 只读响应式数据（从 store 和 AuthManager 获取）=====
  const isAuthenticated = computed(() => AuthManager.isAuthenticated());
  const user = computed(() => authStore.getCurrentUser);
  const isLoading = computed(() => authStore.getLoading);
  const error = computed(() => authStore.getError);
  const tokens = computed(() => ({
    accessToken: AuthManager.getAccessToken(),
    refreshToken: AuthManager.getRefreshToken(),
  }));

  // ===== Token 状态查询（只读）=====
  const isTokenExpiringSoon = computed(() => {
    const expiry = AuthManager.getTokenExpiry();
    if (!expiry) return false;
    return Date.now() > expiry - 10 * 60 * 1000;
  });

  // ===== 只读查询方法 =====

  /**
   * 获取用户资料
   */
  const getUserProfile = () => {
    return authStore.getCurrentUser;
  };

  /**
   * 检查用户权限
   */
  const hasPermission = (permission: string): boolean => {
    return authStore.hasPermission(permission);
  };

  /**
   * 检查用户角色
   */
  const hasRole = (role: string): boolean => {
    return authStore.hasRole(role);
  };

  /**
   * 获取用户账户UUID
   */
  const getAccountUuid = (): string | undefined => {
    return authStore.getUserUuid;
  };

  /**
   * 获取用户显示名称
   */
  const getDisplayName = (): string => {
    return authStore.getUsername || '未知用户';
  };

  // ===== 业务操作（委托给 ApplicationService）=====

  /**
   * 登录操作
   */
  const login = async (credentials: LoginRequestDTO): Promise<void> => {
    currentOperation.value = 'login';
    try {
      console.log('Attempting login with credentials:', credentials);
      const authService = await AuthApplicationService.getInstance();
      await authService.login(credentials);
      console.log('Login successful');
      // 登录成功后跳转
      await router.push({ name: 'dashboard' });
    } finally {
      currentOperation.value = null;
    }
  };

  /**
   * 登出操作
   */
  const logout = async (): Promise<void> => {
    currentOperation.value = 'logout';
    try {
      const authService = await AuthApplicationService.getInstance();
      await authService.logout();

      // 登出后跳转到登录页
      await router.push({ name: 'login' });
    } finally {
      currentOperation.value = null;
    }
  };

  /**
   * 刷新用户信息
   */
  const refreshUser = async (): Promise<void> => {
    currentOperation.value = 'refresh';
    try {
      const authService = await AuthApplicationService.getInstance();
      await authService.getCurrentUser();
    } finally {
      currentOperation.value = null;
    }
  };

  /**
   * 初始化认证状态
   */
  const initAuth = async (): Promise<void> => {
    currentOperation.value = 'init';
    try {
      const authService = await AuthApplicationService.getInstance();
      await authService.initAuth();
    } finally {
      currentOperation.value = null;
    }
  };

  /**
   * 修改密码
   */
  const changePassword = async (data: ChangePasswordRequestDTO): Promise<void> => {
    currentOperation.value = 'changePassword';
    try {
      const authService = await AuthApplicationService.getInstance();
      await authService.changePassword(data);
    } finally {
      currentOperation.value = null;
    }
  };

  /**
   * 刷新访问令牌
   */
  const refreshTokens = async (): Promise<void> => {
    currentOperation.value = 'refreshTokens';
    try {
      const authService = await AuthApplicationService.getInstance();
      await authService.refreshToken();
    } finally {
      currentOperation.value = null;
    }
  };

  // ===== 本地 UI 状态管理 =====

  /**
   * 显示登录表单
   */
  const showLoginForm = (): void => {
    loginFormVisible.value = true;
  };

  /**
   * 隐藏登录表单
   */
  const hideLoginForm = (): void => {
    loginFormVisible.value = false;
  };

  /**
   * 切换登录表单显示状态
   */
  const toggleLoginForm = (): void => {
    loginFormVisible.value = !loginFormVisible.value;
  };

  /**
   * 检查是否正在执行特定操作
   */
  const isOperationInProgress = (operation: string): boolean => {
    return currentOperation.value === operation;
  };

  // ===== 返回 API（只读接口）=====
  return {
    // 只读响应式数据
    isAuthenticated,
    user,
    isLoading,
    error,
    tokens,

    // Token 状态（只读）
    isTokenExpiringSoon,

    // 本地 UI 状态
    loginFormVisible: readonly(loginFormVisible),
    currentOperation: readonly(currentOperation),

    // 只读查询方法
    getUserProfile,
    hasPermission,
    hasRole,
    getAccountUuid,
    getDisplayName,

    // 业务操作（委托给 ApplicationService）
    login,
    logout,
    refreshUser,
    initAuth,
    changePassword,
    refreshTokens,

    // 本地 UI 状态管理
    showLoginForm,
    hideLoginForm,
    toggleLoginForm,
    isOperationInProgress,
  };
}

// 默认导出
export default useAuthentication;

