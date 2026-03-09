<script setup lang="ts">
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

const { t } = useI18n();
const logout = inject(LOGOUT_HANDLER_KEY);

const { currentAccount, isLoading, loadMyProfile, updateMyProfile } = useAccount();

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
  if (!logout) {
    return;
  }

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

  toast.success(t('auth.toast.loggedOut'));
  await logout();
}

onMounted(() => {
  void loadMyProfile();
});
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-10">
    <Card class="border-stone-200/70 bg-white/90 shadow-xl">
      <CardHeader>
        <CardTitle>{{ t('account.center') }}</CardTitle>
        <CardDescription>{{ t('account.description') }}</CardDescription>
      </CardHeader>

      <CardContent v-if="hasAccount" class="space-y-8">
        <div class="flex flex-col gap-5 md:flex-row md:items-center">
          <Avatar class="h-24 w-24 border border-slate-200">
            <AvatarImage :src="form.avatar" :alt="form.nickname" />
            <AvatarFallback class="text-xl font-semibold">{{ initials }}</AvatarFallback>
          </Avatar>

          <div class="space-y-1">
            <div class="text-2xl font-semibold">{{ form.nickname }}</div>
            <div class="text-sm text-slate-500">{{ currentAccount?.email?.address }}</div>
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
              :disabled="isLoading"
            />
          </div>

          <div class="space-y-2">
            <Label for="avatar">{{ t('account.profile.avatarUrl') }}</Label>
            <Input
              id="avatar"
              v-model="form.avatar"
              :placeholder="t('account.placeholder.avatarUrl')"
              :disabled="isLoading"
            />
          </div>

          <div class="space-y-2 md:col-span-2">
            <Label for="bio">{{ t('account.profile.bio') }}</Label>
            <Input
              id="bio"
              v-model="form.bio"
              :placeholder="t('account.placeholder.bio')"
              :disabled="isLoading"
            />
          </div>
        </div>
      </CardContent>

      <CardContent v-else class="text-sm text-slate-500">{{
        t('account.status.loading')
      }}</CardContent>

      <CardFooter class="justify-end border-t bg-slate-50/80 px-6 py-4">
        <Button :disabled="isLoading || !hasAccount" @click="handleSave">
          {{ t('account.actions.saveProfile') }}
        </Button>
      </CardFooter>
    </Card>

    <Card class="mt-6 border-red-200 bg-red-50/80 shadow-lg">
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-red-700">
          <LogOut class="h-4 w-4" />
          {{ t('account.actions.logout') }}
        </CardTitle>
        <CardDescription>{{ t('account.logoutHint') }}</CardDescription>
      </CardHeader>

      <CardContent class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p class="text-sm leading-6 text-slate-600">
          {{ t('account.logoutConfirm.description') }}
        </p>

        <Button variant="destructive" :disabled="isLoading" @click="handleLogout">
          <LogOut class="mr-2 h-4 w-4" />
          {{ t('account.actions.logout') }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
