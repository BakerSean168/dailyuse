<!-- widgets/ReminderSnoozeSettings.vue -->
<template>
  <div class="reminder-snooze-settings">
    <v-row>
      <v-col cols="12">
        <v-switch v-model="localSnooze.enabled" label="允许稍后提醒" color="primary" />
      </v-col>

      <template v-if="localSnooze.enabled">
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="localSnooze.interval"
            label="稍后提醒间隔（分钟）"
            type="number"
            variant="outlined"
            min="1"
            max="60"
            :rules="intervalRules"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="localSnooze.maxCount"
            label="最大重复次数"
            type="number"
            variant="outlined"
            min="1"
            max="10"
            :rules="maxCountRules"
          />
        </v-col>

        <v-col cols="12">
          <v-alert type="info" density="compact" variant="tonal">
            <v-icon start>mdi-information-outline</v-icon>
            稍后提醒功能允许用户在收到任务提醒时选择推迟提醒，系统会在设定的间隔时间后再次提醒
          </v-alert>
        </v-col>
      </template>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

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

// 验证规则
const intervalRules = [
  (v: number) => !!v || '间隔时间是必填的',
  (v: number) => v > 0 || '间隔时间必须大于0分钟',
  (v: number) => v <= 60 || '间隔时间不能超过60分钟',
];

const maxCountRules = [
  (v: number) => !!v || '最大次数是必填的',
  (v: number) => v > 0 || '最大次数必须大于0',
  (v: number) => v <= 10 || '最大次数不能超过10次',
];
</script>

<style scoped>
.reminder-snooze-settings {
  width: 100%;
}
</style>
