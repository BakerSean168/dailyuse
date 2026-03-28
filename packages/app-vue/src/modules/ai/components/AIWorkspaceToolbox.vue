<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" class="h-9 rounded-xl">
          <WandSparkles class="mr-2 h-4 w-4" />
          {{ t('aiAssistant.chatPage.workspaceToolsButton') }}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-64">
        <DropdownMenuItem :disabled="!canUseGoalAutomation" @click="openAutomationDialogPanel">
          <Sparkles class="mr-2 h-4 w-4" />
          {{ t('aiAssistant.actions.automateGoalSetup') }}
        </DropdownMenuItem>
        <DropdownMenuItem :disabled="!canUseKnowledgeExpansion" @click="openKnowledgeExpansionDialogPanel">
          <NotebookPen class="mr-2 h-4 w-4" />
          {{ t('aiAssistant.actions.expandDraft') }}
        </DropdownMenuItem>
        <DropdownMenuItem :disabled="!canUseKnowledgeQuery" @click="openKnowledgeDialogPanel">
          <Search class="mr-2 h-4 w-4" />
          {{ t('aiAssistant.actions.askKnowledge') }}
        </DropdownMenuItem>
        <DropdownMenuItem :disabled="!canUseAnalyticsQuery" @click="openAnalyticsDialogPanel">
          <BarChart3 class="mr-2 h-4 w-4" />
          {{ t('aiAssistant.actions.askAnalytics') }}
        </DropdownMenuItem>
        <DropdownMenuItem :disabled="!canUseEvaluationReports" @click="handleOpenEvaluationDialog">
          <ClipboardCheck class="mr-2 h-4 w-4" />
          {{ t('aiAssistant.actions.viewQualityReports') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog :open="openAutomationDialog" @update:open="openAutomationDialog = $event">
      <DialogContent class="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{{ t('aiAssistant.dialogs.automation.title') }}</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div class="space-y-3">
            <Textarea v-model="automationIdea" class="min-h-44" :placeholder="t('aiAssistant.dialogs.automation.placeholder')" />
            <Button class="w-full" :disabled="automationLoading || automationIdea.trim().length < 10 || !canUseGoalAutomation" @click="handlePlanAutomation">
              {{ automationLoading ? t('aiAssistant.dialogs.automation.planning') : t('aiAssistant.dialogs.automation.planAutomation') }}
            </Button>
            <Button
              v-if="automationResult?.requiresConfirmation && !automationResult.executedActions?.length"
              class="w-full"
              variant="outline"
              :disabled="automationExecuting"
              @click="handleExecuteAutomation"
            >
              {{ automationExecuting ? t('aiAssistant.dialogs.automation.executing') : t('aiAssistant.dialogs.automation.confirmAndExecute') }}
            </Button>
            <Button v-if="automatedGoalId" class="w-full" variant="outline" @click="openAutomatedGoal">
              {{ t('aiAssistant.dialogs.automation.openCreatedGoal') }}
            </Button>
          </div>

          <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
            <div v-if="automationResult" class="space-y-4">
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">{{ t('aiAssistant.dialogs.automation.summary') }}</p>
                <p class="mt-2 text-sm leading-6">{{ automationResult.summary }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">{{ t('aiAssistant.dialogs.automation.goal') }}</p>
                <p class="mt-2 text-sm font-medium">{{ automationResult.plan.goal.title }}</p>
                <p class="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{{ automationResult.plan.goal.description }}</p>
              </div>
              <div v-if="automationResult.actions.length">
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">{{ t('aiAssistant.dialogs.automation.actions') }}</p>
                <div class="mt-2 space-y-2">
                  <div v-for="(action, index) in automationResult.actions" :key="`${action.tool}-${index}`" class="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p class="text-sm font-medium">{{ formatAutomationTool(action.tool) }}</p>
                    <p v-if="action.rationale" class="mt-1 text-xs text-muted-foreground">{{ action.rationale }}</p>
                  </div>
                </div>
              </div>
              <div v-if="automationResult.executedActions?.length">
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">{{ t('aiAssistant.dialogs.automation.executionResult') }}</p>
                <div class="mt-2 space-y-2">
                  <div v-for="(action, index) in automationResult.executedActions" :key="`${action.tool}-${action.status}-${index}`" class="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p class="text-sm font-medium">{{ formatAutomationTool(action.tool) }} · {{ formatActionStatus(action.status) }}</p>
                    <p class="mt-1 text-xs text-muted-foreground">{{ action.message }}</p>
                  </div>
                </div>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ automationResult.processingTimeMs }} ms ·
                {{ automationResult.requiresConfirmation && !automationResult.executedActions?.length ? t('aiAssistant.dialogs.automation.awaitingConfirmation') : t('aiAssistant.dialogs.automation.executionRecorded') }}
              </p>
            </div>
            <div v-else class="flex min-h-[22rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
              {{ t('aiAssistant.dialogs.automation.emptyState') }}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog :open="openKnowledgeExpansionDialog" @update:open="openKnowledgeExpansionDialog = $event">
      <DialogContent class="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{{ t('aiAssistant.dialogs.knowledgeExpansion.title') }}</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div class="space-y-3">
            <Input v-model="knowledgeExpansionTitle" :placeholder="t('aiAssistant.dialogs.knowledgeExpansion.optionalDraftTitle')" />
            <Textarea v-model="knowledgeExpansionInstruction" class="min-h-28" :placeholder="t('aiAssistant.dialogs.knowledgeExpansion.instructionPlaceholder')" />
            <Textarea v-model="knowledgeExpansionDraft" class="min-h-56" :placeholder="t('aiAssistant.dialogs.knowledgeExpansion.draftPlaceholder')" />
            <Button class="w-full" :disabled="knowledgeExpansionLoading || knowledgeExpansionInstruction.trim().length < 3 || !canUseKnowledgeExpansion" @click="handleExpandKnowledge">
              {{ knowledgeExpansionLoading ? t('aiAssistant.dialogs.knowledgeExpansion.expanding') : t('aiAssistant.dialogs.knowledgeExpansion.expand') }}
            </Button>
            <Button class="w-full" variant="outline" :disabled="!knowledgeExpansionResult" @click="copyExpandedKnowledge">
              {{ t('aiAssistant.dialogs.knowledgeExpansion.copyExpandedDraft') }}
            </Button>
            <Button class="w-full" variant="outline" :disabled="knowledgeExpansionSaving || !knowledgeExpansionResult" @click="saveExpandedKnowledge">
              {{ knowledgeExpansionSaving ? t('aiAssistant.dialogs.knowledgeExpansion.saving') : t('aiAssistant.dialogs.knowledgeExpansion.saveExpandedDraft') }}
            </Button>
            <p class="text-xs text-muted-foreground">{{ t('aiAssistant.dialogs.knowledgeExpansion.saveHint') }}</p>
          </div>

          <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
            <div v-if="knowledgeExpansionResult" class="space-y-4">
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">{{ t('aiAssistant.dialogs.knowledgeExpansion.expandedDraft') }}</p>
                <p class="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{{ knowledgeExpansionResult.expandedContent }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">{{ t('aiAssistant.dialogs.knowledgeExpansion.citations') }}</p>
                <div class="mt-2 space-y-2">
                  <button v-for="citation in knowledgeExpansionResult.citations" :key="`${citation.resourcePath}-${citation.chunkIndex}`" class="w-full rounded-xl border border-border/60 bg-muted/20 p-3 text-left hover:bg-muted/35" @click="openCitationResource(citation.resourcePath)">
                    <p class="text-sm font-medium">{{ citation.title || citation.resourcePath }}</p>
                    <p class="mt-1 text-xs text-muted-foreground">{{ citation.resourcePath }}</p>
                    <p class="mt-2 line-clamp-3 text-sm text-muted-foreground">{{ citation.excerpt }}</p>
                  </button>
                </div>
              </div>
              <div v-if="knowledgeExpansionSavedDraft" class="rounded-xl border border-emerald-300/60 bg-emerald-50/80 p-3">
                <p class="text-xs uppercase tracking-[0.18em] text-emerald-900">{{ t('aiAssistant.dialogs.knowledgeExpansion.savedDraft') }}</p>
                <p class="mt-1 text-sm font-medium text-emerald-950">{{ knowledgeExpansionSavedDraft.path || knowledgeExpansionSavedDraft.name }}</p>
                <Button class="mt-3 w-full" variant="outline" @click="openExpandedKnowledgeDraft">
                  {{ t('aiAssistant.dialogs.knowledgeExpansion.openSavedDraft') }}
                </Button>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ t('aiAssistant.dialogs.knowledgeExpansion.matchedResources', { count: knowledgeExpansionResult.matchedResourceCount, ms: knowledgeExpansionResult.processingTimeMs }) }}
              </p>
            </div>
            <div v-else class="flex min-h-[26rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
              {{ t('aiAssistant.dialogs.knowledgeExpansion.emptyState') }}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog :open="openKnowledgeDialog" @update:open="openKnowledgeDialog = $event">
      <DialogContent class="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{{ t('aiAssistant.dialogs.knowledge.title') }}</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div class="space-y-3">
            <Textarea v-model="knowledgeQuestion" class="min-h-44" :placeholder="t('aiAssistant.dialogs.knowledge.placeholder')" />
            <Button class="w-full" :disabled="knowledgeLoading || knowledgeQuestion.trim().length < 3 || !canUseKnowledgeQuery" @click="handleQueryKnowledge">
              {{ knowledgeLoading ? t('aiAssistant.dialogs.knowledge.searching') : t('aiAssistant.dialogs.knowledge.ask') }}
            </Button>
            <Button class="w-full" variant="outline" :disabled="reindexLoading || !canUseKnowledgeReindex" @click="handleReindexKnowledge">
              {{ reindexLoading ? t('aiAssistant.dialogs.knowledge.reindexing') : t('aiAssistant.dialogs.knowledge.refreshIndex') }}
            </Button>
            <p v-if="reindexSummary" class="text-xs text-muted-foreground">{{ reindexSummary }}</p>
          </div>

          <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
            <div v-if="knowledgeResult" class="space-y-4">
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">{{ t('aiAssistant.dialogs.knowledge.answer') }}</p>
                <p class="mt-2 whitespace-pre-wrap text-sm leading-6">{{ knowledgeResult.answer }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">{{ t('aiAssistant.dialogs.knowledge.citations') }}</p>
                <div class="mt-2 space-y-2">
                  <button v-for="citation in knowledgeResult.citations" :key="`${citation.resourcePath}-${citation.chunkIndex}`" class="w-full rounded-xl border border-border/60 bg-muted/20 p-3 text-left hover:bg-muted/35" @click="openCitationResource(citation.resourcePath)">
                    <p class="text-sm font-medium">{{ citation.title || citation.resourcePath }}</p>
                    <p class="mt-1 text-xs text-muted-foreground">{{ citation.resourcePath }}</p>
                    <p class="mt-2 line-clamp-3 text-sm text-muted-foreground">{{ citation.excerpt }}</p>
                  </button>
                </div>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ t('aiAssistant.dialogs.knowledge.matchedResources', { count: knowledgeResult.matchedResourceCount, ms: knowledgeResult.processingTimeMs }) }}
              </p>
            </div>
            <div v-else class="flex min-h-[22rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
              {{ t('aiAssistant.dialogs.knowledge.emptyState') }}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog :open="openAnalyticsDialog" @update:open="openAnalyticsDialog = $event">
      <DialogContent class="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{{ t('aiAssistant.dialogs.analytics.title') }}</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div class="space-y-3">
            <Textarea v-model="analyticsQuestion" class="min-h-44" :placeholder="t('aiAssistant.dialogs.analytics.placeholder')" />
            <Button class="w-full" :disabled="analyticsLoading || analyticsQuestion.trim().length < 3 || !canUseAnalyticsQuery" @click="handleQueryAnalytics">
              {{ analyticsLoading ? t('aiAssistant.dialogs.analytics.analyzing') : t('aiAssistant.dialogs.analytics.ask') }}
            </Button>
          </div>

          <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
            <div v-if="analyticsResult" class="space-y-4">
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">{{ t('aiAssistant.dialogs.analytics.answer') }}</p>
                <p class="mt-2 whitespace-pre-wrap text-sm leading-6">{{ analyticsResult.answer }}</p>
              </div>
              <div v-if="analyticsResult.highlights.length">
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">{{ t('aiAssistant.dialogs.analytics.highlights') }}</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span v-for="highlight in analyticsResult.highlights" :key="highlight" class="rounded-full border border-border/60 bg-muted/25 px-3 py-1 text-xs">
                    {{ highlight }}
                  </span>
                </div>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ t('aiAssistant.dialogs.analytics.generatedIn', { ms: analyticsResult.processingTimeMs }) }}
              </p>
            </div>
            <div v-else class="flex min-h-[22rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
              {{ t('aiAssistant.dialogs.analytics.emptyState') }}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <AIEvaluationOverviewDialog
      :open="openEvaluationDialog"
      :loading="evaluationLoading"
      :overview="evaluationOverview"
      @refresh="loadEvaluationOverview"
      @update:open="openEvaluationDialog = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { BarChart3, ClipboardCheck, NotebookPen, Search, Sparkles, WandSparkles } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Textarea,
} from '@dailyuse/ui-vue-shadcn';
import { useAI } from '../composables/useAI';
import { useRepository } from '../../repository/composables/useRepository';
import { useEditorWorkspaceActions } from '../../editor/composables';
import AIEvaluationOverviewDialog from './AIEvaluationOverviewDialog.vue';
import type {
  EvaluationOverview,
  GoalAutomationResult,
  KnowledgeExpansionResult,
  KnowledgeQueryResult,
  SavedDraftSummary,
} from './ai-workspace-tool.types';

type AICapabilities = {
  runtimeMode: 'direct-provider' | 'remote-ai-service';
  supportsKnowledgeQuery: boolean;
  supportsKnowledgeReindex: boolean;
  supportsAnalyticsQuery: boolean;
  supportsGoalAutomation: boolean;
  supportsEvaluationReports: boolean;
};

interface Props {
  selectedProviderId?: string | null;
}

const props = defineProps<Props>();

const { service, capabilities, hasProviders, loadProviders, loadCapabilities, expandKnowledge } = useAI();
const { resources, fetchResources, initRepository, createMarkdownNote } = useRepository();
const { requestOpenResource } = useEditorWorkspaceActions();
const router = useRouter();
const { t } = useI18n();

const openAutomationDialog = ref(false);
const openKnowledgeExpansionDialog = ref(false);
const openKnowledgeDialog = ref(false);
const openAnalyticsDialog = ref(false);
const openEvaluationDialog = ref(false);
const automationIdea = ref('');
const automationLoading = ref(false);
const automationExecuting = ref(false);
const automationResult = ref<GoalAutomationResult | null>(null);
const knowledgeExpansionTitle = ref('');
const knowledgeExpansionInstruction = ref('');
const knowledgeExpansionDraft = ref('');
const knowledgeExpansionLoading = ref(false);
const knowledgeExpansionSaving = ref(false);
const knowledgeExpansionSavedDraft = ref<SavedDraftSummary | null>(null);
const knowledgeExpansionResult = ref<KnowledgeExpansionResult | null>(null);
const knowledgeQuestion = ref('');
const knowledgeLoading = ref(false);
const reindexLoading = ref(false);
const reindexSummary = ref('');
const knowledgeResult = ref<KnowledgeQueryResult | null>(null);
const analyticsQuestion = ref('');
const analyticsLoading = ref(false);
const analyticsResult = ref<{ answer: string; highlights: string[]; processingTimeMs: number } | null>(null);
const evaluationLoading = ref(false);
const evaluationOverview = ref<EvaluationOverview | null>(null);

const capabilityState = computed(() => (capabilities.value as AICapabilities | null) ?? null);
const canUseGoalAutomation = computed(() => hasProviders.value && Boolean(capabilityState.value?.supportsGoalAutomation));
const canUseKnowledgeQuery = computed(() => hasProviders.value && Boolean(capabilityState.value?.supportsKnowledgeQuery));
const canUseKnowledgeExpansion = computed(() => canUseKnowledgeQuery.value);
const canUseKnowledgeReindex = computed(() => Boolean(capabilityState.value?.supportsKnowledgeReindex));
const canUseAnalyticsQuery = computed(() => hasProviders.value && Boolean(capabilityState.value?.supportsAnalyticsQuery));
const canUseEvaluationReports = computed(() => Boolean(capabilityState.value?.supportsEvaluationReports));
const automatedGoalId = computed(() => automationResult.value?.executedActions?.find((action) => action.tool === 'create_goal')?.entityId ?? '');

onMounted(() => {
  void loadProviders();
  void loadCapabilities();
  void initRepository();
});

function withSelectedProviderId<T extends Record<string, unknown>>(payload: T): T {
  if (!props.selectedProviderId) return payload;
  return { ...payload, providerId: props.selectedProviderId };
}

async function ensureAIContext(options?: { providers?: boolean; capabilities?: boolean }) {
  try {
    const tasks: Promise<unknown>[] = [];
    if (options?.providers !== false) tasks.push(loadProviders());
    if (options?.capabilities !== false) tasks.push(loadCapabilities());
    await Promise.all(tasks);
    return true;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('common.operationFailed'));
    return false;
  }
}

async function openAutomationDialogPanel() {
  if (!(await ensureAIContext())) return;
  openAutomationDialog.value = true;
}

async function openKnowledgeExpansionDialogPanel() {
  if (!(await ensureAIContext())) return;
  openKnowledgeExpansionDialog.value = true;
}

async function openKnowledgeDialogPanel() {
  if (!(await ensureAIContext())) return;
  openKnowledgeDialog.value = true;
}

async function openAnalyticsDialogPanel() {
  if (!(await ensureAIContext())) return;
  openAnalyticsDialog.value = true;
}

async function handleOpenEvaluationDialog() {
  if (!(await ensureAIContext({ providers: false, capabilities: true }))) return;
  openEvaluationDialog.value = true;
  await loadEvaluationOverview();
}

async function handlePlanAutomation() {
  automationLoading.value = true;
  try {
    automationResult.value = (await service.automateGoal(withSelectedProviderId({
      idea: automationIdea.value.trim(),
      includeKeyResults: true,
      includeTaskTemplates: true,
      confirm: false,
    }))) as GoalAutomationResult;
    toast.success(t('aiAssistant.dialogs.automation.planReady'));
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('aiAssistant.dialogs.automation.planFailed'));
  } finally {
    automationLoading.value = false;
  }
}

async function handleExecuteAutomation() {
  if (!automationResult.value) return;
  automationExecuting.value = true;
  try {
    automationResult.value = (await service.automateGoal(withSelectedProviderId({
      idea: automationIdea.value.trim(),
      includeKeyResults: true,
      includeTaskTemplates: true,
      confirm: true,
      approvedSummary: automationResult.value.summary,
      approvedPlan: automationResult.value.plan,
      approvedActions: automationResult.value.actions,
    }))) as GoalAutomationResult;
    toast.success(t('aiAssistant.dialogs.automation.executed'));
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('aiAssistant.dialogs.automation.executeFailed'));
  } finally {
    automationExecuting.value = false;
  }
}

async function handleExpandKnowledge() {
  knowledgeExpansionLoading.value = true;
  knowledgeExpansionSavedDraft.value = null;
  try {
    const currentContent = knowledgeExpansionDraft.value.trim();
    knowledgeExpansionResult.value = (await expandKnowledge(withSelectedProviderId({
      instruction: knowledgeExpansionInstruction.value.trim(),
      maxResources: 8,
      maxCitations: 4,
      ...(currentContent ? { currentContent } : {}),
    }))) as KnowledgeExpansionResult;
    toast.success(t('aiAssistant.dialogs.knowledgeExpansion.expanded'));
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('aiAssistant.dialogs.knowledgeExpansion.expandFailed'));
  } finally {
    knowledgeExpansionLoading.value = false;
  }
}

async function handleQueryKnowledge() {
  knowledgeLoading.value = true;
  try {
    knowledgeResult.value = (await service.queryKnowledge(withSelectedProviderId({
      query: knowledgeQuestion.value.trim(),
      maxResources: 8,
    }))) as KnowledgeQueryResult;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('aiAssistant.dialogs.knowledge.queryFailed'));
  } finally {
    knowledgeLoading.value = false;
  }
}

async function handleReindexKnowledge() {
  reindexLoading.value = true;
  reindexSummary.value = '';
  try {
    const result = (await service.reindexKnowledge({ limit: 200, force: true })) as {
      indexedCount: number;
      reusedCount: number;
      failedCount: number;
    };
    reindexSummary.value = t('aiAssistant.dialogs.knowledge.reindexSummary', result);
    toast.success(t('aiAssistant.dialogs.knowledge.refreshed'));
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('aiAssistant.dialogs.knowledge.refreshFailed'));
  } finally {
    reindexLoading.value = false;
  }
}

async function copyExpandedKnowledge() {
  if (!knowledgeExpansionResult.value?.expandedContent) return;
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    toast.error(t('aiAssistant.dialogs.knowledgeExpansion.clipboardUnavailable'));
    return;
  }
  await navigator.clipboard.writeText(knowledgeExpansionResult.value.expandedContent);
  toast.success(t('aiAssistant.dialogs.knowledgeExpansion.copied'));
}

async function saveExpandedKnowledge() {
  if (!knowledgeExpansionResult.value?.expandedContent) return;
  knowledgeExpansionSaving.value = true;
  try {
    const created = await createMarkdownNote(
      resolveKnowledgeExpansionDraftName(),
      knowledgeExpansionResult.value.expandedContent,
    );
    if (!created) {
      toast.error(t('aiAssistant.dialogs.knowledgeExpansion.saveFailed'));
      return;
    }
    knowledgeExpansionSavedDraft.value = { id: created.id, name: created.name, path: created.path };
    await fetchResources();
    toast.success(t('aiAssistant.dialogs.knowledgeExpansion.saved'));
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('aiAssistant.dialogs.knowledgeExpansion.saveFailed'));
  } finally {
    knowledgeExpansionSaving.value = false;
  }
}

async function handleQueryAnalytics() {
  analyticsLoading.value = true;
  try {
    analyticsResult.value = (await service.queryAnalytics(withSelectedProviderId({
      query: analyticsQuestion.value.trim(),
    }))) as typeof analyticsResult.value;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('aiAssistant.dialogs.analytics.queryFailed'));
  } finally {
    analyticsLoading.value = false;
  }
}

async function loadEvaluationOverview() {
  evaluationLoading.value = true;
  try {
    evaluationOverview.value = (await service.getEvaluationOverview({ historyLimit: 5 })) as EvaluationOverview;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('aiAssistant.dialogs.evaluation.empty'));
  } finally {
    evaluationLoading.value = false;
  }
}

async function openAutomatedGoal() {
  if (!automatedGoalId.value) return;
  openAutomationDialog.value = false;
  await router.push(`/goals/${automatedGoalId.value}`);
}

async function openCitationResource(resourcePath: string) {
  if (!resources.value.length) await fetchResources();
  const target = resources.value.find((item) => item.path === resourcePath);
  if (target) {
    await requestOpenResource(target.id);
    openKnowledgeDialog.value = false;
    openKnowledgeExpansionDialog.value = false;
  }
  await router.push('/repository');
}

async function openExpandedKnowledgeDraft() {
  if (!knowledgeExpansionSavedDraft.value?.id) return;
  await requestOpenResource(knowledgeExpansionSavedDraft.value.id);
  openKnowledgeExpansionDialog.value = false;
  await router.push('/repository');
}

function formatAutomationTool(tool: GoalAutomationResult['actions'][number]['tool']) {
  const labels: Record<GoalAutomationResult['actions'][number]['tool'], string> = {
    create_goal: t('aiAssistant.dialogs.automation.toolLabels.createGoal'),
    create_key_result: t('aiAssistant.dialogs.automation.toolLabels.createKeyResult'),
    create_task_template: t('aiAssistant.dialogs.automation.toolLabels.createTaskTemplate'),
    search_notes: t('aiAssistant.dialogs.automation.toolLabels.searchNotes'),
    fetch_stats: t('aiAssistant.dialogs.automation.toolLabels.fetchStats'),
  };
  return labels[tool];
}

function formatActionStatus(status: NonNullable<GoalAutomationResult['executedActions']>[number]['status']) {
  const labels = {
    executed: t('aiAssistant.dialogs.automation.statusLabels.executed'),
    skipped: t('aiAssistant.dialogs.automation.statusLabels.skipped'),
    failed: t('aiAssistant.dialogs.automation.statusLabels.failed'),
  } as const;
  return labels[status];
}

function resolveKnowledgeExpansionDraftName(): string {
  const explicitTitle = knowledgeExpansionTitle.value.trim();
  if (explicitTitle.length > 0) return explicitTitle;
  const headingMatch = knowledgeExpansionResult.value?.expandedContent.match(/^#\s+(.+)$/m);
  if (headingMatch?.[1]) return headingMatch[1].trim();
  return `${t('aiAssistant.dialogs.knowledgeExpansion.defaultDraftName')} ${new Date().toISOString().slice(0, 10)}`;
}
</script>
