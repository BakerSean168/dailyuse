/**
 * API Module Standard Contracts
 *
 * 所有 API 模块（新模块 & 旧模块适配器）必须实现 IApiModule 接口，
 * 由 ApiBootstrapper 统一注册和管理生命周期。
 *
 * @example
 * ```typescript
 * import type { IApiModule } from './api-module';
 * import { createMyModule } from '@memoflow/my-pkg';
 * import { createMyApiModule } from '@memoflow/my-pkg/api';
 *
 * // Host composition root (apps/api/src/runtime/compose-my.ts): the runtime
 * // selects adapters, assembles the transport-neutral instance, and binds it
 * // into an already-bound IApiModule-compatible handle BEFORE registration.
 * export const MyModule: IApiModule = createMyApiModule({
 *   instance: createMyModule({ repository, servicePort }),
 * });
 * ```
 */

import type { RequestHandler } from 'express';
import type { ServerModuleContext } from '@memoflow/contracts/shared';
import type { PrismaClient } from '@memoflow/database';

/**
 * 数据库客户端类型
 *
 * 当前 API runtime 使用 @memoflow/database 暴露的共享 PrismaClient。
 *
 * 如果未来真的引入第二个生成客户端，请在这里扩展为明确 union 或能力接口，
 * 不要回退到裸 any。
 */
export type DatabaseClient = PrismaClient;

/**
 * API 中间件工厂
 *
 * ApiBootstrapper 提供给模块的中间件接口，
 * 模块无需直接引用 apps/api 的内部实现，
 * 实现真正的"物理隔离"。
 */
export interface IApiMiddleware {
  /** Cloud session authentication middleware. */
  readonly auth: RequestHandler;
  /** 角色权限检查中间件 */
  requireRole(roles: string[]): RequestHandler;
  /**
   * Optional gate after cloud authentication for verified-email capabilities.
   */
  readonly requireEmailVerified?: RequestHandler;
}

/**
 * 模块注册上下文
 *
 * ApiBootstrapper 提供给每个模块的"工具箱"，模块在 register() 中
 * 通过此上下文完成依赖注入和路由挂载。
 */
export interface IApiModuleContext extends ServerModuleContext<DatabaseClient> {}

/**
 * API 模块标准接口
 *
 * 所有业务模块必须实现此接口才能被 ApiBootstrapper 加载。
 *
 * 目标方向（target direction）：runtime-first 装配 —— 宿主（apps/api/src/runtime）
 * 在 register() 之前完成 feature 模块的 Composition Root 组装（选择 adapter →
 * repository → application instance），register() 只负责 transport 注册与模块生命周期
 * （start/dispose）。参见 apps/api/src/runtime/compose-governance.ts 的治理示范。
 *
 * 当前全部 feature 模块（含 AI）均已由宿主 runtime composer 在 register() 之前完成
 * 组装；`context.db` 字段保留用于 platform adapter（如 app-local host adapter）与
 * 兼容既有代码，transport 层不再从 context 组装 feature。
 */
export interface IApiModule {
  /** 模块名称，用于日志和调试 */
  readonly name: string;

  /**
   * 注册模块
   *
   * 在此方法内完成：
   * 1. transport 注册（路由挂载）
   * 2. 模块生命周期启动（可选）
   *
   * feature 组装（Repository/UseCase/Application）已由宿主 runtime composer
   * 在 register() 之前完成。
   *
   * @param context - ApiBootstrapper 提供的上下文
   */
  register(context: IApiModuleContext): Promise<void> | void;

  /**
   * 模块销毁（可选）
   *
   * 用于释放资源、取消定时任务、断开连接等。
   * ApiBootstrapper 会在应用关闭时调用。
   */
  destroy?(): Promise<void> | void;
}
