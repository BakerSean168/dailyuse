/**
 * @dailyuse/editor
 *
 * 编辑器模块 - 文档编辑与协同
 *
 * 【分层架构】
 *
 * contracts           → 类型定义、DTO、事件、API Schema（@dailyuse/contracts/editor）
 * domain-shared       → 值对象（前后端共享）
 * domain-server       → 聚合根、仓储接口、领域服务
 * domain-client       → 客户端领域模型
 * application-server  → 用例服务（服务端）
 * infrastructure-server → SQLite 仓储实现、DI 容器
 *
 * 【使用示例】
 *
 * ```typescript
 * // 1. 导入契约
 * import type { EditorWorkspaceServerDTO } from '@dailyuse/contracts/editor';
 *
 * // 2. 导入服务端聚合根
 * import { EditorWorkspace } from '@dailyuse/editor/domain-server';
 * ```
 */

// ================= Contracts Layer =================
export * from '@dailyuse/contracts/editor';

// ================= Domain Layer =================
export * from './domain-server';

// ================= Application Layer =================
export * from './application-server';

// ================= Infrastructure Layer =================
export * from './infrastructure-server';
