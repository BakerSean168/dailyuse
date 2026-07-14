<!--
  ReminderSection.vue
  任务模板提醒配置部分
  使用 TaskReminderConfig.triggers 数组结构
-->
<template>
  <Card class="mb-4">
    <CardHeader class="flex flex-row items-center gap-2 pb-2">
      <Bell class="h-5 w-5 text-primary" />
      <CardTitle class="text-primary font-semibold">{{
        t('task.reminderSection.title')
      }}</CardTitle>
      <!-- 验证状态指示器 -->
      <AlertTriangle v-if="!isValid" class="h-5 w-5 ml-2 text-destructive" />
      <CheckCircle v-else class="h-5 w-5 ml-2 text-success" />
    </CardHeader>
    <CardContent>
      <!-- 显示验证错误 -->
      <Alert v-if="errors.length > 0" variant="destructive" class="mb-4">
        <AlertDescription>
          <ul class="mb-0">
            <li v-for="error in errors" :key="error">{{ error }}</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12">
          <div class="flex items-center gap-2">
            <Switch :checked="reminderEnabled" @update:checked="reminderEnabled = $event as boolean" />
            <Label>{{ t('task.reminderSection.enable') }}</Label>
          </div>
        </div>

        <template v-if="reminderEnabled">
          <!-- 提醒触发器列表 -->
          <div class="col-span-12">
            <div class="text-sm font-medium mb-2">{{ t('task.reminderSection.triggers') }}</div>
            <Card v-for="(trigger, index) in triggers" :key="index" class="mb-3">
              <CardContent class="pt-4">
                <div class="grid grid-cols-12 gap-4">
                  <div class="col-span-12 md:col-span-4">
                    <Label class="mb-2 block">{{ t('task.reminderSection.type') }}</Label>
                    <Select
                      :model-value="trigger.type"
                      @update:model-value="
                        (val) => {
                          trigger.type = val as TaskReminderType;
                          updateTriggers();
                        }
                      "
                    >
                      <SelectTrigger>
                        <SelectValue :placeholder="t('task.reminderSection.selectType')" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="opt in reminderTypeOptions"
                          :key="opt.value"
                          :value="opt.value"
                        >
                          {{ opt.title }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <!-- 相对时间提醒 -->
                  <template v-if="trigger.type === ReminderType.Relative">
                    <div class="col-span-12 md:col-span-3">
                      <Label class="mb-2 block">{{ t('task.reminderSection.advanceTime') }}</Label>
                      <Input
                        :model-value="trigger.relativeValue ?? undefined"
                        type="number"
                        min="1"
                        @update:model-value="
                          (val) => {
                            trigger.relativeValue = Number(val);
                            updateTriggers();
                          }
                        "
                      />
                    </div>
                    <div class="col-span-12 md:col-span-3">
                      <Label class="mb-2 block">{{ t('task.reminderSection.timeUnit') }}</Label>
                      <Select
                        :model-value="trigger.relativeUnit ?? undefined"
                        @update:model-value="
                          (val) => {
                            trigger.relativeUnit = val as ReminderTimeUnit;
                            updateTriggers();
                          }
                        "
                      >
                        <SelectTrigger>
                          <SelectValue :placeholder="t('task.reminderSection.selectUnit')" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            v-for="opt in timeUnitOptions"
                            :key="opt.value"
                            :value="opt.value"
                          >
                            {{ opt.title }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </template>

                  <!-- 绝对时间提醒 -->
                  <template v-if="trigger.type === ReminderType.Absolute">
                    <div class="col-span-12 md:col-span-6">
                      <Label class="mb-2 block">{{ t('task.reminderSection.reminderTime') }}</Label>
                      <div class="flex flex-col gap-2">
                        <Popover>
                          <PopoverTrigger as-child>
                            <Button
                              variant="outline"
                              class="w-full justify-start text-left font-normal"
                              :class="{
                                'text-muted-foreground': !getAbsoluteDatePart(trigger.absoluteTime),
                              }"
                            >
                              <CalendarIcon class="mr-2 h-4 w-4" />
                              {{
                                getAbsoluteDatePart(trigger.absoluteTime)
                                  ? formatDisplayDate(getAbsoluteDatePart(trigger.absoluteTime)!)
                                  : t('task.reminderSection.reminderTime')
                              }}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent class="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              :selected="getAbsoluteCalendarDate(trigger.absoluteTime)"
                              @update:model-value="
                                (d: Date | undefined) => handleAbsoluteDateSelect(index, d)
                              "
                            />
                          </PopoverContent>
                        </Popover>
                        <div class="flex gap-2 items-center">
                          <Select
                            :model-value="getAbsoluteHour(trigger.absoluteTime)"
                            @update:model-value="
                              (v) => updateAbsoluteTimePart(index, 'hour', String(v))
                            "
                          >
                            <SelectTrigger class="w-[80px]"
                              ><SelectValue placeholder="HH"
                            /></SelectTrigger>
                            <SelectContent>
                              <SelectItem v-for="h in hourOptions" :key="h" :value="h">{{
                                h
                              }}</SelectItem>
                            </SelectContent>
                          </Select>
                          <span class="font-medium">:</span>
                          <Select
                            :model-value="getAbsoluteMinute(trigger.absoluteTime)"
                            @update:model-value="
                              (v) => updateAbsoluteTimePart(index, 'minute', String(v))
                            "
                          >
                            <SelectTrigger class="w-[80px]"
                              ><SelectValue placeholder="MM"
                            /></SelectTrigger>
                            <SelectContent>
                              <SelectItem v-for="m in minuteOptions" :key="m" :value="m">{{
                                m
                              }}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </template>

                  <div class="col-span-12 md:col-span-2 flex items-center">
                    <Button variant="ghost" size="icon" @click="removeTrigger(index)">
                      <Trash2 class="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" @click="addTrigger">
              <Plus class="h-4 w-4 mr-2" />
              {{ t('task.reminderSection.addTrigger') }}
            </Button>
          </div>
        </template>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { TaskReminderType, ReminderTimeUnit } from '@dailyuse/contracts/task';
import type { TaskReminderConfigDTO } from '@dailyuse/contracts/task';
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
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Calendar,
} from '@dailyuse/ui-vue-shadcn';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Plus,
  Calendar as CalendarIcon,
} from '@lucide/vue';

const { t } = useI18n();

// 类型别名
const ReminderType = TaskReminderType;

// ── Time picker options ────────────────────────────────────────────────
const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// ── Calendar/DateTime helpers ──────────────────────────────────────────

function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Extract date part (YYYY-MM-DD) from a timestamp */
function getAbsoluteDatePart(ts?: number | null): string | null {
  if (!ts) return null;
  return formatDateToYMD(new Date(ts));
}

/** Get hour string from a timestamp */
function getAbsoluteHour(ts?: number | null): string {
  if (!ts) return '00';
  return String(new Date(ts).getHours()).padStart(2, '0');
}

/** Get minute string from a timestamp */
function getAbsoluteMinute(ts?: number | null): string {
  if (!ts) return '00';
  return String(new Date(ts).getMinutes()).padStart(2, '0');
}

/** Get a Date for Calendar :selected from a timestamp */
function getAbsoluteCalendarDate(ts?: number | null): Date | undefined {
  if (!ts) return undefined;
  return new Date(ts);
}

/** Handle calendar date selection for absolute time trigger */
function handleAbsoluteDateSelect(index: number, date: unknown) {
  let dateStr: string;
  if (date instanceof Date) {
    dateStr = formatDateToYMD(date);
  } else if (date && typeof date === 'object' && 'toDate' in date) {
    dateStr = formatDateToYMD((date as { toDate: () => Date }).toDate());
  } else {
    triggers.value[index].absoluteTime = null;
    updateTriggers();
    return;
  }
  const hour = getAbsoluteHour(triggers.value[index].absoluteTime);
  const minute = getAbsoluteMinute(triggers.value[index].absoluteTime);
  triggers.value[index].absoluteTime = new Date(`${dateStr}T${hour}:${minute}:00`).getTime();
  updateTriggers();
}

/** Update hour or minute part of absolute time */
function updateAbsoluteTimePart(index: number, part: 'hour' | 'minute', value: string) {
  const currentTs = triggers.value[index].absoluteTime;
  const datePart = getAbsoluteDatePart(currentTs) || formatDateToYMD(new Date());
  let hour = getAbsoluteHour(currentTs);
  let minute = getAbsoluteMinute(currentTs);
  if (part === 'hour') hour = value;
  if (part === 'minute') minute = value;
  triggers.value[index].absoluteTime = new Date(`${datePart}T${hour}:${minute}:00`).getTime();
  updateTriggers();
}

const props = defineProps<{
  modelValue: TaskTemplateViewModel;
}>();
const emit = defineEmits<{
  'update:modelValue': [value: TaskTemplateViewModel];
  'update:validation': [isValid: boolean];
}>();

const updateTemplate = (updater: (template: TaskTemplateViewModel) => void) => {
  const currentConfig = props.modelValue.reminderConfig as unknown as TaskReminderConfigDTO | null;
  const updatedTemplate: TaskTemplateViewModel = {
    ...props.modelValue,
    reminderConfig: currentConfig
      ? { ...currentConfig }
      : null,
  } as TaskTemplateViewModel;
  updater(updatedTemplate);
  emit('update:modelValue', updatedTemplate);
};

// 提醒类型选项
const reminderTypeOptions = computed(() => [
  { title: t('task.reminderSection.relative'), value: ReminderType.Relative },
  { title: t('task.reminderSection.absolute'), value: ReminderType.Absolute },
]);

// 时间单位选项
const timeUnitOptions = computed(() => [
  { title: t('task.reminderSection.minutes'), value: ReminderTimeUnit.Minutes },
  { title: t('task.reminderSection.hours'), value: ReminderTimeUnit.Hours },
  { title: t('task.reminderSection.days'), value: ReminderTimeUnit.Days },
]);

// 提醒启用状态
const reminderEnabled = computed({
  get: () => (props.modelValue.reminderConfig as unknown as TaskReminderConfigDTO | null)?.enabled ?? false,
  set: (value: boolean) => {
    updateTemplate((template) => {
      const currentConfig = template.reminderConfig as unknown as TaskReminderConfigDTO | null;
      const newConfigDTO: TaskReminderConfigDTO = {
        enabled: value,
        triggers: currentConfig?.triggers ?? [],
      };
      template.reminderConfig = newConfigDTO as unknown as Record<string, unknown>;
    });
  },
});

// 触发器列表
const triggers = ref<
  Array<{
    type: TaskReminderType;
    absoluteTime?: number | null;
    relativeValue?: number | null;
    relativeUnit?: ReminderTimeUnit | null;
  }>
>([]);

// 初始化触发器
const initializeTriggers = () => {
  const config = props.modelValue.reminderConfig as unknown as TaskReminderConfigDTO | null | undefined;
  if (config?.triggers && config.triggers.length > 0) {
    triggers.value = config.triggers.map((t) => ({ ...t }));
  } else if (reminderEnabled.value && triggers.value.length === 0) {
    // 默认添加一个相对时间触发器
    triggers.value = [
      {
        type: ReminderType.Relative,
        relativeValue: 15,
        relativeUnit: ReminderTimeUnit.Minutes,
      },
    ];
  }
};

// 添加触发器
const addTrigger = () => {
  triggers.value.push({
    type: ReminderType.Relative,
    relativeValue: 15,
    relativeUnit: ReminderTimeUnit.Minutes,
  });
  updateTriggers();
};

// 删除触发器
const removeTrigger = (index: number) => {
  triggers.value.splice(index, 1);
  updateTriggers();
};


// 更新触发器到模板
const updateTriggers = () => {
  updateTemplate((template) => {
    const newConfigDTO: TaskReminderConfigDTO = {
      enabled: reminderEnabled.value,
      triggers: triggers.value.map((t) => ({
        type: t.type,
        absoluteTime: t.absoluteTime ?? null,
        relativeValue: t.relativeValue ?? null,
        relativeUnit: t.relativeUnit ?? null,
      })),
    };
    template.reminderConfig = newConfigDTO as unknown as Record<string, unknown>;
  });
};

// 验证
const errors = ref<string[]>([]);

const validateReminderConfig = () => {
  errors.value = [];

  if (reminderEnabled.value) {
    if (triggers.value.length === 0) {
      errors.value.push(t('task.reminderSection.atLeastOneTrigger'));
    }

    triggers.value.forEach((trigger, index) => {
      if (trigger.type === ReminderType.Relative) {
        if (!trigger.relativeValue || trigger.relativeValue < 1) {
          errors.value.push(
            t('task.reminderSection.triggerAdvanceTimePositive', { index: index + 1 }),
          );
        }
        if (!trigger.relativeUnit) {
          errors.value.push(t('task.reminderSection.triggerSelectUnit', { index: index + 1 }));
        }
      } else if (trigger.type === ReminderType.Absolute) {
        if (!trigger.absoluteTime) {
          errors.value.push(t('task.reminderSection.triggerSelectTime', { index: index + 1 }));
        }
      }
    });
  }
};

const isValid = computed(() => {
  validateReminderConfig();
  return errors.value.length === 0;
});

// 监听验证状态变化
watch(
  isValid,
  (newValue) => {
    emit('update:validation', newValue);
  },
  { immediate: true },
);

// 监听启用状态变化
watch(reminderEnabled, (newValue) => {
  if (newValue && triggers.value.length === 0) {
    initializeTriggers();
    updateTriggers();
  }
});

// 初始化
initializeTriggers();
</script>
