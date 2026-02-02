import type { DomainDate, TransferDate, PersistenceDate } from '@/primitives';

/**
 * ExampleTag Entity - Server Interface
 * 
 * 【规范说明：Server Entity】
 * Server 层的 Entity 定义，用于后端业务逻辑
 * 
 * 【时间类型规范 - 防腐层设计】
 * - TransferDate: number（Unix 时间戳，用于 API/DTO 传输层）
 * - DomainDate: Date（业务逻辑层，用于领域计算和规则验证）
 * - PersistenceDate: Date（数据库持久化层，Prisma/ORM）
 * 
 * 这是防腐层（Anti-Corruption Layer）设计模式的体现：
 * 通过类型别名隔离外部依赖，未来如果需要更换实现（如时间戳改为 bigint），
 * 只需修改 primitives/ 下的类型定义，不影响业务代码。
 */

/**
 * 标签 Entity - Server DTO
 * 用于服务层数据传输（API 请求/响应）
 * 时间字段使用 TransferDate（number 时间戳）
 */
export interface ExampleTagServerDTO {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: TransferDate; // Unix 时间戳（毫秒），例如 1704067200000
  updatedAt: TransferDate;
}

/**
 * 标签 Entity - Server 接口
 * 用于应用服务和业务逻辑层
 * 时间字段使用 DomainDate（Date 对象）
 */
export interface ExampleTagServer {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: DomainDate; // Date 对象，用于业务逻辑计算
  updatedAt: DomainDate;
}

/**
 * 标签 Entity - 持久化 DTO
 * 用于数据库持久化层
 * 时间字段使用 PersistenceDate（Date 对象）
 */
export interface ExampleTagPersistenceDTO {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: PersistenceDate; // Date 对象，Prisma 返回的类型
  updatedAt: PersistenceDate;
}
