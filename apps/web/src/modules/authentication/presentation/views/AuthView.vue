<script setup lang="ts">
import { ref } from 'vue';
import { LoginForm, RegisterForm } from '@dailyuse/ui-vue';
import type { LoginByEmailReq, LoginByPhoneReq, RegisterByEmailReq, RegisterByPhoneReq } from '@dailyuse/contracts/authentication';
import { useAuth } from '../composables/useAuth';

const { loginByEmail, loginByPhone, registerByEmail, registerByPhone, sendSmsCode, isLoading } = useAuth();

const showRegister = ref(false);

const handleLoginByEmail = async (data: LoginByEmailReq) => {
  await loginByEmail(data);
};

const handleLoginByPhone = async (data: LoginByPhoneReq) => {
  await loginByPhone(data);
};

const handleRegisterByEmail = async (data: RegisterByEmailReq) => {
  await registerByEmail(data);
};

const handleRegisterByPhone = async (data: RegisterByPhoneReq) => {
  await registerByPhone(data);
};

const handleSendSmsCode = async (phoneNumber: string) => {
  await sendSmsCode(phoneNumber);
};

const handleRegister = () => {
  showRegister.value = true;
};

const handleLogin = () => {
  showRegister.value = false;
};

const handleForgotPassword = () => {
  // TODO: 路由到忘记密码页面
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2">DailyUse</h1>
        <p class="text-muted-foreground">
          {{ showRegister ? '创建您的账号' : '欢迎回来' }}
        </p>
      </div>
      
      <LoginForm
        v-if="!showRegister"
        :loading="isLoading"
        @login-by-email="handleLoginByEmail"
        @login-by-phone="handleLoginByPhone"
        @send-sms-code="handleSendSmsCode"
        @register="handleRegister"
        @forgot-password="handleForgotPassword"
      />
      
      <RegisterForm
        v-else
        :loading="isLoading"
        @register-by-email="handleRegisterByEmail"
        @register-by-phone="handleRegisterByPhone"
        @send-sms-code="handleSendSmsCode"
        @login="handleLogin"
      />
    </div>
  </div>
</template>
