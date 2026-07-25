import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Auth identity ownership surface (stage-6 residual 192):
 * AuthIdentity primary key IS the identity id — bare findById is the natural
 * ownership path (no dual method). Lookups by email/OAuth resolve to identity id.
 */
describe('auth identity ownership surface', () => {
  const port = readFileSync(
    resolve(__dirname, '../../../../domain/repositories/i-auth-identity.repository.ts'),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(__dirname, '../prisma-auth-identity.repository.ts'),
    'utf8',
  );
  const powersync = readFileSync(
    resolve(__dirname, '../../powersync/auth-identity-powersync.repository.ts'),
    'utf8',
  );
  const getCurrentUser = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/queries/get-current-user.use-case.ts',
    ),
    'utf8',
  );
  const jwtStrategy = readFileSync(
    resolve(__dirname, '../../../strategies/jwt.strategy.ts'),
    'utf8',
  );

  it('port keeps bare findById as identity primary key path (residual 192)', () => {
    expect(port).toContain('findById(id: IdentityId): Promise<AuthIdentity | null>;');
    expect(port).not.toMatch(/findByIdForIdentity/);
    expect(port).toContain('findByEmail(email: string): Promise<AuthIdentity | null>;');
    expect(port).toContain(
      'findByOAuth(provider: OAuthProvider, subjectId: string): Promise<AuthIdentity | null>;',
    );
  });

  it('prisma/powersync load identity by primary key only', () => {
    expect(prisma).toContain('async findById(id: string): Promise<AuthIdentity | null>');
    expect(prisma).toContain('where: { id },');
    expect(prisma).not.toMatch(/findByIdForIdentity/);
    expect(powersync).toContain('async findById(id: string): Promise<AuthIdentity | null>');
    expect(powersync).not.toMatch(/findByIdForIdentity/);
  });

  it('trusted callers load identity by token/context identityId', () => {
    expect(getCurrentUser).toContain(
      'const identity = await this.identityRepository.findById(IdentityId.of(cx.identityId));',
    );
    expect(jwtStrategy).toContain(
      'const identity = await identityRepository.findById(IdentityId.of(payload.identityId as string));',
    );
  });
});
