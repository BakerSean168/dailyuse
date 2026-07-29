<template>
  <Dialog :open="dialog" @update:open="(v) => (dialog = v)">
    <DialogContent class="max-w-[600px]" @interact-outside.prevent>
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2 text-destructive">
          <AlertCircle class="h-5 w-5" />
          {{ t('task.depValidation.cannotCreate') }}
        </DialogTitle>
      </DialogHeader>

      <div class="pt-4">
        <!-- 循环依赖错误 -->
        <div v-if="error?.code === 'CIRCULAR_DEPENDENCY'" class="mb-4">
          <p class="text-base font-medium mb-3">⚠️ {{ t('task.depValidation.cyclicPath') }}</p>

          <Card class="p-3 mb-3 border-destructive/30 bg-destructive/5">
            <div class="flex flex-col gap-2">
              <div
                v-for="(taskId, index) in cyclePath"
                :key="`${taskId}-${index}`"
                class="relative"
              >
                <div class="flex items-center">
                  <CheckCircle class="h-5 w-5 text-primary mr-2 shrink-0" />
                  <div>
                    <div class="font-medium">
                      {{ getTaskTitle(taskId) }}
                    </div>
                    <div class="text-xs text-muted-foreground">{{ taskId.slice(0, 8) }}...</div>
                  </div>
                </div>

                <!-- 箭头 -->
                <div v-if="index < cyclePath.length - 1" class="flex justify-center my-1">
                  <ArrowDown class="h-5 w-5 text-destructive" />
                </div>

                <!-- 循环标记 -->
                <div v-if="index === cyclePath.length - 1" class="flex justify-center mt-2">
                  <Badge variant="destructive">
                    <RefreshCw class="h-3 w-3 mr-1" />
                    {{ t('task.depValidation.backToStart') }}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          <Alert class="mb-0">
            <Info class="h-4 w-4" />
            <AlertDescription>
              <div class="text-sm">
                <strong>{{ t('task.depValidation.suggestions') }}</strong>
                <ul class="mt-2 ml-4 list-disc">
                  <li>{{ t('task.depValidation.suggestion1') }}</li>
                  <li>{{ t('task.depValidation.suggestion2') }}</li>
                  <li>{{ t('task.depValidation.suggestion3') }}</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <!-- 其他错误 -->
        <div v-else>
          <Alert variant="destructive">
            <AlertDescription>
              <div class="text-lg font-semibold">{{ error?.message }}</div>
              <div v-if="error?.details" class="text-xs mt-2">
                {{ t('task.depValidation.details') }} {{ JSON.stringify(error.details) }}
              </div>
            </AlertDescription>
          </Alert>

          <!-- 错误代码 -->
          <div class="mt-3">
            <Badge variant="outline">
              {{ t('task.depValidation.errorCode') }} {{ error?.code }}
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      <DialogFooter>
        <Button v-if="showViewGraphButton" variant="ghost" @click="handleViewGraph">
          <Network class="h-4 w-4 mr-1" />
          {{ t('task.depValidation.viewGraph') }}
        </Button>
        <div class="flex-1" />
        <Button variant="ghost" @click="handleClose"> {{ t('task.depValidation.close') }} </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Card,
  Button,
  Badge,
  Alert,
  AlertDescription,
  Separator,
} from '@memoflow/ui-vue-shadcn';
import { AlertCircle, CheckCircle, ArrowDown, RefreshCw, Info, Network } from '@lucide/vue';
import type { TaskDependencyValidationError } from '../types';
import type { TaskForDAG } from '../../types/task-dag.types';

const props = defineProps<{
  modelValue: boolean;
  error: TaskDependencyValidationError | null;
  tasks?: TaskForDAG[];
}>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'view-graph': [];
}>();

const { t } = useI18n();

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const cyclePath = computed(() => {
  if (props.error?.code === 'CIRCULAR_DEPENDENCY' && props.error?.details?.cyclePath) {
    return props.error.details.cyclePath as string[];
  }
  return [];
});

const showViewGraphButton = computed(() => {
  return props.error?.code === 'CIRCULAR_DEPENDENCY';
});

const getTaskTitle = (taskId: string): string => {
  if (!props.tasks) return taskId.slice(0, 8) + '...';

  const task = props.tasks.find((t) => t.id === taskId);
  return task?.title || taskId.slice(0, 8) + '...';
};

const handleClose = () => {
  emit('update:modelValue', false);
};

const handleViewGraph = () => {
  emit('view-graph');
  handleClose();
};
</script>
