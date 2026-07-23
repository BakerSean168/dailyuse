import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 735: reminder trigger/notification config dual bodies retired.
 * TriggerConfigDTO / NotificationConfigDTO (+ nested) reuse *Schema only.
 */
describe('reminder trigger/notification dual retired (residual 735)', () => {
  const apiDir = __dirname;
  const trigger = readFileSync(
    resolve(apiDir, '../value-objects/trigger-config.ts'),
    'utf8',
  );
  const notification = readFileSync(
    resolve(apiDir, '../value-objects/notification-config.ts'),
    'utf8',
  );
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

  it('exports trigger/notification schemas as sole shapes from VO modules', () => {
    expect(trigger).toContain('Residual 735');
    expect(trigger).toContain('export const TriggerConfigSchema = z.object({');
    expect(trigger).toContain('export const FixedTimeTriggerSchema = z.object({');
    expect(notification).toContain('Residual 735');
    expect(notification).toContain(
      'export const NotificationConfigSchema = z.object({',
    );
  });

  it('semantic DTOs are z.infer aliases without interface dual bodies', () => {
    expect(trigger).toContain(
      'export type TriggerConfigDTO = z.infer<typeof TriggerConfigSchema>',
    );
    expect(trigger).not.toMatch(/export interface TriggerConfigDTO\b/);
    expect(trigger).not.toMatch(/export interface FixedTimeTrigger\b/);
    expect(trigger).not.toMatch(/export interface IntervalTrigger\b/);
    expect(notification).toContain(
      'export type NotificationConfigDTO = z.infer<typeof NotificationConfigSchema>',
    );
    expect(notification).not.toMatch(/export interface NotificationConfigDTO\b/);
    expect(notification).not.toMatch(/export interface SoundConfig\b/);
    expect(notification).not.toMatch(/export interface VibrationConfig\b/);
    expect(notification).not.toMatch(/export interface NotificationActionConfig\b/);
  });

  it('response-schemas re-exports VO-owned schemas (no local dual bodies)', () => {
    expect(responseSchemas).toContain('Residual 735');
    expect(responseSchemas).toContain("from '../value-objects/trigger-config'");
    expect(responseSchemas).toContain("from '../value-objects/notification-config'");
    expect(responseSchemas).toContain(
      'export { TriggerConfigSchema, NotificationConfigSchema }',
    );
    expect(responseSchemas).not.toMatch(
      /const TriggerConfigSchema = z\.object\(\{/,
    );
    expect(responseSchemas).not.toMatch(
      /const NotificationConfigSchema = z\.object\(\{/,
    );
    expect(responseSchemas).toContain('trigger: TriggerConfigSchema');
    expect(responseSchemas).toContain(
      'notificationConfig: NotificationConfigSchema',
    );
  });
});
