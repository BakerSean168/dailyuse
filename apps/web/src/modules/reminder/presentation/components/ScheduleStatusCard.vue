<template>
  <v-card :loading="isLoading" class="schedule-status-card">
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon :color="statusColor" class="mr-2">{{ statusIcon }}</v-icon>
        <span>调度状态</span>
      </div>
      <v-chip
        v-if="scheduleStatus"
        :color="scheduleStatus.enabled ? 'success' : 'warning'"
        size="small"
      >
        {{ scheduleStatus.enabled ? '已启用' : '已禁用' }}
      </v-chip>
    </v-card-title>

    <v-divider />

    <!-- 加载状态 -->
    <v-card-text v-if="isLoading">
      <v-skeleton-loader type="list-item-three-line" />
    </v-card-text>

    <!-- 错误状态 -->
    <v-card-text v-else-if="error" class="text-center">
      <v-icon size="48" color="error" class="mb-2">mdi-alert-circle</v-icon>
      <div class="text-error">{{ error }}</div>
      <v-btn variant="outlined" size="small" @click="refresh" class="mt-2">重试</v-btn>
    </v-card-text>

    <!-- 无调度状态 -->
    <v-card-text v-else-if="!scheduleStatus || !scheduleStatus.hasSchedule" class="text-center">
      <v-icon size="48" color="disabled" class="mb-2">mdi-calendar-clock</v-icon>
      <div class="text-medium-emphasis">未设置调度</div>
      <div class="text-caption text-medium-emphasis mt-1">此提醒模板尚未配置自动调度</div>
    </v-card-text>

    <!-- 调度状态详情 -->
    <v-card-text v-else>
      <v-list density="compact">
        <!-- Cron 表达式 -->
        <v-list-item v-if="scheduleStatus.cronExpression">
          <template #prepend>
            <v-icon>mdi-clock-outline</v-icon>
          </template>
          <v-list-item-title>Cron 表达式</v-list-item-title>
          <v-list-item-subtitle>
            <code class="text-caption">{{ scheduleStatus.cronExpression }}</code>
          </v-list-item-subtitle>
        </v-list-item>

        <!-- Cron 描述 -->
        <v-list-item v-if="scheduleStatus.cronDescription">
          <template #prepend>
            <v-icon>mdi-text-box-outline</v-icon>
          </template>
          <v-list-item-title>调度规则</v-list-item-title>
          <v-list-item-subtitle>{{ scheduleStatus.cronDescription }}</v-list-item-subtitle>
        </v-list-item>

        <!-- 单次调度时间 -->
        <v-list-item v-if="scheduleStatus.triggerType === 'ONCE' && scheduleStatus.scheduledTime">
          <template #prepend>
            <v-icon>mdi-calendar</v-icon>
          </template>
          <v-list-item-title>调度时间</v-list-item-title>
          <v-list-item-subtitle>{{
            formatDateTime(scheduleStatus.scheduledTime)
          }}</v-list-item-subtitle>
        </v-list-item>

        <!-- 下次执行时间 -->
        <v-list-item v-if="scheduleStatus.nextRunAt">
          <template #prepend>
            <v-icon color="primary">mdi-clock-fast</v-icon>
          </template>
          <v-list-item-title>下次执行</v-list-item-title>
          <v-list-item-subtitle class="text-primary font-weight-medium">
            {{ formatDateTime(scheduleStatus.nextRunAt) }}
            <span class="text-caption ml-1">({{ getRelativeTime(scheduleStatus.nextRunAt) }})</span>
          </v-list-item-subtitle>
        </v-list-item>

        <!-- 上次执行时间 -->
        <v-list-item v-if="scheduleStatus.lastRunAt">
          <template #prepend>
            <v-icon>mdi-clock-check-outline</v-icon>
          </template>
          <v-list-item-title>上次执行</v-list-item-title>
          <v-list-item-subtitle>
            {{ formatDateTime(scheduleStatus.lastRunAt) }}
            <span class="text-caption ml-1">({{ getRelativeTime(scheduleStatus.lastRunAt) }})</span>
          </v-list-item-subtitle>
        </v-list-item>

        <!-- 执行次数 -->
        <v-list-item>
          <template #prepend>
            <v-icon>mdi-counter</v-icon>
          </template>
          <v-list-item-title>执行次数</v-list-item-title>
          <v-list-item-subtitle>{{ scheduleStatus.executionCount }} 次</v-list-item-subtitle>
        </v-list-item>

        <!-- 状态 -->
        <v-list-item>
          <template #prepend>
            <v-icon :color="getStatusColor(scheduleStatus.status)">mdi-information-outline</v-icon>
          </template>
          <v-list-item-title>状态</v-list-item-title>
          <v-list-item-subtitle>
            <v-chip
              :color="getStatusColor(scheduleStatus.status)"
              size="x-small"
              variant="outlined"
            >
              {{ getStatusText(scheduleStatus.status) }}
            </v-chip>
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>

      <!-- 最近执行历史 -->
      <v-expansion-panels
        v-if="scheduleStatus.recentExecutions && scheduleStatus.recentExecutions.length > 0"
        class="mt-4"
      >
        <v-expansion-panel>
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-history</v-icon>
              <span>最近执行历史 ({{ scheduleStatus.recentExecutions.length }})</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-timeline density="compact" side="end" align="start">
              <v-timeline-item
                v-for="(execution, index) in scheduleStatus.recentExecutions"
                :key="index"
                :dot-color="execution.success ? 'success' : 'error'"
                size="small"
              >
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="text-caption">{{ formatDateTime(execution.executedAt) }}</div>
                    <div v-if="execution.error" class="text-caption text-error">
                      {{ execution.error }}
                    </div>
                  </div>
                  <v-chip :color="execution.success ? 'success' : 'error'" size="x-small">
                    {{ execution.success ? '成功' : '失败' }}
                  </v-chip>
                </div>
              </v-timeline-item>
            </v-timeline>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>

    <!-- 操作按钮 -->
    <v-card-actions v-if="scheduleStatus && scheduleStatus.hasSchedule">
      <v-spacer />
      <v-btn variant="text" size="small" @click="refresh" :loading="isLoading">
        <v-icon start>mdi-refresh</v-icon>
        刷新
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getReminderApiClient } from '@dailyuse/infrastructure-client';

const reminderApiClient = getReminderApiClient();

// ===== Props =====
interface Props {
  templateUuid: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // 秒
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: false,
  refreshInterval: 60,
});

// ===== 响应式状态 =====
const isLoading = ref(false);
const error = ref<string | null>(null);
const scheduleStatus = ref<any>(null);

let refreshTimer: ReturnType<typeof setInterval> | null = null;

// ===== 计算属性 =====
const statusColor = computed(() => {
  if (!scheduleStatus.value || !scheduleStatus.value.hasSchedule) return 'grey';
  if (!scheduleStatus.value.enabled) return 'warning';
  if (scheduleStatus.value.status === 'ACTIVE') return 'success';
  if (scheduleStatus.value.status === 'PAUSED') return 'warning';
  if (scheduleStatus.value.status === 'CANCELLED') return 'error';
  return 'grey';
});

const statusIcon = computed(() => {
  if (!scheduleStatus.value || !scheduleStatus.value.hasSchedule) return 'mdi-calendar-blank';
  if (scheduleStatus.value.enabled) return 'mdi-calendar-check';
  return 'mdi-calendar-remove';
});

// ===== 方法 =====

/**
 * 获取调度状态
 */
async function fetchScheduleStatus(): Promise<void> {
  isLoading.value = true;
  error.value = null;

  try {
    scheduleStatus.value = await reminderApiClient.getScheduleStatus(props.templateUuid);
    console.log('📅 调度状态:', scheduleStatus.value);
  } catch (err: any) {
    console.error('获取调度状态失败:', err);
    error.value = err.message || '获取调度状态失败';
  } finally {
    isLoading.value = false;
  }
}

/**
 * 刷新数据
 */
async function refresh(): Promise<void> {
  await fetchScheduleStatus();
}

/**
 * 格式化日期时间
 */
function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  return format(d, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * 获取相对时间
 */
function getRelativeTime(date: Date | string | number | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return formatDistanceToNow(d, { locale: zhCN, addSuffix: true });
}

/**
 * 获取状态颜色
 */
function getStatusColor(status: string | undefined): string {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'PAUSED':
      return 'warning';
    case 'COMPLETED':
      return 'info';
    case 'CANCELLED':
      return 'error';
    default:
      return 'grey';
  }
}

/**
 * 获取状态文本
 */
function getStatusText(status: string | undefined): string {
  switch (status) {
    case 'ACTIVE':
      return '运行中';
    case 'PAUSED':
      return '已暂停';
    case 'COMPLETED':
      return '已完成';
    case 'CANCELLED':
      return '已取消';
    default:
      return '未知';
  }
}

/**
 * 设置自动刷新
 */
function setupAutoRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  if (props.autoRefresh && props.refreshInterval > 0) {
    refreshTimer = setInterval(() => {
      fetchScheduleStatus();
    }, props.refreshInterval * 1000);
  }
}

// ===== 生命周期 =====
onMounted(async () => {
  await fetchScheduleStatus();
  setupAutoRefresh();
});

// 清理定时器
import { onUnmounted } from 'vue';
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<style scoped>
.schedule-status-card {
  height: 100%;
}

code {
  background-color: rgba(var(--v-theme-surface-variant), 0.5);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}
</style>
