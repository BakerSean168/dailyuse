import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Task List and Task Detail pages
 * Provides methods for interacting with tasks and task dependencies
 */
export class TaskPage {
  readonly page: Page;

  // Locators
  readonly createTaskButton: Locator;
  readonly taskList: Locator;
  readonly taskSearchInput: Locator;
  readonly dagVisualizationButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators - prefer data-testid for stability
    this.createTaskButton = page
      .getByTestId('create-task-button')
      .or(page.getByRole('button', { name: /创建任务|Create Task|新建/i }));
    this.taskList = page.getByTestId('task-list').or(page.locator('.task-list'));
    this.taskSearchInput = page.getByPlaceholder(/搜索任务|Search tasks/i);
    this.dagVisualizationButton = page.getByRole('button', { name: /DAG|依赖关系图/i });
  }

  // Navigation
  async goto() {
    // V2 shell: task library lives at /tasks inside the business panel
    await this.page.goto('/tasks');
    await this.page.waitForLoadState('networkidle');
    await this.page.getByTestId('business-panel').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      console.log('[TaskPage] business-panel not found; auth or shell may not be ready');
    });

    // Prefer the stable create button testid used by TaskManagementView
    const createBtn = this.page
      .getByTestId('create-task-template-button')
      .or(this.createTaskButton);
    await createBtn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      console.log('[TaskPage] Create button not found, page might need authentication or different route');
    });
  }

  // Task Card Locators
  taskCard(taskIdentifier: string | number): Locator {
    // Can search by UUID, title, or index
    if (typeof taskIdentifier === 'number') {
      return this.page.getByTestId('draggable-task-card').nth(taskIdentifier);
    }

    // Try UUID first
    const byId = this.page.locator(`[data-task-id="${taskIdentifier}"]`);
    if (byId) return byId;

    // Then try title
    return this.page.locator(`[data-testid="draggable-task-card"]:has-text("${taskIdentifier}")`);
  }

  taskCardById(id: string): Locator {
    return this.page.locator(`[data-task-id="${id}"]`);
  }

  taskCardByTitle(title: string): Locator {
    return this.page.locator(`[data-testid="draggable-task-card"]:has-text("${title}")`);
  }

  // Drag Handle
  dragHandle(taskIdentifier: string | number): Locator {
    return this.taskCard(taskIdentifier).getByTestId('drag-handle');
  }

  // Drop Zone Indicators
  dropZoneValid(taskIdentifier: string | number): Locator {
    return this.taskCard(taskIdentifier).getByTestId('drop-zone-valid');
  }

  dropZoneInvalid(taskIdentifier: string | number): Locator {
    return this.taskCard(taskIdentifier).getByTestId('drop-zone-invalid');
  }

  // Actions
  async createTask(taskData: {
    title: string;
    description?: string;
    duration?: number;
    status?: string;
  }) {
    console.log(`[TaskPage] Creating task: ${taskData.title}`);

    // Wait for button to be visible and enabled
    await this.createTaskButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.page.waitForTimeout(500);
    
    await this.createTaskButton.click();

    // Wait for dialog
    await this.page.waitForSelector('[role="dialog"], .v-dialog', { timeout: 5000 });

    // Fill title
    await this.page.fill(
      'input[name="title"], input[placeholder*="标题"], input[label*="标题"]',
      taskData.title,
    );

    // Fill description if provided
    if (taskData.description) {
      await this.page.fill(
        'textarea[name="description"], textarea[placeholder*="描述"]',
        taskData.description,
      );
    }

    // Fill duration if provided
    if (taskData.duration !== undefined) {
      await this.page.fill(
        'input[name="duration"], input[type="number"]',
        taskData.duration.toString(),
      );
    }

    // Submit
    await this.page.click(
      'button[type="submit"], button:has-text("确定"), button:has-text("保存")',
    );

    // Wait for task to appear
    await this.page.waitForTimeout(1000);

    console.log('[TaskPage] Task created successfully');
  }

  async createDependency(
    sourceTaskIdentifier: string | number,
    targetTaskIdentifier: string | number,
    dependencyType:
      | 'finish-to-start'
      | 'start-to-start'
      | 'finish-to-finish'
      | 'start-to-finish' = 'finish-to-start',
  ) {
    console.log(
      `[TaskPage] Creating dependency: ${targetTaskIdentifier} -> ${sourceTaskIdentifier}`,
    );

    // Click on target task to select
    const targetCard = this.taskCard(targetTaskIdentifier);
    await targetCard.click();

    // Click add dependency button
    await this.page.click('[data-testid="add-dependency-btn"], button:has-text("添加依赖")');

    // Wait for dependency dialog
    await this.page.waitForSelector('[role="dialog"]');

    // Select predecessor task
    const sourceTitle =
      typeof sourceTaskIdentifier === 'string'
        ? sourceTaskIdentifier
        : `Task ${sourceTaskIdentifier}`;
    await this.page.selectOption('[name="predecessorTask"], select', { label: sourceTitle });

    // Select dependency type
    await this.page.selectOption('[name="dependencyType"], select', dependencyType);

    // Save
    await this.page.click('button:has-text("保存"), button:has-text("确定")');

    // Wait for completion
    await this.page.waitForTimeout(1000);

    console.log('[TaskPage] Dependency created successfully');
  }

  async deleteDependency(sourceTask: string | number, targetTask: string | number) {
    console.log(`[TaskPage] Deleting dependency: ${targetTask} -> ${sourceTask}`);

    // Click on task with dependency
    const targetCard = this.taskCard(targetTask);
    await targetCard.click();

    // Find and click delete button for specific dependency
    await this.page.click(
      `[data-dependency="${sourceTask}->${targetTask}"] button:has-text("删除")`,
    );

    // Confirm deletion
    await this.page.click('button:has-text("确定")');

    await this.page.waitForTimeout(500);
  }

  async dragTaskTo(sourceTask: string | number, targetTask: string | number) {
    console.log(`[TaskPage] Dragging ${sourceTask} to ${targetTask}`);

    const sourceCard = this.taskCard(sourceTask);
    const targetCard = this.taskCard(targetTask);

    // Use Playwright's dragTo method
    await sourceCard.dragTo(targetCard);

    // Wait for animation and API call
    await this.page.waitForTimeout(1000);

    console.log('[TaskPage] Drag operation completed');
  }

  async searchTasks(query: string) {
    await this.taskSearchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async openDAGVisualization() {
    await this.dagVisualizationButton.click();
    await this.page.waitForSelector('[data-testid="task-dag-visualization"]', { timeout: 5000 });
  }

  // Assertions
  async expectTaskVisible(taskIdentifier: string | number) {
    const card = this.taskCard(taskIdentifier);
    await expect(card).toBeVisible();
  }

  async expectTaskNotVisible(taskIdentifier: string | number) {
    const card = this.taskCard(taskIdentifier);
    await expect(card).not.toBeVisible();
  }

  async expectTaskCount(count: number) {
    const cards = this.page.getByTestId('draggable-task-card');
    await expect(cards).toHaveCount(count);
  }

  async expectTaskStatus(taskIdentifier: string | number, status: string) {
    const card = this.taskCard(taskIdentifier);
    const statusChip = card.locator(
      `[data-status="${status}"], .status-chip:has-text("${status}")`,
    );
    await expect(statusChip).toBeVisible();
  }

  async expectDependencyExists(sourceTask: string | number, targetTask: string | number) {
    // Check in task card or open DAG to verify
    const targetCard = this.taskCard(targetTask);
    await targetCard.click();

    const sourceTitle = typeof sourceTask === 'string' ? sourceTask : `Task ${sourceTask}`;
    const dependencyIndicator = this.page.locator(`text=/依赖.*${sourceTitle}/i`);

    await expect(dependencyIndicator).toBeVisible({ timeout: 3000 });
  }

  async expectDependencyNotExists(sourceTask: string | number, targetTask: string | number) {
    const targetCard = this.taskCard(targetTask);
    await targetCard.click();

    const sourceTitle = typeof sourceTask === 'string' ? sourceTask : `Task ${sourceTask}`;
    const dependencyIndicator = this.page.locator(`text=/依赖.*${sourceTitle}/i`);

    await expect(dependencyIndicator).not.toBeVisible();
  }

  async expectValidDropZone(taskIdentifier: string | number) {
    const dropZone = this.dropZoneValid(taskIdentifier);
    await expect(dropZone).toBeVisible();
  }

  async expectInvalidDropZone(taskIdentifier: string | number) {
    const dropZone = this.dropZoneInvalid(taskIdentifier);
    await expect(dropZone).toBeVisible();
  }

  // State Checks
  async getTaskStatus(taskIdentifier: string | number): Promise<string> {
    const card = this.taskCard(taskIdentifier);
    const statusElement = card.locator('[data-status]').first();
    const status = await statusElement.getAttribute('data-status');
    return status || 'unknown';
  }

  async isTaskDragging(taskIdentifier: string | number): Promise<boolean> {
    const card = this.taskCard(taskIdentifier);
    const dragging = await card.getAttribute('data-dragging');
    return dragging === 'true';
  }

  async getTaskCount(): Promise<number> {
    const cards = this.page.getByTestId('draggable-task-card');
    return await cards.count();
  }
}
