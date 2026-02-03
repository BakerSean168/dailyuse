/**
 * Dashboard Module - Domain Server
 * 仪表盘模块 - 领域服务端
 * 
 * 【模块职责】
 * 管理仪表盘的核心业务逻辑，包括仪表盘配置、小组件管理、数据聚合等
 * 
 * 【包含内容】
 * - 聚合根（Aggregates）：DashboardConfig - 仪表盘配置聚合根
 * - 值对象（Value Objects）：WidgetLayout, ChartConfig, FilterCriteria 等
 * - 仓储接口（Repositories）：IDashboardConfigRepository
 * 
 * 【业务特性】
 * - 仪表盘配置：布局设置、主题配置、默认视图
 * - 小组件管理：添加、删除、移动、调整大小
 * - 数据源：多数据源聚合、实时数据更新
 * - 个性化：用户自定义仪表盘、视图保存
 * - 分享与权限：仪表盘分享、访问控制
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
export {
    DashboardConfig,
} from './aggregates';

// Repositories
export * from './repositories';
