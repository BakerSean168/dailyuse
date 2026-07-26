/**
 * useCalendarView - 日历视图聚合 composable
 *
 * 将 CalendarEntry（schedule 模块）、Goal 和 TaskInstance 三个来源
 * 统一转换为内部 CalendarEventItem 类型后提供给日历组件渲染。
 */

import { computed, ref } from 'vue';
import { formatLocalHHmm } from '../../../shared/utils/format-local-hhmm';
import { padTwoDigits } from '../../../shared/utils/pad-two-digits';
import { useSchedule } from './useSchedule';
import { useTask } from '../../task/composables/useTask';
import type { TaskInstanceClientDTO, TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import { startOfDayMs, endOfDayMs } from '@/shared/utils/product-time';

// ============ 统一内部事件类型 ============

export interface CalendarEventItem {
  id: string;
  title: string;
  startTime: number; // ms timestamp
  endTime: number; // ms timestamp
  displayMode: 'timed' | 'all-day';
  source: 'schedule' | 'task' | 'goal';
  hasConflict?: boolean;
  originalId: string;
  /** 仅当 source === 'task' 时存在，对应 TaskInstanceStatus 值 */
  instanceStatus?: string;
}

/**
 * Residual 1282: sole toLocalDateKey — Date | number → YYYY-MM-DD local calendar key.
 * Dual-retired from Day/Week/Month calendar local toDateStr copies.
 * Residual 1321: padStart dual retired onto padTwoDigits sole (Date|number key contract stays local).
 * Soft residual 1252: formatDateToYMD Date-only form sole remains separate (storage encoding).
 * Soft residual 1285: getWeekStart dual retired onto schedule sole in residual 1285.
 */
export function toLocalDateKey(value: Date | number): string {
  const date = typeof value === 'number' ? new Date(value) : value;
  const year = date.getFullYear();
  const month = padTwoDigits(date.getMonth() + 1);
  const day = padTwoDigits(date.getDate());
  return `${year}-${month}-${day}`;
}

/**
 * Residual 1285: sole getWeekStart — Monday-start local week (hours zeroed).
 * Dual-retired from WeekViewCalendar + ScheduleCalendarView local copies.
 * Soft residual 1282: toLocalDateKey dual-retired sole remains separate.
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as week start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Residual 1288: sole calendarEventBgClass — conflict/source solid bg for Day/Week timed cells.
 * Dual-retired from DayViewCalendar + WeekViewCalendar local eventBgClass copies.
 * Soft residual 1288: Month eventClass uses translucent /text variants (keep-boundary).
 * Soft residual 1288: getEventStyle Day px vs Week % layout keep-boundary (no force-merge).
 */
export function calendarEventBgClass(event: Pick<CalendarEventItem, 'source' | 'hasConflict'>): string {
  if (event.hasConflict) return 'bg-warning';
  const map: Record<CalendarEventItem['source'], string> = {
    schedule: 'bg-primary',
    goal: 'bg-success',
    task: 'bg-info',
  };
  return map[event.source];
}

/**
 * Residual 1291: sole calendarEventSourceLabel — schedule/goal/task source → i18n label.
 * Dual-retired from DayDetailSheet + EventDetailSheet local sourceLabel copies.
 * Soft residual 1294: formatLocalHHmm dual-retired sole (formatCapsuleTime alias) remains separate.
 * Soft residual 1288: Month eventClass translucent + getEventStyle Day/Week layout keep-boundaries remain separate.
 */
export function calendarEventSourceLabel(
  source: CalendarEventItem['source'],
  translate: (key: string) => string,
): string {
  const keys: Record<CalendarEventItem['source'], string> = {
    schedule: 'schedule.source.schedule',
    goal: 'schedule.source.goal',
    task: 'schedule.source.task',
  };
  return translate(keys[source]);
}




/**
 * Residual 1294: formatCapsuleTime dual body retired onto formatLocalHHmm sole.
 * Thin schedule alias for shell capsule consumers (same HH:mm local padStart contract).
 */
export function formatCapsuleTime(ms: number): string {
  return formatLocalHHmm(ms);
}

export type ScheduleCapsuleSnapshot = {
  kind: 'empty' | 'current' | 'upcoming';
  event: CalendarEventItem | null;
  /** Minutes until start (upcoming only). */
  minutesUntilStart: number | null;
};

/**
 * Pick the "current / next" event for the header schedule capsule (V2 §2).
 * Prefers an in-progress timed event; otherwise the next upcoming event today.
 */
export function resolveScheduleCapsule(
  events: CalendarEventItem[],
  nowMs: number = Date.now(),
): ScheduleCapsuleSnapshot {
  const todayKey = toLocalDateKey(nowMs);
  const todays = events
    .filter((event) => toLocalDateKey(event.startTime) === todayKey || toLocalDateKey(event.endTime) === todayKey)
    .sort((a, b) => a.startTime - b.startTime);

  const current = todays.find(
    (event) => event.displayMode === 'timed' && event.startTime <= nowMs && event.endTime > nowMs,
  );
  if (current) {
    return { kind: 'current', event: current, minutesUntilStart: null };
  }

  const upcoming = todays.find((event) => event.startTime > nowMs);
  if (upcoming) {
    const minutesUntilStart = Math.max(0, Math.round((upcoming.startTime - nowMs) / 60000));
    return { kind: 'upcoming', event: upcoming, minutesUntilStart };
  }

  // All-day only (or nothing timed left) still counts as "has schedule" when present.
  const allDay = todays.find((event) => event.displayMode === 'all-day');
  if (allDay) {
    return { kind: 'current', event: allDay, minutesUntilStart: null };
  }

  return { kind: 'empty', event: null, minutesUntilStart: null };
}

export function formatScheduleCapsuleLabel(
  snapshot: ScheduleCapsuleSnapshot,
  t: (key: string, params?: Record<string, unknown>) => string,
): string | null {
  if (snapshot.kind === 'empty' || !snapshot.event) return null;
  const event = snapshot.event;
  if (snapshot.kind === 'current') {
    if (event.displayMode === 'all-day') {
      return t('shell.schedule.currentAllDay', { title: event.title });
    }
    return t('shell.schedule.current', {
      start: formatCapsuleTime(event.startTime),
      end: formatCapsuleTime(event.endTime),
      title: event.title,
    });
  }
  return t('shell.schedule.upcoming', {
    start: formatCapsuleTime(event.startTime),
    title: event.title,
    minutes: snapshot.minutesUntilStart ?? 0,
  });
}

// ============ 转换工具函数 ============

/** TaskInstance → CalendarEventItem（用 instanceDate + timeRange 分钟偏移） */
export function taskInstancesToEvents(
  instances: TaskInstanceClientDTO[],
  templates: TaskTemplateClientDTO[],
): CalendarEventItem[] {
  const templateMap = new Map(templates.map((t) => [t.id, t]));
  const events: CalendarEventItem[] = [];
  for (const inst of instances) {
    const baseTs = Number(inst.instanceDate);
    if (!isFinite(baseTs)) continue;
    const dayBaseTs = startOfDayMs(baseTs);

    const timeRange = inst.timeConfig?.timeRange;
    const isAllDay = inst.timeConfig?.timeType === 'AllDay';
    let startTime: number;
    let endTime: number;
    let displayMode: CalendarEventItem['displayMode'];

    if (timeRange && typeof timeRange.start === 'number' && typeof timeRange.end === 'number') {
      startTime = dayBaseTs + timeRange.start * 60 * 1000;
      endTime = dayBaseTs + timeRange.end * 60 * 1000;
      displayMode = 'timed';
    } else if (inst.timeConfig?.timePoint != null) {
      startTime = dayBaseTs + inst.timeConfig.timePoint * 60 * 1000;
      endTime = startTime + 30 * 60 * 1000;
      displayMode = 'timed';
    } else {
      startTime = dayBaseTs;
      endTime = endOfDayMs(dayBaseTs);
      displayMode = isAllDay ? 'all-day' : 'timed';
    }

    const template = templateMap.get(inst.templateId);
    events.push({
      id: `task-${inst.id}`,
      title: template?.name ?? inst.id,
      startTime,
      endTime,
      displayMode,
      source: 'task',
      hasConflict: false,
      originalId: inst.id,
      instanceStatus: inst.status,
    });
  }
  return events;
}

// ============ Composable ============

export function useCalendarView() {
  const schedule = useSchedule();
  const task = useTask();

  /** Currently displayed time window (set when calendar navigation changes) */
  const windowStart = ref<number>(0);
  const windowEnd = ref<number>(0);

  /** All events from all sources, merged and sorted by startTime */
  const events = computed<CalendarEventItem[]>(() => {
    const entriesRaw = schedule.calendarEntries.value;
    const entries = Array.isArray(entriesRaw) ? entriesRaw : [];
    const scheduleEvents: CalendarEventItem[] = entries.map((entry) => ({
      id: `schedule-${entry.id}`,
      title: entry.title,
      startTime: Number(entry.startTime),
      endTime: Number(entry.endTime),
      displayMode: 'timed',
      source: 'schedule' as const,
      hasConflict: entry.hasConflict,
      originalId: entry.id,
    }));

    const instancesRaw = task.instances.value;
    const templatesRaw = task.templates.value;
    const taskEvents = taskInstancesToEvents(
      Array.isArray(instancesRaw) ? instancesRaw : [],
      Array.isArray(templatesRaw) ? templatesRaw : [],
    );

    const merged = [...scheduleEvents, ...taskEvents]
      .sort((a, b) => a.startTime - b.startTime)
      .filter((event, index, items) => items.findIndex((item) => item.id === event.id) === index);

    return merged;
  });

  const isLoading = computed(() => schedule.isLoading.value || task.isLoading.value);

  /** Fetch all data for the given time window (ms timestamps) */
  async function fetchForRange(startTime: number, endTime: number) {
    windowStart.value = startTime;
    windowEnd.value = endTime;

    await Promise.all([
      schedule.fetchCalendarEntries(startTime, endTime),
      task.fetchInstancesByDateRange(startTime, endTime),
      task.fetchTemplates(),
    ]);
  }

  /** Ensure today's events are loaded (shell capsule). */
  async function ensureTodayLoaded(nowMs: number = Date.now()) {
    const start = startOfDayMs(nowMs);
    const end = endOfDayMs(nowMs);
    // Avoid refetch thrash if window already covers today.
    if (windowStart.value <= start && windowEnd.value >= end && windowEnd.value > 0) {
      return;
    }
    await fetchForRange(start, end);
  }

  function getScheduleCapsuleSnapshot(nowMs: number = Date.now()): ScheduleCapsuleSnapshot {
    return resolveScheduleCapsule(events.value, nowMs);
  }

  return {
    events,
    isLoading,
    windowStart,
    windowEnd,
    fetchForRange,
    ensureTodayLoaded,
    getScheduleCapsuleSnapshot,
    // expose sub-composables for DEV panel access
    scheduleTasks: schedule.tasks,
  };
}
