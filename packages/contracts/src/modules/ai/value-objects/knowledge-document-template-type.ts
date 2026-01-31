/**
 * 知识文档模板类型
 */
export const KnowledgeDocumentTemplateType = {
  Overview: 'Overview',
  ActionGuide: 'ActionGuide',
  BestPractice: 'BestPractice',
  DataAnalysis: 'DataAnalysis',
  Faq: 'Faq',
} as const;

export type KnowledgeDocumentTemplateType = (typeof KnowledgeDocumentTemplateType)[keyof typeof KnowledgeDocumentTemplateType];
