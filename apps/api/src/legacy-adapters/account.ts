/**
 * Legacy Account Module Adapter
 *
 * 将旧的 AccountModule (infrastructure-server) 包装为 IApiModule，
 * 实现白名单注册机制。
 */

import type { IApiModule } from '../shared/contracts/api-module';
import { AccountModule } from '@dailyuse/infrastructure-server';
import { registerAccountRoutes } from '../modules/account/interface';

export const LegacyAccountModule: IApiModule = {
  name: 'Account',

  register({ router, db }) {
    // 1. 组装旧模块（Composition Root）
    const accountModule = new AccountModule('prisma', db);

    // 2. 获取已有路由
    const routes = registerAccountRoutes(accountModule);

    // 3. 挂载
    router.use('/accounts', routes);
  },
};
