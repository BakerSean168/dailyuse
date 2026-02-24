/**
 * Logger 核心实现
 * 跨平台日志记录器
 */

import type {
  ILogger,
  LoggerConfig,
  LogTransport,
  LogEntry,
  LogLevelString,
  LogLevel,
  LogMetadata,
} from './types';
import { LogLevel as LogLevelEnum } from './types';

export class Logger implements ILogger {
  readonly context: string;
  private currentLevel: LogLevel;
  private transports: LogTransport[];
  private enabled: boolean;

  constructor(context: string, config: LoggerConfig = {}) {
    this.context = context;
    this.currentLevel = this.levelStringToEnum(config.level || 'info');
    this.transports = config.transports || [];

    // 检查是否在生产环境
    const isProduction = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';

    this.enabled = !isProduction || (config.enableInProduction ?? false);
  }

  /**
   * 添加传输器
   */
  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevelString): void {
    this.currentLevel = this.levelStringToEnum(level);
  }

  /**
   * DEBUG 级别日志
   */
  debug(message: string, ...meta: unknown[]): void {
    this.log('debug', message, undefined, ...meta);
  }

  /**
   * INFO 级别日志
   */
  info(message: string, ...meta: unknown[]): void {
    this.log('info', message, undefined, ...meta);
  }

  /**
   * HTTP 级别日志
   */
  http(message: string, ...meta: unknown[]): void {
    this.log('http', message, undefined, ...meta);
  }

  /**
   * WARN 级别日志
   */
  warn(message: string, ...meta: unknown[]): void {
    this.log('warn', message, undefined, ...meta);
  }

  /**
   * ERROR 级别日志
   */
  error(message: string, error?: unknown, ...meta: unknown[]): void {
    this.log('error', message, error, ...meta);
  }

  /**
   * 创建子 Logger
   */
  child(subContext: string): ILogger {
    return new Logger(`${this.context}:${subContext}`, {
      level: this.enumToLevelString(this.currentLevel),
      transports: this.transports,
      enableInProduction: this.enabled,
    });
  }

  /**
   * 核心日志方法
   */
  private log(level: LogLevelString, message: string, error?: unknown, ...meta: unknown[]): void {
    if (!this.enabled) {
      return;
    }

    const levelEnum = this.levelStringToEnum(level);

    // 检查日志级别
    if (levelEnum > this.currentLevel) {
      return;
    }

    // 构建日志条目
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
    };

    // 添加元数据
    if (meta.length > 0) {
      entry.metadata = this.mergeMetadata(meta);
    }

    // 添加错误信息
    if (error) {
      if (error instanceof Error) {
        entry.error = {
          message: error.message,
          stack: error.stack,
          name: error.name,
        };
      } else {
        const isObject = typeof error === 'object' && error !== null;
        const errorObj = isObject ? (error as Record<string, unknown>) : {};
        entry.error = {
          message: isObject && 'message' in errorObj ? String(errorObj.message) : String(error),
          ...errorObj,
        };
      }
    }

    // 发送到所有传输器
    this.transports.forEach((transport) => {
      if (levelEnum <= transport.level) {
        try {
          const result = transport.log(entry);

          // 支持异步传输器
          if (result instanceof Promise) {
            result.catch((err) => {
              console.error(`[Logger] Transport "${transport.name}" failed:`, err);
            });
          }
        } catch (err) {
          console.error(`[Logger] Transport "${transport.name}" error:`, err);
        }
      }
    });
  }

  /**
   * 合并元数据
   */
  private mergeMetadata(meta: unknown[]): LogMetadata {
    if (meta.length === 1 && typeof meta[0] === 'object' && meta[0] !== null) {
      return meta[0] as LogMetadata;
    }

    return meta.reduce<LogMetadata>((acc, item, index) => {
      acc[`arg${index}`] = item;
      return acc;
    }, {});
  }

  /**
   * 字符串级别转枚举
   */
  private levelStringToEnum(level: LogLevelString): LogLevel {
    const map: Record<LogLevelString, LogLevel> = {
      error: LogLevelEnum.ERROR,
      warn: LogLevelEnum.WARN,
      info: LogLevelEnum.INFO,
      http: LogLevelEnum.HTTP,
      debug: LogLevelEnum.DEBUG,
    };
    return map[level];
  }

  /**
   * 枚举级别转字符串
   */
  private enumToLevelString(level: LogLevel): LogLevelString {
    const map: Record<LogLevel, LogLevelString> = {
      [LogLevelEnum.ERROR]: 'error',
      [LogLevelEnum.WARN]: 'warn',
      [LogLevelEnum.INFO]: 'info',
      [LogLevelEnum.HTTP]: 'http',
      [LogLevelEnum.DEBUG]: 'debug',
    };
    return map[level];
  }

  /**
   * 关闭所有传输器
   */
  async close(): Promise<void> {
    await Promise.all(
      this.transports.map(async (transport) => {
        if (transport.close) {
          try {
            await transport.close();
          } catch (err) {
            console.error(`[Logger] Failed to close transport "${transport.name}":`, err);
          }
        }
      }),
    );
  }
}
