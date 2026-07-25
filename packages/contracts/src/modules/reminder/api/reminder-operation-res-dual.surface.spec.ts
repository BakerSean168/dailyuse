import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Residual 635: ReminderOperationRes / ReminderTriggerRes dual envelopes retired.
 * Reminder control success bodies use DTO / void / Result only (no { ok } dual-track).
 */
const here = dirname(fileURLToPath(import.meta.url));

function read(name: string): string {
  return readFileSync(join(here, name), 'utf8');
}

describe('reminder operation dual envelopes retired (residual 635)', () => {
  it('reminder-group.dto does not define ok dual operation responses', () => {
    const source = read('reminder-group.dto.ts');
    expect(source).toContain('Residual 635');
    expect(source).not.toMatch(/export interface ReminderOperationRes/);
    expect(source).not.toMatch(/export interface ReminderTriggerRes/);
    expect(source).not.toMatch(/export interface TemplateScheduleStatusRes/);
    expect(source).not.toMatch(/ok:\s*boolean/);
    expect(source).toContain('CreateReminderGroupRes = ReminderGroupClientDTO');
  });

  it('reminder RPC map uses DTO/void success bodies not OperationRes duals', () => {
    const rpc = readFileSync(join(here, '../protocol/reminder-rpc-map.ts'), 'utf8');
    expect(rpc).not.toContain('ReminderOperationRes');
    expect(rpc).not.toContain('ReminderTriggerRes');
    expect(rpc).toContain("'reminder:delete-template': [{ templateId: ReminderTemplateId }, void]");
    expect(rpc).toContain('ReminderTemplateClientDTO');
    expect(rpc).toContain('ReminderGroupClientDTO');
  });
});
