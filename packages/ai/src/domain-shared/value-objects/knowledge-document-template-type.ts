import type { KnowledgeDocumentTemplateType as IKnowledgeDocumentTemplateType } from '@dailyuse/contracts/ai';

/**
 * KnowledgeDocumentTemplateType 枚举类型
 * 
 * 【规范说明：枚举与常量对象规范】
 */

export type KnowledgeDocumentTemplateType = IKnowledgeDocumentTemplateType & { readonly __brand: unique symbol };

const VALUES: IKnowledgeDocumentTemplateType[] = [
  'Overview',
  'ActionGuide',
  'BestPractice',
  'DataAnalysis',
  'Faq',
];

export const KnowledgeDocumentTemplateType = {
  Overview: 'Overview' as KnowledgeDocumentTemplateType,
  ActionGuide: 'ActionGuide' as KnowledgeDocumentTemplateType,
  BestPractice: 'BestPractice' as KnowledgeDocumentTemplateType,
  DataAnalysis: 'DataAnalysis' as KnowledgeDocumentTemplateType,
  Faq: 'Faq' as KnowledgeDocumentTemplateType,

  of(value: string): KnowledgeDocumentTemplateType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid KnowledgeDocumentTemplateType: ${value}`);
    }
    return value as KnowledgeDocumentTemplateType;
  },

  isValid(value: string): value is KnowledgeDocumentTemplateType {
    return VALUES.includes(value as IKnowledgeDocumentTemplateType);
  },

  getAll(): KnowledgeDocumentTemplateType[] {
    return VALUES as KnowledgeDocumentTemplateType[];
  },
};
