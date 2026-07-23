import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 691: AI chat list response dual bodies retired.
 * ConversationListRes / MessageListRes reuse *ListResSchema only (ClientDTO items).
 */
describe('ai chat list response dual retired (residual 691)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const dto = readFileSync(resolve(apiDir, 'ai-chat.dto.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../ai/src/api/routes/ai-chat.routes.ts'),
    'utf8',
  );

  it('exports list Res schemas with ClientDTO item arrays', () => {
    expect(responseSchemas).toContain('Residual 691');
    expect(responseSchemas).toContain('export const ConversationListResSchema');
    expect(responseSchemas).toContain('export const MessageListResSchema');
    expect(responseSchemas).toContain('data: z.array(AIConversationClientDTOSchema)');
    expect(responseSchemas).toContain('data: z.array(MessageClientDTOSchema)');
  });

  it('semantic list Res types are z.infer aliases without interface dual bodies', () => {
    expect(dto).toContain('Residual 691');
    expect(dto).toContain(
      'export type ConversationListRes = z.infer<typeof ConversationListResSchema>',
    );
    expect(dto).toContain(
      'export type MessageListRes = z.infer<typeof MessageListResSchema>',
    );
    expect(dto).not.toMatch(/export interface ConversationListRes\b/);
    expect(dto).not.toMatch(/export interface MessageListRes\b/);
  });

  it('OpenAPI chat routes use list Res schemas only', () => {
    expect(routes).toContain('ConversationListResSchema');
    expect(routes).toContain('MessageListResSchema');
    expect(routes).toContain('successResponse(ConversationListResSchema');
    expect(routes).toContain('successResponse(MessageListResSchema');
  });
});
