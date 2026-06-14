<template>
  <div class="flex h-full min-h-0 overflow-hidden bg-background" data-testid="ai-chat-view">
    <AIConversationSidebar
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
      <header class="border-b bg-background px-4 py-3 sm:px-6">
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
            <Button variant="ghost" size="icon" class="h-8 w-8"
              :title="t('aiAssistant.dialogs.chat.refresh')"
              :disabled="conversationListLoading"
              @click="loadConversationList">
              <RefreshCcw class="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" class="h-8 w-8"
              :title="t('nav.settings')"
              @click="openSettings">
              <Settings2 class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <AIMessagePanel ref="messagePanelRef" :timeline="chatTimeline" :tool-mode="toolMode" />

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
      >
        <template #action-rail>
          <div v-if="toolMode !== 'chat'" class="rounded-2xl border bg-muted/30 px-4 py-3">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div class="min-w-0">
                <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {{ t('aiAssistant.chatPage.workflow.activeMode') }}
                </p>
                <h2 class="mt-1 text-sm font-semibold text-foreground">
                  {{ currentToolLabel }}
                </h2>
                <p class="mt-1 text-sm leading-6 text-muted-foreground">
                  {{ workflowStatusText }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <template v-if="toolMode === 'goal-create'">
                  <Button
                    v-if="canRetryGoalAgentExecution"
                    variant="outline"
                    :disabled="goalAgentResuming"
                    data-testid="goal-agent-retry-execution"
                    @click="retryGoalAgentExecution">
                    {{ goalAgentResuming ? t('aiAssistant.dialogs.agent.resuming') : t('common.retry') }}
                  </Button>
                  <Button
                    v-else-if="!goalAgentWaitingForClarification && !goalAgentWaitingForApproval && !goalAgentWaitingForExecution"
                    variant="outline"
                    :disabled="!canRunGoalAgent"
                    data-testid="goal-agent-start-run"
                    @click="startGoalAgentRun">
                    {{ goalAgentLoading ? t('aiAssistant.dialogs.agent.starting') : t('aiAssistant.dialogs.agent.startRun') }}
                  </Button>
                  <template v-else-if="goalAgentWaitingForApproval">
                    <Button variant="outline"
                      :disabled="goalAgentResuming"
                      data-testid="goal-agent-toggle-editor"
                      @click="toggleGoalDraftEditor">
                      {{ showGoalDraftEditor ? t('aiAssistant.chatPage.workflow.hideGoalEditor') : t('aiAssistant.chatPage.workflow.editGoalBeforeCreate') }}
                    </Button>
                    <Button variant="outline"
                      :disabled="goalAgentResuming"
                      data-testid="goal-agent-confirm-run"
                      @click="confirmGoalAgentRun">
                      {{ goalAgentResuming ? t('aiAssistant.dialogs.agent.resuming') : t('aiAssistant.dialogs.agent.confirmRun') }}
                    </Button>
                    <Button variant="ghost"
                      :disabled="goalAgentResuming"
                      data-testid="goal-agent-cancel-run"
                      @click="cancelGoalAgentRun">
                      {{ t('common.cancel') }}
                    </Button>
                  </template>
                  <template v-else-if="goalAgentWaitingForExecution">
                    <Button variant="outline"
                      :disabled="!canContinueGoalAgentExecution"
                      data-testid="goal-agent-continue-execution"
                      @click="continueGoalAgentExecution">
                      {{ goalAgentResuming ? t('aiAssistant.dialogs.agent.resuming') : t('aiAssistant.dialogs.agent.continueExecution') }}
                    </Button>
                  </template>
                  <template v-if="goalAgentWaitingForClarification && goalClarification">
                    <Button variant="outline"
                      :disabled="!canResumeGoalAgentClarification"
                      data-testid="goal-workflow-submit-clarification"
                      @click="submitGoalAgentClarification">
                      {{ goalAgentResuming ? t('aiAssistant.dialogs.agent.resuming') : t('aiAssistant.chatPage.workflow.submitGoalClarification') }}
                    </Button>
                    <Button variant="ghost"
                      :disabled="goalAgentResuming"
                      data-testid="goal-agent-cancel-run"
                      @click="cancelGoalAgentRun">
                      {{ t('common.cancel') }}
                    </Button>
                  </template>
                  <template v-if="showLegacyGoalWorkflowActions && !goalAgentRun">
                    <template v-if="goalClarification">
                      <Button variant="outline"
                        :disabled="goalDraftLoading || !canRunGoalWorkflow"
                        data-testid="goal-workflow-submit-clarification"
                        @click="generateGoalDraftFromConversation">
                        {{ goalDraftLoading ? t('aiAssistant.dialogs.generateGoal.generating') : t('aiAssistant.chatPage.workflow.submitGoalClarification') }}
                      </Button>
                    </template>
                    <Button v-else-if="!goalDraft" variant="outline"
                      :disabled="goalDraftLoading || !canRunGoalWorkflow"
                      data-testid="goal-workflow-generate-draft"
                      @click="generateGoalDraftFromConversation">
                      {{ goalDraftLoading ? t('aiAssistant.dialogs.generateGoal.generating') : t('aiAssistant.chatPage.workflow.generateGoalDraft') }}
                    </Button>
                    <template v-else>
                      <Button :disabled="creatingGoal" @click="handleCreateGoalFromDraft">
                        {{ creatingGoal ? t('aiAssistant.goalDraft.creatingGoal') : t('aiAssistant.chatPage.workflow.createGoalDirectly') }}
                      </Button>
                      <Button variant="outline" @click="toggleGoalDraftEditor">
                        {{ showGoalDraftEditor ? t('aiAssistant.chatPage.workflow.hideGoalEditor') : t('aiAssistant.chatPage.workflow.editGoalBeforeCreate') }}
                      </Button>
                      <Button variant="outline" :disabled="!canPlanGoalAutomation"
                        data-testid="goal-workflow-plan-automation"
                        @click="handlePlanGoalAutomation">
                        {{ automationLoading ? t('aiAssistant.dialogs.automation.planning') : t('aiAssistant.dialogs.automation.planAutomation') }}
                      </Button>
                      <Button v-if="goalWorkflowStage === 'confirm' && !goalExecutedActions.length"
                        variant="outline" :disabled="automationExecuting"
                        data-testid="goal-workflow-confirm-execute"
                        @click="handleExecuteGoalAutomation">
                        {{ automationExecuting ? t('aiAssistant.dialogs.automation.executing') : t('aiAssistant.dialogs.automation.confirmAndExecute') }}
                      </Button>
                      <Button variant="ghost" :disabled="goalDraftLoading || !canRunGoalWorkflow"
                        @click="generateGoalDraftFromConversation">
                        {{ t('aiAssistant.chatPage.workflow.regenerateGoalDraft') }}
                      </Button>
                    </template>
                  </template>
                  <Button
                    v-if="automatedGoalId"
                    variant="outline"
                    data-testid="goal-workflow-open-created-goal"
                    @click="openAutomatedGoal">
                    {{ t('aiAssistant.dialogs.automation.openCreatedGoal') }}
                  </Button>
                </template>
                <template v-else-if="toolMode === 'knowledge-generate'">
                  <Button
                    v-if="canRetryKnowledgeNoteAgentExecution"
                    variant="outline"
                    :disabled="noteCreating"
                    data-testid="knowledge-note-retry-execution"
                    @click="retryKnowledgeNoteAgentExecution">
                    {{ noteCreating ? t('aiAssistant.dialogs.agent.resuming') : t('common.retry') }}
                  </Button>
                  <Button
                    v-else-if="!noteAgentRun && !noteSummary"
                    variant="outline"
                    :disabled="!canRunKnowledgeNoteAgent"
                    data-testid="knowledge-note-agent-start-run"
                    @click="startKnowledgeNoteAgentRun">
                    {{ noteAgentLoading ? t('aiAssistant.dialogs.note.drafting') : t('aiAssistant.dialogs.note.draft') }}
                  </Button>
                  <Button v-else-if="!noteSummary" :disabled="noteCreating || !canRunWorkflowActions"
                    data-testid="knowledge-note-save-draft"
                    @click="createKnowledgeNoteFromConversation">
                    {{ noteCreating ? t('aiAssistant.dialogs.note.creating') : t('aiAssistant.chatPage.workflow.createKnowledgeNote') }}
                  </Button>
                  <Button v-else variant="outline" @click="openCreatedNote">
                    {{ t('aiAssistant.chatPage.workflow.openCreatedNote') }}
                  </Button>
                </template>
                <template v-else-if="toolMode === 'knowledge-qa'">
                  <Button
                    :disabled="knowledgeQueryLoading || !canRunWorkflowActions || !canAskKnowledge"
                    data-testid="knowledge-qa-ask"
                    @click="askKnowledgeFromConversation">
                    {{ knowledgeQueryLoading ? t('aiAssistant.dialogs.knowledge.searching') : t('aiAssistant.dialogs.knowledge.ask') }}
                  </Button>
                  <Button
                    v-if="knowledgeAnswer && !noteAgentRun && !noteSummary"
                    variant="outline"
                    :disabled="noteAgentLoading || knowledgeQueryLoading || !canSendMessage || knowledgeAnswer.evidenceStatus !== 'grounded'"
                    data-testid="knowledge-qa-draft-note"
                    @click="startKnowledgeNoteAgentRunFromKnowledgeAnswer(knowledgeAnswer)">
                    {{ noteAgentLoading ? t('aiAssistant.dialogs.note.drafting') : t('aiAssistant.dialogs.note.draft') }}
                  </Button>
                  <Button
                    v-else-if="canRetryKnowledgeNoteAgentExecution"
                    variant="outline"
                    :disabled="noteCreating"
                    data-testid="knowledge-qa-retry-execution"
                    @click="retryKnowledgeNoteAgentExecution">
                    {{ noteCreating ? t('aiAssistant.dialogs.agent.resuming') : t('common.retry') }}
                  </Button>
                  <Button
                    v-else-if="noteAgentRun && !noteSummary"
                    variant="outline"
                    :disabled="noteCreating || !canRunWorkflowActions"
                    data-testid="knowledge-qa-save-draft"
                    @click="createKnowledgeNoteFromConversation">
                    {{ noteCreating ? t('aiAssistant.dialogs.note.creating') : t('aiAssistant.chatPage.workflow.createKnowledgeNote') }}
                  </Button>
                  <Button v-else-if="noteSummary" variant="outline" @click="openCreatedNote">
                    {{ t('aiAssistant.chatPage.workflow.openCreatedNote') }}
                  </Button>
                </template>
                <Button variant="ghost" @click="exitToolMode">
                  {{ t('aiAssistant.chatPage.workflow.exitTool') }}
                </Button>
              </div>
            </div>
          </div>
        </template>
      </AIFooterComposer>
    </section>

    <aside
      v-if="hasWorkflowContext"
      class="fixed inset-x-0 bottom-0 z-40 max-h-[72vh] min-h-0 flex-col border-t bg-background shadow-xl md:static md:z-auto md:max-h-none md:w-[25rem] md:shrink-0 md:border-l md:border-t-0 md:shadow-none"
      :class="contextPanelOpen ? 'flex' : 'hidden md:flex'"
      data-testid="ai-context-panel"
    >
      <div class="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4">
        <div class="min-w-0">
          <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {{ t('aiAssistant.chatPage.context.title') }}
          </p>
          <p class="truncate text-sm font-medium text-foreground">
            {{ currentToolLabel }}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 md:hidden"
          :title="t('aiAssistant.chatPage.context.hide')"
          data-testid="ai-context-panel-close"
          @click="closeContextPanel"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-4">
        <div class="space-y-4">
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
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Menu, PanelRightOpen, Plus, RefreshCcw, Settings2, X } from 'lucide-vue-next';
import { Button } from '@dailyuse/ui-vue-shadcn';
import type { AgentRun } from '@dailyuse/contracts/ai';
import AIConversationSidebar from '../components/AIConversationSidebar.vue';
import AIMessagePanel from '../components/AIMessagePanel.vue';
import AIFooterComposer from '../components/AIFooterComposer.vue';
import AIGoalWorkflowPanel from '../components/AIGoalWorkflowPanel.vue';
import { useAIChatView } from '../composables/useAIChatView';
import type { ConversationSummary } from '../composables/types';

const { t } = useI18n();

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
  selectedModelKey, modelGroups,
  selectModel,
} = model;

const {
  goalDraftLoading, goalWorkflowStage, goalDraft, goalClarification,
  goalAutomationResult, goalAgentRun, clarificationAnswers, showGoalDraftEditor,
  creatingGoal, automationLoading, automationExecuting,
  goalAgentLoading, goalAgentResuming,
  editableGoal, editableKeyResults, editableTaskTemplates, editableReminders,
  canRunGoalWorkflow, canPlanGoalAutomation, canRunGoalAgent,
  canResumeGoalAgentClarification, canContinueGoalAgentExecution, canRetryGoalAgentExecution,
  goalExecutedActions, goalExecutionSummary, goalExecutionRecovery, automatedGoalId,
  goalAgentPendingActions, goalAgentExecutedActions, goalAgentWaitingForClarification,
  goalAgentWaitingForApproval, goalAgentWaitingForExecution,
  generateGoalDraftFromConversation, handlePlanGoalAutomation, handleExecuteGoalAutomation,
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

// Note: canSendMessage is not destructured here as it is not used in the <script setup> block, only in <template>.
// To allow the template to see all variables, we can return/expose them or we can just define them as local constants.
// Since <script setup> automatically exposes all top-level variables to the template, defining them as local constants exposes them perfectly!
const { canSendMessage } = model;

const contextPanelOpen = ref(false);
const mobileSidebarOpen = ref(false);
const showLegacyGoalWorkflowActions = computed(
  () => localStorage.getItem('ai:debug:legacy-goal-workflow') === 'true',
);

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
</script>
