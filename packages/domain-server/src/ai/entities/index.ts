/**
 * AI Entities
 * AI 模块实体导出
 */

export { Message } from './message';
export type { KnowledgeGenerationTask, KnowledgeGenerationTaskStatus } from './knowledge-generation-task';
export { createKnowledgeGenerationTask, updateTaskProgress, completeTask, failTask } from './knowledge-generation-task';
