/**
 * 会话状态枚举
 */

export const SessionStatus = {
  ACTIVE: 'ACTIVE',     // 活跃
  EXPIRED: 'EXPIRED',   // 自然过期 (需要重新登录)
  REVOKED: 'REVOKED'    // 被撤销 (踢下线/登出/改密强制下线)
} as const;

export type SessionStatus = typeof SessionStatus[keyof typeof SessionStatus];