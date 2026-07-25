import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 835: Create/Update ReminderTemplate request ActiveTime dual retired.
 * Request reuses ActiveTimeConfigSchema (activatedAt); no startDate/endDate request dual.
 * Create/update use-cases pass activeTime through without startDate mapping.
 */
describe('reminder template request activeTime dual retired (residual 835)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'reminder-template.dto.ts'), 'utf8');
  const createUc = readFileSync(
    resolve(
      apiDir,
      '../../../../../reminder/src/server/application/use-cases/commands/create-reminder-template.use-case.ts',
    ),
    'utf8',
  );
  const updateUc = readFileSync(
    resolve(
      apiDir,
      '../../../../../reminder/src/server/application/use-cases/commands/update-reminder-template.use-case.ts',
    ),
    'utf8',
  );
  const dialog = readFileSync(
    resolve(
      apiDir,
      '../../../../../app-vue/src/modules/reminder/components/TemplateDialog.vue',
    ),
    'utf8',
  );

  it('CreateReminderTemplateSchema reuses ActiveTimeConfigSchema (activatedAt)', () => {
    expect(dto).toContain('Residual 835');
    expect(dto).toContain("from '../value-objects/active-time-config'");
    expect(dto).toContain('activeTime: ActiveTimeConfigSchema');
    expect(dto).not.toMatch(/activeTime:\s*z\.object\(\{\s*startDate:/);
    expect(dto).not.toMatch(/endDate:\s*z\.number\(\)\.nullable\(\)/);
  });

  it('create/update use-cases pass activeTime without startDate mapping', () => {
    expect(createUc).toContain('Residual 835');
    expect(createUc).toContain('activeTime: input.activeTime');
    expect(createUc).not.toMatch(/activatedAt:\s*input\.activeTime\.startDate/);
    expect(updateUc).toContain('Residual 835');
    expect(updateUc).toContain('activeTime: request.activeTime');
    expect(updateUc).not.toMatch(/activatedAt:\s*request\.activeTime\.startDate/);
  });

  it('TemplateDialog create payload uses activatedAt only', () => {
    expect(dialog).toContain('Residual 835');
    expect(dialog).toContain('activatedAt: Date.now()');
    expect(dialog).not.toMatch(/startDate:\s*Date\.now\(\)/);
    expect(dialog).not.toMatch(/endDate:\s*null/);
  });
});
