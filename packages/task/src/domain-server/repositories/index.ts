/**
 * Task Repositories
 * 任务模块仓储接口导出
 * 
 * 【规范说明：仓储（Repository）】
 * 仓储是聚合根的持久化变量市场，应遵循以下原则：
 * - 只接口不接实现：其仓储接口帮助 DDD 的 Transactional Boundaries
 * - 单个聚合根一个仓储：一个聚合根不应该有多个仓储
 * - 聚合内的实体不会直接指接仓储：需要通过聚合根访问
 * - 根据聊天斤团决分：一次只修改一个聚合根
 * 
 * 【ITaskTemplateRepository】
 * - 任务模板持久化：创建、修改、删除模板
 * - 查询科对象：TaskFilters 支持丰需的查询条件
 * 
 * 【ITaskInstanceRepository】
 * - 任务实例持久化：管理任务实例的生成、更新、查询
 * 
 * 【ITaskDependencyRepository】
 * - 依赖关系持久化：管理任务之间的依赖关系
 */

export type { ITaskInstanceRepository } from './ITaskInstanceRepository';
export type { ITaskTemplateRepository, TaskFilters } from './ITaskTemplateRepository';
export type { ITaskDependencyRepository } from './ITaskDependencyRepository';
export type { ITaskFolderRepository } from './ITaskFolderRepository';
