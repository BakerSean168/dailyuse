/**
 * API Module Standard Contracts
 *
 * 所有 API 模块（新模块 & 旧模块适配器）必须实现 IApiModule 接口，
 * 由 ApiBootstrapper 统一注册和管理生命周期。
 *
 * @example
 * ```typescript
 * import type { IApiModule } from '@/shared/contracts/api-module';
 *
 * export const MyModule: IApiModule = {
 *   name: 'MyModule',
 *   register({ router, db }) {
 *     const repo = new MyRepo(db);
 *     const r = Router();
 *     r.get('/', ...);
 *     router.use('/my', r);
 *   },
 * };
 * ```
 */

import type { RequestHandler } from 'express';
import type { ServerModuleContext } from '@dailyuse/contracts/shared';
import type { PrismaClient } from '@dailyuse/database';

/**
 * 数据库客户端类型
 *
 * 当前 API runtime 使用 @dailyuse/database 暴露的共享 PrismaClient。
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
  /** JWT 认证中间件 */
  readonly auth: RequestHandler;
  /** 角色权限检查中间件 */
  requireRole(roles: string[]): RequestHandler;
  /**
   * Optional gate: after JWT auth, block Unverified identities on sensitive routes.
   * 可选门禁：JWT 后对未验证邮箱身份拦截敏感路由。
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
 * 模块在 register() 内完成 Composition Root 组装（创建 Repo → Service → Controller）
 * 并将路由挂载到 context.router 上。
 */
export interface IApiModule {
  /** 模块名称，用于日志和调试 */
  readonly name: string;

  /**
   * 注册模块
   *
   * 在此方法内完成：
   * 1. 依赖注入（Composition Root）
   * 2. 路由创建与挂载
   * 3. 事件监听器注册（可选）
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
