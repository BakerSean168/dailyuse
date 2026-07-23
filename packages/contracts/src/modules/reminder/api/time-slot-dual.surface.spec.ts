import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 751: reminder TimeSlot dual body retired.
 * TimeSlotDTO reuses TimeSlotSchema only.
 */
describe('reminder time-slot dual retired (residual 751)', () => {
  const apiDir = __dirname;
  const vo = readFileSync(resolve(apiDir, '../value-objects/time-slot.ts'), 'utf8');
  const aggregate = readFileSync(
    resolve(apiDir, '../aggregates/user-reminder-preferences-server.ts'),
    'utf8',
  );
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

  it('exports TimeSlotSchema as sole shape from VO module', () => {
    expect(vo).toContain('Residual 751');
    expect(vo).toContain('export const TimeSlotSchema = z.object({');
  });

  it('semantic DTO is z.infer alias without interface dual body', () => {
    expect(vo).toContain(
      'export type TimeSlotDTO = z.infer<typeof TimeSlotSchema>',
    );
    expect(vo).not.toMatch(/export interface TimeSlotDTO\b/);
    expect(aggregate).toContain("from '../value-objects/time-slot'");
    expect(aggregate).not.toMatch(/export interface TimeSlotDTO\b/);
  });

  it('response-schemas re-exports VO-owned schema (no local dual body)', () => {
    expect(responseSchemas).toContain('Residual 751');
    expect(responseSchemas).toContain("from '../value-objects/time-slot'");
    expect(responseSchemas).toContain('export { TimeSlotSchema }');
    expect(responseSchemas).not.toMatch(/const TimeSlotSchema = z\.object\(\{/);
    expect(responseSchemas).toContain('bestTimeSlots: z.array(TimeSlotSchema)');
    expect(responseSchemas).toContain('worstTimeSlots: z.array(TimeSlotSchema)');
  });
});
