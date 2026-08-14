/**
 * AI API Module
 * AI API 模块
 *
 * Exposes the AI API transport factory for apps/api.
 * 为 apps/api 暴露 AI API 传输工厂。
 *
 * IMPORTANT (documented residual): the API AI module is NOT yet transport-only.
 * `createAIApiModule()` still composes the Prisma repositories and service
 * runtime adapters inside `register()` and reads the database from context.
 * It is outside the batch composition-root externalization scope and is tracked
 * as a follow-up; the desktop lane is already host-composed via
 * `apps/desktop/src/main/runtime/compose-ai.ts`. Do not read this file as an
 * example of the host-composer ownership model.
 *
 * 重要（已记录 residual）：API AI 模块目前还不是纯传输层。`createAIApiModule()`
 * 仍在 `register()` 内组装 Prisma repository 与服务 runtime 适配器，并从 context
 * 读取数据库。它不在本批 composition-root 外移范围内，已记录为后续 follow-up；
 * desktop lane 已通过 `apps/desktop/src/main/runtime/compose-ai.ts` 由宿主组装。
 * 请不要把该文件当作 host-composer 归属模型的示例。
 *
 * Route prefix: /ai
 * 路由前缀：/ai
 */

export { createAIApiModule } from './module';
export type { AIApiModuleContext, AIApiModuleDef, AIApiModuleOptions } from './module';
