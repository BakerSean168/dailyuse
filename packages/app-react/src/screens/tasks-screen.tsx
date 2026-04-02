import { RefreshControl, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import { TaskTemplateStatus } from '@dailyuse/contracts/task';

import { TaskTemplateCard } from '../components/task-template-card';
import { useAppSession } from '../hooks/use-app-session';
import { useTaskTemplates, type TaskSortOption, type TaskStatusFilter } from '../hooks/use-task-templates';

import {
  PageShell,
  PrimaryButton,
  PrimaryTextField,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
} from '@dailyuse/ui-react-native';

const FILTERS: Array<{ label: string; value: TaskStatusFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: TaskTemplateStatus.Active },
  { label: 'Paused', value: TaskTemplateStatus.Paused },
  { label: 'Archived', value: TaskTemplateStatus.Archived },
];

const SORTS: Array<{ label: string; value: TaskSortOption }> = [
  { label: 'Updated', value: 'updated' },
  { label: 'Priority', value: 'priority' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completion', value: 'completion' },
];

export function TasksScreen() {
  const router = useRouter();
  const { signOut } = useAppSession();
  const {
    blockedOnly,
    error,
    filteredTemplates,
    isLoading,
    isRemoteAuthenticated,
    refresh,
    searchQuery,
    setBlockedOnly,
    setSearchQuery,
    setSortBy,
    setStatusFilter,
    sortBy,
    statusFilter,
    templates,
  } = useTaskTemplates();

  const activeCount = templates.filter((item) => item.status === TaskTemplateStatus.Active).length;
  const blockedCount = templates.filter((item) => item.isBlocked).length;
  const totalPending = templates.reduce((sum, item) => sum + item.pendingInstanceCount, 0);

  return (
    <PageShell
      eyebrow="Tasks"
      title="Task workspace"
      subtitle="任务模块现在已经有真实列表、排序和 blocked 过滤，下一步主要是依赖关系和更深的实例流。"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}>
      {!isRemoteAuthenticated ? (
        <SectionCard
          title="Remote sign-in required"
          description="任务模块当前直接请求后端，需要远程认证会话。Guest 和 demo 模式不会加载任务数据。">
          <ThemedText type="small" themeColor="textSecondary">
            先退出当前 shell，然后用邮箱登录进入移动端，再回来查看任务列表。
          </ThemedText>
          <PrimaryButton fullWidth label="Return to sign-in" onPress={signOut} />
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="Overview"
            description="先给移动端任务首页一个稳定的摘要层，后面再把今日待办和最近更新接进首页。"
            footer={<PrimaryButton label="Create template" onPress={() => router.push('./editor')} />}>
            <View style={styles.overviewRow}>
              <StatusPill label={`${templates.length} templates`} tone="tint" />
              <StatusPill label={`${activeCount} active`} tone="success" />
              <StatusPill label={`${blockedCount} blocked`} tone={blockedCount > 0 ? 'warning' : 'textSecondary'} />
              <StatusPill label={`${totalPending} pending instances`} tone="textSecondary" />
            </View>
          </SectionCard>

          <SectionCard title="Search and filters" description="先把高频筛选和排序做成常驻区，后面再收口成 sheet。">
            <PrimaryTextField
              autoCapitalize="none"
              autoCorrect={false}
              hint="Search by title, description, or tags."
              onChangeText={setSearchQuery}
              placeholder="Search templates"
              value={searchQuery}
            />

            <View style={styles.filterRow}>
              {FILTERS.map((filter) => (
                <PrimaryButton
                  key={filter.value}
                  label={filter.label}
                  onPress={() => setStatusFilter(filter.value)}
                  variant={statusFilter === filter.value ? 'solid' : 'ghost'}
                />
              ))}
            </View>

            <View style={styles.filterRow}>
              {SORTS.map((sort) => (
                <PrimaryButton
                  key={sort.value}
                  label={sort.label}
                  onPress={() => setSortBy(sort.value)}
                  variant={sortBy === sort.value ? 'solid' : 'ghost'}
                />
              ))}
            </View>

            <View style={styles.filterRow}>
              <PrimaryButton label={blockedOnly ? 'Blocked only' : 'All blockers'} onPress={() => setBlockedOnly((current) => !current)} variant={blockedOnly ? 'solid' : 'ghost'} />
            </View>
          </SectionCard>

          {error ? (
            <SectionCard title="Task load failed" description="后端返回错误时先明确展示，不做静默 fallback。">
              <ThemedText type="small" themeColor="warning">{error}</ThemedText>
              <PrimaryButton label="Retry" onPress={refresh} variant="secondary" />
            </SectionCard>
          ) : null}

          {!isLoading && filteredTemplates.length === 0 ? (
            <SectionCard
              title="No tasks matched"
              description={
                templates.length === 0
                  ? '当前筛选下没有任务模板。后端有数据后这里会显示真实任务卡片。'
                  : '换一个关键词、状态或排序条件试试。'
              }>
              <ThemedText type="small" themeColor="textSecondary">
                当前搜索词：{searchQuery.trim().length === 0 ? 'none' : searchQuery}
              </ThemedText>
            </SectionCard>
          ) : null}

          <View style={styles.listColumn}>
            {filteredTemplates.map((template) => (
              <TaskTemplateCard
                key={template.id}
                template={template}
                onOpen={() => router.push(`./${template.id}`)}
                onEdit={() => router.push(`./editor?id=${template.id}`)}
              />
            ))}
          </View>
        </>
      )}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  overviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  listColumn: {
    gap: Spacing.three,
  },
});
