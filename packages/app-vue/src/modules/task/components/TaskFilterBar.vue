<script setup lang="ts">
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
import { Check, ChevronDown, Filter, LayoutGrid, Search, Share2, X } from '@lucide/vue';
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

const activeStatus = computed(
  () =>
    props.statusOptions.find((option) => option.value === status.value) ?? props.statusOptions[0],
);

const activeRelationLabel = computed(
  () => props.relationOptions.find((option) => option.value === relation.value)?.label ?? '',
);
</script>

<template>
  <FilterBar class="!border-b-0 !px-3 !py-2" data-testid="task-toolbar-filters">
    <template #tabs>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="outline"
            size="sm"
            class="h-7 max-w-44 gap-1.5 text-xs"
            data-testid="task-status-menu"
          >
            <span class="truncate">{{ activeStatus?.label }}</span>
            <Badge variant="secondary" class="px-1.5 text-[10px]">
              {{ activeStatus?.count ?? 0 }}
            </Badge>
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
            <span class="hidden max-w-28 truncate @xl/panel:inline">
              {{
                relation === 'all'
                  ? t('task.templateMgmt.relationFilterLabel')
                  : activeRelationLabel
              }}
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
      <div
        class="group/search relative h-7 w-7 transition-[width] focus-within:w-40 @xl/panel:w-40 @3xl/panel:w-56"
        data-testid="task-toolbar-search"
      >
        <Search
          class="pointer-events-none absolute left-1.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="search"
          :aria-label="t('task.management.searchPlaceholder')"
          :placeholder="t('task.management.searchPlaceholder')"
          class="h-7 w-full cursor-pointer border-transparent bg-secondary/50 pl-7 pr-7 text-xs text-transparent placeholder:text-transparent focus:cursor-text focus:text-foreground focus:placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-background @xl/panel:cursor-text @xl/panel:text-foreground @xl/panel:placeholder:text-muted-foreground"
          data-testid="task-search-input"
        />
        <Button
          v-if="search"
          variant="ghost"
          size="icon"
          class="absolute right-0 top-0 h-7 w-7"
          :aria-label="t('task.templateMgmt.clearFilter')"
          data-testid="task-search-clear"
          @click="search = ''"
        >
          <X class="h-3.5 w-3.5" />
        </Button>
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
          :title="t('task.templateMgmt.viewCard')"
          @click="viewMode = 'card'"
        >
          <LayoutGrid class="h-3.5 w-3.5" />
          <span class="hidden @3xl/panel:inline">{{ t('task.templateMgmt.viewCard') }}</span>
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
          <span class="hidden @3xl/panel:inline">{{ t('task.templateMgmt.viewGraph') }}</span>
        </Button>
      </div>
    </template>
  </FilterBar>
</template>
