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
            <DailyTodoWidget
              @view-all="router.push('/tasks')"
              @completed="refreshDashboardAfterTaskCompletion"
            />
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
          <!-- Residual 383: Host Artifact cards in Conversation message timeline -->
          <AIHostTimelineArtifactStrip
            :items="hostTimelineArtifactItems"
            @open="openHostWorkbenchFromTimeline"
          />
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
          :execution-profile-id="executionProfileId"
          :density="composerDensity"
          @send="handleSendChat"
          @stop="stopGenerating"
          @start-conversation="startNewConversation"
          @select-model="selectModel"
          @select-execution-profile="selectExecutionProfile"
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
        :execution-profile-id="executionProfileId"
        :density="composerDensity"
        @send="handleSendChat"
        @stop="stopGenerating"
        @start-conversation="startNewConversation"
        @select-model="selectModel"
        @select-execution-profile="selectExecutionProfile"
        @open-settings="openSettings"
      />
    </section>

    <!--
      Artifact rail / Host proposal + execution-report workbench (residual 371/379/381/383/387):
      AIContextPanel is the structured right workbench for Goal/Knowledge artifacts,
      waiting_approval Host proposals, and post-approve Host execution receipts.
      Residual 381 reopens this rail from Conversation AgentRun history.
      Residual 383 also surfaces Host Artifact cards in the message timeline.
      Residual 387 focuses the matching proposal/receipt row from a timeline card.
      Actions near composer remain lifecycle shortcuts; Host revise/approve/reject
      and receipt presentation live here.
    -->
    <AIContextPanel
      v-show="!composerOnly"
      :has-workflow-context="hasWorkflowContext"
      :open="contextPanelOpen"
      :tool-label="currentToolLabel"
      :host-proposal-count="hostProposalItems.length"
      :host-execution-receipt-count="hostExecutionReceiptItems.length"
      @close="closeContextPanel"
    >
      <AIHostProposalPanel
        ref="hostProposalPanelRef"
        :items="hostProposalItems"
        :busy="goalAgentResuming || noteCreating || hostProposalBusy"
        :focused-proposal-id="focusedHostProposalId"
        @approve="handleHostProposalApprove"
        @reject="handleHostProposalReject"
        @revise="handleHostProposalRevise"
      />
      <AIHostExecutionReceiptPanel
        :items="hostExecutionReceiptItems"
        :focused-proposal-id="focusedHostProposalId"
        @open-entity="openHostReceiptEntity"
      />
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
        v-if="!hasWorkflowArtifact && hostProposalItems.length === 0 && hostExecutionReceiptItems.length === 0"
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
import AIHostProposalPanel from '../components/AIHostProposalPanel.vue';
import AIHostExecutionReceiptPanel from '../components/AIHostExecutionReceiptPanel.vue';
import AIHostTimelineArtifactStrip from '../components/AIHostTimelineArtifactStrip.vue';
import DailyTodoWidget from '../../task/components/widgets/DailyTodoWidget.vue';
import UpcomingRemindersWidget from '../../reminder/components/widgets/UpcomingRemindersWidget.vue';
import GoalProgressWidget from '../../goal/components/widgets/GoalProgressWidget.vue';
import { useDashboard } from '../../dashboard/composables/useDashboard';
import { useAppShellStore } from '../../../layouts/shell/useAppShellStore';
import { SHELL_COMPOSER_DENSITY_KEY, SHELL_COMPOSER_MOUNT_KEY } from '../../../di/keys';
import type { ComposerDensity } from '../../../layouts/shell/panel-geometry';
import { useAIChatView } from '../composables/useAIChatView';
import {
  buildPendingHostProposalItems,
  buildHostExecutionReceiptItems,
  buildHostTaskClientExecutionReceipt,
  buildHostTaskCreateTemplateRequest,
  composeHostWorkbenchTimelineArtifacts,
  resolveHostWorkbenchFocusFromTimeline,
  resolveLiveHostWorkbenchAgentRuns,
  shouldOpenHostWorkbenchFromAgentRun,
  dispatchHostProposalDecision,
  normalizeHostProposalRejectReason,
  dispatchHostProposalRevise,
  type HostExecutionReceiptItem,
  type HostProposalPanelItem,
  type HostTimelineArtifactItem,
} from '../composables/hostProposalLifecycle';
import { useTaskTemplates } from '../../task/composables/useTaskTemplates';
import type { CreateTaskTemplateReq } from '@dailyuse/contracts/task';
import type { ConversationSummary, WorkflowMode } from '../composables/types';
import { useAI } from '../composables/useAI';

const { t } = useI18n();
const router = useRouter();
const { service: aiHostService } = useAI();
/** Residual 423: domain Task template create fallback for Host task approve. */
const { createTemplate: createTaskTemplate } = useTaskTemplates();
/** Residual 425: client domain createTemplate settled proposalIds (session-only). */
const clientSettledHostProposalIds = ref<string[]>([]);
/** Residual 425: client domain task Host execution receipts (session-only). */
const clientTaskHostReceipts = ref<HostExecutionReceiptItem[]>([]);

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
  taskAgentRun,
  recentGoalList,
  recentKnowledgeNoteList,
  messagesViewport,
  selectConversation,
  selectAgentRun: selectAgentRunBase,
  openRecentGoal,
  openRecentKnowledgeNote,
  deleteConversation,
  loadConversationList,
  startNewConversation,
  executionProfileId,
  selectExecutionProfile,
  openChatHostTurns,
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
  cancelKnowledgeNoteAgentRun,
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

  // Residual 429: task.create product toolMode owns dedicated taskAgentRun artifacts.
  if (toolMode.value === 'task-create') {
    return Boolean(taskAgentRun.value);
  }

  return false;
});

// Residual 357/359/361/367/419/423: Host proposal workbench rows (waiting_approval only).
// Residual 423: promote primary task-shaped session runs into exclusive task.create lane.
const liveHostWorkbenchAgentRuns = computed(() =>
  resolveLiveHostWorkbenchAgentRuns({
    goalAgentRun: goalAgentRun.value,
    noteAgentRun: noteAgentRun.value,
    // Residual 427: dedicated task.create session field preferred when present.
    taskAgentRun: taskAgentRun.value,
  }),
);

const hostProposalItems = computed(() =>
  buildPendingHostProposalItems({
    goalAgentRun: liveHostWorkbenchAgentRuns.value.goalAgentRun,
    noteAgentRun: liveHostWorkbenchAgentRuns.value.noteAgentRun,
    taskAgentRun: liveHostWorkbenchAgentRuns.value.taskAgentRun,
    settledProposalIds: clientSettledHostProposalIds.value,
  }),
);

/** Residual 379/423/425: Host execution receipts (AgentRun + client createTemplate). */
const hostExecutionReceiptItems = computed(() =>
  buildHostExecutionReceiptItems({
    goalAgentRun: liveHostWorkbenchAgentRuns.value.goalAgentRun,
    noteAgentRun: liveHostWorkbenchAgentRuns.value.noteAgentRun,
    taskAgentRun: liveHostWorkbenchAgentRuns.value.taskAgentRun,
    clientTaskReceipts: clientTaskHostReceipts.value,
  }),
);

/**
 * Residual 383/399/401/409/411: Host Artifact cards + open-chat multi-engine badges
 * via workbench composition (partition + fail-closed surface isolation audit).
 */
const hostWorkbenchTimeline = computed(() =>
  composeHostWorkbenchTimelineArtifacts({
    openChatTurns: openChatHostTurns.value,
    proposals: hostProposalItems.value,
    receipts: hostExecutionReceiptItems.value,
  }),
);
const hostTimelineArtifactItems = computed(() => hostWorkbenchTimeline.value.items);

/** Residual 387: timeline card focus target (proposalId) for right workbench highlight. */
const focusedHostProposalId = ref<string | null>(null);

/**
 * Residual 383/387: timeline Artifact card reopens Host workbench and focuses
 * the matching proposal/receipt row.
 */
function openHostWorkbenchFromTimeline(item?: HostTimelineArtifactItem) {
  // Residual 401: open-chat cards are multi-engine badges only — no proposal/receipt focus.
  if (item?.surface === 'open_chat') {
    focusedHostProposalId.value = null;
    return;
  }
  contextPanelOpen.value = true;
  const focus = resolveHostWorkbenchFocusFromTimeline(item);
  focusedHostProposalId.value = focus?.proposalId ?? null;
}

watch(
  [hostProposalItems, hostExecutionReceiptItems],
  () => {
    const focusedId = focusedHostProposalId.value;
    if (!focusedId) return;
    const stillPresent =
      hostProposalItems.value.some((row) => row.proposalId === focusedId) ||
      hostExecutionReceiptItems.value.some((row) => row.proposalId === focusedId);
    if (!stillPresent) {
      focusedHostProposalId.value = null;
    }
  },
  { deep: true },
);

/**
 * Residual 385/419: deep-link from Host execution receipt primary entity.
 * Goal → /goals/:id; knowledge → repository note open path; task → /tasks/:id.
 */
async function openHostReceiptEntity(payload: {
  source: 'goal' | 'knowledge' | 'task';
  entityId: string;
}) {
  if (!payload.entityId) return;
  if (payload.source === 'goal') {
    await router.push(`/goals/${payload.entityId}`);
    return;
  }
  if (payload.source === 'task') {
    await router.push(`/tasks/${payload.entityId}`);
    return;
  }
  await openRecentKnowledgeNote(payload.entityId);
}

/** Residual 371: pending Host proposals are first-class right-workbench context. */
const hasPendingHostProposals = computed(() => hostProposalItems.value.length > 0);

/** Residual 379: completed Host receipts keep the right workbench relevant. */
const hasHostExecutionReceipts = computed(() => hostExecutionReceiptItems.value.length > 0);

const hasWorkflowContext = computed(
  () =>
    toolMode.value !== 'chat' ||
    hasWorkflowArtifact.value ||
    hasPendingHostProposals.value ||
    hasHostExecutionReceipts.value,
);
const hostProposalBusy = ref(false);
const hostProposalPanelRef = ref<{
  applyRevised: (
    proposalId: string,
    next: {
      revision: number;
      title?: string;
      targetPath?: string;
      contentMarkdown?: string;
    },
  ) => void;
} | null>(null);

async function handleHostProposalRevise(payload: {
  item: HostProposalPanelItem;
  revision: number;
  patch: {
    title?: string;
    targetPath?: string;
    contentMarkdown?: string;
    description?: string | null;
    goalId?: string | null;
  };
  dirty: boolean;
}) {
  if (hostProposalBusy.value || !payload.dirty) return;
  hostProposalBusy.value = true;
  try {
    const result = await dispatchHostProposalRevise(aiHostService, {
      runId: payload.item.runId,
      kind: payload.item.kind,
      revision: payload.revision,
      patch: payload.patch,
    });
    hostProposalPanelRef.value?.applyRevised(payload.item.proposalId, {
      revision: result.revision,
      title: payload.patch.title,
      description: payload.patch.description,
      targetPath: payload.patch.targetPath,
      contentMarkdown: payload.patch.contentMarkdown,
      goalId: payload.patch.goalId,
    });
  } finally {
    hostProposalBusy.value = false;
  }
}

async function handleHostProposalApprove(payload: {
  item: HostProposalPanelItem;
  revision: number;
  patch: {
    title?: string;
    targetPath?: string;
    contentMarkdown?: string;
    description?: string | null;
    goalId?: string | null;
  };
  dirty: boolean;
}) {
  if (hostProposalBusy.value) return;
  hostProposalBusy.value = true;
  try {
    let revision = payload.revision;
    if (payload.dirty) {
      const revised = await dispatchHostProposalRevise(aiHostService, {
        runId: payload.item.runId,
        kind: payload.item.kind,
        revision,
        patch: payload.patch,
      });
      revision = revised.revision;
      hostProposalPanelRef.value?.applyRevised(payload.item.proposalId, {
        revision,
        title: payload.patch.title,
        description: payload.patch.description,
        targetPath: payload.patch.targetPath,
        contentMarkdown: payload.patch.contentMarkdown,
        goalId: payload.patch.goalId,
      });
    }

    await dispatchHostProposalDecision(aiHostService, {
      decision: 'approve',
      runId: payload.item.runId,
      kind: payload.item.kind,
      revision,
    });

    if (payload.item.source === 'goal') {
      await confirmGoalAgentRun({
        skipHostLifecycle: true,
        revision,
        // Residual 365: pass Host-revised title/description into resumeAgentRun executor payload.
        title: payload.patch.title ?? payload.item.title,
        description: payload.patch.description ?? payload.item.description,
      });
      return;
    }
    if (payload.item.source === 'knowledge') {
      await createKnowledgeNoteFromConversation({
        skipHostLifecycle: true,
        revision,
        // Residual 363: pass Host-revised path/body into resumeAgentRun executor payload.
        targetPath: payload.patch.targetPath ?? payload.item.targetPath,
        contentMarkdown: payload.patch.contentMarkdown ?? payload.item.contentMarkdown,
      });
      return;
    }
    // Residual 423/427: task.create domain executor after Host lifecycle approve.
    if (payload.item.source === 'task') {
      const title = payload.patch.title ?? payload.item.title;
      const goalId = payload.patch.goalId ?? payload.item.goalId;
      const ownedByTaskSession = taskAgentRun.value?.run.runId === payload.item.runId;
      const isTaskAgentType =
        taskAgentRun.value?.run.agentType === 'task.create' ||
        liveHostWorkbenchAgentRuns.value.taskAgentRun?.run.agentType === 'task.create';
      // Residual 427: AgentType task.create always uses domain createTemplate + client settle.
      // Primary task-shaped goal.create still prefers goal session confirm when owned there.
      if (
        !isTaskAgentType &&
        !ownedByTaskSession &&
        goalAgentRun.value?.run.runId === payload.item.runId
      ) {
        await confirmGoalAgentRun({
          skipHostLifecycle: true,
          revision,
          title,
          goalId,
        });
        return;
      }
      // Fallback: pure domain Task template create (no AgentRun resume owner).
      // Residual 425: settle proposal + client Host receipt with deep-link entity id.
      const req = buildHostTaskCreateTemplateRequest({ title, goalId });
      if (req) {
        const created = await createTaskTemplate(req as CreateTaskTemplateReq);
        const templateId = created?.template?.id ? String(created.template.id) : '';
        if (templateId) {
          const receipt = buildHostTaskClientExecutionReceipt({
            runId: payload.item.runId,
            proposalId: payload.item.proposalId,
            revision,
            title,
            templateId,
            goalId,
          });
          if (!clientSettledHostProposalIds.value.includes(payload.item.proposalId)) {
            clientSettledHostProposalIds.value = [
              ...clientSettledHostProposalIds.value,
              payload.item.proposalId,
            ];
          }
          if (!clientTaskHostReceipts.value.some((row) => row.proposalId === receipt.proposalId)) {
            clientTaskHostReceipts.value = [...clientTaskHostReceipts.value, receipt];
          }
        }
      }
      return;
    }
  } finally {
    hostProposalBusy.value = false;
  }
}

async function handleHostProposalReject(payload: {
  item: HostProposalPanelItem;
  revision: number;
  reason?: string;
}) {
  if (hostProposalBusy.value) return;
  hostProposalBusy.value = true;
  try {
    // Residual 397: freeform reject reason from Host proposal workbench (lifecycle only).
    await dispatchHostProposalDecision(aiHostService, {
      decision: 'reject',
      runId: payload.item.runId,
      kind: payload.item.kind,
      revision: payload.revision,
      reason: normalizeHostProposalRejectReason(payload.reason),
    });

    if (payload.item.source === 'goal') {
      await cancelGoalAgentRun({ skipHostLifecycle: true, revision: payload.revision });
      return;
    }
    if (payload.item.source === 'knowledge') {
      await cancelKnowledgeNoteAgentRun({
        skipHostLifecycle: true,
        revision: payload.revision,
      });
      return;
    }
    // Residual 423/425/427: cancel task-shaped AgentRun via goal session when owned there.
    if (payload.item.source === 'task') {
      const isTaskAgentType =
        taskAgentRun.value?.run.agentType === 'task.create' ||
        liveHostWorkbenchAgentRuns.value.taskAgentRun?.run.agentType === 'task.create';
      if (
        !isTaskAgentType &&
        goalAgentRun.value?.run.runId === payload.item.runId
      ) {
        await cancelGoalAgentRun({
          skipHostLifecycle: true,
          revision: payload.revision,
        });
      } else if (!clientSettledHostProposalIds.value.includes(payload.item.proposalId)) {
        // Residual 425: client-settle orphan task proposals (no AgentRun owner to cancel).
        clientSettledHostProposalIds.value = [
          ...clientSettledHostProposalIds.value,
          payload.item.proposalId,
        ];
      }
      return;
    }
  } finally {
    hostProposalBusy.value = false;
  }
}

// ── Welcome / idle: Today overview under shortcut cards (V2 §6.0) ──
const { goalProgress, isLoading: dashboardLoading, fetchDashboard } = useDashboard();
const todayOverviewVisible = computed(
  () => chatTimeline.value.length === 0 && !hasWorkflowContext.value,
);


// Residual 371/379: auto-open right workbench for Host proposals or execution receipts.
// Desktop already shows the rail; mobile needs open=true to unhide the sheet.
watch(
  [hasPendingHostProposals, hasHostExecutionReceipts],
  ([pending, receipts]) => {
    if (pending || receipts) {
      contextPanelOpen.value = true;
    }
  },
  { immediate: true },
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

async function refreshDashboardAfterTaskCompletion() {
  // Task persistence completes before the HTTP response, while the linked Goal
  // projection is updated by an asynchronous domain-event listener. Refresh
  // once for task statistics and once more to reconcile that dependent view.
  await fetchDashboard();
  await new Promise((resolve) => setTimeout(resolve, 150));
  await fetchDashboard();
}

/**
 * Prefill composer + set tool mode from welcome shortcut cards (V2 §6.0).
 */
function handleWelcomeShortcut(mode: WorkflowMode) {
  const prefillKey = {
    chat: 'aiAssistant.chatPage.shortcuts.chat.prefill',
    'goal-create': 'aiAssistant.chatPage.shortcuts.goalCreate.prefill',
    'task-create': 'aiAssistant.chatPage.shortcuts.taskCreate.prefill',
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

/**
 * Residual 381: AgentRun history (Conversation sidebar) reopens Host proposal
 * or execution-report workbench when the restored snapshot owns Host rows.
 */
async function selectAgentRun(run: AgentRun) {
  const result = await selectAgentRunBase(run);
  if (
    shouldOpenHostWorkbenchFromAgentRun(result) ||
    hasPendingHostProposals.value ||
    hasHostExecutionReceipts.value
  ) {
    contextPanelOpen.value = true;
  }
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
