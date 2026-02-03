/**
 * Editor Module - Domain Server
 * 编辑器模块 - 领域服务端
 * 
 * 【模块职责】
 * 管理富文本编辑器的核心业务逻辑，包括文档管理、协同编辑、版本控制等
 * 
 * 【包含内容】
 * - 聚合根（Aggregates）：Document, EditorSession
 * - 实体（Entities）：Block, TextNode, EditorCursor
 * - 值对象（Value Objects）：EditorState, SelectionRange, Format 等
 * - 仓储接口（Repositories）：IDocumentRepository, IEditorSessionRepository
 * - 领域服务（Domain Services）：CollaborativeEditingService, VersionControlService
 * 
 * 【业务特性】
 * - 文档管理：创建、编辑、删除、复制文档
 * - 块级编辑：基于 Block 的结构化内容
 * - 实时协同：多用户同时编辑、冲突解决
 * - 版本历史：变更跟踪、历史回溯、Undo/Redo
 * - 格式化：文本样式、段落格式、富媒体
 * 
 * 【依赖规则】
 * ✅ 允许依赖：
 * - @dailyuse/utils（基类：AggregateRoot, Entity）
 * - @dailyuse/contracts（DTO 接口、事件 Map）
 * - @dailyuse/domain-shared（值对象、枚举）
 * 
 * ❌ 禁止依赖：
 * - @dailyuse/domain-client（客户端领域模型）
 * - @dailyuse/infrastructure-*（基础设施层）
 * - @dailyuse/application-*（应用层）
 * - 外部 I/O 库（fs, axios, prisma, ioredis 等）
 */

// Value Objects
export * from './value-objects';

// Aggregates
export * from './aggregates';

// Entities
export * from './entities';

// Repositories
export * from './repositories';

// Domain Services
export * from './services';
