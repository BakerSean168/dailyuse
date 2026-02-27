<!--
  TimeConfigSection.vue
  任务模板时间配置部分
  重构：使用新的 TaskTimeConfig 结构
-->
<template>
  <Card class="mb-4">
    <CardHeader>
      <CardTitle>⏰ {{ t('task.timeConfig.title') }}</CardTitle>
    </CardHeader>
    <CardContent>
      <!-- 时间类型选择 -->
      <div class="mb-4">
        <Label class="mb-2 block">{{ t('task.timeConfig.timeType') }}</Label>
        <RadioGroup
          :model-value="timeType"
          @update:model-value="
            (v: string) => {
              timeType = v as TaskTimeType;
              handleTimeTypeChange();
            }
          "
        >
          <div class="flex items-center space-x-2">
            <RadioGroupItem :value="TaskTimeType.AllDay" id="time-all-day" />
            <Label for="time-all-day">{{ t('task.timeConfig.allDay') }}</Label>
          </div>
          <div class="flex items-center space-x-2">
            <RadioGroupItem :value="TaskTimeType.TimePoint" id="time-point" />
            <Label for="time-point">{{ t('task.timeConfig.timePoint') }}</Label>
          </div>
          <div class="flex items-center space-x-2">
            <RadioGroupItem :value="TaskTimeType.TimeRange" id="time-range" />
            <Label for="time-range">{{ t('task.timeConfig.timeRange') }}</Label>
          </div>
        </RadioGroup>
      </div>

      <!-- 日期范围 -->
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12 md:col-span-6">
          <Label class="mb-1.5 block">{{ t('task.timeConfig.startDate') }}</Label>
          <Input v-model="startDate" type="date" @update:model-value="handleDateChange" />
        </div>
      </div>

      <!-- 时间点输入 (仅当选择 TimePoint 时显示) -->
      <div v-if="timeType === TaskTimeType.TimePoint" class="grid grid-cols-12 gap-4 mt-4">
        <div class="col-span-12">
          <Label class="mb-1.5 block">{{ t('task.timeConfig.specificTime') }}</Label>
          <Input
            v-model="timePoint"
            type="datetime-local"
            @update:model-value="handleTimePointChange"
          />
          <p class="text-xs text-muted-foreground mt-1">
            {{ t('task.timeConfig.selectDateTime') }}
          </p>
        </div>
      </div>

      <!-- 时间段输入 (仅当选择 TimeRange 时显示) -->
      <div v-if="timeType === TaskTimeType.TimeRange" class="grid grid-cols-12 gap-4 mt-4">
        <div class="col-span-12 md:col-span-6">
          <Label class="mb-1.5 block">{{ t('task.timeConfig.startTime') }}</Label>
          <Input
            v-model="timeRangeStart"
            type="datetime-local"
            @update:model-value="handleTimeRangeChange"
          />
          <p class="text-xs text-muted-foreground mt-1">
            {{ t('task.timeConfig.selectStartDateTime') }}
          </p>
        </div>
        <div class="col-span-12 md:col-span-6">
          <Label class="mb-1.5 block">{{ t('task.timeConfig.endTime') }}</Label>
          <Input
            v-model="timeRangeEnd"
            type="datetime-local"
            @update:model-value="handleTimeRangeChange"
          />
          <p class="text-xs text-muted-foreground mt-1">
            {{ t('task.timeConfig.selectEndDateTime') }}
          </p>
        </div>
      </div>

      <!-- 验证提示 -->
      <Alert v-if="validationError" variant="destructive" class="mt-2">
        <AlertDescription>{{ validationError }}</AlertDescription>
      </Alert>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { TaskTimeType } from '@dailyuse/contracts/task';
import type { TaskTimeConfigDTO } from '@dailyuse/contracts/task';
import type { TaskTemplateViewModel } from '../../types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Alert,
  AlertDescription,
} from '@dailyuse/ui-vue-shadcn';

const { t } = useI18n();

const props = defineProps<{
  modelValue: TaskTemplateViewModel;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: TaskTemplateViewModel): void;
  (e: 'update:validation', valid: boolean): void;
}>();

// 表单数据
const timeType = ref<TaskTimeType>(TaskTimeType.AllDay);
const startDate = ref<string>('');
const timePoint = ref<string>('');
const timeRangeStart = ref<string>('');
const timeRangeEnd = ref<string>('');
const validationError = ref<string>('');

/**
 * 初始化表单数据
 */
const initializeFormData = () => {
  const config = props.modelValue.timeConfig as TaskTimeConfigDTO | undefined;

  if (!config) {
    // 默认配置
    timeType.value = TaskTimeType.AllDay;
    startDate.value = '';
    timePoint.value = '';
    timeRangeStart.value = '';
    timeRangeEnd.value = '';
    return;
  }

  timeType.value = config.timeType;

  // 开始日期
  if (config.startDate) {
    startDate.value = formatDateToInput(config.startDate);
  }

  // 时间点
  if (config.timeType === TaskTimeType.TimePoint && config.timePoint) {
    timePoint.value = formatDateTimeToInput(config.timePoint);
  }

  // 时间段
  if (config.timeType === TaskTimeType.TimeRange && config.timeRange) {
    timeRangeStart.value = formatDateTimeToInput(config.timeRange.start);
    timeRangeEnd.value = formatDateTimeToInput(config.timeRange.end);
  }
};

/**
 * 格式化日期为 input[type=date] 格式
 */
const formatDateToInput = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
};

/**
 * 格式化时间为 input[type=time] 格式
 */
const formatTimeToInput = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toTimeString().slice(0, 5); // HH:MM
};

/**
 * 格式化时间戳为 input[type=datetime-local] 格式
 */
const formatDateTimeToInput = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * 解析日期字符串为时间戳
 */
const parseDateInput = (dateStr: string): number | null => {
  if (!dateStr) return null;
  return new Date(dateStr).getTime();
};

/**
 * 解析时间字符串为时间戳 (使用今天的日期)
 */
const parseTimeInput = (timeStr: string): number | null => {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
};

/**
 * 解析 datetime-local 输入为时间戳
 */
const parseDateTimeInput = (datetimeStr: string): number | null => {
  if (!datetimeStr) return null;
  return new Date(datetimeStr).getTime();
};

/**
 * 处理日期变更
 */
const handleDateChange = () => {
  try {
    validationError.value = '';
    const parsedDate = parseDateInput(startDate.value);

    const updated: TaskTemplateViewModel = {
      ...props.modelValue,
      timeConfig: {
        ...(props.modelValue.timeConfig || {}),
        startDate: parsedDate,
      } as any,
    };
    emit('update:modelValue', updated);
    emit('update:validation', true);
  } catch (error) {
    console.error('更新日期失败:', error);
    validationError.value =
      error instanceof Error ? error.message : t('task.timeConfig.updateFailed');
    emit('update:validation', false);
  }
};

/**
 * 处理时间点变更
 */
const handleTimePointChange = () => {
  try {
    validationError.value = '';
    const parsedTime = parseDateTimeInput(timePoint.value);

    const updated: TaskTemplateViewModel = {
      ...props.modelValue,
      timeConfig: {
        ...(props.modelValue.timeConfig || {}),
        timeType: TaskTimeType.TimePoint,
        timePoint: parsedTime,
      } as any,
    };
    emit('update:modelValue', updated);
    emit('update:validation', true);
  } catch (error) {
    console.error('更新时间点失败:', error);
    validationError.value =
      error instanceof Error ? error.message : t('task.timeConfig.updateFailed');
    emit('update:validation', false);
  }
};

/**
 * 处理时间段变更
 */
const handleTimeRangeChange = () => {
  try {
    validationError.value = '';
    const parsedStart = parseDateTimeInput(timeRangeStart.value);
    const parsedEnd = parseDateTimeInput(timeRangeEnd.value);

    const updated: TaskTemplateViewModel = {
      ...props.modelValue,
      timeConfig: {
        ...(props.modelValue.timeConfig || {}),
        timeType: TaskTimeType.TimeRange,
        timeRange: {
          start: parsedStart ?? 0,
          end: parsedEnd ?? 0,
        },
      } as any,
    };
    emit('update:modelValue', updated);
    emit('update:validation', true);
  } catch (error) {
    console.error('更新时间段失败:', error);
    validationError.value =
      error instanceof Error ? error.message : t('task.timeConfig.updateFailed');
    emit('update:validation', false);
  }
};

/**
 * 处理时间类型变更
 */
const handleTimeTypeChange = () => {
  try {
    validationError.value = '';

    const updated: TaskTemplateViewModel = {
      ...props.modelValue,
      timeConfig: {
        ...(props.modelValue.timeConfig || {}),
        timeType: timeType.value,
      } as any,
    };
    emit('update:modelValue', updated);

    // 更新表单显示
    initializeFormData();

    // 验证通过
    emit('update:validation', true);
  } catch (error) {
    console.error('更新时间类型失败:', error);
    validationError.value =
      error instanceof Error ? error.message : t('task.timeConfig.updateFailed');
    emit('update:validation', false);
  }
};

// 初始化
onMounted(() => {
  initializeFormData();
});

// 监听模板变化
watch(
  () => props.modelValue,
  () => {
    initializeFormData();
  },
  { deep: true },
);
</script>
