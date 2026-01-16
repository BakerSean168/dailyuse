import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { TaskTemplateApplicationService } from '../../../application/services/TaskTemplateApplicationService';
import { TaskQueryValidator } from '../../../application/TaskQueryValidator';
import { TaskQueryService } from '../../../application/TaskQueryService';
import { ResponseCode, createResponseBuilder } from '@dailyuse/contracts/response';
import { TaskSortBy, TaskFilterBy } from '@dailyuse/contracts/task';
import { createLogger } from '@dailyuse/utils';
import { isTaskError } from '@dailyuse/domain-server/task';

// 创建 logger 实例
const logger = createLogger('TaskTemplateController');

export class TaskTemplateController {
  private static taskTemplateService: TaskTemplateApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 获取应用服务实例（懒加载）
   */
  private static async getTaskTemplateService(): Promise<TaskTemplateApplicationService> {
    if (!TaskTemplateController.taskTemplateService) {
      TaskTemplateController.taskTemplateService =
        await TaskTemplateApplicationService.getInstance();
    }
    return TaskTemplateController.taskTemplateService;
  }

  /**
   * 从请求中提取用户账户UUID
   */
  private static extractAccountUuid(req: Request): string {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      logger.warn('Authentication attempt without Bearer token');
      throw new Error('Authentication required');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as any;

    if (!decoded?.accountUuid) {
      logger.warn('Invalid token: missing accountUuid');
      throw new Error('Invalid token: missing accountUuid');
    }

    return decoded.accountUuid;
  }

  /**
   * 统一错误处理
   * 将领域错误转换为 HTTP 响应
   */
  private static handleError(res: Response, error: unknown): Response {
    logger.error('Request error', { error });

    // 检查是否为领域错误
    if (isTaskError(error)) {
      // 映射 HTTP 状态码到 ResponseCode
      const responseCode = TaskTemplateController.mapHttpStatusToResponseCode(error.httpStatus);

      return TaskTemplateController.responseBuilder.sendError(res, {
        code: responseCode,
        message: error.message,
        errorCode: error.code,
        debug: error.context,
      });
    }

    // 处理认证错误
    if (error instanceof Error && error.message === 'Authentication required') {
      return TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.UNAUTHORIZED,
        message: error.message,
      });
    }

    // 处理未知错误
    return TaskTemplateController.responseBuilder.sendError(res, {
      code: ResponseCode.INTERNAL_ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  /**
   * 映射 HTTP 状态码到 ResponseCode
   */
  private static mapHttpStatusToResponseCode(httpStatus: number): ResponseCode {
    switch (httpStatus) {
      case 400:
        return ResponseCode.BAD_REQUEST;
      case 401:
        return ResponseCode.UNAUTHORIZED;
      case 403:
        return ResponseCode.FORBIDDEN;
      case 404:
        return ResponseCode.NOT_FOUND;
      case 409:
        return ResponseCode.CONFLICT;
      case 500:
        return ResponseCode.INTERNAL_ERROR;
      default:
        return ResponseCode.INTERNAL_ERROR;
    }
  }

  /**
   * 创建任务模板
   * @route POST /api/task-templates
   */
  static async createTaskTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const accountUuid = TaskTemplateController.extractAccountUuid(req);

      logger.info('Creating task template', { 
        accountUuid, 
        title: req.body.title,
        requestBody: req.body 
      });

      // 注入 accountUuid 到请求体（从 token 提取，覆盖前端传递的值）
      const template = await service.createTaskTemplate({
        ...req.body,
        accountUuid, // 后端注入，确保安全性
      });

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template created successfully',
        201,
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 获取任务模板详情
   * @route GET /api/task-templates/:id
   */
  static async getTaskTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { id } = req.params;
      const includeChildren = req.query.includeChildren === 'true';

      const template = await service.getTaskTemplate(id, includeChildren);

      if (!template) {
        return TaskTemplateController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Task template not found',
        });
      }

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template retrieved successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 获取任务模板列表
   * @route GET /api/task-templates
   */
  /**
   * 获取任务模板列表
   * @route GET /api/task-templates
   * 
   * Story 2.5: 支持 sortBy 和 filterBy 参数
   * 
   * 查询参数:
   * - sortBy: priority (default) | dueDate | createdAt | importance
   * - filterBy: importance:vital | status:active | dueDate:overdue (可多个)
   * 
   * 示例:
   * GET /api/task-templates?sortBy=dueDate&filterBy=importance:important&filterBy=status:active
   */
  static async getTaskTemplates(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskTemplateController.extractAccountUuid(req);
      const { sortBy, filterBy, status, folderUuid, goalUuid, tags } = req.query;

      // Story 2.5: 如果提供了 sortBy 或 filterBy，使用新的查询服务
      if (sortBy || filterBy) {
        try {
          // 验证参数
          const validatedSortBy = TaskQueryValidator.validateSortBy(sortBy as string | undefined);
          const validatedFilterBy = TaskQueryValidator.validateFilterBy(
            filterBy as string | string[] | undefined
          );

          // 使用新的查询服务
          const queryService = await TaskQueryService.getInstance();
          const templates = await queryService.getTasksWithSortingAndFiltering(
            accountUuid,
            validatedSortBy || TaskSortBy.PRIORITY,
            validatedFilterBy,
            new Date()
          );

          return TaskTemplateController.responseBuilder.sendSuccess(
            res,
            {
              templates,
              meta: {
                count: templates.length,
                sortedBy: validatedSortBy || TaskSortBy.PRIORITY,
                filteredBy: validatedFilterBy,
              },
            },
            'Task templates retrieved successfully (sorted & filtered)',
          );
        } catch (validationError) {
          // 参数验证失败
          return TaskTemplateController.responseBuilder.sendError(res, {
            code: ResponseCode.BAD_REQUEST,
            message: validationError instanceof Error ? validationError.message : 'Invalid parameters',
          });
        }
      }

      // 原有的查询逻辑（向后兼容）
      const service = await TaskTemplateController.getTaskTemplateService();
      let templates;

      if (status) {
        templates = await service.getTaskTemplatesByStatus(accountUuid, status as any);
      } else if (folderUuid) {
        templates = await service.getTaskTemplatesByFolder(folderUuid as string);
      } else if (goalUuid) {
        templates = await service.getTaskTemplatesByGoal(goalUuid as string);
      } else if (tags) {
        const tagArray = typeof tags === 'string' ? tags.split(',') : [];
        templates = await service.getTaskTemplatesByTags(accountUuid, tagArray);
      } else {
        templates = await service.getTaskTemplatesByAccount(accountUuid);
      }

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        templates,
        'Task templates retrieved successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 激活任务模板
   * @route POST /api/task-templates/:id/activate
   */
  static async activateTaskTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { id } = req.params;

      const template = await service.activateTaskTemplate(id);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template activated successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 暂停任务模板
   * @route POST /api/task-templates/:id/pause
   */
  static async pauseTaskTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { id } = req.params;

      const template = await service.pauseTaskTemplate(id);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template paused successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 归档任务模板
   * @route POST /api/task-templates/:id/archive
   */
  static async archiveTaskTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { id } = req.params;

      const template = await service.archiveTaskTemplate(id);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template archived successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 生成任务实例
   * @route POST /api/task-templates/:id/generate-instances
   */
  static async generateInstances(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { id } = req.params;
      const { toDate } = req.body;

      const instances = await service.generateInstances(id, toDate);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        instances,
        `${instances.length} task instances generated successfully`,
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 绑定到目标
   * @route POST /api/task-templates/:id/bind-goal
   */
  static async bindToGoal(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { id } = req.params;
      const { goalUuid, keyResultUuid, incrementValue } = req.body;

      const template = await service.bindToGoal(id, {
        goalUuid,
        keyResultUuid,
        incrementValue,
      });

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template bound to goal successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 解除目标绑定
   * @route POST /api/task-templates/:id/unbind-goal
   */
  static async unbindFromGoal(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { id } = req.params;

      const template = await service.unbindFromGoal(id);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template unbound from goal successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 删除任务模板
   * @route DELETE /api/task-templates/:id
   */
  static async deleteTaskTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { id } = req.params;

      await service.deleteTaskTemplate(id);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        null,
        'Task template deleted successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  // ==================== ONE_TIME Task Endpoints ====================

  /**
   * 创建一次性任务
   * @route POST /api/tasks/one-time
   */
  static async createOneTimeTask(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskTemplateController.extractAccountUuid(req);
      const service = await TaskTemplateController.getTaskTemplateService();

      const dto = {
        ...req.body,
        accountUuid,
      };

      const task = await service.createOneTimeTask(dto);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        task,
        'One-time task created successfully',
        201,
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 开始任务
   * @deprecated This should be handled by TaskInstanceController
   * @route POST /api/tasks/:uuid/start
   */
  static async startTask(req: Request, res: Response): Promise<Response> {
    return res.status(501).json({
      success: false,
      error: {
        code: 'METHOD_NOT_AVAILABLE',
        message: 'Task state transitions should be performed on TaskInstance, not TaskTemplate',
      },
    });
  }

  /**
   * 完成任务
   * @deprecated This should be handled by TaskInstanceController
   * @route POST /api/tasks/:uuid/complete
   */
  static async completeTask(req: Request, res: Response): Promise<Response> {
    return res.status(501).json({
      success: false,
      error: {
        code: 'METHOD_NOT_AVAILABLE',
        message: 'Task state transitions should be performed on TaskInstance, not TaskTemplate',
      },
    });
  }

  /**
   * 阻塞任务
   * @route POST /api/tasks/:uuid/block
   */
  static async blockTask(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { uuid } = req.params;
      const { reason } = req.body;

      const task = await service.blockTask(uuid, reason);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        task,
        'Task blocked successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 解除任务阻塞
   * @route POST /api/tasks/:uuid/unblock
   */
  static async unblockTask(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { uuid } = req.params;

      const task = await service.unblockTask(uuid);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        task,
        'Task unblocked successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 取消任务
   * @deprecated This should be handled by TaskInstanceController
   * @route POST /api/tasks/:uuid/cancel
   */
  static async cancelTask(req: Request, res: Response): Promise<Response> {
    return res.status(501).json({
      success: false,
      error: {
        code: 'METHOD_NOT_AVAILABLE',
        message: 'Task state transitions should be performed on TaskInstance, not TaskTemplate',
      },
    });
  }

  /**
   * 更新一次性任务
   * @route PATCH /api/tasks/:uuid
   */
  static async updateOneTimeTask(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { uuid } = req.params;

      const updates = {
        title: req.body.title,
        description: req.body.description,
        startDate: req.body.startDate,
        dueDate: req.body.dueDate,
        importance: req.body.importance,
        urgency: req.body.urgency,
        estimatedMinutes: req.body.estimatedMinutes,
        tags: req.body.tags,
        color: req.body.color,
        note: req.body.note,
      };

      const task = await service.updateOneTimeTask(uuid, updates);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        task,
        'Task updated successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 获取任务历史记录
   * @route GET /api/tasks/:uuid/history
   */
  static async getTaskHistory(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { uuid } = req.params;

      const history = await service.getTaskHistory(uuid);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        { history },
        'Task history retrieved successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 根据日期范围获取模板实例
   * @route GET /api/task-templates/:uuid/instances
   */
  static async getInstancesByDateRange(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { uuid } = req.params;
      const { from, to } = req.query;

      if (!from || !to) {
        return TaskTemplateController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: 'Missing required query parameters: from, to',
        });
      }

      const fromDate = Number(from);
      const toDate = Number(to);

      if (isNaN(fromDate) || isNaN(toDate)) {
        return TaskTemplateController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: 'Invalid date format: from and to must be timestamps',
        });
      }

      logger.info('Fetching task instances by date range', {
        templateUuid: uuid,
        from: fromDate,
        to: toDate,
      });

      // 调用服务获取指定日期范围的实例
      const instances = await service.getInstancesByDateRange(uuid, fromDate, toDate);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        instances,
        `Retrieved ${instances.length} task instances`,
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 获取一次性任务列表（支持过滤）
   * @route GET /api/tasks/one-time
   */
  static async getOneTimeTasks(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskTemplateController.extractAccountUuid(req);
      const service = await TaskTemplateController.getTaskTemplateService();

      const filters = {
        status: req.query.status as any,
        goalUuid: req.query.goalUuid as string,
        parentTaskUuid: req.query.parentTaskUuid as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        dueDateFrom: req.query.dueDateFrom ? Number(req.query.dueDateFrom) : undefined,
        dueDateTo: req.query.dueDateTo ? Number(req.query.dueDateTo) : undefined,
        priority: req.query.priority as any,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      };

      const tasks = await service.findOneTimeTasks(accountUuid, filters);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        tasks,
        'One-time tasks retrieved successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 获取今日任务
   * @route GET /api/tasks/today
   */
  static async getTodayTasks(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskTemplateController.extractAccountUuid(req);
      const service = await TaskTemplateController.getTaskTemplateService();

      const tasks = await service.getTodayTasks(accountUuid);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        tasks,
        "Today's tasks retrieved successfully",
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 获取逾期任务
   * @route GET /api/tasks/overdue
   */
  static async getOverdueTasks(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskTemplateController.extractAccountUuid(req);
      const service = await TaskTemplateController.getTaskTemplateService();

      const tasks = await service.getOverdueTasks(accountUuid);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        tasks,
        'Overdue tasks retrieved successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 获取即将到期的任务
   * @route GET /api/tasks/upcoming
   */
  static async getUpcomingTasks(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskTemplateController.extractAccountUuid(req);
      const service = await TaskTemplateController.getTaskTemplateService();

      const days = req.query.days ? Number(req.query.days) : 7;
      const tasks = await service.getUpcomingTasks(accountUuid, days);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        tasks,
        'Upcoming tasks retrieved successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 按优先级排序获取任务
   * @route GET /api/tasks/by-priority
   */
  static async getTasksByPriority(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskTemplateController.extractAccountUuid(req);
      const service = await TaskTemplateController.getTaskTemplateService();

      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const tasks = await service.getTasksSortedByPriority(accountUuid, limit);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        tasks,
        'Tasks sorted by priority retrieved successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 获取任务仪表板（聚合多种视图）
   * @route GET /api/tasks/dashboard
   */
  static async getTaskDashboard(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskTemplateController.extractAccountUuid(req);
      const service = await TaskTemplateController.getTaskTemplateService();

      const dashboard = await service.getTaskDashboard(accountUuid);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        dashboard,
        'Task dashboard retrieved successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 批量更新优先级
   * @route POST /api/tasks/batch/priority
   * @todo Implement batch priority update in service
   */
  static async batchUpdatePriority(req: Request, res: Response): Promise<Response> {
    return res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Batch priority update not yet implemented',
      },
    });
  }

  /**
   * 批量取消任务
   * @deprecated Task state transitions should be on TaskInstance
   * @route POST /api/tasks/batch/cancel
   */
  static async batchCancelTasks(req: Request, res: Response): Promise<Response> {
    return res.status(501).json({
      success: false,
      error: {
        code: 'METHOD_NOT_AVAILABLE',
        message: 'Task state transitions should be performed on TaskInstance, not TaskTemplate',
      },
    });
  }

  /**
   * 创建子任务
   * @route POST /api/tasks/:parentUuid/subtasks
   */
  static async createSubtask(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskTemplateController.extractAccountUuid(req);
      const service = await TaskTemplateController.getTaskTemplateService();
      const { parentUuid } = req.params;

      const dto = {
        ...req.body,
        accountUuid,
        parentTaskUuid: parentUuid,
      };

      const subtask = await service.createSubtask(parentUuid, dto);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        subtask,
        'Subtask created successfully',
        201,
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 获取子任务列表
   * @route GET /api/tasks/:parentUuid/subtasks
   */
  static async getSubtasks(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { parentUuid } = req.params;

      const subtasks = await service.getSubtasks(parentUuid);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        subtasks,
        'Subtasks retrieved successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 关联任务到目标
   * @route POST /api/tasks/:uuid/link-goal
   */
  static async linkToGoal(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { uuid } = req.params;
      const { goalUuid, keyResultUuid } = req.body;

      const task = await service.linkToGoal(uuid, goalUuid, keyResultUuid);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        task,
        'Task linked to goal successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 解除任务与目标的关联
   * @route DELETE /api/tasks/:uuid/link-goal
   */
  static async unlinkFromGoal(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { uuid } = req.params;

      const task = await service.unlinkFromGoal(uuid);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        task,
        'Task unlinked from goal successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 根据目标获取任务列表
   * @route GET /api/tasks/by-goal/:goalUuid
   */
  static async getTasksByGoal(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { goalUuid } = req.params;

      const tasks = await service.getTasksByGoal(goalUuid);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        tasks,
        'Tasks retrieved successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 根据关键结果获取任务列表
   * @route GET /api/tasks/by-key-result/:keyResultUuid
   */
  static async getTasksByKeyResult(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { keyResultUuid } = req.params;

      const tasks = await service.getTasksByKeyResult(keyResultUuid);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        tasks,
        'Tasks retrieved successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 按标签获取任务
   * @route GET /api/tasks/by-tags
   */
  static async getTasksByTags(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskTemplateController.extractAccountUuid(req);
      const service = await TaskTemplateController.getTaskTemplateService();

      const tags = req.query.tags ? (req.query.tags as string).split(',') : [];
      const tasks = await service.getTaskTemplatesByTags(accountUuid, tags);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        tasks,
        'Tasks retrieved successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 获取阻塞的任务
   * @route GET /api/tasks/blocked
   */
  static async getBlockedTasks(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskTemplateController.extractAccountUuid(req);
      const service = await TaskTemplateController.getTaskTemplateService();

      const tasks = await service.getBlockedTasks(accountUuid);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        tasks,
        'Blocked tasks retrieved successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 按日期范围获取任务
   * @route GET /api/tasks/by-date-range
   * @todo Implement date range query in service
   */
  static async getTasksByDateRange(req: Request, res: Response): Promise<Response> {
    return res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Date range query not yet implemented',
      },
    });
  }
}
