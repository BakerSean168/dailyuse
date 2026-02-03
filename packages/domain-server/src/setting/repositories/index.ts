/**
 * Setting Repositories
 * 设置模块仓储接口导出
 * 
 * 【规范说明：仓储（Repository）】
 * 仓储是聚合根的持久化变量市场，应遵循以下原则：
 * - 只接口不接实现：其仓储接口帮助 DDD 的 Transactional Boundaries
 * - 单个聚合根一个仓储：一个聚合根不应该有多个仓储
 * - 聚合内的实体不会直接指接仓储：需要通过聚合根访问
 * - 根据聊天辄团决分：一次只修改一个聚合根
 * 
 * 【ISettingRepository】
 * - 配置项持久化：创建、修改、删除应用和用户配置
 * 
 * 【IAppConfigRepository】
 * - 应用配置持久化：全局应用级配置管理
 * - 默认值管理：配置项的默认值和覆盖关系
 * 
 * 【IUserSettingRepository】
 * - 用户配置持久化：用户个性化设置的存储和检索
 * - 工作区设置：工作区级别的用户设置
 */

export type { ISettingRepository } from './ISettingRepository';
export type { IAppConfigRepository } from './IAppConfigRepository';
export type { IUserSettingRepository } from './IUserSettingRepository';
