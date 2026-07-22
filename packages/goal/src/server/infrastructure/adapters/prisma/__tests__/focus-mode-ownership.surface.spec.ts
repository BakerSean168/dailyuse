import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Focus mode ownership surface (stage-6 residual 146/172):
 * focus mode get/delete must never authorize by bare primary key alone.
 * Active-path reads already use findActiveByIdentityId.
 * Residual 172 collapses dual findById.
 */
describe('focus mode ownership surface', () => {
  const port = readFileSync(
    resolve(__dirname, '../../../../domain/repositories/i-focus-mode-repository.ts'),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(__dirname, '../focus-mode-prisma.repository.ts'),
    'utf8',
  );
  const powersync = readFileSync(
    resolve(__dirname, '../../powersync/focus-mode-powersync.repository.ts'),
    'utf8',
  );

  it('port findByIdForIdentity and delete require identityId (residual 146)', () => {
    expect(port).toContain(
      'findByIdForIdentity(identityId: string, id: string): Promise<FocusMode | null>;',
    );
    expect(port).toContain('delete(identityId: string, id: string): Promise<void>;');
  });

  it('port drops bare findById dual method (residual 172)', () => {
    expect(port).not.toContain('findById(id: string): Promise<FocusMode | null>;');
    expect(prisma).not.toMatch(/async findById\(id: string\)/);
    expect(powersync).not.toMatch(/async findById\(id: string\)/);
  });

  it('prisma filters by id + identityId', () => {
    expect(prisma).toContain('async findByIdForIdentity(identityId: string, id: string)');
    expect(prisma).toContain('where: { id, identityId }');
    expect(prisma).toContain('deleteMany({');
    expect(prisma).toContain(
      "throw new Error('Focus mode not found for the current identity.');",
    );
  });

  it('powersync filters by id + identity_id', () => {
    expect(powersync).toContain(
      'SELECT * FROM focus_modes WHERE id = ? AND identity_id = ? LIMIT 1',
    );
    expect(powersync).toContain(
      'DELETE FROM focus_modes WHERE id = ? AND identity_id = ?',
    );
  });
});
