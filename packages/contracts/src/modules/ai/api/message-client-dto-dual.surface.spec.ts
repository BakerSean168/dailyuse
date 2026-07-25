import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 807: MessageClientDTO dual body retired.
 * Sole MessageClientDTOSchema + z.infer (UI computed fields included).
 */
describe('message client dto dual retired (residual 807)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const entity = readFileSync(resolve(apiDir, '../entities/message-client.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../ai/src/api/routes/ai-chat.routes.ts'),
    'utf8',
  );

  it('owns MessageClientDTO as z.infer of MessageClientDTOSchema', () => {
    expect(entity).toContain('Residual 807');
    expect(entity).toContain("from '../api/response-schemas'");
    expect(entity).toContain(
      'export type MessageClientDTO = z.infer<typeof MessageClientDTOSchema>',
    );
    expect(entity).not.toMatch(/export interface MessageClientDTO\b/);
  });

  it('MessageClientDTOSchema owns transport + UI computed fields', () => {
    expect(responseSchemas).toContain('Residual 807');
    expect(responseSchemas).toContain(
      'export const MessageClientDTOSchema = z.object({',
    );
    expect(responseSchemas).toContain('tokenCount: z.number().nullable()');
    expect(responseSchemas).toContain('isUser: z.boolean()');
    expect(responseSchemas).toContain('isAssistant: z.boolean()');
    expect(responseSchemas).toContain('isSystem: z.boolean()');
    expect(responseSchemas).toContain('formattedTime: z.string()');
  });

  it('chat list/send envelopes nest MessageClientDTOSchema', () => {
    expect(responseSchemas).toContain('data: z.array(MessageClientDTOSchema)');
    expect(responseSchemas).toContain('userMessage: MessageClientDTOSchema');
    expect(responseSchemas).toContain('assistantMessage: MessageClientDTOSchema');
    expect(routes).toContain('MessageListResSchema');
  });
});
