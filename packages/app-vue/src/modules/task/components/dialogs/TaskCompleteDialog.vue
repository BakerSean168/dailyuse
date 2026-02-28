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
  <Dialog
    :open="show"
    @update:open="
      (val: boolean) => {
        if (!val) cancel();
      }
    "
  >
    <DialogContent class="max-w-[600px]">
      <DialogHeader class="bg-green-600 -m-6 mb-0 p-4 rounded-t-lg">
        <DialogTitle class="flex items-center text-white">
          <CheckCircle class="h-5 w-5 mr-2 text-white" />
          {{ t('task.complete.title') }}
        </DialogTitle>
      </DialogHeader>

      <div class="pt-4 space-y-4">
        <!-- 任务信息 -->
        <div class="p-3 bg-muted/30 rounded-lg">
          <h3 class="text-lg font-semibold mb-1">{{ taskTitle }}</h3>
          <p class="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar class="h-3 w-3" />
            {{ formatDate(instanceDate) }}
          </p>
        </div>

        <!-- 关联的目标信息 -->
        <Alert v-if="goalBinding" class="border-l-4 border-l-blue-500">
          <AlertDescription>
            <div class="flex flex-col gap-2">
              <div class="flex items-center">
                <Target class="h-4 w-4 mr-2 shrink-0" />
                <strong class="mr-2">{{ t('task.complete.linkedGoal') }}</strong>
                <span>{{ goalBinding.goalTitle }}</span>
              </div>
              <div class="flex items-center">
                <Key class="h-4 w-4 mr-2 shrink-0" />
                <strong class="mr-2">{{ t('task.complete.keyResult') }}</strong>
                <span>{{ goalBinding.keyResultTitle }}</span>
              </div>
              <div class="flex items-center">
                <Calculator class="h-4 w-4 mr-2 shrink-0" />
                <strong class="mr-2">{{ t('task.complete.calcMethod') }}</strong>
                <Badge
                  :class="getAggregationMethodBadgeClass(goalBinding.aggregationMethod)"
                  class="text-xs"
                >
                  {{ getAggregationMethodText(goalBinding.aggregationMethod) }}
                </Badge>
              </div>

              <!-- 当前进度详情 -->
              <Separator class="my-2" />
              <div class="flex flex-col gap-1">
                <div class="flex justify-between items-center">
                  <div class="flex items-center">
                    <CheckCircle class="h-4 w-4 mr-2" />
                    <strong>{{ t('task.complete.currentProgress') }}</strong>
                  </div>
                  <Badge
                    :class="
                      getProgressBadgeClass(goalBinding.currentValue, goalBinding.targetValue)
                    "
                    class="text-xs"
                  >
                    {{ calculatePercentage(goalBinding.currentValue, goalBinding.targetValue) }}%
                  </Badge>
                </div>

                <div class="flex justify-between items-center text-sm">
                  <span class="text-muted-foreground">{{ t('task.complete.currentValue') }}</span>
                  <strong>{{ goalBinding.currentValue }} {{ goalBinding.unit || '' }}</strong>
                </div>

                <div class="flex justify-between items-center text-sm">
                  <span class="text-muted-foreground">{{ t('task.complete.targetValue') }}</span>
                  <strong>{{ goalBinding.targetValue }} {{ goalBinding.unit || '' }}</strong>
                </div>

                <div class="flex justify-between items-center text-sm">
                  <span class="text-muted-foreground">{{ t('task.complete.remaining') }}</span>
                  <strong
                    :class="getRemainingClass(goalBinding.currentValue, goalBinding.targetValue)"
                  >
                    {{ Math.max(0, goalBinding.targetValue - goalBinding.currentValue) }}
                    {{ goalBinding.unit || '' }}
                  </strong>
                </div>

                <!-- 进度条 -->
                <Progress
                  :model-value="
                    calculatePercentage(goalBinding.currentValue, goalBinding.targetValue)
                  "
                  class="mt-2 h-2"
                />
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <!-- 输入本次完成值（仅在有 Goal 绑定时显示） -->
        <div v-if="goalBinding" class="space-y-3">
          <div class="space-y-2">
            <Label :for="'record-value'">{{ getInputLabel(goalBinding.aggregationMethod) }}</Label>
            <div class="relative">
              <div class="absolute left-3 top-1/2 -translate-y-1/2">
                <component
                  :is="getAggregationMethodIconComponent(goalBinding.aggregationMethod)"
                  class="h-4 w-4"
                  :class="
                    recordValue !== null && recordValue > 0
                      ? 'text-green-500'
                      : 'text-muted-foreground'
                  "
                />
              </div>
              <Input
                id="record-value"
                v-model.number="recordValue"
                type="number"
                :step="getInputStep(goalBinding.aggregationMethod)"
                :min="0"
                class="pl-10"
                :class="goalBinding.unit ? 'pr-16' : ''"
                autofocus
              />
              <div
                v-if="goalBinding.unit"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
              >
                {{ goalBinding.unit }}
              </div>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ getInputHint(goalBinding.aggregationMethod) }}
            </p>
          </div>

          <!-- 预测结果 -->
          <Alert
            v-if="recordValue !== null && recordValue > 0"
            class="bg-green-50 border-green-200"
          >
            <AlertDescription>
              <div class="text-xs">
                <strong>{{ t('task.complete.afterCompletion') }}</strong>
                {{ predictProgress() }}
              </div>
            </AlertDescription>
          </Alert>

          <!-- 快捷值（可选） -->
          <div v-if="showQuickValues && quickValues.length > 0">
            <div class="text-xs text-muted-foreground mb-2">
              {{ t('task.complete.quickValues') }}
            </div>
            <div class="flex flex-wrap gap-2">
              <Badge
                v-for="value in quickValues"
                :key="value"
                :variant="recordValue === value ? 'default' : 'outline'"
                class="cursor-pointer text-xs"
                @click="recordValue = value"
              >
                {{ value }} {{ goalBinding.unit || '' }}
              </Badge>
            </div>
          </div>
        </div>

        <!-- 无 Goal 绑定时的提示 -->
        <Alert v-else class="bg-green-50 border-green-200">
          <AlertDescription>
            <div class="text-sm flex items-center gap-1">
              <Info class="h-4 w-4 shrink-0" />
              {{ t('task.complete.noGoalHint') }}
            </div>
          </AlertDescription>
        </Alert>

        <!-- 完成备注（可选） -->
        <div class="space-y-2">
          <Label for="completion-note">{{ t('task.complete.noteOptional') }}</Label>
          <Textarea
            id="completion-note"
            v-model="note"
            :placeholder="t('task.complete.notePlaceholder')"
            :rows="3"
          />
        </div>

        <!-- 实际耗时（可选） -->
        <div class="space-y-2">
          <Label for="duration-input">{{ t('task.complete.actualTimeOptional') }}</Label>
          <div class="relative">
            <div class="absolute left-3 top-1/2 -translate-y-1/2">
              <Clock class="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              id="duration-input"
              v-model.number="duration"
              type="number"
              :min="0"
              :step="5"
              :placeholder="t('task.complete.actualTimePlaceholder')"
              class="pl-10 pr-12"
            />
            <div class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {{ t('task.complete.minuteUnit') }}
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="pt-4">
        <Button variant="ghost" :disabled="isSubmitting" @click="cancel">
          {{ t('task.complete.cancel') }}
        </Button>
        <Button
          :disabled="!isValid || isSubmitting"
          @click="confirm"
          class="bg-green-600 hover:bg-green-700"
        >
          <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-1 animate-spin" />
          <Check v-else class="h-4 w-4 mr-1" />
          {{ t('task.complete.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { format } from 'date-fns';
import { useI18n } from 'vue-i18n';
import {
  AggregationMethod,
  type GoalClientDTO,
  type KeyResultClientDTO,
} from '@dailyuse/contracts/goal';
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
  Label,
  Textarea,
  Separator,
  Progress,
} from '@dailyuse/ui-vue-shadcn';
import {
  CheckCircle,
  Calendar,
  Target,
  Key,
  Calculator,
  Check,
  Info,
  Clock,
  Loader2,
  PlusCircle,
  ArrowUpCircle,
  TrendingUp,
  ArrowDownCircle,
  RefreshCw,
  Hash,
} from 'lucide-vue-next';

const { t } = useI18n();

// ===================== 接口定义 =====================

interface GoalBinding {
  goalId: string;
  goalTitle: string;
  keyResultId: string;
  keyResultTitle: string;
  aggregationMethod: AggregationMethod;
  currentValue: number;
  targetValue: number;
  unit?: string;
}

interface Props {
  taskId: string;
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
    return t('task.complete.amount');
  }

  switch (method) {
    case AggregationMethod.SUM:
      return t('task.complete.amountHintCumulative');
    case AggregationMethod.MAX:
      return t('task.complete.amountHintMax');
    case AggregationMethod.AVERAGE:
      return t('task.complete.amountHintAvg');
    case AggregationMethod.MIN:
      return t('task.complete.amountHintMin');
    case AggregationMethod.LAST:
      return t('task.complete.amountHintLatest');
    default:
      return t('task.complete.amount');
  }
};

// 输入提示
const getInputHint = (method?: AggregationMethod) => {
  if (!props.goalBinding) {
    return t('task.complete.inputPlaceholder');
  }

  const unit = props.goalBinding.unit || t('task.complete.unitFallback');

  switch (method) {
    case AggregationMethod.SUM:
      return t('task.complete.hintSum');
    case AggregationMethod.MAX:
      return t('task.complete.hintMax');
    case AggregationMethod.AVERAGE:
      return t('task.complete.hintAvg');
    case AggregationMethod.MIN:
      return t('task.complete.hintMin');
    case AggregationMethod.LAST:
      return t('task.complete.hintLast');
    default:
      return '';
  }
};

// 步长
const getInputStep = (method?: AggregationMethod) => {
  return 0.01;
};

// 图标组件
const getAggregationMethodIconComponent = (method?: AggregationMethod) => {
  switch (method) {
    case AggregationMethod.SUM:
      return PlusCircle;
    case AggregationMethod.MAX:
      return ArrowUpCircle;
    case AggregationMethod.AVERAGE:
      return TrendingUp;
    case AggregationMethod.MIN:
      return ArrowDownCircle;
    case AggregationMethod.LAST:
      return RefreshCw;
    default:
      return Hash;
  }
};

// Badge class for aggregation method
const getAggregationMethodBadgeClass = (method?: AggregationMethod) => {
  switch (method) {
    case AggregationMethod.SUM:
      return 'bg-blue-100 text-blue-800';
    case AggregationMethod.MAX:
      return 'bg-green-100 text-green-800';
    case AggregationMethod.AVERAGE:
      return 'bg-cyan-100 text-cyan-800';
    case AggregationMethod.MIN:
      return 'bg-yellow-100 text-yellow-800';
    case AggregationMethod.LAST:
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// 文本
const getAggregationMethodText = (method?: AggregationMethod) => {
  switch (method) {
    case AggregationMethod.SUM:
      return t('task.complete.cumulative');
    case AggregationMethod.MAX:
      return t('task.complete.max');
    case AggregationMethod.AVERAGE:
      return t('task.complete.avg');
    case AggregationMethod.MIN:
      return t('task.complete.min');
    case AggregationMethod.LAST:
      return t('task.complete.latest');
    default:
      return t('task.complete.unknown');
  }
};

// 校验
const validateRecordValue = () => {
  if (!props.goalBinding) {
    return true; // 没有绑定目标时不校验
  }

  if (recordValue.value === null || recordValue.value === undefined) {
    return t('task.complete.inputRequired');
  }

  if (recordValue.value < 0) {
    return t('task.complete.negativeError');
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

// 获取进度 Badge 样式
const getProgressBadgeClass = (current: number, target: number) => {
  const percentage = (current / target) * 100;
  if (percentage >= 100) return 'bg-green-100 text-green-800';
  if (percentage >= 70) return 'bg-blue-100 text-blue-800';
  if (percentage >= 40) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

// 获取剩余量的样式类
const getRemainingClass = (current: number, target: number) => {
  const remaining = target - current;
  if (remaining <= 0) return 'text-green-600';
  if (remaining / target <= 0.3) return 'text-blue-600';
  if (remaining / target <= 0.6) return 'text-yellow-600';
  return 'text-red-600';
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
