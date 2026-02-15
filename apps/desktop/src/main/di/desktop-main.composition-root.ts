/**
 * Desktop Main Process - Composition Root
 *
 * Configures Dependency Injection (DI) for the main process.
 * Phase 4: Integration & Wiring - Wire up Editor, Repository, Goal, Task, Reminder, and Notification modules.
 *
 * Responsibilities:
 * 1. Initialize repository adapters (File System Storage).
 * 2. Instantiate domain services (Policies and Calculators).
 * 3. Register repositories and services to their respective modules.
 * 4. Wire up module dependencies (e.g., Editor depends on Repository).
 *
 * @module di/desktop-main
 */

// Import repositories and containers from individual packages
// Goal
import { 
  SqliteGoalRepository,
  SqliteGoalFolderRepository,
  SqliteFocusModeRepository,
  SqliteFocusSessionRepository,
  SqliteWeightSnapshotRepository,
} from '@dailyuse/goal/infrastructure-server';
import { SqliteGoalRecordRepository } from '@dailyuse/goal/infrastructure-server';
import { GoalPolicy, GoalProgressCalculator } from '@dailyuse/goal/domain-server';

// Task
import { 
  TaskContainer,
  SqliteTaskInstanceRepository,
  SqliteTaskTemplateRepository,
  SqliteTaskDependencyRepository,
} from '@dailyuse/task/infrastructure-server';
import { TaskDependencyPolicy, TaskStatisticsCalculator } from '@dailyuse/task/domain-server';

// Editor
import { EditorContainer } from '@dailyuse/editor/infrastructure-server';
import { EditorSessionApplicationService } from '@dailyuse/editor/application-server';

// Repository
import { RepositoryContainer } from '@dailyuse/repository/infrastructure-server';
import { 
  SqliteRepositoryRepository,
  SqliteResourceRepository,
  SqliteFolderRepository,
} from '@dailyuse/repository/infrastructure-server';

// Reminder
import { ReminderPolicy, ReminderRecurrenceCalculator } from '@dailyuse/reminder/domain-server';

// Notification
import { NotificationPolicy } from '@dailyuse/notification/domain-server';

// Authentication
import { AuthenticationContainer } from '@dailyuse/authentication/infrastructure-server';

// Adapters from desktop app
import { FileSystemStorageAdapter } from '../modules/repository/infrastructure/FileSystemStorageAdapter';
import { RepositoryContentAdapter } from '../modules/editor/infrastructure/RepositoryContentAdapter';

/**
 * Configures dependency injection for requested modules only.
 * 
 * Phase 4 Integration: Wire up Goal, Task, Editor, Reminder, and Notification modules.
 */
export function configureMainProcessDependencies(): void {
  const startTime = performance.now();
  console.log('[DI] Configuring main process dependencies...');

  // Configure core modules
  configureRepositoryModule(); // Must be first, as Editor depends on it
  configureEditorModule();
  configureGoalModule();
  configureTaskModule();
  configureReminderModule();
  configureNotificationModule();

  const coreLoadTime = performance.now() - startTime;
  console.log(`[DI] Core modules loaded in ${coreLoadTime.toFixed(2)}ms`);

  console.log('[DI] Main process dependencies configured successfully');
}

/**
 * Configures dependencies for the Repository module.
 * Must be configured first as Editor module depends on it.
 */
function configureRepositoryModule(): void {
  const repositoryRepository = new SqliteRepositoryRepository();
  const resourceRepository = new SqliteResourceRepository();
  const folderRepository = new SqliteFolderRepository();

  // Create storage adapter for file operations
  const storageAdapter = new FileSystemStorageAdapter();

  RepositoryContainer.getInstance()
    .registerRepositoryRepository(repositoryRepository)
    .registerResourceRepository(resourceRepository)
    .registerFolderRepository(folderRepository);

  // Store storage adapter for Editor module to access
  (RepositoryContainer.getInstance() as any)._storageAdapter = storageAdapter;

  console.log('[DI] Repository module configured');
}

/**
 * Configures dependencies for the Editor module.
 */
function configureEditorModule(): void {
  // Get Repository dependencies
  const repositoryContainer = RepositoryContainer.getInstance();
  const resourceRepository = repositoryContainer.getResourceRepository();
  const repositoryRepository = repositoryContainer.getRepositoryRepository();
  const storageAdapter = (repositoryContainer as any)._storageAdapter;

  if (!storageAdapter) {
    throw new Error('Storage adapter not found. Configure Repository module first.');
  }

  // Create the content adapter that bridges Editor to Repository
  const repositoryContentAdapter = new RepositoryContentAdapter(
    resourceRepository,
    repositoryRepository,
    storageAdapter,
  );

  // Store for use by application services
  (EditorContainer.getInstance() as any)._repositoryContentAdapter = repositoryContentAdapter;

  console.log('[DI] Editor module configured');
}

/**
 * Configures dependencies for the Goal module.
 * Injects GoalPolicy and GoalProgressCalculator into application services.
 */
function configureGoalModule(): void {
  const goalRepository = new SqliteGoalRepository();
  const goalFolderRepository = new SqliteGoalFolderRepository();
  const goalRecordRepository = new SqliteGoalRecordRepository();

  // Create domain services
  const goalPolicy = new GoalPolicy();
  const goalProgressCalculator = new GoalProgressCalculator(goalRecordRepository);

  // Note: Actual Goal application services would be instantiated here
  // For now, just storing the repositories and services for retrieval
  // TODO: Create a proper GoalContainer that can store policies and calculators
  const goalContainer = {
    goalRepository,
    goalFolderRepository,
    goalRecordRepository,
    goalPolicy,
    goalProgressCalculator,
  };
  (global as any)._goalContainer = goalContainer;

  console.log('[DI] Goal module configured');
}

/**
 * Configures dependencies for the Task module.
 * Injects TaskDependencyPolicy and TaskStatisticsCalculator into application services.
 */
function configureTaskModule(): void {
  const templateRepository = new SqliteTaskTemplateRepository();
  const instanceRepository = new SqliteTaskInstanceRepository();
  const dependencyRepository = new SqliteTaskDependencyRepository();

  // Create domain services
  const taskDependencyPolicy = new TaskDependencyPolicy();
  const taskStatisticsCalculator = new TaskStatisticsCalculator();

  TaskContainer.getInstance()
    .setTaskTemplateRepository(templateRepository)
    .setTaskInstanceRepository(instanceRepository)
    .setTaskDependencyRepository(dependencyRepository);

  // Store policies for use by application services
  (TaskContainer.getInstance() as any)._taskDependencyPolicy = taskDependencyPolicy;
  (TaskContainer.getInstance() as any)._taskStatisticsCalculator = taskStatisticsCalculator;

  console.log('[DI] Task module configured');
}

/**
 * Configures dependencies for the Reminder module.
 * Injects ReminderPolicy and ReminderRecurrenceCalculator into application services.
 */
function configureReminderModule(): void {
  // Create domain services
  const reminderPolicy = new ReminderPolicy();
  const reminderRecurrenceCalculator = new ReminderRecurrenceCalculator();

  // Store for use by application services
  const reminderContainer = {
    reminderPolicy,
    reminderRecurrenceCalculator,
  };
  (global as any)._reminderContainer = reminderContainer;

  console.log('[DI] Reminder module configured');
}

/**
 * Configures dependencies for the Notification module.
 * Injects NotificationPolicy into application services.
 */
function configureNotificationModule(): void {
  // Create domain services
  const notificationPolicy = new NotificationPolicy();

  // Store for use by application services
  const notificationContainer = {
    notificationPolicy,
  };
  (global as any)._notificationContainer = notificationContainer;

  console.log('[DI] Notification module configured');
}

/**
 * Resets all configured containers.
 * Use this primarily for testing purposes to ensure a clean state between tests.
 */
export function resetAllContainers(): void {
  TaskContainer.getInstance().reset();
  EditorContainer.getInstance().reset();
  RepositoryContainer.getInstance().clear();
  // Clear global containers
  (global as any)._goalContainer = null;
  (global as any)._reminderContainer = null;
  (global as any)._notificationContainer = null;
  console.log('[DI] All containers reset');
}

/**
 * Checks if the Dependency Injection system is configured.
 *
 * @returns {boolean} True if core containers are configured.
 */
export function isDIConfigured(): boolean {
  return RepositoryContainer.getInstance().isConfigured();
}
