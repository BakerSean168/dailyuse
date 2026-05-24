/**
 * Editor Repositories
 * 编辑器仓储接口导出
 *
 * 【规范说明：仓储（Repository）】
 * 仓储是聚合根的持久化变量市场，应遵循以下原则：
 * - 只接口不接实现：其仓储接口帮助 DDD 的 Transactional Boundaries
 * - 单个聚合根一个仓储：一个聚合根不应该有多个仓储
 * - 聚合内的实体不会直接指接仓储：需要通过聚合根访问
 * - 根据聊天斤团决分：一次只修改一个聚合根
 *
 * 【IEditorWorkspaceRepository】
 * - 编辑器工作区持久化：管理编辑器工作区的整体状态
 *
 * 【IEditorSessionRepository】
 * - 编辑会话持久化：每个编辑会话是一次事务
 *
 * 【IEditorGroupRepository】
 * - 标签页缕布持久化：管理澏月页、分组等
 *
 * 【IEditorTabRepository】
 * - 资源标签页持久化：每一个打开的资源标签页
 *
 */

export * from './i-editor-workspace-repository';
export * from './i-editor-session-repository';
export * from './i-editor-group-repository';
export * from './i-editor-tab-repository';
export * from './i-resource-version-repository';
export * from './i-linked-resource-repository';
export * from './i-search-engine-repository';
