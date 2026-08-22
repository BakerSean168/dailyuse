/**
 * AI API Module
 * AI API 模块
 *
 * Transport-only seam for apps/api: exposes `createAIApiModule`, the factory
 * that binds an already-assembled `AIModuleInstance` to an `IApiModule`-
 * compatible handle (transport + lifecycle only). The host composition root
 * (`apps/api/src/runtime/compose-ai.ts`) owns every ingredient — Prisma
 * repository set, Mastra runtime and host capability ports — and
 * hands the assembled instance to this seam. This file never reads the
 * database or environment config and never constructs concrete adapters.
 *
 * 供 apps/api 使用的纯传输层 seam：导出 `createAIApiModule`，该工厂把已装配好的
 * `AIModuleInstance` 绑定为兼容 `IApiModule` 的 handle（仅传输与生命周期）。宿主
 * 组合根（`apps/api/src/runtime/compose-ai.ts`）持有全部原料——Prisma 仓储集合、
 * Mastra runtime 与宿主能力 port——并把装配好的实例交给本 seam。本文件不读取
 * 数据库或环境配置，也不构造任何具体适配器。
 *
 * Route prefix: /ai
 * 路由前缀：/ai
 */

export { createAIApiModule } from './module';
export type { AIApiModuleContext, AIApiModuleDef, AIApiModuleOptions } from './module';
