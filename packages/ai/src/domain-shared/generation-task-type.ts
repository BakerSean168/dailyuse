import type { GenerationTaskType as IGenerationTaskType } from '@dailyuse/contracts/ai';

/**
 * GenerationTaskType 枚举类型
 * 
 * 【规范说明：枚举与常量对象规范】
 */

export type GenerationTaskType = IGenerationTaskType & { readonly __brand: unique symbol };

const VALUES: IGenerationTaskType[] = [
  'GoalKeyResults',
  'TaskTemplates',
  'DocumentSummary',
  'KnowledgeDocuments',
  'GeneralChat',
  'GoalGeneration',
];

export const GenerationTaskType = {
  GoalKeyResults: 'GoalKeyResults' as GenerationTaskType,
  TaskTemplates: 'TaskTemplates' as GenerationTaskType,
  DocumentSummary: 'DocumentSummary' as GenerationTaskType,
  KnowledgeDocuments: 'KnowledgeDocuments' as GenerationTaskType,
  GeneralChat: 'GeneralChat' as GenerationTaskType,
  GoalGeneration: 'GoalGeneration' as GenerationTaskType,

  of(value: string): GenerationTaskType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid GenerationTaskType: ${value}`);
    }
    return value as GenerationTaskType;
  },

  isValid(value: string): value is GenerationTaskType {
    return VALUES.includes(value as IGenerationTaskType);
  },

  getAll(): GenerationTaskType[] {
    return VALUES as GenerationTaskType[];
  },
};
