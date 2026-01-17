/**
 * @file GoalFolderController.ts
 * @description 目标文件夹控制器，处理文件夹相关的 HTTP 请求。
 * @date 2025-01-22
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '@/shared/infrastructure/http/middlewares/authMiddleware';
import { GoalFolderApplicationService } from '@dailyuse/application-server/goal';
import { GoalContainer } from '../../infrastructure/di/GoalContainer';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalFolderController');

/**
 * GoalFolder 控制器。
 *
 * @remarks
 * **职责**:
 * - 解析 HTTP 请求参数
 * - 调用应用服务处理业务逻辑
 * - 格式化响应（统一使用 ResponseBuilder）
 * - 异常处理和错误响应
 */
export class GoalFolderController {
  private static responseBuilder = createResponseBuilder();

  /**
   * 初始化应用服务（延迟加载）。
   */
  private static async getFolderService(): Promise<GoalFolderApplicationService> {
    return GoalContainer.getInstance().getGoalFolderApplicationService();
  }

  /**
   * 创建文件夹。
   *
   * @route POST /api/goal-folders
   *
   * @param req - AuthenticatedRequest，Body 包含 CreateGoalFolderParams
   * @param res - Express 响应对象
   *
   * @returns {Promise<Response>} 创建的文件夹信息
   */
  static async createFolder(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const service = await GoalFolderController.getFolderService();
      
      // 从认证中间件获取 accountUuid（安全可靠）
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalFolderController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      logger.info('Creating goal folder', { accountUuid });

      const folder = await service.createFolder(accountUuid, req.body);

      logger.info('Goal folder created successfully', { folderUuid: folder.uuid });
      return GoalFolderController.responseBuilder.sendSuccess(
        res,
        folder,
        'Goal folder created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating goal folder', { error: error.message });
        return GoalFolderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalFolderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取文件夹详情。
   *
   * @route GET /api/goal-folders/:uuid
   *
   * @param req - AuthenticatedRequest，Params 包含 uuid
   * @param res - Express 响应对象
   *
   * @returns {Promise<Response>} 文件夹详情
   */
  static async getFolder(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await GoalFolderController.getFolderService();
      const folder = await service.getFolder(uuid);

      if (!folder) {
        logger.warn('Goal folder not found', { uuid });
        return GoalFolderController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Goal folder not found',
        });
      }

      return GoalFolderController.responseBuilder.sendSuccess(
        res,
        folder,
        'Goal folder retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving goal folder', { error: error.message });
        return GoalFolderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalFolderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 查询文件夹列表。
   *
   * @route GET /api/goal-folders
   *
   * @param req - AuthenticatedRequest
   * @param res - Express 响应对象
   *
   * @returns {Promise<Response>} 文件夹列表
   */
  static async queryFolders(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const service = await GoalFolderController.getFolderService();

      // 从认证中间件注入的 user 对象中获取 accountUuid
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalFolderController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      const folders = await service.getFoldersByAccount(accountUuid);

      return GoalFolderController.responseBuilder.sendSuccess(
        res,
        { folders, total: folders.length },
        'Goal folders retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error querying goal folders', { error: error.message });
        return GoalFolderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalFolderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新文件夹。
   *
   * @route PATCH /api/goal-folders/:uuid
   *
   * @param req - AuthenticatedRequest，Params 包含 uuid，Body 包含 UpdateGoalFolderParams
   * @param res - Express 响应对象
   *
   * @returns {Promise<Response>} 更新后的文件夹信息
   */
  static async updateFolder(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const service = await GoalFolderController.getFolderService();

      logger.info('Updating goal folder', { folderUuid: uuid });

      const folder = await service.updateFolder(uuid, req.body);

      logger.info('Goal folder updated successfully', { folderUuid: uuid });
      return GoalFolderController.responseBuilder.sendSuccess(
        res,
        folder,
        'Goal folder updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error updating goal folder', { error: error.message });
        return GoalFolderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalFolderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 删除文件夹。
   *
   * @route DELETE /api/goal-folders/:uuid
   *
   * @param req - AuthenticatedRequest，Params 包含 uuid
   * @param res - Express 响应对象
   *
   * @returns {Promise<Response>} 成功响应
   */
  static async deleteFolder(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const service = await GoalFolderController.getFolderService();

      logger.info('Deleting goal folder', { folderUuid: uuid });

      await service.deleteFolder(uuid);

      logger.info('Goal folder deleted successfully', { folderUuid: uuid });
      return GoalFolderController.responseBuilder.sendSuccess(
        res,
        { success: true },
        'Goal folder deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deleting goal folder', { error: error.message });
        return GoalFolderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalFolderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }
}
