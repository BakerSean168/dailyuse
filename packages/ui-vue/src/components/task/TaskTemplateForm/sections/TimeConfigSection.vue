<!--
  TimeConfigSection.vue
  任务模板时间配置部分
  重构：使用新的 TaskTimeConfig 结构
-->
<template>
  <v-card>
    <v-card-title>⏰ 时间配置</v-card-title>
    <v-card-text>
      <!-- 时间类型选择 -->
      <v-radio-group v-model="timeType" label="时间类型" @update:model-value="handleTimeTypeChange">
        <v-radio label="全天" :value="TimeType.ALL_DAY"></v-radio>
        <v-radio label="时间点" :value="TimeType.TIME_POINT"></v-radio>
        <v-radio label="时间段" :value="TimeType.TIME_RANGE"></v-radio>
      </v-radio-group>

      <!-- 日期范围 -->
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field v-model="startDate" label="开始日期" type="date" variant="outlined" density="comfortable"
            @update:model-value="handleDateChange"></v-text-field>
        </v-col>
      </v-row>

      <!-- 时间点输入 (仅当选择 TIME_POINT 时显示) -->
      <v-row v-if="timeType === TimeType.TIME_POINT">
        <v-col cols="12">
          <v-text-field v-model="timePoint" label="具体时间" type="datetime-local" variant="outlined" density="comfortable"
            hint="选择具体日期和时间" @update:model-value="handleTimePointChange"></v-text-field>
        </v-col>
      </v-row>

      <!-- 时间段输入 (仅当选择 TIME_RANGE 时显示) -->
      <v-row v-if="timeType === TimeType.TIME_RANGE">
        <v-col cols="12" md="6">
          <v-text-field v-model="timeRangeStart" label="开始时间" type="datetime-local" variant="outlined" density="comfortable"
            hint="选择开始日期和时间" @update:model-value="handleTimeRangeChange"></v-text-field>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field v-model="timeRangeEnd" label="结束时间" type="datetime-local" variant="outlined" density="comfortable"
            hint="选择结束日期和时间" @update:model-value="handleTimeRangeChange"></v-text-field>
        </v-col>
      </v-row>

      <!-- 验证提示 -->
      <v-alert v-if="validationError" type="error" density="compact" class="mt-2">
        {{ validationError }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { TimeType } from '@dailyuse/contracts/task';
import type { TaskTimeConfigClientDTO } from '@dailyuse/contracts/task';
import type { TaskTemplateViewModel } from '../../types';

const props = defineProps<{
  modelValue: TaskTemplateViewModel;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: TaskTemplateViewModel): void;
  (e: 'update:validation', valid: boolean): void;
}>();

// 表单数据
const timeType = ref<TimeType>(TimeType.ALL_DAY);
const startDate = ref<string>('');
const timePoint = ref<string>('');
const timeRangeStart = ref<string>('');
const timeRangeEnd = ref<string>('');
const validationError = ref<string>('');

/**
 * 初始化表单数据
 */
const initializeFormData = () => {
  const config = props.modelValue.timeConfig as TaskTimeConfigClientDTO | undefined;

  if (!config) {
    // 默认配置
    timeType.value = TimeType.ALL_DAY;
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
  if (config.timeType === TimeType.TIME_POINT && config.timePoint) {
    timePoint.value = formatDateTimeToInput(config.timePoint);
  }

  // 时间段
  if (config.timeType === TimeType.TIME_RANGE && config.timeRange) {
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
    validationError.value = error instanceof Error ? error.message : '更新失败';
    emit('update:validation', false);
  }
};

/**
 * 处理日期变更
 */
const handleDateChange = () => {
  updateTimeConfig();
};

/**
 * 处理时间点变更
 */
const handleTimePointChange = () => {
  updateTimeConfig();
};

/**
 * 处理时间段变更
 */
const handleTimeRangeChange = () => {
  updateTimeConfig();
};

/**
 * 更新时间配置
 */
const updateTimeConfig = () => {
  try {
    validationError.value = '';

    // 构建新的时间配置
    const newConfig: TaskTimeConfigClientDTO = {
      timeType: timeType.value,
      startDate: parseDateInput(startDate.value),
      timePoint: timeType.value === TimeType.TIME_POINT ? parseDateTimeInput(timePoint.value) : null,
      timeRange:
        timeType.value === TimeType.TIME_RANGE && timeRangeStart.value && timeRangeEnd.value
          ? {
            start: parseDateTimeInput(timeRangeStart.value)!,
            end: parseDateTimeInput(timeRangeEnd.value)!,
          }
          : null,
      timeTypeText: '',
      formattedStartDate: '',
      formattedTimePoint: '',
      formattedTimeRange: '',
      displayText: '',
      hasDateRange: false,
    };

    // 验证
    if (timeType.value === TimeType.TIME_POINT && !newConfig.timePoint) {
      validationError.value = '请输入具体时间';
      emit('update:validation', false);
      return;
    }

    if (timeType.value === TimeType.TIME_RANGE && !newConfig.timeRange) {
      validationError.value = '请输入完整的时间段';
      emit('update:validation', false);
      return;
    }
    
    if (
      timeType.value === TimeType.TIME_RANGE &&
      newConfig.timeRange &&
      newConfig.timeRange.start >= newConfig.timeRange.end
    ) {
      validationError.value = '结束时间必须晚于开始时间';
      emit('update:validation', false);
      return;
    }

    const updated: TaskTemplateViewModel = {
      ...props.modelValue,
      timeConfig: newConfig as any,
    };
    emit('update:modelValue', updated);

    // 发出验证成功事件
    emit('update:validation', true);
  } catch (error) {
    console.error('更新时间配置失败:', error);
    validationError.value = error instanceof Error ? error.message : '更新失败';
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

<style scoped>
.v-card {
  margin-bottom: 16px;
}
</style>

