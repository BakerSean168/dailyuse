import { useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import { ScheduleTaskStatus } from '@dailyuse/contracts/schedule';

import { ScheduleTaskCard } from '../components/schedule-task-card';
import { useAppSession } from '../hooks/use-app-session';
import { useScheduleAgenda } from '../hooks/use-schedule-agenda';
import { useScheduleService } from '../hooks/use-schedule-service';
import { useScheduleTasks, type ScheduleStatusFilter, type ScheduleTaskSummary } from '../hooks/use-schedule-tasks';

import {
  PageShell,
  PrimaryButton,
  PrimaryTextField,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
  ThemedView,
} from '@dailyuse/ui-react-native';

const FILTERS: Array<{ label: string; value: ScheduleStatusFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: ScheduleTaskStatus.Active },
  { label: 'Paused', value: ScheduleTaskStatus.Paused },
  { label: 'Failed', value: ScheduleTaskStatus.Failed },
  { label: 'Completed', value: ScheduleTaskStatus.Completed },
];

function buildTaskLanes(tasks: ScheduleTaskSummary[]) {
  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;
  const endOfWeek = endOfToday + 6 * 24 * 60 * 60 * 1000;

  const activeStatuses = new Set<ScheduleTaskStatus>([ScheduleTaskStatus.Active, ScheduleTaskStatus.Paused, ScheduleTaskStatus.Failed]);

  return [
    {
      title: 'Overdue',
      description: '已经错过执行时间的调度任务。',
      items: tasks.filter(
        (task) => task.nextRunAt !== null && task.nextRunAt < now && activeStatuses.has(task.status),
      ),
    },
    {
      title: 'Today',
      description: '今天会执行或需要关注的调度任务。',
      items: tasks.filter(
        (task) => task.nextRunAt !== null && task.nextRunAt >= startOfToday && task.nextRunAt <= endOfToday,
      ),
    },
    {
      title: 'Next 7 days',
      description: '未来一周内会进入执行窗口的任务。',
      items: tasks.filter(
        (task) => task.nextRunAt !== null && task.nextRunAt > endOfToday && task.nextRunAt <= endOfWeek,
      ),
    },
  ].filter((lane) => lane.items.length > 0);
}

export function ScheduleScreen() {
  const router = useRouter();
  const service = useScheduleService();
  const { signOut } = useAppSession();
  const {
    error,
    filteredTasks,
    isLoading,
    isRemoteAuthenticated,
    refresh,
    searchQuery,
    setSearchQuery,
    setStatusFilter,
    statusFilter,
    tasks,
  } = useScheduleTasks();
  const {
    entries,
    error: agendaError,
    groupedEntries,
    isLoading: isAgendaLoading,
    refresh: refreshAgenda,
  } = useScheduleAgenda();
  const [actionError, setActionError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const activeCount = tasks.filter((item) => item.status === ScheduleTaskStatus.Active).length;
  const overdueCount = tasks.filter((item) => item.isOverdue).length;
  const conflictCount = entries.filter((item) => item.hasConflict).length;
  const taskLanes = useMemo(() => buildTaskLanes(filteredTasks), [filteredTasks]);

  async function runAction(taskId: string, action: 'pause' | 'resume' | 'complete' | 'cancel') {
    setMutatingId(taskId);
    setActionError(null);

    const result =
      action === 'pause'
        ? await service.pauseTask(taskId)
        : action === 'resume'
          ? await service.resumeTask(taskId)
          : action === 'complete'
            ? await service.completeTask(taskId)
            : await service.cancelTask(taskId);

    setMutatingId(taskId);

    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }

    setMutatingId(null);
    await Promise.all([refresh(), refreshAgenda()]);
  }

  async function handleRefresh() {
    await Promise.all([refresh(), refreshAgenda()]);
  }

  return (
    <PageShell
      eyebrow="Schedule"
      title="Agenda and reminders"
      subtitle="调度页现在承接 task lanes、agenda、calendar/week 入口和 event editor。"
      refreshControl={<RefreshControl refreshing={isLoading || isAgendaLoading} onRefresh={handleRefresh} />}>
      {!isRemoteAuthenticated ? (
        <SectionCard title="Remote sign-in required" description="调度模块依赖远程认证会话。">
          <ThemedText type="small" themeColor="textSecondary">
            先退出当前 shell，然后用邮箱登录进入移动端，再回来查看日程任务。
          </ThemedText>
          <PrimaryButton fullWidth label="Return to sign-in" onPress={signOut} />
        </SectionCard>
      ) : (
        <>
          <SectionCard title="Navigation" description="日程主线已经拆成 list、calendar、week、editor 四个入口。">
            <View style={styles.actionRow}>
              <PrimaryButton label="Calendar" onPress={() => router.push('./calendar')} variant="secondary" />
              <PrimaryButton label="Week view" onPress={() => router.push('./week')} variant="ghost" />
              <PrimaryButton label="Create event" onPress={() => router.push('./event-editor')} />
            </View>
          </SectionCard>

          <SectionCard title="Overview" description="任务执行流和 agenda 事件已经合并到同一页。">
            <View style={styles.pillRow}>
              <StatusPill label={`${tasks.length} schedule tasks`} tone="tint" />
              <StatusPill label={`${activeCount} active`} tone="success" />
              <StatusPill label={`${overdueCount} overdue`} tone={overdueCount > 0 ? 'warning' : 'textSecondary'} />
              <StatusPill label={`${entries.length} agenda events`} tone="textSecondary" />
              <StatusPill label={`${conflictCount} conflicts`} tone={conflictCount > 0 ? 'warning' : 'textSecondary'} />
            </View>
          </SectionCard>

          <SectionCard title="Search and filters" description="任务列表先保留关键词和状态筛选，agenda 事件按日期自动分组。">
            <PrimaryTextField
              autoCapitalize="none"
              autoCorrect={false}
              hint="Search by title, description, source, or tags."
              onChangeText={setSearchQuery}
              placeholder="Search schedule tasks"
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
          </SectionCard>

          {error ? (
            <SectionCard title="Schedule load failed" description="调度任务加载失败时先直接展示错误。">
              <ThemedText type="small" themeColor="warning">{error}</ThemedText>
              <PrimaryButton label="Retry" onPress={handleRefresh} variant="secondary" />
            </SectionCard>
          ) : null}

          {agendaError ? (
            <SectionCard title="Agenda load failed" description="agenda 事件加载失败时单独提示。">
              <ThemedText type="small" themeColor="warning">{agendaError}</ThemedText>
            </SectionCard>
          ) : null}

          {actionError ? (
            <SectionCard title="Task action failed" description="状态动作失败时直接展示错误。">
              <ThemedText type="small" themeColor="warning">{actionError}</ThemedText>
            </SectionCard>
          ) : null}

          <SectionCard title="Task lanes" description="按移动端高频关注顺序把调度任务分成 overdue、today、next 7 days。">
            <View style={styles.listColumn}>
              {taskLanes.length > 0 ? (
                taskLanes.map((lane) => (
                  <View key={lane.title} style={styles.laneBlock}>
                    <View style={styles.laneHeader}>
                      <ThemedText type="smallBold">{lane.title}</ThemedText>
                      <StatusPill label={`${lane.items.length} items`} tone="textSecondary" />
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">{lane.description}</ThemedText>
                    <View style={styles.listColumn}>
                      {lane.items.map((task) => (
                        <ScheduleTaskCard
                          key={task.id}
                          task={task}
                          onPause={task.status === 'Active' ? () => runAction(task.id, 'pause') : undefined}
                          onResume={task.status === 'Paused' ? () => runAction(task.id, 'resume') : undefined}
                          onComplete={task.status !== 'Completed' ? () => runAction(task.id, 'complete') : undefined}
                          onCancel={task.status !== 'Cancelled' ? () => runAction(task.id, 'cancel') : undefined}
                        />
                      ))}
                    </View>
                  </View>
                ))
              ) : (
                <ThemedText type="small" themeColor="textSecondary">当前筛选条件下没有匹配的任务分组。</ThemedText>
              )}
            </View>
          </SectionCard>

          <SectionCard title="Agenda" description="未来两周的日程事件按天分组，并直接提供编辑入口。">
            <View style={styles.listColumn}>
              {groupedEntries.length > 0 ? (
                groupedEntries.map((group) => (
                  <View key={group.dayKey} style={styles.laneBlock}>
                    <View style={styles.laneHeader}>
                      <ThemedText type="smallBold">{group.dayLabel}</ThemedText>
                      <View style={styles.pillRow}>
                        <StatusPill label={`${group.items.length} events`} tone="textSecondary" />
                        <PrimaryButton label="Quick add" onPress={() => router.push(`./event-editor?date=${group.dayKey}`)} variant="ghost" />
                      </View>
                    </View>
                    <View style={styles.listColumn}>
                      {group.items.map((entry) => (
                        <ThemedView key={entry.id} type="backgroundSelected" style={styles.agendaCard}>
                          <View style={styles.laneHeader}>
                            <ThemedText type="smallBold">{entry.title}</ThemedText>
                            <StatusPill label={entry.timeRange} tone="tint" />
                          </View>
                          {entry.description ? <ThemedText type="small">{entry.description}</ThemedText> : null}
                          <View style={styles.pillRow}>
                            <StatusPill label={`${entry.durationMinutes} min`} tone="textSecondary" />
                            {entry.location ? <StatusPill label={entry.location} tone="textSecondary" /> : null}
                            {entry.attendeesCount > 0 ? <StatusPill label={`${entry.attendeesCount} attendees`} tone="textSecondary" /> : null}
                            {entry.hasConflict ? <StatusPill label="Conflict" tone="warning" /> : null}
                          </View>
                          <View style={styles.actionRow}>
                            <PrimaryButton label="Edit event" onPress={() => router.push(`./event-editor?id=${entry.id}`)} variant="secondary" />
                            <PrimaryButton label="Week context" onPress={() => router.push('./week')} variant="ghost" />
                          </View>
                        </ThemedView>
                      ))}
                    </View>
                  </View>
                ))
              ) : (
                <ThemedText type="small" themeColor="textSecondary">未来两周还没有 agenda 事件。</ThemedText>
              )}
            </View>
          </SectionCard>

          {!isLoading && filteredTasks.length === 0 ? (
            <SectionCard title="No schedule tasks matched" description={tasks.length === 0 ? '当前还没有调度任务。' : '换一个关键词或状态筛选试试。'}>
              <ThemedText type="small" themeColor="textSecondary">
                当前搜索词：{searchQuery.trim().length === 0 ? 'none' : searchQuery}
              </ThemedText>
            </SectionCard>
          ) : null}

          {mutatingId ? <ThemedText type="small" themeColor="textSecondary">Updating schedule task {mutatingId}…</ThemedText> : null}
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
  filterRow: {
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
  laneBlock: {
    gap: Spacing.two,
  },
  laneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  agendaCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
