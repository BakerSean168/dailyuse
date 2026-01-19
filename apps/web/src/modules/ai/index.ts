/**
 * AI 模块导出
 * DDD Architecture: Presentation, Application, Infrastructure layers
 *
 * 目录结构：
 * - application/     应用服务层
 * - infrastructure/  基础设施层（API 客户端）
 * - initialization/  模块初始化
 * - presentation/    展示层（组件、composables、路由、视图）
 */

// ===== Initialization =====
export { initializeAIModule } from './initialization';

// ===== Application Layer - Services =====
export { GoalGenerationApplicationService, goalGenerationApplicationService } from './application';

// ===== Presentation Layer - Composables =====
export { useAIGeneration } from './presentation/composables/useAIGeneration';
export { useAIProviders } from './presentation/composables/useAIProviders';
export { useGoalGeneration } from './presentation/composables/useGoalGeneration';
export { useAIChat } from './presentation/composables/useAIChat';
export { useConversationHistory } from './presentation/composables/useConversationHistory';
export { useKnowledgeGeneration } from './presentation/composables/useKnowledgeGeneration';
export { useDocumentSummarizer } from './presentation/composables/useDocumentSummarizer';

// ===== Presentation Layer - Store =====
export { useAIStore } from './presentation/stores/aiStore';

// ===== Presentation Layer - Router =====
export { aiRoutes, aiToolsCompatibilityRoutes } from './presentation/router';

// ===== Presentation Layer - Types =====
export * from './presentation/types/chat';
export * from './presentation/types/conversation';
export * from './presentation/types/knowledgeGeneration';
export * from './presentation/types/summarization';

// ===== Infrastructure Layer - API Clients =====
export { goalGenerationApiClient } from './infrastructure/api/goalGenerationApiClient';

// ===== Types (API Clients) =====
export type { GoalGenerationApiClient } from './infrastructure/api/goalGenerationApiClient';
