<!--
  ComparisonStatsPanel.vue
  多目标对比统计面板 - 显示详细的对比指标
-->

<template>
  <v-card elevation="2" class="comparison-stats-card">
    <v-card-title class="d-flex align-center pa-6 comparison-header">
      <v-icon class="mr-3" color="primary" size="28">mdi-chart-box</v-icon>
      <span class="text-h5 font-weight-bold">对比统计分析</span>

      <v-spacer />

      <!-- 视图切换 -->
      <v-btn-toggle v-model="viewMode" density="comfortable" mandatory divided color="primary" class="view-toggle">
        <v-btn value="table" size="default">
          <v-icon left>mdi-table</v-icon>
          <span class="ml-2">表格</span>
        </v-btn>
        <v-btn value="chart" size="default">
          <v-icon left>mdi-chart-bar</v-icon>
          <span class="ml-2">图表</span>
        </v-btn>
      </v-btn-toggle>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-6">
      <!-- 表格视图 -->
      <div v-if="viewMode === 'table'" class="table-view">
        <v-table class="comparison-table" density="comfortable">
          <thead>
            <tr class="table-header">
              <th class="text-left font-weight-bold text-subtitle-1" style="min-width: 150px;">指标</th>
              <th v-for="goal in goals" :key="goal.uuid" class="text-left" style="min-width: 200px;">
                <div class="d-flex align-center pa-2">
                  <div class="goal-color-dot mr-3" :style="{ backgroundColor: goal.color || '#2196F3' }" />
                  <div>
                    <div class="text-subtitle-2 font-weight-bold">{{ goal.title }}</div>
                    <div class="text-caption text-medium-emphasis">{{ getStatusText(goal) }}</div>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
              <!-- 关键结果数量 -->
              <tr class="table-row">
                <td class="font-weight-medium text-body-1">
                  <v-icon size="small" class="mr-2" color="primary">mdi-target</v-icon>
                  关键结果数量
                </td>
                <td v-for="goal in goals" :key="`kr-count-${goal.uuid}`">
                  <v-chip size="default" color="primary" variant="tonal" class="px-4">
                    <v-icon left size="small">mdi-numeric</v-icon>
                    {{ getKRCount(goal) }} 个
                  </v-chip>
                </td>
              </tr>

              <!-- 整体进度 -->
              <tr class="table-row">
                <td class="font-weight-medium text-body-1">
                  <v-icon size="small" class="mr-2" color="success">mdi-chart-line</v-icon>
                  整体进度
                </td>
                <td v-for="goal in goals" :key="`progress-${goal.uuid}`">
                  <div class="progress-cell">
                    <v-progress-linear
                      :model-value="getProgress(goal)"
                      :color="getProgressColor(getProgress(goal))"
                      height="12"
                      rounded
                      class="mb-2"
                    />
                    <div class="d-flex justify-space-between align-center">
                      <span class="text-caption text-medium-emphasis">进度</span>
                      <span class="text-body-1 font-weight-bold" :style="{ color: getProgressColor(getProgress(goal)) }">
                        {{ getProgress(goal) }}%
                      </span>
                    </div>
                  </div>
                </td>
              </tr>

              <!-- 权重总和 -->
              <tr class="table-row">
                <td class="font-weight-medium text-body-1">
                  <v-icon size="small" class="mr-2" color="warning">mdi-weight</v-icon>
                  权重总和
                </td>
                <td v-for="goal in goals" :key="`weight-${goal.uuid}`">
                  <v-chip
                    size="default"
                    :color="getTotalWeight(goal) === 100 ? 'success' : 'error'"
                    variant="flat"
                    class="px-4"
                  >
                    <v-icon left size="small">{{ getTotalWeight(goal) === 100 ? 'mdi-check-circle' : 'mdi-alert-circle' }}</v-icon>
                    {{ getTotalWeight(goal) }}%
                  </v-chip>
                </td>
              </tr>

              <!-- 平均权重 -->
              <tr class="table-row">
                <td class="font-weight-medium text-body-1">
                  <v-icon size="small" class="mr-2" color="info">mdi-chart-pie</v-icon>
                  平均权重
                </td>
                <td v-for="goal in goals" :key="`avg-weight-${goal.uuid}`">
                  <span class="text-body-1 font-weight-medium"> {{ getAverageWeight(goal) }}% </span>
                </td>
              </tr>

              <!-- 状态 -->
              <tr class="table-row">
                <td class="font-weight-medium text-body-1">
                  <v-icon size="small" class="mr-2" color="secondary">mdi-flag</v-icon>
                  状态
                </td>
                <td v-for="goal in goals" :key="`status-${goal.uuid}`">
                  <v-chip size="default" :color="getStatusColor(goal)" variant="tonal" class="px-4">
                    {{ getStatusText(goal) }}
                  </v-chip>
                </td>
              </tr>

              <!-- 创建时间 -->
              <tr class="table-row">
                <td class="font-weight-medium text-body-1">
                  <v-icon size="small" class="mr-2">mdi-calendar-plus</v-icon>
                  创建时间
                </td>
                <td v-for="goal in goals" :key="`created-${goal.uuid}`" class="text-body-2">
                  {{ formatDate(goal.createdAt) }}
                </td>
              </tr>

              <!-- 更新时间 -->
              <tr class="table-row">
                <td class="font-weight-medium text-body-1">
                  <v-icon size="small" class="mr-2">mdi-calendar-edit</v-icon>
                  最后更新
                </td>
                <td v-for="goal in goals" :key="`updated-${goal.uuid}`" class="text-body-2">
                  {{ formatDate(goal.updatedAt) }}
                </td>
              </tr>

              <!-- 时间跨度 -->
              <tr class="table-row">
                <td class="font-weight-medium text-body-1">
                  <v-icon size="small" class="mr-2">mdi-clock-outline</v-icon>
                  活跃天数
                </td>
                <td v-for="goal in goals" :key="`days-${goal.uuid}`">
                  <v-chip size="default" color="orange" variant="tonal" class="px-4">
                    <v-icon left size="small">mdi-calendar-range</v-icon>
                    {{ getActiveDays(goal) }} 天
                  </v-chip>
                </td>
              </tr>
            </tbody>
        </v-table>
      </div>

      <!-- 图表视图 -->
      <div v-else class="chart-view">
        <v-row>
          <!-- 关键结果数量对比 -->
          <v-col cols="12" md="6">
            <div class="chart-card pa-4">
              <div class="text-subtitle-2 mb-3 font-weight-bold">关键结果数量对比</div>
              <div class="d-flex align-center justify-space-around">
                <div v-for="goal in goals" :key="`kr-chart-${goal.uuid}`" class="text-center">
                  <div
                    class="stat-circle"
                    :style="{
                      backgroundColor: goal.color || '#2196F3',
                      width: `${Math.max(60, getKRCount(goal) * 10)}px`,
                      height: `${Math.max(60, getKRCount(goal) * 10)}px`,
                    }"
                  >
                    <div class="stat-value">{{ getKRCount(goal) }}</div>
                  </div>
                  <div class="text-caption mt-2">{{ goal.title }}</div>
                </div>
              </div>
            </div>
          </v-col>

          <!-- 进度对比 -->
          <v-col cols="12" md="6">
            <div class="chart-card pa-4">
              <div class="text-subtitle-2 mb-3 font-weight-bold">进度对比</div>
              <div v-for="goal in goals" :key="`progress-chart-${goal.uuid}`" class="mb-3">
                <div class="d-flex align-center mb-1">
                  <v-chip size="x-small" :color="goal.color || 'primary'" class="mr-2" />
                  <span class="text-caption">{{ goal.title }}</span>
                  <v-spacer />
                  <span class="text-caption font-weight-bold"> {{ getProgress(goal) }}% </span>
                </div>
                <v-progress-linear
                  :model-value="getProgress(goal)"
                  :color="getProgressColor(getProgress(goal))"
                  height="12"
                  rounded
                />
              </div>
            </div>
          </v-col>

          <!-- 权重分布 -->
          <v-col cols="12">
            <div class="chart-card pa-4">
              <div class="text-subtitle-2 mb-3 font-weight-bold">权重分布分析</div>
              <v-row>
                <v-col
                  v-for="goal in goals"
                  :key="`weight-dist-${goal.uuid}`"
                  :cols="12 / goals.length"
                >
                  <div class="text-center mb-2">
                    <v-chip size="small" :color="goal.color || 'primary'">
                      {{ goal.title }}
                    </v-chip>
                  </div>
                  <div class="weight-stats">
                    <div class="stat-row">
                      <span class="text-caption">总和:</span>
                      <v-chip
                        size="x-small"
                        :color="getTotalWeight(goal) === 100 ? 'success' : 'error'"
                      >
                        {{ getTotalWeight(goal) }}%
                      </v-chip>
                    </div>
                    <div class="stat-row">
                      <span class="text-caption">平均:</span>
                      <span class="text-body-2 font-weight-bold">
                        {{ getAverageWeight(goal) }}%
                      </span>
                    </div>
                    <div class="stat-row">
                      <span class="text-caption">最大:</span>
                      <span class="text-body-2">{{ getMaxWeight(goal) }}%</span>
                    </div>
                    <div class="stat-row">
                      <span class="text-caption">最小:</span>
                      <span class="text-body-2">{{ getMinWeight(goal) }}%</span>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- 汇总洞察 -->
      <v-divider class="my-6" />

      <div class="insights-section">
        <div class="d-flex align-center mb-4">
          <v-icon class="mr-3" size="28" color="amber">mdi-lightbulb-on</v-icon>
          <span class="text-h6 font-weight-bold">对比洞察</span>
        </div>

        <v-row>
          <v-col cols="12" md="4">
            <v-card variant="tonal" color="success" class="insight-card pa-4">
              <div class="d-flex align-center mb-3">
                <v-icon size="32" color="success">mdi-trophy</v-icon>
                <div class="ml-3">
                  <div class="text-caption text-medium-emphasis">进度最快</div>
                  <div class="text-h4 font-weight-bold text-success mt-1">
                    {{ getProgress(getHighestProgressGoal()) }}%
                  </div>
                </div>
              </div>
              <v-divider class="my-2" />
              <div class="d-flex align-center mt-3">
                <div class="goal-color-dot mr-2" :style="{ backgroundColor: getHighestProgressGoal()?.color || '#4CAF50' }" />
                <span class="text-body-1 font-weight-medium">
                  {{ getHighestProgressGoal()?.title || '-' }}
                </span>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card variant="tonal" color="primary" class="insight-card pa-4">
              <div class="d-flex align-center mb-3">
                <v-icon size="32" color="primary">mdi-format-list-numbered</v-icon>
                <div class="ml-3">
                  <div class="text-caption text-medium-emphasis">KR 数量最多</div>
                  <div class="text-h4 font-weight-bold text-primary mt-1">
                    {{ getKRCount(getMostKRsGoal()) }}
                  </div>
                </div>
              </div>
              <v-divider class="my-2" />
              <div class="d-flex align-center mt-3">
                <div class="goal-color-dot mr-2" :style="{ backgroundColor: getMostKRsGoal()?.color || '#2196F3' }" />
                <span class="text-body-1 font-weight-medium">
                  {{ getMostKRsGoal()?.title || '-' }}
                </span>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card variant="tonal" color="orange" class="insight-card pa-4">
              <div class="d-flex align-center mb-3">
                <v-icon size="32" color="orange">mdi-calendar-clock</v-icon>
                <div class="ml-3">
                  <div class="text-caption text-medium-emphasis">活跃时间最长</div>
                  <div class="text-h4 font-weight-bold text-orange mt-1">
                    {{ getActiveDays(getOldestGoal()) }}天
                  </div>
                </div>
              </div>
              <v-divider class="my-2" />
              <div class="d-flex align-center mt-3">
                <div class="goal-color-dot mr-2" :style="{ backgroundColor: getOldestGoal()?.color || '#FF9800' }" />
                <span class="text-body-1 font-weight-medium">
                  {{ getOldestGoal()?.title || '-' }}
                </span>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  goals: any[];
}>();

// State
const viewMode = ref<'table' | 'chart'>('table');

// Helper Methods
const getKRCount = (goal: any): number => {
  return goal?.keyResults?.length || 0;
};

const getProgress = (goal: any): number => {
  return goal?.progressPercentage || 0;
};

const getTotalWeight = (goal: any): number => {
  if (!goal?.keyResults) return 0;
  return goal.keyResults.reduce((sum: number, kr: any) => sum + (kr.weight || 0), 0);
};

const getAverageWeight = (goal: any): number => {
  const count = getKRCount(goal);
  if (count === 0) return 0;
  return Math.round(getTotalWeight(goal) / count);
};

const getMaxWeight = (goal: any): number => {
  if (!goal?.keyResults || goal.keyResults.length === 0) return 0;
  return Math.max(...goal.keyResults.map((kr: any) => kr.weight || 0));
};

const getMinWeight = (goal: any): number => {
  if (!goal?.keyResults || goal.keyResults.length === 0) return 0;
  return Math.min(...goal.keyResults.map((kr: any) => kr.weight || 0));
};

const getActiveDays = (goal: any): number => {
  if (!goal?.createdAt) return 0;
  const now = Date.now();
  const created = goal.createdAt;
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
};

const getStatusColor = (goal: any): string => {
  const colorMap: Record<string, string> = {
    NOT_STARTED: 'grey',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
    ARCHIVED: 'warning',
  };
  return colorMap[goal.status] || 'default';
};

const getStatusText = (goal: any): string => {
  const textMap: Record<string, string> = {
    NOT_STARTED: '未开始',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    ARCHIVED: '已归档',
  };
  return textMap[goal.status] || goal.status;
};

const getProgressColor = (progress: number): string => {
  if (progress >= 80) return 'success';
  if (progress >= 50) return 'primary';
  if (progress >= 20) return 'warning';
  return 'error';
};

const formatDate = (timestamp: number | null | undefined): string => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// Insights
const getHighestProgressGoal = () => {
  if (!props.goals || props.goals.length === 0) return null;
  return props.goals.reduce((max, goal) => (getProgress(goal) > getProgress(max) ? goal : max));
};

const getMostKRsGoal = () => {
  if (!props.goals || props.goals.length === 0) return null;
  return props.goals.reduce((max, goal) => (getKRCount(goal) > getKRCount(max) ? goal : max));
};

const getOldestGoal = () => {
  if (!props.goals || props.goals.length === 0) return null;
  return props.goals.reduce((oldest, goal) =>
    (goal.createdAt || 0) < (oldest.createdAt || 0) ? goal : oldest,
  );
};
</script>

<style scoped>
.comparison-stats-card {
  border-radius: 16px;
  overflow: hidden;
}

.comparison-header {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.08),
    rgba(var(--v-theme-surface), 1)
  );
}

.view-toggle {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.table-view {
  overflow-x: auto;
}

.comparison-table {
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  background: rgba(var(--v-theme-primary), 0.05);
}

.table-header th {
  padding: 16px !important;
  border-bottom: 2px solid rgba(var(--v-theme-primary), 0.2) !important;
}

.table-row td {
  padding: 20px 16px !important;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.08) !important;
}

.table-row:hover {
  background: rgba(var(--v-theme-primary), 0.02);
}

.goal-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.progress-cell {
  min-width: 180px;
}

.chart-view {
  min-height: 300px;
}

.chart-card {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-surface), 1),
    rgba(var(--v-theme-background), 0.98)
  );
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  height: 100%;
  transition: all 0.3s ease;
}

.chart-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-circle {
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-circle:hover {
  transform: scale(1.1);
}

.stat-value {
  font-size: 28px;
}

.weight-stats {
  padding: 16px;
  background: rgba(var(--v-theme-surface-bright), 0.5);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-outline), 0.08);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.insights-section {
  margin-top: 16px;
}

.insight-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  height: 100%;
}

.insight-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
</style>
