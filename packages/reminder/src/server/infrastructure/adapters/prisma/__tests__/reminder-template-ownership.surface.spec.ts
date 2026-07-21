import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Reminder template ownership surface (stage-6 residual 127):
 * get/update/delete/actions must never authorize by bare template/group
 * primary key alone.
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
});
