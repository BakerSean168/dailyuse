/**
 * Task transport handler mapping.
 * 任务模块传输层处理器映射。
 *
 * This file converts the module facade into the function signatures required by
 * controllers. It is shared by HTTP and Electron transports so the mapping is
 * defined once.
 *
 * 这个文件把模块门面转换成控制器所需的函数签名。
 * HTTP 和 Electron 共用这一层，避免重复定义同样的 handler 映射。
 */

import type { TaskTemplateUseCases } from '../controllers/task-template.controller';
import type { TaskInstanceUseCases } from '../controllers/task-instance.controller';
import type { TaskDependencyUseCases } from '../controllers/task-dependency.controller';
import type { TaskApplicationPort } from '../infrastructure-server/task.module';

/**
 * All controller use-case interfaces grouped together.
 * 所有控制器用例接口的统一分组。
 */
export interface TaskTransportHandlers {
  readonly template: TaskTemplateUseCases;
  readonly instance: TaskInstanceUseCases;
  readonly dependency: TaskDependencyUseCases;
}

/**
 * Creates transport handlers from the module application port.
 * 从模块应用端口创建传输层处理器。
 *
 * This is intentionally boring — it maps the flat module API to the
 * controller-specific use-case interfaces.
 *
 * 这层映射故意做得"无聊" — 把扁平的模块 API 映射到控制器专用的用例接口。
 */
export function createTaskTransportHandlers(api: TaskApplicationPort): TaskTransportHandlers {
  return {
    template: {
      createTemplate: api.createTaskTemplate,
      getTemplate: api.getTaskTemplate,
      listTemplates: api.listTaskTemplates,
      getTaskGraph: api.getTaskTemplateGraph,
      updateTemplate: api.updateTaskTemplate,
      deleteTemplate: api.deleteTaskTemplate,
      activateTemplate: api.activateTaskTemplate,
      pauseTemplate: api.pauseTaskTemplate,
      archiveTemplate: api.archiveTaskTemplate,
      listByPriority: api.listTaskTemplatesByPriority,
      generateInstances: api.generateTaskInstances,
      bindToGoal: api.bindTaskToGoal,
      unbindFromGoal: api.unbindTaskFromGoal,
      listInstancesByTemplate: api.listTaskInstancesByTemplate,
    },
    instance: {
      getTaskInstance: api.getTaskInstance,
      listByAccount: api.listTaskInstancesByAccount,
      listByTemplate: api.listTaskInstancesByTemplate,
      listByStatus: api.listTaskInstancesByStatus,
      getByDateRange: api.getTaskInstancesByDateRange,
      complete: api.completeTaskInstance,
      skip: api.skipTaskInstance,
      start: api.startTaskInstance,
      deleteInstance: api.deleteTaskInstance,
      checkExpired: api.checkExpiredInstances,
    },
    dependency: {
      createDependency: api.createTaskDependency,
      deleteDependency: api.deleteTaskDependency,
      updateDependency: api.updateTaskDependency,
      getDependencies: api.listTaskDependencies,
      getDependents: api.listTaskDependents,
      getDependencyChain: api.getDependencyChain,
      validateDependency: api.validateTaskDependency,
    },
  };
}
