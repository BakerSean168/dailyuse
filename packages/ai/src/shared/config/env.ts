/**
 * Environment Configuration
 *
 * 服务端环境变量配置
 */

export const env = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  QI_NIU_YUN_API_KEY: process.env.QI_NIU_YUN_API_KEY || '',
  QI_NIU_YUN_BASE_URL: process.env.QI_NIU_YUN_BASE_URL || '',
  QI_NIU_YUN_MODEL_ID: process.env.QI_NIU_YUN_MODEL_ID || '',
};

export interface AIServiceRuntimeConfig {
  baseUrl: string;
  serviceSecret: string;
  serviceName: string;
  timeoutMs: number;
}

/**
 * Read ai-service runtime configuration lazily from process.env.
 *
 * This helper intentionally does not validate at module import time. The host
 * application controls when environment files are loaded, so we only inspect
 * `process.env` at the moment the AI module is assembled.
 */
export function getAIServiceRuntimeConfig(): AIServiceRuntimeConfig | null {
  const baseUrl = process.env.AI_SERVICE_BASE_URL?.trim();
  const serviceSecret = process.env.AI_SERVICE_SECRET?.trim();

  if (!baseUrl || !serviceSecret) {
    return null;
  }

  return {
    baseUrl,
    serviceSecret,
    serviceName: process.env.AI_SERVICE_INTERNAL_NAME?.trim() || 'memoflow-api',
    timeoutMs: Number(process.env.AI_SERVICE_TIMEOUT_MS ?? 60_000),
  };
}
