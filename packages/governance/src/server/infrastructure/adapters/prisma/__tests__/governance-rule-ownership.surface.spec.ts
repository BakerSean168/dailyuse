import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Governance rule ownership surface (stage-6 residual 190):
 * rules are a global catalog keyed by id/code — bare findById is intentional.
 * authorId is metadata (revision/create attribution), not an ownership fence.
 * Authorization is role-based at the HTTP boundary, not identity dual-method.
 */
describe('governance rule ownership surface', () => {
  const port = readFileSync(
    resolve(__dirname, '../../../../domain/repositories/i-rule-repository.ts'),
    'utf8',
  );
  const prisma = readFileSync(resolve(__dirname, '../rule-prisma.repository.ts'), 'utf8');
  const powersync = readFileSync(
    resolve(__dirname, '../../powersync/rule-powersync.repository.ts'),
    'utf8',
  );
  const getRule = readFileSync(
    resolve(__dirname, '../../../../application/use-cases/queries/get-rule.use-case.ts'),
    'utf8',
  );
  const updateRule = readFileSync(
    resolve(__dirname, '../../../../application/use-cases/commands/update-rule.use-case.ts'),
    'utf8',
  );
  const deleteRule = readFileSync(
    resolve(__dirname, '../../../../application/use-cases/commands/delete-rule.use-case.ts'),
    'utf8',
  );
  const routes = readFileSync(
    resolve(__dirname, '../../../../../api/routes/governance-rules.routes.ts'),
    'utf8',
  );
  const aggregate = readFileSync(
    resolve(__dirname, '../../../../domain/aggregates/rule.ts'),
    'utf8',
  );

  it('port keeps bare findById/findByCode catalog paths (residual 190)', () => {
    expect(port).toContain('findById(id: RuleId): Promise<Rule | null>;');
    expect(port).toContain('findByCode(code: string): Promise<Rule | null>;');
    expect(port).not.toMatch(/findByIdForIdentity/);
    expect(port).not.toMatch(/findByAuthorId/);
  });

  it('prisma/powersync load rules by primary key / code only', () => {
    expect(prisma).toContain('async findById(id: RuleId): Promise<Rule | null>');
    expect(prisma).toContain('where: { id },');
    expect(prisma).not.toMatch(/findByIdForIdentity/);
    expect(prisma).not.toMatch(/where:\s*\{\s*id,\s*authorId\s*\}/);
    expect(powersync).toContain('async findById(id: RuleId): Promise<Rule | null>');
    expect(powersync).toContain('SELECT * FROM rules WHERE id = ?');
    expect(powersync).not.toMatch(/findByIdForIdentity/);
  });

  it('get/update/delete use cases load by catalog id, not identity ownership', () => {
    expect(getRule).toContain('rule = await this.ruleRepository.findById(req.id as RuleId);');
    expect(getRule).toContain("code: 'NOT_FOUND'");
    expect(getRule).not.toMatch(/findByIdForIdentity/);
    expect(updateRule).toContain(
      'const rule = await this.ruleRepository.findById(ruleId as RuleId);',
    );
    expect(updateRule).not.toMatch(/findByIdForIdentity/);
    // authorId is attribution for revisions, not a load fence.
    expect(updateRule).toContain('authorId: cx.identityId as IdentityId,');
    expect(deleteRule).toContain(
      'const rule = await this.ruleRepository.findById(req.id as RuleId);',
    );
    expect(deleteRule).not.toMatch(/findByIdForIdentity/);
  });

  it('HTTP mutations gate by role, not author ownership fence', () => {
    expect(routes).toContain("requireRole(['TechLead', 'Architect'])");
    expect(routes).toContain("[auth, requireRole(['TechLead', 'Architect'])]");
    // Reads require auth but not author-scoped dual method.
    expect(routes).toMatch(/\[auth\]/);
  });

  it('rule aggregate keeps authorId as metadata field', () => {
    expect(aggregate).toContain('authorId: IdentityId;');
    expect(aggregate).toContain('get authorId(): IdentityId');
    // No identity-owned repository dual method on the aggregate surface either.
    expect(aggregate).not.toMatch(/findByIdForIdentity/);
  });
});
