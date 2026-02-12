/**
 * Editor Module - Domain Client
 * 编辑器模块 - 领域客户端
 *
 * 【规范说明】
 * - 导出聚合根和实体
 * - 重新导出 domain-shared 中的值对象和 ID
 */

export * from './aggregates';
export * from './entities';
export * from '../domain-shared/value-objects';
