<template>
  <div class="flex h-full min-h-0 overflow-hidden bg-background" data-testid="ai-chat-view">
    <AIConversationSidebar
      :conversations="conversationList"
      :active-conversation-id="chatConversationId"
      :loading="conversationListLoading"
      @new-conversation="startNewConversation()"
      @refresh="loadConversationList"
      @open-settings="openSettings"
      @select="selectConversation"
      @delete="deleteConversation"
    />

    <section class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header class="border-b bg-background px-4 py-3 sm:px-6">
        <div class="flex items-center justify-between gap-3">
          <h1 class="truncate text-lg font-medium text-foreground">
            {{ currentConversationLabel }}
          </h1>
          <div class="flex items-center gap-1 md:hidden">
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
        <div v-if="conversationList.length" class="mt-3 flex gap-2 overflow-x-auto md:hidden">
          <button
            v-for="item in conversationList"
            :key="item.id"
            class="rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors"
            :class="
              chatConversationId === item.id
                ? 'border-primary/40 bg-primary/10 text-foreground'
                : 'border-border text-muted-foreground'
            "
            @click="selectConversation(item)"
          >
            {{ item.name || t('common.untitled') }}
          </button>
        </div>
      </header>

      <AIMessagePanel ref="messagePanelRef" :timeline="chatTimeline" :tool-mode="toolMode">
        <template #panels>
          <AIGoalWorkflowPanel
            :tool-mode="toolMode"
            :goal-clarification="goalClarification"
            :goal-draft="goalDraft"
            :goal-automation-result="goalAutomationResult"
            :clarification-answers="clarificationAnswers"
            :editable-goal="editableGoal"
            :editable-key-results="editableKeyResults"
            :show-goal-draft-editor="showGoalDraftEditor"
            :creating-goal="creatingGoal"
            :goal-executed-actions="goalExecutedActions"
            :goal-execution-summary="goalExecutionSummary"
            :goal-execution-recovery="goalExecutionRecovery"
            :note-summary="noteSummary"
            :note-preview="notePreview"
            :format-automation-tool="formatAutomationTool"
            :format-action-status="formatActionStatus"
            :format-execution-outcome="formatExecutionOutcome"
            @update:clarification-answers="handleClarificationAnswersUpdate"
            @confirm="handleCreateGoalFromDraft"
            @add-key-result="addKeyResultDraft"
            @remove-key-result="removeKeyResultDraft"
            @update-goal="handleUpdateGoalDraft"
            @update-key-result="updateKeyResultDraft"
            @open-created-note="openCreatedNote"
            @start-new-conversation="startNewConversation"
          />
        </template>
      </AIMessagePanel>

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
                <template v-if="toolMode === 'goal'">
                  <Button v-if="goalClarification" variant="outline"
                    :disabled="goalDraftLoading || !canRunGoalWorkflow"
                    data-testid="goal-workflow-submit-clarification"
                    @click="generateGoalDraftFromConversation">
                    {{ goalDraftLoading ? t('aiAssistant.dialogs.generateGoal.generating') : t('aiAssistant.chatPage.workflow.submitGoalClarification') }}
                  </Button>
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
                    <Button v-if="automatedGoalId" variant="outline" @click="openAutomatedGoal">
                      {{ t('aiAssistant.dialogs.automation.openCreatedGoal') }}
                    </Button>
                    <Button variant="ghost" :disabled="goalDraftLoading || !canRunGoalWorkflow"
                      @click="generateGoalDraftFromConversation">
                      {{ t('aiAssistant.chatPage.workflow.regenerateGoalDraft') }}
                    </Button>
                  </template>
                </template>
                <template v-else-if="toolMode === 'knowledge-note'">
                  <Button v-if="!noteSummary" :disabled="noteCreating || !canRunWorkflowActions"
                    @click="createKnowledgeNoteFromConversation">
                    {{ noteCreating ? t('aiAssistant.dialogs.note.creating') : t('aiAssistant.chatPage.workflow.createKnowledgeNote') }}
                  </Button>
                  <Button v-else variant="outline" @click="openCreatedNote">
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, RefreshCcw, Settings2 } from 'lucide-vue-next';
import { Button } from '@dailyuse/ui-vue-shadcn';
import AIConversationSidebar from '../components/AIConversationSidebar.vue';
import AIMessagePanel from '../components/AIMessagePanel.vue';
import AIFooterComposer from '../components/AIFooterComposer.vue';
import AIGoalWorkflowPanel from '../components/AIGoalWorkflowPanel.vue';
import { useAIChatView } from '../composables/useAIChatView';

const { t } = useI18n();

const messagePanelRef = ref<InstanceType<typeof AIMessagePanel> | null>(null);
const composerRef = ref<InstanceType<typeof AIFooterComposer> | null>(null);

const {
  session,
  model,
  goalWorkflow,
  noteWorkflow,
  formatters,
  common,
} = useAIChatView({
  getComposerTextarea: () => composerRef.value?.composerTextarea ?? null,
});

const {
  chatMessage, chatLoading, chatConversationId, chatTimeline,
  conversationList, conversationListLoading,
  messagesViewport,
  selectConversation, deleteConversation, loadConversationList,
  startNewConversation, handleSendChat, stopGenerating,
} = session;

const {
  selectedModelKey, modelGroups,
  selectModel,
} = model;

const {
  goalDraftLoading, goalWorkflowStage, goalDraft, goalClarification,
  goalAutomationResult, clarificationAnswers, showGoalDraftEditor,
  creatingGoal, automationLoading, automationExecuting,
  editableGoal, editableKeyResults,
  canRunGoalWorkflow, canPlanGoalAutomation,
  goalExecutedActions, goalExecutionSummary, goalExecutionRecovery, automatedGoalId,
  generateGoalDraftFromConversation, handlePlanGoalAutomation, handleExecuteGoalAutomation,
  openAutomatedGoal, handleCreateGoalFromDraft,
  addKeyResultDraft, removeKeyResultDraft, updateKeyResultDraft, handleUpdateGoalDraft,
  toggleGoalDraftEditor,
} = goalWorkflow;

const {
  noteCreating, noteSummary, createKnowledgeNoteFromConversation, openCreatedNote,
} = noteWorkflow;

const {
  formatAutomationTool, formatActionStatus, formatExecutionOutcome,
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
