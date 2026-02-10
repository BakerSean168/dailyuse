/**
 * Domain Client 模块导出
 *
 * domain-client 是面向前端（Web/Desktop/Mobile）的领域模型层
 * 主要职责：
 * - 实现 Client 接口（XXXClient）
 * - 提供 fromDTO/toDTO 转换
 * - 封装客户端业务逻辑
 *
 * 【依赖规则】
 * ✅ 允许依赖：
 * - @dailyuse/contracts（DTO 接口、Client 接口）
 * - @dailyuse/domain-shared（值对象、枚举）
 * - @dailyuse/utils（基类：AggregateRoot, Entity）
 *
 * ❌ 禁止依赖：
 * - @dailyuse/domain-server（服务端领域模型）
 * - @dailyuse/infrastructure-*（基础设施层）
 * - @dailyuse/application-*（应用层）
 */

// Account 模块
export * from './account/index.js';

// Authentication 模块
export * from './authentication/index.js';

// Repository 模块
export * from '@dailyuse/repository/domain-client';

// Task 模块
export * from '@dailyuse/task/domain-client';

// Setting 模块
export * from '@dailyuse/setting/domain-client';

// Goal 模块
export * from '@dailyuse/goal/domain-client';

// Reminder 模块
export * from '@dailyuse/reminder/domain-client';

// Notification 模块
export * from '@dailyuse/notification/domain-client';

// Editor 模块
export * from '@dailyuse/editor/domain-client';

// Schedule 模块
export * from '@dailyuse/schedule/domain-client';

// AI 模块
export * from './ai/index.js';

// Sync 模块
// export * from './sync/index.js';

