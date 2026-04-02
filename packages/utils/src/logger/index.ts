/**
 * 跨平台日志系统
 * 支持 Node.js (API/Desktop) 和浏览器 (Web)
 */

// 核心类型
export * from './types';

// Logger 实现
export { Logger } from './Logger';
// WinstonLogger 移至专门的入口点 '@dailyuse/utils/winston' 以避免污染浏览器环境
// export { WinstonLogger } from './WinstonLogger';
export { LoggerFactory, createLogger } from './LoggerFactory';

// 前端安全传输器
export { ConsoleTransport } from './transports/ConsoleTransport';
export { HttpTransport } from './transports/HttpTransport';

// 便捷导出
export { createLogger as default } from './LoggerFactory';
