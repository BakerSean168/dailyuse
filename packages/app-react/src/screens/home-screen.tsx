import { StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import { APP_DESCRIPTION, APP_NAME } from '../constants/app';
import { useGoals } from '../hooks/use-goals';
import { useScheduleTasks } from '../hooks/use-schedule-tasks';
import { useTaskTemplates } from '../hooks/use-task-templates';
import { useAppSession } from '../providers/app-session-provider';

import {
  FeatureTile,
  PageShell,
  PrimaryButton,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
  ThemedView,
} from '@dailyuse/ui-react-native';

function buildGreeting(name: string | null) {
  if (!name) {
    return 'Welcome to the mobile workspace';
  }

  return `Welcome back, ${name}`;
}

export function HomeScreen() {
  const router = useRouter();
  const { currentUser, isGuest, isRemoteAuthenticated, sessionKind, signInDemo, signOut } = useAppSession();
  const { templates } = useTaskTemplates();
  const { goals } = useGoals();
  const { tasks: scheduleTasks } = useScheduleTasks();

  return (
    <PageShell
      eyebrow="DailyUse Mobile"
      title={buildGreeting(currentUser?.displayName ?? null)}
      subtitle="首页作为移动端聚合入口，承接任务、目标、日程和提醒的单列信息流。">
      <SectionCard
        title="Workspace snapshot"
        description={currentUser ? `${currentUser.workspaceName} is active on this device.` : APP_DESCRIPTION}>
        <View style={styles.pillRow}>
          <StatusPill label={`Session: ${sessionKind}`} tone={isRemoteAuthenticated ? 'success' : 'tint'} />
          <StatusPill
            label={isRemoteAuthenticated ? 'Remote auth ready' : isGuest ? 'Guest sandbox' : 'Local shell mode'}
            tone={isRemoteAuthenticated ? 'success' : isGuest ? 'warning' : 'textSecondary'}
          />
          <StatusPill label={APP_NAME} tone="tint" />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          这个区域后续会继续替换成今日摘要、未完成任务、目标进展和最近提醒，现在已经切到真实模块预览。
        </ThemedText>
      </SectionCard>

      <SectionCard
        title="Today summary"
        description="首页现在直接显示任务、目标和调度任务的轻量聚合。"
        footer={<PrimaryButton label="Open More" onPress={() => router.push('./explore')} variant="secondary" />}>
        <View style={styles.pillRow}>
          <StatusPill label={`${templates.length} tasks`} tone="tint" />
          <StatusPill label={`${goals.length} goals`} tone="success" />
          <StatusPill label={`${scheduleTasks.length} schedule items`} tone="textSecondary" />
        </View>
      </SectionCard>

      <SectionCard
        title="Task preview"
        description="任务模块已经接入共享 task client。首页先显示一个轻量预览，后续再扩成真正的今日摘要。"
        footer={<PrimaryButton label="Open task workspace" onPress={() => router.push('./tasks')} variant="secondary" />}>
        {isRemoteAuthenticated ? (
          templates.length > 0 ? (
            <View style={styles.previewList}>
              {templates.slice(0, 3).map((template) => (
                <ThemedView key={template.id} type="backgroundSelected" style={styles.previewCard}>
                  <ThemedText type="smallBold">{template.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {template.description ?? 'No description yet.'}
                  </ThemedText>
                  <View style={styles.previewMetaRow}>
                    <StatusPill label={template.status} tone={template.status === 'Active' ? 'success' : 'warning'} />
                    <StatusPill label={`${template.pendingInstanceCount} pending`} tone="textSecondary" />
                  </View>
                </ThemedView>
              ))}
            </View>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              当前还没有任务模板，等后端数据准备好后这里会直接显示真实预览。
            </ThemedText>
          )
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            首页任务预览依赖远程认证。登录后这里会直接显示任务摘要。
          </ThemedText>
        )}
      </SectionCard>

      <SectionCard
        title="Priority lanes"
        description="移动端高频模块已经切成真实 tab，后续继续补详情、编辑和次级流程。">
        <View style={styles.tileGrid}>
          <FeatureTile
            eyebrow="Live"
            title="Tasks"
            description="任务列表、详情、创建编辑已经接入共享 client。"
            onPress={() => router.push('./tasks')}
          />
          <FeatureTile
            eyebrow="Live"
            title="Goals"
            description="目标列表和详情已接入，复盘与编辑后续继续补。"
            onPress={() => router.push('./goals')}
          />
          <FeatureTile
            eyebrow="Live"
            title="Schedule"
            description="调度任务和状态动作已接入，后续再并入完整 agenda。"
            onPress={() => router.push('./schedule')}
          />
          <FeatureTile
            eyebrow="Live"
            title="More"
            description="提醒、通知、账户和设置统一收在 More 栈里。"
            onPress={() => router.push('./explore')}
          />
        </View>
      </SectionCard>

      <SectionCard
        title="Session actions"
        description="当前先保留最小会话控制，等主页真实数据继续扩展后再把这些动作降级到设置区。">
        <View style={styles.actionGroup}>
          {isGuest ? (
            <PrimaryButton fullWidth label="Upgrade to demo workspace" onPress={signInDemo} />
          ) : null}
          <PrimaryButton
            fullWidth
            label={isRemoteAuthenticated ? 'Sign out of remote session' : 'Sign out of shell'}
            onPress={signOut}
            variant={isGuest ? 'secondary' : 'solid'}
          />
        </View>
      </SectionCard>

      <SectionCard
        title="Migration note"
        description="移动端不复刻桌面 Dashboard，而是按单列信息流、详情下钻和 sheet 交互重做。">
        <ThemedView type="backgroundSelected" style={styles.noteBlock}>
          <ThemedText type="small">
            当前已完成：Expo 壳瘦身、认证持久化、启动恢复、主题抽离、首页重构、Tasks / Goals / Schedule 主链路和 More 子页面基础栈。
          </ThemedText>
        </ThemedView>
      </SectionCard>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  previewList: {
    gap: Spacing.two,
  },
  previewCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  previewMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actionGroup: {
    gap: Spacing.two,
  },
  noteBlock: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
});
