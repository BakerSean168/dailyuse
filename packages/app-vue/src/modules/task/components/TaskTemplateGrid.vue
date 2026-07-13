<script setup lang="ts">
/**
 * TaskTemplateGrid — 任务卡片网格（UI_PAGE_REDESIGN_PLAN §6）
 *
 * 从 TaskTemplateManagement 拆出：只负责网格 + 空态 + 骨架；
 * 过滤状态与视图切换上移到 TaskManagementView。
 * DraggableTaskCard 拖拽建依赖契约原样保留。
 */
import { useI18n } from 'vue-i18n';
import { Button, Skeleton } from '@dailyuse/ui-vue-shadcn';
import { ListChecks, Plus } from 'lucide-vue-next';
import DraggableTaskCard from './cards/DraggableTaskCard.vue';
import AppEmptyState from '../../../components/shared/AppEmptyState.vue';
import type { TaskTemplateViewModel } from './types';

withDefaults(
  defineProps<{
    /** 当前过滤下要展示的模板 */
    templates: TaskTemplateViewModel[];
    /** 全库模板总数（区分「全空」与「过滤后空」） */
    totalCount: number;
    loading?: boolean;
    /** 当前过滤（状态 tab 之外）是否激活，用于「清除过滤」按钮 */
    hasActiveFilters?: boolean;
    /** 当前状态 tab 的空文案 */
    statusEmptyText: string;
    highlightedTemplateId?: string | null;
    enableDrag?: boolean;
    onCreateDependency?: (
      source: TaskTemplateViewModel,
      target: TaskTemplateViewModel,
    ) => Promise<boolean> | boolean;
  }>(),
  {
    loading: false,
    hasActiveFilters: false,
    highlightedTemplateId: null,
    enableDrag: true,
    onCreateDependency: undefined,
  },
);

defineEmits<{
  'create-template': [];
  'ai-generate': [];
  'clear-filters': [];
  'click-template': [templateId: string];
  'edit-template': [templateId: string];
  'delete-template': [template: TaskTemplateViewModel];
  'pause-template': [template: TaskTemplateViewModel];
  'resume-template': [template: TaskTemplateViewModel];
  'relation-filter-click': [filter: 'blocked' | 'dependencies' | 'children'];
  'locate-graph': [templateId: string];
}>();

const { t } = useI18n();
</script>

<template>
  <!-- 首次加载：卡片骨架（§0.3 禁整页 spinner） -->
  <div
    v-if="loading"
    class="grid grid-cols-1 gap-6 @2xl/panel:grid-cols-2 @5xl/panel:grid-cols-3"
    data-testid="task-grid-skeleton"
  >
    <div v-for="i in 6" :key="i" class="space-y-3 rounded-lg border border-border/50 p-4">
      <Skeleton class="h-5 w-2/3" />
      <Skeleton class="h-3 w-1/2" />
      <Skeleton class="h-3 w-full" />
      <div class="flex gap-2 pt-2">
        <Skeleton class="h-5 w-14" />
        <Skeleton class="h-5 w-14" />
      </div>
    </div>
  </div>

  <!-- 全库为空：AppEmptyState + 主操作 + AI 次链接 -->
  <AppEmptyState
    v-else-if="totalCount === 0"
    :icon="ListChecks"
    :title="t('task.templateMgmt.emptyTitle')"
    :description="t('task.templateMgmt.emptyDescription')"
    :secondary-label="t('task.templateMgmt.emptyAiLink')"
    testid="tasks-empty-state"
    @secondary="$emit('ai-generate')"
  >
    <template #action>
      <Button
        data-testid="create-first-task-template-button"
        size="sm"
        @click="$emit('create-template')"
      >
        <Plus class="mr-1.5 h-4 w-4" />
        {{ t('task.templateMgmt.createFirst') }}
      </Button>
    </template>
  </AppEmptyState>

  <!-- 过滤后为空：轻文案 + 清除过滤 -->
  <div
    v-else-if="templates.length === 0"
    class="flex flex-col items-center gap-3 py-16 text-center"
    data-testid="tasks-filtered-empty"
  >
    <p class="text-sm text-muted-foreground">{{ statusEmptyText }}</p>
    <Button v-if="hasActiveFilters" variant="outline" size="sm" @click="$emit('clear-filters')">
      {{ t('task.templateMgmt.clearFilter') }}
    </Button>
  </div>

  <!-- 卡片网格（拖拽建依赖保留） -->
  <div v-else class="grid grid-cols-1 gap-6 @2xl/panel:grid-cols-2 @5xl/panel:grid-cols-3">
    <DraggableTaskCard
      v-for="template in templates"
      :key="template.id"
      :template="template"
      :highlighted="highlightedTemplateId === template.id"
      :enable-drag="enableDrag"
      :on-create-dependency="onCreateDependency"
      @click="(id) => $emit('click-template', id)"
      @edit="(id) => $emit('edit-template', id)"
      @delete="(tpl) => $emit('delete-template', tpl)"
      @pause="(tpl) => $emit('pause-template', tpl)"
      @resume="(tpl) => $emit('resume-template', tpl)"
      @parent-task-click="(id) => $emit('click-template', id)"
      @relation-filter-click="(filter) => $emit('relation-filter-click', filter)"
      @locate-graph="(id) => $emit('locate-graph', id)"
    />
  </div>
</template>
