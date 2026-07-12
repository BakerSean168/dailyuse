<script setup lang="ts">
/**
 * AccountProfileSection — 账户资料 + 登出（UI_PAGE_REDESIGN_PLAN §13）
 *
 * 从 AccountCenterView 原样迁入（表单/登出确认逻辑不变），
 * 作为设置页「账户与隐私」分组的一节。`account-center-view` /
 * `account-logout-button` testid 随组件迁移（auth e2e 契约）。
 */
import { computed, inject, onMounted, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator,
  useConfirm,
} from '@dailyuse/ui-vue-shadcn';
import { LogOut } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useAccount } from '../composables/useAccount';
import { LOGOUT_HANDLER_KEY } from '../../../di/keys';
import { translateResultError } from '../../../shared/utils/translate-result-error';

const { t } = useI18n();
const logout = inject(LOGOUT_HANDLER_KEY);

const { currentAccount, isLoading, isGuest, loadMyProfile, updateMyProfile } = useAccount();

const form = reactive({
  nickname: '',
  bio: '',
  avatar: '',
});

const hasAccount = computed(() => currentAccount.value !== null);
const initials = computed(() => (form.nickname || 'DU').slice(0, 2).toUpperCase());

watch(
  currentAccount,
  (account) => {
    if (!account) {
      return;
    }
    form.nickname = account.profile.nickname || '';
    form.bio = account.profile.bio || '';
    form.avatar = account.profile.avatarUrl || '';
  },
  { immediate: true },
);

async function handleSave() {
  await updateMyProfile({
    nickname: form.nickname,
    bio: form.bio || null,
    avatar: form.avatar || null,
  });
}

async function handleLogout() {
  const confirmed = await useConfirm({
    title: t('account.logoutConfirm.title'),
    description: t('account.logoutConfirm.description'),
    confirmText: t('account.logoutConfirm.confirmText'),
    cancelText: t('account.logoutConfirm.cancelText'),
    variant: 'destructive',
  });

  if (!confirmed) {
    return;
  }

  if (!logout) {
    toast.error(t('auth.toast.operationFailed'), {
      description: t('account.logoutHandlerUnavailable'),
    });
    return;
  }

  try {
    await logout();
    toast.success(t('auth.toast.loggedOut'));
  } catch (error) {
    toast.error(t('auth.toast.operationFailed'), {
      description: translateResultError(error, t, {
        fallbackKey: 'common.operationFailed',
      }),
    });
  }
}

onMounted(() => {
  void loadMyProfile();
});
</script>

<template>
  <div data-testid="account-center-view" class="space-y-6">
    <Card class="border-border/70">
      <CardHeader>
        <CardTitle>{{ t('account.center') }}</CardTitle>
        <CardDescription>{{ t('account.description') }}</CardDescription>
      </CardHeader>

      <CardContent v-if="hasAccount" class="space-y-8">
        <div class="flex flex-col gap-5 md:flex-row md:items-center">
          <Avatar class="h-20 w-20 border border-border bg-muted/60">
            <AvatarImage :src="form.avatar" :alt="form.nickname" />
            <AvatarFallback class="text-xl font-semibold">{{ initials }}</AvatarFallback>
          </Avatar>

          <div class="space-y-1">
            <div class="text-xl font-semibold">{{ form.nickname }}</div>
            <div class="text-sm text-muted-foreground">
              {{ currentAccount?.email?.address || t('account.guestLabel') }}
            </div>
          </div>
        </div>

        <Separator />

        <div class="grid gap-5 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="nickname">{{ t('account.profile.nickname') }}</Label>
            <Input
              id="nickname"
              v-model="form.nickname"
              :placeholder="t('account.placeholder.nickname')"
              :disabled="isLoading || isGuest"
            />
          </div>

          <div class="space-y-2">
            <Label for="avatar">{{ t('account.profile.avatarUrl') }}</Label>
            <Input
              id="avatar"
              v-model="form.avatar"
              :placeholder="t('account.placeholder.avatarUrl')"
              :disabled="isLoading || isGuest"
            />
          </div>

          <div class="space-y-2 md:col-span-2">
            <Label for="bio">{{ t('account.profile.bio') }}</Label>
            <Input
              id="bio"
              v-model="form.bio"
              :placeholder="t('account.placeholder.bio')"
              :disabled="isLoading || isGuest"
            />
          </div>
        </div>
      </CardContent>

      <CardContent v-else class="text-sm text-muted-foreground">
        {{ t('account.status.loading') }}
      </CardContent>

      <CardFooter class="justify-end border-t border-border/60 bg-muted/40 px-6 py-4">
        <Button :disabled="isLoading || !hasAccount || isGuest" @click="handleSave">
          {{ t('account.actions.saveProfile') }}
        </Button>
      </CardFooter>
    </Card>

    <!-- 登出：破坏性动作分区（§0.1 危险区约定） -->
    <Card class="border-destructive/30 bg-destructive/8">
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-destructive">
          <LogOut class="h-4 w-4" />
          {{ t('account.actions.logout') }}
        </CardTitle>
        <CardDescription>{{ t('account.logoutHint') }}</CardDescription>
      </CardHeader>

      <CardContent class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p class="text-sm leading-6 text-muted-foreground">
          {{ t('account.logoutConfirm.description') }}
        </p>

        <Button
          data-testid="account-logout-button"
          variant="destructive"
          :disabled="isLoading"
          @click="handleLogout"
        >
          <LogOut class="mr-2 h-4 w-4" />
          {{ t('account.actions.logout') }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
