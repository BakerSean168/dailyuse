/**
 * @file AccountDeletionApplicationService.ts
 * @description 账户注销应用服务，负责账户删除流程编排。
 * @date 2025-01-22
 */

import type { IAccountRepository } from '@dailyuse/domain-server/account';
import type {
  IAuthCredentialRepository,
  IAuthSessionRepository,
} from '@dailyuse/domain-server/authentication';
import { eventBus, createLogger } from '@dailyuse/utils';
import bcrypt from 'bcryptjs';
import type { ITransactionManager } from '../../common/transaction.manager';

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
 * Account Deletion Application Service
 * 账户注销应用服务
 */
export class AccountDeletionApplicationService {
  private accountRepository: IAccountRepository;
  private credentialRepository: IAuthCredentialRepository;
  private sessionRepository: IAuthSessionRepository;
  private transactionManager: ITransactionManager;

  constructor(
    accountRepository: IAccountRepository,
    credentialRepository: IAuthCredentialRepository,
    sessionRepository: IAuthSessionRepository,
    transactionManager: ITransactionManager,
  ) {
    this.accountRepository = accountRepository;
    this.credentialRepository = credentialRepository;
    this.sessionRepository = sessionRepository;
    this.transactionManager = transactionManager;
  }

  /**
   * 账户注销主流程
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

      if (account.status === 'DELETED') {
        throw new Error('Account is already deleted');
      }

      // ===== 步骤 3: 验证密码 =====
      const credential = await this.credentialRepository.findByAccountUuid(account.uuid);
      if (!credential) {
        throw new Error('Authentication credential not found');
      }

      // 验证密码（bcrypt）
      // 从 AuthCredential 获取 PasswordCredential
      const passwordCredential = credential.passwordCredential;
      if (!passwordCredential) {
        throw new Error('Password credential not configured');
      }

      const isValid = await bcrypt.compare(request.password, passwordCredential.hashedPassword);

      if (!isValid) {
        throw new Error('Invalid password');
      }

      // ===== 步骤 4: 开启事务执行删除 =====
      const result = await this.transactionManager.transaction(async (tx: any) => {
        // a. 软删除账户
        account.softDelete();
        await this.accountRepository.save(account, tx);

        // b. 注销凭证
        credential.revoke();
        await this.credentialRepository.save(credential, tx);

        // c. 注销会话
        const sessions = await this.sessionRepository.findByAccountUuid(request.accountUuid, tx);

        for (const session of sessions) {
          session.revoke();
          await this.sessionRepository.save(session, tx);
        }

        return { account, credential, sessions };
      });

      // ===== 步骤 6: 发布事件 =====
      await this.publishAccountDeletedEvent(result.account, request.reason);

      logger.info('[AccountDeletionApplicationService] Account deletion successful', {
        accountUuid: request.accountUuid,
      });

      return {
        success: true,
        message: 'Account deleted successfully',
        deletedAt: result.account.deletedAt || Date.now(),
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

  private validateInput(request: DeleteAccountRequest): void {
    if (!request.accountUuid) {
      throw new Error('Account UUID is required');
    }
    if (!request.password) {
      throw new Error('Password is required for account deletion');
    }
    if (request.confirmationText !== 'DELETE') {
      throw new Error("Confirmation text must be 'DELETE'");
    }
  }

  private async publishAccountDeletedEvent(account: any, reason?: string): Promise<void> {
    eventBus.publish({
      eventType: 'account:deleted',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        reason,
        deletedAt: account.deletedAt,
      },
      timestamp: Date.now(),
      aggregateId: account.uuid,
      occurredOn: new Date(),
    });
  }
}
