import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import { GoalStatus } from '@dailyuse/contracts/goal';
import { useGoals, type GoalSummary } from '../hooks/useGoals';

import {
  PageShell,
  PrimaryButton,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
  ThemedView,
} from '@dailyuse/ui-react-native';

import { formatProductDate, emptyKind } from '../utils/product-time';

const MAX_COMPARE = 4;
const MIN_COMPARE = 2;

export function GoalCompareScreen() {
  const router = useRouter();
  const { goals, isLoading } = useGoals();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedGoals = goals.filter((g) => selectedIds.includes(g.id));
  const canCompare = selectedIds.length >= MIN_COMPARE;

  function toggleGoal(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= MAX_COMPARE) {
        return prev;
      }
      return [...prev, id];
    });
  }

  function getHighestProgress(): GoalSummary | null {
    if (selectedGoals.length === 0) return null;
    return selectedGoals.reduce((max, goal) =>
      goal.overallProgress > max.overallProgress ? goal : max,
    );
  }

  function getMostKeyResults(): GoalSummary | null {
    if (selectedGoals.length === 0) return null;
    return selectedGoals.reduce((max, goal) =>
      goal.totalKeyResults > max.totalKeyResults ? goal : max,
    );
  }

  /**
   * Residual 1240: app-react goal empty catalog dash via formatProductDate (no local formatDate).
   * Soft residual 1240: vue goal i18n notSet + other empty labels differ (no force-merge).
   */
  return (
    <PageShell
      eyebrow="Goals"
      title="Compare Goals"
      subtitle="Select 2-4 goals to compare their metrics side by side."
    >
      {/* Selection Section */}
      <SectionCard
        title="Select Goals"
        description={`Choose ${MIN_COMPARE}-${MAX_COMPARE} goals to compare. Selected: ${selectedIds.length}`}
      >
        {isLoading ? (
          <ThemedText type="small" themeColor="textSecondary">
            Loading goals...
          </ThemedText>
        ) : goals.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            No goals available.
          </ThemedText>
        ) : (
          <View style={styles.selectionList}>
            {goals.map((goal) => {
              const isSelected = selectedIds.includes(goal.id);
              const isDisabled = !isSelected && selectedIds.length >= MAX_COMPARE;
              return (
                <PrimaryButton
                  key={goal.id}
                  label={goal.name}
                  onPress={() => toggleGoal(goal.id)}
                  variant={isSelected ? 'solid' : 'ghost'}
                  disabled={isDisabled}
                />
              );
            })}
          </View>
        )}
      </SectionCard>

      {/* Comparison Results */}
      {canCompare && (
        <>
          {/* Side by side cards */}
          <SectionCard title="Comparison" description="Side-by-side view of selected goals">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.compareRow}>
                {selectedGoals.map((goal) => (
                  <ThemedView key={goal.id} type="tint" style={styles.compareCard}>
                    <ThemedText type="smallBold" numberOfLines={2}>
                      {goal.name}
                    </ThemedText>

                    <View style={styles.metricRow}>
                      <ThemedText type="small" themeColor="textSecondary">
                        Status
                      </ThemedText>
                      <StatusPill
                        label={getStatusLabel(goal.status)}
                        tone={goal.status === GoalStatus.Active ? 'success' : 'textSecondary'}
                      />
                    </View>

                    <View style={styles.metricRow}>
                      <ThemedText type="small" themeColor="textSecondary">
                        Progress
                      </ThemedText>
                      <ThemedText type="smallBold">{goal.overallProgress}%</ThemedText>
                    </View>

                    <View style={styles.metricRow}>
                      <ThemedText type="small" themeColor="textSecondary">
                        Importance
                      </ThemedText>
                      <ThemedText type="small">{getImportanceLabel(goal.importance)}</ThemedText>
                    </View>

                    <View style={styles.metricRow}>
                      <ThemedText type="small" themeColor="textSecondary">
                        Priority
                      </ThemedText>
                      <ThemedText type="small">{goal.priority}</ThemedText>
                    </View>

                    <View style={styles.metricRow}>
                      <ThemedText type="small" themeColor="textSecondary">
                        Key Results
                      </ThemedText>
                      <ThemedText type="small">
                        {goal.completedKeyResults}/{goal.totalKeyResults}
                      </ThemedText>
                    </View>

                    <View style={styles.metricRow}>
                      <ThemedText type="small" themeColor="textSecondary">
                        Target Date
                      </ThemedText>
                      <ThemedText type="small">{formatProductDate(goal.targetDate, emptyKind('dash'))}</ThemedText>
                    </View>

                    <PrimaryButton
                      label="View"
                      onPress={() => router.push(`./${goal.id}`)}
                      variant="secondary"
                    />
                  </ThemedView>
                ))}
              </View>
            </ScrollView>
          </SectionCard>

          {/* Insights */}
          <SectionCard title="Insights" description="Key comparisons at a glance">
            <View style={styles.insightRow}>
              <ThemedView type="tint" style={styles.insightCard}>
                <ThemedText type="small" themeColor="textSecondary">
                  Highest Progress
                </ThemedText>
                <ThemedText type="smallBold" numberOfLines={1}>
                  {getHighestProgress()?.name ?? '-'}
                </ThemedText>
                <ThemedText type="title" themeColor="tint">
                  {getHighestProgress()?.overallProgress ?? 0}%
                </ThemedText>
              </ThemedView>

              <ThemedView type="tint" style={styles.insightCard}>
                <ThemedText type="small" themeColor="textSecondary">
                  Most Key Results
                </ThemedText>
                <ThemedText type="smallBold" numberOfLines={1}>
                  {getMostKeyResults()?.name ?? '-'}
                </ThemedText>
                <ThemedText type="title" themeColor="tint">
                  {getMostKeyResults()?.totalKeyResults ?? 0}
                </ThemedText>
              </ThemedView>
            </View>

            {/* Progress comparison bars */}
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              Progress Comparison
            </ThemedText>
            {selectedGoals.map((goal) => (
              <View key={goal.id} style={styles.progressItem}>
                <View style={styles.progressLabel}>
                  <ThemedText type="small" numberOfLines={1} style={styles.progressName}>
                    {goal.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {goal.overallProgress}%
                  </ThemedText>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(100, goal.overallProgress)}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
          </SectionCard>
        </>
      )}

      {!canCompare && selectedIds.length > 0 && (
        <SectionCard title="Selection incomplete">
          <ThemedText type="small" themeColor="textSecondary">
            Select at least {MIN_COMPARE} goals to start comparing.
          </ThemedText>
        </SectionCard>
      )}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  selectionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  compareRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingRight: Spacing.four,
  },
  compareCard: {
    width: 200,
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.two,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  insightCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    gap: Spacing.one,
  },
  sectionLabel: {
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  progressItem: {
    marginBottom: Spacing.two,
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  progressName: {
    flex: 1,
    marginRight: Spacing.two,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
});
