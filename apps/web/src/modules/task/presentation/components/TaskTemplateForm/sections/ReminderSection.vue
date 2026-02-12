<!--
  ReminderSection.vue
  任务模板提醒配置部分
  使用 TaskReminderConfig.triggers 数组结构
-->
<template>
  <v-card class="mb-4" elevation="0" variant="outlined">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-bell-outline</v-icon>
      提醒设置
      <!-- 验证状态指示器 -->
      <v-icon v-if="!isValid" color="error" class="ml-2">mdi-alert-circle</v-icon>
      <v-icon v-else color="success" class="ml-2">mdi-check-circle</v-icon>
    </v-card-title>
    <v-card-text>
      <!-- 显示验证错误 -->
      <v-alert v-if="errors.length > 0" type="error" variant="tonal" class="mb-4">
        <ul class="mb-0">
          <li v-for="error in errors" :key="error">{{ error }}</li>
        </ul>
      </v-alert>

      <v-row>
        <v-col cols="12">
          <v-switch v-model="reminderEnabled" label="启用提醒" color="primary" />
        </v-col>

        <template v-if="reminderEnabled">
          <!-- 提醒触发器列表 -->
          <v-col cols="12">
            <div class="text-subtitle-2 mb-2">提醒触发器</div>
            <v-card v-for="(trigger, index) in triggers" :key="index" class="mb-3" variant="outlined">
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="4">
                    <v-select v-model="trigger.type" label="提醒类型" :items="reminderTypeOptions" variant="outlined"
                      density="comfortable" @update:model-value="updateTriggers" />
                  </v-col>

                  <!-- 相对时间提醒 -->
                  <template v-if="trigger.type === ReminderType.RELATIVE">
                    <v-col cols="12" md="3">
                      <v-text-field v-model.number="trigger.relativeValue" label="提前时间" type="number" variant="outlined"
                        density="comfortable" min="1" @update:model-value="updateTriggers" />
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-select v-model="trigger.relativeUnit" label="时间单位" :items="timeUnitOptions" variant="outlined"
                        density="comfortable" @update:model-value="updateTriggers" />
                    </v-col>
                  </template>

                  <!-- 绝对时间提醒 -->
                  <template v-if="trigger.type === ReminderType.ABSOLUTE">
                    <v-col cols="12" md="4">
                      <v-text-field :model-value="formatAbsoluteTime(trigger.absoluteTime)" label="提醒时间"
                        type="datetime-local" variant="outlined" density="comfortable"
                        @update:model-value="(val) => updateAbsoluteTime(index, val)" />
                    </v-col>
                  </template>

                  <v-col cols="12" md="2" class="d-flex align-center">
                    <v-btn color="error" variant="text" icon="mdi-delete" @click="removeTrigger(index)" />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <v-btn color="primary" variant="outlined" prepend-icon="mdi-plus" @click="addTrigger">
              添加提醒触发器
            </v-btn>
          </v-col>
        </template>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { TaskTemplate, TaskReminderConfig } from '@dailyuse/task/domain-client';
import { TaskReminderType, ReminderTimeUnit } from '@dailyuse/contracts/task';
import type { TaskReminderConfigClientDTO } from '@dailyuse/contracts/task';

// 类型别名
const ReminderType = TaskReminderType;

interface Props {
  modelValue: TaskTemplate;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplate): void;
  (e: 'update:validation', isValid: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const updateTemplate = (updater: (template: TaskTemplate) => void) => {
  const updatedTemplate = props.modelValue.clone();
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
      const newConfig = TaskReminderConfig.fromClientDTO(newConfigDTO);
      template.updateReminderConfig(newConfig);
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
  const config = props.modelValue.reminderConfig;
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
    const newConfig = TaskReminderConfig.fromClientDTO(newConfigDTO);
    template.updateReminderConfig(newConfig);
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

<style scoped>
.section-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>

