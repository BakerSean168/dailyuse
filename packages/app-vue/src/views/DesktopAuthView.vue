<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { toast } from 'vue-sonner';
import { UserRound, Trash2, Sparkles } from 'lucide-vue-next';
import {
  Button,
  Checkbox,
  Input,
  Label,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
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

const mode = ref<'login' | 'register' | 'quick-login'>('login');
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
    class="flex h-full min-h-0 items-center justify-center overflow-auto bg-[radial-gradient(circle_at_top,hsl(var(--accent)/0.35),transparent_38%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.7))] px-5 py-5 text-foreground"
  >
    <div class="mx-auto flex w-full max-w-[26rem] items-center justify-center">
      <section
        class="w-full rounded-[2rem] border border-border/70 bg-card/80 p-5 text-card-foreground shadow-[0_24px_80px_hsl(var(--foreground)/0.12)] backdrop-blur-xl"
      >
        <div class="mb-5 flex items-start gap-3">
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg"
          >
            <Sparkles class="h-5 w-5" />
          </div>
          <div class="min-w-0 space-y-1">
            <h1 class="text-xl font-semibold tracking-tight">DailyUse Desktop</h1>
            <p class="text-sm leading-6 text-muted-foreground">
              账号由你选择，自动登录只会在你主动开启后生效。
            </p>
          </div>
        </div>

        <Tabs v-model="mode" class="space-y-4">
          <TabsList class="grid h-auto w-full grid-cols-3 rounded-2xl bg-slate-100 p-1">
            <TabsTrigger value="login" class="rounded-xl">登录</TabsTrigger>
            <TabsTrigger value="register" class="rounded-xl">注册</TabsTrigger>
            <TabsTrigger value="quick-login" class="rounded-xl">快速登录</TabsTrigger>
          </TabsList>

          <TabsContent value="login" class="mt-0 space-y-4">
            <div class="space-y-2">
              <Label for="login-email">邮箱</Label>
              <Input
                id="login-email"
                v-model="email"
                type="email"
                placeholder="name@example.com"
                :disabled="isLoading"
              />
            </div>
            <div class="space-y-2">
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

            <div class="space-y-3 rounded-2xl border border-border/70 bg-muted/60 p-4">
              <label class="flex items-center gap-3 text-sm">
                <Checkbox v-model:checked="rememberPassword" :disabled="isLoading" />
                <span>记住密码</span>
              </label>
              <label class="flex items-center gap-3 text-sm">
                <Checkbox v-model:checked="autoLogin" :disabled="isLoading" />
                <span>自动登录</span>
              </label>
              <p class="text-xs leading-5 text-muted-foreground">
                只有你明确勾选“自动登录”，下次启动才会直接尝试恢复会话；否则始终先显示登录窗口。
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <Button class="min-w-32 flex-1" :disabled="isLoading" @click="handleLogin"
                >登录</Button
              >
              <Button variant="outline" :disabled="isLoading" @click="enterGuestMode">
                <UserRound class="mr-2 h-4 w-4" />
                访客模式
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="register" class="mt-0 space-y-4">
            <div class="space-y-2">
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

            <Button class="w-full" :disabled="isLoading" @click="handleRegister">创建账号</Button>
          </TabsContent>

          <TabsContent value="quick-login" class="mt-0 space-y-4">
            <div
              class="rounded-2xl border border-border/70 bg-muted/60 p-4 text-sm text-muted-foreground"
            >
              保留这台设备上登录过的账号，像 QQ / Steam 一样快速切换。
            </div>

            <ScrollArea class="max-h-[15rem] pr-3">
              <div class="space-y-3">
                <button
                  v-for="account in rememberedAccounts"
                  :key="account.identityId"
                  class="flex w-full items-start justify-between rounded-2xl border px-4 py-3 text-left transition"
                  :class="
                    selectedIdentityId === account.identityId
                      ? 'border-primary bg-accent/40'
                      : 'border-border bg-card hover:border-foreground/20'
                  "
                  @click="selectedIdentityId = account.identityId"
                >
                  <div class="min-w-0">
                    <div class="truncate text-sm font-semibold">
                      {{ account.nickname || account.identifier }}
                    </div>
                    <div class="truncate text-xs text-muted-foreground">
                      {{ account.identifier }}
                    </div>
                    <div class="mt-2 flex gap-2 text-[11px] text-muted-foreground">
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
                  class="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  本机还没有保存过登录账号。
                </div>
              </div>
            </ScrollArea>

            <div class="rounded-2xl bg-accent/60 px-4 py-3 text-sm text-accent-foreground">
              个人中心里的展示名统一使用 `nickname`，不再额外区分 display name。
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  </div>
</template>
