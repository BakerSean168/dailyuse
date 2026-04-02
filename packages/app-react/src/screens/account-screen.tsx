import { RefreshControl, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useAccountProfile } from '../hooks/use-account-profile';
import { useAppSession } from '../hooks/use-app-session';

import {
  PageShell,
  PrimaryButton,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
} from '@dailyuse/ui-react-native';

function formatDate(timestamp: number | null) {
  if (!timestamp) {
    return 'Not set';
  }

  return new Date(timestamp).toLocaleDateString();
}

export function AccountScreen() {
  const router = useRouter();
  const { signOut } = useAppSession();
  const { account, error, isLoading, isRemoteAuthenticated, refresh } = useAccountProfile();

  return (
    <PageShell
      eyebrow="More"
      title="Account"
      subtitle="账户资料和语言/主题/时区摘要已经接入共享 account client。"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}>
      <SectionCard title="Navigation" description="账户页先作为 read-only 摘要页落地。">
        <PrimaryButton label="Back to More" onPress={() => router.back()} variant="secondary" />
      </SectionCard>

      {!isRemoteAuthenticated ? (
        <SectionCard title="Remote sign-in required" description="账户模块依赖远程认证会话。">
          <ThemedText type="small" themeColor="textSecondary">
            先退出当前 shell，然后用邮箱登录进入移动端，再回来查看账户资料。
          </ThemedText>
          <PrimaryButton fullWidth label="Return to sign-in" onPress={signOut} />
        </SectionCard>
      ) : (
        <>
          {error ? (
            <SectionCard title="Account load failed" description="后端返回错误时先直接展示。">
              <ThemedText type="small" themeColor="warning">
                {error}
              </ThemedText>
            </SectionCard>
          ) : null}

          {!isLoading && !account ? (
            <SectionCard title="No account profile" description="当前没有返回账户资料。" />
          ) : null}

          {account ? (
            <>
              <SectionCard title="Profile" description={account.profile.bio ?? 'No bio yet.'}>
                <View style={styles.pillRow}>
                  <StatusPill label={account.status} tone="tint" />
                  <StatusPill label={account.settings.language} tone="textSecondary" />
                  <StatusPill label={account.settings.theme} tone="success" />
                </View>
                <MetaRow label="Nickname" value={account.profile.nickname} />
                <MetaRow label="Real name" value={account.profile.realName ?? 'Not set'} />
                <MetaRow label="Email" value={account.email.address} />
                <MetaRow label="Phone" value={account.phone?.fullNumber ?? 'Not set'} />
                <MetaRow label="Birthday" value={formatDate(account.profile.birthday)} />
              </SectionCard>

              <SectionCard title="Preferences" description="账户级偏好和基础本地化摘要。">
                <MetaRow label="Timezone" value={account.settings.timezone} />
                <MetaRow label="Language" value={account.settings.language} />
                <MetaRow label="Theme" value={account.settings.theme} />
                <MetaRow label="Notifications" value={account.settings.notificationEnabled ? 'Enabled' : 'Disabled'} />
              </SectionCard>
            </>
          ) : null}
        </>
      )}
    </PageShell>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metaRow: {
    gap: Spacing.half,
  },
});

