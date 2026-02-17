<template>
  <TaskAIGenerationDialogView
    :model-value="modelValue"
    :loading="isGenerating"
    :loading-text="isGenerating ? '正在生成任务...' : undefined"
    :importing="importing"
    :import-progress="importProgress"
    :error="error"
    :tasks="generatedTasks"
    @update:model-value="$emit('update:modelValue', $event)"
    @cancel="handleCancel"
    @confirm-import="importSelectedTasks"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAIGeneration } from '@/modules/ai/presentation/composables/useAIGeneration';
import { getTaskTemplateApiClient } from '@dailyuse/task/infrastructure-client';
import { useMessage } from '@dailyuse/ui-vuetify';
import { TaskType, TimeType } from '@dailyuse/contracts/task';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import { TaskAIGenerationDialog as TaskAIGenerationDialogView, type EditableTaskUI } from '@dailyuse/ui-vue-shadcn';

const taskTemplateApiClient = getTaskTemplateApiClient();

const props = defineProps<{
  modelValue: boolean;
  keyResultTitle: string;
  keyResultDescription?: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
  timeRemaining: number;
  goalUuid?: string;
  keyResultUuid?: string;
  accountUuid: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  tasksImported: [count: number];
}>();

const { generateTasks } = useAIGeneration();
const message = useMessage();
const router = useRouter();

const generatedTasks = ref<EditableTaskUI[]>([]);
const isGenerating = ref(false);
const importing = ref(false);
const importProgress = ref(0);
const error = ref<string | null>(null);

async function loadTasks() {
  if (!props.modelValue) return;

  try {
    isGenerating.value = true;
    error.value = null;

    const result = await generateTasks({
      keyResultTitle: props.keyResultTitle,
      keyResultDescription: props.keyResultDescription,
      targetValue: props.targetValue,
      currentValue: props.currentValue,
      unit: props.unit,
      timeRemaining: props.timeRemaining,
    });

    generatedTasks.value = (result.tasks ?? []).map((task: Omit<EditableTaskUI, 'selected'> & Partial<Pick<EditableTaskUI, 'selected'>>) => ({
      ...task,
      selected: task.selected ?? true,
      dependencies: task.dependencies ?? [],
      tags: task.tags ?? [],
    }));

    message.success(`已生成 ${generatedTasks.value.length} 个任务`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '生成任务失败';
    error.value = errorMessage;

    if (errorMessage.includes('429')) {
      message.error('已达到每日配额限制。配额将在明天重置。');
    } else if (errorMessage.includes('504')) {
      message.warning('生成任务超时，请重试');
    } else {
      message.error(errorMessage);
    }
  } finally {
    isGenerating.value = false;
  }
}

async function importSelectedTasks(selectedTasks: EditableTaskUI[]) {
  if (selectedTasks.length === 0) return;

  try {
    importing.value = true;
    importProgress.value = 0;

    const totalTasks = selectedTasks.length;
    let completedCount = 0;
    let failedCount = 0;

    const importPromises = selectedTasks.map(async (task) => {
      try {
        const createRequest = {
          accountUuid: props.accountUuid,
          title: task.title,
          description: task.description || '',
          taskType: TaskType.ONE_TIME,
          timeConfig: {
            timeType: TimeType.TIME_RANGE,
            timeRange: {
              start: Date.now(),
              end: Date.now() + task.estimatedHours * 60 * 60 * 1000,
            },
          },
          importance:
            task.priority === 'urgent'
              ? ImportanceLevel.Vital
              : task.priority === 'high'
                ? ImportanceLevel.Important
                : task.priority === 'normal'
                  ? ImportanceLevel.Moderate
                  : ImportanceLevel.Minor,
          urgency:
            task.priority === 'urgent'
              ? UrgencyLevel.Critical
              : task.priority === 'high'
                ? UrgencyLevel.High
                : task.priority === 'normal'
                  ? UrgencyLevel.Medium
                  : UrgencyLevel.Low,
          goalBinding: props.keyResultUuid
            ? {
                goalUuid: props.goalUuid!,
                keyResultUuid: props.keyResultUuid,
                bindingType: 'CONTRIBUTION' as const,
                incrementValue: 1,
              }
            : undefined,
          tags: task.tags || [],
        };

        await taskTemplateApiClient.createTaskTemplate(createRequest);
      } catch {
        failedCount++;
      } finally {
        completedCount++;
        importProgress.value = (completedCount / totalTasks) * 100;
      }
    });

    await Promise.all(importPromises);

    const successCount = totalTasks - failedCount;

    if (failedCount === 0) {
      message.success(`成功导入 ${successCount} 个任务`);
      emit('tasksImported', successCount);
      emit('update:modelValue', false);

      if (props.goalUuid) {
        router.push(`/goals/${props.goalUuid}/tasks`);
      } else {
        router.push('/tasks');
      }
    } else {
      message.warning(`成功导入 ${successCount} 个任务。${failedCount} 个任务导入失败。`);
      emit('tasksImported', successCount);
    }
  } catch {
    message.error('导入任务时发生错误');
  } finally {
    importing.value = false;
    importProgress.value = 0;
  }
}

function handleCancel() {
  if (!importing.value) {
    emit('update:modelValue', false);
  }
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      generatedTasks.value = [];
      error.value = null;
      importProgress.value = 0;
      loadTasks();
    }
  }
);
</script>
