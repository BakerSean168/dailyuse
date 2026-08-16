/**
 * @file logger.config.ts
 * @description API 日志系统配置，集成 @memoflow/utils 的 Winston 实现。
 * @date 2025-01-22
 *
 * RefArch Phase 6: `initializeLogger()` is now idempotent and fail-fast. The
 * API entry calls it exactly once before importing the feature graph, so no
 * module-level `createLogger()` can run against the default console provider.
 * Repeated calls with the same configuration are a no-op; repeated calls with a
 * conflicting configuration throw.
 *
 * RefArch 阶段 6：`initializeLogger()` 现在幂等且 fail-fast。API 入口在导入
 * feature 依赖图前恰好调用一次，因此不会有模块级 `createLogger()` 在默认
 * console provider 上运行。相同配置的重复调用为 no-op；冲突配置的重复调用
 * 直接抛错。
 */

import { LoggerFactory } from '@memoflow/utils/logger';
import type { ILogger, LogLevelString, LoggerConfig } from '@memoflow/utils/logger';
import { WinstonLogger } from '@memoflow/utils/winston';
import { env } from './env.js';

/**
 * Provider factory used to construct a logger for a context.
 * 为某个 context 构造 logger 的 provider 工厂。
 */
export type LoggerBootstrapProvider = (context: string, config?: Partial<LoggerConfig>) => ILogger;

/**
 * Options accepted by `initializeLogger`.
 * `initializeLogger` 接受的选项。
 */
export interface LoggerBootstrapOptions {
  /**
   * Log level. Defaults to `env.LOG_LEVEL`.
   * 日志级别，默认取 `env.LOG_LEVEL`。
   */
  readonly level?: LogLevelString;
  /**
   * Whether logging stays enabled in production. Defaults to `true`.
   * 生产环境是否保持日志开启，默认 `true`。
   */
  readonly enableInProduction?: boolean;
  /**
   * Provider factory. Defaults to the Winston provider. Tests inject a fake
   * provider to observe that feature loggers are only created after
   * initialization; hosts can substitute their own transport set.
   *
   * Provider 工厂，默认使用 Winston provider。测试注入 fake provider 以观察
   * feature logger 只在初始化后被创建；宿主可替换自己的 transport 集合。
   */
  readonly provider?: LoggerBootstrapProvider;
}

/**
 * Frozen configuration captured at first successful initialization.
 * 首次成功初始化时冻结的配置。
 */
interface InitializedLoggerConfig {
  readonly level: LogLevelString;
  readonly enableInProduction: boolean;
}

let initializedConfig: InitializedLoggerConfig | null = null;

/**
 * @internal Test-only reset of the frozen initialization state. Production code
 * must never call this; specs use it to isolate idempotency/conflict cases
 * without re-importing the module graph.
 *
 * @internal 仅供测试重置已冻结的初始化状态。生产代码不得调用；spec 用它隔离
 * 幂等/冲突用例，无需重新导入模块图。
 */
export function __resetLoggerBootstrapStateForTests(): void {
  initializedConfig = null;
}

/**
 * Initializes the single API logger provider and configuration.
 * 初始化唯一的 API logger provider 与配置。
 *
 * Must run before the feature graph is imported so every module-level
 * `createLogger()` is provider-backed. Repeated calls with the same level and
 * `enableInProduction` are a no-op; a conflicting configuration throws instead
 * of silently replacing the frozen config.
 *
 * 必须在 feature 依赖图导入前运行，使每个模块级 `createLogger()` 都是
 * provider-backed。相同 level 与 `enableInProduction` 的重复调用是 no-op；
 * 冲突配置直接抛错，而不是静默替换已冻结配置。
 *
 * @param options - Optional overrides for level, production enablement and the
 *   provider factory (the provider is the test/host seam).
 * @throws When called again with a different configuration after a successful
 *   initialization.
 */
export function initializeLogger(options: LoggerBootstrapOptions = {}): void {
  const level = options.level ?? env.LOG_LEVEL;
  const enableInProduction = options.enableInProduction ?? true;
  const provider = options.provider ?? ((context: string) => new WinstonLogger(context));

  if (initializedConfig !== null) {
    if (
      initializedConfig.level !== level ||
      initializedConfig.enableInProduction !== enableInProduction
    ) {
      throw new Error(
        `[logger-bootstrap] initializeLogger() conflict: already initialized with ` +
          `level=${initializedConfig.level} enableInProduction=${initializedConfig.enableInProduction}; ` +
          `requested level=${level} enableInProduction=${enableInProduction}. ` +
          `The logger provider must be initialized exactly once with a stable configuration.`,
      );
    }
    return;
  }

  LoggerFactory.registerProvider(provider);
  LoggerFactory.configure({ level, enableInProduction });
  initializedConfig = { level, enableInProduction };
}

type StartupInfo = {
  environment: string;
  nodeVersion: string;
  platform: NodeJS.Platform;
  logLevel: string;
  timestamp: string;
};

/**
 * Gets static startup information for the API process.
 * 获取 API 进程的静态启动信息。
 *
 * @returns An object with environment, Node version, platform, log level and a
 *   timestamp, used for the first structured log entry.
 */
export function getStartupInfo(): StartupInfo {
  return {
    environment: env.NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform,
    logLevel: env.LOG_LEVEL,
    timestamp: new Date().toISOString(),
  };
}
