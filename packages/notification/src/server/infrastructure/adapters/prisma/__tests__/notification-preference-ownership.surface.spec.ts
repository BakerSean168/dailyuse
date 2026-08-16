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
 * Residual 196: HTTP/Electron preference transport wired with ctx.identityId only.
 * Residual 197: client port + HTTP/IPC adapters complete preference surface.
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
  const moduleSource = readFileSync(resolve(__dirname, '../../../notification.module.ts'), 'utf8');
  const routes = readFileSync(resolve(__dirname, '../../../../../api/routes.ts'), 'utf8');
  const controller = readFileSync(
    resolve(__dirname, '../../../../transport/notification.controller.ts'),
    'utf8',
  );
  const electron = readFileSync(resolve(__dirname, '../../../../../electron/index.ts'), 'utf8');
  const channels = readFileSync(
    resolve(__dirname, '../../../../../../../contracts/src/electron/ipc-channels.ts'),
    'utf8',
  );
  const clientPort = readFileSync(
    resolve(__dirname, '../../../../../application-client/ports/notification-api-client.port.ts'),
    'utf8',
  );
  const httpAdapter = readFileSync(
    resolve(
      __dirname,
      '../../../../../infrastructure-client/adapters/http/notification-http.adapter.ts',
    ),
    'utf8',
  );
  const ipcAdapter = readFileSync(
    resolve(
      __dirname,
      '../../../../../infrastructure-client/adapters/ipc/notification-ipc.adapter.ts',
    ),
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
    expect(prisma).toMatch(
      /async findByIdForIdentity\([\s\S]*identityId: string,[\s\S]*id: string/,
    );
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
    expect(moduleSource).toMatch(/updateNotificationPreference\.execute\(\s*identityId,/);
  });

  it('HTTP/Electron preference transport is identity-scoped (residual 196, Phase 4)', () => {
    expect(channels).toContain("PREFERENCES_GET: 'notification:preferences:get'");
    expect(channels).toContain("PREFERENCES_UPDATE: 'notification:preferences:update'");
    expect(routes).toContain("path: '/preferences'");
    expect(routes).toContain('controller.getPreferences(ctx)');
    expect(routes).toMatch(/controller\.updatePreferences\(data, ctx\)/);
    // Static path must appear before /:id registration.
    expect(routes.indexOf("path: '/preferences'")).toBeLessThan(routes.indexOf("path: '/:id'"));
    expect(controller).toContain('async getPreferences(ctx: Context)');
    expect(controller).toMatch(
      /async updatePreferences\(\s*input:\s*UpdateNotificationPreferenceReq,\s*ctx:\s*Context/,
    );
    expect(controller).toContain('return this.useCases.updatePreferences(input, ctx.identityId);');
    expect(controller).toContain('return this.useCases.getPreferences(ctx.identityId);');
    // Never accept identityId from client preference body dual-track.
    expect(controller).not.toMatch(
      /updatePreferences\([\s\S]*identityId:\s*parsed\.data\.identityId/,
    );
    expect(electron).toContain('NotificationChannels.PREFERENCES_GET');
    expect(electron).toContain('NotificationChannels.PREFERENCES_UPDATE');
    expect(electron).toContain('controller.getPreferences(requestContext)');
    expect(electron).toContain('withAuthenticatedValidation');
    expect(moduleSource).toContain('executeOrCreate(identityId)');
  });

  it('client port/adapters expose preference methods without body identity dual-track (residual 197)', () => {
    expect(clientPort).toContain(
      'getPreferences(): Promise<Result<NotificationPreferenceClientDTO>>;',
    );
    expect(clientPort).toMatch(/updatePreferences\(\s*request: UpdateNotificationPreferenceReq,/);
    expect(clientPort).not.toMatch(/getPreferences\(\s*identityId/);
    expect(clientPort).not.toMatch(/updatePreferences\([\s\S]*identityId:\s*string/);
    expect(httpAdapter).toContain('`${this.baseUrl}/preferences`');
    expect(httpAdapter).toContain('this.httpClient.put(`${this.baseUrl}/preferences`, request)');
    expect(ipcAdapter).toContain('NotificationChannels.PREFERENCES_GET');
    expect(ipcAdapter).toContain('NotificationChannels.PREFERENCES_UPDATE');
  });
});
