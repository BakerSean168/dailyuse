import { expect, test, type Page, type Route } from '@playwright/test';
import type { AIWorkflowRunView } from '@memoflow/contracts/ai';
import { createMockUserSetting } from '@memoflow/contracts/mocks';
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
  seedConversation?: boolean;
  landingPath?: string;
  expectAiVisible?: boolean;
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
  } = {},
): Promise<void> {
  const conversationId = options.conversationId ?? null;
  const modelKey = options.modelKey ?? null;
  const workflowEntry = options.workflowEntry ?? null;

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
    }) => {
      window.localStorage.removeItem(lastModelStorageKey);
      // Residual 211: legacy goal-workflow debug dual-track is retired; clear any stale key.
      window.localStorage.removeItem(legacyGoalWorkflowStorageKey);

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
    },
  );
}

/**
 * Real JWT via register/login, then AI route mocks, then optional AI local state, then navigate.
 * Mocks are installed after auth so register/login/settings are not blocked incorrectly.
 */

/**
 * Residual 1333: Vue-controlled composer uses :value + @input.
 * Wait for model readiness, drive input via fill+input event, and assert SSE completes
 * so hasWorkflowUserMessages/chatLoading unlock Start Agent / knowledge actions.
 */
async function sendComposerMessage(page: Page, message: string): Promise<void> {
  const composer = page.getByTestId('ai-chat-composer');
  await expect(composer).toBeEnabled({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
  // Model select populated → canSendMessage can become true once text is non-empty.
  await expect(page.getByTestId('ai-chat-empty-models')).toHaveCount(0, {
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });

  await composer.click();
  await composer.fill(message);
  await expect(composer).toHaveValue(message);

  const sendButton = page.getByTestId('ai-chat-send-message');
  await expect(sendButton).toBeEnabled({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });

  const sseResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/ai/runtime/assistant/sse') &&
      response.request().method() === 'POST' &&
      response.status() === 200,
    { timeout: TIMEOUT_CONFIG.NAVIGATION },
  );
  await sendButton.click();
  await sseResponse;

  // Composer clears after a successful Mastra open-chat turn starts.
  await expect(composer).toHaveValue('', {
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
  // Stop button disappears once chatLoading clears (stream closed + finally).
  await expect(page.getByTestId('ai-chat-stop-generating')).toHaveCount(0, {
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
}

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
  });

  await page.goto(WEB_CONFIG.getFullUrl(landingPath), {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUT_CONFIG.NAVIGATION,
  });

  // Cold Vite main-app graph often exceeds ELEMENT_WAIT (10s); wait for shell mount
  // before tests assert AI controls (see residual goal-workflow splash flake).
  // Residual 1335: app-shell replaces #startup-splash first; ai-chat-view is nested.
  await page.getByTestId('app-shell').waitFor({
    state: 'visible',
    timeout: TIMEOUT_CONFIG.NAVIGATION,
  });
  await page.getByTestId('ai-chat-view').waitFor({
    state: options.expectAiVisible === false ? 'attached' : 'visible',
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
    await bootstrapGoalWorkflowSession(page, { expectAiVisible: false });

    const shell = page.getByTestId('app-shell');
    const panelToggle = page.getByTestId('shell-right-panel-toggle');
    await expect(shell).toHaveAttribute('data-shell-state', 'focus');
    await expect(page.getByTestId('business-panel')).toBeVisible();
    await expect(page.getByTestId('ai-chat-view')).toBeHidden();

    await panelToggle.click();
    await expect(shell).toHaveAttribute('data-shell-state', 'chat');
    await expect(page.getByTestId('business-panel')).toBeHidden();

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

    await sendComposerMessage(page, 'How should knowledge answers stay grounded in citations?');

    await expect(page.getByTestId('knowledge-qa-ask')).toBeEnabled({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
  });

  test('[P0] restores a pending Goal Agent approval run after refresh', async ({ page }) => {
    await bootstrapGoalWorkflowSession(page, {
      conversationId: e2eConversationId,
      modelKey: 'provider-e2e-openai::gpt-4.1-mini',
      workflowEntry: createPendingApprovalWorkflowEntry(),
      seedConversation: true,
    });

    // ADR-052: the durable Mastra Workflow panel (AIWorkflowRunView) owns this
    // surface — not a legacy goal-agent-panel AgentRun / Host Proposal.
    const workflowPanel = page.getByTestId('goal-workflow-panel');
    await expect(workflowPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(workflowPanel).toContainText(/suspended/i);
    await expect(workflowPanel).toContainText(/Restored AI Agent workspace/i);
    await expect(page.getByTestId('goal-agent-confirm-run')).toBeVisible();
    await expect(page.getByTestId('goal-agent-cancel-run')).toBeVisible();
    await expect(page.getByTestId('goal-agent-panel')).toHaveCount(0);

    await page.reload({ waitUntil: 'domcontentloaded' });
    // Full main-app remount after reload needs NAVIGATION budget (same as bootstrap).
    await expect(page.getByTestId('ai-chat-view')).toBeVisible({
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });

    await expect(workflowPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });
    await expect(workflowPanel).toContainText(/suspended/i);
    await expect(workflowPanel).toContainText(/Restored AI Agent workspace/i);
    await expect(page.getByTestId('goal-agent-confirm-run')).toBeVisible();
    await expect(page.getByTestId('goal-agent-panel')).toHaveCount(0);
  });

  test('[P0] completes Goal Agent confirmation through the controlled executor and retries failed actions', async ({
    page,
  }) => {
    const telemetry = await bootstrapGoalWorkflowSession(page);

    await page.getByTestId('ai-chat-tool-menu-trigger').click();
    await page.getByTestId('ai-chat-tool-goal-create').click();

    await sendComposerMessage(
      page,
      'Create a structured AI workflow goal through the Agent runtime and execute the approved plan.',
    );

    const startButton = page.getByTestId('goal-agent-start-run');
    await expect(startButton).toBeEnabled({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await startButton.click();

    // ADR-052: goal.create renders in the durable Workflow panel, not a
    // legacy goal-agent-panel.
    const workflowPanel = page.getByTestId('goal-workflow-panel');
    await expect(workflowPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(workflowPanel).toContainText(/suspended/i);
    await expect(workflowPanel).toContainText(/Agent-created AI workflow/i);
    await expect(workflowPanel).toContainText(/Run the Goal Agent workflow end to end/i);
    // Task template / reminder names render only inside the optional draft
    // editor; the review card shows the goal, key result, and rationale.
    await expect(workflowPanel).toContainText(
      /Create the approved goal draft with a measurable key result/i,
    );
    await expect(page.getByTestId('goal-agent-panel')).toHaveCount(0);

    await page.getByTestId('goal-agent-confirm-run').click();

    // Controlled executor: the first approved execution is partial, so the
    // durable runtime suspends with a recovery_required suspension.
    await expect(page.getByTestId('goal-workflow-recovery')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(page.getByTestId('goal-workflow-recovery')).toContainText(/KEY_RESULT_FAILED/i);
    await expect(page.getByTestId('goal-workflow-recovery')).toContainText(/关键结果创建失败/i);
    expect(telemetry.goalAgentStartCount).toBe(1);
    expect(telemetry.lastGoalAgentStart?.idea ?? '').toMatch(/Agent runtime/i);
    expect(telemetry.lastGoalAgentStart?.providerId).toBe('provider-e2e-openai');
    expect(telemetry.lastGoalAgentStart?.model).toBe('gpt-4.1-mini');
    expect(telemetry.goalAgentApprovalResumeCount).toBe(1);
    expect(telemetry.goalAgentExecuteRequestCount).toBe(1);

    const retryButton = page.getByTestId('goal-agent-retry-execution');
    await expect(retryButton).toBeEnabled({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await retryButton.click();

    // The durable runtime completes after the retry; the retry control is
    // removed and the ready product deep-links to the created goal. Assert the
    // completion outcome instead of racing the transient result panel against
    // the deep-link navigation.
    await expect(retryButton).toHaveCount(0, {
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(page.getByTestId('goal-workflow-result'))
      .toContainText(/goal-e2e-1/i, {
        timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
      })
      .catch(() => undefined);
    await expect(page).toHaveURL(/\/goals\/goal-e2e-1/, {
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    expect(telemetry.goalAgentRetryResumeCount).toBe(1);
    expect(telemetry.goalAgentExecuteRequestCount).toBe(2);
    expect(telemetry.goalAgentCompletionResumeCount).toBe(1);
  });

  test('[P0] asks the personal knowledge base with citations from the workspace', async ({
    page,
  }) => {
    await bootstrapGoalWorkflowSession(page);

    await page.getByTestId('ai-chat-tool-menu-trigger').click();
    await page.getByTestId('ai-chat-tool-knowledge-qa').click();

    await sendComposerMessage(page, 'How should knowledge answers stay grounded in citations?');

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
    await expect(answerPanel).toContainText(/MemoFlow grounding policy/i);
    await expect(answerPanel).toContainText(/notes\/ai\/grounding-policy\.md/i);
    await expect(page.getByTestId('knowledge-citation-open')).toBeVisible();

    await page.getByTestId('knowledge-qa-draft-note').click();
    const noteAgentPanel = page.getByTestId('knowledge-note-agent-panel');
    await expect(noteAgentPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(noteAgentPanel).toContainText(/Grounded Knowledge Answers/i);

    await page.getByTestId('knowledge-qa-save-draft').click();
    await openCreatedKnowledgeNoteWorkflow(page);
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

    await sendComposerMessage(
      page,
      'Turn this planning conversation into a reusable knowledge note about agent checkpoints.',
    );

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
    await openCreatedKnowledgeNoteWorkflow(page);
    const noteSummaryPanel = page.getByTestId('knowledge-note-summary-panel');
    await expect(noteSummaryPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(noteSummaryPanel).toContainText(/Conversation Agent Checkpoints\.md/i);
    await expect(noteSummaryPanel).toContainText(/notes\/ai\/Conversation Agent Checkpoints\.md/i);
    await expect(noteSummaryPanel).toContainText(/indexed/i);
  });

  test('[P0] shows insufficient evidence when knowledge citations are missing', async ({
    page,
  }) => {
    await bootstrapGoalWorkflowSession(page);

    await page.getByTestId('ai-chat-tool-menu-trigger').click();
    await page.getByTestId('ai-chat-tool-knowledge-qa').click();

    await sendComposerMessage(
      page,
      'What does my repository say about the unindexed archive migration plan?',
    );

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

  test('[P0] starts Goal Agent from goal-create tool and cancels at approval', async ({ page }) => {
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

    await sendComposerMessage(
      page,
      'Create a structured AI workflow goal through the Agent runtime and cancel before approving execution.',
    );

    const startButton = page.getByTestId('goal-agent-start-run');
    await expect(startButton).toBeEnabled({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await startButton.click();

    const workflowPanel = page.getByTestId('goal-workflow-panel');
    await expect(workflowPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(workflowPanel).toContainText(/suspended/i);
    await expect(page.getByTestId('goal-agent-confirm-run')).toBeVisible();
    await expect(page.getByTestId('goal-agent-cancel-run')).toBeVisible();
    await expect(page.getByTestId('goal-agent-panel')).toHaveCount(0);

    await page.getByTestId('goal-agent-cancel-run').click();

    await expect(workflowPanel).toContainText(/cancelled/i, {
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(page.getByTestId('goal-agent-confirm-run')).toHaveCount(0);
    await expect(page.getByTestId('goal-agent-cancel-run')).toHaveCount(0);
    expect(telemetry.goalAgentStartCount).toBe(1);
    expect(telemetry.lastGoalAgentStart?.idea ?? '').toMatch(/Agent runtime/i);
    expect(telemetry.lastGoalAgentStart?.providerId).toBe('provider-e2e-openai');
    expect(telemetry.lastGoalAgentStart?.model).toBe('gpt-4.1-mini');
    expect(telemetry.goalAgentCancelCount).toBe(1);
    expect(telemetry.goalAgentApprovalResumeCount).toBe(0);
  });
});

async function openCreatedKnowledgeNoteWorkflow(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/repository$/i, {
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
  const workflowTab = page.getByTestId('business-panel-workflow');
  await expect(workflowTab).toBeVisible();
  await workflowTab.click();
  await expect(workflowTab).toHaveAttribute('aria-current', 'page');
  await expect(page.getByTestId('shell-workflow-surface')).toBeVisible();
}

type GoalWorkflowMockOptions = {
  seedConversation?: boolean;
};

type GoalWorkflowMockTelemetry = {
  goalAgentStartCount: number;
  lastGoalAgentStart?: {
    idea?: string;
    providerId?: string;
    model?: string;
  };
  goalAgentApprovalResumeCount: number;
  goalAgentRetryResumeCount: number;
  goalAgentCancelCount: number;
  goalAgentExecuteRequestCount: number;
  goalAgentCompletionResumeCount: number;
};

type GoalPlanDraft = {
  revision: number;
  goal: {
    name: string;
    description: string;
    category?: string;
    importance: string;
    motivation?: string;
    feasibilityAnalysis?: string;
    tags: string[];
    startDate?: number | null;
    targetDate?: number | null;
  };
  keyResults: Array<Record<string, unknown>>;
  taskTemplates: Array<Record<string, unknown>>;
  reminders: Array<Record<string, unknown>>;
  rationale: string;
  warnings: string[];
};

type GoalWorkflowExecutionFailure = {
  operation: 'goal' | 'task_template' | 'reminder';
  index?: number;
  code: string;
  message: string;
  retryable: boolean;
};

/**
 * ADR-052 durable goal.create Workflow simulation.
 *
 * Batch C: the Mastra-owned `/ai/runtime/workflow/*` endpoints are the only
 * authority. There is no `agents/runs` AgentRun / Host Proposal double-track
 * for goal.create anymore — the panel is AIWorkflowRunView-backed
 * (`goal-workflow-panel`) with typed suspensions.
 */
type GoalWorkflowMockRun = {
  runId: string;
  conversationId: string;
  createdAt: number;
  draft: GoalPlanDraft;
  /** Execution simulation state (approved/executed mutations). */
  executedGoalId: string | null;
  executedTaskIds: string[];
  executedReminderIds: string[];
  failures: GoalWorkflowExecutionFailure[];
  executionStatus: 'success' | 'partial' | 'failed';
};

function createRestoredGoalWorkflowDraft(): GoalPlanDraft {
  return {
    revision: 1,
    goal: {
      name: 'Restored AI Agent workspace',
      description: 'A pending approval run restored from local workflow state.',
      category: 'learning',
      importance: 'Important',
      motivation: 'Restore the runtime-owned durable goal.create run after refresh.',
      feasibilityAnalysis: 'Scoped to goal and key result creation after confirmation.',
      tags: ['ai', 'agent'],
      startDate: Date.now(),
      targetDate: Date.now() + 60 * 24 * 60 * 60 * 1000,
    },
    keyResults: [
      {
        title: 'Complete the restored workflow approval',
        description: 'Confirm the pending workflow from the durable run.',
        valueType: 'Incremental',
        calculationMethod: 'Sum',
        startValue: 0,
        currentValue: 0,
        targetValue: 1,
        unit: 'workflow',
        weight: 3,
      },
    ],
    taskTemplates: [],
    reminders: [],
    rationale: 'Create the restored Agent goal after user approval.',
    warnings: [],
  };
}

/**
 * Persisted workflow entry (AIWorkflowRunView-backed) that seeds a pending
 * goal.create approval run. `ai:conversation-workflow-map` now stores
 * `goalWorkflowRun` (the Mastra run view), never a legacy `goalAgentRun`.
 */
function createPendingApprovalWorkflowEntry() {
  const now = Date.now();
  const draft = createRestoredGoalWorkflowDraft();

  return {
    mode: 'goal-create',
    goalWorkflowStage: 'confirm',
    goalWorkflowRun: {
      runId: 'workflow-e2e-restored-approval',
      kind: 'goal.create',
      conversationId: e2eConversationId,
      status: 'suspended',
      suspension: {
        type: 'goal_draft_review',
        draft,
        warnings: draft.warnings,
        revision: draft.revision,
      },
      createdAt: now,
      updatedAt: now,
    },
    goalDraft: null,
    goalClarification: null,
    goalAutomationResult: null,
    knowledgeQaAgentRun: null,
    noteAgentRun: null,
    taskAgentRun: null,
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
    editableTaskTemplates: [],
    editableReminders: [],
    noteSummary: null,
    showGoalDraftEditor: false,
  };
}

function createGoalAgentWorkflowDraft(): GoalPlanDraft {
  const now = Date.now();
  return {
    revision: 1,
    goal: {
      name: 'Agent-created AI workflow',
      description: 'Create a structured goal through the Mastra Workflow runtime.',
      category: 'learning',
      importance: 'Important',
      motivation: 'Turn the Agent plan into tracked execution.',
      feasibilityAnalysis: 'The approved plan is scoped to goal and KR creation.',
      tags: ['ai', 'agent'],
      startDate: now,
      targetDate: now + 60 * 24 * 60 * 60 * 1000,
    },
    keyResults: [
      {
        title: 'Run the Goal Agent workflow end to end',
        description: 'Confirm Mastra Workflow execution through the controlled executor.',
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
        timeOfDay: '09:00',
        daysOfWeek: [1],
        occurrences: null,
        contributionValue: 1,
        tags: [],
      },
    ],
    reminders: [
      {
        title: 'Review Agent result',
        description: 'Review failed actions.',
        importance: 'Moderate',
        cadence: 'weekly',
        timeOfDay: '09:00',
        timezone: null,
        channels: ['InApp'],
        tags: [],
      },
    ],
    rationale:
      'Create the approved goal draft with a measurable key result, task template, and reminder.',
    warnings: [],
  };
}

function createGoalWorkflowMockRun(request: {
  runId?: string;
  conversationId?: string | null;
}): GoalWorkflowMockRun {
  const draft = createGoalAgentWorkflowDraft();
  return {
    runId: request.runId ?? 'workflow-e2e-goal-1',
    conversationId: request.conversationId ?? e2eConversationId,
    createdAt: Date.now(),
    draft,
    executedGoalId: null,
    executedTaskIds: [],
    executedReminderIds: [],
    failures: [],
    executionStatus: 'failed',
  };
}

function goalReviewSuspension(
  draft: GoalPlanDraft,
): NonNullable<Extract<AIWorkflowRunView, { kind: 'goal.create' }>['suspension']> {
  // E2E mock: draft fields carry the canonical GoalPlanDraft contract shape at
  // runtime; the loose local type is only for authoring ergonomics. The client
  // re-validates with AIWorkflowRunViewSchema before projection, so malformed
  // fixtures fail loudly rather than silently.
  return {
    type: 'goal_draft_review',
    draft: draft as unknown as NonNullable<
      Extract<AIWorkflowRunView, { kind: 'goal.create' }>['suspension']
    > extends { type: 'goal_draft_review' }
      ? Extract<AIWorkflowRunView, { kind: 'goal.create' }>['suspension']
      : never,
    warnings: draft.warnings,
    revision: draft.revision,
  } as NonNullable<Extract<AIWorkflowRunView, { kind: 'goal.create' }>['suspension']>;
}

function createGoalReviewRun(mockRun: GoalWorkflowMockRun): AIWorkflowRunView {
  const now = Date.now();
  return {
    runId: mockRun.runId,
    kind: 'goal.create',
    conversationId: mockRun.conversationId,
    status: 'suspended',
    suspension: goalReviewSuspension(mockRun.draft),
    createdAt: mockRun.createdAt,
    updatedAt: now,
  };
}

function createGoalRecoveryRun(mockRun: GoalWorkflowMockRun): AIWorkflowRunView {
  const now = Date.now();
  return {
    runId: mockRun.runId,
    kind: 'goal.create',
    conversationId: mockRun.conversationId,
    status: 'suspended',
    suspension: {
      type: 'recovery_required',
      message: 'Some goal plan mutations failed.',
      retryable: true,
      failures: mockRun.failures,
    },
    result: {
      workflowRunId: mockRun.runId,
      revision: mockRun.draft.revision,
      status: mockRun.executionStatus,
      goalId: mockRun.executedGoalId ?? undefined,
      keyResultIds: [],
      taskIds: mockRun.executedTaskIds,
      reminderIds: mockRun.executedReminderIds,
      failures: mockRun.failures,
      retryable: true,
    },
    createdAt: mockRun.createdAt,
    updatedAt: now,
  };
}

function createGoalCompletedRun(mockRun: GoalWorkflowMockRun): AIWorkflowRunView {
  const now = Date.now();
  return {
    runId: mockRun.runId,
    kind: 'goal.create',
    conversationId: mockRun.conversationId,
    status: 'completed',
    result: {
      workflowRunId: mockRun.runId,
      revision: mockRun.draft.revision,
      status: mockRun.executionStatus,
      goalId: mockRun.executedGoalId ?? undefined,
      keyResultIds: mockRun.draft.keyResults.map((_, index) => `kr-e2e-${index + 1}`),
      taskIds: mockRun.executedTaskIds,
      reminderIds: mockRun.executedReminderIds,
      failures: mockRun.failures,
      retryable: false,
    },
    createdAt: mockRun.createdAt,
    updatedAt: now,
  };
}

function createCancelledRun(mockRun: GoalWorkflowMockRun): AIWorkflowRunView {
  const now = Date.now();
  return {
    runId: mockRun.runId,
    kind: 'goal.create',
    conversationId: mockRun.conversationId,
    status: 'cancelled',
    createdAt: mockRun.createdAt,
    updatedAt: now,
  };
}

function executeGoalWorkflowMockRun(
  mockRun: GoalWorkflowMockRun,
  telemetry: GoalWorkflowMockTelemetry,
) {
  telemetry.goalAgentExecuteRequestCount += 1;
  const retrySucceeded = telemetry.goalAgentExecuteRequestCount > 1;

  mockRun.executedGoalId = 'goal-e2e-1';
  if (retrySucceeded) {
    mockRun.executedTaskIds = ['task-template-e2e-1'];
    mockRun.executedReminderIds = ['reminder-e2e-1'];
    mockRun.failures = [];
    mockRun.executionStatus = 'success';
  } else {
    mockRun.executedTaskIds = [];
    mockRun.executedReminderIds = ['reminder-e2e-1'];
    mockRun.failures = [
      {
        operation: 'task_template',
        index: 0,
        code: 'KEY_RESULT_FAILED',
        message: '关键结果创建失败，字段仍需修正。',
        retryable: true,
      },
    ];
    mockRun.executionStatus = 'partial';
  }
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
          ai: {},
        },
      }),
    );
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
    // Residual 1333: after create, listConversations must return this id.
    // Otherwise loadConversationList after open-chat completion calls
    // startNewConversation() and wipes hasWorkflowUserMessages.
    generateGoalStep = Math.max(generateGoalStep, 1);

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

  // Batch B: Mastra owns default open-chat transcript persistence. These messages
  // are returned only by the canonical runtime history route.
  const openChatMessages: Array<{
    id: string;
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: number;
  }> = [];

  await page.route('**/api/v1/ai/runtime/assistant/history', async (route) => {
    const request = (route.request().postDataJSON() ?? {}) as { conversationId?: string };
    expect(request).not.toHaveProperty('identityId');
    await fulfillJson(route, {
      conversationId: request.conversationId ?? conversationId,
      messages: openChatMessages,
    });
  });

  await page.route('**/api/v1/ai/runtime/assistant/sse', async (route) => {
    const request = (route.request().postDataJSON() ?? {}) as {
      type?: string;
      content?: string;
      conversationId?: string;
      surface?: string;
      providerId?: string;
      modelId?: string;
    };
    expect(request).not.toHaveProperty('identityId');
    expect(request).not.toHaveProperty('executionProfileId');
    expect(request.type).toBe('message');
    expect(request.surface).toBe('web');
    expect(request.providerId).toBe('provider-e2e-openai');
    expect(request.modelId).toBe('gpt-4.1-mini');

    const userContent = request.content ?? '';
    const now = Date.now();
    const convId = request.conversationId ?? conversationId;
    const turn = Math.floor(openChatMessages.length / 2) + 1;
    const runId = `run-e2e-mastra-goal-workflow-${turn}`;
    const userMsgId = `msg-user-${turn}`;
    const assistantMsgId = `msg-assistant-${turn}`;
    const assistantContent = '先把目标拆清楚，我会帮你补全 workflow。';
    if (userContent.trim()) {
      openChatMessages.push(
        {
          id: userMsgId,
          conversationId: convId,
          role: 'user',
          content: userContent,
          createdAt: now,
        },
        {
          id: assistantMsgId,
          conversationId: convId,
          role: 'assistant',
          content: assistantContent,
          createdAt: now + 1,
        },
      );
    }
    generateGoalStep = Math.max(generateGoalStep, 1);

    const events = [
      {
        eventId: `${runId}:1`,
        runId,
        conversationId: convId,
        sequence: 1,
        createdAt: now,
        type: 'assistant.run.started',
        data: { providerId: 'provider-e2e-openai', modelId: 'gpt-4.1-mini' },
      },
      {
        eventId: `${runId}:2`,
        runId,
        conversationId: convId,
        sequence: 2,
        createdAt: now,
        type: 'assistant.message.delta',
        data: { content: assistantContent },
      },
      {
        eventId: `${runId}:3`,
        runId,
        conversationId: convId,
        sequence: 3,
        createdAt: now,
        type: 'assistant.run.completed',
        data: { content: assistantContent, assistantMessageId: assistantMsgId },
      },
    ];
    const body = events
      .map((event) => `event: runtime\ndata: ${JSON.stringify(event)}\n\n`)
      .join('');
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream; charset=utf-8',
      body,
      headers: {
        'cache-control': 'no-cache',
        'content-length': String(Buffer.byteLength(body, 'utf8')),
        connection: 'close',
      },
    });
  });

  // Transitional workflow proposal lifecycle still uses AssistantFacade until
  // Batch C/D migrates those workflows. Default chat must never arrive here.
  await page.route('**/api/v1/ai/assistant/dispatch/sse', async (route) => {
    const request = (route.request().postDataJSON() ?? {}) as {
      type?: string;
      runId?: string;
      proposalId?: string;
      revision?: number;
      reason?: string;
    };
    expect(request.type).not.toBe('message');
    expect(request).not.toHaveProperty('identityId');

    const fulfillHostSse = async (assistantEvents: Record<string, unknown>[]) => {
      const frames = assistantEvents.map(
        (event) => `event: assistant\ndata: ${JSON.stringify(event)}\n\n`,
      );
      frames.push(
        `event: done\ndata: ${JSON.stringify({ eventCount: assistantEvents.length })}\n\n`,
      );
      const body = frames.join('');
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream; charset=utf-8',
        body,
        headers: {
          'cache-control': 'no-cache',
          'content-length': String(Buffer.byteLength(body, 'utf8')),
          connection: 'close',
        },
      });
    };

    if (request.type === 'cancel_run') {
      await fulfillHostSse([{ type: 'run.cancelled', runId: request.runId ?? 'run-e2e' }]);
      return;
    }
    if (request.type === 'approve_proposal') {
      await fulfillHostSse([
        {
          type: 'proposal.approved',
          runId: request.runId ?? 'run-e2e',
          proposalId: request.proposalId ?? 'proposal-e2e',
          revision: request.revision ?? 1,
        },
      ]);
      return;
    }
    if (request.type === 'reject_proposal') {
      await fulfillHostSse([
        {
          type: 'proposal.rejected',
          runId: request.runId ?? 'run-e2e',
          proposalId: request.proposalId ?? 'proposal-e2e',
          revision: request.revision ?? 1,
          reason: request.reason ?? 'user_cancel',
        },
      ]);
      return;
    }
    if (request.type === 'revise_proposal') {
      await fulfillHostSse([
        {
          type: 'proposal.revised',
          runId: request.runId ?? 'run-e2e',
          proposalId: request.proposalId ?? 'proposal-e2e',
          revision: (request.revision ?? 1) + 1,
        },
      ]);
      return;
    }
    throw new Error(`Unexpected legacy AssistantFacade command: ${String(request.type)}`);
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
          title: 'MemoFlow grounding policy',
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

  // Batch C: goal.create is owned by the durable Mastra Workflow runtime.
  // The product talks to `/ai/runtime/workflow/*` only — never `agents/runs`
  // AgentRun / Host Proposal for goal.create (ADR-052).
  const workflowRunsByRunId = new Map<string, GoalWorkflowMockRun>();
  const restoredApprovalRun = createGoalWorkflowMockRun({
    runId: 'workflow-e2e-restored-approval',
    conversationId,
  });
  // The seed snapshot and the durable authority must agree on the restored
  // draft content — otherwise `workflowRuntime.get` would overwrite the
  // projected review with a different draft.
  restoredApprovalRun.draft = createRestoredGoalWorkflowDraft();

  await page.route('**/api/v1/ai/runtime/workflow/start', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const request = route.request().postDataJSON() as {
      kind?: string;
      conversationId?: string;
      input?: { idea?: string };
      providerId?: string;
      modelId?: string;
      locale?: string;
    };
    // No client-supplied identity may cross the seam.
    expect(request).not.toHaveProperty('identityId');
    expect(request.kind).toBe('goal.create');
    expect(request.conversationId).toBeTruthy();
    expect(request.input?.idea?.trim().length).toBeGreaterThan(0);
    expect(request.providerId).toBe('provider-e2e-openai');
    expect(request.modelId).toBe('gpt-4.1-mini');

    telemetry.goalAgentStartCount += 1;
    telemetry.lastGoalAgentStart = {
      idea: request.input?.idea,
      providerId: request.providerId,
      model: request.modelId,
    };

    const mockRun = createGoalWorkflowMockRun({ conversationId: request.conversationId });
    workflowRunsByRunId.set(mockRun.runId, mockRun);
    await fulfillJson(route, createGoalReviewRun(mockRun));
  });

  await page.route('**/api/v1/ai/runtime/workflow/get', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const request = route.request().postDataJSON() as { runId?: string };
    expect(request).not.toHaveProperty('identityId');

    // Refresh test: the durable run authority may advance past the snapshot.
    // For the restored approval run we return the authoritative review state.
    if (request.runId === restoredApprovalRun.runId) {
      await fulfillJson(route, createGoalReviewRun(restoredApprovalRun));
      return;
    }
    const mockRun = workflowRunsByRunId.get(request.runId ?? '');
    await fulfillJson(route, mockRun ? createGoalReviewRun(mockRun) : null);
  });

  await page.route('**/api/v1/ai/runtime/workflow/list', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const request = route.request().postDataJSON() as Record<string, unknown>;
    expect(request).not.toHaveProperty('identityId');
    await fulfillJson(route, []);
  });

  await page.route('**/api/v1/ai/runtime/workflow/resume', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const request = route.request().postDataJSON() as {
      runId?: string;
      command?: { type?: string };
    };
    expect(request).not.toHaveProperty('identityId');
    const commandType = request.command?.type;
    const mockRun =
      (request.runId && workflowRunsByRunId.get(request.runId)) ||
      (request.runId === restoredApprovalRun.runId ? restoredApprovalRun : undefined);

    if (commandType === 'cancel') {
      telemetry.goalAgentCancelCount += 1;
      await fulfillJson(route, createCancelledRun(mockRun ?? restoredApprovalRun));
      return;
    }
    if (commandType === 'retry') {
      telemetry.goalAgentRetryResumeCount += 1;
      if (mockRun) executeGoalWorkflowMockRun(mockRun, telemetry);
      telemetry.goalAgentCompletionResumeCount += 1;
      await fulfillJson(route, createGoalCompletedRun(mockRun ?? restoredApprovalRun));
      return;
    }
    if (commandType === 'approve') {
      telemetry.goalAgentApprovalResumeCount += 1;
      if (mockRun) executeGoalWorkflowMockRun(mockRun, telemetry);
      // First execution is partial → recovery_required suspension; a later
      // `retry` resumes to completion. This drives the controlled-executor
      // recovery & retry path in the HITL test.
      const completed = mockRun && mockRun.executionStatus === 'success';
      if (completed) telemetry.goalAgentCompletionResumeCount += 1;
      await fulfillJson(
        route,
        completed
          ? createGoalCompletedRun(mockRun)
          : createGoalRecoveryRun(mockRun ?? restoredApprovalRun),
      );
      return;
    }
    if (commandType === 'edit_structured') {
      // No-op edit path: return the same review run (draft unchanged).
      await fulfillJson(route, createGoalReviewRun(mockRun ?? restoredApprovalRun));
      return;
    }
    throw new Error(`Unexpected workflow resume command: ${String(commandType)}`);
  });

  await page.route('**/api/v1/ai/runtime/workflow/cancel', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const request = route.request().postDataJSON() as { runId?: string };
    expect(request).not.toHaveProperty('identityId');
    await fulfillJson(route, createCancelledRun(restoredApprovalRun));
  });

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
        // Residual 1333: client AgentStartRun uses snake_case provider_id (Host contract).
        provider_id?: string;
        providerId?: string;
        model?: string;
      };
    };
    const requestProviderId = request.input?.provider_id ?? request.input?.providerId;
    const requestModel = request.input?.model;

    if (request.agentType === 'knowledge.qa') {
      expect(requestProviderId).toBe('provider-e2e-openai');
      expect(request.input?.question).toBeTruthy();

      const question = request.input?.question ?? '';
      const insufficientEvidence = question.includes('unindexed archive migration plan');
      const citations = insufficientEvidence
        ? []
        : [
            {
              resourceId: 'resource-grounding-1',
              resourcePath: 'notes/ai/grounding-policy.md',
              title: 'MemoFlow grounding policy',
              chunkIndex: 0,
              excerpt: 'Knowledge answers must cite repository evidence before sounding certain.',
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

    expect(requestProviderId).toBe('provider-e2e-openai');
    expect(requestModel).toBe('gpt-4.1-mini');

    const source = request.input?.source ?? '';
    const isConversationDraft = source.includes('reusable knowledge note about agent checkpoints');
    if (!isConversationDraft) {
      expect(request.input?.title).toContain(
        'How should knowledge answers stay grounded in citations?',
      );
      expect(source).toContain('MemoFlow grounding policy');
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

  // Match absolute and relative resume URLs (Vite proxy + direct API).
  await page.route(/\/api\/v1\/ai\/agents\/runs\/[^/]+\/resume(?:\?|$)/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    const url = new URL(route.request().url());
    const segments = url.pathname.split('/').filter(Boolean);
    // .../ai/agents/runs/:runId/resume
    const runIdIndex = segments.lastIndexOf('runs') + 1;
    const runId = decodeURIComponent(segments[runIdIndex] ?? '');

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
    const executedAction = {
      tool: 'create_knowledge_note',
      status: 'executed',
      entityId: 'resource-note-e2e-1',
      message: `Saved knowledge note to ${resolvedPath}.`,
      data: {
        note: {
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
      note: {
        id: 'resource-note-e2e-1',
        repositoryScopeId: 'connection-e2e-1',
        name: resourceName,
        path: resolvedPath,
        mimeType: 'text/markdown',
        size: 124,
        content: request.contentMarkdown ?? null,
        createdAt: now,
        updatedAt: now,
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
        summary: retrySucceeded ? '目标和关键结果已创建。' : '目标已创建，关键结果暂未完全写入。',
        plan: {
          goal: {
            title: request.approvedPlan?.goal?.title ?? '建立稳定的 AI agent 工作流',
            description:
              request.approvedPlan?.goal?.description ??
              '围绕澄清、规划、执行和复盘，建立可重复的 AI goal workflow。',
            category: request.approvedPlan?.goal?.category ?? 'learning',
            importance: request.approvedPlan?.goal?.importance ?? 'Important',
            motivation: request.approvedPlan?.goal?.motivation ?? '把 AI 想法稳定转成可执行目标。',
            feasibilityAnalysis:
              request.approvedPlan?.goal?.feasibilityAnalysis ??
              '聚焦日常执行和每周复盘，范围可控。',
            suggestedStartDate: request.approvedPlan?.goal?.suggestedStartDate ?? Date.now(),
            suggestedEndDate:
              request.approvedPlan?.goal?.suggestedEndDate ?? Date.now() + 1000 * 60 * 60 * 24 * 60,
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
