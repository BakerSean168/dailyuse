/**
 * @file GoalStatisticsController.ts
 * @description 目标统计控制器，处理目标统计相关�?HTTP 请求�?
 * @date 2025-01-22
 */

import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { GoalStatisticsApplicationService } from '../../application/services/GoalStatisticsApplicationService';
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
const logger = createLogger('GoalStatisticsController');

/**
 * Goal 统计控制器�?
 *
 * @remarks
 * 负责处理 Goal 统计相关�?HTTP 请求�?
 */
export class GoalStatisticsController {
  private static statisticsService: GoalStatisticsApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 获取应用服务实例（懒加载）�?
   */
  private static async getStatisticsService(): Promise<GoalStatisticsApplicationService> {
    if (!GoalStatisticsController.statisticsService) {
      GoalStatisticsController.statisticsService =
        await GoalStatisticsApplicationService.getInstance();
    }
    return GoalStatisticsController.statisticsService;
  }

  /**
   * 从请求中提取用户账户UUID�?
   *
   * @param req - Express Request 对象
   * @returns {string} 账户 UUID
   * @throws {Error} 如果认证失败
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
   * 获取账户的目标统计信息�?
   *
   * @route GET /api/goals/statistics
   *
   * @param req - Express Request 对象
   * @param res - Express Response 对象
   * @returns {Promise<Response>} 统计信息响应
   */
  static async getStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalStatisticsController.extractAccountUuid(req);
      const service = await GoalStatisticsController.getStatisticsService();

      logger.info('Getting goal statistics', { accountUuid });

      // 获取或创建统计（如果不存在则自动初始化）
      const statistics = await service.getOrCreateStatistics(accountUuid);

      logger.info('Goal statistics retrieved successfully', { accountUuid });

      return GoalStatisticsController.responseBuilder.sendSuccess(
        res,
        statistics,
        'Goal statistics retrieved successfully',
        200,
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error getting goal statistics');
          return GoalStatisticsController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }

        logger.error('Error getting goal statistics', {
          error: error.message,
        });
        return GoalStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to retrieve goal statistics',
          debug: error.message,
        });
      }

      logger.error('Unknown error getting goal statistics');
      return GoalStatisticsController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * 初始化账户的目标统计信息�?
   *
   * @route POST /api/goals/statistics/initialize
   *
   * @param req - Express Request 对象
   * @param res - Express Response 对象
   * @returns {Promise<Response>} 初始化结果响�?
   */
  static async initializeStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalStatisticsController.extractAccountUuid(req);
      const service = await GoalStatisticsController.getStatisticsService();

      logger.info('Initializing goal statistics', { accountUuid });

      const result = await service.initializeStatistics({ accountUuid });

      if (result.ok) {
        logger.info('Goal statistics initialized successfully', { accountUuid });
        return GoalStatisticsController.responseBuilder.sendSuccess(
          res,
          result.statistics,
          result.message,
          201,
        );
      } else {
        logger.error('Failed to initialize goal statistics', {
          accountUuid,
          message: result.message,
        });
        return GoalStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: result.message,
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error initializing goal statistics');
          return GoalStatisticsController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }

        logger.error('Error initializing goal statistics', {
          error: error.message,
        });
        return GoalStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to initialize goal statistics',
          debug: error.message,
        });
      }

      logger.error('Unknown error initializing goal statistics');
      return GoalStatisticsController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * 重新计算账户的目标统计信息�?
   *
   * @route POST /api/goals/statistics/recalculate
   *
   * @param req - Express Request 对象
   * @param res - Express Response 对象
   * @returns {Promise<Response>} 重算结果响应
   */
  static async recalculateStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalStatisticsController.extractAccountUuid(req);
      const service = await GoalStatisticsController.getStatisticsService();

      const force = req.body.force === true;

      logger.info('Recalculating goal statistics', { accountUuid, force });

      const result = await service.recalculateStatistics({
        accountUuid,
        force,
      });

      if (result.ok) {
        logger.info('Goal statistics recalculated successfully', { accountUuid });
        return GoalStatisticsController.responseBuilder.sendSuccess(
          res,
          result.statistics,
          result.message,
          200,
        );
      } else {
        logger.error('Failed to recalculate goal statistics', {
          accountUuid,
          message: result.message,
        });
        return GoalStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: result.message,
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error recalculating goal statistics');
          return GoalStatisticsController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }

        logger.error('Error recalculating goal statistics', {
          error: error.message,
        });
        return GoalStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to recalculate goal statistics',
          debug: error.message,
        });
      }

      logger.error('Unknown error recalculating goal statistics');
      return GoalStatisticsController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * 删除账户的目标统计信息（主要用于测试）�?
   *
   * @route DELETE /api/goals/statistics
   *
   * @param req - Express Request 对象
   * @param res - Express Response 对象
   * @returns {Promise<Response>} 删除结果响应
   */
  static async deleteStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalStatisticsController.extractAccountUuid(req);
      const service = await GoalStatisticsController.getStatisticsService();

      logger.info('Deleting goal statistics', { accountUuid });

      const success = await service.deleteStatistics(accountUuid);

      if (success) {
        logger.info('Goal statistics deleted successfully', { accountUuid });
        return GoalStatisticsController.responseBuilder.sendSuccess(
          res,
          { deleted: true },
          'Goal statistics deleted successfully',
          200,
        );
      } else {
        logger.warn('Goal statistics not found for deletion', { accountUuid });
        return GoalStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Goal statistics not found',
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error deleting goal statistics');
          return GoalStatisticsController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }

        logger.error('Error deleting goal statistics', {
          error: error.message,
        });
        return GoalStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to delete goal statistics',
          debug: error.message,
        });
      }

      logger.error('Unknown error deleting goal statistics');
      return GoalStatisticsController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      });
    }
  }
}
