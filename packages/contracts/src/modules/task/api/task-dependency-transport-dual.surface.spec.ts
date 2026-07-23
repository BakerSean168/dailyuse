import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 711: task dependency transport dual bodies retired.
 * Create/Update/Validate *Body + ValidateDependencyResponse reuse *Schema only.
 * Internal use-case request types with identityId remain explicit.
 */
describe('task dependency transport dual retired (residual 711)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'task-dependency.dto.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../task/src/api/routes/task-dependency.routes.ts'),
    'utf8',
  );
  const controller = readFileSync(
    resolve(
      apiDir,
      '../../../../../task/src/server/transport/task-dependency.controller.ts',
    ),
    'utf8',
  );

  it('exports body/response schemas as sole transport shapes', () => {
    expect(dto).toContain('Residual 711');
    expect(dto).toContain('export const CreateDependencyBodySchema = z.object({');
    expect(dto).toContain('export const UpdateDependencyBodySchema = z.object({');
    expect(dto).toContain('export const ValidateDependencyBodySchema = z.object({');
    expect(responseSchemas).toContain('Residual 711');
    expect(responseSchemas).toContain('export const ValidateDependencyResponseSchema');
  });

  it('semantic transport types are z.infer aliases without interface dual bodies', () => {
    expect(dto).toContain(
      'export type CreateTaskDependencyBody = z.infer<typeof CreateDependencyBodySchema>',
    );
    expect(dto).toContain(
      'export type UpdateTaskDependencyBody = z.infer<typeof UpdateDependencyBodySchema>',
    );
    expect(dto).toContain(
      'export type ValidateDependencyBody = z.infer<typeof ValidateDependencyBodySchema>',
    );
    expect(dto).toContain(
      'export type ValidateDependencyResponse = z.infer<typeof ValidateDependencyResponseSchema>',
    );
    expect(dto).not.toMatch(/export interface CreateTaskDependencyBody\b/);
    expect(dto).not.toMatch(/export interface UpdateTaskDependencyBody\b/);
    expect(dto).not.toMatch(/export interface ValidateDependencyBody\b/);
    expect(dto).not.toMatch(/export interface ValidateDependencyResponse\b/);
  });

  it('keeps internal identity use-case request interfaces', () => {
    expect(dto).toContain('export interface CreateTaskDependencyRequest');
    expect(dto).toContain('identityId: IdentityId');
    expect(dto).toContain('export interface UpdateTaskDependencyRequest');
  });

  it('routes and controller parse dependency body schemas', () => {
    expect(routes).toContain('CreateDependencyBodySchema');
    expect(routes).toContain('UpdateDependencyBodySchema');
    expect(routes).toContain('ValidateDependencyBodySchema');
    expect(routes).toContain('ValidateDependencyResponseSchema');
    expect(controller).toContain('CreateDependencyBodySchema.safeParse');
    expect(controller).toContain('UpdateDependencyBodySchema.safeParse');
    expect(controller).toContain('ValidateDependencyBodySchema.safeParse');
  });
});
