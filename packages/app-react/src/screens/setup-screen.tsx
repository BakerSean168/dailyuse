import { Platform, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import { APP_NAME } from '../constants/app';
import { MOBILE_API_BASE_URL_HINT } from '../constants/auth';
import { useAppSession } from '../providers/app-session-provider';

import {
  FeatureTile,
  PageShell,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
} from '@dailyuse/ui-react-native';

const MODULE_SCOPE = [
  {
    title: 'Notifications',
    description: '消息列表、未读数和标记已读已经纳入移动端 More 栈。',
    phase: 'Live',
    route: './notifications',
  },
  {
    title: 'Reminders',
    description: '提醒模板与今日提醒已接入，后续再补编辑与分组。',
    phase: 'Live',
    route: './reminders',
  },
  {
    title: 'Account',
    description: '账户资料和语言/时区/主题摘要已经进入移动端。',
    phase: 'Live',
    route: './account',
  },
  {
    title: 'Settings',
    description: '设置总览已经进入移动端，后续再接可编辑的分类页。',
    phase: 'Live',
    route: './settings',
  },
  {
    title: 'AI',
    description: '会话列表、对话详情和发消息已经切进移动端单列流。',
    phase: 'Live',
    route: './ai',
  },
  {
    title: 'Repository',
    description: '仓库、资源列表和移动端编辑壳已经接入。',
    phase: 'Live',
    route: './repository',
  },
] as const;

export function SetupScreen() {
  const router = useRouter();
  const { apiBaseUrl, currentUser, isRemoteAuthenticated, sessionKind } = useAppSession();

  return (
    <PageShell
      eyebrow="More"
      title="Workspace utilities"
      subtitle="这里收拢运行态、账户相关功能和次级业务入口，作为移动端 More 栈的首页。">
      <SectionCard
        title="Runtime status"
        description={currentUser ? `${currentUser.displayName} is active in ${currentUser.workspaceName}.` : 'No shell session is active.'}>
        <View style={styles.pillRow}>
          <StatusPill label={`Mode: ${sessionKind}`} tone={isRemoteAuthenticated ? 'success' : 'warning'} />
          <StatusPill label={Platform.OS === 'web' ? 'Web preview' : 'Native runtime'} tone="tint" />
          <StatusPill label={APP_NAME} tone="textSecondary" />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          API base URL: <ThemedText type="code">{apiBaseUrl}</ThemedText>
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {MOBILE_API_BASE_URL_HINT}
        </ThemedText>
      </SectionCard>

      <SectionCard
        title="Available modules"
        description="Governance、SSE monitor 和其他开发辅助页已经排除，不进入 React/mobile 迁移范围。">
        <View style={styles.tileGrid}>
          {MODULE_SCOPE.map((item) => (
            <FeatureTile
              key={item.title}
              eyebrow={item.phase}
              title={item.title}
              description={item.description}
              onPress={() => router.push(item.route)}
            />
          ))}
        </View>
      </SectionCard>

      <SectionCard
        title="Operating rules"
        description="移动端页面继续按单列布局、详情下钻和底部 sheet 的方式实现。">
        <ThemedText type="small" themeColor="textSecondary">
          1. 首页聚合，不放桌面式多栏统计墙。
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          2. 列表优先卡片流或 section list，不做 data table。
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          3. 轻量操作进 sheet，重操作进独立 screen。
        </ThemedText>
      </SectionCard>

      <SectionCard
        title="Current rollout"
        description="当前已经完成的移动端主链路。">
        <ThemedText type="small" themeColor="textSecondary">
          1. Auth bootstrap、token 持久化、远程会话恢复。
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          2. Home / Tasks / Goals / Schedule 四个主 tab 的真实数据接入。
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          3. More 栈下的 notifications、reminders、account、settings、ai、repository。
        </ThemedText>
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
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
