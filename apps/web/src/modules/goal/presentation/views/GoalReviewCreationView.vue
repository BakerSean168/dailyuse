<template>
  <div v-if="loading" class="d-flex justify-center align-center" style="height: 200px">
    <v-progress-circular indeterminate color="primary" />
    <span class="ml-4">加载中...</span>
  </div>
  <div v-else-if="!goal || !localGoalReview" class="d-flex justify-center align-center" style="height: 200px">
    <v-alert type="error" variant="tonal">
      <template #title>加载失败</template>
      未获取到目标信息，请重试
    </v-alert>
  </div>
  <div v-else id="goal-review" class="h-100 w-100 d-flex flex-column">
    <!-- header -->
    <header class="goal-review-header d-flex justify-space-between align-center px-4 py-2">
      <div>
        <v-btn @click="router.back()" variant="tonal" prepend-icon="mdi-arrow-left"> 返回 </v-btn>
      </div>
      <div class="goal-review-header-content d-flex flex-column align-center text-center">
        <span class="text-h4 font-weight-bold mb-2">创建目标复盘</span>
        <span class="text-h6 font-weight-medium">{{ goal?.title }}</span>
        <span class="text-caption font-weight-light">
          {{ localGoalReview ? format(new Date(localGoalReview.reviewedAt), 'yyyy-MM-dd HH:mm') : '' }}
        </span>
      </div>
      <div>
        <v-btn color="primary" size="large" prepend-icon="mdi-check" @click="handleSaveReview" :loading="saving"
          :disabled="!canSave">
          完成复盘
        </v-btn>
      </div>
    </header>

    <main class="goal-review-main pt-4">
      <!-- Charts Section -->
      <section class="goal-review-charts mb-8">
        <v-card elevation="2" class="pa-4">
          <v-card-title class="text-h6 mb-4">
            <v-icon class="mr-2">mdi-chart-line</v-icon>
            进度分析图表
          </v-card-title>
          <v-row>
            <v-col cols="12" md="6">
              <GoalProgressChart :goal="(goal as Goal)" />
            </v-col>
            <v-col cols="12" md="6">
              <KrProgressChart :goal="(goal as Goal)" />
            </v-col>
            <v-col cols="12" md="6">
              <KrCompletionChart :goal="(goal as Goal)" />
            </v-col>
            <v-col cols="12" md="6">
              <KrWeightDistributionChart :goal="(goal as Goal)" />
            </v-col>
            <v-col cols="12">
              <PeriodBarChart :goal="(goal as Goal)" />
            </v-col>
          </v-row>
        </v-card>
      </section>

      <!-- Self Diagnosis -->
      <section class="self-diagnosis">
        <div class="diagnosis-container pa-8">
          <h2 class="text-h5 text-center mb-8 font-weight-bold">
            <v-icon class="mr-2" color="primary">mdi-clipboard-text</v-icon>
            复盘反思
          </h2>

          <div class="diagnosis-grid">
            <div class="diagnosis-card">
              <div class="diagnosis-card-header d-flex align-center gap-3 pa-4">
                <v-icon class="diagnosis-icon" color="success" size="24">mdi-trophy</v-icon>
                <h3 class="text-h6">主要成就</h3>
              </div>
              <div class="diagnosis-card-content pa-4">
                <v-textarea v-model="achievements" placeholder="列出这段时间的主要成就和突破..." variant="outlined"
                  rows="4" auto-grow hide-details />
              </div>
            </div>

            <div class="diagnosis-card">
              <div class="diagnosis-card-header d-flex align-center gap-3 pa-4">
                <v-icon class="diagnosis-icon" color="warning" size="24">mdi-alert-circle</v-icon>
                <h3 class="text-h6">遇到的挑战</h3>
              </div>
              <div class="diagnosis-card-content pa-4">
                <v-textarea v-model="challenges" placeholder="记录遇到的主要挑战和困难..." variant="outlined"
                  rows="4" auto-grow hide-details />
              </div>
            </div>

            <div class="diagnosis-card">
              <div class="diagnosis-card-header d-flex align-center gap-3 pa-4">
                <v-icon class="diagnosis-icon" color="info" size="24">mdi-lightbulb</v-icon>
                <h3 class="text-h6">改进方向</h3>
              </div>
              <div class="diagnosis-card-content pa-4">
                <v-textarea v-model="improvements" placeholder="总结改进方向和下步计划..." variant="outlined"
                  rows="4" auto-grow hide-details />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 目标基本相关信息 - 评分和摘要 -->
      <section class="goal-analysis">
        <div class="goal-review-card-container d-flex flex-row gap-6 mb-8 justify-center">
          <!-- 评分卡片 -->
          <div class="goal-review-card goal-info">
            <div class="card-header pa-4 d-flex flex-column align-start">
              <div class="d-flex align-baseline">
                <span class="text-h3 font-weight-bold mr-1">{{ rating }}</span>
                <span class="text-h6 font-weight-light">/ 10</span>
              </div>
              <div>
                <span class="text-subtitle-1">复盘评分</span>
              </div>
            </div>
            <div class="card-content d-flex flex-column pa-4 justify-center">
              <v-rating 
                v-model="rating" 
                color="orange" 
                hover 
                half-increments 
                class="mb-4"
                length="10"
                size="small"
              />
              <div class="text-body-2 text-medium-emphasis">
                复盘时间: {{ localGoalReview ? format(localGoalReview.reviewedAt, 'yyyy-MM-dd HH:mm') : '' }}
              </div>
            </div>
          </div>

          <!-- 复盘类型和摘要卡片 -->
          <div class="goal-review-card stats-info">
            <div class="card-header pa-4 d-flex flex-column align-start">
              <div>
                <span class="text-h6">{{ localGoalReview?.typeText }}</span>
              </div>
              <div>
                <span class="text-subtitle-1">复盘类型</span>
              </div>
            </div>
            <div class="card-content d-flex flex-column pa-4 justify-center gap-3">
              <div>
                <div class="text-body-2 font-weight-medium mb-2">复盘摘要</div>
                <v-textarea v-model="summary" placeholder="输入复盘摘要..." variant="outlined" rows="3"
                  hide-details density="compact" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 确认对话框 -->
    <v-dialog v-model="showConfirmDialog" max-width="500">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2" color="primary">mdi-check-circle</v-icon>
          确认提交复盘
        </v-card-title>
        <v-card-text>
          <p>您确定要提交这份目标复盘吗？提交后将保存到系统中。</p>
          <div class="mt-4 pa-3 rounded" style="background: rgba(var(--v-theme-primary), 0.1)">
            <div class="text-body-2 text-medium-emphasis">复盘摘要:</div>
            <div class="mt-2">
              <v-chip class="mr-2 mb-1" size="small" color="success" v-if="achievements">
                有成就记录
              </v-chip>
              <v-chip class="mr-2 mb-1" size="small" color="warning" v-if="challenges">
                有挑战记录
              </v-chip>
              <v-chip class="mr-2 mb-1" size="small" color="info" v-if="improvements">
                有改进方向
              </v-chip>
              <v-chip class="mr-2 mb-1" size="small" color="primary" v-if="summary">
                有复盘摘要
              </v-chip>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showConfirmDialog = false">取消</v-btn>
          <v-btn color="primary" @click="confirmSaveReview" :loading="saving">确认提交</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGoalStore } from '../stores/goalStore';
import { useGoal } from '../composables/useGoal';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';
import GoalProgressChart from '../components/echarts/GoalProgressChart.vue';
import KrProgressChart from '../components/echarts/KrProgressChart.vue';
import KrCompletionChart from '../components/echarts/KrCompletionChart.vue';
import KrWeightDistributionChart from '../components/echarts/KrWeightDistributionChart.vue';
import PeriodBarChart from '../components/echarts/PeriodBarChart.vue';
import { GoalReview } from '@dailyuse/goal/domain-client';
import { Goal } from '@dailyuse/goal/domain-client';
import { GoalStatus, ReviewType } from '@dailyuse/contracts/goal';
import type { GoalClientDTO, KeyResultClientDTO, CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';
import { format } from 'date-fns';

// 路由和状态
const loading = ref(true);
const saving = ref(false);
const showConfirmDialog = ref(false);
const route = useRoute();
const router = useRouter();
const goalStore = useGoalStore();
const message = getGlobalMessage();

// 业务逻辑
const { createGoalReview, getGoalAggregateView, fetchGoalById } = useGoal();

// 获取目标信息
const goalUuid = route.params.goalUuid as string;
const goal = ref<Goal | null>(null);

// 使用 GoalReview 实体（参考 GoalDialog 的 goalModel 实现）
const reviewModel = ref<GoalReview | null>(null);

// 使用 computed 属性实现双向绑定（参考 GoalDialog 实现）
const localGoalReview = computed(() => reviewModel.value);

// 计算属性 - 评分
const rating = computed({
  get: () => reviewModel.value?.rating ?? 5,
  set: (val: number) => {
    reviewModel.value?.updateRating(val);
  },
});

// 计算属性 - 摘要
const summary = computed({
  get: () => reviewModel.value?.summary ?? '',
  set: (val: string) => {
    reviewModel.value?.updateSummary(val);
  },
});

// 计算属性 - 成就
const achievements = computed({
  get: () => reviewModel.value?.achievements ?? '',
  set: (val: string) => {
    reviewModel.value?.updateAchievements(val);
  },
});

// 计算属性 - 挑战
const challenges = computed({
  get: () => reviewModel.value?.challenges ?? '',
  set: (val: string) => {
    reviewModel.value?.updateChallenges(val);
  },
});

// 计算属性 - 改进
const improvements = computed({
  get: () => reviewModel.value?.improvements ?? '',
  set: (val: string) => {
    reviewModel.value?.updateImprovements(val);
  },
});

// 计算属性 - 类型
const reviewType = computed({
  get: () => reviewModel.value?.type ?? ReviewType.ADHOC,
  set: (val: ReviewType) => {
    reviewModel.value?.updateType(val);
  },
});

// 计算属性
const canSave = computed(() => {
  return !!(
    achievements.value ||
    challenges.value ||
    improvements.value ||
    summary.value
  );
});

// 初始化数据
const initializeReview = async () => {
  try {
    loading.value = true;

    // 获取目标详情
    const goalData = goalStore.getGoalByUuid(goalUuid);
    if (!goalData) {
      // 如果store中没有，尝试从API获取
      await getGoalAggregateView(goalUuid);
      goal.value = goalStore.getGoalByUuid(goalUuid);
    } else {
      goal.value = goalData;
    }

    if (!goal.value) {
      throw new Error('无法获取目标信息');
    }

    // 创建新的 GoalReview 实体
    reviewModel.value = GoalReview.forCreate(goalUuid);
  } catch (error) {
    console.error('初始化复盘失败:', error);
    message.error('加载目标信息失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 保存复盘
const handleSaveReview = () => {
  if (!canSave.value) {
    message.warning('请至少填写一项复盘内容');
    return;
  }
  showConfirmDialog.value = true;
};

const confirmSaveReview = async () => {
  if (!reviewModel.value || !goal.value) return;

  try {
    saving.value = true;

    // 使用API请求格式调用
    const createdReview = await createGoalReview(goalUuid, {
      goalUuid: goalUuid,
      title: `${goal.value.title} - ${format(new Date(), 'yyyy-MM-dd')} 复盘`,
      content: reviewModel.value.summary,
      reviewType: reviewModel.value.type,
      rating: reviewModel.value.rating,
      achievements: reviewModel.value.achievements ?? undefined,
      challenges: reviewModel.value.challenges ?? undefined,
      nextActions: reviewModel.value.improvements ?? undefined,
      reviewedAt: reviewModel.value.reviewedAt,
    });

    console.log('[GoalReviewCreationView] ✅ Review 创建成功:', createdReview);
    
    message.success('目标复盘创建成功');
    showConfirmDialog.value = false;

    // 等待 store 更新完成（给 refreshGoalWithReviews 时间完成）
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 再次确认刷新 Goal 数据
    console.log('[GoalReviewCreationView] 🔄 最后确认刷新 Goal 数据');
    await fetchGoalById(goalUuid);
    
    // 跳转到目标详情页
    router.push({ name: 'goal-detail', params: { id: goalUuid } });
  } catch (error) {
    console.error('保存复盘失败:', error);
    message.error('保存复盘失败，请重试');
  } finally {
    saving.value = false;
  }
};

// 组件挂载
onMounted(() => {
  initializeReview();
});
</script>

<style scoped>
#goal-review {
  background: linear-gradient(120deg,
      rgba(var(--v-theme-primary), 0.08) 0%,
      rgba(var(--v-theme-background), 0.95) 100%);
  overflow: hidden;
}

.goal-review-header {
  background-color: rgba(var(--v-theme-surface), 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.goal-review-main {
  padding: 0 2rem;
  flex: 1 1 auto;
  overflow-y: auto;
}

.goal-review-card {
  width: 600px;
  max-width: 600px;
  min-width: 400px;
  height: 300px;
  border-radius: 16px;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.goal-review-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.goal-info {
  background: linear-gradient(135deg,
      rgba(var(--v-theme-primary), 0.8),
      rgba(var(--v-theme-primary), 0.6));
  color: white;
}

.goal-info .card-header {
  background-color: rgba(0, 0, 0, 0.1);
}

.stats-info {
  background: linear-gradient(135deg,
      rgba(var(--v-theme-secondary), 0.8),
      rgba(var(--v-theme-secondary), 0.6));
  color: white;
}

.stats-info .card-header {
  background-color: rgba(0, 0, 0, 0.1);
}

.card-content-item {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  transition: background-color 0.2s ease;
  margin-bottom: 8px;
}

.card-content-item:hover {
  background: rgba(255, 255, 255, 0.25);
}

.item-name {
  font-weight: 500;
  flex: 1;
  font-size: 0.9rem;
}

.item-value {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-weight: bold;
  min-width: 60px;
  text-align: center;
  font-size: 0.85rem;
}

.self-diagnosis {
  background: linear-gradient(135deg,
      rgba(var(--v-theme-surface), 0.95),
      rgba(var(--v-theme-background), 0.98));
  border-radius: 20px;
  margin: 2rem 0;
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.06);
}

.diagnosis-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 1024px) {
  .diagnosis-grid {
    grid-template-columns: 1fr;
  }

  .goal-review-card-container {
    flex-direction: column !important;
    align-items: center;
  }
}

.diagnosis-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 1px solid rgba(var(--v-theme-outline), 0.08);
  overflow: hidden;
}

.diagnosis-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.diagnosis-card.rating-card {
  background: linear-gradient(135deg,
      rgba(var(--v-theme-warning), 0.05),
      rgba(var(--v-theme-surface), 1));
}

.diagnosis-card-header {
  background: rgba(var(--v-theme-primary), 0.02);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.06);
}

.diagnosis-icon {
  opacity: 0.9;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: rgb(var(--v-theme-primary));
  font-size: 1.2rem;
}
</style>

