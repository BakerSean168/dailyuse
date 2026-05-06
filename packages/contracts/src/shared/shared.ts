import { z } from 'zod';
import { openApiJsonValue } from '../primitives';

/**
 * 分页查询参数 (Zod Schema)
 */
export const PaginationQuery = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuery>;

/**
 * 分页响应工厂 (Zod Schema)
 */
export const Paginated = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
  });

/**
 * 错误响应 (Zod Schema)
 */
export const ZodErrorResponse = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), openApiJsonValue).optional(),
  traceId: z.string().optional(),
});
export type ZodErrorResponse = z.infer<typeof ZodErrorResponse>;

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
