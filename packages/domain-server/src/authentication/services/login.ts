import { eventBus } from '@dailyuse/utils';
import type { LoginByEmailReq } from '@dailyuse/contracts/authentication';
import { AuthIdentity } from '../aggregates/auth-identity';
import type { IAuthIdentityRepository } from '../repositories/i-auth-identity.repository';
import { PlainPassword } from '@dailyuse/domain-shared/authentication';
import type { IPasswordHasher } from '@dailyuse/domain-shared/authentication';

// 定义业务异常
export class UserNotFoundError extends Error {
  constructor(identifier: string) {
    super(`User with identifier [${identifier}] not found.`);
    this.name = 'UserNotFoundError';
  }
}

export class InvalidPasswordError extends Error {
  constructor() {
    super('Invalid password provided.');
    this.name = 'InvalidPasswordError';
  }
}

/**
 * 登录领域服务
 * 职责：协调用户登录过程中的业务规则检查、身份验证和凭证校验
 */
export class LoginService {
  
  // 通过构造函数注入仓储接口 (依赖倒置原则)
  constructor(
    private readonly identityRepo: IAuthIdentityRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  /**
   * 核心业务：邮箱登录
   * @param req 登录请求数据 (通常来自 Controller 解析后的 DTO)
   * @returns 经过验证的身份聚合根
   */
  public async loginByEmail(req: LoginByEmailReq): Promise<AuthIdentity> {
    const { email, password } = req;

    // 1. 【查询】根据邮箱查找用户身份
    const identity = await this.identityRepo.findByEmail(email);
    if (!identity) {
      throw new UserNotFoundError(email);
    }

    // 2. 【验证】检查密码是否匹配
    // 这是领域服务职责：因为它涉及跨聚合根的业务规则验证
    // 密码验证逻辑通常封装在 HashedPassword 值对象的 verify 方法内
    const passwordValid = await identity.verifyPassword(password, this.passwordHasher);
    if (!passwordValid) {
      throw new InvalidPasswordError();
    }

    // 3. 【更新】更新最后登录时间和登录状态
    // 在聚合根内部执行业务操作，修改其状态
    // identity.recordLogin();

    // 4. 【持久化】保存更新后的身份到数据库
    await this.identityRepo.save(identity);

    return identity;
  }

}
