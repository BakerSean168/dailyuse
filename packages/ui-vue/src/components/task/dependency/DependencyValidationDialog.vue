<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <v-card>
      <v-card-title class="text-h5 error--text d-flex align-center">
        <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
        无法创建依赖关系
      </v-card-title>

      <v-card-text class="pt-4">
        <!-- 循环依赖错误 -->
        <div v-if="error?.code === 'CIRCULAR_DEPENDENCY'" class="mb-4">
          <p class="text-subtitle-1 font-weight-medium mb-3">⚠️ 创建此依赖会形成循环依赖路径：</p>

          <v-card outlined class="pa-3 mb-3" color="error lighten-5">
            <div class="dependency-path">
              <div
                v-for="(taskUuid, index) in cyclePath"
                :key="`${taskUuid}-${index}`"
                class="path-item"
              >
                <div class="d-flex align-center">
                  <v-icon color="primary" class="mr-2">mdi-checkbox-marked-circle</v-icon>
                  <div>
                    <div class="font-weight-medium">
                      {{ getTaskTitle(taskUuid) }}
                    </div>
                    <div class="text-caption text--secondary">{{ taskUuid.slice(0, 8) }}...</div>
                  </div>
                </div>

                <!-- 箭头 -->
                <div v-if="index < cyclePath.length - 1" class="arrow-down">
                  <v-icon color="error">mdi-arrow-down-thick</v-icon>
                </div>

                <!-- 循环标记 -->
                <div v-if="index === cyclePath.length - 1" class="cycle-indicator">
                  <v-chip color="error" small>
                    <v-icon left small>mdi-refresh</v-icon>
                    循环回到起点
                  </v-chip>
                </div>
              </div>
            </div>
          </v-card>

          <v-alert type="info" dense outlined class="mb-0">
            <div class="text-body-2">
              <strong>建议：</strong>
              <ul class="mt-2 ml-4">
                <li>检查任务之间的逻辑关系</li>
                <li>考虑拆分复杂任务为多个独立任务</li>
                <li>使用 DAG 视图可视化依赖关系</li>
              </ul>
            </div>
          </v-alert>
        </div>

        <!-- 其他错误 -->
        <div v-else>
          <v-alert type="error" prominent>
            <div class="text-h6">{{ error?.message }}</div>
            <div v-if="error?.details" class="text-caption mt-2">
              详情: {{ JSON.stringify(error.details) }}
            </div>
          </v-alert>

          <!-- 错误代码 -->
          <div class="mt-3">
            <v-chip small outlined> 错误代码: {{ error?.code }} </v-chip>
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn v-if="showViewGraphButton" color="primary" variant="text" @click="handleViewGraph">
          <v-icon left>mdi-graph-outline</v-icon>
          查看依赖图
        </v-btn>
        <v-spacer />
        <v-btn color="grey" variant="text" @click="handleClose"> 关闭 </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ValidationError } from '@/modules/task/application/services/TaskDependencyValidationService';
import type { TaskForDAG } from '@/modules/task/types/task-dag.types';

interface Props {
  modelValue: boolean;
  error: ValidationError | null;
  tasks?: TaskForDAG[];
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

const getTaskTitle = (taskUuid: string): string => {
  if (!props.tasks) return taskUuid.slice(0, 8) + '...';

  const task = props.tasks.find((t) => t.uuid === taskUuid);
  return task?.title || taskUuid.slice(0, 8) + '...';
};

const handleClose = () => {
  emit('update:modelValue', false);
};

const handleViewGraph = () => {
  emit('view-graph');
  handleClose();
};
</script>

<style scoped>
.dependency-path {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.path-item {
  position: relative;
}

.arrow-down {
  display: flex;
  justify-content: center;
  margin: 4px 0;
}

.cycle-indicator {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}
</style>
