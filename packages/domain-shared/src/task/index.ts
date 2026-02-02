/**
 * Task Module - domain-shared 导出
 * 
 * 【规范说明】
 * domain-shared 包只包含：
 * - 值对象（Value Objects）
 * - 枚举类型
 * - 品牌化 ID
 * - 纯业务逻辑函数
 * 
 * 不包含：聚合根、实体、仓储、服务
 */

export * from './value-objects';
