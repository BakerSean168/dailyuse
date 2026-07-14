<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden" data-testid="governance-list-view">
    <!-- 面板内容头：Note/规范分区，不复读页面级标题壳 -->
    <header
      class="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-3"
      data-testid="governance-panel-header"
    >
      <p class="truncate text-xs text-muted-foreground">{{ countLabel }}</p>
      <Button size="sm" class="h-8" data-testid="governance-new-rule" @click="goToEditor">
        <Plus class="mr-1.5 h-4 w-4" />
        {{ t('governance.list.newRule') }}
      </Button>
    </header>

    <!-- FilterBar：搜索优先 + 状态/严重度/标签下拉 -->
    <FilterBar class="!px-3">
          <template #tabs>
            <div class="w-64">
              <GovernanceSearchBar v-model="searchQuery" @search="onSearch" />
            </div>
          </template>

          <template #filters>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" size="sm" class="h-8 gap-1.5 text-xs">
                  {{ activeStatusLabel }}
                  <ChevronDown class="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" class="w-40">
                <DropdownMenuItem
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  class="text-xs"
                  @click="selectStatus(opt.value)"
                >
                  <Check
                    class="mr-2 h-3.5 w-3.5"
                    :class="selectedStatus === opt.value ? 'opacity-100' : 'opacity-0'"
                  />
                  {{ opt.label }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" size="sm" class="h-8 gap-1.5 text-xs">
                  {{ activeSeverityLabel }}
                  <ChevronDown class="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" class="w-40">
                <DropdownMenuItem
                  v-for="opt in severityOptions"
                  :key="opt.value"
                  class="text-xs"
                  @click="selectSeverity(opt.value)"
                >
                  <Check
                    class="mr-2 h-3.5 w-3.5"
                    :class="selectedSeverity === opt.value ? 'opacity-100' : 'opacity-0'"
                  />
                  {{ opt.label }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu v-if="allTags.length > 0">
              <DropdownMenuTrigger as-child>
                <Button variant="outline" size="sm" class="h-8 gap-1.5 text-xs">
                  {{ t('governance.list.tagFilterLabel') }}
                  <Badge v-if="filter.tags.length" variant="secondary" class="px-1.5 text-[10px]">
                    {{ filter.tags.length }}
                  </Badge>
                  <ChevronDown class="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" class="max-h-72 w-48 overflow-y-auto">
                <DropdownMenuCheckboxItem
                  v-for="tag in allTags"
                  :key="tag"
                  class="text-xs"
                  :model-value="filter.tags.includes(tag)"
                  @update:model-value="() => toggleFilterTag(tag)"
                  @select.prevent
                >
                  {{ tag }}
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              v-if="hasActiveFilter"
              variant="ghost"
              size="sm"
              class="h-8 text-xs text-muted-foreground"
              @click="clearAllFilters"
            >
              {{ t('governance.list.clearFilter') }}
            </Button>
          </template>
    </FilterBar>

    <div class="min-h-0 flex-1 overflow-y-auto p-3">
      <div class="mx-auto max-w-4xl space-y-4">
        <!-- 错误：inline Alert + 重试 -->
        <Alert v-if="error" variant="destructive">
          <AlertTriangle class="h-4 w-4" />
          <AlertDescription class="flex items-center justify-between gap-4">
            <span>{{ error }}</span>
            <Button variant="outline" size="sm" class="h-7 shrink-0" @click="fetchRules()">
              {{ t('common.retry') }}
            </Button>
          </AlertDescription>
        </Alert>

        <!-- 加载 = 卡片骨架 -->
        <div v-if="isLoading" class="space-y-2" data-testid="governance-list-skeleton">
          <div v-for="i in 5" :key="i" class="space-y-2 rounded-lg border border-border/50 p-4">
            <div class="flex items-center gap-2">
              <Skeleton class="h-4 w-20" />
              <Skeleton class="h-4 w-48" />
            </div>
            <Skeleton class="h-3 w-2/3" />
          </div>
        </div>

        <!-- 规则列表 -->
        <div v-else-if="rules.length > 0" class="flex flex-col gap-2">
          <RuleCard v-for="rule in rules" :key="rule.id" :rule="rule" @click="goToDetail" />
        </div>

        <!-- 空态 -->
        <template v-else>
          <div
            v-if="hasActiveFilter"
            class="flex flex-col items-center gap-3 py-16 text-center"
            data-testid="governance-filtered-empty"
          >
            <p class="text-sm text-muted-foreground">{{ t('governance.list.emptyFilterHint') }}</p>
            <Button variant="outline" size="sm" @click="clearAllFilters">
              {{ t('governance.list.clearFilters') }}
            </Button>
          </div>
          <AppEmptyState
            v-else
            :icon="Shield"
            :title="t('governance.list.emptyTitle')"
            :description="t('governance.list.emptyHint')"
            :action-label="t('governance.list.createFirst')"
            testid="governance-empty-state"
            @action="goToEditor"
          />
        </template>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage <= 1"
            @click="
              currentPage--;
              setPage(currentPage);
            "
          >
            {{ t('governance.list.prevPage') }}
          </Button>
          <span class="text-sm text-muted-foreground"> {{ currentPage }} / {{ totalPages }} </span>
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage >= totalPages"
            @click="
              currentPage++;
              setPage(currentPage);
            "
          >
            {{ t('governance.list.nextPage') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { AlertTriangle, Check, ChevronDown, Plus, Shield } from '@lucide/vue';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
} from '@dailyuse/ui-vue-shadcn';
import FilterBar from '../../../components/shared/FilterBar.vue';
import AppEmptyState from '../../../components/shared/AppEmptyState.vue';
import { useGovernance } from '../composables/useGovernance';
import { usePerformanceMonitor } from '../composables/usePerformanceMonitor';
import type { RuleClientDTO, RuleStatus, RuleSeverity } from '../types';
import { RuleCard, GovernanceSearchBar } from '../components';

const router = useRouter();
const { t } = useI18n();
const {
  rules,
  isLoading,
  error,
  filter,
  pagination,
  allTags,
  hasActiveFilter,
  fetchRules,
  searchRules,
  setFilterStatus,
  setFilterSeverity,
  toggleFilterTag,
  clearFilters,
  setPage,
} = useGovernance();
const { trackSearch } = usePerformanceMonitor();

const searchQuery = ref('');
const selectedStatus = ref('');
const selectedSeverity = ref('');
const currentPage = ref(1);
const keyboardIndex = ref(-1);

const statusOptions = computed(() => [
  { label: t('governance.list.statusAll'), value: '' },
  { label: t('governance.list.statusActive'), value: 'Active' },
  { label: t('governance.list.statusDraft'), value: 'Draft' },
  { label: t('governance.list.statusDeprecated'), value: 'Deprecated' },
]);

const severityOptions = computed(() => [
  { label: t('governance.list.severityAll'), value: '' },
  { label: t('governance.list.severityMandatory'), value: 'Mandatory' },
  { label: t('governance.list.severityRecommended'), value: 'Recommended' },
]);

const activeStatusLabel = computed(
  () => statusOptions.value.find((o) => o.value === selectedStatus.value)?.label ?? '',
);
const activeSeverityLabel = computed(
  () => severityOptions.value.find((o) => o.value === selectedSeverity.value)?.label ?? '',
);

const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.pageSize));

// 过滤命中横幅已删除（§12-5）：计数并入页头描述文本
const countLabel = computed(() =>
  hasActiveFilter.value
    ? t('governance.list.filteredCount', { total: pagination.value.total })
    : t('governance.list.totalCount', { total: pagination.value.total }),
);

function onSearch(query: string) {
  void trackSearch(() => searchRules(query));
}

function selectStatus(value: string) {
  selectedStatus.value = value;
  setFilterStatus((value || null) as RuleStatus | null);
}

function selectSeverity(value: string) {
  selectedSeverity.value = value;
  setFilterSeverity((value || null) as RuleSeverity | null);
}

function clearAllFilters() {
  selectedStatus.value = '';
  selectedSeverity.value = '';
  searchQuery.value = '';
  clearFilters();
}

function goToEditor() {
  router.push({ name: 'governance-editor' });
}

function goToDetail(rule: RuleClientDTO) {
  router.push({ name: 'governance-detail', params: { id: rule.id } });
}

function onKeyboardNavigate(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (
    target &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  ) {
    return;
  }

  if (event.key !== 'j' && event.key !== 'k') {
    return;
  }

  if (rules.value.length === 0) {
    return;
  }

  event.preventDefault();

  const direction = event.key === 'j' ? 1 : -1;
  const startIndex =
    keyboardIndex.value < 0 ? (direction > 0 ? 0 : rules.value.length - 1) : keyboardIndex.value;

  const nextIndex = (startIndex + direction + rules.value.length) % rules.value.length;
  keyboardIndex.value = nextIndex;
  goToDetail(rules.value[nextIndex]);
}

onMounted(() => {
  window.addEventListener('keydown', onKeyboardNavigate);
  fetchRules();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyboardNavigate);
});
</script>
