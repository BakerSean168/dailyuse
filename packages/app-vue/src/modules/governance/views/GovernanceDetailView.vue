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

    <template v-if="displayRule">
      <!-- Breadcrumb & Actions -->
      <div class="flex items-center justify-between mb-6">
        <nav class="flex items-center gap-1 text-sm text-muted-foreground">
          <router-link
            :to="{ name: 'governance-list' }"
            class="hover:text-foreground transition-colors"
          >
            {{ t('governance.detail.breadcrumbRules') }}
          </router-link>
          <ChevronRight :size="14" />
          <span class="text-foreground">{{ displayRule.code }}</span>
        </nav>

        <div class="flex items-center gap-2">
          <router-link
            :to="{ name: 'governance-history', params: { id: displayRule.id } }"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm hover:bg-muted transition-colors"
          >
            <History :size="14" />
            {{ t('governance.detail.history') }}
          </router-link>
          <router-link
            :to="{ name: 'governance-editor-edit', params: { id: displayRule.id } }"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm hover:bg-muted transition-colors"
          >
            <Pencil :size="14" />
            {{ t('governance.detail.edit') }}
          </router-link>
          <button
            class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-destructive/30 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
            @click="confirmDelete"
          >
            <Trash2 :size="14" />
            {{ t('governance.detail.delete') }}
          </button>
        </div>
      </div>

      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
          <h1 class="text-2xl font-bold">{{ displayRule.title }}</h1>
          <RuleStatusBadge :status="displayRule.status" />
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
            :class="
              displayRule.severity === 'Mandatory'
                ? 'bg-destructive/15 text-destructive dark:bg-destructive/30 dark:text-destructive'
                : 'bg-info/15 text-info dark:bg-info/30 dark:text-info'
            "
          >
            {{
              displayRule.severity === 'Mandatory'
                ? t('governance.detail.severityMandatory')
                : t('governance.detail.severityRecommended')
            }}
          </span>
        </div>

        <div class="flex items-center gap-1.5 mb-2 flex-wrap">
          <span
            v-for="tag in displayRule.tags"
            :key="tag.value"
            class="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-info/15 text-info dark:bg-info/30 dark:text-info"
          >
            {{ tag.value }}
          </span>
        </div>

        <p class="text-xs text-muted-foreground">
          {{ t('governance.detail.codePrefix') }}: {{ displayRule.code }} ·
          {{ t('governance.detail.updatedAt') }} {{ formatDate(displayRule.updatedAt) }}
        </p>
      </div>

      <!-- Deprecation Warning -->
      <div
        v-if="displayRule.status === 'Deprecated'"
        class="flex items-start gap-3 p-4 rounded-md bg-warning/10 dark:bg-warning/20 border border-warning/40 dark:border-warning/50 mb-6"
      >
        <AlertTriangle :size="20" class="text-warning dark:text-warning shrink-0 mt-0.5" />
        <div>
          <h3 class="font-medium text-warning dark:text-yellow-300">
            {{ t('governance.detail.deprecatedWarning') }}
          </h3>
          <p
            v-if="displayRule.deprecationReason"
            class="text-sm text-warning dark:text-warning mt-1"
          >
            {{ displayRule.deprecationReason }}
          </p>
          <p v-if="displayRule.replacementRuleId" class="text-sm mt-1">
            {{ t('governance.detail.replacementRule') }}
            <router-link
              :to="{ name: 'governance-detail', params: { id: displayRule.replacementRuleId } }"
              class="text-primary hover:underline"
            >
              {{ t('governance.detail.viewReplacement') }}
            </router-link>
          </p>
        </div>
      </div>

      <!-- Description -->
      <div class="border rounded-lg mb-6">
        <div class="px-4 py-3 border-b bg-muted/30">
          <h2 class="text-sm font-medium">{{ t('governance.detail.description') }}</h2>
        </div>
        <div class="p-4">
          <div class="text-sm whitespace-pre-wrap leading-7">{{ displayRule.description }}</div>
        </div>
      </div>

      <!-- Live Reference -->
      <div v-if="displayRule.liveReferenceLocation" class="border rounded-lg mb-6">
        <div class="px-4 py-3 border-b bg-muted/30">
          <h2 class="text-sm font-medium flex items-center gap-1.5">
            <Link :size="14" />
            {{ t('governance.detail.liveReference') }}
          </h2>
        </div>
        <div class="p-4">
          <code class="text-sm text-primary bg-primary/5 px-2 py-1 rounded">
            {{ displayRule.liveReferenceLocation }}
          </code>
        </div>
      </div>

      <!-- Good Examples -->
      <div v-if="displayRule.goodExamples.length > 0" class="mb-6">
        <h2 class="text-sm font-medium mb-3 flex items-center gap-1.5">
          <CheckCircle :size="16" class="text-success" />
          {{ t('governance.detail.goodExamples', { count: displayRule.goodExamples.length }) }}
        </h2>
        <div class="space-y-3">
          <CodeSnippetView
            v-for="(snippet, index) in displayRule.goodExamples"
            :key="`good-${index}`"
            :snippet="snippet"
          />
        </div>
      </div>

      <!-- Bad Examples -->
      <div v-if="displayRule.badExamples.length > 0" class="mb-6">
        <h2 class="text-sm font-medium mb-3 flex items-center gap-1.5">
          <XCircle :size="16" class="text-destructive" />
          {{ t('governance.detail.badExamples', { count: displayRule.badExamples.length }) }}
        </h2>
        <div class="space-y-3">
          <CodeSnippetView
            v-for="(snippet, index) in displayRule.badExamples"
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
            {{ t('governance.detail.revisionHistory', { count: revisions.length }) }}
          </span>
          <ChevronRight
            :size="16"
            :class="{ 'rotate-90': showRevisions }"
            class="transition-transform"
          />
        </button>
        <div v-if="showRevisions" class="p-4 border-t">
          <div v-if="revisions.length > 0" class="space-y-4">
            <div v-for="rev in revisions" :key="rev.id" class="flex gap-3 relative pl-6">
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
                  {{ t('governance.detail.changedFields') }}
                  {{ rev.changedFields.join(', ') || t('governance.detail.initialCreation') }}
                </p>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground">
            {{ t('governance.detail.noRevisions') }}
          </p>
        </div>
      </div>
    </template>

    <!-- Delete Confirmation Dialog -->
    <div v-if="showDeleteDialog" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="fixed inset-0 bg-black/50" @click="showDeleteDialog = false"></div>
      <div class="relative bg-background rounded-lg shadow-lg w-full max-w-[400px] p-6 z-10">
        <h3 class="text-lg font-semibold mb-2">{{ t('governance.detail.confirmDeleteTitle') }}</h3>
        <p class="text-sm text-muted-foreground mb-6">
          {{ t('governance.detail.confirmDeleteMsg', { title: displayRule?.title }) }}
        </p>
        <div class="flex justify-end gap-2">
          <button
            class="px-4 py-2 rounded-md border text-sm hover:bg-muted transition-colors"
            @click="showDeleteDialog = false"
          >
            {{ t('governance.detail.cancel') }}
          </button>
          <button
            class="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            :disabled="isSaving"
            @click="handleDelete"
          >
            {{ isSaving ? t('governance.detail.deleting') : t('governance.detail.delete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
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
import { usePerformanceMonitor } from '../composables/usePerformanceMonitor';
import { RuleStatusBadge, CodeSnippetView } from '../components';

const props = defineProps<{
  id: string;
}>();

const router = useRouter();
const { t, locale } = useI18n();
const {
  currentRule,
  currentRuleEntity,
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
const displayRule = computed(() => currentRuleEntity.value ?? currentRule.value);

async function loadRule(id: string) {
  await trackDetail(async () => {
    await fetchRule(id);
    if (displayRule.value) {
      await fetchRevisions(id);
    }
  });
}

function confirmDelete() {
  showDeleteDialog.value = true;
}

async function handleDelete() {
  if (!displayRule.value) return;
  const success = await deleteRule(displayRule.value.id);
  if (success) {
    showDeleteDialog.value = false;
    router.push({ name: 'governance-list' });
  }
}

function formatDate(dateValue: Date | string | number): string {
  return new Date(dateValue).toLocaleString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function revisionDotColor(changeType: string): string {
  switch (changeType) {
    case 'Created':
      return 'bg-success';
    case 'Updated':
      return 'bg-info';
    case 'Deprecated':
      return 'bg-warning';
    case 'Reactivated':
      return 'bg-primary';
    default:
      return 'bg-muted-foreground';
  }
}

function revisionBadgeClasses(changeType: string): string {
  switch (changeType) {
    case 'Created':
      return 'bg-success/15 text-success dark:bg-success/30 dark:text-success';
    case 'Updated':
      return 'bg-info/15 text-info dark:bg-info/30 dark:text-info';
    case 'Deprecated':
      return 'bg-warning/15 text-warning dark:bg-warning/30 dark:text-warning';
    case 'Reactivated':
      return 'bg-primary/10 text-primary';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function revisionLabel(changeType: string): string {
  switch (changeType) {
    case 'Created':
      return t('governance.detail.revisionCreated');
    case 'Updated':
      return t('governance.detail.revisionUpdated');
    case 'Deprecated':
      return t('governance.detail.revisionDeprecated');
    case 'Reactivated':
      return t('governance.detail.revisionReactivated');
    default:
      return changeType;
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
