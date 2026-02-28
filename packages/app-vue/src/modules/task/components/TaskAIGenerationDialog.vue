<template>
  <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <DialogContent class="max-w-[800px]">
      <DialogHeader>
        <DialogTitle class="text-xl"> ✨ {{ t('task.aiGeneration.title') }} </DialogTitle>
      </DialogHeader>

      <Separator />

      <div class="p-6">
        <div v-if="loading" class="text-center py-8">
          <Loader2 class="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <p class="text-lg font-semibold">
            {{ loadingText || t('task.aiGeneration.generating') }}
          </p>
          <p class="text-xs text-muted-foreground">{{ t('task.aiGeneration.generatingHint') }}</p>
        </div>

        <Alert v-else-if="error" variant="destructive" class="mb-4">
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>

        <div v-else-if="localTasks.length > 0">
          <Alert v-if="!importing" class="mb-4 bg-green-50 border-green-200">
            <AlertDescription class="flex items-center gap-2">
              <CheckCircle class="h-4 w-4 text-green-600" />
              {{ t('task.aiGeneration.generated', { count: localTasks.length }) }}
            </AlertDescription>
          </Alert>

          <div class="space-y-3">
            <div
              v-for="(task, index) in sortedTasks"
              :key="index"
              class="flex items-start gap-3 p-3 rounded-lg border bg-card"
            >
              <Checkbox
                :checked="task.selected"
                @update:checked="task.selected = $event"
                class="mt-1"
              />

              <div class="flex-1 space-y-2">
                <div class="flex items-center gap-2">
                  <Badge :class="getPriorityBadgeClass(task.priority)" class="text-xs">
                    {{ task.priority }}
                  </Badge>
                  <Input v-model="task.title" class="flex-1" />
                </div>

                <div class="flex items-center gap-2">
                  <Clock class="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    v-model.number="task.estimatedHours"
                    type="number"
                    :min="1"
                    :max="40"
                    class="w-20"
                  />
                  <span class="text-xs text-muted-foreground">{{
                    t('task.aiGeneration.hours')
                  }}</span>

                  <Select v-model="task.priority">
                    <SelectTrigger class="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">{{
                        t('task.aiGeneration.priorityHigh')
                      }}</SelectItem>
                      <SelectItem value="normal">{{
                        t('task.aiGeneration.priorityNormal')
                      }}</SelectItem>
                      <SelectItem value="low">{{ t('task.aiGeneration.priorityLow') }}</SelectItem>
                      <SelectItem value="urgent">{{
                        t('task.aiGeneration.priorityUrgent')
                      }}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div v-if="task.description">
                  <Textarea v-model="task.description" :rows="2" />
                </div>
              </div>
            </div>
          </div>

          <Progress v-if="importing" :model-value="importProgress" class="mt-4 h-2" />
        </div>
      </div>

      <Separator />

      <DialogFooter class="px-6 py-4">
        <Button variant="ghost" @click="onCancel" :disabled="importing">{{
          t('task.aiGeneration.cancel')
        }}</Button>
        <Button
          v-if="localTasks.length > 0"
          :disabled="selectedCount === 0 || importing"
          @click="onConfirmImport"
        >
          <Loader2 v-if="importing" class="h-4 w-4 mr-1 animate-spin" />
          {{ t('task.aiGeneration.importSelected') }} ({{ selectedCount }})
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { EditableTaskUI, UIPriority } from './types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Alert,
  AlertDescription,
  Badge,
  Button,
  Input,
  Textarea,
  Separator,
  Progress,
  Checkbox,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@dailyuse/ui-vue-shadcn';
import { Loader2, CheckCircle, Clock } from 'lucide-vue-next';

const props = defineProps<{
  modelValue: boolean;
  loading: boolean;
  loadingText?: string;
  importing: boolean;
  importProgress?: number;
  error?: string | null;
  tasks: EditableTaskUI[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  cancel: [];
  'confirm-import': [tasks: EditableTaskUI[]];
}>();

const localTasks = ref<EditableTaskUI[]>([]);

const { t } = useI18n();

const selectedCount = computed(() => {
  return localTasks.value.filter((task) => task.selected).length;
});

const sortedTasks = computed(() => {
  const priorityOrder: Record<UIPriority, number> = {
    urgent: 0,
    high: 1,
    normal: 2,
    low: 3,
  };
  return [...localTasks.value].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );
});

function getPriorityBadgeClass(priority: string): string {
  switch (priority) {
    case 'urgent':
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'normal':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function onCancel() {
  if (props.importing) return;
  emit('cancel');
  emit('update:modelValue', false);
}

function onConfirmImport() {
  const selected = localTasks.value.filter((task) => task.selected);
  emit('confirm-import', selected);
}

watch(
  () => props.tasks,
  (newTasks) => {
    localTasks.value = newTasks.map((task) => ({ ...task }));
  },
  { immediate: true, deep: true },
);
</script>
