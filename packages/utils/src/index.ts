/**
 * @memoflow/utils - 通用工具库
 *
 * 根入口只导出最常用的跨层工具。深层访问请使用子路径导入：
 * - `@memoflow/utils/shared`      共享工具（id, time, recurrence, priority；产品日期请用 @memoflow/time）
 * - `@memoflow/utils/domain`      DDD 基础类（Entity, AggregateRoot, ValueObject, EventBus）
 * - `@memoflow/utils/errors`      错误处理
 * - `@memoflow/utils/validation`  验证工具
 * - `@memoflow/utils/result`      Result Pattern 工具
 * - `@memoflow/utils/frontend`    前端专用工具（debounce, throttle, loading-state）
 * - `@memoflow/utils/lifecycle`   初始化管理器
 * - `@memoflow/utils/logger`      日志系统
 * - `@memoflow/utils/winston`     Node.js Winston 日志
 */

// ── shared ──
export { newId, generateUUID, isValidUUID, generateShortId } from './shared/uuid';
/** ADR-037 T9: utils product date bridges retired — use @memoflow/time. */
export { nowIso, toIso } from './shared/time';
export { EnvConfig, envConfig, type IEnvConfig } from './shared/env-config';

// ── domain ──
export { Entity } from './domain/entity';
export { AggregateRoot } from './domain/aggregate-root';
export { ValueObject } from './domain/value-object';
export { eventBus } from './domain/global-event-bus';
export { createIdType } from './domain/create-id-type';
export { flushDomainEvents, publishDomainEvents } from './domain/flush-domain-events';
export {
  createTypedEventPort,
  createTypedEventPublisher,
  createTypedEventSubscriber,
} from './domain/typed-event-port';
export type { Publisher, Subscriber, TypedEventPort } from './domain/typed-event-port';

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
