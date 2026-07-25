import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 286: ReminderClientPort is a type alias of IReminderApiClient
 * (no second interface dual body; pure Result pass-through service).
 */
describe('reminder client port dual single-track surface', () => {
  const service = readFileSync(resolve(__dirname, 'reminder-client-service.ts'), 'utf8');
  const port = readFileSync(resolve(__dirname, 'ports/reminder-api-client.port.ts'), 'utf8');
  const clientPort = readFileSync(resolve(__dirname, 'reminder-client.port.ts'), 'utf8');

  it('defines IReminderApiClient once in ports', () => {
    expect(port).toContain('export interface IReminderApiClient');
    expect(port).toContain('createReminderTemplate');
    expect(port).toContain('getUpcomingReminders');
  });

  it('ReminderClientPort is type alias, not a second interface', () => {
    expect(clientPort).toMatch(/export type ReminderClientPort\s*=\s*IReminderApiClient/);
    expect(clientPort).not.toMatch(/export interface ReminderClientPort\s*\{/);
    expect(service).toContain('implements IReminderApiClient');
    expect(service).not.toMatch(/implements ReminderClientPort/);
  });
});
