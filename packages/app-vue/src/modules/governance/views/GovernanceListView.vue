<template>
  <div class="max-w-[960px] mx-auto p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">治理规则</h1>
        <p class="text-sm text-muted-foreground mt-1">浏览和管理团队编码标准与最佳实践</p>
      </div>

      <router-link
        :to="{ name: 'governance-editor' }"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Plus :size="16" />
        新建规则
      </router-link>
    </div>

    <!-- Search & Filters -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <SearchBar v-model="searchQuery" @search="onSearch" />

      <div class="flex items-center gap-2 flex-wrap">
        <!-- Status filter -->
        <div class="flex rounded-md border overflow-hidden">
          <button
            v-for="opt in statusOptions"
            :key="opt.value"
            class="px-3 py-1.5 text-xs font-medium transition-colors"
            :class="[
              selectedStatus === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted',
            ]"
            @click="
              selectedStatus = opt.value;
              onStatusFilter(opt.value);
            "
          >
            {{ opt.label }}
          </button>
        </div>

        <!-- Severity filter -->
        <div class="flex rounded-md border overflow-hidden">
          <button
            v-for="opt in severityOptions"
            :key="opt.value"
            class="px-3 py-1.5 text-xs font-medium transition-colors"
            :class="[
              selectedSeverity === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted',
            ]"
            @click="
              selectedSeverity = opt.value;
              onSeverityFilter(opt.value);
            "
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Tag filter chips -->
    <TagFilterChips
      v-if="allTags.length > 0"
      :tags="allTags"
      :selected-tags="filter.tags"
      class="mb-4"
      @toggle="toggleFilterTag"
      @clear="clearFilters"
    />

    <!-- Active filter indicator -->
    <div
      v-if="hasActiveFilter"
      class="flex items-center justify-between p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-800 dark:text-blue-400 mb-4"
    >
      <span>已应用过滤条件 · 共 {{ pagination.total }} 条结果</span>
      <button class="text-xs hover:underline" @click="clearFilters">清除</button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <!-- Error -->
    <div v-if="error" class="p-4 rounded-md bg-destructive/10 text-destructive text-sm mb-4">
      {{ error }}
    </div>

    <!-- Rules list -->
    <div v-if="rules.length > 0" class="flex flex-col gap-2">
      <RuleCard v-for="rule in rules" :key="rule.id" :rule="rule" @click="goToDetail" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!isLoading" class="flex flex-col items-center justify-center py-16 text-center">
      <Shield :size="48" class="text-muted-foreground/50 mb-4" />
      <h3 class="text-lg font-medium mb-1">暂无规则</h3>
      <p class="text-sm text-muted-foreground mb-4">
        {{ hasActiveFilter ? '当前过滤条件下没有匹配的规则' : '还没有创建任何治理规则' }}
      </p>
      <button
        v-if="hasActiveFilter"
        class="px-4 py-2 border rounded-md text-sm hover:bg-muted transition-colors"
        @click="clearFilters"
      >
        清除过滤
      </button>
      <router-link
        v-else
        :to="{ name: 'governance-editor' }"
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
      >
        创建第一条规则
      </router-link>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-6">
      <button
        :disabled="currentPage <= 1"
        class="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
        @click="
          currentPage--;
          setPage(currentPage);
        "
      >
        上一页
      </button>
      <span class="text-sm text-muted-foreground"> {{ currentPage }} / {{ totalPages }} </span>
      <button
        :disabled="currentPage >= totalPages"
        class="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
        @click="
          currentPage++;
          setPage(currentPage);
        "
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Shield } from 'lucide-vue-next';
import { useGovernance } from '../composables/useGovernance';
import { usePerformanceMonitor } from '../composables/use-performance-monitor';
import type { RuleClientDTO, RuleStatus, RuleSeverity } from '../types';
import { RuleCard, SearchBar, TagFilterChips } from '../components';

const router = useRouter();
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

const statusOptions = [
  { label: '全部', value: '' },
  { label: '已发布', value: 'Active' },
  { label: '草稿', value: 'Draft' },
  { label: '已弃用', value: 'Deprecated' },
];

const severityOptions = [
  { label: '全部', value: '' },
  { label: '强制', value: 'Mandatory' },
  { label: '推荐', value: 'Recommended' },
];

const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.pageSize));

function onSearch(query: string) {
  void trackSearch(() => searchRules(query));
}

function onStatusFilter(value: string) {
  setFilterStatus((value || null) as RuleStatus | null);
}

function onSeverityFilter(value: string) {
  setFilterSeverity((value || null) as RuleSeverity | null);
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
