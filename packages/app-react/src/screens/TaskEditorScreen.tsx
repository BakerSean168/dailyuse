import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { presentErrorMessage } from '@memoflow/http-client';

import { ImportanceLevel } from '@memoflow/contracts/shared';
import { TaskTimeType, TaskType, type CreateTaskTemplateReq, type UpdateTaskTemplateReq } from '@memoflow/contracts/task';

import { useTaskTemplateDetail } from '../hooks/useTaskTemplateDetail';
import { useTaskService } from '../hooks/useTaskService';

import {
  PageShell,
  PrimaryButton,
  PrimaryTextField,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
} from '@memoflow/ui-react-native';

const IMPORTANCE_OPTIONS = [
  ImportanceLevel.Vital,
  ImportanceLevel.Important,
  ImportanceLevel.Moderate,
  ImportanceLevel.Minor,
  ImportanceLevel.Trivial,
] as const;

const TIME_TYPE_OPTIONS = [TaskTimeType.AllDay, TaskTimeType.TimePoint, TaskTimeType.TimeRange] as const;

/**
 * Soft residual 1228: app-react task toDateInput — falsy → today's UTC YMD (not empty string).
 * Same ISO slice body as GoalEditor when timestamp present; empty-default differs (no force-merge).
 */
function toDateInput(timestamp: number | null) {
  if (!timestamp) {
    return new Date().toISOString().slice(0, 10);
  }

  return new Date(timestamp).toISOString().slice(0, 10);
}

/**
 * Residual 1231 keep-boundary: app-react task toTimeInput — epoch → local HH:mm.
 * Task editor helper; falsy → '09:00'; getHours/getMinutes padStart (local clock).
 * Soft residual 1231: schedule UTC ISO slice + utils formatTimeToInput Date+date-fns differ (no force-merge).
 */
function toTimeInput(timestamp: number | null) {
  if (!timestamp) {
    return '09:00';
  }

  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Residual 1234 keep-boundary: app-react task combineDateAndTime — YMD+HH:mm → local epoch ms.
 * Local Date(y,m-1,d,h,min) constructor; always returns number (no empty/NaN null path).
 * Soft residual 1234: schedule parseTimestamp trim+Date.parse+null differs (no force-merge).
 */
function combineDateAndTime(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hours, minutes] = timeValue.split(':').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0, 0);
  return date.getTime();
}

function parseTags(input: string) {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function TaskEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const taskId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;
  const isEditing = !!taskId;
  const service = useTaskService();
  const { isLoading: isDetailLoading, template } = useTaskTemplateDetail(taskId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState<(typeof IMPORTANCE_OPTIONS)[number]>(ImportanceLevel.Moderate);
  const [tags, setTags] = useState('');
  const [timeType, setTimeType] = useState<(typeof TIME_TYPE_OPTIONS)[number]>(TaskTimeType.AllDay);
  const [dateValue, setDateValue] = useState(toDateInput(null));
  const [timeValue, setTimeValue] = useState('09:00');
  const [endTimeValue, setEndTimeValue] = useState('10:00');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!template) {
      return;
    }

    setName(template.name);
    setDescription(template.description ?? '');
    setImportance(template.importance);
    setTags(template.tags.join(', '));
    setTimeType(template.timeConfig.timeType);
    setDateValue(toDateInput(template.timeConfig.startDate ?? template.startDate));

    if (template.timeConfig.timePoint !== null) {
      setTimeValue(toTimeInput(template.timeConfig.timePoint));
    }

    if (template.timeConfig.timeRange) {
      setTimeValue(toTimeInput(template.timeConfig.timeRange.start));
      setEndTimeValue(toTimeInput(template.timeConfig.timeRange.end));
    }
  }, [template]);

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Name is required.');
      return;
    }

    setFormError(null);
    setIsSaving(true);

    const baseTimeConfig = {
      timeType,
      startDate: combineDateAndTime(dateValue, '00:00'),
      timePoint: timeType === TaskTimeType.TimePoint ? combineDateAndTime(dateValue, timeValue) : null,
      timeRange:
        timeType === TaskTimeType.TimeRange
          ? {
              start: combineDateAndTime(dateValue, timeValue),
              end: combineDateAndTime(dateValue, endTimeValue),
            }
          : null,
    };

    if (isEditing && taskId) {
      const request: UpdateTaskTemplateReq = {
        name: trimmedName,
        description: description.trim() || null,
        importance,
        tags: parseTags(tags),
        timeConfig: baseTimeConfig,
      };

      const result = await service.updateTemplate(taskId, request);
      setIsSaving(false);

      if (!result.ok) {
        setFormError(presentErrorMessage(result.error));
        return;
      }

      router.replace(`../${taskId}`);
      return;
    }

    const request: CreateTaskTemplateReq = {
      name: trimmedName,
      description: description.trim() || null,
      importance,
      tags: parseTags(tags),
      taskType: TaskType.OneTime,
      timeConfig: baseTimeConfig,
      recurrenceRule: null,
      reminderConfig: null,
      color: null,
      goalBinding: null,
      folderId: null,
      parentTaskId: null,
    };

    const result = await service.createTemplate(request);
    setIsSaving(false);

    if (!result.ok) {
      setFormError(presentErrorMessage(result.error));
      return;
    }

    router.replace(`../${String(result.data.template.id)}`);
  }

  return (
    <PageShell
      eyebrow="Tasks"
      title={isEditing ? 'Edit template' : 'Create template'}
      subtitle="第一版移动端编辑页先支持最小可用字段：名称、描述、重要性、标签和时间配置。">
      <SectionCard title="Navigation" description="创建和编辑都走单独 screen，不在列表页里弹复杂桌面对话框。">
        <View style={styles.actionRow}>
          <PrimaryButton label="Back" onPress={() => router.back()} variant="secondary" />
          {taskId ? <PrimaryButton label="Open detail" onPress={() => router.replace(`../${taskId}`)} variant="ghost" /> : null}
        </View>
      </SectionCard>

      <SectionCard title="Basic info" description="先把最小创建链路打通，复杂表单以后再扩。">
        <PrimaryTextField label="Name" onChangeText={setName} placeholder="Task template name" value={name} />
        <PrimaryTextField
          label="Description"
          multiline
          numberOfLines={4}
          onChangeText={setDescription}
          placeholder="Short description"
          style={styles.multilineInput}
          textAlignVertical="top"
          value={description}
        />
        <PrimaryTextField
          hint="Comma separated tags"
          label="Tags"
          onChangeText={setTags}
          placeholder="focus, weekly, team"
          value={tags}
        />
      </SectionCard>

      <SectionCard title="Importance" description="先保留单选按钮，后续再接更完整的设计系统表单原语。">
        <View style={styles.optionRow}>
          {IMPORTANCE_OPTIONS.map((option) => (
            <PrimaryButton
              key={option}
              label={option}
              onPress={() => setImportance(option)}
              variant={importance === option ? 'solid' : 'ghost'}
            />
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Time config" description="移动端先支持全天、时间点和时间段三种基础模式。">
        <View style={styles.optionRow}>
          {TIME_TYPE_OPTIONS.map((option) => (
            <PrimaryButton
              key={option}
              label={option}
              onPress={() => setTimeType(option)}
              variant={timeType === option ? 'solid' : 'ghost'}
            />
          ))}
        </View>

        <PrimaryTextField label="Date" onChangeText={setDateValue} placeholder="YYYY-MM-DD" value={dateValue} />

        {timeType === TaskTimeType.TimePoint ? (
          <PrimaryTextField label="Time" onChangeText={setTimeValue} placeholder="09:00" value={timeValue} />
        ) : null}

        {timeType === TaskTimeType.TimeRange ? (
          <View style={styles.rangeColumn}>
            <PrimaryTextField label="Start time" onChangeText={setTimeValue} placeholder="09:00" value={timeValue} />
            <PrimaryTextField label="End time" onChangeText={setEndTimeValue} placeholder="10:00" value={endTimeValue} />
          </View>
        ) : null}
      </SectionCard>

      {template && isEditing ? (
        <SectionCard title="Current state" description="编辑时保留当前模板的运行状态提示。">
          <View style={styles.optionRow}>
            <StatusPill label={template.status} tone={template.status === 'Active' ? 'success' : 'warning'} />
            <StatusPill label={`${template.pendingInstanceCount} pending`} tone="textSecondary" />
            <StatusPill label={`${Math.round(template.completionRate)}% done`} tone="tint" />
          </View>
        </SectionCard>
      ) : null}

      {formError ? (
        <SectionCard title="Save failed" description="表单错误或后端验证失败会先显示在这里。">
          <ThemedText type="small" themeColor="warning">
            {formError}
          </ThemedText>
        </SectionCard>
      ) : null}

      <SectionCard title="Save" description="这一版先保证 create / edit 主链路可用。">
        <View style={styles.actionRow}>
          <PrimaryButton
            label={isSaving || isDetailLoading ? 'Saving…' : isEditing ? 'Save changes' : 'Create template'}
            onPress={handleSave}
            disabled={isSaving || isDetailLoading}
          />
          <PrimaryButton label="Cancel" onPress={() => router.back()} variant="ghost" disabled={isSaving} />
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
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  rangeColumn: {
    gap: Spacing.two,
  },
  multilineInput: {
    minHeight: 120,
  },
});
