import { expect, test, type APIResponse } from '@playwright/test';
import { API_CONFIG, TIMEOUT_CONFIG } from '../config';
import { registerAndLogin } from '../helpers/testHelpers';

const testPassword = 'Test123456!';

test.describe('Task completion closed loop', () => {
  test('[P0] completes today instance without a body and refreshes task, stats, and goal progress', async ({
    page,
  }) => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const taskName = `E2E completion loop ${suffix}`;
    const goalName = `E2E linked goal ${suffix}`;

    await registerAndLogin(page, {
      email: `e2e-task-loop-${suffix}@test.com`,
      password: testPassword,
      landingPath: '/',
    });

    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token, 'Registration should persist an access token').toBeTruthy();
    const headers = { Authorization: `Bearer ${token}` };

    const goal = await expectApiData<{ id: string }>(
      await page.request.post(`${API_CONFIG.FULL_URL}/goals`, {
        headers,
        data: {
          name: goalName,
          description: 'Verifies task-to-goal progress projection.',
          importance: 'Moderate',
          startDate: Date.now(),
          targetDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
        },
      }),
    );
    const keyResult = await expectApiData<{ id: string }>(
      await page.request.post(`${API_CONFIG.FULL_URL}/goals/${goal.id}/key-results`, {
        headers,
        data: {
          goalId: goal.id,
          title: 'Complete linked work',
          valueType: 'Incremental',
          calculationMethod: 'Sum',
          startValue: 0,
          currentValue: 0,
          targetValue: 10,
          unit: 'tasks',
          weight: 1,
        },
      }),
    );
    const creation = await expectApiData<{
      template: { id: string };
      todayInstanceCreated: boolean;
    }>(
      await page.request.post(`${API_CONFIG.FULL_URL}/task-templates`, {
        headers,
        data: {
          name: taskName,
          description: 'Created for the P0 completion closed loop.',
          taskType: 'OneTime',
          timeConfig: {
            timeType: 'AllDay',
            startDate: Date.now(),
            timePoint: null,
            timeRange: null,
          },
          recurrenceRule: null,
          reminderConfig: null,
          importance: 'Moderate',
          tags: [],
          goalBinding: {
            goalId: goal.id,
            keyResultId: keyResult.id,
            goalRecordValue: 1,
            progressTrigger: 'PER_INSTANCE',
          },
        },
      }),
    );
    expect(creation.todayInstanceCreated).toBe(true);

    await page.reload({ waitUntil: 'domcontentloaded' });
    const todoWidget = page.getByTestId('daily-todo-widget');
    const taskItem = page
      .getByTestId('daily-todo-item')
      .filter({ has: page.getByText(taskName, { exact: true }) });
    const goalItem = page.locator(
      `[data-testid="goal-progress-item"][data-goal-id="${goal.id}"]`,
    );

    await expect(todoWidget).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    await expect(taskItem).toHaveAttribute('data-task-status', 'Pending');
    await expect(page.getByTestId('daily-todo-progress')).toHaveText('0/1');
    await expect(page.getByTestId('daily-todo-progress-bar')).toHaveAttribute('data-progress', '0');
    await expect(goalItem.getByTestId('goal-progress-value')).toHaveText('0%');

    const completeRequestPromise = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        new URL(request.url()).pathname.endsWith('/complete'),
    );
    const completeResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/complete'),
    );
    await taskItem.locator('button[title]').click();

    const completeRequest = await completeRequestPromise;
    const completeResponse = await completeResponsePromise;
    expect(completeRequest.postData()).toBeNull();
    expect(completeResponse.ok(), await completeResponse.text()).toBe(true);

    await expect(taskItem).toHaveAttribute('data-task-status', 'Completed');
    await expect(page.getByTestId('daily-todo-progress')).toHaveText('1/1');
    await expect(page.getByTestId('daily-todo-progress-bar')).toHaveAttribute(
      'data-progress',
      '100',
    );

    await expect
      .poll(
        async () => {
          const dashboard = await expectApiData<{
            stats: { completedToday: number };
            goalProgress: Array<{ id: string; progress: number }>;
          }>(
            await page.request.get(`${API_CONFIG.FULL_URL}/dashboard/stats`, { headers }),
          );
          return {
            completedToday: dashboard.stats.completedToday,
            linkedGoalProgress:
              dashboard.goalProgress.find((item) => item.id === goal.id)?.progress ?? null,
          };
        },
        { timeout: TIMEOUT_CONFIG.ELEMENT_WAIT },
      )
      .toEqual({ completedToday: 1, linkedGoalProgress: 10 });
    await expect(goalItem.getByTestId('goal-progress-value')).toHaveText('10%');
  });
});

async function expectApiData<T>(response: APIResponse): Promise<T> {
  const body = (await response.json()) as {
    ok?: boolean;
    data?: T;
    error?: unknown;
  };

  expect(response.ok(), JSON.stringify(body.error ?? body)).toBe(true);
  expect(body.ok, JSON.stringify(body)).not.toBe(false);
  expect(body.data, JSON.stringify(body)).toBeDefined();
  return body.data as T;
}
