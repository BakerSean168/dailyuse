<!--
  任务完成确认对话框
  
  功能：
  1. 显示任务信息
  2. 显示关联的 Goal/KeyResult 信息
  3. 根据 AggregationMethod 显示不同的输入提示
  4. 用户手动输入 Record 值
  5. 防止误触，提供二次确认
-->
<template>
  <v-dialog v-model="show" max-width="600px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center bg-success">
        <v-icon color="white" class="mr-2">mdi-check-circle</v-icon>
        <span class="text-white">完成任务</span>
      </v-card-title>

      <v-card-text class="pt-4">
        <!-- 任务信息 -->
        <div class="task-info mb-4">
          <h3 class="text-h6 mb-1">{{ taskTitle }}</h3>
          <p class="text-caption text-medium-emphasis">
            <v-icon size="small">mdi-calendar</v-icon>
            {{ formatDate(instanceDate) }}
          </p>
        </div>

        <!-- 关联的目标信息 -->
        <v-alert
          v-if="goalBinding"
          type="info"
          variant="tonal"
          class="mb-4"
          border="start"
          border-color="info"
        >
          <div class="d-flex flex-column gap-2">
            <div class="d-flex align-center">
              <v-icon size="small" class="mr-2">mdi-target</v-icon>
              <strong class="mr-2">关联目标：</strong>
              <span>{{ goalBinding.goalTitle }}</span>
            </div>
            <div class="d-flex align-center">
              <v-icon size="small" class="mr-2">mdi-key</v-icon>
              <strong class="mr-2">关键结果：</strong>
              <span>{{ goalBinding.keyResultTitle }}</span>
            </div>
            <div class="d-flex align-center">
              <v-icon size="small" class="mr-2">mdi-calculator</v-icon>
              <strong class="mr-2">计算方式：</strong>
              <v-chip size="small" :color="getAggregationMethodColor(goalBinding.aggregationMethod)">
                {{ getAggregationMethodText(goalBinding.aggregationMethod) }}
              </v-chip>
            </div>
            
            <!-- 当前进度详情 -->
            <v-divider class="my-2"></v-divider>
            <div class="d-flex flex-column gap-1">
              <div class="d-flex justify-space-between align-center">
                <div class="d-flex align-center">
                  <v-icon size="small" class="mr-2">mdi-progress-check</v-icon>
                  <strong>当前进度</strong>
                </div>
                <v-chip size="small" :color="getProgressColor(goalBinding.currentValue, goalBinding.targetValue)">
                  {{ calculatePercentage(goalBinding.currentValue, goalBinding.targetValue) }}%
                </v-chip>
              </div>
              
              <div class="d-flex justify-space-between align-center text-body-2">
                <span class="text-medium-emphasis">当前值：</span>
                <strong>{{ goalBinding.currentValue }} {{ goalBinding.unit || '' }}</strong>
              </div>
              
              <div class="d-flex justify-space-between align-center text-body-2">
                <span class="text-medium-emphasis">目标值：</span>
                <strong>{{ goalBinding.targetValue }} {{ goalBinding.unit || '' }}</strong>
              </div>
              
              <div class="d-flex justify-space-between align-center text-body-2">
                <span class="text-medium-emphasis">还需完成：</span>
                <strong :class="getRemainingClass(goalBinding.currentValue, goalBinding.targetValue)">
                  {{ Math.max(0, goalBinding.targetValue - goalBinding.currentValue) }} {{ goalBinding.unit || '' }}
                </strong>
              </div>
              
              <!-- 进度条 -->
              <v-progress-linear
                :model-value="calculatePercentage(goalBinding.currentValue, goalBinding.targetValue)"
                :color="getProgressColor(goalBinding.currentValue, goalBinding.targetValue)"
                height="8"
                rounded
                class="mt-2"
              ></v-progress-linear>
            </div>
          </div>
        </v-alert>

        <!-- 输入本次完成值（仅在有 Goal 绑定时显示） -->
        <div v-if="goalBinding">
          <v-text-field
            v-model.number="recordValue"
            :label="getInputLabel(goalBinding.aggregationMethod)"
            :hint="getInputHint(goalBinding.aggregationMethod)"
            :persistent-hint="true"
            type="number"
            :step="getInputStep(goalBinding.aggregationMethod)"
            :min="0"
            :rules="[validateRecordValue]"
            autofocus
            variant="outlined"
            color="success"
            class="mb-2"
          >
            <template #prepend-inner>
              <v-icon :color="recordValue !== null && recordValue > 0 ? 'success' : 'grey'">
                {{ getAggregationMethodIcon(goalBinding.aggregationMethod) }}
              </v-icon>
            </template>
            <template #append-inner v-if="goalBinding.unit">
              <span class="text-caption text-medium-emphasis">{{ goalBinding.unit }}</span>
            </template>
          </v-text-field>

          <!-- 预测结果 -->
          <v-alert
            v-if="recordValue !== null && recordValue > 0"
            type="success"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            <div class="text-caption">
              <strong>完成后预计：</strong>
              {{ predictProgress() }}
            </div>
          </v-alert>

          <!-- 快捷值（可选） -->
          <div v-if="showQuickValues && quickValues.length > 0" class="mb-4">
            <div class="text-caption text-medium-emphasis mb-2">快捷值：</div>
            <div class="d-flex flex-wrap gap-2">
              <v-chip
                v-for="value in quickValues"
                :key="value"
                size="small"
                :color="recordValue === value ? 'primary' : 'default'"
                :variant="recordValue === value ? 'elevated' : 'outlined'"
                @click="recordValue = value"
              >
                {{ value }} {{ goalBinding.unit || '' }}
              </v-chip>
            </div>
          </div>
        </div>

        <!-- 无 Goal 绑定时的提示 -->
        <v-alert
          v-else
          type="success"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          <div class="text-body-2">
            <v-icon size="small" class="mr-1">mdi-information</v-icon>
            此任务未关联目标，点击确认后将直接完成。
          </div>
        </v-alert>

        <!-- 完成备注（可选） -->
        <v-textarea
          v-model="note"
          label="完成备注（可选）"
          placeholder="记录本次完成的情况..."
          rows="3"
          variant="outlined"
          class="mb-2"
        >
          <template #prepend-inner>
            <v-icon size="small">mdi-note-text</v-icon>
          </template>
        </v-textarea>

        <!-- 实际耗时（可选） -->
        <v-text-field
          v-model.number="duration"
          label="实际耗时（可选）"
          hint="记录实际花费的时间（分钟）"
          type="number"
          :min="0"
          :step="5"
          variant="outlined"
          clearable
        >
          <template #prepend-inner>
            <v-icon size="small">mdi-clock-outline</v-icon>
          </template>
          <template #append-inner>
            <span class="text-caption text-medium-emphasis">分钟</span>
          </template>
        </v-text-field>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="isSubmitting" @click="cancel">
          取消
        </v-btn>
        <v-btn
          color="success"
          variant="elevated"
          :disabled="!isValid || isSubmitting"
          :loading="isSubmitting"
          @click="confirm"
        >
          <v-icon start>mdi-check</v-icon>
          确认完成
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { format } from 'date-fns';
import { AggregationMethod, type GoalClientDTO, type KeyResultClientDTO } from '@dailyuse/contracts/goal';

// ===================== 接口定义 =====================

interface GoalBinding {
  goalUuid: string;
  goalTitle: string;
  keyResultUuid: string;
  keyResultTitle: string;
  aggregationMethod: AggregationMethod;
  currentValue: number;
  targetValue: number;
  unit?: string;
}

interface Props {
  taskUuid: string;
  taskTitle: string;
  instanceDate: number | Date;
  goalBinding?: GoalBinding;
  showQuickValues?: boolean;
}

interface CompleteTaskData {
  recordValue?: number;
  note?: string;
  duration?: number;
}

const props = withDefaults(defineProps<Props>(), {
  showQuickValues: true,
});

const emit = defineEmits<{
  confirm: [data: CompleteTaskData];
  cancel: [];
}>();

// ===================== 响应式数据 =====================

const show = ref(true);
const recordValue = ref<number | null>(null);
const note = ref('');
const duration = ref<number | null>(null);
const isSubmitting = ref(false);

// ===================== 计算属性 =====================

// 根据历史数据或默认值生成快捷值
const quickValues = computed(() => {
  if (!props.goalBinding) return [];

  const { aggregationMethod, targetValue, currentValue } = props.goalBinding;

  switch (aggregationMethod) {
    case AggregationMethod.SUM:
      // 累加型：建议常用的增量值
      return [1, 5, 10, 20, 50];

    case AggregationMethod.MAX:
      // 最大值：建议接近目标的值
      const remaining = targetValue - currentValue;
      return [
        Math.floor(remaining * 0.5),
        Math.floor(remaining * 0.7),
        Math.floor(remaining * 0.9),
        remaining,
        targetValue,
      ].filter((v) => v > 0);

    case AggregationMethod.AVERAGE:
      // 平均值：建议目标值附近的值
      return [
        Math.floor(targetValue * 0.8),
        Math.floor(targetValue * 0.9),
        targetValue,
        Math.floor(targetValue * 1.1),
        Math.floor(targetValue * 1.2),
      ].filter((v) => v > 0);

    default:
      return [];
  }
});

// 根据 AggregationMethod 返回不同的标签
const getInputLabel = (method?: AggregationMethod) => {
  if (!props.goalBinding) {
    return '本次完成量';
  }

  switch (method) {
    case AggregationMethod.SUM:
      return '本次完成量（将累加到当前进度）';
    case AggregationMethod.MAX:
      return '本次达到的最高值';
    case AggregationMethod.AVERAGE:
      return '本次的值（将计算平均值）';
    case AggregationMethod.MIN:
      return '本次的最小值';
    case AggregationMethod.LAST:
      return '最新的值（将覆盖当前值）';
    default:
      return '本次完成量';
  }
};

// 输入提示
const getInputHint = (method?: AggregationMethod) => {
  if (!props.goalBinding) {
    return '请输入本次完成的数量';
  }

  const unit = props.goalBinding.unit || '单位';

  switch (method) {
    case AggregationMethod.SUM:
      return `例如：跑步 5 公里，输入 5`;
    case AggregationMethod.MAX:
      return `例如：考试分数 85 分，输入 85`;
    case AggregationMethod.AVERAGE:
      return `例如：每日学习 2 小时，输入 2`;
    case AggregationMethod.MIN:
      return `输入本次的最小值`;
    case AggregationMethod.LAST:
      return `输入最新的值`;
    default:
      return '';
  }
};

// 步长
const getInputStep = (method?: AggregationMethod) => {
  return 0.01;
};

// 图标
const getAggregationMethodIcon = (method?: AggregationMethod) => {
  switch (method) {
    case AggregationMethod.SUM:
      return 'mdi-plus-circle';
    case AggregationMethod.MAX:
      return 'mdi-arrow-up-circle';
    case AggregationMethod.AVERAGE:
      return 'mdi-chart-line';
    case AggregationMethod.MIN:
      return 'mdi-arrow-down-circle';
    case AggregationMethod.LAST:
      return 'mdi-update';
    default:
      return 'mdi-numeric';
  }
};

// 颜色
const getAggregationMethodColor = (method?: AggregationMethod) => {
  switch (method) {
    case AggregationMethod.SUM:
      return 'primary';
    case AggregationMethod.MAX:
      return 'success';
    case AggregationMethod.AVERAGE:
      return 'info';
    case AggregationMethod.MIN:
      return 'warning';
    case AggregationMethod.LAST:
      return 'secondary';
    default:
      return 'grey';
  }
};

// 文本
const getAggregationMethodText = (method?: AggregationMethod) => {
  switch (method) {
    case AggregationMethod.SUM:
      return '累加型';
    case AggregationMethod.MAX:
      return '最大值';
    case AggregationMethod.AVERAGE:
      return '平均值';
    case AggregationMethod.MIN:
      return '最小值';
    case AggregationMethod.LAST:
      return '最新值';
    default:
      return '未知';
  }
};

// 校验
const validateRecordValue = () => {
  if (!props.goalBinding) {
    return true; // 没有绑定目标时不校验
  }

  if (recordValue.value === null || recordValue.value === undefined) {
    return '请输入完成值';
  }

  if (recordValue.value < 0) {
    return '值不能为负数';
  }

  return true;
};

const isValid = computed(() => {
  if (props.goalBinding) {
    // 有目标绑定时必须输入值
    return validateRecordValue() === true && recordValue.value !== null && recordValue.value > 0;
  }
  // 没有目标绑定时可以直接完成
  return true;
});

// 预测完成后的进度
const predictProgress = () => {
  if (!props.goalBinding || !recordValue.value) return '';

  const { aggregationMethod, currentValue, targetValue, unit } = props.goalBinding;
  let predictedValue = currentValue;

  switch (aggregationMethod) {
    case AggregationMethod.SUM:
      predictedValue = currentValue + recordValue.value;
      break;
    case AggregationMethod.MAX:
      predictedValue = Math.max(currentValue, recordValue.value);
      break;
    case AggregationMethod.LAST:
      predictedValue = recordValue.value;
      break;
    case AggregationMethod.AVERAGE:
      // 简化：假设只有一个记录，实际应该从后端获取记录数
      predictedValue = (currentValue + recordValue.value) / 2;
      break;
    default:
      predictedValue = currentValue + recordValue.value;
  }

  const percentage = calculatePercentage(predictedValue, targetValue);

  return `${predictedValue} / ${targetValue} ${unit || ''} (${percentage}%)`;
};

// 计算百分比
const calculatePercentage = (current: number, target: number) => {
  if (target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
};

// 获取进度颜色
const getProgressColor = (current: number, target: number) => {
  const percentage = (current / target) * 100;
  if (percentage >= 100) return 'success';
  if (percentage >= 70) return 'info';
  if (percentage >= 40) return 'warning';
  return 'error';
};

// 获取剩余量的样式类
const getRemainingClass = (current: number, target: number) => {
  const remaining = target - current;
  if (remaining <= 0) return 'text-success';
  if (remaining / target <= 0.3) return 'text-info';
  if (remaining / target <= 0.6) return 'text-warning';
  return 'text-error';
};

// 格式化日期
const formatDate = (date: number | Date) => {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  return format(dateObj, 'yyyy-MM-dd EEEE');
};

// ===================== 事件处理 =====================

const confirm = () => {
  if (!isValid.value || isSubmitting.value) return;
  
  isSubmitting.value = true;
  
  const data: CompleteTaskData = {
    note: note.value || undefined,
    duration: duration.value || undefined,
  };

  // 只有在有目标绑定且用户输入了值时才传递 recordValue
  if (props.goalBinding && recordValue.value !== null && recordValue.value > 0) {
    data.recordValue = recordValue.value;
  }

  emit('confirm', data);
  show.value = false;
};

const cancel = () => {
  emit('cancel');
  show.value = false;
};
</script>

<style scoped>
.task-info {
  padding: 12px;
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
}

.task-info h3 {
  font-weight: 500;
}

:deep(.v-alert) {
  font-size: 0.875rem;
}

:deep(.v-chip) {
  font-weight: 500;
}
</style>

