/**
 * Registration Application Service
 * 用户注册应用服务 - 负责用户注册的完整流程编排
 *
 * 架构职责（遵循 DDD + Saga 模式）：
 * - 创建 Account 聚合根
 * - 数据验证（用户名、邮箱格式）
 * - 唯一性检查（用户名、邮箱）
 * - 调用 Authentication 模块创建 AuthCredential（同步调用）
 * - 使用 Prisma 事务保证原子性
 * - 发布 AccountCreated 领域事件（事务成功后）
 * - 返回 AccountClientDTO
 *
 * 原子性保证（Saga 模式）：
 * - 使用 Prisma.$transaction 包裹 Account + AuthCredential 创建
 * - 如果 AuthCredential 创建失败，自动回滚 Account
 * - 事务成功后才发布领域事件
 *
 * 模块协作方式：
 * - Account Module ↔ Authentication Module：通过 DomainService 同步调用
 * - 其他订阅者（邮件、统计等）：通过事件总线异步通知
 */

import type {
  AccountClientDTO,
} from '@dailyuse/contracts/account';
import type { IAccountRepository } from '@dailyuse/domain-server/account';
import type { IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';
import { AccountDomainService } from '@dailyuse/domain-server/account';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import { eventBus, createLogger } from '@dailyuse/utils';
import bcrypt from 'bcryptjs';
import type { ITransactionManager } from '../../common/transaction.manager';

const logger = createLogger('RegistrationApplicationService');

/**
 * 注册请求接口
 */
export interface RegisterUserRequest {
  username: string;
  email: string;
  password: string;
  profile?: {
    nickname?: string;
    avatarUrl?: string;
    bio?: string;
  };
}

/**
 * 注册响应接口
 */
export interface RegisterUserResponse {
  success: boolean;
  account: AccountClientDTO;
  message: string;
}

/**
 * Registration Application Service
 * 负责用户注册的核心业务逻辑编排
 */
export class RegistrationApplicationService {
  private accountRepository: IAccountRepository;
  private accountDomainService: AccountDomainService;
  private credentialRepository: IAuthCredentialRepository;
  private authenticationDomainService: AuthenticationDomainService;
  private transactionManager: ITransactionManager;

  constructor(
    accountRepository: IAccountRepository,
    credentialRepository: IAuthCredentialRepository,
    transactionManager: ITransactionManager,
  ) {
    this.accountRepository = accountRepository;
    this.accountDomainService = new AccountDomainService();
    this.credentialRepository = credentialRepository;
    this.authenticationDomainService = new AuthenticationDomainService();
    this.transactionManager = transactionManager;
  }

  /**
   * 用户注册主流程（Saga 模式 - 保证原子性）
   */
  async registerUser(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    logger.info('[RegistrationApplicationService] Starting user registration', {
      username: request.username,
      email: request.email,
    });

    try {
      // ===== 步骤 1: 输入验证 =====
      this.validateRegistrationInput(request);

      // ===== 步骤 2: 唯一性检查 =====
      await this.checkUniqueness(request.username, request.email);

      // ===== 步骤 3: 密码加密 =====
      const hashedPassword = await this.hashPassword(request.password);

      // ===== 步骤 4: 事务 - 创建 Account + AuthCredential（原子性）=====
      const result = await this.createAccountAndCredential({
        username: request.username,
        email: request.email,
        displayName: request.profile?.nickname || request.username,
        hashedPassword,
      });

      // ===== 步骤 5: 发布领域事件（事务成功后）=====
      const accountDTO = result.account.toClientDTO();
      
      eventBus.publish('account.created', {
        account: accountDTO,
        timestamp: new Date().toISOString(), 
      });

      logger.info('[RegistrationApplicationService] User registration successful', {
        accountUuid: result.account.uuid,
      });

      return {
        success: true,
        account: accountDTO,
        message: 'Registration successful',
      };
    } catch (error: any) {
      logger.error('[RegistrationApplicationService] Registration failed', error);
      throw error;
    }
  }

  /**
   * 验证注册输入
   */
  private validateRegistrationInput(request: RegisterUserRequest): void {
    // 1. 用户名验证
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(request.username)) {
      throw new Error(
        'Username must be 3-20 characters long and contain only letters, numbers, and underscores',
      );
    }

    // 2. 邮箱验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      throw new Error('Invalid email format');
    }

    // 3. 密码强度验证
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(request.password)) {
      throw new Error(
        'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers',
      );
    }
  }

  /**
   * 检查用户名和邮箱的唯一性
   */
  private async checkUniqueness(username: string, email: string): Promise<void> {
    const existingAccountByUsername = await this.accountRepository.findByUsername(username);
    if (existingAccountByUsername) {
      throw new Error(`Username already exists: ${username}`);
    }

    const existingAccountByEmail = await this.accountRepository.findByEmail(email);
    if (existingAccountByEmail) {
      throw new Error(`Email already registered: ${email}`);
    }
  }

  /**
   * 密码加密
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * 在事务中创建 Account 和 Credential
   */
  private async createAccountAndCredential(params: {
    username: string;
    email: string;
    displayName: string;
    hashedPassword: string;
  }): Promise<{ account: any; credential: any }> {
    const { username, email, displayName, hashedPassword } = params;

    return await this.transactionManager.transaction(async (tx: any) => {
      // 1. 创建 Account
      const account = this.accountDomainService.createAccount({
        username,
        email,
        displayName,
      });

      await this.accountRepository.save(account, tx);

      // 2. 创建 Credential
      // 注意：CredentialRepository 需要支持 tx 参数
      const credential = this.authenticationDomainService.createPasswordCredential({
        accountUuid: account.uuid,
        hashedPassword,
      });
      
      await this.credentialRepository.save(credential, tx);
      
      return { account, credential };
    });
  }
}
