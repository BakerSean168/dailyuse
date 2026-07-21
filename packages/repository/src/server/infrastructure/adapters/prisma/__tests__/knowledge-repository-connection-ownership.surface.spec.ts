import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Knowledge repository connection ownership surface (stage-6 residual 111):
 * status transitions (disconnect revoke) must include identityId in the write
 * filter — never mutate by bare connection primary key alone.
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
});
