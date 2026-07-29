import { useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useScheduleAgenda } from '../hooks/useScheduleAgenda';

import {
  PageShell,
  PrimaryButton,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
  ThemedView,
} from '@memoflow/ui-react-native';

function getMonthBounds(anchor: Date) {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function startOfCalendarGrid(monthStart: Date) {
  const next = new Date(monthStart);
  const day = next.getDay();
  const offset = day === 0 ? 6 : day - 1;
  next.setDate(next.getDate() - offset);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(date);
}

export function ScheduleCalendarScreen() {
  const router = useRouter();
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());

  const monthBounds = useMemo(() => getMonthBounds(monthAnchor), [monthAnchor]);
  const { entries, groupedEntries, isLoading, error, refresh } = useScheduleAgenda({
    startTime: monthBounds.start.getTime(),
    endTime: monthBounds.end.getTime(),
  });

  const dayMap = useMemo(() => {
    const map = new Map<string, { count: number; conflicts: number }>();
    for (const entry of entries) {
      const current = map.get(entry.dayKey) ?? { count: 0, conflicts: 0 };
      current.count += 1;
      if (entry.hasConflict) {
        current.conflicts += 1;
      }
      map.set(entry.dayKey, current);
    }
    return map;
  }, [entries]);

  const gridDays = useMemo(() => {
    const start = startOfCalendarGrid(monthBounds.start);
    return Array.from({ length: 42 }, (_, index) => {
      const current = new Date(start);
      current.setDate(start.getDate() + index);
      const key = formatDayKey(current);
      const summary = dayMap.get(key);
      return {
        key,
        day: current.getDate(),
        isCurrentMonth: current.getMonth() === monthBounds.start.getMonth(),
        count: summary?.count ?? 0,
        conflicts: summary?.conflicts ?? 0,
      };
    });
  }, [dayMap, monthBounds.start]);

  const busiestDays = useMemo(
    () => groupedEntries.slice().sort((left, right) => right.items.length - left.items.length).slice(0, 3),
    [groupedEntries],
  );
  const actionSections = [
    {
      title: 'Views',
      description: '视图切换和新建入口集中在页面抽屉。',
      items: [
        {
          label: 'Back',
          description: '返回日程主列表。',
          onPress: () => router.back(),
        },
        {
          label: 'Week view',
          description: '切到周视图。',
          onPress: () => router.push('./week'),
        },
        {
          label: 'Create event',
          description: '创建新的日程事件。',
          onPress: () => router.push('./event-editor'),
        },
      ],
    },
  ];

  return (
    <PageShell
      actionMenuSubtitle="月历切换和创建动作已移到左上角。"
      actionSections={actionSections}
      eyebrow="Schedule"
      title="Calendar"
      subtitle="月历页先提供月份热力概览和高密度日期入口。"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}>
      <SectionCard title={formatMonthLabel(monthAnchor)} description="按天展示事件密度和冲突数量。">
        <View style={styles.actionRow}>
          <PrimaryButton label="Prev month" onPress={() => setMonthAnchor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} variant="ghost" />
          <PrimaryButton label="This month" onPress={() => setMonthAnchor(new Date())} variant="secondary" />
          <PrimaryButton label="Next month" onPress={() => setMonthAnchor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} variant="ghost" />
        </View>
        <View style={styles.weekdayRow}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((item) => (
            <ThemedText key={item} type="small" themeColor="textSecondary" style={styles.weekdayCell}>{item}</ThemedText>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {gridDays.map((day) => (
            <ThemedView key={day.key} type={day.isCurrentMonth ? 'backgroundSelected' : 'background'} style={[styles.dayCell, !day.isCurrentMonth ? styles.dayCellMuted : null]}>
              <ThemedText type="smallBold">{day.day}</ThemedText>
              {day.count > 0 ? <StatusPill label={`${day.count} items`} tone="tint" /> : <ThemedText type="small" themeColor="textSecondary">-</ThemedText>}
              {day.conflicts > 0 ? <StatusPill label={`${day.conflicts} conflicts`} tone="warning" /> : null}
            </ThemedView>
          ))}
        </View>
      </SectionCard>

      {error ? (
        <SectionCard title="Calendar load failed" description="月历数据加载失败。">
          <ThemedText type="small" themeColor="warning">{error}</ThemedText>
        </SectionCard>
      ) : null}

      <SectionCard title="Busiest days" description="优先暴露本月最忙的三个日期，方便移动端快速 drill-down。">
        <View style={styles.listColumn}>
          {busiestDays.length > 0 ? (
            busiestDays.map((group) => (
              <ThemedView key={group.dayKey} type="backgroundSelected" style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <ThemedText type="smallBold">{group.dayLabel}</ThemedText>
                  <StatusPill label={`${group.items.length} events`} tone="tint" />
                </View>
                <View style={styles.listColumn}>
                  {group.items.slice(0, 3).map((item) => (
                    <View key={item.id} style={styles.summaryRow}>
                      <ThemedText type="small">{item.title}</ThemedText>
                      <PrimaryButton label="Edit" onPress={() => router.push(`./event-editor?id=${item.id}`)} variant="ghost" />
                    </View>
                  ))}
                </View>
              </ThemedView>
            ))
          ) : (
            <ThemedText type="small" themeColor="textSecondary">这个月还没有事件。</ThemedText>
          )}
        </View>
      </SectionCard>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  weekdayCell: {
    flex: 1,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  dayCell: {
    width: '13.8%',
    minHeight: 88,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  dayCellMuted: {
    opacity: 0.55,
  },
  listColumn: {
    gap: Spacing.three,
  },
  summaryCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
