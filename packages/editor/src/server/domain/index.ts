/**
 * Editor Module - Domain Server
 * 编辑器模块 - 领域服务端
 *
 * 【模块职责】
 * 管理编辑器工作区、会话、标签、资源元数据与搜索索引等核心业务逻辑
 *
 * 【包含内容】
 * - 聚合根（Aggregates）：EditorWorkspace, EditorSession
 * - 实体（Entities）：EditorTab, SearchEngine, ResourceVersion, LinkedResource
 * - 值对象（Value Objects）：TabType, ResourceMetadata, SearchQuery 等
 * - 仓储接口（Repositories）：工作区 / 会话 / 分组 / 标签 / 资源关联仓储
 * - 领域服务（Domain Services）：编辑器会话与资源协作相关服务
 *
 * 【业务特性】
 * - 工作区布局：会话、分组、标签的创建与激活
 * - 资源关联：标签与仓储资源之间的映射和元数据维护
 * - 搜索索引：资源索引状态、进度与检索能力
 * - 协作扩展：为后续协同编辑与历史能力保留清晰边界
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
