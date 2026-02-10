import type { IdentityId } from '@dailyuse/contracts/authentication';
import type { OAuthProvider } from '../../domain-shared';
import type { AuthIdentity } from '../aggregates/auth-identity';

/**
 * 身份聚合根仓储接�?
 * 负责 AuthIdentity 的持久化和查�?
 */
export interface IAuthIdentityRepository {
  /**
   * �?保存或更新身�?
   * 新增时：将聚合根持久化到数据�?
   * 更新时：比对变更并更�?(或者全量覆�?
   */
  save(identity: AuthIdentity): Promise<void>;

  /**
   * 🔍 根据 ID 查找
   * 用于：获取当前用户信息、修改密码等后续操作
   */
  findById(id: IdentityId): Promise<AuthIdentity | null>;

  /**
   * 🔍 根据邮箱查找 (用于邮箱登录/注册查重)
   * 注意：虽�?Email �?Credential 的一部分，但我们需要找到所属的 Identity
   */
  findByEmail(email: string): Promise<AuthIdentity | null>;

  /**
   * 🔍 根据手机号查�?(用于手机登录/注册查重)
   */
  findByPhone(phoneNumber: string): Promise<AuthIdentity | null>;

  /**
   * 🔍 根据 OAuth 信息查找 (用于第三方登�?
   * 需要匹�?provider �?openId (sub)
   */
  findByOAuth(provider: OAuthProvider, subjectId: string): Promise<AuthIdentity | null>;

  /**
   * 🛡�?检查邮箱是否存�?(性能优化，只返回 boolean)
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * 🛡�?检查手机号是否存在
   */
  existsByPhone(phoneNumber: string): Promise<boolean>;

  /**
   * 🗑�?删除身份 (注销账号)
   */
  delete(identity: AuthIdentity): Promise<void>;
}
