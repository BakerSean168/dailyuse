<!--
  TimeConfigSection.vue
  任务模板时间配置部分
  重构：使用新的 TaskTimeConfig 结构
  使用 Popover+Calendar 替代 native date/time inputs 以兼容 Dialog
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
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="w-full justify-start text-left font-normal"
                :class="{ 'text-muted-foreground': !startDate }"
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{ startDate ? formatDisplayDate(startDate) : t('task.timeConfig.startDate') }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <Calendar
                mode="single"
                :selected="parseInputToDate(startDate)"
                @update:model-value="
                  (d) =>
                    handleCalendarSelect(d, (v) => {
                      startDate = v;
                      handleDateChange();
                    })
                "
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <!-- 时间点输入 (仅当选择 TimePoint 时显示) -->
      <div v-if="timeType === TaskTimeType.TimePoint" class="grid grid-cols-12 gap-4 mt-4">
        <div class="col-span-12 md:col-span-6">
          <Label class="mb-1.5 block">{{ t('task.timeConfig.specificTime') }}</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="w-full justify-start text-left font-normal"
                :class="{ 'text-muted-foreground': !timePointDate }"
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{
                  timePointDate
                    ? formatDisplayDate(timePointDate)
                    : t('task.timeConfig.selectDateTime')
                }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <Calendar
                mode="single"
                :selected="parseInputToDate(timePointDate)"
                @update:model-value="
                  (d) =>
                    handleCalendarSelect(d, (v) => {
                      timePointDate = v;
                      rebuildTimePoint();
                    })
                "
              />
            </PopoverContent>
          </Popover>
        </div>
        <div class="col-span-12 md:col-span-6">
          <Label class="mb-1.5 block">{{ t('task.timeConfig.selectDateTime') }}</Label>
          <div class="flex gap-2 items-center">
            <Select
              :model-value="timePointHour"
              @update:model-value="
                (v) => {
                  timePointHour = String(v);
                  rebuildTimePoint();
                }
              "
            >
              <SelectTrigger class="w-[80px]"><SelectValue placeholder="HH" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="h in hourOptions" :key="h" :value="h">{{ h }}</SelectItem>
              </SelectContent>
            </Select>
            <span class="flex items-center font-medium">:</span>
            <Select
              :model-value="timePointMinute"
              @update:model-value="
                (v) => {
                  timePointMinute = String(v);
                  rebuildTimePoint();
                }
              "
            >
              <SelectTrigger class="w-[80px]"><SelectValue placeholder="MM" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="m in minuteOptions" :key="m" :value="m">{{ m }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <!-- 时间段输入 (仅当选择 TimeRange 时显示) -->
      <div v-if="timeType === TaskTimeType.TimeRange" class="grid grid-cols-12 gap-4 mt-4">
        <div class="col-span-12 md:col-span-6">
          <Label class="mb-1.5 block">{{ t('task.timeConfig.startTime') }}</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="w-full justify-start text-left font-normal"
                :class="{ 'text-muted-foreground': !timeRangeStartDate }"
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{
                  timeRangeStartDate
                    ? formatDisplayDate(timeRangeStartDate)
                    : t('task.timeConfig.selectStartDateTime')
                }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <Calendar
                mode="single"
                :selected="parseInputToDate(timeRangeStartDate)"
                @update:model-value="
                  (d) =>
                    handleCalendarSelect(d, (v) => {
                      timeRangeStartDate = v;
                      rebuildTimeRange();
                    })
                "
              />
            </PopoverContent>
          </Popover>
          <div class="flex gap-2 items-center mt-2">
            <Select
              :model-value="timeRangeStartHour"
              @update:model-value="
                (v) => {
                  timeRangeStartHour = String(v);
                  rebuildTimeRange();
                }
              "
            >
              <SelectTrigger class="w-[80px]"><SelectValue placeholder="HH" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="h in hourOptions" :key="h" :value="h">{{ h }}</SelectItem>
              </SelectContent>
            </Select>
            <span class="flex items-center font-medium">:</span>
            <Select
              :model-value="timeRangeStartMinute"
              @update:model-value="
                (v) => {
                  timeRangeStartMinute = String(v);
                  rebuildTimeRange();
                }
              "
            >
              <SelectTrigger class="w-[80px]"><SelectValue placeholder="MM" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="m in minuteOptions" :key="m" :value="m">{{ m }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            {{ t('task.timeConfig.selectStartDateTime') }}
          </p>
        </div>
        <div class="col-span-12 md:col-span-6">
          <Label class="mb-1.5 block">{{ t('task.timeConfig.endTime') }}</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="w-full justify-start text-left font-normal"
                :class="{ 'text-muted-foreground': !timeRangeEndDate }"
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{
                  timeRangeEndDate
                    ? formatDisplayDate(timeRangeEndDate)
                    : t('task.timeConfig.selectEndDateTime')
                }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <Calendar
                mode="single"
                :selected="parseInputToDate(timeRangeEndDate)"
                @update:model-value="
                  (d) =>
                    handleCalendarSelect(d, (v) => {
                      timeRangeEndDate = v;
                      rebuildTimeRange();
                    })
                "
              />
            </PopoverContent>
          </Popover>
          <div class="flex gap-2 items-center mt-2">
            <Select
              :model-value="timeRangeEndHour"
              @update:model-value="
                (v) => {
                  timeRangeEndHour = String(v);
                  rebuildTimeRange();
                }
              "
            >
              <SelectTrigger class="w-[80px]"><SelectValue placeholder="HH" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="h in hourOptions" :key="h" :value="h">{{ h }}</SelectItem>
              </SelectContent>
            </Select>
            <span class="flex items-center font-medium">:</span>
            <Select
              :model-value="timeRangeEndMinute"
              @update:model-value="
                (v) => {
                  timeRangeEndMinute = String(v);
                  rebuildTimeRange();
                }
              "
            >
              <SelectTrigger class="w-[80px]"><SelectValue placeholder="MM" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="m in minuteOptions" :key="m" :value="m">{{ m }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
  Button,
  Label,
  RadioGroup,
  RadioGroupItem,
  Alert,
  AlertDescription,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Calendar,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@dailyuse/ui-vue-shadcn';
import { Calendar as CalendarIcon } from 'lucide-vue-next';

const { t } = useI18n();

const props = defineProps<{
  modelValue: TaskTemplateViewModel;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: TaskTemplateViewModel): void;
  (e: 'update:validation', valid: boolean): void;
}>();

// ── Time picker options ────────────────────────────────────────────────
const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// ── Form data ──────────────────────────────────────────────────────────
const timeType = ref<TaskTimeType>(TaskTimeType.AllDay);
const startDate = ref<string>(''); // YYYY-MM-DD
const validationError = ref<string>('');

// TimePoint: split into date + hour + minute
const timePointDate = ref<string>('');
const timePointHour = ref<string>('00');
const timePointMinute = ref<string>('00');

// TimeRange start: split into date + hour + minute
const timeRangeStartDate = ref<string>('');
const timeRangeStartHour = ref<string>('00');
const timeRangeStartMinute = ref<string>('00');

// TimeRange end: split into date + hour + minute
const timeRangeEndDate = ref<string>('');
const timeRangeEndHour = ref<string>('00');
const timeRangeEndMinute = ref<string>('00');

// ── Helpers ────────────────────────────────────────────────────────────

/** Format a YYYY-MM-DD string for display */
function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Convert a YYYY-MM-DD string to a Date for Calendar :selected */
function parseInputToDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  return new Date(dateStr + 'T00:00:00');
}

/** Handle Calendar selection — works with both Date and radix DateValue objects */
function handleCalendarSelect(date: unknown, setter: (v: string) => void) {
  if (date instanceof Date) {
    setter(formatDateToYMD(date));
  } else if (date && typeof date === 'object' && 'toDate' in date) {
    setter(formatDateToYMD((date as { toDate: () => Date }).toDate()));
  } else {
    setter('');
  }
}

function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 格式化日期为 input[type=date] 格式
 */
const formatDateToInput = (timestamp: number): string => {
  const date = new Date(timestamp);
  return formatDateToYMD(date);
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
  return new Date(dateStr + 'T00:00:00').getTime();
};

/**
 * Combine date string (YYYY-MM-DD) + hour + minute into a timestamp
 */
function combineDateTimeParts(dateStr: string, hour: string, minute: string): number | null {
  if (!dateStr) return null;
  return new Date(`${dateStr}T${hour}:${minute}:00`).getTime();
}

/**
 * Split a timestamp into date / hour / minute parts
 */
function splitTimestamp(ts: number): { date: string; hour: string; minute: string } {
  const d = new Date(ts);
  return {
    date: formatDateToYMD(d),
    hour: String(d.getHours()).padStart(2, '0'),
    minute: String(d.getMinutes()).padStart(2, '0'),
  };
}

// ── Initialization ─────────────────────────────────────────────────────

const initializeFormData = () => {
  const config = props.modelValue.timeConfig as TaskTimeConfigDTO | undefined;

  if (!config) {
    timeType.value = TaskTimeType.AllDay;
    startDate.value = '';
    timePointDate.value = '';
    timePointHour.value = '00';
    timePointMinute.value = '00';
    timeRangeStartDate.value = '';
    timeRangeStartHour.value = '00';
    timeRangeStartMinute.value = '00';
    timeRangeEndDate.value = '';
    timeRangeEndHour.value = '00';
    timeRangeEndMinute.value = '00';
    return;
  }

  timeType.value = config.timeType;

  if (config.startDate) {
    startDate.value = formatDateToInput(config.startDate);
  }

  if (config.timeType === TaskTimeType.TimePoint && config.timePoint) {
    const parts = splitTimestamp(config.timePoint);
    timePointDate.value = parts.date;
    timePointHour.value = parts.hour;
    timePointMinute.value = parts.minute;
  }

  if (config.timeType === TaskTimeType.TimeRange && config.timeRange) {
    const startParts = splitTimestamp(config.timeRange.start);
    timeRangeStartDate.value = startParts.date;
    timeRangeStartHour.value = startParts.hour;
    timeRangeStartMinute.value = startParts.minute;

    const endParts = splitTimestamp(config.timeRange.end);
    timeRangeEndDate.value = endParts.date;
    timeRangeEndHour.value = endParts.hour;
    timeRangeEndMinute.value = endParts.minute;
  }
};

// ── Change handlers ────────────────────────────────────────────────────

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
 * Rebuild timePoint timestamp from date + hour + minute and emit
 */
const rebuildTimePoint = () => {
  try {
    validationError.value = '';
    const parsedTime = combineDateTimeParts(
      timePointDate.value,
      timePointHour.value,
      timePointMinute.value,
    );

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
 * Rebuild timeRange timestamps from date + hour + minute parts and emit
 */
const rebuildTimeRange = () => {
  try {
    validationError.value = '';
    const parsedStart = combineDateTimeParts(
      timeRangeStartDate.value,
      timeRangeStartHour.value,
      timeRangeStartMinute.value,
    );
    const parsedEnd = combineDateTimeParts(
      timeRangeEndDate.value,
      timeRangeEndHour.value,
      timeRangeEndMinute.value,
    );

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
