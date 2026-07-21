import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Knowledge repository connection ownership surface (stage-6 residual 111/112):
 * status transitions and identity-scoped reads must include identityId —
 * never mutate or authorize by bare connection primary key alone.
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
