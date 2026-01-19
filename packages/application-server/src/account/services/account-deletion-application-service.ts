/**
 * @file AccountDeletionApplicationService.ts
 * @description 账户注销应用服务，负责账户删除流程编排。
 * @date 2025-01-22
 */

import type { IAccountRepository, Account } from '@dailyuse/domain-server/account';
import type {
  IAuthCredentialRepository,
  IAuthSessionRepository,
  AuthCredential,
  AuthSession,
} from '@dailyuse/domain-server/authentication';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import { AccountContainer } from '@dailyuse/infrastructure-server';
import { AuthenticationContainer } from '@dailyuse/infrastructure-server';
import { eventBus, createLogger } from '@dailyuse/utils';
import { prisma } from '@/shared/infrastructure/config/prisma';
import bcrypt from 'bcryptjs';

const logger = createLogger('AccountDeletionApplicationService');

/**
 * 账户注销请求接口。
 */
export interface DeleteAccountRequest {
  /** 账户 UUID */
  accountUuid: string;
  /** 二次验证密码 */
  password: string;
  /** 注销原因（可选） */
  reason?: string;
  /** 用户反馈（可选） */
  feedback?: string;
  /** 确认文本（必须为 "DELETE"） */
  confirmationText?: string;
}

/**
 * 账户注销响应接口。
 */
export interface DeleteAccountResponse {
  /** 操作是否成功 */
  success: boolean;
  /** 结果消息 */
  message: string;
  /** 删除时间戳 */
  deletedAt: number;
  /** 账户 UUID */
  accountUuid: string;
}

/**
 * 账户注销应用服务。
 *
 * @remarks
 * 负责协调账户注销的完整业务流程，包括：
 * - 验证输入和账户状态
 * - 执行密码二次验证
 * - 协调账户软删除、凭证注销和会话清理
 * - 事务管理（Saga 模式）
 * - 发布删除事件
 */
export class AccountDeletionApplicationService {
  private static instance: AccountDeletionApplicationService;

  private accountRepository: IAccountRepository;
  private credentialRepository: IAuthCredentialRepository;
  private sessionRepository: IAuthSessionRepository;
  private authenticationDomainService: AuthenticationDomainService;

  private constructor(
    accountRepository: IAccountRepository,
    credentialRepository: IAuthCredentialRepository,
    sessionRepository: IAuthSessionRepository,
  ) {
    this.accountRepository = accountRepository;
    this.credentialRepository = credentialRepository;
    this.sessionRepository = sessionRepository;
    this.authenticationDomainService = new AuthenticationDomainService();
  }

  /**
   * 创建应用服务实例（支持依赖注入）。
   *
   * @param accountRepository - 可选的账户仓储
   * @param credentialRepository - 可选的凭证仓储
   * @param sessionRepository - 可选的会话仓储
   * @returns {Promise<AccountDeletionApplicationService>} 服务实例
   */
  static async createInstance(
    accountRepository?: IAccountRepository,
    credentialRepository?: IAuthCredentialRepository,
    sessionRepository?: IAuthSessionRepository,
  ): Promise<AccountDeletionApplicationService> {
    const accountContainer = AccountContainer.getInstance();
    const authContainer = AuthenticationContainer.getInstance();

    const accRepo = accountRepository || accountContainer.getAccountRepository();
    const credRepo = credentialRepository || authContainer.getAuthCredentialRepository();
    const sessRepo = sessionRepository || authContainer.getAuthSessionRepository();

    AccountDeletionApplicationService.instance = new AccountDeletionApplicationService(
      accRepo,
      credRepo,
      sessRepo,
    );
    return AccountDeletionApplicationService.instance;
  }

  /**
   * 获取应用服务单例。
   *
   * @returns {Promise<AccountDeletionApplicationService>} 单例实例
   */
  static async getInstance(): Promise<AccountDeletionApplicationService> {
    if (!AccountDeletionApplicationService.instance) {
      AccountDeletionApplicationService.instance =
        await AccountDeletionApplicationService.createInstance();
    }
    return AccountDeletionApplicationService.instance;
  }

  /**
   * 账户注销主流程（使用 Saga 模式保证一致性）。
   *
   * @remarks
   * 执行步骤：
   * 1. 验证输入（确认文本、密码）。
   * 2. 查询账户并检查状态（不能已删除）。
   * 3. 查询凭证并验证密码（二次验证）。
   * 4. 开启事务：
   *    a. 软删除账户。
   *    b. 注销凭证。
   *    c. 注销所有活跃会话。
   * 5. 事务成功后，发布 `account:deleted` 事件。
   * 6. 返回删除结果。
   *
   * @param request - 注销请求数据
   * @returns {Promise<DeleteAccountResponse>} 注销结果
   * @throws {Error} 当验证失败、账户不存在或系统错误时抛出
   */
  async deleteAccount(request: DeleteAccountRequest): Promise<DeleteAccountResponse> {
    logger.info('[AccountDeletionApplicationService] Starting account deletion', {
      accountUuid: request.accountUuid,
      reason: request.reason,
    });

    try {
      // ===== 步骤 1: 验证输入 =====
      this.validateInput(request);

      // ===== 步骤 2: 查询账户 =====
      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error('Account not found');
      }

      // ===== 步骤 3: 检查账户状态 =====
      if (account.status === 'DELETED') {
        throw new Error('Account already deleted');
      }

      // ===== 步骤 4: 查询凭证并验证密码 =====
      const credential = await this.credentialRepository.findByAccountUuid(request.accountUuid);
      if (!credential) {
        throw new Error('Credential not found');
      }

      const hashedPassword = await bcrypt.hash(request.password, 12);
      const isPasswordValid = this.authenticationDomainService.verifyPassword(
        credential,
        hashedPassword,
      );

      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // ===== 步骤 5: 事务操作（Saga 模式） =====
      const result = await prisma.$transaction(async (tx: any) => {
        // 5a. 软删除账户
        account.softDelete();
        await this.accountRepository.save(account, tx);

        logger.info('[AccountDeletionApplicationService] Account marked as deleted', {
          accountUuid: account.uuid,
        });

        // 5b. 注销凭证
        credential.revoke();
        await this.credentialRepository.save(credential, tx);

        logger.info('[AccountDeletionApplicationService] Credential revoked', {
          accountUuid: account.uuid,
        });

        // 5c. 注销所有会话
        const sessions = await this.sessionRepository.findActiveSessionsByAccountUuid(
          request.accountUuid,
          tx,
        );

        for (const session of sessions) {
          session.revoke();
          await this.sessionRepository.save(session, tx);
        }

        logger.info('[AccountDeletionApplicationService] All sessions revoked', {
          accountUuid: account.uuid,
          sessionsCount: sessions.length,
        });

        return { account, credential, sessions };
      });

      // ===== 步骤 6: 发布账户删除事件（事务外） =====
      await this.publishAccountDeletedEvent(result.account, request.reason);

      logger.info('[AccountDeletionApplicationService] Account deletion successful', {
        accountUuid: request.accountUuid,
      });

      return {
        success: true,
        message: 'Account deleted successfully',
        deletedAt: result.account.deletedAt!,
        accountUuid: result.account.uuid,
      };
    } catch (error) {
      logger.error('[AccountDeletionApplicationService] Account deletion failed', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 验证输入参数。
   *
   * @param request - 请求数据
   * @throws {Error} 当参数缺失或无效时抛出
   */
  private validateInput(request: DeleteAccountRequest): void {
    if (!request.accountUuid) {
      throw new Error('Account UUID is required');
    }

    if (!request.password) {
      throw new Error('Password is required for verification');
    }

    // 验证确认文本（如果提供）
    if (request.confirmationText && request.confirmationText !== 'DELETE') {
      throw new Error('Confirmation text must be "DELETE"');
    }
  }

  /**
   * 发布账户删除事件。
   *
   * @param account - 被删除的账户实体
   * @param reason - 删除原因
   * @returns {Promise<void>}
   */
  private async publishAccountDeletedEvent(account: Account, reason?: string): Promise<void> {
    eventBus.publish({
      eventType: 'account:deleted',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        email: account.email,
        deletedAt: account.deletedAt,
        reason,
      },
      timestamp: Date.now(),
      aggregateId: account.uuid,
      occurredOn: new Date(),
    });

    logger.debug('[AccountDeletionApplicationService] Account deleted event published', {
      accountUuid: account.uuid,
    });
  }
}
