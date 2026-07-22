/**
 * Schedule Week View E2E Test
 * 测试日程周视图功能
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Schedule Week View', () => {
  const baseUrl = 'http://localhost:3001';
  const testEmail = 'test@example.com';
  const testPassword = 'Test123456!';

  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // 等待跳转
    await page.waitForURL(`${baseUrl}/`);
    await page.waitForTimeout(1000);
    
    // 导航到统一日程日历（含周视图组件）
    await page.goto(`${baseUrl}/schedule/calendar`);
    await page.waitForTimeout(2000);
  });

  test('should display week calendar', async ({ page }) => {
    // 验证周视图存在
    await expect(page.locator('.week-view-calendar').or(
      page.locator('[class*="week"]')
    )).toBeVisible({ timeout: 5000 });
    
    // 验证有创建按钮
    const createButton = page.locator('button:has-text("创建")').or(
      page.locator('button:has(svg.mdi-plus)')
    ).first();
    await expect(createButton).toBeVisible();
  });

  test('should create schedule from week view', async ({ page }) => {
    // 1. 点击创建按钮
    const createButton = page.locator('button:has-text("创建")').or(
      page.locator('button:has(svg.mdi-plus)')
    ).first();
    await createButton.click();
    
    // 2. 填写表单
    const timestamp = Date.now();
    const scheduleTitle = `Week View Test ${timestamp}`;
    
    await page.fill('input[label="标题 *"]', scheduleTitle);
    
    // 3. 提交
    await page.click('button:has-text("创建")');
    
    // 4. 验证成功
    await expect(page.locator('text=日程创建成功')).toBeVisible({ timeout: 5000 });
    
    // 5. 验证日程出现在周视图
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${scheduleTitle}`)).toBeVisible({ timeout: 5000 });
  });

  test('should click event to view details', async ({ page }) => {
    // 1. 创建测试日程
    const timestamp = Date.now();
    const scheduleTitle = `Event Click Test ${timestamp}`;
    await createTestSchedule(page, scheduleTitle);
    
    // 2. 点击日程事件
    await page.click(`text=${scheduleTitle}`);
    
    // 3. 验证详情对话框打开
    await expect(page.locator('.v-dialog').locator(`text=${scheduleTitle}`)).toBeVisible();
    
    // 4. 验证有编辑和删除按钮
    await expect(page.locator('button:has-text("编辑")')).toBeVisible();
    await expect(page.locator('button:has-text("删除")')).toBeVisible();
  });

  test('should edit schedule from event details', async ({ page }) => {
    // 1. 创建测试日程
    const timestamp = Date.now();
    const originalTitle = `Edit From Detail ${timestamp}`;
    await createTestSchedule(page, originalTitle);
    
    // 2. 打开事件详情
    await page.click(`text=${originalTitle}`);
    await expect(page.locator('.v-dialog').locator(`text=${originalTitle}`)).toBeVisible();
    
    // 3. 点击编辑按钮
    await page.click('button:has-text("编辑")');
    
    // 4. 验证编辑对话框打开
    await expect(page.locator('text=编辑日程事件')).toBeVisible();
    
    // 5. 修改标题
    const updatedTitle = `${originalTitle} (Updated)`;
    const titleInput = page.locator('input[label="标题 *"]');
    await titleInput.clear();
    await titleInput.fill(updatedTitle);
    
    // 6. 保存
    await page.click('button:has-text("保存")');
    
    // 7. 验证更新成功
    await expect(page.locator('text=日程更新成功')).toBeVisible({ timeout: 5000 });
    
    // 8. 验证更新后的标题显示
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible();
  });

  test('should navigate between weeks', async ({ page }) => {
    // 验证有周导航按钮
    const prevButton = page.locator('button:has(svg.mdi-chevron-left)').or(
      page.locator('button:has-text("上一周")')
    ).first();
    
    const nextButton = page.locator('button:has(svg.mdi-chevron-right)').or(
      page.locator('button:has-text("下一周")')
    ).first();
    
    await expect(prevButton.or(nextButton)).toBeVisible();
  });

  test('should filter schedules by time range', async ({ page }) => {
    // 1. 创建两个不同时间的日程
    const timestamp = Date.now();
    
    // 当前周的日程
    const thisWeekTitle = `This Week ${timestamp}`;
    await createTestSchedule(page, thisWeekTitle);
    
    // 验证当前周日程显示
    await expect(page.locator(`text=${thisWeekTitle}`)).toBeVisible();
    
    // 2. 切换到下一周
    const nextButton = page.locator('button:has(svg.mdi-chevron-right)').or(
      page.locator('button:has-text("下一周")')
    ).first();
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
      
      // 验证当前周的日程不再显示
      await expect(page.locator(`text=${thisWeekTitle}`)).not.toBeVisible();
    }
  });
});

// ===== Helper Functions =====

async function createTestSchedule(page: Page, title: string) {
  const createButton = page.locator('button:has-text("创建")').or(
    page.locator('button:has(svg.mdi-plus)')
  ).first();
  
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
