import { useEffect, useMemo, useState } from 'react';

import type { CalendarEntryClientDTO } from '@dailyuse/contracts/schedule';

import { useAppSession } from './useAppSession';
import { useScheduleService } from './useScheduleService';

export type AgendaEntrySummary = {
  id: string;
  title: string;
  description: string | null;
  startTime: number;
  endTime: number;
  dayKey: string;
  dayLabel: string;
  timeRange: string;
  durationMinutes: number;
  hasConflict: boolean;
  location: string | null;
  attendeesCount: number;
};

export type ScheduleAgendaOptions = {
  startTime?: number;
  endTime?: number;
  daysBefore?: number;
  daysAfter?: number;
};

/**
 * Residual 1165 keep-boundary: schedule agenda startOfDay — Date in/out (local calendar day).
 * Soft residual 1165: dashboard projection startOfDay uses timestamp ms in/out (no force-merge).
 */
function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function formatDayKey(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDayLabel(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(timestamp));
}

function formatTimeRange(startTime: number, endTime: number) {
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${formatter.format(new Date(startTime))} - ${formatter.format(new Date(endTime))}`;
}

function mapAgendaEntry(entry: CalendarEntryClientDTO): AgendaEntrySummary {
  return {
    id: String(entry.id),
    title: entry.title,
    description: entry.description ?? null,
    startTime: entry.startTime,
    endTime: entry.endTime,
    dayKey: formatDayKey(entry.startTime),
    dayLabel: formatDayLabel(entry.startTime),
    timeRange: formatTimeRange(entry.startTime, entry.endTime),
    durationMinutes: Math.max(1, Math.round((entry.endTime - entry.startTime) / 60000)),
    hasConflict: entry.hasConflict,
    location: entry.location ?? null,
    attendeesCount: entry.attendees?.length ?? 0,
  };
}

function resolveRange(options: ScheduleAgendaOptions) {
  if (typeof options.startTime === 'number' && typeof options.endTime === 'number') {
    return {
      startTime: options.startTime,
      endTime: options.endTime,
    };
  }

  const now = new Date();
  const before = options.daysBefore ?? 1;
  const after = options.daysAfter ?? 14;
  const rangeStart = startOfDay(new Date(now.getTime() - before * 24 * 60 * 60 * 1000));
  const rangeEnd = endOfDay(new Date(now.getTime() + after * 24 * 60 * 60 * 1000));

  return {
    startTime: rangeStart.getTime(),
    endTime: rangeEnd.getTime(),
  };
}

export function useScheduleAgenda(options: ScheduleAgendaOptions = {}) {
  const service = useScheduleService();
  const { isRemoteAuthenticated } = useAppSession();

  const [entries, setEntries] = useState<AgendaEntrySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(
    () => resolveRange(options),
    [options.daysAfter, options.daysBefore, options.endTime, options.startTime],
  );

  async function loadAgenda() {
    if (!isRemoteAuthenticated) {
      setEntries([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await service.getSchedulesByTimeRange({
      startTime: range.startTime,
      endTime: range.endTime,
    });

    if (!result.ok) {
      setEntries([]);
      setError(result.error.message);
      setIsLoading(false);
      return;
    }

    setEntries(result.data.map((entry) => mapAgendaEntry(entry)).sort((left, right) => left.startTime - right.startTime));
    setIsLoading(false);
  }

  useEffect(() => {
    void loadAgenda();
  }, [isRemoteAuthenticated, range.endTime, range.startTime, service]);

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, { dayLabel: string; items: AgendaEntrySummary[] }>();

    for (const entry of entries) {
      const current = groups.get(entry.dayKey);
      if (current) {
        current.items.push(entry);
        continue;
      }

      groups.set(entry.dayKey, {
        dayLabel: entry.dayLabel,
        items: [entry],
      });
    }

    return Array.from(groups.entries()).map(([dayKey, value]) => ({
      dayKey,
      dayLabel: value.dayLabel,
      items: value.items,
    }));
  }, [entries]);

  return {
    entries,
    error,
    groupedEntries,
    isLoading,
    range,
    refresh: loadAgenda,
  };
}
