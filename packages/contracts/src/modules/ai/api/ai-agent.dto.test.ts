import { describe, expect, it } from 'vitest';
import {
  AgentActionPlanSchema,
  AgentActionSchema,
  AgentEventSchema,
  AgentRunListParamsSchema,
  AgentRunResultSchema,
  AgentResumePayloadSchema,
  AgentStartRunClientRequestSchema,
  AgentStartRunRequestSchema,
  AgentStateSchema,
} from './ai-agent.dto';
import {
  GoalAutomationActionToolSchema,
  GoalAutomationPlanSchema,
} from './ai-goal-automation.dto';

describe('AI agent contract schemas', () => {

  it('accepts residual 427 AgentType task.create on start run client request', () => {
    const parsed = AgentStartRunClientRequestSchema.parse({
      runId: 'run-task-1',
      threadId: 'thread-task-1',
      conversationId: 'conv-task-1',
      agentType: 'task.create',
      locale: 'en-US',
      input: { title: 'Ship task lane' },
    });
    expect(parsed.agentType).toBe('task.create');
  });
  it.each(['update_knowledge_note', 'reindex_resource'] as const)(
    'rejects first-phase-closed knowledge mutation tools: %s',
    (tool) => {
      expect(
        AgentActionSchema.safeParse({
          tool,
          index: 0,
          rationale: 'Existing note edit remains closed in phase 1.',
          payload: {},
        }).success,
      ).toBe(false);
    },
  );

  it('accepts a confirmation-first action plan with side-effect actions', () => {
    const parsed = AgentActionPlanSchema.parse({
      summary: 'Create a goal after user approval.',
      actions: [
        {
          tool: 'create_goal',
          index: 0,
          rationale: 'The goal must exist before key results can be attached.',
          payload: { title: 'Ship AI workspace' },
        },
        {
          tool: 'create_key_result',
          index: 1,
          dependsOn: [0],
          payload: { title: 'Workspace loads at /' },
        },
      ],
    });

    expect(parsed.actions[1]?.dependsOn).toEqual([0]);
    expect(parsed.warnings).toEqual([]);
  });

  it('projects a knowledge answer artifact and citation into agent state', () => {
    const parsed = AgentStateSchema.parse({
      stage: 'answer',
      intent: 'knowledge-qa',
      artifacts: [
        {
          artifactId: 'artifact-1',
          kind: 'knowledge_answer',
          title: 'Grounded answer',
          updatedAt: 1,
          data: { answer: 'Use citations when evidence exists.' },
        },
      ],
      citations: [
        {
          resourceId: 'resource-1',
          resourcePath: 'notes/ai.md',
          chunkIndex: 0,
          excerpt: 'Answers should be grounded.',
          score: 0.9,
        },
      ],
    });

    expect(parsed.messages).toEqual([]);
    expect(parsed.citations).toHaveLength(1);
  });

  it('rejects unknown event names', () => {
    const parsed = AgentEventSchema.safeParse({
      eventId: 'event-1',
      runId: 'run-1',
      sequence: 0,
      type: 'run.paused',
      createdAt: 1,
    });

    expect(parsed.success).toBe(false);
  });

  it('accepts resume payloads carrying the approved immutable plan', () => {
    const parsed = AgentResumePayloadSchema.parse({
      userDecision: 'confirm',
      approvedPlan: {
        summary: 'Approved plan',
        actions: [{ tool: 'create_goal', index: 0 }],
      },
      approvedActions: [{ tool: 'create_goal', index: 0 }],
    });

    expect(parsed.userDecision).toBe('confirm');
    expect(parsed.approvedActions?.[0]?.tool).toBe('create_goal');
  });

  it('accepts resume payloads carrying clarification answers', () => {
    const parsed = AgentResumePayloadSchema.parse({
      userDecision: 'clarify',
      clarificationAnswers: [
        'Run a 5K without stopping.',
        'Review progress every Sunday.',
      ],
    });

    expect(parsed.userDecision).toBe('clarify');
    expect(parsed.clarificationAnswers).toEqual([
      'Run a 5K without stopping.',
      'Review progress every Sunday.',
    ]);
  });

  it('accepts goal automation reminder previews and create_reminder actions', () => {
    const parsedPlan = GoalAutomationPlanSchema.parse({
      goal: {
        title: 'Ship AI workspace',
        description: 'Ship the controlled Agent workflow.',
        category: 'work',
        suggestedStartDate: 1,
        suggestedEndDate: 2,
        importance: 'Important',
        tags: ['ai'],
      },
      reminders: [
        {
          title: 'Weekly Agent review',
          description: 'Review goal progress and choose the next focus.',
          importance: 'Moderate',
          cadence: 'weekly',
          timeOfDay: '10:30',
        },
      ],
    });
    const parsedTool = GoalAutomationActionToolSchema.parse('create_reminder');

    expect(parsedPlan.reminders?.[0]?.cadence).toBe('weekly');
    expect(parsedPlan.reminders?.[0]?.timeOfDay).toBe('10:30');
    expect(parsedTool).toBe('create_reminder');
  });

  it('accepts resume payloads carrying TS-controlled execution results', () => {
    const parsed = AgentResumePayloadSchema.parse({
      userDecision: 'confirm',
      executedActions: [
        {
          tool: 'create_goal',
          status: 'executed',
          entityId: 'goal-1',
          message: 'Created goal',
        },
        {
          tool: 'create_key_result',
          status: 'failed',
          message: 'Missing key result draft',
        },
      ],
    });

    expect(parsed.executedActions?.[0]?.entityId).toBe('goal-1');
    expect(parsed.executedActions?.[1]?.status).toBe('failed');
  });

  it('accepts the experimental run start request shape', () => {
    const parsed = AgentStartRunRequestSchema.parse({
      runId: 'run-1',
      threadId: 'thread-1',
      conversationId: null,
      identityId: 'identity-1',
      agentType: 'goal.create',
      locale: 'en-US',
      input: {
        idea: 'Ship the AI Agent workspace',
      },
    });

    expect(parsed.agentType).toBe('goal.create');
    expect(parsed.conversationId).toBeNull();
  });

  it('accepts run list filters for active run history views', () => {
    const parsed = AgentRunListParamsSchema.parse({
      conversationId: 'conversation-1',
      status: ['waiting_approval', 'waiting_execution'],
      activeOnly: true,
      limit: 10,
    });

    expect(parsed.status).toEqual(['waiting_approval', 'waiting_execution']);
    expect(parsed.activeOnly).toBe(true);
  });

  it('accepts the client run start request without a caller-supplied identity', () => {
    const parsed = AgentStartRunClientRequestSchema.parse({
      runId: 'run-1',
      threadId: 'thread-1',
      conversationId: null,
      identityId: 'identity-from-client',
      agentType: 'goal.create',
      locale: 'zh-CN',
      input: {
        idea: 'Ship the AI Agent workspace',
      },
    });

    expect(parsed).not.toHaveProperty('identityId');
    expect(parsed.agentType).toBe('goal.create');
    expect(parsed.locale).toBe('zh-CN');
  });

  it('requires a supported UI locale when starting an Agent run', () => {
    expect(AgentStartRunClientRequestSchema.safeParse({
      runId: 'run-1',
      threadId: 'thread-1',
      conversationId: null,
      agentType: 'goal.create',
      input: { idea: 'Ship the AI Agent workspace' },
    }).success).toBe(false);

    expect(AgentStartRunClientRequestSchema.safeParse({
      runId: 'run-1',
      threadId: 'thread-1',
      conversationId: null,
      agentType: 'goal.create',
      locale: 'fr-FR',
      input: { idea: 'Ship the AI Agent workspace' },
    }).success).toBe(false);
  });

  it('rejects more than three clarification answers', () => {
    expect(AgentResumePayloadSchema.safeParse({
      userDecision: 'clarify',
      clarificationAnswers: ['one', 'two', 'three', 'four'],
    }).success).toBe(false);
  });

  it('accepts the experimental run result shape emitted by FastAPI', () => {
    const parsed = AgentRunResultSchema.parse({
      run: {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-1',
        agentType: 'goal.create',
        status: 'waiting_approval',
        createdAt: 1,
        updatedAt: 2,
      },
      state: {
        stage: 'approval',
        intent: 'goal-create',
        usage: {
          promptTokens: null,
          completionTokens: null,
          totalTokens: null,
        },
        pendingActions: [{ tool: 'create_goal', index: 0, rationale: null }],
      },
      events: [
        {
          eventId: 'event-1',
          runId: 'run-1',
          sequence: 0,
          type: 'approval.required',
          createdAt: 2,
          data: {},
        },
      ],
      interrupts: [
        {
          runId: 'run-1',
          pendingActions: [{ tool: 'create_goal', index: 0 }],
        },
      ],
    });

    expect(parsed.run.status).toBe('waiting_approval');
    expect(parsed.state.pendingActions[0]?.rationale).toBeNull();
    expect(parsed.interrupts).toHaveLength(1);
  });

  it('accepts a run paused for clarification', () => {
    const parsed = AgentRunResultSchema.parse({
      run: {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-1',
        agentType: 'goal.create',
        status: 'waiting_clarification',
        createdAt: 1,
        updatedAt: 2,
      },
      state: {
        stage: 'clarify',
        intent: 'goal-create',
      },
      events: [
        {
          eventId: 'event-1',
          runId: 'run-1',
          sequence: 0,
          type: 'clarification.required',
          createdAt: 2,
          data: {},
        },
      ],
      interrupts: [
        {
          type: 'clarification.required',
          runId: 'run-1',
          threadId: 'thread-1',
          agentType: 'goal.create',
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
        },
      ],
    });

    expect(parsed.run.status).toBe('waiting_clarification');
    expect(parsed.events[0]?.type).toBe('clarification.required');
  });

  it('accepts a run paused for TS-controlled execution', () => {
    const parsed = AgentRunResultSchema.parse({
      run: {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-1',
        agentType: 'goal.create',
        status: 'waiting_execution',
        createdAt: 1,
        updatedAt: 2,
      },
      state: {
        stage: 'execute',
        intent: 'goal-create',
        approvedActions: [{ tool: 'create_goal', index: 0 }],
        artifacts: [
          {
            artifactId: 'run-1:goal-draft',
            kind: 'goal_draft',
            title: 'Ship AI workspace',
            data: { title: 'Ship AI workspace' },
            updatedAt: 2,
          },
        ],
      },
      events: [
        {
          eventId: 'event-1',
          runId: 'run-1',
          sequence: 0,
          type: 'execution.required',
          createdAt: 2,
          data: {},
        },
      ],
      interrupts: [
        {
          type: 'execution.required',
          runId: 'run-1',
          threadId: 'thread-1',
          agentType: 'goal.create',
          approvedActions: [{ tool: 'create_goal', index: 0 }],
          artifacts: [],
        },
      ],
    });

    expect(parsed.run.status).toBe('waiting_execution');
    expect(parsed.events[0]?.type).toBe('execution.required');
  });
});
