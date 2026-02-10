<!--
  Goal List View
  目标列表页面
-->
<template>
  <v-container fluid class="pa-0 h-100">
    <!-- 页面头部 -->
    <v-card class="goal-header flex-shrink-0" elevation="1" rounded="0">
      <v-card-text class="pa-4">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-avatar size="48" color="primary" variant="tonal" class="mr-4">
              <v-icon size="24">mdi-target</v-icon>
            </v-avatar>
            <div>
              <h1 class="text-h4 font-weight-bold text-primary mb-1">目标管理</h1>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">管理您的目标和关键结果</p>
            </div>
          </div>

          <div class="d-flex gap-2">
            <v-btn color="secondary" size="large" prepend-icon="mdi-compare" variant="outlined" @click="goToComparison">
              对比目标
            </v-btn>
            <v-btn color="secondary" size="large" prepend-icon="mdi-robot" variant="tonal"
              @click="aiGoalCreatorRef?.open()">
              AI 创建
            </v-btn>
            <v-btn color="primary" size="large" prepend-icon="mdi-plus" variant="elevated"
              @click="goalDialogRef?.openForCreate()">
              创建目标
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- 主体内容 -->
    <div class="main-content flex-grow-1 pa-6 overflow-hidden">
      <div class="content-wrapper h-100">
        <v-row no-gutters class="h-100">
          <!-- 侧边栏 - 目标分类 -->
          <v-col cols="12" md="3" class="pr-md-6 mb-6 mb-md-0 h-100">
            <GoalFolderComponent :goal-folders="GoalFolders" @selected-goal-folder="onSelectedGoalFolder"
              @create-goal-folder="GoalFolderDialogRef?.openForCreate"
              @edit-goal-folder="GoalFolderDialogRef?.openForEdit" @delete-goal-folder="handleDeleteFolder"
              class="h-100" />
          </v-col>

          <!-- 目标列表区域 -->
          <v-col cols="12" md="9" class="h-100">
            <v-card class="goal-main h-100 d-flex flex-column" elevation="2">
              <!-- 状态过滤器 -->
              <v-card-title class="pa-4 flex-shrink-0">
                <div class="d-flex align-center justify-space-between w-100">
                  <h2 class="text-h6 font-weight-medium">目标列表</h2>

                  <!-- 状态标签 -->
                  <v-chip-group v-model="selectedStatusIndex" selected-class="text-primary" mandatory
                    class="status-tabs">
                    <v-chip v-for="(tab, index) in statusTabs" :key="tab.value" :value="index" variant="outlined" filter
                      class="status-chip">
                      {{ tab.label }}
                      <v-badge :content="getGoalCountByStatus(tab.value)"
                        :color="selectedStatusIndex === index ? 'primary' : 'surface-bright'" inline class="ml-2" />
                    </v-chip>
                  </v-chip-group>
                </div>
              </v-card-title>

              <v-divider class="flex-shrink-0" />

              <!-- 目标列表内容 -->
              <v-card-text class="goal-list-content pa-4 flex-grow-1 overflow-y-auto">
                <!-- 加载状态 -->
                <div v-if="isLoading" class="d-flex justify-center align-center h-100">
                  <v-progress-circular indeterminate color="primary" size="64" />
                </div>

                <!-- 有目标时显示 -->
                <div v-else-if="filteredGoals?.length">
                  <v-row>
                    <v-col v-for="goal in filteredGoals" :key="goal.uuid" cols="12" lg="6" xl="4">
                      <goal-card :goal="goal" @edit-goal="handleEditGoal" @delete-goal="confirmDeleteGoal"
                        @toggle-status="onToggleGoalStatus" />
                    </v-col>
                  </v-row>
                </div>

                <!-- 空状态 -->
                <div v-else class="d-flex align-center justify-center h-100">
                  <v-empty-state icon="mdi-target" title="暂无目标" text="创建您的第一个目标，开始目标管理之旅">
                    <template v-slot:actions>
                      <v-btn color="primary" variant="elevated" prepend-icon="mdi-plus"
                        @click="goalDialogRef?.openForCreate()">
                        创建第一个目标
                      </v-btn>
                    </template>
                  </v-empty-state>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- 确认删除对话框 -->
    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card>
        <v-card-title class="text-h6">确认删除</v-card-title>
        <v-card-text> 您确定要删除这个目标吗？此操作无法撤销。 </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="deleteDialog.show = false"> 取消 </v-btn>
          <v-btn color="error" variant="text" @click="handleDeleteGoal"> 删除 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <GoalDialog ref="goalDialogRef" />
    <GoalFolderDialog ref="GoalFolderDialogRef" />
    <AIGoalCreator ref="aiGoalCreatorRef" @goal-created="handleAIGoalCreated" />
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useGoalManagement } from '../composables/useGoalManagement';
import { useGoalFolder } from '../composables/useGoalFolder';
import { useGoalStore } from '../stores/goalStore';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';
import type { Goal, GoalFolder } from '@dailyuse/goal/domain-client';

// 组件导入
import GoalCard from '../components/cards/GoalCard.vue';
import GoalFolderComponent from '../components/GoalFolder.vue';
import GoalDialog from '../components/dialogs/GoalDialog.vue';
import GoalFolderDialog from '../components/dialogs/GoalFolderDialog.vue';
import AIGoalCreator from '../../../../modules/ai/presentation/components/AIGoalCreator.vue';
// composables

const router = useRouter();

// 使用拆分后的 composables
const goalManagement = useGoalManagement();
const goalFolderComposable = useGoalFolder();

// 解构需要的方法和状态
const {
  isLoading,
  error,
  goals,
  fetchGoals,
  deleteGoal,
  refresh,
  initializeData,
} = goalManagement;

const { folders: GoalFolders, fetchFolders: fetchGoalFolders } = goalFolderComposable;

const goalStore = useGoalStore();

// 获取 message 用于错误提示
const message = getGlobalMessage();

// ===== 本地状态 =====

const selectedDirUuid = ref<string>('all');
const selectedStatusIndex = ref(0);

// dialogs
const goalDialogRef = ref<InstanceType<typeof GoalDialog> | null>(null);
const GoalFolderDialogRef = ref<InstanceType<typeof GoalFolderDialog> | null>(null);
const aiGoalCreatorRef = ref<InstanceType<typeof AIGoalCreator> | null>(null);

const deleteDialog = reactive({
  show: false,
  goalUuid: '',
});

// const snackbar = reactive({
//     show: false,
//     message: '',
//     color: 'success',
//     timeout: 3000
// });

// 状态标签配置
const statusTabs = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'active' },
  { label: '已暂停', value: 'paused' },
  { label: '已完成', value: 'completed' },
  { label: '已归档', value: 'archived' },
];

// ===== 计算属性 =====

/**
 * 根据选中的分类过滤目标
 */
const goalsInSelectedFolder = computed(() => {
  let result = goals.value;

  // 按目录过滤
  if (selectedDirUuid.value && selectedDirUuid.value !== 'all') {
    if (selectedDirUuid.value === 'archived') {
      result = goalStore.getGoalsByStatus('ARCHIVED');
    } else {
      result = goalStore.getGoalsByDir(selectedDirUuid.value);
    }
  }

  return result;
});

/**
 * 过滤后的目标列表（分类 + 状态双重过滤）
 */
const filteredGoals = computed(() => {
  let result = goalsInSelectedFolder.value;

  // 按状态过滤
  const currentStatus = statusTabs[selectedStatusIndex.value]?.value;
  if (currentStatus && currentStatus !== 'all') {
    result = result.filter((goal: Goal) => goal.status === currentStatus.toUpperCase());
  }

  return result;
});

// ===== 方法 =====

/**
 * 根据状态获取目标数量的计算属性（基于当前选中的分类）
 */
const goalCountByStatus = computed(() => {
  const goalsInFolder = goalsInSelectedFolder.value;

  return {
    all: goalsInFolder.length,
    active: goalsInFolder.filter((goal: Goal) => goal.status === 'ACTIVE').length,
    paused: goalsInFolder.filter((goal: Goal) => goal.status === 'DRAFT').length,
    completed: goalsInFolder.filter((goal: Goal) => goal.status === 'COMPLETED').length,
    archived: goalsInFolder.filter((goal: Goal) => goal.status === 'ARCHIVED').length,
  };
});

/**
 * 根据状态获取目标数量
 */
const getGoalCountByStatus = (status: string) => {
  return goalCountByStatus.value[status as keyof typeof goalCountByStatus.value] || 0;
};

/**
 * 选择目录
 */
const onSelectedGoalFolder = (dirUuid: string) => {
  selectedDirUuid.value = dirUuid;
};

/**
 * 跳转到多目标对比页面
 */
const goToComparison = () => {
  router.push('/goals/compare');
};

/**
 * 处理编辑目标
 */
const handleEditGoal = (goal: Goal) => {
  goalDialogRef.value?.openForEdit(goal);
};

/**
 * 确认删除目标
 */
const confirmDeleteGoal = (goalUuid: string) => {
  deleteDialog.goalUuid = goalUuid;
  deleteDialog.show = true;
};

/**
 * 删除目标
 */
const handleDeleteGoal = async () => {
  try {
    await deleteGoal(deleteDialog.goalUuid);
    deleteDialog.show = false;
    message.success('删除目标成功');
  } catch (error) {
    console.error('删除目标失败:', error);
    message.error('删除目标失败');
  }
};

/**
 * 删除分类
 */
const handleDeleteFolder = async (folderUuid: string) => {
  // TODO: 添加确认对话框
  if (confirm('确定要删除这个分类吗？此操作无法撤销。')) {
    try {
      await goalFolderComposable.deleteFolder(folderUuid);
      // 如果删除的是当前选中的分类，切换到"全部"
      if (selectedDirUuid.value === folderUuid) {
        selectedDirUuid.value = 'all';
      }
      message.success('删除分类成功');
    } catch (error) {
      console.error('删除分类失败:', error);
      message.error('删除分类失败');
    }
  }
};

/**
 * 切换目标状态
 */
const onToggleGoalStatus = () => { };

/**
 * 处理 AI 创建的目标
 */
const handleAIGoalCreated = async (goalData: any) => {
  console.log('AI 创建的目标数据:', goalData);
  // 打开 GoalDialog 并预填充 AI 生成的数据
  goalDialogRef.value?.openForCreate(goalData);
  message.success('AI 生成的目标已加载，请确认后保存');
};

/**
 * 显示提示消息
 */
// const showSnackbar = (message: string, color: string = 'success') => {
//     snackbar.message = message;
//     snackbar.color = color;
//     snackbar.show = true;
// };

/**
 * 打开创建目录对话框
 */
const openCreateDirDialog = () => {
  // TODO: 实现创建目录对话框
};

/**
 * 打开编辑目录对话框
 */
const openEditDirDialog = (folder: GoalFolder) => {
  // TODO: 实现编辑目录对话框
};

// ===== 生命周期 =====

onMounted(async () => {
  try {
    await initializeData();
    await fetchGoals();
    await fetchGoalFolders();
  } catch (error) {
    console.error('初始化失败:', error);
    message.error('初始化失败');
  }
});
</script>

<style scoped>
.main-content {
  height: calc(100vh - 120px);
}

.content-wrapper {
  max-height: 100%;
}

.goal-header {
  background: linear-gradient(135deg,
      rgba(var(--v-theme-primary), 0.05),
      rgba(var(--v-theme-surface), 1));
}

.goal-main {
  border-radius: 12px;
}

.goal-list-content {
  min-height: 400px;
}

.status-tabs {
  gap: 8px;
}

.status-chip {
  transition: all 0.2s ease;
}

.status-chip:hover {
  transform: translateY(-1px);
}
</style>
