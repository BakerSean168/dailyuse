import { test, expect } from '@playwright/test';
import { TEST_USERS } from './config';
import {
  login,
  navigateToReminder,
  createReminder,
  captureSSEEvents,
  waitForReminderNotification,
  getSSEEvents,
  cleanupReminder,
} from './helpers/testHelpers';

type ReminderWindowState = Window &
  typeof globalThis & {
    __sse_connected?: boolean;
  };

/**
 * Reminder E2E ????
 *
 * ??????:
 * 1. ????
 * 2. ??? Reminder ??
 * 3. ?????????? Reminder
 * 4. ?? 3 ??
 * 5. ???????? (SSE ?? + ????)
 */
test.describe('Reminder E2E Flow', () => {
  const REMINDER_NAME = `E2E Test - ${Date.now()}`;
  const REMINDER_CONTENT = '???????????,?????????';

  test.beforeEach(async ({ page }) => {
    console.log('\n========================================');
    console.log('[START] ?? E2E ??');
    console.log('========================================\n');

    // ?? SSE ????
    await captureSSEEvents(page);
  });

  test.afterEach(async ({ page }) => {
    console.log('\n========================================');
    console.log('? ??????');
    console.log('========================================\n');

    // ??????? Reminder
    await cleanupReminder(page, REMINDER_NAME);
  });

  test('??????????????', async ({ page }) => {
    // ==================== Step 1: ?? ====================
    test.setTimeout(5 * 60 * 1000); // 5 ????

    console.log('\n? Step 1: ????');
    await login(page, TEST_USERS.MAIN.username, TEST_USERS.MAIN.password);

    // ??????
    await expect(page).toHaveURL(/\/(home|dashboard|reminder)/);
    console.log('[PASS] ????\n');

    // ==================== Step 2: ??? Reminder ====================
    console.log('? Step 2: ??? Reminder ??');
    await navigateToReminder(page);

    // ??????
    await expect(page).toHaveURL(/\/reminder/);
    console.log('[PASS] ???? Reminder ??\n');

    // ==================== Step 3: ?? Reminder ====================
    console.log('? Step 3: ???????');

    // ??:???
    await page.screenshot({ path: 'test-results/01-before-create.png', fullPage: true });

    await createReminder(page, {
      name: REMINDER_NAME,
      content: REMINDER_CONTENT,
      intervalMinutes: 1,
      enableSound: true,
      enablePopup: true,
    });

    // ??:???
    await page.screenshot({ path: 'test-results/02-after-create.png', fullPage: true });

    // ?? Reminder ??????
    const reminderExists = (await page.locator(`text=${REMINDER_NAME}`).count()) > 0;
    expect(reminderExists).toBe(true);
    console.log('[PASS] Reminder ???????????\n');

    // ==================== Step 4: ??????? ====================
    console.log('? Step 4: ?????? (?? 3 ??)');
    console.log('? ????...');
    console.log('   - ???????: ~1 ???');
    console.log('   - ???????: ~2 ???');
    console.log('   - ??????: 3 ??\n');

    const startTime = Date.now();

    // ????
    const receivedNotification = await waitForReminderNotification(page, 3);

    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);

    // ==================== Step 5: ???? ====================
    console.log('\n? Step 5: ??????');

    expect(receivedNotification).toBe(true);

    // ???? SSE ??
    const sseEvents = await getSSEEvents(page);
    console.log(`? ??? ${sseEvents.length} ? SSE ??:`);
    sseEvents.forEach((event, index) => {
      console.log(`   ${index + 1}. [${event.type}] at ${new Date(event.timestamp).toISOString()}`);
    });

    // ???????? reminder ????
    const reminderEvents = sseEvents.filter(
      (e) =>
        e.type.includes('reminder') ||
        e.type.includes('notification') ||
        e.type === 'schedule:reminder-triggered' ||
        e.type === 'schedule:popup-reminder' ||
        e.type === 'schedule:sound-reminder',
    );

    expect(reminderEvents.length).toBeGreaterThan(0);

    // ??:?????
    await page.screenshot({ path: 'test-results/03-notification-received.png', fullPage: true });

    // ==================== ???? ====================
    console.log('\n+============================================================+');
    console.log('|              [PASS] E2E ????                               |');
    console.log('+============================================================+');
    console.log(`|  Reminder ??: ${REMINDER_NAME.padEnd(35)} |`);
    console.log(`|  ????: ${new Date(startTime).toLocaleTimeString().padEnd(41)} |`);
    console.log(
      `|  ????: ${elapsedTime}s ?${' '.repeat(43 - elapsedTime.toString().length)}|`,
    );
    console.log(
      `|  SSE ???: ${sseEvents.length}${' '.repeat(44 - sseEvents.length.toString().length)}|`,
    );
    console.log(
      `|  Reminder ??: ${reminderEvents.length}${' '.repeat(41 - reminderEvents.length.toString().length)}|`,
    );
    console.log('+============================================================+\n');
  });

  test('????????? SSE ??', async ({ page }) => {
    console.log('\n? ????: ?? SSE ????');

    // ??
    await login(page, TEST_USERS.MAIN.username, TEST_USERS.MAIN.password);

    // ??? Reminder
    await navigateToReminder(page);

    // ?? SSE ????
    const sseConnected = await page.evaluate(() => {
      const reminderWindow = window as ReminderWindowState;
      return reminderWindow.__sse_connected === true;
    });

    // ?????,???? 10 ?
    if (!sseConnected) {
      await page.waitForFunction(() => {
        const reminderWindow = window as ReminderWindowState;
        return reminderWindow.__sse_connected === true;
      }, {
        timeout: 10000,
      });
    }

    console.log('[PASS] SSE ?????');

    // ??
    const finalState = await page.evaluate(() => {
      const reminderWindow = window as ReminderWindowState;
      return reminderWindow.__sse_connected;
    });
    expect(finalState).toBe(true);
  });
});
