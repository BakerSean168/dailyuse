<!-- widgets/ReminderSnoozeSettings.vue -->
<template>
  <div class="w-full">
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12">
        <div class="flex items-center gap-2">
          <Switch :checked="localSnooze.enabled" @update:checked="updateEnabled" />
          <Label>允许稍后提醒</Label>
        </div>
      </div>

      <template v-if="localSnooze.enabled">
        <div class="col-span-12 md:col-span-6">
          <Label>稍后提醒间隔（分钟）</Label>
          <Input
            :model-value="localSnooze.interval"
            @update:model-value="updateInterval"
            type="number"
            min="1"
            max="60"
            class="mt-1"
          />
        </div>

        <div class="col-span-12 md:col-span-6">
          <Label>最大重复次数</Label>
          <Input
            :model-value="localSnooze.maxCount"
            @update:model-value="updateMaxCount"
            type="number"
            min="1"
            max="10"
            class="mt-1"
          />
        </div>

        <div class="col-span-12">
          <Alert>
            <Info class="h-4 w-4" />
            <AlertDescription>
              稍后提醒功能允许用户在收到任务提醒时选择推迟提醒，系统会在设定的间隔时间后再次提醒
            </AlertDescription>
          </Alert>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Switch, Label, Input, Alert, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import { Info } from 'lucide-vue-next';

// 本地 SnoozeConfig 类型定义 (此功能可能尚未实现)
interface SnoozeConfig {
  enabled: boolean;
  interval: number;
  maxCount: number;
}

interface Props {
  modelValue: SnoozeConfig;
}

interface Emits {
  (e: 'update:modelValue', value: SnoozeConfig): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localSnooze = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const updateEnabled = (value: boolean) => {
  emit('update:modelValue', { ...props.modelValue, enabled: value });
};

const updateInterval = (value: string | number) => {
  emit('update:modelValue', { ...props.modelValue, interval: Number(value) });
};

const updateMaxCount = (value: string | number) => {
  emit('update:modelValue', { ...props.modelValue, maxCount: Number(value) });
};
</script>
