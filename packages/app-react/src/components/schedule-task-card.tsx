import { StyleSheet, View } from 'react-native';

import type { ScheduleTaskSummary } from '../hooks/use-schedule-tasks';

import { PrimaryButton, SectionCard, Spacing, StatusPill, ThemedText } from '@dailyuse/ui-react-native';

function statusTone(status: ScheduleTaskSummary['status']) {
  if (status === 'Active') {
    return 'success' as const;
  }

  if (status === 'Paused') {
    return 'warning' as const;
  }

  if (status === 'Failed') {
    return 'warning' as const;
  }

  return 'textSecondary' as const;
}

function computeHealth(consecutiveFailures: number): 'healthy' | 'warning' | 'critical' {
  if (consecutiveFailures === 0) return 'healthy';
  if (consecutiveFailures < 3) return 'warning';
  return 'critical';
}

function healthTone(health: 'healthy' | 'warning' | 'critical') {
  if (health === 'healthy') {
    return 'success' as const;
  }

  if (health === 'warning') {
    return 'warning' as const;
  }

  return 'textSecondary' as const;
}

function formatTimestamp(timestamp: number | null): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

export function ScheduleTaskCard({
  onCancel,
  onComplete,
  onPause,
  onResume,
  task,
}: {
  task: ScheduleTaskSummary;
  onPause?: () => void;
  onResume?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}) {
  const health = computeHealth(task.consecutiveFailures);
  const successCount = task.executionCount - task.consecutiveFailures;

  return (
    <SectionCard title={task.name} description={task.description ?? 'No description yet.'}>
      <View style={styles.pillRow}>
        <StatusPill label={task.status} tone={statusTone(task.status)} />
        <StatusPill label={task.sourceModule} tone="tint" />
        <StatusPill label={task.priority} tone="textSecondary" />
        <StatusPill label={health} tone={healthTone(health)} />
      </View>

      <View style={styles.metaColumn}>
        <Meta label="Next run" value={formatTimestamp(task.nextRunAt)} />
        <Meta label="Last run" value={formatTimestamp(task.lastRunAt)} />
        <Meta label="Execution" value={`${task.executionCount} total, ${successCount} successful`} />
        <Meta label="Enabled" value={task.enabled ? 'Enabled' : 'Disabled'} />
      </View>

      <View style={styles.tagRow}>
        {task.tags.slice(0, 3).map((tag) => (
          <StatusPill key={tag} label={`#${tag}`} tone="textSecondary" />
        ))}
      </View>

      <View style={styles.actionRow}>
        {task.status === 'Active' ? <PrimaryButton label="Pause" onPress={onPause} variant="secondary" /> : null}
        {task.status === 'Paused' ? <PrimaryButton label="Resume" onPress={onResume} variant="secondary" /> : null}
        {task.status !== 'Completed' ? <PrimaryButton label="Complete" onPress={onComplete} /> : null}
        {task.status !== 'Cancelled' ? <PrimaryButton label="Cancel" onPress={onCancel} variant="ghost" /> : null}
      </View>
    </SectionCard>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
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
  metaColumn: {
    gap: Spacing.one,
  },
  metaRow: {
    gap: Spacing.half,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
