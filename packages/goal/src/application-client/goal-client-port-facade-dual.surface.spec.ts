import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 294: GoalClientPort is an intentional multi-API mapping facade dual.
 * Domain-facing methods + DTO→domain mappers; API method names differ
 * (getGoal/getGoalById, createKeyResult/addKeyResultForGoal). Do not collapse
 * to a single I*ApiClient type alias (unlike residual 278–288 pure duals).
 */
describe('goal client port intentional facade dual surface', () => {
  const service = readFileSync(resolve(__dirname, 'goal-client-service.ts'), 'utf8');
  const goalApi = readFileSync(resolve(__dirname, 'ports/goal-api-client.port.ts'), 'utf8');
  const folderApi = readFileSync(
    resolve(__dirname, 'ports/goal-folder-api-client.port.ts'),
    'utf8',
  );
  const focusApi = readFileSync(resolve(__dirname, 'ports/goal-focus-api-client.port.ts'), 'utf8');

  it('splits transport surface across goal/folder/focus API client ports', () => {
    expect(goalApi).toContain('export interface IGoalApiClient');
    expect(folderApi).toContain('export interface IGoalFolderApiClient');
    expect(focusApi).toContain('export interface IGoalFocusApiClient');
    expect(goalApi).toContain('getGoalById');
    expect(goalApi).toContain('addKeyResultForGoal');
    expect(goalApi).toContain('GoalClientDTO');
  });

  it('GoalClientPort remains domain facade with mappers and naming duals', () => {
    expect(service).toMatch(/export interface GoalClientPort\s*\{/);
    expect(service).not.toMatch(/export type GoalClientPort\s*=\s*IGoalApiClient/);
    expect(service).toContain('implements GoalClientPort');
    expect(service).toContain('private readonly goalApi: IGoalApiClient');
    expect(service).toContain('private readonly folderApi: IGoalFolderApiClient');
    expect(service).toMatch(/private readonly focusApi\??:\s*IGoalFocusApiClient/);
    expect(service).toContain('function goalFromDTO');
    expect(service).toContain('function keyResultFromDTO');
    expect(service).toContain('function goalFolderFromDTO');
    // application names vs API names
    expect(service).toMatch(/getGoal\(id: string\):\s*Promise<Result<Goal>>/);
    expect(service).toContain('this.goalApi.getGoalById');
    expect(service).toContain('createKeyResult');
    expect(service).toContain('this.goalApi.addKeyResultForGoal');
  });
});
