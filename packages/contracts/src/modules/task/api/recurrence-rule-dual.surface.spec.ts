import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 743: task recurrence-rule dual body retired.
 * RecurrenceRuleDTO reuses RecurrenceConfigSchema only.
 * Domain RecurrenceRule (DomainDate endDate) stays separate from transfer DTO.
 */
describe('task recurrence-rule dual retired (residual 743)', () => {
  const apiDir = __dirname;
  const vo = readFileSync(
    resolve(apiDir, '../value-objects/recurrence-rule.ts'),
    'utf8',
  );
  const templateDto = readFileSync(resolve(apiDir, 'task-template.dto.ts'), 'utf8');

  it('exports RecurrenceConfigSchema as sole shape from VO module', () => {
    expect(vo).toContain('Residual 743');
    expect(vo).toContain('export const RecurrenceConfigSchema = z');
  });

  it('semantic DTO is z.infer alias without interface dual body', () => {
    expect(vo).toContain(
      'export type RecurrenceRuleDTO = z.infer<typeof RecurrenceConfigSchema>',
    );
    expect(vo).not.toMatch(/export interface RecurrenceRuleDTO\b/);
    expect(vo).toContain('export interface RecurrenceRule {');
  });

  it('task-template.dto re-exports VO-owned schema (no local dual body)', () => {
    expect(templateDto).toContain('Residual 743');
    expect(templateDto).toContain("from '../value-objects/recurrence-rule'");
    expect(templateDto).toContain('export { RecurrenceConfigSchema }');
    expect(templateDto).not.toMatch(
      /const RecurrenceConfigSchema(?::[^=]+)? = z/,
    );
    expect(templateDto).toContain('recurrenceRule: RecurrenceConfigSchema');
  });
});
