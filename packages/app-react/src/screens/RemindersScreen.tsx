import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import { ReminderTemplateCard } from '../components/ReminderTemplateCard';
import { useAppSession } from '../hooks/useAppSession';
import { useReminders } from '../hooks/useReminders';

import {
  PageShell,
  PrimaryButton,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
} from '@memoflow/ui-react-native';

export function RemindersScreen() {
  const router = useRouter();
  const { signOut } = useAppSession();
  const { error, isLoading, isRemoteAuthenticated, refresh, templates, todaySchedule, toggleTemplateEnabled } = useReminders();
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const actionSections = [
    {
      title: 'Reminders',
      description: '提醒模块快捷操作。',
      items: [
        {
          label: 'Create template',
          description: '新建提醒模板。',
          onPress: () => router.push('./reminder-editor'),
        },
      ],
    },
  ];

  async function handleToggle(id: string) {
    setMutatingId(id);
    await toggleTemplateEnabled(id);
    setMutatingId(null);
  }

  return (
    <PageShell
      actionMenuSubtitle="提醒模板和快捷操作。"
      actionSections={actionSections}
      eyebrow="More"
      title="Reminders"
      subtitle="今天的提醒和全部模板。"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}>
      {!isRemoteAuthenticated ? (
        <SectionCard title="Sign in required" description="登录后可查看提醒和模板。">
          <ThemedText type="small" themeColor="textSecondary">
            Sign in with a remote account to load reminder data.
          </ThemedText>
          <PrimaryButton fullWidth label="Go to sign-in" onPress={signOut} />
        </SectionCard>
      ) : (
        <>
          <SectionCard title="Summary" description="模板数量和今日触发情况。">
            <View style={styles.pillRow}>
              <StatusPill label={`${templates.length} templates`} tone="tint" />
              <StatusPill label={`${todaySchedule.length} today`} tone="success" />
            </View>
          </SectionCard>

          {error ? (
            <SectionCard title="Reminder load failed" description="Unable to load reminders.">
              <ThemedText type="small" themeColor="warning">{error}</ThemedText>
            </SectionCard>
          ) : null}

          <SectionCard title="Today" description="即将触发的提醒。">
            <View style={styles.listColumn}>
              {todaySchedule.length > 0 ? (
                todaySchedule.map((item) => (
                  <View key={item.templateId} style={styles.scheduleCard}>
                    <ThemedText type="smallBold">{item.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">{item.nextTriggerDisplay}</ThemedText>
                    <View style={styles.pillRow}>
                      <StatusPill label={item.type} tone="tint" />
                      <StatusPill label={item.importanceLevel} tone="textSecondary" />
                    </View>
                    <PrimaryButton label="Open template" onPress={() => router.push(`./reminder-detail?id=${item.templateId}`)} variant="ghost" />
                  </View>
                ))
              ) : (
                <ThemedText type="small" themeColor="textSecondary">今天没有即将触发的提醒。</ThemedText>
              )}
            </View>
          </SectionCard>

          {!isLoading && templates.length === 0 ? (
            <SectionCard title="No reminder templates" description="Create your first reminder template.">
              <PrimaryButton label="Create template" onPress={() => router.push('./reminder-editor')} />
            </SectionCard>
          ) : null}

          <View style={styles.listColumn}>
            {templates.map((template) => (
              <View key={template.id} style={styles.listColumn}>
                <ReminderTemplateCard template={template} onToggle={() => handleToggle(String(template.id))} />
                <View style={styles.actionRow}>
                  <PrimaryButton label="Open detail" onPress={() => router.push(`./reminder-detail?id=${template.id}`)} variant="ghost" />
                  <PrimaryButton label="Edit" onPress={() => router.push(`./reminder-editor?id=${template.id}`)} variant="ghost" />
                </View>
              </View>
            ))}
          </View>

          {mutatingId ? (
            <ThemedText type="small" themeColor="textSecondary">Updating reminder template {mutatingId}…</ThemedText>
          ) : null}
        </>
      )}
    </PageShell>
  );
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
  scheduleCard: {
    gap: Spacing.one,
  },
});
