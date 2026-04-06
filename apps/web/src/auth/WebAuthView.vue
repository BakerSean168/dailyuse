<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { APP_DISPLAY_NAME, logo128 } from '@dailyuse/assets';
import {
  Button,
} from '@dailyuse/ui-vue-shadcn/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@dailyuse/ui-vue-shadcn/components/ui/card';
import { Input } from '@dailyuse/ui-vue-shadcn/components/ui/input';
import { Label } from '@dailyuse/ui-vue-shadcn/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@dailyuse/ui-vue-shadcn/components/ui/tabs';
import { UserRound } from 'lucide-vue-next';

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

const { loginByEmail, registerByEmail, enterGuestMode, isLoading, error } = useWebAuth();

const email = ref('');
const password = ref('');
const regEmail = ref('');
const regPassword = ref('');
const confirmPassword = ref('');
const authAction = ref<'login' | 'register' | 'guest' | null>(null);

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

async function handleGuestLogin() {
  authAction.value = 'guest';
  const success = await enterGuestMode();
  if (!success) {
    authAction.value = null;
  }
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
          :variant="currentLocale === option.value ? 'default' : 'ghost'"
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
          :variant="currentTheme === option.value ? 'default' : 'ghost'"
          class="h-8 rounded-full px-3 text-xs"
          @click="setTheme(option.value)"
        >
          {{ option.label }}
        </Button>
      </div>
    </div>

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
          class="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {{ error }}
        </p>

        <Tabs default-value="login" class="w-full">
          <TabsList class="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">{{ t('auth.login.submit') }}</TabsTrigger>
            <TabsTrigger value="register">{{ t('auth.register.submit') }}</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <div class="grid gap-4">
              <div class="grid gap-2">
                <Label for="email">{{ t('auth.field.email') }}</Label>
                <Input
                  id="email"
                  v-model="email"
                  type="email"
                  :placeholder="t('auth.page.emailPlaceholder')"
                />
              </div>
              <div class="grid gap-2">
                <div class="flex items-center justify-between">
                  <Label for="password">{{ t('auth.field.password') }}</Label>
                  <a href="#" class="text-xs text-muted-foreground hover:underline">
                    {{ t('auth.login.forgotPassword') }}
                  </a>
                </div>
                <Input id="password" v-model="password" type="password" />
              </div>
              <Button class="w-full" type="button" :disabled="isLoading" @click="handleLogin">
                <template v-if="isLoading && authAction === 'login'">
                  {{ t('auth.login.submitting') }}
                </template>
                <template v-else>{{ t('auth.login.submit') }}</template>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="register">
            <div class="grid gap-4">
              <div class="grid gap-2">
                <Label for="reg-email">{{ t('auth.field.email') }}</Label>
                <Input
                  id="reg-email"
                  v-model="regEmail"
                  type="email"
                  :placeholder="t('auth.page.emailPlaceholder')"
                />
              </div>
              <div class="grid gap-2">
                <Label for="reg-password">{{ t('auth.field.password') }}</Label>
                <Input id="reg-password" v-model="regPassword" type="password" />
              </div>
              <div class="grid gap-2">
                <Label for="confirm-password">{{ t('auth.field.confirmPassword') }}</Label>
                <Input id="confirm-password" v-model="confirmPassword" type="password" />
              </div>
              <Button class="w-full" type="button" :disabled="isLoading" @click="handleRegister">
                <template v-if="isLoading && authAction === 'register'">
                  {{ t('auth.register.submitting') }}
                </template>
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

        <Button variant="outline" class="w-full" :disabled="isLoading" @click="handleGuestLogin">
          <UserRound class="mr-2 h-4 w-4" />
          <template v-if="isLoading && authAction === 'guest'">
            {{ t('auth.page.guestLoading') }}
          </template>
          <template v-else>
            {{ t('auth.page.guestMode') }}
          </template>
        </Button>
      </CardContent>
      <CardFooter class="justify-center text-xs text-muted-foreground">
        {{ t('auth.page.legalNotice') }}
      </CardFooter>
    </Card>
  </div>
</template>
