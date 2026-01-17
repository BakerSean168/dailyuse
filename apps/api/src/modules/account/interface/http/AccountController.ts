import type { Request, Response } from 'express';
import { AccountApplicationService } from '@dailyuse/application-server/account';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountController');

/**
 * Account 控制器
 */
export class AccountController {
  private static accountService: AccountApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  private static async getAccountService(): Promise<AccountApplicationService> {
    if (!AccountController.accountService) {
      AccountController.accountService = await AccountApplicationService.getInstance();
    }
    return AccountController.accountService;
  }

  /**
   * 创建账户
   * @route POST /api/accounts
   */
  static async createAccount(req: Request, res: Response): Promise<Response> {
    try {
      const service = await AccountController.getAccountService();
      const account = await service.createAccount(req.body);
      logger.info('Account created successfully', { accountUuid: account.uuid });
      return AccountController.responseBuilder.sendSuccess(
        res,
        account,
        'Account created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating account', { error: error.message });
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取账户详情
   * @route GET /api/accounts/:uuid
   */
  static async getAccount(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const service = await AccountController.getAccountService();
      const account = await service.getAccount(uuid);

      if (!account) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Account not found',
        });
      }

      return AccountController.responseBuilder.sendSuccess(
        res,
        account,
        'Account retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving account', { error: error.message });
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新账户资料
   * @route PATCH /api/accounts/:uuid/profile
   */
  static async updateProfile(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const service = await AccountController.getAccountService();
      const account = await service.updateProfile(req.body);
      return AccountController.responseBuilder.sendSuccess(
        res,
        account,
        'Profile updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 验证邮箱
   * @route POST /api/accounts/:uuid/verify-email
   */
  static async verifyEmail(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const service = await AccountController.getAccountService();
      const account = await service.verifyEmail(uuid);
      return AccountController.responseBuilder.sendSuccess(
        res,
        account,
        'Email verified successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 停用账户
   * @route POST /api/accounts/:uuid/deactivate
   */
  static async deactivateAccount(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const service = await AccountController.getAccountService();
      const account = await service.deactivateAccount(uuid);
      return AccountController.responseBuilder.sendSuccess(
        res,
        account,
        'Account deactivated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 删除账户
   * @route DELETE /api/accounts/:uuid
   */
  static async deleteAccount(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const service = await AccountController.getAccountService();
      await service.deleteAccount(uuid);
      return AccountController.responseBuilder.sendSuccess(
        res,
        null,
        'Account deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 列出所有账户
   * @route GET /api/accounts
   */
  static async listAccounts(req: Request, res: Response): Promise<Response> {
    try {
      const { page, pageSize, status } = req.query;
      const service = await AccountController.getAccountService();
      const result = await service.listAccounts({
        page: page ? parseInt(page as string) : undefined,
        limit: pageSize ? parseInt(pageSize as string) : undefined,
        status: status as any,
      });
      return AccountController.responseBuilder.sendSuccess(
        res,
        result,
        'Accounts retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }
}


