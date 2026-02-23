/**
 * 日志系统类型定义
 * 跨平台（Node.js + Browser）
 */

/**
 * 日志级别枚举
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  HTTP = 3,
  DEBUG = 4,
}

/**
 * 日志级别字符串
 */
export type LogLevelString = 'error' | 'warn' | 'info' | 'http' | 'debug';

/**
 * 日志元数据
 */
export interface LogMetadata {
  [key: string]: unknown;
}

/**
 * 日志条目
 */
export interface LogEntry {
  /** 时间戳 */
  timestamp: string;
  /** 日志级别 */
  level: LogLevelString;
  /** 日志消息 */
  message: string;
  /** 上下文（模块名） */
  context?: string;
  /** 元数据 */
  metadata?: LogMetadata;
  /** 错误对象 */
  error?: {
    message: string;
    stack?: string;
    [key: string]: unknown;
  };
}

/**
 * 日志传输器接口
 * 定义如何输出日志（控制台、文件、远程服务等）
 */
export interface LogTransport {
  /** 传输器名称 */
  name: string;
  /** 最小日志级别 */
  level: LogLevel;
  /** 记录日志 */
  log(entry: LogEntry): void | Promise<void>;
  /** 关闭传输器 */
  close?(): void | Promise<void>;
}

/**
 * 日志配置
 */
export interface LoggerConfig {
  /** 默认日志级别 */
  level?: LogLevelString;
  /** 是否在生产环境启用 */
  enableInProduction?: boolean;
  /** 传输器列表 */
  transports?: LogTransport[];
  /** 默认上下文 */
  defaultContext?: string;
}

/**
 * Logger 接口
 */
export interface ILogger {
  /** 上下文名称 */
  readonly context: string;

  /** DEBUG 级别日志 */
  debug(message: string, ...meta: unknown[]): void;

  /** INFO 级别日志 */
  info(message: string, ...meta: unknown[]): void;

  /** HTTP 级别日志 */
  http(message: string, ...meta: unknown[]): void;

  /** WARN 级别日志 */
  warn(message: string, ...meta: unknown[]): void;

  /** ERROR 级别日志 */
  error(message: string, error?: unknown, ...meta: unknown[]): void;

  /** 创建子 Logger */
  child(subContext: string): ILogger;

  /** 设置日志级别 */
  setLevel(level: LogLevelString): void;
}
