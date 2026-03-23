/**
 * Goal API Module
 * 目标模块 API 入口
 *
 * 自治的 API 模块入口 — 通过 register() 暴露给 ApiBootstrapper：
 * - 内部完成 Composition Root 组装
 * - 通过 context.middleware 使用平台级中间件（auth, rbac）
 * - 通过 context.router 挂载路由
 *
 * apps/api 只需一行代码：
 * ```typescript
 * .register(GoalApiModule)
 * ```
 *
 * 路由前缀：
 * - /goals        (目标 CRUD + 状态 + 关键结果 + 复盘 + 记录)
 * - /goal-folders (文件夹 CRUD)
 */

export { GoalApiModule } from './module';
export type { GoalApiModuleDef } from './module';
export { GoalController, type GoalUseCases } from '../controllers';
export { GoalFolderController, type GoalFolderUseCases } from '../controllers';
export {
  createGoalTransportHandlers,
  createGoalFolderTransportHandlers,
} from './transport-handlers';
export { createGoalRuntimeContribution } from './runtime';
export { createGoalScheduleRuntimeContribution } from './schedule-runtime';
