<template>
  <v-card class="gantt-chart-card" elevation="2">
    <!-- 头部 -->
    <v-card-title class="gantt-header pa-4">
      <div class="d-flex align-center justify-space-between w-100">
        <div class="d-flex align-center">
          <v-icon color="primary" size="24" class="mr-3">mdi-chart-gantt</v-icon>
          <div>
            <h3 class="text-h6 font-weight-bold mb-0">目标时间线</h3>
            <span class="text-caption text-medium-emphasis">
              {{ sortedGoals.length }} 个进行中的目标
            </span>
          </div>
        </div>

        <!-- 图例 -->
        <div class="d-flex align-center gap-4">
          <div class="d-flex align-center">
            <div class="legend-dot bg-primary"></div>
            <span class="text-caption ml-1">已完成</span>
          </div>
          <div class="d-flex align-center">
            <div class="legend-dot bg-surface-variant"></div>
            <span class="text-caption ml-1">未完成</span>
          </div>
        </div>
      </div>
    </v-card-title>

    <v-divider />

    <!-- 甘特图内容 -->
    <v-card-text class="gantt-content pa-0">
      <div class="gantt-chart">
        <!-- 表头区域 -->
        <div class="gantt-header-row">
          <!-- 目标信息列头 -->
          <div class="goal-info-header">
            <span class="text-body-2 font-weight-medium text-medium-emphasis">目标</span>
          </div>

          <!-- 时间刻度 -->
          <div class="date-scale">
            <div class="month-row">
              <div
                v-for="month in months"
                :key="month.name"
                :style="{ width: `${month.daysCount * dayWidth}px` }"
                class="month-label"
              >
                {{ month.name }}月
              </div>
            </div>
            <div class="days-row">
              <div
                v-for="day in days"
                :key="day.date"
                :class="{ today: day.isToday, weekend: isWeekend(day.fullDate) }"
                class="day-label"
                :style="{ width: `${dayWidth}px` }"
              >
                {{ day.date }}
              </div>
            </div>
          </div>
        </div>

        <!-- 目标时间线 -->
        <div class="goals-container">
          <div
            v-for="(goal, index) in sortedGoals"
            :key="goal.uuid"
            class="gantt-row"
            :style="{ '--goal-index': index }"
          >
            <!-- 目标信息固定列 -->
            <div class="goal-info">
              <div class="goal-info-card">
                <div class="d-flex align-center">
                  <v-avatar :color="goal.color" size="24" variant="flat" class="mr-2">
                    <v-icon color="white" size="12">mdi-target</v-icon>
                  </v-avatar>
                  <div class="goal-text">
                    <span class="goal-title">{{ goal.title }}</span>
                    <div class="goal-progress">{{ goal.progress }}%</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 时间轴区域 -->
            <div class="timeline-container">
              <div class="timeline" :style="{ width: `${days.length * dayWidth}px` }">
                <!-- 背景条 -->
                <div class="progress-bar-bg" :style="getGoalBarStyle(goal, false)"></div>
                <!-- 进度条 -->
                <div class="progress-bar-fill" :style="getGoalBarStyle(goal, true)"></div>
                <!-- 目标标签 -->
                <div class="goal-label" :style="{ left: `${getGoalLabelPosition(goal)}px` }">
                  <v-chip :color="goal.color" size="x-small" variant="elevated" class="goal-chip">
                    {{ goal.progress }}%
                  </v-chip>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 今日指示器 -->
        <div class="today-indicator" :style="{ left: `${getTodayIndicatorPosition()}px` }">
          <div class="indicator-line"></div>
          <v-chip color="error" size="x-small" variant="elevated" class="indicator-label">
            <v-icon start size="10">mdi-calendar-today</v-icon>
            今日
          </v-chip>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGoalStore } from '@/modules/goal/presentation/stores/goalStore';
import type { Goal } from '@dailyuse/goal/domain-client';

const goalStore = useGoalStore();
const dayWidth = 32; // 每个日期的宽度
const goalInfoWidth = 200; // 目标信息列的固定宽度

// 生成日期范围
const dateRange = computed(() => {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 10); // 前10天
  const end = new Date(today);
  end.setDate(today.getDate() + 40); // 后40天
  return { start, end };
});

// 计算日期和月份数据
const { days, months } = computed(() => {
  const { start, end } = dateRange.value;
  const days = [];
  const months = new Map();

  let currentDate = new Date(start);
  while (currentDate <= end) {
    days.push({
      date: currentDate.getDate(),
      isToday: currentDate.toDateString() === new Date().toDateString(),
      fullDate: new Date(currentDate),
    });

    const monthKey = currentDate.getMonth();
    if (!months.has(monthKey)) {
      months.set(monthKey, {
        name: currentDate.getMonth() + 1,
        daysCount: 0,
      });
    }
    months.get(monthKey).daysCount++;

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    days,
    months: Array.from(months.values()),
  };
}).value;

// 获取目标列表（排除已归档和已删除的）
const sortedGoals = computed(() => {
  const today = new Date();
  return [...goalStore.getAllGoals]
    .filter((goal) => {
      if (goal.folderUuid === 'delete' || goal.folderUuid === 'archive') return false;
      const endDate = new Date(goal.endTime);
      return endDate >= today;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
});

// 判断是否为周末
const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

// 计算目标条样式
const getGoalBarStyle = (goal: Goal, isFill: boolean) => {
  const startDate = goal.startDate ? new Date(goal.startDate) : new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = goal.targetDate ? new Date(goal.targetDate) : new Date();
  endDate.setHours(0, 0, 0, 0);
  const rangeStart = new Date(dateRange.value.start);
  rangeStart.setHours(0, 0, 0, 0);

  const startOffset = Math.max(
    0,
    (startDate.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000),
  );
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  const width = isFill ? duration * dayWidth * (goal.overallProgress / 100) : duration * dayWidth;

  return {
    left: `${startOffset * dayWidth}px`,
    width: `${width}px`,
    backgroundColor: isFill ? goal.color || 'primary' : `${goal.color || '#666'}33`,
    borderRadius: '6px',
    boxShadow: isFill ? `0 2px 8px ${goal.color || '#666'}44` : 'none',
  };
};

// 计算目标标签位置
const getGoalLabelPosition = (goal: Goal) => {
  const startDate = goal.startDate ? new Date(goal.startDate) : new Date();
  const rangeStart = new Date(dateRange.value.start);
  const startOffset = Math.max(
    0,
    (startDate.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000),
  );
  return startOffset * dayWidth + 8;
};

// 计算今日指示器位置 - 修正偏移
const getTodayIndicatorPosition = () => {
  return goalInfoWidth + 10 * dayWidth + 16; // 加上目标信息列的宽度
};
</script>

<style scoped>
.gantt-chart-card {
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  overflow: hidden;
}

.gantt-header {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.05) 0%,
    rgba(var(--v-theme-primary), 0.02) 100%
  );
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.gantt-content {
  overflow-x: auto;
  max-height: 600px;
}

.gantt-chart {
  position: relative;
  min-width: fit-content;
  padding: 16px;
}

/* 表头布局 */
.gantt-header-row {
  display: flex;
  position: sticky;
  top: 0;
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(8px);
  z-index: 2;
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.goal-info-header {
  width: 200px;
  min-width: 200px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 8px 0 0 8px;
}

.date-scale {
  flex: 1;
  min-width: 0;
}

.month-row {
  display: flex;
  border-bottom: 2px solid rgba(var(--v-theme-primary), 0.2);
  padding: 8px 0;
}

.month-label {
  font-weight: 600;
  text-align: center;
  color: rgb(var(--v-theme-primary));
  font-size: 0.9rem;
}

.days-row {
  display: flex;
  padding: 8px 0;
}

.day-label {
  text-align: center;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  min-width: 32px;
  padding: 4px 0;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.day-label.today {
  color: rgb(var(--v-theme-error));
  font-weight: bold;
  background: rgba(var(--v-theme-error), 0.1);
}

.day-label.weekend {
  color: rgba(var(--v-theme-warning), 0.8);
  background: rgba(var(--v-theme-warning), 0.05);
}

.goals-container {
  position: relative;
  background: rgba(var(--v-theme-surface-variant), 0.05);
  border-radius: 12px;
  padding: 16px;
}

.gantt-row {
  display: flex;
  margin-bottom: 16px;
  align-items: center;
  animation: slideInLeft 0.5s ease calc(var(--goal-index) * 0.1s) both;
}

.goal-info {
  width: 200px;
  min-width: 200px;
  padding-right: 16px;
  flex-shrink: 0;
}

.goal-info-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.goal-title {
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  display: block;
}

.goal-progress {
  font-size: 0.7rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-weight: 600;
}

.timeline-container {
  flex: 1;
  min-width: 0;
  overflow: visible;
}

.timeline {
  position: relative;
  height: 32px;
}

.progress-bar-bg,
.progress-bar-fill {
  position: absolute;
  height: 100%;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-bar-bg {
  opacity: 0.3;
}

.progress-bar-fill {
  z-index: 1;
}

.goal-label {
  position: absolute;
  top: -8px;
  z-index: 2;
}

.goal-chip {
  font-size: 0.65rem;
  font-weight: 700;
}

.today-indicator {
  position: absolute;
  top: 80px;
  /* 调整到表头下方 */
  bottom: 0;
  width: 2px;
  z-index: 3;
  pointer-events: none;
}

.indicator-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  background: linear-gradient(
    to bottom,
    rgba(var(--v-theme-error), 0.8),
    rgba(var(--v-theme-error), 0.4)
  );
}

.indicator-label {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 600;
  white-space: nowrap;
}

/* 滚动条美化 */
.gantt-content::-webkit-scrollbar {
  height: 8px;
}

.gantt-content::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-surface-variant), 0.1);
  border-radius: 4px;
}

.gantt-content::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.3);
  border-radius: 4px;
}

.gantt-content::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.5);
}

/* 动画 */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .goal-info,
  .goal-info-header {
    width: 150px;
    min-width: 150px;
  }

  .goal-title {
    max-width: 100px;
  }

  .gantt-chart {
    padding: 8px;
  }
}
</style>
