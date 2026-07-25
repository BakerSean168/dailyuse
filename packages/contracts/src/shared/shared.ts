/**
 * Residual 645: shared dual error-response schema and unused pagination helpers retired.
 * HTTP/API errors use Result/HttpResponse envelopes; pagination lives module-side.
 */

/**
 * 设备信息类型
 */
export type ClientInfo = {
  deviceId: string;
  deviceName: string;
  userAgent: string;
  ipAddress?: string;
};

/**
 * 用户协议同意信息
 */
export type UserAgreement = {
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  termsVersion: string; // 协议版本号，如 "1.0.0"
  privacyVersion: string; // 隐私政策版本号
  agreedAt: number; // 数字格式
  ipAddress?: string; // 同意时的IP地址
};
