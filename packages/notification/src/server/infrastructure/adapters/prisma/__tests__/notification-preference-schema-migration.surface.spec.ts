import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * NotificationPreference hierarchy is additive over existing installations.
 * PostgreSQL/Prisma must be able to add the two required JSON-string columns
 * when old preference rows already exist. The domain and PowerSync defaults
 * are empty maps, so Prisma must own the same database defaults.
 */
describe('notification preference hierarchy schema migration surface', () => {
  const prismaSchema = readFileSync(
    resolve(
      __dirname,
      '../../../../../../../../packages/database/prisma/schema/notification.prisma',
    ),
    'utf8',
  );

  it('backfills required hierarchy columns with the domain empty-map default', () => {
    expect(prismaSchema).toContain(
      'globalChannels    String    @default("{}") @map("global_channels")',
    );
    expect(prismaSchema).toContain(
      'workflowOverrides String    @default("{}") @map("workflow_overrides")',
    );
  });
});
