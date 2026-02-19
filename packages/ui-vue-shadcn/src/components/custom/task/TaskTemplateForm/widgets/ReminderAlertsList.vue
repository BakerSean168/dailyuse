<!-- widgets/ReminderAlertsList.vue -->
<template>
  <div class="reminder-alerts-list">
    <div class="d-flex justify-space-between align-center mb-3">
      <h4>提醒时间</h4>
      <v-btn size="small" color="primary" variant="outlined" @click="addAlert">
        <v-icon start>mdi-plus</v-icon>
        添加提醒
      </v-btn>
    </div>

    <v-card v-for="(alert, index) in localAlerts" :key="alert.id" class="mb-2" variant="outlined">
      <v-card-text class="py-2">
        <v-row align="center">
          <v-col cols="12" md="3">
            <v-select
              v-model="alert.type"
              label="通知方式"
              :items="reminderTypes"
              variant="outlined"
              density="compact"
              item-title="title"
              item-value="value"
              :item-props="getReminderItemProps"
            >
              <!-- 自定义选项显示 -->
              <template #item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  :disabled="item.raw.disabled"
                  :class="{ 'text-grey-400': item.raw.disabled }"
                >
                  <template #title>
                    <div class="d-flex align-center">
                      <span>{{ item.raw.title }}</span>
                      <v-chip
                        v-if="item.raw.disabled"
                        size="x-small"
                        color="warning"
                        variant="outlined"
                        class="ml-2"
                      >
                        未实现
                      </v-chip>
                    </div>
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="alert.timing.type"
              label="提醒时机"
              :items="reminderTimingTypes"
              variant="outlined"
              density="compact"
              item-title="title"
              item-value="value"
            />
          </v-col>

          <v-col cols="12" md="3" v-if="alert.timing.type === 'relative'">
            <v-text-field
              v-model.number="alert.timing.minutesBefore"
              label="提前分钟"
              type="number"
              variant="outlined"
              density="compact"
              min="1"
              max="10080"
              :rules="minutesBeforeRules"
            />
          </v-col>

          <v-col cols="12" md="3" v-else-if="alert.timing.type === 'absolute'">
            <v-text-field
              v-model="absoluteTimeInput"
              label="绝对时间"
              type="time"
              variant="outlined"
              density="compact"
              @update:model-value="(value) => handleAbsoluteTimeChange(value, index)"
            />
          </v-col>

          <v-col cols="12" md="2">
            <v-btn icon variant="text" color="error" size="small" @click="removeAlert(index)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-col>

          <v-col cols="12" v-if="alert.message !== undefined">
            <v-text-field
              v-model="alert.message"
              label="自定义消息"
              variant="outlined"
              density="compact"
              placeholder="留空使用默认消息"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-alert v-if="!isValid && hasErrors" type="error" density="compact" class="mt-2">
      {{ errorMessage }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { v4 as uuidv4 } from 'uuid';

// 本地类型定义
interface ReminderAlert {
  id: string;
  timing: {
    type: 'relative' | 'absolute';
    minutesBefore?: number;
    absoluteTime?: Date;
  };
  type: 'notification' | 'email' | 'sound' | 'sms';
  message?: string;
}

interface Props {
  modelValue: ReminderAlert[];
}

interface Emits {
  (e: 'update:modelValue', value: ReminderAlert[]): void;
  (e: 'update:validation', isValid: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const absoluteTimeInput = ref(new Date());

const localAlerts = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// 表单选项数据
const reminderTimingTypes = [
  { title: '相对时间', value: 'relative' },
  { title: '绝对时间', value: 'absolute' },
];

const reminderTypes = [
  { title: '通知', value: 'notification', disabled: false },
  { title: '邮件', value: 'email', disabled: true },
  { title: '声音', value: 'sound', disabled: true },
  { title: '短信', value: 'sms', disabled: true },
];

// 验证规则
const minutesBeforeRules = [
  (v: number) => !!v || '提前分钟数是必填的',
  (v: number) => v > 0 || '提前分钟数必须大于0',
  (v: number) => v <= 10080 || '提前分钟数不能超过7天(10080分钟)',
];

// 验证状态
const isValid = computed(() => {
  for (const alert of localAlerts.value) {
    if (!alert.type) return false;

    if (!alert.timing || !alert.timing.type) return false;

    if (alert.timing.type === 'relative') {
      if (!alert.timing.minutesBefore || alert.timing.minutesBefore <= 0) {
        return false;
      }
    } else if (alert.timing.type === 'absolute') {
      if (!alert.timing.absoluteTime) return false;
    }
  }
  return true;
});

const hasErrors = computed(() => localAlerts.value.length > 0 && !isValid.value);

const errorMessage = computed(() => {
  if (!hasErrors.value) return '';
  return '请完善所有提醒配置项';
});

// 方法
const getReminderItemProps = (item: any) => {
  return {
    disabled: item.disabled,
    title: item.disabled ? `${item.title} (暂未实现)` : item.title,
  };
};
const handleAbsoluteTimeChange = (timeValue: string, alertIndex: number) => {
  if (!timeValue || alertIndex < 0 || alertIndex >= localAlerts.value.length) return;

  try {
    const [hours, minutes] = timeValue.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn('Invalid time format:', timeValue);
      return;
    }

    // 创建新的 Date，使用当前日期和用户选择的时间
    const now = new Date();
    const absoluteTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

    // 只更新指定的提醒项
    const updatedAlerts = [...localAlerts.value];
    updatedAlerts[alertIndex] = {
      ...updatedAlerts[alertIndex],
      timing: {
        ...updatedAlerts[alertIndex].timing,
        absoluteTime,
      },
    };

    localAlerts.value = updatedAlerts;
  } catch (error) {
    console.error('Error converting absolute time:', error);
  }
};

const addAlert = () => {
  const newAlert: ReminderAlert = {
    id: uuidv4(),
    timing: {
      type: 'relative' as const,
      minutesBefore: 15,
      absoluteTime: undefined,
    },
    type: 'notification' as const,
    message: '',
  };

  const newAlerts = [...localAlerts.value, newAlert];
  localAlerts.value = newAlerts;
};

const removeAlert = (index: number) => {
  if (localAlerts.value.length > index) {
    const newAlerts = [...localAlerts.value];
    newAlerts.splice(index, 1);
    localAlerts.value = newAlerts;
  }
};

// 监听提醒时机类型变化，自动清理数据
watch(
  () => localAlerts.value,
  (alerts) => {
    alerts.forEach((alert) => {
      if (alert.timing.type === 'relative') {
        // 清理绝对时间数据
        alert.timing.absoluteTime = undefined;
        // 确保有默认的提前分钟数
        if (!alert.timing.minutesBefore) {
          alert.timing.minutesBefore = 15;
        }
      } else if (alert.timing.type === 'absolute') {
        // 清理相对时间数据
        alert.timing.minutesBefore = undefined;
        // 确保有默认的绝对时间
        if (!alert.timing.absoluteTime) {
          alert.timing.absoluteTime = new Date();
        }
      }
    });
  },
  { deep: true },
);

// 监听验证状态变化
watch(
  isValid,
  (newValue) => {
    emit('update:validation', newValue);
  },
  { immediate: true },
);
</script>

<style scoped>
.reminder-alerts-list {
  width: 100%;
}
</style>
