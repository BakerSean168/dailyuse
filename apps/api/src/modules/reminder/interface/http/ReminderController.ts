import type { Request, Response } from 'express';
import { ReminderApplicationService } from '../../application/services/ReminderApplicationService';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { 
  createLogger,
  DomainError,
  isDomainError,
} from '@dailyuse/utils';
import {
  ReminderTemplateNotFoundError,
  ReminderTemplateMethodMissingError,
  ReminderTemplateUpdateError,
} from '../../errors/ReminderErrors';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';

const logger = createLogger('ReminderController');

/**
 * Reminder 控制器
 * 负责处理 HTTP 请求和响应，协调应用服务
 *
 * 职责：
 * - 解析 HTTP 请求参数
 * - 调用应用服务处理业务逻辑
 * - 格式化响应（统一使用 ResponseBuilder）
 * - 异常处理和错误响应
 */
export class ReminderController {
  private static reminderService: ReminderApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 初始化应用服务（延迟加载）
   */
  private static async getReminderService(): Promise<ReminderApplicationService> {
    if (!ReminderController.reminderService) {
      ReminderController.reminderService = await ReminderApplicationService.getInstance();
    }
    return ReminderController.reminderService;
  }

  /**
   * 创建提醒模板
   * @route POST /api/reminders/templates
   */
  static async createReminderTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      const service = await ReminderController.getReminderService();
      logger.info('Creating reminder template', { accountUuid });

      // 合并 accountUuid 到请求体
      const template = await service.createReminderTemplate({
        ...req.body,
        accountUuid,
      });

      logger.info('Reminder template created successfully', { templateUuid: template.uuid });
      return ReminderController.responseBuilder.sendSuccess(
        res,
        template,
        'Reminder template created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating reminder template', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取提醒模板详情
   * @route GET /api/reminders/templates/:uuid
   */
  static async getReminderTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await ReminderController.getReminderService();
      const template = await service.getReminderTemplate(uuid);

      if (!template) {
        logger.warn('Reminder template not found', { uuid });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Reminder template not found',
        });
      }

      return ReminderController.responseBuilder.sendSuccess(
        res,
        template,
        'Reminder template retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving reminder template', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取用户的所有提醒模板
   * @route GET /api/reminders/templates/user/:accountUuid
   */
  static async getUserReminderTemplates(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;

      const service = await ReminderController.getReminderService();
      const templates = await service.getUserReminderTemplates(accountUuid);

      return ReminderController.responseBuilder.sendSuccess(
        res,
        templates,
        'Reminder templates retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving user reminder templates', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取当前用户的所有提醒模板（从 token 中提取 accountUuid）
   * @route GET /api/reminders/templates
   */
  static async getUserReminderTemplatesByToken(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;

      const service = await ReminderController.getReminderService();
      const templates = await service.getUserReminderTemplates(accountUuid);

      logger.info('Retrieved reminder templates for user', {
        accountUuid,
        count: templates.length,
      });

      // 实现简单的分页
      const total = templates.length;
      const paginatedTemplates = limit
        ? templates.slice((page - 1) * limit, page * limit)
        : templates;

      return ReminderController.responseBuilder.sendSuccess(
        res,
        {
          templates: paginatedTemplates,
          total,
          page,
          pageSize: limit || total,
          hasMore: limit ? page * limit < total : false,
        },
        'Reminder templates retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving user reminder templates by token', {
          error: error.message,
        });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新提醒模板
   * @route PATCH /api/reminders/templates/:uuid
   */
  static async updateReminderTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const service = await ReminderController.getReminderService();

      logger.info('Updating reminder template', { uuid });
      const template = await service.updateReminderTemplate(uuid, req.body);

      logger.info('Reminder template updated successfully', { uuid });
      return ReminderController.responseBuilder.sendSuccess(
        res,
        template,
        'Reminder template updated successfully',
      );
    } catch (error) {
      // 处理已知的领域错误
      if (isDomainError(error)) {
        logger.error('Domain error occurred', error.toLogString());
        
        // 使用统一的错误响应格式
        return res.status(error.httpStatus).json({
          success: false,
          code: error.code,
          message: error.message,
          timestamp: error.timestamp,
          ...(error.context && { context: error.context }),
          ...(error.operationId && { operationId: error.operationId }),
        });
      }
      
      // 未知错误
      logger.error('Unknown error updating reminder template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  /**
   * 删除提醒模板
   * @route DELETE /api/reminders/templates/:uuid
   */
  static async deleteReminderTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await ReminderController.getReminderService();
      await service.deleteReminderTemplate(uuid);

      logger.info('Reminder template deleted successfully', { uuid });
      return ReminderController.responseBuilder.sendSuccess(
        res,
        null,
        'Reminder template deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deleting reminder template', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 切换提醒模板启用状态
   * @route POST /api/reminders/templates/:uuid/toggle
   */
  static async toggleReminderTemplateStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await ReminderController.getReminderService();
      const template = await service.toggleReminderTemplateStatus(uuid);

      logger.info('Reminder template status toggled', { uuid });
      return ReminderController.responseBuilder.sendSuccess(
        res,
        template,
        'Reminder template status toggled successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error toggling reminder template status', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 移动提醒模板到分组
   * @route POST /api/reminders/templates/:uuid/move
   */
  static async moveTemplateToGroup(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const { targetGroupUuid } = req.body;

      // targetGroupUuid 可以是 null（移出分组）或字符串（移入分组）
      if (targetGroupUuid !== null && typeof targetGroupUuid !== 'string') {
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'targetGroupUuid must be a string or null',
        });
      }

      const service = await ReminderController.getReminderService();
      logger.info('Moving reminder template to group', { uuid, targetGroupUuid });

      const template = await service.moveTemplateToGroup(uuid, targetGroupUuid);

      logger.info('Reminder template moved successfully', { uuid, targetGroupUuid });
      return ReminderController.responseBuilder.sendSuccess(
        res,
        template,
        'Reminder template moved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error moving reminder template', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 搜索提醒模板
   * @route GET /api/reminders/templates/search
   */
  static async searchReminderTemplates(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid, query } = req.query;

      if (!accountUuid || !query) {
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Missing required query params: accountUuid, query',
        });
      }

      const service = await ReminderController.getReminderService();
      const templates = await service.searchReminderTemplates(
        accountUuid as string,
        query as string,
      );

      return ReminderController.responseBuilder.sendSuccess(
        res,
        templates,
        'Reminder templates searched successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error searching reminder templates', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取提醒统计
   * @route GET /api/reminders/statistics/:accountUuid
   */
  static async getReminderStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;

      const service = await ReminderController.getReminderService();
      const statistics = await service.getReminderStatistics(accountUuid);

      return ReminderController.responseBuilder.sendSuccess(
        res,
        statistics,
        'Reminder statistics retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving reminder statistics', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取即将到来的提醒（基于调度计算）
   * @route GET /api/reminders/upcoming
   */
  static async getUpcomingReminders(req: Request, res: Response): Promise<Response> {
    try {
      const { days, limit, importanceLevel, type } = req.query;
      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      const service = await ReminderController.getReminderService();
      const result = await service.getUpcomingReminders({
        accountUuid,
        days: days ? Number(days) : undefined,
        limit: limit ? Number(limit) : undefined,
        importanceLevel: importanceLevel as any,
        type: type as any,
      });

      return ReminderController.responseBuilder.sendSuccess(
        res,
        result,
        'Upcoming reminders retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving upcoming reminders', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取模板的调度状态
   * @route GET /api/reminders/templates/:uuid/schedule-status
   */
  static async getTemplateScheduleStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await ReminderController.getReminderService();
      const status = await service.getTemplateScheduleStatus(uuid);

      return ReminderController.responseBuilder.sendSuccess(
        res,
        status,
        'Template schedule status retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving template schedule status', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  // ===== Reminder Group 管理 =====

  /**
   * 创建提醒分组
   * @route POST /api/reminders/groups
   */
  static async createReminderGroup(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      const service = await ReminderController.getReminderService();
      const group = await service.createReminderGroup({
        ...req.body,
        accountUuid,
      });

      logger.info('Reminder group created successfully', { groupUuid: group.uuid });
      return ReminderController.responseBuilder.sendSuccess(
        res,
        group,
        'Reminder group created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating reminder group', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取分组详情
   * @route GET /api/reminders/groups/:uuid
   */
  static async getReminderGroup(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const service = await ReminderController.getReminderService();
      const group = await service.getReminderGroup(uuid);

      if (!group) {
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Reminder group not found',
        });
      }

      return ReminderController.responseBuilder.sendSuccess(res, group, 'Reminder group retrieved successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving reminder group', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取用户的所有分组
   * @route GET /api/reminders/groups/user/:accountUuid
   */
  static async getUserReminderGroups(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;
      const service = await ReminderController.getReminderService();
      const groups = await service.getUserReminderGroups(accountUuid);

      return ReminderController.responseBuilder.sendSuccess(
        res,
        groups,
        'Reminder groups retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving user reminder groups', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取当前用户的所有分组（从 token 获取）
   * @route GET /api/reminders/groups
   */
  static async getUserReminderGroupsByToken(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      const service = await ReminderController.getReminderService();
      const groups = await service.getUserReminderGroups(accountUuid);

      return ReminderController.responseBuilder.sendSuccess(
        res,
        {
          groups,
          total: groups.length,
        },
        'Reminder groups retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving user reminder groups by token', {
          error: error.message,
        });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新分组
   * @route PATCH /api/reminders/groups/:uuid
   */
  static async updateReminderGroup(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const service = await ReminderController.getReminderService();
      const group = await service.updateReminderGroup(uuid, req.body);

      return ReminderController.responseBuilder.sendSuccess(
        res,
        group,
        'Reminder group updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error updating reminder group', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 删除分组
   * @route DELETE /api/reminders/groups/:uuid
   */
  static async deleteReminderGroup(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const service = await ReminderController.getReminderService();
      await service.deleteReminderGroup(uuid);

      return ReminderController.responseBuilder.sendSuccess(
        res,
        null,
        'Reminder group deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deleting reminder group', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }
}


