import type { AuthSessionId, IdentityId } from '@dailyuse/contracts/authentication';
import type { AuthSession } from '../aggregates/auth-session';

/**
 * 会话聚合根仓储接口
 * 负责 AuthSession 的生命周期管理
 */
export interface AuthSessionRepository {
  /**
   * ✅ 保存会话 (新建登录或续期)
   */
  save(session: AuthSession): Promise<void>;

  /**
   * 🔍 根据 ID 查找 (用于校验 Token)
   */
  findById(id: AuthSessionId): Promise<AuthSession | null>;

  /**
   * 🔍 查找某用户的所有会话 (用于"我的设备"列表)
   */
  findByIdentityId(identityId: IdentityId): Promise<AuthSession[]>;

  /**
   * 🔍 查找并刷新 Token
   * (有些实现可能需要单独的方法来原子更新 AccessToken)
   */
  // updateToken(sessionId: SessionId, newToken: string): Promise<void>; // 可选，视实现而定

  /**
   * 🗑️ 移除单个会话 (登出 / 踢下线)
   */
  remove(session: AuthSession): Promise<void>;

  /**
   * 🗑️ 移除某用户的所有会话 (修改密码后强制下线 / 封号)
   */
  removeAllByIdentityId(identityId: IdentityId): Promise<void>;

  /**
   * 🧹 清理过期会话 (定时任务用)
   */
  removeExpired(): Promise<void>;
}