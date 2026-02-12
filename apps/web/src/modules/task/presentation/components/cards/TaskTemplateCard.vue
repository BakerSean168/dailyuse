<!-- filepath: d:\myPrograms\DailyUse\src\modules\Task\presentation\components\TaskTemplateCard.vue -->
<template>
  <v-card 
    class="template-card" 
    :class="`priority-${getPriorityLevel(template.priority ?? 0)}`"
    elevation="2" 
    hover
  >
    <!-- 卡片头部 -->
    <v-card-title class="template-header">
      <div class="header-content">
        <!-- Priority Indicator Icon - Story 2.4 -->
        <div v-if="(template.priority ?? 0) >= 80" class="priority-indicator">
          <v-icon 
            :class="getIndicatorClass(template.priority ?? 0)"
            :color="getIndicatorColor(template.priority ?? 0)"
            size="medium"
          >
            {{ getIndicatorIcon(template.priority ?? 0) }}
          </v-icon>
        </div>
        
        <h3 class="template-title">{{ template.title }}</h3>
        <div class="header-meta">
          <v-chip
            :color="getTemplateStatusColor(template)"
            variant="tonal"
            size="small"
            class="status-chip"
          >
            <v-icon start size="small">
              {{ getTemplateStatusIcon(template) }}
            </v-icon>
            {{ getTemplateStatusText(template) }}
          </v-chip>
          <v-chip
            :color="getImportanceColor(template.importance)"
            variant="outlined"
            size="small"
            class="importance-chip ml-2"
          >
            <v-icon start size="small">mdi-flag</v-icon>
            {{ template.importanceText }}
          </v-chip>
          <!-- Story 2.3: Urgency chip removed - Priority now computed automatically -->
          <!-- Priority Score Chip - Story 2.4 -->
          <v-chip
            :color="getPriorityColor(template.priority ?? 0)"
            variant="tonal"
            size="small"
            class="priority-chip ml-2"
          >
            <v-icon start size="small">mdi-flame</v-icon>
            {{ Math.round(template.priority ?? 0) }}/100
          </v-chip>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="template-actions">
        <v-btn 
          data-testid="task-card-edit-button"
          icon 
          variant="text" 
          size="small" 
          @click="handleEdit" 
          class="action-btn"
        >
          <v-icon>mdi-pencil</v-icon>
          <v-tooltip activator="parent" location="bottom">编辑模板</v-tooltip>
        </v-btn>
        <v-btn
          data-testid="task-card-delete-button"
          icon
          variant="text"
          size="small"
          color="error"
          @click="handleDelete"
          class="action-btn"
        >
          <v-icon>mdi-delete</v-icon>
          <v-tooltip activator="parent" location="bottom">删除模板</v-tooltip>
        </v-btn>
      </div>
    </v-card-title>

    <!-- 卡片内容 -->
    <v-card-text class="template-content">
      <!-- 描述 -->
      <p class="template-description">
        {{ template.description || '暂无描述' }}
      </p>

      <!-- 元信息 -->
      <div class="template-meta">
        <!-- 日期范围 -->
        <div class="meta-item">
          <v-icon color="primary" size="small" class="meta-icon"> mdi-calendar-range </v-icon>
          <span class="meta-text">
            开始于 {{ format(template.timeConfig.startDate || Date.now(), 'yyyy-MM-dd') }}
          </span>
        </div>

        <!-- 时间范围 -->
        <div class="meta-item">
          <v-icon color="info" size="small" class="meta-icon"> mdi-clock </v-icon>
          <span class="meta-text">
            {{ timeLabel }}
          </span>
        </div>

        <!-- 重复模式 -->
        <div class="meta-item">
          <v-icon color="success" size="small" class="meta-icon"> mdi-repeat </v-icon>
          <span class="meta-text">
            {{ template.recurrenceText }}
          </span>
        </div>

        <!-- 分类和标签 -->
        <div class="meta-item">
          <v-icon color="purple" size="small" class="meta-icon"> mdi-tag </v-icon>
          <span class="meta-text">
            <span v-if="template.tags.length > 0" class="tags">
              · {{ template.tags.slice(0, 2).join(', ') }}
              <span v-if="template.tags.length > 2"
                >等{{ template.tags.length }}个标签</span
              >
            </span>
          </span>
        </div>

        <!-- 关联目标 -->
        <div v-if="template.goalBinding" class="meta-item">
          <v-icon color="warning" size="small" class="meta-icon"> mdi-target </v-icon>
          <span class="meta-text"> 关联目标 </span>
        </div>
      </div>

      <!-- 关键结果标签 -->
      <div v-if="template.goalBinding" class="key-results mt-3">
        <v-chip
          size="small"
          color="primary"
          variant="outlined"
          class="mr-1 mb-1"
        >
          <v-icon start size="small">mdi-target</v-icon>
          {{ getGoalBindingName(template.goalBinding) }}
        </v-chip>
      </div>

      <!-- 统计信息 -->
      <div v-if="template.instanceCount > 0" class="analytics-info mt-3">
        <v-divider class="mb-2"></v-divider>
        <div class="analytics-row">
          <div class="analytics-item">
            <span class="analytics-label">总次数：</span>
            <span class="analytics-value">{{ template.instanceCount }}</span>
          </div>
          <div class="analytics-item">
            <span class="analytics-label">完成率：</span>
            <span class="analytics-value"
              >{{ Math.round(template.completionRate * 100) }}%</span
            >
          </div>
        </div>
      </div>
    </v-card-text>

    <!-- 卡片底部操作 -->
    <v-card-actions class="template-footer">
      <v-btn
        v-if="template.isActive"
        data-testid="task-card-pause-button"
        color="primary"
        variant="outlined"
        size="small"
        @click="pauseTaskTemplate(template.uuid)"
      >
        <v-icon start size="small">mdi-pause</v-icon>
        暂停
      </v-btn>
      <v-btn
        v-else-if="template.isPaused"
        data-testid="task-card-resume-button"
        color="warning"
        variant="outlined"
        size="small"
        @click="handleResume"
      >
        <v-icon start size="small">mdi-play</v-icon>
        恢复
      </v-btn>
      <v-btn
        v-else-if="template.status === 'ARCHIVED'"
        data-testid="task-card-activate-button"
        color="info"
        variant="outlined"
        size="small"
        @click="activateTaskTemplate(template.uuid)"
      >
        <v-icon start size="small">mdi-play</v-icon>
        激活
      </v-btn>

      <v-divider class="mx-2" inset vertical></v-divider>

      <div class="template-dates">
        <span class="date-text">
          创建于 {{ template.formattedCreatedAt }}
        </span>
      </div>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGoalStore } from '@/modules/goal/presentation/stores/goalStore';
import { format } from 'date-fns';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { UrgencyLevel } from '@dailyuse/contracts/shared';
// types
import type { TaskTemplate } from '@dailyuse/task/domain-client';
import type { Goal, KeyResult } from '@dailyuse/goal/domain-client';
// styles - Story 2.4
import '@/styles/priority-colors.css';

// composables
import { useTaskTemplate } from '../../composables/useTaskTemplate';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';

const { deleteTaskTemplate, pauseTaskTemplate, activateTaskTemplate } = useTaskTemplate();
// 🔥 使用全局单例，确保与 DuMessageProvider 共享同一个实例
const message = getGlobalMessage();

interface Props {
  template: TaskTemplate;
  statusFilters?: Array<{
    label: string;
    value: string;
    icon: string;
  }>;
}

interface Emits {
  (e: 'edit', templateId: string): void;
  (e: 'delete', template: TaskTemplate): void;
  (e: 'pause', template: TaskTemplate): void;
  (e: 'resume', template: TaskTemplate): void;
}

const props = withDefaults(defineProps<Props>(), {
  statusFilters: () => [
    { label: '进行中', value: 'active', icon: 'mdi-play-circle' },
    { label: '草稿', value: 'draft', icon: 'mdi-file-document-outline' },
    { label: '已暂停', value: 'paused', icon: 'mdi-pause-circle' },
    { label: '已归档', value: 'archived', icon: 'mdi-archive' },
  ],
});

const emit = defineEmits<Emits>();
const goalStore = useGoalStore();

// 状态相关方法
const getTemplateStatusColor = (template: TaskTemplate) => {
  if (template.isActive) return 'success';
  if (template.isPaused) return 'warning';
  if (template.isArchived) return 'default';
  return 'default';
};

const getTemplateStatusIcon = (template: TaskTemplate) => {
  const statusMap: Record<string, string> = {
    ACTIVE: 'mdi-play-circle',
    PAUSED: 'mdi-pause-circle',
    ARCHIVED: 'mdi-archive',
    DELETED: 'mdi-delete',
  };
  return statusMap[template.status] || 'mdi-circle';
};

const getTemplateStatusText = (template: TaskTemplate) => {
  return template.statusText;
};

const getImportanceText = (importance: ImportanceLevel) => {
  const map: Record<ImportanceLevel, string> = {
    [ImportanceLevel.Trivial]: '无关紧要',
    [ImportanceLevel.Minor]: '不太重要',
    [ImportanceLevel.Moderate]: '中等重要',
    [ImportanceLevel.Important]: '非常重要',
    [ImportanceLevel.Vital]: '极其重要',
  };
  return map[importance];
};

const getUrgencyText = (urgency: UrgencyLevel) => {
  const map: Record<UrgencyLevel, string> = {
    [UrgencyLevel.None]: '无期限',
    [UrgencyLevel.Low]: '低度紧急',
    [UrgencyLevel.Medium]: '中等紧急',
    [UrgencyLevel.High]: '高度紧急',
    [UrgencyLevel.Critical]: '非常紧急',
  };
  return map[urgency];
};

const getImportanceColor = (importance: ImportanceLevel) => {
  switch (importance) {
    case ImportanceLevel.Trivial:
      return 'white';
    case ImportanceLevel.Minor:
      return 'success';
    case ImportanceLevel.Moderate:
      return 'info';
    case ImportanceLevel.Important:
      return 'warning';
    case ImportanceLevel.Vital:
      return 'error';
    default:
      return 'default';
  }
};

const getUrgencyColor = (urgency: UrgencyLevel) => {
  switch (urgency) {
    case UrgencyLevel.None:
      return 'white';
    case UrgencyLevel.Low:
      return 'success';
    case UrgencyLevel.Medium:
      return 'info';
    case UrgencyLevel.High:
      return 'warning';
    case UrgencyLevel.Critical:
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Story 2.4: Priority Visualization Functions
 * ============================================
 * Returns priority level classification: 'high' | 'medium' | 'low'
 * High (>=80): Red background/border - demands immediate attention
 * Medium (60-79): Amber background/border - notable but not urgent
 * Low (<60): Gray background/border - normal priority
 */
const getPriorityLevel = (priority: number): string => {
  if (priority >= 80) return 'high';
  if (priority >= 60) return 'medium';
  return 'low';
};

/**
 * Returns Vuetify color for priority chip
 */
const getPriorityColor = (priority: number): string => {
  if (priority >= 80) return 'error'; // red
  if (priority >= 60) return 'warning'; // amber
  return 'grey'; // gray
};

/**
 * Returns icon for priority indicator
 * 90+: ⚡ (flash) - critical/on fire
 * 80-89: ⬆️ (arrow-up) - important
 */
const getIndicatorIcon = (priority: number): string => {
  if (priority >= 90) return 'mdi-flash'; // ⚡
  if (priority >= 80) return 'mdi-arrow-up'; // ⬆️
  return 'mdi-pin'; // 📌 (shouldn't show for <80)
};

/**
 * Returns color for priority indicator icon
 */
const getIndicatorColor = (priority: number): string => {
  if (priority >= 90) return '#DC2626'; // red-600
  if (priority >= 80) return '#DC2626'; // red-600
  return '#F59E0B'; // amber-500
};

/**
 * Returns CSS animation class for priority indicator
 * Faster pulse for critical (>=90), subtle pulse for high (80-89)
 */
const getIndicatorClass = (priority: number): string => {
  if (priority >= 90) return 'pulse-animation'; // faster pulse
  if (priority >= 80) return 'subtle-pulse'; // subtle pulse
  return ''; // no animation for medium/low
};

// 关键结果相关
const getGoalBindingName = (binding: any) => {
  if (!binding) return '';
  const goal = goalStore.getGoalByUuid(binding.goalUuid);
  const kr = goal?.keyResults.find((k: any) => k.uuid === binding.keyResultUuid);
  return kr ? `${goal.title} - ${kr.title}` : '关联目标';
};

const formatCompletionTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)}分钟`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
  }
};

/**
 * 根据时间类型生成时间标签
 * - ALL_DAY: 全天
 * - TIME_POINT: HH:mm
 * - TIME_RANGE: HH:mm - HH:mm
 */
const timeLabel = computed(() => {
  const timeConfig = props.template.timeConfig;
  
  if (timeConfig.timeType === 'ALL_DAY') {
    return '全天';
  }
  
  if (timeConfig.timeType === 'TIME_POINT' && timeConfig.timePoint !== null) {
    const hours = Math.floor(timeConfig.timePoint / 60);
    const minutes = timeConfig.timePoint % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  if (timeConfig.timeType === 'TIME_RANGE' && timeConfig.timeRange) {
    const startHours = Math.floor(timeConfig.timeRange.start / 60);
    const startMinutes = timeConfig.timeRange.start % 60;
    const endHours = Math.floor(timeConfig.timeRange.end / 60);
    const endMinutes = timeConfig.timeRange.end % 60;
    
    const startTime = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    
    return `${startTime} - ${endTime}`;
  }
  
  return '全天';
});

// 事件处理方法
const handleEdit = () => {
  emit('edit', props.template.uuid);
};

const handleDelete = async () => {
  try {
    await message.delConfirm(
      `确定要删除任务模板 "${props.template.title}" 吗？\n此操作不可恢复，相关的任务实例也会被删除。`,
      '删除任务模板'
    );
    
    await deleteTaskTemplate(props.template.uuid);
    message.success('任务模板删除成功');
  } catch {
    // 用户取消删除，静默处理
  }
};

const handlePauseTemplate = () => {
  emit('pause', props.template);
};

const handleResume = () => {
  emit('resume', props.template);
};
</script>

<style scoped>
/* 模板卡片样式 */
.template-card {
  border-radius: 16px;
  transition: all 0.3s ease;
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.template-header {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.05),
    rgba(var(--v-theme-secondary), 0.05)
  );
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.08);
  padding: 1rem 1.5rem;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.template-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  /* 标题固定1行，超出省略 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.template-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.1);
}

/* 卡片内容 */
.template-content {
  padding: 1.5rem;
}

.template-description {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  /* 描述固定2行，超出省略 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: calc(0.9rem * 1.5 * 2); /* 固定高度：字体大小 × 行高 × 2行 */
}

.time-summary {
  border-left: 3px solid rgb(var(--v-theme-primary));
  padding-left: 0.75rem;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 0 8px 8px 0;
  padding: 0.75rem;
}

.template-meta {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meta-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.meta-text {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.8);
  line-height: 1.4;
}

.tags {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-style: italic;
}

.key-results {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

/* 统计信息 */
.analytics-info {
  background: rgba(var(--v-theme-surface), 0.3);
  border-radius: 8px;
  padding: 0.75rem;
}

.analytics-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.analytics-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.analytics-label {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-bottom: 0.25rem;
}

.analytics-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

/* 卡片底部 */
.template-footer {
  padding: 0.75rem 1.5rem;
  background: rgba(var(--v-theme-surface), 0.3);
  border-top: 1px solid rgba(var(--v-theme-outline), 0.08);
  min-height: auto;
}

.template-dates {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.date-text {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .template-header {
    padding: 1rem;
  }

  .template-content {
    padding: 1rem;
  }

  .template-footer {
    padding: 0.75rem 1rem;
  }

  .analytics-row {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .header-content {
    align-items: center;
    text-align: center;
  }

  .template-actions {
    justify-content: center;
    margin-top: 0.5rem;
  }

  .meta-item {
    justify-content: center;
  }

  .time-summary {
    text-align: center;
  }
}

/**
 * Story 2.4: Priority-Based Card Styling
 * ======================================
 * Cards now have visual priority indicators through:
 * 1. Left border color (high=red, medium=amber, low=gray)
 * 2. Background color tint
 * 3. Icon indicator for high priority tasks
 * 4. Subtle shadow effect
 */

/* Priority Card Base Styling */
.template-card {
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

/* High Priority (>=80) - RED */
.template-card.priority-high {
  background: var(--priority-high-bg-light);
  border-left-color: var(--priority-high-border-light);
  box-shadow: 0 2px 4px var(--priority-high-shadow-light);
}

/* Medium Priority (60-79) - AMBER */
.template-card.priority-medium {
  background: var(--priority-medium-bg-light);
  border-left-color: var(--priority-medium-border-light);
  box-shadow: 0 2px 4px var(--priority-medium-shadow-light);
}

/* Low Priority (<60) - GRAY */
.template-card.priority-low {
  background: var(--priority-low-bg-light);
  border-left-color: var(--priority-low-border-light);
  box-shadow: 0 1px 2px var(--priority-low-shadow-light);
}

/* Dark Theme Adjustments */
[data-theme="dark"] .template-card.priority-high {
  background: var(--priority-high-bg-dark);
  border-left-color: var(--priority-high-border-dark);
  box-shadow: 0 2px 4px var(--priority-high-shadow-dark);
}

[data-theme="dark"] .template-card.priority-medium {
  background: var(--priority-medium-bg-dark);
  border-left-color: var(--priority-medium-border-dark);
  box-shadow: 0 2px 4px var(--priority-medium-shadow-dark);
}

[data-theme="dark"] .template-card.priority-low {
  background: var(--priority-low-bg-dark);
  border-left-color: var(--priority-low-border-dark);
  box-shadow: 0 1px 2px var(--priority-low-shadow-dark);
}

/* Priority Indicator Icon */
.priority-indicator {
  margin-right: 8px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* Animation Keyframes */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes subtle-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}

/* Animation Classes */
.pulse-animation {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.subtle-pulse {
  animation: subtle-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Respect User's Motion Preference */
@media (prefers-reduced-motion: reduce) {
  .pulse-animation,
  .subtle-pulse {
    animation: none;
    opacity: 1;
  }
}

/* Responsive Icon Sizing */
@media (max-width: 600px) {
  .priority-indicator {
    margin-right: 4px;
  }

  .priority-indicator :deep(i) {
    font-size: 20px !important;
  }
}

@media (min-width: 1280px) {
  .priority-indicator {
    margin-right: 12px;
  }

  .priority-indicator :deep(i) {
    font-size: 28px !important;
  }
}
</style>

