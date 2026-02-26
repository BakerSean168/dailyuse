<template>
  <Dialog :open="dialog" @update:open="(v) => (dialog = v)">
    <DialogContent class="max-w-[600px]" @interact-outside.prevent>
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2 text-destructive">
          <AlertCircle class="h-5 w-5" />
          无法创建依赖关系
        </DialogTitle>
      </DialogHeader>

      <div class="pt-4">
        <!-- 循环依赖错误 -->
        <div v-if="error?.code === 'CIRCULAR_DEPENDENCY'" class="mb-4">
          <p class="text-base font-medium mb-3">⚠️ 创建此依赖会形成循环依赖路径：</p>

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
                    循环回到起点
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          <Alert class="mb-0">
            <Info class="h-4 w-4" />
            <AlertDescription>
              <div class="text-sm">
                <strong>建议：</strong>
                <ul class="mt-2 ml-4 list-disc">
                  <li>检查任务之间的逻辑关系</li>
                  <li>考虑拆分复杂任务为多个独立任务</li>
                  <li>使用 DAG 视图可视化依赖关系</li>
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
                详情: {{ JSON.stringify(error.details) }}
              </div>
            </AlertDescription>
          </Alert>

          <!-- 错误代码 -->
          <div class="mt-3">
            <Badge variant="outline"> 错误代码: {{ error?.code }} </Badge>
          </div>
        </div>
      </div>

      <Separator />

      <DialogFooter>
        <Button v-if="showViewGraphButton" variant="ghost" @click="handleViewGraph">
          <Network class="h-4 w-4 mr-1" />
          查看依赖图
        </Button>
        <div class="flex-1" />
        <Button variant="ghost" @click="handleClose"> 关闭 </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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
} from '@dailyuse/ui-vue-shadcn';
import { AlertCircle, CheckCircle, ArrowDown, RefreshCw, Info, Network } from 'lucide-vue-next';
import type { TaskDependencyValidationError, TaskForDAGViewModel } from '../types';

interface Props {
  modelValue: boolean;
  error: TaskDependencyValidationError | null;
  tasks?: TaskForDAGViewModel[];
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'view-graph'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

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
