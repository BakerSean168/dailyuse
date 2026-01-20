/**
 * API DI Container
 * 
 * Facade for accessing route handlers from the DI containers already
 * initialized in each module's initialization layer.
 * 
 * This is a simplified approach that delegates to existing containers
 * from the infrastructure-server and application-server packages.
 * 
 * @author API Integration
 * @date 2025-01-22
 */

// Route imports directly from modules (where DI is already established)
import accountRouter from './modules/account/interface/http/accountRoutes';
import authenticationRouter from './modules/authentication/interface/http/authenticationRoutes';
import taskRouter from './modules/task/interface/http/routes/index';
import goalRouter from './modules/goal/interface/http/goalRoutes';
import goalFolderRouter from './modules/goal/interface/http/goalFolderRoutes';
import weightSnapshotRouter from './modules/goal/interface/http/weightSnapshotRoutes';
import reminderRouter from './modules/reminder/interface/http/reminderRoutes';
import reminderGroupRouter from './modules/reminder/interface/http/reminderGroupRoutes';
import scheduleRouter from './modules/schedule/interface/http/routes/scheduleRoutes';
import notificationRouter from './modules/notification/interface/http/notificationRoutes';
import notificationSSERouter from './modules/notification/interface/http/sseRoutes';
import settingRouter from './modules/setting/interface/http/settingRoutes';
import editorRouter from './modules/editor/interface/http/routes/editorRoutes';
import repositoryRouter from './modules/repository/interface/http/routes/repositoryRoutes';
import metricsRouter from './modules/metrics/interface/http/routes/metricsRoutes';
import aiRouter from './modules/ai/interface/http/aiRoutes';
import dashboardRouter from './modules/dashboard/interface/routes';
import crossModuleRouter from './shared/infrastructure/http/routes/crossModuleRoutes';
import infrastructureRouter from './shared/infrastructure/http/routes/infrastructureRoutes';

/**
 * Facade container providing access to all route handlers
 * 
 * Each route is already initialized with its container during module
 * initialization phase. This object acts as a centralized access point.
 */
export const APIContainer = {
  // Account module routes
  getAccountRoutes: () => accountRouter,
  
  // Authentication module routes
  getAuthenticationRoutes: () => authenticationRouter,
  
  // Task module routes
  getTaskRoutes: () => taskRouter,
  getReminderRoutes: () => reminderRouter,
  getReminderGroupRoutes: () => reminderGroupRouter,
  getEditorRoutes: () => editorRouter,
  getDashboardRoutes: () => dashboardRouter,
  getCrossModuleRoutes: () => crossModuleRouter,
  
  // Goal module routes
  getGoalRoutes: () => goalRouter,
  getGoalFolderRoutes: () => goalFolderRouter,
  getWeightSnapshotRoutes: () => weightSnapshotRouter,
  
  // Schedule module routes
  getScheduleRoutes: () => scheduleRouter,
  
  // Notification module routes
  getNotificationRoutes: () => notificationRouter,
  getNotificationSSERoutes: () => notificationSSERouter,
  
  // Setting module routes
  getSettingRoutes: () => settingRouter,
  
  // Metrics module routes
  getMetricsRoutes: () => metricsRouter,
  
  // Repository module routes
  getRepositoryRoutes: () => repositoryRouter,
  
  // AI module routes
  getAIRoutes: () => aiRouter,
  
  // Infrastructure routes
  getInfrastructureRoutes: () => infrastructureRouter,
};

/**
 * Get the API container
 * @returns The container facade with all route accessors
 */
export function getAPIContainer() {
  return APIContainer;
}
