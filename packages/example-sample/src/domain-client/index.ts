/**
 * Example 模块 - Client 端领域模型
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
 * import { Example, ExampleHistory } from '@dailyuse/domain-client/example';
 * 
 * // 从 API 响应创建
 * const example = Example.fromClientDTO(response.data);
 * const history = ExampleHistory.fromClientDTO(historyDTO);
 * 
 * // 使用 UI 辅助方法
 * console.log(example.displayStatus); // '已发布'
 * console.log(history.relativeCreatedAt); // '5分钟前'
 * ```
 */

// 导出聚合根
export * from './aggregates';

// 导出实体
export * from './entities';
