/**
 * Editor Aggregates
 * 编辑器模块聚合根统一导出
 *
 * 【规范说明：聚合根（Aggregate Root）】
 * 聚合根是 DDD 中的核心概念：
 * - 聚合的入口点：外部只能通过聚合根访问聚合内的实体
 * - 事务边界：一次事务只能修改一个聚合根
 * - 不变量守护者：确保聚合内的业务规则始终满足
 * - 领域事件发布者：状态变更时发出领域事件
 *
 * 【EditorWorkspace 聚合根】
 * - 编辑器工作区管理：资源、标签页、打开文件的管理
 * - 编辑状态追踪：光标位置、选择范围、滚动位置
 * - 协作编辑支持：多人编辑的并发控制
 * - 版本管理：编辑历史、撤销/重做、版本恢复
 *
 * ⚠️ 注意：EditorSession 现在是实体，在 entities/ 文件夹中
 * EditorWorkspace 是聚合根，EditorSession 是聚合内的实体
 */

export * from './editor-workspace';
