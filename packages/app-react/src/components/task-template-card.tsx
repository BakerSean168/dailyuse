import { StyleSheet, View } from 'react-native';

import type { TaskTemplateSummary } from '../hooks/use-task-templates';

import { PrimaryButton, SectionCard, Spacing, StatusPill, ThemedText, ThemedView } from '@dailyuse/ui-react-native';

function statusTone(status: TaskTemplateSummary['status']) {
  if (status === 'Active') {
    return 'success' as const;
  }

  if (status === 'Paused') {
    return 'warning' as const;
  }

  return 'textSecondary' as const;
}

function importanceTone(importance: TaskTemplateSummary['importance']) {
  if (importance === 'Vital' || importance === 'Important') {
    return 'warning' as const;
  }

  if (importance === 'Moderate') {
    return 'tint' as const;
  }

  return 'textSecondary' as const;
}

function formatRelativeDate(timestamp: number) {
  const diff = Date.now() - timestamp;

  if (diff < 60_000) {
    return 'Updated just now';
  }

  if (diff < 3_600_000) {
    return `Updated ${Math.floor(diff / 60_000)}m ago`;
  }

  if (diff < 86_400_000) {
    return `Updated ${Math.floor(diff / 3_600_000)}h ago`;
  }

  return `Updated ${new Date(timestamp).toLocaleDateString()}`;
}

export function TaskTemplateCard({
  onEdit,
  onOpen,
  template,
}: {
  template: TaskTemplateSummary;
  onOpen?: () => void;
  onEdit?: () => void;
}) {
  return (
    <SectionCard
      title={template.name}
      description={template.description ?? 'No description yet. This template is ready for mobile detail flow.'}
      footer={
        <View style={styles.actionRow}>
          {onOpen ? <PrimaryButton label="Open detail" onPress={onOpen} variant="secondary" /> : null}
          {onEdit ? <PrimaryButton label="Edit" onPress={onEdit} variant="ghost" /> : null}
        </View>
      }>
      <View style={styles.pillRow}>
        <StatusPill label={template.status} tone={statusTone(template.status)} />
        <StatusPill label={template.importance} tone={importanceTone(template.importance)} />
        {template.isBlocked ? <StatusPill label="Blocked" tone="warning" /> : null}
        {template.priority !== null ? <StatusPill label={`Priority ${template.priority}`} tone="tint" /> : null}
      </View>

      <View style={styles.metricGrid}>
        <Metric label="Instances" value={String(template.instanceCount)} />
        <Metric label="Pending" value={String(template.pendingInstanceCount)} />
        <Metric label="Completed" value={String(template.completedInstanceCount)} />
        <Metric label="Completion" value={`${Math.round(template.completionRate)}%`} />
      </View>

      <View style={styles.progressTrack}>
        <ThemedView type="backgroundSelected" style={styles.progressFillWrap}>
          <ThemedView
            type="tint"
            style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, template.completionRate))}%` }]}
          />
        </ThemedView>
      </View>

      {template.blockingReason ? (
        <ThemedView type="backgroundSelected" style={styles.noticeBox}>
          <ThemedText type="small" themeColor="warning">
            {template.blockingReason}
          </ThemedText>
        </ThemedView>
      ) : null}

      <View style={styles.footerRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {formatRelativeDate(template.updatedAt)}
        </ThemedText>
        <View style={styles.tagRow}>
          {template.tags.slice(0, 3).map((tag) => (
            <ThemedView key={tag} type="backgroundSelected" style={styles.tagBadge}>
              <ThemedText type="small" themeColor="textSecondary">
                #{tag}
              </ThemedText>
            </ThemedView>
          ))}
        </View>
      </View>
    </SectionCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView type="backgroundSelected" style={styles.metricCard}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metricCard: {
    minWidth: 88,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    gap: Spacing.half,
  },
  progressTrack: {
    gap: Spacing.one,
  },
  progressFillWrap: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  noticeBox: {
    borderRadius: Spacing.three,
    padding: Spacing.two,
  },
  footerRow: {
    gap: Spacing.two,
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
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
