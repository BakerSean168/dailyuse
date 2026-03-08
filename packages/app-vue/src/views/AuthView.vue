<script setup lang="ts">
/**
 * AuthView - 认证视图
 *
 * Shadcn UI + Tailwind CSS (Linear Style).
 * Platform-agnostic: uses injected useAuth composable via DI.
 */
import { computed, ref } from 'vue';
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
import { Github, Chrome } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useAuth } from '../modules/authentication/composables/useAuth';

const { loginByEmail, registerByEmail, isLoading } = useAuth();

const email = ref('');
const password = ref('');
const regEmail = ref('');
const regPassword = ref('');
const confirmPassword = ref('');
const authAction = ref<'login' | 'register' | null>(null);

const authLoadingMessage = computed(() => {
  if (authAction.value === 'register') {
    return '正在创建账户并启动主窗口...';
  }
  return '正在登录并启动主窗口...';
});

const handleLogin = async () => {
  if (!email.value || !password.value) {
    toast.error('请填写邮箱和密码');
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
    toast.error('请填写所有字段');
    return;
  }
  if (regPassword.value !== confirmPassword.value) {
    toast.error('两次密码不一致');
    return;
  }

  authAction.value = 'register';
  const success = await registerByEmail({ email: regEmail.value, password: regPassword.value });
  if (!success) {
    authAction.value = null;
  }
};

const handleSocialLogin = (provider: string) => {
  toast.info(`Login with ${provider} coming soon`);
};
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden"
  >
    <!-- Background Pattern -->
    <div
      class="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"
    ></div>

    <Card class="w-[400px] shadow-lg border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader class="space-y-1 text-center">
        <div
          class="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"
        >
          <span class="text-2xl font-bold text-primary">D</span>
        </div>
        <CardTitle class="text-2xl font-semibold tracking-tight">DailyUse</CardTitle>
        <CardDescription> Enter your email below to verify your account </CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">
        <Tabs default-value="login" class="w-full">
          <TabsList class="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <div class="grid gap-4">
              <div class="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" v-model="email" />
              </div>
              <div class="grid gap-2">
                <div class="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" class="text-xs text-muted-foreground hover:underline"
                    >Forgot password?</a
                  >
                </div>
                <Input id="password" type="password" v-model="password" />
              </div>
              <Button class="w-full" type="button" :disabled="isLoading" @click="handleLogin">
                <template v-if="isLoading">Loading...</template>
                <template v-else>Sign In</template>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="register">
            <div class="grid gap-4">
              <div class="grid gap-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" type="email" placeholder="m@example.com" v-model="regEmail" />
              </div>
              <div class="grid gap-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input id="reg-password" type="password" v-model="regPassword" />
              </div>
              <div class="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" v-model="confirmPassword" />
              </div>
              <Button class="w-full" type="button" :disabled="isLoading" @click="handleRegister">
                <template v-if="isLoading">Loading...</template>
                <template v-else>Create Account</template>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-background px-2 text-muted-foreground"> Or continue with </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <Button variant="outline" @click="handleSocialLogin('Github')">
            <Github class="mr-2 h-4 w-4" />
            Github
          </Button>
          <Button variant="outline" @click="handleSocialLogin('Google')">
            <Chrome class="mr-2 h-4 w-4" />
            Google
          </Button>
        </div>
      </CardContent>
      <CardFooter class="justify-center text-xs text-muted-foreground">
        By clicking continue, you agree to our Terms of Service and Privacy Policy.
      </CardFooter>
    </Card>

    <div
      v-if="isLoading"
      class="absolute inset-0 z-20 flex items-center justify-center bg-background/88 backdrop-blur-sm"
    >
      <div class="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/90 px-6 py-5 shadow-xl">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary"></div>
        <div class="text-sm font-medium text-foreground">{{ authLoadingMessage }}</div>
        <div class="text-xs text-muted-foreground">认证成功后将自动切换到主窗口</div>
      </div>
    </div>
  </div>
</template>
