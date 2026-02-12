<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { LoginForm, RegisterForm } from '@dailyuse/ui-vue';
import type { LoginByEmailReq, LoginByPhoneReq, RegisterByEmailReq, RegisterByPhoneReq } from '@dailyuse/contracts/authentication';
import { useAuthenticationStore } from '../stores/authenticationStore';
import { toast } from 'vue-sonner';

const router = useRouter();
const authStore = useAuthenticationStore();

const showRegister = ref(false);
const loading = ref(false);

const handleLoginByEmail = async (data: LoginByEmailReq) => {
  loading.value = true;
  try {
    // TODO: 调用 authentication service 进行登录
    console.log('Login by email:', data);
    
    toast.success('登录成功', {
      description: '欢迎回来！',
    });
    
    // 登录成功后跳转到首页
    router.push('/');
  } catch (error) {
    toast.error('登录失败', {
      description: error instanceof Error ? error.message : '未知错误',
    });
  } finally {
    loading.value = false;
  }
};

const handleLoginByPhone = async (data: LoginByPhoneReq) => {
  loading.value = true;
  try {
    // TODO: 调用 authentication service 进行登录
    console.log('Login by phone:', data);
    
    toast.success('登录成功', {
      description: '欢迎回来！',
    });
    
    router.push('/');
  } catch (error) {
    toast.error('登录失败', {
      description: error instanceof Error ? error.message : '未知错误',
    });
  } finally {
    loading.value = false;
  }
};

const handleRegisterByEmail = async (data: RegisterByEmailReq) => {
  loading.value = true;
  try {
    // TODO: 调用 authentication service 进行注册
    console.log('Register by email:', data);
    
    toast.success('注册成功', {
      description: '欢迎加入！',
    });
    
    router.push('/');
  } catch (error) {
    toast.error('注册失败', {
      description: error instanceof Error ? error.message : '未知错误',
    });
  } finally {
    loading.value = false;
  }
};

const handleRegisterByPhone = async (data: RegisterByPhoneReq) => {
  loading.value = true;
  try {
    // TODO: 调用 authentication service 进行注册
    console.log('Register by phone:', data);
    
    toast.success('注册成功', {
      description: '欢迎加入！',
    });
    
    router.push('/');
  } catch (error) {
    toast.error('注册失败', {
      description: error instanceof Error ? error.message : '未知错误',
    });
  } finally {
    loading.value = false;
  }
};

const handleSendSmsCode = async (phoneNumber: string) => {
  try {
    // TODO: 调用 authentication service 发送验证码
    console.log('Send SMS code to:', phoneNumber);
    
    toast.success('验证码已发送', {
      description: '请查收手机短信',
    });
  } catch (error) {
    toast.error('发送失败', {
      description: error instanceof Error ? error.message : '未知错误',
    });
  }
};

const handleRegister = () => {
  showRegister.value = true;
};

const handleLogin = () => {
  showRegister.value = false;
};

const handleForgotPassword = () => {
  router.push('/auth/forgot-password');
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
        :loading="loading"
        @login-by-email="handleLoginByEmail"
        @login-by-phone="handleLoginByPhone"
        @send-sms-code="handleSendSmsCode"
        @register="handleRegister"
        @forgot-password="handleForgotPassword"
      />
      
      <RegisterForm
        v-else
        :loading="loading"
        @register-by-email="handleRegisterByEmail"
        @register-by-phone="handleRegisterByPhone"
        @send-sms-code="handleSendSmsCode"
        @login="handleLogin"
      />
    </div>
  </div>
</template>
