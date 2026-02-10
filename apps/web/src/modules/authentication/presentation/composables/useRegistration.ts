/**
 * Registration Composable
 * 注册组合式 API
 *
 * 职责:
 * - 调用 RegistrationApplicationService 获取数据
 * - 管理注册相关的状态
 * - 处理新用户创建
 */

import { computed } from 'vue';
import { useAuthenticationStore } from '../stores/authenticationStore';
import type { RegisterRequestDTO } from '@dailyuse/contracts/account';
import { Register } from '@dailyuse/authentication/application-client';

export function useRegistration() {
  const authStore = useAuthenticationStore();
  const registerUseCase = Register.getInstance();

  // ============ State (from store) ============
  const isLoading = computed(() => authStore.isLoading);
  const error = computed(() => authStore.error);

  // ============ Registration Methods ============

  /**
   * 注册
   */
  async function register(request: RegisterRequestDTO): Promise<boolean> {
    authStore.setLoading(true);
    try {
      const result = await registerUseCase.execute(request);
      authStore.setError(null);
      console.log('✅ [useRegistration] 注册成功:', result.message);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '注册失败';
      authStore.setError(errorMessage);
      console.error('❌ [useRegistration] 注册失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  return {
    // State
    isLoading,
    error,

    // Actions
    register,
  };
}
