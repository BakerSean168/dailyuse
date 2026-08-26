import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Notification template ownership surface (stage-6 residual 189):
 * templates are a system-global catalog — bare findById by primary key is intentional.
 * There is no identity dual-method; ownership attaches when creating notifications
 * for an identityId, not when loading the template definition.
 */
describe('notification template ownership surface', () => {
  const port = readFileSync(
    resolve(
      __dirname,
      '../../../../domain/repositories/i-notification-template-repository.ts',
    ),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(__dirname, '../notification-template-prisma.repository.ts'),
    'utf8',
  );
  const powersync = readFileSync(
    resolve(__dirname, '../../powersync/notification-template-powersync.repository.ts'),
    'utf8',
  );
  const templateService = readFileSync(
    resolve(
      __dirname,
      '../../../../domain/services/notification-template-domain-service.ts',
    ),
    'utf8',
  );
  const createUseCase = readFileSync(
    resolve(__dirname, '../../../../application/use-cases/commands/create-notification.use-case.ts'),
    'utf8',
  );
  const aggregate = readFileSync(
    resolve(__dirname, '../../../../domain/aggregates/notification-template.ts'),
    'utf8',
  );

  it('port keeps bare findById only; no identity dual-method (residual 189)', () => {
    expect(port).toContain('findById(id: string): Promise<NotificationTemplate | null>;');
    expect(port).not.toMatch(/findByIdForIdentity/);
    expect(port).not.toMatch(/identityId:\s*string/);
    expect(port).toContain('findSystemTemplates(): Promise<NotificationTemplate[]>;');
  });

  it('prisma/powersync load templates by primary key only', () => {
    expect(prisma).toContain('async findById(id: string): Promise<NotificationTemplate | null>');
    expect(prisma).toContain(
      'const row = await this.prisma.notificationTemplate.findUnique({\n      where: { id },\n    });',
    );
    expect(prisma).not.toMatch(/findByIdForIdentity/);
    expect(prisma).not.toMatch(/where:\s*\{\s*id,\s*identityId\s*\}/);
    expect(powersync).toContain('async findById(id: string): Promise<NotificationTemplate | null>');
    expect(powersync).not.toMatch(/findByIdForIdentity/);
  });

  it('template domain service loads via bare findById catalog path', () => {
    expect(templateService).toContain('return await this.templateRepo.findById(id);');
    expect(templateService).toContain(
      'const templateEntity = await this.templateRepo.findById(id);',
    );
    expect(templateService).not.toMatch(/findByIdForIdentity/);
  });

  it('keeps template catalog separate from Notification Fact creation authority', () => {
    expect(createUseCase).not.toContain('templateId');
    expect(createUseCase).not.toContain('templateRepo');
    expect(createUseCase).toContain('workflowKey');
    expect(createUseCase).toContain('idempotencyKey');
  });

  it('template aggregate is system-scoped (no identityId ownership field)', () => {
    expect(aggregate).toContain('isSystemTemplate: boolean;');
    expect(aggregate).toContain(
      'NOTE: NotificationTemplate does not have identityId; using template id as fallback.',
    );
    expect(aggregate).not.toMatch(/identityId:\s*IdentityId;/);
  });
});
