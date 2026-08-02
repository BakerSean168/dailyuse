<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { WindowChannels } from '@memoflow/contracts/electron';
import type { RememberedDesktopAccountDTO } from '@memoflow/contracts/authentication';
import {
  UserRound,
  Trash2,
  ChevronDown,
  Menu,
  Loader2,
  Plus,
  X,
  Mail,
  Lock,
  EyeOff,
  Eye,
} from '@lucide/vue';
import {
  Button,
  Checkbox,
  Input,
  Label,
  ScrollArea,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@memoflow/ui-vue-shadcn';
import { useAuth } from '../modules/authentication/composables/useAuth';
import { inject } from 'vue';
import { DESKTOP_AUTH_API_KEY } from '../di/keys';

interface RememberedAccountItem {
  identityId: RememberedDesktopAccountDTO['identityId'];
  identifier: string;
  nickname: string | null;
  avatarUrl: string | null;
  rememberPassword: boolean;
  autoLogin: boolean;
  lastUsedAt: number;
  lastLoginAt: number;
  hasSavedPassword: boolean;
}

type Scene =
  | 'password-login'
  | 'quick-login'
  | 'quick-login-auto-pending'
  | 'local-session-conflict'
  | 'register';

type PasswordPresentationMode = 'empty' | 'stored' | 'editing';

const {
  loginByEmail,
  registerByEmail,
  enterGuestMode,
  autoLoginDesktop,
  listRememberedAccounts,
  loginRememberedDesktopAccount,
  removeRememberedAccount,
  isLoading,
  resultError,
} = useAuth();
const { t } = useI18n();
const route = useRoute();
const desktopApi = inject(DESKTOP_AUTH_API_KEY, undefined);

const scene = ref<Scene>('password-login');
const rememberedAccounts = ref<RememberedAccountItem[]>([]);
const selectedIdentityId = ref<RememberedAccountItem['identityId'] | null>(null);
const email = ref('');
const password = ref('');
const registerEmail = ref('');
const registerPassword = ref('');
const registerConfirmPassword = ref('');
const rememberPassword = ref(false);
const autoLogin = ref(false);
const passwordPresentationMode = ref<PasswordPresentationMode>('empty');

const isAccountPopoverOpen = ref(false);
const conflictAccountName = ref('');
const showPassword = ref(false);
const hasAttemptedAutoLogin = ref(false);
const isRegisterRoute = computed(
  () => route.path === '/auth/register' || route.path.startsWith('/auth/register/'),
);

const selectedAccount = computed(
  () =>
    rememberedAccounts.value.find((account) => account.identityId === selectedIdentityId.value) ??
    null,
);
const selectedAccountLabel = computed(
  () => selectedAccount.value?.nickname || selectedAccount.value?.identifier || '选择账号',
);
const hasRememberedAccounts = computed(() => rememberedAccounts.value.length > 0);
const showQuickLoginScene = computed(
  () =>
    scene.value === 'quick-login' ||
    scene.value === 'quick-login-auto-pending' ||
    scene.value === 'local-session-conflict',
);
const passwordPlaceholder = computed(() =>
  passwordPresentationMode.value === 'stored' ? '••••••••' : '密码',
);
const passwordInputType = computed(() =>
  passwordPresentationMode.value === 'editing' && showPassword.value ? 'text' : 'password',
);
const showPasswordToggle = computed(() => passwordPresentationMode.value === 'editing');
const canUseStoredPasswordLogin = computed(
  () => passwordPresentationMode.value === 'stored' && selectedAccount.value?.hasSavedPassword,
);

watch(
  isRegisterRoute,
  (registerMode) => {
    if (registerMode) {
      scene.value = 'register';
      return;
    }

    if (scene.value === 'local-session-conflict') {
      return;
    }

    scene.value = rememberedAccounts.value.length > 0 ? 'quick-login' : 'password-login';
  },
  { immediate: true },
);

watch(selectedAccount, (account) => {
  if (!account) {
    return;
  }
  email.value = account.identifier;
  rememberPassword.value = account.rememberPassword;
  autoLogin.value = account.autoLogin;
  syncPasswordPresentation(account);
});

watch(autoLogin, (value) => {
  if (value) {
    rememberPassword.value = true;
  }
});

watch(rememberPassword, (value) => {
  if (!value) {
    autoLogin.value = false;
  }
});

function getDefaultRememberedIdentityId() {
  return (
    rememberedAccounts.value.find((account) => account.autoLogin)?.identityId ??
    rememberedAccounts.value[0]?.identityId ??
    null
  );
}

function syncPasswordPresentation(account: RememberedAccountItem | null) {
  showPassword.value = false;
  password.value = '';

  if (!account) {
    passwordPresentationMode.value = 'empty';
    return;
  }

  passwordPresentationMode.value = account.hasSavedPassword ? 'stored' : 'empty';
}

function enterPasswordLoginScene() {
  if (!selectedIdentityId.value && rememberedAccounts.value.length > 0) {
    selectedIdentityId.value = getDefaultRememberedIdentityId();
  }

  if (!selectedIdentityId.value) {
    email.value = '';
    password.value = '';
    rememberPassword.value = false;
    autoLogin.value = false;
    syncPasswordPresentation(null);
  } else if (selectedAccount.value) {
    email.value = selectedAccount.value.identifier;
    rememberPassword.value = selectedAccount.value.rememberPassword;
    autoLogin.value = selectedAccount.value.autoLogin;
    syncPasswordPresentation(selectedAccount.value);
  }

  scene.value = 'password-login';
}

async function loadRememberedAccounts(options?: {
  preservePasswordLogin?: boolean;
  skipAutoLogin?: boolean;
}) {
  rememberedAccounts.value = await listRememberedAccounts();

  if (isRegisterRoute.value) {
    scene.value = 'register';
    return;
  }

  if (rememberedAccounts.value.length === 0) {
    selectedIdentityId.value = null;
    scene.value = 'password-login';
    syncPasswordPresentation(null);
    return;
  }

  if (!selectedIdentityId.value) {
    selectedIdentityId.value = getDefaultRememberedIdentityId();
  }

  scene.value = options?.preservePasswordLogin ? 'password-login' : 'quick-login';

  if (!options?.skipAutoLogin && !hasAttemptedAutoLogin.value && selectedAccount.value?.autoLogin) {
    hasAttemptedAutoLogin.value = true;
    scene.value = 'quick-login-auto-pending';

    const result = await autoLoginDesktop();
    if (!result.authenticated) {
      scene.value = 'quick-login';
      if (result.error) {
        toast.error(t('auth.toast.loginFailed'), { description: result.error });
      }
    }
  }
}

function syncDefaultScene() {
  if (isRegisterRoute.value) {
    scene.value = 'register';
    return;
  }

  scene.value = rememberedAccounts.value.length > 0 ? 'quick-login' : 'password-login';
}

function handleConflictError() {
  if (resultError.value?.code !== 'AUTH_ALREADY_ACTIVE_LOCALLY') {
    return false;
  }

  scene.value = 'local-session-conflict';
  conflictAccountName.value =
    String(resultError.value.context?.displayName ?? '') ||
    selectedAccount.value?.nickname ||
    email.value ||
    '此账号';
  return true;
}

async function handleLogin() {
  if (canUseStoredPasswordLogin.value && selectedIdentityId.value) {
    const success = await loginRememberedDesktopAccount({
      identityId: selectedIdentityId.value,
      rememberPassword: rememberPassword.value,
      autoLogin: autoLogin.value,
    });

    if (!success) {
      if (handleConflictError()) {
        return;
      }
      if (scene.value === 'quick-login-auto-pending') {
        scene.value = 'quick-login';
      }
    }
    return;
  }

  if (!email.value || !password.value) {
    toast.error(t('auth.validation.loginCredentialsRequired'));
    return;
  }

  const success = await loginByEmail({
    email: email.value,
    password: password.value,
    rememberPassword: rememberPassword.value,
    autoLogin: autoLogin.value,
  });

  if (!success) {
    if (handleConflictError()) {
      return;
    }
    if (scene.value === 'quick-login-auto-pending') {
      scene.value = 'quick-login';
    }
  }
}

async function handleQuickLogin() {
  if (selectedAccount.value?.hasSavedPassword && selectedIdentityId.value) {
    await handleLogin();
    return;
  }

  if (!selectedAccount.value) {
    enterPasswordLoginScene();
    return;
  }

  if (!password.value) {
    enterPasswordLoginScene();
    toast.error(t('auth.validation.loginCredentialsRequired'));
    return;
  }
}

async function handleRegister() {
  if (!registerEmail.value || !registerPassword.value || !registerConfirmPassword.value) {
    toast.error(t('auth.validation.registerFieldsRequired'));
    return;
  }

  if (registerPassword.value !== registerConfirmPassword.value) {
    toast.error(t('auth.validation.passwordMismatch'));
    return;
  }

  await registerByEmail({
    email: registerEmail.value,
    password: registerPassword.value,
  });
}

async function handleRemove(identityId: string) {
  const preservePasswordLogin = scene.value === 'password-login';
  const removed = await removeRememberedAccount(identityId);
  if (!removed) {
    return;
  }

  if (selectedIdentityId.value === identityId) {
    selectedIdentityId.value = null;
    email.value = '';
    password.value = '';
  }

  await loadRememberedAccounts({ preservePasswordLogin, skipAutoLogin: true });

  if (preservePasswordLogin) {
    enterPasswordLoginScene();
  }
}

function handleUseOtherAccount() {
  isAccountPopoverOpen.value = false;
  selectedIdentityId.value = null;
  email.value = '';
  password.value = '';
  rememberPassword.value = false;
  autoLogin.value = false;
  syncPasswordPresentation(null);
  scene.value = 'password-login';
}

function handleSwitchToPasswordLogin() {
  isAccountPopoverOpen.value = false;
  enterPasswordLoginScene();
}

function selectAccount(identityId: RememberedAccountItem['identityId']) {
  selectedIdentityId.value = identityId;
  isAccountPopoverOpen.value = false;
  scene.value = scene.value === 'password-login' ? 'password-login' : 'quick-login';
}

function handlePasswordFieldFocus() {
  if (passwordPresentationMode.value !== 'stored') {
    return;
  }

  passwordPresentationMode.value = 'editing';
  password.value = '';
  showPassword.value = false;
}

function openRegister() {
  const electronApi = desktopApi;
  if (electronApi?.invoke) {
    void electronApi.invoke(WindowChannels.OPEN_AUTH_REGISTER);
  } else {
    window.location.hash = '#/auth/register';
  }
}

async function handleCloseWindow() {
  const electronApi = desktopApi;
  if (electronApi?.invoke) {
    await electronApi.invoke(WindowChannels.CLOSE);
  }
}

function handlePlaceholderMenu() {
  toast.info('暂未开放');
}

async function handleFocusMainWindow() {
  const electronApi = desktopApi;
  if (electronApi?.invoke) {
    await electronApi.invoke(WindowChannels.FOCUS_MAIN_WINDOW);
    syncDefaultScene();
  }
}

function handleReturnFromConflict() {
  conflictAccountName.value = '';
  syncDefaultScene();
}

async function handleReturnToLogin() {
  const electronApi = desktopApi;
  if (electronApi?.invoke && isRegisterRoute.value) {
    await electronApi.invoke(WindowChannels.CLOSE_AUTH_REGISTER);
    return;
  }

  if (isRegisterRoute.value) {
    window.location.hash = '#/auth';
    return;
  }

  syncDefaultScene();
}

onMounted(() => {
  void loadRememberedAccounts();
});
</script>

<template>
  <div
    class="relative flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-white/[0.06] bg-[radial-gradient(circle_at_top,#4c1d9530,transparent_42%),linear-gradient(180deg,#2d1834_0%,#25152f_45%,#1f162e_100%)] text-white selection:bg-primary/30"
    style="-webkit-app-region: drag"
  >
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -left-[28%] top-[62%] h-[18rem] w-[18rem] rounded-full bg-fuchsia-500/[0.18] blur-[120px]"
      ></div>
      <div
        class="absolute -right-[26%] top-[58%] h-[18rem] w-[18rem] rounded-full bg-blue-500/[0.18] blur-[130px]"
      ></div>
    </div>

    <div
      class="absolute right-3 top-3 z-50 flex items-center gap-1.5"
      style="-webkit-app-region: no-drag"
    >
      <DropdownMenu v-if="scene !== 'register'">
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            :aria-label="t('common.more')"
            class="h-7 w-7 rounded-md border border-white/[0.06] bg-white/[0.04] text-white/[0.55] hover:bg-white/[0.09] hover:text-white/[0.85] data-[state=open]:bg-white/10"
          >
            <Menu class="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          class="w-32 rounded-xl border-white/10 bg-black/60 text-white backdrop-blur-xl"
        >
          <DropdownMenuItem
            class="cursor-pointer rounded-lg focus:bg-white/10 focus:text-white"
            @click="handlePlaceholderMenu"
            >网络设置</DropdownMenuItem
          >
          <DropdownMenuItem
            class="cursor-pointer rounded-lg focus:bg-white/10 focus:text-white"
            @click="handlePlaceholderMenu"
            >问题反馈</DropdownMenuItem
          >
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        :aria-label="t('common.close')"
        class="h-7 w-7 rounded-md text-white/[0.55] hover:bg-white/[0.08] hover:text-white/90"
        @click="handleCloseWindow"
      >
        <X class="h-3.5 w-3.5" />
      </Button>
    </div>

    <div class="relative z-10 flex flex-1 flex-col px-6 pb-6 pt-8">
      <div class="flex items-center justify-center">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/5 px-3 py-1 text-[11px] tracking-[0.24em] text-white/[0.48]"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-sky-300/80"></span>
          <span class="h-1.5 w-1.5 rounded-full bg-violet-300/80"></span>
          <span class="text-[10px] tracking-[0.28em]">MEMOFLOW</span>
        </div>
      </div>

      <div class="flex flex-1 flex-col items-center justify-center pb-4 pt-6">
        <div
          class="relative mb-5 flex h-[98px] w-[98px] items-center justify-center overflow-hidden rounded-full border border-white/[0.7] bg-white/[0.08] shadow-[0_20px_45px_rgba(0,0,0,0.35)]"
        >
          <img
            v-if="selectedAccount?.avatarUrl"
            :src="selectedAccount.avatarUrl"
            class="h-full w-full object-cover"
          />
          <UserRound v-else class="h-10 w-10 text-white/[0.78]" />
          <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),transparent_60%)]"></div>
        </div>
        <div class="w-full max-w-[292px]" style="-webkit-app-region: no-drag">
          <template v-if="showQuickLoginScene">
            <div class="flex flex-col items-center">
              <Popover v-model:open="isAccountPopoverOpen">
                <PopoverTrigger as-child>
                  <Button
                    variant="ghost"
                    class="group h-auto rounded-full px-2 py-1.5 text-[15px] font-medium text-white/[0.92] hover:bg-white/[0.08]"
                    :disabled="isLoading"
                  >
                    <span class="max-w-[11rem] truncate">{{ selectedAccountLabel }}</span>
                    <ChevronDown
                      class="ml-1.5 h-3.5 w-3.5 text-white/50 transition-transform group-hover:text-white/80"
                      :class="{ 'rotate-180': isAccountPopoverOpen }"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  class="w-[280px] rounded-2xl border-white/10 bg-[#121216] p-0 text-white shadow-2xl backdrop-blur-xl"
                  align="center"
                >
                  <ScrollArea class="max-h-[220px]">
                    <div class="flex flex-col py-1">
                      <div
                        v-for="account in rememberedAccounts"
                        :key="account.identityId"
                        class="group flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-white/10"
                        @click="selectAccount(account.identityId)"
                      >
                        <div
                          class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10"
                        >
                          <img
                            v-if="account.avatarUrl"
                            :src="account.avatarUrl"
                            class="h-full w-full object-cover"
                          />
                          <UserRound v-else class="h-4 w-4 text-white" />
                        </div>
                        <div class="flex min-w-0 flex-1 flex-col">
                          <span class="truncate text-sm font-medium">{{
                            account.nickname || account.identifier
                          }}</span>
                          <span class="truncate text-[11px] text-white/50">{{
                            account.identifier
                          }}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          :aria-label="t('common.delete')"
                          class="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-red-400"
                          @click.stop="handleRemove(account.identityId)"
                        >
                          <Trash2 class="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                  <div class="border-t border-white/10 p-1">
                    <Button
                      variant="ghost"
                      class="w-full justify-center gap-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white"
                      @click="handleUseOtherAccount"
                    >
                      <Plus class="h-4 w-4" />
                      添加账号
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <div class="mt-3 flex items-center gap-2 text-[13px] text-white/[0.64]">
                <Checkbox
                  v-model="autoLogin"
                  id="quick-auto-login"
                  class="h-4 w-4 rounded-[4px] border-white/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  :disabled="isLoading"
                />
                <Label for="quick-auto-login" class="cursor-pointer font-normal">{{
                  t('auth.desktop.autoLogin')
                }}</Label>
              </div>

              <Button
                data-testid="desktop-quick-login-submit-button"
                class="mt-10 h-[40px] w-full rounded-[10px] bg-primary text-[15px] font-medium tracking-wide shadow-[0_10px_30px_rgba(29,78,216,0.28)] transition-all hover:bg-primary/90 hover:shadow-[0_14px_34px_rgba(29,78,216,0.42)]"
                :disabled="isLoading"
                @click="handleQuickLogin"
              >
                <Loader2 v-if="isLoading" class="mr-2 h-[18px] w-[18px] animate-spin" />
                {{ scene === 'quick-login-auto-pending' ? '自动登录中...' : t('auth.login.submit') }}
              </Button>
            </div>
          </template>

          <template v-else-if="scene === 'password-login'">
            <div class="flex flex-col items-center">
              <p class="mb-5 text-[13px] text-white/50">使用账号密码继续登录</p>

              <div class="w-full space-y-3">
                <Popover v-if="hasRememberedAccounts && selectedIdentityId" v-model:open="isAccountPopoverOpen">
                  <PopoverTrigger as-child>
                    <Button
                      variant="ghost"
                      class="group relative h-[42px] w-full justify-start rounded-[10px] border border-white/10 bg-white/[0.06] px-0 text-left text-[14px] font-normal text-white hover:bg-white/10"
                      :disabled="isLoading"
                    >
                      <Mail
                        class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.35]"
                      />
                      <span class="block max-w-[calc(100%-3.75rem)] truncate pl-9 pr-10">
                        {{ email }}
                      </span>
                      <ChevronDown
                        class="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/50 transition-transform group-hover:text-white/80"
                        :class="{ 'rotate-180': isAccountPopoverOpen }"
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    class="w-[280px] rounded-2xl border-white/10 bg-[#121216] p-0 text-white shadow-2xl backdrop-blur-xl"
                    align="center"
                  >
                    <ScrollArea class="max-h-[220px]">
                      <div class="flex flex-col py-1">
                        <div
                          v-for="account in rememberedAccounts"
                          :key="account.identityId"
                          class="group flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-white/10"
                          @click="selectAccount(account.identityId)"
                        >
                          <div
                            class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10"
                          >
                            <img
                              v-if="account.avatarUrl"
                              :src="account.avatarUrl"
                              class="h-full w-full object-cover"
                            />
                            <UserRound v-else class="h-4 w-4 text-white" />
                          </div>
                          <div class="flex min-w-0 flex-1 flex-col">
                            <span class="truncate text-sm font-medium">{{
                              account.nickname || account.identifier
                            }}</span>
                            <span class="truncate text-[11px] text-white/50">{{
                              account.identifier
                            }}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            :aria-label="t('common.delete')"
                            class="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-red-400"
                            @click.stop="handleRemove(account.identityId)"
                          >
                            <Trash2 class="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </ScrollArea>
                    <div class="border-t border-white/10 p-1">
                      <Button
                        variant="ghost"
                        class="w-full justify-center gap-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white"
                        @click="handleUseOtherAccount"
                      >
                        <Plus class="h-4 w-4" />
                        使用其他账号
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <div v-else class="relative">
                  <Mail
                    class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.35]"
                  />
                  <Input
                    id="desktop-login-email"
                    v-model="email"
                    data-testid="desktop-login-email"
                    placeholder="邮箱地址"
                    class="h-[42px] rounded-[10px] border-white/10 bg-white/[0.06] pl-9 pr-3.5 text-[14px] text-white placeholder:text-white/[0.28] focus-visible:border-primary/50 focus-visible:bg-white/10 focus-visible:ring-1 focus-visible:ring-primary/50"
                    :disabled="isLoading"
                  />
                </div>
                <div class="relative">
                  <Lock
                    class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.35]"
                  />
                  <Input
                    id="desktop-login-password"
                    v-model="password"
                    data-testid="desktop-login-password"
                    :type="passwordInputType"
                    :placeholder="passwordPlaceholder"
                    class="h-[42px] rounded-[10px] border-white/10 bg-white/[0.06] pl-9 pr-10 text-[14px] text-white placeholder:text-white/[0.28] focus-visible:border-primary/50 focus-visible:bg-white/10 focus-visible:ring-1 focus-visible:ring-primary/50"
                    :disabled="isLoading"
                    @focus="handlePasswordFieldFocus"
                    @keyup.enter="handleLogin"
                  />
                  <EyeOff
                    v-if="showPasswordToggle && !showPassword"
                    class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 cursor-pointer text-white/[0.35] transition-colors hover:text-white/70"
                    @click="showPassword = true"
                  />
                  <Eye
                    v-else-if="showPasswordToggle"
                    class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 cursor-pointer text-white/[0.35] transition-colors hover:text-white/70"
                    @click="showPassword = false"
                  />
                </div>
                <p
                  v-if="passwordPresentationMode === 'stored'"
                  class="px-1 text-[12px] text-white/[0.48]"
                >
                  已记住密码，登录时不会显示真实内容
                </p>
              </div>

              <div class="mt-4 flex w-full items-center justify-between px-1 text-[12.5px] text-white/[0.62]">
                <label class="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    v-model="rememberPassword"
                    aria-label="记住密码"
                    class="h-4 w-4 rounded-[4px] border-white/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    :disabled="isLoading"
                  />
                  <span>记住密码</span>
                </label>
                <label class="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    v-model="autoLogin"
                    aria-label="自动登录"
                    class="h-4 w-4 rounded-[4px] border-white/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    :disabled="isLoading"
                  />
                  <span>自动登录</span>
                </label>
              </div>

              <Button
                data-testid="login-submit-button"
                class="mt-8 h-[40px] w-full rounded-[10px] bg-primary text-[15px] font-medium tracking-wide shadow-[0_10px_30px_rgba(29,78,216,0.28)] transition-all hover:bg-primary/90 hover:shadow-[0_14px_34px_rgba(29,78,216,0.42)]"
                :disabled="isLoading"
                @click="handleLogin"
              >
                <Loader2 v-if="isLoading" class="mr-2 h-[18px] w-[18px] animate-spin" />
                {{ t('auth.login.submit') }}
              </Button>
            </div>
          </template>

          <template v-else-if="scene === 'register'">
            <div class="flex flex-col items-center">
              <p class="mb-5 text-[13px] text-white/50">创建一个新的桌面账号</p>

              <div class="w-full space-y-3">
                <div class="relative">
                  <Mail
                    class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.35]"
                  />
                  <Input
                    id="desktop-register-email"
                    v-model="registerEmail"
                    data-testid="desktop-register-email"
                    type="email"
                    placeholder="输入邮箱账号"
                    class="h-[42px] rounded-[10px] border-white/10 bg-white/[0.06] pl-9 pr-3.5 text-[14px] text-white placeholder:text-white/[0.28] focus-visible:border-primary/50 focus-visible:bg-white/10 focus-visible:ring-1 focus-visible:ring-primary/50"
                    :disabled="isLoading"
                  />
                </div>
                <div class="relative">
                  <Lock
                    class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.35]"
                  />
                  <Input
                    id="desktop-register-password"
                    v-model="registerPassword"
                    data-testid="desktop-register-password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="设置密码"
                    class="h-[42px] rounded-[10px] border-white/10 bg-white/[0.06] pl-9 pr-10 text-[14px] text-white placeholder:text-white/[0.28] focus-visible:border-primary/50 focus-visible:bg-white/10 focus-visible:ring-1 focus-visible:ring-primary/50"
                    :disabled="isLoading"
                  />
                  <EyeOff
                    v-if="!showPassword"
                    class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 cursor-pointer text-white/[0.35] transition-colors hover:text-white/70"
                    @click="showPassword = true"
                  />
                  <Eye
                    v-else
                    class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 cursor-pointer text-white/[0.35] transition-colors hover:text-white/70"
                    @click="showPassword = false"
                  />
                </div>
                <div class="relative">
                  <Lock
                    class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.35]"
                  />
                  <Input
                    id="desktop-register-confirm-password"
                    v-model="registerConfirmPassword"
                    data-testid="desktop-register-confirm-password"
                    type="password"
                    placeholder="确认密码"
                    class="h-[42px] rounded-[10px] border-white/10 bg-white/[0.06] pl-9 pr-10 text-[14px] text-white placeholder:text-white/[0.28] focus-visible:border-primary/50 focus-visible:bg-white/10 focus-visible:ring-1 focus-visible:ring-primary/50"
                    :disabled="isLoading"
                    @keyup.enter="handleRegister"
                  />
                </div>
              </div>

              <Button
                data-testid="register-submit-button"
                class="mt-8 h-[40px] w-full rounded-[10px] bg-primary text-[15px] font-medium tracking-wide shadow-[0_10px_30px_rgba(29,78,216,0.28)] transition-all hover:bg-primary/90 hover:shadow-[0_14px_34px_rgba(29,78,216,0.42)]"
                :disabled="isLoading"
                @click="handleRegister"
              >
                <Loader2 v-if="isLoading" class="mr-2 h-[18px] w-[18px] animate-spin" />
                {{ t('auth.desktop.createAccount') }}
              </Button>
            </div>
          </template>
        </div>
      </div>

      <div
        class="flex items-center justify-center gap-3 pb-1 pt-2 text-[12.5px] text-white/[0.46]"
        style="-webkit-app-region: no-drag"
      >
        <template v-if="showQuickLoginScene">
          <Button
            variant="link"
            class="h-auto px-0 py-0 text-white/[0.46] hover:text-white/[0.78]"
            @click="handleSwitchToPasswordLogin"
          >
            账密登录
          </Button>
          <span class="text-white/[0.22]">|</span>
          <Button
            variant="link"
            class="h-auto px-0 py-0 text-white/[0.46] hover:text-white/[0.78]"
            @click="openRegister"
          >
            注册账号
          </Button>
        </template>
        <template v-else-if="scene === 'password-login'">
          <Button
            variant="link"
            class="h-auto px-0 py-0 text-white/[0.46] hover:text-white/[0.78]"
            @click="openRegister"
          >
            注册账号
          </Button>
          <span class="text-white/[0.22]">|</span>
          <Button
            variant="link"
            class="h-auto px-0 py-0 text-white/[0.46] hover:text-white/[0.78]"
            data-testid="guest-mode-button"
            @click="enterGuestMode"
          >
            访客模式
          </Button>
        </template>
        <template v-else-if="scene === 'register'">
          <Button
            variant="link"
            class="h-auto px-0 py-0 text-white/[0.46] hover:text-white/[0.78]"
            @click="handleReturnToLogin"
          >
            返回登录
          </Button>
        </template>
      </div>
    </div>

    <Dialog :open="scene === 'local-session-conflict'" @update:open="handleReturnFromConflict">
      <DialogContent class="sm:max-w-md border-white/10 bg-[#121216] text-white">
        <DialogHeader>
          <DialogTitle class="text-white">本地账号冲突</DialogTitle>
          <DialogDescription class="text-white/70">
            检测到账号
            <strong class="text-white">{{ conflictAccountName }}</strong>
            已在本地打开并活跃，无需重复登录。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="sm:justify-start">
          <Button
            type="button"
            variant="outline"
            class="border-white/20 bg-transparent text-white hover:bg-white/10"
            @click="handleReturnFromConflict"
          >
            返回
          </Button>
          <Button
            type="button"
            class="bg-primary text-white hover:bg-primary/90"
            @click="handleFocusMainWindow"
          >
            打开 {{ conflictAccountName }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
