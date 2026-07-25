import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Task folder ownership surface (stage-6 residual 143):
 * folder get/delete/exists must never authorize by bare folder primary key alone.
 * Residual 176 collapses bare findById dual method.
 */
describe('task folder ownership surface', () => {
  const port = readFileSync(
    resolve(__dirname, '../../../../domain/repositories/i-task-folder-repository.ts'),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(__dirname, '../task-folder-prisma.repository.ts'),
    'utf8',
  );
  const powersync = readFileSync(
    resolve(__dirname, '../../powersync/task-folder-powersync.repository.ts'),
    'utf8',
  );

  it('port findByIdForIdentity/delete/exists require identityId (residual 143)', () => {
    expect(port).toContain(
      'findByIdForIdentity(identityId: string, id: string): Promise<TaskFolderServerDTO | null>;',
    );
    expect(port).toContain('delete(identityId: string, id: string): Promise<void>;');
    expect(port).toContain('exists(identityId: string, id: string): Promise<boolean>;');
  });

  it('port drops bare findById dual method (residual 176)', () => {
    expect(port).not.toContain('findById(id: string): Promise<TaskFolderServerDTO | null>;');
    expect(prisma).not.toMatch(/async findById\(id: string\)/);
    expect(powersync).not.toMatch(/async findById\(id: string\)/);
  });

  it('prisma filters by id + identityId', () => {
    expect(prisma).toContain('async findByIdForIdentity(identityId: string, id: string)');
    expect(prisma).toContain('where: { id, identityId }');
    expect(prisma).toContain('deleteMany({');
    expect(prisma).toContain(
      "throw new Error('Task folder not found for the current identity.');",
    );
    expect(prisma).toContain('async exists(identityId: string, id: string)');
  });

  it('powersync filters by id + identity_id', () => {
    expect(powersync).toContain('async findByIdForIdentity(identityId: string, id: string)');
    expect(powersync).toContain(
      'SELECT * FROM task_folders WHERE id = ? AND identity_id = ? LIMIT 1',
    );
    expect(powersync).toContain(
      'DELETE FROM task_folders WHERE id = ? AND identity_id = ?',
    );
  });
});
