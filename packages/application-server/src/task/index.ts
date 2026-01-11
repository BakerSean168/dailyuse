/**
 * Task Application Module (Server)
 *
 * 提供 Task 模块的所有 Services
 * 
 * 类型定义请从 @dailyuse/contracts/task 导入
 */

// ===== Container (from infrastructure-server) =====
export { TaskContainer } from '@dailyuse/infrastructure-server';

// ===== Services =====
export {
  // Task Template Services
  CreateTaskTemplate,
  GetTaskTemplate,
  ListTaskTemplates,
  ActivateTaskTemplate,
  PauseTaskTemplate,
  DeleteTaskTemplate,
  // Task Instance Services
  CompleteTaskInstance,
  SkipTaskInstance,
  GetTaskInstancesByDateRange,
  // Dashboard Services
  GetTaskDashboard,
} from './services';
