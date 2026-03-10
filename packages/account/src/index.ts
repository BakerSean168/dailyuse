/**
 * @dailyuse/account
 *
 * 账户模块 - 用户账户管理
 *
 * 【分层架构�?
 *
 * contracts      �?类型定义、DTO、事件、API Schema
 * domain-shared  �?值对象工厂（前后端共享）
 * domain-server  �?聚合根、仓储接�?
 * domain-client  �?客户端领域模�?
 * application-server �?用例（服务端�?
 * application-client �?客户端服�?
 * infrastructure-server �?Prisma 仓储实现
 * infrastructure-client �?HTTP/IPC 适配�?
 * api            �?Express API 模块
 *
 * 【使用示例�?
 *
 * ```typescript
 * // 1. 导入契约
 * import type { AccountClientDTO } from '@dailyuse/contracts/account';
 *
 * // 2. 导入服务端聚合根
 * import { Account } from '@dailyuse/account/domain-server';
 *
 * // 3. 导入 API 模块（在 apps/api 中）
 * import { AccountApiModule } from '@dailyuse/account/api';
 * bootstrapper.register(AccountApiModule);
 * ```
 */

// ================= Contracts Layer =================
export * from '@dailyuse/contracts/account';

// ================= Domain Layer =================
export { Account } from './domain-server';
export type { IAccountRepository } from './domain-server';

// ================= Application Layer =================
export * from './application-server';
export * from './application-client';

// ================= Infrastructure Layer =================
export {
  PrismaAccountRepository,
  PowerSyncAccountRepository,
  AccountModule,
} from './infrastructure-server';
export * from './infrastructure-client';
export * from './electron-entry';
