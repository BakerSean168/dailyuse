/**
 * Editor Domain Services
 * 编辑器领域服务
 * 
 * 【规范说明：领域服务（Domain Service）】
 * 领域服务是跨聚合根的业务逻辑，使用场景：
 * - 一次操作涉及多个聚合根时
 * - 业务逻辑不属于任何单一聚合根
 * - 无决类状态：整个业务逻辑执行后才保存
 * - 注入仓储：很有提供仓储侦可培议可蚓
 * 
 * 【EditorWorkspaceDomainService】
 * - 工作区整体管理：幸会事务提取整合逻辑
 * - 文档版本处理：保存不输会话、撤销重做
 * - 协作编辑支持：管理多人编辑会话
 */

export * from './EditorWorkspaceDomainService';
