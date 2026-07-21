import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Reminder response ownership surface (stage-6 residual 129):
 * response list/stats/delete and frequency analysis must never authorize by
 * bare template id alone.
 */
describe('reminder response ownership surface', () => {
  const port = readFileSync(
    resolve(__dirname, '../../../../domain/repositories/i-reminder-response-repository.ts'),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(__dirname, '../reminder-response-prisma.repository.ts'),
    'utf8',
  );
  const analyze = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/queries/analyze-reminder-frequency.use-case.ts',
    ),
    'utf8',
  );
  const record = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/record-reminder-response.use-case.ts',
    ),
    'utf8',
  );
  const module = readFileSync(resolve(__dirname, '../../../reminder.module.ts'), 'utf8');

  it('port template-scoped methods require identityId', () => {
    expect(port).toContain(
      'findByTemplateId(\n    templateId: string,\n    identityId: string,',
    );
    expect(port).toContain(
      'getResponseStats(\n    templateId: string,\n    identityId: string,',
    );
    expect(port).toContain(
      'deleteByTemplateId(templateId: string, identityId: string): Promise<number>;',
    );
  });

  it('prisma filters response queries by templateId + identityId', () => {
    expect(prisma).toContain('where: { templateId, identityId }');
    expect(prisma).toContain('deleteMany({\n      where: { templateId, identityId },');
  });

  it('analyze and record paths pass identity into repository', () => {
    expect(analyze).toContain('findByIdForIdentity(identityId, templateId)');
    expect(analyze).toContain('String(template.identityId)');
    expect(record).toContain('findByTemplateId(\n      templateId,\n      identityId,');
    expect(record).toContain('deleteByTemplateId(templateId, identityId)');
    expect(module).toContain(
      'analyzeReminderFrequency.execute(templateId, ctx.identityId)',
    );
    expect(module).toContain(
      'recordReminderResponse.getResponseStats(templateId, ctx.identityId)',
    );
  });
});
