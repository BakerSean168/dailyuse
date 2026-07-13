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
            <Button variant="ghost" size="icon" class="h-8 w-8"
              :title="t('aiAssistant.chatPage.sidebar.open')"
              data-testid="ai-mobile-sidebar-toggle"
              @click="openMobileSidebar">
              <Menu class="h-4 w-4" />
            </Button>
            <Button v-if="hasWorkflowContext" variant="ghost" size="icon" class="h-8 w-8"
              :title="contextPanelOpen ? t('aiAssistant.chatPage.context.hide') : t('aiAssistant.chatPage.context.show')"
              data-testid="ai-context-panel-toggle"
              @click="toggleContextPanel">
              <PanelRightOpen class="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" class="h-8 w-8"
              :title="t('aiAssistant.dialogs.chat.newConversation')"
              @click="startNewConversation()">
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
        @select-tool="startNewConversation"
      />

      <!-- Composer 回归纯对话：工作流操作条已整体迁至右栏（§1） -->
      <AIFooterComposer
        ref="composerRef"
        v-model="chatMessage"
        :loading="chatLoading"
        :can-send="canSendMessage"
        :tool-button-label="currentToolButtonLabel"
        :model-groups="modelGroups"
        :selected-model-key="selectedModelKey"
        @send="handleSendChat"
        @stop="stopGenerating"
        @start-conversation="startNewConversation"
        @select-model="selectModel"
        @open-settings="openSettings"
      />
    </section>

    <AIContextPanel
      v-show="!composerOnly"
      :has-workflow-context="hasWorkflowContext"
      :open="contextPanelOpen"
      :tool-label="currentToolLabel"
      @close="closeContextPanel"
    >
      <template #action-bar>
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
          :start-knowledge-note-agent-run-from-knowledge-answer="startKnowledgeNoteAgentRunFromKnowledgeAnswer"
          :retry-knowledge-note-agent-execution="retryKnowledgeNoteAgentExecution"
          :open-created-note="openCreatedNote"
          :ask-knowledge-from-conversation="askKnowledgeFromConversation"
          :exit-tool-mode="exitToolMode"
        />
      </template>

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

      <!-- ① 空闲态：今日概览（≥xl 常驻；<xl 不渲染，§1-8） -->
      <template #idle>
        <template v-if="isXlUp">
          <DailyTodoWidget @view-all="router.push('/tasks')" />
          <UpcomingRemindersWidget :refresh-key="0" @view-all="router.push('/reminders')" />
          <GoalProgressWidget
            :goals="goalProgress"
            :loading="dashboardLoading"
            @view-all="router.push('/goals')"
            @select="(id) => router.push(`/goals/${id}`)"
          />
        </template>
      </template>
    </AIContextPanel>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Menu, PanelRightOpen, Plus } from 'lucide-vue-next';
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
import { useViewportBreakpoint } from '../../../shared/composables/useViewportBreakpoint';
import { useAIChatView } from '../composables/useAIChatView';
import type { ConversationSummary } from '../composables/types';

const { t } = useI18n();
const router = useRouter();
const { isXlUp } = useViewportBreakpoint();

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
    /** Shell provides its own conversation sidebar — hide the built-in one. */
    hideConversationSidebar?: boolean;
    /** STATE C (focus): render only the composer strip, keep state alive. */
    composerOnly?: boolean;
  }>(),
  { hideConversationSidebar: false, composerOnly: false },
);

const messagePanelRef = ref<InstanceType<typeof AIMessagePanel> | null>(null);
const composerRef = ref<InstanceType<typeof AIFooterComposer> | null>(null);

const {
  session,
  model,
  goalWorkflow,
  knowledgeQaWorkflow,
  noteWorkflow,
  formatters,
  common,
} = useAIChatView({
  getComposerTextarea: () => composerRef.value?.composerTextarea ?? null,
});

const {
  chatMessage, chatLoading, chatConversationId, chatTimeline,
  conversationList, conversationListLoading, agentRunList, agentRunListLoading,
  recentGoalList, recentKnowledgeNoteList,
  messagesViewport,
  selectConversation, selectAgentRun, openRecentGoal, openRecentKnowledgeNote,
  deleteConversation, loadConversationList,
  startNewConversation, handleSendChat, stopGenerating,
} = session;

const {
  selectedModelKey, modelGroups, canSendMessage,
  selectModel,
} = model;

const {
  goalDraft, goalClarification,
  goalAutomationResult, goalAgentRun, clarificationAnswers, showGoalDraftEditor,
  creatingGoal,
  goalAgentLoading, goalAgentResuming,
  editableGoal, editableKeyResults, editableTaskTemplates, editableReminders,
  canRunGoalAgent,
  canResumeGoalAgentClarification, canContinueGoalAgentExecution, canRetryGoalAgentExecution,
  goalExecutedActions, goalExecutionSummary, goalExecutionRecovery, automatedGoalId,
  goalAgentPendingActions, goalAgentExecutedActions, goalAgentWaitingForClarification,
  goalAgentWaitingForApproval, goalAgentWaitingForExecution,
  startGoalAgentRun, submitGoalAgentClarification, confirmGoalAgentRun, cancelGoalAgentRun, continueGoalAgentExecution, retryGoalAgentExecution,
  openAutomatedGoal, handleCreateGoalFromDraft,
  addKeyResultDraft, removeKeyResultDraft, updateKeyResultDraft, handleUpdateGoalDraft,
  addTaskTemplateDraft, removeTaskTemplateDraft, updateTaskTemplateDraft,
  addReminderDraft, removeReminderDraft, updateReminderDraft,
  toggleGoalDraftEditor,
} = goalWorkflow;

const {
  noteCreating, noteSummary, noteAgentRun, noteAgentLoading,
  canRunKnowledgeNoteAgent, canRetryKnowledgeNoteAgentExecution,
  startKnowledgeNoteAgentRun, createKnowledgeNoteFromConversation,
  startKnowledgeNoteAgentRunFromKnowledgeAnswer, retryKnowledgeNoteAgentExecution,
  openCreatedNote,
} = noteWorkflow;

const {
  knowledgeQueryLoading, knowledgeAnswer, knowledgeQaAgentRun, canAskKnowledge,
  askKnowledgeFromConversation, openKnowledgeCitation,
} = knowledgeQaWorkflow;

const {
  formatAutomationTool, formatAgentTool, formatActionStatus, formatExecutionOutcome,
} = formatters;

const {
  toolMode, currentConversationLabel, currentToolLabel, currentToolButtonLabel,
  notePreview, workflowStatusText, canRunWorkflowActions,
  exitToolMode, openSettings,
} = common;

const contextPanelOpen = ref(false);
const mobileSidebarOpen = ref(false);

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

// ── 空闲态今日概览数据（§1-3 右栏状态①）──
const { goalProgress, isLoading: dashboardLoading, fetchDashboard } = useDashboard();
const idleOverviewVisible = computed(() => isXlUp.value && !hasWorkflowContext.value);

watch(
  idleOverviewVisible,
  (visible) => {
    if (visible) {
      void fetchDashboard();
    }
  },
  { immediate: true },
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
