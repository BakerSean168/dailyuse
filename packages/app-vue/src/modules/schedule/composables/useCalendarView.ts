/**
 * useCalendarView - 日历视图聚合 composable
 *
 * 将 CalendarEntry（schedule 模块）、Goal 和 TaskInstance 三个来源
 * 统一转换为内部 CalendarEventItem 类型后提供给日历组件渲染。
 */

import { computed, ref } from 'vue';
import { startOfDay } from 'date-fns';
import { useSchedule } from './useSchedule';
import { useTask } from '../../task/composables/useTask';
import type { TaskInstanceClientDTO, TaskTemplateClientDTO } from '@dailyuse/contracts/task';

// ============ 统一内部事件类型 ============

export interface CalendarEventItem {
  id: string;
  title: string;
  startTime: number; // ms timestamp
  endTime: number; // ms timestamp
  source: 'schedule' | 'task' | 'goal';
  hasConflict?: boolean;
  originalId: string;
  /** 仅当 source === 'task' 时存在，对应 TaskInstanceStatus 值 */
  instanceStatus?: string;
}

// ============ 转换工具函数 ============

/** TaskInstance → CalendarEventItem（用 instanceDate + timeRange 分钟偏移） */
function taskInstancesToEvents(
  instances: TaskInstanceClientDTO[],
  templates: TaskTemplateClientDTO[],
): CalendarEventItem[] {
  const templateMap = new Map(templates.map((t) => [t.id, t]));
  const events: CalendarEventItem[] = [];
  for (const inst of instances) {
    const baseTs = Number(inst.instanceDate);
    if (!isFinite(baseTs)) continue;
    const dayBaseTs = startOfDay(new Date(baseTs)).getTime();

    const timeRange = inst.timeConfig?.timeRange;
    let startTime: number;
    let endTime: number;

    if (timeRange && typeof timeRange.start === 'number' && typeof timeRange.end === 'number') {
      // timeRange.start / end are minute offsets from midnight
      startTime = dayBaseTs + timeRange.start * 60 * 1000;
      endTime = dayBaseTs + timeRange.end * 60 * 1000;
    } else if (inst.timeConfig?.timePoint != null) {
      // single time point — use 30-minute slot
      startTime = dayBaseTs + inst.timeConfig.timePoint * 60 * 1000;
      endTime = startTime + 30 * 60 * 1000;
    } else {
      // all-day task: use day start + 1 hr window
      startTime = dayBaseTs;
      endTime = dayBaseTs + 60 * 60 * 1000;
    }

    const template = templateMap.get(inst.templateId);
    events.push({
      id: `task-${inst.id}`,
      title: template?.name ?? inst.id,
      startTime,
      endTime,
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

    return [...scheduleEvents, ...taskEvents].sort((a, b) => a.startTime - b.startTime);
  });

  const isLoading = computed(() => schedule.isLoading.value || task.isLoading.value);

  /** Fetch all data for the given time window (ms timestamps) */
  async function fetchForRange(startTime: number, endTime: number) {
    windowStart.value = startTime;
    windowEnd.value = endTime;

    await Promise.all([
      schedule.fetchCalendarEntries(startTime, endTime),
      task.fetchInstances(),
      task.fetchTemplates(),
    ]);
  }

  return {
    events,
    isLoading,
    windowStart,
    windowEnd,
    fetchForRange,
    // expose sub-composables for DEV panel access
    scheduleTasks: schedule.tasks,
  };
}
