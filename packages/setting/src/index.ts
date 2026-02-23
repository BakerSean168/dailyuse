/**
 * @dailyuse/setting
 *
 * 设置模块 - 用户偏好管理
 *
 * 【分层架构】
 *
 * contracts              → 类型定义、DTO、Preference 接口、事件（@dailyuse/contracts/setting）
 * domain-shared          → 值对象（SettingId）
 * domain-server          → 聚合根（UserSetting）、仓储接口、领域错误
 * domain-client          → 客户端领域模型
 * application-server     → 用例服务（Get/Update/Reset/Export/Import）
 * application-client     → 客户端服务
 * infrastructure-server  → Prisma 仓储实现、DI 模块
 * infrastructure-client  → HTTP/IPC 适配器
 *
 * 【使用示例】
 *
 * ```typescript
 * // 1. 导入 Preference 类型
 * import type { AppearancePreferences, UserSettingClientDTO } from '@dailyuse/contracts/setting';
 *
 * // 2. 导入聚合根
 * import { UserSetting } from '@dailyuse/setting/domain-server';
 *
 * // 3. 导入基础设施模块
 * import { SettingModule } from '@dailyuse/setting/infrastructure-server';
 * ```
 */

// ================= Contracts Layer =================
export * from '@dailyuse/contracts/setting';

// ================= Domain Layer =================
export * from './domain-server';

// ================= Application Layer =================
export * from './application-server';
export * from './application-client';

// ================= Infrastructure Layer =================
export * from './infrastructure-server';
export * from './infrastructure-client';
