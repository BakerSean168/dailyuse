import { eventBus } from '@dailyuse/utils';
import type { LogoutReq } from '@dailyuse/contracts/authentication';
import { AuthIdentity } from '../aggregates/auth-identity';
import type { IAuthIdentityRepository } from '../repositories/i-auth-identity.repository';
import type { Context } from '@dailyuse/contracts/shared';
import type { IdentityId } from '@dailyuse/domain-shared/shared';
// 定义业务异常
export class UserNotFoundForLogoutError extends Error {
  constructor(userId: string) {
    super(`User with ID [${userId}] not found for logout.`);
    this.name = 'UserNotFoundForLogoutError';
  }
}

export class NotLoggedInError extends Error {
  constructor() {
    super('User is not currently logged in.');
    this.name = 'NotLoggedInError';
  }
}

/**
 * 登出领域服务
 * 职责：协调用户登出过程中的业务规则检查、会话清理和状态更�?
 */
export class LogoutService {
  
  // 通过构造函数注入仓储接�?(依赖倒置原则)
  constructor(
    private readonly identityRepo: IAuthIdentityRepository
  ) {}

  /**
   * 核心业务：用户登�?
   * @param req 登出请求数据 (包含用户ID或会话标�?
   * @returns 更新状态后的身份聚合根
   */
  public async logout(req: LogoutReq, ctx: Context): Promise<AuthIdentity> {
    const { identityId: rawId } = ctx;
    const identityId = rawId as IdentityId;

    // 1. 【查询】根据用户ID查找用户身份
    const identity = await this.identityRepo.findById(identityId);
    if (!identity) {
      throw new UserNotFoundForLogoutError(identityId);
    }

    // 2. 【验证】检查用户当前是否已登录
    // 这是领域服务职责：涉及跨聚合的业务规则验�?
    if (!identity.isLoggedIn()) {
      throw new NotLoggedInError();
    }

    // 3. 【清理】清除登录状态、会话和令牌
    // 在聚合根内部执行业务操作，修改其状�?
    identity.clearLogin();

    // 4. 【持久化】保存更新后的身份到数据�?
    // 领域事件会在仓储�?save 方法中被隐式处理和发布（�?LoggedOutEvent�?
    await this.identityRepo.save(identity);

    return identity;
  }

}
