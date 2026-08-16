/**
 * Winston Logger Implementation
 * 基于 Winston 的 Logger 实现
 *
 * Wraps winston to implement the shared `ILogger` interface. Root loggers own
 * their transports (console + daily-rotate info/error files); `child()` returns
 * a `WinstonLogger` that shares the parent winston transports so deep module
 * hierarchies never multiply file handles.
 *
 * 包装 winston 以统一实现 `ILogger` 接口。根 logger 拥有自己的 transports
 * （console + daily-rotate info/error 文件）；`child()` 返回复用父级 winston
 * transports 的 `WinstonLogger`，模块层级加深时不会重复打开文件句柄。
 *
 * Error entries always use the same structured `{ error: { name, message,
 * stack } }` shape regardless of whether the logger is a root or a child, so
 * log pipelines can rely on one schema.
 *
 * error 条目统一使用 `{ error: { name, message, stack } }` 结构，无论 logger
 * 是根实例还是 child 实例，日志管线只依赖同一 schema。
 */

import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';
import type { ILogger, LogLevelString } from './types';

/**
 * Detects whether a constructor argument is a shared winston `Logger` instance
 * (for example the output of `winston.Logger.child()`) rather than plain
 * `LoggerOptions`.
 *
 * 判断构造参数是共享的 winston `Logger` 实例（如 `winston.Logger.child()`
 * 的产物）还是普通 `LoggerOptions`。
 *
 * @param value - Constructor argument to inspect.
 * @returns `true` when `value` exposes the winston logging API.
 */
function isWinstonLogger(value: unknown): value is winston.Logger {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { log?: unknown }).log === 'function'
  );
}

/**
 * Builds the default console transport. Production console output stays
 * machine-parseable JSON; development keeps a colorized pretty format.
 *
 * 构建默认 console transport。生产环境 console 输出保持可机器解析的 JSON；
 * 开发环境保留彩色 pretty 格式。
 *
 * @returns A configured winston Console transport instance.
 */
function createConsoleTransport(): winston.transports.ConsoleTransportInstance {
  const isProduction = process.env.NODE_ENV === 'production';
  const format = isProduction
    ? winston.format.combine(winston.format.timestamp(), winston.format.json())
    : winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, context, ...meta }: Record<string, unknown>) =>
            `${String(timestamp)} [${String(level)}] [${String(context) || 'Application'}]: ${String(message)} ${
              Object.keys(meta).length ? JSON.stringify(meta) : ''
            }`,
        ),
      );

  return new winston.transports.Console({ format });
}

/**
 * Creates a root winston logger for a context: a console transport plus
 * daily-rotate `app`/`error` files under `LOG_DIR` (default `logs/`).
 *
 * 为 context 创建根 winston logger：console transport 以及 `LOG_DIR`
 * （默认 `logs/`）下的 daily-rotate `app`/`error` 文件。
 *
 * @param context - Logger context name.
 * @param options - Optional winston overrides merged over the defaults.
 * @returns A configured winston `Logger`.
 */
function createRootWinstonLogger(context: string, options?: winston.LoggerOptions): winston.Logger {
  const logDir = process.env.LOG_DIR || 'logs';
  fs.mkdirSync(logDir, { recursive: true });

  const fileFormat = winston.format.combine(winston.format.timestamp(), winston.format.json());

  const defaultOptions: winston.LoggerOptions = {
    level: 'info',
    format: fileFormat,
    defaultMeta: { context },
    transports: [
      createConsoleTransport(),
      new winston.transports.DailyRotateFile({
        filename: path.join(logDir, 'app-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat,
      }),
      new winston.transports.DailyRotateFile({
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'error',
        format: fileFormat,
      }),
    ],
  };

  return winston.createLogger({ ...defaultOptions, ...options });
}

/**
 * Winston-backed `ILogger` implementation.
 * 基于 Winston 的 `ILogger` 实现。
 *
 * Root instances own their transports. Child instances created through
 * `child()` share the parent winston transports (via `winston.Logger.child()`),
 * so they add no new file transports and inherit the parent's structured
 * metadata/error shape.
 *
 * 根实例拥有自己的 transports。`child()` 创建的实例通过
 * `winston.Logger.child()` 共享父级 transports，不新增文件 transport，并继承
 * 父级的结构化 metadata/error 形状。
 */
export class WinstonLogger implements ILogger {
  private readonly logger: winston.Logger;
  public readonly context: string;

  /**
   * Creates a logger. Pass a shared winston `Logger` (for example the output of
   * `child()`) to reuse its transports; otherwise a root logger is built for
   * `context`.
   *
   * 创建 logger。传入共享 winston `Logger`（如 `child()` 产物）可复用其
   * transports；否则为 `context` 构建根 logger。
   *
   * @param context - Logger context name.
   * @param optionsOrSharedLogger - winston overrides for a new root logger, or a
   *   shared winston logger whose transports are reused.
   */
  constructor(context: string, optionsOrSharedLogger: winston.LoggerOptions | winston.Logger = {}) {
    this.context = context;
    this.logger = isWinstonLogger(optionsOrSharedLogger)
      ? optionsOrSharedLogger
      : createRootWinstonLogger(context, optionsOrSharedLogger);
  }

  debug(message: string, ...meta: unknown[]): void {
    this.logger.debug(message, ...meta);
  }

  info(message: string, ...meta: unknown[]): void {
    this.logger.info(message, ...meta);
  }

  http(message: string, ...meta: unknown[]): void {
    this.logger.http(message, ...meta);
  }

  warn(message: string, ...meta: unknown[]): void {
    this.logger.warn(message, ...meta);
  }

  error(message: string, error?: unknown, ...meta: unknown[]): void {
    const structuredError =
      error instanceof Error
        ? { message: error.message, stack: error.stack, name: error.name }
        : error;
    this.logger.error(message, { ...meta, error: structuredError });
  }

  /**
   * Creates a child logger that shares this logger's winston transports.
   * The child reuses the parent's transport instances instead of building a new
   * daily-rotate file transport for every sub-context, and carries its own
   * `defaultMeta.context` so child entries keep the parent's structured shape.
   *
   * 创建共享本 logger winston transport 实例的子 logger。子 logger 复用父级的
   * transport 实例，而不是为每个 sub-context 新建 daily-rotate 文件 transport，
   * 并携带自己的 `defaultMeta.context`，使子条目保持父级的结构化形状。
   *
   * @param subContext - Child context segment appended to the parent context.
   * @returns A child `WinstonLogger` sharing the parent transport instances.
   */
  child(subContext: string): ILogger {
    const childContext = `${this.context}:${subContext}`;
    const parent = this.logger;
    const childLogger = winston.createLogger({
      level: parent.level,
      format: parent.format,
      defaultMeta: {
        ...(parent.defaultMeta as Record<string, unknown> | undefined),
        context: childContext,
      },
      transports: parent.transports.slice(),
    });
    return new WinstonLogger(childContext, childLogger);
  }

  setLevel(level: LogLevelString): void {
    this.logger.level = level;
  }

  /**
   * Exposes the underlying winston instance for transport-level configuration.
   * 暴露底层 winston 实例以进行 transport 级配置。
   *
   * @returns The wrapped winston `Logger`.
   */
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}
