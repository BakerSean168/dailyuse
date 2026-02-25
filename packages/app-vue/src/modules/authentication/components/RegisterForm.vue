<script setup lang="ts">
import { ref, computed } from 'vue';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@dailyuse/ui-vue-shadcn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@dailyuse/ui-vue-shadcn';
import { Progress } from '@dailyuse/ui-vue-shadcn';
import type { RegisterByEmailReq, RegisterByPhoneReq } from '@dailyuse/contracts/authentication';

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
let countdownTimer: NodeJS.Timeout | null = null;

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
  if (strength < 40) text = '弱';
  else if (strength < 70) text = '中';
  else text = '强';
  
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
      <CardTitle>注册</CardTitle>
      <CardDescription>创建您的账号</CardDescription>
    </CardHeader>
    
    <CardContent>
      <Tabs :default-value="defaultTab" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="email">邮箱注册</TabsTrigger>
          <TabsTrigger value="phone">手机注册</TabsTrigger>
        </TabsList>
        
        <!-- Email Register -->
        <TabsContent value="email" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">邮箱</Label>
            <Input
              id="email"
              v-model="emailForm.email"
              type="email"
              placeholder="your@email.com"
              :disabled="loading"
            />
            <p v-if="emailForm.email && !emailValid" class="text-sm text-destructive">
              邮箱格式不正确
            </p>
          </div>
          
          <div class="space-y-2">
            <Label for="password">密码</Label>
            <Input
              id="password"
              v-model="emailForm.password"
              type="password"
              placeholder="至少8位密码"
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
                密码长度需要在8-100位之间
              </p>
            </div>
          </div>
          
          <div class="space-y-2">
            <Label for="confirmPassword">确认密码</Label>
            <Input
              id="confirmPassword"
              v-model="emailForm.confirmPassword"
              type="password"
              placeholder="再次输入密码"
              :disabled="loading"
              @keyup.enter="handleEmailRegister"
            />
            <p v-if="emailForm.confirmPassword && !passwordMatch" class="text-sm text-destructive">
              两次密码输入不一致
            </p>
          </div>
          
          <Button
            class="w-full"
            :disabled="!emailFormValid || loading"
            @click="handleEmailRegister"
          >
            {{ loading ? '注册中...' : '注册' }}
          </Button>
        </TabsContent>
        
        <!-- Phone Register -->
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
              />
              <Button
                variant="outline"
                :disabled="!canSendSmsCode"
                @click="handleSendSmsCode"
              >
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
          
          <div class="space-y-2">
            <Label for="nickname">昵称（可选）</Label>
            <Input
              id="nickname"
              v-model="phoneForm.nickname"
              type="text"
              placeholder="请输入昵称"
              :disabled="loading"
              @keyup.enter="handlePhoneRegister"
            />
          </div>
          
          <Button
            class="w-full"
            :disabled="!phoneFormValid || loading"
            @click="handlePhoneRegister"
          >
            {{ loading ? '注册中...' : '注册' }}
          </Button>
        </TabsContent>
      </Tabs>
    </CardContent>
    
    <CardFooter v-if="showLoginLink" class="flex justify-center">
      <p class="text-sm text-muted-foreground">
        已有账号？
        <Button
          variant="link"
          class="px-1"
          @click="handleLogin"
        >
          立即登录
        </Button>
      </p>
    </CardFooter>
  </Card>
</template>
