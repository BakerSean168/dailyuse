/**
 * Governance Module - Domain Client
 * 规则治理模块 - 领域客户端
 * 
 * 【模块职责】
 * 提供 Client 端的领域对象，专注于：
 * 1. UI 展示逻辑（View Model）
 * 2. 乐观更新支持
 * 3. 状态派生计算
 * 
 * 【时间类型规范 - ACL（Anti-Corruption Layer）】
 * - TransferDate = number：API 响应中的时间字段
 * - DomainDate = Date：客户端内部存储，便于日期计算和格式化
 * 
 * 【与其他包的关系】
 * - @dailyuse/contracts：DTO 定义
 * - @dailyuse/domain-shared：共享的值对象和枚举
 * - @dailyuse/domain-client：本包，UI 层使用的领域对象
 * 
 * 【使用示例】
 * ```typescript
 * import { Rule, RuleRevision } from '@dailyuse/governance/domain-client';
 * 
 * // 从 API 响应创建
 * const rule = Rule.fromDTO(response.data);
 * const revision = RuleRevision.fromDTO(historyDTO);
 * 
 * // 使用 UI 辅助方法
 * console.log(rule.displayStatus); // '生效中'
 * console.log(revision.relativeCreatedAt); // '5分钟前'
 * console.log(rule.hasTag('ddd')); // true
 * ```
 */

// ===== Aggregates =====
export * from './aggregates';

// ===== Entities =====
export * from './entities';

