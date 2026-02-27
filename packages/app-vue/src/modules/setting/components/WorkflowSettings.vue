<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t('setting.workflow.title') }}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Auto Save -->
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <Label class="text-base flex items-center">
            <Save class="h-4 w-4 mr-2" />
            {{ t('setting.workflow.autoSave') }}
          </Label>
          <p class="text-sm text-muted-foreground">
            {{ t('setting.workflow.autoSaveDescription') }}
          </p>
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
          {{ t('setting.workflow.autoSaveInterval') }}
        </Label>
        <div class="flex items-center space-x-4">
          <Slider
            :model-value="[Math.floor((modelValue.autoSaveInterval || 10000) / 1000)]"
            :min="5"
            :max="60"
            :step="5"
            class="flex-1"
            @update:model-value="
              (value: any) =>
                emit('update:modelValue', {
                  ...modelValue,
                  autoSaveInterval: (value?.[0] ?? 10) * 1000,
                })
            "
          />
          <span class="text-sm w-12 text-right"
            >{{ Math.floor((modelValue.autoSaveInterval || 10000) / 1000) }}s</span
          >
        </div>
      </div>

      <Separator />

      <!-- Confirm Before Delete -->
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <Label class="text-base flex items-center">
            <AlertCircle class="h-4 w-4 mr-2" />
            {{ t('setting.workflow.confirmBeforeDelete') }}
          </Label>
          <p class="text-sm text-muted-foreground">
            {{ t('setting.workflow.confirmBeforeDeleteDescription') }}
          </p>
        </div>
        <Switch
          :checked="modelValue.confirmBeforeDelete"
          @update:checked="
            (value) => emit('update:modelValue', { ...modelValue, confirmBeforeDelete: value })
          "
        />
      </div>

      <Separator />

      <!-- Default Views -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Goal View -->
        <div class="space-y-2">
          <Label for="goal-view-select" class="flex items-center">
            <Target class="h-4 w-4 mr-2" />
            {{ t('setting.workflow.defaultGoalView') }}
          </Label>
          <Select
            :model-value="modelValue.defaultGoalView"
            @update:model-value="
              (value) => emit('update:modelValue', { ...modelValue, defaultGoalView: value })
            "
          >
            <SelectTrigger id="goal-view-select">
              <SelectValue :placeholder="t('setting.workflow.viewPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in goalViewOpts" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Schedule View -->
        <div class="space-y-2">
          <Label for="schedule-view-select" class="flex items-center">
            <Calendar class="h-4 w-4 mr-2" />
            {{ t('setting.workflow.defaultScheduleView') }}
          </Label>
          <Select
            :model-value="modelValue.defaultScheduleView"
            @update:model-value="
              (value) => emit('update:modelValue', { ...modelValue, defaultScheduleView: value })
            "
          >
            <SelectTrigger id="schedule-view-select">
              <SelectValue :placeholder="t('setting.workflow.viewPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in scheduleViewOpts"
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
            {{ t('setting.workflow.defaultTaskView') }}
          </Label>
          <Select
            :model-value="modelValue.defaultTaskView"
            @update:model-value="
              (value) => emit('update:modelValue', { ...modelValue, defaultTaskView: value })
            "
          >
            <SelectTrigger id="task-view-select">
              <SelectValue :placeholder="t('setting.workflow.viewPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in taskViewOpts" :key="option.value" :value="option.value">
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
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dailyuse/ui-vue-shadcn';
import { Switch } from '@dailyuse/ui-vue-shadcn';
import { Slider } from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';
import { Save, Timer, AlertCircle, Target, Calendar, CheckSquare } from 'lucide-vue-next';

const { t } = useI18n();

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

const goalViewOpts = computed(() => [
  { label: t('setting.workflow.listView'), value: 'LIST' },
  { label: t('setting.workflow.kanbanView'), value: 'KANBAN' },
  { label: t('setting.workflow.ganttView'), value: 'GANTT' },
  { label: t('setting.workflow.treeView'), value: 'TREE' },
]);

const scheduleViewOpts = computed(() => [
  { label: t('setting.workflow.dayView'), value: 'DAY' },
  { label: t('setting.workflow.weekView'), value: 'WEEK' },
  { label: t('setting.workflow.monthView'), value: 'MONTH' },
  { label: t('setting.workflow.listView'), value: 'LIST' },
]);

const taskViewOpts = computed(() => [
  { label: t('setting.workflow.listView'), value: 'LIST' },
  { label: t('setting.workflow.kanbanView'), value: 'KANBAN' },
  { label: t('setting.workflow.calendarView'), value: 'CALENDAR' },
  { label: t('setting.workflow.matrixView'), value: 'MATRIX' },
]);
</script>
