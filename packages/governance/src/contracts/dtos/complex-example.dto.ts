/**
 * Complex Example DTO
 * 复杂组合 DTO 示例
 * 
 * 【设计说明】
 * 此文件是示例，展示如何定义需要组合多个实体的特殊 DTO
 * 实际开发中可以删除此文件
 * 
 * 【使用场景】
 * - 需要组合多个实体的响应
 * - 需要附加元数据的响应
 * - 需要特殊计算字段的响应
 */

// 示例：规则 + 修订记录历史组合
// import type { RuleClientDTO } from '../aggregates';
// import type { RuleRevisionClientDTO } from '../entities';

// export interface RuleWithHistoryDTO {
//   rule: RuleClientDTO;
//   revisions: RuleRevisionClientDTO[];
//   totalRevisions: number;
//   lastModifiedBy: string;
// }
