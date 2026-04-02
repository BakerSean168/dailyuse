import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import { ReminderTemplateCard } from '../components/reminder-template-card';
import { useAppSession } from '../hooks/use-app-session';
import { useReminders } from '../hooks/use-reminders';

import {
  PageShell,
  PrimaryButton,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
} from '@dailyuse/ui-react-native';

export function RemindersScreen() {
  const router = useRouter();
  const { signOut } = useAppSession();
  const { error, isLoading, isRemoteAuthenticated, refresh, templates, todaySchedule, toggleTemplateEnabled } = useReminders();
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  async function handleToggle(id: string) {
    setMutatingId(id);
    await toggleTemplateEnabled(id);
    setMutatingId(null);
  }

  return (
    <PageShell
      eyebrow="More"
      title="Reminders"
      subtitle="提醒模块现在支持详情和创建编辑入口，不再只停留在模板列表。"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}>
      <SectionCard title="Navigation" description="当前 reminders 先放在 More 栈，后面再评估是否升到主导航。">
        <View style={styles.actionRow}>
          <PrimaryButton label="Back to More" onPress={() => router.back()} variant="secondary" />
          <PrimaryButton label="Create template" onPress={() => router.push('./reminder-editor')} />
        </View>
      </SectionCard>

      {!isRemoteAuthenticated ? (
        <SectionCard title="Remote sign-in required" description="提醒模块依赖远程认证会话。">
          <ThemedText type="small" themeColor="textSecondary">
            先退出当前 shell，然后用邮箱登录进入移动端，再回来查看提醒数据。
          </ThemedText>
          <PrimaryButton fullWidth label="Return to sign-in" onPress={signOut} />
        </SectionCard>
      ) : (
        <>
          <SectionCard title="Overview" description="模板、今日提醒和详情编辑入口已经收进同一页。">
            <View style={styles.pillRow}>
              <StatusPill label={`${templates.length} templates`} tone="tint" />
              <StatusPill label={`${todaySchedule.length} today`} tone="success" />
            </View>
          </SectionCard>

          {error ? (
            <SectionCard title="Reminder load failed" description="后端返回错误时先直接展示。">
              <ThemedText type="small" themeColor="warning">{error}</ThemedText>
            </SectionCard>
          ) : null}

          <SectionCard title="Today schedule" description="今天会触发的提醒先在这里做单列摘要。">
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
            <SectionCard title="No reminder templates" description="当前账号还没有提醒模板。">
              <ThemedText type="small" themeColor="textSecondary">现在已经可以直接从移动端创建模板。</ThemedText>
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
