import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { TaskStatisticsApplicationService } from '@dailyuse/application-server/task';
import { ResponseCode, createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';
import { isTaskError } from '@dailyuse/domain-server/task';

// 创建 logger 实例
const logger = createLogger('TaskStatisticsController');

export class TaskStatisticsController {
  private static taskStatisticsService: TaskStatisticsApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 获取应用服务实例（懒加载）
   */
  private static async getTaskStatisticsService(): Promise<TaskStatisticsApplicationService> {
    if (!TaskStatisticsController.taskStatisticsService) {
      TaskStatisticsController.taskStatisticsService =
        await TaskStatisticsApplicationService.getInstance();
    }
    return TaskStatisticsController.taskStatisticsService;
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
      const responseCode =
        TaskStatisticsController.mapHttpStatusToResponseCode(error.httpStatus);

      return TaskStatisticsController.responseBuilder.sendError(res, {
        code: responseCode,
        message: error.message,
        errorCode: error.code,
        debug: error.context,
      });
    }

    // 处理认证错误
    if (error instanceof Error && error.message === 'Authentication required') {
      return TaskStatisticsController.responseBuilder.sendError(res, {
        code: ResponseCode.UNAUTHORIZED,
        message: error.message,
      });
    }

    // 处理未知错误
    return TaskStatisticsController.responseBuilder.sendError(res, {
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
   * 获取任务统计数据
   * GET /task-statistics/:accountUuid?forceRecalculate=false
   */
  static async getStatistics(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('Getting task statistics', { params: req.params, query: req.query });

      const accountUuid = req.params.accountUuid || TaskStatisticsController.extractAccountUuid(req);
      const forceRecalculate = req.query.forceRecalculate === 'true';

      const service = await TaskStatisticsController.getTaskStatisticsService();
      const statistics = await service.getStatistics(accountUuid, forceRecalculate);

      logger.info('Successfully retrieved statistics', { accountUuid });

      return TaskStatisticsController.responseBuilder.sendSuccess(
        res,
        statistics,
        'Statistics retrieved successfully',
      );
    } catch (error) {
      return TaskStatisticsController.handleError(res, error);
    }
  }

  /**
   * 重新计算任务统计数据
   * POST /task-statistics/:accountUuid/recalculate
   */
  static async recalculateStatistics(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('Recalculating task statistics', { params: req.params });

      const accountUuid = req.params.accountUuid || TaskStatisticsController.extractAccountUuid(req);
      const force = req.body?.force ?? true; // 默认强制重算

      const service = await TaskStatisticsController.getTaskStatisticsService();
      const statistics = await service.recalculateStatistics(accountUuid, force);

      logger.info('Successfully recalculated statistics', { accountUuid });

      return TaskStatisticsController.responseBuilder.sendSuccess(
        res,
        statistics.toServerDTO(),
        'Statistics recalculated successfully',
      );
    } catch (error) {
      return TaskStatisticsController.handleError(res, error);
    }
  }

  /**
   * 更新模板统计信息
   * POST /task-statistics/:accountUuid/update-template-stats
   */
  static async updateTemplateStats(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('Updating template statistics', { params: req.params });

      const accountUuid = req.params.accountUuid || TaskStatisticsController.extractAccountUuid(req);

      const service = await TaskStatisticsController.getTaskStatisticsService();
      await service.updateTemplateStats(accountUuid);

      logger.info('Successfully updated template statistics', { accountUuid });

      return TaskStatisticsController.responseBuilder.sendSuccess(
        res,
        null,
        'Template statistics updated successfully',
      );
    } catch (error) {
      return TaskStatisticsController.handleError(res, error);
    }
  }

  /**
   * 更新实例统计信息
   * POST /task-statistics/:accountUuid/update-instance-stats
   */
  static async updateInstanceStats(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('Updating instance statistics', { params: req.params });

      const accountUuid = req.params.accountUuid || TaskStatisticsController.extractAccountUuid(req);

      const service = await TaskStatisticsController.getTaskStatisticsService();
      await service.updateInstanceStats(accountUuid);

      logger.info('Successfully updated instance statistics', { accountUuid });

      return TaskStatisticsController.responseBuilder.sendSuccess(
        res,
        null,
        'Instance statistics updated successfully',
      );
    } catch (error) {
      return TaskStatisticsController.handleError(res, error);
    }
  }

  /**
   * 更新完成统计信息
   * POST /task-statistics/:accountUuid/update-completion-stats
   */
  static async updateCompletionStats(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('Updating completion statistics', { params: req.params });

      const accountUuid = req.params.accountUuid || TaskStatisticsController.extractAccountUuid(req);

      const service = await TaskStatisticsController.getTaskStatisticsService();
      await service.updateCompletionStats(accountUuid);

      logger.info('Successfully updated completion statistics', { accountUuid });

      return TaskStatisticsController.responseBuilder.sendSuccess(
        res,
        null,
        'Completion statistics updated successfully',
      );
    } catch (error) {
      return TaskStatisticsController.handleError(res, error);
    }
  }

  /**
   * 删除统计数据
   * DELETE /task-statistics/:accountUuid
   */
  static async deleteStatistics(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('Deleting task statistics', { params: req.params });

      const accountUuid = req.params.accountUuid || TaskStatisticsController.extractAccountUuid(req);

      const service = await TaskStatisticsController.getTaskStatisticsService();
      await service.deleteStatistics(accountUuid);

      logger.info('Successfully deleted statistics', { accountUuid });

      return TaskStatisticsController.responseBuilder.sendSuccess(
        res,
        null,
        'Statistics deleted successfully',
      );
    } catch (error) {
      return TaskStatisticsController.handleError(res, error);
    }
  }

  /**
   * 获取今日完成率
   * GET /task-statistics/:accountUuid/today-completion-rate
   */
  static async getTodayCompletionRate(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('Getting today completion rate', { params: req.params });

      const accountUuid = req.params.accountUuid || TaskStatisticsController.extractAccountUuid(req);

      const service = await TaskStatisticsController.getTaskStatisticsService();
      const rate = await service.getTodayCompletionRate(accountUuid);

      logger.info('Successfully retrieved today completion rate', { accountUuid, rate });

      return TaskStatisticsController.responseBuilder.sendSuccess(
        res,
        { rate },
        'Today completion rate retrieved successfully',
      );
    } catch (error) {
      return TaskStatisticsController.handleError(res, error);
    }
  }

  /**
   * 获取本周完成率
   * GET /task-statistics/:accountUuid/week-completion-rate
   */
  static async getWeekCompletionRate(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('Getting week completion rate', { params: req.params });

      const accountUuid = req.params.accountUuid || TaskStatisticsController.extractAccountUuid(req);

      const service = await TaskStatisticsController.getTaskStatisticsService();
      const rate = await service.getWeekCompletionRate(accountUuid);

      logger.info('Successfully retrieved week completion rate', { accountUuid, rate });

      return TaskStatisticsController.responseBuilder.sendSuccess(
        res,
        { rate },
        'Week completion rate retrieved successfully',
      );
    } catch (error) {
      return TaskStatisticsController.handleError(res, error);
    }
  }

  /**
   * 获取效率趋势
   * GET /task-statistics/:accountUuid/efficiency-trend
   */
  static async getEfficiencyTrend(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('Getting efficiency trend', { params: req.params });

      const accountUuid = req.params.accountUuid || TaskStatisticsController.extractAccountUuid(req);

      const service = await TaskStatisticsController.getTaskStatisticsService();
      const trend = await service.getEfficiencyTrend(accountUuid);

      logger.info('Successfully retrieved efficiency trend', { accountUuid, trend });

      return TaskStatisticsController.responseBuilder.sendSuccess(
        res,
        { trend },
        'Efficiency trend retrieved successfully',
      );
    } catch (error) {
      return TaskStatisticsController.handleError(res, error);
    }
  }
}
