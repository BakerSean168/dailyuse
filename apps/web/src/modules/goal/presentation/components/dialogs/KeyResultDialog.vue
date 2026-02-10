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
import { KeyResult, Goal } from '@dailyuse/goal/domain-client';
import { AggregationMethod } from '@dailyuse/contracts/goal';
// composables
import { useKeyResult } from '../../composables/useKeyResult';

const keyResultComposable = useKeyResult();
const { createKeyResult, updateKeyResult } = keyResultComposable;

const visible = ref(false);
const propKeyResult = ref<KeyResult | null>(null);
const propGoalUuid = ref<string | null>(null);
//如果是在编辑 Goal 的情况下，编辑 Key Result，应该直接把 keyResult 的修改直接反映到 Goal 中（到时候调用 Goal 的接口），而不是直接掉用修改 Key Result 的接口
// 规定传入 goal 对象，则表示是在编辑 Goal 的情况下编辑 Key Result
const propGoal = ref<Goal | null>(null);
const isInGoalEditing = computed(() => !!propGoal.value);
// 表单状态
const formRef = ref<InstanceType<typeof HTMLFormElement> | null>(null);
const localKeyResult = ref<KeyResult>(
  KeyResult.forCreate(''), // 需要在打开时设置正确的 goalUuid
);
const loading = ref(false);
const isEditing = computed(() => !!propKeyResult.value);
const isFormValid = computed(() => formRef.value?.isValid ?? false);
const progressPercentage = computed(() => {
  const progress = localKeyResult.value.progress;
  return progress.progressPercentage;
});

// 表单字段的 getter/setter
const keyResultTitle = computed({
  get: () => localKeyResult.value.title || '',
  set: (val: string) => {
    localKeyResult.value.updateTitle(val);
  },
});

const keyResultStartValue = computed({
  get: () => localKeyResult.value.progress.currentValue - localKeyResult.value.progress.currentValue + 0, // 初始值设为0
  set: (val: number) => {
    // initialValue 在当前实现中不存储，这里使用 updateInitialValue
    localKeyResult.value.updateInitialValue(val);
  },
});

const keyResultTargetValue = computed({
  get: () => localKeyResult.value.progress.targetValue || 100, // 默认目标值为 100
  set: (val: number) => {
    localKeyResult.value.updateTargetValue(val);
  },
});

const keyResultCurrentValue = computed({
  get: () => localKeyResult.value.progress.currentValue || 0,
  set: (val: number) => {
    localKeyResult.value.updateCurrentValue(val);
  },
});

const keyResultCalculationMethod = computed({
  get: () => localKeyResult.value.progress.aggregationMethod || 'SUM',
  set: (val: string) => {
    localKeyResult.value.updateAggregationMethod(val as any);
  },
});

const keyResultWeight = computed({
  get: () => localKeyResult.value.weight || 5, // 默认值为 5（中等权重）
  set: (val: number) => {
    localKeyResult.value.updateWeight(val);
  },
});

// 权重验证规则
const weightRules = [
  (value: number) => {
    if (!value) return '权重不能为空';
    if (value < 1 || value > 10) return '权重必须在 1-10 之间';
    if (!Number.isInteger(value)) return '权重必须是整数';
    return true;
  },
];

// 计算方法选项
const calculationMethods = [
  { title: '累加 - 适用于递增指标', value: AggregationMethod.SUM },
  { title: '平均值 - 适用于波动指标', value: AggregationMethod.AVERAGE },
  { title: '最大值 - 取最高值', value: AggregationMethod.MAX },
  { title: '最小值 - 取最低值', value: AggregationMethod.MIN },
  { title: '取最后一次 - 适用于绝对值', value: AggregationMethod.LAST },
];

// 进度颜色计算
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

// 处理保存
const handleSave = async () => {
  if (!isFormValid.value || loading.value) return;
  
  loading.value = true;
  try {
    if (isEditing.value) {
      if (isInGoalEditing.value) {
        // 如果在目标编辑页面，直接修改 Goal 中的 KeyResult
        // 由于我们已经在 localKeyResult 上直接修改，这里不需要额外操作
        // propGoal 中的 keyResults 已经是引用，修改会反映在父组件中
      } else {
        // 转换为 UpdateKeyResultRequest 格式
        const updateRequest = {
          title: localKeyResult.value.title,
          description: localKeyResult.value.description || undefined, // null 转为 undefined
          weight: localKeyResult.value.weight,
          order: localKeyResult.value.order,
          progress: {
            valueType: localKeyResult.value.progress.valueType,
            aggregationMethod: localKeyResult.value.progress.aggregationMethod,
            targetValue: localKeyResult.value.progress.targetValue,
            currentValue: localKeyResult.value.progress.currentValue,
            unit: localKeyResult.value.progress.unit || undefined,
          },
        };
        await updateKeyResult(propGoalUuid.value!, localKeyResult.value.uuid, updateRequest);
      }
    } else {
      if (isInGoalEditing.value) {
        // 如果在目标编辑页面，使用变更跟踪方法添加关键结果
        propGoal.value?.addKeyResult(localKeyResult.value as KeyResult);
        // 不调用创建接口，等保存目标时统一创建
        closeDialog();
        return;
      }
      // 转换为 AddKeyResultRequest 格式
      const createRequest = {
        title: localKeyResult.value.title,
        description: localKeyResult.value.description || undefined,
        targetValue: localKeyResult.value.progress.targetValue,
        currentValue: localKeyResult.value.progress.currentValue,
        unit: localKeyResult.value.progress.unit || undefined,
        weight: localKeyResult.value.weight,
        valueType: localKeyResult.value.progress.valueType,
        aggregationMethod: localKeyResult.value.progress.aggregationMethod,
      };
      await createKeyResult(propGoalUuid.value!, createRequest);
    }
    closeDialog();
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  closeDialog();
};
const closeDialog = () => {
  visible.value = false;
};
const openDialog = ({
  goalUuid,
  keyResult,
  goal,
}: {
  goalUuid?: string;
  keyResult?: KeyResult;
  goal?: Goal;
}) => {
  propGoalUuid.value = goalUuid || null;
  propKeyResult.value = keyResult || null;
  propGoal.value = goal || null;
  visible.value = true;
};

const openForCreateKeyResultInGoalEditing = (goal: Goal) => {
  openDialog({ goal });
};

const openForUpdateKeyResultInGoalEditing = (goal: Goal, keyResult: KeyResult) => {
  openDialog({ goal, keyResult });
};

const openForCreateKeyResult = (goalUuid: string) => {
  openDialog({ goalUuid });
};

const openForUpdateKeyResult = (goalUuid: string, keyResult: KeyResult) => {
  openDialog({ goalUuid, keyResult });
};

watch([() => visible.value, () => propKeyResult.value], ([newValue]) => {
  if (newValue) {
    if (propKeyResult.value) {
      // 编辑模式：克隆现有 KR
      localKeyResult.value = propKeyResult.value.clone();
    } else {
      // 创建模式：新建 KR 并设置默认值
      localKeyResult.value = KeyResult.forCreate(propGoalUuid.value || propGoal.value?.uuid || '');
      localKeyResult.value.updateWeight(5); // 默认权重为 5
      localKeyResult.value.updateTargetValue(100); // 默认目标值为 100
      localKeyResult.value.updateInitialValue(0); // 默认起始值为 0
      localKeyResult.value.updateCurrentValue(0); // 默认当前值为 0
    }
    if (propKeyResult.value) {
      // 编辑模式：克隆现有 KR
      localKeyResult.value = propKeyResult.value.clone();
    } else {
      // 创建模式：新建 KR 并设置默认值
      localKeyResult.value = KeyResult.forCreate(propGoalUuid.value || propGoal.value?.uuid || '');
      localKeyResult.value.updateWeight(5); // 默认权重为 5
      localKeyResult.value.updateTargetValue(100); // 默认目标值为 100
      localKeyResult.value.updateInitialValue(0); // 默认起始值为 0
      localKeyResult.value.updateCurrentValue(0); // 默认当前值为 0
    }
  } else {
    localKeyResult.value = KeyResult.forCreate(propGoalUuid.value || propGoal.value?.uuid || '');
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
