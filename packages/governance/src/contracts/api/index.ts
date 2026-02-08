/**
 * ============================================================================
 * Example API - 统一导出（Barrel Export）
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
 *   CreateExampleReq, 
 *   CreateExampleRes,
 *   ListExampleQuery,
 *   ListExampleRes,
 * } from '@contracts/example/api';
 * 
 * // ❌ 不推荐：直接引用内部文件
 * import { CreateExampleReq } from '@contracts/example/api/feature-one.dto';
 * ```
 * 
 * 【维护规则】
 * - 每新增一个 .dto.ts 文件，需要在这里添加导出
 * - 使用 export * from 导出所有内容
 * - 保持文件简洁，不要添加额外逻辑
 * 
 * 【模块边界】
 * - api/ 文件夹只导出 API 定义
 * - 不要从其他层（aggregates/entities/domain）导出
 * - 其他层有各自的 index.ts
 */

// Feature One: 基础 CRUD 操作
export * from './examples';

// Feature Two: 列表查询和复杂操作
export * from './get-view';

/**
 * 【扩展指南】
 * 
 * 当添加新的业务功能时，按以下步骤操作：
 * 
 * 1. 创建新的 feature-xxx.dto.ts 文件
 * 2. 在文件中定义相关的 Schema、Request、Response
 * 3. 在这个 index.ts 中添加 export * from './feature-xxx.dto';
 * 4. 更新相关的 rpc-map.ts（如果使用 RPC）
 * 5. 更新相关的 event-map.ts（如果有领域事件）
 * 
 * 【文件命名建议】
 * - feature-one.dto.ts: 基础 CRUD
 * - feature-two.dto.ts: 查询和统计
 * - feature-three.dto.ts: 批量操作
 * - feature-four.dto.ts: 导入导出
 * - feature-five.dto.ts: 特殊业务逻辑
 * 
 * 或者使用更具体的业务名称：
 * - user-profile.dto.ts
 * - user-settings.dto.ts
 * - user-lifecycle.dto.ts
 */
