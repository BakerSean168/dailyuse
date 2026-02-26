<template>
  <Dialog :open="visible" @update:open="(val) => (visible = val)">
    <DialogContent class="sm:max-w-[700px] max-h-[90vh] overflow-y-auto gap-0">
      <!-- 对话框头部 -->
      <DialogHeader class="pb-4">
        <DialogTitle class="flex items-center gap-3 text-xl">
          <Target class="h-5 w-5 text-primary" />
          {{ isEditing ? '更新关键结果' : '创建关键结果' }}
        </DialogTitle>
      </DialogHeader>

      <Separator />

      <form class="space-y-6 py-6" @submit.prevent>
        <!-- 基本信息 -->
        <div>
          <h3 class="text-base font-semibold mb-4 text-primary border-b-2 border-primary/10 pb-2">
            基本信息
          </h3>
          <div class="grid grid-cols-12 gap-4">
            <!-- 关键结果名称 -->
            <div class="col-span-12 grid gap-2">
              <Label for="kr-title">关键结果名称*</Label>
              <Input id="kr-title" v-model="keyResultTitle" placeholder="例如：新增活跃用户数量" />
            </div>
          </div>
        </div>

        <!-- 数值配置 -->
        <div>
          <h3 class="text-base font-semibold mb-4 text-primary border-b-2 border-primary/10 pb-2">
            数值配置
          </h3>
          <div class="grid grid-cols-12 gap-4">
            <!-- 起始值 -->
            <div class="col-span-4 grid gap-2">
              <Label for="kr-start">起始值*</Label>
              <Input id="kr-start" v-model.number="keyResultStartValue" type="number" />
              <p class="text-xs text-muted-foreground">关键结果的初始数值</p>
            </div>

            <!-- 目标值 -->
            <div class="col-span-4 grid gap-2">
              <Label for="kr-target">目标值*</Label>
              <Input id="kr-target" v-model.number="keyResultTargetValue" type="number" />
              <p class="text-xs text-muted-foreground">期望达到的目标数值</p>
            </div>

            <!-- 当前值 -->
            <div class="col-span-4 grid gap-2">
              <Label for="kr-current">当前值</Label>
              <Input id="kr-current" v-model.number="keyResultCurrentValue" type="number" />
              <p class="text-xs text-muted-foreground">目前的实际数值</p>
            </div>
          </div>
        </div>

        <!-- 高级配置 -->
        <div>
          <h3 class="text-base font-semibold mb-4 text-primary border-b-2 border-primary/10 pb-2">
            高级配置
          </h3>
          <div class="grid grid-cols-12 gap-4">
            <!-- 计算方法 -->
            <div class="col-span-6 grid gap-2">
              <Label>进度计算方法*</Label>
              <Select v-model="keyResultCalculationMethod">
                <SelectTrigger>
                  <SelectValue placeholder="选择计算方法" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="method in calculationMethods"
                    :key="method.value"
                    :value="method.value"
                  >
                    {{ method.title }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p class="text-xs text-muted-foreground">选择如何计算进度百分比</p>
            </div>

            <!-- 权重 -->
            <div class="col-span-6 grid gap-2">
              <Label for="kr-weight">权重*</Label>
              <Input
                id="kr-weight"
                v-model.number="keyResultWeight"
                type="number"
                min="1"
                max="10"
                step="1"
              />
              <p class="text-xs text-muted-foreground">该关键结果在目标中的重要程度 (1-10)</p>
            </div>
          </div>
        </div>

        <!-- 进度预览 -->
        <div v-if="progressPercentage >= 0">
          <h3 class="text-base font-semibold mb-3 text-primary border-b-2 border-primary/10 pb-2">
            进度预览
          </h3>
          <div
            class="rounded-lg border-2 border-primary/10 p-4 transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium">{{ keyResultTitle || '关键结果名称' }}</span>
              <span class="text-base font-bold" :class="progressColor">
                {{ progressPercentage.toFixed(1) }}%
              </span>
            </div>

            <Progress
              :model-value="progressPercentage"
              class="h-3 mb-2"
              :class="progressBarClass"
            />

            <div class="flex justify-between text-xs text-muted-foreground">
              <span>{{ keyResultStartValue }}</span>
              <span>{{ keyResultCurrentValue }} / {{ keyResultTargetValue }}</span>
            </div>
          </div>
        </div>
      </form>

      <Separator />

      <DialogFooter class="pt-4 gap-2 sm:gap-0">
        <div class="flex-1" />
        <Button variant="outline" @click="handleCancel"> 取消 </Button>
        <Button :disabled="!isFormValid || loading" @click="handleSave">
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isEditing ? '更新' : '创建' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { GoalClientDTO, KeyResultClientDTO } from '@dailyuse/contracts/goal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';
import { Progress } from '@dailyuse/ui-vue-shadcn';
import { Target, Loader2 } from 'lucide-vue-next';

const AggregationMethod = {
  SUM: 'SUM',
  AVERAGE: 'AVERAGE',
  MAX: 'MAX',
  MIN: 'MIN',
  LAST: 'LAST',
} as const;

type EditableKeyResult = {
  id?: KeyResultClientDTO['id'];
  title: string;
  description: string | null;
  weight: number;
  order: number;
  progress: {
    valueType: string;
    aggregationMethod: string;
    initialValue: number;
    targetValue: number;
    currentValue: number;
    unit: string | null;
  };
};

const emit = defineEmits<{
  save: [
    payload: {
      goalId: string | null;
      keyResult: EditableKeyResult;
      isEditing: boolean;
      isInGoalEditing: boolean;
    },
  ];
  cancel: [];
}>();

const createDraftKeyResult = (): EditableKeyResult => ({
  title: '',
  description: null,
  weight: 5,
  order: 0,
  progress: {
    valueType: 'NUMBER',
    aggregationMethod: AggregationMethod.SUM,
    initialValue: 0,
    targetValue: 100,
    currentValue: 0,
    unit: null,
  },
});

const visible = ref(false);
const propKeyResult = ref<KeyResultClientDTO | null>(null);
const propGoalId = ref<string | null>(null);
const propGoal = ref<GoalClientDTO | null>(null);
const isInGoalEditing = computed(() => !!propGoal.value);

const localKeyResult = ref<EditableKeyResult>(createDraftKeyResult());
const loading = ref(false);
const isEditing = computed(() => !!propKeyResult.value);
const isFormValid = computed(() => {
  const title = keyResultTitle.value.trim();
  const weight = keyResultWeight.value;
  return title.length > 0 && weight >= 1 && weight <= 10;
});
const progressPercentage = computed(() => {
  const progress = localKeyResult.value.progress;
  if (!progress.targetValue || progress.targetValue <= 0) return 0;
  return Math.min(100, Math.max(0, (progress.currentValue / progress.targetValue) * 100));
});

const keyResultTitle = computed({
  get: () => localKeyResult.value.title || '',
  set: (val: string) => {
    localKeyResult.value.title = val;
  },
});

const keyResultStartValue = computed({
  get: () => localKeyResult.value.progress.initialValue || 0,
  set: (val: number) => {
    localKeyResult.value.progress.initialValue = val;
  },
});

const keyResultTargetValue = computed({
  get: () => localKeyResult.value.progress.targetValue || 100,
  set: (val: number) => {
    localKeyResult.value.progress.targetValue = val;
  },
});

const keyResultCurrentValue = computed({
  get: () => localKeyResult.value.progress.currentValue || 0,
  set: (val: number) => {
    localKeyResult.value.progress.currentValue = val;
  },
});

const keyResultCalculationMethod = computed({
  get: () => localKeyResult.value.progress.aggregationMethod || 'SUM',
  set: (val: string) => {
    localKeyResult.value.progress.aggregationMethod = val;
  },
});

const keyResultWeight = computed({
  get: () => localKeyResult.value.weight || 5,
  set: (val: number) => {
    localKeyResult.value.weight = val;
  },
});

const calculationMethods = [
  { title: '累加 - 适用于递增指标', value: AggregationMethod.SUM },
  { title: '平均值 - 适用于波动指标', value: AggregationMethod.AVERAGE },
  { title: '最大值 - 取最高值', value: AggregationMethod.MAX },
  { title: '最小值 - 取最低值', value: AggregationMethod.MIN },
  { title: '取最后一次 - 适用于绝对值', value: AggregationMethod.LAST },
];

const progressColor = computed(() => {
  const progress = progressPercentage.value;
  if (progress >= 80) return 'text-green-600';
  if (progress >= 60) return 'text-yellow-600';
  if (progress >= 40) return 'text-orange-500';
  return 'text-red-600';
});

const progressBarClass = computed(() => {
  const progress = progressPercentage.value;
  if (progress >= 80) return '[&>div]:bg-green-500';
  if (progress >= 60) return '[&>div]:bg-yellow-500';
  if (progress >= 40) return '[&>div]:bg-orange-500';
  return '[&>div]:bg-red-500';
});

const handleSave = async () => {
  if (!isFormValid.value || loading.value) return;

  loading.value = true;
  try {
    emit('save', {
      goalId: propGoalId.value,
      keyResult: { ...localKeyResult.value },
      isEditing: isEditing.value,
      isInGoalEditing: isInGoalEditing.value,
    });
    closeDialog();
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  emit('cancel');
  closeDialog();
};
const closeDialog = () => {
  visible.value = false;
};
const openDialog = ({
  goalId,
  keyResult,
  goal,
}: {
  goalId?: string;
  keyResult?: KeyResultClientDTO;
  goal?: GoalClientDTO;
}) => {
  propGoalId.value = goalId || null;
  propKeyResult.value = keyResult || null;
  propGoal.value = goal || null;
  visible.value = true;
};

const openForCreateKeyResultInGoalEditing = (goal: GoalClientDTO) => {
  openDialog({ goal });
};

const openForUpdateKeyResultInGoalEditing = (
  goal: GoalClientDTO,
  keyResult: KeyResultClientDTO,
) => {
  openDialog({ goal, keyResult });
};

const openForCreateKeyResult = (goalId: string) => {
  openDialog({ goalId });
};

const openForUpdateKeyResult = (goalId: string, keyResult: KeyResultClientDTO) => {
  openDialog({ goalId, keyResult });
};

watch([() => visible.value, () => propKeyResult.value], ([newValue]) => {
  if (newValue) {
    if (propKeyResult.value) {
      localKeyResult.value = {
        id: propKeyResult.value.id,
        title: propKeyResult.value.title,
        description: propKeyResult.value.description,
        weight: propKeyResult.value.weight,
        order: propKeyResult.value.order,
        progress: {
          valueType: propKeyResult.value.progress.valueType as string,
          aggregationMethod: propKeyResult.value.progress.aggregationMethod as string,
          initialValue: propKeyResult.value.progress.initialValue,
          targetValue: propKeyResult.value.progress.targetValue,
          currentValue: propKeyResult.value.progress.currentValue,
          unit: propKeyResult.value.progress.unit,
        },
      };
    } else {
      localKeyResult.value = createDraftKeyResult();
    }
  } else {
    localKeyResult.value = createDraftKeyResult();
  }
});

defineExpose({
  openForCreateKeyResultInGoalEditing,
  openForUpdateKeyResultInGoalEditing,
  openForCreateKeyResult,
  openForUpdateKeyResult,
});
</script>
