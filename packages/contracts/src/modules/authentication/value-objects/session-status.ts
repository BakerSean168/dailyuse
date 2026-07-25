/**
 * 会话状态枚举
 * Residual 889: domain enum SessionStatus ≠ desktop protocol SessionStatusDTO/SessionStatus extension.
 */

export const SessionStatus = {
  Active: 'Active', // 活跃
  Expired: 'Expired', // 自然过期 (需要重新登录)
  Revoked: 'Revoked', // 被撤销 (踢下线/登出/改密强制下线)
} as const;

export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];
