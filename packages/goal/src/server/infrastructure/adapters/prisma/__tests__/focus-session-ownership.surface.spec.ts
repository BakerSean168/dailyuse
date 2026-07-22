import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Focus session ownership surface (stage-6 residual 145):
 * session get/list-by-goal/delete/exists must never authorize by bare primary key alone.
 */
describe('focus session ownership surface', () => {
  const port = readFileSync(
    resolve(__dirname, '../../../../domain/repositories/i-focus-session-repository.ts'),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(__dirname, '../focus-session-prisma.repository.ts'),
    'utf8',
  );

  it('port findByIdForIdentity/findByGoalId/delete/exists require identityId (residual 145)', () => {
    expect(port).toContain(
      'findByIdForIdentity(identityId: string, id: string): Promise<FocusSession | null>;',
    );
    expect(port).toMatch(
      /findByGoalId\(\s*identityId: string,\s*goalId: string,/,
    );
    expect(port).toContain('delete(identityId: string, id: string): Promise<void>;');
    expect(port).toContain('exists(identityId: string, id: string): Promise<boolean>;');
  });

  it('prisma filters by identityId', () => {
    expect(prisma).toContain('async findByIdForIdentity(identityId: string, id: string)');
    expect(prisma).toContain('where: { id, identityId }');
    expect(prisma).toContain(
      'const where: Prisma.FocusSessionWhereInput = { identityId, goalId, deletedAt: null };',
    );
    expect(prisma).toContain('deleteMany({');
    expect(prisma).toContain(
      "throw new Error('Focus session not found for the current identity.');",
    );
  });
});
