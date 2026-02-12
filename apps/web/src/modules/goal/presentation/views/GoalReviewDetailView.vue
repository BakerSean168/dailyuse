<template>
  <v-container fluid class="goal-review-detail-container pa-0">
    <!-- 加载状态 -->
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 400px">
      <v-progress-circular indeterminate color="primary" size="64" />
      <span class="ml-4 text-h6">加载中...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="d-flex justify-center align-center" style="height: 400px">
      <v-alert type="error" variant="tonal" class="ma-4">
        <template #title>加载失败</template>
        {{ error }}
        <template #append>
          <v-btn @click="loadReview" variant="text" color="error">重试</v-btn>
        </template>
      </v-alert>
    </div>

    <!-- 找不到复盘 -->
    <div v-else-if="!review || !goal" class="d-flex justify-center align-center" style="height: 400px">
      <v-alert type="warning" variant="tonal" class="ma-4">
        <template #title>复盘不存在</template>
        找不到指定的复盘记录
        <template #append>
          <v-btn @click="$router.back()" variant="text" color="warning">返回</v-btn>
        </template>
      </v-alert>
    </div>

    <!-- 复盘详情内容 -->
    <div v-else>
      <!-- 头部导航栏 -->
      <v-toolbar
        color="rgba(var(--v-theme-surface))"
        elevation="2"
        class="goal-review-header flex-shrink-0 mb-4"
      >
        <v-btn icon @click="$router.back()">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>

        <v-toolbar-title class="text-h6 font-weight-medium">
          <div class="d-flex align-center">
            <v-icon class="mr-2" :color="getRatingColor(review.rating)">
              {{ getRatingIcon(review.rating) }}
            </v-icon>
            复盘详情
          </div>
        </v-toolbar-title>

        <v-spacer />

        <!-- 复盘类型标签 -->
        <v-chip :color="getReviewTypeColor(review.type)" variant="tonal" class="mr-3">
          {{ review.typeText }}
        </v-chip>

        <!-- 编辑按钮 -->
        <v-btn color="warning" prepend-icon="mdi-pencil" @click="editReview" variant="elevated">
          编辑
        </v-btn>
      </v-toolbar>

      <!-- 主要内容区域 -->
      <div class="main-content flex-grow-1 px-6">
        <div class="content-wrapper">
          <!-- 1. 基本信息卡片 -->
          <v-card class="mb-6" elevation="2">
            <v-card-text>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-h5 font-weight-bold mb-2">{{ goal.title }}</div>
                  <div class="d-flex align-center gap-3">
                    <v-chip size="small" prepend-icon="mdi-calendar" variant="text">
                      {{ formatDate(review.reviewedAt) }}
                    </v-chip>
                    <v-chip size="small" prepend-icon="mdi-clock-outline" variant="text">
                      复盘时间
                    </v-chip>
                  </div>
                </div>
                <v-avatar :color="getRatingColor(review.rating)" size="72" variant="flat">
                  <span class="text-h4 font-weight-bold text-white">{{ review.rating }}</span>
                  <div class="text-caption text-white mt-n2">/ 10</div>
                </v-avatar>
              </div>
            </v-card-text>
          </v-card>

          <!-- 2. 快照核心指标 -->
          <v-row class="mb-6">
            <v-col cols="12" md="3">
              <v-card variant="tonal" color="primary" elevation="2">
                <v-card-text class="text-center">
                  <v-icon size="40" class="mb-2">mdi-target</v-icon>
                  <div class="text-h4 font-weight-bold">
                    {{ completedKRsCount }} / {{ totalKRsCount }}
                  </div>
                  <div class="text-body-2">关键结果</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="3">
              <v-card variant="tonal" color="success" elevation="2">
                <v-card-text class="text-center">
                  <v-icon size="40" class="mb-2">mdi-check-circle</v-icon>
                  <div class="text-h4 font-weight-bold">
                    {{ completedKRsCount }}
                  </div>
                  <div class="text-body-2">已完成</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="3">
              <v-card variant="tonal" color="info" elevation="2">
                <v-card-text class="text-center">
                  <v-icon size="40" class="mb-2">mdi-progress-check</v-icon>
                  <div class="text-h4 font-weight-bold">
                    {{ averageProgress.toFixed(1) }}%
                  </div>
                  <div class="text-body-2">平均进度</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="3">
              <v-card variant="tonal" color="warning" elevation="2">
                <v-card-text class="text-center">
                  <v-icon size="40" class="mb-2">mdi-star</v-icon>
                  <div class="text-h4 font-weight-bold">
                    {{ review.ratingText }}
                  </div>
                  <div class="text-body-2">评级</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- 3. 进度分析图表 -->
          <ReviewProgressChart v-if="goal && review" :goal="(goal as Goal)" :review="(review as GoalReview)" class="mb-6" />

          <!-- 4. 权重分布图表 -->
          <KrWeightDistributionChart v-if="goal && review" :goal="(goal as Goal)" :review="(review as GoalReview)" class="mb-6" />

          <!-- 5. 复盘内容 -->
          <div class="content-sections">
            <div v-if="review.achievements" class="content-section mb-4">
              <v-card elevation="2">
                <v-card-title class="d-flex align-center">
                  <v-icon color="success" class="mr-2">mdi-trophy</v-icon>
                  <h3 class="text-h6">主要成就</h3>
                </v-card-title>
                <v-card-text>
                  <p class="text-body-1 whitespace-pre-line">{{ review.achievements }}</p>
                </v-card-text>
              </v-card>
            </div>

            <div v-if="review.challenges" class="content-section mb-4">
              <v-card elevation="2">
                <v-card-title class="d-flex align-center">
                  <v-icon color="warning" class="mr-2">mdi-alert-circle</v-icon>
                  <h3 class="text-h6">遇到的挑战</h3>
                </v-card-title>
                <v-card-text>
                  <p class="text-body-1 whitespace-pre-line">{{ review.challenges }}</p>
                </v-card-text>
              </v-card>
            </div>

            <div v-if="review.improvements" class="content-section mb-4">
              <v-card elevation="2">
                <v-card-title class="d-flex align-center">
                  <v-icon color="info" class="mr-2">mdi-lightbulb</v-icon>
                  <h3 class="text-h6">改进建议</h3>
                </v-card-title>
                <v-card-text>
                  <p class="text-body-1 whitespace-pre-line">{{ review.improvements }}</p>
                </v-card-text>
              </v-card>
            </div>
          </div>

          <!-- 6. 复盘评分和摘要 -->
          <v-card variant="tonal" color="primary" elevation="2" class="mt-6">
            <v-card-title class="text-h6">
              <v-icon class="mr-2">mdi-star-circle</v-icon>
              复盘评分
            </v-card-title>
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-4">
                <div class="flex-1">
                  <div class="text-h3 font-weight-bold text-center mb-2">
                    {{ review.rating }} <span class="text-h5">/ 10</span>
                  </div>
                  <div class="text-center">
                    <v-rating
                      :model-value="review.rating"
                      :length="10"
                      readonly
                      color="warning"
                      size="large"
                      density="comfortable"
                    />
                  </div>
                  <div class="text-h6 text-center mt-2 font-weight-medium">
                    {{ review.ratingText }}
                  </div>
                </div>
              </div>

              <v-divider class="my-4" />

              <div v-if="review.summary">
                <div class="text-subtitle-1 font-weight-medium mb-2">
                  <v-icon class="mr-1">mdi-text</v-icon>
                  复盘摘要
                </div>
                <p class="text-body-1 whitespace-pre-line">{{ review.summary }}</p>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGoalStore } from '../stores/goalStore';
import { useGoal } from '../composables/useGoal';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';
import { Goal, GoalReview } from '@dailyuse/goal/domain-client';
import { format } from 'date-fns';
import ReviewProgressChart from '../components/echarts/ReviewProgressChart.vue';
import KrWeightDistributionChart from '../components/echarts/KrWeightDistributionChart.vue';

// 路由和状态
const loading = ref(false);
const error = ref('');
const route = useRoute();
const router = useRouter();
const goalStore = useGoalStore();
const message = getGlobalMessage();

// 业务逻辑
const { fetchGoalById } = useGoal();

// 数据
const goalUuid = route.params.goalUuid as string;
const reviewUuid = route.params.reviewUuid as string;
const goal = ref<Goal | null>(null);
const review = ref<GoalReview | null>(null);

// 计算属性 - 完成的关键结果数量
const completedKRsCount = computed(() => {
  if (!review.value) return 0;
  return review.value.keyResultSnapshots.filter(kr => kr.progressPercentage >= 100).length;
});

// 计算属性 - 总关键结果数量
const totalKRsCount = computed(() => {
  return review.value?.keyResultSnapshots.length || 0;
});

// 计算属性 - 平均进度
const averageProgress = computed(() => {
  if (!review.value || review.value.keyResultSnapshots.length === 0) return 0;
  
  const total = review.value.keyResultSnapshots.reduce(
    (sum, kr) => sum + kr.progressPercentage,
    0
  );
  
  return total / review.value.keyResultSnapshots.length;
});

// 格式化日期
const formatDate = (timestamp: number): string => {
  return format(new Date(timestamp), 'yyyy年MM月dd日 HH:mm');
};

// 工具方法
const getReviewTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    WEEKLY: 'primary',
    MONTHLY: 'secondary',
    QUARTERLY: 'warning',
    ANNUAL: 'success',
    ADHOC: 'info',
  };
  return colors[type] || 'grey';
};

const getRatingColor = (rating: number): string => {
  if (rating >= 9) return 'success';
  if (rating >= 7) return 'info';
  if (rating >= 5) return 'warning';
  if (rating >= 3) return 'orange';
  return 'error';
};

const getRatingIcon = (rating: number): string => {
  if (rating >= 9) return 'mdi-emoticon-excited';
  if (rating >= 7) return 'mdi-emoticon-happy';
  if (rating >= 5) return 'mdi-emoticon-neutral';
  if (rating >= 3) return 'mdi-emoticon-sad';
  return 'mdi-emoticon-cry';
};

const getProgressColor = (progress: number): string => {
  if (progress >= 80) return 'success';
  if (progress >= 60) return 'info';
  if (progress >= 40) return 'warning';
  return 'error';
};

// 业务方法
const loadReview = async () => {
  try {
    loading.value = true;
    error.value = '';

    console.log('[GoalReviewDetailView] 🔍 开始加载 review:', { goalUuid, reviewUuid });

    // 1. 先从 store 尝试获取
    let goalData = goalStore.getGoalByUuid(goalUuid);
    console.log('[GoalReviewDetailView] 📦 从 store 获取 goal:', {
      found: !!goalData,
      reviewsCount: goalData?.reviews?.length || 0,
    });

    // 2. 如果 store 中没有或没有 reviews，则重新加载
    if (!goalData || !goalData.reviews || goalData.reviews.length === 0) {
      console.log('[GoalReviewDetailView] 🔄 Store 中没有 goal 或 reviews，重新加载');
      await fetchGoalById(goalUuid);
      goalData = goalStore.getGoalByUuid(goalUuid);
      console.log('[GoalReviewDetailView] 📥 重新加载后的 goal:', {
        found: !!goalData,
        reviewsCount: goalData?.reviews?.length || 0,
      });
    }

    goal.value = goalData;

    if (!goal.value) {
      throw new Error('无法获取目标信息');
    }

    // 3. 从 goal 的 reviews 中查找目标 review
    const foundReview = goal.value.reviews?.find((r) => r.uuid === reviewUuid);
    console.log('[GoalReviewDetailView] 🔍 查找 review 结果:', {
      found: !!foundReview,
      reviewUuid,
      totalReviews: goal.value.reviews?.length || 0,
      reviewUuids: goal.value.reviews?.map(r => r.uuid) || [],
    });

    if (foundReview) {
      review.value = foundReview;
      console.log('[GoalReviewDetailView] ✅ Review 加载成功:', {
        uuid: review.value.uuid,
        rating: review.value.rating,
        type: review.value.type,
      });
    } else {
      throw new Error('找不到指定的复盘记录');
    }
  } catch (err) {
    console.error('[GoalReviewDetailView] ❌ 加载复盘详情失败:', err);
    error.value = typeof err === 'string' ? err : '加载复盘详情失败，请重试';
    message.error('加载复盘详情失败');
  } finally {
    loading.value = false;
  }
};

const editReview = () => {
  message.info('编辑功能尚未实现');
};

// 初始化
onMounted(() => {
  // 从store获取目标信息
  goal.value = goalStore.getGoalByUuid(goalUuid);
  loadReview();
});
</script>

<style scoped>
.goal-review-detail-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.02) 0%,
    rgba(var(--v-theme-surface), 0.95) 100%
  );
}

.goal-review-header {
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
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

.content-section {
  margin-bottom: 16px;
}

.content-section .v-card {
  border-radius: 12px;
  transition: all 0.2s ease;
}

.content-section .v-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.whitespace-pre-line {
  white-space: pre-line;
}

.rating-section {
  margin-top: 24px;
}

/* 响应式调整 */
@media (max-width: 600px) {
  .content-wrapper {
    padding: 8px;
  }
}

/* 对话框内容样式 */
.v-card {
  border-radius: 16px;
}

/* 评分显示样式 */
.v-rating {
  gap: 4px;
}

.v-rating--readonly .v-icon {
  opacity: 0.8;
}

/* 芯片样式 */
.v-chip {
  font-weight: 500;
}

/* 进度条样式 */
.v-progress-linear {
  border-radius: 4px;
}
</style>
