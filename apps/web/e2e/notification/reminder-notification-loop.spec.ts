import { expect, test, type APIResponse } from '@playwright/test';
import { API_CONFIG, TIMEOUT_CONFIG } from '../config';
import { registerAndLogin } from '../helpers/testHelpers';

const testPassword = 'Test123456!';

test.describe('Reminder notification closed loop', () => {
  test('[P0] triggers in-app notifications and closes single/all-read counts and shell badge', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await registerAndLogin(page, {
      email: `e2e-reminder-notification-${suffix}@test.com`,
      password: testPassword,
      landingPath: '/',
    });

    const headers = {};
    const reminderTitles = [
      `E2E notification first ${suffix}`,
      `E2E notification second ${suffix}`,
    ];
    const triggerAt = Date.now() + 8_000;

    for (const [index, title] of reminderTitles.entries()) {
      await expectApiData(
        await page.request.post(`${API_CONFIG.FULL_URL}/reminders/templates`, {
          headers,
          data: createReminderPayload(title, triggerAt + index * 500),
        }),
      );
    }

    let notifications: Array<{ id: string; title: string; isRead: boolean }> = [];
    await expect
      .poll(
        async () => {
          const response = await page.request.get(`${API_CONFIG.FULL_URL}/notifications`, {
            headers,
          });
          const data = await expectApiData<{
            notifications: Array<{ id: string; title: string; isRead: boolean }>;
          }>(response);
          notifications = data.notifications.filter((notification) =>
            reminderTitles.includes(notification.title),
          );
          return notifications.length;
        },
        { timeout: 45_000, intervals: [500, 1_000, 2_000] },
      )
      .toBe(2);

    expect(notifications.every((notification) => notification.isRead === false)).toBe(true);

    // Reload reconciles the shell's initial unread query with notifications that
    // arrived through the real API schedule runtime while this page was open.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('capsule-badge-notification')).toHaveText('2');
    await page.goto('/notifications', { waitUntil: 'domcontentloaded' });

    const unreadItems = page.locator(
      '[data-testid="notification-item"][data-read-state="unread"]',
    );
    await expect(unreadItems).toHaveCount(2, { timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    await expect(page.getByTestId('notification-unread-badge')).toContainText('2');

    const firstNotification = page.locator(
      `[data-testid="notification-item"][data-notification-id="${notifications[0]!.id}"]`,
    );
    await firstNotification.click();
    await expect(firstNotification).toHaveAttribute('data-read-state', 'read');
    await expect(unreadItems).toHaveCount(1);
    await expect(page.getByTestId('notification-unread-badge')).toContainText('1');
    await expect(page.getByTestId('capsule-badge-notification')).toHaveText('1');

    await page.getByTestId('mark-all-read-button').click();
    await expect(unreadItems).toHaveCount(0);
    await expect(page.getByTestId('notification-unread-badge')).toHaveCount(0);
    await expect(page.getByTestId('capsule-badge-notification')).toHaveCount(0);
    await expect(page.getByTestId('mark-all-read-button')).toBeDisabled();
    await page.getByTestId('notification-filter-unread').click();
    await expect(page.getByTestId('notifications-unread-empty')).toBeVisible();

    const unread = await expectApiData<{ count: number }>(
      await page.request.get(`${API_CONFIG.FULL_URL}/notifications/unread-count`, { headers }),
    );
    expect(unread.count).toBe(0);
  });
});

function createReminderPayload(title: string, triggerAt: number) {
  return {
    title,
    description: `Triggered by ${title}`,
    type: 'Recurring',
    trigger: {
      type: 'Interval',
      fixedTime: null,
      interval: { minutes: 1, startTime: triggerAt },
    },
    // Residual 835: ActiveTimeConfigDTO uses activatedAt (not startDate/endDate).
    activeTime: {
      activatedAt: triggerAt,
    },
    notificationConfig: {
      channels: ['InApp'],
      title,
      body: `Notification created from ${title}`,
      sound: null,
      vibration: null,
      actions: null,
    },
    importanceLevel: 'Moderate',
    tags: ['e2e', 'notification-closed-loop'],
  };
}

async function expectApiData<T = unknown>(response: APIResponse): Promise<T> {
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
