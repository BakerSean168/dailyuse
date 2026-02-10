<template>
  <!-- 只在 goal 存在时渲染对话框，防止 props 校验警告 -->
  <v-dialog
    v-if="goal"
    v-model="isVisible"
    max-width="900"
    max-height="90vh"
    persistent
    scrollable
    class="goal-review-dialog"
  >
    <v-card class="review-card">
      <!-- 对话框头部 -->
      <v-card-title class="review-header pa-6">
        <div class="d-flex align-center justify-space-between w-100">
          <div class="d-flex align-center">
            <v-icon color="primary" size="28" class="mr-3">mdi-book-edit</v-icon>
            <span class="text-h5 font-weight-bold">复盘记录</span>
          </div>
          <v-btn icon="mdi-close" variant="text" color="medium-emphasis" @click="handleClose">
            <v-icon>mdi-close</v-icon>
            <v-tooltip activator="parent" location="bottom"> 关闭 </v-tooltip>
          </v-btn>
        </div>
      </v-card-title>
      <v-divider />
      <!-- 复盘列表内容 -->
      <v-card-text class="review-content pa-6">
        <!-- 加载状态 -->
        <v-progress-linear v-if="isLoading" indeterminate color="primary" class="mb-4" />

        <!-- 空状态 -->
        <v-empty-state
          v-if="!hasReviews && !isLoading"
          icon="mdi-book-edit-outline"
          title="暂无复盘记录"
          text="开始记录您的目标复盘，追踪成长轨迹"
          class="my-8"
        >
          <template #actions>
            <v-btn
              color="primary"
              variant="elevated"
              prepend-icon="mdi-plus"
              @click="createNewReview"
            >
              创建复盘
            </v-btn>
          </template>
        </v-empty-state>

        <!-- 复盘记录列表 -->
        <div v-else-if="hasReviews" class="review-list">
          <!-- 顶部操作栏 -->
          <div class="d-flex justify-space-between align-center mb-4">
            <div class="text-h6 font-weight-medium">复盘记录 ({{ goalReviews.length }})</div>
            <v-btn
              color="primary"
              variant="outlined"
              size="small"
              prepend-icon="mdi-plus"
              @click="createNewReview"
            >
              新建复盘
            </v-btn>
          </div>

          <v-card
            v-for="review in goalReviews"
            :key="review.uuid"
            class="review-item mb-4"
            variant="outlined"
            elevation="0"
            :hover="true"
          >
            <v-card-text class="pa-4">
              <v-row align="center">
                <!-- 左侧信息 -->
                <v-col cols="12" md="8">
                  <div class="review-info">
                    <!-- 复盘标题 -->
                    <div class="d-flex align-center mb-2">
                      <v-icon :color="getReviewTypeColor(review.type)" size="16" class="mr-2">
                        {{ getReviewTypeIcon(review.type) }}
                      </v-icon>
                      <span class="text-h6 font-weight-medium">{{ review.summary }}</span>
                      <v-chip
                        :color="getReviewTypeColor(review.type)"
                        size="small"
                        variant="tonal"
                        class="ml-2"
                      >
                        {{ getReviewTypeText(review.type) }}
                      </v-chip>
                    </div>
                    <!-- 时间信息 -->
                    <div class="d-flex align-center mb-2">
                      <v-icon color="primary" size="16" class="mr-2">mdi-clock-outline</v-icon>
                      <span class="text-body-2 text-medium-emphasis">
                        {{ format(review.reviewedAt, 'yyyy/MM/dd HH:mm') }}
                      </span>
                    </div>
                    <!-- 复盘内容预览 -->
                    <div v-if="review.achievements" class="d-flex align-center">
                      <v-icon color="info" size="16" class="mr-2">mdi-text-short</v-icon>
                      <span class="text-body-2 text-medium-emphasis text-truncate">
                        成果: {{ review.achievements.substring(0, 50) }}...
                      </span>
                    </div>
                  </div>
                </v-col>
                <!-- 右侧操作按钮 -->
                <v-col cols="12" md="4" class="d-flex justify-end align-center">
                  <div class="action-buttons">
                    <v-btn
                      color="primary"
                      variant="outlined"
                      size="small"
                      prepend-icon="mdi-eye"
                      class="mr-2"
                      @click="handleView(review.uuid)"
                    >
                      查看
                    </v-btn>
                    <v-btn
                      color="error"
                      variant="text"
                      size="small"
                      icon="mdi-delete"
                      @click="handleDelete(review.uuid)"
                    >
                      <v-icon>mdi-delete</v-icon>
                      <v-tooltip activator="parent" location="bottom"> 删除记录 </v-tooltip>
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, defineExpose, watch } from 'vue';
import type { GoalClient } from '@dailyuse/contracts/goal';
import { Goal, GoalReview } from '@dailyuse/goal/domain-client';
import { format } from 'date-fns';
import { useRouter } from 'vue-router';
import { useGoal } from '../../composables/useGoal';

const router = useRouter();
const goalComposable = useGoal();

const props = defineProps<{
  goal: GoalClient;
}>();

// 内部状态控制
const isVisible = ref(false);
const isLoading = ref(false);

// ===== 内部业务逻辑方法 =====

/**
 * 打开复盘对话框 - 可供外部调用的方法
 */
const openDialog = async () => {
  try {
    isVisible.value = true;
    console.log('Opening review dialog for goal:', props.goal);
  } catch (error) {
    console.error('Failed to open review dialog:', error);
  }
};

/**
 * 关闭复盘对话框
 */
const closeDialog = () => {
  isVisible.value = false;
};

/**
 * 打开卡片 - 与 GoalCard 保持一致的方法名
 */
const openCard = () => {
  openDialog();
};

/**
 * 关闭卡片 - 与 GoalCard 保持一致的方法名
 */
const closeCard = () => {
  closeDialog();
};

/**
 * 查看复盘详情
 */
const handleView = async (reviewUuid: string) => {
  try {
    // 导航到复盘详情页面
    router.push({
      name: 'goal-review-detail',
      params: {
        goalUuid: props.goal.uuid,
        reviewUuid: reviewUuid,
      },
    });
    closeDialog();
  } catch (error) {
    console.error('Failed to view review:', error);
  }
};

/**
 * 删除复盘记录
 */
const handleDelete = async (reviewId: string) => {
  try {
    if (confirm('确定要删除这条复盘记录吗？此操作不可撤销。')) {
      await goalComposable.deleteGoalReview(props.goal.uuid, reviewId);
    }
  } catch (error) {
    console.error('Failed to delete review:', error);
  }
};

/**
 * 关闭处理
 */
const handleClose = () => {
  closeDialog();
};

/**
 * 创建新复盘
 */
const createNewReview = async () => {
  try {
    // 导航到创建复盘页面
    router.push({
      name: 'goal-review-create',
      params: { goalUuid: props.goal.uuid },
    });
    closeDialog();
  } catch (error) {
    console.error('Failed to create new review:', error);
  }
};

// 暴露方法给父组件
defineExpose({
  openDialog,
  closeDialog,
  openCard,
  closeCard,
});

// ===== 计算属性 =====

// 获取当前目标的复盘列表
const goalReviews = computed(() => {
  return props.goal.reviews || [];
});

// 是否有复盘记录
const hasReviews = computed(() => {
  return goalReviews.value.length > 0;
});

// ===== 工具方法 =====

// 复盘类型相关方法
const getReviewTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    weekly: 'primary',
    monthly: 'secondary',
    midterm: 'warning',
    final: 'success',
    custom: 'info',
  };
  return colors[type] || 'primary';
};

const getReviewTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    weekly: 'mdi-calendar-week',
    monthly: 'mdi-calendar-month',
    midterm: 'mdi-calendar-check',
    final: 'mdi-trophy',
    custom: 'mdi-calendar-star',
  };
  return icons[type] || 'mdi-calendar';
};

const getReviewTypeText = (type: string): string => {
  const texts: Record<string, string> = {
    weekly: '周复盘',
    monthly: '月复盘',
    midterm: '中期复盘',
    final: '最终复盘',
    custom: '自定义复盘',
  };
  return texts[type] || '复盘';
};

// ===== 监听器 =====

// 当对话框关闭时清理状态
watch(isVisible, (newValue) => {
  if (!newValue) {
    // 对话框关闭时的清理逻辑
  }
});
</script>

<style scoped>
.goal-review-dialog {
  z-index: 2000;
}

.review-card {
  border-radius: 16px;
  overflow: hidden;
}

.review-header {
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-primary)) 0%,
    rgb(var(--v-theme-secondary)) 100%
  );
  color: white;
}

.review-header .v-icon,
.review-header .text-h5 {
  color: white !important;
}

.review-content {
  max-height: 60vh;
  overflow-y: auto;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.review-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: rgb(var(--v-theme-primary));
}

.review-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.review-item .v-btn {
  transition: all 0.2s ease;
}

.review-item .v-btn:hover {
  transform: scale(1.05);
}

/* 响应式布局 */
@media (max-width: 768px) {
  .review-content {
    padding: 16px;
  }

  .action-buttons {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    margin-top: 12px;
  }

  .action-buttons .v-btn {
    width: 100%;
  }
}

/* 空状态样式 */
.v-empty-state {
  padding: 48px 24px;
}

/* 滚动条样式 */
.review-content::-webkit-scrollbar {
  width: 6px;
}

.review-content::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 3px;
}

.review-content::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.5);
  border-radius: 3px;
}

.review-content::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.7);
}
</style>
