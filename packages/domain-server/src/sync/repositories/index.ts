/**
 * Sync Repositories
 * 同步模块仓储接口导出
 * 
 * 【规范说明：仓储（Repository）】
 * 仓储是聚合根的持久化变量市场，应遵循以下原则：
 * - 只接口不接实现：其仓储接口帮助 DDD 的 Transactional Boundaries
 * - 单个聚合根一个仓储：一个聚合根不应该有多个仓储
 * - 聚合内的实体不会直接指接仓储：需要通过聚合根访问
 * - 根据聊天斤团决分：一次只修改一个聚合根
 * 
 * 【ISyncSessionRepository】
 * - 同步会话持久化：每一次同步会话是一次事务
 * - 冲突检测与解决：保存冲突记录、解决方案
 * 
 * 【ISyncProfileRepository】
 * - 用户同步持久化：管理用户同步配置、设备信息
 * 
 * 【IPendingChangeRepository】
 * - 下次同步古存：应用本地变更前值存放事处理
 * 
 * 【ISyncConflictRepository】
 * - 冲突记录持久化：跟踪不同设备数据不一致
 */

export * from './ISyncSessionRepository';
export * from './ISyncProfileRepository';
export * from './IPendingChangeRepository';
export * from './ISyncConflictRepository';
