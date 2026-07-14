import { expect, test, type Page, type Route } from '@playwright/test';
import {
  createMockGoal,
  createMockRepository,
  createMockResource,
  createMockUserSetting,
} from '@dailyuse/contracts/mocks';
import { TIMEOUT_CONFIG, WEB_CONFIG } from '../config';
import { registerAndLogin } from '../helpers/testHelpers';

const generateTestEmail = () =>
  `e2e-ai-goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
const e2eConversationId = 'conv-e2e-goal-1';
const e2ePassword = 'Test123456!';

type GoalWorkflowSessionOptions = {
  email?: string;
  conversationId?: string | null;
  modelKey?: string | null;
  workflowEntry?: Record<string, unknown> | null;
  legacyGoalWorkflow?: boolean;
  seedConversation?: boolean;
  landingPath?: string;
};

/**
 * Seed only AI workspace local state after a real authenticated session exists.
 * Do not plant fake access/refresh tokens — auth must come from registerAndLogin.
 */
async function seedAiLocalState(
  page: Page,
  options: {
    conversationId?: string | null;
    modelKey?: string | null;
    workflowEntry?: Record<string, unknown> | null;
    legacyGoalWorkflow?: boolean;
  } = {},
): Promise<void> {
  const conversationId = options.conversationId ?? null;
  const modelKey = options.modelKey ?? null;
  const workflowEntry = options.workflowEntry ?? null;
  const legacyGoalWorkflow = options.legacyGoalWorkflow ?? false;

  await page.evaluate(
    ({
      lastConversationStorageKey,
      conversationWorkflowStorageKey,
      lastModelStorageKey,
      conversationModelStorageKey,
      legacyGoalWorkflowStorageKey,
      seededConversationId,
      seededModelKey,
      seededWorkflowEntry,
      seededLegacyGoalWorkflow,
    }) => {
      window.localStorage.removeItem(lastModelStorageKey);
      if (seededLegacyGoalWorkflow) {
        window.localStorage.setItem(legacyGoalWorkflowStorageKey, 'true');
      } else {
        window.localStorage.removeItem(legacyGoalWorkflowStorageKey);
      }

      if (seededConversationId) {
        window.localStorage.setItem(lastConversationStorageKey, seededConversationId);
        if (seededModelKey) {
          window.localStorage.setItem(
            conversationModelStorageKey,
            JSON.stringify({ [seededConversationId]: seededModelKey }),
          );
        } else {
          window.localStorage.removeItem(conversationModelStorageKey);
        }

        if (seededWorkflowEntry) {
          window.localStorage.setItem(
            conversationWorkflowStorageKey,
            JSON.stringify({ [seededConversationId]: seededWorkflowEntry }),
          );
        } else {
          window.localStorage.removeItem(conversationWorkflowStorageKey);
        }
      } else {
        window.localStorage.removeItem(lastConversationStorageKey);
        window.localStorage.removeItem(conversationWorkflowStorageKey);
        window.localStorage.removeItem(conversationModelStorageKey);
      }
    },
    {
      lastConversationStorageKey: 'ai:last-conversation-id',
      conversationWorkflowStorageKey: 'ai:conversation-workflow-map',
      lastModelStorageKey: 'ai:last-model-key',
      conversationModelStorageKey: 'ai:conversation-model-map',
      legacyGoalWorkflowStorageKey: 'ai:debug:legacy-goal-workflow',
      seededConversationId: conversationId,
      seededModelKey: modelKey,
      seededWorkflowEntry: workflowEntry,
      seededLegacyGoalWorkflow: legacyGoalWorkflow,
    },
  );
}

/**
 * Real JWT via register/login, then AI route mocks, then optional AI local state, then navigate.
 * Mocks are installed after auth so register/login/settings are not blocked incorrectly.
 */
async function bootstrapGoalWorkflowSession(
  page: Page,
  options: GoalWorkflowSessionOptions = {},
): Promise<GoalWorkflowMockTelemetry> {
  const email = options.email ?? generateTestEmail();
  const landingPath = options.landingPath ?? '/';

  await registerAndLogin(page, {
    email,
    password: e2ePassword,
  });

  const telemetry = await installGoalWorkflowMocks(page, {
    seedConversation: options.seedConversation,
  });

  await seedAiLocalState(page, {
    conversationId: options.conversationId,
    modelKey: options.modelKey,
    workflowEntry: options.workflowEntry,
    legacyGoalWorkflow: options.legacyGoalWorkflow,
  });

  await page.goto(WEB_CONFIG.getFullUrl(landingPath), {
    waitUntil: 'networkidle',
    timeout: TIMEOUT_CONFIG.NAVIGATION,
  });

  return telemetry;
}

test.describe('AI Goal Workflow', () => {
  test('[P0] loads the AI Agent Workspace from the root route', async ({ page }) => {
    await bootstrapGoalWorkflowSession(page);

    await expect(page.getByTestId('ai-chat-view')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(page.getByTestId('ai-chat-composer')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(page).toHaveURL(/\/$/);
  });

  test('[P0] keeps the AI Agent Workspace usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await bootstrapGoalWorkflowSession(page);

    await expect(page.getByTestId('ai-chat-view')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(page.getByTestId('ai-chat-composer')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });

    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth > window.innerWidth + 1 ||
        document.body.scrollWidth > window.innerWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);

    await page.getByTestId('ai-chat-tool-menu-trigger').click();
    await page.getByTestId('ai-chat-tool-knowledge-qa').click();

    const composer = page.getByTestId('ai-chat-composer');
    await expect(composer).toBeVisible();
    await composer.fill('How should knowledge answers stay grounded in citations?');
    await page.getByTestId('ai-chat-send-message').click();

    await expect(page.getByTestId('knowledge-qa-ask')).toBeEnabled({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
  });

  test('[P0] restores a pending Goal Agent approval run after refresh', async ({
    page,
  }) => {
    await bootstrapGoalWorkflowSession(page, {
      conversationId: e2eConversationId,
      modelKey: 'provider-e2e-openai::gpt-4.1-mini',
      workflowEntry: createPendingApprovalWorkflowEntry(),
      seedConversation: true,
    });

    const agentPanel = page.getByTestId('goal-agent-panel');
    await expect(agentPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(agentPanel).toContainText(/waiting_approval/i);
    await expect(agentPanel).toContainText(/Runtime restored Agent workspace/i);
    await expect(agentPanel).toContainText(/Create the runtime-restored Agent goal/i);
    await expect(page.getByTestId('goal-agent-confirm-run')).toBeVisible();
    await expect(page.getByTestId('goal-agent-cancel-run')).toBeVisible();

    await page.reload({ waitUntil: 'networkidle' });

    await expect(agentPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(agentPanel).toContainText(/waiting_approval/i);
    await expect(agentPanel).toContainText(/Runtime restored Agent workspace/i);
    await expect(agentPanel).toContainText(/Create the runtime-restored Agent goal/i);
    await expect(page.getByTestId('goal-agent-confirm-run')).toBeVisible();
  });

  test('[P0] completes Goal Agent confirmation through the controlled executor and retries failed actions', async ({
    page,
  }) => {
    const telemetry = await bootstrapGoalWorkflowSession(page);

    await page.getByTestId('ai-chat-tool-menu-trigger').click();
    await page.getByTestId('ai-chat-tool-goal-create').click();

    const composer = page.getByTestId('ai-chat-composer');
    await composer.fill(
      'Create a structured AI workflow goal through the Agent runtime and execute the approved plan.',
    );
    await page.getByTestId('ai-chat-send-message').click();

    const startButton = page.getByTestId('goal-agent-start-run');
    await expect(startButton).toBeEnabled({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await startButton.click();

    const agentPanel = page.getByTestId('goal-agent-panel');
    await expect(agentPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(agentPanel).toContainText(/waiting_approval/i);
    await expect(agentPanel).toContainText(/Agent-created AI workflow/i);
    await expect(agentPanel).toContainText(/Create the approved goal draft/i);
    await expect(agentPanel).toContainText(/Track a measurable workflow outcome/i);
    await expect(agentPanel).toContainText(/Create a review task template/i);
    await expect(agentPanel).toContainText(/Create a review reminder/i);

    await page.getByTestId('goal-agent-confirm-run').click();

    await expect(agentPanel).toContainText(/completed/i, {
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(page.getByTestId('goal-agent-execution-summary')).toContainText(
      /Partial|部分成功/i,
    );
    await expect(agentPanel).toContainText(/Create Goal|创建目标/i);
    await expect(agentPanel).toContainText(/Create Key Result|创建关键结果/i);
    await expect(agentPanel).toContainText(/Create Task Template|创建任务模板/i);
    await expect(agentPanel).toContainText(/Create Reminder|创建提醒/i);
    await expect(page.getByTestId('goal-agent-recovery')).toContainText(
      /Recovery suggestions|恢复建议|关键结果创建失败/i,
    );
    expect(telemetry.goalAgentStartCount).toBe(1);
    expect(telemetry.goalAgentApprovalResumeCount).toBe(1);
    expect(telemetry.goalAgentExecuteRequestCount).toBe(1);
    expect(telemetry.goalAgentCompletionResumeCount).toBe(1);

    const retryButton = page.getByTestId('goal-agent-retry-execution');
    await expect(retryButton).toBeEnabled({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await retryButton.click();

    await expect(page.getByTestId('goal-agent-execution-summary')).toContainText(
      /Success|执行成功/i,
      { timeout: TIMEOUT_CONFIG.ELEMENT_WAIT },
    );
    await expect(agentPanel).toContainText(/Created key result|已创建关键结果/i);
    await expect(agentPanel).toContainText(/Created task template|已创建任务模板/i);
    await expect(agentPanel).toContainText(/Created reminder|已创建提醒/i);
    await expect(retryButton).toHaveCount(0);
    expect(telemetry.goalAgentRetryResumeCount).toBe(1);
    expect(telemetry.goalAgentExecuteRequestCount).toBe(2);
    expect(telemetry.goalAgentCompletionResumeCount).toBe(2);
  });

  test('[P0] asks the personal knowledge base with citations from the workspace', async ({
    page,
  }) => {
    await bootstrapGoalWorkflowSession(page);

    await page.getByTestId('ai-chat-tool-menu-trigger').click();
    await page.getByTestId('ai-chat-tool-knowledge-qa').click();

    const composer = page.getByTestId('ai-chat-composer');
    await composer.fill('How should knowledge answers stay grounded in citations?');
    await page.getByTestId('ai-chat-send-message').click();

    const askButton = page.getByTestId('knowledge-qa-ask');
    await expect(askButton).toBeEnabled({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await askButton.click();

    const answerPanel = page.getByTestId('knowledge-answer-panel');
    await expect(answerPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(answerPanel).toContainText(/Grounded answers cite repository excerpts/i);
    await expect(answerPanel).toContainText(/Memoflow grounding policy/i);
    await expect(answerPanel).toContainText(/notes\/ai\/grounding-policy\.md/i);
    await expect(page.getByTestId('knowledge-citation-open')).toBeVisible();

    await page.getByTestId('knowledge-qa-draft-note').click();
    const noteAgentPanel = page.getByTestId('knowledge-note-agent-panel');
    await expect(noteAgentPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(noteAgentPanel).toContainText(/Grounded Knowledge Answers/i);

    await page.getByTestId('knowledge-qa-save-draft').click();
    const noteSummaryPanel = page.getByTestId('knowledge-note-summary-panel');
    await expect(noteSummaryPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(noteSummaryPanel).toContainText(/Grounded Knowledge Answers\.md/i);
    await expect(noteSummaryPanel).toContainText(/notes\/ai\/Grounded Knowledge Answers\.md/i);
    await expect(noteSummaryPanel).toContainText(/indexed/i);

    await page.getByTestId('knowledge-citation-open').click();
    await expect(page).toHaveURL(/\/repository$/);
  });

  test('[P0] generates and saves a knowledge note from the current conversation', async ({
    page,
  }) => {
    await bootstrapGoalWorkflowSession(page);

    await page.getByTestId('ai-chat-tool-menu-trigger').click();
    await page.getByTestId('ai-chat-tool-knowledge-generate').click();

    const composer = page.getByTestId('ai-chat-composer');
    await composer.fill(
      'Turn this planning conversation into a reusable knowledge note about agent checkpoints.',
    );
    await page.getByTestId('ai-chat-send-message').click();

    const draftButton = page.getByTestId('knowledge-note-agent-start-run');
    await expect(draftButton).toBeEnabled({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await draftButton.click();

    const noteAgentPanel = page.getByTestId('knowledge-note-agent-panel');
    await expect(noteAgentPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(noteAgentPanel).toContainText(/Conversation Agent Checkpoints/i);
    await expect(noteAgentPanel).toContainText(/ordinary workspace conversation/i);

    await page.getByTestId('knowledge-note-save-draft').click();
    const noteSummaryPanel = page.getByTestId('knowledge-note-summary-panel');
    await expect(noteSummaryPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(noteSummaryPanel).toContainText(/Conversation Agent Checkpoints\.md/i);
    await expect(noteSummaryPanel).toContainText(
      /notes\/ai\/Conversation Agent Checkpoints\.md/i,
    );
    await expect(noteSummaryPanel).toContainText(/indexed/i);
  });

  test('[P0] shows insufficient evidence when knowledge citations are missing', async ({
    page,
  }) => {
    await bootstrapGoalWorkflowSession(page);

    await page.getByTestId('ai-chat-tool-menu-trigger').click();
    await page.getByTestId('ai-chat-tool-knowledge-qa').click();

    const composer = page.getByTestId('ai-chat-composer');
    await composer.fill('What does my repository say about the unindexed archive migration plan?');
    await page.getByTestId('ai-chat-send-message').click();

    const askButton = page.getByTestId('knowledge-qa-ask');
    await expect(askButton).toBeEnabled({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await askButton.click();

    const answerPanel = page.getByTestId('knowledge-answer-panel');
    await expect(answerPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(answerPanel).toContainText(
      /Current knowledge base evidence is insufficient|当前知识库证据不足/i,
    );
    await expect(answerPanel).toContainText(/I do not have enough repository evidence/i);
    await expect(page.getByTestId('knowledge-citation-open')).toHaveCount(0);
    await expect(page.getByTestId('knowledge-qa-draft-note')).toBeDisabled();
  });

  test('[P0] starts Goal Agent from goal-create tool and cancels at approval', async ({
    page,
  }) => {
    const telemetry = await bootstrapGoalWorkflowSession(page);

    await expect(page.getByTestId('ai-chat-view')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(page.getByTestId('ai-chat-composer')).toBeEnabled({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });

    // Product path is Goal Agent runtime only; legacy generate-draft UI is gone.
    await expect(page.getByTestId('goal-workflow-generate-draft')).toHaveCount(0);

    await page.getByTestId('ai-chat-tool-menu-trigger').click();
    await page.getByTestId('ai-chat-tool-goal-create').click();

    const composer = page.getByTestId('ai-chat-composer');
    await composer.fill(
      'Create a structured AI workflow goal through the Agent runtime, then cancel before approving execution.',
    );
    await page.getByTestId('ai-chat-send-message').click();

    const startButton = page.getByTestId('goal-agent-start-run');
    await expect(startButton).toBeEnabled({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await startButton.click();

    const agentPanel = page.getByTestId('goal-agent-panel');
    await expect(agentPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(agentPanel).toContainText(/waiting_approval/i);
    await expect(page.getByTestId('goal-agent-confirm-run')).toBeVisible();
    await expect(page.getByTestId('goal-agent-cancel-run')).toBeVisible();

    await page.getByTestId('goal-agent-cancel-run').click();

    await expect(agentPanel).toContainText(/cancelled/i, {
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(page.getByTestId('goal-agent-confirm-run')).toHaveCount(0);
    await expect(page.getByTestId('goal-agent-cancel-run')).toHaveCount(0);
    expect(telemetry.goalAgentStartCount).toBe(1);
    expect(telemetry.goalAgentCancelCount).toBe(1);
    expect(telemetry.goalAgentApprovalResumeCount).toBe(0);
  });
});

type GoalWorkflowMockOptions = {
  seedConversation?: boolean;
};

type GoalWorkflowMockTelemetry = {
  goalAgentStartCount: number;
  goalAgentApprovalResumeCount: number;
  goalAgentRetryResumeCount: number;
  goalAgentCancelCount: number;
  goalAgentExecuteRequestCount: number;
  goalAgentCompletionResumeCount: number;
};

type GoalAgentMockStatus = 'waiting_approval' | 'waiting_execution' | 'completed' | 'cancelled';

type GoalAgentMockRun = {
  runId: string;
  threadId: string;
  conversationId: string | null;
  createdAt: number;
  goalDraft: Record<string, unknown>;
  actionPlan: {
    summary: string;
    actions: Array<Record<string, unknown>>;
    warnings: string[];
  };
  pendingActions: Array<Record<string, unknown>>;
  approvedActions: Array<Record<string, unknown>>;
  executedActions: Array<Record<string, unknown>>;
};

function createPendingApprovalWorkflowEntry() {
  const now = Date.now();
  const pendingAction = {
    tool: 'create_goal',
    payload: { title: 'Restored AI Agent workspace' },
    rationale: 'Create the restored Agent goal after user approval.',
    index: 0,
    dependsOn: [],
  };

  return {
    mode: 'goal-create',
    goalWorkflowStage: 'confirm',
    goalDraft: null,
    goalClarification: null,
    goalAutomationResult: null,
    goalAgentRun: {
      run: {
        runId: 'run-e2e-restored-approval',
        threadId: 'thread-e2e-restored-approval',
        conversationId: e2eConversationId,
        identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
        agentType: 'goal.create',
        status: 'waiting_approval',
        createdAt: now,
        updatedAt: now,
      },
      state: {
        messages: [
          {
            role: 'user',
            content: 'Restore this pending Agent approval run.',
            createdAt: now,
          },
        ],
        intent: 'goal-create',
        stage: 'approval',
        artifacts: [
          {
            artifactId: 'run-e2e-restored-approval:goal-draft',
            kind: 'goal_draft',
            title: 'Restored AI Agent workspace',
            data: {
              title: 'Restored AI Agent workspace',
              description: 'A pending approval run restored from local workflow state.',
            },
            updatedAt: now,
          },
          {
            artifactId: 'run-e2e-restored-approval:action-plan',
            kind: 'action_plan',
            title: 'Approval plan',
            data: {
              summary: 'Create the restored Agent goal after confirmation.',
              actions: [pendingAction],
              warnings: [],
            },
            updatedAt: now,
          },
        ],
        citations: [],
        retrievedContext: [],
        pendingActions: [pendingAction],
        approvedActions: [],
        executedActions: [],
        usage: {},
        errors: [],
      },
      events: [
        {
          eventId: 'run-e2e-restored-approval:0',
          runId: 'run-e2e-restored-approval',
          sequence: 0,
          type: 'approval.required',
          createdAt: now,
          data: { status: 'waiting_approval' },
        },
      ],
      interrupts: [
        {
          runId: 'run-e2e-restored-approval',
          type: 'approval.required',
          pendingActions: [pendingAction],
        },
      ],
    },
    noteAgentRun: null,
    knowledgeAnswer: null,
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
  };
}

function createRuntimeRestoredApprovalRunResult() {
  const now = Date.now();
  const pendingAction = {
    tool: 'create_goal',
    payload: { title: 'Runtime restored Agent workspace' },
    rationale: 'Create the runtime-restored Agent goal after user approval.',
    index: 0,
    dependsOn: [],
  };

  return {
    run: {
      runId: 'run-e2e-restored-approval',
      threadId: 'thread-e2e-restored-approval',
      conversationId: e2eConversationId,
      identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
      agentType: 'goal.create',
      status: 'waiting_approval',
      createdAt: now,
      updatedAt: now,
    },
    state: {
      messages: [
        {
          role: 'user',
          content: 'Restore this pending Agent approval run from runtime state.',
          createdAt: now,
        },
      ],
      intent: 'goal-create',
      stage: 'approval',
      artifacts: [
        {
          artifactId: 'run-e2e-restored-approval:runtime-goal-draft',
          kind: 'goal_draft',
          title: 'Runtime restored Agent workspace',
          data: {
            title: 'Runtime restored Agent workspace',
            description: 'A pending approval run restored from the Agent runtime snapshot.',
          },
          updatedAt: now,
        },
        {
          artifactId: 'run-e2e-restored-approval:runtime-action-plan',
          kind: 'action_plan',
          title: 'Approval plan',
          data: {
            summary: 'Create the runtime-restored Agent goal after confirmation.',
            actions: [pendingAction],
            warnings: [],
          },
          updatedAt: now,
        },
      ],
      citations: [],
      retrievedContext: [],
      pendingActions: [pendingAction],
      approvedActions: [],
      executedActions: [],
      usage: {
        promptTokens: 21,
        completionTokens: 9,
        totalTokens: 30,
      },
      errors: [],
    },
    events: [
      {
        eventId: 'run-e2e-restored-approval:runtime-0',
        runId: 'run-e2e-restored-approval',
        sequence: 0,
        type: 'approval.required',
        createdAt: now,
        data: { source: 'runtime-snapshot', status: 'waiting_approval' },
      },
    ],
    interrupts: [
      {
        runId: 'run-e2e-restored-approval',
        pendingActions: [pendingAction],
      },
    ],
  };
}

function createGoalAgentMockRun(request: {
  runId?: string;
  threadId?: string;
  conversationId?: string | null;
}): GoalAgentMockRun {
  const now = Date.now();
  const goalDraft = {
    title: 'Agent-created AI workflow',
    description: 'Create a structured goal through the Agent runtime.',
    category: 'learning',
    importance: 'Important',
    motivation: 'Turn the Agent plan into tracked execution.',
    feasibilityAnalysis: 'The approved plan is scoped to goal and KR creation.',
    tags: ['ai', 'agent'],
    suggestedStartDate: now,
    suggestedEndDate: now + 60 * 24 * 60 * 60 * 1000,
    keyResults: [
      {
        title: 'Run the Goal Agent workflow end to end',
        description: 'Confirm Agent runtime execution through the controlled executor.',
        valueType: 'Incremental',
        calculationMethod: 'Sum',
        startValue: 0,
        currentValue: 0,
        targetValue: 1,
        unit: 'workflow',
        weight: 3,
      },
    ],
    taskTemplates: [
      {
        name: 'Review Agent execution',
        description: 'Check result and recovery.',
        importance: 'Moderate',
        cadence: 'weekly',
      },
    ],
    reminders: [
      {
        title: 'Review Agent result',
        description: 'Review failed actions.',
        importance: 'Moderate',
        cadence: 'weekly',
        timeOfDay: '09:00',
      },
    ],
  };
  const pendingActions = [
    {
      tool: 'create_goal',
      payload: { title: 'Agent-created AI workflow' },
      rationale: 'Create the approved goal draft.',
      index: 0,
      dependsOn: [],
    },
    {
      tool: 'create_key_result',
      payload: { title: 'Run the Goal Agent workflow end to end' },
      rationale: 'Track a measurable workflow outcome.',
      index: 0,
      dependsOn: [0],
    },
    {
      tool: 'create_task_template',
      payload: { name: 'Review Agent execution' },
      rationale: 'Create a review task template for recurring execution checks.',
      index: 0,
      dependsOn: [0, 1],
    },
    {
      tool: 'create_reminder',
      payload: { title: 'Review Agent result' },
      rationale: 'Create a review reminder for the approved goal cadence.',
      index: 0,
      dependsOn: [0],
    },
  ];

  return {
    runId: request.runId ?? 'run-e2e-goal-agent-1',
    threadId: request.threadId ?? 'thread-e2e-goal-agent-1',
    conversationId: request.conversationId ?? e2eConversationId,
    createdAt: now,
    goalDraft,
    actionPlan: {
      summary:
        'Create the Agent goal, measurable key result, review task template, and reminder.',
      actions: pendingActions,
      warnings: [],
    },
    pendingActions,
    approvedActions: [],
    executedActions: [],
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function findActionPayload(
  actions: Array<Record<string, unknown>>,
  tool: string,
): Record<string, unknown> {
  const action = actions.find((item) => item.tool === tool);
  expect(action).toBeTruthy();
  return asRecord(action?.payload);
}

function expectGoalAgentApprovalPayload(
  request: {
    approvedActions?: Array<Record<string, unknown>>;
    approvedPlan?: { actions?: Array<Record<string, unknown>> };
    editedArtifacts?: Array<Record<string, unknown>>;
  },
  goalAgentRun: GoalAgentMockRun,
) {
  const approvedActions = request.approvedActions ?? [];
  const approvedTools = approvedActions.map((action) => action.tool);
  expect(approvedTools).toEqual([
    'create_goal',
    'create_key_result',
    'create_task_template',
    'create_reminder',
  ]);

  const goalPayload = findActionPayload(approvedActions, 'create_goal');
  expect(goalPayload.title).toBe(goalAgentRun.goalDraft.title);
  expect(goalPayload.description).toBe(goalAgentRun.goalDraft.description);
  expect(goalPayload.keyResults).toEqual(goalAgentRun.goalDraft.keyResults);
  expect(goalPayload.taskTemplates).toEqual(goalAgentRun.goalDraft.taskTemplates);
  expect(goalPayload.reminders).toEqual(goalAgentRun.goalDraft.reminders);

  const keyResultPayload = findActionPayload(approvedActions, 'create_key_result');
  expect(keyResultPayload.title).toBe('Run the Goal Agent workflow end to end');

  const taskTemplatePayload = findActionPayload(approvedActions, 'create_task_template');
  expect(taskTemplatePayload.name).toBe('Review Agent execution');

  const reminderPayload = findActionPayload(approvedActions, 'create_reminder');
  expect(reminderPayload.title).toBe('Review Agent result');
  expect(reminderPayload.cadence).toBe('weekly');
  expect(reminderPayload.timeOfDay).toBe('09:00');

  expect(request.approvedPlan?.actions?.map((action) => action.tool)).toEqual(approvedTools);

  const editedGoalDraft = request.editedArtifacts?.find(
    (artifact) => artifact.kind === 'goal_draft',
  );
  const editedGoalData = asRecord(editedGoalDraft?.data);
  expect(editedGoalData.title).toBe(goalAgentRun.goalDraft.title);
  expect(editedGoalData.reminders).toEqual(goalAgentRun.goalDraft.reminders);
}

function executeGoalAgentMockRun(
  mockRun: GoalAgentMockRun,
  telemetry: GoalWorkflowMockTelemetry,
) {
  telemetry.goalAgentExecuteRequestCount += 1;
  const retrySucceeded = telemetry.goalAgentExecuteRequestCount > 1;

  mockRun.executedActions = retrySucceeded
    ? [
        {
          tool: 'create_goal',
          status: 'executed',
          entityId: 'goal-e2e-1',
          message: '已创建目标。',
        },
        {
          tool: 'create_key_result',
          status: 'executed',
          entityId: 'kr-e2e-1',
          message: 'Created key result after retry.',
        },
        {
          tool: 'create_task_template',
          status: 'executed',
          entityId: 'task-template-e2e-1',
          message: 'Created task template after retry.',
        },
        {
          tool: 'create_reminder',
          status: 'executed',
          entityId: 'reminder-e2e-1',
          message: 'Created reminder after retry.',
        },
      ]
    : [
        {
          tool: 'create_goal',
          status: 'executed',
          entityId: 'goal-e2e-1',
          message: '已创建目标。',
        },
        {
          tool: 'create_key_result',
          status: 'failed',
          message: '关键结果创建失败，字段仍需修正。',
        },
        {
          tool: 'create_task_template',
          status: 'skipped',
          message: 'Skipped because key result 0 creation failed.',
        },
        {
          tool: 'create_reminder',
          status: 'executed',
          entityId: 'reminder-e2e-1',
          message: 'Created reminder "Review Agent result".',
        },
      ];
}

function createGoalAgentRunResult(
  mockRun: GoalAgentMockRun,
  status: GoalAgentMockStatus,
) {
  const now = Date.now();
  const hasExecution = status === 'completed';
  const executedCount = mockRun.executedActions.filter(
    (action) => action.status === 'executed',
  ).length;
  const skippedActions = mockRun.executedActions.filter(
    (action) => action.status === 'skipped',
  );
  const failedActions = mockRun.executedActions.filter(
    (action) => action.status === 'failed',
  );
  const executionOutcome =
    failedActions.length === 0
      ? 'success'
      : executedCount > 0 || skippedActions.length > 0
        ? 'partial'
        : 'failed';
  const artifacts = [
    {
      artifactId: `${mockRun.runId}:goal-draft`,
      kind: 'goal_draft',
      title: String(mockRun.goalDraft.title),
      data: mockRun.goalDraft,
      updatedAt: now,
    },
    {
      artifactId: `${mockRun.runId}:action-plan`,
      kind: 'action_plan',
      title: 'Goal Agent approval plan',
      data: mockRun.actionPlan,
      updatedAt: now,
    },
  ];

  if (hasExecution) {
    artifacts.push({
      artifactId: `${mockRun.runId}:execution`,
      kind: 'execution_timeline',
      title: 'Goal Agent execution result',
      data: {
        summary: {
          status: executionOutcome,
          executedCount,
          skippedCount: skippedActions.length,
          failedCount: failedActions.length,
        },
        executedActions: mockRun.executedActions,
        recovery: {
          canRetry: failedActions.length > 0 || skippedActions.length > 0,
          failedActions,
          skippedActions,
          suggestions:
            failedActions.length > 0 || skippedActions.length > 0
              ? ['Review the key result fields and retry.']
              : [],
          retryApprovedActions: mockRun.approvedActions,
        },
      },
      updatedAt: now,
    });
  }

  return {
    run: {
      runId: mockRun.runId,
      threadId: mockRun.threadId,
      conversationId: mockRun.conversationId,
      identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
      agentType: 'goal.create',
      status,
      createdAt: mockRun.createdAt,
      updatedAt: now,
    },
    state: {
      messages: [
        {
          role: 'user',
          content: 'Create a structured AI workflow goal through the Agent runtime.',
          createdAt: mockRun.createdAt,
        },
      ],
      intent: 'goal-create',
      stage:
        status === 'waiting_approval'
          ? 'approval'
          : status === 'waiting_execution'
            ? 'execution'
            : 'result',
      artifacts,
      citations: [],
      retrievedContext: [],
      pendingActions: status === 'waiting_approval' ? mockRun.pendingActions : [],
      approvedActions:
        status === 'waiting_approval' || status === 'cancelled'
          ? []
          : mockRun.approvedActions,
      executedActions: hasExecution ? mockRun.executedActions : [],
      usage: {
        promptTokens: 90,
        completionTokens: 38,
        totalTokens: 128,
      },
      errors: [],
    },
    events:
      status === 'completed'
        ? [
            ...mockRun.executedActions.map((action, index) => ({
              eventId: `${mockRun.runId}:${index + 3}`,
              runId: mockRun.runId,
              sequence: index + 3,
              type: 'tool.completed',
              createdAt: now,
              data: {
                tool: action.tool,
                status: action.status,
                durationMs: index === 0 ? 42 : 55,
              },
            })),
            {
              eventId: `${mockRun.runId}:${mockRun.executedActions.length + 3}`,
              runId: mockRun.runId,
              sequence: mockRun.executedActions.length + 3,
              type: 'run.completed',
              createdAt: now,
              data: { status: executionOutcome },
            },
          ]
        : [
            {
              eventId: `${mockRun.runId}:0`,
              runId: mockRun.runId,
              sequence: 0,
              type: 'node.completed',
              createdAt: now,
              data: { node: 'goal_draft', durationMs: 68 },
            },
            {
              eventId: `${mockRun.runId}:1`,
              runId: mockRun.runId,
              sequence: 1,
              type:
                status === 'waiting_approval'
                  ? 'approval.required'
                  : 'execution.required',
              createdAt: now,
              data: { status },
            },
          ],
    interrupts:
      status === 'waiting_approval'
        ? [
            {
              runId: mockRun.runId,
              type: 'approval.required',
              pendingActions: mockRun.pendingActions,
            },
          ]
        : status === 'waiting_execution'
          ? [
              {
                runId: mockRun.runId,
                type: 'execution.required',
                pendingActions: mockRun.approvedActions,
              },
            ]
          : [],
  };
}

async function installGoalWorkflowMocks(
  page: Page,
  options: GoalWorkflowMockOptions = {},
): Promise<GoalWorkflowMockTelemetry> {
  const conversationId = e2eConversationId;
  let conversationName = 'Goal Workflow Session';
  let generateGoalStep = options.seedConversation ? 1 : 0;
  const telemetry: GoalWorkflowMockTelemetry = {
    goalAgentStartCount: 0,
    goalAgentApprovalResumeCount: 0,
    goalAgentRetryResumeCount: 0,
    goalAgentCancelCount: 0,
    goalAgentExecuteRequestCount: 0,
    goalAgentCompletionResumeCount: 0,
  };
  const goalAgentRunsByRunId = new Map<string, GoalAgentMockRun>();
  const noteDraftsByRunId = new Map<
    string,
    {
      title: string;
      markdown: string;
      topic: string;
      targetSubpath: string;
      tags: string[];
      source: string;
      pendingAction: Record<string, unknown>;
    }
  >();
  const repository = createMockRepository({
    id: 'repository-e2e-1',
    name: 'E2E Agent Workspace Repository',
    status: 'Active',
    isActive: true,
    isArchived: false,
    isDeleted: false,
  });
  const workspaceResources = new Map(
    [
      createMockResource({
        id: 'resource-grounding-1',
        repositoryId: repository.id,
        name: 'grounding-policy.md',
        path: 'notes/ai/grounding-policy.md',
        type: 'File',
        mimeType: 'text/markdown',
        extension: '.md',
        status: 'Active',
        isActive: true,
        isArchived: false,
        isDeleted: false,
        content:
          '# Memoflow grounding policy\n\nKnowledge answers must cite repository evidence before sounding certain.',
      }),
    ].map((resource) => [resource.id, resource] as const),
  );
  const editorWorkspace = {
    id: repository.id,
    name: repository.name,
    projectPath: repository.id,
  };
  let editorSessionCreated = false;
  const editorTabs: Array<Record<string, unknown>> = [];

  function buildEditorSession() {
    return {
      id: 'editor-session-e2e-1',
      name: 'Main',
      isActive: true,
      activeGroupIndex: 0,
      groups: [
        {
          id: 'editor-group-e2e-1',
          sessionId: 'editor-session-e2e-1',
          workspaceId: repository.id,
          identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
          groupIndex: 0,
          name: 'Group 1',
          activeTabIndex: Math.max(editorTabs.length - 1, 0),
          tabs: [...editorTabs],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          formattedCreatedAt: '2026-06-10 00:00:00',
          formattedUpdatedAt: '2026-06-10 00:00:00',
        },
      ],
    };
  }

  await page.route('**/api/v1/settings', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    await fulfillJson(
      route,
      createMockUserSetting({
        preferences: {
          appearance: { theme: 'light' },
          locale: {
            language: 'en-US',
            timezone: 'Asia/Shanghai',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '24H',
            currency: 'CNY',
            weekStartsOn: 1,
          },
          workflow: {
            autoSave: true,
            autoSaveInterval: 30000,
            confirmBeforeDelete: true,
            defaultTaskView: 'LIST',
            defaultGoalView: 'LIST',
            defaultScheduleView: 'WEEK',
          },
          privacy: {
            profileVisibility: 'PRIVATE',
            showOnlineStatus: false,
            shareUsageData: false,
            allowSearchByEmail: false,
            allowSearchByPhone: false,
          },
          notification: {
            email: false,
            push: false,
            inApp: true,
            sound: false,
            useCustomNotification: false,
          },
          editor: {
            theme: 'default',
            fontSize: 14,
            tabSize: 2,
            wordWrap: true,
            lineNumbers: true,
            minimap: false,
          },
          shortcuts: {
            enabled: true,
            custom: {},
          },
          experimental: {
            enabled: false,
            features: [],
          },
          ui: {
            startPage: 'dashboard',
            sidebarCollapsed: false,
          },
          ai: {
            knowledgeNoteSubpath: 'notes/ai',
          },
        },
      }),
    );
  });

  await page.route('**/api/v1/repositories/current', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    await fulfillJson(route, repository);
  });

  await page.route('**/api/v1/repositories/*/folders', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    await fulfillJson(route, {
      repositoryId: repository.id,
      tree: [],
    });
  });

  await page.route('**/api/v1/repositories/*/resources', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    await fulfillJson(route, [...workspaceResources.values()]);
  });

  await page.route('**/api/v1/resources/*', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    const resourceId = route.request().url().split('/').at(-1) ?? '';
    await fulfillJson(
      route,
      workspaceResources.get(resourceId) ??
        createMockResource({
          id: resourceId,
          repositoryId: repository.id,
          name: 'opened-resource.md',
          path: `notes/ai/${resourceId}.md`,
          type: 'File',
          mimeType: 'text/markdown',
          extension: '.md',
          status: 'Active',
          isActive: true,
          isArchived: false,
          isDeleted: false,
        }),
    );
  });

  await page.route('**/api/v1/goals/archive-expired', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    await fulfillJson(route, { archivedCount: 0 });
  });

  await page.route('**/api/v1/goals?*', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    const goal = createMockGoal({
      id: 'IGoalId_e2e-recent-goal-1',
      name: 'Recent AI workflow goal',
      status: 'Active',
      updatedAt: Date.now(),
      deletedAt: null,
    });
    await fulfillJson(route, {
      goals: [goal],
      data: [goal],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 1,
        hasMore: false,
        totalPages: 1,
      },
    });
  });

  await page.route('**/api/v1/repositories/*/bookmarks', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    await fulfillJson(route, []);
  });

  await page.route('**/api/v1/editor/workspaces', async (route) => {
    if (route.request().method() === 'GET') {
      await fulfillJson(route, [editorWorkspace]);
      return;
    }

    if (route.request().method() === 'POST') {
      await fulfillJson(route, editorWorkspace);
      return;
    }

    await route.continue();
  });

  await page.route('**/api/v1/editor/workspaces/*', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (route.request().method() === 'GET' && path.endsWith(`/editor/workspaces/${repository.id}`)) {
      await fulfillJson(route, editorWorkspace);
      return;
    }

    if (
      route.request().method() === 'GET' &&
      path.endsWith(`/editor/workspaces/${repository.id}/sessions`)
    ) {
      await fulfillJson(route, editorSessionCreated ? [buildEditorSession()] : []);
      return;
    }

    await route.continue();
  });

  await page.route('**/api/v1/editor/sessions', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    editorSessionCreated = true;
    await fulfillJson(route, buildEditorSession());
  });

  await page.route('**/api/v1/editor/tabs', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    const request = route.request().postDataJSON() as {
      resourceId?: string;
      title?: string;
    };
    const tab = {
      id: `editor-tab-${editorTabs.length + 1}`,
      sessionId: 'editor-session-e2e-1',
      groupId: 'editor-group-e2e-1',
      workspaceId: repository.id,
      identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
      resourceId: request.resourceId ?? 'resource-grounding-1',
      tabIndex: editorTabs.length,
      tabType: 'Resource',
      name: request.title ?? 'grounding-policy.md',
      viewState: {},
      isPinned: false,
      isActive: true,
      isDirty: false,
      lastAccessedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      formattedLastAccessed: null,
      formattedCreatedAt: '2026-06-10 00:00:00',
      formattedUpdatedAt: '2026-06-10 00:00:00',
    };
    editorSessionCreated = true;
    editorTabs.push(tab);
    await fulfillJson(route, tab);
  });

  await page.route('**/api/v1/editor/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (method === 'GET' && path.endsWith('/editor/workspaces')) {
      await fulfillJson(route, [editorWorkspace]);
      return;
    }

    if (method === 'POST' && path.endsWith('/editor/workspaces')) {
      await fulfillJson(route, editorWorkspace);
      return;
    }

    if (method === 'GET' && path.endsWith(`/editor/workspaces/${repository.id}`)) {
      await fulfillJson(route, editorWorkspace);
      return;
    }

    if (method === 'GET' && path.endsWith(`/editor/workspaces/${repository.id}/sessions`)) {
      await fulfillJson(route, editorSessionCreated ? [buildEditorSession()] : []);
      return;
    }

    if (method === 'POST' && path.endsWith('/editor/sessions')) {
      editorSessionCreated = true;
      await fulfillJson(route, buildEditorSession());
      return;
    }

    if (method === 'POST' && path.endsWith('/editor/tabs')) {
      const request = route.request().postDataJSON() as {
        resourceId?: string;
        title?: string;
      };
      const tab = {
        id: `editor-tab-${editorTabs.length + 1}`,
        sessionId: 'editor-session-e2e-1',
        groupId: 'editor-group-e2e-1',
        workspaceId: repository.id,
        identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
        resourceId: request.resourceId ?? 'resource-grounding-1',
        tabIndex: editorTabs.length,
        tabType: 'Resource',
        name: request.title ?? 'grounding-policy.md',
        viewState: {},
        isPinned: false,
        isActive: true,
        isDirty: false,
        lastAccessedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        formattedLastAccessed: null,
        formattedCreatedAt: '2026-06-10 00:00:00',
        formattedUpdatedAt: '2026-06-10 00:00:00',
      };
      editorSessionCreated = true;
      editorTabs.push(tab);
      await fulfillJson(route, tab);
      return;
    }

    if (method === 'GET' && path.includes('/editor/content/')) {
      const resourceId = path.split('/').at(-1) ?? '';
      const resource = workspaceResources.get(resourceId) ?? null;
      await fulfillJson(route, {
        resourceId,
        name: resource?.name ?? 'opened-resource.md',
        content: resource?.content ?? null,
      });
      return;
    }

    if (
      method === 'POST' &&
      (path.includes('/activate') || path.includes('/auto-save'))
    ) {
      await fulfillJson(route, null);
      return;
    }

    if (method === 'PUT' && (path.includes('/editor/tabs/') || path.includes('/editor/content/'))) {
      await fulfillJson(route, null);
      return;
    }

    if (method === 'DELETE' && path.includes('/editor/workspaces/')) {
      await fulfillJson(route, null);
      return;
    }

    await route.continue();
  });

  await page.route('**/api/v1/ai/providers', async (route) => {
    await fulfillJson(route, {
      data: [
        {
          id: 'provider-e2e-openai',
          identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
          name: 'E2E OpenAI',
          providerType: 'openai_compatible',
          baseUrl: 'https://api.openai.com/v1',
          apiKeyMasked: 'sk-****e2e',
          defaultModel: 'gpt-4.1-mini',
          availableModels: [{ id: 'gpt-4.1-mini', name: 'gpt-4.1-mini' }],
          isActive: true,
          isDefault: true,
          priority: 1,
          version: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          deletedAt: null,
        },
      ],
    });
  });

  await page.route('**/api/v1/ai/chat/conversations?*', async (route) => {
    const conversations =
      generateGoalStep > 0
        ? [{ id: conversationId, name: conversationName, title: conversationName }]
        : [];
    await fulfillJson(route, {
      data: conversations,
      total: conversations.length,
      page: 1,
      pageSize: 24,
    });
  });

  await page.route('**/api/v1/ai/chat/conversations', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    const body = route.request().postDataJSON() as { name?: string };
    conversationName = body.name || conversationName;

    await fulfillJson(route, {
      id: conversationId,
      identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
      name: conversationName,
      status: 'Active',
      messageCount: 0,
      lastMessageAt: null,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      messages: null,
    });
  });

  await page.route(`**/api/v1/ai/chat/conversations/${conversationId}`, async (route) => {
    const method = route.request().method();
    if (method === 'PATCH') {
      const body = route.request().postDataJSON() as { name?: string };
      conversationName = body.name || conversationName;
      await fulfillJson(route, {
        id: conversationId,
        identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
        name: conversationName,
        status: 'Active',
        messageCount: 2,
        lastMessageAt: Date.now(),
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
        messages: null,
      });
      return;
    }

    if (method === 'GET') {
      await fulfillJson(route, {
        id: conversationId,
        identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
        name: conversationName,
        status: 'Active',
        messageCount: 2,
        lastMessageAt: Date.now(),
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
        messages: null,
      });
      return;
    }

    await route.continue();
  });

  await page.route('**/api/v1/ai/chat/messages?conversationId=*&page=*&pageSize=*', async (route) => {
    await fulfillJson(route, {
      data: [],
      total: 0,
      page: 1,
      pageSize: 80,
    });
  });

  await page.route('**/api/v1/ai/chat/messages/sse', async (route) => {
    const request = route.request().postDataJSON() as { content?: string };
    const userContent = request.content ?? '';
    const payload = [
      'event: message',
      'data: {"role":"assistant","content":"先把目标拆清楚，我会帮你补全 workflow。"}',
      '',
      'event: done',
      `data: ${JSON.stringify({
        userMessage: {
          id: 'msg-user-1',
          conversationId,
          role: 'user',
          content: userContent,
          createdAt: Date.now(),
        },
        assistantMessage: {
          id: 'msg-assistant-1',
          conversationId,
          role: 'assistant',
          content: '先把目标拆清楚，我会帮你补全 workflow。',
          createdAt: Date.now(),
        },
        tokenUsage: {
          promptTokens: 120,
          completionTokens: 36,
          totalTokens: 156,
        },
        providerId: 'provider-e2e-openai',
        processingTimeMs: 120,
      })}`,
      '',
    ].join('\n');

    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: payload,
      headers: {
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      },
    });
  });

  await page.route('**/api/v1/ai/knowledge/query', async (route) => {
    const request = route.request().postDataJSON() as {
      query?: string;
      maxResources?: number;
      providerId?: string;
    };

    expect(request.maxResources).toBe(8);
    expect(request.providerId).toBe('provider-e2e-openai');

    const query = request.query ?? '';

    if (query.includes('unindexed archive migration plan')) {
      await fulfillJson(route, {
        answer:
          'I do not have enough repository evidence to answer this from your indexed knowledge base.',
        citations: [],
        providerId: 'provider-e2e-openai',
        tokenUsage: {
          promptTokens: 48,
          completionTokens: 18,
          totalTokens: 66,
        },
        processingTimeMs: 54,
        matchedResourceCount: 0,
      });
      return;
    }

    expect(query).toContain('knowledge answers stay grounded');

    await fulfillJson(route, {
      answer: 'Grounded answers cite repository excerpts and show where each claim came from.',
      citations: [
        {
          resourceId: 'resource-grounding-1',
          resourcePath: 'notes/ai/grounding-policy.md',
          title: 'Memoflow grounding policy',
          chunkIndex: 0,
          excerpt: 'Knowledge answers must cite repository evidence before sounding certain.',
          score: 0.94,
        },
      ],
      providerId: 'provider-e2e-openai',
      tokenUsage: {
        promptTokens: 64,
        completionTokens: 24,
        totalTokens: 88,
      },
      processingTimeMs: 75,
      matchedResourceCount: 1,
    });
  });

  await page.route(
    '**/api/v1/ai/agents/runs/run-e2e-restored-approval',
    async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }

      await fulfillJson(route, createRuntimeRestoredApprovalRunResult());
    },
  );

  await page.route('**/api/v1/ai/agents/runs?*', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    await fulfillJson(route, []);
  });

  await page.route('**/api/v1/ai/agents/runs', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    const request = route.request().postDataJSON() as {
      runId?: string;
      threadId?: string;
      conversationId?: string | null;
      agentType?: string;
      input?: {
        idea?: string;
        question?: string;
        maxResources?: number;
        topic?: string;
        title?: string;
        source?: string;
        providerId?: string;
        model?: string;
      };
    };

    if (request.agentType === 'goal.create') {
      telemetry.goalAgentStartCount += 1;
      expect(request.input?.idea).toMatch(/Agent runtime/i);
      expect(request.input?.providerId).toBe('provider-e2e-openai');
      expect(request.input?.model).toBe('gpt-4.1-mini');

      const mockRun = createGoalAgentMockRun(request);
      goalAgentRunsByRunId.set(mockRun.runId, mockRun);
      await fulfillJson(route, createGoalAgentRunResult(mockRun, 'waiting_approval'));
      return;
    }

    if (request.agentType === 'knowledge.qa') {
      expect(request.input?.providerId).toBe('provider-e2e-openai');
      expect(request.input?.question).toBeTruthy();

      const question = request.input?.question ?? '';
      const insufficientEvidence = question.includes('unindexed archive migration plan');
      const citations = insufficientEvidence
        ? []
        : [
            {
              resourceId: 'resource-grounding-1',
              resourcePath: 'notes/ai/grounding-policy.md',
              title: 'Memoflow grounding policy',
              chunkIndex: 0,
              excerpt:
                'Knowledge answers must cite repository evidence before sounding certain.',
              score: 0.94,
            },
          ];
      const answer = insufficientEvidence
        ? 'I do not have enough repository evidence to answer this from your indexed knowledge base.'
        : 'Grounded answers cite repository excerpts and show where each claim came from.';
      const runId = request.runId ?? 'knowledge-qa-run-e2e-1';
      const threadId = request.threadId ?? 'knowledge-qa-thread-e2e-1';
      const now = Date.now();

      await fulfillJson(route, {
        run: {
          runId,
          threadId,
          conversationId: request.conversationId ?? conversationId,
          identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
          agentType: 'knowledge.qa',
          status: 'completed',
          createdAt: now,
          updatedAt: now,
        },
        state: {
          messages: [],
          intent: 'knowledge-qa',
          stage: 'result',
          artifacts: [
            {
              artifactId: `${runId}:answer`,
              kind: 'knowledge_answer',
              title: question,
              data: {
                question,
                answer,
                evidenceStatus: insufficientEvidence ? 'insufficient' : 'grounded',
                matchedResourceCount: citations.length,
                providerId: 'provider-e2e-openai',
                processingTimeMs: insufficientEvidence ? 54 : 75,
              },
              updatedAt: now,
            },
          ],
          citations,
          retrievedContext: [],
          pendingActions: [],
          approvedActions: [],
          executedActions: [],
          usage: {
            promptTokens: insufficientEvidence ? 48 : 64,
            completionTokens: insufficientEvidence ? 18 : 24,
            totalTokens: insufficientEvidence ? 66 : 88,
          },
          errors: [],
        },
        events: [
          {
            eventId: `${runId}:0`,
            runId,
            sequence: 0,
            type: 'node.completed',
            createdAt: now,
            data: {
              node: 'search_knowledge',
              durationMs: insufficientEvidence ? 54 : 75,
            },
          },
        ],
        interrupts: [],
      });
      return;
    }

    if (request.agentType !== 'knowledge.generate') {
      await route.continue();
      return;
    }

    expect(request.input?.providerId).toBe('provider-e2e-openai');
    expect(request.input?.model).toBe('gpt-4.1-mini');

    const source = request.input?.source ?? '';
    const isConversationDraft = source.includes(
      'reusable knowledge note about agent checkpoints',
    );
    if (!isConversationDraft) {
      expect(request.input?.title).toContain(
        'How should knowledge answers stay grounded in citations?',
      );
      expect(source).toContain('Memoflow grounding policy');
    } else {
      expect(source).toContain(
        'User: Turn this planning conversation into a reusable knowledge note about agent checkpoints.',
      );
    }

    const draftTitle = isConversationDraft
      ? 'Conversation Agent Checkpoints'
      : 'Grounded Knowledge Answers';
    const draftMarkdown = isConversationDraft
      ? [
          '# Conversation Agent Checkpoints',
          '',
          'Drafted from an ordinary workspace conversation about checkpoint recovery.',
        ].join('\n')
      : '# Grounded Knowledge Answers\n\nGrounded answers cite repository excerpts and show where each claim came from.';
    const draftTags = isConversationDraft ? ['ai', 'agent-runtime'] : ['ai', 'knowledge'];
    const runId = request.runId ?? 'note-run-e2e-1';
    const threadId = request.threadId ?? 'note-thread-e2e-1';
    const draftArtifactId = `${runId}:knowledge-note-draft`;
    const pendingAction = {
      tool: 'create_knowledge_note',
      payload: {
        title: draftTitle,
        topic: request.input?.topic ?? 'Grounded knowledge answers',
        contentMarkdown: draftMarkdown,
        contentArtifactId: draftArtifactId,
        targetSubpath: 'notes/ai',
        tags: draftTags,
        providerId: 'provider-e2e-openai',
        model: 'gpt-4.1-mini',
      },
      rationale: 'Persist the approved knowledge note draft.',
      index: 0,
      dependsOn: [],
    };
    noteDraftsByRunId.set(runId, {
      title: draftTitle,
      markdown: draftMarkdown,
      topic: request.input?.topic ?? 'Grounded knowledge answers',
      targetSubpath: 'notes/ai',
      tags: draftTags,
      source,
      pendingAction,
    });

    const now = Date.now();
    await fulfillJson(route, {
      run: {
        runId,
        threadId,
        conversationId: request.conversationId ?? conversationId,
        identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
        agentType: 'knowledge.generate',
        status: 'waiting_approval',
        createdAt: now,
        updatedAt: now,
      },
      state: {
        messages: [],
        intent: 'knowledge-generate',
        stage: 'approval',
        artifacts: [
          {
            artifactId: draftArtifactId,
            kind: 'knowledge_note_draft',
            title: draftTitle,
            data: {
              title: draftTitle,
              topic: request.input?.topic ?? 'Grounded knowledge answers',
              markdown: draftMarkdown,
              targetSubpath: 'notes/ai',
              tags: draftTags,
              duplicateRisk: 'low',
              indexStatus: 'draft',
              source,
            },
            updatedAt: now,
          },
        ],
        citations: [],
        retrievedContext: [],
        pendingActions: [pendingAction],
        approvedActions: [],
        executedActions: [],
        usage: {},
        errors: [],
      },
      events: [
        {
          eventId: `${runId}:0`,
          runId,
          sequence: 0,
          type: 'artifact.updated',
          createdAt: now,
          data: { kind: 'knowledge_note_draft' },
        },
        {
          eventId: `${runId}:1`,
          runId,
          sequence: 1,
          type: 'approval.required',
          createdAt: now,
          data: { status: 'waiting_approval' },
        },
      ],
      interrupts: [
        {
          runId,
          type: 'approval.required',
          pendingActions: [pendingAction],
        },
      ],
    });
  });

  await page.route('**/api/v1/ai/agents/runs/*/resume', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    const url = new URL(route.request().url());
    const runId = decodeURIComponent(url.pathname.split('/').at(-2) ?? '');
    const goalAgentRun = goalAgentRunsByRunId.get(runId);
    if (goalAgentRun) {
      const request = route.request().postDataJSON() as {
        userDecision?: string;
        approvedActions?: Array<Record<string, unknown>>;
        executedActions?: Array<Record<string, unknown>>;
        editedArtifacts?: Array<Record<string, unknown>>;
        approvedPlan?: {
          actions?: Array<Record<string, unknown>>;
        };
      };

      if (request.userDecision === 'cancel') {
        telemetry.goalAgentCancelCount += 1;
        goalAgentRun.approvedActions = [];
        goalAgentRun.executedActions = [];
        await fulfillJson(route, createGoalAgentRunResult(goalAgentRun, 'cancelled'));
        return;
      }

      expect(request.userDecision).toBe('confirm');

      if (request.executedActions?.length) {
        telemetry.goalAgentCompletionResumeCount += 1;
        goalAgentRun.executedActions = request.executedActions;
        await fulfillJson(route, createGoalAgentRunResult(goalAgentRun, 'completed'));
        return;
      }

      if (!request.approvedActions?.length) {
        telemetry.goalAgentRetryResumeCount += 1;
        expect(goalAgentRun.approvedActions.length).toBeGreaterThan(0);
        executeGoalAgentMockRun(goalAgentRun, telemetry);
        telemetry.goalAgentCompletionResumeCount += 1;
        await fulfillJson(route, createGoalAgentRunResult(goalAgentRun, 'completed'));
        return;
      }

      telemetry.goalAgentApprovalResumeCount += 1;
      expectGoalAgentApprovalPayload(request, goalAgentRun);
      goalAgentRun.approvedActions = request.approvedActions ?? [];
      goalAgentRun.actionPlan = {
        ...goalAgentRun.actionPlan,
        actions: goalAgentRun.approvedActions,
      };
      executeGoalAgentMockRun(goalAgentRun, telemetry);
      telemetry.goalAgentCompletionResumeCount += 1;
      await fulfillJson(route, createGoalAgentRunResult(goalAgentRun, 'completed'));
      return;
    }

    const draft = noteDraftsByRunId.get(runId);
    if (!draft) {
      await route.continue();
      return;
    }

    const request = route.request().postDataJSON() as {
      userDecision?: string;
      approvedActions?: Array<Record<string, unknown>>;
    };
    expect(request.userDecision).toBe('confirm');
    expect(request.approvedActions).toEqual([draft.pendingAction]);

    const resourceName = `${draft.title}.md`;
    const resolvedPath = `${draft.targetSubpath}/${resourceName}`;
    const now = Date.now();
    workspaceResources.set(
      'resource-note-e2e-1',
      createMockResource({
        id: 'resource-note-e2e-1',
        repositoryId: repository.id,
        name: resourceName,
        path: resolvedPath,
        type: 'File',
        mimeType: 'text/markdown',
        extension: '.md',
        status: 'Active',
        isActive: true,
        isArchived: false,
        isDeleted: false,
        content: draft.markdown,
      }),
    );
    const executedAction = {
      tool: 'create_knowledge_note',
      status: 'executed',
      entityId: 'resource-note-e2e-1',
      message: `Saved knowledge note to ${resolvedPath}.`,
      data: {
        resource: {
          id: 'resource-note-e2e-1',
          name: resourceName,
          content: draft.markdown,
        },
        resolvedPath,
        indexStatus: 'indexed',
      },
    };

    await fulfillJson(route, {
      run: {
        runId,
        threadId: runId.replace(/^run-/, 'thread-'),
        conversationId,
        identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
        agentType: 'knowledge.generate',
        status: 'completed',
        createdAt: now,
        updatedAt: now,
      },
      state: {
        messages: [],
        intent: 'knowledge-generate',
        stage: 'result',
        artifacts: [
          {
            artifactId: `${runId}:knowledge-note-draft`,
            kind: 'knowledge_note_draft',
            title: draft.title,
            data: {
              title: draft.title,
              topic: draft.topic,
              markdown: draft.markdown,
              targetSubpath: draft.targetSubpath,
              tags: draft.tags,
              duplicateRisk: 'low',
              indexStatus: 'draft',
              source: draft.source,
            },
            updatedAt: now,
          },
          {
            artifactId: `${runId}:knowledge-note-execution`,
            kind: 'execution_timeline',
            title: 'Knowledge note save result',
            data: {
              summary: {
                status: 'success',
                executedCount: 1,
                failedCount: 0,
              },
              executedActions: [executedAction],
              recovery: {
                canRetry: false,
                failedActions: [],
                skippedActions: [],
                suggestions: [],
                retryApprovedActions: [draft.pendingAction],
              },
            },
            updatedAt: now,
          },
        ],
        citations: [],
        retrievedContext: [],
        pendingActions: [],
        approvedActions: [draft.pendingAction],
        executedActions: [executedAction],
        usage: {},
        errors: [],
      },
      events: [
        {
          eventId: `${runId}:2`,
          runId,
          sequence: 2,
          type: 'tool.completed',
          createdAt: now,
          data: { tool: 'create_knowledge_note', status: 'executed' },
        },
      ],
      interrupts: [],
    });
  });

  await page.route('**/api/v1/ai/knowledge-notes', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    throw new Error('Knowledge note E2E should save through Agent resume.');

    const request = route.request().postDataJSON() as {
      topic?: string;
      title?: string;
      contentMarkdown?: string;
      targetSubpath?: string;
      providerId?: string;
      model?: string;
    };

    const isConversationNote = request.title === 'Conversation Agent Checkpoints';
    if (isConversationNote) {
      expect(request.contentMarkdown).toContain('# Conversation Agent Checkpoints');
    } else {
      expect(request.title).toBe('Grounded Knowledge Answers');
      expect(request.contentMarkdown).toContain('# Grounded Knowledge Answers');
    }
    expect(request.targetSubpath).toBe('notes/ai');
    expect(request.providerId).toBe('provider-e2e-openai');
    expect(request.model).toBe('gpt-4.1-mini');

    const resourceName = isConversationNote
      ? 'Conversation Agent Checkpoints.md'
      : 'Grounded Knowledge Answers.md';
    const resolvedPath = `notes/ai/${resourceName}`;

    const now = Date.now();
    await fulfillJson(route, {
      resource: {
        id: 'resource-note-e2e-1',
        repositoryId: 'repository-e2e-1',
        folderId: null,
        name: resourceName,
        type: 'Markdown',
        mimeType: 'text/markdown',
        path: resolvedPath,
        size: 124,
        content: request.contentMarkdown,
        status: 'Active',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        version: 1,
      },
      resolvedPath,
      indexStatus: 'indexed',
      tokenUsage: {
        promptTokens: 72,
        completionTokens: 31,
        totalTokens: 103,
      },
      providerId: 'provider-e2e-openai',
      processingTimeMs: 82,
      generatedAt: now,
    });
  });

  await page.route('**/api/v1/ai/generate/goal', async (route) => {
    const request = route.request().postDataJSON() as {
      command?: 'draft' | 'prepare' | 'execute';
      clarificationAnswers?: string[];
      approvedPlan?: {
        goal?: {
          title?: string;
          description?: string;
          category?: string;
          importance?: string;
          motivation?: string;
          feasibilityAnalysis?: string;
          suggestedStartDate?: number;
          suggestedEndDate?: number;
          tags?: string[];
        };
        keyResults?: Array<Record<string, unknown>>;
        taskTemplates?: Array<Record<string, unknown>>;
      };
      approvedActions?: Array<{ tool?: string }>;
    };

    if ((request.command ?? 'draft') === 'draft' && !request.clarificationAnswers?.length) {
      generateGoalStep = 1;
      await fulfillJson(route, {
        state: 'clarification',
        clarification: {
          needsClarification: true,
          rationale: '还需要补充执行重点与节奏。',
          questions: [
            {
              question: '你最想先改善哪一段 workflow？',
              context: '例如澄清、规划、执行或复盘。',
            },
            {
              question: '你希望这套 workflow 以什么节奏运行？',
              context: '例如每日执行、每周复盘。',
            },
          ],
        },
        tokenUsage: { promptTokens: 80, completionTokens: 22, totalTokens: 102 },
        providerId: 'provider-e2e-openai',
        processingTimeMs: 90,
        generatedAt: Date.now(),
        providerUsed: 'E2E OpenAI',
        modelUsed: 'gpt-4.1-mini',
      });
      return;
    }

    if ((request.command ?? 'draft') === 'draft' && request.clarificationAnswers?.length) {
      generateGoalStep = 2;
      conversationName = '建立稳定的 AI agent 工作流';
      await fulfillJson(route, {
        state: 'draft',
        goal: {
          title: '建立稳定的 AI agent 工作流',
          description: '围绕澄清、规划、执行和复盘，建立可重复的 AI goal workflow。',
          category: 'learning',
          importance: 'Important',
          motivation: '把 AI 想法稳定转成可执行目标。',
          feasibilityAnalysis: '聚焦日常执行和每周复盘，范围可控。',
          suggestedStartDate: Date.now(),
          suggestedEndDate: Date.now() + 1000 * 60 * 60 * 24 * 60,
          tags: ['ai', 'workflow'],
        },
        keyResults: [
          {
            title: '每周复盘 workflow 结果',
            description: '至少完成 8 次每周复盘。',
            valueType: 'Incremental',
            calculationMethod: 'Sum',
            startValue: 0,
            currentValue: 0,
            targetValue: 8,
            unit: '次',
            weight: 3,
          },
        ],
        tokenUsage: { promptTokens: 140, completionTokens: 60, totalTokens: 200 },
        providerId: 'provider-e2e-openai',
        processingTimeMs: 110,
        generatedAt: Date.now(),
        providerUsed: 'E2E OpenAI',
        modelUsed: 'gpt-4.1-mini',
      });
      return;
    }

    if (request.command === 'prepare') {
      generateGoalStep = 3;
      await fulfillJson(route, {
        state: 'confirm',
        summary: '先创建目标与关键结果，再保留失败项供后续补齐。',
        plan: {
          goal: {
            title: '建立稳定的 AI agent 工作流',
            description: '围绕澄清、规划、执行和复盘，建立可重复的 AI goal workflow。',
            category: 'learning',
            importance: 'Important',
            motivation: '把 AI 想法稳定转成可执行目标。',
            feasibilityAnalysis: '聚焦日常执行和每周复盘，范围可控。',
            suggestedStartDate: Date.now(),
            suggestedEndDate: Date.now() + 1000 * 60 * 60 * 24 * 60,
            tags: ['ai', 'workflow'],
          },
          keyResults: [
            {
              title: '每周复盘 workflow 结果',
              description: '至少完成 8 次每周复盘。',
              valueType: 'Incremental',
              calculationMethod: 'Sum',
              startValue: 0,
              currentValue: 0,
              targetValue: 8,
              unit: '次',
              weight: 3,
            },
          ],
          taskTemplates: [
            {
              name: '每周 workflow 复盘',
              description: '记录执行质量与下周修正点。',
              importance: 'Moderate',
              cadence: 'weekly',
            },
          ],
        },
        actions: [
          { tool: 'create_goal', index: 0, rationale: '先创建目标主记录。' },
          { tool: 'create_key_result', index: 1, rationale: '补上可量化 KR。' },
        ],
        tokenUsage: { promptTokens: 120, completionTokens: 48, totalTokens: 168 },
        providerId: 'provider-e2e-openai',
        processingTimeMs: 125,
        generatedAt: Date.now(),
        providerUsed: 'E2E OpenAI',
        modelUsed: 'gpt-4.1-mini',
      });
      return;
    }

    if (request.command === 'execute') {
      generateGoalStep = 4;
      const isGoalAgentExecution =
        request.approvedPlan?.goal?.title === 'Agent-created AI workflow';
      let goalAgentExecutionAttempt = 0;

      if (isGoalAgentExecution) {
        telemetry.goalAgentExecuteRequestCount += 1;
        goalAgentExecutionAttempt = telemetry.goalAgentExecuteRequestCount;
        expect(request.approvedActions?.map((action) => action.tool)).toEqual([
          'create_goal',
          'create_key_result',
          'create_task_template',
          'create_reminder',
        ]);
      }
      const retrySucceeded = isGoalAgentExecution && goalAgentExecutionAttempt > 1;
      const executedActions = retrySucceeded
        ? [
            {
              tool: 'create_goal',
              status: 'executed',
              entityId: 'goal-e2e-1',
              message: '已创建目标。',
            },
            {
              tool: 'create_key_result',
              status: 'executed',
              entityId: 'kr-e2e-1',
              message: 'Created key result after retry.',
            },
            {
              tool: 'create_task_template',
              status: 'executed',
              entityId: 'task-template-e2e-1',
              message: 'Created task template after retry.',
            },
            {
              tool: 'create_reminder',
              status: 'executed',
              entityId: 'reminder-e2e-1',
              message: 'Created reminder after retry.',
            },
          ]
        : [
            {
              tool: 'create_goal',
              status: 'executed',
              entityId: 'goal-e2e-1',
              message: '已创建目标。',
            },
            {
              tool: 'create_key_result',
              status: 'failed',
              message: '关键结果创建失败，字段仍需修正。',
            },
            {
              tool: 'create_task_template',
              status: 'skipped',
              message: 'Skipped because key result 0 creation failed.',
            },
            {
              tool: 'create_reminder',
              status: 'executed',
              entityId: 'reminder-e2e-1',
              message: 'Created reminder "Review Agent result".',
            },
          ];

      await fulfillJson(route, {
        state: 'result',
        summary: retrySucceeded
          ? '目标和关键结果已创建。'
          : '目标已创建，关键结果暂未完全写入。',
        plan: {
          goal: {
            title: request.approvedPlan?.goal?.title ?? '建立稳定的 AI agent 工作流',
            description:
              request.approvedPlan?.goal?.description ??
              '围绕澄清、规划、执行和复盘，建立可重复的 AI goal workflow。',
            category: request.approvedPlan?.goal?.category ?? 'learning',
            importance: request.approvedPlan?.goal?.importance ?? 'Important',
            motivation:
              request.approvedPlan?.goal?.motivation ??
              '把 AI 想法稳定转成可执行目标。',
            feasibilityAnalysis:
              request.approvedPlan?.goal?.feasibilityAnalysis ??
              '聚焦日常执行和每周复盘，范围可控。',
            suggestedStartDate: request.approvedPlan?.goal?.suggestedStartDate ?? Date.now(),
            suggestedEndDate:
              request.approvedPlan?.goal?.suggestedEndDate ??
              Date.now() + 1000 * 60 * 60 * 24 * 60,
            tags: request.approvedPlan?.goal?.tags ?? ['ai', 'workflow'],
          },
          keyResults: request.approvedPlan?.keyResults ?? [
            {
              title: '每周复盘 workflow 结果',
              description: '至少完成 8 次每周复盘。',
              valueType: 'Incremental',
              calculationMethod: 'Sum',
              startValue: 0,
              currentValue: 0,
              targetValue: 8,
              unit: '次',
              weight: 3,
            },
          ],
          taskTemplates: request.approvedPlan?.taskTemplates ?? [
            {
              name: '每周 workflow 复盘',
              description: '记录执行质量与下周修正点。',
              importance: 'Moderate',
              cadence: 'weekly',
            },
          ],
        },
        actions: [
          { tool: 'create_goal', index: 0, rationale: '先创建目标主记录。' },
          { tool: 'create_key_result', index: 0, rationale: '补上可量化 KR。' },
          {
            tool: 'create_task_template',
            index: 0,
            rationale: '创建支撑 KR 的复盘任务模板。',
          },
          {
            tool: 'create_reminder',
            index: 0,
            rationale: '创建复盘提醒。',
          },
        ],
        executedActions,
        executionSummary: {
          status: retrySucceeded ? 'success' : 'partial',
          executedCount: retrySucceeded ? 4 : 2,
          skippedCount: retrySucceeded ? 0 : 1,
          failedCount: retrySucceeded ? 0 : 1,
        },
        recovery: {
          canRetry: !retrySucceeded,
          failedActions: retrySucceeded
            ? []
            : [
                {
                  tool: 'create_key_result',
                  status: 'failed',
                  message: '关键结果创建失败，字段仍需修正。',
                },
              ],
          suggestions: retrySucceeded ? [] : ['先修正关键结果字段，再重新执行失败动作。'],
        },
        tokenUsage: { promptTokens: 90, completionTokens: 30, totalTokens: 120 },
        providerId: 'provider-e2e-openai',
        processingTimeMs: 140,
        generatedAt: Date.now(),
        providerUsed: 'E2E OpenAI',
        modelUsed: 'gpt-4.1-mini',
      });
      return;
    }

    throw new Error(`Unexpected goal workflow request: ${JSON.stringify(request)}`);
  });

  return telemetry;
}

async function fulfillJson(route: Route, data: unknown): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      ok: true,
      data,
    }),
  });
}
