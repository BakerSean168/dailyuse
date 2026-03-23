/**
 * Schedule API Module
 * 调度 API 模块
 *
 * Self-contained API module entry — exposed to ApiBootstrapper via register().
 * 自治的 API 模块入口 — 通过 register() 暴露给 ApiBootstrapper。
 *
 * apps/api only needs one line:
 * apps/api 只需一行代码：
 * ```typescript
 * .register(ScheduleApiModule)
 * ```
 *
 * Route prefixes / 路由前缀:
 * - /schedules        (task scheduling)
 * - /schedules/events (calendar entries)
 */

export { ScheduleApiModule, createScheduleApiModule } from './module';
export type {
  ScheduleApiModuleContext,
  ScheduleApiModuleDef,
  CreateScheduleApiModuleOptions,
} from './module';
export { ScheduleController, type ScheduleUseCases } from '../controllers';
export { ScheduleEventController, type ScheduleEventUseCases } from '../controllers';
