/**
 * Register Account Service
 *
 * 用户注册
 */

import type { IAccountRepository } from '@dailyuse/domain-server/account';
import type { IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';
import { AccountDomainService } from '@dailyuse/domain-server/account';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import type { AccountClientDTO, CreateAccountRequest } from '@dailyuse/contracts/account';
import { eventBus } from '@dailyuse/utils';
import { AccountContainer, AuthContainer } from '@dailyuse/infrastructure-server';

/**
 * Register Account Service
 */
export class RegisterAccount {
  private static instance: RegisterAccount;
  private readonly accountDomainService: AccountDomainService;
  private readonly authDomainService: AuthenticationDomainService;

  private constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly credentialRepository: IAuthCredentialRepository,
  ) {
    this.accountDomainService = new AccountDomainService();
    this.authDomainService = new AuthenticationDomainService();
  }

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(
    accountRepository?: IAccountRepository,
    credentialRepository?: IAuthCredentialRepository,
  ): RegisterAccount {
    const accountContainer = AccountContainer.getInstance();
    const authContainer = AuthContainer.getInstance();
    const accountRepo = accountRepository || accountContainer.getAccountRepository();
    const credentialRepo = credentialRepository || authContainer.getCredentialRepository();
    RegisterAccount.instance = new RegisterAccount(accountRepo, credentialRepo);
    return RegisterAccount.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): RegisterAccount {
    if (!RegisterAccount.instance) {
      RegisterAccount.instance = RegisterAccount.createInstance();
    }
    return RegisterAccount.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RegisterAccount.instance = undefined as unknown as RegisterAccount;
  }

  async execute(input: CreateAccountRequest & { password: string }): Promise<AccountClientDTO> {
    // 1. 验证唯一性
    const existingByUsername = await this.accountRepository.findByUsername(input.username);
    if (existingByUsername) {
      throw new Error('用户名已存在');
    }

    const existingByEmail = await this.accountRepository.findByEmail(input.email);
    if (existingByEmail) {
      throw new Error('邮箱已被注册');
    }

    // 2. 验证密码强度
    const passwordValidation = this.authDomainService.validatePasswordStrength(input.password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join('; '));
    }

    // 3. 创建账户
    const account = this.accountDomainService.createAccount({
      username: input.username,
      email: input.email,
      displayName: input.displayName || input.username,
      timezone: input.timezone,
      language: input.language,
    });

    // 4. 保存账户
    await this.accountRepository.save(account);

    // 5. 创建认证凭证（需要先 hash 密码）
    // 注意：实际应用中应该在这里 hash 密码
    // const hashedPassword = await bcrypt.hash(input.password, 10);
    const credential = this.authDomainService.createPasswordCredential({
      accountUuid: account.uuid,
      hashedPassword: input.password, // TODO: 实际应用中需要 hash
    });
    await this.credentialRepository.save(credential);

    // 6. 发布事件
    const events = account.getDomainEvents();
    for (const event of events) {
      await eventBus.publish(event);
    }

    return account.toClientDTO();
  }
}
