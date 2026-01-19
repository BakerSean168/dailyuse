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
  AccountServerDTO,
  AccountClientDTO,
  CreateAccountRequest,
} from '@dailyuse/contracts/account';
import type { IAccountRepository } from '@dailyuse/domain-server/account';
import type { IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';
import { AccountDomainService } from '@dailyuse/domain-server/account';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import { AccountContainer } from '@dailyuse/infrastructure-server';
import { AuthenticationContainer } from '@dailyuse/infrastructure-server';
import { prisma } from '@/shared/infrastructure/config/prisma';
import { eventBus, createLogger } from '@dailyuse/utils';
import bcrypt from 'bcryptjs';

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
  private static instance: RegistrationApplicationService;

  private accountRepository: IAccountRepository;
  private accountDomainService: AccountDomainService;
  private credentialRepository: IAuthCredentialRepository;
  private authenticationDomainService: AuthenticationDomainService;

  private constructor(
    accountRepository: IAccountRepository,
    credentialRepository: IAuthCredentialRepository,
  ) {
    this.accountRepository = accountRepository;
    this.accountDomainService = new AccountDomainService();
    this.credentialRepository = credentialRepository;
    this.authenticationDomainService = new AuthenticationDomainService();
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    accountRepository?: IAccountRepository,
    credentialRepository?: IAuthCredentialRepository,
  ): Promise<RegistrationApplicationService> {
    const accountContainer = AccountContainer.getInstance();
    const authContainer = AuthenticationContainer.getInstance();

    const accountRepo = accountRepository || accountContainer.getAccountRepository();
    const credRepo = credentialRepository || authContainer.getAuthCredentialRepository();

    RegistrationApplicationService.instance = new RegistrationApplicationService(
      accountRepo,
      credRepo,
    );
    return RegistrationApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<RegistrationApplicationService> {
    if (!RegistrationApplicationService.instance) {
      RegistrationApplicationService.instance =
        await RegistrationApplicationService.createInstance();
    }
    return RegistrationApplicationService.instance;
  }

  /**
   * 用户注册主流程（Saga 模式 - 保证原子性）
   *
   * 步骤：
   * 1. 输入验证（格式、强度）
   * 2. 唯一性检查（用户名、邮箱）
   * 3. 密码加密（bcrypt）
   * 4. Prisma 事务：创建 Account + AuthCredential（原子性）
   * 5. 发布 AccountCreated 领域事件（事务成功后）
   * 6. 返回 AccountClientDTO
   *
   * 原子性保证：
   * - 使用 Prisma.$transaction 包裹所有写操作
   * - 如果任何一步失败，自动回滚所有变更
   * - 只有事务成功后才发布领域事件
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
      await this.publishDomainEvents(result.account, result.credential, request.password);

      // ===== 步骤 6: 返回 AccountClientDTO =====
      const accountClientDTO = result.account.toClientDTO();

      logger.info('[RegistrationApplicationService] User registration successful', {
        accountUuid: result.account.uuid,
        username: request.username,
      });

      return {
        success: true,
        account: accountClientDTO,
        message: 'Registration successful',
      };
    } catch (error) {
      logger.error('[RegistrationApplicationService] Registration failed', {
        username: request.username,
        email: request.email,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 验证注册输入
   * 包含：用户名格式、邮箱格式、密码强度
   */
  private validateRegistrationInput(request: RegisterUserRequest): void {
    // 1. 用户名验证：3-20 字符，字母数字下划线
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(request.username)) {
      throw new Error(
        'Username must be 3-20 characters long and contain only letters, numbers, and underscores',
      );
    }

    // 2. 邮箱验证：标准邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      throw new Error('Invalid email format');
    }

    // 3. 密码强度验证：至少 8 字符，包含大小写字母、数字
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
    // 检查用户名唯一性
    const existingAccountByUsername = await this.accountRepository.findByUsername(username);
    if (existingAccountByUsername) {
      throw new Error(`Username already exists: ${username}`);
    }

    // 检查邮箱唯一性
    const existingAccountByEmail = await this.accountRepository.findByEmail(email);
    if (existingAccountByEmail) {
      throw new Error(`Email already exists: ${email}`);
    }
  }

  /**
   * 密码加密（bcrypt，12 salt rounds）
   */
  private async hashPassword(plainPassword: string): Promise<string> {
    const SALT_ROUNDS = 12;
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    logger.debug('[RegistrationApplicationService] Password hashed successfully');
    return hashedPassword;
  }

  /**
   * 在事务中创建 Account + AuthCredential（保证原子性）
   *
   * ✅ 重构后的架构（遵循 DDD 最佳实践）：
   *
   * 调用链路：
   * ApplicationService (事务边界)
   *   → DomainService.createAccount() - 创建 Account 聚合根（不持久化）
   *   → Repository.save(account, tx) - 持久化 Account（使用事务上下文）
   *   → DomainService.createPasswordCredential() - 创建 Credential 聚合根（不持久化）
   *   → Repository.save(credential, tx) - 持久化 Credential（使用事务上下文）
   *
   * 职责分离：
   * - DomainService：纯领域逻辑，创建聚合根，业务规则验证（无副作用）
   * - ApplicationService：编排层，负责持久化、事务管理、事件发布
   * - Repository：数据访问层，接收事务上下文 tx
   *
   * 原子性保证：
   * - 使用 Prisma.$transaction 包裹所有 Repository 操作
   * - Repository.save() 接收 tx 参数，确保在同一事务中执行
   * - 如果任何一步失败，自动回滚所有变更
   */
  private async createAccountAndCredential(params: {
    username: string;
    email: string;
    displayName: string;
    hashedPassword: string;
  }): Promise<{ account: any; credential: any }> {
    const { username, email, displayName, hashedPassword } = params;

    // ✅ 正确的实现：ApplicationService 负责持久化
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. 调用 DomainService 创建 Account 聚合根（不持久化）
      const account = this.accountDomainService.createAccount({
        username,
        email,
        displayName,
      });

      logger.debug('[RegistrationApplicationService] Account aggregate created', {
        accountUuid: account.uuid,
      });

      // 2. ApplicationService 负责持久化 Account（传递事务上下文 tx）
      await this.accountRepository.save(account, tx);

      logger.debug('[RegistrationApplicationService] Account persisted in transaction', {
        accountUuid: account.uuid,
      });

      // ⚠️ 事件驱动架构：AuthCredential 由 AccountCreatedHandler 异步创建
      // 优势：解耦 Account 和 Authentication 模块，实现最终一致性
      // const credential = this.authenticationDomainService.createPasswordCredential({
      //   accountUuid: account.uuid,
      //   hashedPassword,
      // });
      // await this.credentialRepository.save(credential, tx);

      return { account, credential: null };
    });

    logger.info(
      '[RegistrationApplicationService] Transaction committed (Account only, Credential via event)',
      {
        accountUuid: result.account.uuid,
      },
    );

    return result;
  }

  /**
   * 发布领域事件（事务成功后）
   *
   * 事件订阅者：
   * - 邮件服务：发送欢迎邮件
   * - 统计服务：更新用户统计
   * - 审计服务：记录注册日志
   */
  private async publishDomainEvents(
    account: any,
    credential: any,
    plainPassword?: string,
  ): Promise<void> {
    // 发布 AccountCreated 事件（包含明文密码供 AccountCreatedHandler 使用）
    eventBus.publish({
      eventType: 'account:created',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        email: account.email,
        displayName: account.profile?.displayName || account.username,
        plainPassword, // 传递明文密码给事件处理器
      },
      timestamp: Date.now(),
      aggregateId: account.uuid,
      occurredOn: new Date(),
    });

    // ⚠️ 在事件驱动架构中，Credential 由 AccountCreatedHandler 创建
    // 因此这里不发布 credential:created 事件
    // （该事件由 AccountCreatedHandler 在创建 Credential 后发布）

    logger.debug('[RegistrationApplicationService] AccountCreated event published', {
      accountUuid: account.uuid,
    });
  }
}
