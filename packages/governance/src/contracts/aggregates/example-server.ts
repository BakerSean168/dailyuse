/**
 * Example Aggregate Root - Server Interface
 * 
 * 【规范说明：服务端接口（Server）】
 * 用于后端服务的内部通信。特点：
 * 1. 使用完全强类型（typed ID, domain objects）
 * 2. 包含服务层需要的元数据和内部字段
 * 3. 可能包含不被外部消费者看到的字段
 * 4. 用于聚合根的内部状态表示
 * 5. 领域模型和传输层 id 使用强类型，持久层使用 string
 */

import type { ExampleId, IdentityId, DomainDate, PersistenceDate, TransferDate } from '@dailyuse/contracts/primitives';
import type { ExampleStatus, ExampleProperty } from '../value-objects';
import type { ExampleTagServer, ExampleTagServerDTO } from '../entities';

/**
 * 服务层聚合根接口
 * - 代表一个完整的业务对象
 * - 包含业务逻辑和不变量检查
 * - ID 和日期使用强类型
 * 
 * 【聚合根说明】
 * 聚合是 DDD 中的概念，代表一个业务边界。
 * 聚合根是聚合中的顶级实体。规则：
 * 1. 外部只能通过根来访问聚合内的对象
 * 2. 聚合内部有独立的事务一致性
 * 3. 聚合应该相对小（避免过大的图）
 */
export interface ExampleServer {
  id: ExampleId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  status: ExampleStatus;
  priority: number;
  isPublic: boolean;
  viewCount: number;
  likeCount: number;

  //子实体
  exampleTags: ExampleTagServer[]; // 仅包含标签 ID 列表

  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
}

/**
 * 服务层持久化 DTO
 * - 用于数据库持久化层（ORM、查询构建器）
 * - 字段名称可能对应数据库列名
 * - 包含所有数据库中存储的字段
 * - 避免数据库特定类型在上层暴露
 */
export interface ExamplePersistenceDTO {
  id: string;
  identityId: string;
  name: string;
  description: string | null;
  status: string;
  priority: number;
  isPublic: boolean;
  viewCount: number;
  likeCount: number;

  exampleTags: ExamplePersistenceDTO[]; // 仅包含标签 ID 列表

  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}

/**
 * 应用服务 DTO
 * - 在不同服务层之间传递
 * - 比 Persistence DTO 更业务化
 * - 包含必要的计算字段但不包含 ORM 的内部状态
 */
export interface ExampleServerDTO {
  id: ExampleId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  status: string;
  priority: number;
  isPublic: boolean;
  viewCount: number;
  likeCount: number;

  exampleTags: ExampleTagServerDTO[]; // 仅包含标签 ID 列表

  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}
