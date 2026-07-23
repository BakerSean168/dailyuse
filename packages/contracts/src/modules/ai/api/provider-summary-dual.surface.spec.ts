import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 647: retire zero-consumer Summary dual-track surfaces.
 * Provider list uses full AIProviderConfigClientDTO; reminder/goal keep
 * canonical ClientDTO / UpcomingReminderDTO only.
 */
describe('contracts summary dual single-track surface (residual 647)', () => {
  const aiApi = __dirname;
  const modules = resolve(aiApi, '../..');

  it('retires AIProviderConfigSummary interface dual', () => {
    const client = readFileSync(
      resolve(aiApi, '../aggregates/ai-provider-config-client.ts'),
      'utf8',
    );
    const index = readFileSync(resolve(aiApi, '../aggregates/index.ts'), 'utf8');
    expect(client).not.toMatch(/export interface AIProviderConfigSummary\b/);
    expect(index).not.toContain('AIProviderConfigSummary');
    expect(client).toContain('export interface AIProviderConfigClientDTO');
  });

  it('retires AIProviderConfigSummarySchema dual; list uses ClientDTO schema', () => {
    const schemas = readFileSync(resolve(aiApi, 'response-schemas.ts'), 'utf8');
    const listDto = readFileSync(resolve(aiApi, 'ai-provider-config.dto.ts'), 'utf8');
    expect(schemas).not.toMatch(/export const AIProviderConfigSummarySchema\b/);
    expect(schemas).toContain('AIProviderConfigClientDTOSchema');
    expect(schemas).toMatch(
      /ListAIProviderConfigsResSchema[\s\S]*data:\s*z\.array\(AIProviderConfigClientDTOSchema\)/,
    );
    expect(listDto).toContain(
      'export type ListAIProviderConfigsRes = z.infer<typeof ListAIProviderConfigsResSchema>',
    );
    expect(listDto).toMatch(/no Summary dual-track/);
    expect(listDto).not.toMatch(/export interface ListAIProviderConfigsRes\b/);
  });

  it('retires reminder Summary/Dashboard duals; keeps UpcomingReminderDTO', () => {
    const reminderDtos = readFileSync(
      resolve(modules, 'reminder/dtos/index.ts'),
      'utf8',
    );
    expect(reminderDtos).not.toMatch(/export interface ReminderTemplateSummaryDTO\b/);
    expect(reminderDtos).not.toMatch(/export interface ReminderDashboardDTO\b/);
    expect(reminderDtos).toContain('export interface UpcomingReminderDTO');
  });

  it('retires GoalTimeRangeSummary dual; GoalClientDTO remains', () => {
    const goalClient = readFileSync(
      resolve(modules, 'goal/aggregates/goal-client.ts'),
      'utf8',
    );
    const goalIndex = readFileSync(
      resolve(modules, 'goal/aggregates/index.ts'),
      'utf8',
    );
    expect(goalClient).not.toMatch(/export interface GoalTimeRangeSummary\b/);
    expect(goalIndex).not.toContain('GoalTimeRangeSummary');
    expect(goalClient).toContain('export interface GoalClientDTO');
  });
});
