import { expect, test, type Page, type Route } from '@playwright/test';
import { TIMEOUT_CONFIG } from '../config';
import { registerAndLogin } from '../helpers/testHelpers';

const password = 'Test123456!';
const providerId = 'provider-pm-phase-e';
const modelId = 'gpt-4.1-mini';

test.describe('Local Docker core product Phase E', () => {
  test('[P1] auto-opens a configured-model approval workflow on a clean 1440x900 shell', async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const suffix = testSuffix();
    const conversationId = `pm-phase-e-conversation-${suffix}`;
    const runId = `pm-phase-e-run-${suffix}`;
    const approval = createApprovalFixture({ conversationId, runId });
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    collectBrowserErrors(page, consoleErrors, pageErrors);

    await registerAndLogin(page, {
      email: `pm-phase-e-approval-${suffix}@test.com`,
      password,
      landingPath: '/',
    });
    await installConfiguredModelMock(page);
    await installApprovalRestoreMocks(page, approval);
    await seedChinesePresentation(page);
    await page.evaluate(
      ({ seededConversationId, seededWorkflow }) => {
        localStorage.setItem('ai:last-conversation-id', seededConversationId);
        localStorage.setItem(
          'ai:conversation-model-map',
          JSON.stringify({
            [seededConversationId]: 'provider-pm-phase-e::gpt-4.1-mini',
          }),
        );
        localStorage.setItem(
          'ai:conversation-workflow-map',
          JSON.stringify({ [seededConversationId]: seededWorkflow }),
        );
        localStorage.removeItem('ai:last-model-key');
        localStorage.removeItem('ai:debug:legacy-goal-workflow');
      },
      {
        seededConversationId: conversationId,
        seededWorkflow: approval.workflowEntry,
      },
    );
    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await expect(page.getByTestId('app-shell')).toHaveAttribute('data-shell-state', 'split');
    await expect(page.getByTestId('ai-chat-empty-models')).toHaveCount(0);
    await expect(page.getByTestId('ai-chat-tool-menu-trigger')).toBeEnabled();
    await expect(page.getByTestId('shell-ai-column')).toBeVisible();
    await expect(page.getByTestId('business-panel')).toBeVisible();
    await expect(page.getByTestId('business-panel-workflow')).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByTestId('shell-workflow-surface')).toBeVisible();

    const approvalPanel = page.getByTestId('goal-agent-panel');
    await expect(approvalPanel).toBeVisible({ timeout: TIMEOUT_CONFIG.NAVIGATION });
    await expect(approvalPanel).toContainText('Phase E 待审批目标');
    await expect(approvalPanel).toContainText(/waiting_approval|等待审批/i);
    await expect(page.getByTestId('goal-agent-confirm-run')).toBeVisible();
    await expect(page.getByTestId('goal-agent-cancel-run')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await testInfo.attach('phase-e-configured-workflow-1440x900', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('[P1] defers workflow switching for a dirty form and preserves its draft', async ({
    page,
  }, testInfo) => {
    const suffix = testSuffix();
    const draftTitle = `[PM-E] 脏表单草稿 ${suffix}`;
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    collectBrowserErrors(page, consoleErrors, pageErrors);

    await registerAndLogin(page, {
      email: `pm-phase-e-dirty-${suffix}@test.com`,
      password,
      landingPath: '/goals',
    });
    await installConfiguredModelMock(page);
    await seedChinesePresentation(page);
    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('ai-chat-empty-models')).toHaveCount(0);
    await page.getByTestId('create-goal-entry').click();
    await page.getByTestId('goal-name-input').fill(draftTitle);

    await selectGoalWorkflowTool(page, true);

    const workflowTab = page.getByTestId('business-panel-workflow');
    await expect(workflowTab).toBeVisible();
    await expect(workflowTab).not.toHaveAttribute('aria-current', 'page');
    await expect(workflowTab).toContainText('1');
    await expect(page.getByText('工作流已就绪，可从右侧面板查看。')).toBeVisible();
    await expect(page.getByTestId('goal-dialog')).toBeVisible();
    await expect(page.getByTestId('goal-name-input')).toHaveValue(draftTitle);

    await workflowTab.dispatchEvent('click');
    await expect(workflowTab).toHaveAttribute('aria-current', 'page');
    await expect(page.getByTestId('shell-workflow-surface')).toBeVisible();
    await expect(page.getByTestId('goal-name-input')).toHaveValue(draftTitle);

    await page.locator('button[aria-label="关闭工作流"]').dispatchEvent('click');
    await expect(page.getByTestId('goal-dialog')).toBeVisible();
    await expect(page.getByTestId('goal-name-input')).toHaveValue(draftTitle);

    await testInfo.attach('phase-e-dirty-workflow-1280x720', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    await page.getByTestId('cancel-goal-button').click();
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('[P1] keeps a user-hidden panel closed until explicit mobile interaction', async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const suffix = testSuffix();
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    collectBrowserErrors(page, consoleErrors, pageErrors);

    await registerAndLogin(page, {
      email: `pm-phase-e-mobile-${suffix}@test.com`,
      password,
      landingPath: '/',
    });
    await installConfiguredModelMock(page);
    await seedChinesePresentation(page);
    await page.reload({ waitUntil: 'domcontentloaded' });

    const shell = page.getByTestId('app-shell');
    const panel = page.getByTestId('business-panel');
    const panelToggle = page.getByTestId('shell-right-panel-toggle');

    await expect(shell).toHaveAttribute('data-shell-state', 'focus');
    await expect(panel).toBeVisible();
    await expect(page.getByTestId('today-overview-panel')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await panelToggle.click();
    await expect(shell).toHaveAttribute('data-shell-state', 'chat');
    await expect(panel).toBeHidden();
    await expect(page.getByTestId('shell-ai-column')).toBeVisible();
    await expect(page.getByTestId('ai-chat-tool-menu-trigger')).toBeEnabled();

    await selectGoalWorkflowTool(page);

    await expect(panel).toBeHidden();
    await expect(panelToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('shell-workflow-attention-badge')).toHaveText('1');
    await expect(page.getByText('工作流已就绪，可从右侧面板查看。')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await panelToggle.click();
    await expect(shell).toHaveAttribute('data-shell-state', 'focus');
    await expect(panel).toBeVisible();
    await expect(page.getByTestId('business-panel-workflow')).toContainText('1');
    await page.getByTestId('business-panel-workflow').click();
    await expect(page.getByTestId('business-panel-workflow')).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByTestId('shell-workflow-surface')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await testInfo.attach('phase-e-mobile-workflow-390x844', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});

function testSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function collectBrowserErrors(page: Page, consoleErrors: string[], pageErrors: string[]): void {
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
}

async function seedChinesePresentation(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.setItem(
      'presentation-preference',
      JSON.stringify({ locale: 'zh-CN', theme: 'auto' }),
    );
  });
}

async function installConfiguredModelMock(page: Page): Promise<void> {
  await page.route('**/api/v1/ai/providers', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await fulfillJson(route, {
      data: [
        {
          id: providerId,
          identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
          name: 'Phase E OpenAI',
          providerType: 'openai_compatible',
          baseUrl: 'https://api.openai.com/v1',
          apiKeyMasked: 'sk-****phase-e',
          defaultModel: modelId,
          availableModels: [{ id: modelId, name: modelId }],
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
}

async function selectGoalWorkflowTool(page: Page, directDispatch = false): Promise<void> {
  const trigger = page.getByTestId('ai-chat-tool-menu-trigger');
  await expect(trigger).toBeEnabled();
  if (directDispatch) await trigger.dispatchEvent('click');
  else await trigger.click();

  const goalTool = page.getByTestId('ai-chat-tool-goal-create');
  await expect(goalTool).toBeVisible();
  if (directDispatch) await goalTool.dispatchEvent('click');
  else await goalTool.click();
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - window.innerWidth,
    body: document.body.scrollWidth - window.innerWidth,
  }));
  expect(overflow.document).toBeLessThanOrEqual(1);
  expect(overflow.body).toBeLessThanOrEqual(1);
}

type ApprovalFixture = ReturnType<typeof createApprovalFixture>;

async function installApprovalRestoreMocks(
  page: Page,
  fixture: ApprovalFixture,
): Promise<void> {
  const { conversationId, runId, runResult } = fixture;
  const conversation = {
    id: conversationId,
    identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
    name: 'Phase E Approval Session',
    status: 'Active',
    messageCount: 1,
    lastMessageAt: Date.now(),
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deletedAt: null,
    messages: null,
  };

  await page.route('**/api/v1/ai/chat/conversations?*', async (route) => {
    await fulfillJson(route, { data: [conversation], total: 1, page: 1, pageSize: 24 });
  });
  await page.route(`**/api/v1/ai/chat/conversations/${conversationId}`, async (route) => {
    await fulfillJson(route, conversation);
  });
  await page.route('**/api/v1/ai/chat/messages?*', async (route) => {
    await fulfillJson(route, { data: [], total: 0, page: 1, pageSize: 80 });
  });
  await page.route(`**/api/v1/ai/agents/runs/${runId}/events`, async (route) => {
    await fulfillJson(route, runResult.events);
  });
  await page.route(`**/api/v1/ai/agents/runs/${runId}`, async (route) => {
    await fulfillJson(route, runResult);
  });
  await page.route('**/api/v1/ai/agents/runs?*', async (route) => {
    await fulfillJson(route, []);
  });
}

function createApprovalFixture(input: { conversationId: string; runId: string }) {
  const now = Date.now();
  const pendingAction = {
    tool: 'create_goal',
    payload: { title: 'Phase E 待审批目标' },
    rationale: '用户批准后创建 Phase E 验证目标。',
    index: 0,
    dependsOn: [],
  };
  const run = {
    runId: input.runId,
    threadId: `thread-${input.runId}`,
    conversationId: input.conversationId,
    identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
    agentType: 'goal.create',
    status: 'waiting_approval',
    createdAt: now,
    updatedAt: now,
  };
  const state = {
    messages: [
      {
        role: 'user',
        content: '恢复 Phase E 待审批工作流。',
        createdAt: now,
      },
    ],
    intent: 'goal-create',
    stage: 'approval',
    artifacts: [
      {
        artifactId: `${input.runId}:goal-draft`,
        kind: 'goal_draft',
        title: 'Phase E 待审批目标',
        data: {
          title: 'Phase E 待审批目标',
          description: '验证清洁 surface 自动切换到待审批工作流。',
        },
        updatedAt: now,
      },
      {
        artifactId: `${input.runId}:action-plan`,
        kind: 'action_plan',
        title: 'Phase E 审批计划',
        data: {
          summary: '批准后创建一个目标。',
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
  };
  const events = [
    {
      eventId: `${input.runId}:0`,
      runId: input.runId,
      sequence: 0,
      type: 'approval.required',
      createdAt: now,
      data: { status: 'waiting_approval' },
    },
  ];
  const interrupts = [
    {
      runId: input.runId,
      type: 'approval.required',
      pendingActions: [pendingAction],
    },
  ];
  const runResult = { run, state, events, interrupts };

  return {
    conversationId: input.conversationId,
    runId: input.runId,
    runResult,
    workflowEntry: {
      mode: 'goal-create',
      goalWorkflowStage: 'confirm',
      goalDraft: null,
      goalClarification: null,
      goalAutomationResult: null,
      goalAgentRun: runResult,
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
      noteSummary: null,
      showGoalDraftEditor: false,
    },
  };
}

async function fulfillJson(route: Route, data: unknown): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, data }),
  });
}
