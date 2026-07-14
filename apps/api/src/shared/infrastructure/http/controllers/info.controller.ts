/**
 * @file info.controller.ts
 * @description 应用信息控制器 - 提供版本、构建和运行时信息
 * @date 2025-12-22
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Request, Response } from 'express';
import { env } from '../../config/env.js';

const controllerDir = dirname(fileURLToPath(import.meta.url));

function loadApiPackageInfo(): { name: string; version: string; description?: string } {
  const candidates = [
    // apps/api/package.json (source layout)
    join(controllerDir, '../../../../../package.json'),
    // apps/api/package.json (dist layout: dist/shared/infrastructure/http/controllers)
    join(controllerDir, '../../../../package.json'),
  ];

  for (const candidate of candidates) {
    try {
      const raw = readFileSync(candidate, 'utf8');
      const parsed = JSON.parse(raw) as { name?: string; version?: string; description?: string };
      if (parsed.name && parsed.version) {
        return {
          name: parsed.name,
          version: parsed.version,
          description: parsed.description,
        };
      }
    } catch {
      // try next candidate
    }
  }

  return {
    name: '@dailyuse/api',
    version: '0.0.0',
    description: 'Memoflow API Server',
  };
}

// 应用启动时间
const startTime = Date.now();

/**
 * 应用信息响应
 */
interface AppInfoResponse {
  name: string;
  version: string;
  description: string;
  environment: string;
  nodeVersion: string;
  uptime: {
    seconds: number;
    formatted: string;
  };
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
  build?: {
    timestamp?: string;
    commit?: string;
  };
}

/**
 * 格式化运行时间
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  
  return parts.join(' ');
}

/**
 * 应用信息控制器
 * 
 * 提供以下端点：
 * - `/info` - 应用版本、环境、运行时信息
 */
export const infoController = {
  /**
   * 获取应用信息
   * 
   * @route GET /info
   */
  getInfo: (_req: Request, res: Response): void => {
    const packageInfo = loadApiPackageInfo();
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const memoryUsage = process.memoryUsage();
    
    const response: AppInfoResponse = {
      name: packageInfo.name,
      version: packageInfo.version,
      description: packageInfo.description || 'Memoflow API Server',
      environment: env.NODE_ENV,
      nodeVersion: process.version,
      uptime: {
        seconds: uptimeSeconds,
        formatted: formatUptime(uptimeSeconds),
      },
      memory: {
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
      },
    };
    
    // 如果有构建信息环境变量，添加到响应中
    if (env.BUILD_TIMESTAMP || env.GIT_COMMIT) {
      response.build = {
        timestamp: env.BUILD_TIMESTAMP,
        commit: env.GIT_COMMIT,
      };
    }
    
    res.status(200).json(response);
  },
};

export default infoController;
