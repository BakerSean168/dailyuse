import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 695: AI response dual bodies retired.
 * SendMessage / ListAIProviderConfigs / QueryAnalytics / QueryKnowledge /
 * ExpandKnowledge / CreateKnowledgeNote *Res reuse *ResSchema only.
 */
describe('ai response res duals retired (residual 695)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const chat = readFileSync(resolve(apiDir, 'ai-chat.dto.ts'), 'utf8');
  const provider = readFileSync(resolve(apiDir, 'ai-provider-config.dto.ts'), 'utf8');
  const analytics = readFileSync(resolve(apiDir, 'ai-analytics-query.dto.ts'), 'utf8');
  const knowledge = readFileSync(resolve(apiDir, 'ai-knowledge-query.dto.ts'), 'utf8');
  const expansion = readFileSync(resolve(apiDir, 'ai-knowledge-expansion.dto.ts'), 'utf8');
  const note = readFileSync(resolve(apiDir, 'ai-knowledge-note.dto.ts'), 'utf8');

  it('exports response schemas used by OpenAPI routes', () => {
    expect(responseSchemas).toContain('Residual 695');
    expect(responseSchemas).toContain('export const SendMessageResSchema');
    expect(responseSchemas).toContain('export const ListAIProviderConfigsResSchema');
    expect(responseSchemas).toContain('export const QueryAnalyticsResSchema');
    expect(responseSchemas).toContain('export const QueryKnowledgeResSchema');
    expect(responseSchemas).toContain('export const ExpandKnowledgeResSchema');
    expect(responseSchemas).toContain('export const CreateKnowledgeNoteResSchema');
  });

  it('semantic Res types are z.infer aliases without interface dual bodies', () => {
    expect(chat).toContain('Residual 695');
    expect(chat).toContain(
      'export type SendMessageRes = z.infer<typeof SendMessageResSchema>',
    );
    expect(chat).not.toMatch(/export interface SendMessageRes\b/);

    expect(provider).toContain('Residual 695');
    expect(provider).toContain(
      'export type ListAIProviderConfigsRes = z.infer<typeof ListAIProviderConfigsResSchema>',
    );
    expect(provider).not.toMatch(/export interface ListAIProviderConfigsRes\b/);

    expect(analytics).toContain('Residual 695');
    expect(analytics).toContain(
      'export type QueryAnalyticsRes = z.infer<typeof QueryAnalyticsResSchema>',
    );
    expect(analytics).not.toMatch(/export interface QueryAnalyticsRes\b/);

    expect(knowledge).toContain('Residual 695');
    expect(knowledge).toContain(
      'export type QueryKnowledgeRes = z.infer<typeof QueryKnowledgeResSchema>',
    );
    expect(knowledge).not.toMatch(/export interface QueryKnowledgeRes\b/);

    expect(expansion).toContain('Residual 695');
    expect(expansion).toContain(
      'export type ExpandKnowledgeRes = z.infer<typeof ExpandKnowledgeResSchema>',
    );
    expect(expansion).not.toMatch(/export interface ExpandKnowledgeRes\b/);

    expect(note).toContain('Residual 695');
    expect(note).toContain(
      'export type CreateKnowledgeNoteRes = z.infer<typeof CreateKnowledgeNoteResSchema>',
    );
    expect(note).not.toMatch(/export interface CreateKnowledgeNoteRes\b/);
  });

  it('OpenAPI AI routes reference the shared response schemas', () => {
    const chatRoutes = readFileSync(
      resolve(apiDir, '../../../../../ai/src/api/routes/ai-chat.routes.ts'),
      'utf8',
    );
    const providerRoutes = readFileSync(
      resolve(apiDir, '../../../../../ai/src/api/routes/ai-provider.routes.ts'),
      'utf8',
    );
    const analyticsRoutes = readFileSync(
      resolve(apiDir, '../../../../../ai/src/api/routes/ai-analytics-query.routes.ts'),
      'utf8',
    );
    const knowledgeRoutes = readFileSync(
      resolve(apiDir, '../../../../../ai/src/api/routes/ai-knowledge-query.routes.ts'),
      'utf8',
    );
    const noteRoutes = readFileSync(
      resolve(apiDir, '../../../../../ai/src/api/routes/ai-knowledge-note.routes.ts'),
      'utf8',
    );

    expect(chatRoutes).toContain('SendMessageResSchema');
    expect(providerRoutes).toContain('ListAIProviderConfigsResSchema');
    expect(analyticsRoutes).toContain('QueryAnalyticsResSchema');
    expect(knowledgeRoutes).toContain('QueryKnowledgeResSchema');
    expect(knowledgeRoutes).toContain('ExpandKnowledgeResSchema');
    expect(noteRoutes).toContain('CreateKnowledgeNoteResSchema');
  });
});
