/**
 * AI API Module
 * AI API 模块
 *
 * 自治的 API 模块入口 — 通过 register() 暴露给 ApiBootstrapper：
 * - 内部完成 Composition Root 组装
 * - 通过 context.middleware 使用平台级中间件（auth, rbac）
 * - 通过 context.router 挂载路由
 *
 * apps/api 只需一行代码：
 * ```typescript
 * const AIApiModule = createAIApiModule({ ... });
 * .register(AIApiModule)
 * ```
 *
 * 路由前缀：
 * - /ai/providers     (提供商配置)
 * - /ai/chat          (对话与消息)
 * - /ai/knowledge-notes (知识笔记)
 * - /ai/generate      (目标生成)
 */

export { createAIApiModule } from './module';
export type { AIApiModuleContext, AIApiModuleDef } from './module';
