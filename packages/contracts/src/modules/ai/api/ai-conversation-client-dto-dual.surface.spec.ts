import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 809: AIConversationClientDTO dual body retired.
 * Sole AIConversationClientDTOSchema + z.infer; identityId branded; nests MessageClientDTOSchema.
 */
describe('ai conversation client dto dual retired (residual 809)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const aggregate = readFileSync(
    resolve(apiDir, '../aggregates/ai-conversation-client.ts'),
    'utf8',
  );
  const routes = readFileSync(
    resolve(apiDir, '../../../../../ai/src/api/routes/ai-chat.routes.ts'),
    'utf8',
  );

  it('owns AIConversationClientDTO as z.infer of AIConversationClientDTOSchema', () => {
    expect(aggregate).toContain('Residual 809');
    expect(aggregate).toContain("from '../api/response-schemas'");
    expect(aggregate).toContain(
      'export type AIConversationClientDTO = z.infer<typeof AIConversationClientDTOSchema>',
    );
    expect(aggregate).not.toMatch(/export interface AIConversationClientDTO\b/);
  });

  it('AIConversationClientDTOSchema brands identityId and nests MessageClientDTOSchema', () => {
    expect(responseSchemas).toContain('Residual 809');
    expect(responseSchemas).toContain(
      'export const AIConversationClientDTOSchema = z.object({',
    );
    expect(responseSchemas).toContain('identityId: brandedId<IdentityId>()');
    expect(responseSchemas).toContain('messages: z.array(MessageClientDTOSchema).nullable()');
    expect(responseSchemas).toContain('lastMessageAt: z.number().nullable()');
  });

  it('OpenAPI chat routes use AIConversationClientDTOSchema', () => {
    expect(routes).toContain('AIConversationClientDTOSchema');
    const hits = routes.split('AIConversationClientDTOSchema').length - 1;
    expect(hits).toBeGreaterThanOrEqual(2);
  });
});
