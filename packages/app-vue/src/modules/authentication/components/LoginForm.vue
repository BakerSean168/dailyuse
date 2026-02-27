<script setup lang="ts">
import { ref, computed } from 'vue';
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
  rememberMe: false,
});

// Phone login form
const phoneForm = ref({
  phoneNumber: '',
  code: '',
});

// SMS code state
const smsCodeSending = ref(false);
const smsCodeCountdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

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
  return phoneValid.value && smsCodeCountdown.value === 0 && !smsCodeSending.value;
});

// Handlers
const handleEmailLogin = () => {
  if (!emailFormValid.value || props.loading) return;

  emit('loginByEmail', {
    email: emailForm.value.email,
    password: emailForm.value.password,
    rememberMe: emailForm.value.rememberMe,
  });
};

const handlePhoneLogin = () => {
  if (!phoneFormValid.value || props.loading) return;

  emit('loginByPhone', {
    phoneNumber: phoneForm.value.phoneNumber,
    code: phoneForm.value.code,
  });
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

  // Simulate sending (remove this timeout when integrated with real API)
  setTimeout(() => {
    smsCodeSending.value = false;
  }, 1000);
};

const handleRegister = () => {
  emit('register');
};

const handleForgotPassword = () => {
  emit('forgotPassword');
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
      <CardTitle>登录</CardTitle>
      <CardDescription>选择您喜欢的登录方式</CardDescription>
    </CardHeader>

    <CardContent>
      <Tabs :default-value="defaultTab" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="email">邮箱登录</TabsTrigger>
          <TabsTrigger value="phone">手机登录</TabsTrigger>
        </TabsList>

        <!-- Email Login -->
        <TabsContent value="email" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">邮箱</Label>
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
            <Label for="password">密码</Label>
            <Input
              id="password"
              v-model="emailForm.password"
              type="password"
              placeholder="请输入密码"
              :disabled="loading"
              @keyup.enter="handleEmailLogin"
            />
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <Checkbox id="remember" v-model:checked="emailForm.rememberMe" :disabled="loading" />
              <Label for="remember" class="text-sm font-normal cursor-pointer"> 记住我 </Label>
            </div>

            <Button
              v-if="showForgotPassword"
              variant="link"
              size="sm"
              class="px-0"
              @click="handleForgotPassword"
            >
              忘记密码？
            </Button>
          </div>

          <Button class="w-full" :disabled="!emailFormValid || loading" @click="handleEmailLogin">
            {{ loading ? '登录中...' : '登录' }}
          </Button>
        </TabsContent>

        <!-- Phone Login -->
        <TabsContent value="phone" class="space-y-4">
          <div class="space-y-2">
            <Label for="phone">手机号</Label>
            <Input
              id="phone"
              v-model="phoneForm.phoneNumber"
              type="tel"
              placeholder="请输入手机号"
              :disabled="loading"
            />
          </div>

          <div class="space-y-2">
            <Label for="code">验证码</Label>
            <div class="flex gap-2">
              <Input
                id="code"
                v-model="phoneForm.code"
                type="text"
                placeholder="请输入验证码"
                maxlength="6"
                :disabled="loading"
                @keyup.enter="handlePhoneLogin"
              />
              <Button variant="outline" :disabled="!canSendSmsCode" @click="handleSendSmsCode">
                {{
                  smsCodeCountdown > 0
                    ? `${smsCodeCountdown}秒`
                    : smsCodeSending
                      ? '发送中...'
                      : '获取验证码'
                }}
              </Button>
            </div>
          </div>

          <Button class="w-full" :disabled="!phoneFormValid || loading" @click="handlePhoneLogin">
            {{ loading ? '登录中...' : '登录' }}
          </Button>
        </TabsContent>
      </Tabs>
    </CardContent>

    <CardFooter v-if="showRegisterLink" class="flex justify-center">
      <p class="text-sm text-muted-foreground">
        还没有账号？
        <Button variant="link" class="px-1" @click="handleRegister"> 立即注册 </Button>
      </p>
    </CardFooter>
  </Card>
</template>
