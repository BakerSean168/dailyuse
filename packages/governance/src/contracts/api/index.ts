/**
 * ============================================================================
 * Governance Module - API 统一导出（Barrel Export）
 * 规则治理模块 - API 统一导出
 * ============================================================================
 * 
 * 【Barrel Export 模式】
 * - 提供统一的导出入口
 * - 隐藏内部文件组织细节
 * - 简化外部引用路径
 * 
 * 【使用方式】
 * 
 * ```typescript
 * // ✅ 推荐：从统一入口导入
 * import { 
 *   CreateRuleReq, 
 *   CreateRuleRes,
 *   ListRulesQuery,
 *   ListRulesRes,
 *   GetRuleRevisionsQuery,
 * } from '@dailyuse/contracts/governance/api';
 * 
 * // ❌ 不推荐：直接引用内部文件
 * import { CreateRuleReq } from '@dailyuse/contracts/governance/api/rules';
 * ```
 * 
 * 【维护规则】
 * - 每新增一个 API 文件，需要在这里添加导出
 * - 使用 export * from 导出所有内容
 * - 保持文件简洁，不要添加额外逻辑
 * 
 * 【模块边界】
 * - api/ 文件夹只导出 API 定义
 * - 不要从其他层（aggregates/entities/domain）导出
 * - 其他层有各自的 index.ts
 */

// ===== Governance Rules API =====
// Rule CRUD 操作：创建、更新、获取、删除、列表、搜索
export * from './rules';

// ===== Rule Revisions API =====
// 规则修订记录查询：历史列表、详情查询
export * from './rule-revisions';


/**
 * 【扩展指南】
 * 
 * 当添加新的业务功能时，按以下步骤操作：
 * 
 * 1. 创建新的 API 文件（例如：rule-templates.ts）
 * 2. 在文件中定义相关的 Schema、Request、Response
 * 3. 在这个 index.ts 中添加 export * from './rule-templates';
 * 4. 更新 protocol/governance-rpc-map.ts（如果使用 RPC）
 * 5. 更新 protocol/governance-event-map.ts（如果有领域事件）
 */

