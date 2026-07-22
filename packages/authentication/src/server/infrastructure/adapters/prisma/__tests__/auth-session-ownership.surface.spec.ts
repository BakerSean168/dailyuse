import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Auth session ownership surface (stage-6 residual 139):
 * revoke / getCurrentUser must not authorize by bare session primary key alone.
 * Token validation (JWT / refresh) may still use bare findById from trusted token claims.
 */
describe('auth session ownership surface', () => {
  const port = readFileSync(
    resolve(__dirname, '../../../../domain/repositories/i-auth-session.repository.ts'),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(__dirname, '../prisma-auth-session.repository.ts'),
    'utf8',
  );
  const powersync = readFileSync(
    resolve(__dirname, '../../powersync/auth-session-powersync.repository.ts'),
    'utf8',
  );
  const revoke = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/revoke-session.use-case.ts',
    ),
    'utf8',
  );
  const getCurrentUser = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/queries/get-current-user.use-case.ts',
    ),
    'utf8',
  );

  it('port findByIdForIdentity requires identityId (residual 139)', () => {
    expect(port).toContain('findByIdForIdentity(identityId: IdentityId, id: AuthSessionId)');
  });

  it('prisma filters by id + identityId', () => {
    expect(prisma).toContain('async findByIdForIdentity(identityId: string, id: string)');
    expect(prisma).toContain('where: { id, identityId }');
  });

  it('powersync filters by id + identity_id', () => {
    expect(powersync).toContain('async findByIdForIdentity(identityId: string, id: string)');
    expect(powersync).toContain(
      'SELECT * FROM auth_sessions WHERE id = ? AND identity_id = ? LIMIT 1',
    );
  });

  it('revoke-session loads via findByIdForIdentity and returns NOT_FOUND', () => {
    expect(revoke).toContain('findByIdForIdentity(');
    expect(revoke).toContain("error('NOT_FOUND', 'Session not found')");
    expect(revoke).not.toContain("error('FORBIDDEN'");
    expect(revoke).not.toMatch(/sessionRepository\.findById\(/);
  });

  it('get-current-user loads session via findByIdForIdentity', () => {
    expect(getCurrentUser).toContain('findByIdForIdentity(');
    expect(getCurrentUser).not.toMatch(
      /sessionRepository\.findById\(AuthSessionId\.of\(sessionId\)\)/,
    );
  });
});
