/**
 * AI Routes Aggregator
 * 聚合所有 AI 相关的 HTTP 路由
 *
 * 路由结构：
 * - /api/ai/providers      - AI Provider 配置管理
 * - /api/ai/generate/*     - AI 内容生成
 * - /api/ai/chat           - AI 对话功能
 * - /api/ai/quota          - 配额查询
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import { registerProviderRoutes } from './ai-provider.routes';
import { registerGenerationRoutes } from './ai-generation.routes';
import { registerChatRoutes } from './ai-chat.routes';
import type { AIModule } from '@dailyuse/infrastructure-server';

export function registerAIRoutes(aiModule: AIModule): Router {
  const router: Router = ExpressRouter();

  // ============ AI Provider 管理 ============
  router.use('/providers', registerProviderRoutes(aiModule.providerConfigService));

  // ============ AI 生成功能 ============
  router.use('/generate', registerGenerationRoutes(aiModule.generationService));

  // ============ AI 对话功能 ============
  router.use('/chat', registerChatRoutes(
    aiModule.chatService,
    aiModule.conversationService,
    aiModule.getQuota
  ));

  return router;
}
