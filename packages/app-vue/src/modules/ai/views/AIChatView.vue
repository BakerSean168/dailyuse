<template>
  <div class="flex h-full min-h-0 overflow-hidden bg-background" data-testid="ai-chat-view">
    <aside class="hidden min-h-0 w-72 shrink-0 flex-col border-r bg-sidebar md:flex">
      <!-- Conversation List -->
      <div class="flex h-14 items-center border-b px-4">
        <div class="flex items-center gap-2 font-semibold">
          <Bot class="h-5 w-5 text-primary" />
          <span>{{ t('nav.aiChat') }}</span>
        </div>

        <div class="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            :title="t('aiAssistant.dialogs.chat.newConversation')"
            @click="startNewConversation()"
          >
            <Plus class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            :title="t('aiAssistant.dialogs.chat.refresh')"
            :disabled="conversationListLoading"
            @click="loadConversationList"
          >
            <RefreshCcw class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            :title="t('nav.settings')"
            @click="openSettings"
          >
            <Settings2 class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-2">
        <div
          v-for="item in conversationList"
          :key="item.id"
          role="button"
          tabindex="0"
          class="group mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
          :class="
            chatConversationId === item.id
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          "
          @click="selectConversation(item)"
          @keydown.enter.prevent="selectConversation(item)"
          @keydown.space.prevent="selectConversation(item)"
        >
          <MessageSquare class="h-4 w-4 shrink-0" />
          <span class="min-w-0 flex-1 truncate">
            {{ item.name || item.title || t('common.untitled') }}
          </span>
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            @click.stop="deleteConversation(item.id)"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>

        <div
          v-if="!conversationList.length && !conversationListLoading"
          class="rounded-lg px-3 py-4 text-sm text-muted-foreground"
        >
          {{ t('aiAssistant.dialogs.chat.noSavedConversations') }}
        </div>
      </div>
    </aside>

    <section class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header class="border-b bg-background px-4 py-3 sm:px-6">
        <div class="flex items-center justify-between gap-3">
          <h1 class="truncate text-lg font-medium text-foreground">
            {{ currentConversationLabel }}
          </h1>

          <div class="flex items-center gap-1 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :title="t('aiAssistant.dialogs.chat.newConversation')"
              @click="startNewConversation()"
            >
              <Plus class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :title="t('aiAssistant.dialogs.chat.refresh')"
              :disabled="conversationListLoading"
              @click="loadConversationList"
            >
              <RefreshCcw class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :title="t('nav.settings')"
              @click="openSettings"
            >
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
            {{ item.name || item.title || t('common.untitled') }}
          </button>
        </div>
      </header>

      <div ref="messagesViewport" class="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
          <template v-if="chatTimeline.length">
            <article
              v-for="item in chatTimeline"
              :key="item.id"
              class="flex"
              :class="item.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 sm:max-w-[78%]"
                :class="
                  item.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'border bg-card text-card-foreground'
                "
              >
                <p class="mb-2 text-[11px] uppercase tracking-[0.18em] opacity-70">
                  {{
                    item.role === 'user'
                      ? t('aiAssistant.dialogs.chat.you')
                      : t('aiAssistant.dialogs.chat.assistant')
                  }}
                </p>
                <p class="whitespace-pre-wrap break-words">
                  {{ item.content || typingPlaceholder(item) }}
                </p>
                <p
                  v-if="item.role === 'assistant' && (item.status === 'aborted' || item.status === 'error')"
                  class="mt-2 text-xs"
                  :class="item.status === 'error' ? 'text-destructive' : 'text-muted-foreground'"
                >
                  {{ getMessageStatusLabel(item) }}
                </p>
              </div>
            </article>
          </template>

          <div v-else class="flex min-h-[20rem] items-center justify-center">
            <div class="max-w-xl rounded-3xl border bg-card p-6 text-left">
              <div
                class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <component
                  :is="
                    toolMode === 'knowledge-note'
                      ? NotebookPen
                      : toolMode === 'goal'
                        ? Sparkles
                        : Bot
                  "
                  class="h-5 w-5"
                />
              </div>
              <h2 class="text-base font-medium text-foreground">
                {{
                  toolMode === 'chat'
                    ? t('aiAssistant.chatPage.emptyTitle')
                    : t(`aiAssistant.chatPage.toolIntro.${getToolLocaleKey(toolMode)}.title`)
                }}
              </h2>
              <p class="mt-2 text-sm leading-6 text-muted-foreground">
                {{
                  toolMode === 'chat'
                    ? t('aiAssistant.chatPage.emptyDescription')
                    : t(`aiAssistant.chatPage.toolIntro.${getToolLocaleKey(toolMode)}.description`)
                }}
              </p>
            </div>
          </div>

          <section
            v-if="toolMode === 'goal' && goalClarification"
            class="rounded-3xl border bg-card p-5"
            data-testid="goal-clarification-panel"
          >
            <div class="flex flex-col gap-4">
              <div class="space-y-2">
                <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {{ t('aiAssistant.chatPage.workflow.goalClarificationTitle') }}
                </p>
                <p class="text-sm leading-6 text-muted-foreground">
                  {{ goalClarification.rationale || t('aiAssistant.chatPage.workflow.goalClarificationHint') }}
                </p>
              </div>

              <div class="space-y-4">
                <div
                  v-for="(item, index) in goalClarification.questions"
                  :key="`${item.question}-${index}`"
                  class="rounded-2xl border bg-muted/30 p-4"
                >
                  <p class="text-sm font-medium text-foreground">
                    {{ index + 1 }}. {{ item.question }}
                  </p>
                  <p v-if="item.context" class="mt-2 text-sm leading-6 text-muted-foreground">
                    {{ item.context }}
                  </p>
                  <textarea
                    v-model="clarificationAnswers[index]"
                    rows="2"
                    class="mt-3 block w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm leading-6 shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
                    :placeholder="t('aiAssistant.chatPage.workflow.goalClarificationAnswerPlaceholder')"
                    :data-testid="`goal-clarification-answer-${index}`"
                  />
                </div>
              </div>
            </div>
          </section>

          <section
            v-if="toolMode === 'goal' && goalDraft"
            class="rounded-3xl border bg-card p-5"
            data-testid="goal-draft-panel"
          >
            <div class="flex flex-col gap-4">
              <div class="space-y-2">
                <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {{ t('aiAssistant.chatPage.workflow.goalDraftTitle') }}
                </p>
                <h2 class="text-lg font-semibold text-foreground">
                  {{ editableGoal.name || t('common.untitled') }}
                </h2>
                <p class="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {{ editableGoal.description }}
                </p>
              </div>

              <div v-if="editableKeyResults.length" class="flex flex-wrap gap-2">
                <span
                  v-for="(item, index) in editableKeyResults"
                  :key="`${item.title}-${index}`"
                  class="rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground"
                >
                  {{ item.title || t('aiAssistant.goalDraft.keyResults') }}
                </span>
              </div>

              <AIGoalDraftEditor
                v-if="showGoalDraftEditor"
                :goal="editableGoal"
                :key-results="editableKeyResults"
                :is-submitting="creatingGoal"
                @confirm="handleCreateGoalFromDraft"
                @add-key-result="addKeyResultDraft"
                @remove-key-result="removeKeyResultDraft"
                @update-goal="handleUpdateGoalDraft"
                @update-key-result="updateKeyResultDraft"
              />
            </div>
          </section>

          <section
            v-if="toolMode === 'goal' && goalAutomationResult"
            class="rounded-3xl border bg-card p-5"
            data-testid="goal-automation-panel"
          >
            <div class="space-y-4">
              <div>
                <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {{ t('aiAssistant.dialogs.automation.summary') }}
                </p>
                <p class="mt-2 text-sm leading-6 text-foreground">
                  {{ goalAutomationResult.summary }}
                </p>
              </div>

              <div v-if="goalAutomationResult.actions.length">
                <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {{ t('aiAssistant.dialogs.automation.actions') }}
                </p>
                <div class="mt-2 space-y-2">
                  <div
                    v-for="(action, index) in goalAutomationResult.actions"
                    :key="`${action.tool}-${index}`"
                    class="rounded-2xl border bg-muted/20 p-4"
                  >
                    <p class="text-sm font-medium text-foreground">
                      {{ formatAutomationTool(action.tool) }}
                    </p>
                    <p v-if="action.rationale" class="mt-2 text-sm leading-6 text-muted-foreground">
                      {{ action.rationale }}
                    </p>
                  </div>
                </div>
              </div>

              <div v-if="goalExecutedActions.length">
                <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {{ t('aiAssistant.dialogs.automation.executionStatus') }}
                </p>
                <p
                  v-if="goalExecutionSummary"
                  class="mt-2 text-sm leading-6 text-muted-foreground"
                >
                  {{
                    t('aiAssistant.dialogs.automation.executionSummaryText', {
                      status: formatExecutionOutcome(goalExecutionSummary.status),
                      executed: goalExecutionSummary.executedCount,
                      skipped: goalExecutionSummary.skippedCount,
                      failed: goalExecutionSummary.failedCount,
                    })
                  }}
                </p>
              </div>

              <div v-if="goalExecutedActions.length">
                <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {{ t('aiAssistant.dialogs.automation.executionTimeline') }}
                </p>
                <div class="mt-2 space-y-2">
                  <div
                    v-for="(action, index) in goalExecutedActions"
                    :key="`${action.tool}-${action.status}-${index}`"
                    class="rounded-2xl border bg-muted/20 p-4"
                  >
                    <p class="text-sm font-medium text-foreground">
                      {{ formatAutomationTool(action.tool) }} · {{ formatActionStatus(action.status) }}
                    </p>
                    <p class="mt-2 text-sm leading-6 text-muted-foreground">
                      {{ action.message }}
                    </p>
                  </div>
                </div>
              </div>

              <div
                v-if="goalExecutionRecovery && (goalExecutionRecovery.canRetry || goalExecutionRecovery.suggestions.length)"
              >
                <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {{ t('aiAssistant.dialogs.automation.recoveryTitle') }}
                </p>
                <p
                  v-if="goalExecutionRecovery.canRetry"
                  class="mt-2 text-sm leading-6 text-foreground"
                >
                  {{ t('aiAssistant.dialogs.automation.recoveryRetryReady') }}
                </p>
                <div v-if="goalExecutionRecovery.suggestions.length" class="mt-2 space-y-2">
                  <p class="text-sm leading-6 text-muted-foreground">
                    {{ t('aiAssistant.dialogs.automation.recoverySuggestions') }}
                  </p>
                  <div
                    v-for="(suggestion, index) in goalExecutionRecovery.suggestions"
                    :key="`${suggestion}-${index}`"
                    class="rounded-2xl border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground"
                  >
                    {{ suggestion }}
                  </div>
                </div>
              </div>

            </div>
          </section>

          <section
            v-if="toolMode === 'knowledge-note' && noteSummary"
            class="rounded-3xl border bg-card p-5"
          >
            <div class="space-y-4">
              <div>
                <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {{ t('aiAssistant.chatPage.workflow.noteCreatedTitle') }}
                </p>
                <h2 class="mt-2 text-lg font-semibold text-foreground">
                  {{ noteSummary.resource?.name || t('aiAssistant.dialogs.note.newNoteCreated') }}
                </h2>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border bg-muted/30 p-4">
                  <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {{ t('aiAssistant.dialogs.note.savedTo') }}
                  </p>
                  <p class="mt-2 text-sm font-medium text-foreground">
                    {{ noteSummary.resolvedPath }}
                  </p>
                </div>
                <div class="rounded-2xl border bg-muted/30 p-4">
                  <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {{ t('aiAssistant.dialogs.note.preview') }}
                  </p>
                  <p class="mt-2 line-clamp-4 text-sm leading-6 text-muted-foreground">
                    {{ notePreview }}
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <Button variant="outline" @click="openCreatedNote">
                  {{ t('aiAssistant.chatPage.workflow.openCreatedNote') }}
                </Button>
                <Button variant="ghost" @click="startNewConversation('knowledge-note')">
                  {{ t('aiAssistant.chatPage.workflow.startAnotherNote') }}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer class="border-t bg-background px-4 py-4 sm:px-6">
        <div class="mx-auto flex w-full max-w-4xl flex-col gap-3">
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
                  <Button
                    v-if="goalClarification"
                    variant="outline"
                    :disabled="goalDraftLoading || !canRunGoalWorkflow"
                    data-testid="goal-workflow-submit-clarification"
                    @click="generateGoalDraftFromConversation"
                  >
                    {{
                      goalDraftLoading
                        ? t('aiAssistant.dialogs.generateGoal.generating')
                        : t('aiAssistant.chatPage.workflow.submitGoalClarification')
                    }}
                  </Button>

                  <Button
                    v-else-if="!goalDraft"
                    variant="outline"
                    :disabled="goalDraftLoading || !canRunGoalWorkflow"
                    data-testid="goal-workflow-generate-draft"
                    @click="generateGoalDraftFromConversation"
                  >
                    {{
                      goalDraftLoading
                        ? t('aiAssistant.dialogs.generateGoal.generating')
                        : t('aiAssistant.chatPage.workflow.generateGoalDraft')
                    }}
                  </Button>

                  <template v-else>
                    <Button :disabled="creatingGoal" @click="handleCreateGoalFromDraft">
                      {{
                        creatingGoal
                          ? t('aiAssistant.goalDraft.creatingGoal')
                          : t('aiAssistant.chatPage.workflow.createGoalDirectly')
                      }}
                    </Button>
                    <Button variant="outline" @click="toggleGoalDraftEditor">
                      {{
                        showGoalDraftEditor
                          ? t('aiAssistant.chatPage.workflow.hideGoalEditor')
                          : t('aiAssistant.chatPage.workflow.editGoalBeforeCreate')
                      }}
                    </Button>
                    <Button
                      variant="outline"
                      :disabled="!canPlanGoalAutomation"
                      data-testid="goal-workflow-plan-automation"
                      @click="handlePlanGoalAutomation"
                    >
                      {{
                        automationLoading
                          ? t('aiAssistant.dialogs.automation.planning')
                          : t('aiAssistant.dialogs.automation.planAutomation')
                      }}
                    </Button>
                    <Button
                      v-if="goalWorkflowStage === 'confirm' && !goalExecutedActions.length"
                      variant="outline"
                      :disabled="automationExecuting"
                      data-testid="goal-workflow-confirm-execute"
                      @click="handleExecuteGoalAutomation"
                    >
                      {{
                        automationExecuting
                          ? t('aiAssistant.dialogs.automation.executing')
                          : t('aiAssistant.dialogs.automation.confirmAndExecute')
                      }}
                    </Button>
                    <Button
                      v-if="automatedGoalId"
                      variant="outline"
                      @click="openAutomatedGoal"
                    >
                      {{ t('aiAssistant.dialogs.automation.openCreatedGoal') }}
                    </Button>
                    <Button
                      variant="ghost"
                      :disabled="goalDraftLoading || !canRunGoalWorkflow"
                      @click="generateGoalDraftFromConversation"
                    >
                      {{ t('aiAssistant.chatPage.workflow.regenerateGoalDraft') }}
                    </Button>
                  </template>
                </template>

                <template v-else-if="toolMode === 'knowledge-note'">
                  <Button
                    v-if="!noteSummary"
                    :disabled="noteCreating || !canRunWorkflowActions"
                    @click="createKnowledgeNoteFromConversation"
                  >
                    {{
                      noteCreating
                        ? t('aiAssistant.dialogs.note.creating')
                        : t('aiAssistant.chatPage.workflow.createKnowledgeNote')
                    }}
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

          <div class="rounded-2xl border bg-card p-3">
            <textarea
              ref="composerTextarea"
              v-model="chatMessage"
              rows="2"
              class="block w-full resize-none border-0 bg-transparent px-1 py-1 text-sm leading-6 shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
              :disabled="chatLoading || !canSendMessage"
              :placeholder="t('aiAssistant.dialogs.chat.messagePlaceholder')"
              data-testid="ai-chat-composer"
              @input="handleComposerInput"
              @keydown="handleComposerKeydown"
            />

            <div class="mt-3 flex flex-col gap-3 border-t pt-3">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button
                        variant="outline"
                        class="h-9 rounded-xl sm:shrink-0"
                        data-testid="ai-chat-tool-menu-trigger"
                      >
                        <Sparkles class="mr-2 h-4 w-4" />
                        {{ currentToolButtonLabel }}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" class="w-64">
                      <DropdownMenuItem data-testid="ai-chat-tool-chat" @click="startNewConversation()">
                        <MessageSquare class="mr-2 h-4 w-4" />
                        {{ t('aiAssistant.chatPage.workflow.tools.chat') }}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        data-testid="ai-chat-tool-goal"
                        @click="startNewConversation('goal')"
                      >
                        <Sparkles class="mr-2 h-4 w-4" />
                        {{ t('aiAssistant.chatPage.workflow.tools.goal') }}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        data-testid="ai-chat-tool-knowledge-note"
                        @click="startNewConversation('knowledge-note')"
                      >
                        <NotebookPen class="mr-2 h-4 w-4" />
                        {{ t('aiAssistant.chatPage.workflow.tools.knowledgeNote') }}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled>
                        <WandSparkles class="mr-2 h-4 w-4" />
                        {{ t('aiAssistant.actions.automateGoalSetup') }}
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <NotebookPen class="mr-2 h-4 w-4" />
                        {{ t('aiAssistant.actions.expandDraft') }}
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <Search class="mr-2 h-4 w-4" />
                        {{ t('aiAssistant.actions.askKnowledge') }}
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <BarChart3 class="mr-2 h-4 w-4" />
                        {{ t('aiAssistant.actions.askAnalytics') }}
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <ClipboardCheck class="mr-2 h-4 w-4" />
                        {{ t('aiAssistant.actions.viewQualityReports') }}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div v-if="modelGroups.length" class="min-w-0 flex-1">
                    <Select
                      :model-value="selectedModelKey"
                      @update:model-value="selectModel(String($event))"
                    >
                      <SelectTrigger class="h-9 w-full rounded-xl sm:max-w-xs">
                        <SelectValue :placeholder="t('aiAssistant.chatPage.emptyModels')" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup v-for="group in modelGroups" :key="group.providerId">
                          <SelectLabel>{{ group.providerName }}</SelectLabel>
                          <SelectItem
                            v-for="model in group.models"
                            :key="model.key"
                            :value="model.key"
                          >
                            {{ model.modelName }}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div
                    v-else
                    class="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground"
                  >
                    <p class="truncate">{{ t('aiAssistant.chatPage.emptyModels') }}</p>
                    <Button variant="outline" size="sm" @click="openSettings">
                      {{ t('nav.settings') }}
                    </Button>
                  </div>
                </div>

                <Button
                  v-if="chatLoading"
                  variant="outline"
                  class="rounded-xl lg:shrink-0"
                  @click="stopGenerating"
                >
                  <Square class="mr-2 h-4 w-4" />
                  {{ t('aiAssistant.dialogs.chat.stopGenerating') }}
                </Button>
                <Button
                  v-else
                  class="rounded-xl lg:shrink-0"
                  :disabled="!chatMessage.trim() || !canSendMessage"
                  data-testid="ai-chat-send-message"
                  @click="handleSendChat"
                >
                  <ArrowUp class="mr-2 h-4 w-4" />
                  {{ t('aiAssistant.dialogs.chat.sendMessage') }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  ArrowUp,
  BarChart3,
  Bot,
  ClipboardCheck,
  MessageSquare,
  NotebookPen,
  Plus,
  RefreshCcw,
  Search,
  Settings2,
  Square,
  Sparkles,
  Trash2,
  WandSparkles,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@dailyuse/ui-vue-shadcn';
import { useAI } from '../composables/useAI';
import { useGoal } from '../../goal/composables/useGoal';
import { useRepository } from '../../repository/composables/useRepository';
import { useUserSetting } from '../../setting/composables/useUserSetting';
import { useEditorWorkspaceActions } from '../../editor/composables';
import AIGoalDraftEditor from '../components/AIGoalDraftEditor.vue';

import { getToolLocaleKey } from '../composables/types';
import type {
  ChatItem,
  GoalAutomationResult,
  GoalExecutedAction,
  ProviderListItem,
  WorkflowMode,
} from '../composables/types';
import { useAIModelSelection } from '../composables/useAIModelSelection';
import { useAIChatSession } from '../composables/useAIChatSession';
import { useAIGoalWorkflow } from '../composables/useAIGoalWorkflow';
import { useAIKnowledgeNoteWorkflow } from '../composables/useAIKnowledgeNoteWorkflow';
import { useAIWorkflowPersistence } from '../composables/useAIWorkflowPersistence';

const { t } = useI18n();
const router = useRouter();
const { service, providers, loadProviders } = useAI();
const { createGoal, addKeyResult } = useGoal();
const { getCategory } = useUserSetting();
const { initRepository, fetchResources, resources } = useRepository();
const { requestOpenResource } = useEditorWorkspaceActions();

// ─── Helpers ───────────────────────────────────────────────────────

function getDefaultConversationName(mode: WorkflowMode | string): string {
  if (mode === 'goal') return t('aiAssistant.chatPage.workflow.defaultConversationNames.goal');
  if (mode === 'knowledge-note')
    return t('aiAssistant.chatPage.workflow.defaultConversationNames.knowledgeNote');
  return t('aiAssistant.dialogs.chat.defaultConversationName');
}

const toolMode = ref<WorkflowMode>('chat');

function typingPlaceholder(item: ChatItem) {
  return item.role === 'assistant' && item.status === 'generating' ? '...' : '';
}

function getMessageStatusLabel(item: ChatItem): string {
  if (item.status === 'aborted') return t('aiAssistant.dialogs.chat.aborted');
  if (item.status === 'error') return item.errorMessage || t('aiAssistant.dialogs.chat.sendFailed');
  return '';
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

function formatActionStatus(status: GoalExecutedAction['status']) {
  const labels = {
    executed: t('aiAssistant.dialogs.automation.statusLabels.executed'),
    skipped: t('aiAssistant.dialogs.automation.statusLabels.skipped'),
    failed: t('aiAssistant.dialogs.automation.statusLabels.failed'),
  } as const;
  return labels[status];
}

function formatExecutionOutcome(
  status: NonNullable<ReturnType<typeof goalExecutionSummary>>['status'],
) {
  const labels = {
    success: t('aiAssistant.dialogs.automation.outcomeLabels.success'),
    partial: t('aiAssistant.dialogs.automation.outcomeLabels.partial'),
    failed: t('aiAssistant.dialogs.automation.outcomeLabels.failed'),
  } as const;
  return labels[status];
}

function adjustComposerHeight() {
  const textarea = composerTextarea.value;
  if (!textarea) return;
  const styles = window.getComputedStyle(textarea);
  const lineHeight = Number.parseFloat(styles.lineHeight) || 24;
  const verticalPadding =
    Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
  const borderWidth =
    Number.parseFloat(styles.borderTopWidth) + Number.parseFloat(styles.borderBottomWidth);
  const minHeight = lineHeight * 2 + verticalPadding + borderWidth;
  const maxHeight = lineHeight * 5 + verticalPadding + borderWidth;
  textarea.style.height = 'auto';
  const nextHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
  textarea.style.height = `${nextHeight}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

function handleComposerInput() {
  adjustComposerHeight();
}

function handleComposerKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey) return;
  event.preventDefault();
  if (chatLoading.value || !chatMessage.value.trim() || !canSendMessage.value) return;
  void handleSendChat();
}

function openSettings() {
  void router.push('/settings');
}

// ─── Composables ───────────────────────────────────────────────────

const providerList = computed(() =>
  Array.isArray(providers.value) ? (providers.value as ProviderListItem[]) : [],
);

const aiSettings = computed(() => getCategory('ai'));
const knowledgeNoteSubpath = computed(() => aiSettings.value?.knowledgeNoteSubpath ?? '');

// Late-binding closures for cross-composable coordination.
// These are reassigned after all composables are created.
let _restoreWorkflowState: ((id: string) => void) | undefined;
let _persistWorkflowAndModel: ((id: string) => void) | undefined;

// 1. Chat session (defines chatConversationId that modelSelection needs)
const chatSession = useAIChatSession({
  service,
  getDefaultConversationName,
  restoreWorkflowState: (id) => _restoreWorkflowState?.(id),
  onConversationCreated: (id) => _persistWorkflowAndModel?.(id),
});

// 2. Model selection (uses real chatSession.chatConversationId)
const modelSelection = useAIModelSelection({
  providers: providerList,
  chatConversationId: chatSession.chatConversationId,
});

// 3. Goal workflow (uses real chatSession refs)
const goalWorkflow = useAIGoalWorkflow({
  service,
  selectedModel: modelSelection.selectedModel,
  chatLoading: chatSession.chatLoading,
  chatTimeline: chatSession.chatTimeline,
  conversationTitle: chatSession.conversationTitle,
  hasWorkflowUserMessages: chatSession.hasWorkflowUserMessages,
  buildConversationTranscript: chatSession.buildConversationTranscript,
  scrollMessagesToBottom: chatSession.scrollMessagesToBottom,
  maybeRenameCurrentConversation,
  createGoal,
  addKeyResult,
});

// 4. Note workflow (uses real chatSession refs)
const noteWorkflow = useAIKnowledgeNoteWorkflow({
  service,
  selectedModel: modelSelection.selectedModel,
  chatTimeline: chatSession.chatTimeline,
  conversationTitle: chatSession.conversationTitle,
  hasWorkflowMessages: chatSession.hasWorkflowMessages,
  knowledgeNoteSubpath,
  scrollMessagesToBottom: chatSession.scrollMessagesToBottom,
  maybeRenameCurrentConversation,
  fetchResources,
  resources,
  requestOpenResource,
});

// 5. Persistence (depends on goal/note refs)
function resetWorkflowArtifacts() {
  goalWorkflow.resetGoalArtifacts();
  noteWorkflow.resetNoteArtifacts();
}

const persistence = useAIWorkflowPersistence({
  toolMode,
  goalWorkflowStage: goalWorkflow.goalWorkflowStage,
  goalDraft: goalWorkflow.goalDraft,
  goalClarification: goalWorkflow.goalClarification,
  goalAutomationResult: goalWorkflow.goalAutomationResult,
  clarificationAnswers: goalWorkflow.clarificationAnswers,
  editableGoal: goalWorkflow.editableGoal,
  editableKeyResults: goalWorkflow.editableKeyResults,
  noteSummary: noteWorkflow.noteSummary,
  showGoalDraftEditor: goalWorkflow.showGoalDraftEditor,
  resetWorkflowArtifacts,
});

// Wire late-binding callbacks now that all composables exist
_restoreWorkflowState = persistence.restoreWorkflowState;
_persistWorkflowAndModel = (id) => {
  persistence.persistWorkflowState(id);
  modelSelection.persistSelectedModel(modelSelection.selectedModelKey.value, id);
};

// Wire persistence watcher
persistence.bindPersistenceWatcher(chatSession.chatConversationId);

// ─── Computed wiring ───────────────────────────────────────────────

const chatConversationId = chatSession.chatConversationId;

const currentConversationLabel = computed(
  () => chatSession.conversationTitle.value || getDefaultConversationName(toolMode.value),
);

const currentToolLabel = computed(() =>
  toolMode.value === 'chat'
    ? t('aiAssistant.chatPage.workflow.tools.chat')
    : t(`aiAssistant.chatPage.workflow.tools.${getToolLocaleKey(toolMode.value)}`),
);

const currentToolButtonLabel = computed(() =>
  toolMode.value === 'chat'
    ? t('aiAssistant.chatPage.workflow.toolButton')
    : currentToolLabel.value,
);

const notePreview = computed(() => {
  const content = noteWorkflow.noteSummary.value?.resource?.content;
  if (!content) return t('aiAssistant.dialogs.note.previewUnavailable');
  return content.slice(0, 280);
});

const workflowStatusText = computed(() => {
  if (toolMode.value === 'goal') {
    if (goalWorkflow.goalDraftLoading.value)
      return t('aiAssistant.dialogs.generateGoal.generating');
    if (goalWorkflow.goalWorkflowStage.value === 'plan' || goalWorkflow.automationLoading.value)
      return t('aiAssistant.dialogs.automation.planning');
    if (goalWorkflow.goalWorkflowStage.value === 'execute' || goalWorkflow.automationExecuting.value)
      return t('aiAssistant.dialogs.automation.executing');
    if (goalWorkflow.goalWorkflowStage.value === 'confirm')
      return t('aiAssistant.dialogs.automation.awaitingConfirmation');
    if (goalWorkflow.goalWorkflowStage.value === 'result') {
      if (goalWorkflow.goalExecutionSummary.value?.status === 'partial')
        return formatExecutionOutcome('partial');
      if (goalWorkflow.goalExecutionSummary.value?.status === 'failed')
        return formatExecutionOutcome('failed');
      return t('aiAssistant.dialogs.automation.executionRecorded');
    }
    if (goalWorkflow.goalWorkflowStage.value === 'clarification')
      return t('aiAssistant.chatPage.workflow.goalClarificationHint');
    if (goalWorkflow.goalWorkflowStage.value === 'draft')
      return t('aiAssistant.chatPage.workflow.goalDraftReadyHint');
    return t('aiAssistant.chatPage.workflow.goalCollectingHint');
  }
  if (toolMode.value === 'knowledge-note') {
    if (noteWorkflow.noteCreating.value) return t('aiAssistant.dialogs.note.creating');
    if (noteWorkflow.noteSummary.value)
      return t('aiAssistant.chatPage.workflow.noteCreatedHint', {
        path: noteWorkflow.noteSummary.value.resolvedPath,
      });
    return t('aiAssistant.chatPage.workflow.noteCollectingHint');
  }
  return '';
});

// ─── Template wrappers ────────────────────────────────────────────

async function selectConversation(item: { id: string; name?: string; title?: string }) {
  persistence.suspendWorkflowPersistence.value = true;
  await chatSession.selectConversation(
    item,
    service,
    modelSelection.syncSelectedModel,
    modelSelection.getPersistedModelKey,
  );
  persistence.restoreWorkflowState(item.id);
  persistence.suspendWorkflowPersistence.value = false;
}

async function deleteConversation(id: string) {
  await chatSession.deleteConversation(
    id,
    service,
    persistence.clearWorkflowState,
    modelSelection.clearConversationModelSelection,
  );
}

async function loadConversationList() {
  await chatSession.loadConversationList(service);
}

function startNewConversation(mode: WorkflowMode | string = 'chat') {
  chatSession.startNewConversation(mode);
  resetWorkflowArtifacts();
  toolMode.value = mode as WorkflowMode;
}

function exitToolMode() {
  resetWorkflowArtifacts();
  toolMode.value = 'chat';
  if (!chatConversationId.value && !chatSession.chatTimeline.value.length) {
    chatSession.conversationTitle.value = getDefaultConversationName('chat');
  }
}

async function handleSendChat() {
  await chatSession.handleSendChat(
    service,
    modelSelection.selectedModel.value,
    currentConversationLabel.value,
    adjustComposerHeight,
  );
}

async function maybeRenameCurrentConversation(name: string) {
  const nextName = name.trim();
  if (!nextName || nextName === chatSession.conversationTitle.value) return;
  chatSession.conversationTitle.value = nextName;
  if (!chatConversationId.value) return;
  try {
    await service.updateConversation(chatConversationId.value, { name: nextName });
    await loadConversationList();
  } catch (error) {
    console.warn('[AIChatView] failed to update conversation title', error);
  }
}

// ─── Aliases for template binding ─────────────────────────────────

const chatMessage = chatSession.chatMessage;
const chatLoading = chatSession.chatLoading;
const chatTimeline = chatSession.chatTimeline;
const conversationList = chatSession.conversationList;
const conversationListLoading = chatSession.conversationListLoading;
const messagesViewport = chatSession.messagesViewport;
const composerTextarea = chatSession.composerTextarea;
const canSendMessage = computed(
  () =>
    modelSelection.canSendMessage.value &&
    !chatLoading.value &&
    modelSelection.selectedModel.value !== null,
);
const selectedModelKey = modelSelection.selectedModelKey;
const modelGroups = modelSelection.modelGroups;

function selectModel(modelKey: string) {
  modelSelection.selectModel(modelKey);
}

function stopGenerating() {
  chatSession.stopGenerating();
}

// Goal workflow aliases
const goalDraftLoading = goalWorkflow.goalDraftLoading;
const goalWorkflowStage = goalWorkflow.goalWorkflowStage;
const goalDraft = goalWorkflow.goalDraft;
const goalClarification = goalWorkflow.goalClarification;
const goalAutomationResult = goalWorkflow.goalAutomationResult;
const clarificationAnswers = goalWorkflow.clarificationAnswers;
const showGoalDraftEditor = goalWorkflow.showGoalDraftEditor;
const creatingGoal = goalWorkflow.creatingGoal;
const automationLoading = goalWorkflow.automationLoading;
const automationExecuting = goalWorkflow.automationExecuting;
const editableGoal = goalWorkflow.editableGoal;
const editableKeyResults = goalWorkflow.editableKeyResults;
const canRunGoalWorkflow = goalWorkflow.canRunGoalWorkflow;
const canPlanGoalAutomation = goalWorkflow.canPlanGoalAutomation;
const goalExecutedActions = goalWorkflow.goalExecutedActions;
const goalExecutionSummary = goalWorkflow.goalExecutionSummary;
const goalExecutionRecovery = goalWorkflow.goalExecutionRecovery;
const automatedGoalId = goalWorkflow.automatedGoalId;

const generateGoalDraftFromConversation = goalWorkflow.generateGoalDraftFromConversation;
const handlePlanGoalAutomation = goalWorkflow.handlePlanGoalAutomation;
const handleExecuteGoalAutomation = goalWorkflow.handleExecuteGoalAutomation;
const openAutomatedGoal = goalWorkflow.openAutomatedGoal;
const handleCreateGoalFromDraft = goalWorkflow.handleCreateGoalFromDraft;
const addKeyResultDraft = goalWorkflow.addKeyResultDraft;
const removeKeyResultDraft = goalWorkflow.removeKeyResultDraft;
const updateKeyResultDraft = goalWorkflow.updateKeyResultDraft;
const handleUpdateGoalDraft = goalWorkflow.handleUpdateGoalDraft;
const toggleGoalDraftEditor = goalWorkflow.toggleGoalDraftEditor;

// Note workflow aliases
const noteCreating = noteWorkflow.noteCreating;
const noteSummary = noteWorkflow.noteSummary;

const createKnowledgeNoteFromConversation = noteWorkflow.createKnowledgeNoteFromConversation;
const openCreatedNote = noteWorkflow.openCreatedNote;

// ─── Lifecycle ─────────────────────────────────────────────────────

watch(
  () => chatMessage.value,
  () => {
    nextTick(() => {
      adjustComposerHeight();
    });
  },
);

watch(
  () => chatSession.chatTimeline.value.map((item) => `${item.id}:${item.content.length}`).join('|'),
  () => {
    chatSession.scrollMessagesToBottom();
  },
);

onBeforeUnmount(() => {
  chatSession.abortActiveStream();
});

onMounted(async () => {
  chatSession.resetChatSession('chat', getDefaultConversationName);
  chatSession.lastActiveConversationId.value =
    localStorage.getItem('ai:last-conversation-id') || '';

  try {
    void initRepository();
    await loadProviders();
    modelSelection.syncSelectedModel(modelSelection.getPersistedModelKey());
    await loadConversationList();

    const preferredConversation =
      chatSession.conversationList.value.find(
        (item) => item.id === chatSession.lastActiveConversationId.value,
      ) ||
      chatSession.conversationList.value[0] ||
      null;

    if (preferredConversation) {
      await selectConversation(preferredConversation);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : null;
    toast.error(
      message && message.length > 0 ? message : t('common.operationFailed'),
    );
  }

  await nextTick();
  adjustComposerHeight();
});
</script>
