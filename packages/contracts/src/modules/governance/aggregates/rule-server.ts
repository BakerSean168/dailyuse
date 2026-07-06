/**
 * Rule Aggregate Root - Server Contracts
 * 规则聚合根 - 服务端契约
 *
 * 【规范说明：聚合根 DTO 三层模式】
 * 聚合根在 contracts 层定义三种 DTO 形态，分别对应不同传输场景：
 *
 * 1. ServerDTO（传输层 / Transfer Layer）
 *    - 用于 API 请求/响应传输
 *    - 使用 branded ID 类型（如 RuleId）而非 string，防止 ID 意外混用
 *    - 使用 TransferDate（number 毫秒时间戳）而非 Date 对象，因为 Date 无法跨序列化边界
 *    - 包含完整的关联实体/值对象
 *
 * 2. PersistenceDTO（持久层 / Persistence Layer）
 *    - 用于数据库读写（Prisma/ORM）
 *    - 使用原始 string/Date 类型
 *    - 值对象可能序列化为 JSON string
 *
 * 3. ClientDTO（客户端层 / Client Layer）
 *    - 用于 UI 消费，可能包含计算/展示属性
 *    - 见 rule-client.ts
 *
 * 【为什么用 branded ID 而非 string】
 * RuleId = string & { readonly __brand: 'RuleId' }
 * 运行时仍是 string，编译时防止 RuleId 和 RuleRevisionId 意外混用。
 * 参见：docs/standards/id值对象生成id的实现.md
 *
 * 【为什么用 TransferDate 而非 Date】
 * Date 对象在 JSON 序列化后变成 string，反序列化后需要手动转回。
 * TransferDate (number, 毫秒时间戳) 天然可序列化，无损传输。
 * 参见：docs/standards/值对象里的时间使用number时间戳-毫秒.md
 */

import type { TransferDate, IdentityId } from '@dailyuse/contracts/primitives';
import type { RuleId } from '../primitives/ids';
import type { RuleTagDTO } from '../value-objects/rule-tag';
import type { RuleStatus } from '../value-objects/rule-status';
import type { RuleSeverity } from '../value-objects/rule-severity';
import type { CodeSnippetDTO } from '../value-objects/code-snippet';

// ============ Transfer DTO (传输层) ============

/**
 * Rule Server DTO — 聚合根的 API 传输形态。
 *
 * 用于模块间/客户端-服务端数据交换。
 * 字段类型遵循三层 DTO 约定：branded ID + TransferDate。
 */
export interface RuleServerDTO {
  id: RuleId;
  code: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  status: RuleStatus;
  deprecationReason: string | null;
  replacementRuleId: RuleId | null;
  liveReferenceLocation: string | null;
  tags: RuleTagDTO[];
  goodExamples: CodeSnippetDTO[];
  badExamples: CodeSnippetDTO[];
  authorId: IdentityId;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}
