<script setup lang="ts">
/**
 * AuthView - 认证视图
 *
 * Shadcn UI + Tailwind CSS (Linear Style).
 * Platform-agnostic: uses injected useAuth composable via DI.
 */
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { APP_DISPLAY_NAME, logo128 } from '@dailyuse/assets';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Input,
  Label,
} from '@dailyuse/ui-vue-shadcn';
import { UserRound } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useAuth } from '../modules/authentication/composables/useAuth';
import {
  usePresentationPreferenceStore,
  type PresentationThemeMode,
} from '../modules/setting';

const { t } = useI18n();
const presentationStore = usePresentationPreferenceStore();
const { loginByEmail, registerByEmail, enterGuestMode, isLoading, error } = useAuth();

const email = ref('');
const password = ref('');
const regEmail = ref('');
const regPassword = ref('');
const confirmPassword = ref('');
const authAction = ref<'login' | 'register' | 'guest' | null>(null);

const authLoadingMessage = computed(() => {
  if (authAction.value === 'register') {
    return t('auth.register.submitting');
  }
  if (authAction.value === 'guest') {
    return t('auth.page.guestLoading');
  }
  return t('auth.login.submitting');
});

const localeOptions = computed(() => [
  { value: 'zh-CN' as const, label: t('auth.page.locales.zhCN') },
  { value: 'en-US' as const, label: t('auth.page.locales.enUS') },
]);

const themeOptions = computed(() => [
  { value: 'auto' as PresentationThemeMode, label: t('auth.page.themes.auto') },
  { value: 'light' as PresentationThemeMode, label: t('auth.page.themes.light') },
  { value: 'dark' as PresentationThemeMode, label: t('auth.page.themes.dark') },
]);

const handleLogin = async () => {
  if (!email.value || !password.value) {
    toast.error(t('auth.toast.loginFailed'), {
      description: t('auth.validation.loginCredentialsRequired'),
    });
    return;
  }

  authAction.value = 'login';
  const success = await loginByEmail({ email: email.value, password: password.value });
  if (!success) {
    authAction.value = null;
  }
};

const handleRegister = async () => {
  if (!regEmail.value || !regPassword.value || !confirmPassword.value) {
    toast.error(t('auth.toast.registerFailed'), {
      description: t('auth.validation.registerFieldsRequired'),
    });
    return;
  }
  if (regPassword.value !== confirmPassword.value) {
    toast.error(t('auth.toast.registerFailed'), {
      description: t('auth.validation.passwordMismatch'),
    });
    return;
  }

  authAction.value = 'register';
  const success = await registerByEmail({ email: regEmail.value, password: regPassword.value });
  if (!success) {
    authAction.value = null;
  }
};

const handleGuestLogin = async () => {
  authAction.value = 'guest';
  const success = await enterGuestMode();
  if (!success) {
    authAction.value = null;
  }
};

function setLocale(locale: 'zh-CN' | 'en-US') {
  presentationStore.setLocale(locale);
}

function setTheme(theme: PresentationThemeMode) {
  presentationStore.setTheme(theme);
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden"
  >
    <div class="absolute right-4 top-4 z-10 flex flex-wrap items-center justify-end gap-2">
      <div
        class="flex items-center gap-1 rounded-full border border-border/60 bg-card/80 p-1 backdrop-blur-sm"
      >
        <Button
          v-for="option in localeOptions"
          :key="option.value"
          size="sm"
          :variant="presentationStore.locale === option.value ? 'default' : 'ghost'"
          class="h-8 rounded-full px-3 text-xs"
          @click="setLocale(option.value)"
        >
          {{ option.label }}
        </Button>
      </div>

      <div
        class="flex items-center gap-1 rounded-full border border-border/60 bg-card/80 p-1 backdrop-blur-sm"
      >
        <Button
          v-for="option in themeOptions"
          :key="option.value"
          size="sm"
          :variant="presentationStore.theme === option.value ? 'default' : 'ghost'"
          class="h-8 rounded-full px-3 text-xs"
          @click="setTheme(option.value)"
        >
          {{ option.label }}
        </Button>
      </div>
    </div>

    <!-- Background Pattern -->
    <div
      class="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"
    ></div>

    <Card class="w-[400px] shadow-lg border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader class="space-y-1 text-center">
        <div
          class="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"
        >
          <img :src="logo128" :alt="APP_DISPLAY_NAME" class="h-10 w-10 rounded-lg object-cover" />
        </div>
        <CardTitle class="text-2xl font-semibold tracking-tight">{{ APP_DISPLAY_NAME }}</CardTitle>
        <CardDescription>{{ t('auth.page.description') }}</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">
        <p
          v-if="error"
          data-testid="auth-error-banner"
          class="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {{ error }}
        </p>

        <Tabs default-value="login" class="w-full" data-testid="auth-tabs">
          <TabsList class="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login" data-testid="login-tab">
              {{ t('auth.login.submit') }}
            </TabsTrigger>
            <TabsTrigger value="register" data-testid="register-tab">
              {{ t('auth.register.submit') }}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" data-testid="login-panel">
            <div class="grid gap-4">
              <div class="grid gap-2">
                <Label htmlFor="email">{{ t('auth.field.email') }}</Label>
                <Input
                  id="email"
                  data-testid="login-email-input"
                  v-model="email"
                  type="email"
                  :placeholder="t('auth.page.emailPlaceholder')"
                />
              </div>
              <div class="grid gap-2">
                <div class="flex items-center justify-between">
                  <Label htmlFor="password">{{ t('auth.field.password') }}</Label>
                  <a href="#" class="text-xs text-muted-foreground hover:underline">
                    {{ t('auth.login.forgotPassword') }}
                  </a>
                </div>
                <Input id="password" data-testid="login-password-input" type="password" v-model="password" />
              </div>
              <Button
                data-testid="login-submit-button"
                class="w-full"
                type="button"
                :disabled="isLoading"
                @click="handleLogin"
              >
                <template v-if="isLoading">{{ t('common.loading') }}</template>
                <template v-else>{{ t('auth.login.submit') }}</template>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="register" data-testid="register-panel">
            <div class="grid gap-4">
              <div class="grid gap-2">
                <Label htmlFor="reg-email">{{ t('auth.field.email') }}</Label>
                <Input
                  id="reg-email"
                  data-testid="register-email-input"
                  v-model="regEmail"
                  type="email"
                  :placeholder="t('auth.page.emailPlaceholder')"
                />
              </div>
              <div class="grid gap-2">
                <Label htmlFor="reg-password">{{ t('auth.field.password') }}</Label>
                <Input
                  id="reg-password"
                  data-testid="register-password-input"
                  type="password"
                  v-model="regPassword"
                />
              </div>
              <div class="grid gap-2">
                <Label htmlFor="confirm-password">{{ t('auth.field.confirmPassword') }}</Label>
                <Input
                  id="confirm-password"
                  data-testid="register-confirm-password-input"
                  type="password"
                  v-model="confirmPassword"
                />
              </div>
              <Button
                data-testid="register-submit-button"
                class="w-full"
                type="button"
                :disabled="isLoading"
                @click="handleRegister"
              >
                <template v-if="isLoading">{{ t('common.loading') }}</template>
                <template v-else>{{ t('auth.register.submit') }}</template>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-background px-2 text-muted-foreground">{{ t('auth.page.or') }}</span>
          </div>
        </div>

        <Button
          data-testid="guest-mode-button"
          variant="outline"
          class="w-full"
          :disabled="isLoading"
          @click="handleGuestLogin"
        >
          <UserRound class="mr-2 h-4 w-4" />
          {{ t('auth.page.guestMode') }}
        </Button>
      </CardContent>
      <CardFooter class="justify-center text-xs text-muted-foreground">
        {{ t('auth.page.legalNotice') }}
      </CardFooter>
    </Card>

    <div
      v-if="isLoading"
      class="absolute inset-0 z-20 flex items-center justify-center bg-background/88 backdrop-blur-sm"
    >
      <div class="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/90 px-6 py-5 shadow-xl">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary"></div>
        <div class="text-sm font-medium text-foreground">{{ authLoadingMessage }}</div>
      </div>
    </div>
  </div>
</template>
