import { RefreshControl, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import type { PreferenceCategory } from '@dailyuse/contracts/setting';

import { useAppSession } from '../hooks/use-app-session';
import { useSettings } from '../hooks/use-settings';

import {
  PageShell,
  PrimaryButton,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
} from '@dailyuse/ui-react-native';

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

  return (
    <PageShell
      eyebrow="More"
      title="Settings"
      subtitle="设置页已经从只读摘要升级成带快速动作的移动端偏好面板。"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}>
      <SectionCard title="Navigation" description="设置页先承接偏好摘要和快速切换动作。">
        <PrimaryButton label="Back to More" onPress={() => router.back()} variant="secondary" />
      </SectionCard>

      {!isRemoteAuthenticated ? (
        <SectionCard title="Remote sign-in required" description="设置模块依赖远程认证会话。">
          <ThemedText type="small" themeColor="textSecondary">
            先退出当前 shell，然后用邮箱登录进入移动端，再回来查看设置。
          </ThemedText>
          <PrimaryButton fullWidth label="Return to sign-in" onPress={signOut} />
        </SectionCard>
      ) : (
        <>
          {error ? (
            <SectionCard title="Settings load failed" description="后端返回错误时先直接展示。">
              <ThemedText type="small" themeColor="warning">
                {error}
              </ThemedText>
            </SectionCard>
          ) : null}

          {settings ? (
            <>
              <SectionCard title="Overview" description="先展示当前设置实体和分类数量。">
                <View style={styles.pillRow}>
                  <StatusPill label={`${categories.length} categories`} tone="tint" />
                  <StatusPill label={`Version ${settings.version}`} tone="textSecondary" />
                  <StatusPill label={isMutating ? 'Saving changes' : 'Ready'} tone={isMutating ? 'warning' : 'success'} />
                </View>
                <PrimaryButton label="Reset all settings" onPress={() => handleReset()} variant="ghost" disabled={isMutating} />
              </SectionCard>

              {appearance ? (
                <SectionCard title="Appearance" description="先提供移动端高频的主题切换动作。">
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
                <SectionCard title="Notifications" description="先把邮件、推送、应用内和声音开关做成快速动作。">
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
                    description="其他分类当前先展示摘要，后续再拆成专门的移动端设置页。">
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
