import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Task schedule source ownership (stage-6 residual 132):
 * projection with identity and execution must load aggregates via
 * findByIdForIdentity, not bare primary keys alone.
 */
describe('task schedule source ownership surface', () => {
  const projection = readFileSync(resolve(__dirname, './schedule-projection-source.ts'), 'utf8');
  const execution = readFileSync(resolve(__dirname, './schedule-execution-source.ts'), 'utf8');

  it('projection prefers findByIdForIdentity when identity present', () => {
    expect(projection).toContain('findByIdForIdentity(identityId, templateId)');
    expect(projection).toContain('findById(templateId)');
    expect(projection).toContain(
      'String(instance.identityId) === String(templateDTO.identityId)',
    );
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
