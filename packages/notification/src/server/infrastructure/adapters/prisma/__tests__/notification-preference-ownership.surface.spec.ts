import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Notification preference ownership surface (stage-6 residual 147):
 * preference get-by-id/delete/exists must never authorize by bare preference
 * primary key alone. Runtime get/update paths already use findByIdentityId.
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

  it('port findByIdForIdentity/delete/exists require identityId (residual 147)', () => {
    expect(port).toContain(
      'findByIdForIdentity(identityId: string, id: string): Promise<NotificationPreference | null>;',
    );
    expect(port).toContain('delete(identityId: string, id: string): Promise<void>;');
    expect(port).toContain('exists(identityId: string, id: string): Promise<boolean>;');
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
});
