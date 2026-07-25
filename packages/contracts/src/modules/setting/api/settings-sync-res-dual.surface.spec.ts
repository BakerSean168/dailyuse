import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 771: ExportSettingsRes / ImportSettingsRes dual bodies retired.
 * OpenAPI + transport use *ResponseSchema; Res are z.infer aliases.
 */
describe('settings sync res duals retired (residual 771)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'sync.dto.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../setting/src/api/routes.ts'),
    'utf8',
  );

  it('dto Res types are z.infer aliases without object dual bodies', () => {
    expect(dto).toContain('Residual 771');
    expect(dto).toContain("from './response-schemas'");
    expect(dto).toContain(
      'export type ExportSettingsRes = z.infer<typeof ExportSettingsResponseSchema>',
    );
    expect(dto).toContain(
      'export type ImportSettingsRes = z.infer<typeof ImportSettingsResponseSchema>',
    );
    expect(dto).not.toMatch(/export type ExportSettingsRes = \{/);
    expect(dto).not.toMatch(/export type ImportSettingsRes = \{/);
  });

  it('response-schemas owns sole export/import response object bodies', () => {
    expect(responseSchemas).toContain('Residual 771');
    expect(responseSchemas).toContain(
      'export const ExportSettingsResponseSchema = z.object({',
    );
    expect(responseSchemas).toContain(
      'export const ImportSettingsResponseSchema = z.object({',
    );
  });

  it('OpenAPI setting routes use shared response schemas', () => {
    expect(routes).toContain('ExportSettingsResponseSchema');
    expect(routes).toContain('ImportSettingsResponseSchema');
    expect(routes).toContain(
      "successResponse(ExportSettingsResponseSchema, '导出成功')",
    );
    expect(routes).toContain(
      "successResponse(ImportSettingsResponseSchema, '导入成功')",
    );
  });
});
