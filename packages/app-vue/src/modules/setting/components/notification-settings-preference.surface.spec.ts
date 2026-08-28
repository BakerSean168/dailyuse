import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Notification preferences remain identity-scoped by transport auth while the
 * presentation exposes the real global -> workflow -> runtime policy hierarchy.
 */
describe('notification settings preference surface', () => {
  const settings = readFileSync(resolve(__dirname, './NotificationSettings.vue'), 'utf8');
  const composable = readFileSync(
    resolve(__dirname, '../../notification/composables/useNotificationPreferences.ts'),
    'utf8',
  );
  const catalog = readFileSync(
    resolve(__dirname, '../../notification/composables/notification-preference-catalog.ts'),
    'utf8',
  );
  const preferenceDto = readFileSync(
    resolve(
      __dirname,
      '../../../../../contracts/src/modules/notification/api/notification-preference.dto.ts',
    ),
    'utf8',
  );
  const updateUseCase = readFileSync(
    resolve(
      __dirname,
      '../../../../../notification/src/server/application/use-cases/commands/update-notification-preference.use-case.ts',
    ),
    'utf8',
  );
  const clientPort = readFileSync(
    resolve(
      __dirname,
      '../../../../../notification/src/application-client/ports/notification-api-client.port.ts',
    ),
    'utf8',
  );

  it('renders the hierarchy, explicit failure recovery, and runtime policy without fake channel controls', () => {
    expect(settings).toContain('data-testid="notification-global-channels-card"');
    expect(settings).toContain('data-testid="notification-workflow-groups-card"');
    expect(settings).toContain('data-testid="notification-runtime-policy-card"');
    expect(settings).toContain('data-testid="notification-preferences-retry"');
    expect(settings).toContain('setWorkflowChannelMode');
    expect(settings).toContain('NotificationChannelType.InApp');
    expect(settings).toContain("t('setting.notifications.systemManaged')");
    expect(settings).not.toContain('setModuleChannel');
    expect(settings).not.toContain('notification-channel-${moduleName}-push');
    expect(settings).not.toContain('task.general');
    expect(settings).not.toContain('system.account-security');
  });

  it('curates stable workflow groups and keeps account security read-only', () => {
    expect(catalog).toContain('NOTIFICATION_PREFERENCE_GROUPS');
    expect(catalog).toContain('NotificationWorkflowKey.SystemAccountSecurity');
    expect(catalog).toContain('NotificationChannelType.InApp');
    expect(catalog).toContain('NotificationChannelType.Desktop');
    expect(catalog).toContain('readOnlyChannels');
    expect(catalog).toContain('unknown/future workflow overrides remain durable');
  });

  it('supports reversible inheritance through the additive null clear contract', () => {
    expect(preferenceDto).toContain('z.boolean().nullable().optional()');
    expect(updateUseCase).toContain('enabled === null');
    expect(updateUseCase).toContain('preference.clearGlobalChannel');
    expect(updateUseCase).toContain('preference.clearWorkflowChannelOverride');
    expect(composable).toContain("if (mode === 'inherit') return null");
  });

  it('uses narrow partial writes and never accepts identityId from the UI', () => {
    expect(composable).toContain('await service.getPreferences()');
    expect(composable).toContain('await service.updatePreferences(request)');
    expect(composable).not.toMatch(/getPreferences\(\s*identityId/);
    expect(composable).not.toMatch(/updatePreferences\([\s\S]*identityId/);
    expect(composable).toContain('Identity is never passed from the UI');
    expect(clientPort).toContain(
      'getPreferences(): Promise<Result<NotificationPreferenceClientDTO>>;',
    );
    expect(clientPort).toMatch(/updatePreferences\(\s*request: UpdateNotificationPreferenceReq,/);
  });
});
