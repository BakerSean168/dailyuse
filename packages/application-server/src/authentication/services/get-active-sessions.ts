/**
 * Get Active Sessions Service
 *
 * 获取活跃会话列表应用服务
 */

import type { IAuthSessionRepository } from '@dailyuse/domain-server/authentication';
import type { AuthSessionClientDTO } from '@dailyuse/contracts/authentication';

/**
 * Get Active Sessions Service
 */
export class GetActiveSessions {
  constructor(private readonly sessionRepository: IAuthSessionRepository) {}

  /**
   * 执行获取活跃会话
   */
  async execute(accountUuid: string, options?: { skip?: number; take?: number }): Promise<{ sessions: AuthSessionClientDTO[]; total: number }> {
    // 1. 查找会话
    const sessions = await this.sessionRepository.findByAccountUuid(
      accountUuid,
      { skip: options?.skip, take: options?.take },
    );

    // 2. 过滤活跃会话（status === 'ACTIVE' 且未过期）
    const activeSessions = sessions.filter(s => s.status === 'ACTIVE' && s.isValid());

    // 3. 转换为 DTO
    const sessionDTOs = activeSessions.map(s => s.toClientDTO());

    return {
      sessions: sessionDTOs,
      total: activeSessions.length,
    };
  }
}
