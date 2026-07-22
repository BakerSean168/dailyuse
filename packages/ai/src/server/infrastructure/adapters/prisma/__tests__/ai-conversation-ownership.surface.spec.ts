import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AI conversation ownership surface (stage-6 residual 114/169):
 * get/update/delete must identity-scope reads and hard deletes —
 * never authorize by bare conversation primary key alone.
 * Residual 169 collapses dual findById to findByIdForIdentity only.
 */
describe('ai conversation ownership surface', () => {
  const port = readFileSync(
    resolve(__dirname, '../../../../domain/repositories/i-ai-conversation-repository.ts'),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(__dirname, '../ai-conversation-prisma.repository.ts'),
    'utf8',
  );
  const routes = readFileSync(
    resolve(__dirname, '../../../../../api/routes/ai-chat.routes.ts'),
    'utf8',
  );
  const helpers = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/ai-chat-helpers.ts',
    ),
    'utf8',
  );

  it('port findByIdForIdentity and delete require identityId', () => {
    expect(port).toMatch(
      /findByIdForIdentity\(\s*identityId: string,\s*id: string/,
    );
    expect(port).toMatch(/delete\(identityId: string, id: string\)/);
  });

  it('port drops bare findById dual method (residual 169)', () => {
    expect(port).not.toMatch(
      /findById\(id: string, options\?: AIConversationQueryOptions\)/,
    );
    expect(prisma).not.toMatch(
      /async findById\(id: string, options\?: AIConversationQueryOptions\)/,
    );
  });

  it('prisma filters by id + identityId', () => {
    expect(prisma).toContain('where: { id, identityId, deletedAt: null }');
    expect(prisma).toContain('updateMany({');
    expect(prisma).toContain(
      "throw new Error('Conversation not found for the current identity.');",
    );
  });

  it('HTTP routes pass identity into get/update/delete', () => {
    expect(routes).toMatch(
      /getConversation\(req\.params!\.id,\s*\{\s*identityId:\s*ctx\.identityId/,
    );
    expect(routes).toMatch(
      /updateConversation\(req\.params!\.id,\s*req\.body,\s*\{\s*identityId:\s*ctx\.identityId/,
    );
    expect(routes).toMatch(
      /deleteConversation\(req\.params!\.id,\s*\{\s*identityId:\s*ctx\.identityId/,
    );
  });

  it('chat helpers load conversations via findByIdForIdentity', () => {
    expect(helpers).toContain('findByIdForIdentity(');
    expect(helpers).not.toMatch(
      /conversationRepository\.findById\(\s*conversationId/,
    );
  });
});
