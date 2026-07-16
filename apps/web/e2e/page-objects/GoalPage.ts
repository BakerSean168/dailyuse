/**
 * Goal 页面对象模型 (Page Object Model)
 * 封装 Goal 页面的操作和元素定位
 */

import { Page, Locator, expect } from '@playwright/test';

export class GoalPage {
  readonly page: Page;

  // 页面元素
  readonly createGoalButton: Locator;
  readonly goalListContainer: Locator;
  readonly filterButton: Locator;
  readonly searchInput: Locator;

  // 对话框元素
  readonly goalDialog: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // 初始化定位器
    this.createGoalButton = page.getByTestId('create-goal-entry');

    this.goalListContainer = page.locator('[data-testid="goal-list"]').or(page.locator('.goal-list'));

    this.filterButton = page.locator('button:has-text("筛选")').or(page.locator('[data-testid="filter-button"]'));

    this.searchInput = page.locator('input[placeholder*="搜索"]').or(page.locator('[data-testid="search-input"]'));

    // 对话框元素
    this.goalDialog = page.locator('[role="dialog"]').or(page.locator('.v-dialog'));

    this.nameInput = page
      .locator('input[placeholder="一段话来描述自己的目标"]')
      .or(page.locator('[data-testid="goal-name-input"]'));

    this.descriptionInput = page
      .locator('textarea[name="description"]')
      .or(page.locator('[data-testid="goal-description-input"]'));

    this.saveButton = page
      .locator('button:has-text("保存")')
      .or(page.locator('[data-testid="save-goal-button"]'));

    this.cancelButton = page
      .locator('button:has-text("取消")')
      .or(page.locator('[data-testid="cancel-button"]'));
  }

  // ========== 导航方法 ==========

  /**
   * 导航到 Goal 页面
   */
  async navigate() {
    await this.page.goto('/goals', { waitUntil: 'domcontentloaded' });
    await this.waitForPageLoad();
  }

  /**
   * 等待页面加载完成
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    // 等待页面标题或关键元素出现
    await this.page.waitForTimeout(1000);
  }

  // ========== 创建操作 ==========

  /**
   * 创建新目标
   */
  async createGoal(data: {
    name: string;
    description?: string;
    importance?: string;
    deadline?: string;
  }) {
    console.log(`[GoalPage] 创建目标: ${data.name}`);

    // 点击创建按钮
    await this.createGoalButton.click();

    // 等待对话框打开
    await this.goalDialog.waitFor({ state: 'visible', timeout: 5000 });

    // 填写表单
    await this.nameInput.fill(data.name);

    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }

    // 点击保存
    await this.saveButton.click();

    // 等待对话框关闭
    await this.goalDialog.waitFor({ state: 'hidden', timeout: 5000 });

    // 等待数据加载
    await this.page.waitForTimeout(1000);

    console.log(`[GoalPage] 目标创建成功: ${data.name}`);
  }

  // ========== 查询操作 ==========

  /**
   * 根据名称查找目标卡片
   */
  getGoalCardByName(name: string): Locator {
    return this.page.locator(`text=${name}`).locator('..');
  }

  /**
   * 验证目标存在
   */
  async expectGoalToExist(name: string, timeout: number = 10000) {
    await expect(this.page.locator(`text=${name}`)).toBeVisible({ timeout });
  }

  /**
   * 验证目标不存在
   */
  async expectGoalNotToExist(name: string) {
    await expect(this.page.locator(`text=${name}`)).not.toBeVisible();
  }

  // ========== 编辑操作 ==========

  /**
   * 编辑目标
   */
  async editGoal(
    goalName: string,
    updates: {
      name?: string;
      description?: string;
    },
  ) {
    console.log(`[GoalPage] 编辑目标: ${goalName}`);

    const goalCard = this.getGoalCardByName(goalName);
    await goalCard.hover();

    // 查找编辑按钮
    const editButton = goalCard
      .locator('button[title*="编辑"]')
      .or(this.page.locator('button:has-text("编辑")').first());

    await editButton.click();

    // 等待对话框
    await this.goalDialog.waitFor({ state: 'visible', timeout: 5000 });

    // 更新字段
    if (updates.name) {
      await this.nameInput.clear();
      await this.nameInput.fill(updates.name);
    }

    if (updates.description) {
      await this.descriptionInput.clear();
      await this.descriptionInput.fill(updates.description);
    }

    // 保存
    await this.saveButton.click();
    await this.goalDialog.waitFor({ state: 'hidden', timeout: 5000 });
    await this.page.waitForTimeout(1000);

    console.log(`[GoalPage] 目标编辑完成`);
  }

  // ========== 删除操作 ==========

  /**
   * 删除目标
   */
  async deleteGoal(goalName: string) {
    console.log(`[GoalPage] 删除目标: ${goalName}`);

    const goalCard = this.getGoalCardByName(goalName);
    await goalCard.hover();

    // 点击删除按钮
    const deleteButton = goalCard
      .locator('button[title*="删除"]')
      .or(this.page.locator('button:has-text("删除")').first());

    await deleteButton.click();

    // 确认删除
    await this.page.waitForTimeout(500);
    const confirmButton = this.page.locator('button:has-text("确认")');

    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await this.page.waitForTimeout(1000);

    console.log(`[GoalPage] 目标删除完成`);
  }

  // ========== 状态操作 ==========

  /**
   * 激活目标
   */
  async activateGoal(goalName: string) {
    console.log(`[GoalPage] 激活目标: ${goalName}`);

    const goalCard = this.getGoalCardByName(goalName);
    await goalCard.hover();

    const activateButton = goalCard.locator('button[title*="激活"]');

    if (await activateButton.isVisible()) {
      await activateButton.click();
      await this.page.waitForTimeout(1000);
    }

    console.log(`[GoalPage] 目标激活完成`);
  }

  /**
   * 完成目标
   */
  async completeGoal(goalName: string) {
    console.log(`[GoalPage] 完成目标: ${goalName}`);

    const goalCard = this.getGoalCardByName(goalName);
    await goalCard.hover();

    const completeButton = goalCard.locator('button[title*="完成"]');

    if (await completeButton.isVisible()) {
      await completeButton.click();
      await this.page.waitForTimeout(1000);
    }

    console.log(`[GoalPage] 目标完成`);
  }

  // ========== 筛选和搜索 ==========

  /**
   * 应用筛选
   */
  async applyFilter(filterType: string, value: string) {
    console.log(`[GoalPage] 应用筛选: ${filterType} = ${value}`);

    await this.filterButton.click();
    await this.page.waitForTimeout(500);

    const option = this.page.locator(`text=${value}`);
    await option.click();

    await this.page.waitForTimeout(1000);

    console.log(`[GoalPage] 筛选应用完成`);
  }

  /**
   * 搜索目标
   */
  async search(query: string) {
    console.log(`[GoalPage] 搜索: ${query}`);

    await this.searchInput.fill(query);
    await this.page.waitForTimeout(1000);

    console.log(`[GoalPage] 搜索完成`);
  }

  // ========== 清理操作 ==========

  /**
   * 清理测试数据
   */
  async cleanupTestGoals() {
    console.log('[GoalPage] 清理测试数据');

    try {
      const testGoals = this.page.locator('text=/E2E/i');
      const count = await testGoals.count();

      for (let i = 0; i < count; i++) {
        try {
          const goal = testGoals.nth(i);
          const title = await goal.textContent();
          if (title && title.includes('E2E')) {
            await this.deleteGoal(title);
          }
        } catch (error) {
          console.warn(`清理目标失败: ${error}`);
        }
      }

      console.log(`[GoalPage] 清理了 ${count} 个测试目标`);
    } catch (error) {
      console.warn('[GoalPage] 清理测试数据时出错:', error);
    }
  }
}
