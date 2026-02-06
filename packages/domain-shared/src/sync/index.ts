/**
 * Sync Module - domain-shared 导出
 * 
 * 【规范说明】
 * domain-shared 包只包含：
 * - 值对象（Value Objects）
 * - 枚举类型
 * - 品牌化 ID
 * - 纯业务逻辑函数
 * 
 * 不包含：聚合根、实体、仓储、服务
 * 
 * 【同步模块】
 * 简化版实现，核心功能：
 * - 增量同步工具函数
 * - 冲突检测工具函数
 */

export * from './utils';
