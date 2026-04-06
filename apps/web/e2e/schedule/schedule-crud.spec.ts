/**
 * Schedule CRUD E2E Test
 * 测试日程事件的创建、读取、更新、删除功能
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Schedule CRUD Operations', () => {
  const baseUrl = 'http://localhost:3001';
  const testEmail = 'test@example.com';
  const testPassword = 'Test123456!';

  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // 等待跳转到首页
    await page.waitForURL(`${baseUrl}/`);
    await page.waitForTimeout(1000);
    
    // 导航到日程页面
    await page.goto(`${baseUrl}/schedule`);
    await page.waitForTimeout(2000);
  });

  test('should create a new schedule event', async ({ page }) => {
    // 1. 查找并点击创建按钮
    const createButton = page.locator('button:has-text("创建日程")').first();
    await createButton.click();
    
    // 2. 等待对话框打开
    await expect(page.locator('text=创建日程事件')).toBeVisible();
    
    // 3. 填写表单
    const timestamp = Date.now();
    const scheduleTitle = `E2E Test Schedule ${timestamp}`;
    
    await page.fill('input[label="标题 *"]', scheduleTitle);
    await page.fill('textarea[label="描述"]', 'This is an E2E test schedule');
    
    // 设置开始时间（1小时后）
    const startTime = new Date(Date.now() + 60 * 60 * 1000);
    const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
    
    await page.fill('input[label="开始日期 *"]', startTime.toISOString().split('T')[0]);
    await page.fill('input[label="开始时间 *"]', startTime.toTimeString().slice(0, 5));
    await page.fill('input[label="结束日期 *"]', endTime.toISOString().split('T')[0]);
    await page.fill('input[label="结束时间 *"]', endTime.toTimeString().slice(0, 5));
    
    // 4. 提交表单
    await page.click('button:has-text("创建")');
    
    // 5. 等待成功提示
    await expect(page.locator('text=日程创建成功')).toBeVisible({ timeout: 5000 });
    
    // 6. 验证日程出现在列表中
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${scheduleTitle}`)).toBeVisible();
    
    // 清理：删除测试日程
    await cleanupTestSchedule(page, scheduleTitle);
  });

  test('should display schedule list', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('text=日程管理').or(page.locator('text=我的日程'))).toBeVisible();
    
    // 验证日历或列表视图存在
    const hasWeekView = await page.locator('.week-view').isVisible().catch(() => false);
    const hasListView = await page.locator('.schedule-list').isVisible().catch(() => false);
    
    expect(hasWeekView || hasListView).toBeTruthy();
  });

  test('should edit an existing schedule', async ({ page }) => {
    // 1. 创建一个测试日程
    const timestamp = Date.now();
    const originalTitle = `E2E Edit Test ${timestamp}`;
    await createTestSchedule(page, originalTitle);
    
    // 2. 查找并点击编辑按钮
    const scheduleCard = page.locator(`text=${originalTitle}`).locator('..').locator('..');
    await scheduleCard.locator('button:has-text("编辑")').or(
      scheduleCard.locator('button:has(svg.mdi-pencil)')
    ).first().click();
    
    // 3. 等待编辑对话框打开
    await expect(page.locator('text=编辑日程事件')).toBeVisible();
    
    // 4. 修改标题
    const updatedTitle = `${originalTitle} (Updated)`;
    const titleInput = page.locator('input[label="标题 *"]');
    await titleInput.clear();
    await titleInput.fill(updatedTitle);
    
    // 5. 保存
    await page.click('button:has-text("保存")');
    
    // 6. 验证成功提示
    await expect(page.locator('text=日程更新成功')).toBeVisible({ timeout: 5000 });
    
    // 7. 验证更新后的标题出现
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible();
    
    // 清理
    await cleanupTestSchedule(page, updatedTitle);
  });

  test('should delete a schedule', async ({ page }) => {
    // 1. 创建一个测试日程
    const timestamp = Date.now();
    const scheduleTitle = `E2E Delete Test ${timestamp}`;
    await createTestSchedule(page, scheduleTitle);
    
    // 2. 查找并点击删除按钮
    const scheduleCard = page.locator(`text=${scheduleTitle}`).locator('..').locator('..');
    await scheduleCard.locator('button:has-text("删除")').or(
      scheduleCard.locator('button:has(svg.mdi-delete)')
    ).first().click();
    
    // 3. 确认删除
    const confirmButton = page.locator('button:has-text("确认")').or(
      page.locator('button:has-text("删除")')
    ).last();
    await confirmButton.click();
    
    // 4. 验证删除成功
    await expect(page.locator('text=日程删除成功')).toBeVisible({ timeout: 5000 });
    
    // 5. 验证日程不再显示
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${scheduleTitle}`)).not.toBeVisible();
  });

  test('should validate form fields', async ({ page }) => {
    // 1. 打开创建对话框
    const createButton = page.locator('button:has-text("创建日程")').first();
    await createButton.click();
    await expect(page.locator('text=创建日程事件')).toBeVisible();
    
    // 2. 尝试不填写必填项提交
    await page.click('button:has-text("创建")');
    
    // 3. 验证错误提示（标题必填）
    await expect(page.locator('text=此字段为必填项').or(
      page.locator('text=标题不能为空')
    )).toBeVisible();
  });

  test('should validate time range', async ({ page }) => {
    // 1. 打开创建对话框
    const createButton = page.locator('button:has-text("创建日程")').first();
    await createButton.click();
    await expect(page.locator('text=创建日程事件')).toBeVisible();
    
    // 2. 填写标题
    await page.fill('input[label="标题 *"]', 'Time Validation Test');
    
    // 3. 设置结束时间早于开始时间
    const now = new Date();
    const startTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2小时后
    const endTime = new Date(now.getTime() + 1 * 60 * 60 * 1000);   // 1小时后
    
    await page.fill('input[label="开始日期 *"]', startTime.toISOString().split('T')[0]);
    await page.fill('input[label="开始时间 *"]', startTime.toTimeString().slice(0, 5));
    await page.fill('input[label="结束日期 *"]', endTime.toISOString().split('T')[0]);
    await page.fill('input[label="结束时间 *"]', endTime.toTimeString().slice(0, 5));
    
    // 4. 提交
    await page.click('button:has-text("创建")');
    
    // 5. 验证错误提示
    await expect(page.locator('text=结束时间必须晚于开始时间')).toBeVisible();
  });
});

// ===== Helper Functions =====

async function createTestSchedule(page: Page, title: string) {
  const createButton = page.locator('button:has-text("创建日程")').first();
  await createButton.click();
  await expect(page.locator('text=创建日程事件')).toBeVisible();
  
  await page.fill('input[label="标题 *"]', title);
  
  const startTime = new Date(Date.now() + 60 * 60 * 1000);
  const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
  
  await page.fill('input[label="开始日期 *"]', startTime.toISOString().split('T')[0]);
  await page.fill('input[label="开始时间 *"]', startTime.toTimeString().slice(0, 5));
  await page.fill('input[label="结束日期 *"]', endTime.toISOString().split('T')[0]);
  await page.fill('input[label="结束时间 *"]', endTime.toTimeString().slice(0, 5));
  
  await page.click('button:has-text("创建")');
  await expect(page.locator('text=日程创建成功')).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(1000);
}

async function cleanupTestSchedule(page: Page, title: string) {
  try {
    const scheduleCard = page.locator(`text=${title}`).locator('..').locator('..');
    const deleteButton = scheduleCard.locator('button:has-text("删除")').or(
      scheduleCard.locator('button:has(svg.mdi-delete)')
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
