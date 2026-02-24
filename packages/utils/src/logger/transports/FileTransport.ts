/**
 * 文件传输器
 * 仅支持 Node.js 环境
 */

import type { LogTransport, LogEntry, LogLevel } from '../types';

export interface FileTransportOptions {
  /** 最小日志级别 */
  level?: LogLevel;
  /** 文件路径 */
  filename: string;
  /** 是否使用 JSON 格式 */
  json?: boolean;
}

export class FileTransport implements LogTransport {
  name = 'file';
  level: LogLevel;
  private filename: string;
  private json: boolean;
  private fs: typeof import('fs') | null = null;
  private isNode: boolean;

  constructor(options: FileTransportOptions) {
    this.level = options.level ?? 2; // INFO
    this.filename = options.filename;
    this.json = options.json ?? true;

    // 检测是否为 Node.js 环境
    this.isNode =
      typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

    if (this.isNode) {
      // 动态导入 fs 模块（仅在 Node.js 环境）
      import('fs')
        .then((module) => {
          this.fs = module;
        })
        .catch(() => {
          console.error('[FileTransport] Failed to load fs module');
        });
    } else {
      console.warn('[FileTransport] File logging is only available in Node.js environment');
    }
  }

  log(entry: LogEntry): void {
    if (!this.isNode || !this.fs) {
      return; // 在浏览器环境中静默失败
    }

    try {
      let logLine: string;

      if (this.json) {
        logLine = JSON.stringify(entry) + '\n';
      } else {
        const { timestamp, level, message, context, metadata, error } = entry;
        const parts = [timestamp, `[${level.toUpperCase()}]`];

        if (context) {
          parts.push(`[${context}]`);
        }

        parts.push(message);

        if (metadata) {
          parts.push(JSON.stringify(metadata));
        }

        if (error) {
          parts.push(JSON.stringify(error));
        }

        logLine = parts.join(' ') + '\n';
      }

      // 异步追加到文件
      this.fs.appendFile(this.filename, logLine, (err: NodeJS.ErrnoException | null) => {
        if (err) {
          console.error('[FileTransport] Failed to write log:', err);
        }
      });
    } catch (error) {
      console.error('[FileTransport] Error writing log:', error);
    }
  }
}
