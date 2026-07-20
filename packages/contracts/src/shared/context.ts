export interface Context {
  identityId: string;
  deviceId: string;
  /**
   * Optional richer client metadata captured at the transport edge.
   * 传输层可选采集的更完整客户端元数据。
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
