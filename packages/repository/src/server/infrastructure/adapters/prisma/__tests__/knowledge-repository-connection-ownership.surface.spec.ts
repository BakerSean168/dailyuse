import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Knowledge repository connection ownership surface (stage-6 residual 111/112/113):
 * status transitions, identity-scoped reads, and save updates must include
 * identityId — never reassign ownership via bare connection primary key.
 * Residual 137/186: bare findById is intentional webhook/reconcile bootstrap only;
 * projection re-owns via findByIdForIdentity inside loadOwnedConnectionById.
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
  const projectionService = readFileSync(
    resolve(
      __dirname,
      '../../../../application/services/knowledge-repository-projection.service.ts',
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
  it('projection system loads re-verify connection ownership (residual 137)', () => {
    expect(projectionService).toContain('private async loadOwnedConnectionById(');
    expect(projectionService).toContain(
      'return this.options.connectionRepository.findByIdForIdentity(',
    );
    expect(projectionService).toContain('String(connection.identityId)');
    expect(projectionService).toContain('loadOwnedConnectionById(connectionId)');
    expect(projectionService).toContain('loadOwnedConnectionById(delivery.connectionId)');
    // Bare findById is only the bootstrap inside loadOwnedConnectionById.
    const bareLoads = projectionService.match(
      /connectionRepository\.findById\(/g,
    );
    expect(bareLoads).toHaveLength(1);
    expect(projectionService).not.toContain(
      'const connection = await this.options.connectionRepository.findById(delivery.connectionId)',
    );
  });

  it('bare findById remains only for projection bootstrap; auth paths use findByIdForIdentity (residual 186)', () => {
    // Dual method kept intentionally: webhook/reconcile may load by connection id then re-own.
    expect(port).toContain(
      'findById(id: string): Promise<KnowledgeRepositoryConnectionServerDTO | null>;',
    );
    expect(port).toMatch(
      /findByIdForIdentity\(\s*identityId: string,\s*id: string,\s*\): Promise</,
    );
    expect(prisma).toMatch(/async findById\(id: string\)/);
    expect(prisma).toMatch(
      /async findByIdForIdentity\(\s*identityId: string,\s*id: string/,
    );
    expect(prisma).toContain('where: { id, identityId }');

    // Connection service never bare-loads by connectionId.
    expect(service).toMatch(
      /findByIdForIdentity\(\s*identityId,\s*connectionId,\s*\)/,
    );
    expect(service).not.toMatch(
      /connectionRepository\.findById\(\s*connectionId\s*\)/,
    );
    expect(service).not.toMatch(
      /connectionRepository\.findById\(/,
    );

    // Projection: exactly one bare findById, only inside loadOwnedConnectionById bootstrap.
    expect(projectionService).toContain('private async loadOwnedConnectionById(');
    expect(projectionService).toContain(
      'const connection = await this.options.connectionRepository.findById(connectionId);',
    );
    expect(projectionService).toContain(
      'return this.options.connectionRepository.findByIdForIdentity(',
    );
    expect(projectionService).toContain('String(connection.identityId)');
    const bareLoads = projectionService.match(
      /connectionRepository\.findById\(/g,
    );
    expect(bareLoads).toHaveLength(1);
    // Call sites must re-own through the helper, never bare-load delivery.connectionId.
    expect(projectionService).toContain('loadOwnedConnectionById(connectionId)');
    expect(projectionService).toContain('loadOwnedConnectionById(delivery.connectionId)');
    expect(projectionService).not.toContain(
      'const connection = await this.options.connectionRepository.findById(delivery.connectionId)',
    );
  });

});
