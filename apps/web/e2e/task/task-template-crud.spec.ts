/**
 * Task Template CRUD E2E Test
 * 测试任务模板的创建、读取、更新、删除功能
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Task Template CRUD Operations', () => {
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

    // 导航到任务页面
    await page.goto(`${baseUrl}/tasks`);
    await page.waitForTimeout(1000);

    // 切换到"任务管理"标签页（TaskTemplateManagement 组件所在的标签页）
    const managementTab = page.locator('button:has-text("任务管理")');
    await managementTab.click();
    await page.waitForTimeout(500);
  });

  test('should create a new task template', async ({ page }) => {
    // 1. 点击创建按钮 - 优先使用主按钮，如果不可见则使用空状态按钮
    const createButton = page.locator('[data-testid="create-task-template-button"]');
    const firstButton = page.locator('[data-testid="create-first-task-template-button"]');
    
    if (await createButton.isVisible()) {
      await createButton.click();
    } else {
      await firstButton.click();
    }
    
    // 2. 等待对话框打开 - 使用更精确的选择器（h3 标题）
    await expect(page.locator('h3:has-text("创建任务模板")')).toBeVisible({ timeout: 5000 });
    
    // 3. 填写表单
    const timestamp = Date.now();
    const templateTitle = `E2E Test Template ${timestamp}`;
    
    // 等待表单完全加载
    await page.waitForTimeout(500);
    
    // 填写标题 - 使用 data-testid (Vuetify 组件需要加 input 后缀)
    const titleInput = page.locator('[data-testid="task-template-title-input"] input');
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });
    await titleInput.fill(templateTitle);
    
    // 填写描述 - 使用 data-testid (Vuetify textarea 需要加 textarea 后缀)
    const descInput = page.locator('[data-testid="task-template-description-input"] textarea');
    await descInput.fill('This is an E2E test task template');
    
    // 4. 提交表单 - 使用 data-testid
    await page.locator('[data-testid="task-dialog-save-button"]').click();
    
    // 5. 验证成功提示
    await expect(page.locator('text=创建成功').or(
      page.locator('text=保存成功')
    )).toBeVisible({ timeout: 5000 });
    
    // 6. 验证模板出现在列表中
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${templateTitle}`)).toBeVisible();
    
    // 清理
    await cleanupTestTemplate(page, templateTitle);
  });

  test('should display task template list', async ({ page }) => {
    // 验证页面有任务管理标签
    await expect(page.locator('button:has-text("任务管理")')).toBeVisible();
    
    // 验证至少有一个创建按钮可见
    const createButton = page.locator('[data-testid="create-task-template-button"]');
    const firstButton = page.locator('[data-testid="create-first-task-template-button"]');
    
    const hasMainButton = await createButton.isVisible();
    const hasFirstButton = await firstButton.isVisible();
    
    expect(hasMainButton || hasFirstButton).toBeTruthy();
  });

  test('should edit an existing task template', async ({ page }) => {
    // 1. 创建测试模板
    const timestamp = Date.now();
    const originalTitle = `E2E Edit Test ${timestamp}`;
    await createTestTemplate(page, originalTitle);
    
    // 2. 查找并点击编辑按钮 - 使用 data-testid
    const templateCard = page.locator(`text=${originalTitle}`).locator('..').locator('..');
    await templateCard.locator('[data-testid="task-card-edit-button"]').click();
    
    // 3. 等待编辑对话框打开
    await expect(page.locator('text=编辑任务模板').or(
      page.locator('text=编辑模板')
    )).toBeVisible({ timeout: 5000 });
    
    // 4. 修改标题 - 使用 data-testid
    const updatedTitle = `${originalTitle} (Updated)`;
    const titleInput = page.locator('[data-testid="task-template-title-input"]');
    await titleInput.clear();
    await titleInput.fill(updatedTitle);
    
    // 5. 保存 - 使用 data-testid
    await page.locator('[data-testid="task-dialog-save-button"]').click();
    
    // 6. 验证成功提示
    await expect(page.locator('text=更新成功').or(
      page.locator('text=保存成功')
    )).toBeVisible({ timeout: 5000 });
    
    // 7. 验证更新后的标题显示
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible();
    
    // 清理
    await cleanupTestTemplate(page, updatedTitle);
  });

  test('should delete a task template', async ({ page }) => {
    // 1. 创建测试模板
    const timestamp = Date.now();
    const templateTitle = `E2E Delete Test ${timestamp}`;
    await createTestTemplate(page, templateTitle);
    
    // 2. 查找并点击删除按钮 - 使用 data-testid
    const templateCard = page.locator(`text=${templateTitle}`).locator('..').locator('..');
    await templateCard.locator('[data-testid="task-card-delete-button"]').click();
    
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

  test('should validate form fields', async ({ page }) => {
    // 1. 打开创建对话框 - 优先使用主按钮
    const createButton = page.locator('[data-testid="create-task-template-button"]');
    const firstButton = page.locator('[data-testid="create-first-task-template-button"]');
    
    if (await createButton.isVisible()) {
      await createButton.click();
    } else {
      await firstButton.click();
    }
    
    // 2. 尝试不填写必填项提交 - 使用 data-testid
    await page.locator('[data-testid="task-dialog-save-button"]').click();
    
    // 3. 验证错误提示
    await expect(page.locator('text=标题不能为空').or(
      page.locator('text=必填')
    )).toBeVisible({ timeout: 3000 });
  });
});

// ===== Helper Functions =====

async function createTestTemplate(page: Page, title: string) {
  // 优先使用主按钮，如果不可见则使用空状态按钮
  const createButton = page.locator('[data-testid="create-task-template-button"]');
  const firstButton = page.locator('[data-testid="create-first-task-template-button"]');
  
  if (await createButton.isVisible()) {
    await createButton.click();
  } else {
    await firstButton.click();
  }
  
  // 等待对话框打开 - 使用更精确的选择器
  await expect(page.locator('h3:has-text("创建任务模板")')).toBeVisible({ timeout: 5000 });
  
  // 等待表单加载
  await page.waitForTimeout(500);
  
  // 使用 data-testid (Vuetify 组件需要加 input 后缀)
  const titleInput = page.locator('[data-testid="task-template-title-input"] input');
  await titleInput.waitFor({ state: 'visible', timeout: 5000 });
  await titleInput.fill(title);
  
  // 使用 data-testid
  await page.locator('[data-testid="task-dialog-save-button"]').click();
  
  await expect(page.locator('text=创建成功').or(
    page.locator('text=保存成功')
  )).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(1000);
}

async function cleanupTestTemplate(page: Page, title: string) {
  try {
    const templateCard = page.locator(`text=${title}`).locator('..').locator('..');
    // 使用 data-testid
    const deleteButton = templateCard.locator('[data-testid="task-card-delete-button"]');
    
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
