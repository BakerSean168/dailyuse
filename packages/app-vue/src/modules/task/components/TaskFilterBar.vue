<script setup lang="ts">
/**
 * TaskFilterBar — 任务库过滤行（UI_PAGE_REDESIGN_PLAN §6）
 *
 * 消费共享 FilterBar：
 *   状态 Tabs（含计数）｜关系过滤下拉（原第二排按钮收敛）｜搜索｜视图切换（卡片/图谱）
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from '@dailyuse/ui-vue-shadcn';
import { Check, ChevronDown, Filter, LayoutGrid, Search, Share2 } from 'lucide-vue-next';
import FilterBar from '../../../components/shared/FilterBar.vue';
import type { TaskRelationFilter, TaskStatusFilter, TaskViewMode } from './types';

const props = defineProps<{
  statusOptions: Array<{ value: TaskStatusFilter; label: string; count: number }>;
  relationOptions: Array<{ value: TaskRelationFilter; label: string; count: number }>;
}>();

const status = defineModel<TaskStatusFilter>('status', { required: true });
const relation = defineModel<TaskRelationFilter>('relation', { required: true });
const search = defineModel<string>('search', { required: true });
const viewMode = defineModel<TaskViewMode>('viewMode', { required: true });

const { t } = useI18n();

const activeRelationLabel = computed(
  () => props.relationOptions.find((option) => option.value === relation.value)?.label ?? '',
);
</script>

<template>
  <FilterBar>
    <template #tabs>
      <div class="flex items-center gap-1" data-testid="task-status-tabs">
        <Button
          v-for="option in statusOptions"
          :key="option.value"
          variant="ghost"
          size="sm"
          class="h-7 px-3 text-muted-foreground hover:text-foreground"
          :class="status === option.value ? 'bg-secondary font-medium text-foreground' : ''"
          :data-testid="`task-status-tab-${option.value.toLowerCase()}`"
          @click="status = option.value"
        >
          {{ option.label }}
          <Badge variant="secondary" class="ml-1.5 px-1.5 text-[10px]">{{ option.count }}</Badge>
        </Button>
      </div>
    </template>

    <template #filters>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="outline"
            size="sm"
            class="h-7 gap-1.5 text-xs"
            data-testid="task-relation-filter-trigger"
          >
            <Filter class="h-3.5 w-3.5" />
            {{ relation === 'all' ? t('task.templateMgmt.relationFilterLabel') : activeRelationLabel }}
            <ChevronDown class="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="w-44">
          <DropdownMenuItem
            v-for="option in relationOptions"
            :key="option.value"
            class="justify-between text-xs"
            @click="relation = option.value"
          >
            <span class="flex items-center gap-2">
              <Check
                class="h-3.5 w-3.5"
                :class="relation === option.value ? 'opacity-100' : 'opacity-0'"
              />
              {{ option.label }}
            </span>
            <span class="text-muted-foreground">{{ option.count }}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>

    <template #search>
      <div class="relative hidden w-56 md:block">
        <Search class="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="search"
          :placeholder="t('task.management.searchPlaceholder')"
          class="h-7 w-full border-transparent bg-secondary/50 pl-8 text-xs focus-visible:border-ring focus-visible:bg-background"
        />
      </div>
    </template>

    <template #trailing>
      <div class="flex items-center gap-1 rounded-md border border-border p-0.5">
        <Button
          variant="ghost"
          size="sm"
          class="h-6 gap-1 px-2 text-xs text-muted-foreground"
          :class="viewMode === 'card' ? 'bg-secondary text-foreground' : ''"
          data-testid="task-view-card-button"
          @click="viewMode = 'card'"
        >
          <LayoutGrid class="h-3.5 w-3.5" />
          {{ t('task.templateMgmt.viewCard') }}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="h-6 gap-1 px-2 text-xs text-muted-foreground"
          :class="viewMode === 'graph' ? 'bg-secondary text-foreground' : ''"
          data-testid="view-dependency-graph-button"
          @click="viewMode = 'graph'"
        >
          <Share2 class="h-3.5 w-3.5" />
          {{ t('task.templateMgmt.viewGraph') }}
        </Button>
      </div>
    </template>
  </FilterBar>
</template>
