/**
 * Governance Module Exports. 治理模块 - 统一导出。
 *
 * 【规范说明：导出顺序】
 * 所有业务模块的 index.ts 必须按以下顺序组织导出，保持全局一致性：
 *
 *   1. Aggregates   — 聚合根 DTO（Server/Client）
 *   2. Entities     — 子实体 DTO
 *   3. Value Objects — 值对象（const object 枚举 + 复杂 VO 接口）
 *   4. Domain Events — 领域事件接口
 *   5. Protocol     — 事件映射 + RPC 映射
 *   6. Configs      — 验证/生成/视图配置（如有）
 *   7. API          — 请求/响应 Zod Schema + 类型
 *   8. Primitives   — Branded ID 原始类型（如有）
 *   9. DTOs         — 查询/传输 DTO（如有）
 *
 * 每个区块用 ============ 注释分隔，保持可扫描性。
 */

// ============ Aggregates ============
export * from './aggregates';

// ============ Entities ============
export * from './entities';

// ============ Value Objects ============
export * from './value-objects';

// ============ Domain Events ============
export * from './domain';

// ============ Protocol ============
export * from './protocol';

// ============ Configs ============
export * from './configs';

// ============ API Requests/Responses ============
export * from './api';

// ============ Primitives ============
export * from './primitives';
