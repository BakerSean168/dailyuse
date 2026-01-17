import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { TaskInstanceApplicationService } from '@dailyuse/application-server/task';
import { ResponseCode, createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

// 创建 logger 实例
const logger = createLogger('TaskInstanceController');

export class TaskInstanceController {
  private static taskInstanceService: TaskInstanceApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 获取应用服务实例（懒加载）
   */
  private static async getTaskInstanceService(): Promise<TaskInstanceApplicationService> {
    if (!TaskInstanceController.taskInstanceService) {
      TaskInstanceController.taskInstanceService =
        await TaskInstanceApplicationService.getInstance();
    }
    return TaskInstanceController.taskInstanceService;
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
   * 获取任务实例详情
   * @route GET /api/task-instances/:id
   */
  static async getTaskInstance(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskInstanceController.getTaskInstanceService();
      const { id } = req.params;

      logger.info('Getting task instance', { instanceUuid: id });

      const instance = await service.getTaskInstance(id);

      if (!instance) {
        logger.warn('Task instance not found', { instanceUuid: id });
        return TaskInstanceController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Task instance not found',
        });
      }

      return TaskInstanceController.responseBuilder.sendSuccess(
        res,
        instance,
        'Task instance retrieved successfully',
      );
    } catch (error) {
      logger.error('Error getting task instance', { error });
      return TaskInstanceController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 获取任务实例列表
   * @route GET /api/task-instances
   */
  static async getTaskInstances(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskInstanceController.extractAccountUuid(req);
      const service = await TaskInstanceController.getTaskInstanceService();

      const { templateUuid, status, startDate, endDate } = req.query;

      logger.info('Getting task instances', {
        accountUuid,
        templateUuid,
        status,
        startDate,
        endDate,
      });

      let instances;

      if (templateUuid) {
        // 按模板查询
        instances = await service.getTaskInstancesByTemplate(templateUuid as string);
      } else if (startDate && endDate) {
        // 按日期范围查询
        instances = await service.getTaskInstancesByDateRange(
          accountUuid,
          Number(startDate),
          Number(endDate),
        );
      } else if (status) {
        // 按状态查询
        instances = await service.getTaskInstancesByStatus(accountUuid, status as any);
      } else {
        // 获取所有
        instances = await service.getTaskInstancesByAccount(accountUuid);
      }

      return TaskInstanceController.responseBuilder.sendSuccess(
        res,
        instances,
        'Task instances retrieved successfully',
      );
    } catch (error) {
      logger.error('Error getting task instances', { error });
      return TaskInstanceController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 开始任务实例
   * @route POST /api/task-instances/:id/start
   */
  static async startTaskInstance(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskInstanceController.getTaskInstanceService();
      const { id } = req.params;

      logger.info('Starting task instance', { instanceUuid: id });

      const instance = await service.startTaskInstance(id);

      return TaskInstanceController.responseBuilder.sendSuccess(
        res,
        instance,
        'Task instance started successfully',
      );
    } catch (error) {
      logger.error('Error starting task instance', { error });

      if (error instanceof Error && error.message.includes('not found')) {
        return TaskInstanceController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: error.message,
        });
      }

      if (error instanceof Error && error.message.includes('Cannot start')) {
        return TaskInstanceController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: error.message,
        });
      }

      return TaskInstanceController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 完成任务实例
   * @route POST /api/task-instances/:id/complete
   */
  static async completeTaskInstance(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskInstanceController.getTaskInstanceService();
      const { id } = req.params;
      const { duration, note, rating } = req.body;

      logger.info('Completing task instance', { instanceUuid: id });

      const instance = await service.completeTaskInstance(id, {
        duration,
        note,
        rating,
      });

      return TaskInstanceController.responseBuilder.sendSuccess(
        res,
        instance,
        'Task instance completed successfully',
      );
    } catch (error) {
      logger.error('Error completing task instance', { error });

      if (error instanceof Error && error.message.includes('not found')) {
        return TaskInstanceController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: error.message,
        });
      }

      if (error instanceof Error && error.message.includes('Cannot complete')) {
        return TaskInstanceController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: error.message,
        });
      }

      return TaskInstanceController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 跳过任务实例
   * @route POST /api/task-instances/:id/skip
   */
  static async skipTaskInstance(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskInstanceController.getTaskInstanceService();
      const { id } = req.params;
      const { reason } = req.body;

      logger.info('Skipping task instance', { instanceUuid: id });

      const instance = await service.skipTaskInstance(id, reason);

      return TaskInstanceController.responseBuilder.sendSuccess(
        res,
        instance,
        'Task instance skipped successfully',
      );
    } catch (error) {
      logger.error('Error skipping task instance', { error });

      if (error instanceof Error && error.message.includes('not found')) {
        return TaskInstanceController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: error.message,
        });
      }

      if (error instanceof Error && error.message.includes('Cannot skip')) {
        return TaskInstanceController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: error.message,
        });
      }

      return TaskInstanceController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 检查过期的任务实例
   * @route POST /api/task-instances/check-expired
   */
  static async checkExpiredInstances(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskInstanceController.extractAccountUuid(req);
      const service = await TaskInstanceController.getTaskInstanceService();

      logger.info('Checking expired task instances', { accountUuid });

      const expiredInstances = await service.checkExpiredInstances(accountUuid);

      return TaskInstanceController.responseBuilder.sendSuccess(
        res,
        expiredInstances,
        `${expiredInstances.length} task instances marked as expired`,
      );
    } catch (error) {
      logger.error('Error checking expired task instances', { error });
      return TaskInstanceController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 删除任务实例
   * @route DELETE /api/task-instances/:id
   */
  static async deleteTaskInstance(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskInstanceController.getTaskInstanceService();
      const { id } = req.params;

      logger.info('Deleting task instance', { instanceUuid: id });

      await service.deleteTaskInstance(id);

      return TaskInstanceController.responseBuilder.sendSuccess(
        res,
        null,
        'Task instance deleted successfully',
      );
    } catch (error) {
      logger.error('Error deleting task instance', { error });
      return TaskInstanceController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
