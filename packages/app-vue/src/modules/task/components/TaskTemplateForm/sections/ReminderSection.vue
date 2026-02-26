<!--
  ReminderSection.vue
  任务模板提醒配置部分
  使用 TaskReminderConfig.triggers 数组结构
-->
<template>
  <Card class="mb-4">
    <CardHeader class="flex flex-row items-center gap-2 pb-2">
      <Bell class="h-5 w-5 text-primary" />
      <CardTitle class="text-primary font-semibold">提醒设置</CardTitle>
      <!-- 验证状态指示器 -->
      <AlertTriangle v-if="!isValid" class="h-5 w-5 ml-2 text-destructive" />
      <CheckCircle v-else class="h-5 w-5 ml-2 text-green-500" />
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
            <Switch :checked="reminderEnabled" @update:checked="reminderEnabled = $event" />
            <Label>启用提醒</Label>
          </div>
        </div>

        <template v-if="reminderEnabled">
          <!-- 提醒触发器列表 -->
          <div class="col-span-12">
            <div class="text-sm font-medium mb-2">提醒触发器</div>
            <Card v-for="(trigger, index) in triggers" :key="index" class="mb-3">
              <CardContent class="pt-4">
                <div class="grid grid-cols-12 gap-4">
                  <div class="col-span-12 md:col-span-4">
                    <Label class="mb-2 block">提醒类型</Label>
                    <Select
                      :model-value="trigger.type"
                      @update:model-value="
                        (val) => {
                          trigger.type = val;
                          updateTriggers();
                        }
                      "
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择类型" />
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
                  <template v-if="trigger.type === ReminderType.RELATIVE">
                    <div class="col-span-12 md:col-span-3">
                      <Label class="mb-2 block">提前时间</Label>
                      <Input
                        :model-value="trigger.relativeValue"
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
                      <Label class="mb-2 block">时间单位</Label>
                      <Select
                        :model-value="trigger.relativeUnit"
                        @update:model-value="
                          (val) => {
                            trigger.relativeUnit = val;
                            updateTriggers();
                          }
                        "
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择单位" />
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
                  <template v-if="trigger.type === ReminderType.ABSOLUTE">
                    <div class="col-span-12 md:col-span-4">
                      <Label class="mb-2 block">提醒时间</Label>
                      <Input
                        :model-value="formatAbsoluteTime(trigger.absoluteTime)"
                        type="datetime-local"
                        @update:model-value="(val) => updateAbsoluteTime(index, val)"
                      />
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
              添加提醒触发器
            </Button>
          </div>
        </template>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { TaskReminderType, ReminderTimeUnit } from '@dailyuse/contracts/task';
import type { TaskReminderConfigClientDTO } from '@dailyuse/contracts/task';
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
} from '@dailyuse/ui-vue-shadcn';
import { Bell, AlertTriangle, CheckCircle, Trash2, Plus } from 'lucide-vue-next';

// 类型别名
const ReminderType = TaskReminderType;

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
    reminderConfig: props.modelValue.reminderConfig
      ? ({ ...(props.modelValue.reminderConfig as TaskReminderConfigClientDTO) } as any)
      : null,
  } as TaskTemplateViewModel;
  updater(updatedTemplate);
  emit('update:modelValue', updatedTemplate);
};

// 提醒类型选项
const reminderTypeOptions = [
  { title: '相对时间', value: ReminderType.RELATIVE },
  { title: '绝对时间', value: ReminderType.ABSOLUTE },
];

// 时间单位选项
const timeUnitOptions = [
  { title: '分钟', value: ReminderTimeUnit.MINUTES },
  { title: '小时', value: ReminderTimeUnit.HOURS },
  { title: '天', value: ReminderTimeUnit.DAYS },
];

// 提醒启用状态
const reminderEnabled = computed({
  get: () => props.modelValue.reminderConfig?.enabled ?? false,
  set: (value: boolean) => {
    updateTemplate((template) => {
      const currentConfig = template.reminderConfig;
      const newConfigDTO: TaskReminderConfigClientDTO = {
        enabled: value,
        triggers: currentConfig?.triggers ?? [],
        hasTriggers: (currentConfig?.triggers ?? []).length > 0,
        triggerCount: (currentConfig?.triggers ?? []).length,
        reminderSummary: currentConfig?.reminderSummary ?? '',
        triggerDescriptions: currentConfig?.triggerDescriptions ?? [],
      };
      (template as any).reminderConfig = newConfigDTO;
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
  const config = props.modelValue.reminderConfig as TaskReminderConfigClientDTO | null | undefined;
  if (config?.triggers && config.triggers.length > 0) {
    triggers.value = config.triggers.map((t) => ({ ...t }));
  } else if (reminderEnabled.value && triggers.value.length === 0) {
    // 默认添加一个相对时间触发器
    triggers.value = [
      {
        type: ReminderType.RELATIVE,
        relativeValue: 15,
        relativeUnit: ReminderTimeUnit.MINUTES,
      },
    ];
  }
};

// 添加触发器
const addTrigger = () => {
  triggers.value.push({
    type: ReminderType.RELATIVE,
    relativeValue: 15,
    relativeUnit: ReminderTimeUnit.MINUTES,
  });
  updateTriggers();
};

// 删除触发器
const removeTrigger = (index: number) => {
  triggers.value.splice(index, 1);
  updateTriggers();
};

// 更新绝对时间
const updateAbsoluteTime = (index: number, value: string) => {
  if (value) {
    triggers.value[index].absoluteTime = new Date(value).getTime();
  } else {
    triggers.value[index].absoluteTime = null;
  }
  updateTriggers();
};

// 格式化绝对时间为 datetime-local 格式
const formatAbsoluteTime = (timestamp?: number | null): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// 更新触发器到模板
const updateTriggers = () => {
  updateTemplate((template) => {
    const newConfigDTO: TaskReminderConfigClientDTO = {
      enabled: reminderEnabled.value,
      triggers: triggers.value.map((t) => ({ ...t })),
      hasTriggers: triggers.value.length > 0,
      triggerCount: triggers.value.length,
      reminderSummary: '',
      triggerDescriptions: [],
    };
    (template as any).reminderConfig = newConfigDTO;
  });
};

// 验证
const errors = ref<string[]>([]);

const validateReminderConfig = () => {
  errors.value = [];

  if (reminderEnabled.value) {
    if (triggers.value.length === 0) {
      errors.value.push('启用提醒时，请至少添加一个提醒触发器');
    }

    triggers.value.forEach((trigger, index) => {
      if (trigger.type === ReminderType.RELATIVE) {
        if (!trigger.relativeValue || trigger.relativeValue < 1) {
          errors.value.push(`触发器 ${index + 1}: 提前时间必须大于 0`);
        }
        if (!trigger.relativeUnit) {
          errors.value.push(`触发器 ${index + 1}: 请选择时间单位`);
        }
      } else if (trigger.type === ReminderType.ABSOLUTE) {
        if (!trigger.absoluteTime) {
          errors.value.push(`触发器 ${index + 1}: 请设置提醒时间`);
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
