/**
 * API Configuration for Desktop Main Process
 *
 * 在 Electron 主进程中获取 API 配置
 * 支持环境变量和默认配置
 */

import { app } from 'electron';

/**
 * API 配置
 */
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//.test(value);
}

function normalizeBaseUrl(baseUrl: string, defaultPath = '/api/v1'): string {
  const trimmed = trimTrailingSlash(baseUrl);

  if (/\/api\/v\d+$/i.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}${defaultPath}`;
}

function getApiScheme(hostOrUrl: string): 'http' | 'https' {
  return /localhost|127\.0\.0\.1/i.test(hostOrUrl) ? 'http' : 'https';
}

/**
 * 获取 API 基础 URL
 *
 * 优先级：
 * 1. 环境变量 DAILYUSE_API_URL
 * 2. 环境变量 VITE_API_BASE_URL (开发模式)
 * 3. 默认远程服务器
 */
export function getApiBaseUrl(): string {
  const {
    DAILYUSE_API_URL,
    API_BASE_URL,
    VITE_API_BASE_URL,
    VITE_API_URL,
    PROXY_TARGET_URL,
    API_DOMAIN,
  } = process.env;

  const directBaseUrl = DAILYUSE_API_URL || API_BASE_URL;
  if (directBaseUrl) {
    return normalizeBaseUrl(directBaseUrl);
  }

  if (VITE_API_BASE_URL && isAbsoluteHttpUrl(VITE_API_BASE_URL)) {
    return normalizeBaseUrl(VITE_API_BASE_URL, '');
  }

  const basePath =
    VITE_API_BASE_URL && VITE_API_BASE_URL.startsWith('/') ? VITE_API_BASE_URL : '/api/v1';

  if (VITE_API_URL) {
    return normalizeBaseUrl(VITE_API_URL, basePath);
  }

  if (PROXY_TARGET_URL) {
    return normalizeBaseUrl(PROXY_TARGET_URL, basePath);
  }

  if (API_DOMAIN) {
    const normalizedDomain = API_DOMAIN.replace(/^https?:\/\//, '');
    return normalizeBaseUrl(`${getApiScheme(normalizedDomain)}://${normalizedDomain}`, basePath);
  }

  if (!app.isPackaged && VITE_API_BASE_URL && isAbsoluteHttpUrl(VITE_API_BASE_URL)) {
    return normalizeBaseUrl(VITE_API_BASE_URL, '');
  }

  throw new Error(
    'Desktop API base URL is not configured. Set DAILYUSE_API_URL, API_BASE_URL, VITE_API_URL, PROXY_TARGET_URL, or API_DOMAIN.',
  );
}

/**
 * 获取完整 API 配置
 */
export function getApiConfig(): ApiConfig {
  return {
    baseUrl: getApiBaseUrl(),
    timeout: Number(process.env.VITE_API_TIMEOUT || process.env.API_TIMEOUT) || 30000,
  };
}

/**
 * 创建完整的 API URL
 */
export function createApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  // 确保路径以 / 开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
