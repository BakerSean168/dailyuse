<template>
  <div class="goal-timeline-view">
    <div class="timeline-header">
      <h2>{{ goalTitle }} - 时间线</h2>
      <div class="timeline-stats" v-if="timelineData">
        <span class="stat">
          <strong>{{ timelineData.stats.totalSnapshots }}</strong> 个快照
        </span>
        <span class="stat">
          <strong>{{ timelineData.stats.totalChanges }}</strong> 次变更
        </span>
        <span class="stat">
          平均权重变化: <strong>{{ timelineData.stats.avgWeightChange.toFixed(1) }}%</strong>
        </span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loadingSnapshots" class="loading-state">
      <div class="spinner" />
      <span>加载时间线数据...</span>
    </div>

    <!-- 无数据状态 -->
    <div v-else-if="!hasTimeline" class="empty-state">
      <svg viewBox="0 0 24 24" class="empty-icon">
        <path
          d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
          fill="currentColor"
        />
      </svg>
      <h3>暂无时间线数据</h3>
      <p>此目标尚无权重变更历史记录</p>
    </div>

    <!-- 时间线内容 -->
    <template v-else>
      <!-- 时间线控制器 -->
      <TimelineControls
        v-if="timelineData"
        :snapshots="timelineData.snapshots"
        v-model:current-index="currentIndex"
        v-model:is-playing="isPlaying"
        v-model:speed="speed"
        v-model:loop="loop"
        @snapshot-change="handleSnapshotChange"
      />

      <!-- 可视化区域 -->
      <div class="visualization-area">
        <!-- 权重饼图 -->
        <div class="weight-chart">
          <h3>关键结果权重分布</h3>
          <div ref="weightChartRef" class="chart-container" />
        </div>

        <!-- 权重列表 -->
        <div class="weight-list">
          <h3>关键结果详情</h3>
          <div v-if="currentSnapshot" class="kr-items">
            <div v-for="kr in currentSnapshot.data.keyResults" :key="kr.uuid" class="kr-item">
              <div class="kr-header">
                <span class="kr-title">{{ kr.title }}</span>
                <span class="kr-weight">{{ kr.weight.toFixed(1) }}%</span>
              </div>
              <div class="kr-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: kr.progress + '%' }" />
                </div>
                <span class="progress-text">{{ kr.progress.toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 导出按钮 -->
      <div class="export-actions">
        <button class="export-btn" @click="exportAsImage" :disabled="exporting">
          <svg viewBox="0 0 24 24" class="btn-icon">
            <path
              d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"
              fill="currentColor"
            />
          </svg>
          {{ exporting ? '导出中...' : '导出为图片' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import type { ECharts } from 'echarts';
import TimelineControls from './TimelineControls.vue';
import { useGoalTimeline } from '../../composables/useGoalTimeline';
import type { TimelineSnapshot } from '../../../application/services/GoalTimelineService';

// ==================== Props ====================

const props = defineProps<{
  /** 目标数据 */
  goal: any; // GoalClientDTO
}>();

// ==================== State ====================

const weightChartRef = ref<HTMLDivElement>();
let weightChart: ECharts | null = null;

const exporting = ref(false);

// ==================== Timeline Logic ====================

const goalRef = computed(() => props.goal);
const {
  timelineData,
  currentSnapshot,
  hasTimeline,
  loadingSnapshots,
  currentIndex,
  isPlaying,
  speed,
  loop,
} = useGoalTimeline(goalRef);

const goalTitle = computed(() => props.goal?.title || '未命名目标');

// ==================== Methods ====================

function initWeightChart() {
  if (!weightChartRef.value) return;

  weightChart = echarts.init(weightChartRef.value);
  updateWeightChart();
}

function updateWeightChart() {
  if (!weightChart || !currentSnapshot.value) return;

  const snapshot = currentSnapshot.value;
  const data = snapshot.data.keyResults.map((kr) => ({
    name: kr.title,
    value: kr.weight,
  }));

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}% ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        fontSize: 12,
      },
    },
    series: [
      {
        name: '权重',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: {c}%',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data,
      },
    ],
    animation: true,
    animationDuration: 500,
  };

  weightChart.setOption(option);
}

function handleSnapshotChange(snapshot: TimelineSnapshot) {
  updateWeightChart();
}

async function exportAsImage() {
  if (!weightChart) return;

  try {
    exporting.value = true;

    // 获取图表的 base64 数据
    const imageData = weightChart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff',
    });

    // 创建下载链接
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `${goalTitle.value}-时间线-${Date.now()}.png`;
    link.click();
  } catch (error) {
    console.error('Failed to export image:', error);
  } finally {
    exporting.value = false;
  }
}

// ==================== Watchers ====================

watch(currentSnapshot, () => {
  updateWeightChart();
});

// ==================== Lifecycle ====================

onMounted(async () => {
  await nextTick();
  initWeightChart();

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (weightChart) {
    weightChart.dispose();
    weightChart = null;
  }
  window.removeEventListener('resize', handleResize);
});

function handleResize() {
  if (weightChart) {
    weightChart.resize();
  }
}
</script>

<style scoped>
.goal-timeline-view {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

.timeline-header {
  margin-bottom: 24px;
}

.timeline-header h2 {
  margin: 0 0 12px 0;
  font-size: 24px;
  color: #333;
}

.timeline-stats {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: #666;
}

.stat strong {
  color: #4caf50;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: #fff;
  border-radius: 8px;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e8e8e8;
  border-top-color: #4caf50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: #fff;
  border-radius: 8px;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: #bbb;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #666;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  color: #999;
}

/* 可视化区域 */
.visualization-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 24px;
}

.weight-chart,
.weight-list {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.weight-chart h3,
.weight-list h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.chart-container {
  height: 400px;
}

/* 关键结果列表 */
.kr-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kr-item {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  border-left: 4px solid #4caf50;
}

.kr-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.kr-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.kr-weight {
  font-size: 16px;
  font-weight: bold;
  color: #4caf50;
}

.kr-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #666;
  min-width: 45px;
  text-align: right;
}

/* 导出按钮 */
.export-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #4caf50;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.export-btn:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  width: 20px;
  height: 20px;
}

/* 响应式 */
@media (max-width: 1024px) {
  .visualization-area {
    grid-template-columns: 1fr;
  }
}
</style>
