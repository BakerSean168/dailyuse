<template>
  <Card class="p-6">
    <div class="flex items-center gap-2 mb-6">
      <CalendarPlus class="h-6 w-6" />
      <h2 class="text-2xl font-bold">创建日程 (冲突检测演示)</h2>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- 标题 -->
      <div>
        <Label for="title">日程标题 *</Label>
        <Input
          id="title"
          v-model="form.title"
          placeholder="例如：团队会议"
          required
        />
      </div>

      <!-- 描述 -->
      <div>
        <Label for="description">描述</Label>
        <Textarea
          id="description"
          v-model="form.description"
          placeholder="日程详细说明（可选）"
          rows="3"
        />
      </div>

      <!-- 开始/结束时间 -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label for="startTime">开始时间 *</Label>
          <Input
            id="startTime"
            v-model="startTimeFormatted"
            type="datetime-local"
            required
            @change="handleStartTimeChange"
          />
        </div>
        <div>
          <Label for="endTime">结束时间 *</Label>
          <Input
            id="endTime"
            v-model="endTimeFormatted"
            type="datetime-local"
            required
            @change="handleEndTimeChange"
          />
        </div>
      </div>

      <!-- 时长显示 -->
      <Badge v-if="form.duration > 0" variant="secondary" class="gap-1">
        <Clock class="h-3 w-3" />
        时长: {{ formatDuration(form.duration) }}
      </Badge>

      <!-- 优先级和地点 -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label for="priority">优先级</Label>
          <Select v-model="form.priority">
            <SelectTrigger>
              <SelectValue placeholder="选择优先级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="5">最高</SelectItem>
              <SelectItem :value="4">高</SelectItem>
              <SelectItem :value="3">中</SelectItem>
              <SelectItem :value="2">低</SelectItem>
              <SelectItem :value="1">最低</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label for="location">地点</Label>
          <Input
            id="location"
            v-model="form.location"
            placeholder="例如：会议室A"
          />
        </div>
      </div>

      <!-- Conflict Alert Component Slot -->
      <slot name="conflicts" :conflicts="conflicts" :loading="detectingConflicts" />

      <!-- Actions -->
      <div class="flex justify-between pt-4">
        <Button type="button" variant="outline" @click="handleReset">
          重置
        </Button>
        <Button type="submit" :disabled="!isFormValid || loading">
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          <Check v-else class="mr-2 h-4 w-4" />
          创建日程
        </Button>
      </div>
    </form>
  </Card>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { CalendarPlus, Clock, Check, Loader2 } from 'lucide-vue-next';
import type { ConflictDetectionResult, ConflictSuggestion } from '@dailyuse/contracts/schedule';

interface Props {
  loading?: boolean;
  detectingConflicts?: boolean;
  conflicts?: ConflictDetectionResult | null;
}

interface Emits {
  (e: 'submit', data: any): void;
  (e: 'detect-conflicts', startTime: number, endTime: number): void;
  (e: 'apply-suggestion', suggestion: ConflictSuggestion): void;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  detectingConflicts: false,
  conflicts: null,
});

const emit = defineEmits<Emits>();

const form = reactive({
  title: '',
  description: '',
  startTime: null as number | null,
  endTime: null as number | null,
  duration: 0,
  priority: 3,
  location: '',
});

const startTimeFormatted = ref('');
const endTimeFormatted = ref('');

const isFormValid = computed(() => {
  return form.title && form.startTime && form.endTime && form.endTime > form.startTime;
});

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
}

function handleStartTimeChange(event: Event) {
  const target = event.target as HTMLInputElement;
  form.startTime = new Date(target.value).getTime();
  calculateDuration();
  if (form.startTime && form.endTime) {
    emit('detect-conflicts', form.startTime, form.endTime);
  }
}

function handleEndTimeChange(event: Event) {
  const target = event.target as HTMLInputElement;
  form.endTime = new Date(target.value).getTime();
  calculateDuration();
  if (form.startTime && form.endTime) {
    emit('detect-conflicts', form.startTime, form.endTime);
  }
}

function calculateDuration() {
  if (form.startTime && form.endTime) {
    form.duration = Math.floor((form.endTime - form.startTime) / 60000);
  } else {
    form.duration = 0;
  }
}

function handleSubmit() {
  if (!isFormValid.value) return;
  emit('submit', { ...form });
}

function handleReset() {
  Object.assign(form, {
    title: '',
    description: '',
    startTime: null,
    endTime: null,
    duration: 0,
    priority: 3,
    location: '',
  });
  startTimeFormatted.value = '';
  endTimeFormatted.value = '';
}
</script>
