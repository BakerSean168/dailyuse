<template>
  <v-card variant="outlined" class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon start>mdi-target</v-icon>
      关键结果链接
      <v-spacer />
      <v-chip v-if="hasGoalBinding" color="success" size="small" variant="flat">
        <v-icon start size="small">mdi-check-circle</v-icon>
        已关联
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- 提示信息 -->
      <v-alert v-if="!hasGoalBinding" type="info" variant="tonal" density="compact" class="mb-4">
        <div class="text-caption">
          <v-icon start size="small">mdi-information</v-icon>
          设置关键结果链接后，任务实例完成时会自动创建对应的进度记录
        </div>
      </v-alert>

      <!-- 启用开关 -->
      <v-switch
        v-model="linkEnabled"
        color="primary"
        label="启用关键结果关联"
        hide-details
        class="mb-4"
        @update:model-value="handleLinkToggle"
      />

      <!-- 关联配置表单 -->
      <v-expand-transition>
        <div v-if="linkEnabled">
          <!-- 目标选择 -->
          <v-select
            v-model="selectedGoalUuid"
            :items="goalItems"
            label="选择目标"
            placeholder="请选择要关联的目标"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-flag"
            :disabled="loadingGoals"
            :loading="loadingGoals"
            :rules="[rules.required]"
            class="mb-3"
            @update:model-value="handleGoalChange"
          >
            <template #item="{ item, props: itemProps }">
              <v-list-item v-bind="itemProps" :title="item.title">
                <template #prepend>
                  <v-icon :color="getGoalStatusColor((item.raw as any).status)">mdi-flag</v-icon>
                </template>
                <template #subtitle>
                  <span class="text-caption">{{ (item.raw as any).description }}</span>
                </template>
              </v-list-item>
            </template>
          </v-select>

          <!-- 关键结果选择 -->
          <v-select
            v-model="selectedKeyResultUuid"
            :items="keyResultItems"
            label="选择关键结果"
            placeholder="请先选择目标"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-target-variant"
            :disabled="!selectedGoalUuid || loadingKeyResults"
            :loading="loadingKeyResults"
            :rules="[rules.required]"
            class="mb-3"
            @update:model-value="handleKeyResultChange"
          >
            <template #item="{ item, props: itemProps }">
              <v-list-item v-bind="itemProps" :title="item.title">
                <template #prepend>
                  <v-avatar size="32" :color="getProgressColor((item.raw as any).progressPercentage)">
                    <span class="text-caption">{{ (item.raw as any).progressPercentage }}%</span>
                  </v-avatar>
                </template>
                <template #subtitle>
                  <div class="d-flex align-center">
                    <span class="text-caption mr-2">{{ (item.raw as any).progressText }}</span>
                    <v-chip size="x-small" variant="flat">权重: {{ (item.raw as any).weight }}%</v-chip>
                  </div>
                </template>
              </v-list-item>
            </template>
          </v-select>

          <!-- 增量值设置 -->
          <v-text-field
            v-model.number="incrementValue"
            label="完成后增加的进度值"
            placeholder="输入进度增量（正数）"
            type="number"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-plus-circle"
            suffix="点"
            :rules="[rules.required, rules.positiveNumber, rules.maxValue]"
            hint="任务实例完成时，会自动为关键结果创建此值的进度记录"
            persistent-hint
            class="mb-3"
            @update:model-value="handleIncrementChange"
          />

          <!-- 预览卡片 -->
          <v-card v-if="hasCompleteBinding" variant="tonal" color="success" class="mt-4">
            <v-card-text>
              <div class="d-flex align-center">
                <v-icon size="40" color="success" class="mr-3">mdi-link-variant</v-icon>
                <div class="flex-grow-1">
                  <div class="text-subtitle-2 mb-1">关联配置预览</div>
                  <div class="text-caption text-medium-emphasis">
                    完成任务后将为
                    <strong>{{ selectedGoalTitle }}</strong>
                    的关键结果
                    <strong>{{ selectedKeyResultTitle }}</strong>
                    增加
                    <strong class="text-success">{{ incrementValue }} 点</strong>
                    进度
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-expand-transition>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type {
  TaskTemplateViewModel,
  GoalBindingOption,
  KeyResultBindingOption,
} from '../../types';

interface Props {
  modelValue: TaskTemplateViewModel;
  goals?: GoalBindingOption[];
  keyResultsByGoal?: Record<string, KeyResultBindingOption[]>;
  onRequestKeyResults?: (goalUuid: string) => Promise<KeyResultBindingOption[] | void> | void;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplateViewModel): void;
  (e: 'update:validation', isValid: boolean): void;
  (e: 'request-key-results', goalUuid: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// ===== 响应式数据 =====
const linkEnabled = ref(false);
const selectedGoalUuid = ref<string | null>(null);
const selectedKeyResultUuid = ref<string | null>(null);
const incrementValue = ref<number>(1);
const loadingGoals = ref(false);
const loadingKeyResults = ref(false);

// 目标和关键结果数据
const keyResults = ref<KeyResultBindingOption[]>([]);

// ===== 验证规则 =====
const rules = {
  required: (value: any) => !!value || '此项为必填项',
  positiveNumber: (value: number) => value > 0 || '必须是正数',
  maxValue: (value: number) => value <= 1000 || '增量值不能超过1000',
};

// ===== 计算属性 =====
const hasGoalBinding = computed(() => {
  return props.modelValue.goalBinding !== null && props.modelValue.goalBinding !== undefined;
});

const hasCompleteBinding = computed(() => {
  return (
    linkEnabled.value &&
    selectedGoalUuid.value &&
    selectedKeyResultUuid.value &&
    incrementValue.value > 0
  );
});

const goalItems = computed(() => {
  return (props.goals || []).map((g) => ({
    value: g.uuid,
    title: g.title,
    raw: g,
  }));
});

const keyResultItems = computed(() => {
  return keyResults.value.map((kr) => ({
    value: kr.uuid,
    title: kr.title,
    raw: {
      ...kr,
      progressPercentage: kr.progress.percentage,
      progressText: `${kr.progress.current} / ${kr.progress.target}`,
    },
  }));
});

const selectedGoalTitle = computed(() => {
  if (!selectedGoalUuid.value) return '';
  const goal = (props.goals || []).find((g) => g.uuid === selectedGoalUuid.value);
  return goal?.title || '';
});

const selectedKeyResultTitle = computed(() => {
  if (!selectedKeyResultUuid.value) return '';
  const kr = keyResults.value.find((k) => k.uuid === selectedKeyResultUuid.value);
  return kr?.title || '';
});

// ===== UI 辅助方法 =====
const getGoalStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    NOT_STARTED: 'grey',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
    ARCHIVED: 'warning',
    ABANDONED: 'error',
  };
  return colorMap[status] || 'grey';
};

const getProgressColor = (percentage: number): string => {
  if (percentage >= 80) return 'success';
  if (percentage >= 50) return 'primary';
  if (percentage >= 30) return 'warning';
  return 'error';
};

// ===== 事件处理 =====
const loadKeyResults = async (goalUuid: string) => {
  try {
    loadingKeyResults.value = true;
    const fromProps = props.keyResultsByGoal?.[goalUuid];
    if (fromProps) {
      keyResults.value = fromProps;
      return;
    }
    emit('request-key-results', goalUuid);
    const loaded = await props.onRequestKeyResults?.(goalUuid);
    if (loaded && Array.isArray(loaded)) {
      keyResults.value = loaded;
    }
  } catch (error) {
    console.error('Failed to load key results:', error);
    keyResults.value = [];
  } finally {
    loadingKeyResults.value = false;
  }
};

const handleLinkToggle = (enabled: boolean | null) => {
  if (!enabled) {
    // 清除关联
    const updated: TaskTemplateViewModel = {
      ...props.modelValue,
      goalBinding: null,
    };
    emit('update:modelValue', updated);

    // 重置选择
    selectedGoalUuid.value = null;
    selectedKeyResultUuid.value = null;
    incrementValue.value = 1;
  }

  validateAndEmit();
};

const handleGoalChange = async (goalUuid: string | null) => {
  // 重置关键结果选择
  selectedKeyResultUuid.value = null;
  keyResults.value = [];

  if (goalUuid) {
    // 加载选中目标的关键结果
    await loadKeyResults(goalUuid);
    updateBinding();
  }

  validateAndEmit();
};

const handleKeyResultChange = () => {
  updateBinding();
  validateAndEmit();
};

const handleIncrementChange = () => {
  updateBinding();
  validateAndEmit();
};

const updateBinding = () => {
  if (
    !linkEnabled.value ||
    !selectedGoalUuid.value ||
    !selectedKeyResultUuid.value ||
    incrementValue.value <= 0
  ) {
    return;
  }

  const updated: TaskTemplateViewModel = {
    ...props.modelValue,
    goalBinding: {
      goalUuid: selectedGoalUuid.value,
      keyResultUuid: selectedKeyResultUuid.value,
      incrementValue: incrementValue.value,
      goalTitle: selectedGoalTitle.value,
      keyResultTitle: selectedKeyResultTitle.value,
    },
  };
  emit('update:modelValue', updated);
};

const validateAndEmit = () => {
  // 如果启用了关联，必须完整填写所有字段
  const isValid =
    !linkEnabled.value ||
    (!!selectedGoalUuid.value &&
      !!selectedKeyResultUuid.value &&
      incrementValue.value > 0 &&
      incrementValue.value <= 1000);

  emit('update:validation', isValid);
};

// ===== 初始化 =====
const initializeFromModel = () => {
  const binding = props.modelValue.goalBinding;
  if (binding) {
    linkEnabled.value = true;
    selectedGoalUuid.value = binding.goalUuid;
    selectedKeyResultUuid.value = binding.keyResultUuid;
    incrementValue.value = binding.incrementValue;
  } else {
    linkEnabled.value = false;
    selectedGoalUuid.value = null;
    selectedKeyResultUuid.value = null;
    incrementValue.value = 1;
  }
};

// ===== 生命周期 =====
onMounted(async () => {
  // 从模型初始化表单
  initializeFromModel();

  // 如果有已选择的目标，加载其关键结果
  if (selectedGoalUuid.value) {
    await loadKeyResults(selectedGoalUuid.value);
  }

  // 初始验证
  validateAndEmit();
});

// ===== 监听器 =====
watch(
  () => props.modelValue.goalBinding,
  () => {
    initializeFromModel();
  },
  { deep: true },
);
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.v-expand-transition {
  overflow: hidden;
}
</style>
