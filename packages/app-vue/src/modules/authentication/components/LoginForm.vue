<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@dailyuse/ui-vue-shadcn';
import { Checkbox } from '@dailyuse/ui-vue-shadcn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@dailyuse/ui-vue-shadcn';
import type { LoginByEmailReq, LoginByPhoneReq } from '@dailyuse/contracts/authentication';
import { useSmsCodeCountdown } from '../composables/useSmsCodeCountdown';

const { t } = useI18n();

interface LoginFormProps {
  loading?: boolean;
  defaultTab?: 'email' | 'phone';
  showRegisterLink?: boolean;
  showForgotPassword?: boolean;
}

interface LoginFormEmits {
  (e: 'loginByEmail', data: LoginByEmailReq): void;
  (e: 'loginByPhone', data: LoginByPhoneReq): void;
  (e: 'sendSmsCode', phoneNumber: string): void;
  (e: 'register'): void;
  (e: 'forgotPassword'): void;
}

const props = withDefaults(defineProps<LoginFormProps>(), {
  loading: false,
  defaultTab: 'email',
  showRegisterLink: true,
  showForgotPassword: true,
});

const emit = defineEmits<LoginFormEmits>();

// Email login form
const emailForm = ref({
  email: '',
  password: '',
  rememberPassword: false,
  autoLogin: false,
});

// Phone login form
const phoneForm = ref({
  phoneNumber: '',
  code: '',
});

// SMS code countdown
const { smsCodeSending, smsCodeCountdown, canSendSmsCode: smsReady, startCountdown } = useSmsCodeCountdown();

// Validation
const emailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailForm.value.email);
});

const phoneValid = computed(() => {
  return phoneForm.value.phoneNumber.length >= 5;
});

const emailFormValid = computed(() => {
  return emailValid.value && emailForm.value.password.length >= 8;
});

const phoneFormValid = computed(() => {
  return phoneValid.value && phoneForm.value.code.length === 6;
});

const canSendSmsCode = computed(() => {
  return phoneValid.value && smsReady.value;
});

// Handlers
const handleEmailLogin = () => {
  if (!emailFormValid.value || props.loading) return;

  emit('loginByEmail', {
    email: emailForm.value.email,
    password: emailForm.value.password,
    rememberPassword: emailForm.value.rememberPassword,
    autoLogin: emailForm.value.autoLogin,
  });
};

const handlePhoneLogin = () => {
  if (!phoneFormValid.value || props.loading) return;

  emit('loginByPhone', {
    phoneNumber: phoneForm.value.phoneNumber,
    code: phoneForm.value.code,
  });
};

const handleSendSmsCode = () => {
  if (!canSendSmsCode.value) return;
  emit('sendSmsCode', phoneForm.value.phoneNumber);
  startCountdown();
};

const handleRegister = () => {
  emit('register');
};

const handleForgotPassword = () => {
  emit('forgotPassword');
};

watch(
  () => emailForm.value.autoLogin,
  (value) => {
    if (value) {
      emailForm.value.rememberPassword = true;
    }
  },
);

watch(
  () => emailForm.value.rememberPassword,
  (value) => {
    if (!value) {
      emailForm.value.autoLogin = false;
    }
  },
);
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle>{{ t('auth.login.title') }}</CardTitle>
      <CardDescription>{{ t('auth.login.description') }}</CardDescription>
    </CardHeader>

    <CardContent>
      <Tabs :default-value="defaultTab" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="email">{{ t('auth.login.tab.email') }}</TabsTrigger>
          <TabsTrigger value="phone">{{ t('auth.login.tab.phone') }}</TabsTrigger>
        </TabsList>

        <!-- Email Login -->
        <TabsContent value="email" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">{{ t('auth.field.email') }}</Label>
            <Input
              id="email"
              v-model="emailForm.email"
              type="email"
              placeholder="your@email.com"
              :disabled="loading"
              @keyup.enter="handleEmailLogin"
            />
          </div>

          <div class="space-y-2">
            <Label for="password">{{ t('auth.field.password') }}</Label>
            <Input
              id="password"
              v-model="emailForm.password"
              type="password"
              :placeholder="t('auth.placeholder.password')"
              :disabled="loading"
              @keyup.enter="handleEmailLogin"
            />
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <Checkbox
                id="remember"
                v-model:checked="emailForm.rememberPassword"
                :disabled="loading"
              />
              <Label for="remember" class="text-sm font-normal cursor-pointer"> 记住密码 </Label>
            </div>
            <div class="flex items-center space-x-2">
              <Checkbox id="auto-login" v-model:checked="emailForm.autoLogin" :disabled="loading" />
              <Label for="auto-login" class="text-sm font-normal cursor-pointer">自动登录</Label>
            </div>

            <Button
              v-if="showForgotPassword"
              variant="link"
              size="sm"
              class="px-0"
              @click="handleForgotPassword"
            >
              {{ t('auth.login.forgotPassword') }}
            </Button>
          </div>

          <Button class="w-full" :disabled="!emailFormValid || loading" @click="handleEmailLogin">
            {{ loading ? t('auth.login.submitting') : t('auth.login.submit') }}
          </Button>
        </TabsContent>

        <!-- Phone Login -->
        <TabsContent value="phone" class="space-y-4">
          <div class="space-y-2">
            <Label for="phone">{{ t('auth.field.phone') }}</Label>
            <Input
              id="phone"
              v-model="phoneForm.phoneNumber"
              type="tel"
              :placeholder="t('auth.placeholder.phone')"
              :disabled="loading"
            />
          </div>

          <div class="space-y-2">
            <Label for="code">{{ t('auth.field.smsCode') }}</Label>
            <div class="flex gap-2">
              <Input
                id="code"
                v-model="phoneForm.code"
                type="text"
                :placeholder="t('auth.placeholder.smsCode')"
                maxlength="6"
                :disabled="loading"
                @keyup.enter="handlePhoneLogin"
              />
              <Button variant="outline" :disabled="!canSendSmsCode" @click="handleSendSmsCode">
                {{
                  smsCodeCountdown > 0
                    ? t('auth.smsCode.countdown', { n: smsCodeCountdown })
                    : smsCodeSending
                      ? t('auth.smsCode.sending')
                      : t('auth.smsCode.send')
                }}
              </Button>
            </div>
          </div>

          <Button class="w-full" :disabled="!phoneFormValid || loading" @click="handlePhoneLogin">
            {{ loading ? t('auth.login.submitting') : t('auth.login.submit') }}
          </Button>
        </TabsContent>
      </Tabs>
    </CardContent>

    <CardFooter v-if="showRegisterLink" class="flex justify-center">
      <p class="text-sm text-muted-foreground">
        {{ t('auth.login.noAccount') }}
        <Button variant="link" class="px-1" @click="handleRegister">
          {{ t('auth.login.registerLink') }}
        </Button>
      </p>
    </CardFooter>
  </Card>
</template>
