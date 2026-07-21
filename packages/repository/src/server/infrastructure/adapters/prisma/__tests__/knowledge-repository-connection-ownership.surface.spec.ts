import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Knowledge repository connection ownership surface (stage-6 residual 111/112/113):
 * status transitions, identity-scoped reads, and save updates must include
 * identityId — never reassign ownership via bare connection primary key.
 */
describe('knowledge repository connection ownership surface', () => {
  const port = readFileSync(
    resolve(
      __dirname,
      '../../../../application/ports/knowledge-repository-connection.repository.ts',
    ),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(__dirname, '../knowledge-repository-connection-prisma.repository.ts'),
    'utf8',
  );
  const service = readFileSync(
    resolve(
      __dirname,
      '../../../../application/services/knowledge-repository-connection.service.ts',
    ),
    'utf8',
  );

  it('port updateStatus requires identityId', () => {
    expect(port).toMatch(
      /updateStatus\(\s*identityId: string,\s*id: string,\s*status: KnowledgeRepositoryConnectionStatus/,
    );
  });

  it('port findByIdForIdentity requires identityId', () => {
    expect(port).toMatch(
      /findByIdForIdentity\(\s*identityId: string,\s*id: string,\s*\): Promise</,
    );
  });

  it('prisma findByIdForIdentity filters by id + identityId', () => {
    expect(prisma).toMatch(
      /async findByIdForIdentity\(\s*identityId: string,\s*id: string/,
    );
    expect(prisma).toContain('where: { id, identityId }');
  });

  it('prisma updates filter by id + identityId', () => {
    expect(prisma).toMatch(
      /async updateStatus\(\s*identityId: string,\s*id: string,\s*status: KnowledgeRepositoryConnectionStatus/,
    );
    expect(prisma).toContain('updateMany({');
    expect(prisma).toContain('where: { id, identityId }');
    expect(prisma).toContain(
      "throw new Error('Knowledge repository connection not found for the current identity.');",
    );
    expect(prisma).not.toMatch(
      /knowledgeRepositoryConnection\.update\(\s*\{\s*where:\s*\{\s*id\s*\}/,
    );
  });

  it('connection service passes identityId into status transitions', () => {
    expect(service).toContain(
      "updateStatus(identityId, connectionId, 'Revoked', null)",
    );
    expect(service).not.toMatch(
      /connectionRepository\.updateStatus\(\s*connectionId\s*,/,
    );
  });

  it('prisma save refuses identity reassignment and updates by id + identityId', () => {
    expect(prisma).toContain('existing.identityId !== connection.identityId');
    expect(prisma).toMatch(
      /updateMany\(\{\s*where:\s*\{\s*id:\s*connection\.id,\s*identityId:\s*connection\.identityId/,
    );
    // Update path must not rewrite identityId.
    expect(prisma).not.toMatch(
      /updateMany\([\s\S]*?data:\s*\{[\s\S]*?identityId:\s*connection\.identityId/,
    );
    expect(prisma).not.toContain('upsert({');
  });

  it('connection service loads connections via findByIdForIdentity', () => {
    expect(service).toMatch(
      /findByIdForIdentity\(\s*identityId,\s*connectionId,\s*\)/,
    );
    // No bare findById(connectionId) ownership path remaining in connection service.
    expect(service).not.toMatch(
      /connectionRepository\.findById\(\s*connectionId\s*\)/,
    );
  });
});
