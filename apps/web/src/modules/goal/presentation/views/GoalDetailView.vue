<template>
  <v-container fluid class="goal-info-container pa-0">
    <!-- 头部导航栏 -->
    <v-toolbar
      :color="`rgba(var(--v-theme-surface))`"
      elevation="2"
      class="goal-info-header flex-shrink-0 mb-4"
    >
      <v-btn icon @click="$router.back()">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      <v-toolbar-title class="text-h6 font-weight-medium">
        {{ goal?.title || '未检测到' }}
      </v-toolbar-title>

      <v-spacer />

      <!-- 编辑按钮 -->
      <v-btn icon @click="handleEditGoal">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>

      <!-- 复盘功能菜单 -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-book-edit</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="gotoGoalReviewCreationView(goal?.uuid as string)">
            <v-list-item-title>期中复盘</v-list-item-title>
          </v-list-item>
          <v-list-item @click="openGoalReviewListCard()">
            <v-list-item-title>复盘记录</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- 更多功能菜单 -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="toggleArchiveGoal(goal?.uuid as string)">
            <template v-slot:prepend>
              <v-icon>mdi-archive</v-icon>
            </template>
            <v-list-item-title>{{ isArchived ? '取消归档' : '归档' }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="startDeleteGoal(goal?.uuid as string)">
            <template v-slot:prepend>
              <v-icon>mdi-delete</v-icon>
            </template>
            <v-list-item-title>{{ '删除' }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-toolbar>

    <!-- 主要内容区域 -->
    <div class="main-content flex-grow-1 px-10">
      <div class="content-wrapper">
        <!-- 目标完成提示卡片 -->
        <v-alert
          v-if="isGoalEnded"
          type="success"
          variant="tonal"
          class="mb-6"
          icon="mdi-flag-checkered"
        >
          <template v-slot:title> 目标已结束 </template>
          <div class="d-flex align-center justify-space-between">
            <span>共历时 {{ totalDays }} 天，目标进度 {{ goal?.overallProgress }}%</span>
            <v-btn
              color="success"
              variant="elevated"
              size="small"
              @click="gotoGoalReviewCreationView(goal?.uuid as string)"
            >
              复盘目标
            </v-btn>
          </div>
        </v-alert>

        <!-- 目标基本信息卡片 -->
        <v-card class="mb-6 flex-shrink-0" elevation="2">
          <v-card-text class="pa-6">
            <v-row>
              <!-- 进度圆环 -->
              <v-col cols="12" md="4" class="d-flex flex-column justify-center align-center">
                <div class="progress-container mb-3">
                  <v-progress-circular
                    :model-value="goal?.overallProgress"
                    :color="goalColor"
                    size="120"
                    width="12"
                    class="progress-circle"
                  >
                    <div class="progress-text-container">
                      <div class="progress-value">
                        <span class="text-h4 font-weight-bold">{{ goal?.overallProgress }}</span>
                        <span class="text-h6 text-medium-emphasis">%</span>
                      </div>
                      <div class="text-caption text-medium-emphasis">目标进度</div>
                    </div>
                  </v-progress-circular>
                </div>
                <!-- 查看进度详情按钮 -->
                <v-btn
                  v-if="keyResults && keyResults.length > 0"
                  size="small"
                  variant="outlined"
                  :color="goalColor"
                  prepend-icon="mdi-chart-pie"
                  @click="showProgressBreakdown = true"
                >
                  查看进度详情
                </v-btn>
              </v-col>

              <!-- 时间信息 -->
              <v-col cols="12" md="8">
                <div class="time-info">
                  <!-- 剩余天数 -->
                  <div class="mb-4">
                    <template v-if="isGoalEnded">
                      <v-chip color="success" variant="elevated" size="large">
                        <v-icon start>mdi-check-circle</v-icon>
                        已结束
                      </v-chip>
                    </template>
                    <template v-else>
                      <div class="d-flex align-center mb-2">
                        <span class="text-h3 font-weight-bold text-primary mr-2">{{
                          remainingDays
                        }}</span>
                        <span class="text-h6">天后结束</span>
                      </div>
                    </template>
                  </div>

                  <!-- 日期范围 -->
                  <div class="mb-4">
                    <v-chip variant="outlined" prepend-icon="mdi-calendar-range">
                      {{ goal?.startDate ? format(goal.startDate, 'yyyy-MM-dd') : '未知' }} -
                      {{ goal?.targetDate ? format(goal.targetDate, 'yyyy-MM-dd') : '未知' }}
                    </v-chip>
                  </div>

                  <!-- 时间进度条 -->
                  <div>
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="text-body-2 text-medium-emphasis">时间进度</span>
                      <span class="text-body-2 font-weight-medium">{{ timeProgress }}%</span>
                    </div>
                    <v-progress-linear
                      :model-value="parseFloat(timeProgress)"
                      :color="goalColor"
                      height="8"
                      rounded
                    />
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- 动机与可行性卡片 -->
        <v-card
          class="mb-6 flex-shrink-0"
          elevation="2"
          :style="{ borderLeft: `4px solid ${goalColor}` }"
        >
          <v-card-text>
            <div class="d-flex align-center mb-3">
              <v-icon :color="goalColor" class="mr-2">
                {{ isShowingMotive ? 'mdi-lighthouse' : 'mdi-lightbulb' }}
              </v-icon>
              <span class="text-h6 font-weight-medium">
                {{ isShowingMotive ? '目标动机' : '可行性分析' }}
              </span>
            </div>
            <div class="text-body-1 font-italic text-medium-emphasis">
              {{ isShowingMotive ? goal?.analysis.motive : goal?.analysis.feasibility }}
            </div>
          </v-card-text>
        </v-card>

        <!-- 内容标签页 -->
        <v-card elevation="2" class="tabs-card">
          <div class="d-flex align-center">
            <v-tabs v-model="activeTab" :color="goalColor" class="px-4 pt-2 flex-shrink-0 flex-grow-1">
              <v-tab value="keyResults">
                <v-icon start>mdi-target</v-icon>
                关键结果
              </v-tab>
              <v-tab value="dag">
                <v-icon start>mdi-graph-outline</v-icon>
                权重关系图
              </v-tab>
              <v-tab value="repositories">
                <v-icon start>mdi-source-repository</v-icon>
                关联仓库
              </v-tab>
            </v-tabs>
            
            <!-- 添加关键结果按钮 -->
            <v-btn
              v-if="activeTab === 'keyResults'"
              color="primary"
              size="small"
              variant="elevated"
              prepend-icon="mdi-plus"
              class="mr-4"
              @click="openCreateKeyResultDialog"
            >
              添加关键结果
            </v-btn>
          </div>

          <div class="tab-content">
            <v-window v-model="activeTab" class="h-100">
              <!-- 关键结果标签页 -->
              <v-window-item value="keyResults" class="h-100">
                <div class="scrollable-content">
                  <v-row v-if="keyResults">
                    <v-col v-for="keyResult in keyResults" :key="keyResult.uuid" cols="12" lg="6">
                      <KeyResultCard :keyResult="keyResult" :goal="(goal as Goal)" />
                    </v-col>
                  </v-row>
                  <v-empty-state
                    v-else
                    icon="mdi-target"
                    title="暂无关键结果"
                    text="添加关键结果来跟踪目标进度"
                  >
                    <template v-slot:actions>
                      <v-btn
                        color="primary"
                        variant="elevated"
                        prepend-icon="mdi-plus"
                        @click="openCreateKeyResultDialog"
                      >
                        添加第一个关键结果
                      </v-btn>
                    </template>
                  </v-empty-state>
                </div>
              </v-window-item>

              <!-- 权重关系图标签页 -->
              <v-window-item value="dag" class="h-100">
                <div class="scrollable-content">
                  <GoalDAGVisualization
                    v-if="goal"
                    :goal-uuid="goal.uuid"
                    @node-click="handleNodeClick"
                  />
                </div>
              </v-window-item>

              <!-- 关联仓库标签页 -->
              <v-window-item value="repositories" class="h-100">
                <div class="scrollable-content">
                  <!-- <v-row v-if="relativeRepos.length > 0">
                                        <v-col v-for="repo in relativeRepos" :key="repo.name" cols="12" lg="6">
                                            <RepoInfoCard :repository="Repository.ensureRepositoryNeverNull(repo)" />
                                        </v-col>
                                    </v-row>
                                    <v-empty-state v-else icon="mdi-source-repository" title="暂无关联仓库"
                                        text="关联代码仓库来跟踪开发进度" /> -->
                </div>
              </v-window-item>
            </v-window>
          </div>
        </v-card>
      </div>
    </div>

    <!-- 对话框 -->
    <!-- 目标对话框 -->
    <GoalDialog ref="goalDialogRef" />
    <!-- 关键结果对话框 -->
    <KeyResultDialog ref="keyResultDialogRef" />
    <!-- 关键结果对话框 -->
    <KeyResultDialog ref="keyResultDialogRef" />
    <!-- 进度分解对话框 -->
    <v-dialog v-model="showProgressBreakdown" max-width="700">
      <ProgressBreakdownPanel
        v-if="goal?.uuid"
        :goal-uuid="goal.uuid"
        @close="showProgressBreakdown = false"
      />
    </v-dialog>
    <GoalReviewListCard ref="goalReviewListCardRef" :goal="(goal as Goal)" />
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, type ComputedRef, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// store
import { useGoalStore } from '../stores/goalStore';

// composables
import { useGoal } from '../composables/useGoal';
import { useMessage } from '@dailyuse/ui-vuetify';
// domain
import { Goal } from '@dailyuse/goal/domain-client';

// 组件
import GoalDialog from '@/modules/goal/presentation/components/dialogs/GoalDialog.vue';
import KeyResultDialog from '@/modules/goal/presentation/components/dialogs/KeyResultDialog.vue';
import GoalReviewListCard from '@/modules/goal/presentation/components/cards/GoalReviewListCard.vue';
import KeyResultCard from '@/modules/goal/presentation/components/cards/KeyResultCard.vue';
import GoalDAGVisualization from '@/modules/goal/presentation/components/dag/GoalDAGVisualization.vue';
import ProgressBreakdownPanel from '@/modules/goal/presentation/components/ProgressBreakdownPanel.vue';
// import RepoInfoCard from '@/modules/Repository/presentation/components/RepoInfoCard.vue';
// utils
import { format } from 'date-fns';
const route = useRoute();
const router = useRouter();
const goalStore = useGoalStore();
const message = useMessage();

const { deleteGoal, getGoalAggregateView } = useGoal();

// component refs
const goalDialogRef = ref<InstanceType<typeof GoalDialog> | null>(null);
const keyResultDialogRef = ref<InstanceType<typeof KeyResultDialog> | null>(null);
const goalReviewListCardRef = ref<InstanceType<typeof GoalReviewListCard> | null>(null);

// state
const showProgressBreakdown = ref(false);

const goal: ComputedRef<Goal | null> = computed(() => {
  const goalUuid = route.params.id as string;
  if (!goalUuid) return null;
  return goalStore.getGoalByUuid(goalUuid);
});

console.log('[goalDetailView]Current Goal:', goal.value);

const timeRangeSummary = computed(() => goal.value?.timeRangeSummary ?? null);

const remainingDays = computed(() => {
  const summary = timeRangeSummary.value;
  if (summary && summary.remainingDays !== undefined && summary.remainingDays !== null) {
    return summary.remainingDays;
  }
  if (!goal.value?.targetDate) return 0;
  const endTime = goal.value.targetDate;
  const remaining = endTime - Date.now();
  return remaining > 0 ? Math.ceil(remaining / (1000 * 60 * 60 * 24)) : 0;
});

const keyResults = computed(() => {
  const keyResults = goal.value?.keyResults || [];
  return keyResults.length > 0 ? keyResults : null;
});

const goalColor = computed(() => goal.value?.color || '#FF5733');

const isArchived = computed(() => goal.value?.folderUuid === 'archive');
const toggleArchiveGoal = (goalUuid: string) => {
  if (!isArchived.value) {
    console.log('archive goal', goalUuid);
  } else {
    console.log('unarchive');
  }
};

const startDeleteGoal = async (goalUuid: string) => {
  try {
    const confirmed = await message.delConfirm(
      '您确定要删除这个目标吗？此操作不可逆。',
      '删除目标'
    );
    if (confirmed) {
      deleteGoal(goalUuid);
    } else {
      console.log('❌ 删除目标操作已取消');
    }
  } catch (error) {
    console.error('确认对话框错误:', error);
  }
};

const isGoalEnded = computed(() => {
  if (!goal.value?.targetDate) return false;
  return goal.value.targetDate < Date.now();
});

const totalDays = computed(() => {
  const summary = timeRangeSummary.value;
  if (summary && summary.durationDays) {
    return summary.durationDays;
  }
  if (!goal.value?.startDate || !goal.value?.targetDate) return 0;
  const timeDiff = goal.value.targetDate - goal.value.startDate;
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

const timeProgress = computed(() => {
  const derived = goal.value?.timeProgressPercentage;
  if (typeof derived === 'number' && !Number.isNaN(derived)) {
    return derived.toFixed(1);
  }
  const summary = timeRangeSummary.value;
  if (summary && summary.elapsedDays !== null && summary.elapsedDays !== undefined && summary.durationDays) {
    const ratio = summary.elapsedDays / summary.durationDays;
    const clamped = Math.min(Math.max(ratio, 0), 1);
    return (clamped * 100).toFixed(1);
  }
  if (!goal.value?.startDate || !goal.value?.targetDate) return '0';
  const now = Date.now();
  const totalTime = goal.value.targetDate - goal.value.startDate;
  const elapsedTime = now - goal.value.startDate;
  const progress = (elapsedTime / totalTime) * 100;
  return Math.min(Math.max(progress, 0), 100).toFixed(1);
});

const isShowingMotive = ref(Math.random() > 0.5);

const activeTab = ref('keyResults');
const relativeRepos = computed(() => {
  const repos = [] as any[];
  return repos;
});

const gotoGoalReviewCreationView = (goalUuid: string) => {
  console.log('Go to goal review creation', goalUuid);
  router.push({
    name: 'goal-review-create',
    params: { goalUuid },
  });
};

const gotoGoalReviewDetailView = (goalUuid: string) => {
  console.log('Go to goal review detail', goalUuid);
  router.push({
    name: 'goal-review-detail',
    params: { goalUuid },
  });
};

const openGoalReviewListCard = () => {
  console.log('Opening goal review list card');
  goalReviewListCardRef.value?.openDialog();
};

// 处理编辑目标
const handleEditGoal = () => {
  if (goal.value) {
    goalDialogRef.value?.openForEdit(goal.value as Goal);
  }
};

// DAG 节点点击处理
const handleNodeClick = (data: { id: string; type: 'goal' | 'kr' }) => {
  console.log('DAG node clicked:', data);
  if (data.type === 'kr') {
    // 可以跳转到 KR 详情或滚动到对应的 KeyResultCard
    activeTab.value = 'keyResults';
    // TODO: 滚动到对应的 KR Card
  }
};

// 打开创建关键结果对话框
const openCreateKeyResultDialog = () => {
  if (goal.value?.uuid && keyResultDialogRef.value) {
    keyResultDialogRef.value.openForCreateKeyResult(goal.value.uuid);
  }
};

</script>

<style scoped>
.goal-info-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.02) 0%,
    rgba(var(--v-theme-surface), 0.91) 100%
  );
}

.main-content {
  min-height: 0;
  overflow: hidden;
}

.content-wrapper {
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.tabs-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 400px;
  /* 确保有最小高度用于显示 DAG */
  max-height: calc(100vh - 450px);
}

.tab-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.scrollable-content {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  /* 确保底部有足够的空间 */
  padding-bottom: 24px;
}

.progress-text-container {
  text-align: center;
}

.time-info {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
