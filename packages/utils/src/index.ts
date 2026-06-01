/**
 * @dailyuse/utils - 通用工具库
 *
 * 根入口只导出最常用的跨层工具。深层访问请使用子路径导入：
 * - `@dailyuse/utils/shared`      共享工具（id, date, time, recurrence, priority）
 * - `@dailyuse/utils/domain`      DDD 基础类（Entity, AggregateRoot, ValueObject, EventBus）
 * - `@dailyuse/utils/errors`      错误处理
 * - `@dailyuse/utils/validation`  验证工具
 * - `@dailyuse/utils/result`      Result Pattern 工具
 * - `@dailyuse/utils/frontend`    前端专用工具（debounce, throttle, loading-state）
 * - `@dailyuse/utils/lifecycle`   初始化管理器
 * - `@dailyuse/utils/logger`      日志系统
 * - `@dailyuse/utils/winston`     Node.js Winston 日志
 */

// ── shared ──
export { newId, generateUUID, isValidUUID, generateShortId } from './shared/uuid';
export { ensureDate, toDayStart, toDayEnd, formatDateToInput, formatTimeToInput, updateDateKeepTime, updateTimeKeepDate } from './shared/date';
export { nowIso, toIso } from './shared/time';
export { EnvConfig, envConfig, type IEnvConfig } from './shared/env-config';

// ── domain ──
export { Entity } from './domain/entity';
export { AggregateRoot } from './domain/aggregate-root';
export { ValueObject } from './domain/value-object';
export { eventBus } from './domain/global-event-bus';
export { createIdType } from './domain/create-id-type';

// ── errors ──
export { DomainError, BusinessRuleViolationError, NotFoundError, ValidationError, UnauthorizedError } from './errors/domain-error';
export { mapPrismaError } from './errors/prisma-error-mapper';

// ── validation ──
export { FormValidator } from './validation/form-validator';
export type {
  ValidationRule,
  ValidationResult,
  FieldValidationResult,
  FormValidationResult,
  FieldConfig,
  FormConfig,
} from './validation/types';

// ── lifecycle ──
export {
  InitializationPhase,
  InitializationManager,
  type InitializationTask,
} from './initialization-manager';

export {
  WebInitializationManager,
  ModuleGroup,
  type ModuleLoader,
  type ModuleDefinition,
  type LoadingProgress,
} from './web-initialization-manager';

// ── logger ──
export { Logger } from './logger/logger';
export { LoggerFactory, createLogger } from './logger/logger-factory';
export { ConsoleTransport } from './logger/transports/console-transport';
export { HttpTransport } from './logger/transports/http-transport';
export type { ILogger, LogLevel, LogEntry } from './logger/types';
