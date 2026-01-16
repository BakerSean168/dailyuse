import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { RepositoryStatisticsApplicationService } from '../../../application/services/RepositoryStatisticsApplicationService';
import {
  type ApiResponse,
  type SuccessResponse,
  type ErrorResponse,
  ResponseCode,
  createResponseBuilder,
  getHttpStatusCode,
} from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

// 创建 logger 实例
const logger = createLogger('RepositoryStatisticsController');

export class RepositoryStatisticsController {
  private static statisticsService: RepositoryStatisticsApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 获取应用服务实例（懒加载�?
   */
  private static async getStatisticsService(): Promise<RepositoryStatisticsApplicationService> {
    if (!RepositoryStatisticsController.statisticsService) {
      RepositoryStatisticsController.statisticsService =
        await RepositoryStatisticsApplicationService.getInstance();
    }
    return RepositoryStatisticsController.statisticsService;
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
   * 获取账户的统计信�?
   * @route GET /api/repositories/statistics
   */
  static async getStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = RepositoryStatisticsController.extractAccountUuid(req);
      const service = await RepositoryStatisticsController.getStatisticsService();

      logger.info('Getting repository statistics', { accountUuid });

      // 获取或创建统计（如果不存在则自动初始化）
      const statistics = await service.getOrCreateStatistics(accountUuid);

      logger.info('Statistics retrieved successfully', { accountUuid });

      return RepositoryStatisticsController.responseBuilder.sendSuccess(
        res,
        statistics,
        'Statistics retrieved successfully',
        200,
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error getting statistics');
          return RepositoryStatisticsController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }

        logger.error('Error getting repository statistics', {
          error: error.message,
        });
        return RepositoryStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to retrieve statistics',
          debug: error.message,
        });
      }

      logger.error('Unknown error getting repository statistics');
      return RepositoryStatisticsController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * 初始化账户的统计信息
   * @route POST /api/repositories/statistics/initialize
   */
  static async initializeStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = RepositoryStatisticsController.extractAccountUuid(req);
      const service = await RepositoryStatisticsController.getStatisticsService();

      logger.info('Initializing repository statistics', { accountUuid });

      const statistics = await service.initializeStatistics(accountUuid);

      logger.info('Statistics initialized successfully', { accountUuid });

      return RepositoryStatisticsController.responseBuilder.sendSuccess(
        res,
        statistics,
        'Statistics initialized successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error initializing statistics');
          return RepositoryStatisticsController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }

        logger.error('Error initializing repository statistics', {
          error: error.message,
        });
        return RepositoryStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to initialize statistics',
          debug: error.message,
        });
      }

      logger.error('Unknown error initializing repository statistics');
      return RepositoryStatisticsController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * 重新计算账户的统计信�?
   * @route POST /api/repositories/statistics/recalculate
   */
  static async recalculateStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = RepositoryStatisticsController.extractAccountUuid(req);
      const service = await RepositoryStatisticsController.getStatisticsService();

      const force = req.body.force === true;

      logger.info('Recalculating repository statistics', { accountUuid, force });

      const result = await service.recalculateStatistics({
        accountUuid,
        force,
      });

      if (result.ok) {
        logger.info('Statistics recalculated successfully', { accountUuid });
        return RepositoryStatisticsController.responseBuilder.sendSuccess(
          res,
          result.statistics,
          result.message ?? 'Statistics recalculated successfully',
          200,
        );
      } else {
        logger.error('Failed to recalculate statistics', {
          accountUuid,
          message: result.message,
        });
        return RepositoryStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: result.message ?? 'Failed to recalculate statistics',
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error recalculating statistics');
          return RepositoryStatisticsController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }

        logger.error('Error recalculating repository statistics', {
          error: error.message,
        });
        return RepositoryStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to recalculate statistics',
          debug: error.message,
        });
      }

      logger.error('Unknown error recalculating repository statistics');
      return RepositoryStatisticsController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * 删除账户的统计信�?
   * @route DELETE /api/repositories/statistics
   */
  static async deleteStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = RepositoryStatisticsController.extractAccountUuid(req);
      const service = await RepositoryStatisticsController.getStatisticsService();

      logger.info('Deleting repository statistics', { accountUuid });

      await service.deleteStatistics(accountUuid);

      logger.info('Statistics deleted successfully', { accountUuid });

      return RepositoryStatisticsController.responseBuilder.sendSuccess(
        res,
        null,
        'Statistics deleted successfully',
        200,
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error deleting statistics');
          return RepositoryStatisticsController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }

        logger.error('Error deleting repository statistics', {
          error: error.message,
        });
        return RepositoryStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to delete statistics',
          debug: error.message,
        });
      }

      logger.error('Unknown error deleting repository statistics');
      return RepositoryStatisticsController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      });
    }
  }
}




