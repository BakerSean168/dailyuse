/**
 * AI Module - Domain Client
 * AI 模块 - 领域客户�?
 *
 * 【模块职责�?
 * 管理 AI 功能的客户端领域模型，包括对话管理、消息处理等
 *
 * 【包含内容�?
 * - 聚合根（Aggregates）：AIConversation
 * - 实体（Entities）：Message
 * - 值对象（Value Objects）：�?domain-shared 导入
 *
 * 【依赖规则�?
 * �?允许依赖�?
 * - @dailyuse/utils（基类：AggregateRoot, Entity�?
 * - @dailyuse/contracts（DTO 接口、Client 接口�?
 * - @dailyuse/domain-shared（值对象、枚举）
 *
 * �?禁止依赖�?
 * - @dailyuse/domain-server（服务端领域模型�?
 * - @dailyuse/infrastructure-*（基础设施层）
 * - @dailyuse/application-*（应用层�?
 */

// ===== Aggregates =====
export * from './aggregates';

// ===== Entities =====
export * from './entities';

// ===== Value Objects (re-export from domain-shared) =====
export * from '@/domain-shared';
