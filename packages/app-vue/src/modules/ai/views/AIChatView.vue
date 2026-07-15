<template>
  <div
    class="flex min-h-0 overflow-hidden bg-background"
    :class="composerOnly ? 'h-auto' : 'h-full'"
    data-testid="ai-chat-view"
  >
    <AIConversationSidebar
      v-if="!hideConversationSidebar && !composerOnly"
      :conversations="conversationList"
      :agent-runs="agentRunList"
      :recent-goals="recentGoalList"
      :recent-knowledge-notes="recentKnowledgeNoteList"
      :active-conversation-id="chatConversationId"
      :loading="conversationListLoading"
      :agent-runs-loading="agentRunListLoading"
      @new-conversation="startNewConversation()"
      @refresh="loadConversationList"
      @open-settings="openSettings"
      @select="selectConversation"
      @select-agent-run="selectAgentRun"
      @select-goal="openRecentGoal"
      @select-knowledge-note="openRecentKnowledgeNote"
      @delete="deleteConversation"
    />

    <div
      v-if="mobileSidebarOpen"
      class="fixed inset-0 z-50 md:hidden"
      data-testid="ai-mobile-sidebar-panel"
    >
      <button
        type="button"
        class="absolute inset-0 bg-background/80 backdrop-blur-sm"
        :aria-label="t('aiAssistant.chatPage.sidebar.close')"
        data-testid="ai-mobile-sidebar-backdrop"
        @click="closeMobileSidebar"
      />
      <div class="relative h-full w-[min(22rem,calc(100vw-3rem))] border-r bg-sidebar shadow-xl">
        <AIConversationSidebar
          variant="mobile"
          show-close
          :conversations="conversationList"
          :agent-runs="agentRunList"
          :recent-goals="recentGoalList"
          :recent-knowledge-notes="recentKnowledgeNoteList"
          :active-conversation-id="chatConversationId"
          :loading="conversationListLoading"
          :agent-runs-loading="agentRunListLoading"
          @new-conversation="startNewConversationFromMobile"
          @refresh="loadConversationList"
          @open-settings="openSettingsFromMobile"
          @close="closeMobileSidebar"
          @select="selectConversationFromMobile"
          @select-agent-run="selectAgentRunFromMobile"
          @select-goal="openRecentGoalFromMobile"
          @select-knowledge-note="openRecentKnowledgeNoteFromMobile"
          @delete="deleteConversation"
        />
      </div>
    </div>

    <section class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header v-show="!composerOnly" class="border-b bg-background px-4 py-3 sm:px-6">
        <div class="flex items-center justify-between gap-3">
          <h1 class="truncate text-lg font-medium text-foreground">
            {{ currentConversationLabel }}
          </h1>
          <div class="flex items-center gap-1 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              :aria-label="t('aiAssistant.chatPage.sidebar.open')"
              class="h-8 w-8"
              :title="t('aiAssistant.chatPage.sidebar.open')"
              data-testid="ai-mobile-sidebar-toggle"
              @click="openMobileSidebar"
            >
              <Menu class="h-4 w-4" />
            </Button>
            <Button
              v-if="hasWorkflowContext"
              variant="ghost"
              size="icon"
              :aria-label="
                contextPanelOpen
                  ? t('aiAssistant.chatPage.context.hide')
                  : t('aiAssistant.chatPage.context.show')
              "
              class="h-8 w-8"
              :title="
                contextPanelOpen
                  ? t('aiAssistant.chatPage.context.hide')
                  : t('aiAssistant.chatPage.context.show')
              "
              data-testid="ai-context-panel-toggle"
              @click="toggleContextPanel"
            >
              <PanelRightOpen class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              :aria-label="t('aiAssistant.dialogs.chat.newConversation')"
              class="h-8 w-8"
              :title="t('aiAssistant.dialogs.chat.newConversation')"
              @click="startNewConversation()"
            >
              <Plus class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <AIMessagePanel
        v-show="!composerOnly"
        ref="messagePanelRef"
        :timeline="chatTimeline"
        :tool-mode="toolMode"
        :show-today-overview="todayOverviewVisible"
        :show-workflow-surface="hasWorkflowContext"
        @select-tool="startNewConversation"
        @select-shortcut="handleWelcomeShortcut"
      >
        <template #today-overview>
          <div class="grid gap-3">
            <DailyTodoWidget @view-all="router.push('/tasks')" />
            <UpcomingRemindersWidget :refresh-key="0" @view-all="router.push('/reminders')" />
            <GoalProgressWidget
              :goals="goalProgress"
              :loading="dashboardLoading"
              @view-all="router.push('/goals')"
              @select="(id) => router.push(`/goals/${id}`)"
            />
          </div>
        </template>

        <template #workflow-surface>
          <p
            v-if="workflowStatusText"
            class="rounded-2xl border bg-muted/20 px-4 py-3 text-sm leading-6 text-muted-foreground"
            data-testid="ai-workflow-status-inline"
          >
            {{ workflowStatusText }}
          </p>
        </template>
      </AIMessagePanel>

      <!--
        V2 §6.0: workflow lifecycle buttons sit above the pure-dialogue composer
        (composer-top strip). Kept outside AIFooterComposer so unit specs that stub
        the composer still mount the real action bar (goal-agent-* contracts).
      -->
      <div v-show="!composerOnly" class="px-4 sm:px-6">
        <div class="mx-auto w-full max-w-4xl">
          <AIWorkflowActionBar
            :tool-mode="toolMode"
            :workflow-status-text="workflowStatusText"
            :goal-clarification="goalClarification"
            :automated-goal-id="automatedGoalId"
            :goal-agent-loading="goalAgentLoading"
            :goal-agent-resuming="goalAgentResuming"
            :show-goal-draft-editor="showGoalDraftEditor"
            :can-run-goal-agent="canRunGoalAgent"
            :can-resume-goal-agent-clarification="canResumeGoalAgentClarification"
            :can-continue-goal-agent-execution="canContinueGoalAgentExecution"
            :can-retry-goal-agent-execution="canRetryGoalAgentExecution"
            :goal-agent-waiting-for-clarification="goalAgentWaitingForClarification"
            :goal-agent-waiting-for-approval="goalAgentWaitingForApproval"
            :goal-agent-waiting-for-execution="goalAgentWaitingForExecution"
            :note-agent-run="noteAgentRun"
            :note-summary="noteSummary"
            :note-agent-loading="noteAgentLoading"
            :note-creating="noteCreating"
            :can-run-knowledge-note-agent="canRunKnowledgeNoteAgent"
            :can-retry-knowledge-note-agent-execution="canRetryKnowledgeNoteAgentExecution"
            :knowledge-answer="knowledgeAnswer"
            :knowledge-query-loading="knowledgeQueryLoading"
            :can-ask-knowledge="canAskKnowledge"
            :can-run-workflow-actions="canRunWorkflowActions"
            :can-send-message="canSendMessage"
            :start-goal-agent-run="startGoalAgentRun"
            :submit-goal-agent-clarification="submitGoalAgentClarification"
            :confirm-goal-agent-run="confirmGoalAgentRun"
            :cancel-goal-agent-run="cancelGoalAgentRun"
            :continue-goal-agent-execution="continueGoalAgentExecution"
            :retry-goal-agent-execution="retryGoalAgentExecution"
            :toggle-goal-draft-editor="toggleGoalDraftEditor"
            :open-automated-goal="openAutomatedGoal"
            :start-knowledge-note-agent-run="startKnowledgeNoteAgentRun"
            :create-knowledge-note-from-conversation="createKnowledgeNoteFromConversation"
            :start-knowledge-note-agent-run-from-knowledge-answer="
              startKnowledgeNoteAgentRunFromKnowledgeAnswer
            "
            :retry-knowledge-note-agent-execution="retryKnowledgeNoteAgentExecution"
            :open-created-note="openCreatedNote"
            :ask-knowledge-from-conversation="askKnowledgeFromConversation"
            :exit-tool-mode="exitToolMode"
          />
        </div>
      </div>

      <Teleport v-if="shellComposerMount" :to="shellComposerMount">
        <AIFooterComposer
          ref="composerRef"
          v-model="chatMessage"
          :loading="chatLoading"
          :can-send="canSendMessage"
          :tool-button-label="currentToolButtonLabel"
          :model-groups="modelGroups"
          :selected-model-key="selectedModelKey"
          :density="composerDensity"
          @send="handleSendChat"
          @stop="stopGenerating"
          @start-conversation="startNewConversation"
          @select-model="selectModel"
          @open-settings="openSettings"
        />
      </Teleport>
      <AIFooterComposer
        v-else
        ref="composerRef"
        v-model="chatMessage"
        :loading="chatLoading"
        :can-send="canSendMessage"
        :tool-button-label="currentToolButtonLabel"
        :model-groups="modelGroups"
        :selected-model-key="selectedModelKey"
        :density="composerDensity"
        @send="handleSendChat"
        @stop="stopGenerating"
        @start-conversation="startNewConversation"
        @select-model="selectModel"
        @open-settings="openSettings"
      />
    </section>

    <!--
      Artifact rail: keeps `ai-context-panel` + AIGoalWorkflowPanel contracts for
      state-machine specs (Brief §11). Actions no longer live here (moved above composer).
    -->
    <AIContextPanel
      v-show="!composerOnly"
      :has-workflow-context="hasWorkflowContext"
      :open="contextPanelOpen"
      :tool-label="currentToolLabel"
      @close="closeContextPanel"
    >
      <AIGoalWorkflowPanel
        :tool-mode="toolMode"
        :goal-clarification="goalClarification"
        :goal-draft="goalDraft"
        :goal-automation-result="goalAutomationResult"
        :goal-agent-run="goalAgentRun"
        :goal-agent-pending-actions="goalAgentPendingActions"
        :goal-agent-executed-actions="goalAgentExecutedActions"
        :clarification-answers="clarificationAnswers"
        :editable-goal="editableGoal"
        :editable-key-results="editableKeyResults"
        :editable-task-templates="editableTaskTemplates"
        :editable-reminders="editableReminders"
        :show-goal-draft-editor="showGoalDraftEditor"
        :creating-goal="creatingGoal"
        :goal-executed-actions="goalExecutedActions"
        :goal-execution-summary="goalExecutionSummary"
        :goal-execution-recovery="goalExecutionRecovery"
        :knowledge-answer="knowledgeAnswer"
        :knowledge-qa-agent-run="knowledgeQaAgentRun"
        :note-agent-run="noteAgentRun"
        :note-summary="noteSummary"
        :note-preview="notePreview"
        :format-automation-tool="formatAutomationTool"
        :format-agent-tool="formatAgentTool"
        :format-action-status="formatActionStatus"
        :format-execution-outcome="formatExecutionOutcome"
        @update:clarification-answers="handleClarificationAnswersUpdate"
        @confirm="handleCreateGoalFromDraft"
        @add-key-result="addKeyResultDraft"
        @remove-key-result="removeKeyResultDraft"
        @update-goal="handleUpdateGoalDraft"
        @update-key-result="updateKeyResultDraft"
        @add-task-template="addTaskTemplateDraft"
        @remove-task-template="removeTaskTemplateDraft"
        @update-task-template="updateTaskTemplateDraft"
        @add-reminder="addReminderDraft"
        @remove-reminder="removeReminderDraft"
        @update-reminder="updateReminderDraft"
        @open-knowledge-citation="openKnowledgeCitation"
        @open-created-note="openCreatedNote"
        @start-new-conversation="startNewConversation"
      />
      <div
        v-if="!hasWorkflowArtifact"
        class="rounded-lg border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground"
        data-testid="ai-context-empty-state"
      >
        {{ workflowStatusText }}
      </div>
    </AIContextPanel>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, inject } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Menu, PanelRightOpen, Plus } from '@lucide/vue';
import { Button } from '@dailyuse/ui-vue-shadcn';
import type { AgentRun } from '@dailyuse/contracts/ai';
import AIConversationSidebar from '../components/AIConversationSidebar.vue';
import AIMessagePanel from '../components/AIMessagePanel.vue';
import AIFooterComposer from '../components/AIFooterComposer.vue';
import AIGoalWorkflowPanel from '../components/AIGoalWorkflowPanel.vue';
import AIWorkflowActionBar from '../components/AIWorkflowActionBar.vue';
import AIContextPanel from '../components/AIContextPanel.vue';
import DailyTodoWidget from '../../task/components/widgets/DailyTodoWidget.vue';
import UpcomingRemindersWidget from '../../reminder/components/widgets/UpcomingRemindersWidget.vue';
import GoalProgressWidget from '../../goal/components/widgets/GoalProgressWidget.vue';
import { useDashboard } from '../../dashboard/composables/useDashboard';
import { useAppShellStore } from '../../../layouts/shell/useAppShellStore';
import { SHELL_COMPOSER_DENSITY_KEY, SHELL_COMPOSER_MOUNT_KEY } from '../../../di/keys';
import type { ComposerDensity } from '../../../layouts/shell/panel-geometry';
import { useAIChatView } from '../composables/useAIChatView';
import type { ConversationSummary, WorkflowMode } from '../composables/types';

const { t } = useI18n();
const router = useRouter();

/**
 * V2 shell integration props (UI_REDESIGN_V2_PLAN §2.1).
 *
 * AIChatView is no longer a routed page: the AppShell mounts it once as the
 * persistent AI workspace layer. The shell owns the conversation sidebar
 * (`ConversationSidebar`) and hides the built-in one; in the focus state
 * (STATE C) only the composer strip stays visible ("AI 一句话可达").
 * Both props default to false so the component keeps working standalone
 * (unit specs mount it without the shell).
 */
withDefaults(
  defineProps<{
    hideConversationSidebar?: boolean;
    /**
     * Legacy focus strip mode: hide messages/sidebar and keep only the in-tree
     * composer. When the shell provides SHELL_COMPOSER_MOUNT_KEY, AppShell hides
     * the whole AI column in focus instead and this flag stays false.
     */
    composerOnly?: boolean;
  }>(),
  { hideConversationSidebar: false, composerOnly: false },
);

/** Shell teleport host for GlobalComposer; null in standalone/unit mounts. */
const shellComposerMountRef = inject(SHELL_COMPOSER_MOUNT_KEY, null);
const shellComposerDensityRef = inject(SHELL_COMPOSER_DENSITY_KEY, null);
const shellComposerMount = computed(() => shellComposerMountRef?.value ?? null);
const composerDensity = computed<ComposerDensity>(
  () => shellComposerDensityRef?.value ?? 'comfortable',
);

const messagePanelRef = ref<{ viewport?: HTMLElement | null } | null>(null);
const composerRef = ref<{ composerTextarea?: HTMLTextAreaElement | null } | null>(null);

const {
  session,
  model,
  goalWorkflow,
  noteWorkflow,
  knowledgeQaWorkflow,
  formatters,
  common,
} = useAIChatView({
  getComposerTextarea: () => composerRef.value?.composerTextarea ?? null,
});

const {
  chatMessage,
  chatLoading,
  chatConversationId,
  chatTimeline,
  conversationList,
  conversationListLoading,
  agentRunList,
  agentRunListLoading,
  recentGoalList,
  recentKnowledgeNoteList,
  messagesViewport,
  selectConversation,
  selectAgentRun,
  openRecentGoal,
  openRecentKnowledgeNote,
  deleteConversation,
  loadConversationList,
  startNewConversation,
  handleSendChat,
  stopGenerating,
} = session;

const { selectedModelKey, modelGroups, canSendMessage, selectModel } = model;

const {
  goalDraft,
  goalClarification,
  goalAutomationResult,
  goalAgentRun,
  clarificationAnswers,
  showGoalDraftEditor,
  creatingGoal,
  goalAgentLoading,
  goalAgentResuming,
  editableGoal,
  editableKeyResults,
  editableTaskTemplates,
  editableReminders,
  canRunGoalAgent,
  canResumeGoalAgentClarification,
  canContinueGoalAgentExecution,
  canRetryGoalAgentExecution,
  goalExecutedActions,
  goalExecutionSummary,
  goalExecutionRecovery,
  automatedGoalId,
  goalAgentPendingActions,
  goalAgentExecutedActions,
  goalAgentWaitingForClarification,
  goalAgentWaitingForApproval,
  goalAgentWaitingForExecution,
  startGoalAgentRun,
  submitGoalAgentClarification,
  confirmGoalAgentRun,
  cancelGoalAgentRun,
  continueGoalAgentExecution,
  retryGoalAgentExecution,
  openAutomatedGoal,
  handleCreateGoalFromDraft,
  addKeyResultDraft,
  removeKeyResultDraft,
  updateKeyResultDraft,
  handleUpdateGoalDraft,
  addTaskTemplateDraft,
  removeTaskTemplateDraft,
  updateTaskTemplateDraft,
  addReminderDraft,
  removeReminderDraft,
  updateReminderDraft,
  toggleGoalDraftEditor,
} = goalWorkflow;

const {
  noteCreating,
  noteSummary,
  noteAgentRun,
  noteAgentLoading,
  canRunKnowledgeNoteAgent,
  canRetryKnowledgeNoteAgentExecution,
  startKnowledgeNoteAgentRun,
  createKnowledgeNoteFromConversation,
  startKnowledgeNoteAgentRunFromKnowledgeAnswer,
  retryKnowledgeNoteAgentExecution,
  openCreatedNote,
} = noteWorkflow;

const {
  knowledgeQueryLoading,
  knowledgeAnswer,
  knowledgeQaAgentRun,
  canAskKnowledge,
  askKnowledgeFromConversation,
  openKnowledgeCitation,
} = knowledgeQaWorkflow;

const {
  formatAutomationTool,
  formatAgentTool,
  formatActionStatus,
  formatExecutionOutcome,
} = formatters;

const {
  toolMode,
  currentConversationLabel,
  currentToolLabel,
  currentToolButtonLabel,
  notePreview,
  workflowStatusText,
  canRunWorkflowActions,
  exitToolMode,
  openSettings,
} = common;

const contextPanelOpen = ref(false);
const mobileSidebarOpen = ref(false);
/** Dedup key for auto-opening a business panel Tab for the current artifact. */
const lastOpenedArtifactKey = ref<string | null>(null);

const hasWorkflowArtifact = computed(() => {
  if (toolMode.value === 'goal-create') {
    return Boolean(
      goalClarification.value ||
        goalDraft.value ||
        goalAutomationResult.value ||
        goalAgentRun.value,
    );
  }

  if (toolMode.value === 'knowledge-qa') {
    return Boolean(
      knowledgeAnswer.value ||
        knowledgeQaAgentRun.value ||
        noteAgentRun.value ||
        noteSummary.value,
    );
  }

  if (toolMode.value === 'knowledge-generate') {
    return Boolean(noteAgentRun.value || noteSummary.value);
  }

  return false;
});

const hasWorkflowContext = computed(
  () => toolMode.value !== 'chat' || hasWorkflowArtifact.value,
);

// ── Welcome / idle: Today overview under shortcut cards (V2 §6.0) ──
const { goalProgress, isLoading: dashboardLoading, fetchDashboard } = useDashboard();
const todayOverviewVisible = computed(
  () => chatTimeline.value.length === 0 && !hasWorkflowContext.value,
);

watch(
  todayOverviewVisible,
  (visible) => {
    if (visible) {
      void fetchDashboard();
    }
  },
  { immediate: true },
);

/**
 * Prefill composer + set tool mode from welcome shortcut cards (V2 §6.0).
 */
function handleWelcomeShortcut(mode: WorkflowMode) {
  const prefillKey = {
    chat: 'aiAssistant.chatPage.shortcuts.chat.prefill',
    'goal-create': 'aiAssistant.chatPage.shortcuts.goalCreate.prefill',
    'knowledge-generate': 'aiAssistant.chatPage.shortcuts.knowledgeGenerate.prefill',
    'knowledge-qa': 'aiAssistant.chatPage.shortcuts.knowledgeQa.prefill',
  }[mode];

  startNewConversation(mode);
  if (prefillKey) {
    chatMessage.value = t(prefillKey);
  }
}

/**
 * When a workflow product is ready, open a business panel Tab without stealing
 * a different already-open route (shell openTab intent: deeplink + router push).
 * Pinia may be absent in isolated unit mounts — store call is best-effort.
 */
function openArtifactBusinessTab(
  module: 'goal' | 'note',
  route: string,
  title: string,
  artifactKey: string,
) {
  if (lastOpenedArtifactKey.value === artifactKey) return;
  lastOpenedArtifactKey.value = artifactKey;

  try {
    const shellStore = useAppShellStore();
    shellStore.openTab({
      module,
      route,
      title,
      intent: 'deeplink',
    });
  } catch {
    // no active pinia (unit tests) — router push still exercises navigation
  }

  void router.push(route);
}

// Only open tabs for ready products: created goal / goal draft / created note.
// Do not open merely because an Agent run is in progress (avoids mid-flow jumps).
// Open panel Tabs for ready products only (V2 §6.0 / §2.3 deeplink, no steal).
// Intermediate restored drafts without a live agent run do not auto-navigate
// (avoids clobbering the AI workspace on session restore).
watch(
  [goalDraft, goalAgentRun, automatedGoalId, noteSummary, toolMode],
  () => {
    if (toolMode.value === 'goal-create') {
      if (automatedGoalId.value) {
        openArtifactBusinessTab(
          'goal',
          `/goals/${automatedGoalId.value}`,
          t('nav.capsule.goal'),
          `goal-created:${automatedGoalId.value}`,
        );
        return;
      }
      // Draft ready during/after agent flow → open Goal panel Tab for the draft.
      if (goalDraft.value && goalAgentRun.value) {
        const draft = goalDraft.value as {
          goal?: { title?: string; description?: string };
          title?: string;
          name?: string;
          description?: string;
        };
        const draftName =
          draft.goal?.title ||
          draft.title ||
          draft.name ||
          t('aiAssistant.chatPage.workflow.goalDraftTitle');
        const draftDesc = draft.goal?.description || draft.description || '';
        const runId = String(
          (goalAgentRun.value as { runId?: string; id?: string }).runId ||
            (goalAgentRun.value as { runId?: string; id?: string }).id ||
            'run',
        );
        openArtifactBusinessTab(
          'goal',
          '/goals',
          draftName,
          `goal-draft:${runId}:${draftName}:${draftDesc}`,
        );
      }
      return;
    }

    if (
      (toolMode.value === 'knowledge-generate' || toolMode.value === 'knowledge-qa') &&
      noteSummary.value
    ) {
      const summary = noteSummary.value as { resolvedPath?: string; path?: string };
      const path = summary.resolvedPath || summary.path || 'note';
      openArtifactBusinessTab(
        'note',
        '/repository',
        t('aiAssistant.chatPage.workflow.openCreatedNote'),
        `note-created:${path}`,
      );
    }
  },
);

function toggleContextPanel() {
  contextPanelOpen.value = !contextPanelOpen.value;
}

function closeContextPanel() {
  contextPanelOpen.value = false;
}

function openMobileSidebar() {
  mobileSidebarOpen.value = true;
}

function closeMobileSidebar() {
  mobileSidebarOpen.value = false;
}

function startNewConversationFromMobile() {
  closeMobileSidebar();
  startNewConversation();
  lastOpenedArtifactKey.value = null;
}

async function selectConversationFromMobile(item: ConversationSummary) {
  closeMobileSidebar();
  await selectConversation(item);
}

async function selectAgentRunFromMobile(run: AgentRun) {
  closeMobileSidebar();
  await selectAgentRun(run);
}

async function openRecentGoalFromMobile(goalId: string) {
  closeMobileSidebar();
  await openRecentGoal(goalId);
}

async function openRecentKnowledgeNoteFromMobile(resourceId: string) {
  closeMobileSidebar();
  await openRecentKnowledgeNote(resourceId);
}

function openSettingsFromMobile() {
  closeMobileSidebar();
  openSettings();
}

function handleClarificationAnswersUpdate(answers: string[]) {
  clarificationAnswers.value = answers;
}

onMounted(() => {
  const viewport = messagePanelRef.value?.viewport;
  if (viewport) {
    messagesViewport.value = viewport;
  }
});

/**
 * Surface exposed to the V2 AppShell (template ref):
 * feeds the shell-level ConversationSidebar and its actions without
 * duplicating `useAIChatView` state (single chat session instance).
 */
defineExpose({
  conversationList,
  conversationListLoading,
  chatConversationId,
  selectConversation,
  deleteConversation,
  startNewConversation,
  loadConversationList,
});
</script>
