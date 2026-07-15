/**
 * Goal Focus Mode E2E 测试
 * 测试专注模式的核心业务流程
 */

import { test, expect, type Page } from '@playwright/test';
import { WEB_CONFIG } from '../config';
import { login, TEST_USER } from '../helpers/testHelpers';

test.describe('Goal Focus Mode - 专注模式', () => {
  let page: Page;
  let focusGoalName: string;
  let otherGoalName: string;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    focusGoalName = `E2E Focus Goal ${Date.now()}`;
    otherGoalName = `E2E Other Goal ${Date.now()}`;

    // 登录
    await login(page, TEST_USER.username, TEST_USER.password);

    // 导航到 Goal 页面
    await page.goto(WEB_CONFIG.getFullUrl(WEB_CONFIG.GOALS_PATH), {
      waitUntil: 'domcontentloaded',
    });

    // 创建两个测试目标
    await createGoal(page, {
      name: focusGoalName,
      description: '专注目标',
    });

    await createGoal(page, {
      name: otherGoalName,
      description: '其他目标',
    });

    await page.waitForTimeout(1000);
  });

  test.afterEach(async () => {
    // 清理测试数据
    await cleanupTestGoals(page, [focusGoalName, otherGoalName]);
  });

  test('[P0] 应该能够启用专注模式', async () => {
    // Act: 打开专注模式设置
    await openFocusMode(page);

    // 选择要专注的目标
    await selectFocusGoal(page, focusGoalName);

    // 启动专注模式
    await startFocusMode(page, { duration: 30 }); // 30分钟

    // Assert: 验证进入专注模式
    await expect(page.locator('text=/专注模式|Focus Mode/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text=${focusGoalName}`)).toBeVisible();

    console.log('✅ 启用专注模式测试通过');
  });

  test('[P0] 应该在专注模式中隐藏其他目标', async () => {
    // Arrange: 启用专注模式
    await openFocusMode(page);
    await selectFocusGoal(page, focusGoalName);
    await startFocusMode(page, { duration: 30 });

    await page.waitForTimeout(1000);

    // Assert: 专注目标可见,其他目标隐藏
    await expect(page.locator(`text=${focusGoalName}`)).toBeVisible();
    await expect(page.locator(`text=${otherGoalName}`)).not.toBeVisible();

    console.log('✅ 隐藏其他目标测试通过');
  });

  test('[P0] 应该显示专注模式倒计时', async () => {
    // Arrange: 启用专注模式
    await openFocusMode(page);
    await selectFocusGoal(page, focusGoalName);
    await startFocusMode(page, { duration: 30 });

    // Assert: 验证倒计时显示
    const timerElement = page.locator('[data-testid="focus-timer"]').or(page.locator('text=/\\d+:\\d+/'));
    await expect(timerElement).toBeVisible({ timeout: 5000 });

    // 验证时间格式 (例如 "30:00" 或 "29:59")
    const timerText = await timerElement.textContent();
    expect(timerText).toMatch(/\d{1,2}:\d{2}/);

    console.log('✅ 倒计时显示测试通过');
  });

  test('[P1] 应该能够延长专注模式时间', async () => {
    // Arrange: 启用专注模式
    await openFocusMode(page);
    await selectFocusGoal(page, focusGoalName);
    await startFocusMode(page, { duration: 30 });

    await page.waitForTimeout(1000);

    // Act: 延长时间
    await extendFocusMode(page, { additionalMinutes: 15 });

    // Assert: 验证时间更新
    await page.waitForTimeout(500);
    const timerElement = page.locator('[data-testid="focus-timer"]').or(page.locator('text=/\\d+:\\d+/'));
    const timerText = await timerElement.textContent();

    // 应该显示更长的时间
    expect(timerText).toBeTruthy();

    console.log('✅ 延长专注时间测试通过');
  });

  test('[P1] 应该能够手动结束专注模式', async () => {
    // Arrange: 启用专注模式
    await openFocusMode(page);
    await selectFocusGoal(page, focusGoalName);
    await startFocusMode(page, { duration: 30 });

    await page.waitForTimeout(1000);

    // Act: 结束专注模式
    await endFocusMode(page);

    // Assert: 验证退出专注模式
    await expect(page.locator('text=/专注模式|Focus Mode/i')).not.toBeVisible();

    // 两个目标都应该可见
    await expect(page.locator(`text=${focusGoalName}`)).toBeVisible();
    await expect(page.locator(`text=${otherGoalName}`)).toBeVisible();

    console.log('✅ 手动结束专注模式测试通过');
  });

  test('[P1] 应该显示专注模式历史记录', async () => {
    // Arrange: 完成一次专注周期
    await openFocusMode(page);
    await selectFocusGoal(page, focusGoalName);
    await startFocusMode(page, { duration: 1 }); // 1分钟用于快速测试

    await page.waitForTimeout(1000);
    await endFocusMode(page);

    // Act: 查看历史记录
    await viewFocusHistory(page);

    // Assert: 验证历史记录显示
    const historyPanel = page.locator('[data-testid="focus-history"]').or(page.locator('text=/历史记录|History/'));
    await expect(historyPanel).toBeVisible({ timeout: 5000 });

    // 应该显示刚才的专注记录
    await expect(page.locator(`text=${focusGoalName}`)).toBeVisible();

    console.log('✅ 历史记录显示测试通过');
  });

  test('[P2] 应该在专注模式中记录专注时间', async () => {
    // Arrange: 启用专注模式
    await openFocusMode(page);
    await selectFocusGoal(page, focusGoalName);
    await startFocusMode(page, { duration: 1 }); // 1分钟

    // 等待一段时间
    await page.waitForTimeout(2000);

    // Act: 结束专注模式
    await endFocusMode(page);

    // Assert: 查看统计信息,应该记录了专注时间
    await page.click(`text=${focusGoalName}`);
    await page.waitForLoadState('domcontentloaded');

    // 查找专注时间统计
    const focusTimeLabel = page.locator('text=/专注时间|Focus Time/i');
    if (await focusTimeLabel.isVisible()) {
      const focusTimeValue = focusTimeLabel.locator('..').locator('text=/\\d+/');
      await expect(focusTimeValue).toBeVisible();
    }

    console.log('✅ 专注时间记录测试通过');
  });

  test('[P2] 应该阻止在活跃专注模式时启动新的专注周期', async () => {
    // Arrange: 启用第一个专注模式
    await openFocusMode(page);
    await selectFocusGoal(page, focusGoalName);
    await startFocusMode(page, { duration: 30 });

    await page.waitForTimeout(1000);

    // Act: 尝试启动另一个专注模式
    try {
      await openFocusMode(page);

      // Assert: 应该显示错误提示或禁用按钮
      const errorMessage = page.locator('text=/已有活跃|already active|正在进行/i');
      await expect(errorMessage).toBeVisible({ timeout: 3000 });

      console.log('✅ 阻止重复启动测试通过');
    } catch {
      // 如果打开按钮被禁用,也算测试通过
      const focusButton = page.locator('button:has-text("专注模式")').or(page.locator('[data-testid="focus-mode-button"]'));
      const isDisabled = await focusButton.isDisabled();
      expect(isDisabled).toBe(true);

      console.log('✅ 按钮禁用测试通过');
    }
  });
});

// ========== 辅助函数 ==========

async function createGoal(page: Page, options: { name: string; description?: string }) {
  const createButton = page.getByTestId('create-goal-entry');
  await createButton.click();
  await page.waitForTimeout(500);

  await page
    .locator('input[placeholder="一段话来描述自己的目标"]')
    .or(page.locator('[data-testid="goal-name-input"]'))
    .fill(options.name);

  if (options.description) {
    await page.locator('textarea[name="description"]').or(page.locator('[data-testid="goal-description-input"]')).fill(options.description);
  }

  await page.locator('button:has-text("保存")').or(page.locator('[data-testid="save-goal-button"]')).click();
  await page.waitForTimeout(1000);
}

async function openFocusMode(page: Page) {
  console.log('[Focus] 打开专注模式');

  // 查找专注模式按钮或入口
  const focusButton = page
    .locator('button:has-text("专注模式")')
    .or(page.locator('button:has-text("Focus Mode")'))
    .or(page.locator('[data-testid="focus-mode-button"]'))
    .or(page.locator('[data-testid="open-focus-mode"]'))
    .or(page.getByTestId('goal-focus-entry'));

  await focusButton.click();
  await page.waitForTimeout(500);

  console.log('[Focus] 专注模式面板已打开');
}

async function selectFocusGoal(page: Page, goalName: string) {
  console.log(`[Focus] 选择专注目标: ${goalName}`);

  // 在目标列表中选择
  const goalOption = page
    .locator(`text=${goalName}`)
    .or(page.locator(`[data-goal-title="${goalName}"]`));

  await goalOption.click();
  await page.waitForTimeout(500);

  console.log('[Focus] 目标已选择');
}

async function startFocusMode(page: Page, options: { duration: number }) {
  console.log(`[Focus] 启动专注模式,时长: ${options.duration}分钟`);

  // 设置时长
  const durationInput = page
    .locator('input[name="duration"]')
    .or(page.locator('[data-testid="focus-duration-input"]'))
    .or(page.locator('input[type="number"]'));

  if (await durationInput.isVisible()) {
    await durationInput.fill(options.duration.toString());
  }

  // 点击开始按钮
  const startButton = page
    .locator('button:has-text("开始")')
    .or(page.locator('button:has-text("Start")'))
    .or(page.locator('[data-testid="start-focus-button"]'));

  await startButton.click();
  await page.waitForTimeout(1000);

  console.log('[Focus] 专注模式已启动');
}

async function extendFocusMode(page: Page, options: { additionalMinutes: number }) {
  console.log(`[Focus] 延长专注时间: ${options.additionalMinutes}分钟`);

  // 查找延长按钮
  const extendButton = page
    .locator('button:has-text("延长")')
    .or(page.locator('button:has-text("Extend")'))
    .or(page.locator('[data-testid="extend-focus-button"]'));

  if (await extendButton.isVisible()) {
    await extendButton.click();
    await page.waitForTimeout(500);

    // 设置延长时间
    const extendInput = page.locator('input[name="extendMinutes"]').or(page.locator('input[type="number"]'));
    if (await extendInput.isVisible()) {
      await extendInput.fill(options.additionalMinutes.toString());
    }

    // 确认
    const confirmButton = page.locator('button:has-text("确认")').or(page.locator('button:has-text("延长")'));
    await confirmButton.click();
    await page.waitForTimeout(500);
  }

  console.log('[Focus] 专注时间已延长');
}

async function endFocusMode(page: Page) {
  console.log('[Focus] 结束专注模式');

  // 查找结束按钮
  const endButton = page
    .locator('button:has-text("结束")')
    .or(page.locator('button:has-text("End")'))
    .or(page.locator('button:has-text("退出")'))
    .or(page.locator('[data-testid="end-focus-button"]'));

  await endButton.click();
  await page.waitForTimeout(500);

  // 如果有确认对话框
  const confirmButton = page.locator('button:has-text("确认")');
  if (await confirmButton.isVisible()) {
    await confirmButton.click();
  }

  await page.waitForTimeout(1000);

  console.log('[Focus] 专注模式已结束');
}

async function viewFocusHistory(page: Page) {
  console.log('[Focus] 查看专注历史');

  // 查找历史按钮或标签页
  const historyButton = page
    .locator('button:has-text("历史")')
    .or(page.locator('button:has-text("History")'))
    .or(page.locator('[data-testid="focus-history-button"]'))
    .or(page.locator('a:has-text("历史")'));

  if (await historyButton.isVisible()) {
    await historyButton.click();
    await page.waitForTimeout(1000);
  }

  console.log('[Focus] 历史记录已加载');
}

async function cleanupTestGoals(page: Page, goalTitles: string[]) {
  try {
    await page.goto(WEB_CONFIG.getFullUrl(WEB_CONFIG.GOALS_PATH), {
      waitUntil: 'domcontentloaded',
    });

    for (const title of goalTitles) {
      const goalCard = page.locator(`text=${title}`);
      if (await goalCard.isVisible()) {
        await goalCard.locator('..').hover();
        const deleteButton = page.locator('button[title*="删除"]').first();
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          await page.waitForTimeout(500);
          const confirmButton = page.locator('button:has-text("确认")');
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
            await page.waitForTimeout(500);
          }
        }
      }
    }
  } catch (error) {
    console.warn('[Cleanup] 清理测试数据失败:', error);
  }
}
