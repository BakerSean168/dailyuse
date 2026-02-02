/**
 * Example Aggregate Root - Client Interface
 * 
 * 【规范说明：客户端接口（Client）】
 * 用于前端/外部 API 消费者。特点：
 * 1. 使用基础类型和字符串表示 ID（便于序列化）
 * 2. 日期字段使用对应的防腐层类型（如 TransferDate）
 * 3. 不包含服务层的实现细节
 * 4. 包含所有用户可见的字段
 */

import type { TransferDate } from '@/primitives';

/**
 * 传输层 DTO（序列化格式）
 * - 直接对应 REST API 响应或数据库 JSON
 * - 所有字段都是基础类型或嵌套 DTO
 * - 字段可选性要体现业务规则（如 description 是可选的）
 */
export interface ExampleClientDTO {
  id: string;
  name: string;
  description: string | null;
  status: string; // 状态值，如 'Draft', 'Active'
  priority: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * 领域模型客户端接口
 * - 在应用服务层使用
 * - 比 DTO 更类型安全
 * - 包含从 primitives 导入的强类型 ID
 */
import type { ExampleId, IdentityId } from '@/primitives';
import type { ExampleStatusType } from '../value-objects';

export interface ExampleClient {
  id: ExampleId;
  name: string;
  description: string | null;
  status: ExampleStatusType;
  priority: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * 【规范说明：为什么分 DTO 和 Client 接口】
 * 
 * DTO（ExampleClientDTO）：
 * - 序列化友好（字符串、数字）
 * - 直接对应数据库或 API payload
 * 
 * Client Interface（ExampleClient）：
 * - 提供强类型保证
 * - 用于应用服务的返回类型
 * - 封装了原始类型（如 ExampleId 而不是 string）
 * 
 * 典型的数据流：
 * Database JSON → DTO → Domain Model (Client Interface) → API Response
 *
 * 新人常犯的错误：
 * ❌ 直接使用 DTO 作为业务逻辑的输入/输出
 * ✅ DTO ↔ 类型转换 ↔ Client Interface（业务逻辑）
 */
