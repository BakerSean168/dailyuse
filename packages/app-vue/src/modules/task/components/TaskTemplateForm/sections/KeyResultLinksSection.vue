<template>
  <Card class="mb-4">
    <CardHeader class="flex flex-row items-center justify-between">
      <div class="flex items-center gap-2">
        <Target class="h-5 w-5" />
        <CardTitle>关键结果链接</CardTitle>
      </div>
      <Badge v-if="hasGoalBinding" variant="default" class="bg-green-500">
        <CheckCircle class="h-3 w-3 mr-1" />
        已关联
      </Badge>
    </CardHeader>

    <CardContent>
      <!-- 提示信息 -->
      <Alert v-if="!hasGoalBinding" class="mb-4">
        <Info class="h-4 w-4" />
        <AlertDescription class="text-xs">
          设置关键结果链接后，任务实例完成时会自动创建对应的进度记录
        </AlertDescription>
      </Alert>

      <!-- 启用开关 -->
      <div class="flex items-center gap-2 mb-4">
        <Switch
          :checked="linkEnabled"
          @update:checked="
            (val) => {
              linkEnabled = val;
              handleLinkToggle(val);
            }
          "
        />
        <Label>启用关键结果关联</Label>
      </div>

      <!-- 关联配置表单 -->
      <div v-if="linkEnabled">
        <!-- 目标选择 -->
        <div class="mb-3">
          <Label class="mb-2 block">选择目标</Label>
          <Select
            :model-value="selectedGoalId ?? undefined"
            :disabled="loadingGoals"
            @update:model-value="handleGoalChange"
          >
            <SelectTrigger>
              <div class="flex items-center gap-2">
                <Flag class="h-4 w-4" />
                <SelectValue placeholder="请选择要关联的目标" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="item in goalItems" :key="item.value" :value="item.value">
                <div class="flex items-center gap-2">
                  <Flag :class="['h-4 w-4', getGoalStatusColorClass((item.raw as any).status)]" />
                  <div>
                    <div>{{ item.title }}</div>
                    <div class="text-xs text-muted-foreground">
                      {{ (item.raw as any).description }}
                    </div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- 关键结果选择 -->
        <div class="mb-3">
          <Label class="mb-2 block">选择关键结果</Label>
          <Select
            :model-value="selectedKeyResultId ?? undefined"
            :disabled="!selectedGoalId || loadingKeyResults"
            @update:model-value="handleKeyResultChange"
          >
            <SelectTrigger>
              <div class="flex items-center gap-2">
                <Target class="h-4 w-4" />
                <SelectValue placeholder="请先选择目标" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="item in keyResultItems" :key="item.value" :value="item.value">
                <div class="flex items-center gap-2">
                  <div
                    :class="[
                      'flex items-center justify-center h-8 w-8 rounded-full text-xs text-white shrink-0',
                      getProgressBgClass((item.raw as any).progressPercentage),
                    ]"
                  >
                    {{ (item.raw as any).progressPercentage }}%
                  </div>
                  <div>
                    <div>{{ item.title }}</div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-muted-foreground">{{
                        (item.raw as any).progressText
                      }}</span>
                      <Badge variant="secondary" class="text-xs"
                        >权重: {{ (item.raw as any).weight }}%</Badge
                      >
                    </div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- 增量值设置 -->
        <div class="mb-3">
          <Label class="mb-2 block">完成后增加的进度值</Label>
          <div class="flex items-center gap-2">
            <PlusCircle class="h-4 w-4 text-muted-foreground" />
            <Input
              :model-value="incrementValue"
              type="number"
              placeholder="输入进度增量（正数）"
              @update:model-value="
                (val) => {
                  incrementValue = Number(val);
                  handleIncrementChange();
                }
              "
            />
            <span class="text-sm text-muted-foreground">点</span>
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            任务实例完成时，会自动为关键结果创建此值的进度记录
          </p>
        </div>

        <!-- 预览卡片 -->
        <Card
          v-if="hasCompleteBinding"
          class="mt-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
        >
          <CardContent class="pt-4">
            <div class="flex items-center">
              <Link2 class="h-10 w-10 text-green-500 mr-3 shrink-0" />
              <div class="flex-1">
                <div class="text-sm font-medium mb-1">关联配置预览</div>
                <div class="text-xs text-muted-foreground">
                  完成任务后将为
                  <strong>{{ selectedGoalTitle }}</strong>
                  的关键结果
                  <strong>{{ selectedKeyResultTitle }}</strong>
                  增加
                  <strong class="text-green-600">{{ incrementValue }} 点</strong>
                  进度
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { TaskTemplateViewModel, GoalBindingOption, KeyResultBindingOption } from '../../types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Switch,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
  Badge,
} from '@dailyuse/ui-vue-shadcn';
import { Target, CheckCircle, Info, Flag, PlusCircle, Link2 } from 'lucide-vue-next';

interface Props {
  modelValue: TaskTemplateViewModel;
  goals?: GoalBindingOption[];
  keyResultsByGoal?: Record<string, KeyResultBindingOption[]>;
  onRequestKeyResults?: (goalId: string) => Promise<KeyResultBindingOption[] | void> | void;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplateViewModel): void;
  (e: 'update:validation', isValid: boolean): void;
  (e: 'request-key-results', goalId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// ===== 响应式数据 =====
const linkEnabled = ref(false);
const selectedGoalId = ref<string | null>(null);
const selectedKeyResultId = ref<string | null>(null);
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
    selectedGoalId.value &&
    selectedKeyResultId.value &&
    incrementValue.value > 0
  );
});

const goalItems = computed(() => {
  return (props.goals || []).map((g) => ({
    value: g.id,
    title: g.title,
    raw: g,
  }));
});

const keyResultItems = computed(() => {
  return keyResults.value.map((kr) => ({
    value: kr.id,
    title: kr.title,
    raw: {
      ...kr,
      progressPercentage: kr.progress.percentage,
      progressText: `${kr.progress.current} / ${kr.progress.target}`,
    },
  }));
});

const selectedGoalTitle = computed(() => {
  if (!selectedGoalId.value) return '';
  const goal = (props.goals || []).find((g) => g.id === selectedGoalId.value);
  return goal?.title || '';
});

const selectedKeyResultTitle = computed(() => {
  if (!selectedKeyResultId.value) return '';
  const kr = keyResults.value.find((k) => k.id === selectedKeyResultId.value);
  return kr?.title || '';
});

// ===== UI 辅助方法 =====
const getGoalStatusColorClass = (status: string): string => {
  const colorMap: Record<string, string> = {
    NOT_STARTED: 'text-gray-400',
    IN_PROGRESS: 'text-primary',
    COMPLETED: 'text-green-500',
    ARCHIVED: 'text-yellow-500',
    ABANDONED: 'text-destructive',
  };
  return colorMap[status] || 'text-gray-400';
};

const getProgressBgClass = (percentage: number): string => {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 50) return 'bg-primary';
  if (percentage >= 30) return 'bg-yellow-500';
  return 'bg-destructive';
};

// ===== 事件处理 =====
const loadKeyResults = async (goalId: string) => {
  try {
    loadingKeyResults.value = true;
    const fromProps = props.keyResultsByGoal?.[goalId];
    if (fromProps) {
      keyResults.value = fromProps;
      return;
    }
    emit('request-key-results', goalId);
    const loaded = await props.onRequestKeyResults?.(goalId);
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
    selectedGoalId.value = null;
    selectedKeyResultId.value = null;
    incrementValue.value = 1;
  }

  validateAndEmit();
};

const handleGoalChange = async (goalId: string | null) => {
  selectedGoalId.value = goalId ?? null;
  // 重置关键结果选择
  selectedKeyResultId.value = null;
  keyResults.value = [];

  if (goalId) {
    // 加载选中目标的关键结果
    await loadKeyResults(goalId);
    updateBinding();
  }

  validateAndEmit();
};

const handleKeyResultChange = (val: string | null) => {
  selectedKeyResultId.value = val ?? null;
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
    !selectedGoalId.value ||
    !selectedKeyResultId.value ||
    incrementValue.value <= 0
  ) {
    return;
  }

  const updated: TaskTemplateViewModel = {
    ...props.modelValue,
    goalBinding: {
      goalId: selectedGoalId.value,
      keyResultId: selectedKeyResultId.value,
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
    (!!selectedGoalId.value &&
      !!selectedKeyResultId.value &&
      incrementValue.value > 0 &&
      incrementValue.value <= 1000);

  emit('update:validation', isValid);
};

// ===== 初始化 =====
const initializeFromModel = () => {
  const binding = props.modelValue.goalBinding;
  if (binding) {
    linkEnabled.value = true;
    selectedGoalId.value = binding.goalId ?? null;
    selectedKeyResultId.value = binding.keyResultId ?? null;
    incrementValue.value = binding.incrementValue ?? 1;
  } else {
    linkEnabled.value = false;
    selectedGoalId.value = null;
    selectedKeyResultId.value = null;
    incrementValue.value = 1;
  }
};

// ===== 生命周期 =====
onMounted(async () => {
  // 从模型初始化表单
  initializeFromModel();

  // 如果有已选择的目标，加载其关键结果
  if (selectedGoalId.value) {
    await loadKeyResults(selectedGoalId.value);
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
