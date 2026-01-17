/**
 * Task Application Services Index
 *
 * 导出所有 Task 模块的 Application Services（编排复杂业务流程）
 * 
 * 单一职责的 Use Cases 请从 '../usecases' 导入
 * 类型定义请从 @dailyuse/contracts/task 导入
 */

// ===== Application Services (Orchestration) =====
export { TaskInstanceApplicationService } from './task-instance-application.service';
export { TaskTemplateApplicationService } from './task-template-application.service';
export { TaskStatisticsApplicationService } from './task-statistics-application.service';
export { TaskDependencyApplicationService } from './task-dependency-application.service';
