import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 233: UpcomingReminderDTO lives only in contracts.
 * Domain calculation service does not re-export the DTO for dual import paths.
 */
describe('upcoming reminder DTO single-track surface', () => {
  const dir = __dirname;
  const service = readFileSync(
    resolve(dir, 'upcoming-reminder-calculation-service.ts'),
    'utf8',
  );
  const index = readFileSync(resolve(dir, 'index.ts'), 'utf8');

  it('does not re-export UpcomingReminderDTO from calculation service', () => {
    expect(service).toContain("from '@memoflow/contracts/reminder'");
    expect(service).toContain('UpcomingReminderDTO');
    expect(service).not.toContain('Re-export for existing consumers');
    expect(service).not.toMatch(/^export type \{ UpcomingReminderDTO \}/m);
  });

  it('domain services index re-exports DTO from contracts only', () => {
    expect(index).toContain(
      "export type { UpcomingReminderDTO } from '@memoflow/contracts/reminder'",
    );
    expect(index).not.toContain(
      "export type { UpcomingReminderDTO } from './upcoming-reminder-calculation-service'",
    );
  });
});
