import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 853: exact-match VO/DTO duals retired (DomainDate≠TransferDate duals left alone).
 * GoalMetadataDTO / AccountSettingsDTO / ChecklistItemDefinitionDTO = sole interface + type alias.
 * Residual 857 (soft): FrequencyAdjustmentDTO / ResponseMetricsDTO exact duals also retired
 *   (reminder metrics VO surface; this file keeps Residual 853 lock only).
 */
describe('exact vo dto duals retired (residual 853)', () => {
  const goalVo = __dirname;
  const accountVo = resolve(goalVo, '../../account/value-objects');
  const taskVo = resolve(goalVo, '../../task/value-objects');

  const goalMeta = readFileSync(resolve(goalVo, 'goal-metadata.ts'), 'utf8');
  const accountSettings = readFileSync(resolve(accountVo, 'account-settings.ts'), 'utf8');
  const checklist = readFileSync(resolve(taskVo, 'checklist-item-definition.ts'), 'utf8');

  it('owns GoalMetadataDTO as type alias of GoalMetadata', () => {
    expect(goalMeta).toContain('Residual 853');
    expect(goalMeta).toMatch(/export interface GoalMetadata\b/);
    expect(goalMeta).toContain('export type GoalMetadataDTO = GoalMetadata');
    expect(goalMeta).not.toMatch(/export interface GoalMetadataDTO\b/);
  });

  it('owns AccountSettingsDTO as type alias of AccountSettings', () => {
    expect(accountSettings).toContain('Residual 853');
    expect(accountSettings).toMatch(/export interface AccountSettings\b/);
    expect(accountSettings).toContain('export type AccountSettingsDTO = AccountSettings');
    expect(accountSettings).not.toMatch(/export interface AccountSettingsDTO\b/);
  });

  it('owns ChecklistItemDefinitionDTO as type alias; keeps DomainDate duals as interfaces', () => {
    expect(checklist).toContain('Residual 853');
    expect(checklist).toMatch(/export interface ChecklistItemDefinition\b/);
    expect(checklist).toContain('export type ChecklistItemDefinitionDTO = ChecklistItemDefinition');
    expect(checklist).not.toMatch(/export interface ChecklistItemDefinitionDTO\b/);
    // DomainDate≠TransferDate duals must remain separate interface bodies.
    const goalTime = readFileSync(resolve(goalVo, 'goal-time-range.ts'), 'utf8');
    const completion = readFileSync(resolve(taskVo, 'completion-record.ts'), 'utf8');
    expect(goalTime).toMatch(/export interface GoalTimeRange\b/);
    expect(goalTime).toMatch(/export interface GoalTimeRangeDTO\b/);
    expect(completion).toMatch(/export interface CompletionRecord\b/);
    expect(completion).toMatch(/export interface CompletionRecordDTO\b/);
  });
});
