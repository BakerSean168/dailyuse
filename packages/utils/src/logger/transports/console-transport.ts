/// <reference lib="dom" />

/**
 * 控制台传输器
 * 支持 Node.js 和浏览器
 */

import type { LogTransport, LogEntry, LogLevel } from '../types';

/**
 * 控制台颜色（仅 Node.js）
 */
const colors = {
  error: '\x1b[31m', // 红色
  warn: '\x1b[33m', // 黄色
  info: '\x1b[32m', // 绿色
  http: '\x1b[35m', // 紫色
  debug: '\x1b[36m', // 青色
  reset: '\x1b[0m', // 重置
};

/**
 * 浏览器控制台样式
 */
const browserStyles = {
  error: 'color: #f44336; font-weight: bold',
  warn: 'color: #ff9800; font-weight: bold',
  info: 'color: #4caf50; font-weight: bold',
  http: 'color: #9c27b0; font-weight: bold',
  debug: 'color: #2196f3; font-weight: bold',
};

export interface ConsoleTransportOptions {
  /** 最小日志级别 */
  level?: LogLevel;
  /** 是否启用颜色（仅 Node.js） */
  colorize?: boolean;
  /** 是否显示时间戳 */
  timestamp?: boolean;
}

export class ConsoleTransport implements LogTransport {
  name = 'console';
  level: LogLevel;
  private colorize: boolean;
  private timestamp: boolean;
  private isBrowser: boolean;

  constructor(options: ConsoleTransportOptions = {}) {
    this.level = options.level ?? 4; // DEBUG
    this.colorize = options.colorize ?? true;
    this.timestamp = options.timestamp ?? true;

    // 检测运行环境
    this.isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
  }

  log(entry: LogEntry): void {
    if (this.isBrowser) {
      this.logBrowser(entry);
    } else {
      this.logNode(entry);
    }
  }

  /**
   * Node.js 环境日志输出
   */
  private logNode(entry: LogEntry): void {
    const { timestamp, level, message, context, metadata, error } = entry;

    // 构建日志消息
    const parts: string[] = [];

    // 时间戳
    if (this.timestamp) {
      parts.push(timestamp);
    }

    // 级别
    const levelStr = `[${level.toUpperCase()}]`;
    if (this.colorize) {
      parts.push(`${colors[level]}${levelStr}${colors.reset}`);
    } else {
      parts.push(levelStr);
    }

    // 上下文
    if (context) {
      parts.push(`[${context}]`);
    }

    // 消息
    parts.push(message);

    // 输出主消息
    const mainMessage = parts.join(' ');
    console.log(mainMessage);

    // 输出元数据
    if (metadata && Object.keys(metadata).length > 0) {
      console.log('  Metadata:', metadata);
    }

    // 输出错误信息
    if (error) {
      console.error('  Error:', error);
    }
  }

  /**
   * 浏览器环境日志输出
   */
  private logBrowser(entry: LogEntry): void {
    const { timestamp, level, message, context, metadata, error } = entry;

    // 构建日志消息
    const parts: string[] = [];

    if (this.timestamp) {
      parts.push(timestamp);
    }

    parts.push(`[${level.toUpperCase()}]`);

    if (context) {
      parts.push(`[${context}]`);
    }

    parts.push(message);

    const mainMessage = parts.join(' ');

    // 使用浏览器控制台 API
    const consoleMethod =
      level === 'error' ? 'error' : level === 'warn' ? 'warn' : level === 'debug' ? 'debug' : 'log';

    if (this.colorize) {
      console[consoleMethod](`%c${mainMessage}`, browserStyles[level]);
    } else {
      console[consoleMethod](mainMessage);
    }

    // 输出元数据
    if (metadata && Object.keys(metadata).length > 0) {
      console.log('  Metadata:', metadata);
    }

    // 输出错误信息
    if (error) {
      console.error('  Error:', error);
    }
  }
}
