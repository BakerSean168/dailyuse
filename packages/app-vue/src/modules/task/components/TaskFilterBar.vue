<script setup lang="ts">
/**
 * TaskFilterBar — 任务库过滤行（诊断修订 §7.3）
 *
 * 按面板内容宽度分档：
 * - < 440px：状态用 Select/Menu；搜索图标展开；视图切换仅图标
 * - 440–699px：状态 Tabs 可水平滚动；搜索图标展开
 * - >= 700px：状态/关系/搜索/视图单行完整展示
 */
import { computed, ref, watch } from 'vue';
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
import { Check, ChevronDown, Filter, LayoutGrid, Search, Share2, X } from '@lucide/vue';
import FilterBar from '../../../components/shared/FilterBar.vue';
import { usePanelWidth } from '../../../layouts/shell/usePanelWidth';
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
const { width } = usePanelWidth();

/** 状态呈现模式：menu / scroll / full */
const statusMode = computed(() => {
  const w = width.value ?? 9999;
  if (w < 440) return 'menu' as const;
  if (w < 700) return 'scroll' as const;
  return 'full' as const;
});

const compactChrome = computed(() => (width.value ?? 9999) < 440);
const searchInline = computed(() => (width.value ?? 9999) >= 700);
const searchExpanded = ref(false);

watch(searchInline, (inline) => {
  if (inline) searchExpanded.value = false;
});

const activeStatus = computed(
  () => props.statusOptions.find((option) => option.value === status.value) ?? props.statusOptions[0],
);

const activeRelationLabel = computed(
  () => props.relationOptions.find((option) => option.value === relation.value)?.label ?? '',
);

function toggleSearchExpanded() {
  searchExpanded.value = !searchExpanded.value;
  if (!searchExpanded.value) {
    // keep query; just collapse UI
  }
}

function clearSearch() {
  search.value = '';
  searchExpanded.value = false;
}
</script>

<template>
  <div class="border-b border-border bg-background">
    <FilterBar class="!px-3">
      <template #tabs>
        <!-- 极窄：状态菜单 -->
        <DropdownMenu v-if="statusMode === 'menu'">
          <DropdownMenuTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="h-7 max-w-[11rem] gap-1.5 text-xs"
              data-testid="task-status-menu"
            >
              <span class="truncate">{{ activeStatus?.label }}</span>
              <Badge variant="secondary" class="px-1.5 text-[10px]">{{ activeStatus?.count ?? 0 }}</Badge>
              <ChevronDown class="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-48">
            <DropdownMenuItem
              v-for="option in statusOptions"
              :key="option.value"
              class="justify-between text-xs"
              :data-testid="`task-status-tab-${option.value.toLowerCase()}`"
              @click="status = option.value"
            >
              <span class="flex items-center gap-2">
                <Check
                  class="h-3.5 w-3.5"
                  :class="status === option.value ? 'opacity-100' : 'opacity-0'"
                />
                {{ option.label }}
              </span>
              <span class="text-muted-foreground">{{ option.count }}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- 中档：可横向滚动的状态 Tabs；宽档同结构但无强制滚动壳 -->
        <div
          v-else
          class="flex min-w-0 items-center gap-1"
          :class="statusMode === 'scroll' ? 'max-w-full overflow-x-auto' : ''"
          data-testid="task-status-tabs"
        >
          <Button
            v-for="option in statusOptions"
            :key="option.value"
            variant="ghost"
            size="sm"
            class="h-7 shrink-0 px-3 text-muted-foreground hover:text-foreground"
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
              <span v-if="!compactChrome">
                {{ relation === 'all' ? t('task.templateMgmt.relationFilterLabel') : activeRelationLabel }}
              </span>
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
        <div v-if="searchInline" class="relative w-56">
          <Search class="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="search"
            :placeholder="t('task.management.searchPlaceholder')"
            class="h-7 w-full border-transparent bg-secondary/50 pl-8 text-xs focus-visible:border-ring focus-visible:bg-background"
            data-testid="task-search-input"
          />
        </div>
        <Button
          v-else
          variant="ghost"
          size="icon"
          class="h-7 w-7"
          data-testid="task-search-toggle"
          :aria-expanded="searchExpanded"
          :title="t('task.management.searchPlaceholder')"
          @click="toggleSearchExpanded"
        >
          <Search class="h-3.5 w-3.5" />
        </Button>
      </template>

      <template #trailing>
        <div class="flex items-center gap-1 rounded-md border border-border p-0.5">
          <Button
            variant="ghost"
            size="sm"
            class="h-6 gap-1 px-2 text-xs text-muted-foreground"
            :class="viewMode === 'card' ? 'bg-secondary text-foreground' : ''"
            data-testid="task-view-card-button"
            :title="t('task.templateMgmt.viewCard')"
            @click="viewMode = 'card'"
          >
            <LayoutGrid class="h-3.5 w-3.5" />
            <span v-if="!compactChrome">{{ t('task.templateMgmt.viewCard') }}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-6 gap-1 px-2 text-xs text-muted-foreground"
            :class="viewMode === 'graph' ? 'bg-secondary text-foreground' : ''"
            data-testid="view-dependency-graph-button"
            :title="t('task.templateMgmt.viewGraph')"
            @click="viewMode = 'graph'"
          >
            <Share2 class="h-3.5 w-3.5" />
            <span v-if="!compactChrome">{{ t('task.templateMgmt.viewGraph') }}</span>
          </Button>
        </div>
      </template>
    </FilterBar>

    <!-- 窄档展开搜索行 -->
    <div
      v-if="!searchInline && searchExpanded"
      class="flex items-center gap-2 border-t border-border/60 px-3 py-2"
      data-testid="task-search-expanded"
    >
      <div class="relative min-w-0 flex-1">
        <Search class="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="search"
          :placeholder="t('task.management.searchPlaceholder')"
          class="h-8 w-full border-transparent bg-secondary/50 pl-8 text-xs focus-visible:border-ring focus-visible:bg-background"
          data-testid="task-search-input"
          autofocus
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8 shrink-0"
        data-testid="task-search-clear"
        @click="clearSearch"
      >
        <X class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
