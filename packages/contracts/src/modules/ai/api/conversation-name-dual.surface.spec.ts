import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 673: AI conversation create/update name body dual retired.
 * Both ops use ConversationNameSchema only.
 */
describe('ai conversation name request dual retired (residual 673)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'ai-chat.dto.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../ai/src/api/routes/ai-chat.routes.ts'),
    'utf8',
  );
  const controller = readFileSync(
    resolve(apiDir, '../../../../../ai/src/server/transport/ai-chat.controller.ts'),
    'utf8',
  );

  it('exports a single shared conversation name schema', () => {
    expect(dto).toContain('Residual 673');
    expect(dto).toContain('export const ConversationNameSchema');
    expect(dto).toContain(
      'export type CreateConversationReq = z.infer<typeof ConversationNameSchema>',
    );
    expect(dto).toContain(
      'export type UpdateConversationReq = z.infer<typeof ConversationNameSchema>',
    );
    expect(dto).not.toMatch(/export const CreateConversationSchema\b/);
    expect(dto).not.toMatch(/export const UpdateConversationSchema\b/);
  });

  it('routes and controller parse ConversationNameSchema for create and update', () => {
    expect(routes).toContain('ConversationNameSchema');
    expect(routes).not.toContain('CreateConversationSchema');
    expect(routes).not.toContain('UpdateConversationSchema');
    expect(controller).toContain('ConversationNameSchema');
    expect(controller).not.toContain('CreateConversationSchema');
    expect(controller).not.toContain('UpdateConversationSchema');
    const routeHits = routes.split('schema: ConversationNameSchema').length - 1;
    expect(routeHits).toBeGreaterThanOrEqual(2);
    const parseHits = controller.split('ConversationNameSchema.safeParse').length - 1;
    expect(parseHits).toBeGreaterThanOrEqual(2);
  });
});
