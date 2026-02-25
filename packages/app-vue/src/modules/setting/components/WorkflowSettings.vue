<template>
  <Card>
    <CardHeader>
      <CardTitle>工作流设置</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Auto Save -->
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <Label class="text-base flex items-center">
            <Save class="h-4 w-4 mr-2" />
            自动保存
          </Label>
          <p class="text-sm text-muted-foreground">编辑内容时自动保存更改</p>
        </div>
        <Switch
          :checked="modelValue.autoSave"
          @update:checked="(value) => emit('update:modelValue', { ...modelValue, autoSave: value })"
        />
      </div>

      <!-- Auto Save Interval -->
      <div v-if="modelValue.autoSave" class="space-y-2">
        <Label class="text-sm font-medium flex items-center">
          <Timer class="h-4 w-4 mr-2" />
          自动保存间隔 (秒)
        </Label>
        <div class="flex items-center space-x-4">
          <Slider
            :model-value="[Math.floor((modelValue.autoSaveInterval || 10000) / 1000)]"
            :min="5"
            :max="60"
            :step="5"
            class="flex-1"
            @update:model-value="(value: any) => emit('update:modelValue', { ...modelValue, autoSaveInterval: (value?.[0] ?? 10) * 1000 })"
          />
          <span class="text-sm w-12 text-right">{{ Math.floor((modelValue.autoSaveInterval || 10000) / 1000) }}s</span>
        </div>
      </div>

      <Separator />

      <!-- Confirm Before Delete -->
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <Label class="text-base flex items-center">
            <AlertCircle class="h-4 w-4 mr-2" />
            删除前确认
          </Label>
          <p class="text-sm text-muted-foreground">删除项目前显示确认对话框</p>
        </div>
        <Switch
          :checked="modelValue.confirmBeforeDelete"
          @update:checked="(value) => emit('update:modelValue', { ...modelValue, confirmBeforeDelete: value })"
        />
      </div>

      <Separator />

      <!-- Default Views -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Goal View -->
        <div class="space-y-2">
          <Label for="goal-view-select" class="flex items-center">
            <Target class="h-4 w-4 mr-2" />
            默认目标视图
          </Label>
          <Select
            :model-value="modelValue.defaultGoalView"
            @update:model-value="(value) => emit('update:modelValue', { ...modelValue, defaultGoalView: value })"
          >
            <SelectTrigger id="goal-view-select">
              <SelectValue placeholder="选择视图" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in goalViewOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Schedule View -->
        <div class="space-y-2">
          <Label for="schedule-view-select" class="flex items-center">
            <Calendar class="h-4 w-4 mr-2" />
            默认日程视图
          </Label>
          <Select
            :model-value="modelValue.defaultScheduleView"
            @update:model-value="(value) => emit('update:modelValue', { ...modelValue, defaultScheduleView: value })"
          >
            <SelectTrigger id="schedule-view-select">
              <SelectValue placeholder="选择视图" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in scheduleViewOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Task View -->
        <div class="space-y-2">
          <Label for="task-view-select" class="flex items-center">
            <CheckSquare class="h-4 w-4 mr-2" />
            默认任务视图
          </Label>
          <Select
            :model-value="modelValue.defaultTaskView"
            @update:model-value="(value) => emit('update:modelValue', { ...modelValue, defaultTaskView: value })"
          >
            <SelectTrigger id="task-view-select">
              <SelectValue placeholder="选择视图" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in taskViewOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@dailyuse/ui-vue-shadcn';
import { Switch } from '@dailyuse/ui-vue-shadcn';
import { Slider } from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';
import { Save, Timer, AlertCircle, Target, Calendar, CheckSquare } from 'lucide-vue-next';

interface WorkflowSettings {
  autoSave?: boolean;
  autoSaveInterval?: number;
  confirmBeforeDelete?: boolean;
  defaultGoalView?: string;
  defaultScheduleView?: string;
  defaultTaskView?: string;
}

interface Props {
  modelValue: WorkflowSettings;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: WorkflowSettings];
}>();

const goalViewOptions = [
  { label: '列表视图', value: 'LIST' },
  { label: '看板视图', value: 'KANBAN' },
  { label: '甘特图', value: 'GANTT' },
  { label: '树形视图', value: 'TREE' },
];

const scheduleViewOptions = [
  { label: '日视图', value: 'DAY' },
  { label: '周视图', value: 'WEEK' },
  { label: '月视图', value: 'MONTH' },
  { label: '列表视图', value: 'LIST' },
];

const taskViewOptions = [
  { label: '列表视图', value: 'LIST' },
  { label: '看板视图', value: 'KANBAN' },
  { label: '日历视图', value: 'CALENDAR' },
  { label: '矩阵视图', value: 'MATRIX' },
];
</script>
