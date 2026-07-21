import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Notification ownership surface (stage-6 residual 126):
 * get/mark-read/update/delete/batch paths must never authorize by bare
 * notification primary key alone.
 */
describe('notification ownership surface', () => {
  const port = readFileSync(
    resolve(__dirname, '../../../../domain/repositories/i-notification-repository.ts'),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(__dirname, '../notification-prisma.repository.ts'),
    'utf8',
  );
  const markRead = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/mark-notification-as-read.use-case.ts',
    ),
    'utf8',
  );
  const maintenance = readFileSync(
    resolve(
      __dirname,
      '../../../../application/services/notification-maintenance-application-service.ts',
    ),
    'utf8',
  );
  const routes = readFileSync(resolve(__dirname, '../../../../../api/routes.ts'), 'utf8');
  const electron = readFileSync(resolve(__dirname, '../../../../../electron/index.ts'), 'utf8');
  const module = readFileSync(resolve(__dirname, '../../../notification.module.ts'), 'utf8');

  it('port findByIdForIdentity requires identityId', () => {
    expect(port).toContain('findByIdForIdentity(');
    expect(port).toContain(
      'findByIdForIdentity(\n    identityId: string,\n    id: string,',
    );
  });

  it('prisma filters by id + identityId', () => {
    expect(prisma).toContain('where: { id, identityId }');
    expect(prisma).toContain('async findByIdForIdentity(');
  });

  it('mark-read and delete load via findByIdForIdentity', () => {
    expect(markRead).toContain('findByIdForIdentity(identityId, id)');
    expect(markRead).toContain('execute(id: string, identityId: string)');
    expect(maintenance).toContain('findByIdForIdentity(identityId, id)');
    expect(maintenance).toContain('findByIdForIdentity(data.identityId, id)');
  });

  it('module api wrappers pass identityId for owned mutations', () => {
    expect(module).toContain('getNotification: async (id, identityId) =>');
    expect(module).toContain('deleteNotification: async (id, identityId) =>');
    expect(module).toContain('markAsRead: async (id, identityId) =>');
    expect(module).toContain('batchDelete: async (data, identityId) =>');
  });

  it('HTTP and Electron notification get/delete/mark-read pass identity context', () => {
    expect(routes).toContain('controller.get(req.params!.id, ctx)');
    expect(routes).toContain('controller.delete(req.params!.id, ctx)');
    expect(routes).toContain('controller.markAsRead(req.params!.id, ctx)');
    expect(routes).toContain('controller.batchDelete(req.body, ctx)');
    expect(electron).toMatch(
      /NotificationChannels\.GET[\s\S]*controller\.get\([\s\S]*requestContext/,
    );
    expect(electron).toMatch(
      /NotificationChannels\.MARK_READ[\s\S]*controller\.markAsRead\([\s\S]*requestContext/,
    );
    expect(electron).toMatch(
      /NotificationChannels\.DELETE[\s\S]*controller\.delete\([\s\S]*requestContext/,
    );
    expect(electron).not.toContain('controller.get(id));');
    expect(electron).not.toContain('controller.markAsRead(id));');
  });
});
