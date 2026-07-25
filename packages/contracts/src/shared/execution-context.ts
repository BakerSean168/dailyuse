/**
 * Execution context — extracted from auth token / transport edge by middleware.
 * 执行上下文 — 由中间件从认证 token / 传输层提取。
 */
export interface ExecutionContext {
  identityId: string;
  /**
   * Optional device id when available at the transport edge.
   * 传输层可用时的可选设备 ID。
   */
  deviceId?: string;
  /**
   * Optional richer client metadata captured at login/register.
   * 登录/注册时可选采集的更完整客户端元数据。
   */
  device?: {
    deviceName?: string | null;
    os?: string | null;
    browser?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    deviceType?: string;
    deviceFingerprint?: string;
  };
}
