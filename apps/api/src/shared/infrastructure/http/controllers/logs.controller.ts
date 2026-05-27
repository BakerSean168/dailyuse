/**
 * @file logs.controller.ts
 * @description 客户端日志控制器 - 接收前端日志上报
 * @date 2025-12-22
 */

import type { Request, Response } from 'express';
import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('ClientLogs');

/**
 * 客户端日志条目
 */
interface ClientLogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp?: string;
  context?: string;
  metadata?: Record<string, unknown>;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
}

/**
 * 日志控制器
 * 
 * 提供以下端点：
 * - `POST /logs` - 接收客户端日志批量上报
 */
export const logsController = {
  /**
   * 接收客户端日志
   * 
   * @route POST /logs
   */
  capture: (req: Request, res: Response): void => {
    const { logs } = req.body;

    if (!Array.isArray(logs)) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid logs format. Expected { logs: [...] }',
      });
      return;
    }

    // 限制单次上报数量，防止滥用
    const MAX_LOGS_PER_REQUEST = 100;
    const logsToProcess = logs.slice(0, MAX_LOGS_PER_REQUEST);

    // 批量处理日志
    logsToProcess.forEach((log: ClientLogEntry) => {
      const { level, message, context, timestamp, metadata, error } = log;
      
      // 构建元数据
      const meta = {
        ...metadata,
        clientTimestamp: timestamp,
        clientContext: context,
        source: 'client',
      };

      // 根据级别记录日志
      switch (level) {
        case 'error':
          logger.error(message, error as Error | undefined, meta);
          break;
        case 'warn':
          logger.warn(message, meta);
          break;
        case 'info':
          logger.info(message, meta);
          break;
        case 'debug':
          logger.debug(message, meta);
          break;
        default:
          logger.info(message, meta);
      }
    });

    res.status(200).json({ 
      success: true,
      processed: logsToProcess.length,
      truncated: logs.length > MAX_LOGS_PER_REQUEST,
    });
  },
};

export default logsController;
