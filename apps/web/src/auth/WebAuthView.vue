<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { APP_DISPLAY_NAME, logo128 } from '@dailyuse/assets';
import { Card, CardContent } from '@dailyuse/ui-vue-shadcn/components/ui/card';
import { Button } from '@dailyuse/ui-vue-shadcn/components/ui/button';
import { Input } from '@dailyuse/ui-vue-shadcn/components/ui/input';
import { Label } from '@dailyuse/ui-vue-shadcn/components/ui/label';
import { Loader2 } from '@lucide/vue';

import { useWebAuth } from './useWebAuth';
import {
  applyAuthLocale,
  normalizeLocale,
  readPresentationPreferenceState,
  writePresentationPreferenceState,
  type AuthLocale,
} from './presentation';
import {
  firstInvalidField,
  validateForgotPassword,
  validateLogin,
  validateRegistration,
  validateResetPassword,
  validateVerifyEmail,
  type ForgotField,
  type ForgotValidationErrors,
  type LoginField,
  type LoginValidationErrors,
  type RegisterField,
  type RegisterValidationErrors,
  type ResetField,
  type ResetValidationErrors,
  type VerifyEmailField,
  type VerifyEmailValidationErrors,
} from './validation';

const { t, locale } = useI18n();
const initialPresentation = readPresentationPreferenceState();
const currentLocale = ref<AuthLocale>(initialPresentation.locale);

applyAuthLocale(currentLocale.value);
locale.value = currentLocale.value;

const {
  loginByEmail,
  registerByEmail,
  forgotPassword,
  resetPassword,
  sendEmailCode,
  verifyEmailCode,
  startGithubLogin,
  probeGithubAvailability,
  completeGithubOAuth,
  isLoading,
  errorMessage,
  successMessage,
  pendingVerificationEmail,
  clearError,
  clearSuccessMessage,
} = useWebAuth();

const INPUT_DARK_CLASS =
  'h-[42px] rounded-[10px] border-white/10 bg-white/[0.06] px-3.5 text-[14px] text-white placeholder:text-white/[0.28] focus-visible:border-primary/50 focus-visible:bg-white/10 focus-visible:ring-1 focus-visible:ring-primary/50 aria-[invalid=true]:border-red-400/70 aria-[invalid=true]:ring-red-400/30';

type Scene = 'password-login' | 'register' | 'forgot' | 'reset' | 'verify-email';

const scene = ref<Scene>('password-login');
const email = ref('');
const password = ref('');
const regEmail = ref('');
const regPassword = ref('');
const confirmPassword = ref('');
const forgotEmail = ref('');
const resetEmail = ref('');
const resetCode = ref('');
const resetPasswordValue = ref('');
const resetConfirmPassword = ref('');
const verifyEmail = ref('');
const verifyCode = ref('');
const authAction = ref<'login' | 'register' | 'forgot' | 'reset' | 'verify' | 'resend' | null>(
  null,
);
const resendSecondsLeft = ref(0);
let resendTimer: ReturnType<typeof setInterval> | null = null;
const loginErrors = reactive<LoginValidationErrors>({});
const registerErrors = reactive<RegisterValidationErrors>({});
const forgotErrors = reactive<ForgotValidationErrors>({});
const resetErrors = reactive<ResetValidationErrors>({});
const verifyErrors = reactive<VerifyEmailValidationErrors>({});
const RESEND_COOLDOWN_SECONDS = 60;

const localeOptions = computed(() => [
  { value: 'zh-CN' as const, label: t('auth.page.locales.zhCN') },
  { value: 'en-US' as const, label: t('auth.page.locales.enUS') },
]);

const legalTermsHref = computed(() =>
  currentLocale.value === 'zh-CN' ? '/legal/terms.zh-CN.html' : '/legal/terms.en-US.html',
);
const legalPrivacyHref = computed(() =>
  currentLocale.value === 'zh-CN' ? '/legal/privacy.zh-CN.html' : '/legal/privacy.en-US.html',
);
const sceneTitle = computed(() => {
  switch (scene.value) {
    case 'register':
      return t('auth.register.heading', { app: APP_DISPLAY_NAME });
    case 'forgot':
      return t('auth.forgot.heading');
    case 'reset':
      return t('auth.reset.heading');
    case 'verify-email':
      return t('auth.verify.heading');
    default:
      return t('auth.login.heading', { app: APP_DISPLAY_NAME });
  }
});
const sceneDescription = computed(() => {
  switch (scene.value) {
    case 'register':
      return t('auth.register.description');
    case 'forgot':
      return t('auth.forgot.description');
    case 'reset':
      return t('auth.reset.description');
    case 'verify-email':
      return verifyEmail.value
        ? t('auth.verify.description', { email: verifyEmail.value })
        : t('auth.verify.descriptionGeneric');
    default:
      return t('auth.page.description');
  }
});
const canResendCode = computed(() => resendSecondsLeft.value <= 0 && !isLoading.value);

function setLocale(nextLocale: AuthLocale) {
  const normalized = normalizeLocale(nextLocale);
  currentLocale.value = normalized;
  locale.value = normalized;
  applyAuthLocale(normalized);
  writePresentationPreferenceState({ locale: normalized });
}

function clearValidationErrors() {
  replaceErrors(loginErrors, {});
  replaceErrors(registerErrors, {});
  replaceErrors(forgotErrors, {});
  replaceErrors(resetErrors, {});
  replaceErrors(verifyErrors, {});
}

function clearResendTimer() {
  if (resendTimer) {
    clearInterval(resendTimer);
    resendTimer = null;
  }
}

function startResendCooldown(seconds = RESEND_COOLDOWN_SECONDS) {
  clearResendTimer();
  resendSecondsLeft.value = seconds;
  resendTimer = setInterval(() => {
    if (resendSecondsLeft.value <= 1) {
      resendSecondsLeft.value = 0;
      clearResendTimer();
      return;
    }
    resendSecondsLeft.value -= 1;
  }, 1000);
}

function switchScene(next: Scene, options?: { keepSuccess?: boolean }) {
  authAction.value = null;
  clearError();
  if (!options?.keepSuccess) {
    clearSuccessMessage();
  }
  clearValidationErrors();
  scene.value = next;
}

function enterVerifyScene(nextEmail: string) {
  verifyEmail.value = nextEmail.trim();
  verifyCode.value = '';
  switchScene('verify-email');
  startResendCooldown();
}

onMounted(async () => {
  const query = new URLSearchParams(window.location.search);
  const sceneQuery = query.get('scene');
  const code = query.get('code') ?? '';
  const state = query.get('state') ?? '';
  if (code && state) {
    authAction.value = 'login';
    await completeGithubOAuth(code, state);
    authAction.value = null;
    return;
  }
  // Gate GitHub entry on server configuration (SERVICE_UNAVAILABLE => hidden).
  // 未配置时服务端返回 SERVICE_UNAVAILABLE，前端隐藏入口。
  githubAvailable.value = await probeGithubAvailability();
  if (sceneQuery === 'verify-email') {
    const emailQuery = query.get('email') ?? '';
    enterVerifyScene(emailQuery || pendingVerificationEmail.value || '');
  } else if (sceneQuery === 'forgot') {
    switchScene('forgot');
  } else if (sceneQuery === 'reset') {
    switchScene('reset');
  }
});

function replaceErrors<T extends Record<string, string | undefined>>(target: T, next: Partial<T>) {
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  Object.assign(target, next);
}

async function focusField(
  field: LoginField | RegisterField | ForgotField | ResetField | VerifyEmailField,
  map: Record<string, string>,
) {
  const fieldId = map[field];
  if (!fieldId) return;
  await nextTick();
  document.getElementById(fieldId)?.focus();
}

async function handleLogin() {
  if (isLoading.value) return;
  const nextErrors = validateLogin({ email: email.value, password: password.value });
  replaceErrors(loginErrors, nextErrors);
  const firstError = firstInvalidField(nextErrors, ['email', 'password'] as const);
  if (firstError) {
    await focusField(firstError, { email: 'email', password: 'password' });
    return;
  }

  authAction.value = 'login';
  const outcome = await loginByEmail({ email: email.value.trim(), password: password.value });
  if (outcome === 'needs-email-verification') {
    enterVerifyScene(pendingVerificationEmail.value ?? email.value);
  }
  if (!outcome) authAction.value = null;
}

async function handleRegister() {
  if (isLoading.value) return;
  const nextErrors = validateRegistration({
    email: regEmail.value,
    password: regPassword.value,
    confirmPassword: confirmPassword.value,
  });
  replaceErrors(registerErrors, nextErrors);
  const firstError = firstInvalidField(nextErrors, [
    'email',
    'password',
    'confirmPassword',
  ] as const);
  if (firstError) {
    await focusField(firstError, {
      email: 'reg-email',
      password: 'reg-password',
      confirmPassword: 'confirm-password',
    });
    return;
  }

  authAction.value = 'register';
  const outcome = await registerByEmail({
    email: regEmail.value.trim(),
    password: regPassword.value,
  });
  if (outcome === 'needs-email-verification') {
    enterVerifyScene(pendingVerificationEmail.value ?? regEmail.value);
  }
  if (!outcome) authAction.value = null;
}

const githubAvailable = ref(false);

async function handleGithubLogin() {
  if (!githubAvailable.value) return;
  authAction.value = 'login';
  // Exact match with OAuth App registered callback (no query string).
  // Callback completion keys off code+state on /auth (see onMounted).
  const redirectUri = `${window.location.origin}/auth`;
  await startGithubLogin(redirectUri);
  authAction.value = null;
}

async function handleForgot() {
  if (isLoading.value) return;
  const nextErrors = validateForgotPassword({ email: forgotEmail.value });
  replaceErrors(forgotErrors, nextErrors);
  const firstError = firstInvalidField(nextErrors, ['email'] as const);
  if (firstError) {
    await focusField(firstError, { email: 'forgot-email' });
    return;
  }

  authAction.value = 'forgot';
  resetEmail.value = forgotEmail.value.trim();
  const success = await forgotPassword({ email: forgotEmail.value.trim() });
  authAction.value = null;
  if (success) {
    startResendCooldown();
  }
}

async function handleReset() {
  if (isLoading.value) return;
  const nextErrors = validateResetPassword({
    email: resetEmail.value,
    code: resetCode.value,
    newPassword: resetPasswordValue.value,
    confirmPassword: resetConfirmPassword.value,
  });
  replaceErrors(resetErrors, nextErrors);
  const firstError = firstInvalidField(nextErrors, [
    'email',
    'code',
    'newPassword',
    'confirmPassword',
  ] as const);
  if (firstError) {
    await focusField(firstError, {
      email: 'reset-email',
      code: 'reset-code',
      newPassword: 'reset-password',
      confirmPassword: 'reset-confirm-password',
    });
    return;
  }

  authAction.value = 'reset';
  const success = await resetPassword({
    email: resetEmail.value.trim(),
    code: resetCode.value.trim(),
    newPassword: resetPasswordValue.value,
  });
  authAction.value = null;
  if (success) {
    email.value = resetEmail.value.trim();
    password.value = '';
    switchScene('password-login', { keepSuccess: true });
  }
}

async function handleVerifyEmail() {
  if (isLoading.value) return;
  const nextErrors = validateVerifyEmail({
    email: verifyEmail.value,
    code: verifyCode.value,
  });
  replaceErrors(verifyErrors, nextErrors);
  const firstError = firstInvalidField(nextErrors, ['email', 'code'] as const);
  if (firstError) {
    await focusField(firstError, { email: 'verify-email', code: 'verify-code' });
    return;
  }

  authAction.value = 'verify';
  const success = await verifyEmailCode({
    email: verifyEmail.value.trim(),
    code: verifyCode.value.trim(),
    purpose: 'EmailVerify',
  });
  if (!success) authAction.value = null;
}

async function handleResendVerification() {
  if (!canResendCode.value) return;
  authAction.value = 'resend';
  const success = await sendEmailCode({
    email: verifyEmail.value.trim() || undefined,
    purpose: 'EmailVerify',
  });
  authAction.value = null;
  if (success) {
    startResendCooldown();
  }
}

async function handleResendResetCode() {
  if (!canResendCode.value || !resetEmail.value.trim()) return;
  authAction.value = 'resend';
  const success = await forgotPassword({ email: resetEmail.value.trim() });
  authAction.value = null;
  if (success) {
    startResendCooldown();
  }
}

watch([email, password], () => {
  clearError();
  const nextErrors = validateLogin({ email: email.value, password: password.value });
  if (loginErrors.email && !nextErrors.email) delete loginErrors.email;
  if (loginErrors.password && !nextErrors.password) delete loginErrors.password;
});

watch([regEmail, regPassword, confirmPassword], () => {
  clearError();
  const nextErrors = validateRegistration({
    email: regEmail.value,
    password: regPassword.value,
    confirmPassword: confirmPassword.value,
  });
  if (registerErrors.email && !nextErrors.email) delete registerErrors.email;
  if (registerErrors.password && !nextErrors.password) delete registerErrors.password;
  if (registerErrors.confirmPassword && !nextErrors.confirmPassword) {
    delete registerErrors.confirmPassword;
  }
});

watch(forgotEmail, () => {
  clearError();
  clearSuccessMessage();
  const nextErrors = validateForgotPassword({ email: forgotEmail.value });
  if (forgotErrors.email && !nextErrors.email) delete forgotErrors.email;
});

watch([resetEmail, resetCode, resetPasswordValue, resetConfirmPassword], () => {
  clearError();
  clearSuccessMessage();
  const nextErrors = validateResetPassword({
    email: resetEmail.value,
    code: resetCode.value,
    newPassword: resetPasswordValue.value,
    confirmPassword: resetConfirmPassword.value,
  });
  if (resetErrors.email && !nextErrors.email) delete resetErrors.email;
  if (resetErrors.code && !nextErrors.code) delete resetErrors.code;
  if (resetErrors.newPassword && !nextErrors.newPassword) delete resetErrors.newPassword;
  if (resetErrors.confirmPassword && !nextErrors.confirmPassword) {
    delete resetErrors.confirmPassword;
  }
});

watch([verifyEmail, verifyCode], () => {
  clearError();
  clearSuccessMessage();
  const nextErrors = validateVerifyEmail({
    email: verifyEmail.value,
    code: verifyCode.value,
  });
  if (verifyErrors.email && !nextErrors.email) delete verifyErrors.email;
  if (verifyErrors.code && !nextErrors.code) delete verifyErrors.code;
});

onUnmounted(() => {
  clearResendTimer();
});
</script>

<template>
  <main
    class="relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_top,#4c1d9530,transparent_42%),linear-gradient(180deg,#2d1834_0%,#25152f_45%,#1f162e_100%)] px-4 py-16 text-white selection:bg-primary/30"
    data-testid="web-auth-page"
  >
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        class="absolute -left-[28%] top-[62%] h-[18rem] w-[18rem] rounded-full bg-fuchsia-500/[0.18] blur-[120px]"
      />
      <div
        class="absolute -right-[26%] top-[58%] h-[18rem] w-[18rem] rounded-full bg-blue-500/[0.18] blur-[130px]"
      />
    </div>

    <div
      class="absolute right-4 top-4 z-10 flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.04] p-0.5"
      role="group"
      :aria-label="t('auth.page.languageSelector')"
      data-testid="auth-language-selector"
    >
      <Button
        v-for="option in localeOptions"
        :key="option.value"
        size="sm"
        :variant="currentLocale === option.value ? 'default' : 'ghost'"
        :aria-pressed="currentLocale === option.value"
        :data-testid="`auth-locale-${option.value}`"
        class="h-7 rounded-full px-2.5 text-[11px] text-white/70 hover:text-white"
        @click="setLocale(option.value)"
      >
        {{ option.label }}
      </Button>
    </div>

    <section class="relative z-10 w-full max-w-[380px]" :aria-labelledby="'auth-scene-title'">
      <Card
        class="w-full border-white/[0.06] bg-[radial-gradient(circle_at_top,#4c1d9530,transparent_42%),linear-gradient(180deg,#2d1834_0%,#25152f_45%,#1f162e_100%)] text-white shadow-2xl backdrop-blur-sm"
      >
        <CardContent class="flex flex-col items-center px-6 pb-6 pt-8">
          <div
            class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/5 px-3 py-1 text-[11px] tracking-[0.24em] text-white/[0.48]"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-sky-300/80" aria-hidden="true" />
            <span class="h-1.5 w-1.5 rounded-full bg-violet-300/80" aria-hidden="true" />
            <span class="text-[10px] tracking-[0.28em]">{{ APP_DISPLAY_NAME.toUpperCase() }}</span>
          </div>

          <div
            class="relative mb-4 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full border border-white/[0.7] bg-white/[0.08] shadow-[0_20px_45px_rgba(0,0,0,0.35)]"
          >
            <img
              :src="logo128"
              :alt="APP_DISPLAY_NAME"
              class="h-11 w-11 rounded-full object-cover"
            />
            <div
              class="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),transparent_60%)]"
              aria-hidden="true"
            />
          </div>

          <h1 id="auth-scene-title" class="text-center text-xl font-semibold">
            {{ sceneTitle }}
          </h1>
          <p class="mb-4 mt-1 text-center text-[13px] text-white/50">{{ sceneDescription }}</p>

          <p
            v-if="errorMessage"
            data-testid="auth-error-banner"
            class="mb-4 w-full rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-[13px] text-red-300"
            role="alert"
            aria-live="assertive"
          >
            {{ errorMessage }}
          </p>

          <p
            v-if="successMessage && !errorMessage"
            data-testid="auth-success-banner"
            class="mb-4 w-full rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center text-[13px] text-emerald-200"
            role="status"
            aria-live="polite"
          >
            {{ successMessage }}
          </p>

          <form
            v-if="scene === 'password-login'"
            class="w-full"
            data-testid="login-form"
            novalidate
            @submit.prevent="handleLogin"
          >
            <div class="space-y-3">
              <div data-testid="login-username-input">
                <Label for="email" class="mb-1 block text-[12px] text-white/[0.55]">
                  {{ t('auth.field.email') }}
                </Label>
                <Input
                  id="email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  :placeholder="t('auth.page.emailPlaceholder')"
                  :class="INPUT_DARK_CLASS"
                  :disabled="isLoading"
                  :aria-invalid="Boolean(loginErrors.email)"
                  :aria-describedby="loginErrors.email ? 'email-error' : undefined"
                />
                <p
                  v-if="loginErrors.email"
                  id="email-error"
                  class="mt-1 text-xs text-red-300"
                  data-testid="login-email-error"
                >
                  {{ t(loginErrors.email) }}
                </p>
              </div>
              <div data-testid="login-password-input">
                <Label for="password" class="mb-1 block text-[12px] text-white/[0.55]">
                  {{ t('auth.field.password') }}
                </Label>
                <Input
                  id="password"
                  v-model="password"
                  type="password"
                  autocomplete="current-password"
                  :class="INPUT_DARK_CLASS"
                  :disabled="isLoading"
                  :aria-invalid="Boolean(loginErrors.password)"
                  :aria-describedby="loginErrors.password ? 'password-error' : undefined"
                />
                <p
                  v-if="loginErrors.password"
                  id="password-error"
                  class="mt-1 text-xs text-red-300"
                  data-testid="login-password-error"
                >
                  {{ t(loginErrors.password) }}
                </p>
              </div>
            </div>

            <div class="mt-2 flex justify-end">
              <Button
                type="button"
                variant="link"
                class="h-auto px-0 py-0 text-[12px] text-white/[0.46] hover:text-white/[0.78]"
                data-testid="login-forgot-link"
                @click="switchScene('forgot')"
              >
                {{ t('auth.login.forgotLink') }}
              </Button>
            </div>

            <Button
              class="mt-3 h-[40px] w-full rounded-[10px] bg-primary text-[15px] font-medium tracking-wide shadow-[0_10px_30px_rgba(29,78,216,0.28)] transition-all hover:bg-primary/90 hover:shadow-[0_14px_34px_rgba(29,78,216,0.42)]"
              type="submit"
              :disabled="isLoading"
              data-testid="login-submit-button"
            >
              <Loader2
                v-if="isLoading && authAction === 'login'"
                class="mr-2 h-[18px] w-[18px] animate-spin"
              />
              <template v-if="isLoading && authAction === 'login'">
                {{ t('auth.login.submitting') }}
              </template>
              <template v-else>{{ t('auth.login.submit') }}</template>
            </Button>

            <Button
              v-if="githubAvailable"
              type="button"
              variant="outline"
              class="mt-3 h-[40px] w-full rounded-[10px] border-white/15 bg-white/[0.04] text-[14px] text-white/80 hover:bg-white/[0.08]"
              :disabled="isLoading"
              data-testid="login-github-button"
              @click="handleGithubLogin"
            >
              {{ t('auth.login.github', 'Continue with GitHub') }}
            </Button>
          </form>

          <form
            v-else-if="scene === 'register'"
            class="w-full"
            data-testid="register-form"
            novalidate
            @submit.prevent="handleRegister"
          >
            <div class="space-y-3">
              <div data-testid="register-email-input">
                <Label for="reg-email" class="mb-1 block text-[12px] text-white/[0.55]">
                  {{ t('auth.field.email') }}
                </Label>
                <Input
                  id="reg-email"
                  v-model="regEmail"
                  type="email"
                  autocomplete="email"
                  :placeholder="t('auth.page.emailPlaceholder')"
                  :class="INPUT_DARK_CLASS"
                  :disabled="isLoading"
                  :aria-invalid="Boolean(registerErrors.email)"
                  :aria-describedby="registerErrors.email ? 'reg-email-error' : undefined"
                />
                <p
                  v-if="registerErrors.email"
                  id="reg-email-error"
                  class="mt-1 text-xs text-red-300"
                  data-testid="register-email-error"
                >
                  {{ t(registerErrors.email) }}
                </p>
              </div>
              <div data-testid="register-password-input">
                <Label for="reg-password" class="mb-1 block text-[12px] text-white/[0.55]">
                  {{ t('auth.field.password') }}
                </Label>
                <Input
                  id="reg-password"
                  v-model="regPassword"
                  type="password"
                  autocomplete="new-password"
                  :class="INPUT_DARK_CLASS"
                  :disabled="isLoading"
                  :aria-invalid="Boolean(registerErrors.password)"
                  :aria-describedby="registerErrors.password ? 'reg-password-error' : undefined"
                />
                <p
                  v-if="registerErrors.password"
                  id="reg-password-error"
                  class="mt-1 text-xs text-red-300"
                  data-testid="register-password-error"
                >
                  {{ t(registerErrors.password) }}
                </p>
              </div>
              <div data-testid="register-confirm-password-input">
                <Label for="confirm-password" class="mb-1 block text-[12px] text-white/[0.55]">
                  {{ t('auth.field.confirmPassword') }}
                </Label>
                <Input
                  id="confirm-password"
                  v-model="confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  :class="INPUT_DARK_CLASS"
                  :disabled="isLoading"
                  :aria-invalid="Boolean(registerErrors.confirmPassword)"
                  :aria-describedby="
                    registerErrors.confirmPassword ? 'confirm-password-error' : undefined
                  "
                />
                <p
                  v-if="registerErrors.confirmPassword"
                  id="confirm-password-error"
                  class="mt-1 text-xs text-red-300"
                  data-testid="register-confirm-password-error"
                >
                  {{ t(registerErrors.confirmPassword) }}
                </p>
              </div>
            </div>

            <Button
              class="mt-5 h-[40px] w-full rounded-[10px] bg-primary text-[15px] font-medium tracking-wide shadow-[0_10px_30px_rgba(29,78,216,0.28)] transition-all hover:bg-primary/90 hover:shadow-[0_14px_34px_rgba(29,78,216,0.42)]"
              type="submit"
              :disabled="isLoading"
              data-testid="register-submit-button"
            >
              <Loader2
                v-if="isLoading && authAction === 'register'"
                class="mr-2 h-[18px] w-[18px] animate-spin"
              />
              <template v-if="isLoading && authAction === 'register'">
                {{ t('auth.register.submitting') }}
              </template>
              <template v-else>{{ t('auth.register.submit') }}</template>
            </Button>
          </form>

          <form
            v-else-if="scene === 'forgot'"
            class="w-full"
            data-testid="forgot-form"
            novalidate
            @submit.prevent="handleForgot"
          >
            <div class="space-y-3">
              <div data-testid="forgot-email-input">
                <Label for="forgot-email" class="mb-1 block text-[12px] text-white/[0.55]">
                  {{ t('auth.field.email') }}
                </Label>
                <Input
                  id="forgot-email"
                  v-model="forgotEmail"
                  type="email"
                  autocomplete="email"
                  :placeholder="t('auth.page.emailPlaceholder')"
                  :class="INPUT_DARK_CLASS"
                  :disabled="isLoading"
                  :aria-invalid="Boolean(forgotErrors.email)"
                  :aria-describedby="forgotErrors.email ? 'forgot-email-error' : undefined"
                />
                <p
                  v-if="forgotErrors.email"
                  id="forgot-email-error"
                  class="mt-1 text-xs text-red-300"
                  data-testid="forgot-email-error"
                >
                  {{ t(forgotErrors.email) }}
                </p>
              </div>
            </div>

            <Button
              class="mt-5 h-[40px] w-full rounded-[10px] bg-primary text-[15px] font-medium tracking-wide shadow-[0_10px_30px_rgba(29,78,216,0.28)] transition-all hover:bg-primary/90 hover:shadow-[0_14px_34px_rgba(29,78,216,0.42)]"
              type="submit"
              :disabled="isLoading"
              data-testid="forgot-submit-button"
            >
              <Loader2
                v-if="isLoading && authAction === 'forgot'"
                class="mr-2 h-[18px] w-[18px] animate-spin"
              />
              <template v-if="isLoading && authAction === 'forgot'">
                {{ t('auth.forgot.submitting') }}
              </template>
              <template v-else>{{ t('auth.forgot.submit') }}</template>
            </Button>

            <Button
              v-if="successMessage"
              type="button"
              variant="secondary"
              class="mt-3 h-[40px] w-full rounded-[10px]"
              data-testid="forgot-next-button"
              @click="
                resetEmail = forgotEmail.trim();
                switchScene('reset');
              "
            >
              {{ t('auth.forgot.next') }}
            </Button>
          </form>

          <form
            v-else-if="scene === 'reset'"
            class="w-full"
            data-testid="reset-form"
            novalidate
            @submit.prevent="handleReset"
          >
            <div class="space-y-3">
              <div data-testid="reset-email-input">
                <Label for="reset-email" class="mb-1 block text-[12px] text-white/[0.55]">
                  {{ t('auth.field.email') }}
                </Label>
                <Input
                  id="reset-email"
                  v-model="resetEmail"
                  type="email"
                  autocomplete="email"
                  :placeholder="t('auth.page.emailPlaceholder')"
                  :class="INPUT_DARK_CLASS"
                  :disabled="isLoading"
                  :aria-invalid="Boolean(resetErrors.email)"
                  :aria-describedby="resetErrors.email ? 'reset-email-error' : undefined"
                />
                <p
                  v-if="resetErrors.email"
                  id="reset-email-error"
                  class="mt-1 text-xs text-red-300"
                  data-testid="reset-email-error"
                >
                  {{ t(resetErrors.email) }}
                </p>
              </div>
              <div data-testid="reset-code-input">
                <Label for="reset-code" class="mb-1 block text-[12px] text-white/[0.55]">
                  {{ t('auth.field.code') }}
                </Label>
                <Input
                  id="reset-code"
                  v-model="resetCode"
                  type="text"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  maxlength="6"
                  :placeholder="t('auth.page.codePlaceholder')"
                  :class="INPUT_DARK_CLASS"
                  :disabled="isLoading"
                  :aria-invalid="Boolean(resetErrors.code)"
                  :aria-describedby="resetErrors.code ? 'reset-code-error' : undefined"
                />
                <p
                  v-if="resetErrors.code"
                  id="reset-code-error"
                  class="mt-1 text-xs text-red-300"
                  data-testid="reset-code-error"
                >
                  {{ t(resetErrors.code) }}
                </p>
              </div>
              <div data-testid="reset-password-input">
                <Label for="reset-password" class="mb-1 block text-[12px] text-white/[0.55]">
                  {{ t('auth.field.newPassword') }}
                </Label>
                <Input
                  id="reset-password"
                  v-model="resetPasswordValue"
                  type="password"
                  autocomplete="new-password"
                  :class="INPUT_DARK_CLASS"
                  :disabled="isLoading"
                  :aria-invalid="Boolean(resetErrors.newPassword)"
                  :aria-describedby="resetErrors.newPassword ? 'reset-password-error' : undefined"
                />
                <p
                  v-if="resetErrors.newPassword"
                  id="reset-password-error"
                  class="mt-1 text-xs text-red-300"
                  data-testid="reset-password-error"
                >
                  {{ t(resetErrors.newPassword) }}
                </p>
              </div>
              <div data-testid="reset-confirm-password-input">
                <Label
                  for="reset-confirm-password"
                  class="mb-1 block text-[12px] text-white/[0.55]"
                >
                  {{ t('auth.field.confirmPassword') }}
                </Label>
                <Input
                  id="reset-confirm-password"
                  v-model="resetConfirmPassword"
                  type="password"
                  autocomplete="new-password"
                  :class="INPUT_DARK_CLASS"
                  :disabled="isLoading"
                  :aria-invalid="Boolean(resetErrors.confirmPassword)"
                  :aria-describedby="
                    resetErrors.confirmPassword ? 'reset-confirm-password-error' : undefined
                  "
                />
                <p
                  v-if="resetErrors.confirmPassword"
                  id="reset-confirm-password-error"
                  class="mt-1 text-xs text-red-300"
                  data-testid="reset-confirm-password-error"
                >
                  {{ t(resetErrors.confirmPassword) }}
                </p>
              </div>
            </div>

            <Button
              class="mt-5 h-[40px] w-full rounded-[10px] bg-primary text-[15px] font-medium tracking-wide shadow-[0_10px_30px_rgba(29,78,216,0.28)] transition-all hover:bg-primary/90 hover:shadow-[0_14px_34px_rgba(29,78,216,0.42)]"
              type="submit"
              :disabled="isLoading"
              data-testid="reset-submit-button"
            >
              <Loader2
                v-if="isLoading && authAction === 'reset'"
                class="mr-2 h-[18px] w-[18px] animate-spin"
              />
              <template v-if="isLoading && authAction === 'reset'">
                {{ t('auth.reset.submitting') }}
              </template>
              <template v-else>{{ t('auth.reset.submit') }}</template>
            </Button>

            <Button
              type="button"
              variant="link"
              class="mt-3 h-auto w-full px-0 py-0 text-[12.5px] text-white/[0.46] hover:text-white/[0.78]"
              :disabled="!canResendCode"
              data-testid="reset-resend-button"
              @click="handleResendResetCode"
            >
              <template v-if="resendSecondsLeft > 0">
                {{ t('auth.verify.resendIn', { seconds: resendSecondsLeft }) }}
              </template>
              <template v-else>{{ t('auth.reset.backToForgot') }}</template>
            </Button>
          </form>

          <form
            v-else
            class="w-full"
            data-testid="verify-email-form"
            novalidate
            @submit.prevent="handleVerifyEmail"
          >
            <div class="space-y-3">
              <div data-testid="verify-email-input">
                <Label for="verify-email" class="mb-1 block text-[12px] text-white/[0.55]">
                  {{ t('auth.field.email') }}
                </Label>
                <Input
                  id="verify-email"
                  v-model="verifyEmail"
                  type="email"
                  autocomplete="email"
                  :placeholder="t('auth.page.emailPlaceholder')"
                  :class="INPUT_DARK_CLASS"
                  :disabled="isLoading"
                  :aria-invalid="Boolean(verifyErrors.email)"
                  :aria-describedby="verifyErrors.email ? 'verify-email-error' : undefined"
                />
                <p
                  v-if="verifyErrors.email"
                  id="verify-email-error"
                  class="mt-1 text-xs text-red-300"
                  data-testid="verify-email-error"
                >
                  {{ t(verifyErrors.email) }}
                </p>
              </div>
              <div data-testid="verify-code-input">
                <Label for="verify-code" class="mb-1 block text-[12px] text-white/[0.55]">
                  {{ t('auth.field.code') }}
                </Label>
                <Input
                  id="verify-code"
                  v-model="verifyCode"
                  type="text"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  maxlength="6"
                  :placeholder="t('auth.page.codePlaceholder')"
                  :class="INPUT_DARK_CLASS"
                  :disabled="isLoading"
                  :aria-invalid="Boolean(verifyErrors.code)"
                  :aria-describedby="verifyErrors.code ? 'verify-code-error' : undefined"
                />
                <p
                  v-if="verifyErrors.code"
                  id="verify-code-error"
                  class="mt-1 text-xs text-red-300"
                  data-testid="verify-code-error"
                >
                  {{ t(verifyErrors.code) }}
                </p>
              </div>
            </div>

            <Button
              class="mt-5 h-[40px] w-full rounded-[10px] bg-primary text-[15px] font-medium tracking-wide shadow-[0_10px_30px_rgba(29,78,216,0.28)] transition-all hover:bg-primary/90 hover:shadow-[0_14px_34px_rgba(29,78,216,0.42)]"
              type="submit"
              :disabled="isLoading"
              data-testid="verify-submit-button"
            >
              <Loader2
                v-if="isLoading && authAction === 'verify'"
                class="mr-2 h-[18px] w-[18px] animate-spin"
              />
              <template v-if="isLoading && authAction === 'verify'">
                {{ t('auth.verify.submitting') }}
              </template>
              <template v-else>{{ t('auth.verify.submit') }}</template>
            </Button>

            <Button
              type="button"
              variant="link"
              class="mt-3 h-auto w-full px-0 py-0 text-[12.5px] text-white/[0.46] hover:text-white/[0.78]"
              :disabled="!canResendCode"
              data-testid="verify-resend-button"
              @click="handleResendVerification"
            >
              <template v-if="resendSecondsLeft > 0">
                {{ t('auth.verify.resendIn', { seconds: resendSecondsLeft }) }}
              </template>
              <template v-else>{{ t('auth.verify.resend') }}</template>
            </Button>
          </form>

          <div class="mt-5 flex items-center justify-center text-[12.5px] text-white/[0.46]">
            <Button
              v-if="scene === 'password-login'"
              type="button"
              variant="link"
              class="h-auto px-0 py-0 text-white/[0.46] hover:text-white/[0.78]"
              @click="switchScene('register')"
            >
              {{ t('auth.login.registerLink') }}
            </Button>
            <Button
              v-else-if="scene === 'register'"
              type="button"
              variant="link"
              class="h-auto px-0 py-0 text-white/[0.46] hover:text-white/[0.78]"
              @click="switchScene('password-login')"
            >
              {{ t('auth.register.loginLink') }}
            </Button>
            <Button
              v-else
              type="button"
              variant="link"
              class="h-auto px-0 py-0 text-white/[0.46] hover:text-white/[0.78]"
              data-testid="auth-back-to-login"
              @click="switchScene('password-login')"
            >
              <template v-if="scene === 'forgot'">{{ t('auth.forgot.backToLogin') }}</template>
              <template v-else-if="scene === 'reset'">{{ t('auth.reset.backToLogin') }}</template>
              <template v-else>{{ t('auth.verify.backToLogin') }}</template>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>

    <footer
      class="relative z-10 mt-6 max-w-[380px] px-2 text-center text-[11px] leading-5 text-white/[0.38]"
      data-testid="auth-legal-footer"
    >
      <span>{{ t('auth.page.legalNoticePrefix') }}</span>
      <a
        :href="legalTermsHref"
        target="_blank"
        rel="noopener noreferrer"
        class="underline decoration-white/25 underline-offset-2 hover:text-white/70"
        data-testid="auth-terms-link"
      >
        {{ t('auth.page.termsOfService') }}
      </a>
      <span>{{ t('auth.page.legalNoticeMid') }}</span>
      <a
        :href="legalPrivacyHref"
        target="_blank"
        rel="noopener noreferrer"
        class="underline decoration-white/25 underline-offset-2 hover:text-white/70"
        data-testid="auth-privacy-link"
      >
        {{ t('auth.page.privacyPolicy') }}
      </a>
      <span>{{ t('auth.page.legalNoticeSuffix') }}</span>
    </footer>
  </main>
</template>
