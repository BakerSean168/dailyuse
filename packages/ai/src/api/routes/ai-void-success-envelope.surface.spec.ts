import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AI void-success envelope surface (stage-6 residual 87):
 * delete/setDefault document and serialize data:null like other modules —
 * no ActionSuccessSchema `{ success: boolean }` dual-track body.
 */
describe('ai void success envelope surface', () => {
  const chatRoutes = readFileSync(resolve(__dirname, './ai-chat.routes.ts'), 'utf8');
  const providerRoutes = readFileSync(resolve(__dirname, './ai-provider.routes.ts'), 'utf8');
  const providerController = readFileSync(
    resolve(__dirname, '../../server/transport/ai-provider-config.controller.ts'),
    'utf8',
  );
  const chatController = readFileSync(
    resolve(__dirname, '../../server/transport/ai-chat.controller.ts'),
    'utf8',
  );
  const responseSchemas = readFileSync(
    resolve(__dirname, '../../../../contracts/src/modules/ai/api/response-schemas.ts'),
    'utf8',
  );

  it('OpenAPI void responses use z.null(), not ActionSuccessSchema', () => {
    expect(chatRoutes).toContain("successResponse(z.null(), '删除成功')");
    expect(providerRoutes).toContain("successResponse(z.null(), '删除成功')");
    expect(providerRoutes).toContain("successResponse(z.null(), '设置成功')");
    expect(chatRoutes).not.toContain('ActionSuccessSchema');
    expect(providerRoutes).not.toContain('ActionSuccessSchema');
    expect(responseSchemas).not.toContain('ActionSuccessSchema');
  });

  it('controllers return ok(null) for void mutations', () => {
    expect(providerController).toContain('return ok(null)');
    expect(chatController).toContain('return ok(null)');
    expect(providerController).toMatch(/async delete\([\s\S]*?Promise<Result<null>>/);
    expect(chatController).toMatch(/async deleteConversation\([\s\S]*?Promise<Result<null>>/);
  });
});
