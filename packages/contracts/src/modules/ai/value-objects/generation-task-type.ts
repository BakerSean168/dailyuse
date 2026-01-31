/**
 * 生成任务类型
 */
export const GenerationTaskType = {
  GoalKeyResults: 'GoalKeyResults',
  TaskTemplates: 'TaskTemplates',
  DocumentSummary: 'DocumentSummary',
  KnowledgeDocuments: 'KnowledgeDocuments',
  GeneralChat: 'GeneralChat',
  /** 目标生成（从想法到完整 Goal） */
  GoalGeneration: 'GoalGeneration',
} as const;

export type GenerationTaskType = (typeof GenerationTaskType)[keyof typeof GenerationTaskType];
