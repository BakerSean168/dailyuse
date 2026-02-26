<!--
  RecurrenceSection.vue
  任务模板重复规则配置部分
  使用 RecurrenceRule 值对象
-->
<template>
  <Card class="mb-4">
    <CardHeader class="flex flex-row items-center gap-2 pb-2">
      <Repeat class="h-5 w-5 text-primary" />
      <CardTitle class="text-primary font-semibold">重复规则</CardTitle>
    </CardHeader>
    <CardContent>
      <!-- 显示验证错误 -->
      <Alert v-if="validationErrors.length > 0" variant="destructive" class="mb-4">
        <AlertDescription>
          <ul class="mb-0">
            <li v-for="error in validationErrors" :key="error">{{ error }}</li>
          </ul>
        </AlertDescription>
      </Alert>

      <!-- 显示规则描述 -->
      <Alert v-if="isValid && hasRecurrence" class="mb-4">
        <Info class="h-4 w-4" />
        <AlertDescription> 当前设置：{{ recurrenceDescription }} </AlertDescription>
      </Alert>

      <div class="grid grid-cols-12 gap-4">
        <!-- 是否启用重复 -->
        <div class="col-span-12">
          <div class="flex items-center gap-2">
            <Switch :checked="recurrenceEnabled" @update:checked="recurrenceEnabled = $event" />
            <Label>启用重复规则</Label>
          </div>
        </div>

        <template v-if="recurrenceEnabled">
          <!-- 重复频率 -->
          <div class="col-span-12 md:col-span-6">
            <Label class="mb-2 block">重复频率</Label>
            <Select :model-value="frequency" @update:model-value="frequency = $event">
              <SelectTrigger>
                <SelectValue placeholder="选择频率" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in frequencyOptions" :key="opt.value" :value="opt.value">
                  {{ opt.title }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 重复间隔 -->
          <div class="col-span-12 md:col-span-6">
            <Label class="mb-2 block">重复间隔</Label>
            <Input
              :model-value="interval"
              type="number"
              min="1"
              max="365"
              @update:model-value="interval = Number($event)"
            />
            <p class="text-xs text-muted-foreground mt-1">{{ intervalHint }}</p>
          </div>

          <!-- 每周重复：选择星期几 -->
          <div class="col-span-12" v-if="frequency === RecurrenceFrequency.WEEKLY">
            <div class="text-sm font-medium mb-2">选择星期</div>
            <div class="flex flex-wrap gap-2">
              <Badge
                v-for="day in dayOptions"
                :key="day.value"
                :variant="selectedDays.includes(day.value) ? 'default' : 'outline'"
                class="cursor-pointer select-none"
                @click="toggleDay(day.value)"
              >
                {{ day.title }}
              </Badge>
            </div>
          </div>

          <!-- 结束条件 -->
          <div class="col-span-12">
            <Separator class="my-2" />
            <div class="text-sm font-medium mb-2">结束条件</div>
          </div>

          <div class="col-span-12 md:col-span-4">
            <RadioGroup
              :model-value="endConditionType"
              @update:model-value="endConditionType = $event"
            >
              <div class="flex items-center gap-2">
                <RadioGroupItem value="never" id="end-never" />
                <Label for="end-never">永不结束</Label>
              </div>
              <div class="flex items-center gap-2">
                <RadioGroupItem value="date" id="end-date" />
                <Label for="end-date">结束日期</Label>
              </div>
              <div class="flex items-center gap-2">
                <RadioGroupItem value="count" id="end-count" />
                <Label for="end-count">次数限制</Label>
              </div>
            </RadioGroup>
          </div>

          <div class="col-span-12 md:col-span-8">
            <!-- 结束日期 -->
            <div v-if="endConditionType === 'date'">
              <Label class="mb-2 block">结束日期</Label>
              <Input v-model="endDate" type="date" />
            </div>

            <!-- 次数限制 -->
            <div v-if="endConditionType === 'count'">
              <Label class="mb-2 block">重复次数</Label>
              <Input
                :model-value="occurrences"
                type="number"
                min="1"
                max="999"
                @update:model-value="occurrences = Number($event)"
              />
            </div>
          </div>
        </template>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RecurrenceFrequency, DayOfWeek, RECURRENCE_RULE_DEFAULTS } from '@dailyuse/contracts/task';
import type { RecurrenceRuleClientDTO } from '@dailyuse/contracts/task';
import type { TaskTemplateViewModel } from '../../types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Switch,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
  Badge,
  Separator,
  RadioGroup,
  RadioGroupItem,
} from '@dailyuse/ui-vue-shadcn';
import { Repeat, Info } from 'lucide-vue-next';

/**
 * 获取默认结束日期（今天 + 配置的天数）
 */
const getDefaultEndDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + RECURRENCE_RULE_DEFAULTS.DEFAULT_END_DATE_DAYS);
  return date.toISOString().split('T')[0];
};

interface Props {
  modelValue: TaskTemplateViewModel;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplateViewModel): void;
  (e: 'update:validation', isValid: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const updateTemplate = (updater: (template: TaskTemplateViewModel) => void) => {
  const updatedTemplate: TaskTemplateViewModel = {
    ...props.modelValue,
    timeConfig: { ...(props.modelValue.timeConfig || {}) },
    recurrenceRule: props.modelValue.recurrenceRule
      ? { ...(props.modelValue.recurrenceRule as RecurrenceRuleClientDTO) }
      : null,
  } as TaskTemplateViewModel;
  updater(updatedTemplate);
  emit('update:modelValue', updatedTemplate);
};

// 重复频率选项
const frequencyOptions = [
  { title: '每天', value: RecurrenceFrequency.DAILY },
  { title: '每周', value: RecurrenceFrequency.WEEKLY },
  { title: '每月', value: RecurrenceFrequency.MONTHLY },
  { title: '每年', value: RecurrenceFrequency.YEARLY },
];

// 星期选项
const dayOptions = [
  { title: '周日', value: DayOfWeek.SUNDAY },
  { title: '周一', value: DayOfWeek.MONDAY },
  { title: '周二', value: DayOfWeek.TUESDAY },
  { title: '周三', value: DayOfWeek.WEDNESDAY },
  { title: '周四', value: DayOfWeek.THURSDAY },
  { title: '周五', value: DayOfWeek.FRIDAY },
  { title: '周六', value: DayOfWeek.SATURDAY },
];

// Toggle day for weekly selection (replaces v-chip-group)
const toggleDay = (day: DayOfWeek) => {
  const current = selectedDays.value;
  if (current.includes(day)) {
    selectedDays.value = current.filter((d) => d !== day);
  } else {
    selectedDays.value = [...current, day];
  }
};

// 重复启用状态
const recurrenceEnabled = computed({
  get: () => !!props.modelValue.recurrenceRule,
  set: (value: boolean) => {
    if (value && !props.modelValue.recurrenceRule) {
      // 启用重复：创建默认规则
      const defaultRule: RecurrenceRuleClientDTO = {
        frequency: RecurrenceFrequency.DAILY,
        interval: 1,
        daysOfWeek: [],
        endDate: null,
        occurrences: null,
        frequencyText: '每天',
        dayNames: [],
        recurrenceDisplayText: '每 1 天重复',
        hasEndCondition: false,
      };
      updateTemplate((template) => {
        (template as any).recurrenceRule = defaultRule;
      });
    } else if (!value) {
      // 禁用重复：清空规则
      updateTemplate((template) => {
        (template as any).recurrenceRule = null;
      });
    }
  },
});

// 频率
const frequency = computed({
  get: () =>
    (props.modelValue.recurrenceRule as RecurrenceRuleClientDTO | null)?.frequency ??
    RecurrenceFrequency.DAILY,
  set: (value: RecurrenceFrequency) => {
    updateRecurrenceRule({ frequency: value });
  },
});

// 间隔
const interval = computed({
  get: () => (props.modelValue.recurrenceRule as RecurrenceRuleClientDTO | null)?.interval ?? 1,
  set: (value: number) => {
    updateRecurrenceRule({ interval: value });
  },
});

// 选中的星期
const selectedDays = computed({
  get: () => (props.modelValue.recurrenceRule as RecurrenceRuleClientDTO | null)?.daysOfWeek ?? [],
  set: (value: DayOfWeek[]) => {
    updateRecurrenceRule({ daysOfWeek: value });
  },
});

// 结束条件类型
const endConditionType = ref<'never' | 'date' | 'count'>('never');

// 结束日期
const endDate = ref<string>('');

// 重复次数
const occurrences = ref<number>(1);

// 初始化结束条件
const initializeEndCondition = () => {
  const rule = props.modelValue.recurrenceRule;
  if (!rule) {
    endConditionType.value = 'never';
    return;
  }

  if (rule.endDate) {
    endConditionType.value = 'date';
    endDate.value = new Date(rule.endDate).toISOString().split('T')[0];
  } else if (rule.occurrences) {
    endConditionType.value = 'count';
    occurrences.value = rule.occurrences;
  } else {
    endConditionType.value = 'never';
  }
};

// 更新重复规则
const updateRecurrenceRule = (updates: Partial<RecurrenceRuleClientDTO>) => {
  const currentRule = props.modelValue.recurrenceRule as RecurrenceRuleClientDTO | null;
  if (!currentRule) return;

  const newRuleDTO: RecurrenceRuleClientDTO = {
    frequency: updates.frequency ?? currentRule.frequency,
    interval: updates.interval ?? currentRule.interval,
    daysOfWeek: updates.daysOfWeek ?? currentRule.daysOfWeek,
    endDate: updates.endDate !== undefined ? updates.endDate : currentRule.endDate,
    occurrences: updates.occurrences !== undefined ? updates.occurrences : currentRule.occurrences,
    frequencyText: currentRule.frequencyText,
    dayNames: currentRule.dayNames,
    recurrenceDisplayText: currentRule.recurrenceDisplayText,
    hasEndCondition: currentRule.hasEndCondition,
  };

  updateTemplate((template) => {
    (template as any).recurrenceRule = newRuleDTO;
  });
};

// 监听结束条件类型变化
watch(endConditionType, (newValue) => {
  switch (newValue) {
    case 'never':
      updateRecurrenceRule({ endDate: null, occurrences: null });
      break;
    case 'date':
      // 如果没有设置结束日期，使用默认值（今天 + 30 天）
      if (!endDate.value) {
        endDate.value = getDefaultEndDate();
      }
      updateRecurrenceRule({
        endDate: new Date(endDate.value).getTime(),
        occurrences: null,
      });
      break;
    case 'count':
      // 如果没有设置次数，使用默认值
      if (!occurrences.value || occurrences.value < 1) {
        occurrences.value = RECURRENCE_RULE_DEFAULTS.DEFAULT_OCCURRENCES;
      }
      updateRecurrenceRule({
        endDate: null,
        occurrences: occurrences.value,
      });
      break;
  }
});

// 监听结束日期变化
watch(endDate, (newValue) => {
  if (endConditionType.value === 'date' && newValue) {
    updateRecurrenceRule({
      endDate: new Date(newValue).getTime(),
      occurrences: null,
    });
  }
});

// 监听重复次数变化
watch(occurrences, (newValue) => {
  if (endConditionType.value === 'count' && newValue > 0) {
    updateRecurrenceRule({
      endDate: null,
      occurrences: newValue,
    });
  }
});

// UI 辅助
const intervalHint = computed(() => {
  const freq = frequency.value;
  switch (freq) {
    case RecurrenceFrequency.DAILY:
      return '每几天重复一次';
    case RecurrenceFrequency.WEEKLY:
      return '每几周重复一次';
    case RecurrenceFrequency.MONTHLY:
      return '每几月重复一次';
    case RecurrenceFrequency.YEARLY:
      return '每几年重复一次';
    default:
      return '';
  }
});

const hasRecurrence = computed(() => recurrenceEnabled.value);

const recurrenceDescription = computed(() => {
  return (
    (props.modelValue.recurrenceRule as RecurrenceRuleClientDTO | null)?.recurrenceDisplayText ?? ''
  );
});

// 验证
const validationErrors = ref<string[]>([]);

const validateRecurrence = () => {
  validationErrors.value = [];

  if (recurrenceEnabled.value) {
    const rule = props.modelValue.recurrenceRule;
    if (!rule) {
      validationErrors.value.push('重复规则配置无效');
      return;
    }

    if (rule.interval < 1 || rule.interval > 365) {
      validationErrors.value.push('重复间隔必须在 1-365 之间');
    }

    if (rule.frequency === RecurrenceFrequency.WEEKLY && rule.daysOfWeek.length === 0) {
      validationErrors.value.push('每周重复时，请至少选择一天');
    }

    if (endConditionType.value === 'date' && !endDate.value) {
      validationErrors.value.push('请选择结束日期');
    }

    if (endConditionType.value === 'count' && (!occurrences.value || occurrences.value < 1)) {
      validationErrors.value.push('重复次数必须大于 0');
    }
  }
};

const isValid = computed(() => {
  validateRecurrence();
  return validationErrors.value.length === 0;
});

// 监听验证状态变化
watch(
  isValid,
  (newValue) => {
    emit('update:validation', newValue);
  },
  { immediate: true },
);

// 监听模板变化
watch(
  () => props.modelValue.recurrenceRule,
  () => {
    initializeEndCondition();
    validateRecurrence();
  },
  { deep: true, immediate: true },
);
</script>
