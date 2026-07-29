import { RefreshControl, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import type { PreferenceCategory } from '@memoflow/contracts/setting';

import { useAppSession } from '../hooks/useAppSession';
import { useSettings } from '../hooks/useSettings';

import {
  PageShell,
  PrimaryButton,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
} from '@memoflow/ui-react-native';

const THEME_SEQUENCE = ['auto', 'light', 'dark'] as const;
const LANGUAGE_SEQUENCE = ['zh-CN', 'en-US'] as const;

export function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAppSession();
  const { error, isLoading, isMutating, isRemoteAuthenticated, patchCategory, refresh, resetCategory, settings } = useSettings();

  const categories = settings ? Object.entries(settings.preferences) : [];
  const appearance = settings?.preferences.appearance;
  const locale = settings?.preferences.locale;
  const notification = settings?.preferences.notification;

  async function cycleTheme() {
    if (!appearance) {
      return;
    }

    const currentIndex = THEME_SEQUENCE.indexOf(appearance.theme as (typeof THEME_SEQUENCE)[number]);
    const nextTheme = THEME_SEQUENCE[(currentIndex + 1) % THEME_SEQUENCE.length];
    await patchCategory('appearance', { theme: nextTheme });
  }

  async function toggleLanguage() {
    if (!locale) {
      return;
    }

    const nextLanguage = locale.language === LANGUAGE_SEQUENCE[0] ? LANGUAGE_SEQUENCE[1] : LANGUAGE_SEQUENCE[0];
    await patchCategory('locale', { language: nextLanguage });
  }

  async function toggleTimeFormat() {
    if (!locale) {
      return;
    }

    await patchCategory('locale', { timeFormat: locale.timeFormat === '24H' ? '12H' : '24H' });
  }

  async function toggleNotification(key: 'email' | 'push' | 'inApp' | 'sound') {
    if (!notification) {
      return;
    }

    await patchCategory('notification', { [key]: !notification[key] });
  }

  async function handleReset(category?: PreferenceCategory) {
    await resetCategory(category);
  }

  const actionSections = [
    {
      title: 'Settings',
      description: '偏好设置快捷操作。',
      items: [
        {
          label: 'Reset all settings',
          description: '恢复全部偏好设置。',
          disabled: isMutating || !settings,
          onPress: () => handleReset(),
        },
        {
          label: 'Account',
          description: '查看账户资料。',
          onPress: () => router.push('./account'),
        },
      ],
    },
  ];

  return (
    <PageShell
      actionMenuSubtitle="偏好设置快捷操作。"
      actionSections={actionSections}
      eyebrow="More"
      title="Settings"
      subtitle="主题、语言、通知和其他偏好。"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}>
      {!isRemoteAuthenticated ? (
        <SectionCard title="Sign in required" description="登录后可同步设置。">
          <ThemedText type="small" themeColor="textSecondary">
            Sign in with a remote account to load your settings.
          </ThemedText>
          <PrimaryButton fullWidth label="Go to sign-in" onPress={signOut} />
        </SectionCard>
      ) : (
        <>
          {error ? (
            <SectionCard title="Settings load failed" description="Unable to load settings.">
              <ThemedText type="small" themeColor="warning">
                {error}
              </ThemedText>
            </SectionCard>
          ) : null}

          {settings ? (
            <>
              <SectionCard title="Summary" description="设置版本和分类状态。">
                <View style={styles.pillRow}>
                  <StatusPill label={`${categories.length} categories`} tone="tint" />
                  <StatusPill label={`Version ${settings.version}`} tone="textSecondary" />
                  <StatusPill label={isMutating ? 'Saving changes' : 'Ready'} tone={isMutating ? 'warning' : 'success'} />
                </View>
                <PrimaryButton label="Reset all settings" onPress={() => handleReset()} variant="ghost" disabled={isMutating} />
              </SectionCard>

              {appearance ? (
                <SectionCard title="Appearance" description="主题模式和重置。">
                  <View style={styles.pillRow}>
                    <StatusPill label={`Theme ${appearance.theme}`} tone="tint" />
                  </View>
                  <View style={styles.actionRow}>
                    <PrimaryButton label={isMutating ? 'Saving…' : 'Cycle theme'} onPress={cycleTheme} disabled={isMutating} />
                    <PrimaryButton label="Reset appearance" onPress={() => handleReset('appearance')} disabled={isMutating} variant="secondary" />
                  </View>
                </SectionCard>
              ) : null}

              {locale ? (
                <SectionCard title="Locale" description="语言和时间制式是移动端最直接可感知的本地化设置。">
                  <View style={styles.pillRow}>
                    <StatusPill label={locale.language} tone="tint" />
                    <StatusPill label={locale.timezone} tone="textSecondary" />
                    <StatusPill label={locale.timeFormat} tone="textSecondary" />
                  </View>
                  <View style={styles.actionRow}>
                    <PrimaryButton label={isMutating ? 'Saving…' : 'Toggle language'} onPress={toggleLanguage} disabled={isMutating} />
                    <PrimaryButton label={isMutating ? 'Saving…' : 'Toggle 12H / 24H'} onPress={toggleTimeFormat} disabled={isMutating} variant="secondary" />
                    <PrimaryButton label="Reset locale" onPress={() => handleReset('locale')} disabled={isMutating} variant="ghost" />
                  </View>
                </SectionCard>
              ) : null}

              {notification ? (
                <SectionCard title="Notifications" description="通知渠道和声音开关。">
                  <View style={styles.pillRow}>
                    <StatusPill label={`Email ${notification.email ? 'on' : 'off'}`} tone={notification.email ? 'success' : 'textSecondary'} />
                    <StatusPill label={`Push ${notification.push ? 'on' : 'off'}`} tone={notification.push ? 'success' : 'textSecondary'} />
                    <StatusPill label={`In-app ${notification.inApp ? 'on' : 'off'}`} tone={notification.inApp ? 'success' : 'textSecondary'} />
                    <StatusPill label={`Sound ${notification.sound ? 'on' : 'off'}`} tone={notification.sound ? 'success' : 'textSecondary'} />
                  </View>
                  <View style={styles.actionRow}>
                    <PrimaryButton label="Toggle email" onPress={() => toggleNotification('email')} disabled={isMutating} variant="secondary" />
                    <PrimaryButton label="Toggle push" onPress={() => toggleNotification('push')} disabled={isMutating} variant="secondary" />
                    <PrimaryButton label="Toggle in-app" onPress={() => toggleNotification('inApp')} disabled={isMutating} variant="secondary" />
                    <PrimaryButton label="Toggle sound" onPress={() => toggleNotification('sound')} disabled={isMutating} variant="secondary" />
                    <PrimaryButton label="Reset notifications" onPress={() => handleReset('notification')} disabled={isMutating} variant="ghost" />
                  </View>
                </SectionCard>
              ) : null}

              <View style={styles.listColumn}>
                {categories.map(([category, value]) => (
                  <SectionCard
                    key={category}
                    title={category}
                    description="Category summary.">
                    <ThemedText type="small" themeColor="textSecondary">
                      {summarizePreference(value)}
                    </ThemedText>
                  </SectionCard>
                ))}
              </View>
            </>
          ) : null}
        </>
      )}
    </PageShell>
  );
}

function summarizePreference(value: unknown): string {
  if (value == null) {
    return 'Not set';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.length === 0 ? 'Empty list' : `${value.length} entries`;
  }

  if (typeof value === 'object') {
    return `${Object.keys(value as Record<string, unknown>).length} fields configured`;
  }

  return 'Configured';
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  listColumn: {
    gap: Spacing.three,
  },
});
