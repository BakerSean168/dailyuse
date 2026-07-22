import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Reminder template ownership surface (stage-6 residual 127/128):
 * get/update/delete/actions and group-scoped list/batch must never authorize
 * by bare template/group primary key alone.
 */
describe('reminder template ownership surface', () => {
  const templatePort = readFileSync(
    resolve(__dirname, '../../../../domain/repositories/i-reminder-template-repository.ts'),
    'utf8',
  );
  const groupPort = readFileSync(
    resolve(__dirname, '../../../../domain/repositories/i-reminder-group-repository.ts'),
    'utf8',
  );
  const prismaTemplate = readFileSync(
    resolve(__dirname, '../reminder-template-prisma.repository.ts'),
    'utf8',
  );
  const getUseCase = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/queries/get-reminder-template.use-case.ts',
    ),
    'utf8',
  );
  const listUseCase = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/queries/list-reminder-templates.use-case.ts',
    ),
    'utf8',
  );
  const deleteUseCase = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/delete-reminder-template.use-case.ts',
    ),
    'utf8',
  );
  const actionService = readFileSync(
    resolve(
      __dirname,
      '../../../../application/services/reminder-template-action-application-service.ts',
    ),
    'utf8',
  );
  const module = readFileSync(resolve(__dirname, '../../../reminder.module.ts'), 'utf8');
  const domainService = readFileSync(
    resolve(__dirname, '../../../../domain/services/reminder-domain-service.ts'),
    'utf8',
  );
  const controlService = readFileSync(
    resolve(__dirname, '../../../../domain/services/reminder-template-control-service.ts'),
    'utf8',
  );
  const mapper = readFileSync(
    resolve(__dirname, '../../../../application/mappers/reminder-template-client.mapper.ts'),
    'utf8',
  );
  const groupApp = readFileSync(
    resolve(__dirname, '../../../../application/services/reminder-group-application-service.ts'),
    'utf8',
  );

  it('ports require findByIdForIdentity(identityId, id)', () => {
    expect(templatePort).toContain(
      'findByIdForIdentity(\n    identityId: string,\n    id: string,',
    );
    expect(groupPort).toContain(
      'findByIdForIdentity(identityId: string, id: string): Promise<ReminderGroup | null>;',
    );
  });

  it('prisma template filters by id + identityId', () => {
    expect(prismaTemplate).toContain('where: { id, identityId }');
    expect(prismaTemplate).toContain('async findByIdForIdentity(');
  });

  it('get/delete and actions load via findByIdForIdentity', () => {
    expect(getUseCase).toContain('findByIdForIdentity(cx.identityId, id');
    expect(deleteUseCase).toContain('findByIdForIdentity(cx.identityId, id)');
    expect(actionService).toContain('findByIdForIdentity(');
    expect(actionService).toContain('ctx.identityId');
    expect(module).toContain('findByIdForIdentity(ctx.identityId, templateId, options)');
  });

  it('domain/control/mapper loads are identity-scoped (residual 135)', () => {
    expect(domainService).toContain(
      'return this.reminderTemplateRepository.findByIdForIdentity(identityId, id, options);',
    );
    expect(domainService).toContain(
      'return this.reminderGroupRepository.findByIdForIdentity(identityId, id);',
    );
    expect(domainService).toContain('deleteTemplate(');
    expect(domainService).toContain('identityId: string');
    expect(domainService).toContain('updateGroupStats(identityId: string, groupId: string)');
    expect(controlService).toContain('findByIdForIdentity(');
    expect(controlService).toContain('String(template.identityId)');
    expect(mapper).toContain('findByIdForIdentity(');
    expect(mapper).toContain('String(template.identityId)');
    expect(deleteUseCase).toContain('deleteTemplate(cx.identityId, id, true)');
    expect(groupApp).toContain('deleteGroup(ctx.identityId, id, false)');
    expect(groupApp).toContain('syncTemplatesEffectiveEnabledByGroup(ctx.identityId, id)');
  });

  it('findByGroupId requires identityId and list uses identity-scoped query', () => {
    expect(templatePort).toContain(
      'findByGroupId(\n    groupId: string | null,\n    identityId: string,',
    );
    expect(prismaTemplate).toContain('reminderGroupId: groupId');
    expect(prismaTemplate).toContain('identityId,');
    expect(listUseCase).toContain('findByGroupId(query.groupId, cx.identityId');
    expect(listUseCase).not.toContain('groupTemplates.filter');
  });
});
