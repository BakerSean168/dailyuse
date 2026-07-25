import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 793: Scan/Search/ConfirmedLocalVaultWrite Res dual bodies retired.
 * Nested DTO + Res use sole *Schema + z.infer (local-only vault transport).
 */
describe('local vault res duals retired (residual 793)', () => {
  const source = readFileSync(resolve(__dirname, 'local-vault-binding.ts'), 'utf8');

  it('owns nested DTO schemas and ResSchema + z.infer aliases', () => {
    expect(source).toContain('Residual 793');
    expect(source).toContain(
      'export const LocalVaultBindingClientDTOSchema = z.object({',
    );
    expect(source).toContain(
      'export const LocalVaultNoteSummaryDTOSchema = z.object({',
    );
    expect(source).toContain(
      'export const LocalVaultNoteDTOSchema = LocalVaultNoteSummaryDTOSchema.extend({',
    );
    expect(source).toContain('export const ScanLocalVaultResSchema = z.object({');
    expect(source).toContain(
      'export type ScanLocalVaultRes = z.infer<typeof ScanLocalVaultResSchema>',
    );
    expect(source).toContain('export const SearchLocalVaultResSchema = z.object({');
    expect(source).toContain(
      'export type SearchLocalVaultRes = z.infer<typeof SearchLocalVaultResSchema>',
    );
    expect(source).toContain(
      'export const ConfirmedLocalVaultWriteResSchema = z.object({',
    );
    expect(source).toContain(
      'export type ConfirmedLocalVaultWriteRes = z.infer<typeof ConfirmedLocalVaultWriteResSchema>',
    );
  });

  it('drops Res/DTO interface dual bodies', () => {
    expect(source).not.toMatch(/export interface ScanLocalVaultRes\b/);
    expect(source).not.toMatch(/export interface SearchLocalVaultRes\b/);
    expect(source).not.toMatch(/export interface ConfirmedLocalVaultWriteRes\b/);
    expect(source).not.toMatch(/export interface LocalVaultBindingClientDTO\b/);
    expect(source).not.toMatch(/export interface LocalVaultNoteSummaryDTO\b/);
    expect(source).not.toMatch(/export interface LocalVaultNoteDTO\b/);
    expect(source).not.toMatch(/export interface LocalVaultSearchMatchDTO\b/);
    expect(source).not.toMatch(/export interface LocalVaultSearchResultDTO\b/);
  });

  it('nests binding/note schemas inside Res schemas', () => {
    expect(source).toContain('binding: LocalVaultBindingClientDTOSchema');
    expect(source).toContain('notes: z.array(LocalVaultNoteSummaryDTOSchema)');
    expect(source).toContain('results: z.array(LocalVaultSearchResultDTOSchema)');
    expect(source).toContain('note: LocalVaultNoteDTOSchema');
    expect(source).toContain('created: z.boolean()');
  });
});
