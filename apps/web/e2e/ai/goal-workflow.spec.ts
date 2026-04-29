import { expect, test, type Page, type Route } from '@playwright/test';
import { TIMEOUT_CONFIG, WEB_CONFIG } from '../config';
import { registerAndLogin } from '../helpers/testHelpers';

const generateTestEmail = () =>
  `e2e-ai-goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
const testPassword = 'Test123456!';

test.describe('AI Goal Workflow', () => {
  test('[P0] completes clarification -> draft -> confirm -> result inside AI chat', async ({
    page,
  }) => {
    await registerAndLogin(page, {
      email: generateTestEmail(),
      password: testPassword,
    });

    await page.evaluate(() => {
      localStorage.removeItem('ai:last-conversation-id');
      localStorage.removeItem('ai:conversation-workflow-map');
      localStorage.removeItem('ai:last-model-key');
      localStorage.removeItem('ai:conversation-model-map');
    });

    await installGoalWorkflowMocks(page);

    await page.goto(WEB_CONFIG.getFullUrl('/ai/chat'), {
      waitUntil: 'networkidle',
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });

    await expect(page.getByTestId('ai-chat-view')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });

    await page.getByTestId('ai-chat-tool-menu-trigger').click();
    await page.getByTestId('ai-chat-tool-goal').click();

    const composer = page.getByTestId('ai-chat-composer');
    await composer.fill('我想在两个月内建立稳定的 AI agent 工作流，并落地到日常目标执行中。');
    await page.getByTestId('ai-chat-send-message').click();

    await expect(page.getByText(/先把目标拆清楚/i)).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });

    await page.getByTestId('goal-workflow-generate-draft').click();

    const clarificationPanel = page.getByTestId('goal-clarification-panel');
    await expect(clarificationPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(clarificationPanel).toContainText(/你最想先改善哪一段/i);

    await page.getByTestId('goal-clarification-answer-0').fill('先把 goal workflow 跑通，并能稳定执行。');
    await page.getByTestId('goal-clarification-answer-1').fill('重点是每天复盘、每周校准。');

    await page.getByTestId('goal-workflow-submit-clarification').click();

    const draftPanel = page.getByTestId('goal-draft-panel');
    await expect(draftPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(draftPanel).toContainText(/建立稳定的 AI agent 工作流/i);
    await expect(draftPanel).toContainText(/每周复盘 workflow 结果/i);

    await page.getByTestId('goal-workflow-plan-automation').click();

    const automationPanel = page.getByTestId('goal-automation-panel');
    await expect(automationPanel).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(automationPanel).toContainText(/先创建目标与关键结果/i);

    await page.getByTestId('goal-workflow-confirm-execute').click();

    await expect(automationPanel).toContainText(/Execution Status|执行状态/i, {
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(automationPanel).toContainText(/Partial|部分成功/i);
    await expect(automationPanel).toContainText(/Execution Timeline|执行时间线/i);
    await expect(automationPanel).toContainText(/创建目标|Create Goal/i);
    await expect(automationPanel).toContainText(/创建关键结果|Create Key Result/i);
    await expect(automationPanel).toContainText(/Recovery|恢复建议/i);
    await expect(automationPanel).toContainText(/可以在修正后重试失败动作|ready to retry failed actions/i);
  });
});

async function installGoalWorkflowMocks(page: Page): Promise<void> {
  const conversationId = 'conv-e2e-goal-1';
  let conversationName = 'Goal Workflow Session';
  let generateGoalStep = 0;

  await page.route('**/api/v1/ai/providers', async (route) => {
    await fulfillJson(route, [
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
    ]);
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
          content: '我想在两个月内建立稳定的 AI agent 工作流，并落地到日常目标执行中。',
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

  await page.route('**/api/v1/ai/generate/goal', async (route) => {
    const request = route.request().postDataJSON() as {
      command?: 'draft' | 'prepare' | 'execute';
      clarificationAnswers?: string[];
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
      await fulfillJson(route, {
        state: 'result',
        summary: '目标已创建，关键结果暂未完全写入。',
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
        executedActions: [
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
        ],
        executionSummary: {
          status: 'partial',
          executedCount: 1,
          skippedCount: 0,
          failedCount: 1,
        },
        recovery: {
          canRetry: true,
          failedActions: [
            {
              tool: 'create_key_result',
              status: 'failed',
              message: '关键结果创建失败，字段仍需修正。',
            },
          ],
          suggestions: ['先修正关键结果字段，再重新执行失败动作。'],
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
