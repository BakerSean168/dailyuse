/**
 * Infrastructure Client Layer - Barrel Export
 * 基础设施客户端层 - 统一导出
 * 
 * 提供规则模块的 HTTP 和 IPC 适配器实现
 */

// HTTP Adapters (for web applications)
export * from './http';

// IPC Adapters (for Electron desktop)
export * from './ipc';

// Stores (if any)
export * from './stores';
