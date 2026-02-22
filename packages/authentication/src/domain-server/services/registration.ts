import { eventBus } from '@dailyuse/utils';
import type { RegisterByEmailReq } from '@dailyuse/contracts/authentication';
import { AuthIdentity } from '../aggregates/auth-identity';
import type { IAuthIdentityRepository } from '../repositories/i-auth-identity.repository';
import { PlainPassword } from '../../domain-shared';
import type { IPasswordHasher } from '../../domain-shared';
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
    const exists = await this.identityRepo.existsByEmail(email);
    if (exists) {
      throw new UserAlreadyExistsError(email);
    }

    // 2. 【创建】调用聚合根的工厂方法
    // 使用新的 createWithEmailAndPassword，email 进入 identifiers，password 进入 credentials
    const identity = await AuthIdentity.createWithEmailAndPassword({
      email,
      plainPassword: password,
      hasher: this.passwordHasher
    });

    // 3. 【持久化】保存到数据库
    await this.identityRepo.save(identity);

    return identity;
  }

}
