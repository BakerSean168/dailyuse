<template>
  <v-container fluid class="governance-detail-view">
    <!-- Loading -->
    <v-progress-linear
      v-if="isLoading"
      indeterminate
      color="primary"
      class="mb-4"
    />

    <!-- Error -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
    >
      {{ error }}
    </v-alert>

    <template v-if="currentRule">
      <!-- Breadcrumb & Actions -->
      <div class="d-flex align-center justify-space-between mb-4">
        <v-breadcrumbs density="compact" class="pa-0">
          <v-breadcrumbs-item :to="{ name: 'governance-list' }">
            治理规则
          </v-breadcrumbs-item>
          <v-breadcrumbs-divider />
          <v-breadcrumbs-item>
            {{ currentRule.code }}
          </v-breadcrumbs-item>
        </v-breadcrumbs>

        <div class="d-flex ga-2">
          <v-btn
            variant="outlined"
            size="small"
            prepend-icon="mdi-pencil"
            :to="{ name: 'governance-editor', params: { id: currentRule.id } }"
          >
            编辑
          </v-btn>
          <v-btn
            variant="outlined"
            size="small"
            color="error"
            prepend-icon="mdi-delete"
            @click="confirmDelete"
          >
            删除
          </v-btn>
        </div>
      </div>

      <!-- Header -->
      <div class="mb-6">
        <div class="d-flex align-center ga-3 mb-2">
          <h1 class="text-h5 font-weight-bold">{{ currentRule.title }}</h1>
          <RuleStatusBadge :status="currentRule.status" />
          <v-chip
            size="small"
            :color="currentRule.severity === 'Mandatory' ? 'error' : 'info'"
            variant="tonal"
            label
          >
            {{ currentRule.severity === 'Mandatory' ? '强制' : '推荐' }}
          </v-chip>
        </div>

        <div class="d-flex align-center ga-2 mb-2">
          <v-chip
            v-for="tag in currentRule.tags"
            :key="tag"
            size="small"
            color="info"
            variant="tonal"
            label
          >
            {{ tag }}
          </v-chip>
        </div>

        <p class="text-caption text-medium-emphasis">
          代码: {{ currentRule.code }} · 更新于 {{ formatDate(currentRule.updatedAt) }}
        </p>
      </div>

      <!-- Deprecation Warning -->
      <v-alert
        v-if="currentRule.status === 'Deprecated'"
        type="warning"
        variant="tonal"
        class="mb-4"
        prominent
        icon="mdi-alert"
      >
        <v-alert-title>此规则已弃用</v-alert-title>
        <p v-if="currentRule.deprecationReason">{{ currentRule.deprecationReason }}</p>
        <p v-if="currentRule.replacementRuleId" class="mt-1">
          替代规则:
          <router-link :to="{ name: 'governance-detail', params: { id: currentRule.replacementRuleId } }">
            查看替代规则 →
          </router-link>
        </p>
      </v-alert>

      <!-- Description -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-1">描述</v-card-title>
        <v-card-text>
          <div class="description-content">{{ currentRule.description }}</div>
        </v-card-text>
      </v-card>

      <!-- Live Reference -->
      <v-card
        v-if="currentRule.liveReferenceLocation"
        variant="outlined"
        class="mb-4"
      >
        <v-card-title class="text-subtitle-1">
          <v-icon size="small" icon="mdi-link" class="mr-1" />
          实际引用位置
        </v-card-title>
        <v-card-text>
          <code class="text-primary">{{ currentRule.liveReferenceLocation }}</code>
        </v-card-text>
      </v-card>

      <!-- Good Examples -->
      <div v-if="currentRule.goodExamples.length > 0" class="mb-4">
        <h2 class="text-subtitle-1 font-weight-medium mb-2">
          <v-icon size="small" icon="mdi-check-circle" color="success" class="mr-1" />
          正确示例 ({{ currentRule.goodExamples.length }})
        </h2>
        <CodeSnippetView
          v-for="(snippet, index) in currentRule.goodExamples"
          :key="`good-${index}`"
          :snippet="snippet"
          class="mb-2"
        />
      </div>

      <!-- Bad Examples -->
      <div v-if="currentRule.badExamples.length > 0" class="mb-4">
        <h2 class="text-subtitle-1 font-weight-medium mb-2">
          <v-icon size="small" icon="mdi-close-circle" color="error" class="mr-1" />
          错误示例 ({{ currentRule.badExamples.length }})
        </h2>
        <CodeSnippetView
          v-for="(snippet, index) in currentRule.badExamples"
          :key="`bad-${index}`"
          :snippet="snippet"
          class="mb-2"
        />
      </div>

      <!-- Revision History -->
      <v-expansion-panels class="mb-4">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon size="small" icon="mdi-history" class="mr-2" />
            修订历史 ({{ revisions.length }})
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-timeline
              v-if="revisions.length > 0"
              density="compact"
              side="end"
            >
              <v-timeline-item
                v-for="rev in revisions"
                :key="rev.id"
                :dot-color="revisionColor(rev.changeType)"
                size="small"
              >
                <div class="d-flex align-center ga-2 mb-1">
                  <span class="text-subtitle-2 font-weight-medium">
                    v{{ rev.revisionNumber }}
                  </span>
                  <v-chip size="x-small" :color="revisionColor(rev.changeType)" variant="tonal" label>
                    {{ revisionLabel(rev.changeType) }}
                  </v-chip>
                  <span class="text-caption text-medium-emphasis">
                    {{ formatDate(rev.createdAt) }}
                  </span>
                </div>
                <div class="text-caption text-medium-emphasis">
                  变更字段: {{ rev.changedFields.join(', ') || '初始创建' }}
                </div>
              </v-timeline-item>
            </v-timeline>
            <p v-else class="text-body-2 text-medium-emphasis">
              暂无修订历史
            </p>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>确认删除</v-card-title>
        <v-card-text>
          确定要删除规则 "{{ currentRule?.title }}" 吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false">取消</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="isSaving"
            @click="handleDelete"
          >
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGovernance } from '../composables/useGovernance';
import RuleStatusBadge from '../components/RuleStatusBadge.vue';
import CodeSnippetView from '../components/CodeSnippetView.vue';

const props = defineProps<{
  id: string;
}>();

const route = useRoute();
const router = useRouter();
const {
  currentRule,
  revisions,
  isLoading,
  isSaving,
  error,
  fetchRule,
  fetchRevisions,
  deleteRule,
} = useGovernance();

const showDeleteDialog = ref(false);

async function loadRule(id: string) {
  await fetchRule(id);
  if (currentRule.value) {
    await fetchRevisions(id);
  }
}

function confirmDelete() {
  showDeleteDialog.value = true;
}

async function handleDelete() {
  if (!currentRule.value) return;
  const success = await deleteRule(currentRule.value.id);
  if (success) {
    showDeleteDialog.value = false;
    router.push({ name: 'governance-list' });
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function revisionColor(changeType: string): string {
  switch (changeType) {
    case 'Created': return 'success';
    case 'Updated': return 'info';
    case 'Deprecated': return 'warning';
    case 'Reactivated': return 'primary';
    default: return 'grey';
  }
}

function revisionLabel(changeType: string): string {
  switch (changeType) {
    case 'Created': return '创建';
    case 'Updated': return '更新';
    case 'Deprecated': return '弃用';
    case 'Reactivated': return '重新激活';
    default: return changeType;
  }
}

onMounted(() => loadRule(props.id));

watch(
  () => props.id,
  (newId) => {
    if (newId) loadRule(newId);
  },
);
</script>

<style scoped>
.governance-detail-view {
  max-width: 960px;
}

.description-content {
  white-space: pre-wrap;
  line-height: 1.7;
}
</style>
