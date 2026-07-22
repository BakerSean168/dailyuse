import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import AIGoalDraftEditor from './AIGoalDraftEditor.vue';
import AIGoalWorkflowPanel from './AIGoalWorkflowPanel.vue';

type PanelProps = InstanceType<typeof AIGoalWorkflowPanel>['$props'];

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      common: {
        untitled: 'Untitled',
        none: 'None',
      },
      aiAssistant: {
        chatPage: {
          workflow: {
            goalClarificationTitle: 'Goal Clarification',
            goalClarificationHint: 'Needs clarification',
            goalClarificationAnswerPlaceholder: 'Answer here',
            goalDraftTitle: 'Goal Draft',
            noteCreatedTitle: 'Knowledge Note Created',
            openCreatedNote: 'Open Note',
            startAnotherNote: 'New Note Chat',
          },
        },
        dialogs: {
          agent: {
            title: 'Agent Run',
            artifacts: 'Artifacts',
            warnings: 'Action Plan Warnings',
            events: 'Runtime Events',
            observability: 'Observability',
            tokenUsage: 'Token Usage',
            promptTokens: '{count} prompt',
            completionTokens: '{count} completion',
            totalTokens: '{count} total',
            diagnosticWorkflowStepTiming: 'Workflow step timing',
            toolTiming: 'Tool Timing',
            diagnosticWorkflowStepStarted: 'Workflow step started',
            diagnosticWorkflowStepCompleted: 'Workflow step completed',
            diagnosticToolCompleted: 'Tool completed',
            diagnosticCheckpoint: 'Checkpoint',
            diagnosticVendor: 'Vendor diagnostic',
            diagnosticRuntimeEvent: 'Runtime event',
            durationMs: '{ms} ms',
            durationSec: '{sec} sec',
            pendingActions: 'Pending Actions',
            actionNumber: 'Action {number}',
            noActionDependencies: 'No dependencies',
            actionDependsOn: 'Depends on {actions}',
            actionDependencyLabel: 'Action {number} ({tool})',
            unknownAction: 'Action {number}',
            executedActions: 'Execution Timeline',
          },
          automation: {
            summary: 'Summary',
            actions: 'Actions',
            executionStatus: 'Execution Status',
            executionSummaryText: '{status}: {executed} executed, {skipped} skipped, {failed} failed.',
            executionTimeline: 'Execution Timeline',
            recoveryTitle: 'Recovery',
            recoveryRetryReady: 'Retry ready',
            recoverySuggestions: 'Recovery suggestions',
          },
          knowledge: {
            answer: 'Knowledge Answer',
            grounded: 'Grounded in repository citations',
            insufficientEvidence: 'Current knowledge base evidence is insufficient',
            question: 'Question',
            matchedResources: '{count} note(s) matched in {ms} ms.',
            citations: 'Citations',
            relatedNotes: 'Related Notes',
            openCitation: 'Open Source',
          },
          note: {
            draftTitle: 'Knowledge Note Draft',
            duplicateRisk: 'Duplicate Risk',
            indexStatus: 'Index Status',
            savePath: 'Save Path',
            tags: 'Tags',
            source: 'Source',
            newNoteCreated: 'New note created',
            savedTo: 'Saved To',
            preview: 'Preview',
          },
        },
        goalDraft: {
          importance: 'Importance',
          selectImportance: 'Select importance',
          taskTemplates: 'Task Templates',
          taskTemplateName: 'Task template name',
          taskTemplateDescription: 'Describe the task template...',
          addTaskTemplate: 'Add Task Template',
          removeTaskTemplate: 'Remove',
          noTaskTemplates: 'No task templates will be created.',
          reminders: 'Reminders',
          reminderTitle: 'Reminder title',
          reminderDescription: 'Describe the reminder...',
          reminderTime: 'Reminder time',
          addReminder: 'Add Reminder',
          removeReminder: 'Remove',
          noReminders: 'No reminders will be created.',
          cadence: 'Cadence',
          selectCadence: 'Select cadence',
          cadenceDaily: 'Daily',
          cadenceWeekly: 'Weekly',
          cadenceOnce: 'Once',
          importanceLevels: {
            vital: 'Vital',
            important: 'Important',
            moderate: 'Moderate',
            minor: 'Minor',
            trivial: 'Trivial',
          },
        },
      },
    },
  },
});

function createPanelProps(overrides: Partial<PanelProps> = {}): PanelProps {
  return {
    toolMode: 'knowledge-qa',
    goalClarification: null,
    goalDraft: null,
    goalAutomationResult: null,
    goalAgentRun: null,
    goalAgentPendingActions: [],
    goalAgentExecutedActions: [],
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
    showGoalDraftEditor: false,
    creatingGoal: false,
    goalExecutedActions: [],
    goalExecutionSummary: null,
    goalExecutionRecovery: null,
    knowledgeAnswer: null,
    knowledgeQaAgentRun: null,
    noteAgentRun: {
      run: {
        runId: 'note-run-1',
        threadId: 'note-thread-1',
        conversationId: 'conv-1',
        identityId: 'identity-1',
        agentType: 'knowledge.generate',
        status: 'completed',
        createdAt: 1,
        updatedAt: 2,
      },
      state: {
        messages: [],
        intent: 'knowledge-generate',
        stage: 'result',
        artifacts: [
          {
            artifactId: 'note-run-1:knowledge-note-draft',
            kind: 'knowledge_note_draft',
            title: 'AI Note Draft',
            data: {
              title: 'AI Note Draft',
              markdown: '# AI Note Draft\n\nDrafted from the conversation.',
              source: 'User: Summarize agent notes.',
              targetSubpath: 'notes/ai',
              tags: [],
              duplicateRisk: 'unknown',
              indexStatus: 'draft',
            },
            updatedAt: 2,
          },
        ],
        citations: [],
        retrievedContext: [],
        pendingActions: [],
        approvedActions: [],
        executedActions: [],
        usage: {},
        errors: [],
      },
      events: [],
      interrupts: [],
    },
    noteSummary: null,
    notePreview: '',
    formatAutomationTool: (tool: string) => tool,
    formatAgentTool: (tool: string) => tool,
    formatActionStatus: (status: string) => status,
    formatExecutionOutcome: (status: string) => status,
    ...overrides,
  };
}

describe('AIGoalWorkflowPanel', () => {
  it('renders knowledge answer related notes from citations', () => {
    const wrapper = mount(AIGoalWorkflowPanel, {
      props: createPanelProps({
        noteAgentRun: null,
        knowledgeAnswer: {
          answer: 'Use cited repository excerpts to answer the question.',
          citations: [
            {
              resourceId: 'resource-1',
              resourcePath: 'notes/ai/grounded-answer.md',
              title: 'Grounded Answer',
              chunkIndex: 0,
              excerpt: 'Repository evidence says to keep answers grounded in citations.',
              score: 0.92,
            },
          ],
          providerId: 'provider-1',
          tokenUsage: {
            promptTokens: 12,
            completionTokens: 8,
            totalTokens: 20,
          },
          processingTimeMs: 42,
          matchedResourceCount: 1,
          question: 'How should knowledge answers be grounded?',
          evidenceStatus: 'grounded',
        },
      }),
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.find('[data-testid="knowledge-answer-panel"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Related Notes');
    expect(wrapper.text()).toContain('Grounded Answer');
    expect(wrapper.text()).toContain('notes/ai/grounded-answer.md');
    expect(wrapper.find('[data-testid="knowledge-related-note-open"]').exists()).toBe(true);
  });

  it('renders Knowledge Q&A Agent runtime observability with the answer artifact', () => {
    const wrapper = mount(AIGoalWorkflowPanel, {
      props: createPanelProps({
        noteAgentRun: null,
        knowledgeAnswer: {
          answer: 'Use cited repository excerpts to answer the question.',
          citations: [
            {
              resourceId: 'resource-1',
              resourcePath: 'notes/ai/grounded-answer.md',
              title: 'Grounded Answer',
              chunkIndex: 0,
              excerpt: 'Repository evidence says to keep answers grounded in citations.',
              score: 0.92,
            },
          ],
          providerId: 'provider-1',
          tokenUsage: {
            promptTokens: 12,
            completionTokens: 8,
            totalTokens: 20,
          },
          processingTimeMs: 42,
          matchedResourceCount: 1,
          question: 'How should knowledge answers be grounded?',
          evidenceStatus: 'grounded',
        },
        knowledgeQaAgentRun: {
          run: {
            runId: 'knowledge-qa-run-1',
            threadId: 'knowledge-qa-thread-1',
            conversationId: 'conv-1',
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
            artifacts: [],
            citations: [],
            retrievedContext: [],
            pendingActions: [],
            approvedActions: [],
            executedActions: [],
            usage: {
              promptTokens: 12,
              completionTokens: 8,
              totalTokens: 20,
            },
            errors: [],
          },
          events: [
            {
              eventId: 'knowledge-qa-run-1:0',
              runId: 'knowledge-qa-run-1',
              sequence: 0,
              type: 'node.completed',
              createdAt: 1,
              data: { node: 'search_knowledge', durationMs: 31 },
            },
          ],
          interrupts: [],
        },
      }),
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.find('[data-testid="knowledge-qa-agent-observability"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Observability');
    expect(wrapper.text()).toContain('Token Usage');
    expect(wrapper.text()).toContain('12 prompt · 8 completion · 20 total');
    expect(wrapper.text()).toContain('Workflow step timing');
    expect(wrapper.text()).toContain('31 ms');
    expect(wrapper.text()).toContain('Runtime Events');
    expect(wrapper.text()).toContain('Workflow step completed · search_knowledge');
    expect(wrapper.text()).not.toContain('node.completed');
  });

  it('renders knowledge note draft duplicate and index metadata', () => {
    const wrapper = mount(AIGoalWorkflowPanel, {
      props: createPanelProps(),
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.find('[data-testid="knowledge-note-agent-panel"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Knowledge Note Draft');
    expect(wrapper.text()).toContain('AI Note Draft');
    expect(wrapper.text()).toContain('Drafted from the conversation.');
    expect(wrapper.text()).toContain('Save Path');
    expect(wrapper.text()).toContain('notes/ai');
    expect(wrapper.text()).toContain('Tags');
    expect(wrapper.text()).toContain('None');
    expect(wrapper.text()).toContain('Duplicate Risk');
    expect(wrapper.text()).toContain('unknown');
    expect(wrapper.text()).toContain('Index Status');
    expect(wrapper.text()).toContain('draft');
    expect(wrapper.text()).toContain('Source');
    expect(wrapper.text()).toContain('User: Summarize agent notes.');
  });

  it('renders recent knowledge note Agent runtime events', () => {
    const baseNoteRun = createPanelProps().noteAgentRun!;
    const wrapper = mount(AIGoalWorkflowPanel, {
      props: createPanelProps({
        noteAgentRun: {
          ...baseNoteRun,
          state: {
            ...baseNoteRun.state,
            usage: {
              promptTokens: 12,
              completionTokens: 8,
              totalTokens: 20,
            },
          },
          events: [
            {
              eventId: 'note-run-1:0',
              runId: 'note-run-1',
              sequence: 0,
              type: 'node.started',
              createdAt: 1,
              data: { node: 'draft_note' },
            },
            {
              eventId: 'note-run-1:1',
              runId: 'note-run-1',
              sequence: 1,
              type: 'node.completed',
              createdAt: 2,
              data: { node: 'draft_note', durationMs: 24 },
            },
            {
              eventId: 'note-run-1:2',
              runId: 'note-run-1',
              sequence: 2,
              type: 'artifact.updated',
              createdAt: 2,
              data: { kind: 'knowledge_note_draft' },
            },
            {
              eventId: 'note-run-1:3',
              runId: 'note-run-1',
              sequence: 3,
              type: 'tool.completed',
              createdAt: 3,
              data: {
                tool: 'create_knowledge_note',
                status: 'executed',
                durationMs: 1250,
              },
            },
          ],
        },
      }),
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.text()).toContain('Runtime Events');
    expect(wrapper.text()).toContain('Workflow step started · draft_note');
    expect(wrapper.text()).toContain('Workflow step completed · draft_note');
    expect(wrapper.text()).not.toContain('node.started');
    expect(wrapper.text()).not.toContain('node.completed');
    expect(wrapper.text()).toContain('Runtime event · knowledge_note_draft');
    expect(wrapper.text()).not.toContain('artifact.updated');
    expect(wrapper.find('[data-testid="note-agent-observability"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Observability');
    expect(wrapper.text()).toContain('Token Usage');
    expect(wrapper.text()).toContain('12 prompt · 8 completion · 20 total');
    expect(wrapper.text()).toContain('Workflow step timing');
    expect(wrapper.text()).toContain('24 ms');
    expect(wrapper.text()).toContain('Tool Timing');
    expect(wrapper.text()).toContain('1.3 sec');
    expect(wrapper.text()).toContain('Tool completed · create_knowledge_note');
    expect(wrapper.text()).not.toContain('tool.completed ·');
  });

  it('renders Goal Agent action plan warnings before approval', () => {
    const wrapper = mount(AIGoalWorkflowPanel, {
      props: createPanelProps({
        toolMode: 'goal-create',
        noteAgentRun: null,
        goalAgentPendingActions: [
          {
            tool: 'create_goal',
            payload: { title: 'Ship AI workspace' },
            rationale: 'Create the approved goal draft after user confirmation.',
            index: 0,
            dependsOn: [],
          },
        ],
        goalAgentRun: {
          run: {
            runId: 'run-1',
            threadId: 'thread-1',
            conversationId: 'conv-1',
            identityId: 'identity-1',
            agentType: 'goal.create',
            status: 'waiting_approval',
            createdAt: 1,
            updatedAt: 2,
          },
          state: {
            messages: [],
            intent: 'goal-create',
            stage: 'approval',
            artifacts: [
              {
                artifactId: 'run-1:action-plan',
                kind: 'action_plan',
                title: 'Approval plan',
                data: {
                  summary: 'Create one goal after approval.',
                  actions: [],
                  warnings: [
                    'Key results are missing, so execution will only create the goal.',
                  ],
                },
                updatedAt: 2,
              },
            ],
            citations: [],
            retrievedContext: [],
            pendingActions: [
              {
                tool: 'create_goal',
                payload: { title: 'Ship AI workspace' },
                rationale: 'Create the approved goal draft after user confirmation.',
                index: 0,
                dependsOn: [],
              },
            ],
            approvedActions: [],
            executedActions: [],
            usage: {},
            errors: [],
          },
          events: [],
          interrupts: [],
        },
      }),
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.find('[data-testid="goal-agent-warnings"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Action Plan Warnings');
    expect(wrapper.text()).toContain(
      'Key results are missing, so execution will only create the goal.',
    );
  });

  it('renders Goal Agent pending action ordering and dependencies before approval', () => {
    const pendingActions = [
      {
        tool: 'create_goal',
        payload: { title: 'Ship AI workspace' },
        rationale: 'Create the goal first.',
        index: 0,
        dependsOn: [],
      },
      {
        tool: 'create_key_result',
        payload: { title: 'Finish the runtime approval path' },
        rationale: 'Attach a measurable key result.',
        index: 0,
        dependsOn: [0],
      },
      {
        tool: 'create_task_template',
        payload: { name: 'Weekly implementation block' },
        rationale: 'Create a supporting task template.',
        index: 0,
        dependsOn: [0, 1],
      },
    ];
    const wrapper = mount(AIGoalWorkflowPanel, {
      props: createPanelProps({
        toolMode: 'goal-create',
        noteAgentRun: null,
        goalAgentPendingActions: pendingActions,
        goalAgentRun: {
          run: {
            runId: 'run-1',
            threadId: 'thread-1',
            conversationId: 'conv-1',
            identityId: 'identity-1',
            agentType: 'goal.create',
            status: 'waiting_approval',
            createdAt: 1,
            updatedAt: 2,
          },
          state: {
            messages: [],
            intent: 'goal-create',
            stage: 'approval',
            artifacts: [],
            citations: [],
            retrievedContext: [],
            pendingActions,
            approvedActions: [],
            executedActions: [],
            usage: {},
            errors: [],
          },
          events: [],
          interrupts: [],
        },
        formatAgentTool: (tool: string) => ({
          create_goal: 'Create Goal',
          create_key_result: 'Create Key Result',
          create_task_template: 'Create Task Template',
        }[tool] ?? tool),
      }),
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.findAll('[data-testid="goal-agent-pending-action-number"]').map((item) => item.text())).toEqual([
      'Action 1',
      'Action 2',
      'Action 3',
    ]);
    expect(wrapper.findAll('[data-testid="goal-agent-pending-action-dependencies"]').map((item) => item.text())).toEqual([
      'No dependencies',
      'Depends on Action 1 (Create Goal)',
      'Depends on Action 1 (Create Goal), Action 2 (Create Key Result)',
    ]);
  });

  it('renders editable Goal Agent draft without the legacy create action', async () => {
    const editableGoal = {
      name: 'Ship AI workspace',
      description: 'Prepare the Agent workspace for approval.',
      category: 'work',
      importance: 'Important' as const,
      motivation: 'Keep writes gated by approval.',
      feasibilityAnalysis: 'Feasible with the runtime executor.',
      tags: ['ai'],
      startDate: 1,
      targetDate: 2,
    };
    const editableKeyResult = {
      title: 'Complete Agent workflow',
      description: 'Finish the approval and execution path.',
      valueType: 'Incremental' as const,
      calculationMethod: 'Sum' as const,
      startValue: 0,
      currentValue: 0,
      targetValue: 1,
      unit: 'workflow',
      weight: 3,
    };
    const editableTaskTemplate = {
      name: 'Weekly Agent implementation block',
      description: 'Reserve focused implementation time.',
      importance: 'Important' as const,
      cadence: 'weekly' as const,
    };
    const editableReminder = {
      title: 'Review Agent implementation',
      description: 'Check progress and unblock the next task.',
      importance: 'Moderate' as const,
      cadence: 'weekly' as const,
      timeOfDay: '09:00',
    };
    const wrapper = mount(AIGoalWorkflowPanel, {
      props: createPanelProps({
        toolMode: 'goal-create',
        noteAgentRun: null,
        showGoalDraftEditor: true,
        editableGoal,
        editableKeyResults: [editableKeyResult],
        editableTaskTemplates: [editableTaskTemplate],
        editableReminders: [editableReminder],
        goalAgentRun: {
          run: {
            runId: 'run-1',
            threadId: 'thread-1',
            conversationId: 'conv-1',
            identityId: 'identity-1',
            agentType: 'goal.create',
            status: 'waiting_approval',
            createdAt: 1,
            updatedAt: 2,
          },
          state: {
            messages: [],
            intent: 'goal-create',
            stage: 'approval',
            artifacts: [
              {
                artifactId: 'run-1:goal-draft',
                kind: 'goal_draft',
                title: 'Ship AI workspace',
                data: {
                  title: 'Ship AI workspace',
                  description: 'Prepare the Agent workspace for approval.',
                },
                updatedAt: 2,
              },
            ],
            citations: [],
            retrievedContext: [],
            pendingActions: [],
            approvedActions: [],
            executedActions: [],
            usage: {},
            errors: [],
          },
          events: [],
          interrupts: [],
        },
      }),
      global: {
        plugins: [i18n],
      },
    });

    const editor = wrapper.findComponent(AIGoalDraftEditor);
    expect(wrapper.find('[data-testid="goal-agent-draft-editor"]').exists()).toBe(true);
    expect(editor.exists()).toBe(true);
    expect(editor.props('showConfirmAction')).toBe(false);

    const nextGoal = {
      ...editableGoal,
      name: 'Edited AI workspace',
    };
    editor.vm.$emit('update-goal', nextGoal);
    editor.vm.$emit('add-key-result');
    editor.vm.$emit('remove-key-result', 0);
    editor.vm.$emit('update-key-result', {
      index: 0,
      value: {
        ...editableKeyResult,
        title: 'Edited Agent workflow',
      },
    });

    expect(wrapper.emitted('update-goal')?.[0]).toEqual([nextGoal]);
    expect(wrapper.emitted('add-key-result')?.[0]).toEqual([]);
    expect(wrapper.emitted('remove-key-result')?.[0]).toEqual([0]);
    expect(wrapper.emitted('update-key-result')?.[0]).toEqual([
      {
        index: 0,
        value: {
          ...editableKeyResult,
          title: 'Edited Agent workflow',
        },
      },
    ]);
    expect(wrapper.find('[data-testid="goal-agent-supporting-drafts-editor"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="goal-agent-task-template-editor"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="goal-agent-reminder-editor"]').exists()).toBe(true);
    const reminderTimeInput = wrapper.find('[data-testid="goal-agent-reminder-time"]');
    expect(reminderTimeInput.exists()).toBe(true);
    expect(reminderTimeInput.attributes('type')).toBe('time');

    await reminderTimeInput.setValue('10:30');
    expect(wrapper.emitted('update-reminder')?.[0]).toEqual([
      {
        index: 0,
        value: {
          ...editableReminder,
          timeOfDay: '10:30',
        },
      },
    ]);

    wrapper.vm.$emit('add-task-template');
    wrapper.vm.$emit('remove-task-template', 0);
    wrapper.vm.$emit('update-task-template', {
      index: 0,
      value: {
        ...editableTaskTemplate,
        name: 'Edited implementation block',
      },
    });
    wrapper.vm.$emit('add-reminder');
    wrapper.vm.$emit('remove-reminder', 0);
    wrapper.vm.$emit('update-reminder', {
      index: 0,
      value: {
        ...editableReminder,
        title: 'Edited implementation review',
      },
    });

    expect(wrapper.emitted('add-task-template')?.[0]).toEqual([]);
    expect(wrapper.emitted('remove-task-template')?.[0]).toEqual([0]);
    expect(wrapper.emitted('update-task-template')?.[0]).toEqual([
      {
        index: 0,
        value: {
          ...editableTaskTemplate,
          name: 'Edited implementation block',
        },
      },
    ]);
    expect(wrapper.emitted('add-reminder')?.[0]).toEqual([]);
    expect(wrapper.emitted('remove-reminder')?.[0]).toEqual([0]);
    expect(wrapper.emitted('update-reminder')?.[1]).toEqual([
      {
        index: 0,
        value: {
          ...editableReminder,
          title: 'Edited implementation review',
        },
      },
    ]);
  });

  it('renders a compact Goal Agent execution summary', () => {
    const executedActions = [
      {
        tool: 'create_goal',
        status: 'executed',
        entityId: 'goal-1',
        message: 'Created goal "Ship AI workspace"',
      },
      {
        tool: 'create_reminder',
        status: 'failed',
        entityId: null,
        message: 'Reminder creation is not supported yet.',
      },
    ] as const;
    const wrapper = mount(AIGoalWorkflowPanel, {
      props: createPanelProps({
        toolMode: 'goal-create',
        noteAgentRun: null,
        goalAgentExecutedActions: [...executedActions],
        goalAgentRun: {
          run: {
            runId: 'run-1',
            threadId: 'thread-1',
            conversationId: 'conv-1',
            identityId: 'identity-1',
            agentType: 'goal.create',
            status: 'completed',
            createdAt: 1,
            updatedAt: 2,
          },
          state: {
            messages: [],
            intent: 'goal-create',
            stage: 'result',
            artifacts: [],
            citations: [],
            retrievedContext: [],
            pendingActions: [],
            approvedActions: [],
            executedActions: [...executedActions],
            usage: {
              promptTokens: 30,
              completionTokens: 14,
              totalTokens: 44,
            },
            errors: [],
          },
          events: [
            {
              eventId: 'run-1:0',
              runId: 'run-1',
              sequence: 0,
              type: 'node.completed',
              createdAt: 1,
              data: { node: 'draft_goal', durationMs: 80 },
            },
            {
              eventId: 'run-1:1',
              runId: 'run-1',
              sequence: 1,
              type: 'tool.completed',
              createdAt: 2,
              data: { tool: 'create_goal', status: 'executed', durationMs: 1410 },
            },
          ],
          interrupts: [],
        },
        formatAgentTool: (tool: string) =>
          tool === 'create_goal' ? 'Create Goal' : 'Create Reminder',
        formatActionStatus: (status: string) =>
          status === 'executed' ? 'Executed' : 'Failed',
        formatExecutionOutcome: (status: string) =>
          status === 'partial' ? 'Partial success' : status,
      }),
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.find('[data-testid="goal-agent-panel"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="goal-agent-observability"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Token Usage');
    expect(wrapper.text()).toContain('30 prompt · 14 completion · 44 total');
    expect(wrapper.text()).toContain('Workflow step timing');
    expect(wrapper.text()).toContain('80 ms');
    expect(wrapper.text()).toContain('Tool Timing');
    expect(wrapper.text()).toContain('1.4 sec');
    expect(wrapper.text()).toContain('Tool completed · create_goal');
    expect(wrapper.text()).not.toContain('tool.completed ·');
    expect(wrapper.find('[data-testid="goal-agent-execution-summary"]').text()).toBe(
      'Partial success: 1 executed, 0 skipped, 1 failed.',
    );
    expect(wrapper.text()).toContain('Create Goal · Executed');
    expect(wrapper.text()).toContain('Create Reminder · Failed');
    expect(wrapper.find('[data-testid="goal-agent-recovery"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Retry ready');
    expect(wrapper.text()).toContain('Recovery suggestions');
    expect(wrapper.text()).toContain('Create Reminder: Reminder creation is not supported yet.');
  });

  it('renders saved knowledge note index status', () => {
    const wrapper = mount(AIGoalWorkflowPanel, {
      props: createPanelProps({
        noteSummary: {
          resolvedPath: 'notes/ai/Grounded Q&A Note.md',
          indexStatus: 'pending',
          note: {
            name: 'Grounded Q&A Note.md',
            content: '# Grounded Q&A Note\n\nSaved from the knowledge answer.',
          },
        },
        notePreview: 'Saved from the knowledge answer.',
      }),
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.find('[data-testid="knowledge-note-summary-panel"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Knowledge Note Created');
    expect(wrapper.text()).toContain('Grounded Q&A Note.md');
    expect(wrapper.text()).toContain('notes/ai/Grounded Q&A Note.md');
    expect(wrapper.text()).toContain('Index Status');
    expect(wrapper.text()).toContain('pending');
  });
});
