<script setup lang="ts">
import { ref, computed } from 'vue';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@dailyuse/ui-vue-shadcn';
import { Progress } from '@dailyuse/ui-vue-shadcn';
import type { RegisterByEmailReq, RegisterByPhoneReq } from '@dailyuse/contracts/authentication';

const { t } = useI18n();

interface RegisterFormProps {
  loading?: boolean;
  defaultTab?: 'email' | 'phone';
  showLoginLink?: boolean;
}

interface RegisterFormEmits {
  (e: 'registerByEmail', data: RegisterByEmailReq): void;
  (e: 'registerByPhone', data: RegisterByPhoneReq): void;
  (e: 'sendSmsCode', phoneNumber: string): void;
  (e: 'login'): void;
}

const props = withDefaults(defineProps<RegisterFormProps>(), {
  loading: false,
  defaultTab: 'email',
  showLoginLink: true,
});

const emit = defineEmits<RegisterFormEmits>();

// Email register form
const emailForm = ref({
  email: '',
  password: '',
  confirmPassword: '',
});

// Phone register form
const phoneForm = ref({
  phoneNumber: '',
  code: '',
  nickname: '',
});

// SMS code state
const smsCodeSending = ref(false);
const smsCodeCountdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

// Password strength
const passwordStrength = computed(() => {
  const password = emailForm.value.password;
  if (!password) return { strength: 0, text: '' };

  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 15;
  if (/[a-z]/.test(password)) strength += 20;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[0-9]/.test(password)) strength += 20;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 20;

  let text = '';
  if (strength < 40) text = t('auth.register.passwordStrength.weak');
  else if (strength < 70) text = t('auth.register.passwordStrength.medium');
  else text = t('auth.register.passwordStrength.strong');

  return { strength, text };
});

// Validation
const emailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailForm.value.email);
});

const passwordValid = computed(() => {
  return emailForm.value.password.length >= 8 && emailForm.value.password.length <= 100;
});

const passwordMatch = computed(() => {
  return emailForm.value.password === emailForm.value.confirmPassword;
});

const phoneValid = computed(() => {
  return phoneForm.value.phoneNumber.length >= 5;
});

const emailFormValid = computed(() => {
  return emailValid.value && passwordValid.value && passwordMatch.value;
});

const phoneFormValid = computed(() => {
  return phoneValid.value && phoneForm.value.code.length === 6;
});

const canSendSmsCode = computed(() => {
  return phoneValid.value && smsCodeCountdown.value === 0 && !smsCodeSending.value;
});

// Handlers
const handleEmailRegister = () => {
  if (!emailFormValid.value || props.loading) return;

  emit('registerByEmail', {
    email: emailForm.value.email,
    password: emailForm.value.password,
  });
};

const handlePhoneRegister = () => {
  if (!phoneFormValid.value || props.loading) return;

  const data: RegisterByPhoneReq = {
    phoneNumber: phoneForm.value.phoneNumber,
    code: phoneForm.value.code,
  };

  if (phoneForm.value.nickname) {
    data.nickname = phoneForm.value.nickname;
  }

  emit('registerByPhone', data);
};

const handleSendSmsCode = async () => {
  if (!canSendSmsCode.value) return;

  smsCodeSending.value = true;
  emit('sendSmsCode', phoneForm.value.phoneNumber);

  // Start countdown
  smsCodeCountdown.value = 60;
  countdownTimer = setInterval(() => {
    smsCodeCountdown.value--;
    if (smsCodeCountdown.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }, 1000);

  // Simulate sending
  setTimeout(() => {
    smsCodeSending.value = false;
  }, 1000);
};

const handleLogin = () => {
  emit('login');
};

// Cleanup
import { onUnmounted } from 'vue';
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle>{{ t('auth.register.title') }}</CardTitle>
      <CardDescription>{{ t('auth.register.description') }}</CardDescription>
    </CardHeader>

    <CardContent>
      <Tabs :default-value="defaultTab" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="email">{{ t('auth.register.tab.email') }}</TabsTrigger>
          <TabsTrigger value="phone">{{ t('auth.register.tab.phone') }}</TabsTrigger>
        </TabsList>

        <!-- Email Register -->
        <TabsContent value="email" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">{{ t('auth.field.email') }}</Label>
            <Input
              id="email"
              v-model="emailForm.email"
              type="email"
              placeholder="your@email.com"
              :disabled="loading"
            />
            <p v-if="emailForm.email && !emailValid" class="text-sm text-destructive">
              {{ t('auth.validation.emailInvalid') }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="password">{{ t('auth.field.password') }}</Label>
            <Input
              id="password"
              v-model="emailForm.password"
              type="password"
              :placeholder="t('auth.register.passwordPlaceholder')"
              :disabled="loading"
            />
            <div v-if="emailForm.password" class="space-y-1">
              <div class="flex items-center gap-2">
                <Progress :model-value="passwordStrength.strength" class="flex-1" />
                <span class="text-sm text-muted-foreground">
                  {{ passwordStrength.text }}
                </span>
              </div>
              <p v-if="!passwordValid" class="text-sm text-destructive">
                {{ t('auth.validation.passwordLength') }}
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="confirmPassword">{{ t('auth.field.confirmPassword') }}</Label>
            <Input
              id="confirmPassword"
              v-model="emailForm.confirmPassword"
              type="password"
              :placeholder="t('auth.register.confirmPasswordPlaceholder')"
              :disabled="loading"
              @keyup.enter="handleEmailRegister"
            />
            <p v-if="emailForm.confirmPassword && !passwordMatch" class="text-sm text-destructive">
              {{ t('auth.validation.passwordMismatch') }}
            </p>
          </div>

          <Button
            class="w-full"
            :disabled="!emailFormValid || loading"
            @click="handleEmailRegister"
          >
            {{ loading ? t('auth.register.submitting') : t('auth.register.submit') }}
          </Button>
        </TabsContent>

        <!-- Phone Register -->
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

          <div class="space-y-2">
            <Label for="nickname">{{ t('auth.field.nicknameOptional') }}</Label>
            <Input
              id="nickname"
              v-model="phoneForm.nickname"
              type="text"
              :placeholder="t('auth.placeholder.nickname')"
              :disabled="loading"
              @keyup.enter="handlePhoneRegister"
            />
          </div>

          <Button
            class="w-full"
            :disabled="!phoneFormValid || loading"
            @click="handlePhoneRegister"
          >
            {{ loading ? t('auth.register.submitting') : t('auth.register.submit') }}
          </Button>
        </TabsContent>
      </Tabs>
    </CardContent>

    <CardFooter v-if="showLoginLink" class="flex justify-center">
      <p class="text-sm text-muted-foreground">
        {{ t('auth.register.hasAccount') }}
        <Button variant="link" class="px-1" @click="handleLogin">
          {{ t('auth.register.loginLink') }}
        </Button>
      </p>
    </CardFooter>
  </Card>
</template>
