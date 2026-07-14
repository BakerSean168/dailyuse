<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { APP_DISPLAY_NAME, logo128 } from '@dailyuse/assets';
import {
  Card,
  CardContent,
  CardFooter,
} from '@dailyuse/ui-vue-shadcn/components/ui/card';
import { Button } from '@dailyuse/ui-vue-shadcn/components/ui/button';
import { Input } from '@dailyuse/ui-vue-shadcn/components/ui/input';
import { Label } from '@dailyuse/ui-vue-shadcn/components/ui/label';
import { Loader2 } from '@lucide/vue';

import { useWebAuth } from './useWebAuth';
import {
  applyAuthLocale,
  applyAuthTheme,
  normalizeLocale,
  normalizeTheme,
  readPresentationPreferenceState,
  writePresentationPreferenceState,
  type AuthLocale,
  type AuthThemeMode,
} from './presentation';

const { t, locale } = useI18n();
const initialPresentation = readPresentationPreferenceState();

const currentLocale = ref<AuthLocale>(initialPresentation.locale);
const currentTheme = ref<AuthThemeMode>(initialPresentation.theme);

applyAuthLocale(currentLocale.value);
applyAuthTheme(currentTheme.value);
locale.value = currentLocale.value;

const { loginByEmail, registerByEmail, isLoading, error } = useWebAuth();

const INPUT_DARK_CLASS =
  'h-[42px] rounded-[10px] border-white/10 bg-white/[0.06] px-3.5 text-[14px] text-white placeholder:text-white/[0.28] focus-visible:border-primary/50 focus-visible:bg-white/10 focus-visible:ring-1 focus-visible:ring-primary/50';

type Scene = 'password-login' | 'register';

const scene = ref<Scene>('password-login');

const email = ref('');
const password = ref('');
const regEmail = ref('');
const regPassword = ref('');
const confirmPassword = ref('');
const authAction = ref<'login' | 'register' | null>(null);

const localeOptions = computed(() => [
  { value: 'zh-CN' as const, label: t('auth.page.locales.zhCN') },
  { value: 'en-US' as const, label: t('auth.page.locales.enUS') },
]);

const themeOptions = computed(() => [
  { value: 'auto' as const, label: t('auth.page.themes.auto') },
  { value: 'light' as const, label: t('auth.page.themes.light') },
  { value: 'dark' as const, label: t('auth.page.themes.dark') },
]);

function setLocale(nextLocale: AuthLocale) {
  const normalized = normalizeLocale(nextLocale);
  currentLocale.value = normalized;
  locale.value = normalized;
  applyAuthLocale(normalized);
  writePresentationPreferenceState({ locale: normalized });
}

function setTheme(nextTheme: AuthThemeMode) {
  const normalized = normalizeTheme(nextTheme);
  currentTheme.value = normalized;
  applyAuthTheme(normalized);
  writePresentationPreferenceState({ theme: normalized });
}

function switchScene(next: Scene) {
  authAction.value = null;
  scene.value = next;
}

async function handleLogin() {
  if (!email.value || !password.value) {
    return;
  }

  authAction.value = 'login';
  const success = await loginByEmail({ email: email.value, password: password.value });
  if (!success) {
    authAction.value = null;
  }
}

async function handleRegister() {
  if (!regEmail.value || !regPassword.value || !confirmPassword.value) {
    return;
  }

  if (regPassword.value !== confirmPassword.value) {
    return;
  }

  authAction.value = 'register';
  const success = await registerByEmail({ email: regEmail.value, password: regPassword.value });
  if (!success) {
    authAction.value = null;
  }
}
</script>

<template>
  <div
    class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#4c1d9530,transparent_42%),linear-gradient(180deg,#2d1834_0%,#25152f_45%,#1f162e_100%)] text-white selection:bg-primary/30"
  >
    <!-- Ambient glow -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -left-[28%] top-[62%] h-[18rem] w-[18rem] rounded-full bg-fuchsia-500/[0.18] blur-[120px]"
      ></div>
      <div
        class="absolute -right-[26%] top-[58%] h-[18rem] w-[18rem] rounded-full bg-blue-500/[0.18] blur-[130px]"
      ></div>
    </div>

    <!-- Language / Theme switchers -->
    <div class="absolute right-4 top-4 z-10 flex items-center gap-1.5">
      <div class="flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.04] p-0.5">
        <Button
          v-for="option in localeOptions"
          :key="option.value"
          size="sm"
          :variant="currentLocale === option.value ? 'default' : 'ghost'"
          class="h-7 rounded-full px-2.5 text-[11px] text-white/70 hover:text-white"
          @click="setLocale(option.value)"
        >
          {{ option.label }}
        </Button>
      </div>

      <div class="flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.04] p-0.5">
        <Button
          v-for="option in themeOptions"
          :key="option.value"
          size="sm"
          :variant="currentTheme === option.value ? 'default' : 'ghost'"
          class="h-7 rounded-full px-2.5 text-[11px] text-white/70 hover:text-white"
          @click="setTheme(option.value)"
        >
          {{ option.label }}
        </Button>
      </div>
    </div>

    <!-- Main card -->
    <Card
      class="relative z-10 w-full max-w-[380px] border-white/[0.06] bg-[radial-gradient(circle_at_top,#4c1d9530,transparent_42%),linear-gradient(180deg,#2d1834_0%,#25152f_45%,#1f162e_100%)] text-white shadow-2xl backdrop-blur-sm"
    >
      <CardContent class="flex flex-col items-center px-6 pb-4 pt-8">
        <!-- Brand badge -->
        <div
          class="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/5 px-3 py-1 text-[11px] tracking-[0.24em] text-white/[0.48]"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-sky-300/80"></span>
          <span class="h-1.5 w-1.5 rounded-full bg-violet-300/80"></span>
          <span class="text-[10px] tracking-[0.28em]">{{ APP_DISPLAY_NAME.toUpperCase() }}</span>
        </div>

        <!-- Avatar circle -->
        <div
          class="relative mb-5 flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full border border-white/[0.7] bg-white/[0.08] shadow-[0_20px_45px_rgba(0,0,0,0.35)]"
        >
          <img :src="logo128" :alt="APP_DISPLAY_NAME" class="h-12 w-12 rounded-full object-cover" />
          <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),transparent_60%)]"></div>
        </div>

        <!-- Error banner -->
        <p
          v-if="error"
          data-testid="auth-error-banner"
          class="mb-4 w-full rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-[13px] text-red-300"
        >
          {{ error }}
        </p>

        <!-- Scene: password-login -->
        <template v-if="scene === 'password-login'">
          <p class="mb-4 text-[13px] text-white/50">{{ t('auth.page.description') }}</p>

          <div class="w-full space-y-3">
            <div data-testid="login-username-input">
              <Label for="email" class="mb-1 block text-[12px] text-white/[0.55]">
                {{ t('auth.field.email') }}
              </Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                :placeholder="t('auth.page.emailPlaceholder')"
                :class="INPUT_DARK_CLASS"
                :disabled="isLoading"
              />
            </div>
            <div data-testid="login-password-input">
              <Label for="password" class="mb-1 block text-[12px] text-white/[0.55]">
                {{ t('auth.field.password') }}
              </Label>
              <Input
                id="password"
                v-model="password"
                type="password"
                :class="INPUT_DARK_CLASS"
                :disabled="isLoading"
                @keyup.enter="handleLogin"
              />
            </div>
          </div>

          <Button
            class="mt-5 h-[40px] w-full rounded-[10px] bg-primary text-[15px] font-medium tracking-wide shadow-[0_10px_30px_rgba(29,78,216,0.28)] transition-all hover:bg-primary/90 hover:shadow-[0_14px_34px_rgba(29,78,216,0.42)]"
            type="button"
            :disabled="isLoading"
            data-testid="login-submit-button"
            @click="handleLogin"
          >
            <Loader2 v-if="isLoading && authAction === 'login'" class="mr-2 h-[18px] w-[18px] animate-spin" />
            <template v-if="isLoading && authAction === 'login'">{{ t('auth.login.submitting') }}</template>
            <template v-else>{{ t('auth.login.submit') }}</template>
          </Button>
        </template>

        <!-- Scene: register -->
        <template v-else-if="scene === 'register'">
          <p class="mb-4 text-[13px] text-white/50">{{ t('auth.register.description') }}</p>

          <div class="w-full space-y-3">
            <div data-testid="register-email-input">
              <Label for="reg-email" class="mb-1 block text-[12px] text-white/[0.55]">
                {{ t('auth.field.email') }}
              </Label>
              <Input
                id="reg-email"
                v-model="regEmail"
                type="email"
                :placeholder="t('auth.page.emailPlaceholder')"
                :class="INPUT_DARK_CLASS"
                :disabled="isLoading"
              />
            </div>
            <div data-testid="register-password-input">
              <Label for="reg-password" class="mb-1 block text-[12px] text-white/[0.55]">
                {{ t('auth.field.password') }}
              </Label>
              <Input
                id="reg-password"
                v-model="regPassword"
                type="password"
                :class="INPUT_DARK_CLASS"
                :disabled="isLoading"
              />
            </div>
            <div data-testid="register-confirm-password-input">
              <Label for="confirm-password" class="mb-1 block text-[12px] text-white/[0.55]">
                {{ t('auth.field.confirmPassword') }}
              </Label>
              <Input
                id="confirm-password"
                v-model="confirmPassword"
                type="password"
                :class="INPUT_DARK_CLASS"
                :disabled="isLoading"
                @keyup.enter="handleRegister"
              />
            </div>
          </div>

          <Button
            class="mt-5 h-[40px] w-full rounded-[10px] bg-primary text-[15px] font-medium tracking-wide shadow-[0_10px_30px_rgba(29,78,216,0.28)] transition-all hover:bg-primary/90 hover:shadow-[0_14px_34px_rgba(29,78,216,0.42)]"
            type="button"
            :disabled="isLoading"
            data-testid="register-submit-button"
            @click="handleRegister"
          >
            <Loader2 v-if="isLoading && authAction === 'register'" class="mr-2 h-[18px] w-[18px] animate-spin" />
            <template v-if="isLoading && authAction === 'register'">{{ t('auth.register.submitting') }}</template>
            <template v-else>{{ t('auth.register.submit') }}</template>
          </Button>
        </template>

        <!-- Bottom scene-switch links -->
        <div class="mt-5 flex items-center justify-center gap-3 text-[12.5px] text-white/[0.46]">
          <template v-if="scene === 'password-login'">
            <Button
              variant="link"
              class="h-auto px-0 py-0 text-white/[0.46] hover:text-white/[0.78]"
              @click="switchScene('register')"
            >
              {{ t('auth.login.registerLink') }}
            </Button>
            <span class="text-white/[0.22]">|</span>
            <span class="text-[12.5px] text-white/[0.30]">{{ t('auth.login.forgotPassword') }}</span>
          </template>
          <template v-else-if="scene === 'register'">
            <Button
              variant="link"
              class="h-auto px-0 py-0 text-white/[0.46] hover:text-white/[0.78]"
              @click="switchScene('password-login')"
            >
              {{ t('auth.register.loginLink') }}
            </Button>
          </template>
        </div>
      </CardContent>

      <CardFooter class="justify-center pb-5 text-[11px] text-white/[0.30]">
        {{ t('auth.page.legalNotice') }}
      </CardFooter>
    </Card>
  </div>
</template>
