/**
 * @memoflow/ai/testing — intentional testing export for smoke/integration tests.
 *
 * These are production transport/domain pieces a host test needs to mount the
 * real AI router and compose the real dispatch chain. They are re-exported
 * through an explicit `./testing` package export (instead of private deep
 * imports) so tests never bypass the public package boundary.
 *
 * @memoflow/ai/testing —— 供 smoke/集成测试使用的显式 testing 导出。
 * 宿主测试需要挂载真实 AI router 并组装真实 dispatch 链的传输/领域件，统一经
 * `./testing` 包导出，而不是走私有深路径，避免测试绕过公开包边界。
 */
export * from './ai-test-support';
export { registerAIAssistantRoutes } from '../api/routes/ai-assistant.routes';
export { AIAssistantFacadeController } from '../server/transport/ai-assistant-facade.controller';
export type { AIAssistantFacadeControllerService } from '../server/transport/ai-assistant-facade.controller';
export { AIServiceChatExecutionAdapter } from '../server/infrastructure/chat-execution/ai-service-chat-execution.adapter';
