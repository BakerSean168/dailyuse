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
  const actionSections = [
    {
      title: 'Account',
      description: '账户相关快捷入口。',
      items: [
        {
          label: 'Settings',
          description: '打开偏好设置。',
          onPress: () => router.push('./settings'),
        },
      ],
    },
  ];

  return (
    <PageShell
      actionMenuSubtitle="账户页快捷入口。"
      actionSections={actionSections}
      eyebrow="More"
      title="Account"
      subtitle="账户资料和偏好摘要。"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}>
      {!isRemoteAuthenticated ? (
        <SectionCard title="Sign in required" description="登录后可查看账户资料。">
          <ThemedText type="small" themeColor="textSecondary">
            Sign in with a remote account to load your profile.
          </ThemedText>
          <PrimaryButton fullWidth label="Go to sign-in" onPress={signOut} />
        </SectionCard>
      ) : (
        <>
          {error ? (
            <SectionCard title="Account load failed" description="Unable to load account profile.">
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

