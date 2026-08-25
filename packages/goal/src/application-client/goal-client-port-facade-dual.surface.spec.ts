import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('GoalClientPort vNext facade surface', () => {
  const service = readFileSync(resolve(__dirname, 'goal-client-service.ts'), 'utf8');
  const goalApi = readFileSync(resolve(__dirname, 'ports/goal-api-client.port.ts'), 'utf8');

  it('uses one Goal API client port without retired folder/focus ports', () => {
    expect(goalApi).toContain('export interface IGoalApiClient');
    expect(goalApi).toContain('abandonGoal');
    expect(service).toContain('private readonly goalApi: IGoalApiClient');
    expect(service).not.toContain('IGoalFolderApiClient');
    expect(service).not.toContain('IGoalFocusApiClient');
  });

  it('keeps the domain-facing facade and DTO mappers', () => {
    expect(service).toMatch(/export interface GoalClientPort\s*\{/);
    expect(service).toContain('implements GoalClientPort');
    expect(service).toContain('function goalFromDTO');
    expect(service).toContain('function keyResultFromDTO');
    expect(service).toContain('this.goalApi.getGoalById');
    expect(service).toContain('this.goalApi.addKeyResultForGoal');
  });
});
