/**
 * useAuth - 认证模块主 composable
 *
 * 薄编排层，组合 useLogin / useRegister / useRememberedAccounts / useGuestMode。
 * 所有具体逻辑由子 composable 承载。
 *
 * @module authentication/composables
 */

import { computed } from 'vue';
import { createAuthContext } from './useAuthContext';
import { useLogin } from './useLogin';
import { useRegister } from './useRegister';
import { useRememberedAccounts } from './useRememberedAccounts';
import { useGuestMode } from './useGuestMode';

export function useAuth() {
  const ctx = createAuthContext();
  const loginOps = useLogin(ctx);
  const registerOps = useRegister(ctx);
  const rememberedOps = useRememberedAccounts(ctx);
  const guestOps = useGuestMode(ctx);

  return {
    // State
    isAuthenticated: computed(() => ctx.store.isAuthenticated),
    isLoading: computed(() => ctx.store.isLoading),
    error: computed(() => ctx.store.error),
    currentIdentity: computed(() => ctx.store.currentIdentity),
    resultError: computed(() => ctx.lastResultError.value),
    // Login
    loginByEmail: loginOps.loginByEmail,
    loginByPhone: loginOps.loginByPhone,
    // Register
    registerByEmail: registerOps.registerByEmail,
    registerByPhone: registerOps.registerByPhone,
    sendSmsCode: registerOps.sendSmsCode,
    // Remembered accounts
    listRememberedAccounts: rememberedOps.listRememberedAccounts,
    loginRememberedDesktopAccount: rememberedOps.loginRememberedDesktopAccount,
    removeRememberedAccount: rememberedOps.removeRememberedAccount,
    // Guest mode / session
    enterGuestMode: guestOps.enterGuestMode,
    autoLoginDesktop: guestOps.autoLoginDesktop,
    refreshToken: guestOps.refreshToken,
    logout: guestOps.logout,
  };
}
