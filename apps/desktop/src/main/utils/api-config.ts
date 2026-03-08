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

/**
 * 获取 API 基础 URL
 *
 * 优先级：
 * 1. 环境变量 DAILYUSE_API_URL
 * 2. 环境变量 VITE_API_BASE_URL (开发模式)
 * 3. 默认远程服务器
 */
export function getApiBaseUrl(): string {
  // 检查多个可能的环境变量
  const envUrl =
    process.env.DAILYUSE_API_URL ||
    process.env.VITE_API_BASE_URL ||
    process.env.API_BASE_URL;

  if (envUrl) {
    return envUrl;
  }

  // 开发模式使用本地或测试服务器
  if (!app.isPackaged) {
    return 'http://localhost:3000/api/v1';
  }

  // 生产模式使用默认服务器
  return 'https://api.dailyuse.app/api/v1';
}

/**
 * 获取完整 API 配置
 */
export function getApiConfig(): ApiConfig {
  return {
    baseUrl: getApiBaseUrl(),
    timeout: 30000, // 30 秒超时
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
