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
  const actionSections = [
    {
      title: 'Goals',
      description: '创建和辅助跳转从内容区收回到页面抽屉。',
      items: [
        {
          label: 'Create goal',
          description: '进入目标创建页。',
          onPress: () => router.push('./editor'),
        },
        {
          label: 'Compare',
          description: '打开目标对比视图。',
          onPress: () => router.push('./compare'),
        },
      ],
    },
  ];

  return (
    <PageShell
      actionMenuSubtitle="目标页的入口统一收进左上角。"
      actionSections={actionSections}
      eyebrow="Goals"
      title="Goal tracking"
      subtitle="目标列表、筛选和对比。"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
    >
      {!isRemoteAuthenticated ? (
        <SectionCard title="Sign in required" description="登录后可查看目标数据。">
          <ThemedText type="small" themeColor="textSecondary">
            Sign in with a remote account to load goals.
          </ThemedText>
          <PrimaryButton fullWidth label="Go to sign-in" onPress={signOut} />
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="Summary"
            description="目标数量、完成情况和关键结果。"
          >
            <View style={styles.pillRow}>
              <StatusPill label={`${goals.length} goals`} tone="tint" />
              <StatusPill label={`${completedCount} completed`} tone="success" />
              <StatusPill label={`${totalKeyResults} key results`} tone="textSecondary" />
            </View>
          </SectionCard>

          <SectionCard
            title="Search and filters"
            description="按关键词和状态筛选目标。"
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
            <SectionCard title="Goal load failed" description="Unable to load goals.">
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
