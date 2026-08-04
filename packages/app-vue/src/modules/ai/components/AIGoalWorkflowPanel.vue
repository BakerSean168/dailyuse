<template>
  <!-- Goal clarification -->
  <section
    v-if="toolMode === 'goal-create' && goalClarification"
    class="rounded-3xl border bg-card p-5"
    data-testid="goal-clarification-panel"
  >
    <div class="flex flex-col gap-4">
      <div class="space-y-2">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.chatPage.workflow.goalClarificationTitle') }}
        </p>
        <p class="text-sm leading-6 text-muted-foreground">
          {{
            goalClarification.rationale || t('aiAssistant.chatPage.workflow.goalClarificationHint')
          }}
        </p>
      </div>

      <div class="space-y-4">
        <div
          v-for="(item, index) in goalClarification.questions"
          :key="`${item.question}-${index}`"
          class="rounded-2xl border bg-muted/30 p-4"
        >
          <p class="text-sm font-medium text-foreground">{{ index + 1 }}. {{ item.question }}</p>
          <p v-if="item.context" class="mt-2 text-sm leading-6 text-muted-foreground">
            {{ item.context }}
          </p>
          <textarea
            :value="clarificationAnswers[index]"
            rows="2"
            class="mt-3 block w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm leading-6 shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
            :placeholder="t('aiAssistant.chatPage.workflow.goalClarificationAnswerPlaceholder')"
            :data-testid="`goal-clarification-answer-${index}`"
            @input="updateClarificationAnswer(index, ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
      </div>
    </div>
  </section>

  <!-- Goal draft -->
  <section
    v-if="toolMode === 'goal-create' && goalDraft"
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
        @confirm="$emit('confirm')"
        @add-key-result="$emit('add-key-result')"
        @remove-key-result="(index) => $emit('remove-key-result', index)"
        @update-goal="(payload) => $emit('update-goal', payload)"
        @update-key-result="(payload) => $emit('update-key-result', payload)"
      />
    </div>
  </section>

  <!-- Goal Agent runtime -->
  <section
    v-if="toolMode === 'goal-create' && goalAgentRun"
    class="rounded-3xl border bg-card p-5"
    data-testid="goal-agent-panel"
  >
    <div class="space-y-4">
      <div class="space-y-2">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.agent.title') }}
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
            {{ goalAgentRun.run.status }}
          </span>
          <span class="rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
            {{ goalAgentRun.state.stage }}
          </span>
        </div>
      </div>

      <div
        v-if="getAgentObservabilityItems(goalAgentRun).length"
        data-testid="goal-agent-observability"
      >
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.agent.observability') }}
        </p>
        <div class="mt-2 grid gap-2 @sm/ai:grid-cols-2">
          <div
            v-for="item in getAgentObservabilityItems(goalAgentRun)"
            :key="`${item.label}-${item.value}`"
            class="rounded-2xl border bg-muted/20 p-4"
          >
            <p class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {{ item.label }}
            </p>
            <p class="mt-1 text-sm font-medium text-foreground">
              {{ item.value }}
            </p>
            <p v-if="item.detail" class="mt-1 text-xs text-muted-foreground">
              {{ item.detail }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="goalAgentRun.state.artifacts.length">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.agent.artifacts') }}
        </p>
        <div class="mt-2 space-y-2">
          <div
            v-for="artifact in goalAgentRun.state.artifacts"
            :key="artifact.artifactId"
            class="rounded-2xl border bg-muted/20 p-4"
          >
            <p class="text-sm font-medium text-foreground">
              {{ artifact.title || artifact.kind }}
            </p>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              {{ formatArtifactSummary(artifact) }}
            </p>
          </div>
        </div>
      </div>

      <AIGoalDraftEditor
        v-if="goalAgentRun.run.status === 'waiting_approval' && showGoalDraftEditor"
        data-testid="goal-agent-draft-editor"
        :goal="editableGoal"
        :key-results="editableKeyResults"
        :is-submitting="false"
        :show-confirm-action="false"
        @add-key-result="$emit('add-key-result')"
        @remove-key-result="(index) => $emit('remove-key-result', index)"
        @update-goal="(payload) => $emit('update-goal', payload)"
        @update-key-result="(payload) => $emit('update-key-result', payload)"
      />

      <div
        v-if="goalAgentRun.run.status === 'waiting_approval' && showGoalDraftEditor"
        class="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4"
        data-testid="goal-agent-supporting-drafts-editor"
      >
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {{ t('aiAssistant.goalDraft.taskTemplates') }}
            </p>
            <Button variant="outline" size="sm" @click="$emit('add-task-template')">
              {{ t('aiAssistant.goalDraft.addTaskTemplate') }}
            </Button>
          </div>

          <div v-if="editableTaskTemplates.length" class="space-y-3">
            <div
              v-for="(item, index) in editableTaskTemplates"
              :key="`task-template-${index}`"
              class="space-y-3 rounded-xl border border-border/50 bg-background/70 p-3"
              data-testid="goal-agent-task-template-editor"
            >
              <Input
                :model-value="item.name"
                :placeholder="t('aiAssistant.goalDraft.taskTemplateName')"
                @update:model-value="updateTaskTemplate(index, { name: String($event ?? '') })"
              />
              <Textarea
                class="min-h-20"
                :model-value="item.description"
                :placeholder="t('aiAssistant.goalDraft.taskTemplateDescription')"
                @update:model-value="
                  updateTaskTemplate(index, { description: String($event ?? '') })
                "
              />
              <div class="grid gap-3 @sm/ai:grid-cols-3">
                <div class="grid gap-2">
                  <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {{ t('aiAssistant.goalDraft.cadence') }}
                  </p>
                  <Select
                    :model-value="item.cadence"
                    @update:model-value="
                      updateTaskTemplate(index, {
                        cadence: $event as EditableGoalTaskTemplate['cadence'],
                      })
                    "
                  >
                    <SelectTrigger>
                      <SelectValue :placeholder="t('aiAssistant.goalDraft.selectCadence')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="option in cadenceOptions"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="grid gap-2">
                  <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {{ t('aiAssistant.goalDraft.reminderTime') }}
                  </p>
                  <Input
                    type="time"
                    :model-value="item.timeOfDay"
                    data-testid="goal-agent-reminder-time"
                    @update:model-value="updateReminder(index, { timeOfDay: String($event ?? '') })"
                  />
                </div>

                <div class="grid gap-2">
                  <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {{ t('aiAssistant.goalDraft.importance') }}
                  </p>
                  <Select
                    :model-value="item.importance"
                    @update:model-value="
                      updateTaskTemplate(index, {
                        importance: $event as EditableGoalTaskTemplate['importance'],
                      })
                    "
                  >
                    <SelectTrigger>
                      <SelectValue :placeholder="t('aiAssistant.goalDraft.selectImportance')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="option in importanceOptions"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button variant="outline" @click="$emit('remove-task-template', index)">
                {{ t('aiAssistant.goalDraft.removeTaskTemplate') }}
              </Button>
            </div>
          </div>
          <p v-else class="text-sm leading-6 text-muted-foreground">
            {{ t('aiAssistant.goalDraft.noTaskTemplates') }}
          </p>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {{ t('aiAssistant.goalDraft.reminders') }}
            </p>
            <Button variant="outline" size="sm" @click="$emit('add-reminder')">
              {{ t('aiAssistant.goalDraft.addReminder') }}
            </Button>
          </div>

          <div v-if="editableReminders.length" class="space-y-3">
            <div
              v-for="(item, index) in editableReminders"
              :key="`reminder-${index}`"
              class="space-y-3 rounded-xl border border-border/50 bg-background/70 p-3"
              data-testid="goal-agent-reminder-editor"
            >
              <Input
                :model-value="item.title"
                :placeholder="t('aiAssistant.goalDraft.reminderTitle')"
                @update:model-value="updateReminder(index, { title: String($event ?? '') })"
              />
              <Textarea
                class="min-h-20"
                :model-value="item.description"
                :placeholder="t('aiAssistant.goalDraft.reminderDescription')"
                @update:model-value="updateReminder(index, { description: String($event ?? '') })"
              />
              <div class="grid gap-3 @sm/ai:grid-cols-2">
                <div class="grid gap-2">
                  <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {{ t('aiAssistant.goalDraft.cadence') }}
                  </p>
                  <Select
                    :model-value="item.cadence"
                    @update:model-value="
                      updateReminder(index, {
                        cadence: $event as EditableGoalReminder['cadence'],
                      })
                    "
                  >
                    <SelectTrigger>
                      <SelectValue :placeholder="t('aiAssistant.goalDraft.selectCadence')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="option in cadenceOptions"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="grid gap-2">
                  <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {{ t('aiAssistant.goalDraft.importance') }}
                  </p>
                  <Select
                    :model-value="item.importance"
                    @update:model-value="
                      updateReminder(index, {
                        importance: $event as EditableGoalReminder['importance'],
                      })
                    "
                  >
                    <SelectTrigger>
                      <SelectValue :placeholder="t('aiAssistant.goalDraft.selectImportance')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="option in importanceOptions"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button variant="outline" @click="$emit('remove-reminder', index)">
                {{ t('aiAssistant.goalDraft.removeReminder') }}
              </Button>
            </div>
          </div>
          <p v-else class="text-sm leading-6 text-muted-foreground">
            {{ t('aiAssistant.goalDraft.noReminders') }}
          </p>
        </div>
      </div>

      <div
        v-if="getGoalAgentActionPlanWarnings(goalAgentRun).length"
        data-testid="goal-agent-warnings"
      >
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.agent.warnings') }}
        </p>
        <div class="mt-2 space-y-2">
          <div
            v-for="(warning, index) in getGoalAgentActionPlanWarnings(goalAgentRun)"
            :key="`${warning}-${index}`"
            class="rounded-2xl border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground"
          >
            {{ warning }}
          </div>
        </div>
      </div>

      <div v-if="getRecentAgentEvents(goalAgentRun).length">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.agent.events') }}
        </p>
        <div class="mt-2 space-y-2">
          <div
            v-for="event in getRecentAgentEvents(goalAgentRun)"
            :key="event.eventId"
            class="rounded-2xl border bg-muted/20 px-4 py-3"
          >
            <p class="text-sm font-medium text-foreground">
              {{ formatAgentEvent(event) }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="goalAgentPendingActions.length">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.agent.pendingActions') }}
        </p>
        <div class="mt-2 space-y-2">
          <div
            v-for="(action, index) in goalAgentPendingActions"
            :key="`${action.tool}-${action.index}-${index}`"
            class="rounded-2xl border bg-muted/20 p-4"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-foreground"
                data-testid="goal-agent-pending-action-number"
              >
                {{ formatAgentActionNumber(index) }}
              </span>
              <p class="text-sm font-medium text-foreground">
                {{ formatAgentTool(action.tool) }}
              </p>
            </div>
            <p v-if="action.rationale" class="mt-2 text-sm leading-6 text-muted-foreground">
              {{ action.rationale }}
            </p>
            <p
              class="mt-2 text-xs leading-5 text-muted-foreground"
              data-testid="goal-agent-pending-action-dependencies"
            >
              {{ formatAgentActionDependencies(action, goalAgentPendingActions) }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="goalAgentExecutedActions.length">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.automation.executionStatus') }}
        </p>
        <p
          class="mt-2 text-sm leading-6 text-muted-foreground"
          data-testid="goal-agent-execution-summary"
        >
          {{ formatAgentExecutionSummary(goalAgentExecutedActions) }}
        </p>
      </div>

      <div v-if="goalAgentExecutedActions.length">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.agent.executedActions') }}
        </p>
        <div class="mt-2 space-y-2">
          <div
            v-for="(action, index) in goalAgentExecutedActions"
            :key="`${action.tool}-${action.status}-${index}`"
            class="rounded-2xl border bg-muted/20 p-4"
          >
            <p class="text-sm font-medium text-foreground">
              {{ formatAgentTool(action.tool) }} · {{ formatActionStatus(action.status) }}
            </p>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              {{ action.message }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="getAgentRecoverySuggestions(goalAgentExecutedActions).length">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.automation.recoveryTitle') }}
        </p>
        <p class="mt-2 text-sm leading-6 text-foreground">
          {{ t('aiAssistant.dialogs.automation.recoveryRetryReady') }}
        </p>
        <div class="mt-2 space-y-2" data-testid="goal-agent-recovery">
          <p class="text-sm leading-6 text-muted-foreground">
            {{ t('aiAssistant.dialogs.automation.recoverySuggestions') }}
          </p>
          <div
            v-for="(suggestion, index) in getAgentRecoverySuggestions(goalAgentExecutedActions)"
            :key="`${suggestion}-${index}`"
            class="rounded-2xl border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground"
          >
            {{ suggestion }}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Goal automation result -->
  <section
    v-if="toolMode === 'goal-create' && goalAutomationResult"
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
        <p v-if="goalExecutionSummary" class="mt-2 text-sm leading-6 text-muted-foreground">
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
        v-if="
          goalExecutionRecovery &&
          (goalExecutionRecovery.canRetry || goalExecutionRecovery.suggestions.length)
        "
      >
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.automation.recoveryTitle') }}
        </p>
        <p v-if="goalExecutionRecovery.canRetry" class="mt-2 text-sm leading-6 text-foreground">
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

  <!-- Knowledge Q&A answer -->
  <section
    v-if="toolMode === 'knowledge-qa' && knowledgeAnswer"
    class="rounded-3xl border bg-card p-5"
    data-testid="knowledge-answer-panel"
  >
    <div class="space-y-4">
      <div class="space-y-2">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.knowledge.answer') }}
        </p>
        <span
          class="inline-flex rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground"
        >
          {{
            knowledgeAnswer.evidenceStatus === 'grounded'
              ? t('aiAssistant.dialogs.knowledge.grounded')
              : t('aiAssistant.dialogs.knowledge.insufficientEvidence')
          }}
        </span>
      </div>

      <div class="rounded-2xl border bg-muted/30 p-4">
        <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.knowledge.question') }}
        </p>
        <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
          {{ knowledgeAnswer.question }}
        </p>
      </div>

      <div>
        <p class="whitespace-pre-wrap text-sm leading-6 text-foreground">
          {{ knowledgeAnswer.answer }}
        </p>
        <p class="mt-3 text-xs text-muted-foreground">
          {{
            t('aiAssistant.dialogs.knowledge.matchedResources', {
              count: knowledgeAnswer.matchedResourceCount,
              ms: knowledgeAnswer.processingTimeMs,
            })
          }}
        </p>
      </div>

      <div v-if="getKnowledgeRelatedNotes(knowledgeAnswer).length">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.knowledge.relatedNotes') }}
        </p>
        <div class="mt-2 grid gap-2 @sm/ai:grid-cols-2">
          <div
            v-for="note in getKnowledgeRelatedNotes(knowledgeAnswer)"
            :key="note.resourceId"
            class="rounded-2xl border bg-muted/20 p-4"
          >
            <div class="flex h-full flex-col gap-3">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-foreground">
                  {{ note.title || note.resourcePath }}
                </p>
                <p class="mt-1 break-words text-xs text-muted-foreground">
                  {{ note.resourcePath }}
                </p>
                <p
                  v-if="note.excerpt"
                  class="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground"
                >
                  {{ note.excerpt }}
                </p>
              </div>
              <Button
                variant="outline"
                class="self-start"
                data-testid="knowledge-related-note-open"
                @click="$emit('open-knowledge-citation', note.resourceId)"
              >
                {{ t('aiAssistant.dialogs.knowledge.openCitation') }}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="knowledgeAnswer.citations.length">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.knowledge.citations') }}
        </p>
        <div class="mt-2 space-y-2">
          <div
            v-for="citation in knowledgeAnswer.citations"
            :key="`${citation.resourceId}-${citation.chunkIndex}`"
            class="rounded-2xl border bg-muted/20 p-4"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <p class="text-sm font-medium text-foreground">
                  {{ citation.title || citation.resourcePath }}
                </p>
                <p class="mt-1 break-words text-xs text-muted-foreground">
                  {{ citation.resourcePath }}
                </p>
              </div>
              <Button
                variant="outline"
                class="sm:shrink-0"
                data-testid="knowledge-citation-open"
                @click="$emit('open-knowledge-citation', citation.resourceId)"
              >
                {{ t('aiAssistant.dialogs.knowledge.openCitation') }}
              </Button>
            </div>
            <p class="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {{ citation.excerpt }}
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="getAgentObservabilityItems(knowledgeQaAgentRun).length"
        data-testid="knowledge-qa-agent-observability"
      >
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.agent.observability') }}
        </p>
        <div class="mt-2 grid gap-2 @sm/ai:grid-cols-2">
          <div
            v-for="item in getAgentObservabilityItems(knowledgeQaAgentRun)"
            :key="`${item.label}-${item.value}`"
            class="rounded-2xl border bg-muted/20 p-4"
          >
            <p class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {{ item.label }}
            </p>
            <p class="mt-1 text-sm font-medium text-foreground">
              {{ item.value }}
            </p>
            <p v-if="item.detail" class="mt-1 text-xs text-muted-foreground">
              {{ item.detail }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="getRecentAgentEvents(knowledgeQaAgentRun).length">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.agent.events') }}
        </p>
        <div class="mt-2 space-y-2">
          <div
            v-for="event in getRecentAgentEvents(knowledgeQaAgentRun)"
            :key="event.eventId"
            class="rounded-2xl border bg-muted/20 px-4 py-3"
          >
            <p class="text-sm font-medium text-foreground">
              {{ formatAgentEvent(event) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Knowledge note Agent draft -->
  <section
    v-if="
      (toolMode === 'knowledge-generate' || toolMode === 'knowledge-qa') &&
      noteAgentRun &&
      !noteSummary
    "
    class="rounded-3xl border bg-card p-5"
    data-testid="knowledge-note-agent-panel"
  >
    <div class="space-y-4">
      <div class="space-y-2">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.note.draftTitle') }}
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
            {{ noteAgentRun.run.status }}
          </span>
          <span class="rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
            {{ noteAgentRun.state.stage }}
          </span>
        </div>
      </div>

      <div
        v-if="getAgentObservabilityItems(noteAgentRun).length"
        data-testid="note-agent-observability"
      >
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.agent.observability') }}
        </p>
        <div class="mt-2 grid gap-2 @sm/ai:grid-cols-2">
          <div
            v-for="item in getAgentObservabilityItems(noteAgentRun)"
            :key="`${item.label}-${item.value}`"
            class="rounded-2xl border bg-muted/20 p-4"
          >
            <p class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {{ item.label }}
            </p>
            <p class="mt-1 text-sm font-medium text-foreground">
              {{ item.value }}
            </p>
            <p v-if="item.detail" class="mt-1 text-xs text-muted-foreground">
              {{ item.detail }}
            </p>
          </div>
        </div>
      </div>

      <div
        v-for="artifact in noteAgentRun.state.artifacts"
        :key="artifact.artifactId"
        class="rounded-2xl border bg-muted/20 p-4"
      >
        <p class="text-sm font-medium text-foreground">
          {{ artifact.title || artifact.kind }}
        </p>
        <p class="mt-2 line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {{ formatArtifactSummary(artifact) }}
        </p>
        <div
          v-if="getNoteArtifactMetadata(artifact).length"
          class="mt-3 grid gap-2 @sm/ai:grid-cols-2"
        >
          <div
            v-for="item in getNoteArtifactMetadata(artifact)"
            :key="item.label"
            class="rounded-xl border bg-background/60 px-3 py-2"
          >
            <p class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {{ item.label }}
            </p>
            <p
              class="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm font-medium text-foreground"
            >
              {{ item.value }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="getRecentAgentEvents(noteAgentRun).length">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.agent.events') }}
        </p>
        <div class="mt-2 space-y-2">
          <div
            v-for="event in getRecentAgentEvents(noteAgentRun)"
            :key="event.eventId"
            class="rounded-2xl border bg-muted/20 px-4 py-3"
          >
            <p class="text-sm font-medium text-foreground">
              {{ formatAgentEvent(event) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Knowledge note summary -->
  <section
    v-if="(toolMode === 'knowledge-generate' || toolMode === 'knowledge-qa') && noteSummary"
    class="rounded-3xl border bg-card p-5"
    data-testid="knowledge-note-summary-panel"
  >
    <div class="space-y-4">
      <div>
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.chatPage.workflow.noteCreatedTitle') }}
        </p>
        <h2 class="mt-2 text-lg font-semibold text-foreground">
          {{ noteSummary.note?.name || t('aiAssistant.dialogs.note.newNoteCreated') }}
        </h2>
      </div>

      <div class="grid gap-3 @sm/ai:grid-cols-2 @lg/ai:grid-cols-3">
        <div class="rounded-2xl border bg-muted/30 p-4">
          <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {{ t('aiAssistant.dialogs.note.savedTo') }}
          </p>
          <p class="mt-2 break-words text-sm font-medium text-foreground">
            {{ noteSummary.resolvedPath }}
          </p>
        </div>
        <div v-if="noteSummary.indexStatus" class="rounded-2xl border bg-muted/30 p-4">
          <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {{ t('aiAssistant.dialogs.note.indexStatus') }}
          </p>
          <p class="mt-2 text-sm font-medium text-foreground">
            {{ noteSummary.indexStatus }}
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
        <Button variant="outline" @click="$emit('open-created-note')">
          {{ t('aiAssistant.chatPage.workflow.openCreatedNote') }}
        </Button>
        <Button variant="ghost" @click="$emit('start-new-conversation', 'knowledge-generate')">
          {{ t('aiAssistant.chatPage.workflow.startAnotherNote') }}
        </Button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type {
  AgentAction,
  AgentArtifact,
  AgentExecutedAction,
  AgentRunResult,
  GoalClarificationDTO,
  GoalWorkflowDraftResultDTO,
} from '@memoflow/contracts/ai';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatLangGraphVendorDiagnosticEventLabel } from '../composables/hostLangGraphUiBoundary';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@memoflow/ui-vue-shadcn';
import AIGoalDraftEditor from './AIGoalDraftEditor.vue';
import type {
  EditableGoal,
  EditableKeyResult,
  EditableGoalReminder,
  EditableGoalTaskTemplate,
  GoalAutomationResult,
  GoalExecutedAction,
  KnowledgeAnswer,
  NoteSummary,
  WorkflowMode,
} from '../composables';

const props = defineProps<{
  toolMode: WorkflowMode;
  goalClarification: GoalClarificationDTO | null;
  goalDraft: GoalWorkflowDraftResultDTO | null;
  goalAutomationResult: GoalAutomationResult | null;
  goalAgentRun: AgentRunResult | null;
  goalAgentPendingActions: AgentAction[];
  goalAgentExecutedActions: AgentExecutedAction[];
  clarificationAnswers: string[];
  editableGoal: EditableGoal;
  editableKeyResults: EditableKeyResult[];
  editableTaskTemplates: EditableGoalTaskTemplate[];
  editableReminders: EditableGoalReminder[];
  showGoalDraftEditor: boolean;
  creatingGoal: boolean;
  goalExecutedActions: GoalExecutedAction[];
  goalExecutionSummary: {
    status: 'success' | 'partial' | 'failed';
    executedCount: number;
    skippedCount: number;
    failedCount: number;
  } | null;
  goalExecutionRecovery: { canRetry: boolean; suggestions: string[] } | null;
  knowledgeAnswer: KnowledgeAnswer | null;
  knowledgeQaAgentRun: AgentRunResult | null;
  noteAgentRun: AgentRunResult | null;
  noteSummary: NoteSummary | null;
  notePreview: string;
  formatAutomationTool: (tool: GoalAutomationResult['actions'][number]['tool']) => string;
  formatAgentTool: (tool: AgentAction['tool'] | string) => string;
  formatActionStatus: (status: GoalExecutedAction['status']) => string;
  formatExecutionOutcome: (status: 'success' | 'partial' | 'failed') => string;
}>();

const emit = defineEmits<{
  'update:clarificationAnswers': [answers: string[]];
  confirm: [];
  'add-key-result': [];
  'remove-key-result': [index: number];
  'update-goal': [payload: EditableGoal];
  'update-key-result': [payload: { index: number; value: EditableKeyResult }];
  'add-task-template': [];
  'remove-task-template': [index: number];
  'update-task-template': [payload: { index: number; value: EditableGoalTaskTemplate }];
  'add-reminder': [];
  'remove-reminder': [index: number];
  'update-reminder': [payload: { index: number; value: EditableGoalReminder }];
  'open-knowledge-citation': [resourceId: string];
  'open-created-note': [];
  'start-new-conversation': [mode: string];
}>();

const { t } = useI18n();

const MAX_AGENT_EVENTS = 6;

type AgentRuntimeRun = AgentRunResult;
type AgentRuntimeEvent = AgentRuntimeRun['events'][number];
type KnowledgeRelatedNote = NonNullable<KnowledgeAnswer['relatedNotes']>[number];
type AgentObservabilityItem = {
  label: string;
  value: string;
  detail?: string;
};

const importanceOptions = computed(() => [
  { value: 'Vital', label: t('aiAssistant.goalDraft.importanceLevels.vital') },
  { value: 'Important', label: t('aiAssistant.goalDraft.importanceLevels.important') },
  { value: 'Moderate', label: t('aiAssistant.goalDraft.importanceLevels.moderate') },
  { value: 'Minor', label: t('aiAssistant.goalDraft.importanceLevels.minor') },
  { value: 'Trivial', label: t('aiAssistant.goalDraft.importanceLevels.trivial') },
]);

const cadenceOptions = computed(() => [
  { value: 'daily', label: t('aiAssistant.goalDraft.cadenceDaily') },
  { value: 'weekly', label: t('aiAssistant.goalDraft.cadenceWeekly') },
  { value: 'once', label: t('aiAssistant.goalDraft.cadenceOnce') },
]);

function updateClarificationAnswer(index: number, value: string) {
  const next = [...props.clarificationAnswers];
  next[index] = value;
  emit('update:clarificationAnswers', next);
}

function updateTaskTemplate(index: number, patch: Partial<EditableGoalTaskTemplate>) {
  emit('update-task-template', {
    index,
    value: {
      ...props.editableTaskTemplates[index],
      ...patch,
    },
  });
}

function updateReminder(index: number, patch: Partial<EditableGoalReminder>) {
  emit('update-reminder', {
    index,
    value: {
      ...props.editableReminders[index],
      ...patch,
    },
  });
}

function formatArtifactSummary(artifact: AgentArtifact | AgentArtifact): string {
  const data = artifact.data;
  if ('markdown' in data && typeof data.markdown === 'string') return data.markdown;
  if ('summary' in data && typeof data.summary === 'string') return data.summary;
  if ('description' in data && typeof data.description === 'string') return data.description;
  if ('topic' in data && typeof data.topic === 'string') return data.topic;
  if ('title' in data && typeof data.title === 'string') return data.title;
  return artifact.kind;
}

function getGoalAgentActionPlanWarnings(run: AgentRunResult | null): string[] {
  const data = run?.state.artifacts.find((artifact) => artifact.kind === 'action_plan')?.data;
  const warnings = data?.warnings;
  if (!Array.isArray(warnings)) return [];
  return warnings
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function getRecentAgentEvents(run: AgentRuntimeRun | null): AgentRuntimeEvent[] {
  return run?.events.slice(-MAX_AGENT_EVENTS) ?? [];
}

function getAgentEventDataString(event: AgentRuntimeEvent, key: string): string {
  const value = event.data[key];
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function formatAgentEvent(event: AgentRuntimeEvent): string {
  // Residual 415: diagnostic presentation only — never show raw LangGraph node.* types.
  const detail = [
    getAgentEventDataString(event, 'node'),
    getAgentEventDataString(event, 'tool'),
    getAgentEventDataString(event, 'kind'),
    getAgentEventDataString(event, 'status'),
  ].find(Boolean);
  return formatLangGraphVendorDiagnosticEventLabel({
    type: event.type,
    detail,
    labels: {
      workflow_step_started: t('aiAssistant.dialogs.agent.diagnosticWorkflowStepStarted'),
      workflow_step_completed: t('aiAssistant.dialogs.agent.diagnosticWorkflowStepCompleted'),
      tool_completed: t('aiAssistant.dialogs.agent.diagnosticToolCompleted'),
      checkpoint: t('aiAssistant.dialogs.agent.diagnosticCheckpoint'),
      vendor_diagnostic: t('aiAssistant.dialogs.agent.diagnosticVendor'),
      unknown: t('aiAssistant.dialogs.agent.diagnosticRuntimeEvent'),
    },
  });
}

function formatAgentActionNumber(index: number): string {
  return t('aiAssistant.dialogs.agent.actionNumber', { number: index + 1 });
}

function formatAgentActionDependencies(action: AgentAction, actions: AgentAction[]): string {
  const dependencyLabels = action.dependsOn
    .map((dependencyIndex) => {
      const dependency = actions[dependencyIndex];
      if (!dependency) {
        return t('aiAssistant.dialogs.agent.unknownAction', {
          number: dependencyIndex + 1,
        });
      }
      return t('aiAssistant.dialogs.agent.actionDependencyLabel', {
        number: dependencyIndex + 1,
        tool: props.formatAgentTool(dependency.tool),
      });
    })
    .filter(Boolean);

  if (!dependencyLabels.length) {
    return t('aiAssistant.dialogs.agent.noActionDependencies');
  }
  return t('aiAssistant.dialogs.agent.actionDependsOn', {
    actions: dependencyLabels.join(', '),
  });
}

function getAgentEventDataNumber(event: AgentRuntimeEvent, key: string): number | null {
  const value = event.data[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Soft residual 1243: AI formatDurationMs — ms/sec i18n with toFixed(1); not schedule.presentation keys.
 * Similar ms/sec shape to Residual 1243 schedule export but AI agent i18n + 1 decimal (no force-merge).
 */
function formatDurationMs(ms: number): string {
  if (ms < 1000) {
    return t('aiAssistant.dialogs.agent.durationMs', { ms });
  }
  return t('aiAssistant.dialogs.agent.durationSec', {
    sec: (ms / 1000).toFixed(1),
  });
}

function formatAgentUsage(run: AgentRuntimeRun): string {
  const usage = run.state.usage;
  const parts = [
    typeof usage.promptTokens === 'number'
      ? t('aiAssistant.dialogs.agent.promptTokens', { count: usage.promptTokens })
      : '',
    typeof usage.completionTokens === 'number'
      ? t('aiAssistant.dialogs.agent.completionTokens', { count: usage.completionTokens })
      : '',
    typeof usage.totalTokens === 'number'
      ? t('aiAssistant.dialogs.agent.totalTokens', { count: usage.totalTokens })
      : '',
  ].filter(Boolean);
  return parts.join(' · ');
}

function getAgentObservabilityItems(run: AgentRuntimeRun | null): AgentObservabilityItem[] {
  if (!run) return [];

  const items: AgentObservabilityItem[] = [];
  const usage = formatAgentUsage(run);
  if (usage) {
    items.push({
      label: t('aiAssistant.dialogs.agent.tokenUsage'),
      value: usage,
    });
  }

  for (const event of run.events) {
    if (event.type !== 'node.completed' && event.type !== 'tool.completed') continue;
    const durationMs = getAgentEventDataNumber(event, 'durationMs');
    if (durationMs === null) continue;
    items.push({
      label:
        event.type === 'tool.completed'
          ? t('aiAssistant.dialogs.agent.toolTiming')
          : t('aiAssistant.dialogs.agent.diagnosticWorkflowStepTiming'),
      value: formatDurationMs(durationMs),
      detail: formatAgentEvent(event),
    });
  }

  return items.slice(-6);
}

function getAgentExecutionSummary(actions: AgentExecutedAction[]) {
  const executedCount = actions.filter((action) => action.status === 'executed').length;
  const skippedCount = actions.filter((action) => action.status === 'skipped').length;
  const failedCount = actions.filter((action) => action.status === 'failed').length;
  let status: 'success' | 'partial' | 'failed' = 'failed';
  if (failedCount === 0) {
    status = 'success';
  } else if (executedCount > 0 || skippedCount > 0) {
    status = 'partial';
  }

  return {
    status,
    executedCount,
    skippedCount,
    failedCount,
  } as const;
}

function formatAgentExecutionSummary(actions: AgentExecutedAction[]): string {
  const summary = getAgentExecutionSummary(actions);
  return t('aiAssistant.dialogs.automation.executionSummaryText', {
    status: props.formatExecutionOutcome(summary.status),
    executed: summary.executedCount,
    skipped: summary.skippedCount,
    failed: summary.failedCount,
  });
}

function getAgentRecoverySuggestions(actions: AgentExecutedAction[]): string[] {
  return actions
    .filter((action) => action.status === 'failed' || action.status === 'skipped')
    .map((action) => `${props.formatAgentTool(action.tool)}: ${action.message}`);
}

function getKnowledgeRelatedNotes(answer: KnowledgeAnswer | null): KnowledgeRelatedNote[] {
  if (!answer) return [];
  if (answer.relatedNotes?.length) return answer.relatedNotes;

  const notesByResourceId = new Map<string, KnowledgeRelatedNote>();
  for (const citation of answer.citations) {
    if (notesByResourceId.has(citation.resourceId)) continue;
    notesByResourceId.set(citation.resourceId, {
      resourceId: citation.resourceId,
      resourcePath: citation.resourcePath,
      title: citation.title,
      excerpt: citation.excerpt,
      score: citation.score,
    });
  }
  return [...notesByResourceId.values()];
}

function getArtifactDataString(artifact: AgentArtifact, key: string): string {
  const value = artifact.data[key];
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function hasArtifactDataKey(artifact: AgentArtifact, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(artifact.data, key);
}

function getArtifactTags(artifact: AgentArtifact): string {
  const value = artifact.data.tags;
  if (!Array.isArray(value)) return '';
  const tags = value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
  return tags.length ? tags.join(', ') : t('common.none');
}

function getNoteArtifactMetadata(artifact: AgentArtifact) {
  return [
    {
      label: t('aiAssistant.dialogs.note.savePath'),
      value: getArtifactDataString(artifact, 'targetSubpath'),
    },
    {
      label: t('aiAssistant.dialogs.note.tags'),
      value: hasArtifactDataKey(artifact, 'tags') ? getArtifactTags(artifact) : '',
    },
    {
      label: t('aiAssistant.dialogs.note.duplicateRisk'),
      value: getArtifactDataString(artifact, 'duplicateRisk'),
    },
    {
      label: t('aiAssistant.dialogs.note.indexStatus'),
      value: getArtifactDataString(artifact, 'indexStatus'),
    },
    {
      label: t('aiAssistant.dialogs.note.source'),
      value: getArtifactDataString(artifact, 'source'),
    },
  ].filter((item) => item.value);
}
</script>
