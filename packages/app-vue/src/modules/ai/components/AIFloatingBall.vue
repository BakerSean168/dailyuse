<template>
  <div
    v-if="aiEnabled && showFloatingBall"
    class="fixed bottom-6 right-6 z-[11000] flex flex-col items-end gap-3"
  >
    <div
      v-if="open"
      class="w-[24rem] rounded-[1.5rem] border border-border/70 bg-background/95 p-4 shadow-2xl backdrop-blur"
    >
      <div class="mb-4 flex items-start justify-between gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary"
            >
              <Bot class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-sm font-semibold">AI Assistant</h3>
              <p class="text-xs text-muted-foreground">
                Goal, chat, knowledge, analytics, and automation tools.
              </p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="open = false">
          <X class="h-4 w-4" />
        </Button>
      </div>

      <div class="mb-4 grid gap-2 sm:grid-cols-2">
        <div class="rounded-2xl border border-border/60 bg-muted/30 p-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Provider</p>
          <p class="mt-1 text-sm font-medium">{{ activeProviderName }}</p>
          <p class="mt-1 text-xs text-muted-foreground">{{ providerSummaryText }}</p>
        </div>
        <div class="rounded-2xl border border-border/60 bg-muted/30 p-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Notes Path</p>
          <p class="mt-1 text-sm font-medium">{{ resolvedNotePath }}</p>
          <p class="mt-1 text-xs text-muted-foreground">New AI notes are saved here by default.</p>
        </div>
      </div>

      <div
        v-if="!hasProviders"
        class="mb-4 rounded-2xl border border-amber-300/60 bg-amber-50/80 p-3 text-sm text-amber-900"
      >
        Configure an OpenAI-compatible provider in Settings before using AI actions.
      </div>
      <div
        v-if="advancedFeatureNotice"
        class="mb-4 rounded-2xl border border-sky-300/60 bg-sky-50/80 p-3 text-sm text-sky-900"
      >
        {{ advancedFeatureNotice }}
      </div>
      <div
        v-if="knowledgeIndexNotice"
        class="mb-4 rounded-2xl border border-emerald-300/60 bg-emerald-50/80 p-3 text-sm text-emerald-950"
      >
        {{ knowledgeIndexNotice }}
      </div>

      <div class="space-y-2">
        <Button
          class="w-full justify-start rounded-xl"
          variant="outline"
          @click="openGoalDialog = true"
        >
          <Sparkles class="mr-2 h-4 w-4" />
          Generate Goal
        </Button>
        <Button
          class="w-full justify-start rounded-xl"
          variant="outline"
          :disabled="!canUseGoalAutomation"
          @click="openAutomationDialog = true"
        >
          <Sparkles class="mr-2 h-4 w-4" />
          Automate Goal Setup
        </Button>
        <Button
          class="w-full justify-start rounded-xl"
          variant="outline"
          @click="handleOpenChatDialog"
        >
          <MessageCircle class="mr-2 h-4 w-4" />
          AI Chat
        </Button>
        <Button
          class="w-full justify-start rounded-xl"
          variant="outline"
          @click="openNoteDialog = true"
        >
          <NotebookPen class="mr-2 h-4 w-4" />
          Create Knowledge Note
        </Button>
        <Button
          class="w-full justify-start rounded-xl"
          variant="outline"
          :disabled="!canUseKnowledgeExpansion"
          @click="openKnowledgeExpansionDialog = true"
        >
          <NotebookPen class="mr-2 h-4 w-4" />
          Expand Draft With Knowledge
        </Button>
        <Button
          class="w-full justify-start rounded-xl"
          variant="outline"
          :disabled="!canUseKnowledgeQuery"
          @click="openKnowledgeDialog = true"
        >
          <Search class="mr-2 h-4 w-4" />
          Ask Knowledge Base
        </Button>
        <Button
          class="w-full justify-start rounded-xl"
          variant="outline"
          :disabled="!canUseAnalyticsQuery"
          @click="openAnalyticsDialog = true"
        >
          <BarChart3 class="mr-2 h-4 w-4" />
          Ask Analytics
        </Button>
        <Button
          class="w-full justify-start rounded-xl"
          variant="outline"
          :disabled="!canUseEvaluationReports"
          @click="handleOpenEvaluationDialog"
        >
          <BarChart3 class="mr-2 h-4 w-4" />
          View Quality Reports
        </Button>
      </div>
    </div>

    <Button class="h-14 w-14 rounded-full shadow-xl" size="icon" @click="togglePanel">
      <Bot class="h-6 w-6" />
    </Button>

    <Dialog :open="openGoalDialog" @update:open="openGoalDialog = $event">
      <DialogContent class="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generate Goal</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <div class="space-y-3">
            <Textarea
              v-model="goalIdea"
              class="min-h-44"
              placeholder="Describe the outcome you want to achieve, the context, and what success looks like..."
            />
            <Button
              class="w-full"
              :disabled="goalLoading || goalIdea.trim().length < 10 || !hasProviders"
              @click="handleGenerateGoal"
            >
              {{ goalLoading ? 'Generating...' : 'Generate Goal Draft' }}
            </Button>
          </div>

          <AIGoalDraftEditor
            :goal="editableGoal"
            :key-results="editableKeyResults"
            :is-submitting="creatingGoal"
            @confirm="handleCreateGoalFromDraft"
            @add-key-result="addKeyResult"
            @remove-key-result="removeKeyResult"
            @update-goal="editableGoal = $event"
          />
        </div>
      </DialogContent>
    </Dialog>

    <Dialog :open="openAutomationDialog" @update:open="openAutomationDialog = $event">
      <DialogContent class="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Automate Goal Setup</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div class="space-y-3">
            <Textarea
              v-model="automationIdea"
              class="min-h-44"
              placeholder="Describe the outcome you want, the likely milestones, and what task setup should be created..."
            />
            <Button
              class="w-full"
              :disabled="automationLoading || automationIdea.trim().length < 10 || !canUseGoalAutomation"
              @click="handlePlanAutomation"
            >
              {{ automationLoading ? 'Planning...' : 'Plan Automation' }}
            </Button>
            <Button
              v-if="automationResult?.requiresConfirmation && !automationResult.executedActions?.length"
              class="w-full"
              variant="outline"
              :disabled="automationExecuting"
              @click="handleExecuteAutomation"
            >
              {{ automationExecuting ? 'Executing...' : 'Confirm And Execute' }}
            </Button>
            <Button
              v-if="automatedGoalId"
              class="w-full"
              variant="outline"
              @click="openAutomatedGoal"
            >
              Open Created Goal
            </Button>
          </div>

          <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
            <div v-if="automationResult" class="space-y-4">
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Summary</p>
                <p class="mt-2 text-sm leading-6">{{ automationResult.summary }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Goal</p>
                <p class="mt-2 text-sm font-medium">{{ automationResult.plan.goal.title }}</p>
                <p class="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {{ automationResult.plan.goal.description }}
                </p>
              </div>
              <div v-if="automationResult.actions.length">
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Actions</p>
                <div class="mt-2 space-y-2">
                  <div
                    v-for="(action, index) in automationResult.actions"
                    :key="`${action.tool}-${index}`"
                    class="rounded-xl border border-border/60 bg-muted/20 p-3"
                  >
                    <p class="text-sm font-medium">{{ formatAutomationTool(action.tool) }}</p>
                    <p v-if="action.rationale" class="mt-1 text-xs text-muted-foreground">
                      {{ action.rationale }}
                    </p>
                  </div>
                </div>
              </div>
              <div v-if="automationResult.executedActions?.length">
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Execution Result
                </p>
                <div class="mt-2 space-y-2">
                  <div
                    v-for="(action, index) in automationResult.executedActions"
                    :key="`${action.tool}-${action.status}-${index}`"
                    class="rounded-xl border border-border/60 bg-muted/20 p-3"
                  >
                    <p class="text-sm font-medium">
                      {{ formatAutomationTool(action.tool) }} · {{ formatActionStatus(action.status) }}
                    </p>
                    <p class="mt-1 text-xs text-muted-foreground">{{ action.message }}</p>
                  </div>
                </div>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ automationResult.processingTimeMs }} ms ·
                {{
                  automationResult.requiresConfirmation && !automationResult.executedActions?.length
                    ? 'awaiting confirmation'
                    : 'execution recorded'
                }}
              </p>
            </div>

            <div
              v-else
              class="flex min-h-[22rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground"
            >
              AI will draft the goal, choose explicit tool calls, and wait for confirmation before
              creating real goal or task entities.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog :open="openChatDialog" @update:open="openChatDialog = $event">
      <DialogContent class="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>AI Chat</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
          <div class="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Recent Conversations
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  :disabled="conversationListLoading"
                  @click="loadConversations"
                >
                  Refresh
                </Button>
              </div>
              <div class="max-h-40 space-y-2 overflow-y-auto">
                <button
                  v-for="item in conversationList"
                  :key="item.id"
                  class="w-full rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-left text-sm hover:bg-muted/40"
                  @click="selectConversation(item)"
                >
                  <div class="flex items-center justify-between gap-2">
                    <Input
                      :model-value="
                        conversationDraftNames[item.id] ?? item.name ?? item.title ?? ''
                      "
                      class="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                      @click.stop
                      @update:model-value="updateConversationDraft(item.id, String($event))"
                      @blur="renameConversation(item)"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      class="h-7 px-2"
                      @click.stop="deleteConversation(item.id)"
                    >
                      Delete
                    </Button>
                  </div>
                </button>
                <p
                  v-if="!conversationList.length && !conversationListLoading"
                  class="text-sm text-muted-foreground"
                >
                  No saved conversations yet.
                </p>
              </div>
            </div>

            <Input v-model="conversationName" placeholder="Conversation name" />
            <Textarea
              v-model="chatMessage"
              class="min-h-36"
              placeholder="Ask a question, brainstorm, or request a quick draft..."
            />
            <Button
              class="w-full"
              :disabled="chatLoading || !chatMessage.trim() || !hasProviders"
              @click="handleSendChat"
            >
              {{ chatLoading ? 'Sending...' : 'Send Message' }}
            </Button>
            <Button
              v-if="chatConversationId"
              variant="outline"
              class="w-full"
              @click="resetChatSession"
            >
              New Conversation
            </Button>
          </div>

          <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
            <div v-if="chatTimeline.length" class="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
              <div
                v-for="item in chatTimeline"
                :key="item.id"
                :class="[
                  'rounded-2xl p-3 text-sm',
                  item.role === 'user'
                    ? 'ml-10 bg-primary text-primary-foreground'
                    : 'mr-10 border border-border/60 bg-muted/25',
                ]"
              >
                <p class="mb-1 text-[11px] uppercase tracking-[0.18em] opacity-70">
                  {{ item.role === 'user' ? 'You' : 'Assistant' }}
                </p>
                <p class="whitespace-pre-wrap leading-6">{{ item.content }}</p>
              </div>
            </div>

            <div
              v-else
              class="flex min-h-[22rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground"
            >
              Start a conversation and your chat timeline will appear here.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog :open="openNoteDialog" @update:open="openNoteDialog = $event">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Knowledge Note</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div class="space-y-3">
            <Input v-model="noteTitle" placeholder="Optional title" />
            <Textarea
              v-model="noteTopic"
              class="min-h-44"
              placeholder="Describe the topic, source context, or what should be included in the note..."
            />
            <div
              class="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground"
            >
              Save path: <span class="font-medium text-foreground">{{ resolvedNotePath }}</span>
            </div>
            <Button
              class="w-full"
              :disabled="noteLoading || noteTopic.trim().length < 3 || !hasProviders"
              @click="handleCreateNote"
            >
              {{ noteLoading ? 'Creating...' : 'Create Knowledge Note' }}
            </Button>
          </div>

          <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
            <div v-if="noteSummary" class="space-y-4">
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Saved To</p>
                <p class="mt-1 text-sm font-medium">{{ noteSummary.resolvedPath }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Resource</p>
                <p class="mt-1 text-sm font-medium">
                  {{ noteSummary.resource?.name || 'New note created' }}
                </p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Preview</p>
                <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {{ notePreview }}
                </p>
              </div>
              <Button class="w-full" variant="outline" @click="openCreatedNote">
                Open Note in Repository
              </Button>
            </div>

            <div
              v-else
              class="flex min-h-[22rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground"
            >
              AI will save the generated markdown note to your configured notes path and show a
              quick summary here.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog :open="openKnowledgeExpansionDialog" @update:open="openKnowledgeExpansionDialog = $event">
      <DialogContent class="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Expand Draft With Knowledge</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div class="space-y-3">
            <Input
              v-model="knowledgeExpansionTitle"
              placeholder="Optional draft title for saving"
            />
            <Textarea
              v-model="knowledgeExpansionInstruction"
              class="min-h-28"
              placeholder="Describe what should be expanded, clarified, or grounded from your repository knowledge..."
            />
            <Textarea
              v-model="knowledgeExpansionDraft"
              class="min-h-56"
              placeholder="Optional: paste the current draft or outline here. AI will expand it using cited repository context."
            />
            <Button
              class="w-full"
              :disabled="
                knowledgeExpansionLoading ||
                knowledgeExpansionInstruction.trim().length < 3 ||
                !canUseKnowledgeExpansion
              "
              @click="handleExpandKnowledge"
            >
              {{ knowledgeExpansionLoading ? 'Expanding...' : 'Expand Draft With Knowledge' }}
            </Button>
            <Button
              class="w-full"
              variant="outline"
              :disabled="!knowledgeExpansionResult"
              @click="copyExpandedKnowledge"
            >
              Copy Expanded Draft
            </Button>
            <Button
              class="w-full"
              variant="outline"
              :disabled="knowledgeExpansionSaving || !knowledgeExpansionResult"
              @click="saveExpandedKnowledge"
            >
              {{ knowledgeExpansionSaving ? 'Saving...' : 'Save Expanded Draft' }}
            </Button>
            <p class="text-xs text-muted-foreground">
              Saving creates a markdown draft in the current repository so you can continue editing
              it locally.
            </p>
          </div>

          <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
            <div v-if="knowledgeExpansionResult" class="space-y-4">
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Expanded Draft
                </p>
                <p
                  class="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-muted-foreground"
                >
                  {{ knowledgeExpansionResult.expandedContent }}
                </p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Citations
                </p>
                <div class="mt-2 space-y-2">
                  <button
                    v-for="citation in knowledgeExpansionResult.citations"
                    :key="`${citation.resourcePath}-${citation.chunkIndex}`"
                    class="w-full rounded-xl border border-border/60 bg-muted/20 p-3 text-left hover:bg-muted/35"
                    @click="openCitationResource(citation.resourcePath)"
                  >
                    <p class="text-sm font-medium">
                      {{ citation.title || citation.resourcePath }}
                    </p>
                    <p class="mt-1 text-xs text-muted-foreground">
                      {{ citation.resourcePath }}
                    </p>
                    <p class="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {{ citation.excerpt }}
                    </p>
                  </button>
                </div>
              </div>
              <div
                v-if="knowledgeExpansionSavedDraft"
                class="rounded-xl border border-emerald-300/60 bg-emerald-50/80 p-3"
              >
                <p class="text-xs uppercase tracking-[0.18em] text-emerald-900">Saved Draft</p>
                <p class="mt-1 text-sm font-medium text-emerald-950">
                  {{ knowledgeExpansionSavedDraft.path || knowledgeExpansionSavedDraft.name }}
                </p>
                <Button class="mt-3 w-full" variant="outline" @click="openExpandedKnowledgeDraft">
                  Open Saved Draft
                </Button>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ knowledgeExpansionResult.matchedResourceCount }} resource(s) matched in
                {{ knowledgeExpansionResult.processingTimeMs }} ms.
              </p>
            </div>

            <div
              v-else
              class="flex min-h-[26rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground"
            >
              Add a draft and an instruction, and AI will expand it using cited repository
              excerpts.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog :open="openKnowledgeDialog" @update:open="openKnowledgeDialog = $event">
      <DialogContent class="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Ask Knowledge Base</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div class="space-y-3">
            <Textarea
              v-model="knowledgeQuestion"
              class="min-h-44"
              placeholder="Ask about notes, repository knowledge, or stored reference material..."
            />
            <Button
              class="w-full"
              :disabled="knowledgeLoading || knowledgeQuestion.trim().length < 3 || !canUseKnowledgeQuery"
              @click="handleQueryKnowledge"
            >
              {{ knowledgeLoading ? 'Searching...' : 'Ask Knowledge Base' }}
            </Button>
            <Button
              class="w-full"
              variant="outline"
              :disabled="reindexLoading || !canUseKnowledgeReindex"
              @click="handleReindexKnowledge"
            >
              {{ reindexLoading ? 'Reindexing...' : 'Refresh Knowledge Index' }}
            </Button>
            <p v-if="reindexSummary" class="text-xs text-muted-foreground">
              {{ reindexSummary }}
            </p>
          </div>

          <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
            <div v-if="knowledgeResult" class="space-y-4">
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Answer</p>
                <p class="mt-2 whitespace-pre-wrap text-sm leading-6">
                  {{ knowledgeResult.answer }}
                </p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Citations
                </p>
                <div class="mt-2 space-y-2">
                  <button
                    v-for="citation in knowledgeResult.citations"
                    :key="`${citation.resourcePath}-${citation.chunkIndex}`"
                    class="w-full rounded-xl border border-border/60 bg-muted/20 p-3 text-left hover:bg-muted/35"
                    @click="openCitationResource(citation.resourcePath)"
                  >
                    <p class="text-sm font-medium">
                      {{ citation.title || citation.resourcePath }}
                    </p>
                    <p class="mt-1 text-xs text-muted-foreground">
                      {{ citation.resourcePath }}
                    </p>
                    <p class="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {{ citation.excerpt }}
                    </p>
                  </button>
                </div>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ knowledgeResult.matchedResourceCount }} resource(s) matched in
                {{ knowledgeResult.processingTimeMs }} ms.
              </p>
            </div>

            <div
              v-else
              class="flex min-h-[22rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground"
            >
              Ask a question and AI will answer from indexed repository resources with citations.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog :open="openAnalyticsDialog" @update:open="openAnalyticsDialog = $event">
      <DialogContent class="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Ask Analytics</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div class="space-y-3">
            <Textarea
              v-model="analyticsQuestion"
              class="min-h-44"
              placeholder="Ask about goals, tasks, reminders, or dashboard trends..."
            />
            <Button
              class="w-full"
              :disabled="analyticsLoading || analyticsQuestion.trim().length < 3 || !hasProviders"
              @click="handleQueryAnalytics"
            >
              {{ analyticsLoading ? 'Analyzing...' : 'Ask Analytics' }}
            </Button>
          </div>

          <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
            <div v-if="analyticsResult" class="space-y-4">
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Answer</p>
                <p class="mt-2 whitespace-pre-wrap text-sm leading-6">
                  {{ analyticsResult.answer }}
                </p>
              </div>
              <div v-if="analyticsResult.highlights.length">
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Highlights
                </p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span
                    v-for="highlight in analyticsResult.highlights"
                    :key="highlight"
                    class="rounded-full border border-border/60 bg-muted/25 px-3 py-1 text-xs"
                  >
                    {{ highlight }}
                  </span>
                </div>
              </div>
              <p class="text-xs text-muted-foreground">
                Answer generated in {{ analyticsResult.processingTimeMs }} ms.
              </p>
            </div>

            <div
              v-else
              class="flex min-h-[22rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground"
            >
              Ask a business-style question and AI will answer from controlled analytics context.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog :open="openEvaluationDialog" @update:open="openEvaluationDialog = $event">
      <DialogContent class="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>AI Quality Reports</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div class="flex justify-end">
            <Button variant="outline" :disabled="evaluationLoading" @click="loadEvaluationOverview">
              {{ evaluationLoading ? 'Refreshing...' : 'Refresh Reports' }}
            </Button>
          </div>

          <div v-if="evaluationOverview" class="grid gap-4 lg:grid-cols-2">
            <div class="space-y-4">
              <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
                <div class="flex items-center justify-between gap-3">
                  <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Deterministic Eval
                  </p>
                  <span
                    :class="[
                      'rounded-full px-3 py-1 text-[11px] font-medium',
                      !evaluationOverview.latest.deterministic
                        ? 'bg-muted text-muted-foreground'
                        : evaluationOverview.latest.deterministic.gatePassed
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-rose-100 text-rose-900',
                    ]"
                  >
                    {{
                      !evaluationOverview.latest.deterministic
                        ? 'no report'
                        : evaluationOverview.latest.deterministic.gatePassed
                        ? 'gate passed'
                        : 'gate failed'
                    }}
                  </span>
                </div>

                <div v-if="evaluationOverview.latest.deterministic" class="mt-3 space-y-3">
                  <p class="text-sm text-muted-foreground">
                    {{ formatEvalTimestamp(evaluationOverview.latest.deterministic.generatedAt) }}
                  </p>
                  <div class="grid gap-2 sm:grid-cols-3">
                    <div class="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Pass Rate
                      </p>
                      <p class="mt-1 text-lg font-semibold">
                        {{ formatPassRate(evaluationOverview.latest.deterministic.passRate) }}
                      </p>
                    </div>
                    <div class="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Cases
                      </p>
                      <p class="mt-1 text-lg font-semibold">
                        {{ evaluationOverview.latest.deterministic.passedCases }}/{{ evaluationOverview.latest.deterministic.totalCases }}
                      </p>
                    </div>
                    <div class="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Failures
                      </p>
                      <p class="mt-1 text-lg font-semibold">
                        {{ evaluationOverview.latest.deterministic.failedCases }}
                      </p>
                    </div>
                  </div>
                  <div v-if="evaluationOverview.latest.deterministic.gateFailures.length">
                    <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Gate Failures
                    </p>
                    <div class="mt-2 space-y-2">
                      <div
                        v-for="failure in evaluationOverview.latest.deterministic.gateFailures"
                        :key="failure"
                        class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
                      >
                        {{ failure }}
                      </div>
                    </div>
                  </div>
                  <div v-if="resolveFailedResults(evaluationOverview.latest.deterministic).length">
                    <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Failed Cases
                    </p>
                    <div class="mt-2 space-y-2">
                      <div
                        v-for="item in resolveFailedResults(evaluationOverview.latest.deterministic)"
                        :key="item.id"
                        class="rounded-xl border border-border/60 bg-muted/20 p-3"
                      >
                        <p class="text-sm font-medium">{{ item.id }}</p>
                        <p class="mt-1 text-xs text-muted-foreground">{{ item.description }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-else
                  class="mt-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground"
                >
                  No deterministic evaluation report is available yet.
                </div>
              </div>

              <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Recent Deterministic History
                </p>
                <div v-if="evaluationOverview.history.deterministic.length" class="mt-3 space-y-2">
                  <div
                    v-for="entry in evaluationOverview.history.deterministic"
                    :key="entry.fileName"
                    class="rounded-xl border border-border/60 bg-muted/20 p-3"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <p class="text-sm font-medium">{{ formatEvalTimestamp(entry.generatedAt) }}</p>
                      <span class="text-xs text-muted-foreground">
                        {{ formatPassRate(entry.passRate) }}
                      </span>
                    </div>
                    <p class="mt-1 text-xs text-muted-foreground">
                      {{ entry.totalCases - entry.failedCases }}/{{ entry.totalCases }} passed
                    </p>
                  </div>
                </div>
                <p v-else class="mt-3 text-sm text-muted-foreground">No archived deterministic runs yet.</p>
              </div>
            </div>

            <div class="space-y-4">
              <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
                <div class="flex items-center justify-between gap-3">
                  <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Live Provider Eval
                  </p>
                  <span
                    :class="[
                      'rounded-full px-3 py-1 text-[11px] font-medium',
                      !evaluationOverview.latest.live
                        ? 'bg-muted text-muted-foreground'
                        : evaluationOverview.latest.live.gatePassed
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-rose-100 text-rose-900',
                    ]"
                  >
                    {{
                      !evaluationOverview.latest.live
                        ? 'no report'
                        : evaluationOverview.latest.live.gatePassed
                          ? 'gate passed'
                          : 'gate failed'
                    }}
                  </span>
                </div>

                <div v-if="evaluationOverview.latest.live" class="mt-3 space-y-3">
                  <p class="text-sm text-muted-foreground">
                    {{ formatEvalTimestamp(evaluationOverview.latest.live.generatedAt) }}
                  </p>
                  <div class="grid gap-2 sm:grid-cols-3">
                    <div class="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Provider
                      </p>
                      <p class="mt-1 text-lg font-semibold">
                        {{ evaluationOverview.latest.live.provider || 'unknown' }}
                      </p>
                    </div>
                    <div class="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Model
                      </p>
                      <p class="mt-1 text-lg font-semibold">
                        {{ evaluationOverview.latest.live.model || 'unknown' }}
                      </p>
                    </div>
                    <div class="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Pass Rate
                      </p>
                      <p class="mt-1 text-lg font-semibold">
                        {{ formatPassRate(evaluationOverview.latest.live.passRate) }}
                      </p>
                    </div>
                  </div>
                  <div v-if="evaluationOverview.latest.live.gateFailures.length">
                    <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Gate Failures
                    </p>
                    <div class="mt-2 space-y-2">
                      <div
                        v-for="failure in evaluationOverview.latest.live.gateFailures"
                        :key="failure"
                        class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
                      >
                        {{ failure }}
                      </div>
                    </div>
                  </div>
                  <div v-if="resolveFailedResults(evaluationOverview.latest.live).length">
                    <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Failed Cases
                    </p>
                    <div class="mt-2 space-y-2">
                      <div
                        v-for="item in resolveFailedResults(evaluationOverview.latest.live)"
                        :key="item.id"
                        class="rounded-xl border border-border/60 bg-muted/20 p-3"
                      >
                        <p class="text-sm font-medium">{{ item.id }}</p>
                        <p class="mt-1 text-xs text-muted-foreground">{{ item.description }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-else
                  class="mt-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground"
                >
                  No live provider report is available yet.
                </div>
              </div>

              <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Recent Live History
                </p>
                <div v-if="evaluationOverview.history.live.length" class="mt-3 space-y-2">
                  <div
                    v-for="entry in evaluationOverview.history.live"
                    :key="entry.fileName"
                    class="rounded-xl border border-border/60 bg-muted/20 p-3"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <p class="text-sm font-medium">{{ formatEvalTimestamp(entry.generatedAt) }}</p>
                      <span class="text-xs text-muted-foreground">
                        {{ formatPassRate(entry.passRate) }}
                      </span>
                    </div>
                    <p class="mt-1 text-xs text-muted-foreground">
                      {{ entry.provider || 'provider' }} · {{ entry.model || 'model' }}
                    </p>
                  </div>
                </div>
                <p v-else class="mt-3 text-sm text-muted-foreground">No archived live runs yet.</p>
              </div>
            </div>
          </div>

          <div
            v-else
            class="flex min-h-[18rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground"
          >
            {{ evaluationLoading ? 'Loading evaluation reports...' : 'No evaluation reports are available yet.' }}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { BarChart3, Bot, MessageCircle, NotebookPen, Search, Sparkles, X } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea,
} from '@dailyuse/ui-vue-shadcn';
import { useAI } from '../composables/useAI';
import { useUserSetting } from '../../setting/composables/useUserSetting';
import { useGoal } from '../../goal/composables/useGoal';
import { useRepository } from '../../repository/composables/useRepository';
import { useEditorWorkspaceActions } from '../../editor/composables';
import { GOAL_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import AIGoalDraftEditor from './AIGoalDraftEditor.vue';

type GoalDraft = {
  goal: {
    name?: string;
    title?: string;
    description: string;
    category: string;
    importance: string;
  };
  keyResults?: Array<{
    title: string;
    description?: string;
    targetValue: number;
    unit: string;
  }>;
};

type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type NoteSummary = {
  resolvedPath: string;
  resource?: { id?: string; name?: string; content?: string };
};

type SavedDraftSummary = {
  id: string;
  name?: string;
  path?: string;
};

type ConversationSummary = {
  id: string;
  name?: string;
  title?: string;
};

type AICapabilities = {
  runtimeMode: 'direct-provider' | 'remote-ai-service';
  supportsChat: boolean;
  supportsGoalGeneration: boolean;
  supportsKnowledgeNotes: boolean;
  supportsKnowledgeQuery: boolean;
  supportsKnowledgeReindex: boolean;
  supportsAnalyticsQuery: boolean;
  supportsGoalAutomation: boolean;
  supportsEvaluationReports: boolean;
  advancedFeaturesReason?: string;
  knowledgeIndexDiagnostics?: {
    persistenceBackend:
      | 'legacy-resource-metadata'
      | 'powersync-resource-metadata'
      | 'prisma-index-table';
    persistenceStatus: 'enabled' | 'fallback';
    persistenceReason?: string;
    vectorRecallBackend: 'none' | 'local-js-hybrid' | 'pgvector-ivfflat';
    vectorRecallStatus: 'enabled' | 'fallback' | 'unknown';
    vectorRecallReason?: string;
  };
};

type GoalAutomationResult = {
  summary: string;
  requiresConfirmation: boolean;
  plan: {
    goal: {
      title: string;
      description: string;
    };
    keyResults?: Array<{
      title: string;
      description?: string;
      targetValue: number;
      unit: string;
    }>;
    taskTemplates?: Array<{
      name: string;
      description?: string;
      importance: string;
      cadence: 'daily' | 'weekly' | 'once';
    }>;
  };
  actions: Array<{
    tool: 'create_goal' | 'create_key_result' | 'create_task_template' | 'search_notes' | 'fetch_stats';
    index?: number;
    rationale?: string;
  }>;
  executedActions?: Array<{
    tool: 'create_goal' | 'create_key_result' | 'create_task_template' | 'search_notes' | 'fetch_stats';
    status: 'executed' | 'skipped' | 'failed';
    entityId?: string;
    message: string;
  }>;
  processingTimeMs: number;
};

type StreamDoneResult = {
  userMessage?: { id: string; content: string };
  assistantMessage?: { id: string; content: string };
};

type KnowledgeCitation = {
  resourcePath: string;
  title?: string;
  chunkIndex: number;
  excerpt: string;
};

type KnowledgeQueryResult = {
  answer: string;
  citations: KnowledgeCitation[];
  matchedResourceCount: number;
  processingTimeMs: number;
};

type KnowledgeExpansionResult = {
  expandedContent: string;
  citations: KnowledgeCitation[];
  matchedResourceCount: number;
  processingTimeMs: number;
};

type EvaluationCheck = {
  name: string;
  passed: boolean;
  detail: string;
};

type EvaluationResult = {
  id: string;
  type: string;
  description: string;
  passed: boolean;
  score: number;
  checks: EvaluationCheck[];
  metadata: Record<string, unknown>;
};

type EvaluationReport = {
  generatedAt: string;
  mode: 'deterministic' | 'live';
  provider?: string;
  model?: string;
  baseUrl?: string;
  casesPath: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  passRate: number;
  byType: Record<string, number>;
  failedCaseIds: string[];
  gatePassed: boolean;
  gateFailures: string[];
  baselinePath?: string;
  archivePath?: string;
  results: EvaluationResult[];
};

type EvaluationHistoryEntry = {
  fileName: string;
  generatedAt: string;
  mode: 'deterministic' | 'live';
  provider?: string;
  model?: string;
  passRate: number;
  totalCases: number;
  failedCases: number;
  gatePassed: boolean;
  archivePath: string;
};

type EvaluationOverview = {
  latest: {
    deterministic?: EvaluationReport;
    live?: EvaluationReport;
  };
  history: {
    deterministic: EvaluationHistoryEntry[];
    live: EvaluationHistoryEntry[];
  };
};

const {
  service,
  providers,
  capabilities,
  hasProviders,
  loadProviders,
  loadCapabilities,
  expandKnowledge,
} = useAI();
const { getCategory } = useUserSetting();
const { createGoal } = useGoal();
const { resources, fetchResources, initRepository, createMarkdownNote } = useRepository();
const { requestOpenResource } = useEditorWorkspaceActions();
const goalService = useStrictInject(GOAL_SERVICE_KEY, 'GoalService');
const router = useRouter();

const open = ref(false);
const openGoalDialog = ref(false);
const openAutomationDialog = ref(false);
const openChatDialog = ref(false);
const openNoteDialog = ref(false);
const openKnowledgeExpansionDialog = ref(false);
const openKnowledgeDialog = ref(false);
const openAnalyticsDialog = ref(false);
const openEvaluationDialog = ref(false);

const goalIdea = ref('');
const goalLoading = ref(false);
const goalDraft = ref<GoalDraft | null>(null);
const creatingGoal = ref(false);
const editableGoal = ref({
  name: '',
  description: '',
  category: '',
  importance: ImportanceLevel.Moderate,
});
const editableKeyResults = ref<
  Array<{ title: string; description: string; targetValue: number; unit: string }>
>([]);
const automationIdea = ref('');
const automationLoading = ref(false);
const automationExecuting = ref(false);
const automationResult = ref<GoalAutomationResult | null>(null);

const conversationName = ref('Quick Chat');
const chatMessage = ref('');
const chatLoading = ref(false);
const chatConversationId = ref('');
const chatTimeline = ref<ChatItem[]>([]);
const conversationListLoading = ref(false);
const conversationList = ref<ConversationSummary[]>([]);
const lastActiveConversationId = ref('');
const conversationDraftNames = ref<Record<string, string>>({});

const noteTitle = ref('');
const noteTopic = ref('');
const noteLoading = ref(false);
const noteSummary = ref<NoteSummary | null>(null);
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
const analyticsResult = ref<
  | {
      answer: string;
      highlights: string[];
      processingTimeMs: number;
    }
  | null
>(null);
const evaluationLoading = ref(false);
const evaluationOverview = ref<EvaluationOverview | null>(null);

const aiSettings = computed(() => getCategory('ai'));
const aiEnabled = computed(() => aiSettings.value?.enabled ?? true);
const showFloatingBall = computed(() => aiSettings.value?.showFloatingBall ?? true);
const knowledgeNoteSubpath = computed(() => aiSettings.value?.knowledgeNoteSubpath ?? '');
const capabilityState = computed(() => (capabilities.value as AICapabilities | null) ?? null);
const canUseGoalAutomation = computed(
  () => hasProviders.value && Boolean(capabilityState.value?.supportsGoalAutomation),
);
const canUseKnowledgeQuery = computed(
  () => hasProviders.value && Boolean(capabilityState.value?.supportsKnowledgeQuery),
);
const canUseKnowledgeExpansion = computed(() => canUseKnowledgeQuery.value);
const canUseKnowledgeReindex = computed(
  () => Boolean(capabilityState.value?.supportsKnowledgeReindex),
);
const canUseAnalyticsQuery = computed(
  () => hasProviders.value && Boolean(capabilityState.value?.supportsAnalyticsQuery),
);
const canUseEvaluationReports = computed(
  () => Boolean(capabilityState.value?.supportsEvaluationReports),
);
const advancedFeatureNotice = computed(() => {
  if (!capabilityState.value?.advancedFeaturesReason) {
    return '';
  }

  return `${capabilityState.value.advancedFeaturesReason} Current mode: ${capabilityState.value.runtimeMode}.`;
});
const knowledgeIndexNotice = computed(() => {
  const diagnostics = capabilityState.value?.knowledgeIndexDiagnostics;
  if (!diagnostics) {
    return '';
  }

  const persistenceLabel =
    diagnostics.persistenceBackend === 'prisma-index-table'
      ? 'server knowledge index table'
      : diagnostics.persistenceBackend === 'powersync-resource-metadata'
        ? 'desktop metadata-backed index'
        : 'legacy resource metadata index';
  const vectorLabel =
    diagnostics.vectorRecallBackend === 'pgvector-ivfflat'
      ? 'pgvector ANN recall'
      : diagnostics.vectorRecallBackend === 'local-js-hybrid'
        ? 'local hybrid recall'
        : 'no vector recall';
  const persistenceDetail =
    diagnostics.persistenceStatus === 'fallback' && diagnostics.persistenceReason
      ? ` ${diagnostics.persistenceReason}`
      : '';
  const vectorDetail = diagnostics.vectorRecallReason ? ` ${diagnostics.vectorRecallReason}` : '';

  return `Knowledge index uses ${persistenceLabel}. Vector recall status: ${vectorLabel} (${diagnostics.vectorRecallStatus}).${persistenceDetail}${vectorDetail}`;
});
const resolvedNotePath = computed(() =>
  knowledgeNoteSubpath.value ? `notes/${knowledgeNoteSubpath.value}/` : 'notes/',
);
const automatedGoalId = computed(
  () =>
    automationResult.value?.executedActions?.find((action) => action.tool === 'create_goal')
      ?.entityId ?? '',
);
const providerList = computed(() =>
  Array.isArray(providers.value)
    ? (providers.value as Array<{ name?: string; isDefault?: boolean }>)
    : [],
);

const activeProvider = computed(() => {
  return (
    providerList.value.find((item) => item.isDefault) ||
    providerList.value[0] ||
    null
  );
});
const activeProviderName = computed(() => activeProvider.value?.name || 'Not configured');
const providerSummaryText = computed(() => {
  if (!providerList.value.length) return 'No provider configured';
  return `${providerList.value.length} provider${providerList.value.length > 1 ? 's' : ''} available`;
});
const notePreview = computed(() => {
  const content = noteSummary.value?.resource?.content;
  if (!content) return 'The note was created successfully.';
  return content.slice(0, 280);
});

onMounted(() => {
  void loadProviders();
  void loadCapabilities();
  void initRepository();
  lastActiveConversationId.value = localStorage.getItem('ai:last-conversation-id') || '';
});

function togglePanel() {
  if (!open.value) {
    void loadProviders();
    void loadCapabilities();
  }
  open.value = !open.value;
}

async function loadConversations() {
  conversationListLoading.value = true;
  try {
    const result = (await service.listConversations({ page: 1, pageSize: 12 })) as {
      data?: ConversationSummary[];
    };
    conversationList.value = result.data ?? [];
    conversationDraftNames.value = Object.fromEntries(
      conversationList.value.map((item) => [item.id, item.name || item.title || '']),
    );
  } finally {
    conversationListLoading.value = false;
  }
}

async function handleOpenChatDialog() {
  openChatDialog.value = true;
  await loadConversations();
  if (lastActiveConversationId.value) {
    const existing = conversationList.value.find(
      (item) => item.id === lastActiveConversationId.value,
    );
    if (existing) {
      await selectConversation(existing);
    }
  }
}

async function handleGenerateGoal() {
  goalLoading.value = true;
  try {
    goalDraft.value = (await service.generateGoal({
      idea: goalIdea.value,
      includeKeyResults: true,
    })) as GoalDraft;
    editableGoal.value = {
      name: goalDraft.value.goal.name ?? goalDraft.value.goal.title ?? '',
      description: goalDraft.value.goal.description,
      category: goalDraft.value.goal.category,
      importance: goalDraft.value.goal.importance as typeof editableGoal.value.importance,
    };
    editableKeyResults.value =
      goalDraft.value.keyResults?.map((item) => ({
        title: item.title,
        description: item.description ?? '',
        targetValue: item.targetValue,
        unit: item.unit,
      })) ?? [];
    toast.success('Goal draft generated');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to generate goal');
  } finally {
    goalLoading.value = false;
  }
}

async function handleCreateGoalFromDraft() {
  if (!goalDraft.value) return;

  creatingGoal.value = true;
  try {
    const created = await createGoal({
      name: editableGoal.value.name,
      description: editableGoal.value.description,
      category: editableGoal.value.category || undefined,
      importance: editableGoal.value.importance,
      motivation: goalDraft.value.goal.description,
    });

    if (!created) {
      toast.error('Failed to create goal');
      return;
    }

    if (editableKeyResults.value.length) {
      for (const item of editableKeyResults.value) {
        await goalService.createKeyResult(created.id, {
          ...({} as any),
          title: item.title,
          description: item.description || undefined,
          targetValue: item.targetValue,
          unit: item.unit,
        });
      }
    }

    toast.success('Goal created');
    openGoalDialog.value = false;
    await router.push(`/goals/${created.id}`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to create goal');
  } finally {
    creatingGoal.value = false;
  }
}

async function handleSendChat() {
  chatLoading.value = true;
  let userDraftId = '';
  let assistantDraftId = '';
  try {
    if (!chatConversationId.value) {
      const conversation = (await service.createConversation({
        name: conversationName.value.trim() || 'Quick Chat',
      })) as { id: string };
      chatConversationId.value = conversation.id;
      lastActiveConversationId.value = conversation.id;
      localStorage.setItem('ai:last-conversation-id', conversation.id);
    }

    const pendingUserMessage = chatMessage.value;
    userDraftId = `user-draft-${Date.now()}`;
    assistantDraftId = `draft-${Date.now()}`;
    chatTimeline.value.push(
      { id: userDraftId, role: 'user', content: pendingUserMessage },
      { id: assistantDraftId, role: 'assistant', content: '' },
    );
    chatMessage.value = '';

    await service.streamMessage(
      {
        conversationId: chatConversationId.value as never,
        content: pendingUserMessage,
      },
      {
        onChunk: (chunk: { role: 'assistant'; content: string }) => {
          const target = chatTimeline.value.find((item) => item.id === assistantDraftId);
          if (target) {
            target.content += chunk.content;
          }
        },
        onDone: async (result: unknown) => {
          const resolved = (result ?? {}) as StreamDoneResult;
          const assistantIndex = chatTimeline.value.findIndex((item) => item.id === assistantDraftId);
          if (assistantIndex >= 0 && resolved.assistantMessage) {
            chatTimeline.value[assistantIndex] = {
              id: resolved.assistantMessage.id,
              role: 'assistant',
              content: resolved.assistantMessage.content,
            };
          }
          const userIndex = chatTimeline.value.findIndex((item) => item.id === userDraftId);
          if (userIndex >= 0 && resolved.userMessage) {
            chatTimeline.value[userIndex] = {
              id: resolved.userMessage.id,
              role: 'user',
              content: resolved.userMessage.content,
            };
          }
          await loadConversations();
        },
      },
    );
  } catch (error) {
    chatTimeline.value = chatTimeline.value.filter(
      (item) => item.id !== userDraftId && item.id !== assistantDraftId,
    );
    toast.error(error instanceof Error ? error.message : 'Failed to send message');
  } finally {
    chatLoading.value = false;
  }
}

async function handlePlanAutomation() {
  automationLoading.value = true;
  try {
    automationResult.value = (await service.automateGoal({
      idea: automationIdea.value.trim(),
      includeKeyResults: true,
      includeTaskTemplates: true,
      confirm: false,
    })) as GoalAutomationResult;
    toast.success('Automation plan ready for review');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to plan automation');
  } finally {
    automationLoading.value = false;
  }
}

async function handleExecuteAutomation() {
  if (!automationResult.value) {
    return;
  }

  automationExecuting.value = true;
  try {
    automationResult.value = (await service.automateGoal({
      idea: automationIdea.value.trim(),
      includeKeyResults: true,
      includeTaskTemplates: true,
      confirm: true,
      approvedSummary: automationResult.value.summary,
      approvedPlan: automationResult.value.plan,
      approvedActions: automationResult.value.actions,
    })) as GoalAutomationResult;
    toast.success('Automation executed');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to execute automation');
  } finally {
    automationExecuting.value = false;
  }
}

function resetChatSession() {
  chatConversationId.value = '';
  chatTimeline.value = [];
  chatMessage.value = '';
}

async function selectConversation(item: ConversationSummary) {
  chatConversationId.value = item.id;
  lastActiveConversationId.value = item.id;
  localStorage.setItem('ai:last-conversation-id', item.id);
  conversationName.value = item.name || item.title || 'Quick Chat';
  try {
    const result = (await service.listMessages(item.id, { page: 1, pageSize: 50 })) as {
      data?: ChatItem[];
    };
    chatTimeline.value = result.data ?? [];
    openChatDialog.value = true;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to load conversation');
  }
}

async function deleteConversation(id: string) {
  try {
    await service.deleteConversation(id);
    if (chatConversationId.value === id) {
      resetChatSession();
    }
    if (lastActiveConversationId.value === id) {
      lastActiveConversationId.value = '';
      localStorage.removeItem('ai:last-conversation-id');
    }
    await loadConversations();
    toast.success('Conversation deleted');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to delete conversation');
  }
}

function updateConversationDraft(id: string, value: string) {
  conversationDraftNames.value[id] = value;
}

async function renameConversation(item: ConversationSummary) {
  const nextName = (conversationDraftNames.value[item.id] || '').trim();
  const currentName = item.name || item.title || '';
  if (!nextName || nextName === currentName) return;

  try {
    const updated = (await (service as any).updateConversation(item.id, { name: nextName })) as {
      id: string;
      name: string;
    };
    const target = conversationList.value.find((entry) => entry.id === updated.id);
    if (target) {
      target.name = updated.name;
      target.title = updated.name;
    }
    if (chatConversationId.value === updated.id) {
      conversationName.value = updated.name;
    }
  } catch (error) {
    conversationDraftNames.value[item.id] = currentName;
    toast.error(error instanceof Error ? error.message : 'Failed to rename conversation');
  }
}

async function handleCreateNote() {
  noteLoading.value = true;
  try {
    noteSummary.value = (await service.createKnowledgeNote({
      topic: noteTopic.value,
      ...(noteTitle.value.trim() ? { title: noteTitle.value.trim() } : {}),
      ...(knowledgeNoteSubpath.value ? { targetSubpath: knowledgeNoteSubpath.value } : {}),
    })) as NoteSummary;
    await fetchResources();
    toast.success('Knowledge note created');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to create note');
  } finally {
    noteLoading.value = false;
  }
}

async function handleExpandKnowledge() {
  knowledgeExpansionLoading.value = true;
  knowledgeExpansionSavedDraft.value = null;
  try {
    const currentContent = knowledgeExpansionDraft.value.trim();
    knowledgeExpansionResult.value = (await expandKnowledge({
      instruction: knowledgeExpansionInstruction.value.trim(),
      maxResources: 8,
      maxCitations: 4,
      ...(currentContent ? { currentContent } : {}),
    })) as KnowledgeExpansionResult;
    toast.success('Draft expanded with repository knowledge');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to expand knowledge draft');
  } finally {
    knowledgeExpansionLoading.value = false;
  }
}

async function handleQueryKnowledge() {
  knowledgeLoading.value = true;
  try {
    knowledgeResult.value = (await service.queryKnowledge({
      query: knowledgeQuestion.value.trim(),
      maxResources: 8,
    })) as typeof knowledgeResult.value;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to query knowledge');
  } finally {
    knowledgeLoading.value = false;
  }
}

async function handleReindexKnowledge() {
  reindexLoading.value = true;
  reindexSummary.value = '';
  try {
    const result = (await service.reindexKnowledge({
      limit: 200,
      force: true,
    })) as {
      indexedCount: number;
      reusedCount: number;
      failedCount: number;
    };
    reindexSummary.value = `Indexed ${result.indexedCount}, reused ${result.reusedCount}, failed ${result.failedCount}.`;
    toast.success('Knowledge index refreshed');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to refresh knowledge index');
  } finally {
    reindexLoading.value = false;
  }
}

async function copyExpandedKnowledge() {
  if (!knowledgeExpansionResult.value?.expandedContent) {
    return;
  }

  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    toast.error('Clipboard is unavailable in this runtime');
    return;
  }

  await navigator.clipboard.writeText(knowledgeExpansionResult.value.expandedContent);
  toast.success('Expanded draft copied');
}

async function saveExpandedKnowledge() {
  if (!knowledgeExpansionResult.value?.expandedContent) {
    return;
  }

  knowledgeExpansionSaving.value = true;
  try {
    const created = await createMarkdownNote(
      resolveKnowledgeExpansionDraftName(),
      knowledgeExpansionResult.value.expandedContent,
    );

    if (!created) {
      toast.error('Failed to save expanded draft');
      return;
    }

    knowledgeExpansionSavedDraft.value = {
      id: created.id,
      name: created.name,
      path: created.path,
    };
    await fetchResources();
    toast.success('Expanded draft saved to repository');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to save expanded draft');
  } finally {
    knowledgeExpansionSaving.value = false;
  }
}

async function handleQueryAnalytics() {
  analyticsLoading.value = true;
  try {
    analyticsResult.value = (await service.queryAnalytics({
      query: analyticsQuestion.value.trim(),
    })) as typeof analyticsResult.value;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to query analytics');
  } finally {
    analyticsLoading.value = false;
  }
}

async function handleOpenEvaluationDialog() {
  openEvaluationDialog.value = true;
  await loadEvaluationOverview();
}

async function loadEvaluationOverview() {
  evaluationLoading.value = true;
  try {
    evaluationOverview.value = (await service.getEvaluationOverview({
      historyLimit: 5,
    })) as EvaluationOverview;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to load evaluation reports');
  } finally {
    evaluationLoading.value = false;
  }
}

async function openAutomatedGoal() {
  if (!automatedGoalId.value) {
    return;
  }

  openAutomationDialog.value = false;
  await router.push(`/goals/${automatedGoalId.value}`);
}

async function openCitationResource(resourcePath: string) {
  if (!resources.value.length) {
    await fetchResources();
  }

  const target = resources.value.find((item) => item.path === resourcePath);
  if (target) {
    await requestOpenResource(target.id);
    open.value = false;
    openKnowledgeDialog.value = false;
    openKnowledgeExpansionDialog.value = false;
  }

  await router.push('/repository');
}

function openCreatedNote() {
  const resolvedPath = noteSummary.value?.resolvedPath;
  if (!resolvedPath) return;

  const target = resources.value.find(
    (item) => item.path === resolvedPath || item.name === noteSummary.value?.resource?.name,
  );

  if (target) {
    void requestOpenResource(target.id);
    open.value = false;
    openNoteDialog.value = false;
  }

  void router.push('/repository');
}

async function openExpandedKnowledgeDraft() {
  if (!knowledgeExpansionSavedDraft.value?.id) {
    return;
  }

  await requestOpenResource(knowledgeExpansionSavedDraft.value.id);
  open.value = false;
  openKnowledgeExpansionDialog.value = false;
  await router.push('/repository');
}

function formatAutomationTool(tool: GoalAutomationResult['actions'][number]['tool']) {
  const labels: Record<GoalAutomationResult['actions'][number]['tool'], string> = {
    create_goal: 'Create Goal',
    create_key_result: 'Create Key Result',
    create_task_template: 'Create Task Template',
    search_notes: 'Search Notes',
    fetch_stats: 'Fetch Stats',
  };

  return labels[tool];
}

function formatActionStatus(status: NonNullable<GoalAutomationResult['executedActions']>[number]['status']) {
  const labels = {
    executed: 'Executed',
    skipped: 'Skipped',
    failed: 'Failed',
  } as const;

  return labels[status];
}

function addKeyResult() {
  editableKeyResults.value.push({
    title: '',
    description: '',
    targetValue: 1,
    unit: 'unit',
  });
}

function removeKeyResult(index: number) {
  editableKeyResults.value.splice(index, 1);
}

function resolveKnowledgeExpansionDraftName(): string {
  const explicitTitle = knowledgeExpansionTitle.value.trim();
  if (explicitTitle.length > 0) {
    return explicitTitle;
  }

  const headingMatch = knowledgeExpansionResult.value?.expandedContent.match(/^#\s+(.+)$/m);
  if (headingMatch?.[1]) {
    return headingMatch[1].trim();
  }

  return `AI Grounded Draft ${new Date().toISOString().slice(0, 10)}`;
}

function formatEvalTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

function formatPassRate(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function resolveFailedResults(report?: EvaluationReport): EvaluationResult[] {
  return report?.results.filter((item) => !item.passed) ?? [];
}
</script>
