/**
 * @file GoalController.ts
 * @description 目标控制器，处理目标相关的 HTTP 请求。
 * @date 2025-01-22
 */

import type { Request, Response } from 'express';
import { 
  GoalApplicationService,
  GoalKeyResultApplicationService,
  GoalRecordApplicationService,
  GoalReviewApplicationService,
  WeightSnapshotApplicationService
} from '@dailyuse/application-server/goal';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import type { GoalServerDTO, GoalClientDTO, GoalAggregateViewResponse } from '@dailyuse/contracts/goal';
import { createLogger } from '@dailyuse/utils';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { GoalContainer } from '../../infrastructure/di/GoalContainer';

const logger = createLogger('GoalController');

/**
 * 目标控制器。
 *
 * @remarks
 * 负责接收和处理与目标（Goal）及其子实体（KeyResult, GoalReview, GoalRecord）相关的 HTTP 请求。
 * 遵循 RESTful API 设计。
 * 此控制器聚合了多个 ApplicationService 的功能。
 */
export class GoalController {
  private static responseBuilder = createResponseBuilder();

  /**
   * 初始化应用服务（延迟加载）。
   *
   * @returns {Promise<GoalApplicationService>} 目标应用服务实例
   */
  private static async getGoalService(): Promise<GoalApplicationService> {
    return GoalContainer.getInstance().getGoalApplicationService();
  }

  private static async getKeyResultService(): Promise<GoalKeyResultApplicationService> {
    return GoalContainer.getInstance().getGoalKeyResultApplicationService();
  }

  private static async getRecordService(): Promise<GoalRecordApplicationService> {
    return GoalContainer.getInstance().getGoalRecordApplicationService();
  }

  private static async getReviewService(): Promise<GoalReviewApplicationService> {
    return GoalContainer.getInstance().getGoalReviewApplicationService();
  }

  private static async getWeightSnapshotService(): Promise<WeightSnapshotApplicationService> {
    return GoalContainer.getInstance().getWeightSnapshotApplicationService();
  }

  /**
   * 验证目标归属权限。
   *
   * @param goalUuid - 目标 UUID
   * @param accountUuid - 账户 UUID
   * @returns {Promise<{ goal: any; error: null } | { goal: null; error: { code: ResponseCode; message: string } }>} 验证结果
   */
  private static async verifyGoalOwnership(
    goalUuid: string,
    accountUuid: string,
  ): Promise<
    | { goal: any; error: null }
    | { goal: null; error: { code: ResponseCode; message: string } }
  > {
    const service = await GoalController.getGoalService();
    const goal = await service.getGoal(goalUuid);

    if (!goal) {
      return {
        goal: null,
        error: {
          code: ResponseCode.NOT_FOUND,
          message: 'Goal not found',
        },
      };
    }

    if (goal.accountUuid !== accountUuid) {
      return {
        goal: null,
        error: {
          code: ResponseCode.FORBIDDEN,
          message: 'You do not have permission to access this goal',
        },
      };
    }

    return { goal, error: null };
  }

  /**
   * 创建目标接口。
   *
   * @route POST /api/goals
   * @param req - AuthenticatedRequest，Body 中包含创建参数
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 创建的目标数据
   */
  static async createGoal(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const service = await GoalController.getGoalService();
      
      // 从认证中间件获取 accountUuid（安全可靠）
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      logger.info('Creating goal', { accountUuid });

      // 将 accountUuid 合并到请求体中
      const goal = await service.createGoal({
        ...req.body,
        accountUuid,
      });

      logger.info('Goal created successfully', { goalUuid: goal.uuid });
      return GoalController.responseBuilder.sendSuccess(
        res,
        goal,
        'Goal created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating goal', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取目标详情接口。
   *
   * @route GET /api/goals/:uuid
   * @param req - Express 请求对象，params 中包含 uuid
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 目标详情
   */
  static async getGoal(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const includeChildren = req.query.includeChildren === 'true';

      const service = await GoalController.getGoalService();
      const goal = await service.getGoal(uuid, { includeChildren });

      if (!goal) {
        logger.warn('Goal not found', { uuid });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Goal not found',
        });
      }

      return GoalController.responseBuilder.sendSuccess(res, goal, 'Goal retrieved successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving goal', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取当前用户的所有目标接口（从 Token）。
   *
   * @route GET /api/goals
   * @param req - AuthenticatedRequest
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 目标列表
   */
  static async getUserGoalsByToken(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      const includeChildren = req.query.includeChildren === 'true';
      console.log('[GoalController.getUserGoalsByToken] includeChildren:', includeChildren);
      console.log('[GoalController.getUserGoalsByToken] query:', req.query);
      
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;

      const service = await GoalController.getGoalService();
      const goals = await service.getUserGoals(accountUuid, { includeChildren });
      
      console.log('[GoalController.getUserGoalsByToken] 返回Goals数量:', goals.length);
      console.log('[GoalController.getUserGoalsByToken] 第一个Goal:', goals[0]);

      // 实现简单的分页
      const total = goals.length;
      const paginatedGoals = limit ? goals.slice((page - 1) * limit, page * limit) : goals;

      return GoalController.responseBuilder.sendSuccess(
        res,
        {
          goals: paginatedGoals,  // 修改字段名从 data 到 goals，与前端 GoalsResponse 类型匹配
          total,
          page,
          pageSize: limit || total,  // 修改字段名从 limit 到 pageSize，与前端类型匹配
          hasMore: limit ? page * limit < total : false,
        },
        'Goals retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving user goals by token', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取指定用户的所有目标接口。
   *
   * @route GET /api/goals/user/:accountUuid
   * @param req - Express 请求对象
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 目标列表
   */
  static async getUserGoals(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;
      const includeChildren = req.query.includeChildren === 'true';

      const service = await GoalController.getGoalService();
      const goals = await service.getUserGoals(accountUuid, { includeChildren });

      return GoalController.responseBuilder.sendSuccess(res, goals, 'Goals retrieved successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving user goals', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新目标接口。
   *
   * @route PATCH /api/goals/:uuid
   * @param req - AuthenticatedRequest
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 更新后的目标
   */
  static async updateGoal(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const verification = await GoalController.verifyGoalOwnership(uuid, accountUuid);
      if (verification.error) {
        logger.warn('Unauthorized goal update attempt', { uuid, accountUuid });
        return GoalController.responseBuilder.sendError(res, verification.error);
      }

      const service = await GoalController.getGoalService();
      logger.info('Updating goal', { uuid, accountUuid });
      logger.info('Updating goal', { uuid, accountUuid });
      const goal = await service.updateGoal(uuid, req.body);

      logger.info('Goal updated successfully', { uuid });
      return GoalController.responseBuilder.sendSuccess(res, goal, 'Goal updated successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error updating goal', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 激活目标接口。
   *
   * @route POST /api/goals/:uuid/activate
   * @param req - Express 请求对象
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 激活后的目标
   */
  static async activateGoal(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await GoalController.getGoalService();
      const goal = await service.activateGoal(uuid);

      logger.info('Goal activated successfully', { uuid });
      return GoalController.responseBuilder.sendSuccess(res, goal, 'Goal activated successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error activating goal', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 完成目标接口。
   *
   * @route POST /api/goals/:uuid/complete
   * @param req - Express 请求对象
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 完成后的目标
   */
  static async completeGoal(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await GoalController.getGoalService();
      const goal = await service.completeGoal(uuid);

      logger.info('Goal completed successfully', { uuid });
      return GoalController.responseBuilder.sendSuccess(res, goal, 'Goal completed successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error completing goal', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 检查目标依赖关系接口。
   *
   * @route GET /api/goals/:uuid/dependencies
   * @param req - AuthenticatedRequest
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 依赖关系信息
   */
  static async checkGoalDependencies(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const verification = await GoalController.verifyGoalOwnership(uuid, accountUuid);
      if (verification.error) {
        logger.warn('Unauthorized goal dependency check attempt', { uuid, accountUuid });
        return GoalController.responseBuilder.sendError(res, verification.error);
      }

      const service = await GoalController.getGoalService();
      const dependencies = await service.checkGoalDependencies(uuid);

      logger.info('Goal dependencies checked', { uuid, accountUuid, dependencies });
      return GoalController.responseBuilder.sendSuccess(res, dependencies, 'Dependencies checked successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error checking goal dependencies', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 删除目标接口。
   *
   * @route DELETE /api/goals/:uuid
   * @param req - AuthenticatedRequest
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 操作结果
   */
  static async deleteGoal(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const verification = await GoalController.verifyGoalOwnership(uuid, accountUuid);
      if (verification.error) {
        logger.warn('Unauthorized goal deletion attempt', { uuid, accountUuid });
        return GoalController.responseBuilder.sendError(res, verification.error);
      }

      const service = await GoalController.getGoalService();
      await service.deleteGoal(uuid);

      logger.info('Goal deleted successfully', { uuid, accountUuid });
      logger.info('Goal deleted successfully', { uuid, accountUuid });
      return GoalController.responseBuilder.sendSuccess(res, null, 'Goal deleted successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deleting goal', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 归档目标接口。
   *
   * @route POST /api/goals/:uuid/archive
   * @param req - Express 请求对象
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 归档后的目标
   */
  static async archiveGoal(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await GoalController.getGoalService();
      const goal = await service.archiveGoal(uuid);

      logger.info('Goal archived successfully', { uuid });
      return GoalController.responseBuilder.sendSuccess(res, goal, 'Goal archived successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error archiving goal', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 添加关键结果接口。
   *
   * @route POST /api/goals/:uuid/key-results
   * @param req - AuthenticatedRequest
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 添加后的关键结果
   */
  static async addKeyResult(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const { goal: existingGoal, error } = await GoalController.verifyGoalOwnership(uuid, accountUuid);
      if (error) {
        return GoalController.responseBuilder.sendError(res, error);
      }

      const service = await GoalController.getKeyResultService();
      const goal = await service.addKeyResult(uuid, req.body);

      logger.info('Key result added successfully', { goalUuid: uuid, accountUuid });
      logger.info('Key result added successfully', { goalUuid: uuid, accountUuid });
      return GoalController.responseBuilder.sendSuccess(res, goal, 'Key result added', 201);
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error adding key result', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新关键结果进度接口。
   *
   * @route PATCH /api/goals/:uuid/key-results/:keyResultUuid/progress
   * @param req - AuthenticatedRequest
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 更新后的目标
   */
  static async updateKeyResultProgress(req: AuthenticatedRequest, res: Response): Promise<Response> {

    try {
      const { uuid, keyResultUuid } = req.params;
      const { currentValue, note } = req.body;

      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const { goal: existingGoal, error } = await GoalController.verifyGoalOwnership(uuid, accountUuid);
      if (error) {
        return GoalController.responseBuilder.sendError(res, error);
      }

      const service = await GoalController.getKeyResultService();
      const goal = await service.updateKeyResultProgress(uuid, keyResultUuid, currentValue, note);

      logger.info('Key result progress updated', { goalUuid: uuid, keyResultUuid, accountUuid });
      logger.info('Key result progress updated', { goalUuid: uuid, keyResultUuid, accountUuid });
      return GoalController.responseBuilder.sendSuccess(res, goal, 'Progress updated');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error updating key result progress', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 删除关键结果接口。
   *
   * @route DELETE /api/goals/:uuid/key-results/:keyResultUuid
   * @param req - AuthenticatedRequest
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 操作结果
   */
  static async deleteKeyResult(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid, keyResultUuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const { goal: existingGoal, error } = await GoalController.verifyGoalOwnership(uuid, accountUuid);
      if (error) {
        return GoalController.responseBuilder.sendError(res, error);
      }

      const service = await GoalController.getKeyResultService();
      const goal = await service.deleteKeyResult(uuid, keyResultUuid);

      logger.info('Key result deleted', { goalUuid: uuid, keyResultUuid, accountUuid });
      return GoalController.responseBuilder.sendSuccess(res, goal, 'Key result deleted');
      logger.info('Key result deleted', { goalUuid: uuid, keyResultUuid, accountUuid });
      return GoalController.responseBuilder.sendSuccess(res, goal, 'Key result deleted');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deleting key result', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 添加目标回顾接口。
   *
   * @route POST /api/goals/:uuid/reviews
   * @param req - Express 请求对象
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 添加后的回顾
   */
  static async addReview(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await GoalController.getReviewService();
      const goal = await service.addReview(uuid, req.body);

      logger.info('Goal review added successfully', { goalUuid: uuid });
      return GoalController.responseBuilder.sendSuccess(
        res,
        goal,
        'Review added successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error adding goal review', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 搜索目标接口。
   *
   * @route GET /api/goals/search
   * @param req - Express 请求对象
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 匹配的目标列表
   */
  static async searchGoals(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid, query } = req.query;

      if (!accountUuid || !query) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Missing required query params: accountUuid, query',
        });
      }

      const service = await GoalController.getGoalService();
      const goals = await service.searchGoals(accountUuid as string, query as string);

      return GoalController.responseBuilder.sendSuccess(res, goals, 'Goals searched successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error searching goals', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取目标统计接口。
   *
   * @route GET /api/goals/statistics/:accountUuid
   * @param req - Express 请求对象
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 统计数据
   */
  static async getGoalStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;

      const service = await GoalController.getGoalService();
      const statistics = await service.getGoalStatistics(accountUuid);

      return GoalController.responseBuilder.sendSuccess(
        res,
        statistics,
        'Statistics retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving goal statistics', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取目标的聚合视图（权重分布）接口。
   *
   * @route GET /api/goals/:uuid/aggregate
   * @remarks
   * 返回目标及其所有关键结果的权重分布信息。
   *
   * @param req - AuthenticatedRequest
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 聚合视图数据
   */
  static async getGoalAggregateView(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证所有权
      const { error } = await GoalController.verifyGoalOwnership(uuid, accountUuid);
      if (error) {
        return GoalController.responseBuilder.sendError(res, error);
      }

      const service = await GoalController.getGoalService();
      // 需要传递 includeChildren: true 以获取 keyResults
      const goal = await service.getGoal(uuid, { includeChildren: true });

      if (!goal) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Goal not found',
        });
      }

      // 获取权重分布信息
      const snapshotService = await GoalController.getWeightSnapshotService();
      const weightInfo = await snapshotService.getWeightSumInfo(uuid);

      // 构建聚合视图响应
      // 注意：goal 是 GoalClientDTO，keyResults 也是 DTO，不是实体对象
      const keyResultsData = goal.keyResults || [];
      
      const response: GoalAggregateViewResponse = {
        goal: goal as GoalClientDTO,
        keyResults: keyResultsData.map((kr: any) => ({
          ...kr,
          weight: kr.weight || 0,
          weightPercentage: weightInfo.keyResults.find((w: any) => w.uuid === kr.uuid)?.percentage || 0,
        })),
        statistics: {
          totalKeyResults: keyResultsData.length,
          // DTO 的 isCompleted 是布尔值，不是方法
          completedKeyResults: keyResultsData.filter((kr: any) => kr.isCompleted === true).length,
          totalRecords: keyResultsData.reduce((sum: number, kr: any) => sum + (kr.records?.length || 0), 0),
          totalReviews: goal.reviews?.length || 0,
          overallProgress: Math.round(
            keyResultsData.reduce((sum: number, kr: any) => {
              const totalWeight = weightInfo.totalWeight;
              if (totalWeight === 0) return sum;
              const progressPercentage = kr.progress?.targetValue !== 0
                ? ((kr.progress?.currentValue || 0) / kr.progress.targetValue) * 100
                : 0;
              return sum + (progressPercentage * ((kr.weight || 0) / totalWeight));
            }, 0)
          ),
        },
      };

      return GoalController.responseBuilder.sendSuccess(
        res,
        response,
        'Goal aggregate view retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting goal aggregate view', { 
          error: error.message, 
          goalUuid: req.params.uuid 
        });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to get goal aggregate view',
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取目标进度分解详情接口。
   *
   * @route GET /api/goals/:uuid/progress-breakdown
   * @param req - AuthenticatedRequest
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 进度分解数据
   */
  static async getProgressBreakdown(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证所有权
      const { error } = await GoalController.verifyGoalOwnership(uuid, accountUuid);
      if (error) {
        return GoalController.responseBuilder.sendError(res, error);
      }

      const service = await GoalController.getRecordService();
      const breakdown = await service.getGoalProgressBreakdown(uuid);

      return GoalController.responseBuilder.sendSuccess(
        res,
        breakdown,
        'Progress breakdown retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting progress breakdown', { 
          error: error.message, 
          goalUuid: req.params.uuid 
        });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to get progress breakdown',
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  // ===== GoalRecord 管理 =====

  /**
   * 创建目标记录接口。
   *
   * @route POST /api/goals/:uuid/key-results/:keyResultUuid/records
   * @param req - AuthenticatedRequest
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 创建的记录
   */
  static async createGoalRecord(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { goalUuid, keyResultUuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const { error } = await GoalController.verifyGoalOwnership(goalUuid, accountUuid);
      if (error) {
        return GoalController.responseBuilder.sendError(res, error);
      }

      const service = await GoalController.getRecordService();
      const record = await service.createGoalRecord(goalUuid, keyResultUuid, req.body);

      logger.info('Goal record created successfully', { goalUuid, keyResultUuid, accountUuid });
      return GoalController.responseBuilder.sendSuccess(res, record, 'Goal record created', 201);
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating goal record', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取关键结果的所有记录接口。
   *
   * @route GET /api/goals/:uuid/key-results/:keyResultUuid/records
   * @param req - AuthenticatedRequest
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 记录列表
   */
  static async getGoalRecordsByKeyResult(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { goalUuid, keyResultUuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const { error } = await GoalController.verifyGoalOwnership(goalUuid, accountUuid);
      if (error) {
        return GoalController.responseBuilder.sendError(res, error);
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const service = await GoalController.getRecordService();
      const result = await service.getGoalRecordsByKeyResult(goalUuid, keyResultUuid, {
        page,
        limit,
        dateRange: startDate || endDate ? { start: startDate, end: endDate } : undefined,
      });

      return GoalController.responseBuilder.sendSuccess(
        res,
        result,
        'Goal records retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting goal records', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取目标的所有记录接口。
   *
   * @route GET /api/goals/:uuid/records
   * @param req - AuthenticatedRequest
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 记录列表
   */
  static async getGoalRecordsByGoal(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { goalUuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const { error } = await GoalController.verifyGoalOwnership(goalUuid, accountUuid);
      if (error) {
        return GoalController.responseBuilder.sendError(res, error);
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const service = await GoalController.getRecordService();
      const result = await service.getGoalRecordsByGoal(goalUuid, { page, limit });

      return GoalController.responseBuilder.sendSuccess(
        res,
        result,
        'Goal records retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting goal records', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 删除目标记录接口。
   *
   * @route DELETE /api/goals/:uuid/key-results/:keyResultUuid/records/:recordUuid
   * @param req - AuthenticatedRequest
   * @param res - Express 响应对象
   * @returns {Promise<Response>} 操作结果
   */
  static async deleteGoalRecord(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { goalUuid, keyResultUuid, recordUuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const { error } = await GoalController.verifyGoalOwnership(goalUuid, accountUuid);
      if (error) {
        return GoalController.responseBuilder.sendError(res, error);
      }

      const service = await GoalController.getRecordService();
      await service.deleteGoalRecord(goalUuid, keyResultUuid, recordUuid);

      logger.info('Goal record deleted successfully', { goalUuid, keyResultUuid, recordUuid, accountUuid });
      return GoalController.responseBuilder.sendSuccess(res, null, 'Goal record deleted');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deleting goal record', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }
}
