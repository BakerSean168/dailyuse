/**
 * @dailyuse/utils - 通用工具库
 *
 * 模块结构:
 * - shared/     共享工具（id, date, time, recurrence, priority）
 * - domain/     DDD 基础类（Entity, AggregateRoot, ValueObject, EventBus）
 * - errors/     错误处理
 * - validation/ 验证工具
 * - result/     Result Pattern 工具（新）
 * - response/   HTTP 响应工具（旧，保留兼容）
 * - frontend/   前端专用工具
 * - logger/     日志系统
 */

// 共享工具
export * from './shared/index';

// DDD 基础类和事件系统
export * from './domain/index';

// 错误处理
export * from './errors/index';

// 验证工具
export * from './validation/index';

// Result Pattern 工具（新）
export * from './result/index';

// 前端工具
export * from './frontend/index';

// 初始化管理器
export * from './initialization-manager';
export * from './web-initialization-manager';

// 日志系统（仅导出跨平台安全入口；Node 专属实现走 '@dailyuse/utils/winston'）
export * from './logger/index';
