/**
 * Legacy Authentication Module Adapter
 *
 * 将旧的 Authentication 路由包装为 IApiModule。
 * Authentication 模块无需外部依赖注入（内部自行解析）。
 */

import type { IApiModule } from '../shared/contracts/api-module';
import { registerAuthenticationRoutes } from '../modules/authentication/interface';
import { registerAuthenticationInitializationTasks } from '../modules/authentication/initialization/authenticationInitialization';

export const LegacyAuthenticationModule: IApiModule = {
  name: 'Authentication',

  register({ router }) {
    // 1. 注册初始化任务（事件处理器等）
    registerAuthenticationInitializationTasks();

    // 2. Authentication 路由内部自行完成 DI，直接挂载
    const routes = registerAuthenticationRoutes();
    router.use('/auth', routes);
  },
};
