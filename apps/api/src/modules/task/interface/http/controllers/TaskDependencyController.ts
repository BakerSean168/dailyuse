/**
 * TaskDependency HTTP Controller
 * 任务依赖关系 REST API 控制器
 */

import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { TaskDependencyApplicationService } from '@dailyuse/application-server/task';
import { ResponseCode, createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskDependencyController');

export class TaskDependencyController {
  private static taskDependencyService: TaskDependencyApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 获取应用服务实例（懒加载）
   */
  private static async getTaskDependencyService(): Promise<TaskDependencyApplicationService> {
    if (!TaskDependencyController.taskDependencyService) {
      TaskDependencyController.taskDependencyService =
        await TaskDependencyApplicationService.getInstance();
    }
    return TaskDependencyController.taskDependencyService;
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
   */
  private static handleError(res: Response, error: unknown): Response {
    logger.error('Request error', { error });

    if (error instanceof Error && error.message === 'Authentication required') {
      return TaskDependencyController.responseBuilder.sendError(res, {
        code: ResponseCode.UNAUTHORIZED,
        message: error.message,
      });
    }

    return TaskDependencyController.responseBuilder.sendError(res, {
      code: ResponseCode.INTERNAL_ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  /**
   * POST /api/v1/tasks/:taskUuid/dependencies
   * 创建任务依赖关系
   */
  static async createDependency(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskDependencyController.extractAccountUuid(req);
      const { taskUuid } = req.params;
      const { predecessorTaskUuid, dependencyType, lagDays } = req.body;

      logger.info('Creating task dependency', {
        accountUuid,
        successorTaskUuid: taskUuid,
        predecessorTaskUuid,
        dependencyType,
      });

      const service = await TaskDependencyController.getTaskDependencyService();
      const dependency = await service.createDependency({
        accountUuid,
        predecessorTaskUuid,
        successorTaskUuid: taskUuid,
        dependencyType: dependencyType || 'FINISH_TO_START',
        lagDays,
      });

      logger.info('Task dependency created successfully', { uuid: dependency.uuid });

      return TaskDependencyController.responseBuilder.sendSuccess(
        res,
        dependency,
        'Task dependency created successfully',
        201,
      );
    } catch (error) {
      return TaskDependencyController.handleError(res, error);
    }
  }

  /**
   * GET /api/v1/tasks/:taskUuid/dependencies
   * 获取任务的所有前置依赖
   */
  static async getDependencies(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskDependencyController.extractAccountUuid(req);
      const { taskUuid } = req.params;

      logger.info('Getting task dependencies', { accountUuid, taskUuid });

      const service = await TaskDependencyController.getTaskDependencyService();
      const dependencies = await service.getDependencies(taskUuid);

      return TaskDependencyController.responseBuilder.sendSuccess(
        res,
        dependencies,
        'Task dependencies retrieved successfully',
      );
    } catch (error) {
      return TaskDependencyController.handleError(res, error);
    }
  }

  /**
   * GET /api/v1/tasks/:taskUuid/dependents
   * 获取依赖此任务的所有任务
   */
  static async getDependents(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskDependencyController.extractAccountUuid(req);
      const { taskUuid } = req.params;

      logger.info('Getting task dependents', { accountUuid, taskUuid });

      const service = await TaskDependencyController.getTaskDependencyService();
      const dependents = await service.getDependents(taskUuid);

      return TaskDependencyController.responseBuilder.sendSuccess(
        res,
        dependents,
        'Task dependents retrieved successfully',
      );
    } catch (error) {
      return TaskDependencyController.handleError(res, error);
    }
  }

  /**
   * DELETE /api/v1/tasks/dependencies/:uuid
   * 删除依赖关系
   */
  static async deleteDependency(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskDependencyController.extractAccountUuid(req);
      const { uuid } = req.params;

      logger.info('Deleting task dependency', { accountUuid, uuid });

      const service = await TaskDependencyController.getTaskDependencyService();
      await service.deleteDependency(uuid);

      logger.info('Task dependency deleted successfully', { uuid });

      return TaskDependencyController.responseBuilder.sendSuccess(
        res,
        null,
        'Task dependency deleted successfully',
      );
    } catch (error) {
      return TaskDependencyController.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/tasks/dependencies/validate
   * 验证依赖关系（不实际创建）
   */
  static async validateDependency(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskDependencyController.extractAccountUuid(req);
      const { predecessorTaskUuid, successorTaskUuid } = req.body;

      logger.info('Validating task dependency', {
        accountUuid,
        predecessorTaskUuid,
        successorTaskUuid,
      });

      const service = await TaskDependencyController.getTaskDependencyService();
      const validation = await service.validateDependency({
        predecessorTaskUuid,
        successorTaskUuid,
      });

      return TaskDependencyController.responseBuilder.sendSuccess(
        res,
        validation,
        validation.isValid ? 'Dependency is valid' : 'Dependency validation failed',
      );
    } catch (error) {
      return TaskDependencyController.handleError(res, error);
    }
  }

  /**
   * GET /api/v1/tasks/:taskUuid/dependency-chain
   * 获取任务的完整依赖链信息
   */
  static async getDependencyChain(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskDependencyController.extractAccountUuid(req);
      const { taskUuid } = req.params;

      logger.info('Getting dependency chain', { accountUuid, taskUuid });

      const service = await TaskDependencyController.getTaskDependencyService();
      const chain = await service.getDependencyChain(taskUuid);

      return TaskDependencyController.responseBuilder.sendSuccess(
        res,
        chain,
        'Dependency chain retrieved successfully',
      );
    } catch (error) {
      return TaskDependencyController.handleError(res, error);
    }
  }

  /**
   * PUT /api/v1/tasks/dependencies/:uuid
   * 更新依赖关系
   */
  static async updateDependency(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskDependencyController.extractAccountUuid(req);
      const { uuid } = req.params;
      const { dependencyType, lagDays } = req.body;

      logger.info('Updating task dependency', { accountUuid, uuid, dependencyType, lagDays });

      const service = await TaskDependencyController.getTaskDependencyService();
      const dependency = await service.updateDependency(uuid, {
        dependencyType,
        lagDays,
      });

      logger.info('Task dependency updated successfully', { uuid });

      return TaskDependencyController.responseBuilder.sendSuccess(
        res,
        dependency,
        'Task dependency updated successfully',
      );
    } catch (error) {
      return TaskDependencyController.handleError(res, error);
    }
  }
}
