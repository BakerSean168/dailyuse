<template>
  <v-dialog :model-value="visible" height="550" width="800" class="goal-dialog" persistent>
    <v-card :style="{ backgroundColor: 'rgb(var(--v-theme-surface))' }" class="px-2 pb-2 d-flex flex-column"
      style="height: 550px">
      <!-- 对话框头部 -->
      <v-card-title class="d-flex justify-space-between pa-4 flex-shrink-0">
        <v-btn variant="elevated" color="red-darken-3" @click="handleCancel">取消</v-btn>
        <span class="text-h5">{{ isEditing ? '编辑目标' : '新建目标' }}</span>
        <v-btn color="primary" @click="handleSave" :disabled="!isFormValid || loading" :loading="loading">
          完成
        </v-btn>
      </v-card-title>

      <!-- Tabs -->
      <v-tabs v-model="activeTab" class="d-flex justify-center align-center flex-shrink-0 mb-2 pa-2"
        :style="{ backgroundColor: 'rgb(var(--v-theme-surface))' }">
        <v-tab v-for="(tab, index) in tabs" :key="index" :value="index" class="flex-grow-1" :style="activeTab === index
            ? { backgroundColor: 'rgba(var(--v-theme-surface-light), 0.3)' }
            : {}
          ">
          <v-icon :icon="tab.icon" :color="tab.color" class="mr-2" />
          {{ tab.name }}
        </v-tab>
      </v-tabs>

      <v-card-text :style="{ backgroundColor: 'rgba(var(--v-theme-surface-light), 0.3)' }" class="pa-0 scroll-area">
        <v-window v-model="activeTab" class="h-100 w-90">
          <!-- 基本信息 -->
          <v-window-item :value="tabs.findIndex(t => t.name === '基本信息')">
            <v-form @submit.prevent class="px-4 py-2">
              <!-- 使用模板按钮 -->
              <v-alert v-if="!isEditing" type="info" variant="tonal" density="compact" class="mb-4">
                <div class="d-flex align-center justify-space-between">
                  <span>快速开始：从专业模板创建目标</span>
                  <v-btn variant="elevated" color="secondary" prepend-icon="mdi-lightbulb-outline"
                    @click="templateBrowserRef?.open()">
                    浏览模板
                  </v-btn>
                </div>
              </v-alert>

              <v-row>
                <v-col cols="11">
                  <v-text-field v-model="goalName" :rules="nameRules" label="目标" placeholder="一段话来描述自己的目标" required />
                </v-col>
                <v-col cols="1">
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" :style="{ backgroundColor: goalColor }" class="color-btn mt-2" icon>
                        <v-icon color="white">mdi-palette</v-icon>
                      </v-btn>
                    </template>
                    <v-card min-width="200">
                      <v-card-text>
                        <div class="color-grid">
                          <v-btn v-for="colorOption in predefinedColors" :key="colorOption"
                            :style="{ backgroundColor: colorOption }" class="color-option" icon
                            @click="goalColor = colorOption" />
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-menu>
                </v-col>
              </v-row>

              <v-select v-model="GoalFolderUuid" :items="directoryOptions" item-title="text" item-value="value"
                label="目标文件夹" :disabled="directoryOptions.length === 0">
                <template v-slot:prepend-inner>
                  <v-icon>mdi-folder</v-icon>
                </template>
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <v-icon>{{ item.raw.value ? 'mdi-folder' : 'mdi-folder-outline' }}</v-icon>
                    </template>
                  </v-list-item>
                </template>
              </v-select>

              <v-textarea v-model="goalDescription" label="目标描述" rows="3" />

              <v-row>
                <v-col cols="6">
                  <v-text-field v-model="startTimeFormatted" label="开始时间" type="date" :rules="startTimeRules"
                    @update:model-value="updateStartTime" :min="minDate" placeholder="默认：今天" />
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="endTimeFormatted" label="结束时间" type="date" :rules="endTimeRules"
                    :min="startTimeFormatted" @update:model-value="updateEndTime" placeholder="默认：3个月后" />
                </v-col>
              </v-row>

              <v-textarea v-model="goalDescription" label="目标描述" placeholder="详细描述目标的具体内容和预期结果..." rows="3" />
            </v-form>
          </v-window-item>

          <!-- Motivation & Feasibility Tab -->
          <v-window-item :value="tabs.findIndex(t => t.name === '动机分析')">
            <div class="motivation-section">
              <v-row>
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="h-100">
                    <v-card-title class="pb-2">
                      <v-icon color="primary" class="mr-2">mdi-lighthouse</v-icon>
                      目标动机
                    </v-card-title>
                    <v-card-text>
                      <v-textarea v-model="goalMotive" placeholder="为什么要实现这个目标？它对你意味着什么？" variant="outlined" rows="6"
                        density="comfortable" hide-details />
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="h-100">
                    <v-card-title class="pb-2">
                      <v-icon color="success" class="mr-2">mdi-lightbulb</v-icon>
                      可行性分析
                    </v-card-title>
                    <v-card-text>
                      <v-textarea v-model="goalFeasibility" placeholder="分析实现这个目标的可行性、所需资源和可能的挑战" variant="outlined"
                        rows="6" density="comfortable" hide-details />
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-window-item>

          <!-- Auto Status Rules Tab -->
          <v-window-item :value="tabs.findIndex(t => t.name === '规则设置')">
            <div class="rules-section px-4 py-2">
              <StatusRuleEditor />
            </div>
          </v-window-item>

          <!-- Key Results Tab -->
          <v-window-item :value="tabs.findIndex(t => t.name === '关键结果')">
            <div class="key-results-section px-4 py-2">
              <!-- Empty state when no key results -->
              <v-alert 
                v-if="!goalModel?.keyResults?.length" 
                type="info" 
                variant="tonal" 
                density="compact"
                class="mb-4"
              >
                <div class="d-flex align-center justify-space-between">
                  <span>暂无关键结果，请添加可衡量的关键结果来追踪目标进度</span>
                  <v-btn 
                    variant="elevated" 
                    color="primary" 
                    size="small"
                    prepend-icon="mdi-plus"
                    @click="openKeyResultDialog()"
                  >
                    添加关键结果
                  </v-btn>
                </div>
              </v-alert>

              <!-- Key Results List -->
              <v-list v-else class="key-results-list" density="compact">
                <v-list-item
                  v-for="(kr, index) in goalModel?.keyResults"
                  :key="kr.uuid"
                  class="kr-item mb-2 pa-3"
                  rounded
                >
                  <template #prepend>
                    <v-avatar size="32" :color="goalColor" class="mr-2">
                      <span class="text-white font-weight-bold">{{ index + 1 }}</span>
                    </v-avatar>
                  </template>

                  <v-list-item-title class="font-weight-medium">
                    {{ kr.title || '未命名关键结果' }}
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="kr.description" class="text-caption">
                    {{ kr.description }}
                  </v-list-item-subtitle>
                  <v-list-item-subtitle class="mt-1">
                    <v-chip size="x-small" color="primary" variant="tonal" class="mr-1">
                      {{ kr.progress?.valueType === 'PERCENTAGE' ? '百分比' : '数值' }}
                    </v-chip>
                    <v-chip size="x-small" color="secondary" variant="tonal">
                      目标: {{ kr.progress?.targetValue ?? 100 }}{{ kr.progress?.unit || '' }}
                    </v-chip>
                  </v-list-item-subtitle>

                  <template #append>
                    <div class="d-flex align-center">
                      <v-btn
                        icon
                        variant="text"
                        size="small"
                        color="primary"
                        @click="editKeyResult((kr as KeyResult))"
                      >
                        <v-icon size="18">mdi-pencil</v-icon>
                      </v-btn>
                      <v-btn
                        icon
                        variant="text"
                        size="small"
                        color="error"
                        @click="removeKeyResultFromList(kr.uuid)"
                      >
                        <v-icon size="18">mdi-delete</v-icon>
                      </v-btn>
                    </div>
                  </template>
                </v-list-item>

                <!-- Add more button at bottom -->
                <v-btn 
                  block 
                  variant="outlined" 
                  color="primary" 
                  class="mt-3"
                  prepend-icon="mdi-plus"
                  @click="openKeyResultDialog()"
                >
                  添加关键结果
                </v-btn>
              </v-list>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- 内嵌的关键结果对话框 -->
  <KeyResultDialog ref="keyResultDialogRef" />
  <!-- AI 权重推荐面板 -->
  <WeightSuggestionPanel ref="weightSuggestionRef" :key-results="((goalModel?.keyResults || []) as KeyResult[])"
    @apply="handleApplyWeightStrategy" />
  <!-- 目标模板浏览器 -->
  <TemplateBrowser ref="templateBrowserRef" @apply="handleApplyTemplate" />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
// components
import KeyResultDialog from './KeyResultDialog.vue';
import WeightSuggestionPanel from '../weight/WeightSuggestionPanel.vue';
import TemplateBrowser from '../template/TemplateBrowser.vue';
import StatusRuleEditor from '../rules/StatusRuleEditor.vue';
// types
import { useGoalStore } from '../../stores/goalStore';
import { Goal, KeyResult } from '@dailyuse/goal/domain-client';
import { GoalStatus } from '@dailyuse/contracts/goal';
import type { GoalClientDTO, KeyResultClientDTO, CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { useGoalManagement } from '../../composables/useGoalManagement';
import { useKeyResult } from '../../composables/useKeyResult';
import { useMessage } from '@dailyuse/ui-vuetify';

const goalManagement = useGoalManagement();
const keyResultComposable = useKeyResult();
const message = useMessage();

const { createGoal, updateGoal } = goalManagement;
const { deleteKeyResult } = keyResultComposable;

const goalStore = useGoalStore();

const visible = ref(false);
const propGoal = ref<Goal | null>(null);

// AI 预填充数据
const prefillData = ref<{
  title?: string;
  description?: string;
  category?: string;
  timeframe?: string;
  motivation?: string;
  feasibilityAnalysis?: string;
  importance?: ImportanceLevel;
  tags?: string[];
  suggestedStartDate?: number;
  suggestedEndDate?: number;
  keyResults?: Array<{
    title: string;
    description?: string;
    valueType?: string;
    targetValue?: number;
    unit?: string;
  }>;
} | null>(null);

// 创建完成后的回调（用于 AI 知识文档生成等后续操作）
const onCreatedCallback = ref<((goalDto: GoalClientDTO) => void) | null>(null);

// 组件对象
const keyResultDialogRef = ref<InstanceType<typeof KeyResultDialog> | null>(null);
const weightSuggestionRef = ref<InstanceType<typeof WeightSuggestionPanel> | null>(null);
const templateBrowserRef = ref<InstanceType<typeof TemplateBrowser> | null>(null);

// 使用Goal管理完整goal（包括keyResults）
const loading = ref(false);
const goalModel = ref<Goal | null>(null);

const isEditing = computed(() => !!propGoal.value);

// 监听弹窗和传入对象，初始化本地对象
watch(
  [visible, () => propGoal.value],
  ([isVisible, goal]) => {
    if (isVisible) {
      if (goal) {
        // 编辑模式：克隆现有 goal
        goalModel.value = goal.clone();
      } else {
        // 创建模式：创建新 goal（accountUuid 在保存时注入）
        goalModel.value = Goal.forCreate();
      }
    }
  },
  { immediate: true },
);

// Apply AI weight strategy
const handleApplyWeightStrategy = (strategy: any) => {
  if (!goalModel.value?.keyResults || goalModel.value.keyResults.length === 0) {
    return;
  }

  // 应用权重到每个 KeyResult
  goalModel.value.keyResults.forEach((kr, index) => {
    if (strategy.weights[index] !== undefined && kr.uuid) {
      try {
        goalModel.value?.updateKeyResult(kr.uuid, {
          ...kr,
          weight: strategy.weights[index],
        } as any);
      } catch (error) {
        console.error('Failed to update key result weight:', error);
      }
    }
  });

  console.log(`Applied ${strategy.label} strategy:`, strategy.weights);
};

// 应用目标模板
const handleApplyTemplate = (template: any) => {
  // 填充目标基本信息
  goalName.value = template.title;
  goalDescription.value = template.description;

  // 设置建议的时间范围
  if (template.suggestedDuration) {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + template.suggestedDuration);

    startTimeFormatted.value = today.toISOString().split('T')[0];
    endTimeFormatted.value = endDate.toISOString().split('T')[0];
  }

  // 清空现有关键结果（如果有）
  // KeyResults 是只读的，需要通过 removeKeyResult 逐个删除
  const keyResults = goalModel.value?.keyResults || [];
  keyResults.forEach(kr => {
    goalModel.value?.removeKeyResult(kr.uuid);
  });

  // TODO: 从模板创建关键结果
  // 由于 KeyResult 的创建需要通过 KeyResultDialog，这里只记录日志
  // 用户需要手动添加关键结果，但会看到模板的建议值
  console.log(`Applied template: ${template.title}`);
  console.log(`Suggested KeyResults (${template.keyResults.length}):`, template.keyResults);

  // 切换到 KeyResults tab，引导用户添加 KR
  activeTab.value = 1;

  // 可选：显示提示信息
  alert(
    `已应用模板"${template.title}"！\n建议添加 ${template.keyResults.length} 个关键结果，请点击"添加关键结果"按钮继续。`,
  );
};

const startRemoveKeyResult = async (goal: Goal, keyResultUuid: string) => {
  try {
    const confirmed = await message.delConfirm('确定要删除这个关键结果吗？', '确认删除');
    if (confirmed) {
      // 直接使用 removeKeyResult 方法
      goalModel.value?.removeKeyResult(keyResultUuid);
    }
  } catch {
    // 用户取消或关闭对话框
    console.log('取消删除关键结果');
  }
};

// 打开关键结果对话框（添加新的 KR）
const openKeyResultDialog = () => {
  if (goalModel.value && keyResultDialogRef.value) {
    // 使用 openForCreateKeyResultInGoalEditing 方法
     
    keyResultDialogRef.value.openForCreateKeyResultInGoalEditing(goalModel.value as any);
  }
};

// 编辑关键结果
const editKeyResult = (kr: KeyResult) => {
  if (keyResultDialogRef.value && goalModel.value) {
     
    keyResultDialogRef.value.openForUpdateKeyResultInGoalEditing(goalModel.value as any, kr);
  }
};

// 从列表中移除关键结果（新建模式下）
const removeKeyResultFromList = async (keyResultUuid: string) => {
  if (!goalModel.value) return;
  
  try {
    const confirmed = await message.delConfirm('确定要删除这个关键结果吗？', '确认删除');
    if (confirmed) {
      goalModel.value.removeKeyResult(keyResultUuid);
    }
  } catch {
    console.log('取消删除关键结果');
  }
};

// 监听弹窗和传入对象，初始化本地对象
watch(
  [visible, () => propGoal.value],
  ([isVisible, goal]) => {
    if (isVisible) {
      if (goal) {
        console.log('[GoalDialog] Original Goal before clone:', {
          uuid: goal.uuid,
          title: goal.title,
          keyResultsCount: goal.keyResults?.length || 0,
          keyResults: goal.keyResults,
        });

        goalModel.value = goal.clone();

        console.log('[GoalDialog] Cloned Goal after clone:', {
          uuid: goalModel.value.uuid,
          title: goalModel.value.title,
          keyResultsCount: goalModel.value.keyResults?.length || 0,
          keyResults: goalModel.value.keyResults,
        });
      } else {
        // 创建模式：创建新 goal（accountUuid 在保存时注入）
        goalModel.value = Goal.forCreate();

        // 设置默认日期
        const today = new Date();
        let endDate = new Date(today);

        // 如果有 AI 预填充数据，使用其 timeframe
        if (prefillData.value?.timeframe) {
          switch (prefillData.value.timeframe) {
            case 'week':
              endDate.setDate(endDate.getDate() + 7);
              break;
            case 'month':
              endDate.setMonth(endDate.getMonth() + 1);
              break;
            case 'quarter':
              endDate.setMonth(endDate.getMonth() + 3);
              break;
            case 'year':
              endDate.setFullYear(endDate.getFullYear() + 1);
              break;
            default:
              endDate.setMonth(endDate.getMonth() + 3);
          }
        } else {
          // 默认 3 个月
          endDate.setMonth(endDate.getMonth() + 3);
        }

        goalModel.value.updateStartDate(today.getTime());
        goalModel.value.updateTargetDate(endDate.getTime());

        // 应用 AI 预填充数据
        if (prefillData.value) {
          console.log('[GoalDialog] 应用 AI 预填充数据:', prefillData.value);
          
          if (prefillData.value.title) {
            goalModel.value.updateTitle(prefillData.value.title);
          }
          if (prefillData.value.description) {
            goalModel.value.updateDescription(prefillData.value.description);
          }
          if (prefillData.value.motivation) {
            goalModel.value.updateMotivation(prefillData.value.motivation);
          }
          if (prefillData.value.feasibilityAnalysis) {
            goalModel.value.updateFeasibilityAnalysis(prefillData.value.feasibilityAnalysis);
          }
          if (prefillData.value.importance !== undefined) {
            goalModel.value.updateImportance(prefillData.value.importance as ImportanceLevel);
          }
          if (prefillData.value.tags?.length) {
            goalModel.value.updateTags(prefillData.value.tags);
          }
          // 使用 AI 建议的日期
          if (prefillData.value.suggestedStartDate) {
            goalModel.value.updateStartDate(prefillData.value.suggestedStartDate);
          }
          if (prefillData.value.suggestedEndDate) {
            goalModel.value.updateTargetDate(prefillData.value.suggestedEndDate);
          }
          // TODO: 可以添加 category 映射到 folder 的逻辑

          // 如果有 keyResults，直接添加到 goal 中
          if (prefillData.value.keyResults?.length) {
            console.log(`[GoalDialog] AI 建议的 ${prefillData.value.keyResults.length} 个关键结果:`,
              prefillData.value.keyResults);
            
            // 为每个 AI 生成的 KeyResult 创建 KeyResult 实例并添加到 goal
            prefillData.value.keyResults.forEach((krData: any, index: number) => {
              const kr = KeyResult.forCreate(goalModel.value!.uuid);
              if (krData.title) {
                kr.updateTitle(krData.title);
              }
              if (krData.description) {
                kr.updateDescription(krData.description);
              }
              // 更新进度配置
              kr.updateProgressConfig({
                valueType: krData.valueType || 'percentage',
                targetValue: krData.targetValue ?? 100,
                currentValue: 0,
                unit: krData.unit || undefined,
              });
              kr.updateOrder(index);
              goalModel.value!.addKeyResult(kr);
            });
            
            console.log(`[GoalDialog] 已添加 ${goalModel.value?.keyResults?.length || 0} 个关键结果到目标`);
          }

          // 清空预填充数据
          prefillData.value = null;
        }
      }
    }
  },
  { immediate: true },
);

// Tabs
const activeTab = ref(0);

const allTabs = [
  { name: '基本信息', icon: 'mdi-information', color: 'primary' },
  { name: '关键结果', icon: 'mdi-target', color: 'success' },
  { name: '动机分析', icon: 'mdi-lightbulb', color: 'warning' },
  { name: '规则设置', icon: 'mdi-robot', color: 'info' },
];

// Tabs 无需过滤，创建和编辑都使用相同的 tabs
const tabs = computed(() => allTabs);

// 预定义颜色
const predefinedColors = [
  '#FF5733',
  '#33FF57',
  '#3357FF',
  '#FF33F1',
  '#F1FF33',
  '#33FFF1',
  '#F133FF',
  '#FF3333',
  '#33FF33',
  '#3333FF',
  '#FFAA33',
  '#AA33FF',
  '#33AAFF',
  '#FF33AA',
  '#AAFF33',
];

// 校验规则
const nameRules = [(value: string) => !!value || '目标标题不能为空'];
const startTimeRules = [(value: string) => !!value || '开始时间不能为空'];
const endTimeRules = [
  (value: string) => !!value || '结束时间不能为空',
  (value: string) => {
    if (!value || !startTimeFormatted.value) return true;
    return new Date(value) >= new Date(startTimeFormatted.value) || '结束时间不能早于开始时间';
  },
];

// 表单字段的 getter/setter
const goalName = computed({
  get: () => goalModel.value?.title || '',
  set: (val: string) => {
    goalModel.value?.updateTitle(val);
  },
});

const goalColor = computed({
  get: () => goalModel.value?.color || '#FF5733',
  set: (val: string) => {
    goalModel.value?.updateColor(val);
  },
});

const GoalFolderUuid = computed({
  get: () => goalModel.value?.folderUuid || '',
  set: (val: string) => {
    goalModel.value?.updateFolder(val);
  },
});

const goalDescription = computed({
  get: () => goalModel.value?.description || '',
  set: (val: string) => {
    goalModel.value?.updateDescription(val);
  },
});

// 目标动机
const goalMotive = computed({
  get: () => goalModel.value?.motivation || '',
  set: (val: string) => {
    goalModel.value?.updateMotivation(val);
  },
});

// 可行性分析
const goalFeasibility = computed({
  get: () => goalModel.value?.feasibilityAnalysis || '',
  set: (val: string) => {
    goalModel.value?.updateFeasibilityAnalysis(val);
  },
});

const importanceLevel = computed({
  get: () => goalModel.value?.importance || ImportanceLevel.Moderate,
  set: (val: ImportanceLevel) => {
    goalModel.value?.updateImportance(val);
  },
});

// 日期格式化
const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

const startTimeFormatted = computed({
  get: () => {
    const startDate = goalModel.value?.startDate;
    return startDate ? new Date(startDate).toISOString().split('T')[0] : '';
  },
  set: (val: string) => {
    if (val) {
      const timestamp = new Date(val).getTime();
      goalModel.value?.updateStartDate(timestamp);
    }
  },
});

const endTimeFormatted = computed({
  get: () => {
    const targetDate = goalModel.value?.targetDate;
    return targetDate ? new Date(targetDate).toISOString().split('T')[0] : '';
  },
  set: (val: string) => {
    if (val) {
      const timestamp = new Date(val).getTime();
      goalModel.value?.updateTargetDate(timestamp);
    }
  },
});

const updateStartTime = (val: string) => {
  startTimeFormatted.value = val;
};
const updateEndTime = (val: string) => {
  endTimeFormatted.value = val;
};

const allGoalFolders = computed(() => goalStore.getAllGoalFolders);

const directoryOptions = computed(() =>
  allGoalFolders.value
    .filter((dir) => !goalStore.isSystemGoalFolder(dir.uuid))
    .map((dir) => ({
      text: dir.name,
      value: dir.uuid,
    })),
);

// 表单有效性
const isFormValid = computed(() => {
  if (!goalModel.value || !goalName.value?.trim()) return false;
  const startDate = goalModel.value.startDate;
  const targetDate = goalModel.value.targetDate;
  if (!startDate || !targetDate) return false;
  return targetDate > startDate;
});

// 保存和取消
const handleSave = async () => {
  if (!isFormValid.value || !goalModel.value) return;

  loading.value = true;
  try {
    if (isEditing.value) {
      // 编辑模式：只发送基本字段
      const updateData: any = {
        title: goalModel.value.title,
        description: goalModel.value.description ?? undefined,
        color: goalModel.value.color ?? undefined,
        feasibilityAnalysis: goalModel.value.feasibilityAnalysis ?? undefined,
        motivation: goalModel.value.motivation ?? undefined,
        importance: goalModel.value.importance,
        category: goalModel.value.category ?? undefined,
        tags: goalModel.value.tags,
        startDate: goalModel.value.startDate ?? undefined,
        targetDate: goalModel.value.targetDate ?? undefined,
        folderUuid: goalModel.value.folderUuid ?? undefined,
        parentGoalUuid: goalModel.value.parentGoalUuid ?? undefined,
      };
      await updateGoal(goalModel.value.uuid, updateData);
    } else {
      // 创建模式：后端会从 token 自动注入 accountUuid，前端无需传递
      // 参考 Task 模块的实现方式

      // 转换 KeyResults 为简化格式
      const keyResults = (goalModel.value.keyResults || []).map(kr => ({
        title: kr.title,
        description: kr.description ?? undefined,
        valueType: kr.progress.valueType,
        targetValue: kr.progress.targetValue,
        unit: kr.progress.unit ?? undefined,
        weight: kr.weight,
      }));

      const createData: any = {
        // accountUuid 不传递，后端会从 req.user.accountUuid 或 JWT token 中获取
        title: goalModel.value.title,
        description: goalModel.value.description ?? undefined,
        color: goalModel.value.color ?? undefined,
        feasibilityAnalysis: goalModel.value.feasibilityAnalysis ?? undefined,
        motivation: goalModel.value.motivation ?? undefined,
        importance: goalModel.value.importance,
        category: goalModel.value.category ?? undefined,
        tags: goalModel.value.tags,
        startDate: goalModel.value.startDate ?? undefined,
        targetDate: goalModel.value.targetDate ?? undefined,
        folderUuid: goalModel.value.folderUuid ?? undefined,
        parentGoalUuid: goalModel.value.parentGoalUuid ?? undefined,
        keyResults: keyResults.length > 0 ? keyResults : undefined,
      };

      console.log('✅ 创建目标请求数据（accountUuid 由后端注入）:', createData);
      const createdGoal = await createGoal(createData);
      
      // 调用创建完成回调（如果有）
      if (onCreatedCallback.value && createdGoal) {
        onCreatedCallback.value(createdGoal);
      }
    }
    closeDialog();
  } catch (error) {
    console.error('Failed to save goal:', error);
    // TODO: 显示错误提示
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

/**
 * 通用的打开对话框方法（保留向后兼容）
 */
const openDialog = (goal?: Goal) => {
  propGoal.value = goal || null;
  visible.value = true;
};

/**
 * 打开创建目标对话框
 * @param data 预填充数据（可选，来自 AI 生成或模板）
 * @param onCreated 创建成功后的回调函数（可选，用于 AI 知识文档生成等）
 */
const openForCreate = (data?: {
  title?: string;
  description?: string;
  category?: string;
  timeframe?: string;
  keyResults?: Array<{ title: string; description?: string }>;
}, onCreated?: (goalDto: GoalClientDTO) => void) => {
  propGoal.value = null;
  prefillData.value = data || null;
  onCreatedCallback.value = onCreated || null;
  visible.value = true;
  activeTab.value = 0; // 定位到基本信息标签
};

/**
 * 打开编辑目标对话框
 * @param goal 要编辑的目标对象
 */
const openForEdit = (goal: Goal) => {
  if (!goal) {
    console.error('[GoalDialog] openForEdit: goal is required');
    return;
  }
  propGoal.value = goal;
  visible.value = true;
  activeTab.value = 0; // 定位到基本信息标签
};

watch(visible, (newVal) => {
  if (!newVal) {
    // 重置表单
    propGoal.value = null;
    prefillData.value = null;
    onCreatedCallback.value = null;
    goalModel.value = null;
    activeTab.value = 0;
    loading.value = false;
  }
});

defineExpose({
  openDialog,
  openForCreate,
  openForEdit,
});
</script>

<style scoped>
.goal-dialog {
  overflow-y: auto;
}

.v-card {
  overflow-y: auto;
  max-height: 90vh;
}

.color-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.color-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  padding: 8px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
  min-width: 32px;
}

.color-option:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.motivation-section {
  height: 100%;
}

.v-window {
  height: 100%;
}

.v-window-item {
  height: 100%;
  overflow-y: auto;
}

.v-tab {
  text-transform: none;
  font-weight: 500;
  border-radius: 12px;
  margin: 0 4px;
  transition: all 0.3s ease;
}

.v-tab:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.v-text-field,
.v-textarea,
.v-select {
  margin-bottom: 8px;
}

.v-card[variant='outlined'] {
  border-radius: 12px;
  transition: all 0.2s ease;
}

.v-card[variant='outlined']:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.v-list-item {
  border-radius: 8px;
  margin: 4px 0;
  transition: all 0.2s ease;
}

.v-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.key-results-overview {
  padding: 16px 0;
}

.key-results-section {
  height: 100%;
  overflow-y: auto;
}

.key-results-list {
  background: transparent;
}

.kr-item {
  background: rgba(var(--v-theme-surface-light), 0.3);
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  transition: all 0.2s ease;
}

.kr-item:hover {
  background: rgba(var(--v-theme-surface-light), 0.5);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.add-kr-btn {
  border-radius: 12px;
  text-transform: none;
  font-weight: 500;
}

.add-kr-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3);
}

.scroll-area {
  flex: 1 1 auto;
  overflow: auto;
  min-height: 0;
}

@media (max-width: 768px) {
  .color-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .v-dialog {
    width: 95vw !important;
    height: 90vh !important;
    max-width: none !important;
  }

  .motivation-section .v-row {
    flex-direction: column;
  }

  .motivation-section .v-col {
    max-width: 100%;
  }
}
</style>

