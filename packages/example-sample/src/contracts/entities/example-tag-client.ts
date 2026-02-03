import type { DomainDate, TransferDate } from '@dailyuse/contracts/primitives';

/**
 * ExampleTag Entity - Client Interface
 * 
 * 【规范说明：Entity（实体）】
 * Entity 是有唯一标识（ID）的领域对象。与 Value Object 不同：
 * - Entity：有 ID，可以追踪生命周期，相等性通过 ID 判断
 * - Value Object：无 ID，不可变，相等性通过值判断
 * 
 * 【时间类型规范 - 防腐层设计】
 * Client 层的时间字段统一使用 TransferDate（number 时间戳）
 * 前端通常使用 date-fns 等库处理，传输时使用时间戳更高效
 */

/**
 * 标签 Entity - Client DTO
 * 用于前端/API 序列化
 * 时间字段使用 TransferDate（number 时间戳）
 */
export interface ExampleTagClientDTO {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * 标签 Entity - Client 接口
 * 用于应用服务层
 * 时间字段使用 TransferDate（number 时间戳）
 */
export interface ExampleTagClient {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
}
