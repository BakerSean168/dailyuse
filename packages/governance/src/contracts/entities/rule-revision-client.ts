/**
 * RuleRevision Entity - Client Interface
 * 规则修订记录实体 - 客户端接口
 *
 * Client 端看到的修订记录是脱敏的：
 * - 显示审计历史和变更详情
 * - 不包含敏感的内部实现细节
 * - 提供用户友好的变更摘要
 */

import type { DomainDate, TransferDate } from '@dailyuse/contracts/shared';
import type { RuleId } from '../value-objects';

// ============ 实体接口 ============

/**
 * Client 端规则修订记录
 * 
 * 用于展示规则的变更历史，让用户了解：
 * - 谁在什么时候做了修改
 * - 修改了哪些字段
 * - 修改前后的值对比
 */
export interface RuleRevisionClient {
  /**
   * 修订记录 ID
   */
  id: string;

  /**
   * 关联的规则 ID
   */
  ruleId: RuleId;

  /**
   * 修订版本号（从 1 开始递增）
   * 例如：规则的第 3 次修改，revisionNumber = 3
   */
  revisionNumber: number;

  /**
   * 修改人 ID
   */
  authorId: string;

  /**
   * 变更的字段列表
   * 例如：['title', 'severity', 'tags']
   */
  changedFields: readonly string[];

  /**
   * 修改前的值
   * 例如：{ title: '旧标题', severity: 'Recommended' }
   */
  previousValues: Record<string, unknown>;

  /**
   * 修改后的值
   * 例如：{ title: '新标题', severity: 'Mandatory' }
   */
  newValues: Record<string, unknown>;

  /**
   * 变更类型
   * - Created: 新建规则
   * - Updated: 更新内容
   * - Deprecated: 废弃规则
   * - Reactivated: 重新激活
   */
  changeType: 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';

  /**
   * 创建时间
   */
  createdAt: DomainDate;
}

// ============ DTO 定义 ============

/**
 * Client DTO (API Response)
 * 这就是返回给前端的数据结构
 */
export interface RuleRevisionClientDTO {
  id: string;
  ruleId: RuleId;
  revisionNumber: number;
  authorId: string;
  changedFields: string[];
  previousValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  changeType: 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';
  createdAt: TransferDate;
}
