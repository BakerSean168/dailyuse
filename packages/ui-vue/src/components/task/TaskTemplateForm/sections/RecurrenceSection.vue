<!--
  RecurrenceSection.vue
  任务模板重复规则配置部分
  使用 RecurrenceRule 值对象
-->
<template>
  <v-card class="mb-4" elevation="0" variant="outlined">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-repeat</v-icon>
      重复规则
    </v-card-title>
    <v-card-text>
      <!-- 显示验证错误 -->
      <v-alert v-if="validationErrors.length > 0" type="error" variant="tonal" class="mb-4">
        <ul class="mb-0">
          <li v-for="error in validationErrors" :key="error">{{ error }}</li>
        </ul>
      </v-alert>

      <!-- 显示规则描述 -->
      <v-alert v-if="isValid && hasRecurrence" type="info" variant="tonal" class="mb-4">
        当前设置：{{ recurrenceDescription }}
      </v-alert>

      <v-row>
        <!-- 是否启用重复 -->
        <v-col cols="12">
          <v-switch v-model="recurrenceEnabled" label="启用重复规则" color="primary" />
        </v-col>

        <template v-if="recurrenceEnabled">
          <!-- 重复频率 -->
          <v-col cols="12" md="6">
            <v-select v-model="frequency" label="重复频率" :items="frequencyOptions" variant="outlined" />
          </v-col>

          <!-- 重复间隔 -->
          <v-col cols="12" md="6">
            <v-text-field v-model.number="interval" label="重复间隔" type="number" variant="outlined" min="1" max="365"
              :hint="intervalHint" persistent-hint />
          </v-col>

          <!-- 每周重复：选择星期几 -->
          <v-col cols="12" v-if="frequency === RecurrenceFrequency.WEEKLY">
            <div class="text-subtitle-2 mb-2">选择星期</div>
            <v-chip-group v-model="selectedDays" multiple column>
              <v-chip v-for="day in dayOptions" :key="day.value" :value="day.value" filter variant="outlined">
                {{ day.title }}
              </v-chip>
            </v-chip-group>
          </v-col>

          <!-- 结束条件 -->
          <v-col cols="12">
            <v-divider class="my-2" />
            <div class="text-subtitle-2 mb-2">结束条件</div>
          </v-col>

          <v-col cols="12" md="4">
            <v-radio-group v-model="endConditionType">
              <v-radio label="永不结束" value="never" />
              <v-radio label="结束日期" value="date" />
              <v-radio label="次数限制" value="count" />
            </v-radio-group>
          </v-col>

          <v-col cols="12" md="8">
            <!-- 结束日期 -->
            <v-text-field v-if="endConditionType === 'date'" v-model="endDate" label="结束日期" type="date"
              variant="outlined" />

            <!-- 次数限制 -->
            <v-text-field v-if="endConditionType === 'count'" v-model.number="occurrences" label="重复次数" type="number"
              variant="outlined" min="1" max="999" />
          </v-col>
        </template>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RecurrenceFrequency, DayOfWeek, RECURRENCE_RULE_DEFAULTS } from '@dailyuse/contracts/task';
import type { RecurrenceRuleClientDTO } from '@dailyuse/contracts/task';
import type { TaskTemplateViewModel } from '../../types';

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
  get: () => ((props.modelValue.recurrenceRule as RecurrenceRuleClientDTO | null)?.frequency ?? RecurrenceFrequency.DAILY),
  set: (value: RecurrenceFrequency) => {
    updateRecurrenceRule({ frequency: value });
  },
});

// 间隔
const interval = computed({
  get: () => ((props.modelValue.recurrenceRule as RecurrenceRuleClientDTO | null)?.interval ?? 1),
  set: (value: number) => {
    updateRecurrenceRule({ interval: value });
  },
});

// 选中的星期
const selectedDays = computed({
  get: () => ((props.modelValue.recurrenceRule as RecurrenceRuleClientDTO | null)?.daysOfWeek ?? []),
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
  return (props.modelValue.recurrenceRule as RecurrenceRuleClientDTO | null)?.recurrenceDisplayText ?? '';
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

<style scoped>
.section-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>

