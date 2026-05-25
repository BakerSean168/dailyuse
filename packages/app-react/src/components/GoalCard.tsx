import { StyleSheet, View } from 'react-native';

import type { GoalSummary } from '../hooks/useGoals';

import { PrimaryButton, SectionCard, Spacing, StatusPill, ThemedText, ThemedView } from '@dailyuse/ui-react-native';

function statusTone(status: GoalSummary['status']) {
  if (status === 'Active') {
    return 'success' as const;
  }

  if (status === 'Completed') {
    return 'tint' as const;
  }

  return 'textSecondary' as const;
}

export function GoalCard({ goal, onOpen }: { goal: GoalSummary; onOpen?: () => void }) {
  return (
    <SectionCard
      title={goal.name}
      description={goal.description ?? 'No description yet.'}
      footer={onOpen ? <PrimaryButton label="Open detail" onPress={onOpen} variant="secondary" /> : undefined}>
      <View style={styles.pillRow}>
        <StatusPill label={goal.status} tone={statusTone(goal.status)} />
        <StatusPill label={goal.importance} tone="tint" />
        <StatusPill label={`${goal.completedKeyResults}/${goal.totalKeyResults} KR`} tone="textSecondary" />
      </View>

      <ThemedView type="backgroundSelected" style={styles.progressBlock}>
        <View style={styles.progressHeader}>
          <ThemedText type="small" themeColor="textSecondary">
            Overall progress
          </ThemedText>
          <ThemedText type="smallBold">{Math.round(goal.overallProgress)}%</ThemedText>
        </View>
        <ThemedView type="backgroundElement" style={styles.progressTrack}>
          <ThemedView type="tint" style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, goal.overallProgress))}%` }]} />
        </ThemedView>
      </ThemedView>

      <View style={styles.metaRow}>
        <Meta label="Start" value={goal.startDate ? new Date(goal.startDate).toLocaleDateString() : 'Not set'} />
        <Meta label="Target" value={goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'Not set'} />
        <Meta label="Priority" value={String(goal.priority)} />
      </View>

      <View style={styles.tagRow}>
        {goal.tags.slice(0, 3).map((tag) => (
          <ThemedView key={tag} type="backgroundSelected" style={styles.tagBadge}>
            <ThemedText type="small" themeColor="textSecondary">
              #{tag}
            </ThemedText>
          </ThemedView>
        ))}
      </View>
    </SectionCard>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCell}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  progressBlock: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metaCell: {
    minWidth: 96,
    gap: Spacing.half,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  tagBadge: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
});
