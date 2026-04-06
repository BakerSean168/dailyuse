/**
 * Reminder Template CRUD E2E Test
 * 测试提醒模板的创建、读取、更新、删除功能
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Reminder Template CRUD Operations', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  const testUsername = 'Test123123';
  const testPassword = 'Llh123123!';

  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto(`${baseUrl}/auth`);
    await page.locator('[data-testid="login-username-input"] input').fill(testUsername);
    await page.locator('[data-testid="login-password-input"] input').fill(testPassword);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`${baseUrl}/`);
    await page.waitForTimeout(1000);

    // 导航到提醒模板页面（注意是复数 reminders）
    await page.goto(`${baseUrl}/reminders`);
    await page.waitForTimeout(1000);
  });

  test('should create a new reminder template', async ({ page }) => {
    // 1. 点击创建按钮 - 使用 data-testid
    const createButton = page.locator('[data-testid="create-reminder-template-button"]');
    await createButton.click();
    
    // 2. 等待对话框打开
    await expect(page.locator('text=创建提醒模板')).toBeVisible({ timeout: 5000 });
    
    // 3. 填写表单
    const timestamp = Date.now();
    const templateTitle = `E2E Test Reminder ${timestamp}`;
    
    const titleInput = page.locator('input[label="标题"]').or(
      page.locator('input[placeholder*="标题"]')
    ).first();
    await titleInput.fill(templateTitle);
    
    const descInput = page.locator('textarea[label="描述"]').or(
      page.locator('textarea[placeholder*="描述"]')
    ).first();
    if (await descInput.isVisible({ timeout: 1000 })) {
      await descInput.fill('This is an E2E test reminder template');
    }
    
    // 4. 提交表单 - 使用 data-testid
    await page.locator('[data-testid="reminder-dialog-save-button"]').click();
    
    // 5. 验证成功提示
    await expect(page.locator('text=创建成功').or(
      page.locator('text=保存成功')
    )).toBeVisible({ timeout: 5000 });
    
    // 6. 验证模板出现
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${templateTitle}`)).toBeVisible();
    
    // 清理
    await cleanupTestReminder(page, templateTitle);
  });

  test('should display reminder templates', async ({ page }) => {
    // 验证页面加载
    await expect(page.locator('text=提醒').or(
      page.locator('text=Reminder')
    )).toBeVisible();
    
    // 验证有创建按钮 - 使用 data-testid
    const createButton = page.locator('[data-testid="create-reminder-template-button"]');
    await expect(createButton).toBeVisible();
  });

  test('should edit an existing reminder template', async ({ page }) => {
    // 1. 创建测试模板
    const timestamp = Date.now();
    const originalTitle = `E2E Edit Reminder ${timestamp}`;
    await createTestReminder(page, originalTitle);
    
    // 2. 查找并点击编辑按钮
    const templateCard = page.locator(`text=${originalTitle}`).locator('..').locator('..');
    await templateCard.locator('button:has-text("编辑")').or(
      templateCard.locator('button:has(svg.mdi-pencil)')
    ).first().click();
    
    // 3. 等待编辑对话框打开
    await expect(page.locator('text=编辑提醒模板')).toBeVisible({ timeout: 5000 });
    
    // 4. 修改标题
    const updatedTitle = `${originalTitle} (Updated)`;
    const titleInput = page.locator('input[label="标题"]').or(
      page.locator('input[placeholder*="标题"]')
    ).first();
    await titleInput.clear();
    await titleInput.fill(updatedTitle);
    
    // 5. 保存 - 使用 data-testid
    await page.locator('[data-testid="reminder-dialog-save-button"]').click();
    
    // 6. 验证成功提示
    await expect(page.locator('text=更新成功').or(
      page.locator('text=保存成功')
    )).toBeVisible({ timeout: 5000 });
    
    // 7. 验证更新后的标题显示
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible();
    
    // 清理
    await cleanupTestReminder(page, updatedTitle);
  });

  test('should delete a reminder template', async ({ page }) => {
    // 1. 创建测试模板
    const timestamp = Date.now();
    const templateTitle = `E2E Delete Reminder ${timestamp}`;
    await createTestReminder(page, templateTitle);
    
    // 2. 查找并点击删除按钮
    const templateCard = page.locator(`text=${templateTitle}`).locator('..').locator('..');
    await templateCard.locator('button:has-text("删除")').or(
      templateCard.locator('button:has(svg.mdi-delete)')
    ).first().click();
    
    // 3. 确认删除
    const confirmButton = page.locator('button:has-text("确认")').or(
      page.locator('button:has-text("删除")')
    ).last();
    await confirmButton.click();
    
    // 4. 验证删除成功
    await expect(page.locator('text=删除成功')).toBeVisible({ timeout: 5000 });
    
    // 5. 验证模板不再显示
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${templateTitle}`)).not.toBeVisible();
  });

  test('should open reminder desktop view', async ({ page }) => {
    // 验证桌面视图组件加载
    const desktopView = page.locator('.reminder-desktop-view').or(
      page.locator('[class*="desktop"]')
    );
    await expect(desktopView).toBeVisible({ timeout: 5000 });
  });
});

// ===== Helper Functions =====

async function createTestReminder(page: Page, title: string) {
  // 使用 data-testid 选择器
  const createButton = page.locator('[data-testid="create-reminder-template-button"]');
  await createButton.click();
  
  await expect(page.locator('text=创建提醒模板')).toBeVisible({ timeout: 5000 });
  
  const titleInput = page.locator('input[label="标题"]').or(
    page.locator('input[placeholder*="标题"]')
  ).first();
  await titleInput.fill(title);
  
  // 使用 data-testid
  await page.locator('[data-testid="reminder-dialog-save-button"]').click();
  
  await expect(page.locator('text=创建成功').or(
    page.locator('text=保存成功')
  )).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(1000);
}

async function cleanupTestReminder(page: Page, title: string) {
  try {
    const templateCard = page.locator(`text=${title}`).locator('..').locator('..');
    const deleteButton = templateCard.locator('button:has-text("删除")').or(
      templateCard.locator('button:has(svg.mdi-delete)')
    ).first();
    
    if (await deleteButton.isVisible({ timeout: 2000 })) {
      await deleteButton.click();
      const confirmButton = page.locator('button:has-text("确认")').or(
        page.locator('button:has-text("删除")')
      ).last();
      await confirmButton.click();
      await page.waitForTimeout(1000);
    }
  } catch (error) {
    console.log('Cleanup failed, test data may remain:', error);
  }
}
