/**
 * Example Module - Aggregates Export
 * 
 * 【规范说明：Aggregate 导出结构】
 * 导出顺序：Client → Server → Events
 * 这个顺序反映了使用频率和依赖关系
 */

// ============ Client Aggregate (前端/外部消费者) ============
export type { ExampleClientDTO, ExampleClient } from './example-client';

// ============ Server Aggregate (后端/内部通信) ============
export type {
  ExamplePersistenceDTO,
  ExampleServerDTO,
  ExampleServer,
} from './example-server';

