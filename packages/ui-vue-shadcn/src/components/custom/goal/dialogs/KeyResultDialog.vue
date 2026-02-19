<template>
  <v-dialog :model-value="visible" max-width="700px" persistent>
    <v-card>
      <!-- 对话框头部 -->
      <v-card-title class="d-flex align-center pa-4">
        <v-icon color="primary" class="mr-3">mdi-target</v-icon>
        <span class="text-h5">{{ isEditing ? '更新关键结果' : '创建关键结果' }}</span>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <v-form ref="formRef" @submit.prevent>
          <!-- 基本信息 -->
          <div class="mb-6">
            <h3 class="text-h6 mb-4">基本信息</h3>
            <v-row>
              <!-- 关键结果名称 -->
              <v-col cols="12">
                <v-text-field
                  v-model="keyResultTitle"
                  label="关键结果名称*"
                  placeholder="例如：新增活跃用户数量"
                  variant="outlined"
                  required
                />
              </v-col>
            </v-row>
          </div>

          <!-- 数值配置 -->
          <div class="mb-6">
            <h3 class="text-h6 mb-4">数值配置</h3>
            <v-row>
              <!-- 起始值 -->
              <v-col cols="4">
                <v-text-field
                  v-model.number="keyResultStartValue"
                  label="起始值*"
                  type="number"
                  variant="outlined"
                  hint="关键结果的初始数值"
                  persistent-hint
                  required
                />
              </v-col>

              <!-- 目标值 -->
              <v-col cols="4">
                <v-text-field
                  v-model.number="keyResultTargetValue"
                  label="目标值*"
                  type="number"
                  variant="outlined"
                  hint="期望达到的目标数值"
                  persistent-hint
                  required
                />
              </v-col>

              <!-- 当前值 -->
              <v-col cols="4">
                <v-text-field
                  v-model.number="keyResultCurrentValue"
                  label="当前值"
                  type="number"
                  variant="outlined"
                  hint="目前的实际数值"
                  persistent-hint
                />
              </v-col>
            </v-row>
          </div>

          <!-- 高级配置 -->
          <div class="mb-6">
            <h3 class="text-h6 mb-4">高级配置</h3>
            <v-row>
              <!-- 计算方法 -->
              <v-col cols="6">
                <v-select
                  v-model="keyResultCalculationMethod"
                  :items="calculationMethods"
                  label="进度计算方法*"
                  variant="outlined"
                  hint="选择如何计算进度百分比"
                  persistent-hint
                  required
                />
              </v-col>

              <!-- 权重 -->
              <v-col cols="6">
                <v-text-field
                  v-model.number="keyResultWeight"
                  label="权重*"
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  variant="outlined"
                  hint="该关键结果在目标中的重要程度 (1-10)"
                  persistent-hint
                  :rules="weightRules"
                  required
                />
              </v-col>
            </v-row>
          </div>

          <!-- 进度预览 -->
          <div v-if="progressPercentage >= 0" class="mb-4">
            <h3 class="text-h6 mb-3">进度预览</h3>
            <v-card variant="outlined" class="pa-4">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-subtitle-1 font-weight-medium">{{
                  keyResultTitle || '关键结果名称'
                }}</span>
                <span class="text-h6 font-weight-bold" :class="progressColor">
                  {{ progressPercentage.toFixed(1) }}%
                </span>
              </div>

              <v-progress-linear
                :model-value="progressPercentage"
                :color="progressBarColor"
                height="12"
                rounded
                class="mb-2"
              />

              <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                <span>{{ keyResultStartValue }}</span>
                <span>{{ keyResultCurrentValue }} / {{ keyResultTargetValue }}</span>
              </div>
            </v-card>
          </div>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="handleCancel"> 取消 </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :disabled="!isFormValid || loading"
          :loading="loading"
          @click="handleSave"
        >
          {{ isEditing ? '更新' : '创建' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { GoalClientDTO, KeyResultClientDTO } from '@dailyuse/contracts/goal';

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
  save: [payload: {
    goalId: string | null;
    keyResult: EditableKeyResult;
    isEditing: boolean;
    isInGoalEditing: boolean;
  }];
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

const formRef = ref<InstanceType<typeof HTMLFormElement> | null>(null);
const localKeyResult = ref<EditableKeyResult>(createDraftKeyResult());
const loading = ref(false);
const isEditing = computed(() => !!propKeyResult.value);
const isFormValid = computed(() => formRef.value?.isValid ?? false);
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

const weightRules = [
  (value: number) => {
    if (!value) return '权重不能为空';
    if (value < 1 || value > 10) return '权重必须在 1-10 之间';
    if (!Number.isInteger(value)) return '权重必须是整数';
    return true;
  },
];

const calculationMethods = [
  { title: '累加 - 适用于递增指标', value: AggregationMethod.SUM },
  { title: '平均值 - 适用于波动指标', value: AggregationMethod.AVERAGE },
  { title: '最大值 - 取最高值', value: AggregationMethod.MAX },
  { title: '最小值 - 取最低值', value: AggregationMethod.MIN },
  { title: '取最后一次 - 适用于绝对值', value: AggregationMethod.LAST },
];

const progressColor = computed(() => {
  const progress = progressPercentage.value;
  if (progress >= 80) return 'text-success';
  if (progress >= 60) return 'text-warning';
  if (progress >= 40) return 'text-orange';
  return 'text-error';
});

const progressBarColor = computed(() => {
  const progress = progressPercentage.value;
  if (progress >= 80) return 'success';
  if (progress >= 60) return 'warning';
  if (progress >= 40) return 'orange';
  return 'error';
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

const openForUpdateKeyResultInGoalEditing = (goal: GoalClientDTO, keyResult: KeyResultClientDTO) => {
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

<style scoped>
/* 对话框样式 */
.v-dialog {
  overflow-y: auto;
}

.v-card {
  overflow-y: auto;
  max-height: 90vh;
}

/* 表单分组样式 */
.v-card-text h3 {
  color: rgb(var(--v-theme-primary));
  border-bottom: 2px solid rgba(var(--v-theme-primary), 0.1);
  padding-bottom: 8px;
}

/* 进度预览卡片样式 */
.v-card[variant='outlined'] {
  border: 2px solid rgba(var(--v-theme-primary), 0.1);
  transition: all 0.3s ease;
}

.v-card[variant='outlined']:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.1);
}

/* 表单字段样式 */
.v-text-field,
.v-textarea,
.v-select {
  margin-bottom: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .v-dialog {
    width: 95vw !important;
    max-width: none !important;
  }

  .v-card-text {
    padding: 1rem !important;
  }
}
</style>

<style scoped>
.v-progress-linear {
  border-radius: 4px;
}
</style>
