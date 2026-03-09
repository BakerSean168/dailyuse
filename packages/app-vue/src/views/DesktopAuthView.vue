<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { toast } from 'vue-sonner';
import { UserRound, Trash2, Sparkles } from 'lucide-vue-next';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Separator,
} from '@dailyuse/ui-vue-shadcn';
import { useAuth } from '../modules/authentication/composables/useAuth';

interface RememberedAccountItem {
  identityId: string;
  identifier: string;
  nickname: string | null;
  avatarUrl: string | null;
  rememberPassword: boolean;
  autoLogin: boolean;
  lastUsedAt: number;
  lastLoginAt: number;
}

const {
  loginByEmail,
  registerByEmail,
  enterGuestMode,
  listRememberedAccounts,
  removeRememberedAccount,
  isLoading,
} = useAuth();

const mode = ref<'login' | 'register'>('login');
const rememberedAccounts = ref<RememberedAccountItem[]>([]);
const selectedIdentityId = ref<string | null>(null);
const email = ref('');
const password = ref('');
const registerEmail = ref('');
const registerPassword = ref('');
const registerConfirmPassword = ref('');
const rememberPassword = ref(false);
const autoLogin = ref(false);

const selectedAccount = computed(
  () =>
    rememberedAccounts.value.find((account) => account.identityId === selectedIdentityId.value) ??
    null,
);

watch(selectedAccount, (account) => {
  if (!account) {
    return;
  }
  email.value = account.identifier;
  rememberPassword.value = account.rememberPassword;
  autoLogin.value = account.autoLogin;
});

watch(autoLogin, (value) => {
  if (value) {
    rememberPassword.value = true;
  }
});

watch(rememberPassword, (value) => {
  if (!value) {
    autoLogin.value = false;
  }
});

async function loadRememberedAccounts() {
  rememberedAccounts.value = await listRememberedAccounts();
  if (!selectedIdentityId.value && rememberedAccounts.value.length > 0) {
    selectedIdentityId.value = rememberedAccounts.value[0].identityId;
  }
}

async function handleLogin() {
  if (!email.value || !password.value) {
    toast.error('请填写邮箱和密码');
    return;
  }

  await loginByEmail({
    email: email.value,
    password: password.value,
    rememberPassword: rememberPassword.value,
    autoLogin: autoLogin.value,
  });
}

async function handleRegister() {
  if (!registerEmail.value || !registerPassword.value || !registerConfirmPassword.value) {
    toast.error('请填写完整注册信息');
    return;
  }

  if (registerPassword.value !== registerConfirmPassword.value) {
    toast.error('两次密码不一致');
    return;
  }

  await registerByEmail({ email: registerEmail.value, password: registerPassword.value });
}

async function handleRemove(identityId: string) {
  const removed = await removeRememberedAccount(identityId);
  if (!removed) {
    return;
  }

  if (selectedIdentityId.value === identityId) {
    selectedIdentityId.value = null;
    email.value = '';
  }

  await loadRememberedAccounts();
}

onMounted(() => {
  void loadRememberedAccounts();
});
</script>

<template>
  <div
    class="min-h-screen bg-[radial-gradient(circle_at_top,#fdf6e3,transparent_38%),linear-gradient(135deg,#f7efe2,#eef5f9)] p-6 text-slate-900"
  >
    <div class="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-[320px_1fr]">
      <Card class="border-stone-200/80 bg-white/85 shadow-xl backdrop-blur">
        <CardHeader>
          <CardTitle>快速登录</CardTitle>
          <CardDescription
            >保留这台设备上登录过的账号，像 QQ / Steam 一样快速切换。</CardDescription
          >
        </CardHeader>
        <CardContent class="space-y-3">
          <button
            v-for="account in rememberedAccounts"
            :key="account.identityId"
            class="flex w-full items-start justify-between rounded-2xl border px-4 py-3 text-left transition"
            :class="
              selectedIdentityId === account.identityId
                ? 'border-slate-900 bg-slate-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            "
            @click="selectedIdentityId = account.identityId"
          >
            <div class="min-w-0">
              <div class="truncate text-sm font-semibold">
                {{ account.nickname || account.identifier }}
              </div>
              <div class="truncate text-xs text-slate-500">{{ account.identifier }}</div>
              <div class="mt-2 flex gap-2 text-[11px] text-slate-500">
                <span v-if="account.rememberPassword">记住密码</span>
                <span v-if="account.autoLogin">自动登录</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 shrink-0"
              @click.stop="handleRemove(account.identityId)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </button>
          <div
            v-if="rememberedAccounts.length === 0"
            class="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500"
          >
            本机还没有保存过登录账号。
          </div>
        </CardContent>
      </Card>

      <Card class="border-stone-200/80 bg-white/90 shadow-2xl backdrop-blur">
        <CardHeader class="space-y-4">
          <div class="flex items-center gap-3">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg"
            >
              <Sparkles class="h-5 w-5" />
            </div>
            <div>
              <CardTitle class="text-2xl">DailyUse Desktop</CardTitle>
              <CardDescription>账号由你选择，自动登录只在你主动开启时生效。</CardDescription>
            </div>
          </div>

          <div class="flex gap-2 rounded-2xl bg-slate-100 p-1">
            <Button
              class="flex-1"
              :variant="mode === 'login' ? 'default' : 'ghost'"
              @click="mode = 'login'"
              >登录</Button
            >
            <Button
              class="flex-1"
              :variant="mode === 'register' ? 'default' : 'ghost'"
              @click="mode = 'register'"
              >注册</Button
            >
          </div>
        </CardHeader>

        <CardContent class="space-y-6">
          <template v-if="mode === 'login'">
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2 md:col-span-2">
                <Label for="login-email">邮箱</Label>
                <Input
                  id="login-email"
                  v-model="email"
                  type="email"
                  placeholder="name@example.com"
                  :disabled="isLoading"
                />
              </div>
              <div class="space-y-2 md:col-span-2">
                <Label for="login-password">密码</Label>
                <Input
                  id="login-password"
                  v-model="password"
                  type="password"
                  placeholder="请输入密码"
                  :disabled="isLoading"
                  @keyup.enter="handleLogin"
                />
              </div>
            </div>

            <div
              class="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-2"
            >
              <label class="flex items-center gap-3 text-sm">
                <Checkbox v-model:checked="rememberPassword" :disabled="isLoading" />
                <span>记住密码</span>
              </label>
              <label class="flex items-center gap-3 text-sm">
                <Checkbox v-model:checked="autoLogin" :disabled="isLoading" />
                <span>自动登录</span>
              </label>
              <p class="md:col-span-2 text-xs leading-5 text-slate-500">
                只有你明确勾选“自动登录”，下次启动才会直接尝试恢复会话；否则始终先显示登录窗口。
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <Button class="min-w-32" :disabled="isLoading" @click="handleLogin">登录</Button>
              <Button variant="outline" :disabled="isLoading" @click="enterGuestMode">
                <UserRound class="mr-2 h-4 w-4" />
                访客模式
              </Button>
            </div>
          </template>

          <template v-else>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2 md:col-span-2">
                <Label for="register-email">邮箱</Label>
                <Input
                  id="register-email"
                  v-model="registerEmail"
                  type="email"
                  placeholder="name@example.com"
                  :disabled="isLoading"
                />
              </div>
              <div class="space-y-2">
                <Label for="register-password">密码</Label>
                <Input
                  id="register-password"
                  v-model="registerPassword"
                  type="password"
                  :disabled="isLoading"
                />
              </div>
              <div class="space-y-2">
                <Label for="register-confirm-password">确认密码</Label>
                <Input
                  id="register-confirm-password"
                  v-model="registerConfirmPassword"
                  type="password"
                  :disabled="isLoading"
                  @keyup.enter="handleRegister"
                />
              </div>
            </div>

            <Button class="min-w-32" :disabled="isLoading" @click="handleRegister">创建账号</Button>
          </template>

          <Separator />

          <div class="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            个人中心里的展示名统一使用 `nickname`，不再额外区分 display name。
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
