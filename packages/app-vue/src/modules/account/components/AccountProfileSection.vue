<script setup lang="ts">
/**
 * AccountProfileSection — 账户资料 + 登出（UI_PAGE_REDESIGN_PLAN §13）
 *
 * 从 AccountCenterView 原样迁入（表单/登出确认逻辑不变），
 * 作为设置页「账户与隐私」分组的一节。`account-center-view` /
 * `account-logout-button` testid 随组件迁移（auth e2e 契约）。
 */
import { computed, inject, onMounted, reactive, ref, watch } from 'vue';
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
import { GitBranch, Link2Off, LogOut } from '@lucide/vue';
import { toast } from 'vue-sonner';
import { useAccount } from '../composables/useAccount';
import { useSession } from '../../authentication/composables/useSession';
import { AUTH_SERVICE_KEY, LOGOUT_HANDLER_KEY } from '../../../di/keys';
import { translateResultError } from '../../../shared/utils/translate-result-error';

const { t } = useI18n();
const logout = inject(LOGOUT_HANDLER_KEY);
const authService = inject(AUTH_SERVICE_KEY);

const { currentAccount, isLoading, error, isGuest, loadMyProfile, updateMyProfile } = useAccount();
const hasOAuth = ref(false);
const oauthBusy = ref(false);
const oauthConflictMessage = ref<string | null>(null);
const { activeSessions, loadSessions, revokeSession } = useSession();
const sessionsLoading = ref(false);

function formatSessionTime(ms: number | undefined | null): string {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return '—';
  }
}

function sessionLabel(session: (typeof activeSessions.value)[number]): string {
  const info = session.deviceInfo;
  const name =
    info?.deviceName ||
    info?.browser ||
    info?.os ||
    info?.deviceType ||
    t('account.sessions.unknownDevice');
  return name;
}

async function refreshSessions(): Promise<void> {
  sessionsLoading.value = true;
  try {
    await loadSessions();
  } finally {
    sessionsLoading.value = false;
  }
}

async function handleRevokeSession(sessionId: string, isCurrent: boolean): Promise<void> {
  if (isCurrent) {
    toast.error(t('account.sessions.cannotRevokeCurrent'));
    return;
  }
  const confirmed = await useConfirm({
    title: t('account.sessions.revokeConfirmTitle'),
    description: t('account.sessions.revokeConfirmDescription'),
    confirmText: t('account.sessions.revokeConfirmText'),
    cancelText: t('account.logoutConfirm.cancelText'),
    variant: 'destructive',
  });
  if (!confirmed) return;
  const ok = await revokeSession(sessionId);
  if (ok) {
    await refreshSessions();
  }
}

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

async function refreshOAuthStatus() {
  oauthConflictMessage.value = null;
  if (!authService || isGuest.value) {
    hasOAuth.value = false;
    return;
  }
  try {
    const result = await authService.getCurrentUser();
    if (result.ok) {
      hasOAuth.value = Boolean(result.data.identity.hasOAuth);
    }
  } catch {
    // non-blocking — security card still renders
  }
}

async function handleBindGithub() {
  if (!authService) {
    toast.error(t('auth.toast.operationFailed'), {
      description: t('account.oauth.serviceUnavailable'),
    });
    return;
  }
  oauthBusy.value = true;
  oauthConflictMessage.value = null;
  try {
    const redirectUri = `${window.location.origin}/settings?tab=account&oauth=bind-github`;
    const urlResult = await authService.getOAuthUrl({ provider: 'Github', redirectUri });
    if (!urlResult.ok) {
      if (urlResult.error.code === 'SERVICE_UNAVAILABLE') {
        toast.error(t('account.oauth.githubUnavailable'));
      } else {
        toast.error(t('auth.toast.operationFailed'), {
          description: translateResultError(urlResult.error, t, {
            fallbackKey: 'account.oauth.bindFailed',
          }),
        });
      }
      return;
    }
    // Persist state for the bind callback return path.
    sessionStorage.setItem('dailyuse.oauth.bind.state', urlResult.data.state);
    sessionStorage.setItem('dailyuse.oauth.bind.intent', 'bind-github');
    window.location.assign(urlResult.data.authUrl);
  } finally {
    oauthBusy.value = false;
  }
}

async function handleUnbindGithub() {
  if (!authService) return;
  const confirmed = await useConfirm({
    title: t('account.oauth.unbindConfirmTitle'),
    description: t('account.oauth.unbindConfirmDescription'),
    confirmText: t('account.oauth.unbindConfirmText'),
    cancelText: t('account.logoutConfirm.cancelText'),
    variant: 'destructive',
  });
  if (!confirmed) return;

  oauthBusy.value = true;
  oauthConflictMessage.value = null;
  try {
    const result = await authService.unbindOAuth({ provider: 'Github' });
    if (!result.ok) {
      if (
        result.error.context?.domainCode === 'LAST_LOGIN_PATH' ||
        result.error.code === 'CONFLICT'
      ) {
        oauthConflictMessage.value = t('account.oauth.lastLoginPath');
      }
      toast.error(t('auth.toast.operationFailed'), {
        description: translateResultError(result.error, t, {
          fallbackKey: 'account.oauth.unbindFailed',
        }),
      });
      return;
    }
    hasOAuth.value = false;
    toast.success(t('account.oauth.unbindSuccess'));
  } finally {
    oauthBusy.value = false;
  }
}

async function completePendingOAuthBind() {
  if (!authService || typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const intent = sessionStorage.getItem('dailyuse.oauth.bind.intent');
  const expectedState = sessionStorage.getItem('dailyuse.oauth.bind.state');
  if (!code || !state || intent !== 'bind-github') return;
  if (expectedState && expectedState !== state) {
    oauthConflictMessage.value = t('account.oauth.invalidState');
    sessionStorage.removeItem('dailyuse.oauth.bind.intent');
    sessionStorage.removeItem('dailyuse.oauth.bind.state');
    return;
  }

  oauthBusy.value = true;
  try {
    const result = await authService.bindOAuth({ provider: 'Github', code, state });
    sessionStorage.removeItem('dailyuse.oauth.bind.intent');
    sessionStorage.removeItem('dailyuse.oauth.bind.state');
    // Strip OAuth query params from the URL without reload.
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('oauth');
    window.history.replaceState({}, '', url.toString());

    if (!result.ok) {
      if (
        result.error.context?.domainCode === 'OAUTH_ALREADY_LINKED' ||
        result.error.code === 'CONFLICT'
      ) {
        oauthConflictMessage.value = t('account.oauth.alreadyLinked');
      }
      toast.error(t('auth.toast.operationFailed'), {
        description: translateResultError(result.error, t, {
          fallbackKey: 'account.oauth.bindFailed',
        }),
      });
      return;
    }
    hasOAuth.value = true;
    toast.success(t('account.oauth.bindSuccess'));
  } finally {
    oauthBusy.value = false;
  }
}

onMounted(() => {
  void refreshOAuthStatus();
  void completePendingOAuthBind();
  void loadMyProfile();
  void refreshSessions();
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

      <CardContent
        v-else-if="error"
        data-testid="account-profile-error"
        class="space-y-3 text-sm text-muted-foreground"
        role="alert"
      >
        <p>{{ error }}</p>
        <Button
          data-testid="account-profile-retry"
          variant="outline"
          size="sm"
          :disabled="isLoading"
          @click="loadMyProfile"
        >
          {{ t('common.retry') }}
        </Button>
      </CardContent>

      <CardContent
        v-else
        data-testid="account-profile-loading"
        class="text-sm text-muted-foreground"
      >
        {{ t('account.status.loading') }}
      </CardContent>

      <CardFooter class="justify-end border-t border-border/60 bg-muted/40 px-6 py-4">
        <Button :disabled="isLoading || !hasAccount || isGuest" @click="handleSave">
          {{ t('account.actions.saveProfile') }}
        </Button>
      </CardFooter>
    </Card>

    <Card v-if="!isGuest" class="border-border/70" data-testid="account-oauth-card">
      <CardHeader>
        <CardTitle>{{ t('account.oauth.title') }}</CardTitle>
        <CardDescription>{{ t('account.oauth.description') }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3">
          <GitBranch class="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span class="text-sm font-medium" data-testid="account-oauth-status">
            {{ hasOAuth ? t('account.oauth.githubLinked') : t('account.oauth.githubNotLinked') }}
          </span>
        </div>
        <p
          v-if="oauthConflictMessage"
          class="text-sm text-destructive"
          data-testid="account-oauth-conflict"
          role="alert"
        >
          {{ oauthConflictMessage }}
        </p>
        <p class="text-xs leading-5 text-muted-foreground">
          {{ t('account.oauth.repoScopeHint') }}
        </p>
      </CardContent>
      <CardFooter class="justify-end border-t border-border/60 bg-muted/40 px-6 py-3">
        <Button
          v-if="hasOAuth"
          variant="outline"
          size="sm"
          :disabled="oauthBusy"
          data-testid="account-oauth-unbind"
          @click="handleUnbindGithub"
        >
          <Link2Off class="mr-2 h-4 w-4" aria-hidden="true" />
          {{ t('account.oauth.unbindGithub') }}
        </Button>
        <Button
          v-else
          size="sm"
          :disabled="oauthBusy || !authService"
          data-testid="account-oauth-bind"
          @click="handleBindGithub"
        >
          <GitBranch class="mr-2 h-4 w-4" aria-hidden="true" />
          {{ t('account.oauth.bindGithub') }}
        </Button>
      </CardFooter>
    </Card>

    <Card class="border-border/70" data-testid="account-sessions-card">
      <CardHeader>
        <CardTitle>{{ t('account.sessions.title') }}</CardTitle>
        <CardDescription>{{ t('account.sessions.description') }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <div
          v-if="sessionsLoading && activeSessions.length === 0"
          class="text-sm text-muted-foreground"
          data-testid="account-sessions-loading"
        >
          {{ t('account.sessions.loading') }}
        </div>
        <div
          v-else-if="activeSessions.length === 0"
          class="text-sm text-muted-foreground"
          data-testid="account-sessions-empty"
        >
          {{ t('account.sessions.empty') }}
        </div>
        <ul v-else class="space-y-3" data-testid="account-sessions-list">
          <li
            v-for="session in activeSessions"
            :key="session.id"
            class="flex flex-col gap-2 rounded-lg border border-border/60 px-4 py-3 md:flex-row md:items-center md:justify-between"
            :data-testid="`account-session-item-${session.id}`"
          >
            <div class="space-y-1">
              <div class="flex items-center gap-2 text-sm font-medium">
                <span>{{ sessionLabel(session) }}</span>
                <span
                  v-if="session.isCurrentSession"
                  class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                  data-testid="account-session-current-badge"
                >
                  {{ t('account.sessions.current') }}
                </span>
              </div>
              <div class="text-xs text-muted-foreground">
                {{ t('account.sessions.lastActive') }}:
                {{ formatSessionTime(session.lastActiveAt) }}
              </div>
              <div v-if="session.deviceInfo?.ipAddress" class="text-xs text-muted-foreground">
                IP: {{ session.deviceInfo.ipAddress }}
              </div>
            </div>
            <Button
              v-if="!session.isCurrentSession"
              variant="outline"
              size="sm"
              :disabled="isLoading || sessionsLoading"
              :data-testid="`account-session-revoke-${session.id}`"
              @click="handleRevokeSession(session.id, !!session.isCurrentSession)"
            >
              {{ t('account.sessions.revoke') }}
            </Button>
          </li>
        </ul>
      </CardContent>
      <CardFooter class="justify-end border-t border-border/60 bg-muted/40 px-6 py-3">
        <Button
          variant="ghost"
          size="sm"
          :disabled="sessionsLoading"
          data-testid="account-sessions-refresh"
          @click="refreshSessions"
        >
          {{ t('account.sessions.refresh') }}
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
