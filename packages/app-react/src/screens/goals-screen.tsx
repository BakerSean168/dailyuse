import { RefreshControl, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import { GoalStatus } from '@dailyuse/contracts/goal';

import { GoalCard } from '../components/goal-card';
import { useAppSession } from '../hooks/use-app-session';
import { useGoals, type GoalStatusFilter, type GoalSortField } from '../hooks/use-goals';

import {
  PageShell,
  PrimaryButton,
  PrimaryTextField,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
} from '@dailyuse/ui-react-native';

const FILTERS: Array<{ label: string; value: GoalStatusFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: GoalStatus.Active },
  { label: 'Completed', value: GoalStatus.Completed },
  { label: 'Archived', value: GoalStatus.Archived },
];

const SORT_OPTIONS: Array<{ label: string; field: GoalSortField }> = [
  { label: 'Importance', field: 'importance' },
  { label: 'Priority', field: 'priority' },
  { label: 'Progress', field: 'progress' },
  { label: 'Target Date', field: 'targetDate' },
  { label: 'Updated', field: 'updatedAt' },
];

export function GoalsScreen() {
  const router = useRouter();
  const { signOut } = useAppSession();
  const {
    error,
    filteredGoals,
    goals,
    isLoading,
    isRemoteAuthenticated,
    refresh,
    searchQuery,
    setSearchQuery,
    setSortOption,
    setStatusFilter,
    sortOption,
    statusFilter,
  } = useGoals();

  const completedCount = goals.filter((item) => item.status === GoalStatus.Completed).length;
  const totalKeyResults = goals.reduce((sum, item) => sum + item.totalKeyResults, 0);

  return (
    <PageShell
      eyebrow="Goals"
      title="Goal tracking"
      subtitle="目标模块已经接入共享 goal client。当前先落列表、筛选、详情、编辑和 review 入口。"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
    >
      {!isRemoteAuthenticated ? (
        <SectionCard title="Remote sign-in required" description="目标模块依赖远程认证会话。">
          <ThemedText type="small" themeColor="textSecondary">
            先退出当前 shell，然后用邮箱登录进入移动端，再回来查看目标列表。
          </ThemedText>
          <PrimaryButton fullWidth label="Return to sign-in" onPress={signOut} />
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="Overview"
            description="目标页先作为聚合入口，后面再继续接 key result 和 focus 流。"
          >
            <View style={styles.actionRow}>
              <PrimaryButton
                label="Create goal"
                onPress={() => router.push('./editor')}
                variant="secondary"
              />
              <PrimaryButton
                label="Compare"
                onPress={() => router.push('./compare')}
                variant="ghost"
              />
            </View>
            <View style={styles.pillRow}>
              <StatusPill label={`${goals.length} goals`} tone="tint" />
              <StatusPill label={`${completedCount} completed`} tone="success" />
              <StatusPill label={`${totalKeyResults} key results`} tone="textSecondary" />
            </View>
          </SectionCard>

          <SectionCard
            title="Search and filters"
            description="移动端先用轻量筛选，后面再换成更完整的 sheet。"
          >
            <PrimaryTextField
              autoCapitalize="none"
              autoCorrect={false}
              hint="Search by title, description, or tags."
              onChangeText={setSearchQuery}
              placeholder="Search goals"
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

          <SectionCard title="Sort" description="按不同维度排序目标列表">
            <View style={styles.filterRow}>
              {SORT_OPTIONS.map((option) => (
                <PrimaryButton
                  key={option.field}
                  label={option.label}
                  onPress={() =>
                    setSortOption((prev) => ({
                      field: option.field,
                      direction:
                        prev.field === option.field && prev.direction === 'desc' ? 'asc' : 'desc',
                    }))
                  }
                  variant={sortOption.field === option.field ? 'solid' : 'ghost'}
                />
              ))}
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {sortOption.field} ({sortOption.direction === 'asc' ? 'ascending' : 'descending'})
            </ThemedText>
          </SectionCard>

          {error ? (
            <SectionCard title="Goal load failed" description="后端返回错误时先直接展示。">
              <ThemedText type="small" themeColor="warning">
                {error}
              </ThemedText>
              <PrimaryButton label="Retry" onPress={refresh} variant="secondary" />
            </SectionCard>
          ) : null}

          {!isLoading && filteredGoals.length === 0 ? (
            <SectionCard
              title="No goals matched"
              description={goals.length === 0 ? '当前还没有目标。' : '换一个关键词或状态筛选试试。'}
            >
              <ThemedText type="small" themeColor="textSecondary">
                当前搜索词：{searchQuery.trim().length === 0 ? 'none' : searchQuery}
              </ThemedText>
            </SectionCard>
          ) : null}

          <View style={styles.listColumn}>
            {filteredGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onOpen={() => router.push(`./${goal.id}`)} />
            ))}
          </View>
        </>
      )}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
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
  listColumn: {
    gap: Spacing.three,
  },
});
