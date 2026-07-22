import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Notification preference ownership surface (stage-6 residual 147):
 * Residual 178 collapses bare findById dual method.
 * preference get-by-id/delete/exists must never authorize by bare preference
 * primary key alone. Runtime get/update paths already use findByIdentityId.
 * Residual 194: updatePreferences requires identityId at the call boundary
 * (no optional identity dual-track on the use-case input).
 */
describe('notification preference ownership surface', () => {
  const port = readFileSync(
    resolve(__dirname, '../../../../domain/repositories/i-notification-preference-repository.ts'),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(__dirname, '../notification-preference-prisma.repository.ts'),
    'utf8',
  );
  const powersync = readFileSync(
    resolve(__dirname, '../../powersync/notification-preference-powersync.repository.ts'),
    'utf8',
  );
  const useCase = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/update-notification-preference.use-case.ts',
    ),
    'utf8',
  );
  const applicationPort = readFileSync(
    resolve(__dirname, '../../../../application/notification.application.port.ts'),
    'utf8',
  );
  const moduleSource = readFileSync(
    resolve(__dirname, '../../../notification.module.ts'),
    'utf8',
  );

  it('port findByIdForIdentity/delete/exists require identityId (residual 147)', () => {
    expect(port).toContain(
      'findByIdForIdentity(identityId: string, id: string): Promise<NotificationPreference | null>;',
    );
    expect(port).toContain('delete(identityId: string, id: string): Promise<void>;');
    expect(port).toContain('exists(identityId: string, id: string): Promise<boolean>;');
  });

  it('port drops bare findById dual method (residual 178)', () => {
    expect(port).not.toContain('findById(id: string): Promise<NotificationPreference | null>;');
    expect(prisma).not.toMatch(/async findById\(id: string\)/);
    expect(powersync).not.toMatch(/async findById\(id: string\)/);
  });

  it('prisma filters by id + identityId', () => {
    expect(prisma).toContain('async findByIdForIdentity(identityId: string, id: string)');
    expect(prisma).toContain('where: { id, identityId }');
    expect(prisma).toContain('deleteMany({');
    expect(prisma).toContain(
      "throw new Error('Notification preference not found for the current identity.');",
    );
  });

  it('powersync filters by id + identity_id', () => {
    expect(powersync).toContain(
      'SELECT * FROM notification_preferences WHERE id = ? AND identity_id = ? LIMIT 1',
    );
    expect(powersync).toContain(
      'DELETE FROM notification_preferences WHERE id = ? AND identity_id = ?',
    );
  });

  it('updatePreferences requires identityId at call boundary (residual 194)', () => {
    expect(useCase).toMatch(
      /async execute\(\s*identityId: string,\s*input: UpdateNotificationPreferenceReq,/,
    );
    expect(useCase).not.toContain('identityId?: string');
    expect(applicationPort).toContain(
      'updatePreferences(dto: unknown, identityId: string): Promise<Result<unknown>>;',
    );
    expect(applicationPort).not.toContain(
      'updatePreferences(dto: unknown): Promise<Result<unknown>>;',
    );
    expect(moduleSource).toContain('updatePreferences: async (dto, identityId) =>');
    expect(moduleSource).toMatch(
      /updateNotificationPreference\.execute\(\s*identityId,/,
    );
  });

});
