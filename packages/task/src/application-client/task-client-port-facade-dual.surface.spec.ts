import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 296: TaskClientPort is an intentional multi-API mapping facade dual.
 * Domain-facing methods + DTO→domain mappers; API method names differ
 * (createTemplate/createTaskTemplate, getTemplate/getTaskTemplateById).
 * Do not collapse to a single I*ApiClient type alias.
 */
describe('task client port intentional facade dual surface', () => {
  const service = readFileSync(resolve(__dirname, 'task-client-service.ts'), 'utf8');
  const port = readFileSync(resolve(__dirname, 'task-client.port.ts'), 'utf8');
  const templateApi = readFileSync(
    resolve(__dirname, 'ports/task-template-api-client.port.ts'),
    'utf8',
  );
  const instanceApi = readFileSync(
    resolve(__dirname, 'ports/task-instance-api-client.port.ts'),
    'utf8',
  );
  const dependencyApi = readFileSync(
    resolve(__dirname, 'ports/task-dependency-api-client.port.ts'),
    'utf8',
  );

  it('splits transport surface across template/instance/dependency API ports', () => {
    expect(templateApi).toContain('export interface ITaskTemplateApiClient');
    expect(instanceApi).toContain('export interface ITaskInstanceApiClient');
    expect(dependencyApi).toContain('export interface ITaskDependencyApiClient');
    expect(templateApi).toContain('createTaskTemplate');
    expect(templateApi).toContain('getTaskTemplateById');
    expect(templateApi).toContain('TaskTemplateClientDTO');
  });

  it('TaskClientPort remains domain facade with mappers and naming duals', () => {
    expect(port).toMatch(/export interface TaskClientPort\s*\{/);
    expect(port).not.toMatch(/export type TaskClientPort\s*=\s*ITaskTemplateApiClient/);
    expect(service).toContain('implements TaskClientPort');
    expect(service).toContain('private readonly templateApi: ITaskTemplateApiClient');
    expect(service).toContain('private readonly instanceApi: ITaskInstanceApiClient');
    expect(service).toContain('private readonly dependencyApi: ITaskDependencyApiClient');
    expect(service).toContain('function taskTemplateFromDTO');
    expect(service).toContain('function taskInstanceFromDTO');
    expect(port).toContain('createTemplate');
    expect(service).toContain('this.templateApi.createTaskTemplate');
    expect(port).toContain('getTemplate');
    expect(service).toContain('this.templateApi.getTaskTemplateById');
  });
});
