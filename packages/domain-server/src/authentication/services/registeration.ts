import { eventBus } from '@dailyuse/utils';
import type { RegisterByEmailReq } from '@dailyuse/contracts/authentication';
import { AuthIdentity } from '../aggregates/auth-identity';
import type { IAuthIdentityRepository } from '../repositories/i-auth-identity.repository';
import { PlainPassword } from '@dailyuse/domain-shared/authentication';
import type { IPasswordHasher } from '@dailyuse/domain-shared/authentication';
// 定义业务异常 (建议放在 shared 或单独的 errors 目录)
export class UserAlreadyExistsError extends Error {
  constructor(identifier: string) {
    super(`User with identifier [${identifier}] already exists.`);
    this.name = 'UserAlreadyExistsError';
  }
}

/**
 * 注册领域服务
 * 职责：协调用户注册过程中的业务规则检查、对象创建和持久化
 */
export class RegistrationService {
  
  // 通过构造函数注入仓储接口 (依赖倒置原则)
  constructor(
    private readonly identityRepo: IAuthIdentityRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  /**
   * 核心业务：邮箱注册
   * @param req 注册请求数据 (通常来自 Controller 解析后的 DTO)
   * @returns 新创建的身份聚合根
   */
  public async registerByEmail(req: RegisterByEmailReq): Promise<AuthIdentity> {
    const { email, password } = req;

    // 1. 【校验】检查邮箱唯一性 (业务规则)
    // 这是典型的领域服务职责：因为它需要查询跨聚合的状态，无法在 AuthIdentity 内部完成
    const exists = await this.identityRepo.existsByEmail(email);
    if (exists) {
      throw new UserAlreadyExistsError(email);
    }

    // 2. 【创建】调用聚合根的工厂方法
    // 注意：密码哈希逻辑通常封装在 AuthIdentity.create 或 HashedPassword.create 内部
    // 这里传入明文，聚合根内部会将其转换为 HashedPassword 值对象
    const identity = await AuthIdentity.createWithEmail({
      email,
      plainPassword: password, // 内部会自动 Hash
      hasher: this.passwordHasher
    });

    // 3. 【持久化】保存到数据库
    // 领域事件会在仓储的 save 方法中被隐式处理和发布
    await this.identityRepo.save(identity);

    return identity;
  }

}