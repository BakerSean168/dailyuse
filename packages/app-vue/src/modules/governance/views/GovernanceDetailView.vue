<template>
  <div class="max-w-[960px] mx-auto p-6">
    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <!-- Error -->
    <div v-if="error" class="p-4 rounded-md bg-destructive/10 text-destructive text-sm mb-4">
      {{ error }}
    </div>

    <template v-if="currentRule">
      <!-- Breadcrumb & Actions -->
      <div class="flex items-center justify-between mb-6">
        <nav class="flex items-center gap-1 text-sm text-muted-foreground">
          <router-link :to="{ name: 'governance-list' }" class="hover:text-foreground transition-colors">
            治理规则
          </router-link>
          <ChevronRight :size="14" />
          <span class="text-foreground">{{ currentRule.code }}</span>
        </nav>

        <div class="flex items-center gap-2">
          <router-link
            :to="{ name: 'governance-history', params: { id: currentRule.id } }"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm hover:bg-muted transition-colors"
          >
            <History :size="14" />
            历史
          </router-link>
          <router-link
            :to="{ name: 'governance-editor-edit', params: { id: currentRule.id } }"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm hover:bg-muted transition-colors"
          >
            <Pencil :size="14" />
            编辑
          </router-link>
          <button
            class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-destructive/30 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
            @click="confirmDelete"
          >
            <Trash2 :size="14" />
            删除
          </button>
        </div>
      </div>

      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
          <h1 class="text-2xl font-bold">{{ currentRule.title }}</h1>
          <RuleStatusBadge :status="currentRule.status" />
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
            :class="currentRule.severity === 'Mandatory'
              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'"
          >
            {{ currentRule.severity === 'Mandatory' ? '强制' : '推荐' }}
          </span>
        </div>

        <div class="flex items-center gap-1.5 mb-2 flex-wrap">
          <span
            v-for="tag in currentRule.tags"
            :key="tag"
            class="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
          >
            {{ tag }}
          </span>
        </div>

        <p class="text-xs text-muted-foreground">
          代码: {{ currentRule.code }} · 更新于 {{ formatDate(currentRule.updatedAt) }}
        </p>
      </div>

      <!-- Deprecation Warning -->
      <div
        v-if="currentRule.status === 'Deprecated'"
        class="flex items-start gap-3 p-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 mb-6"
      >
        <AlertTriangle :size="20" class="text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <h3 class="font-medium text-yellow-800 dark:text-yellow-300">此规则已弃用</h3>
          <p v-if="currentRule.deprecationReason" class="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
            {{ currentRule.deprecationReason }}
          </p>
          <p v-if="currentRule.replacementRuleId" class="text-sm mt-1">
            替代规则:
            <router-link
              :to="{ name: 'governance-detail', params: { id: currentRule.replacementRuleId } }"
              class="text-primary hover:underline"
            >
              查看替代规则 →
            </router-link>
          </p>
        </div>
      </div>

      <!-- Description -->
      <div class="border rounded-lg mb-6">
        <div class="px-4 py-3 border-b bg-muted/30">
          <h2 class="text-sm font-medium">描述</h2>
        </div>
        <div class="p-4">
          <div class="text-sm whitespace-pre-wrap leading-7">{{ currentRule.description }}</div>
        </div>
      </div>

      <!-- Live Reference -->
      <div v-if="currentRule.liveReferenceLocation" class="border rounded-lg mb-6">
        <div class="px-4 py-3 border-b bg-muted/30">
          <h2 class="text-sm font-medium flex items-center gap-1.5">
            <Link :size="14" />
            实际引用位置
          </h2>
        </div>
        <div class="p-4">
          <code class="text-sm text-primary bg-primary/5 px-2 py-1 rounded">
            {{ currentRule.liveReferenceLocation }}
          </code>
        </div>
      </div>

      <!-- Good Examples -->
      <div v-if="currentRule.goodExamples.length > 0" class="mb-6">
        <h2 class="text-sm font-medium mb-3 flex items-center gap-1.5">
          <CheckCircle :size="16" class="text-green-500" />
          正确示例 ({{ currentRule.goodExamples.length }})
        </h2>
        <div class="space-y-3">
          <CodeSnippetView
            v-for="(snippet, index) in currentRule.goodExamples"
            :key="`good-${index}`"
            :snippet="snippet"
          />
        </div>
      </div>

      <!-- Bad Examples -->
      <div v-if="currentRule.badExamples.length > 0" class="mb-6">
        <h2 class="text-sm font-medium mb-3 flex items-center gap-1.5">
          <XCircle :size="16" class="text-destructive" />
          错误示例 ({{ currentRule.badExamples.length }})
        </h2>
        <div class="space-y-3">
          <CodeSnippetView
            v-for="(snippet, index) in currentRule.badExamples"
            :key="`bad-${index}`"
            :snippet="snippet"
          />
        </div>
      </div>

      <!-- Revision History -->
      <div class="border rounded-lg mb-6">
        <button
          class="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
          @click="showRevisions = !showRevisions"
        >
          <span class="text-sm font-medium flex items-center gap-1.5">
            <History :size="14" />
            修订历史 ({{ revisions.length }})
          </span>
          <ChevronRight :size="16" :class="{ 'rotate-90': showRevisions }" class="transition-transform" />
        </button>
        <div v-if="showRevisions" class="p-4 border-t">
          <div v-if="revisions.length > 0" class="space-y-4">
            <div
              v-for="rev in revisions"
              :key="rev.id"
              class="flex gap-3 relative pl-6"
            >
              <!-- Timeline line -->
              <div class="absolute left-2 top-2 bottom-0 w-px bg-border"></div>
              <!-- Timeline dot -->
              <div
                class="absolute left-0.5 top-1.5 w-3 h-3 rounded-full border-2 border-background"
                :class="revisionDotColor(rev.changeType)"
              ></div>

              <div class="flex-1">
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-sm font-medium">v{{ rev.revisionNumber }}</span>
                  <span
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium"
                    :class="revisionBadgeClasses(rev.changeType)"
                  >
                    {{ revisionLabel(rev.changeType) }}
                  </span>
                  <span class="text-xs text-muted-foreground">
                    {{ formatDate(rev.createdAt) }}
                  </span>
                </div>
                <p class="text-xs text-muted-foreground">
                  变更字段: {{ rev.changedFields.join(', ') || '初始创建' }}
                </p>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground">暂无修订历史</p>
        </div>
      </div>
    </template>

    <!-- Delete Confirmation Dialog -->
    <div v-if="showDeleteDialog" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="fixed inset-0 bg-black/50" @click="showDeleteDialog = false"></div>
      <div class="relative bg-background rounded-lg shadow-lg w-full max-w-[400px] p-6 z-10">
        <h3 class="text-lg font-semibold mb-2">确认删除</h3>
        <p class="text-sm text-muted-foreground mb-6">
          确定要删除规则 "{{ currentRule?.title }}" 吗？此操作不可撤销。
        </p>
        <div class="flex justify-end gap-2">
          <button
            class="px-4 py-2 rounded-md border text-sm hover:bg-muted transition-colors"
            @click="showDeleteDialog = false"
          >
            取消
          </button>
          <button
            class="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            :disabled="isSaving"
            @click="handleDelete"
          >
            {{ isSaving ? '删除中...' : '删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ChevronRight,
  Pencil,
  Trash2,
  AlertTriangle,
  Link,
  CheckCircle,
  XCircle,
  History,
} from 'lucide-vue-next';
import { useGovernance } from '../composables/useGovernance';
import { usePerformanceMonitor } from '../composables/use-performance-monitor';
import { RuleStatusBadge, CodeSnippetView } from '@dailyuse/ui-vue-shadcn';

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
const { trackDetail } = usePerformanceMonitor();

const showDeleteDialog = ref(false);
const showRevisions = ref(false);

async function loadRule(id: string) {
  await trackDetail(async () => {
    await fetchRule(id);
    if (currentRule.value) {
      await fetchRevisions(id);
    }
  });
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

function revisionDotColor(changeType: string): string {
  switch (changeType) {
    case 'Created': return 'bg-green-500';
    case 'Updated': return 'bg-blue-500';
    case 'Deprecated': return 'bg-yellow-500';
    case 'Reactivated': return 'bg-primary';
    default: return 'bg-muted-foreground';
  }
}

function revisionBadgeClasses(changeType: string): string {
  switch (changeType) {
    case 'Created': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'Updated': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'Deprecated': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'Reactivated': return 'bg-primary/10 text-primary';
    default: return 'bg-muted text-muted-foreground';
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
