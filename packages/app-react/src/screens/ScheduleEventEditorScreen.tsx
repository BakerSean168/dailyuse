import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import type { ConflictDetectionResult, CreateScheduleRequest, UpdateScheduleRequest } from '@memoflow/contracts/schedule';

import { useScheduleService } from '../hooks/useScheduleService';

import {
  PageShell,
  PrimaryButton,
  PrimaryTextField,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
} from '@memoflow/ui-react-native';

/**
 * Soft residual 1228: app-react schedule toDateInput — null|undefined → ''; UTC ISO YMD.
 * Accepts undefined (broader than GoalEditor number|null); same empty+UTC body (no force-extract).
 */
function toDateInput(timestamp: number | null | undefined) {
  if (!timestamp) {
    return '';
  }
  return new Date(timestamp).toISOString().slice(0, 10);
}

/**
 * Residual 1231 keep-boundary: app-react schedule toTimeInput — epoch → UTC HH:mm ISO slice.
 * Schedule event editor; falsy → ''; toISOString().slice(11, 16) (UTC clock, not local getHours).
 * Soft residual 1231: task local padStart + '09:00' default differs (no force-merge).
 */
function toTimeInput(timestamp: number | null | undefined) {
  if (!timestamp) {
    return '';
  }
  return new Date(timestamp).toISOString().slice(11, 16);
}

/**
 * Residual 1234 keep-boundary: app-react schedule parseTimestamp — YMD+HH:mm → epoch|null.
 * trim; empty either → null; Date.parse(`${date}T${time}:00`); isNaN → null (not local Date ctor).
 * Soft residual 1234: task combineDateAndTime always-number local path differs (no force-merge).
 */
function parseTimestamp(dateValue: string, timeValue: string) {
  const date = dateValue.trim();
  const time = timeValue.trim();
  if (date.length === 0 || time.length === 0) {
    return null;
  }
  const parsed = Date.parse(`${date}T${time}:00`);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Soft residual 1243: app-react buildDuration — start/end epoch → minutes (compute only, no display i18n).
 * Not a formatDuration presentation helper; min 1 minute (no force-merge).
 */
function buildDuration(startTime: number, endTime: number) {
  return Math.max(1, Math.round((endTime - startTime) / 60000));
}

/**
 * Residual 1246 keep-boundary: app-react describeConflict — English status pill strings.
 * No conflict / N conflicts detected; not vue-i18n schedule.conflictAlert.* keys.
 * Soft residual 1246: vue ConflictAlert hasConflict-only + formatSuggestion key duals (no force-merge).
 */
function describeConflict(conflicts: ConflictDetectionResult | null) {
  if (!conflicts?.hasConflict) {
    return 'No conflict detected';
  }
  return `${conflicts.conflicts.length} conflicts detected`;
}

export function ScheduleEventEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[]; date?: string | string[] }>();
  const scheduleId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;
  const defaultDate = typeof params.date === 'string' ? params.date : Array.isArray(params.date) ? params.date[0] : toDateInput(Date.now());
  const service = useScheduleService();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate ?? '');
  const [startClock, setStartClock] = useState('09:00');
  const [endClock, setEndClock] = useState('10:00');
  const [location, setLocation] = useState('');
  const [attendees, setAttendees] = useState('');
  const [priority, setPriority] = useState('5');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictDetectionResult | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const parsedRange = useMemo(() => {
    const startTime = parseTimestamp(date, startClock);
    const endTime = parseTimestamp(date, endClock);
    return {
      startTime,
      endTime,
      isValid: startTime !== null && endTime !== null && endTime > startTime,
    };
  }, [date, endClock, startClock]);

  useEffect(() => {
    async function loadSchedule() {
      if (!scheduleId) {
        return;
      }

      setIsLoading(true);
      setError(null);

      const result = await service.getSchedule(scheduleId);
      if (!result.ok) {
        setError(result.error.message);
        setIsLoading(false);
        return;
      }

      const item = result.data;
      setName(item.title);
      setDescription(item.description ?? '');
      setDate(toDateInput(item.startTime));
      setStartClock(toTimeInput(item.startTime));
      setEndClock(toTimeInput(item.endTime));
      setLocation(item.location ?? '');
      setAttendees(item.attendees?.join(', ') ?? '');
      setPriority(String(item.priority ?? 5));

      const conflictResult = await service.getScheduleConflicts(scheduleId);
      if (conflictResult.ok) {
        setConflicts(conflictResult.data);
      }

      setIsLoading(false);
    }

    void loadSchedule();
  }, [scheduleId, service]);

  useEffect(() => {
    if (!parsedRange.isValid || parsedRange.startTime === null || parsedRange.endTime === null) {
      setConflicts(null);
      setConflictError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      void (async () => {
        const result = await service.detectConflicts({
          startTime: parsedRange.startTime!,
          endTime: parsedRange.endTime!,
          excludeId: scheduleId ?? undefined,
        });

        if (!result.ok) {
          setConflictError(result.error.message);
          return;
        }

        setConflictError(null);
        setConflicts(result.data);
      })();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [parsedRange.endTime, parsedRange.isValid, parsedRange.startTime, scheduleId, service]);

  async function handleDetectConflicts() {
    if (!parsedRange.isValid || parsedRange.startTime === null || parsedRange.endTime === null) {
      setConflictError('Use a valid date and time range first.');
      return;
    }

    setConflictError(null);

    const result = await service.detectConflicts({
      startTime: parsedRange.startTime,
      endTime: parsedRange.endTime,
      excludeId: scheduleId ?? undefined,
    });

    if (!result.ok) {
      setConflictError(result.error.message);
      return;
    }

    setConflicts(result.data);
  }

  async function handleSubmit() {
    if (name.trim().length === 0) {
      setError('Event name is required.');
      return;
    }

    if (!parsedRange.isValid || parsedRange.startTime === null || parsedRange.endTime === null) {
      setError('Use a valid date and time range.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const attendeeList = attendees
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const priorityNumber = Number(priority);

    const payload = {
      name: name.trim(),
      description: description.trim().length > 0 ? description.trim() : undefined,
      startTime: parsedRange.startTime,
      endTime: parsedRange.endTime,
      duration: buildDuration(parsedRange.startTime, parsedRange.endTime),
      priority: Number.isFinite(priorityNumber) ? priorityNumber : 5,
      location: location.trim().length > 0 ? location.trim() : undefined,
      attendees: attendeeList.length > 0 ? attendeeList : undefined,
    };

    const result = scheduleId
      ? await service.updateSchedule(scheduleId, payload satisfies UpdateScheduleRequest)
      : await service.createScheduleWithConflictDetection({
          ...payload,
          autoDetectConflicts: true,
        } satisfies CreateScheduleRequest);

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    if ('conflicts' in result.data && result.data.conflicts) {
      setConflicts(result.data.conflicts);
    }

    router.replace('./week');
  }

  async function handleDelete() {
    if (!scheduleId) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    const result = await service.deleteSchedule(scheduleId);
    setIsDeleting(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    router.replace('./week');
  }

  return (
    <PageShell
      eyebrow="Schedule"
      title={scheduleId ? 'Edit event' : 'Create event'}
      subtitle="事件编辑页支持自动冲突检测，冲突只做提示，不阻止保存。">
      <SectionCard title="Navigation" description="保存后返回周视图继续检查时间流。">
        <View style={styles.actionRow}>
          <PrimaryButton label="Back" onPress={() => router.back()} variant="secondary" />
          <PrimaryButton label="Week view" onPress={() => router.replace('./week')} variant="ghost" />
          <PrimaryButton
            label={
              isSubmitting
                ? 'Saving…'
                : conflicts?.hasConflict
                  ? scheduleId
                    ? 'Save anyway'
                    : 'Create anyway'
                  : scheduleId
                    ? 'Save event'
                    : 'Create event'
            }
            onPress={handleSubmit}
            disabled={isSubmitting || isLoading}
          />
        </View>
      </SectionCard>

      {error ? (
        <SectionCard title="Schedule save failed" description="保存失败时先直接展示错误。">
          <ThemedText type="small" themeColor="warning">{error}</ThemedText>
        </SectionCard>
      ) : null}

      <ScrollView contentContainerStyle={styles.formColumn}>
        <SectionCard title="Basics" description="时间和标题是移动端最关键的输入。">
          <PrimaryTextField label="Title" value={name} onChangeText={setName} placeholder="Deep work block" />
          <PrimaryTextField label="Description" value={description} onChangeText={setDescription} placeholder="Optional notes" multiline numberOfLines={4} textAlignVertical="top" style={styles.multilineField} />
          <PrimaryTextField label="Date" value={date} onChangeText={setDate} placeholder="2026-04-01" hint="Use YYYY-MM-DD." />
          <View style={styles.inlineRow}>
            <PrimaryTextField label="Start" value={startClock} onChangeText={setStartClock} placeholder="09:00" style={styles.inlineField} />
            <PrimaryTextField label="End" value={endClock} onChangeText={setEndClock} placeholder="10:00" style={styles.inlineField} />
          </View>
          <PrimaryTextField label="Location" value={location} onChangeText={setLocation} placeholder="Meeting room / Zoom" />
          <PrimaryTextField label="Attendees" value={attendees} onChangeText={setAttendees} placeholder="a@x.com, b@y.com" hint="Comma-separated emails." />
          <PrimaryTextField label="Priority" value={priority} onChangeText={setPriority} placeholder="5" />
        </SectionCard>

        <SectionCard title="Conflict detection" description="创建和编辑前都可以先跑一次冲突检查。">
          <View style={styles.actionRow}>
            <PrimaryButton label="Detect conflicts" onPress={handleDetectConflicts} variant="secondary" />
            {scheduleId ? <PrimaryButton label={isDeleting ? 'Deleting…' : 'Delete event'} onPress={handleDelete} disabled={isDeleting} variant="ghost" /> : null}
          </View>
          <StatusPill label={describeConflict(conflicts)} tone={conflicts?.hasConflict ? 'warning' : 'success'} />
          {conflicts?.hasConflict ? (
            <ThemedText type="small" themeColor="warning">
              Conflicts are warnings only. Saving will keep the event and refresh conflict badges.
            </ThemedText>
          ) : null}
          {conflictError ? <ThemedText type="small" themeColor="warning">{conflictError}</ThemedText> : null}
          {conflicts?.conflicts?.length ? (
            <View style={styles.conflictColumn}>
              {conflicts.conflicts.map((item) => (
                <ThemedText key={`${item.scheduleId}-${item.overlapStart}`} type="small" themeColor="textSecondary">
                  {item.scheduleTitle}: overlap {item.overlapDuration} min
                </ThemedText>
              ))}
            </View>
          ) : null}
        </SectionCard>
      </ScrollView>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  formColumn: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  inlineField: {
    flex: 1,
  },
  multilineField: {
    minHeight: 110,
  },
  conflictColumn: {
    gap: Spacing.one,
  },
});
