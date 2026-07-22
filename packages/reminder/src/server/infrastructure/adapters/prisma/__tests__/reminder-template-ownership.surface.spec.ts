import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Reminder template ownership surface (stage-6 residual 127/128):
 * get/update/delete/actions and group-scoped list/batch must never authorize
 * by bare template/group primary key alone.
 * Residual 174 collapses group bare findById dual method.
 * Residual 175 collapses template bare findById dual method.
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
  const prismaGroup = readFileSync(
    resolve(__dirname, '../reminder-group-prisma.repository.ts'),
    'utf8',
  );
  const powersyncTemplate = readFileSync(
    resolve(__dirname, '../../powersync/reminder-template-powersync.repository.ts'),
    'utf8',
  );
  const powersyncGroup = readFileSync(
    resolve(__dirname, '../../powersync/reminder-group-powersync.repository.ts'),
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


  it('group port drops bare findById dual method (residual 174)', () => {
    expect(groupPort).not.toContain('findById(id: string): Promise<ReminderGroup | null>;');
    expect(prismaGroup).not.toMatch(/async findById\(id: string\)/);
    expect(powersyncGroup).not.toMatch(/async findById\(id: string\)/);
  });

  it('template port drops bare findById dual method (residual 175)', () => {
    expect(templatePort).not.toContain(
      'findById(\n    id: string,\n    options?: { includeHistory?: boolean; historyLimit?: number },\n  ): Promise<ReminderTemplate | null>;',
    );
    expect(prismaTemplate).not.toMatch(/async findById\(\n    id: string,/);
    expect(powersyncTemplate).not.toMatch(/async findById\(\n    id: string,/);
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

  it('findByIds requires identityId (residual 136)', () => {
    expect(groupPort).toContain(
      'findByIds(identityId: string, ids: string[]): Promise<ReminderGroup[]>;',
    );
    expect(templatePort).toContain('findByIds(');
    expect(templatePort).toContain('identityId: string');
    expect(prismaGroup).toContain('where: { id: { in: ids }, identityId }');
    expect(prismaTemplate).toContain('where: { id: { in: ids }, identityId }');
    expect(controlService).toContain('findByIds(identityId, Array.from(groupIds))');
    expect(mapper).toContain('findByIds(identityId, Array.from(groupIds))');
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

  it('ports delete/exists require identityId (residual 151)', () => {
    expect(templatePort).toContain('delete(identityId: string, id: string): Promise<void>;');
    expect(templatePort).toContain('exists(identityId: string, id: string): Promise<boolean>;');
    expect(groupPort).toContain('delete(identityId: string, id: string): Promise<void>;');
    expect(groupPort).toContain('exists(identityId: string, id: string): Promise<boolean>;');
  });

  it('prisma delete/exists filter by identityId (residual 151)', () => {
    expect(prismaTemplate).toContain('async delete(identityId: string, id: string)');
    expect(prismaTemplate).toContain('where: { id, identityId }');
    expect(prismaTemplate).toContain(
      "throw new Error('Reminder template not found for the current identity.');",
    );
    expect(prismaGroup).toContain('async delete(identityId: string, id: string)');
    expect(prismaGroup).toContain(
      "throw new Error('Reminder group not found for the current identity.');",
    );
  });

  it('powersync delete filters by identity_id (residual 151)', () => {
    expect(powersyncTemplate).toContain(
      'DELETE FROM reminder_templates WHERE id = ? AND identity_id = ?',
    );
    expect(powersyncGroup).toContain(
      'DELETE FROM reminder_groups WHERE id = ? AND identity_id = ?',
    );
  });

  it('domain hard deletes pass identityId (residual 151)', () => {
    expect(domainService).toContain(
      'reminderTemplateRepository.delete(identityId, id)',
    );
    expect(domainService).toContain(
      'reminderGroupRepository.delete(identityId, id)',
    );
  });


  it('port findActive requires identityId (residual 164)', () => {
    expect(templatePort).toContain(
      'findActive(\n    identityId: string,\n    options?: { includeHistory?: boolean; historyLimit?: number },\n  ): Promise<ReminderTemplate[]>;',
    );
    expect(groupPort).toContain(
      'findActive(identityId: string): Promise<ReminderGroup[]>;',
    );
    // System scheduler path remains intentionally optional:
    expect(templatePort).toContain(
      'findByNextTriggerBefore(beforeTime: number, identityId?: string)',
    );
  });

  it('prisma/powersync findActive always filters identity (residual 164)', () => {
    expect(prismaTemplate).toContain(
      'async findActive(\n    identityId: string,',
    );
    expect(prismaTemplate).toContain('identityId,\n      selfEnabled: true,');
    expect(prismaGroup).toContain('async findActive(identityId: string)');
    expect(prismaGroup).toContain('identityId,\n      enabled: true,');
    expect(powersyncTemplate).toContain(
      "SELECT * FROM reminder_templates WHERE identity_id = ? AND self_enabled = 1 AND status = 'Active' AND deleted_at IS NULL ORDER BY created_at ASC",
    );
    expect(powersyncGroup).toContain(
      'SELECT * FROM reminder_groups WHERE identity_id = ? AND enabled = 1 AND status = \'Active\' AND deleted_at IS NULL ORDER BY "order" ASC',
    );
  });

});
