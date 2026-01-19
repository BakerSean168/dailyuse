<template>
  <ObsidianDialog
    v-model="show"
    title="AI 智能生成目标"
    icon="mdi-target-variant"
    :width="720"
    :height="650"
    :min-width="520"
    :min-height="450"
    persistent
    @close="close"
  >
    <template #header-actions>
      <v-chip
        v-if="quota"
        size="x-small"
        :color="hasQuota ? 'success' : 'error'"
        variant="flat"
        class="mr-2"
      >
        {{ quota.remainingQuota }}/{{ quota.quotaLimit }}
      </v-chip>
    </template>

    <div class="goal-generate-content">
      <!-- Quota Alert -->
      <v-alert
        v-if="quota"
        :type="hasQuota ? 'info' : 'warning'"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        <div class="d-flex align-center">
          <v-icon size="18" class="mr-2">mdi-information</v-icon>
          <span>
            今日剩余额度：<strong>{{ quota.remainingQuota }}/{{ quota.quotaLimit }}</strong>
            <span v-if="timeToReset" class="text-caption ml-2">({{ timeToReset }}后重置)</span>
          </span>
        </div>
      </v-alert>

      <!-- Form -->
      <v-form ref="formRef" v-model="formValid" class="goal-form">
        <!-- Core Idea Input -->
        <v-textarea
          v-model="formData.idea"
          label="你的目标想法 *"
          placeholder="描述你想要实现的目标，可以包含：&#10;• 具体想做什么&#10;• 为什么想做这件事&#10;• 期望达到什么效果&#10;&#10;例如：我想提升团队的代码质量，减少线上bug，提高用户满意度..."
          :rules="[rules.required, rules.minLength]"
          variant="outlined"
          density="comfortable"
          rows="4"
          auto-grow
          prepend-inner-icon="mdi-lightbulb-on"
          :disabled="isGenerating"
          counter
          maxlength="1000"
        />

        <v-row>
          <!-- Category Selection -->
          <v-col cols="12" md="6">
            <v-select
              v-model="formData.category"
              label="目标分类（可选）"
              :items="categoryOptions"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-shape"
              :disabled="isGenerating"
              clearable
              hint="帮助 AI 更好地理解目标领域"
              persistent-hint
              :menu-props="{ eager: true }"
            />
          </v-col>

          <!-- Time Range Selection -->
          <v-col cols="12" md="6">
            <v-select
              v-model="formData.timeRange"
              label="预计周期"
              :items="timeRangeOptions"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-clock-outline"
              :disabled="isGenerating"
              hint="AI 会根据周期调整目标粒度"
              persistent-hint
              :menu-props="{ eager: true }"
            />
          </v-col>
        </v-row>

        <!-- Custom Date Range (only shown when timeRange is 'custom') -->
        <v-expand-transition>
          <v-row v-if="formData.timeRange === 'custom'">
            <v-col cols="6">
              <v-text-field
                v-model="formData.startDate"
                label="开始日期"
                type="date"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar-start"
                :disabled="isGenerating"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="formData.endDate"
                label="结束日期"
                type="date"
                :rules="[rules.endAfterStart]"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar-end"
                :disabled="isGenerating"
              />
            </v-col>
          </v-row>
        </v-expand-transition>

        <!-- Additional Context -->
        <v-textarea
          v-model="formData.context"
          label="补充说明（可选）"
          placeholder="补充任何有助于 AI 理解的信息，例如：&#10;• 当前的背景和现状&#10;• 可用的资源和条件&#10;• 面临的挑战和限制"
          variant="outlined"
          density="comfortable"
          rows="2"
          auto-grow
          prepend-inner-icon="mdi-information-outline"
          :disabled="isGenerating"
        />

        <!-- Key Results Options -->
        <v-card variant="outlined" class="pa-3 mt-2">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon color="primary" class="mr-2">mdi-target</v-icon>
              <span class="text-body-1 font-weight-medium">同时生成关键结果</span>
            </div>
            <v-switch
              v-model="formData.includeKeyResults"
              color="primary"
              hide-details
              :disabled="isGenerating"
              density="compact"
            />
          </div>

          <v-expand-transition>
            <div v-if="formData.includeKeyResults" class="mt-3">
              <v-select
                v-model="formData.keyResultCount"
                label="关键结果数量"
                :items="keyResultCountOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-format-list-numbered"
                :disabled="isGenerating"
                hint="AI 会根据目标复杂度自动调整"
                persistent-hint
                :menu-props="{ eager: true }"
              />
            </div>
          </v-expand-transition>
        </v-card>

        <!-- Knowledge Document Options -->
        <v-card variant="outlined" class="pa-3 mt-2">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon color="secondary" class="mr-2">mdi-book-open-page-variant</v-icon>
              <span class="text-body-1 font-weight-medium">同时生成知识文档</span>
            </div>
            <v-switch
              v-model="formData.includeKnowledgeDoc"
              color="secondary"
              hide-details
              :disabled="isGenerating"
              density="compact"
            />
          </div>
          <div v-if="formData.includeKnowledgeDoc" class="text-caption text-medium-emphasis mt-2">
            将在知识库中自动创建目标相关的学习资料
          </div>
        </v-card>
      </v-form>

      <!-- Error Alert -->
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        density="compact"
        class="mt-4"
        closable
        @click:close="error = null"
      >
        {{ error }}
      </v-alert>
    </div>

    <template #footer>
      <v-btn
        variant="text"
        @click="close"
        :disabled="isGenerating"
      >
        取消
      </v-btn>
      <v-btn
        color="primary"
        variant="elevated"
        :loading="isGenerating"
        :disabled="!formValid || !hasQuota"
        @click="handleGenerate"
        prepend-icon="mdi-sparkles"
        class="generate-btn"
      >
        {{ isGenerating ? '生成中...' : '生成目标' }}
      </v-btn>
    </template>
  </ObsidianDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import ObsidianDialog from '@/shared/components/ObsidianDialog.vue';
import { useAIGeneration } from '@/modules/ai/presentation/composables/useAIGeneration';
import { useMessage } from '@dailyuse/ui-vuetify';
import { api } from '@/shared/api/instances';
import { aiService } from '@/shared/services/aiService';
import { getRepositoryApiClient } from '@dailyuse/infrastructure-client';
import { useRepositoryStore } from '@/modules/repository/presentation/stores/repositoryStore';
import { useFolderStore } from '@/modules/repository/presentation/stores/folderStore';
import { useResourceStore } from '@/modules/repository/presentation/stores/resourceStore';
import { Folder, Resource } from '@dailyuse/domain-client/repository';

const repositoryApiClient = getRepositoryApiClient();

// Define local types for the API requests/responses
interface GenerateGoalRequest {
  idea: string;
  category?: string;
  timeRange?: string;
  startDate?: number;
  endDate?: number;
  context?: string;
}

interface GenerateGoalWithKRsRequest extends GenerateGoalRequest {
  keyResultCount?: number;
}

interface GeneratedGoalDraft {
  title: string;
  description?: string;
  category?: string;
  suggestedStartDate?: number;
  suggestedEndDate?: number;
}

interface GenerateGoalResponse {
  goal: GeneratedGoalDraft;
}

interface GenerateGoalWithKRsResponse extends GenerateGoalResponse {
  keyResults: Array<{
    title: string;
    description?: string;
    valueType?: string;
    targetValue?: number;
    unit?: string;
  }>;
}

// State
const show = ref(false);
const formRef = ref();
const formValid = ref(false);

const formData = ref({
  idea: '',
  category: undefined as string | undefined,
  timeRange: 'unlimited' as string, // 默认无期限
  startDate: '',
  endDate: '',
  context: '',
  includeKeyResults: true,
  keyResultCount: 'auto' as string | number, // 默认由 AI 决定
  includeKnowledgeDoc: false, // 是否生成关联知识文档
});

// Category Options
const categoryOptions = [
  { label: '📈 职业发展', value: 'career' },
  { label: '💪 健康健身', value: 'health' },
  { label: '📚 学习成长', value: 'learning' },
  { label: '💰 财务理财', value: 'financial' },
  { label: '🏠 家庭生活', value: 'family' },
  { label: '🎨 兴趣爱好', value: 'hobby' },
  { label: '🤝 社交关系', value: 'social' },
  { label: '🧘 心理健康', value: 'mental' },
  { label: '📋 项目管理', value: 'project' },
  { label: '✨ 其他', value: 'other' },
];

// Time Range Options
const timeRangeOptions = [
  { label: '🚀 无期限（长期目标）', value: 'unlimited' },
  { label: '📅 一周左右', value: 'week' },
  { label: '📆 一个月左右', value: 'month' },
  { label: '🗓️ 三个月左右', value: 'quarter' },
  { label: '📊 半年左右', value: 'half-year' },
  { label: '🎯 一年左右', value: 'year' },
  { label: '✏️ 自定义日期', value: 'custom' },
];

// Key Result Count Options
const keyResultCountOptions = [
  { label: '🤖 由 AI 决定（推荐）', value: 'auto' },
  { label: '2 个', value: 2 },
  { label: '3 个', value: 3 },
  { label: '4 个', value: 4 },
  { label: '5 个', value: 5 },
];

// Composables
const {
  isGenerating: storeIsGenerating,
  error: storeError,
  quota,
  hasQuota,
  timeToReset,
  loadQuotaStatus,
  clearError,
} = useAIGeneration();

// Local state for this component
const isGenerating = ref(false);
const error = ref<string | null>(null);

const message = useMessage();

// Emits
const emit = defineEmits<{
  (e: 'generated', result: GenerateGoalResponse | GenerateGoalWithKRsResponse, options: { includeKnowledgeDoc: boolean }): void;
  (e: 'error', msg: string): void;
}>();

// Validation Rules
const rules = {
  required: (v: string) => !!v?.trim() || '此项为必填',
  minLength: (v: string) => (v?.trim().length >= 10) || '请至少输入10个字符描述您的目标',
  endAfterStart: (v: string) => {
    if (!v || !formData.value.startDate) return true;
    return new Date(v) >= new Date(formData.value.startDate) || '结束日期必须晚于或等于开始日期';
  },
};

// Compute dates based on timeRange
function computeDates(): { startDate?: number; endDate?: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startTimestamp = today.getTime();
  
  if (formData.value.timeRange === 'custom') {
    // Custom dates
    const start = formData.value.startDate ? new Date(formData.value.startDate).getTime() : undefined;
    const end = formData.value.endDate ? new Date(formData.value.endDate).getTime() : undefined;
    return { startDate: start, endDate: end };
  }
  
  if (formData.value.timeRange === 'unlimited') {
    // No end date for unlimited goals
    return { startDate: startTimestamp, endDate: undefined };
  }
  
  // Calculate end date based on timeRange
  const endDate = new Date(today);
  switch (formData.value.timeRange) {
    case 'week':
      endDate.setDate(endDate.getDate() + 7);
      break;
    case 'month':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'quarter':
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case 'half-year':
      endDate.setMonth(endDate.getMonth() + 6);
      break;
    case 'year':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
  }
  
  return { startDate: startTimestamp, endDate: endDate.getTime() };
}

// Methods
function openDialog() {
  // Reset to defaults (no need to set default dates since timeRange handles it)
  formData.value.startDate = new Date().toISOString().split('T')[0];
  formData.value.endDate = '';
  
  show.value = true;

  // Load quota status
  loadQuotaStatus().catch((err) => {
    console.error('Failed to load quota:', err);
  });
}

function close() {
  if (!isGenerating.value) {
    show.value = false;
    resetForm();
  }
}

function resetForm() {
  formData.value = {
    idea: '',
    category: undefined,
    timeRange: 'unlimited',
    startDate: '',
    endDate: '',
    context: '',
    includeKeyResults: true,
    keyResultCount: 'auto',
    includeKnowledgeDoc: false,
  };
  error.value = null;
  formRef.value?.reset();
}

async function handleGenerate() {
  if (!formValid.value || !hasQuota.value) return;

  isGenerating.value = true;
  error.value = null;

  try {
    const { startDate, endDate } = computeDates();

    let result: GenerateGoalResponse | GenerateGoalWithKRsResponse;

    if (formData.value.includeKeyResults) {
      // Generate Goal with Key Results
      const request: GenerateGoalWithKRsRequest = {
        idea: formData.value.idea.trim(),
        category: formData.value.category,
        timeRange: formData.value.timeRange,
        startDate,
        endDate,
        context: formData.value.context.trim() || undefined,
        keyResultCount: formData.value.keyResultCount === 'auto' ? undefined : formData.value.keyResultCount as number,
      };

      result = await api.post<GenerateGoalWithKRsResponse>('/ai/generate/goal-with-krs', request);

      const krCount = (result as GenerateGoalWithKRsResponse).keyResults?.length || 0;
      message.success(`成功生成目标及 ${krCount} 个关键结果！`);
    } else {
      // Generate Goal only
      const request: GenerateGoalRequest = {
        idea: formData.value.idea.trim(),
        category: formData.value.category,
        timeRange: formData.value.timeRange,
        startDate,
        endDate,
        context: formData.value.context.trim() || undefined,
      };

      result = await api.post<GenerateGoalResponse>('/ai/generate/goal', request);
      message.success('成功生成目标！');
    }

    emit('generated', result, { includeKnowledgeDoc: formData.value.includeKnowledgeDoc });

    // Close the dialog - parent component will open GoalDialog for preview/edit
    close();
  } catch (err: any) {
    const errorMsg = err?.response?.data?.message || err?.message || '生成目标失败，请重试';
    error.value = errorMsg;
    emit('error', errorMsg);
    message.error(errorMsg);
  } finally {
    isGenerating.value = false;
  }
}

// Watch for quota changes
watch(() => show.value, async (visible) => {
  if (visible) {
    await loadQuotaStatus();
  }
});

// Expose
defineExpose({
  openDialog,
  close,
});
</script>

<style scoped>
.goal-generate-content {
  padding: 20px 24px;
  height: 100%;
  overflow-y: auto;
}

.goal-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kr-count-slider {
  padding: 0 8px;
}

.generate-btn {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.85) 100%) !important;
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.3) !important;
  text-transform: none !important;
  letter-spacing: 0.3px;
}

.generate-btn:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.4) !important;
  transform: translateY(-1px);
}

:deep(.v-field) {
  border-radius: 12px;
}

:deep(.v-input__details) {
  padding-inline: 12px;
}
</style>
