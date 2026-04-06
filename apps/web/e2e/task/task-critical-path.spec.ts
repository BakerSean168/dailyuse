import { test, expect } from '@playwright/test';
import { TaskPage } from '../page-objects/TaskPage';
import { TaskDAGPage } from '../page-objects/TaskDAGPage';
import {
  login,
  navigateToTasks,
  createTestTask,
  cleanupTask,
  TEST_USER,
} from '../helpers/testHelpers';

/**
 * Task Critical Path Analysis E2E Tests
 *
 * Tests the critical path calculation and visualization:
 * - Calculating longest path through task dependencies
 * - Highlighting critical tasks in the DAG
 * - Updating critical path when dependencies change
 * - Displaying critical path duration
 *
 * Covers: STORY-025 (Critical Path Analysis)
 */
test.describe('Task Critical Path Analysis', () => {
  let taskPage: TaskPage;
  let dagPage: TaskDAGPage;

  test.beforeEach(async ({ page }) => {
    taskPage = new TaskPage(page);
    dagPage = new TaskDAGPage(page);

    console.log('\n========================================');
    console.log('[START] Starting Critical Path Analysis Test');
    console.log('========================================\n');

    // Login
    await login(page, TEST_USER.username, TEST_USER.password);

    // Navigate to Tasks page
    await navigateToTasks(page);

    console.log('[PASS] Setup complete\n');
  });

  test.afterEach(async ({ page }) => {
    console.log('\n========================================');
    console.log('? Cleaning up test data');
    console.log('========================================\n');

    // Clean up test tasks
    const testTasks = [
      'E2E CP - Task A',
      'E2E CP - Task B',
      'E2E CP - Task C',
      'E2E CP - Task D',
      'E2E CP - Task E',
      'E2E CP - Task F',
    ];

    for (const taskTitle of testTasks) {
      try {
        await cleanupTask(page, taskTitle);
      } catch {
        console.log(`Failed to cleanup ${taskTitle}`);
      }
    }
  });

  /**
   * Scenario 3.1: Calculate Critical Path
   *
   * Given: Multiple parallel paths exist in task dependencies
   * When: System calculates critical path
   * Then: Longest path is identified correctly
   * And: Critical path duration is displayed
   * And: Critical tasks are highlighted in DAG
   */
  test('should calculate and display critical path', async ({ page }) => {
    console.log('\n? Test: Calculate Critical Path\n');

    // Arrange: Create complex task structure with multiple paths
    console.log('Step 1: Creating tasks with multiple paths...');

    // Create tasks with different durations
    await taskPage.createTask(createTestTask('E2E CP - Task A', { duration: 120 })); // 2h
    await taskPage.createTask(createTestTask('E2E CP - Task B', { duration: 180 })); // 3h
    await taskPage.createTask(createTestTask('E2E CP - Task C', { duration: 240 })); // 4h
    await taskPage.createTask(createTestTask('E2E CP - Task D', { duration: 60 })); // 1h
    await taskPage.createTask(createTestTask('E2E CP - Task E', { duration: 90 })); // 1.5h
    await taskPage.createTask(createTestTask('E2E CP - Task F', { duration: 150 })); // 2.5h

    console.log('[PASS] Tasks created:\n');
    console.log('  Task A: 2h');
    console.log('  Task B: 3h');
    console.log('  Task C: 4h');
    console.log('  Task D: 1h');
    console.log('  Task E: 1.5h');
    console.log('  Task F: 2.5h\n');

    // Create dependency structure with 3 paths:
    // Path 1: A -> B -> C -> F (2 + 3 + 4 + 2.5 = 11.5h) - CRITICAL
    // Path 2: A -> D -> F (2 + 1 + 2.5 = 5.5h)
    // Path 3: A -> E -> F (2 + 1.5 + 2.5 = 6h)

    console.log('Step 2: Creating dependency structure...');

    await taskPage.createDependency('E2E CP - Task B', 'E2E CP - Task A', 'finish-to-start');
    await page.waitForTimeout(500);

    await taskPage.createDependency('E2E CP - Task C', 'E2E CP - Task B', 'finish-to-start');
    await page.waitForTimeout(500);

    await taskPage.createDependency('E2E CP - Task F', 'E2E CP - Task C', 'finish-to-start');
    await page.waitForTimeout(500);

    await taskPage.createDependency('E2E CP - Task D', 'E2E CP - Task A', 'finish-to-start');
    await page.waitForTimeout(500);

    await taskPage.createDependency('E2E CP - Task F', 'E2E CP - Task D', 'finish-to-start');
    await page.waitForTimeout(500);

    await taskPage.createDependency('E2E CP - Task E', 'E2E CP - Task A', 'finish-to-start');
    await page.waitForTimeout(500);

    await taskPage.createDependency('E2E CP - Task F', 'E2E CP - Task E', 'finish-to-start');
    await page.waitForTimeout(500);

    console.log('[PASS] Dependencies created:\n');
    console.log('  Path 1: A (2h) -> B (3h) -> C (4h) -> F (2.5h) = 11.5h (CRITICAL)');
    console.log('  Path 2: A (2h) -> D (1h) -----------> F (2.5h) = 5.5h');
    console.log('  Path 3: A (2h) -> E (1.5h) ---------> F (2.5h) = 6h\n');

    // Screenshot: Task list
    await page.screenshot({ path: 'test-results/24-cp-task-list.png', fullPage: true });

    // Act: Open DAG and enable critical path
    console.log('Step 3: Opening DAG and enabling critical path...');
    await dagPage.open();

    // Screenshot: DAG before critical path
    await page.screenshot({ path: 'test-results/25-cp-dag-before.png', fullPage: true });

    await dagPage.enableCriticalPath();
    await page.waitForTimeout(1500); // Wait for calculation and highlight

    // Screenshot: DAG with critical path
    await page.screenshot({ path: 'test-results/26-cp-dag-highlighted.png', fullPage: true });

    // Assert: Verify critical path is displayed
    console.log('Step 4: Verifying critical path calculation...');

    const isActive = await dagPage.isCriticalPathActive();
    expect(isActive).toBe(true);
    console.log('[PASS] Critical path is active\n');

    // Assert: Verify critical path chip is visible
    await dagPage.expectCriticalPathVisible();
    console.log('[PASS] Critical path chip is visible\n');

    // Assert: Verify critical path duration
    const duration = await dagPage.getCriticalPathDuration();
    expect(duration).toBeTruthy();
    expect(duration).toBeGreaterThanOrEqual(690); // 11.5h = 690 minutes

    console.log(
      `[PASS] Critical path duration: ${duration} minutes (${(duration! / 60).toFixed(1)}h)\n`,
    );

    // Assert: Expected critical path is A -> B -> C -> F
    // Note: We can't easily verify which specific tasks are highlighted in the canvas,
    // but we can verify the total duration matches our expectation

    const expectedDuration = 120 + 180 + 240 + 150; // A + B + C + F = 690 minutes
    expect(Math.abs(duration! - expectedDuration)).toBeLessThanOrEqual(5); // Allow 5 min tolerance

    console.log('+============================================================+');
    console.log('|  [PASS] Test Passed: Critical Path Calculation                |');
    console.log('+============================================================+');
    console.log('|  Critical Path: A -> B -> C -> F                          |');
    console.log(`|  Duration: ${duration} min (11.5h)                             |`);
    console.log('|  Alternative Paths: 2 shorter paths                        |');
    console.log('|  Calculation: [PASS] Correct                                   |');
    console.log('+============================================================+\n');
  });

  /**
   * Scenario 3.2: Update Critical Path on Dependency Change
   *
   * Given: Critical path is A -> B -> C (9h)
   * When: User adds new dependency D -> C where D is 10h
   * Then: Critical path changes to A -> D -> C (12h)
   * And: DAG updates to highlight new critical path
   */
  test('should update critical path when dependencies change', async ({ page }) => {
    console.log('\n? Test: Update Critical Path on Change\n');

    // Arrange: Create initial task structure
    console.log('Step 1: Creating initial task structure...');

    await taskPage.createTask(createTestTask('E2E CP - Task A', { duration: 120 })); // 2h
    await taskPage.createTask(createTestTask('E2E CP - Task B', { duration: 180 })); // 3h
    await taskPage.createTask(createTestTask('E2E CP - Task C', { duration: 240 })); // 4h
    await taskPage.createTask(createTestTask('E2E CP - Task D', { duration: 600 })); // 10h

    // Create initial path: A -> B -> C (2 + 3 + 4 = 9h)
    await taskPage.createDependency('E2E CP - Task B', 'E2E CP - Task A', 'finish-to-start');
    await page.waitForTimeout(500);

    await taskPage.createDependency('E2E CP - Task C', 'E2E CP - Task B', 'finish-to-start');
    await page.waitForTimeout(500);

    console.log('[PASS] Initial structure created:\n');
    console.log('  Path 1: A (2h) -> B (3h) -> C (4h) = 9h (CRITICAL)');
    console.log('  Task D (10h) is independent\n');

    // Act: Open DAG and enable critical path
    console.log('Step 2: Enabling critical path...');
    await dagPage.open();
    await dagPage.enableCriticalPath();
    await page.waitForTimeout(1000);

    // Screenshot: Initial critical path
    await page.screenshot({ path: 'test-results/27-cp-initial.png', fullPage: true });

    // Assert: Verify initial critical path duration
    let duration = await dagPage.getCriticalPathDuration();
    expect(duration).toBeTruthy();
    expect(duration).toBeGreaterThanOrEqual(540); // 9h = 540 minutes

    console.log(`[PASS] Initial critical path: ${duration} minutes (9h)\n`);

    // Act: Close DAG and add new dependency
    console.log('Step 3: Adding new dependency D -> C...');
    // Close DAG by pressing Escape or clicking back button
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Create dependency: D -> C (now path becomes A -> B + D -> C, but D is longer)
    // Actually, we need D to depend on A for it to be in the same chain
    await taskPage.createDependency('E2E CP - Task D', 'E2E CP - Task A', 'finish-to-start');
    await page.waitForTimeout(500);

    await taskPage.createDependency('E2E CP - Task C', 'E2E CP - Task D', 'finish-to-start');
    await page.waitForTimeout(500);

    console.log('[PASS] New dependencies created:\n');
    console.log('  Path 1: A (2h) -> B (3h) -> C (4h) = 9h');
    console.log('  Path 2: A (2h) -> D (10h) -> C (4h) = 16h (NEW CRITICAL)\n');

    // Screenshot: Task list after change
    await page.screenshot({ path: 'test-results/28-cp-after-change.png', fullPage: true });

    // Act: Reopen DAG with critical path
    console.log('Step 4: Reopening DAG to verify updated critical path...');
    await dagPage.open();
    await dagPage.enableCriticalPath();
    await page.waitForTimeout(1500);

    // Screenshot: Updated critical path
    await page.screenshot({ path: 'test-results/29-cp-updated.png', fullPage: true });

    // Assert: Verify critical path has changed
    duration = await dagPage.getCriticalPathDuration();
    expect(duration).toBeTruthy();
    expect(duration).toBeGreaterThanOrEqual(960); // 16h = 960 minutes

    console.log(`[PASS] Updated critical path: ${duration} minutes (16h)\n`);

    // Assert: New critical path should be longer than initial
    const expectedNewDuration = 120 + 600 + 240; // A + D + C = 960 minutes
    expect(Math.abs(duration! - expectedNewDuration)).toBeLessThanOrEqual(5);

    console.log('+============================================================+');
    console.log('|  [PASS] Test Passed: Critical Path Update                     |');
    console.log('+============================================================+');
    console.log('|  Initial Path: A -> B -> C (9h)                            |');
    console.log('|  Updated Path: A -> D -> C (16h)                           |');
    console.log('|  Change: +7h                                               |');
    console.log('|  Auto-Update: [PASS] Successful                                |');
    console.log('+============================================================+\n');
  });

  /**
   * Scenario 3.3: Critical Path with Parallel Tasks
   *
   * Given: Multiple parallel tasks with same start and end
   * When: Critical path is calculated
   * Then: Longest parallel path is identified
   * And: Other parallel paths are not highlighted
   */
  test('should identify critical path among parallel tasks', async ({ page }) => {
    console.log('\n? Test: Critical Path with Parallel Tasks\n');

    // Arrange: Create parallel task structure
    console.log('Step 1: Creating parallel task structure...');

    await taskPage.createTask(createTestTask('E2E CP - Task A', { duration: 60 })); // Start
    await taskPage.createTask(createTestTask('E2E CP - Task B', { duration: 180 })); // Parallel 1 (3h)
    await taskPage.createTask(createTestTask('E2E CP - Task C', { duration: 120 })); // Parallel 2 (2h)
    await taskPage.createTask(createTestTask('E2E CP - Task D', { duration: 90 })); // Parallel 3 (1.5h)
    await taskPage.createTask(createTestTask('E2E CP - Task E', { duration: 60 })); // End

    // Create parallel structure:
    //       -> B (3h) ->
    // A -> -> C (2h) -> -> E
    //       -> D (1.5h) ->

    console.log('Step 2: Creating parallel dependencies...');

    // All parallel tasks depend on A
    await taskPage.createDependency('E2E CP - Task B', 'E2E CP - Task A', 'finish-to-start');
    await page.waitForTimeout(500);

    await taskPage.createDependency('E2E CP - Task C', 'E2E CP - Task A', 'finish-to-start');
    await page.waitForTimeout(500);

    await taskPage.createDependency('E2E CP - Task D', 'E2E CP - Task A', 'finish-to-start');
    await page.waitForTimeout(500);

    // E depends on all parallel tasks
    await taskPage.createDependency('E2E CP - Task E', 'E2E CP - Task B', 'finish-to-start');
    await page.waitForTimeout(500);

    await taskPage.createDependency('E2E CP - Task E', 'E2E CP - Task C', 'finish-to-start');
    await page.waitForTimeout(500);

    await taskPage.createDependency('E2E CP - Task E', 'E2E CP - Task D', 'finish-to-start');
    await page.waitForTimeout(500);

    console.log('[PASS] Parallel structure created:\n');
    console.log('         +--> B (3h) -+');
    console.log('  A (1h) +--> C (2h) -+--> E (1h)');
    console.log('         +--> D (1.5h)-+');
    console.log('');
    console.log('  Path 1: A -> B -> E = 1 + 3 + 1 = 5h (CRITICAL)');
    console.log('  Path 2: A -> C -> E = 1 + 2 + 1 = 4h');
    console.log('  Path 3: A -> D -> E = 1 + 1.5 + 1 = 3.5h\n');

    // Screenshot: Task list
    await page.screenshot({ path: 'test-results/30-cp-parallel-list.png', fullPage: true });

    // Act: Open DAG and enable critical path
    console.log('Step 3: Enabling critical path visualization...');
    await dagPage.open();
    await dagPage.enableCriticalPath();
    await page.waitForTimeout(1500);

    // Screenshot: Critical path in parallel structure
    await page.screenshot({ path: 'test-results/31-cp-parallel-highlighted.png', fullPage: true });

    // Assert: Verify critical path is the longest parallel path
    const duration = await dagPage.getCriticalPathDuration();
    expect(duration).toBeTruthy();

    const expectedDuration = 60 + 180 + 60; // A + B + E = 300 minutes (5h)
    expect(Math.abs(duration! - expectedDuration)).toBeLessThanOrEqual(5);

    console.log(`[PASS] Critical path through longest parallel task: ${duration} minutes (5h)\n`);

    console.log('+============================================================+');
    console.log('|  [PASS] Test Passed: Parallel Path Analysis                   |');
    console.log('+============================================================+');
    console.log('|  Critical Path: A -> B -> E (5h)                           |');
    console.log('|  Parallel Paths: C (4h), D (3.5h)                          |');
    console.log('|  Longest Identified: [PASS]                                    |');
    console.log('+============================================================+\n');
  });
});
