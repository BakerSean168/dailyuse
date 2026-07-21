import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Goal folder ownership surface (stage-6 residual 116):
 * get/update/delete must identity-scope repository reads —
 * never authorize by bare folder primary key alone.
 */
describe('goal folder ownership surface', () => {
  const port = readFileSync(
    resolve(__dirname, '../../../../domain/repositories/i-goal-folder-repository.ts'),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(__dirname, '../goal-folder-prisma.repository.ts'),
    'utf8',
  );
  const getUseCase = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/queries/get-goal-folder.use-case.ts',
    ),
    'utf8',
  );
  const routes = readFileSync(
    resolve(__dirname, '../../../../../api/routes/goal-folder.routes.ts'),
    'utf8',
  );
  const electron = readFileSync(
    resolve(__dirname, '../../../../../electron/index.ts'),
    'utf8',
  );

  it('port findByIdForIdentity and delete require identityId', () => {
    expect(port).toContain(
      'findByIdForIdentity(identityId: string, id: string): Promise<GoalFolder | null>;',
    );
    expect(port).toContain('delete(identityId: string, id: string): Promise<void>;');
  });

  it('prisma filters by id + identityId', () => {
    expect(prisma).toContain('where: { id, identityId }');
    expect(prisma).toContain('deleteMany({');
    expect(prisma).toContain(
      "throw new Error('Goal folder not found for the current identity.');",
    );
  });

  it('get use case loads via findByIdForIdentity', () => {
    expect(getUseCase).toContain('findByIdForIdentity(identityId, id)');
    expect(getUseCase).toMatch(/execute\(id: string, identityId: string\)/);
  });

  it('HTTP and Electron get pass identity context', () => {
    expect(routes).toContain('controller.get(req.params!.id, ctx)');
    expect(electron).toMatch(
      /FOLDER_GET[\s\S]*goalFolderController\.get\(id, requestContext/,
    );
    expect(electron).not.toMatch(
      /FOLDER_GET, \(_event, id\) => goalFolderController\.get\(id\)/,
    );
  });
});
