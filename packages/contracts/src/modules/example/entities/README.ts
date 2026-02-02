/**
 * Example Module - Entities Export
 * 
 * 【规范说明：Entity（实体）】
 * Entity 是有唯一标识（ID）的领域对象
 * 
 * 与 Aggregate Root 的区别：
 * - Aggregate Root（聚合根）：聚合的顶级实体，外部只能通过它访问聚合内的对象
 * - Entity（实体）：聚合内的子实体，或独立的实体
 * 
 * 在这个模块中：
 * - Example 是 Aggregate Root（定义在 aggregates/ 中）
 * - ExampleTag 是 Entity（定义在 entities/ 中）
 */

export type { ExampleTagClient, ExampleTagClientDTO } from './example-tag-client';
export type { ExampleTagServer, ExampleTagServerDTO, ExampleTagPersistenceDTO } from './example-tag-server';
