import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Task schedule source ownership (stage-6 residual 132/168):
 * projection requires identityId and loads only via findByIdForIdentity;
 * execution must load aggregates via findByIdForIdentity, not bare PKs.
 */
describe('task schedule source ownership surface', () => {
  const projection = readFileSync(resolve(__dirname, './schedule-projection-source.ts'), 'utf8');
  const execution = readFileSync(resolve(__dirname, './schedule-execution-source.ts'), 'utf8');

  it('projection requires identityId and never bare findById (residual 168)', () => {
    expect(projection).toContain(
      'buildTemplatePlan(templateId: string, identityId: string): Promise<TaskScheduleProjectionPlan>;',
    );
    expect(projection).toContain('readonly identityId: string;');
    expect(projection).toContain('findByIdForIdentity(\n        identityId,\n        templateId,');
    expect(projection).not.toContain('findById(templateId)');
    expect(projection).toContain('findByTemplateId(');
    expect(projection).toContain('String(templateDTO.identityId)');
  });

  it('execution loads instance and template via findByIdForIdentity(task.identityId)', () => {
    expect(execution).toContain('findByIdForIdentity(');
    expect(execution).toContain('String(task.identityId)');
    expect(execution).not.toContain(
      'const instance = await deps.taskInstanceRepository.findById(task.sourceEntityId',
    );
    expect(execution).not.toContain(
      'const template = await deps.taskTemplateRepository.findById(String(instance.templateId)',
    );
  });
});
