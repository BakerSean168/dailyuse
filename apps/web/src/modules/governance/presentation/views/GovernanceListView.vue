<template>
  <v-container fluid class="governance-list-view">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold">治理规则</h1>
        <p class="text-body-2 text-medium-emphasis">
          浏览和管理团队编码标准与最佳实践
        </p>
      </div>

      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        :to="{ name: 'governance-editor' }"
      >
        新建规则
      </v-btn>
    </div>

    <!-- Search & Filters -->
    <v-row class="mb-3">
      <v-col cols="12" md="6">
        <SearchBar
          v-model="searchQuery"
          @search="onSearch"
        />
      </v-col>

      <v-col cols="12" md="6">
        <div class="d-flex align-center ga-2">
          <!-- Status filter -->
          <v-btn-toggle
            v-model="selectedStatus"
            density="compact"
            variant="outlined"
            divided
            @update:model-value="onStatusFilter"
          >
            <v-btn value="" size="small">全部</v-btn>
            <v-btn value="Active" size="small" color="success">已发布</v-btn>
            <v-btn value="Draft" size="small" color="warning">草稿</v-btn>
            <v-btn value="Deprecated" size="small" color="error">已弃用</v-btn>
          </v-btn-toggle>

          <!-- Severity filter -->
          <v-btn-toggle
            v-model="selectedSeverity"
            density="compact"
            variant="outlined"
            divided
            @update:model-value="onSeverityFilter"
          >
            <v-btn value="" size="small">全部</v-btn>
            <v-btn value="Mandatory" size="small">强制</v-btn>
            <v-btn value="Recommended" size="small">推荐</v-btn>
          </v-btn-toggle>
        </div>
      </v-col>
    </v-row>

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
    <v-alert
      v-if="hasActiveFilter"
      type="info"
      variant="tonal"
      density="compact"
      closable
      class="mb-3"
      @click:close="clearFilters"
    >
      已应用过滤条件 · 共 {{ pagination.total }} 条结果
    </v-alert>

    <!-- Loading -->
    <v-progress-linear
      v-if="isLoading"
      indeterminate
      color="primary"
      class="mb-2"
    />

    <!-- Error -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mb-3"
    >
      {{ error }}
    </v-alert>

    <!-- Rules list -->
    <div v-if="rules.length > 0" class="rules-list">
      <RuleCard
        v-for="rule in rules"
        :key="rule.id"
        :rule="rule"
        class="mb-2"
        @click="goToDetail"
      />
    </div>

    <!-- Empty state -->
    <v-empty-state
      v-else-if="!isLoading"
      icon="mdi-shield-check-outline"
      title="暂无规则"
      :text="hasActiveFilter ? '当前过滤条件下没有匹配的规则' : '还没有创建任何治理规则'"
    >
      <template #actions>
        <v-btn
          v-if="hasActiveFilter"
          variant="outlined"
          @click="clearFilters"
        >
          清除过滤
        </v-btn>
        <v-btn
          v-else
          color="primary"
          :to="{ name: 'governance-editor' }"
        >
          创建第一条规则
        </v-btn>
      </template>
    </v-empty-state>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="d-flex justify-center mt-4">
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        :total-visible="7"
        @update:model-value="setPage"
      />
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGovernance } from '../composables/useGovernance';
import type { RuleClientDTO, RuleStatus, RuleSeverity } from '../../types';
import RuleCard from '../components/RuleCard.vue';
import SearchBar from '../components/SearchBar.vue';
import TagFilterChips from '../components/TagFilterChips.vue';

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

const searchQuery = ref('');
const selectedStatus = ref('');
const selectedSeverity = ref('');
const currentPage = ref(1);

const totalPages = computed(() =>
  Math.ceil(pagination.value.total / pagination.value.pageSize),
);

function onSearch(query: string) {
  searchRules(query);
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

onMounted(() => {
  fetchRules();
});
</script>

<style scoped>
.governance-list-view {
  max-width: 960px;
}

.rules-list {
  display: flex;
  flex-direction: column;
}
</style>
