/**
 * Account Application Service
 * 账户应用服务（协调器）
 *
 * 职责：
 * - 协调各个账户相关的应用服务
 * - 提供统一的账户操作接口
 * - 处理跨服务的业务流程
 *
 * 注意：这是一个协调器服务，实际业务逻辑委托给：
 * - RegistrationApplicationService（账户注册）
 * - AccountProfileApplicationService（资料管理）
 * - AccountStatusApplicationService（状态管理）
 * - AccountEmailApplicationService（邮箱管理）
 */

import { RegistrationApplicationService } from './registration-application-service';
import { AccountProfileApplicationService } from './account-profile-application-service';
import { AccountStatusApplicationService } from './account-status-application-service';
import { AccountEmailApplicationService } from './account-email-application-service';
import type {
  CreateAccountRequest,
  AccountDTO,
  AccountListResponseDTO,
  UpdateAccountProfileRequest,
  AccountQueryParams,
} from '@dailyuse/contracts/account';

export class AccountApplicationService {
  private static instance: AccountApplicationService;

  private registrationService!: RegistrationApplicationService;
  private profileService!: AccountProfileApplicationService;
  private statusService!: AccountStatusApplicationService;
  private emailService!: AccountEmailApplicationService;

  private constructor() {
    // 构造函数为空，实际初始化在 getInstance 中完成
  }

  /**
   * 获取单例实例
   */
  static async getInstance(): Promise<AccountApplicationService> {
    if (!AccountApplicationService.instance) {
      const instance = new AccountApplicationService();
      // 异步初始化所有子服务
      instance.registrationService = await RegistrationApplicationService.getInstance();
      instance.profileService = await AccountProfileApplicationService.getInstance();
      instance.statusService = await AccountStatusApplicationService.getInstance();
      instance.emailService = await AccountEmailApplicationService.getInstance();
      AccountApplicationService.instance = instance;
    }
    return AccountApplicationService.instance;
  }

  /**
   * 创建账户 - 委托给 RegistrationApplicationService
   * TODO: 需要重构以匹配子服务的实际方法签名
   */
  async createAccount(request: CreateAccountRequest): Promise<AccountDTO> {
    throw new Error('Method not implemented. Use RegistrationApplicationService directly.');
    // return this.registrationService.registerUser(request);
  }

  /**
   * 获取账户详情 - 委托给 ProfileApplicationService
   * TODO: 需要实现
   */
  async getAccount(accountUuid: string): Promise<AccountDTO> {
    throw new Error('Method not implemented. Use AccountProfileApplicationService directly.');
    // return this.profileService.getProfile(accountUuid);
  }

  /**
   * 列出账户 - 委托给 ProfileApplicationService
   * TODO: 需要实现
   */
  async listAccounts(request: AccountQueryParams): Promise<AccountListResponseDTO> {
    // TODO: implement proper list accounts logic
    return {
      accounts: [],
      total: 0,
      page: request.page || 1,
      limit: request.limit || 20,
    };
  }

  /**
   * 更新账户资料 - 委托给 ProfileApplicationService
   * TODO: 需要重构以匹配子服务的实际方法签名
   */
  async updateProfile(request: UpdateAccountProfileRequest): Promise<AccountDTO> {
    throw new Error('Method not implemented. Use AccountProfileApplicationService directly.');
    // return this.profileService.updateProfile(request);
  }

  /**
   * 验证邮箱 - 委托给 EmailApplicationService
   * TODO: 返回类型需要调整
   */
  async verifyEmail(accountUuid: string): Promise<void> {
    throw new Error('Method not implemented. Use AccountEmailApplicationService directly.');
    // await this.emailService.verifyEmail({ accountUuid });
  }

  /**
   * 停用账户 - 委托给 StatusApplicationService
   * TODO: 返回类型需要调整
   */
  async deactivateAccount(accountUuid: string): Promise<void> {
    throw new Error('Method not implemented. Use AccountStatusApplicationService directly.');
    // await this.statusService.deactivateAccount({ accountUuid });
  }

  /**
   * 删除账户 - 委托给 StatusApplicationService
   * TODO: 参数和返回类型需要调整
   */
  async deleteAccount(accountUuid: string): Promise<void> {
    throw new Error('Method not implemented. Use AccountStatusApplicationService directly.');
    // await this.statusService.deleteAccount({ accountUuid });
  }
}
