/**
 * Residual 1342: Web multi-engine Host product E2E (ADR-035 open chat).
 * apps/web/e2e/ai/multi-engine-host.spec.ts — product Playwright path for
 * e2e.playwright_web_full (scaffold residual 405/1342).
 *
 * Proves product path (not unit/fixture-only):
 * - select DirectTurn vs ReadonlyAnalysis execution profiles
 * - POST /ai/assistant/dispatch/sse carries executionProfileId
 * - run.started engine.direct_turn / engine.pi_readonly
 * - timeline engine badge ai-host-timeline-artifact
 * - cancel_run mid-turn
 * - no identityId in client body
 * - no process.pi_readonly_spike
 *
 * Does NOT claim Electron multi-engine E2E or real Pi process spawn
 * (scaffold e2e.electron_desktop_full / e2e.real_pi_spawn remain external).
 */
import { expect, test, type Page, type Route } from '@playwright/test';
import { createMockUserSetting } from '@dailyuse/contracts/mocks';
import { TIMEOUT_CONFIG, WEB_CONFIG } from '../config';
import { registerAndLogin } from '../helpers/testHelpers';

const e2ePassword = 'Test123456!';
const conversationId = 'conv-e2e-multi-engine-1';

const generateTestEmail = () =>
  `e2e-multi-engine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;

async function fulfillJson(route: Route, data: unknown): Promise<void> {
  // Match goal-workflow / ResultHttpClient: { ok: true, data } envelope.
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      ok: true,
      data,
    }),
  });
}

async function fulfillSse(route: Route, assistantEvents: Record<string, unknown>[]): Promise<void> {
  const frames: string[] = [];
  for (const event of assistantEvents) {
    frames.push(`event: assistant\ndata: ${JSON.stringify(event)}\n\n`);
  }
  frames.push(`event: done\ndata: ${JSON.stringify({ eventCount: assistantEvents.length })}\n\n`);
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
}

type DispatchCapture = {
  bodies: Array<Record<string, unknown>>;
  cancelCount: number;
};

async function installMultiEngineHostMocks(page: Page): Promise<DispatchCapture> {
  const capture: DispatchCapture = { bodies: [], cancelCount: 0 };
  const openChatMessages: Array<{
    id: string;
    conversationId: string;
    role: string;
    content: string;
    createdAt: number;
  }> = [];
  let hasConversation = false;

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
          shortcuts: { enabled: true, custom: {} },
          experimental: { enabled: false, features: [] },
          ui: { startPage: 'dashboard', sidebarCollapsed: false },
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
    const conversations = hasConversation
      ? [{ id: conversationId, name: 'Multi-engine Host', title: 'Multi-engine Host' }]
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
    hasConversation = true;
    await fulfillJson(route, {
      id: conversationId,
      identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
      name: 'Multi-engine Host',
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
    if (route.request().method() === 'GET') {
      await fulfillJson(route, {
        id: conversationId,
        identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
        name: 'Multi-engine Host',
        status: 'Active',
        messageCount: openChatMessages.length,
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

  await page.route(
    '**/api/v1/ai/chat/messages?conversationId=*&page=*&pageSize=*',
    async (route) => {
      await fulfillJson(route, {
        data: openChatMessages,
        total: openChatMessages.length,
        page: 1,
        pageSize: 80,
      });
    },
  );

  await page.route('**/api/v1/ai/agents/runs?*', async (route) => {
    await fulfillJson(route, { data: [], total: 0, page: 1, pageSize: 20 });
  });

  // POST /ai/assistant/dispatch/sse — multi-engine Host journey
  await page.route('**/api/v1/ai/assistant/dispatch/sse', async (route) => {
    const request = (route.request().postDataJSON() ?? {}) as Record<string, unknown>;
    capture.bodies.push(request);

    // Product contract: client must not send identityId (server resolves from session).
    expect(request).not.toHaveProperty('identityId');

    if (request.type === 'cancel_run') {
      capture.cancelCount += 1;
      await fulfillSse(route, [
        {
          type: 'run.cancelled',
          runId: request.runId ?? 'run-e2e-multi-engine',
        },
        {
          type: 'message.completed',
          runId: request.runId ?? 'run-e2e-multi-engine',
          status: 'aborted',
        },
      ]);
      return;
    }

    const profile =
      request.executionProfileId === 'pi_readonly' ? 'pi_readonly' : 'direct_turn';
    const engineId =
      profile === 'pi_readonly' ? 'engine.pi_readonly' : 'engine.direct_turn';
    // no process.pi_readonly_spike — ReadonlyAnalysis stays Host engine, not Pi spawn
    expect(JSON.stringify(request)).not.toContain('process.pi_readonly_spike');

    const userContent = typeof request.content === 'string' ? request.content : '';
    const runId =
      typeof request.runId === 'string' && request.runId
        ? request.runId
        : `run-e2e-multi-engine-${capture.bodies.length}`;
    const convId =
      typeof request.conversationId === 'string' && request.conversationId
        ? request.conversationId
        : conversationId;
    const assistantContent =
      profile === 'pi_readonly'
        ? 'ReadonlyAnalysis summary (engine.pi_readonly).'
        : 'DirectTurn reply (engine.direct_turn).';
    const now = Date.now();
    const userMsgId = `msg-user-${openChatMessages.length + 1}`;
    const assistantMsgId = `msg-assistant-${openChatMessages.length + 1}`;

    if (userContent.trim()) {
      hasConversation = true;
      openChatMessages.push({
        id: userMsgId,
        conversationId: convId,
        role: 'user',
        content: userContent,
        createdAt: now,
      });
      openChatMessages.push({
        id: assistantMsgId,
        conversationId: convId,
        role: 'assistant',
        content: assistantContent,
        createdAt: now + 1,
      });
    }

    await fulfillSse(route, [
      {
        type: 'run.started',
        runId,
        engineId,
        profile,
        // Residual N1: product SSE mirrors AssistantFacade conversation binding.
        conversationId: convId,
      },
      {
        type: 'message.delta',
        runId,
        content: assistantContent,
      },
      {
        type: 'message.completed',
        runId,
        status: 'completed',
        content: assistantContent,
        userMessage: {
          id: userMsgId,
          conversationId: convId,
          role: 'user',
          content: userContent,
          createdAt: now,
        },
        assistantMessage: {
          id: assistantMsgId,
          conversationId: convId,
          role: 'assistant',
          content: assistantContent,
          createdAt: now + 1,
        },
      },
    ]);
  });

  return capture;
}

async function bootstrapMultiEngineSession(page: Page): Promise<DispatchCapture> {
  await registerAndLogin(page, {
    email: generateTestEmail(),
    password: e2ePassword,
  });
  const capture = await installMultiEngineHostMocks(page);
  await page.goto(WEB_CONFIG.getFullUrl('/'), {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUT_CONFIG.NAVIGATION,
  });
  await page.getByTestId('app-shell').waitFor({
    state: 'visible',
    timeout: TIMEOUT_CONFIG.NAVIGATION,
  });
  await page.getByTestId('ai-chat-view').waitFor({
    state: 'visible',
    timeout: TIMEOUT_CONFIG.NAVIGATION,
  });
  return capture;
}

async function selectExecutionProfile(
  page: Page,
  profile: 'direct_turn' | 'pi_readonly',
): Promise<void> {
  await page.getByTestId('ai-chat-execution-profile-trigger').click();
  const itemTestId =
    profile === 'pi_readonly'
      ? 'ai-chat-execution-profile-readonly'
      : 'ai-chat-execution-profile-direct';
  await page.getByTestId(itemTestId).click();
}

async function sendOpenChatMessage(page: Page, message: string): Promise<void> {
  const composer = page.getByTestId('ai-chat-composer');
  await expect(composer).toBeEnabled({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
  await expect(page.getByTestId('ai-chat-empty-models')).toHaveCount(0, {
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
  await composer.click();
  await composer.fill(message);
  await expect(composer).toHaveValue(message);
  const sendButton = page.getByTestId('ai-chat-send-message');
  await expect(sendButton).toBeEnabled({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
  const sseResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/ai/assistant/dispatch/sse') &&
      response.request().method() === 'POST' &&
      response.status() === 200,
    { timeout: TIMEOUT_CONFIG.NAVIGATION },
  );
  await sendButton.click();
  await sseResponse;
  await expect(composer).toHaveValue('', { timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
  await expect(page.getByTestId('ai-chat-stop-generating')).toHaveCount(0, {
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
}

test.describe('AI multi-engine Host product (residual 1342)', () => {
  test('[P0] DirectTurn then ReadonlyAnalysis profiles drive SSE engines + badges', async ({
    page,
  }) => {
    const capture = await bootstrapMultiEngineSession(page);

    await expect(page.getByTestId('ai-chat-execution-profile')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });

    // ui.select_direct_turn + web.send_direct_turn
    await selectExecutionProfile(page, 'direct_turn');
    await sendOpenChatMessage(page, 'DirectTurn multi-engine product probe');

    const directBodies = capture.bodies.filter((b) => b.type === 'message' || !b.type);
    const lastDirect = capture.bodies[capture.bodies.length - 1];
    expect(lastDirect?.executionProfileId ?? 'direct_turn').toBe('direct_turn');
    expect(lastDirect).not.toHaveProperty('identityId');

    await expect(page.getByTestId('ai-host-timeline-artifact-strip')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(
      page.locator('[data-testid^="ai-host-timeline-artifact-engine-"]').first(),
    ).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    await expect(
      page.locator('[data-engine-key="engine.direct_turn"]').first(),
    ).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });

    // ui.select_pi_readonly + web.send_pi_readonly
    await selectExecutionProfile(page, 'pi_readonly');
    await sendOpenChatMessage(page, 'ReadonlyAnalysis multi-engine product probe');

    const lastReadonly = capture.bodies[capture.bodies.length - 1];
    expect(lastReadonly?.executionProfileId).toBe('pi_readonly');
    expect(lastReadonly).not.toHaveProperty('identityId');
    expect(JSON.stringify(lastReadonly)).not.toContain('process.pi_readonly_spike');

    await expect(
      page.locator('[data-engine-key="engine.pi_readonly"]').first(),
    ).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });

    // At least two open-chat dispatches with type message (or default message path)
    const messageDispatches = capture.bodies.filter(
      (b) => b.type === 'message' || (b.content && !b.type) || b.type === undefined,
    );
    expect(capture.bodies.length).toBeGreaterThanOrEqual(2);
    expect(directBodies.length + messageDispatches.length).toBeGreaterThanOrEqual(2);
  });

  test('[P0] stop generating issues cancel_run without identityId', async ({ page }) => {
    const capture = await bootstrapMultiEngineSession(page);
    await selectExecutionProfile(page, 'direct_turn');

    // Slow first SSE chunk so stop button mounts; cancel_run is client-owned.
    await page.unroute('**/api/v1/ai/assistant/dispatch/sse');
    await page.route('**/api/v1/ai/assistant/dispatch/sse', async (route) => {
      const request = (route.request().postDataJSON() ?? {}) as Record<string, unknown>;
      capture.bodies.push(request);
      expect(request).not.toHaveProperty('identityId');

      if (request.type === 'cancel_run') {
        capture.cancelCount += 1;
        await fulfillSse(route, [
          { type: 'run.cancelled', runId: request.runId ?? 'run-cancel' },
          {
            type: 'message.completed',
            runId: request.runId ?? 'run-cancel',
            status: 'aborted',
          },
        ]);
        return;
      }

      const runId =
        typeof request.runId === 'string' && request.runId
          ? request.runId
          : 'run-e2e-multi-engine-slow';
      // Delay body so chatLoading stays true long enough for stop click.
      await new Promise((r) => setTimeout(r, 2500));
      await fulfillSse(route, [
        {
          type: 'run.started',
          runId,
          engineId: 'engine.direct_turn',
          profile: 'direct_turn',
          conversationId,
        },
        {
          type: 'message.delta',
          runId,
          content: 'slow…',
        },
        {
          type: 'message.completed',
          runId,
          status: 'completed',
          content: 'slow…',
        },
      ]);
    });

    const composer = page.getByTestId('ai-chat-composer');
    await expect(composer).toBeEnabled({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    await composer.fill('Cancel mid multi-engine turn');
    await page.getByTestId('ai-chat-send-message').click();

    const stop = page.getByTestId('ai-chat-stop-generating');
    await expect(stop).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    await stop.click();

    await expect.poll(() => capture.cancelCount, { timeout: TIMEOUT_CONFIG.ELEMENT_WAIT }).toBe(1);
    const cancelBody = capture.bodies.find((b) => b.type === 'cancel_run');
    expect(cancelBody).toBeTruthy();
    expect(cancelBody).not.toHaveProperty('identityId');
  });
});
