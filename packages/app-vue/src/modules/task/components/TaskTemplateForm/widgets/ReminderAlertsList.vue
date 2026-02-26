<!-- widgets/ReminderAlertsList.vue -->
<template>
  <div class="w-full">
    <div class="flex justify-between items-center mb-3">
      <h4>提醒时间</h4>
      <Button variant="outline" size="sm" @click="addAlert">
        <Plus class="h-4 w-4 mr-1" />
        添加提醒
      </Button>
    </div>

    <Card v-for="(alert, index) in localAlerts" :key="alert.id" class="mb-2">
      <CardContent class="py-3">
        <div class="grid grid-cols-12 gap-4 items-center">
          <div class="col-span-12 md:col-span-3">
            <Label class="mb-1.5 block">通知方式</Label>
            <Select v-model="alert.type">
              <SelectTrigger>
                <SelectValue placeholder="选择通知方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="item in reminderTypes"
                  :key="item.value"
                  :value="item.value"
                  :disabled="item.disabled"
                >
                  <div class="flex items-center">
                    <span>{{ item.title }}</span>
                    <Badge v-if="item.disabled" variant="outline" class="ml-2 text-xs">
                      未实现
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="col-span-12 md:col-span-3">
            <Label class="mb-1.5 block">提醒时机</Label>
            <Select v-model="alert.timing.type">
              <SelectTrigger>
                <SelectValue placeholder="选择时机" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="item in reminderTimingTypes"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.title }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div v-if="alert.timing.type === 'relative'" class="col-span-12 md:col-span-3">
            <Label class="mb-1.5 block">提前分钟</Label>
            <Input v-model.number="alert.timing.minutesBefore" type="number" min="1" max="10080" />
          </div>

          <div v-else-if="alert.timing.type === 'absolute'" class="col-span-12 md:col-span-3">
            <Label class="mb-1.5 block">绝对时间</Label>
            <Input
              :model-value="absoluteTimeInput"
              type="time"
              @update:model-value="(value: any) => handleAbsoluteTimeChange(value, index)"
            />
          </div>

          <div class="col-span-12 md:col-span-2 flex items-end">
            <Button
              variant="ghost"
              size="icon"
              class="text-destructive"
              @click="removeAlert(index)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>

          <div v-if="alert.message !== undefined" class="col-span-12">
            <Label class="mb-1.5 block">自定义消息</Label>
            <Input v-model="alert.message" placeholder="留空使用默认消息" />
          </div>
        </div>
      </CardContent>
    </Card>

    <Alert v-if="!isValid && hasErrors" variant="destructive" class="mt-2">
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Alert,
  AlertDescription,
} from '@dailyuse/ui-vue-shadcn';
import { Plus, Trash2 } from 'lucide-vue-next';

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
