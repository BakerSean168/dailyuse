import { defineComponent, h, ref } from 'vue';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AIWorkflowRunView, GoalPlanDraft } from '@memoflow/contracts/ai';
import { ok } from '@memoflow/contracts/result';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  useAI: vi.fn(),
  useGoal: vi.fn(),
  useRecentKnowledgeNotes: vi.fn(),
  useUserSetting: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mocks.push,
  }),
}));

vi.mock('vue-sonner', () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

vi.mock('../composables/useAI', () => ({
  useAI: mocks.useAI,
}));

vi.mock('../../goal/composables/useGoal', () => ({
  useGoal: mocks.useGoal,
}));

vi.mock('../../repository/composables/useRecentKnowledgeNotes', () => ({
  useRecentKnowledgeNotes: mocks.useRecentKnowledgeNotes,
}));

vi.mock('../../setting/composables/useUserSetting', () => ({
  useUserSetting: mocks.useUserSetting,
}));

import AIChatView from './AIChatView.vue';
import {
  AI_ASSISTANT_RUNTIME_KEY,
  AI_WORKFLOW_RUNTIME_KEY,
  ASSISTANT_SURFACE_KEY,
  DASHBOARD_SERVICE_KEY,
  TASK_SERVICE_KEY,
} from '../../../di/keys';
import { VueQueryPlugin } from '@tanstack/vue-query';
import {
  createTestServerStateRuntime,
  SERVER_STATE_IDENTITY_SCOPE_KEY,
  SERVER_STATE_RUNTIME_KEY,
} from '../../../platform/server-state';
import { formatLangGraphVendorDiagnosticEventLabel } from '../composables/hostLangGraphUiBoundary';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      nav: {
        aiChat: 'AI Chat',
        settings: 'Settings',
        capsule: {
          goal: 'Goal',
          note: 'Notes',
        },
      },
      common: {
        unknown: 'Unknown',
        untitled: 'Untitled',
        operationFailed: 'Operation failed',
        cancel: 'Cancel',
        retry: 'Retry',
      },
      errors: {
        UNKNOWN: 'Operation failed',
      },
      aiAssistant: {
        dialogs: {
          chat: {
            newConversation: 'New conversation',
            refresh: 'Refresh',
            noSavedConversations: 'No conversations',
            you: 'You',
            assistant: 'Assistant',
            defaultConversationName: 'New chat',
            sendMessage: 'Send',
            messagePlaceholder: 'Type a message',
            deleted: 'Deleted',
            loadFailed: 'Load failed',
            deleteFailed: 'Delete failed',
            aborted: 'Aborted',
            sendFailed: 'Send failed',
          },
          generateGoal: {
            generating: 'Generating draft',
            draftGenerated: 'Draft generated',
            generateFailed: 'Generate failed',
            created: 'Created',
            createFailed: 'Create failed',
          },
          agent: {
            title: 'Agent Run',
            startRun: 'Start Agent Run',
            starting: 'Starting...',
            confirmRun: 'Confirm Run',
            continueExecution: 'Continue Execution',
            resuming: 'Resuming...',
            started: 'Agent run started',
            resumed: 'Agent run resumed',
            cancelled: 'Agent run cancelled',
            startFailed: 'Failed to start agent run',
            resumeFailed: 'Failed to resume agent run',
            recentRuns: 'Recent Agent Runs',
            loadingRuns: 'Loading Agent runs...',
            noRecentRuns: 'No Agent runs yet.',
            artifacts: 'Artifacts',
            pendingActions: 'Pending Actions',
            executedActions: 'Execution Timeline',
            typeLabels: {
              goalCreate: 'Goal Agent',
              knowledgeQa: 'Knowledge Q&A Agent',
              knowledgeGenerate: 'Knowledge Note Agent',
            },
            statusLabels: {
              pending: 'Pending',
              running: 'Running',
              waitingClarification: 'Waiting for clarification',
              waitingApproval: 'Waiting for approval',
              waitingExecution: 'Waiting for execution',
              completed: 'Completed',
              failed: 'Failed',
              cancelled: 'Cancelled',
            },
            toolLabels: {
              createReminder: 'Create Reminder',
              createKnowledgeNote: 'Create Knowledge Note',
              searchExistingGoals: 'Search Existing Goals',
              searchKnowledge: 'Search Knowledge',
              fetchGoalStats: 'Fetch Goal Stats',
              fetchResource: 'Fetch Note',
              findRelatedNotes: 'Find Related Notes',
            },
          },
          automation: {
            planning: 'Planning automation',
            planAutomation: 'Plan Automation',
            executing: 'Executing automation',
            confirmAndExecute: 'Confirm and Execute',
            openCreatedGoal: 'Open Created Goal',
            summary: 'Summary',
            actions: 'Actions',
            executionStatus: 'Execution Status',
            executionTimeline: 'Execution Timeline',
            executionResult: 'Execution Result',
            executionSummaryText:
              '{status}: {executed} executed, {skipped} skipped, {failed} failed.',
            awaitingConfirmation: 'awaiting confirmation',
            executionRecorded: 'execution recorded',
            recoveryTitle: 'Recovery',
            recoveryRetryReady:
              'You can retry execution after fixing the failed action inputs or runtime issue.',
            recoverySuggestions: 'Recommended recovery steps:',
            planReady: 'Automation plan ready',
            planFailed: 'Automation plan failed',
            executed: 'Automation executed',
            executeFailed: 'Automation execute failed',
            toolLabels: {
              createGoal: 'Create Goal',
              createKeyResult: 'Create Key Result',
              createTaskTemplate: 'Create Task Template',
              searchNotes: 'Search Notes',
              fetchStats: 'Fetch Stats',
            },
            statusLabels: {
              executed: 'Executed',
              skipped: 'Skipped',
              failed: 'Failed',
            },
            outcomeLabels: {
              success: 'Success',
              partial: 'Partial success',
              failed: 'Failed',
            },
          },
          note: {
            drafting: 'Drafting note',
            draft: 'Draft Note',
            draftTitle: 'Knowledge Note Draft',
            draftReady: 'Knowledge note draft ready',
            draftFailed: 'Draft note failed',
            creating: 'Creating note',
            created: 'Created note',
            createFailed: 'Create note failed',
            previewUnavailable: 'Preview unavailable',
          },
          knowledge: {
            searching: 'Searching knowledge',
            ask: 'Ask Knowledge Base',
            answer: 'Knowledge Answer',
            question: 'Question',
            citations: 'Citations',
            grounded: 'Grounded in repository citations',
            insufficientEvidence: 'Current knowledge base evidence is insufficient',
            matchedResources: '{count} note(s) matched in {ms} ms.',
            queryCompleted: 'Knowledge answer ready',
            queryFailed: 'Failed to query knowledge',
            relatedNotes: 'Related Notes',
            openCitation: 'Open Source',
          },
        },
        goalDraft: {
          creatingGoal: 'Creating goal',
        },
        chatPage: {
          welcomeTitle: 'What do you want to move forward today?',
          welcomeDescription: 'Pick a shortcut card.',
          emptyTitle: 'Start a conversation',
          emptyDescription: 'Describe what you want to do.',
          emptyModels: 'No models available',
          context: {
            title: 'Context',
            hostWorkbenchTitle: 'Host Proposal Workbench',
            hostProposalPending: '{count} proposal(s) waiting for approval',
            hostReceiptTitle: 'Host Execution Report',
            hostReceiptSubtitle: 'Post-approval execution outcomes',
            hostReceiptPending: '{count} execution report(s)',
            hostReceiptKindGoal: 'Goal create',
            hostReceiptKindKnowledge: 'Knowledge write',
            hostReceiptStatusOk: 'Succeeded',
            hostReceiptStatusPartial: 'Partial',
            hostReceiptStatusFailed: 'Failed',
            hostReceiptStatusCancelled: 'Cancelled',
            hostReceiptExecuted: 'Executed',
            hostReceiptSkipped: 'Skipped',
            hostReceiptFailed: 'Failed',
            hostReceiptEntities: 'Entities: {ids}',
            hostTimelineTitle: 'Host artifacts (timeline)',
            hostTimelineProposal: 'Pending proposal',
            hostTimelineReceipt: 'Execution report',
            hostTimelineStatusPending: 'Awaiting approval',
            hostTimelineOpenWorkbench: 'Open Host workbench',
            hostTimelineEngineGoal: 'Agent · Goal',
            hostTimelineEngineKnowledge: 'Agent · Knowledge',
            hostTimelineEngineTask: 'Agent · Task',
            hostTimelineEngineUnknown: 'Host · Unknown',
            hostTimelineOpenChat: 'Open chat',
            hostTimelineOpenChatKind: 'Turn',
            hostTimelineOpenChatHint: 'Host open-chat turn (engine badge)',
            hostReceiptActionExecuted: 'Executed',
            hostReceiptActionSkipped: 'Skipped',
            hostReceiptActionFailed: 'Failed',
            hostReceiptOpenGoal: 'Open goal',
            hostReceiptOpenNote: 'Open note',
            show: 'Show context',
            hide: 'Hide context',
            todayOverview: 'Today',
          },
          shortcuts: {
            chat: { title: 'Just chat', description: 'Chat', prefill: 'chat prefill' },
            goalCreate: { title: 'Plan a goal', description: 'Goal', prefill: 'goal prefill' },
            taskCreate: { title: 'Create a task', description: 'Task', prefill: 'task prefill' },
            knowledgeGenerate: {
              title: 'Write a note',
              description: 'Note',
              prefill: 'note prefill',
            },
            knowledgeQa: { title: 'Ask KB', description: 'QA', prefill: 'qa prefill' },
          },
          sidebar: {
            open: 'Open sidebar',
            close: 'Close sidebar',
            recentGoals: 'Recent Goals',
            noRecentGoals: 'No recent goals',
            recentKnowledgeNotes: 'Recent Knowledge Notes',
            noRecentKnowledgeNotes: 'No recent knowledge notes',
            goalProgress: '{progress}%',
          },
          toolIntro: {
            goalCreate: {
              title: 'Goal mode',
              description: 'Turn the conversation into a goal draft.',
            },
            knowledgeQa: {
              title: 'Knowledge Q&A mode',
              description: 'Ask the knowledge base.',
            },
            knowledgeGenerate: {
              title: 'Note mode',
              description: 'Turn the conversation into a note.',
            },
          },
          workflow: {
            activeMode: 'Active mode',
            toolButton: 'Tools',
            goalDraftTitle: 'Goal draft',
            goalCollectingHint: 'Collecting details for the goal',
            goalClarificationHint: 'Needs clarification',
            goalDraftReadyHint: 'Draft ready',
            goalClarificationTitle: 'Goal clarification',
            goalClarificationAnswerPlaceholder: 'Answer here',
            noteCreatedHint: 'Note created: {path}',
            noteCollectingHint: 'Collecting note context',
            noteDraftReadyHint: 'Note draft ready',
            knowledgeQaCollectingHint: 'Collecting knowledge question',
            generateGoalDraft: 'Generate goal draft',
            submitGoalClarification: 'Continue With Answers',
            regenerateGoalDraft: 'Regenerate draft',
            createGoalDirectly: 'Create goal directly',
            editGoalBeforeCreate: 'Edit goal before create',
            hideGoalEditor: 'Hide goal editor',
            createKnowledgeNote: 'Create Knowledge Note',
            exitTool: 'Exit tool',
            ungroundedHint: 'Not grounded enough to draft a note.',
            openCreatedNote: 'Open note',
            startAnotherNote: 'Start another note',
            defaultConversationNames: {
              goalCreate: 'Goal conversation',
              taskCreate: 'Task conversation',
              knowledgeQa: 'Knowledge Q&A conversation',
              knowledgeGenerate: 'Knowledge note conversation',
            },
            tools: {
              chat: 'Chat',
              goalCreate: 'Goal',
              taskCreate: 'Task',
              knowledgeQa: 'Knowledge Q&A',
              knowledgeGenerate: 'Knowledge note',
            },
            noteTopicFallback: 'New note topic',
          },
          hostProposals: {
            title: 'Host Proposals',
            lifecycleOnly: 'Host lifecycle only — business execution runs after approval.',
            kindGoal: 'Goal create',
            kindKnowledge: 'Knowledge write',
            kindTask: 'Task create',
            revision: 'Rev {revision}',
            pendingActions: '{count} pending action(s)',
            editTitle: 'Proposal title',
            editTargetPath: 'Vault-relative path',
            editContent: 'Note markdown',
            revise: 'Save revision',
            approve: 'Approve',
            reject: 'Reject',
            rejectReason: 'Reject reason (optional)',
            rejectReasonPlaceholder: 'Why is this proposal being rejected?',
            busy: 'Updating...',
          },
        },
        actions: {
          automateGoalSetup: 'Automate goal setup',
          expandDraft: 'Expand draft',
          askKnowledge: 'Ask knowledge',
          askAnalytics: 'Ask analytics',
          viewQualityReports: 'View quality reports',
        },
      },
    },
  },
});

const ButtonStub = defineComponent({
  name: 'ButtonStub',
  props: ['disabled', 'variant', 'size', 'title'],
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          type: 'button',
          disabled: props.disabled,
          title: props.title,
        },
        slots.default?.(),
      );
  },
});

const SelectItemStub = defineComponent({
  name: 'SelectItemStub',
  props: ['value'],
  setup(props, { slots }) {
    return () => h('option', { value: props.value }, slots.default?.());
  },
});

const AIFooterComposerStub = defineComponent({
  name: 'AIFooterComposerStub',
  setup(_, { slots }) {
    return () =>
      h('div', { 'data-testid': 'ai-footer-composer-stub' }, [
        slots.default?.(),
        slots['action-rail']?.(),
      ]);
  },
});

const AIMessagePanelStub = defineComponent({
  name: 'AIMessagePanelStub',
  setup(_, { slots }) {
    return () => h('div', { 'data-testid': 'ai-message-panel-stub' }, slots.default?.());
  },
});

const AIGoalWorkflowPanelStub = defineComponent({
  name: 'AIGoalWorkflowPanelStub',
  props: [
    'toolMode',
    'goalClarification',
    'goalWorkflowRun',
    'clarificationAnswers',
    'editableGoal',
    'editableKeyResults',
    'editableTaskTemplates',
    'editableReminders',
    'showGoalDraftEditor',
    'knowledgeAnswer',
    'knowledgeQaAgentRun',
    'noteAgentRun',
    'noteSummary',
    'notePreview',
  ],
  emits: [
    'update:clarification-answers',
    'open-knowledge-citation',
    'update-goal',
    'update-key-result',
    'add-key-result',
    'remove-key-result',
    'add-task-template',
    'remove-task-template',
    'update-task-template',
    'add-reminder',
    'remove-reminder',
    'update-reminder',
  ],
  setup(props, { emit }) {
    return () => {
      const fragments = [];
      if (props.toolMode === 'goal-create' && props.goalWorkflowRun) {
        const run = props.goalWorkflowRun as AIWorkflowRunView;
        const suspension = run.suspension;
        fragments.push(
          h('div', { 'data-testid': 'goal-workflow-panel' }, [
            h('h3', 'Goal Workflow'),
            h('p', run.status),
          ]),
        );
        if (suspension?.type === 'clarification_required') {
          const answers = [...(props.clarificationAnswers ?? [])];
          fragments.push(
            h('div', { 'data-testid': 'goal-clarification-panel' }, [
              h('h3', 'Goal clarification'),
              h('p', 'Needs clarification'),
              ...suspension.questions.map((question: string, i: number) =>
                h('div', [
                  h('p', question),
                  h('textarea', {
                    placeholder: 'Answer here',
                    value: answers[i] ?? '',
                    onInput: (e: Event) => {
                      const next = [...answers];
                      next[i] = (e.target as HTMLTextAreaElement).value;
                      emit('update:clarification-answers', next);
                    },
                  }),
                ]),
              ),
            ]),
          );
        }
        if (suspension?.type === 'goal_draft_review') {
          fragments.push(
            h('div', { 'data-testid': 'goal-workflow-review' }, [
              h('h3', 'Goal draft'),
              h('p', suspension.draft.goal.name),
              h('p', suspension.draft.goal.description),
              h('p', suspension.draft.rationale),
              ...(props.showGoalDraftEditor
                ? [
                    h(
                      'button',
                      {
                        'data-testid': 'goal-workflow-draft-editor-update',
                        onClick: () => {
                          emit('update-goal', {
                            ...props.editableGoal,
                            name: 'Edited Workflow Goal',
                            description: 'Edited before Workflow approval.',
                          });
                        },
                      },
                      'Edit workflow draft',
                    ),
                  ]
                : []),
            ]),
          );
        }
        if (suspension?.type === 'recovery_required') {
          fragments.push(
            h('div', { 'data-testid': 'goal-workflow-recovery' }, [
              h('h3', 'Recovery'),
              h('p', suspension.retryable ? 'retryable' : 'blocked'),
              ...suspension.failures.map((failure: Record<string, unknown>) =>
                h('p', String(failure.message ?? failure.code ?? '')),
              ),
            ]),
          );
        }
        if (run.kind === 'goal.create' && run.result) {
          fragments.push(
            h('div', { 'data-testid': 'goal-workflow-result' }, [
              h('h3', 'Execution Status'),
              h('p', run.result.status),
              h('p', run.result.goalId ?? ''),
              ...run.result.failures.map((failure) => h('p', failure.message)),
            ]),
          );
        }
      }
      if (props.toolMode === 'knowledge-qa' && props.knowledgeAnswer) {
        const answer = props.knowledgeAnswer;
        const relatedNotes = answer.relatedNotes?.length
          ? answer.relatedNotes
          : (answer.citations ?? []).filter(
              (
                citation: Record<string, unknown>,
                index: number,
                citations: Array<Record<string, unknown>>,
              ) => citations.findIndex((item) => item.resourceId === citation.resourceId) === index,
            );
        fragments.push(
          h('div', { 'data-testid': 'knowledge-answer-panel' }, [
            h('h3', 'Knowledge Answer'),
            h(
              'p',
              answer.evidenceStatus === 'grounded'
                ? 'Grounded in repository citations'
                : 'Current knowledge base evidence is insufficient',
            ),
            h('p', answer.question ?? ''),
            h('p', answer.answer ?? ''),
            h(
              'p',
              `${answer.matchedResourceCount} note(s) matched in ${answer.processingTimeMs} ms.`,
            ),
            ...(relatedNotes ?? []).map((note: Record<string, unknown>) =>
              h('div', [
                h('h4', 'Related Notes'),
                h('p', String(note.title ?? '')),
                h('p', String(note.resourcePath ?? '')),
                h(
                  'button',
                  {
                    type: 'button',
                    'data-testid': 'knowledge-related-note-open',
                    onClick: () => emit('open-knowledge-citation', String(note.resourceId ?? '')),
                  },
                  'Open Source',
                ),
              ]),
            ),
            ...(answer.citations ?? []).map((citation: Record<string, unknown>) =>
              h('div', [
                h('p', String(citation.title ?? '')),
                h('p', String(citation.resourcePath ?? '')),
                h('p', String(citation.excerpt ?? '')),
                h(
                  'button',
                  {
                    type: 'button',
                    'data-testid': 'knowledge-citation-open',
                    onClick: () =>
                      emit('open-knowledge-citation', String(citation.resourceId ?? '')),
                  },
                  'Open Source',
                ),
              ]),
            ),
            ...(props.knowledgeQaAgentRun
              ? [
                  h('h4', 'Observability'),
                  h(
                    'p',
                    `${props.knowledgeQaAgentRun.state.usage.promptTokens ?? 0} prompt · ${props.knowledgeQaAgentRun.state.usage.completionTokens ?? 0} completion · ${props.knowledgeQaAgentRun.state.usage.totalTokens ?? 0} total`,
                  ),
                  ...props.knowledgeQaAgentRun.events.map((event: Record<string, unknown>) =>
                    h(
                      'p',
                      // Residual 1332/415: product path humanizes node.* via LangGraph boundary.
                      formatLangGraphVendorDiagnosticEventLabel({
                        type: String(event.type ?? ''),
                        detail: String(
                          (event.data as Record<string, unknown> | undefined)?.node ??
                            (event.data as Record<string, unknown> | undefined)?.tool ??
                            '',
                        ),
                      }),
                    ),
                  ),
                ]
              : []),
          ]),
        );
      }
      if (
        (props.toolMode === 'knowledge-generate' || props.toolMode === 'knowledge-qa') &&
        props.noteAgentRun &&
        !props.noteSummary
      ) {
        const run = props.noteAgentRun;
        fragments.push(
          h('div', { 'data-testid': 'knowledge-note-agent-panel' }, [
            h('h3', 'Knowledge Note Draft'),
            h('p', run.run.status),
            h('p', run.state.stage),
            ...(run.state.artifacts ?? []).map((artifact: Record<string, unknown>) =>
              h('div', [
                h('p', String(artifact.title ?? artifact.kind ?? '')),
                h(
                  'p',
                  String((artifact.data as Record<string, unknown> | undefined)?.markdown ?? ''),
                ),
              ]),
            ),
          ]),
        );
      }
      if (
        (props.toolMode === 'knowledge-generate' || props.toolMode === 'knowledge-qa') &&
        props.noteSummary
      ) {
        fragments.push(
          h('div', { 'data-testid': 'knowledge-note-summary-panel' }, [
            h('h3', 'Knowledge Note Created'),
            h('p', props.noteSummary.note?.name ?? ''),
            h('p', props.noteSummary.resolvedPath ?? ''),
            h('p', props.noteSummary.indexStatus ?? ''),
            h('p', props.notePreview ?? ''),
          ]),
        );
      }
      return h('div', { 'data-testid': 'goal-workflow-stub' }, fragments);
    };
  },
});

const DivStub = defineComponent({
  name: 'DivStub',
  setup(_, { attrs, slots }) {
    return () => h('div', attrs, slots.default?.());
  },
});

function createGoalDraft(title: string, description: string) {
  return {
    state: 'draft',
    goal: {
      title,
      description,
      category: 'learning',
      importance: 'Important',
      tags: ['ai'],
      suggestedStartDate: 1,
      suggestedEndDate: 2,
    },
    keyResults: [],
  };
}

type GoalWorkflowRun = Extract<AIWorkflowRunView, { kind: 'goal.create' }>;

function createGoalWorkflowDraft(overrides: Partial<GoalPlanDraft> = {}): GoalPlanDraft {
  const base: GoalPlanDraft = {
    revision: 1,
    goal: {
      name: 'Workflow AI Goal',
      description: 'Generated by the durable Workflow runtime',
      category: 'learning',
      importance: 'Important',
      tags: ['ai'],
      startDate: 1_777_000_000_000,
      targetDate: 1_780_000_000_000,
    },
    keyResults: [],
    taskTemplates: [],
    reminders: [],
    rationale: 'The request is concrete enough to review.',
    warnings: [],
  };
  return {
    ...base,
    ...overrides,
    goal: { ...base.goal, ...(overrides.goal ?? {}) },
    keyResults: overrides.keyResults ?? base.keyResults,
    taskTemplates: overrides.taskTemplates ?? base.taskTemplates,
    reminders: overrides.reminders ?? base.reminders,
    warnings: overrides.warnings ?? base.warnings,
  };
}

function createGoalWorkflowRun(overrides: Partial<GoalWorkflowRun> = {}): GoalWorkflowRun {
  const draft = createGoalWorkflowDraft();
  return {
    runId: 'goal-workflow-1',
    kind: 'goal.create',
    conversationId: 'conv-1',
    status: 'suspended',
    suspension: {
      type: 'goal_draft_review',
      draft,
      warnings: draft.warnings,
      revision: draft.revision,
    },
    createdAt: 1,
    updatedAt: 2,
    ...overrides,
  } as GoalWorkflowRun;
}

interface AutomationResult {
  summary: string;
  plan: Record<string, unknown>;
  actions: Array<{ tool: string; rationale: string }>;
  executedActions: Array<Record<string, unknown>> | undefined;
  executionSummary: Record<string, unknown> | undefined;
  recovery: Record<string, unknown> | undefined;
  providerId: string;
  tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number };
  processingTimeMs: number;
}

function createAutomationResult(overrides?: Partial<AutomationResult>) {
  return {
    summary: 'Drafted a practical execution plan.',
    plan: {
      goal: {
        title: 'Generated AI Goal',
        description: 'Generated from the current conversation',
      },
      keyResults: [],
      taskTemplates: [],
    },
    actions: [
      {
        tool: 'create_goal',
        rationale: 'Create the goal first.',
      },
    ],
    executedActions: undefined,
    executionSummary: undefined,
    recovery: undefined,
    providerId: 'provider-1',
    tokenUsage: {
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
    },
    processingTimeMs: 80,
    ...overrides,
  };
}

function createAgentRunResult(overrides?: {
  status?: string;
  stage?: string;
  artifacts?: Array<Record<string, unknown>>;
  approvedActions?: Array<Record<string, unknown>>;
  executedActions?: Array<Record<string, unknown>>;
  interrupts?: Array<Record<string, unknown>>;
}) {
  const status = overrides?.status ?? 'waiting_approval';
  const clarificationInterrupt = {
    type: 'clarification.required',
    runId: 'run-1',
    threadId: 'thread-1',
    agentType: 'goal.create',
    rationale: 'The goal idea is too brief to produce a reliable goal draft.',
    questions: [
      {
        question: 'What concrete outcome should this goal produce?',
        context: 'This keeps the generated goal measurable.',
      },
      {
        question: 'When do you want to review or finish it?',
        context: 'A timeframe keeps the plan realistic.',
      },
    ],
  };
  return {
    run: {
      runId: 'run-1',
      threadId: 'thread-1',
      conversationId: 'conv-1',
      identityId: 'identity-1',
      agentType: 'goal.create',
      status,
      createdAt: 1,
      updatedAt: 2,
    },
    state: {
      messages: [],
      intent: 'goal-create',
      stage: overrides?.stage ?? 'approval',
      artifacts:
        overrides?.artifacts ??
        (status === 'waiting_clarification'
          ? []
          : [
              {
                artifactId: 'artifact-1',
                kind: 'goal_draft',
                title: 'Agent AI Goal',
                data: {
                  title: 'Agent AI Goal',
                  description: 'Generated by the Agent runtime',
                  category: 'learning',
                  importance: 'Important',
                  tags: ['ai'],
                  suggestedStartDate: 1,
                  suggestedEndDate: 2,
                  taskTemplates: [
                    {
                      name: 'Weekly implementation block',
                      description: 'Reserve implementation time.',
                      importance: 'Important',
                      cadence: 'weekly',
                    },
                  ],
                  reminders: [
                    {
                      title: 'Weekly review reminder',
                      description: 'Review Agent implementation progress.',
                      importance: 'Moderate',
                      cadence: 'weekly',
                      timeOfDay: '09:00',
                    },
                  ],
                },
                updatedAt: 2,
              },
              {
                artifactId: 'artifact-2',
                kind: 'action_plan',
                title: 'Approval plan',
                data: {
                  summary: 'Create one goal after approval.',
                },
                updatedAt: 2,
              },
            ]),
      citations: [],
      retrievedContext: [],
      pendingActions:
        status === 'waiting_approval'
          ? [
              {
                tool: 'create_goal',
                payload: { title: 'Agent AI Goal' },
                rationale: 'Create the approved goal draft after user confirmation.',
                index: 0,
                dependsOn: [],
              },
              {
                tool: 'create_task_template',
                payload: { name: 'Weekly implementation block' },
                rationale: 'Create the weekly implementation task template.',
                index: 0,
                dependsOn: [0],
              },
              {
                tool: 'create_reminder',
                payload: { title: 'Weekly review reminder' },
                rationale: 'Create the weekly review reminder.',
                index: 0,
                dependsOn: [0],
              },
            ]
          : [],
      approvedActions: overrides?.approvedActions ?? [],
      executedActions: overrides?.executedActions ?? [],
      usage: {},
      errors: [],
    },
    events: [],
    interrupts:
      overrides?.interrupts ??
      (status === 'waiting_approval'
        ? [{ runId: 'run-1' }]
        : status === 'waiting_clarification'
          ? [clarificationInterrupt]
          : []),
  };
}

function createKnowledgeAnswer(overrides?: {
  question?: string;
  answer?: string;
  citations?: Array<Record<string, unknown>>;
  evidenceStatus?: 'grounded' | 'insufficient';
}) {
  const citations = overrides?.citations ?? [
    {
      resourceId: 'resource-1',
      resourcePath: 'notes/ai/grounded-answer.md',
      title: 'Grounded Answer',
      chunkIndex: 0,
      excerpt: 'Repository evidence says to keep answers grounded in citations.',
      score: 0.92,
    },
  ];

  return {
    answer: overrides?.answer ?? 'Use cited repository excerpts to answer the question.',
    citations,
    providerId: 'provider-1',
    tokenUsage: {
      promptTokens: 12,
      completionTokens: 8,
      totalTokens: 20,
    },
    processingTimeMs: 42,
    matchedResourceCount: citations.length,
    question: overrides?.question ?? 'How should knowledge answers be grounded?',
    evidenceStatus: overrides?.evidenceStatus ?? (citations.length ? 'grounded' : 'insufficient'),
  };
}

function createKnowledgeQaAgentRunResult(overrides?: {
  answer?: ReturnType<typeof createKnowledgeAnswer>;
  conversationId?: string;
  runId?: string;
  threadId?: string;
}) {
  const answer =
    overrides?.answer ??
    createKnowledgeAnswer({
      question: 'What does run history say about grounded answers?',
      answer: 'Run history answers should keep citations attached.',
    });
  const runId = overrides?.runId ?? 'knowledge-qa-run-1';
  return {
    run: {
      runId,
      threadId: overrides?.threadId ?? 'knowledge-qa-thread-1',
      conversationId: overrides?.conversationId ?? 'conv-4',
      identityId: 'identity-1',
      agentType: 'knowledge.qa',
      status: 'completed',
      createdAt: 1,
      updatedAt: 2,
    },
    state: {
      messages: [],
      intent: 'knowledge-qa',
      stage: 'result',
      artifacts: [
        {
          artifactId: `${runId}:answer`,
          kind: 'knowledge_answer',
          title: answer.question,
          data: {
            question: answer.question,
            answer: answer.answer,
            evidenceStatus: answer.evidenceStatus,
            matchedResourceCount: answer.matchedResourceCount,
            providerId: answer.providerId,
            processingTimeMs: answer.processingTimeMs,
          },
          updatedAt: 2,
        },
      ],
      citations: answer.citations,
      retrievedContext: [],
      pendingActions: [],
      approvedActions: [],
      executedActions: [],
      usage: answer.tokenUsage,
      errors: [],
    },
    events: [
      {
        eventId: 'knowledge-qa-run-1:0',
        runId,
        sequence: 0,
        type: 'node.completed',
        createdAt: 1,
        data: {
          node: 'search_knowledge',
          durationMs: 31,
        },
      },
    ],
    interrupts: [],
  };
}

function createKnowledgeNoteResult() {
  return {
    note: {
      id: 'note-resource-1',
      name: 'Grounded Q&A Note.md',
      content: '# Grounded Q&A Note\n\nSaved from the knowledge answer.',
    },
    resolvedPath: 'notes/ai/Grounded Q&A Note.md',
    indexStatus: 'pending',
    tokenUsage: {
      promptTokens: 20,
      completionTokens: 30,
      totalTokens: 50,
    },
    providerId: 'provider-1',
    processingTimeMs: 120,
    generatedAt: 10,
  };
}

function createKnowledgeNoteAgentRunResult(overrides?: {
  topic?: string;
  markdown?: string;
  targetSubpath?: string;
  status?: string;
  artifacts?: Array<Record<string, unknown>>;
  approvedActions?: Array<Record<string, unknown>>;
  executedActions?: Array<Record<string, unknown>>;
}) {
  const topic = overrides?.topic ?? 'User: Summarize agent notes.';
  const markdown = overrides?.markdown ?? '# AI Note Draft\n\nDrafted from the conversation.';
  const targetSubpath = overrides?.targetSubpath ?? 'notes/ai';
  const status = overrides?.status ?? 'waiting_approval';
  const draftArtifactId = 'note-run-1:knowledge-note-draft';
  const pendingAction = {
    tool: 'create_knowledge_note',
    payload: {
      topic,
      title: 'AI Note Draft',
      contentArtifactId: draftArtifactId,
      contentMarkdown: markdown,
      targetSubpath,
      providerId: 'provider-1',
      model: 'gpt-4o-mini',
    },
    rationale: 'Persist the approved knowledge note draft.',
    index: 0,
    dependsOn: [],
  };
  return {
    run: {
      runId: 'note-run-1',
      threadId: 'note-thread-1',
      conversationId: 'conv-1',
      identityId: 'identity-1',
      agentType: 'knowledge.generate',
      status,
      createdAt: 1,
      updatedAt: 2,
    },
    state: {
      messages: [],
      intent: 'knowledge-generate',
      stage: status === 'completed' ? 'result' : 'approval',
      artifacts: overrides?.artifacts ?? [
        {
          artifactId: draftArtifactId,
          kind: 'knowledge_note_draft',
          title: 'AI Note Draft',
          data: {
            topic,
            title: 'AI Note Draft',
            markdown,
            source: topic,
            targetSubpath,
            tags: [],
            duplicateRisk: 'unknown',
            indexStatus: 'draft',
          },
          updatedAt: 2,
        },
      ],
      citations: [],
      retrievedContext: [],
      pendingActions: status === 'waiting_approval' ? [pendingAction] : [],
      approvedActions:
        overrides?.approvedActions ?? (status === 'waiting_execution' ? [pendingAction] : []),
      executedActions: overrides?.executedActions ?? [],
      usage: {},
      errors: [],
    },
    events: [],
    interrupts: status === 'waiting_approval' ? [{ runId: 'note-run-1' }] : [],
  };
}

function createFailedKnowledgeNoteAgentRunResult(overrides?: {
  topic?: string;
  markdown?: string;
  targetSubpath?: string;
}) {
  const base = createKnowledgeNoteAgentRunResult({
    ...overrides,
    status: 'waiting_execution',
  });
  const approvedActions = base.state.approvedActions;
  const failedAction = {
    tool: 'create_knowledge_note',
    status: 'failed',
    message: 'Repository write failed.',
  };

  return createKnowledgeNoteAgentRunResult({
    ...overrides,
    status: 'completed',
    approvedActions,
    executedActions: [failedAction],
    artifacts: [
      ...base.state.artifacts,
      {
        artifactId: 'note-run-1:knowledge-note-execution',
        kind: 'execution_timeline',
        title: 'Knowledge note save result',
        data: {
          summary: {
            status: 'failed',
            executedCount: 0,
            failedCount: 1,
          },
          executedActions: [failedAction],
          recovery: {
            canRetry: true,
            failedActions: [failedAction],
            skippedActions: [],
            suggestions: ['Review the knowledge note save error and retry.'],
            retryApprovedActions: approvedActions,
          },
        },
        updatedAt: 3,
      },
    ],
  });
}

function createSavedKnowledgeNoteAgentRunResult(overrides?: {
  topic?: string;
  markdown?: string;
  targetSubpath?: string;
}) {
  const saved = createKnowledgeNoteResult();
  return createKnowledgeNoteAgentRunResult({
    ...overrides,
    status: 'completed',
    executedActions: [
      {
        tool: 'create_knowledge_note',
        status: 'executed',
        entityId: saved.note.id,
        message: `Saved knowledge note to ${saved.resolvedPath}.`,
        data: {
          resolvedPath: saved.resolvedPath,
          indexStatus: saved.indexStatus,
          note: {
            id: saved.note.id,
            name: saved.note.name,
            content: saved.note.content,
          },
        },
      },
    ],
  });
}

const dashboardServiceFake = {
  getDashboardStats: vi.fn().mockResolvedValue({
    ok: true,
    data: {
      stats: {
        activeTasks: 0,
        completedToday: 0,
        activeGoals: 0,
        upcomingReminders: 0,
        unreadNotifications: 0,
        scheduleConflicts: 0,
      },
      activityTimeline: [],
      trendDays: [],
      goalProgress: [],
      taskBoard: { todo: 0, inProgress: 0, done: 0, overdue: 0 },
      upcomingSchedule: [],
    },
  }),
};

let aiServiceForRuntime: { listMessages: ReturnType<typeof vi.fn> } | null = null;

const assistantRuntimeFake = {
  listMessages: vi.fn(async (conversationId: string) => {
    const result = await aiServiceForRuntime?.listMessages(conversationId, {
      page: 1,
      pageSize: 80,
    });
    const envelope = result as
      | {
          ok?: boolean;
          data?: {
            data?: Array<{ id?: unknown; role?: unknown; content?: unknown; createdAt?: unknown }>;
          };
        }
      | undefined;
    const source = envelope?.ok ? (envelope.data?.data ?? []) : [];
    return {
      conversationId,
      messages: source.map((message, index) => ({
        id: message.id ? String(message.id) : `message-${index}`,
        conversationId,
        role:
          message.role === 'user' || message.role === 'User'
            ? ('user' as const)
            : message.role === 'system' || message.role === 'System'
              ? ('system' as const)
              : ('assistant' as const),
        content: typeof message.content === 'string' ? message.content : '',
        createdAt: typeof message.createdAt === 'number' ? message.createdAt : index,
      })),
    };
  }),
  deleteConversation: vi.fn(async () => true),
  streamMessage: vi.fn(async () => {}),
  cancelRun: vi.fn(async () => true),
};

const workflowRuntimeFake = {
  start: vi.fn(),
  resume: vi.fn(),
  get: vi.fn(async () => null),
  list: vi.fn(async () => []),
  cancel: vi.fn(async () => null),
};

const taskServiceFake = {
  listTemplates: vi.fn(async () => ok([])),
  getTaskGraph: vi.fn(async () => ok({ nodes: [], edges: [] })),
  getTemplate: vi.fn(async () => ok(null)),
  createTemplate: vi.fn(async () => ok({ template: { id: 'task-template-1', name: 'Task' } })),
  updateTemplate: vi.fn(async () => ok(null)),
  deleteTemplate: vi.fn(async () => ok(undefined)),
  activateTemplate: vi.fn(async () => ok(null)),
  pauseTemplate: vi.fn(async () => ok(null)),
  archiveTemplate: vi.fn(async () => ok(null)),
};

function mountView() {
  const runtime = createTestServerStateRuntime();
  return shallowMount(AIChatView, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient: runtime.queryClient }], i18n],
      provide: {
        [DASHBOARD_SERVICE_KEY as symbol]: dashboardServiceFake,
        // Residual 1332: AIChatView mounts useTaskTemplateMutations() for Host task.create settlement.
        [TASK_SERVICE_KEY as symbol]: taskServiceFake,
        [AI_ASSISTANT_RUNTIME_KEY as symbol]: assistantRuntimeFake,
        [AI_WORKFLOW_RUNTIME_KEY as symbol]: workflowRuntimeFake,
        [ASSISTANT_SURFACE_KEY as symbol]: 'web',
        [SERVER_STATE_RUNTIME_KEY]: runtime,
        [SERVER_STATE_IDENTITY_SCOPE_KEY]: () => 'identity-1',
      },
      stubs: {
        Teleport: false,
        Button: ButtonStub,
        DropdownMenu: DivStub,
        DropdownMenuContent: DivStub,
        DropdownMenuItem: ButtonStub,
        DropdownMenuSeparator: DivStub,
        DropdownMenuTrigger: DivStub,
        Select: DivStub,
        SelectContent: DivStub,
        SelectGroup: DivStub,
        SelectItem: SelectItemStub,
        SelectLabel: DivStub,
        SelectTrigger: DivStub,
        SelectValue: DivStub,
        AIGoalDraftEditor: DivStub,
        AIMessagePanel: AIMessagePanelStub,
        AIGoalWorkflowPanel: AIGoalWorkflowPanelStub,
        AIFooterComposer: AIFooterComposerStub,
        // 右栏容器与工作流操作条渲染真实实现：
        // goal-agent-* / ai-context-panel 等契约断言依赖其真实模板。
        AIContextPanel: false,
        AIWorkflowActionBar: false,
        // Residual 357: Host proposal panel real template for ai-host-proposal-* contracts.
        AIHostProposalPanel: false,
        AIHostExecutionReceiptPanel: false,
        AIHostTimelineArtifactStrip: false,
      },
    },
  });
}

describe('AIChatView', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.push.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
    mocks.useAI.mockReset();
    mocks.useGoal.mockReset();
    mocks.useRecentKnowledgeNotes.mockReset();
    mocks.useUserSetting.mockReset();

    const providers = ref<unknown[]>([]);
    const goals = ref([]);
    assistantRuntimeFake.listMessages.mockClear();
    assistantRuntimeFake.deleteConversation.mockReset().mockResolvedValue(true);
    assistantRuntimeFake.streamMessage.mockReset().mockResolvedValue(undefined);
    assistantRuntimeFake.cancelRun.mockReset().mockResolvedValue(true);
    workflowRuntimeFake.start.mockReset();
    workflowRuntimeFake.resume.mockReset();
    workflowRuntimeFake.get.mockReset().mockResolvedValue(null);
    workflowRuntimeFake.list.mockReset().mockResolvedValue([]);
    workflowRuntimeFake.cancel.mockReset().mockResolvedValue(null);

    const aiService = {
      listConversations: vi.fn(),
      listMessages: vi.fn(),
      createConversation: vi.fn(),
      updateConversation: vi.fn(async () => ok({})),
      deleteConversation: vi.fn(),
      generateGoal: vi.fn(),
      queryKnowledge: vi.fn(),
      listAgentRuns: vi.fn(async () => ok([])),
      startAgentRun: vi.fn(),
      resumeAgentRun: vi.fn(),
      getAgentRun: vi.fn(),
      getAgentEvents: vi.fn(),
      createKnowledgeNote: vi.fn(),
      dispatchAssistant: vi.fn(async (command, handlers) => {
        if (command?.type === 'revise_proposal') {
          handlers?.onEvent?.({
            type: 'proposal.revised',
            runId: command.runId,
            proposalId: command.proposalId,
            revision: (command.revision ?? 1) + 1,
            kind: String(command.proposalId).includes('knowledge.write')
              ? 'knowledge.write'
              : 'goal.create',
            title: command.patch?.title,
          });
          return;
        }
        if (command?.type === 'approve_proposal') {
          handlers?.onEvent?.({
            type: 'proposal.approved',
            runId: command.runId,
            proposalId: command.proposalId,
            revision: command.revision,
          });
          return;
        }
        if (command?.type === 'reject_proposal') {
          handlers?.onEvent?.({
            type: 'proposal.rejected',
            runId: command.runId,
            proposalId: command.proposalId,
            revision: command.revision,
            reason: command.reason,
          });
          return;
        }
      }),
    };
    aiServiceForRuntime = aiService;
    const loadProviders = vi.fn(async () => {
      providers.value = [
        {
          id: 'provider-1',
          name: 'Main provider',
          defaultModel: 'gpt-4o-mini',
          availableModels: [{ id: 'gpt-4o-mini', name: 'gpt-4o-mini' }],
          isDefault: true,
        },
      ];
      return providers.value;
    });
    const createGoal = vi.fn();
    const addKeyResult = vi.fn();
    const fetchGoals = vi.fn(async () => {});
    const recentNotes = ref<
      Array<{
        id: string;
        title: string;
        path: string;
        updatedAt: number;
        source: 'projection' | 'local-vault';
      }>
    >([]);
    const loadRecentKnowledgeNotes = vi.fn(async () => {});

    mocks.useAI.mockReturnValue({
      service: aiService,
      providers,
      loadProviders,
    });
    mocks.useGoal.mockReturnValue({
      goals,
      fetchGoals,
      createGoal,
      addKeyResult,
    });
    mocks.useRecentKnowledgeNotes.mockReturnValue({
      notes: recentNotes,
      error: ref(null),
      errorMessageKey: ref(null),
      emailVerificationRequired: ref(false),
      isLoading: ref(false),
      load: loadRecentKnowledgeNotes,
    });
    mocks.useUserSetting.mockReturnValue({
      getCategory: () => ({}),
    });

    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      lineHeight: '20',
      paddingTop: '0',
      paddingBottom: '0',
      borderTopWidth: '0',
      borderBottomWidth: '0',
    } as CSSStyleDeclaration);
    vi.spyOn(HTMLElement.prototype, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('refreshes a persisted goal Workflow reference from the authoritative runtime snapshot', async () => {
    const persistedRun = createGoalWorkflowRun({
      suspension: {
        type: 'goal_draft_review',
        draft: createGoalWorkflowDraft({
          goal: {
            ...createGoalWorkflowDraft().goal,
            name: 'Stale local goal',
            description: 'Local cache must not remain authoritative.',
          },
        }),
        warnings: [],
        revision: 1,
      },
    });
    const authoritative = createGoalWorkflowRun({
      suspension: {
        type: 'goal_draft_review',
        draft: createGoalWorkflowDraft({
          revision: 2,
          goal: {
            ...createGoalWorkflowDraft().goal,
            name: 'Authoritative Workflow Goal',
            description: 'Recovered from durable Workflow storage.',
          },
        }),
        warnings: [],
        revision: 2,
      },
      updatedAt: 3,
    });
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'goal-create',
          goalWorkflowStage: 'confirm',
          goalWorkflowRun: persistedRun,
          clarificationAnswers: [],
          editableGoal: {
            name:
              persistedRun.suspension?.type === 'goal_draft_review'
                ? persistedRun.suspension.draft.goal.name
                : '',
            description:
              persistedRun.suspension?.type === 'goal_draft_review'
                ? persistedRun.suspension.draft.goal.description
                : '',
            category: 'learning',
            importance: 'Important',
            motivation: '',
            feasibilityAnalysis: '',
            tags: ['ai'],
            startDate: 1_777_000_000_000,
            targetDate: 1_780_000_000_000,
          },
          editableKeyResults: [],
          editableTaskTemplates: [],
          editableReminders: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service, loadProviders } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(
      ok({ data: [{ id: 'conv-1', name: 'Goal session' }] }),
    );
    service.listMessages.mockResolvedValue(
      ok({ data: [{ id: 'm-1', role: 'user', content: 'Help me design an AI goal.' }] }),
    );
    workflowRuntimeFake.get.mockResolvedValueOnce(authoritative);

    const wrapper = mountView();
    await flushPromises();

    expect(loadProviders).toHaveBeenCalledTimes(1);
    expect(workflowRuntimeFake.get).toHaveBeenCalledWith({ runId: 'goal-workflow-1' });
    expect(wrapper.text()).toContain('Authoritative Workflow Goal');
    expect(wrapper.text()).toContain('Recovered from durable Workflow storage.');
    expect(wrapper.text()).not.toContain('Stale local goal');
  });
  it('renders the durable goal Workflow review in the dedicated context panel', async () => {
    const persistedRun = createGoalWorkflowRun({
      suspension: {
        type: 'goal_draft_review',
        draft: createGoalWorkflowDraft({
          goal: {
            ...createGoalWorkflowDraft().goal,
            name: 'Context Panel Workflow Goal',
            description: 'Rendered from Workflow suspension outside the message timeline.',
          },
        }),
        warnings: [],
        revision: 1,
      },
    });
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'goal-create',
          goalWorkflowStage: 'confirm',
          goalWorkflowRun: persistedRun,
          clarificationAnswers: [],
          editableGoal: {
            name:
              persistedRun.suspension?.type === 'goal_draft_review'
                ? persistedRun.suspension.draft.goal.name
                : '',
            description:
              persistedRun.suspension?.type === 'goal_draft_review'
                ? persistedRun.suspension.draft.goal.description
                : '',
            category: 'learning',
            importance: 'Important',
            motivation: '',
            feasibilityAnalysis: '',
            tags: ['ai'],
            startDate: 1_777_000_000_000,
            targetDate: 1_780_000_000_000,
          },
          editableKeyResults: [],
          editableTaskTemplates: [],
          editableReminders: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(
      ok({ data: [{ id: 'conv-1', name: 'Goal session' }] }),
    );
    service.listMessages.mockResolvedValue(
      ok({ data: [{ id: 'm-1', role: 'user', content: 'Help me design an AI goal.' }] }),
    );
    workflowRuntimeFake.get.mockResolvedValueOnce(persistedRun);

    const wrapper = mountView();
    await flushPromises();

    const contextPanel = wrapper.find('[data-testid="ai-context-panel"]');
    expect(contextPanel.exists()).toBe(true);
    expect(contextPanel.find('[data-testid="goal-workflow-review"]').exists()).toBe(true);
    expect(contextPanel.text()).toContain('Context Panel Workflow Goal');
    expect(
      wrapper
        .find('[data-testid="ai-message-panel-stub"] [data-testid="goal-workflow-review"]')
        .exists(),
    ).toBe(false);
  });
  it('loads recent Agent runs into the conversation sidebar', async () => {
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    const activeRun = {
      ...createAgentRunResult({ status: 'waiting_execution', stage: 'execute' }).run,
      runId: 'run-active-1',
      updatedAt: 20,
    };
    service.listAgentRuns.mockResolvedValueOnce(ok([activeRun]));
    service.listConversations.mockResolvedValue(ok({ data: [] }));
    service.listMessages.mockResolvedValue(ok({ data: [] }));

    const wrapper = mountView();
    await flushPromises();

    expect(service.listAgentRuns).toHaveBeenCalledWith({ limit: 5 });
    const sidebar = wrapper.findComponent({ name: 'AIConversationSidebar' });
    expect(sidebar.props('agentRuns')).toEqual([activeRun]);
    expect(sidebar.props('agentRunsLoading')).toBe(false);
  });

  it('loads recent goals and knowledge notes into the conversation sidebar', async () => {
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    const { goals, fetchGoals } = mocks.useGoal.mock.results[0]?.value ?? mocks.useGoal();
    const recentKnowledge =
      mocks.useRecentKnowledgeNotes.mock.results[0]?.value ?? mocks.useRecentKnowledgeNotes();
    const { notes: recentNotes, load: loadRecentKnowledgeNotes } = recentKnowledge;
    goals.value = [
      {
        id: 'goal-old',
        name: 'Older Goal',
        status: 'Active',
        updatedAt: 10,
        targetDate: null,
        overallProgress: 20,
        deletedAt: null,
      },
      {
        id: 'goal-new',
        name: 'Recent Goal',
        status: 'Active',
        updatedAt: 30,
        targetDate: 60,
        overallProgress: 64,
        deletedAt: null,
      },
      {
        id: 'goal-deleted',
        name: 'Deleted Goal',
        status: 'Active',
        updatedAt: 40,
        targetDate: null,
        overallProgress: 80,
        deletedAt: 40,
      },
    ];
    recentNotes.value = [
      {
        id: 'note-old',
        title: 'Older Note.md',
        path: 'notes/older.md',
        updatedAt: 10,
        source: 'projection',
      },
      {
        id: 'note-new',
        title: 'Recent Note.md',
        path: 'notes/recent.md',
        updatedAt: 50,
        source: 'projection',
      },
    ];
    service.listConversations.mockResolvedValue(ok({ data: [] }));
    service.listMessages.mockResolvedValue(ok({ data: [] }));

    const wrapper = mountView();
    await flushPromises();

    expect(fetchGoals).toHaveBeenCalled();
    expect(loadRecentKnowledgeNotes).toHaveBeenCalled();
    const sidebar = wrapper.findComponent({ name: 'AIConversationSidebar' });
    expect(sidebar.props('recentGoals')).toEqual([
      {
        id: 'goal-new',
        title: 'Recent Goal',
        status: 'Active',
        updatedAt: 30,
        targetDate: 60,
        progress: 64,
      },
      {
        id: 'goal-old',
        title: 'Older Goal',
        status: 'Active',
        updatedAt: 10,
        targetDate: null,
        progress: 20,
      },
    ]);
    expect(sidebar.props('recentKnowledgeNotes')).toEqual([
      {
        id: 'note-new',
        title: 'Recent Note.md',
        path: 'notes/recent.md',
        updatedAt: 50,
      },
      {
        id: 'note-old',
        title: 'Older Note.md',
        path: 'notes/older.md',
        updatedAt: 10,
      },
    ]);
  });

  it('opens selected recent goals and knowledge notes from the sidebar', async () => {
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(ok({ data: [] }));
    service.listMessages.mockResolvedValue(ok({ data: [] }));

    const wrapper = mountView();
    await flushPromises();

    const sidebar = wrapper.findComponent({ name: 'AIConversationSidebar' });
    sidebar.vm.$emit('select-goal', 'goal-new');
    await flushPromises();

    expect(mocks.push).toHaveBeenCalledWith('/goals/goal-new');

    sidebar.vm.$emit('select-knowledge-note', 'note-new');
    await flushPromises();

    expect(mocks.push).toHaveBeenCalledWith({ path: '/repository', query: { note: 'note-new' } });
  });

  it('opens the mobile sidebar drawer and closes it after a sidebar selection', async () => {
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(ok({ data: [] }));
    service.listMessages.mockResolvedValue(ok({ data: [] }));

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('[data-testid="ai-mobile-sidebar-panel"]').exists()).toBe(false);

    await wrapper.find('[data-testid="ai-mobile-sidebar-toggle"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="ai-mobile-sidebar-panel"]').exists()).toBe(true);
    const mobileSidebar = wrapper
      .findAllComponents({ name: 'AIConversationSidebar' })
      .find((sidebar) => sidebar.props('variant') === 'mobile');
    expect(mobileSidebar?.exists()).toBe(true);

    mobileSidebar?.vm.$emit('select-goal', 'goal-mobile');
    await flushPromises();

    expect(mocks.push).toHaveBeenCalledWith('/goals/goal-mobile');
    expect(wrapper.find('[data-testid="ai-mobile-sidebar-panel"]').exists()).toBe(false);
  });

  it('keeps a restored Knowledge Q&A Agent run in the sidebar when the recent run list fails', async () => {
    localStorage.setItem('ai:last-conversation-id', 'conv-4');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-4': {
          mode: 'knowledge-qa',
          goalDraft: null,
          goalClarification: null,
          goalAutomationResult: null,
          knowledgeAnswer: createKnowledgeAnswer({
            question: 'What does run history say about grounded answers?',
            answer: 'Run history answers should keep citations attached.',
          }),
          knowledgeQaAgentRun: createKnowledgeQaAgentRunResult(),
          clarificationAnswers: [],
          editableGoal: {
            name: '',
            description: '',
            category: '',
            importance: 'Moderate',
            motivation: '',
            feasibilityAnalysis: '',
            tags: [],
            startDate: null,
            targetDate: null,
          },
          editableKeyResults: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listAgentRuns.mockRejectedValueOnce(new Error('run history unavailable'));
    service.getAgentRun.mockRejectedValueOnce(new Error('runtime snapshot unavailable'));
    service.listConversations.mockResolvedValue(
      ok({
        data: [{ id: 'conv-4', name: 'Runtime-only Knowledge Q&A session' }],
      }),
    );
    service.listMessages.mockResolvedValue(ok({ data: [] }));

    const wrapper = mountView();
    await flushPromises();

    const sidebar = wrapper.findComponent({ name: 'AIConversationSidebar' });
    expect(sidebar.props('agentRuns')).toEqual([createKnowledgeQaAgentRunResult().run]);
    expect(sidebar.props('agentRunsLoading')).toBe(false);
  });

  it('opens the conversation attached to a selected recent Agent run', async () => {
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    const activeRun = {
      ...createAgentRunResult().run,
      runId: 'run-active-2',
      conversationId: 'conv-2',
      updatedAt: 20,
    };
    service.listAgentRuns.mockResolvedValueOnce(ok([activeRun]));
    service.listConversations.mockResolvedValue(
      ok({
        data: [
          { id: 'conv-1', name: 'First session' },
          { id: 'conv-2', name: 'Agent session' },
        ],
      }),
    );
    service.listMessages.mockResolvedValue(ok({ data: [] }));

    const wrapper = mountView();
    await flushPromises();

    const sidebar = wrapper.findComponent({ name: 'AIConversationSidebar' });
    sidebar.vm.$emit('select-agent-run', activeRun);
    await flushPromises();

    expect(service.listMessages).toHaveBeenLastCalledWith('conv-2', {
      page: 1,
      pageSize: 80,
    });
  });

  it('does not let a legacy goal.create AgentRun history item reclaim Workflow ownership', async () => {
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    const activeRun = {
      ...createAgentRunResult().run,
      runId: 'legacy-goal-run',
      conversationId: 'conv-3',
      updatedAt: 30,
    };
    service.listAgentRuns.mockResolvedValueOnce(ok([activeRun]));
    service.listConversations.mockResolvedValue(
      ok({ data: [{ id: 'conv-3', name: 'Legacy goal Agent session' }] }),
    );
    service.listMessages.mockResolvedValue(ok({ data: [] }));
    service.getAgentRun.mockResolvedValueOnce(ok(createAgentRunResult()));

    const wrapper = mountView();
    await flushPromises();
    wrapper
      .findComponent({ name: 'AIConversationSidebar' })
      .vm.$emit('select-agent-run', activeRun);
    await flushPromises();

    expect(service.getAgentRun).toHaveBeenCalledWith('legacy-goal-run');
    expect(wrapper.find('[data-testid="goal-workflow-panel"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="ai-host-proposal-panel"]').exists()).toBe(false);
    expect(workflowRuntimeFake.resume).not.toHaveBeenCalled();
    expect(workflowRuntimeFake.start).not.toHaveBeenCalled();
  });
  it('restores a selected recent Knowledge Q&A Agent run from runtime history', async () => {
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    const activeRun = {
      ...createKnowledgeQaAgentRunResult().run,
      updatedAt: 40,
    };
    service.listAgentRuns.mockResolvedValueOnce(ok([activeRun]));
    service.listConversations.mockResolvedValue(
      ok({
        data: [{ id: 'conv-4', name: 'Runtime-only Knowledge Q&A session' }],
      }),
    );
    service.listMessages.mockResolvedValue(ok({ data: [] }));
    service.getAgentRun.mockResolvedValueOnce(ok(createKnowledgeQaAgentRunResult()));

    const wrapper = mountView();
    await flushPromises();

    const sidebar = wrapper.findComponent({ name: 'AIConversationSidebar' });
    sidebar.vm.$emit('select-agent-run', activeRun);
    await flushPromises();

    expect(service.getAgentRun).toHaveBeenCalledWith('knowledge-qa-run-1');
    expect(wrapper.text()).toContain('Knowledge Answer');
    expect(wrapper.text()).toContain('Grounded in repository citations');
    expect(wrapper.text()).toContain('Run history answers should keep citations attached.');
    expect(wrapper.text()).toContain('Grounded Answer');
    expect(wrapper.text()).toContain('notes/ai/grounded-answer.md');
    expect(wrapper.text()).toContain('Observability');
    expect(wrapper.text()).toContain('12 prompt · 8 completion · 20 total');
    expect(wrapper.text()).toContain('Workflow step completed · search_knowledge');
    expect(wrapper.text()).not.toContain('node.completed');
  });

  it('clears a stale Knowledge Q&A answer when the selected Agent run has no answer artifact', async () => {
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-4': {
          mode: 'knowledge-qa',
          goalDraft: null,
          goalClarification: null,
          goalAutomationResult: null,
          knowledgeAnswer: createKnowledgeAnswer({
            answer: 'Old persisted answer should not survive selecting this run.',
          }),
          clarificationAnswers: [],
          editableGoal: {
            name: '',
            description: '',
            category: '',
            importance: 'Moderate',
            motivation: '',
            feasibilityAnalysis: '',
            tags: [],
            startDate: null,
            targetDate: null,
          },
          editableKeyResults: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    const activeRun = {
      ...createKnowledgeQaAgentRunResult().run,
      updatedAt: 50,
    };
    const runWithoutAnswerArtifact = createKnowledgeQaAgentRunResult();
    runWithoutAnswerArtifact.state.artifacts = [];
    runWithoutAnswerArtifact.state.citations = [];
    service.listAgentRuns.mockResolvedValueOnce(ok([activeRun]));
    service.listConversations.mockResolvedValue(
      ok({
        data: [{ id: 'conv-4', name: 'Runtime-only Knowledge Q&A session' }],
      }),
    );
    service.listMessages.mockResolvedValue(ok({ data: [] }));
    service.getAgentRun.mockResolvedValueOnce(ok(runWithoutAnswerArtifact));

    const wrapper = mountView();
    await flushPromises();

    const sidebar = wrapper.findComponent({ name: 'AIConversationSidebar' });
    sidebar.vm.$emit('select-agent-run', activeRun);
    await flushPromises();

    expect(service.getAgentRun).toHaveBeenCalledWith('knowledge-qa-run-1');
    expect(wrapper.text()).not.toContain(
      'Old persisted answer should not survive selecting this run.',
    );
    expect(wrapper.find('[data-testid="knowledge-answer-panel"]').exists()).toBe(false);
  });

  it('hides legacy goal draft and automation actions from the primary Goal Agent flow', async () => {
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'goal-create',
          goalWorkflowStage: 'collect',
          goalDraft: null,
          goalClarification: null,
          goalAutomationResult: null,
          clarificationAnswers: [],
          editableGoal: {
            name: '',
            description: '',
            category: '',
            importance: 'Moderate',
            motivation: '',
            feasibilityAnalysis: '',
            tags: [],
            startDate: null,
            targetDate: null,
          },
          editableKeyResults: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(
      ok({
        data: [{ id: 'conv-1', name: 'Goal session' }],
      }),
    );
    service.listMessages.mockResolvedValue(
      ok({
        data: [{ id: 'm-1', role: 'user', content: 'Help me design an AI goal.' }],
      }),
    );

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('[data-testid="goal-agent-start-run"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="goal-workflow-generate-draft"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="goal-workflow-plan-automation"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="goal-workflow-confirm-execute"]').exists()).toBe(false);
  });

  it('starts and approves goal.create exclusively through the Workflow runtime', async () => {
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'goal-create',
          goalWorkflowStage: 'collect',
          goalWorkflowRun: null,
          clarificationAnswers: [],
          editableGoal: {
            name: '',
            description: '',
            category: '',
            importance: 'Moderate',
            motivation: '',
            feasibilityAnalysis: '',
            tags: [],
            startDate: null,
            targetDate: null,
          },
          editableKeyResults: [],
          editableTaskTemplates: [],
          editableReminders: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(
      ok({ data: [{ id: 'conv-1', name: 'Goal session' }] }),
    );
    service.listMessages.mockResolvedValue(
      ok({ data: [{ id: 'm-1', role: 'user', content: 'Help me design an AI goal.' }] }),
    );
    const review = createGoalWorkflowRun();
    const completed = createGoalWorkflowRun({
      status: 'completed',
      suspension: undefined,
      result: {
        workflowRunId: 'goal-workflow-1',
        revision: 1,
        status: 'success',
        goalId: 'goal-workflow-created-1',
        keyResultIds: [],
        taskIds: [],
        reminderIds: [],
        failures: [],
        retryable: false,
      },
      updatedAt: 3,
    });
    workflowRuntimeFake.start.mockResolvedValueOnce(review);
    workflowRuntimeFake.resume.mockResolvedValueOnce(completed);

    const wrapper = mountView();
    await flushPromises();
    const startButton = wrapper.find('[data-testid="goal-agent-start-run"]');
    expect(startButton.exists()).toBe(true);
    await startButton.trigger('click');
    await flushPromises();

    expect(workflowRuntimeFake.start).toHaveBeenCalledWith({
      kind: 'goal.create',
      conversationId: 'conv-1',
      input: { idea: 'User: Help me design an AI goal.' },
      providerId: 'provider-1',
      modelId: 'gpt-4o-mini',
      locale: 'en-US',
    });
    expect(service.startAgentRun).not.toHaveBeenCalled();
    expect(service.dispatchAssistant).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Workflow AI Goal');
    expect(wrapper.find('[data-testid="ai-host-proposal-panel"]').exists()).toBe(false);

    await wrapper.find('[data-testid="goal-agent-confirm-run"]').trigger('click');
    await flushPromises();

    expect(workflowRuntimeFake.resume).toHaveBeenCalledWith({
      runId: 'goal-workflow-1',
      command: { type: 'approve' },
    });
    expect(service.resumeAgentRun).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('goal-workflow-created-1');
    const openCreatedGoalButton = wrapper.find('[data-testid="goal-workflow-open-created-goal"]');
    expect(openCreatedGoalButton.exists()).toBe(true);
    await openCreatedGoalButton.trigger('click');
    expect(mocks.push).toHaveBeenCalledWith('/goals/goal-workflow-created-1');
  });
  it('resumes goal.create clarification with a typed Workflow answer command', async () => {
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'goal-create',
          goalWorkflowStage: 'collect',
          goalWorkflowRun: null,
          clarificationAnswers: [],
          editableGoal: {
            name: '',
            description: '',
            category: '',
            importance: 'Moderate',
            motivation: '',
            feasibilityAnalysis: '',
            tags: [],
            startDate: null,
            targetDate: null,
          },
          editableKeyResults: [],
          editableTaskTemplates: [],
          editableReminders: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(
      ok({ data: [{ id: 'conv-1', name: 'Goal session' }] }),
    );
    service.listMessages.mockResolvedValue(
      ok({ data: [{ id: 'm-1', role: 'user', content: 'Get fit' }] }),
    );
    workflowRuntimeFake.start.mockResolvedValueOnce(
      createGoalWorkflowRun({
        suspension: {
          type: 'clarification_required',
          questions: [
            'What concrete outcome should this goal produce?',
            'When do you want to review it?',
          ],
          round: 1,
        },
      }),
    );
    workflowRuntimeFake.resume.mockResolvedValueOnce(createGoalWorkflowRun());

    const wrapper = mountView();
    await flushPromises();
    await wrapper.find('[data-testid="goal-agent-start-run"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('What concrete outcome should this goal produce?');
    const answers = wrapper.findAll('textarea');
    await answers[0].setValue('Run a 5K without stopping.');
    await answers[1].setValue('Review progress every Sunday.');
    await flushPromises();
    await wrapper.find('[data-testid="goal-workflow-submit-clarification"]').trigger('click');
    await flushPromises();

    expect(workflowRuntimeFake.resume).toHaveBeenCalledWith({
      runId: 'goal-workflow-1',
      command: {
        type: 'answer',
        answers: ['Run a 5K without stopping.', 'Review progress every Sunday.'],
      },
    });
    expect(service.resumeAgentRun).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Workflow AI Goal');
  });
  it('continues a restored retryable goal Workflow through the retry command', async () => {
    const persistedRun = createGoalWorkflowRun({
      suspension: {
        type: 'recovery_required',
        message: 'A child mutation failed.',
        retryable: true,
        failures: [
          {
            operation: 'task_template',
            index: 0,
            code: 'SERVICE_UNAVAILABLE',
            message: 'Task store unavailable',
            retryable: true,
          },
        ],
      },
      result: {
        workflowRunId: 'goal-workflow-1',
        revision: 1,
        status: 'partial',
        goalId: 'goal-existing-1',
        keyResultIds: [],
        taskIds: [],
        reminderIds: [],
        failures: [
          {
            operation: 'task_template',
            index: 0,
            code: 'SERVICE_UNAVAILABLE',
            message: 'Task store unavailable',
            retryable: true,
          },
        ],
        retryable: true,
      },
    });
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'goal-create',
          goalWorkflowStage: 'confirm',
          goalWorkflowRun: persistedRun,
          clarificationAnswers: [],
          editableGoal: {
            name:
              persistedRun.suspension?.type === 'goal_draft_review'
                ? persistedRun.suspension.draft.goal.name
                : '',
            description:
              persistedRun.suspension?.type === 'goal_draft_review'
                ? persistedRun.suspension.draft.goal.description
                : '',
            category: 'learning',
            importance: 'Important',
            motivation: '',
            feasibilityAnalysis: '',
            tags: ['ai'],
            startDate: 1_777_000_000_000,
            targetDate: 1_780_000_000_000,
          },
          editableKeyResults: [],
          editableTaskTemplates: [],
          editableReminders: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(
      ok({ data: [{ id: 'conv-1', name: 'Goal session' }] }),
    );
    service.listMessages.mockResolvedValue(
      ok({ data: [{ id: 'm-1', role: 'user', content: 'Help me design an AI goal.' }] }),
    );
    workflowRuntimeFake.get.mockResolvedValueOnce(persistedRun);
    workflowRuntimeFake.resume.mockResolvedValueOnce(
      createGoalWorkflowRun({
        status: 'completed',
        suspension: undefined,
        result: {
          workflowRunId: 'goal-workflow-1',
          revision: 1,
          status: 'success',
          goalId: 'goal-existing-1',
          keyResultIds: [],
          taskIds: ['task-recovered-1'],
          reminderIds: [],
          failures: [],
          retryable: false,
        },
        updatedAt: 4,
      }),
    );

    const wrapper = mountView();
    await flushPromises();
    const retryButton = wrapper.find('[data-testid="goal-agent-retry-execution"]');
    expect(retryButton.exists()).toBe(true);
    await retryButton.trigger('click');
    await flushPromises();

    expect(workflowRuntimeFake.resume).toHaveBeenCalledWith({
      runId: 'goal-workflow-1',
      command: { type: 'retry' },
    });
    expect(service.resumeAgentRun).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('goal-existing-1');
  });
  it('refreshes a restored goal Workflow from durable runtime state', async () => {
    const persistedRun = createGoalWorkflowRun();
    const authoritative = createGoalWorkflowRun({
      suspension: {
        type: 'recovery_required',
        message: 'Durable runtime advanced after reload.',
        retryable: true,
        failures: [
          {
            operation: 'reminder',
            index: 0,
            code: 'TEMPORARY',
            message: 'Reminder retry required',
            retryable: true,
          },
        ],
      },
      updatedAt: 5,
    });
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'goal-create',
          goalWorkflowStage: 'confirm',
          goalWorkflowRun: persistedRun,
          clarificationAnswers: [],
          editableGoal: {
            name:
              persistedRun.suspension?.type === 'goal_draft_review'
                ? persistedRun.suspension.draft.goal.name
                : '',
            description:
              persistedRun.suspension?.type === 'goal_draft_review'
                ? persistedRun.suspension.draft.goal.description
                : '',
            category: 'learning',
            importance: 'Important',
            motivation: '',
            feasibilityAnalysis: '',
            tags: ['ai'],
            startDate: 1_777_000_000_000,
            targetDate: 1_780_000_000_000,
          },
          editableKeyResults: [],
          editableTaskTemplates: [],
          editableReminders: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(
      ok({ data: [{ id: 'conv-1', name: 'Goal session' }] }),
    );
    service.listMessages.mockResolvedValue(
      ok({ data: [{ id: 'm-1', role: 'user', content: 'Help me design an AI goal.' }] }),
    );
    workflowRuntimeFake.get.mockResolvedValueOnce(authoritative);

    const wrapper = mountView();
    await flushPromises();

    expect(workflowRuntimeFake.get).toHaveBeenCalledWith({ runId: 'goal-workflow-1' });
    expect(wrapper.text()).toContain('Reminder retry required');
    expect(wrapper.find('[data-testid="goal-agent-retry-execution"]').exists()).toBe(true);
    expect(service.getAgentRun).not.toHaveBeenCalledWith('goal-workflow-1');
  });
  it('retries only from a retryable recovery Workflow suspension', async () => {
    const persistedRun = createGoalWorkflowRun({
      suspension: {
        type: 'recovery_required',
        message: 'Goal plan partially applied.',
        retryable: true,
        failures: [
          {
            operation: 'task_template',
            index: 1,
            code: 'SERVICE_UNAVAILABLE',
            message: 'Task service unavailable',
            retryable: true,
          },
        ],
      },
      result: {
        workflowRunId: 'goal-workflow-1',
        revision: 1,
        status: 'partial',
        goalId: 'goal-123',
        keyResultIds: [],
        taskIds: ['task-0'],
        reminderIds: [],
        failures: [
          {
            operation: 'task_template',
            index: 1,
            code: 'SERVICE_UNAVAILABLE',
            message: 'Task service unavailable',
            retryable: true,
          },
        ],
        retryable: true,
      },
    });
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'goal-create',
          goalWorkflowStage: 'confirm',
          goalWorkflowRun: persistedRun,
          clarificationAnswers: [],
          editableGoal: {
            name:
              persistedRun.suspension?.type === 'goal_draft_review'
                ? persistedRun.suspension.draft.goal.name
                : '',
            description:
              persistedRun.suspension?.type === 'goal_draft_review'
                ? persistedRun.suspension.draft.goal.description
                : '',
            category: 'learning',
            importance: 'Important',
            motivation: '',
            feasibilityAnalysis: '',
            tags: ['ai'],
            startDate: 1_777_000_000_000,
            targetDate: 1_780_000_000_000,
          },
          editableKeyResults: [],
          editableTaskTemplates: [],
          editableReminders: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(
      ok({ data: [{ id: 'conv-1', name: 'Goal session' }] }),
    );
    service.listMessages.mockResolvedValue(
      ok({ data: [{ id: 'm-1', role: 'user', content: 'Help me design an AI goal.' }] }),
    );
    workflowRuntimeFake.get.mockResolvedValueOnce(persistedRun);
    workflowRuntimeFake.resume.mockResolvedValueOnce(
      createGoalWorkflowRun({
        status: 'completed',
        suspension: undefined,
        result: {
          workflowRunId: 'goal-workflow-1',
          revision: 1,
          status: 'success',
          goalId: 'goal-123',
          keyResultIds: [],
          taskIds: ['task-0', 'task-1'],
          reminderIds: [],
          failures: [],
          retryable: false,
        },
        updatedAt: 5,
      }),
    );

    const wrapper = mountView();
    await flushPromises();
    const retryButton = wrapper.find('[data-testid="goal-agent-retry-execution"]');
    expect(retryButton.exists()).toBe(true);
    await retryButton.trigger('click');
    await flushPromises();

    expect(workflowRuntimeFake.resume).toHaveBeenCalledTimes(1);
    expect(workflowRuntimeFake.resume).toHaveBeenCalledWith({
      runId: 'goal-workflow-1',
      command: { type: 'retry' },
    });
    expect(service.resumeAgentRun).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('goal-123');
  });
  it('shows recovery guidance directly from the durable Workflow suspension and receipt', async () => {
    const persistedRun = createGoalWorkflowRun({
      suspension: {
        type: 'recovery_required',
        message: 'Some goal plan mutations failed.',
        retryable: true,
        failures: [
          {
            operation: 'reminder',
            index: 0,
            code: 'REMINDER_UNAVAILABLE',
            message: 'Reminder creation failed; retry is safe.',
            retryable: true,
          },
        ],
      },
      result: {
        workflowRunId: 'goal-workflow-1',
        revision: 1,
        status: 'partial',
        goalId: 'goal-123',
        keyResultIds: [],
        taskIds: [],
        reminderIds: [],
        failures: [
          {
            operation: 'reminder',
            index: 0,
            code: 'REMINDER_UNAVAILABLE',
            message: 'Reminder creation failed; retry is safe.',
            retryable: true,
          },
        ],
        retryable: true,
      },
    });
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'goal-create',
          goalWorkflowStage: 'confirm',
          goalWorkflowRun: persistedRun,
          clarificationAnswers: [],
          editableGoal: {
            name:
              persistedRun.suspension?.type === 'goal_draft_review'
                ? persistedRun.suspension.draft.goal.name
                : '',
            description:
              persistedRun.suspension?.type === 'goal_draft_review'
                ? persistedRun.suspension.draft.goal.description
                : '',
            category: 'learning',
            importance: 'Important',
            motivation: '',
            feasibilityAnalysis: '',
            tags: ['ai'],
            startDate: 1_777_000_000_000,
            targetDate: 1_780_000_000_000,
          },
          editableKeyResults: [],
          editableTaskTemplates: [],
          editableReminders: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(
      ok({ data: [{ id: 'conv-1', name: 'Goal session' }] }),
    );
    service.listMessages.mockResolvedValue(
      ok({ data: [{ id: 'm-1', role: 'user', content: 'Help me design an AI goal.' }] }),
    );
    workflowRuntimeFake.get.mockResolvedValueOnce(persistedRun);

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('[data-testid="goal-workflow-recovery"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Recovery');
    expect(wrapper.text()).toContain('Reminder creation failed; retry is safe.');
    expect(wrapper.text()).toContain('partial');
    expect(wrapper.find('[data-testid="goal-agent-retry-execution"]').exists()).toBe(true);
  });
  it('queries knowledge from the latest user message and renders a cited answer artifact', async () => {
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'knowledge-qa',
          goalDraft: null,
          goalClarification: null,
          goalAutomationResult: null,
          clarificationAnswers: [],
          editableGoal: {
            name: '',
            description: '',
            category: '',
            importance: 'Moderate',
            motivation: '',
            feasibilityAnalysis: '',
            tags: [],
            startDate: null,
            targetDate: null,
          },
          editableKeyResults: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(
      ok({
        data: [{ id: 'conv-1', name: 'Knowledge session' }],
      }),
    );
    service.listMessages.mockResolvedValue(
      ok({
        data: [
          { id: 'm-1', role: 'user', content: 'What is older context?' },
          { id: 'm-2', role: 'assistant', content: 'Older answer.' },
          { id: 'm-3', role: 'user', content: 'How should knowledge answers be grounded?' },
        ],
      }),
    );
    service.startAgentRun.mockResolvedValueOnce(
      ok(
        createKnowledgeQaAgentRunResult({
          answer: createKnowledgeAnswer(),
          conversationId: 'conv-1',
        }),
      ),
    );

    const wrapper = mountView();
    await flushPromises();

    const askButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Ask Knowledge Base'));
    expect(askButton).toBeDefined();
    await askButton!.trigger('click');
    await flushPromises();

    expect(service.startAgentRun).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'conv-1',
        agentType: 'knowledge.qa',
        input: expect.objectContaining({
          question: 'How should knowledge answers be grounded?',
          provider_id: 'provider-1',
          maxResources: 8,
        }),
      }),
    );
    expect(service.queryKnowledge).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Knowledge Answer');
    expect(wrapper.text()).toContain('Grounded in repository citations');
    expect(wrapper.text()).toContain('Use cited repository excerpts to answer the question.');
    expect(wrapper.text()).toContain('notes/ai/grounded-answer.md');
    expect(wrapper.text()).toContain('Grounded Answer');
    expect(wrapper.text()).toContain(
      'Repository evidence says to keep answers grounded in citations.',
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Knowledge answer ready');
  });

  it('replaces restored Knowledge Q&A Agent observability after a new Agent run', async () => {
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'knowledge-qa',
          goalDraft: null,
          goalClarification: null,
          goalAutomationResult: null,
          knowledgeAnswer: createKnowledgeAnswer({
            answer: 'Restored Agent answer with runtime observability.',
          }),
          knowledgeQaAgentRun: createKnowledgeQaAgentRunResult(),
          clarificationAnswers: [],
          editableGoal: {
            name: '',
            description: '',
            category: '',
            importance: 'Moderate',
            motivation: '',
            feasibilityAnalysis: '',
            tags: [],
            startDate: null,
            targetDate: null,
          },
          editableKeyResults: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.getAgentRun.mockRejectedValueOnce(new Error('runtime snapshot unavailable'));
    service.listConversations.mockResolvedValue(
      ok({
        data: [{ id: 'conv-1', name: 'Knowledge session' }],
      }),
    );
    service.listMessages.mockResolvedValue(
      ok({
        data: [{ id: 'm-1', role: 'user', content: 'What is the latest grounding rule?' }],
      }),
    );
    service.startAgentRun.mockResolvedValueOnce(
      ok(
        createKnowledgeQaAgentRunResult({
          answer: createKnowledgeAnswer({
            question: 'What is the latest grounding rule?',
            answer: 'Agent runtime answer should own the visible answer panel.',
          }),
          conversationId: 'conv-1',
          runId: 'knowledge-qa-run-2',
        }),
      ),
    );

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.text()).toContain('Restored Agent answer with runtime observability.');
    expect(wrapper.text()).toContain('Workflow step completed · search_knowledge');
    expect(wrapper.text()).not.toContain('node.completed');

    const askButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Ask Knowledge Base'));
    expect(askButton).toBeDefined();
    await askButton!.trigger('click');
    await flushPromises();

    expect(service.startAgentRun).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'conv-1',
        agentType: 'knowledge.qa',
        input: expect.objectContaining({
          question: 'What is the latest grounding rule?',
          provider_id: 'provider-1',
          maxResources: 8,
        }),
      }),
    );
    expect(service.queryKnowledge).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Agent runtime answer should own the visible answer panel.');
    expect(wrapper.text()).not.toContain('Restored Agent answer with runtime observability.');
    expect(wrapper.text()).toContain('Workflow step completed · search_knowledge');
    expect(wrapper.text()).not.toContain('node.completed');
  });

  it('shows insufficient evidence when the knowledge answer has no citations', async () => {
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'knowledge-qa',
          goalDraft: null,
          goalClarification: null,
          goalAutomationResult: null,
          clarificationAnswers: [],
          editableGoal: {
            name: '',
            description: '',
            category: '',
            importance: 'Moderate',
            motivation: '',
            feasibilityAnalysis: '',
            tags: [],
            startDate: null,
            targetDate: null,
          },
          editableKeyResults: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(
      ok({
        data: [{ id: 'conv-1', name: 'Knowledge session' }],
      }),
    );
    service.listMessages.mockResolvedValue(
      ok({
        data: [{ id: 'm-1', role: 'user', content: 'What does the repo say about unknown topic?' }],
      }),
    );
    service.startAgentRun.mockResolvedValueOnce(
      ok(
        createKnowledgeQaAgentRunResult({
          answer: createKnowledgeAnswer({
            question: 'What does the repo say about unknown topic?',
            answer: 'No relevant knowledge notes were found for this question.',
            citations: [],
          }),
          conversationId: 'conv-1',
        }),
      ),
    );

    const wrapper = mountView();
    await flushPromises();

    const askButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Ask Knowledge Base'));
    expect(askButton).toBeDefined();
    await askButton!.trigger('click');
    await flushPromises();

    expect(service.startAgentRun).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'conv-1',
        agentType: 'knowledge.qa',
        input: expect.objectContaining({
          question: 'What does the repo say about unknown topic?',
          provider_id: 'provider-1',
          maxResources: 8,
        }),
      }),
    );
    expect(service.queryKnowledge).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Current knowledge base evidence is insufficient');
    expect(wrapper.text()).toContain('No relevant knowledge notes were found for this question.');
    expect(wrapper.find('[data-testid="knowledge-citation-open"]').exists()).toBe(false);
    const draftNoteButton = wrapper.find('[data-testid="knowledge-qa-draft-note"]');
    expect(draftNoteButton.exists()).toBe(true);
    expect(draftNoteButton.attributes('disabled')).toBeDefined();
  });

  it('restores a persisted knowledge answer without querying again', async () => {
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'knowledge-qa',
          goalDraft: null,
          goalClarification: null,
          goalAutomationResult: null,
          knowledgeAnswer: createKnowledgeAnswer({
            question: 'What did we already ask?',
            answer: 'This answer was restored from workflow persistence.',
          }),
          clarificationAnswers: [],
          editableGoal: {
            name: '',
            description: '',
            category: '',
            importance: 'Moderate',
            motivation: '',
            feasibilityAnalysis: '',
            tags: [],
            startDate: null,
            targetDate: null,
          },
          editableKeyResults: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(
      ok({
        data: [{ id: 'conv-1', name: 'Knowledge session' }],
      }),
    );
    service.listMessages.mockResolvedValue(
      ok({
        data: [{ id: 'm-1', role: 'user', content: 'What did we already ask?' }],
      }),
    );

    const wrapper = mountView();
    await flushPromises();

    expect(service.queryKnowledge).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Knowledge Answer');
    expect(wrapper.text()).toContain('This answer was restored from workflow persistence.');
    expect(wrapper.text()).toContain('Grounded in repository citations');
  });

  it('drafts a knowledge note from a grounded knowledge answer before saving the draft', async () => {
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'knowledge-qa',
          goalDraft: null,
          goalClarification: null,
          goalAutomationResult: null,
          knowledgeAnswer: createKnowledgeAnswer(),
          clarificationAnswers: [],
          editableGoal: {
            name: '',
            description: '',
            category: '',
            importance: 'Moderate',
            motivation: '',
            feasibilityAnalysis: '',
            tags: [],
            startDate: null,
            targetDate: null,
          },
          editableKeyResults: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(
      ok({
        data: [{ id: 'conv-1', name: 'Knowledge session' }],
      }),
    );
    service.listMessages.mockResolvedValue(
      ok({
        data: [{ id: 'm-1', role: 'user', content: 'How should knowledge answers be grounded?' }],
      }),
    );
    service.startAgentRun.mockResolvedValueOnce(
      ok(
        createKnowledgeNoteAgentRunResult({
          topic:
            'Question: How should knowledge answers be grounded? Answer: Use cited repository excerpts to answer the question. Sources: Grounded Answer',
        }),
      ),
    );
    service.resumeAgentRun.mockResolvedValueOnce(
      ok(
        createSavedKnowledgeNoteAgentRunResult({
          topic:
            'Question: How should knowledge answers be grounded? Answer: Use cited repository excerpts to answer the question. Sources: Grounded Answer',
        }),
      ),
    );

    const wrapper = mountView();
    await flushPromises();

    const draftNoteButton = wrapper.find('[data-testid="knowledge-qa-draft-note"]');
    expect(draftNoteButton.exists()).toBe(true);
    await draftNoteButton.trigger('click');
    await flushPromises();

    expect(service.startAgentRun).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'conv-1',
        agentType: 'knowledge.generate',
        input: expect.objectContaining({
          topic:
            'Question: How should knowledge answers be grounded? Answer: Use cited repository excerpts to answer the question. Sources: Grounded Answer',
          title: 'How should knowledge answers be grounded?',
          source: expect.stringContaining('Question: How should knowledge answers be grounded?'),
          provider_id: 'provider-1',
          model: 'gpt-4o-mini',
        }),
      }),
    );
    expect(service.createKnowledgeNote).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Knowledge Note Draft');
    expect(wrapper.text()).toContain('AI Note Draft');
    expect(wrapper.text()).toContain('Drafted from the conversation.');

    const saveDraftButton = wrapper.find('[data-testid="knowledge-qa-save-draft"]');
    expect(saveDraftButton.exists()).toBe(true);
    await saveDraftButton.trigger('click');
    await flushPromises();

    expect(service.resumeAgentRun).toHaveBeenCalledWith('note-run-1', {
      userDecision: 'confirm',
      approvedActions: [
        expect.objectContaining({
          tool: 'create_knowledge_note',
          payload: expect.objectContaining({
            topic:
              'Question: How should knowledge answers be grounded? Answer: Use cited repository excerpts to answer the question. Sources: Grounded Answer',
            contentMarkdown: '# AI Note Draft\n\nDrafted from the conversation.',
            title: 'AI Note Draft',
            targetSubpath: 'notes/ai',
          }),
        }),
      ],
    });
    expect(service.createKnowledgeNote).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Knowledge Note Created');
    expect(wrapper.text()).toContain('Grounded Q&A Note.md');
    expect(wrapper.text()).toContain('notes/ai/Grounded Q&A Note.md');
    expect(wrapper.text()).toContain('pending');
    expect(wrapper.text()).toContain('Saved from the knowledge answer.');
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Created note');
  });

  it('drafts a knowledge note with the Agent runtime before saving the generated draft', async () => {
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'knowledge-generate',
          goalDraft: null,
          goalClarification: null,
          goalAutomationResult: null,
          clarificationAnswers: [],
          editableGoal: {
            name: '',
            description: '',
            category: '',
            importance: 'Moderate',
            motivation: '',
            feasibilityAnalysis: '',
            tags: [],
            startDate: null,
            targetDate: null,
          },
          editableKeyResults: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(
      ok({
        data: [{ id: 'conv-1', name: 'Knowledge note session' }],
      }),
    );
    service.listMessages.mockResolvedValue(
      ok({
        data: [{ id: 'm-1', role: 'user', content: 'Summarize agent notes.' }],
      }),
    );
    service.startAgentRun.mockResolvedValueOnce(
      ok(createKnowledgeNoteAgentRunResult({ targetSubpath: 'notes/agent-drafts' })),
    );
    service.resumeAgentRun.mockResolvedValueOnce(
      ok(createSavedKnowledgeNoteAgentRunResult({ targetSubpath: 'notes/agent-drafts' })),
    );

    const wrapper = mountView();
    await flushPromises();

    const startRunButton = wrapper.find('[data-testid="knowledge-note-agent-start-run"]');
    expect(startRunButton.exists()).toBe(true);
    await startRunButton.trigger('click');
    await flushPromises();

    expect(service.startAgentRun).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'conv-1',
        agentType: 'knowledge.generate',
        input: expect.objectContaining({
          topic: 'Summarize agent notes.',
          source: 'User: Summarize agent notes.',
          title: 'Knowledge note session',
          provider_id: 'provider-1',
          model: 'gpt-4o-mini',
        }),
      }),
    );
    expect(wrapper.text()).toContain('Knowledge Note Draft');
    expect(wrapper.text()).toContain('AI Note Draft');
    expect(wrapper.text()).toContain('Drafted from the conversation.');

    const saveDraftButton = wrapper.find('[data-testid="knowledge-note-save-draft"]');
    expect(saveDraftButton.exists()).toBe(true);
    await saveDraftButton.trigger('click');
    await flushPromises();

    expect(service.resumeAgentRun).toHaveBeenCalledWith('note-run-1', {
      userDecision: 'confirm',
      approvedActions: [
        expect.objectContaining({
          tool: 'create_knowledge_note',
          payload: expect.objectContaining({
            topic: 'User: Summarize agent notes.',
            contentMarkdown: '# AI Note Draft\n\nDrafted from the conversation.',
            title: 'AI Note Draft',
            targetSubpath: 'notes/agent-drafts',
          }),
        }),
      ],
    });
    expect(service.createKnowledgeNote).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Knowledge Note Created');
    expect(wrapper.text()).toContain('Grounded Q&A Note.md');
    expect(wrapper.text()).toContain('notes/ai/Grounded Q&A Note.md');
    expect(wrapper.text()).toContain('pending');
  });

  it('projects a completed Knowledge Note Agent run from the persisted snapshot when runtime history is unavailable', async () => {
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'knowledge-generate',
          goalDraft: null,
          goalClarification: null,
          goalAutomationResult: null,
          clarificationAnswers: [],
          editableGoal: {
            name: '',
            description: '',
            category: '',
            importance: 'Moderate',
            motivation: '',
            feasibilityAnalysis: '',
            tags: [],
            startDate: null,
            targetDate: null,
          },
          editableKeyResults: [],
          noteAgentRun: createSavedKnowledgeNoteAgentRunResult(),
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(
      ok({
        data: [{ id: 'conv-1', name: 'Knowledge note session' }],
      }),
    );
    service.listMessages.mockResolvedValue(
      ok({
        data: [{ id: 'm-1', role: 'user', content: 'Summarize agent notes.' }],
      }),
    );
    service.getAgentRun.mockRejectedValueOnce(new Error('runtime snapshot unavailable'));

    const wrapper = mountView();
    await flushPromises();

    expect(service.getAgentRun).toHaveBeenCalledWith('note-run-1');
    expect(wrapper.text()).toContain('Knowledge Note Created');
    expect(wrapper.text()).toContain('Grounded Q&A Note.md');
    expect(wrapper.text()).toContain('notes/ai/Grounded Q&A Note.md');
    expect(wrapper.text()).toContain('pending');
    expect(wrapper.text()).toContain('Saved from the knowledge answer.');
    expect(wrapper.text()).not.toContain('Knowledge Note Draft');
  });

  it('projects a selected completed Knowledge Note Agent run from runtime history', async () => {
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    const activeRun = {
      ...createSavedKnowledgeNoteAgentRunResult().run,
      updatedAt: 70,
    };
    service.listAgentRuns.mockResolvedValueOnce(ok([activeRun]));
    service.listConversations.mockResolvedValue(
      ok({
        data: [{ id: 'conv-1', name: 'Runtime-only Knowledge note session' }],
      }),
    );
    service.listMessages.mockResolvedValue(ok({ data: [] }));
    service.getAgentRun.mockResolvedValueOnce(ok(createSavedKnowledgeNoteAgentRunResult()));

    const wrapper = mountView();
    await flushPromises();

    const sidebar = wrapper.findComponent({ name: 'AIConversationSidebar' });
    sidebar.vm.$emit('select-agent-run', activeRun);
    await flushPromises();

    expect(service.getAgentRun).toHaveBeenCalledWith('note-run-1');
    expect(wrapper.text()).toContain('Knowledge Note Created');
    expect(wrapper.text()).toContain('Grounded Q&A Note.md');
    expect(wrapper.text()).toContain('notes/ai/Grounded Q&A Note.md');
    expect(wrapper.text()).toContain('pending');
    expect(wrapper.text()).not.toContain('Knowledge Note Draft');
  });

  it('retries a failed Knowledge Note Agent execution from the persisted run', async () => {
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'knowledge-generate',
          goalDraft: null,
          goalClarification: null,
          goalAutomationResult: null,
          clarificationAnswers: [],
          editableGoal: {
            name: '',
            description: '',
            category: '',
            importance: 'Moderate',
            motivation: '',
            feasibilityAnalysis: '',
            tags: [],
            startDate: null,
            targetDate: null,
          },
          editableKeyResults: [],
          noteAgentRun: createFailedKnowledgeNoteAgentRunResult({
            targetSubpath: 'notes/agent-drafts',
          }),
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(
      ok({
        data: [{ id: 'conv-1', name: 'Knowledge note session' }],
      }),
    );
    service.listMessages.mockResolvedValue(
      ok({
        data: [{ id: 'm-1', role: 'user', content: 'Summarize agent notes.' }],
      }),
    );
    service.resumeAgentRun.mockResolvedValueOnce(
      ok(createSavedKnowledgeNoteAgentRunResult({ targetSubpath: 'notes/agent-drafts' })),
    );

    const wrapper = mountView();
    await flushPromises();

    const retryButton = wrapper.find('[data-testid="knowledge-note-retry-execution"]');
    expect(retryButton.exists()).toBe(true);
    expect(wrapper.find('[data-testid="knowledge-note-save-draft"]').exists()).toBe(false);

    await retryButton.trigger('click');
    await flushPromises();

    expect(service.resumeAgentRun).toHaveBeenCalledWith('note-run-1', {
      userDecision: 'confirm',
    });
    expect(service.createKnowledgeNote).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Knowledge Note Created');
    expect(wrapper.text()).toContain('Grounded Q&A Note.md');
    expect(wrapper.text()).toContain('notes/ai/Grounded Q&A Note.md');
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Created note');
  });

  it('reports an error when retrying a failed Knowledge Note Agent execution fails again', async () => {
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'knowledge-generate',
          goalDraft: null,
          goalClarification: null,
          goalAutomationResult: null,
          clarificationAnswers: [],
          editableGoal: {
            name: '',
            description: '',
            category: '',
            importance: 'Moderate',
            motivation: '',
            feasibilityAnalysis: '',
            tags: [],
            startDate: null,
            targetDate: null,
          },
          editableKeyResults: [],
          noteAgentRun: createFailedKnowledgeNoteAgentRunResult({
            targetSubpath: 'notes/agent-drafts',
          }),
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(
      ok({
        data: [{ id: 'conv-1', name: 'Knowledge note session' }],
      }),
    );
    service.listMessages.mockResolvedValue(
      ok({
        data: [{ id: 'm-1', role: 'user', content: 'Summarize agent notes.' }],
      }),
    );
    service.resumeAgentRun.mockResolvedValueOnce(
      ok(createFailedKnowledgeNoteAgentRunResult({ targetSubpath: 'notes/agent-drafts' })),
    );

    const wrapper = mountView();
    await flushPromises();

    const retryButton = wrapper.find('[data-testid="knowledge-note-retry-execution"]');
    expect(retryButton.exists()).toBe(true);

    await retryButton.trigger('click');
    await flushPromises();

    expect(service.resumeAgentRun).toHaveBeenCalledWith('note-run-1', {
      userDecision: 'confirm',
    });
    expect(service.createKnowledgeNote).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="knowledge-note-retry-execution"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="knowledge-note-save-draft"]').exists()).toBe(false);
    expect(mocks.toastError).toHaveBeenCalledWith('Repository write failed.');
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it('opens a knowledge citation through the repository workspace', async () => {
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'knowledge-qa',
          goalDraft: null,
          goalClarification: null,
          goalAutomationResult: null,
          knowledgeAnswer: createKnowledgeAnswer(),
          clarificationAnswers: [],
          editableGoal: {
            name: '',
            description: '',
            category: '',
            importance: 'Moderate',
            motivation: '',
            feasibilityAnalysis: '',
            tags: [],
            startDate: null,
            targetDate: null,
          },
          editableKeyResults: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue(
      ok({
        data: [{ id: 'conv-1', name: 'Knowledge session' }],
      }),
    );
    service.listMessages.mockResolvedValue(
      ok({
        data: [{ id: 'm-1', role: 'user', content: 'How should knowledge answers be grounded?' }],
      }),
    );

    const wrapper = mountView();
    await flushPromises();

    await wrapper.find('[data-testid="knowledge-citation-open"]').trigger('click');
    await flushPromises();

    expect(mocks.push).toHaveBeenCalledWith({ path: '/repository', query: { note: 'resource-1' } });
  });
});
